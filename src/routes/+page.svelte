<script>
  import "@onsvisual/svelte-components/css/main.css";
  import "../app.css";
  import { onMount } from "svelte";
  import { base } from "$app/paths";
  import { bounds, analyticsProps } from "$lib/config";
  import { sleep } from "$lib/utils";
  import { formatName, capitalise } from "@onsvisual/robo-utils";
  import { Theme, AnalyticsBanner, analyticsEvent, Header, Hero, Highlight, Section, Grid, Scroller, ScrollerSection, Footer, Textarea, Button, Checkbox, PhaseBanner, Em } from "@onsvisual/svelte-components";
  // import debounce from "debounce";
  import Select from "$lib/ui/Select.svelte";
  import Observe from "$lib/wrapper/Observe.svelte";
  import FlowMap from "$lib/layout/FlowMap.svelte";
  import Icon from "$lib/ui/Icon.svelte";
  import Arrow from "$lib/ui/Arrow.svelte";
  import Spinner from "$lib/ui/Spinner.svelte";

  export let data;
  const colors = {
    work: [39, 160, 204],
    migration: [246, 96, 104],
  };

  let map, selected, hovered;
  let placeData;
  let journeys;
  let ds = "wp";
	let geo = "lad";
  let pos = "from";
	let highlight = null;
	// let filter = true;
  // let color = colors.work;
  let duration = 5000;

  let animate = true;
  let darkMode = true;
  let _darkMode = darkMode;
  let interactive = false;
  let showMap = true;
  let showInfo = false;
  let showModal = false;
  let firstLoad = false;
  let showCopied = false;
  
  function fitBufferedBounds(feature) {
    const bbox = [feature.xmin, feature.ymin, feature.xmax, feature.ymax];
    const xBuffer = 2 * (bbox[2] - bbox[0]);
    const yBuffer = 2 * (bbox[3] - bbox[1]);
    const buffered = [bbox[0] - xBuffer, bbox[1] - yBuffer, bbox[2] + xBuffer, bbox[3] + yBuffer];
    map.fitBounds(buffered, {animate});
  }

	async function doSelect(e) {
		const code = typeof e === "string" ? e : e?.detail?.id ? e?.detail?.id : e?.detail?.areacd;

    placeData = makePlaceData(code);
    
		if (code) selected = code;
	}

	function unSelect(e) {
		selected = null;
	}

  function makePlaceData(selected) {
    const placeData = {lad: {}, msoa: {}};
    const codes = {};
    if (["E02", "W02"].includes(selected.slice(0, 3))) {
      placeData.type = "msoa"
      codes.msoa_mg = codes.msoa_wp = selected;
      codes.lad = getParent(selected);
    } else {
      placeData.type = "lad";
      codes.lad = selected;
      codes.msoa_mg = getTopChild(selected, "mg");
      codes.msoa_wp = getTopChild(selected, "wp");
    }

    for (const key of ["mg", "wp"]) {
      placeData.lad[key] = {...data.metadata[codes.lad], ...data[key].areadata[codes.lad]};
      placeData.msoa[key] = {...data.metadata[codes[`msoa_${key}`]], ...data[key].areadata[codes[`msoa_${key}`]]};
    }

    analyticsEvent({
      event: "searchSelect",
      areaCode: placeData[placeData.type].mg.areacd,
      areaName: placeData[placeData.type].mg.areanm,
      areaType: placeData.type === "lad" ? "Local authority" : "MSOA",
    });

    return placeData;
  }

  function getTopChild(selected, ds = "mg", key = "destination") {
    const children = data.arealist.filter(d => d.parentcd === selected).map(d => d.areacd);
    if (children[0]) {
      const childData = children.map(childCode => data[ds].areadata[childCode]);
      return childData.sort((a, b) => b[key] - a[key])?.[0]?.areacd;
    }
    return null;
  }

  const getParent = (selected) => data.metadata?.[selected]?.parentcd;
  
  function filterData(data, ds) {
    const filtered = {...data[ds]};
    for (const key of ["arealist", "metadata", "sources", "quads"]) filtered[key] = data[key];
    return filtered;
  }

  const actions = {
    "migration-scroller": {
      "start": () => {
        map.fitBounds(bounds.ew, {animate: false});
        showInfo = false;
        duration = 1;
        pos = "from";
      },
      "zoom": () => {
        map.fitBounds(bounds.midlands, {animate});
        duration = 5000;
        pos = "from";
      },
      "destination": () => {
        unSelect();
        map.fitBounds(bounds.midlands, {animate});
        duration = 5000;
        pos = "to";
      },
      "select": () => {
        showInfo = false;
        duration = 1;
        highlight = null;
        pos = "to";
        selected = placeData?.[placeData?.type].mg?.areacd;
        if (selected) fitBufferedBounds(data.metadata[selected]);
      },
      "local-parent": () => {
        showInfo = false;
        hovered = null;
        selected = placeData?.lad?.mg?.areacd;
        duration = 1;
        pos = "from";
        highlight = null;
      },
      "local-from": () => {
        showInfo = true;
        hovered = null;
        selected = placeData?.lad?.mg?.areacd;
        duration = 1;
        pos = "from";
        highlight = "from";
      },
      "local-from-largest": () => {
        hovered = null;
        duration = 5000;
        selected = placeData?.lad?.mg?.areacd;
        hovered = placeData?.lad?.mg?.from1cd;
        pos = "to";
        highlight = "from";
      },
      "local-to": () => {
        showInfo = true;
        hovered = null;
        selected = placeData?.lad?.mg?.areacd;
        duration = 1;
        pos = "from";
        highlight = "to";
      },
      "local-to-largest": () => {
        hovered = null;
        duration = 5000;
        selected = placeData?.lad?.mg?.areacd;
        hovered = placeData?.lad?.mg?.to1cd;
        pos = "to";
        highlight = "to";
      },
      "local-from-child": () => {
        hovered = null;
        selected = placeData?.msoa?.mg?.areacd;
        duration = 1;
        pos = "from";
      },
      "local-from-child-largest": () => {
        showInfo = true;
        duration = 5000;
        selected = placeData?.msoa?.mg?.areacd;
        hovered = placeData?.msoa?.mg?.from1cd;
        pos = "to";
        highlight = "from";
      },
      "local-to-child": () => {
        showInfo = true;
        hovered = null;
        selected = placeData?.msoa?.mg?.areacd;
        duration = 1;
        pos = "from";
        highlight = "to";
      },
      "local-to-child-largest": () => {
        hovered = null;
        duration = 5000;
        selected = placeData?.msoa?.mg?.areacd;
        hovered = placeData?.msoa?.mg?.to1cd;
        pos = "to";
        highlight = "to";
      },
    },
    "work-scroller": {
      "start": () => {
        showInfo = false;
        hovered = null;
        selected = null;
        highlight = null;
        duration = 1;
        pos = "from";
        map.fitBounds(bounds.ew, {animate: false});
      },
      "london": () => {
        duration = 5000;
        pos = "from";
        map.fitBounds(bounds.london, {animate});
      },
      "work": () => {
        duration = 5000;
        pos = "to";
        map.fitBounds(bounds.london, {animate});
      },
      "select": () => {
        showInfo = false;
        duration = 1;
        highlight = null;
        pos = "to";
        selected = placeData?.[placeData?.type].wp?.areacd;
        if (selected) fitBufferedBounds(data.metadata[selected]);
      },
      "local-parent": () => {
        showInfo = false;
        hovered = null;
        selected = placeData?.lad?.wp?.areacd;
        duration = 1;
        pos = "from";
        highlight = null;
      },
      "local-from": () => {
        showInfo = true;
        hovered = null;
        selected = placeData?.lad?.wp?.areacd;
        duration = 1;
        pos = "from";
        highlight = "from";
      },
      "local-from-largest": () => {
        hovered = null;
        duration = 5000;
        selected = placeData?.lad?.wp?.areacd;
        hovered = placeData?.lad?.wp?.from1cd;
        pos = "to";
        highlight = "from";
      },
      "local-to": () => {
        showInfo = true;
        hovered = null;
        selected = placeData?.lad?.wp?.areacd;
        duration = 1;
        pos = "from";
        highlight = "to";
      },
      "local-to-largest": () => {
        hovered = null;
        duration = 5000;
        selected = placeData?.lad?.wp?.areacd;
        hovered = placeData?.lad?.wp?.to1cd;
        pos = "to";
        highlight = "to";
      },
      "local-from-child": () => {
        hovered = null;
        selected = placeData?.msoa?.wp?.areacd;
        duration = 1;
        pos = "from";
        highlight = "from";
      },
      "local-from-child-largest": () => {
        showInfo = true;
        duration = 5000;
        selected = placeData?.msoa?.wp?.areacd;
        hovered = placeData?.msoa?.wp?.from1cd;
        pos = "to";
        highlight = "from";
      },
      "local-to-child": () => {
        showInfo = true;
        hovered = null;
        selected = placeData?.msoa?.wp?.areacd;
        duration = 1;
        pos = "from";
        highlight = "to";
      },
      "local-to-child-largest": () => {
        hovered = null;
        duration = 5000;
        selected = placeData?.msoa?.wp?.areacd;
        hovered = placeData?.msoa?.wp?.to1cd;
        pos = "to";
        highlight = "to";
      },
    },
  };
  const runAction = (e) => {
    const action = actions?.[e.detail.id]?.[e.detail.sectionId];
    if (action) action();
  };

  let scrollers = {};

  const setInitialView = () => {
    hovered = null;
    ds = "wp";
    if (map) map.fitBounds(bounds.midlands, {animate: false});
    duration = 30000;
    pos = pos === "from" ? "to" : "from";
    firstLoad = false;
  }

  let _animate = animate;
  const toggleAnimation = (animate) => {
    if (_animate !== animate) {
      setInitialView();
      _animate = animate;
    }
  }
  $: toggleAnimation(animate);

  const setInteractiveView = () => {
    duration = 1;
    hovered = null;
    selected = null;
    highlight = "from";
    showInfo = false;
    map.fitBounds(bounds.ew, {animate: false});
    duration = 5000;
  }

  const changeMode = async () => {
    showMap = false;
    await sleep(200);
    darkMode = _darkMode;
    await sleep(200);
    showMap = true;
  };

  // Set animate = false if user prefers reduced motion
  onMount(() => {
    firstLoad = true;
    const reducedMotion = window.matchMedia(`(prefers-reduced-motion: reduce)`) === true || window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;
    if (reducedMotion) animate = false;
  });

  $: embedCode = `<iframe src="https://www.ons.gov.uk${base}/embed/od${ds}01ew/${darkMode ? '' : '?lightMode=true'}" scrolling="no" marginheight="0" frameborder="0" name="embed" height="550px" width="100%" allow="fullscreen"></iframe>`;
