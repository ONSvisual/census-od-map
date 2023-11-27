import { csvParse, autoType } from "d3-dsv";
import { decompressData } from "compress-csv-to-json";
import { base } from "$app/paths";
import { plot } from "$lib/utils";
import { datasets } from "$lib/config";

export async function load({ parent, fetch, params }) {
  const {arealist, metadata, sources, quads} = await parent();
  const key = params.key.split("/")[0];
  const dataset = datasets.find(d => d.key === key);

  let areadata, points;

  if (dataset) {
    points = {};

    const data_lad_raw = await fetch(`${base}/data/${key}_lad_counts.csv`);
    const data_msoa_raw = await fetch(`${base}/data/${key}_msoa_counts.csv`);
    const data_array = [
        ...csvParse(await data_lad_raw.text(), autoType),
        ...csvParse(await data_msoa_raw.text(), autoType),
    ];
    const data_indexed = {};
    data_array.forEach(d => data_indexed[d.areacd] = d);
    areadata = data_indexed;

    const pointsCompressed = await fetch(`${base}/data/${key}_points.json`);
    points.array = decompressData(await pointsCompressed.json(), (columnData, rowNumber) => ({
      from: columnData[0][rowNumber],
      to: columnData[1][rowNumber],
      x1: columnData[2][rowNumber],
      y1: columnData[3][rowNumber],
      x2: columnData[4][rowNumber],
      y2: columnData[5][rowNumber],
    })).map(({from, to, x1, y1, x2, y2}) => {
      if (x1 === null) x1 = x2;
      if (x2 === null) x2 = x1;
      if (y1 === null) y1 = y2;
      if (y2 === null) y2 = y1;
      let from_lad = metadata[from]?.parentcd || from;
      let to_lad = metadata[to]?.parentcd || to;
      return {
        x1, y1, x2, y2, from_msoa: from, from_lad, to_msoa: to, to_lad
      };
    });
    
    points.from = points.array.map(d => plot([d.x1, d.y1]));
    points.to = points.array.map(d => plot([d.x2, d.y2]));
  }

  return {arealist, metadata, sources, quads, dataset, areadata, points};
}