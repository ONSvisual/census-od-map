<script>
    import { createEventDispatcher } from "svelte";
    import { Select } from "@onsvisual/svelte-components";
    import Pbf from "pbf";
    import vt from "@mapbox/vector-tile";
    import tb from "@mapbox/tilebelt";
    import inPolygon from "@turf/boolean-point-in-polygon";

    const dispatch = createEventDispatcher();

    export let options;
    export let id = "select";
    export let mode = "search";
    export let idKey = "areacd";
    export let labelKey = "areanm";
    export let placeholder = "Type a place name or postcode...";
    export let autoClear = true;

    const startsWithFilter = (str, filter) =>
        str.match(new RegExp(`^${filter}`, "i"));

    const filterSort = (filterText) => (a, b) =>
        startsWithFilter(a[labelKey], filterText) &&
        startsWithFilter(b[labelKey], filterText)
            ? 0
            : !startsWithFilter(a[labelKey], filterText) &&
              startsWithFilter(b[labelKey], filterText)
            ? 1
            : startsWithFilter(a[labelKey], filterText) &&
              !startsWithFilter(b[labelKey], filterText)
            ? -1
            : 0;

    async function loadOptions(filterText) {
        if (filterText && filterText.length > 2 && /\d/.test(filterText)) {
            let res = await fetch(
                `https://api.postcodes.io/postcodes/${filterText}/autocomplete`
            );
            let json = await res.json();
            return json.result
                ? json.result.map((d) => {
                      const obj = { postcode: true };
                      obj[idKey] = d;
                      obj[labelKey] = d;
                      return obj;
                  })
                : [];
        } else if (filterText && filterText.length > 2) {
            return options
                .filter((p) =>
                    p[labelKey].match(new RegExp(`\\b${filterText}`, "i"))
                )
                .sort(filterSort(filterText));
        }
        return [];
    }

    async function doSelect(e) {
        if (e.detail.postcode) {
            const res = await fetch(
                `https://api.postcodes.io/postcodes/${e.detail.areacd}`
            );
            const json = await res.json();
            if (json.result) {
                const code = await getCodefromLngLat(
                    json.result.longitude,
                    json.result.latitude
                );
                if (code) {
                    const obj = {};
                    obj[idKey] = code;
                    dispatch("change", obj);
                }
            }
        } else {
            const obj = {};
            obj[idKey] = e.detail[idKey];
            dispatch("change", obj);
        }
    }

    export async function getCodefromLngLat(lng, lat) {
        const tile = tb.pointToTile(lng, lat, 12);
        const url = `https://cdn.ons.gov.uk/maptiles/administrative/2021/msoa/v2/boundaries/${tile[2]}/${tile[0]}/${tile[1]}.pbf`;
        try {
            const geojson = await getTileAsGeoJSON(url, tile);
            const pt = { type: "Point", coordinates: [lng, lat] };
            for (const f of geojson.features) {
                if (inPolygon(pt, f.geometry)) return f.properties[idKey];
            }
            return null;
        } catch {
            return null;
        }
    }

    async function getTileAsGeoJSON(url, tile) {
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        const pbf = new Pbf(buf);
        const geojson = { type: "FeatureCollection", features: [] };
        const t = new vt.VectorTile(pbf);
        for (const key in t.layers) {
            for (let i = 0; i < t.layers[key].length; i++) {
                geojson.features.push(
                    t.layers[key].feature(i).toGeoJSON(...tile)
                );
            }
        }
        return geojson;
    }
</script>

<Select
    {id}
    {mode}
    {loadOptions}
    {idKey}
    {labelKey}
    {placeholder}
    {autoClear}
    on:change={doSelect}
/>
