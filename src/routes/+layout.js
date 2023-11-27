import { csvParse, autoType } from "d3-dsv";
import { base } from "$app/paths";
import { mapSources } from "$lib/config";

export const prerender = true;
export const trailingSlash = 'always';

export async function load({ fetch }) {
  const sources = mapSources;
  let metadata;
  
  const metadata_lad_raw = await (await fetch(`${base}/data/lad21_metadata.csv`)).text();
  const metadata_msoa_raw = await (await fetch(`${base}/data/msoa21_metadata.csv`)).text();
  const metadata_array = [
    ...csvParse(await metadata_lad_raw, autoType)
      .map(d => ({...d, type: "lad"}))
      .sort((a, b) => a.areanm.localeCompare(b.areanm)),
    ...csvParse(await metadata_msoa_raw, autoType)
      .map(d => ({...d, type: "msoa"}))
      .sort((a, b) => a.areanm.localeCompare(b.areanm))
  ]
    .map(d => ({...d, x: (d.xmin + d.xmax) / 2, y: (d.ymin + d.ymax) / 2}));
  const metadata_indexed = {};
  metadata_array.forEach(d => metadata_indexed[d.areacd] = d);
  metadata = metadata_indexed;

  const quads_raw = await fetch(`${base}/data/quads.csv`);
  const quads = {
    type: "GeometryCollection",
    geometries: csvParse(await quads_raw.text(), (d) => {
      return {
        type: "Point",
        coordinates: [+d.lng, +d.lat]
      };
    })
  };

  return { arealist: metadata_array.filter(d => ["E", "W"].includes(d.areacd[0])), metadata, sources, quads };
}