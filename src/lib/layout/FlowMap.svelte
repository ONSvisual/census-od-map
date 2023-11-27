<script>
  import { createEventDispatcher } from "svelte";
  import { base } from "$app/paths";
  import { bounds as bds } from "../config";
  import { getJourneys, makeOverlayGeom } from "../utils";
  import maplibre from "maplibre-gl";
  import { Button, analyticsEvent } from "@onsvisual/svelte-components";
  import { Map, MapSource, MapLayer } from "@onsvisual/svelte-maps";
  import { getName } from "@onsvisual/robo-utils";
  import InfoPalette from "./InfoPalette.svelte";
  import LegendPalette from "./LegendPalette.svelte";
  import MapPointsLayer from "../maps/MapPointsLayer.svelte";

  const dispatch = createEventDispatcher();

  export let data;
  export let map = null;
  export let selected;
  export let hovered;
  export let journeys;
  export let bounds = bds.ew;
	export let geo = "lad";
  export let pos = "from";
	export let highlight = null;
  export let duration = 5000;
  export let darkMode = true;

  export let interactive = true;
  export let animate = true;
  export let showInfo = true;
  export let showModal = true;
  export let showBreaks = true;

  const pointsLoaded = (count) => dispatch("points", {count});

  let positionBuffer, opacityVals;

  let overlayGeom = makeOverlayGeom();
  let tooltip = new maplibre.Popup({
    closeButton: false,
    closeOnClick: false
  });

  let _highlight = highlight;
  function updateHighlight(highlight = _highlight) {
    if (data?.points?.array && typeof opacityVals === "function") {
      opacityVals({data: data.points.array.map(d => 
        pos === "to" && ["888888888", "999999999"].includes(d[`to_${geo}`]) ? 0.02 :
        pos === "from" && ["999999999"].includes(d[`from_${geo}`]) ? 0.02 :
        !highlight || !selected ? 1 :
        highlight === "to" && d[`from_${geo}`] === selected ? 1 :
        highlight === "from" && (d[`to_${geo}`] === selected || (d[`from_${geo}`] === selected && d[`to_${geo}`] === "111111111")) ? 1 :
        0.02
      )});
    }
		_highlight = highlight;
	}
  $: updateHighlight(highlight);

  let _interactive = interactive;
  function toggleInteractivity(interactive) {
    const handlers = [
      "boxZoom",
      "doubleClickZoom",
      "dragPan",
      "dragRotate",
      "keyboard",
      "scrollZoom",
      "touchPitch",
      "touchZoomRotate"
    ];
    if (_interactive !== interactive) {
      for (const handler of handlers) {
        if (map && interactive) map[handler].enable();
        else if (map) map[handler].disable();
      }
      _interactive = interactive;
    }
  }
  $: toggleInteractivity(interactive);

  let _animate = animate;
  function toggleAnimation(animate) {
    if (_animate && !animate && typeof positionBuffer === "object") {
      positionBuffer.update(data.points[pos], {duration: 1});
    }
    _animate = animate;
  }
  $: toggleAnimation(animate);

  let _pos = pos;
  function updatePos(pos) {
    if (data?.points && typeof positionBuffer === "object" && _pos !== pos) {
      updateHighlight();
			positionBuffer.update(data.points[pos], !animate ? {duration: 1} : duration ? {duration} : null);
    	_pos = pos;
		}
  }
  $: updatePos(pos);

  function getBufferedBounds(feature) {
    const bbox = [feature.xmin, feature.ymin, feature.xmax, feature.ymax];
    const xBuffer = 2 * (bbox[2] - bbox[0]);
    const yBuffer = 2 * (bbox[3] - bbox[1]);
    const buffered = [bbox[0] - xBuffer, bbox[1] - yBuffer, bbox[2] + xBuffer, bbox[3] + yBuffer];
    return buffered;
  }

  function resetSelected() {
    const prev = selected;
    selected = null;
    selected = prev;
  }

  let _selected = selected;
  async function updateSelected(selected, eventType) {
    if (selected && selected !== _selected) {
      if (data.dataset) journeys = await getJourneys(data.dataset, selected, darkMode ? "dark" : "light");
      dispatch("journeys", data.dataset);
      geo = ["E02", "W02"].includes(selected.slice(0, 3)) ? "msoa" : "lad";
      overlayGeom = makeOverlayGeom();
      updateHighlight();
      const bbox = getBufferedBounds(data.metadata[selected]);
      map.fitBounds(bbox, {padding: 20, animate});
      if (eventType) analyticsEvent({
        event: eventType,
        areaCode: data.metadata[selected].areacd,
        areaName: data.metadata[selected].areanm,
        areaType: geo === "lad" ? "Local authority" : "MSOA",
      });
    } else if (!selected) {
      unSelect();
      dispatch("journeys", null);
    }
    _selected = selected;
  }
  $: updateSelected(selected);

  async function doSelect(e) {
    const code = typeof e === "string" ? e : e?.detail?.id || e?.detail?.areacd;
    const eventType = e?.detail?.id ? "mapSelect" : "searchSelect"; 

    if (code && !["N", "S"].includes(code[0])) {
      updateSelected(code, eventType);
      selected = code;
    } else if (code) {
      resetSelected();
    }
  }

  async function unSelect() {
    selected = null;
    journeys = null;
    updateHighlight();
    setGeoType();
  }

  function typeMatches(selected, hovered) {
    if (!selected || !hovered) return false;
    const types = [selected.slice(1, 3), hovered.slice(1, 3)];
    return types.every(t => t === "02") || types.every(t => t !== "02");
  }

  function doHover(e) {
    const hovered = typeof e === "string" ? e : e?.detail?.id || e?.detail?.areacd;
    overlayGeom = selected && typeMatches(selected, hovered) ?
      makeOverlayGeom(data.metadata?.[selected], data.metadata?.[hovered]) :
      makeOverlayGeom();
    if (overlayGeom.midpoint && journeys?.toLookup?.[hovered]) {
      const sel = getName(data.metadata[selected]);
      const hov = getName(data.metadata[hovered]);
      let content;
      if (data.dataset && hov === sel) {
        const d = data.areadata[selected];
        content = `<b>Within ${sel}</b><br/>${d.within.toLocaleString()} ${data.dataset.hover.within}`;
        if (data.dataset.hover.nomove) content += `<br/>${d.nomove.toLocaleString()} ${data.dataset.hover.nomove}`;
      } else if (data.dataset) {
        content = !highlight || highlight === "to" ? `<p><b>${sel} &rarr; ${hov}</b><br/>${(journeys.toLookup[hovered] || 0).toLocaleString()} people</p>` : "";
        content += !highlight || highlight === "from" ? `<p><b>${hov} &rarr; ${sel}</b><br/>${(journeys.fromLookup[hovered] || 0).toLocaleString()} people</p>` : "";
      }
      tooltip.setLngLat(overlayGeom.midpoint).setHTML(content).addTo(map);
    } else {
      tooltip.remove();
    }
  }

  let _hovered = hovered;
  function updateHovered(hovered) {
    if (hovered !== _hovered) {
      doHover(hovered);
      _hovered = hovered;
    }
  }
  $: updateHovered(hovered);

  function setGeoType() {
    try {
      const features = typeof map?.getLayer === "function" && map.getLayer("quads") ? map.queryRenderedFeatures({ layers: ["quads"] }) : null;
      if (Array.isArray(features)) {
        const count = features.length;
        const canvas = map.getCanvas();
        const pixelArea = canvas.clientWidth * canvas.clientHeight;
        geo = (count * 1e6) / pixelArea > 20 ? "lad" : "msoa";
      }
    }
    catch {
      geo = "lad";
    }
  }

  function mapLoad(e) {
    map.on("moveend", () => {if (!selected) setGeoType()});
    dispatch("load", e);
  }
