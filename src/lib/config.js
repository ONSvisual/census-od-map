// ANALYTICS CONFIG
export const analyticsId = "GTM-MBCBVQS";

export const analyticsProps = {
	"contentTitle": "Origin-destination data explorer", // Insert the title of the product here
	"releaseDate": "20231121",
	"contentType": "exploratory", // Optional: eg. scrollytelling, exploratory, edutainment?
	"outputSeries": "origindestinationdataexplorercensus2021" // Should match the slug for the release on CMS
};

// CORE CONFIG
export const themes = {
  'light': {
    'text': '#222',
    'muted': '#777',
    'pale': '#f0f0f0',
    'background': '#fff'
  },
  'dark': {
    'text': '#fff',
    'muted': '#bbb',
    'pale': '#333',
    'background': '#222'
  },
  'lightblue': {
    'text': '#206095',
    'muted': '#707070',
    'pale': '#f0f0f0',
    'background': 'rgb(188, 207, 222)'
  }
}

// PROJECT-SPECIFIC CONFIG
export const bounds = {
  initial: [-3, 51.5, 0, 53],
  ew: [-6.3603, 49.8823, 1.7637, 55.8112],
  midlands: [-2.20688, 52.34774, -1.42394, 52.66273],
  london: [-0.51028, 51.28676, 0.33402, 51.69188],
  world: [-180, -55, 180, 75],
};

export const mapSources = [
  {
    key: "msoa",
    type: "vector",
    props: {
      url: "https://cdn.ons.gov.uk/maptiles/administrative/2021/msoa/v2/boundaries/{z}/{x}/{y}.pbf",
      layer: "msoa",
      maxzoom: 12,
      minzoom: 6
    }
  },
  {
    key: "lad",
    type: "vector",
    props: {
      url: "https://cdn.ons.gov.uk/maptiles/administrative/2022/ltla/v1/boundaries/{z}/{x}/{y}.pbf",
      layer: "boundaries",
      maxzoom: 12,
      minzoom: 3
    }
  }
];

export const colors = {
  mg: [246, 96, 104],
  wp: [39, 160, 204],
  choro_dark: [
    "rgba(255,255,255,0.0)",
    "rgba(255,255,255,0.1)",
    "rgba(255,255,255,0.2)",
    "rgba(255,255,255,0.3)"
  ],
  choro_light: [
    "rgba(0,0,0,0.0)",
    "rgba(0,0,0,0.1)",
    "rgba(0,0,0,0.2)",
    "rgba(0,0,0,0.3)"
  ],
};

export const datasets = [
  {
    key: "odmg01ew",
    label: "Migration flows",
    color: `rgb(${colors.mg.join(",")})`,
    rgb: colors.mg,
    description: "Migration flow data shows the movement of residents who had a different address one year before Census Day.",
    caveat: "The Covid-19 pandemic has impacted nature and quality of this data.",
    caveat_url: "https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/methodologies/demographyandmigrationqualityinformationforcensus2021",
    legend: {
      verb: "moved",
      ppd: "20 people"
    },
    highlight: {
      o: "moved from here",
      d: "moved to here",
      all: "moved anywhere"
    },
    pos: {
      o: "previous address",
      d: "new address"
    },
    alluvial: {
      o_here: "Moved from here",
      d_here: "Moved to here",
      all_here: "Moved within this area",
      o_other: "Moved from another area",
      d_other: "Moved to another area",
      l2: "moved within this area",
      l3: "moved to another area in the UK",
      l5: "moved from another area in the UK",
      l6: "moved from outside the UK",
    },
    hover: {
      within: "people moved within this area",
    }
  },
  {
    key: "odwp01ew",
    label: "Workplace flows",
    color: `rgb(${colors.wp.join(",")})`,
    rgb: colors.wp,
    description: "Workplace flow data represent usual residents aged 16 and over who were working in the week before Census Day.",
    caveat: "The Covid-19 pandemic has impacted nature and quality of this data.",
    caveat_url: "https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/methodologies/traveltoworkqualityinformationforcensus2021",
    legend: {
      verb: "travel",
      ppd: "100 people aged 16 and over in employment"
    },
    highlight: {
      o: "lived here",
      d: "worked here",
      all: "lived/worked anywhere"
    },
    pos: {
      o: "place of residence",
      d: "place of work"
    },
    alluvial: {
      o_here: "Lived here",
      d_here: "Worked here",
      all_here: "Lived and worked here",
      o_other: "Travelled from another area",
      d_other: "Travelled to another area",
      l1: "worked from home or had no fixed place of work",
      l2: "travelled within this area",
      l3: "travelled to another area in the UK",
      l4: "travelled offshore or outside the UK",
      l5: "travelled from another area in the UK"
    },
    hover: {
      within: "people travelled within this area",
      nomove: "people worked from home",
    }
  }
];