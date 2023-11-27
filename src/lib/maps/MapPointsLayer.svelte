<script>
    import { getContext, onDestroy } from "svelte";
    import reglLib from "regl";
    import reglTween from "$lib/vendor/regl-tween";
    import { scaleLinear } from "../utils";

    export let data;
    export let pos = "from";
    export let positionBuffer = null;
    export let opacityVals = null;
    export let order = "place_suburb";
    export let pointsLoaded = (count) => console.log("points", {count});

    const { getMap } = getContext("map");
    const map = getMap();
    const scale = scaleLinear([5, 14], [0.5, 4]);

    function init() {
        const points = data.points;
        const count = points.array.length;

        let scene, regl, tween, zoom;

        // Define function to create REGL WebGL dots layer
        const createScene = (gl) => {
            regl = reglLib(gl);
            tween = reglTween(regl);

            positionBuffer = tween.buffer(points[pos], {
                duration: 5000,
                ease: "linear",
            });
            opacityVals = regl.buffer(Array.from({ length: count }, () => 1));

            const render = tween({
                vert: `
precision lowp float;
uniform mat4 uMatrix;
uniform float pointSize;
uniform vec3 pointColor;
attribute vec2 position;
attribute float opacity;
varying vec4 fragColor;

void main() {
    gl_PointSize = pointSize;
    gl_Position = uMatrix * vec4(position, 0, 1);
    fragColor = vec4(pointColor, opacity);
}`,
                frag: `
precision lowp float;
varying vec4 fragColor;

void main() {
    if (length(gl_PointCoord.xy - 0.5) > 0.5) {
        discard;
    }
    gl_FragColor = fragColor;
}`,
                attributes: {
                    position: positionBuffer,
                    opacity: opacityVals,
                },

                uniforms: {
                    pointSize: regl.prop("pointSize") || 2,
                    pointColor: regl.prop("pointColor"),
                    uMatrix: regl.prop("uMatrix"),
                },

                blend: {
                    enable: true,
                    func: {
                        srcRGB: "src alpha",
                        srcAlpha: "src alpha",
                        dstRGB: "one minus src alpha",
                        dstAlpha: "one minus src alpha",
                    },
                },

                depth: { enable: false },

                count: count,
                primitive: "points",
            });

            return { render };
        };

        // Limit Maplibre pixel ratio to 1.5 to improve performance on retina devices
        let pixelRatio =
            window.devicePixelRatio > 1.5 ? 1.5 : window.devicePixelRatio;
        map.setPixelRatio(pixelRatio);

        // Add REGL custom dots layer to Maplibre map
        if (map.getLayer("points")) map.removeLayer("points");

        map.addLayer(
            {
                id: "points",
                type: "custom",
                onAdd: (map, gl) => {
                    scene = createScene(gl);
                    regl.frame(() => {
                        if (map && zoom) map.triggerRepaint();
                    });
                    map.once("idle", () => pointsLoaded(count));
                },
                render: function (gl, matrix) {
                    const uMatrix = matrix;
                    zoom = map.getZoom();
                    scene.render({
                        uMatrix,
                        pointSize: scale(zoom) * pixelRatio,
                        pointColor: data.dataset.rgb.map((c) => c / 255),
                    });
                },
            },
            order
        );
    }

    onDestroy(() => { if (map.getLayer("points")) map.removeLayer("points") });

    $: data.points && init();
</script>