</script>

<div class="map" class:hide-controls={!interactive}>
  <slot/>
  {#if showModal && data.dataset}
  <div class="mask">
    <div class="modal">
      <h2>{data.dataset.label}</h2>
      <p>{data.dataset.description}</p>
      <p class="text-muted" >{data.dataset.caveat} <a href="{data.dataset.caveat_url}" target="_blank">Read more</a></p>
      <Button on:click={() => showModal = false} icon="arrow" iconPosition="after">Continue</Button>
    </div>
  </div>
  {/if}
  {#if showInfo}
  <InfoPalette {data} {selected} {hovered} {highlight} {interactive} bind:showModal on:change={doSelect} on:clear={unSelect}/>
  {/if}
  <LegendPalette {showBreaks} {darkMode} {data} {journeys} {selected} {interactive} bind:highlight bind:pos bind:hovered on:hover={doHover}/>
  <Map bind:map
    style="{base}/data/style-{darkMode ? 'dark' : 'light'}.json"
    location={{bounds}}
    options={{antialias: true}}
    {interactive}
    controls
    on:load={mapLoad}>
    <MapSource
      id="quads"
      type="geojson"
      data={data.quads}>
      <MapLayer
        id="quads"
        type="circle"
        paint={{"circle-radius": 1, "circle-color": "rgba(0,0,0,0)"}}/>
    </MapSource>
    {#each data.sources as s}
    <MapSource
      id="{s.key}"
      type="{s.type}"
      promoteId="areacd"
      {...s.props}>
      <MapLayer
        id="{s.key}-fill"
        type="fill"
        data={journeys?.[highlight] || []}
        idKey="code"
        paint={{
          "fill-color": ['case',
            ['!=', ['feature-state', 'color'], null], ['feature-state', 'color'],
            'rgba(0, 0, 0, 0)'
          ],
          "fill-opacity": 0.7
        }}
        filter={s.filter || null}
        order="place_other"
        hover bind:hovered
        on:hover={doHover}
        select {selected} on:select={doSelect}
        clickIgnore={!data.dataset}
        visible={geo === s.key}
        />
      <MapLayer
        id="{s.key}-line"
        type="line"
        paint={geo === s.key ? {"line-color": darkMode ? '#555' : '#aaa', "line-width": 0.5} : {"line-color": darkMode ? '#777' : '#888', "line-width": 0.75}}
        filter={s.filter || null}
        order="place_other"
        visible={s.key === "lad" || geo === s.key}/>
      <MapLayer
        id="{s.key}-selected"
        type="line"
        paint={{
          "line-color": ['case',
            ['==', ['feature-state', 'selected'], true], darkMode ? 'white' : 'black',
            ['==', ['feature-state', 'hovered'], true], darkMode ? 'white' : 'black',
            'rgba(0,0,0,0)'
          ],
          "line-width": ['case',
            ['==', ['feature-state', 'selected'], true], 2.5,
            1
          ]
        }}
        filter={s.filter || null}
        order="place_village"
        visible={geo === s.key}/>
    </MapSource>
    {/each}
    {#if data.dataset}
    <MapPointsLayer {data} {pos} {pointsLoaded} bind:positionBuffer bind:opacityVals />
    {/if}
    <MapSource
      id="overlay-lines"
      type="geojson"
      data={overlayGeom.lines}>
      <MapLayer
        id="overlay-lines"
        type="line"
        paint={{
          "line-color": darkMode ? 'white' : 'black',
          "line-width": 1
        }}/>
    </MapSource>
    <MapSource
      id="overlay-points"
      type="geojson"
      data={overlayGeom.points}>
      <MapLayer
        id="overlay-points"
        type="symbol"
        layout={{
          "icon-image": ['case',
            ['==', ['get', 'highlight'], highlight], "triangle-11",
            "circle-11"
          ],
          "icon-size": ['case',
            ['==', ['get', 'highlight'], highlight], 1.1,
            0.7
          ],
          "icon-rotate": ['case',
            ['!=', ['get', 'rotation'], null], ['get', 'rotation'],
            0
          ],
          "icon-allow-overlap": true
          }}
        paint={{
          "icon-opacity": 1
        }}/>
    </MapSource>
  </Map>
</div>

<style>
  .map {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
  }
  .map :global(.maplibregl-popup-content) {
    background: var(--background, #222);
    padding: 4px 8px;
    pointer-events: none;
  }
  .map :global(.maplibregl-popup-content > p) {
    margin: 0;
  }
  .map :global(.maplibregl-popup-content > p + p) {
    margin-top: 8px;
  }
  .map :global(.maplibregl-popup-tip) {
    border-top-color: var(--background, #222);
  }
  .map.hide-controls :global(.maplibregl-ctrl) {
    display: none;
  }
  .mask {
    position: fixed;
    z-index: 100;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .mask::before {
    content: " ";
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    background: var(--background, #222);
    opacity: 0.7;
  }
  .modal {
    position: relative;
    width: 400px;
    max-width: calc(100vw - 24px);
    margin: auto;
    padding: 24px;
    background: var(--background, #222);
    box-shadow: 3px 3px 4px rgba(0, 0, 0, 0.2);
  }
  .modal h2 {
    margin-bottom: 12px;
  }
  .modal p {
    font-size: 16px;
    line-height: 1.4;
  }
  .text-muted {
    color: var(--muted, #bbb);
  }
</style>