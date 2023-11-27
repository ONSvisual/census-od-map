<script>
    import "@onsvisual/svelte-components/css/main.css";
    import { onMount } from "svelte";
    import { Theme, Embed, Button } from "@onsvisual/svelte-components";
    import FlowMap from "$lib/layout/FlowMap.svelte";
    import Spinner from "$lib/ui/Spinner.svelte";
    import Icon from "$lib/ui/Icon.svelte";

    export let data;

    const geos = ["lad", "msoa"];
    const poss = ["from", "to"];

    let interactive = true;
    let geo = geos[0];
    let pos = poss[0];
    let highlight = "to";
    let firstLoad = true;
    let fullscreen = false;
    let darkMode = true;
    let animate = true;

    function toggleFullscreen() {
      if (!fullscreen) {
        document.body.requestFullscreen();
        fullscreen = true;
      } else {
        document.exitFullscreen();
        fullscreen = false;
      }
    }

    onMount(() => {
      animate = !(window.matchMedia(`(prefers-reduced-motion: reduce)`) === true || window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true);
      const searchParams = new URLSearchParams(document.location.search);
      if (searchParams.get("lightMode")) {
        darkMode = false;
      }
    });
  </script>

<svelte:head>
  <title>Origin-destination data explorer - Census 2021 - ONS</title>
	<meta name="description" content="A tool to view animated flows of people moving between places for work or migration, based on data from Census 2021, to a neighbourhood (MSOA) level." />
  <meta name="robots" content="noindex" />
  <meta name="googlebot" content="indexifembedded" />
</svelte:head>
  
  <Theme theme="{darkMode ? 'dark' : 'light'}">
    <Embed>
      {#if firstLoad}
      <Spinner/>
      {/if}
      <div style="position: fixed; top: 8px; right: 8px; z-index: 1;"><Button variant="secondary" on:click={toggleFullscreen} small><Icon type="{fullscreen ? 'full_exit' : 'full'}" scale={2} margin="0 10px 2px 0" />{fullscreen ? 'Close' : 'Full screen'}</Button></div>
      <FlowMap {data} {interactive} {geo} {pos} {highlight} {darkMode} on:load={() => firstLoad = false} />
    </Embed>
  </Theme>
  
  <style>
    :global(body) {
      min-height: 550px;
    }
    .toggles {
      position: absolute;
      z-index: 1000;
      top: 100px;
      right: 0;
      width: 200px;
      padding: 24px;
      background: rgba(0,0,0,0.8);
      color: white;
    }
    .toggles label {
      display: inline-block;
      margin-right: 10px;
    }
    :global(.maplibregl-ctrl-top-right .maplibregl-ctrl) {
      margin-top: 60px !important;
    }
  </style>