</script>

<svelte:head>
  <title>Origin-destination data explorer - Census 2021 - ONS</title>
	<meta property="og:title" content="Origin-destination data explorer - Census 2021 - ONS" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://www.ons.gov.uk{base}/" />
	<meta property="og:image" content="https://www.ons.gov.uk{base}/img/og.png" />
	<meta property="og:image:type" content="image/png" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta property="og:description" content="A tool to view animated flows of people moving between places for work or migration, based on data from Census 2021, to a neighbourhood (MSOA) level."/>
	<meta name="description" content="A tool to view animated flows of people moving between places for work or migration, based on data from Census 2021, to a neighbourhood (MSOA) level." />
</svelte:head>

<Theme theme="{darkMode ? 'dark' : 'light'}" background="{darkMode ? '#111' : 'white'}">
  {#if firstLoad}
  <Spinner/>
  {/if}
  <div class="map" style:z-index={interactive ? 1000 : null}>
    {#if interactive}
      <div style="position: fixed; top: 0; right: 8px; z-index: 2000;"><Button variant="secondary" on:click={() => {interactive = false; showInfo = false; showModal = false;}} small><Icon type="full_exit" scale={2} margin="0 10px 2px 0" />Close</Button></div>
    {/if}
    {#if showMap}
      <FlowMap bind:map bind:selected bind:journeys bind:showModal data={filterData(data, ds)} bounds={bounds.midlands} {darkMode} {hovered} {interactive} {animate} {showInfo} {geo} {pos} {highlight} {duration} on:points={() => { if (firstLoad) setInitialView() }}/>
    {/if}
  </div>
  <AnalyticsBanner {analyticsProps}/>
  <PhaseBanner phase="beta" />
  <Header theme="{darkMode ? 'dark' : 'light'}" compact />

  <Observe on:enter={() => { if (!firstLoad) setInitialView() }}>
    <Hero
      id="hero"
      theme="dark"
      background="rgba(26,77,119,0.8)"
      title="Visualising people flows"
      lede="An interactive introduction to Census 2021 origin-destination data"
      date="2023-11-21"
    >
      <noscript><p><strong>Important! This page will not function fully without Javascript enabled.</strong></p></noscript>
      <Checkbox id="animate-checkbox" label="Enable animation" variant="ghost" bind:checked={animate} compact/>
      <Checkbox id="darkmode-checkbox" label="Enable dark mode" variant="ghost" bind:checked={_darkMode} compact on:change={() => changeMode()}/>
    </Hero>
  </Observe>

  <Highlight theme="{darkMode ? 'dark' : 'lightblue'}" background="{darkMode ? '#333' : null}" marginBottom="{false}">
    <p>Origin-destination data show the movement of people from one location to another, such as migration and commuting patterns. It is sometimes known as "flow data".</p>
    <p>This is an interactive guide to some of the origin-destination data published for Census 2021.</p>
    <p>The coronavirus (COVID-19) pandemic strongly affected patterns of population movement. Census day was 21 March 2021, when lockdown restrictions were in force in the UK.</p>
  </Highlight>

  <Section background="{darkMode ? '#111' : '#fff'}" marginTop>
    <p>Skip to a section:</p>
    <ul class="inline-list">
      <li><a href="#migration"><strong><Icon type="arrow" rotation={90}/> Migration flow data</strong></a></li>
      <li><a href="#workplace"><Icon type="arrow" rotation={90}/> Workplace flow data</a></li>
      <li><a href="#explore"><Icon type="arrow" rotation={90}/> Explore the data</a></li>
    </ul>
  </Section>

  <Section background="{darkMode ? '#222' : '#fff'}" title="Migration flow data" id="migration" marginTop>
    <p>
      Some residents in England and Wales moved address in the year ahead of census day, including 5.9 million people who moved from within the UK and 545,000 people who moved from outside of the UK.
    </p>
    <p>
      These data display movement between March 2020 and March 2021 when migration was impacted by the pandemic. Migration in other years is likely to have been very different.
    </p>
    <p>
      Read our <a href="https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/methodologies/demographyandmigrationqualityinformationforcensus2021">demography and migration quality information for Census 2021</a>.
    </p>
  </Section>

  <Scroller
    id="migration-scroller"
    bind:index={scrollers["migration-scroller"]}
    on:change={runAction}
    on:enter={() => ds = "mg"}
  >
    <div slot="background" class="transparent-block"/>
    <div slot="foreground">
      <ScrollerSection id="start">
        <p>
          Each <strong>pink point</strong> <span class="bullet" style:background="rgb({colors.migration.join(",")})"/> on this map represents <strong>20 people</strong> who lived at a different address 12 months before census day, located based on their previous address.
        </p>
        <p class="text-muted">
          The points on this map broadly represent the data in each area, but they are distributed randomly, so do not identify precise addresses. They also reflect population density. <a href="#methodology">Read our methodology</a>.
        </p>
      </ScrollerSection>
      <ScrollerSection id="zoom">
        <p>
          By zooming in on the <strong>West Midlands</strong>, we can start to see the representative points more clearly.
        </p>
      </ScrollerSection>
      <ScrollerSection id="destination">
        <p>
          We can animate these points to show where people moved to as of census day, 21 March 2021.
        </p>
        <p class="text-muted">
          In the <a href="#explore">interactive tool</a>, you can animate the points by switching between <strong>"previous address"</strong> and <strong>"new address"</strong> at the bottom of the map.
        </p>
      </ScrollerSection>
      <ScrollerSection id="select">
        <p>
          It is easier to read patterns of migration by focusing on a smaller area.
        </p>
        <label for="select-mg" class="label-p">
          Find your area to explore its migration data.
        </label>
        <Select id="select-mg" options={data.arealist} on:change={doSelect}/>
        {#if placeData}
        <p style:margin-top="24px" aria-live="assertive">
          You selected <strong>{formatName(placeData[placeData.type].mg.areanm, "the")}</strong>. Scroll to continue.
          <Arrow {animate}/>
        </p>
        {/if}
      </ScrollerSection>
      {#if placeData}
      {#each [placeData.lad.mg] as place}
      {#if placeData.type === "msoa"}
      <ScrollerSection id="local-parent">
        <p>
          {capitalise(formatName(placeData[placeData.type].mg.areanm, "the"))} is a statistical neighbourhood (MSOA) within the local authority area of {formatName(placeData.lad.mg.areanm, "the")}.
        </p>
      </ScrollerSection>
      {/if}
      <ScrollerSection id="local-from">
        <p>
          This map shows where people who moved to somewhere within {formatName(place.areanm, "the")} were previously living in March 2020. This includes {place.within.toLocaleString()} people who moved within {formatName(place.areanm, "the")} and {(place.destination - place.within).toLocaleString()} who moved here from elsewhere.
        </p>
        <p>
          Of people who moved moved from outside {formatName(place.areanm, "the")}, {(place.destination - place.within - place.fromout).toLocaleString()} moved from other areas within the UK, and {place.fromout.toLocaleString()} moved from outside the UK.
        </p>
      </ScrollerSection>
      <ScrollerSection id="local-from">
        <p>
         Shading on the map highlights the areas with the most migration to {formatName(place.areanm, "the")}. The bar at the bottom of the screen shows the relative size of these movements on a scale.
        </p>
      </ScrollerSection>
      <ScrollerSection id="local-from-largest">
        <p>
          The largest movement of people to {formatName(place.areanm, "the")} was {place.from1.toLocaleString()} people from {formatName(data.metadata[place.from1cd].areanm, "the")}, followed by {formatName(data.metadata[place.from2cd].areanm, "the")} ({place.from2.toLocaleString()} people) and {formatName(data.metadata[place.from3cd].areanm, "the")} ({place.from3.toLocaleString()} people).
        </p>
      </ScrollerSection>
      <ScrollerSection id="local-to">
        <p>
          We can also see movements away from an area. These points represent the {place.origin.toLocaleString()} people who lived {formatName(place.areanm, "in")} in March 2020 and moved address before March 2021. Of these people, {place.within.toLocaleString()} moved within this area and {(place.origin - place.within).toLocaleString()} moved away.
        </p>
        <p class="text-muted">
          In the <a href="#explore">interactive tool</a>, you can switch between <strong>"moved to here"</strong> and <strong>"moved from here"</strong> at the bottom of the map.
        </p>
      </ScrollerSection>
      <ScrollerSection id="local-to-largest">
        <p>
          The largest movement of people away from {formatName(place.areanm, "the")} was {place.to1.toLocaleString()} people to {formatName(data.metadata[place.to1cd].areanm, "the")}, followed by {formatName(data.metadata[place.to2cd].areanm, "the")} ({place.to2.toLocaleString()} people) and {formatName(data.metadata[place.to3cd].areanm, "the")} ({place.to3.toLocaleString()} people).
        </p>
      </ScrollerSection>
      {/each}
      {#each [placeData.msoa.mg] as place}
      <ScrollerSection id="local-from-child">
        <p>
          {#if placeData.type === "lad"}
          Within {formatName(placeData.lad.mg.areanm, "the")}, the statistical neighbourhood (MSOA) that saw the largest influx of residents was {formatName(place.areanm, "the")}.
          {:else}
          Zooming back in to {formatName(place.areanm, "the")}, 
          {/if}
          {(place.destination - place.within).toLocaleString()} people moved here from other neighbourhoods, and {place.within.toLocaleString()} people moved within the area.
        </p>
      </ScrollerSection>
      <ScrollerSection id="local-from-child-largest">
        <p>
          The largest movement of people to {formatName(place.areanm, "the")} was {place.from1.toLocaleString()} people from {formatName(data.metadata[place.from1cd].areanm, "the")}, followed by {formatName(data.metadata[place.from2cd].areanm, "the")} ({place.from2.toLocaleString()} people) and {formatName(data.metadata[place.from3cd].areanm, "the")} ({place.from3.toLocaleString()} people).
        </p>
      </ScrollerSection>
      <ScrollerSection id="local-to-child">
        <p>
          There were also {place.origin.toLocaleString()} people who moved away from {formatName(place.areanm, "the")}. Of these people, {place.within.toLocaleString()} moved within this area and {(place.origin - place.within).toLocaleString()} moved away.
        </p>
      </ScrollerSection>
      <ScrollerSection id="local-to-child-largest">
        <p>
          The largest movement of people away from {formatName(place.areanm, "the")} was {place.to1.toLocaleString()} people to {formatName(data.metadata[place.to1cd].areanm, "the")}, followed by {formatName(data.metadata[place.to2cd].areanm, "the")} ({place.to2.toLocaleString()} people) and {formatName(data.metadata[place.to3cd].areanm, "the")} ({place.to3.toLocaleString()} people).
        </p>
      </ScrollerSection>
      {/each}
      {/if}
    </div>
  </Scroller>

  <Highlight theme="{darkMode ? 'dark' : 'lightblue'}" background="{darkMode ? '#333' : null}" marginBottom="{false}">
    <p>We can visualise workplace flow data in much the same way as internal migration data.</p>
  </Highlight>

  <Section background="{darkMode ? '#111' : '#fff'}" marginTop>
    <p>Skip to a section:</p>
    <ul class="inline-list">
      <li><a href="#migration"><Icon type="arrow" rotation={-90}/> Migration flow data</a></li>
      <li><a href="#workplace"><strong><Icon type="arrow" rotation={90}/> Workplace flow data</strong></a></li>
      <li><a href="#explore"><Icon type="arrow" rotation={90}/> Explore the data</a></li>
    </ul>
  </Section>

  <Section background="{darkMode ? '#222' : '#fff'}" title="Workplace flow data" id="workplace" marginTop="{true}">
    <p>
      There were 27.8 million usual residents aged 16 and over in England and Wales who were working in the week before the census. This map gives a representation of where they lived and where they worked.
    </p>
    <p>
      Lockdown restrictions and the furlough scheme that was in place in March 2021 had a significant impact on travel to work data. As such, <strong>the data are not reflective of current commuting patterns</strong>.
    </p>
    <p>
      Read our <a href="https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/methodologies/traveltoworkqualityinformationforcensus2021">travel to work quality information for Census 2021</a>.
    </p>
  </Section>

  <Scroller
    id="work-scroller"
    bind:index={scrollers["work-scroller"]}
    on:change={runAction}
    on:enter={() => ds = "wp"}
  >
    <div slot="background" class="transparent-block"/>
    <div slot="foreground">
      <ScrollerSection id="start">
        <p>
          Each <strong>blue point</strong> <span class="bullet" style:background="rgb({colors.work.join(",")})" /> on this map represents <strong>100 working people</strong>, located based on their place of residence in March 2021.
        </p>
        <p class="text-muted">
          The points on this map broadly represent the data in each area, but they are distributed randomly, so do not identify precise addresses. They also reflect population density. <a href="#methodology">Read our methodology</a>.
        </p>
      </ScrollerSection>
      <ScrollerSection id="london">
        <p>
          Zooming in on <strong>Greater London</strong>, we can see the representative points more clearly.
        </p>
      </ScrollerSection>
      <ScrollerSection id="work">
        <p>
          By animating these points, we can see the approximate journey to work of each of these people at the time of census, as well as those who were working from home.
        </p>
        <p class="text-muted">
          In the <a href="#explore">interactive tool</a>, you can animate the points by switching between <strong>"place of residence"</strong> and <strong>"place of work"</strong> at the bottom of the map.
        </p>
      </ScrollerSection>
      <ScrollerSection id="work">
        <p>
          People who were furloughed during census and gave a workplace address are included in this data, even though they were not commuting at the time.
        </p>
        <p class="text-muted">
          Find out more about how census data on travel to work was affected by the pandemic and other <a href="https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/employmentandemployeetypes/methodologies/traveltoworkqualityinformationforcensus2021" target="_blank">quality considerations</a>.
        </p>
      </ScrollerSection>
      <ScrollerSection id="select">
        <label for="select-wp" class="label-p">
          Find your area to explore its workplace flow data.
        </label>
        <Select id="select-wp" options={data.arealist} on:change={doSelect}/>
        {#if placeData}
        <p style:margin-top="24px">
          You selected <strong>{formatName(placeData[placeData.type].mg.areanm, "the")}</strong>. Scroll to continue.
          <Arrow {animate}/>
        </p>
        {/if}
      </ScrollerSection>
      {#if placeData}
      {#each [placeData.lad.wp] as place}
      {#if placeData.type === "msoa"}
      <ScrollerSection id="local-parent">
        <p>
          {capitalise(formatName(placeData[placeData.type].mg.areanm, "the"))} is a statistical neighbourhood (MSOA) within the local authority area of {formatName(placeData.lad.mg.areanm, "the")}.
        </p>
      </ScrollerSection>
      {/if}
      <ScrollerSection id="local-from">
        <p>
          The map now shows the place of residence of the {place.destination.toLocaleString()} people who worked {formatName(place.areanm, "in")} at the time of census, including {place.nomove.toLocaleString()} people who worked from home or had no fixed place of work, and {place.within.toLocaleString()} who travelled within the area.
        </p>
      </ScrollerSection>
      <ScrollerSection id="local-from">
        <p>
          Shading on the map highlights the areas with the most people travelling to {formatName(place.areanm, "the")}. The bar at the bottom of the screen shows the relative size of these movements on a scale.
        </p>
      </ScrollerSection>
      <ScrollerSection id="local-from-largest">
        <p>
          The largest movement into {formatName(place.areanm, "the")} was {place.from1.toLocaleString()} people from {formatName(data.metadata[place.from1cd].areanm, "the")}, followed by {formatName(data.metadata[place.from2cd].areanm, "the")} ({place.from2.toLocaleString()} people) and {formatName(data.metadata[place.from3cd].areanm, "the")} ({place.from3.toLocaleString()} people).
        </p>
      </ScrollerSection>
      <ScrollerSection id="local-to">
        <p>
          We can also see travel away from an area. The map now shows the place of residence of the {place.origin.toLocaleString()} working people who lived {formatName(place.areanm, "in")}. Again, this includes the people who worked from home, had no fixed place of work or travelled within the area.
        </p>
        <p class="text-muted">
          In the <a href="#explore">interactive tool</a>, you can switch between <strong>"work here"</strong> and <strong>"live here"</strong> at the bottom of the map.
        </p>
      </ScrollerSection>
      <ScrollerSection id="local-to-largest">
        <p>
          The largest movement of people out of {formatName(place.areanm, "the")} was {place.to1.toLocaleString()} people to {formatName(data.metadata[place.to1cd].areanm, "the")}, followed by {formatName(data.metadata[place.to2cd].areanm, "the")} ({place.to2.toLocaleString()} people) and {formatName(data.metadata[place.to3cd].areanm, "the")} ({place.to3.toLocaleString()} people).
        </p>
      </ScrollerSection>
      {/each}
      {#each [placeData.msoa.wp] as place}
      <ScrollerSection id="local-from-child">
        <p>
          {#if placeData.type === "lad"}
          Within {formatName(placeData.lad.wp.areanm, "the")}, the statistical neighbourhood (MSOA) that had the largest workday population was {formatName(place.areanm, "the")}.
          {:else}
          Zooming back in to {formatName(place.areanm, "the")}, 
          {/if}
          {(place.destination - place.within - place.nomove).toLocaleString()} people travelled here for work from other areas. In addition, {place.within.toLocaleString()} people travelled within {formatName(place.areanm, "the")}, and {place.nomove.toLocaleString()} people worked from home or had no fixed place of work.
        </p>
      </ScrollerSection>
      <ScrollerSection id="local-from-child-largest">
        <p>
          The largest movement of people to {formatName(place.areanm, "the")} was {place.from1.toLocaleString()} people from {formatName(data.metadata[place.from1cd].areanm, "the")}, followed by {formatName(data.metadata[place.from2cd].areanm, "the")} ({place.from2.toLocaleString()} people) and {formatName(data.metadata[place.from3cd].areanm, "the")} ({place.from3.toLocaleString()} people).
        </p>
      </ScrollerSection>
      <ScrollerSection id="local-to-child">
        <p>
          This view of the map shows the place of residence of the {place.origin.toLocaleString()} working people who lived {formatName(place.areanm, "in")}. Again, this includes the people who worked from home, had no fixed place of work or travelled within the area.
        </p>
      </ScrollerSection>
      <ScrollerSection id="local-to-child-largest">
        <p>
          The largest movement of people out of {formatName(place.areanm, "the")} was {place.to1.toLocaleString()} people to {formatName(data.metadata[place.to1cd].areanm, "the")}, followed by {formatName(data.metadata[place.to2cd].areanm, "the")} ({place.to2.toLocaleString()} people) and {formatName(data.metadata[place.to3cd].areanm, "the")} ({place.to3.toLocaleString()} people).
        </p>
      </ScrollerSection>
      {/each}
      {/if}
    </div>
  </Scroller>

  <Highlight theme="{darkMode ? 'dark' : 'lightblue'}" background="{darkMode ? '#333' : null}" marginBottom="{false}">
    <p>You can explore both migration and workplace flow data using the interactive tool below.</p>
  </Highlight>

  <Section background="{darkMode ? '#111' : '#fff'}"  marginTop>
    <p>Skip to a section:</p>
    <ul class="inline-list">
      <li><a href="#migration"><Icon type="arrow" rotation={-90}/> Migration flow data</a></li>
      <li><a href="#workplace"><Icon type="arrow" rotation={-90}/> Workplace flow data</a></li>
      <li><a href="#explore"><strong><Icon type="arrow" rotation={90}/> Explore the data</strong></a></li>
    </ul>
  </Section>

  <Section background="{darkMode ? '#222' : '#fff'}"  title="Explore the data" id="explore" marginTop>
    <p>
      View origin-destination data for migration or workplace flows.
    </p>
    <p>
      Select your preferred dataset and then click the <strong>explore</strong> button to activate the map controls. Click <strong>close</strong> when you are finished.
    </p>
    <p>
      <select class="ons-input ons-input--select" bind:value={ds}>
        <option value="mg">Migration flows</option>
        <option value="wp">Workplace flows</option>
      </select>
      <Button on:click={() => {interactive = true; showInfo = true; showModal = true;}}><Icon type="full" scale={2} margin="0 14px 0 0" />Explore the map</Button>
    </p>
  </Section>

  <Observe on:enter={setInteractiveView}>
    <Grid width="full" marginBottom={false}>
      <div class="transparent-block map-letterbox" style:height="60vh">
        <div class="map-letterbox-content">Click the <Em><Icon type="full" scale={1.5} margin="0 4px 4px 0" />explore</Em> button above to use the map</div>
      </div>
    </Grid>
  </Observe>

  <Section background="{darkMode ? '#222' : '#fff'}" title="Embed this tool" marginTop>
    <p>
      Embed the interactive map in your own website by copy-pasting the following code.
    </p>
    <p>
      Your embed will show the <strong>{ds === "wp" ? "workplace" : "migration"} flows</strong> dataset. You can <a href="#explore">change your selection</a> above.
    </p>
    <Textarea value="{embedCode}" rows={4} hideLabel/>
    <Button on:click={async () => {
      await navigator.clipboard.writeText(embedCode);
      showCopied = true;
      await sleep(5000);
      showCopied = false;
    }}>Copy embed code</Button>
    {#if showCopied}<span aria-live="assertive" style:display="inline-block" style:padding="18px 0 0 8px">Copied to clipboard!</span>{/if}
  </Section>

  <Section background="{darkMode ? '#222' : '#fff'}" title="Get the data" marginTop>
    <p>
      You can download the data used in this tool, along with a wider range of origin-destination datasets, from <a href="https://www.nomisweb.co.uk/sources/census_2021_od" target="_blank">Nomis</a>.
      You can read more about these datasets and how to use them in the <a href="https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/methodologies/userguidetocensus2021origindestinationdataenglandandwales">User guide to Census 2021 origin-destination data</a>. Headline insights can be found in the <a href="https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/bulletins/origindestinationdataenglandandwales/census2021">origin-destination data bulletin</a>.
    </p>
  </Section>

  <Section background="{darkMode ? '#222' : '#fff'}" id="methodology" title="Point placement methodology" marginTop>
    <p>
      The points on this map broadly represent the data in each area, but they are distributed randomly within each MSOA, a statistical area with between 5,000 and 15,000 residents.
    </p>
    <p>
      When we say each point "represents" 100 people, what we mean is that the map is displaying a sample of 1 in 100 of the MSOA-level journey counts in the dataset.
    </p>
    <p>
      The underlying data only contain counts of the number of movements from each MSOA to each other MSOA, so it is not possible for the points to identify addresses of individual people.
    </p>
    <p>
      In aggregate, the points should be representative of the level of movement between the areas shown on the map. However, some of the smaller individual flows between areas may or may not be represented.
    </p>
    <p>
      Our origin-destination data are designed to protect the confidentiality of individuals. Read more about our statistical disclosure control on Census 2021 data in our <a href="https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/methodologies/protectingpersonaldataincensus2021results">protecting personal data in Census 2021 results</a> article. 
    </p>
  </Section>

  <Footer compact />
</Theme>

<style>
  .map {
    position: fixed;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
  }
  .transparent-block {
    display: block;
    height: 100vh;
    width: 100%;
    background: none;
  }
  .map-letterbox {
    display: flex;
    justify-content: center;
    align-items: center;
    opacity: 0;
    background: rgba(64, 64, 64, 0.7);
    color: white;
  }
  .map-letterbox:hover {
    opacity: 1;
  }
  .map-letterbox-content {
    max-width: 300px;
    text-wrap: balance;
    text-align: center;
  }
  ul.inline-list {
    list-style: none;
    padding: 0;
  }
  ul.inline-list > li {
    display: inline-block;
    margin-right: 12px;
    white-space: nowrap;
  }
  .bullet {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: grey;
  }
  label.label-p {
    display: block;
    margin: 18px 0 4px;
  }
  .ons-input--select {
    background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHZpZXdCb3g9JzAgMCAxMS43NSA3LjcnPjxwYXRoIGZpbGw9J3doaXRlJyBkPSdtMS4zNy4xNSA0LjUgNS4xIDQuNS01LjFhLjM3LjM3IDAgMCAxIC42IDBsLjcuN2EuNDUuNDUgMCAwIDEgMCAuNWwtNS41IDYuMmEuMzcuMzcgMCAwIDEtLjYgMGwtNS41LTYuMWEuNjQuNjQgMCAwIDEgMC0uNmwuNy0uN2EuNjQuNjQgMCAwIDEgLjYgMFonLz48L3N2Zz4=);
    background-color: var(--background, #222);
    color: currentColor;
    border-color: currentColor;
  }
  .ons-input--select:focus {
    box-shadow: 0 0 0 1px currentColor, 0 0 0 4px #fbc900;
  }
  .text-muted {
    color: var(--muted, #bbb);
  }
  :global(.maplibregl-ctrl-top-right .maplibregl-ctrl) {
    margin-top: 60px !important;
  }
</style>