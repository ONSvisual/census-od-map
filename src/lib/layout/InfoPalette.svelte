<script>
  import { createEventDispatcher } from "svelte";
  import { base } from "$app/paths";
  import Select from "$lib/ui/Select.svelte";
  import { getName } from "@onsvisual/robo-utils";
  import AlluvialChart from "../charts/AlluvialChart.svelte";
  import Icon from "$lib/ui/Icon.svelte";
  import tooltip from "$lib/ui/tooltip";

  const dispatch = createEventDispatcher();

  function makeAlluvialData(d, dataset) {
    let data = [];
    if (dataset.alluvial.l1) data.push({from: "a", to: "a", value: d.nomove || 0, label: dataset.alluvial.l1});
    data.push({from: "a", to: "a", value: d.within || 0, label: dataset.alluvial.l2});
    data.push({from: "a", to: "b", value: d.origin - d.nomove -d.within - d.toout || 0, label: dataset.alluvial.l3});
    if (dataset.alluvial.l4) data.push({from: "a", to: "b", value: d.toout || 0, label: dataset.alluvial.l4});
    data.push({from: "b", to: "a", value: d.destination - d.nomove - d.within - d.fromout || 0, label: dataset.alluvial.l5});
    if (dataset.alluvial.l6) data.push({from: "b", to: "a", value: d.fromout || 0, label: dataset.alluvial.l6});
    return data;
  }

  export let data;
  export let selected;
  export let hovered;
  export let highlight;
  export let interactive = true;
  export let showModal = false;

  let open = true;

  $: area = !selected && hovered ? {...data.metadata[hovered], d: data?.areadata?.[hovered], state: "hovered"} :
    selected ? {...data.metadata[selected], d: data?.areadata?.[selected], state: "selected"} :
    null;
  $: ds = data.dataset;
</script>

<div class="info-palette">
  {#if interactive && data.dataset}
  <Select
    id="select"
    options={data.arealist}
    placeholder="Type a name/postcode"
    on:change/>
  {/if}
  {#if area && data.dataset}
    <h2>
      {getName(area)}
    </h2>
    {#if interactive && area.state === "selected"}<button on:click={() => dispatch("clear")} class="btn-link">Deselect</button>{/if}
    <div class="info-grid">
    {#if ["N", "S"].includes(area.areacd[0])}
      <div style:grid-column="span 2" style:margin-top="12px">Data not available for Scotland and Northern Ireland.</div>
    {:else}
      {#if open}
        {#if !highlight || area.state === "hovered" || highlight === "to"}
        <div style:margin-top="12px">{ds.alluvial.o_here} <strong class="text-big">{area.d.origin.toLocaleString()}</strong></div>
        {:else}
        <div style:margin-top="12px" class="text-muted">{ds.alluvial.all_here} <strong>{(area.d.nomove + area.d.within).toLocaleString()}</strong></div>
        {/if}
        {#if !highlight || area.state === "hovered" || highlight === "from"}
        <div style:margin-top="12px" class="text-muted text-right">{ds.alluvial.o_other} <strong>{(area.d.destination - area.d.nomove - area.d.within).toLocaleString()}</strong></div>
        {/if}
        <div style:grid-column="span 2" style:line-height={0}>
          <AlluvialChart
            data={makeAlluvialData(area.d, data.dataset)}
            color={data.dataset.color}
            highlight="{!selected ? "a" : highlight === "from" ? ["to", "a"] : highlight === "to" ? ["from", "a"] : "a"}"/>
        </div>
        {#if !highlight || area.state === "hovered" || highlight === "from"}
        <div>
          {ds.alluvial.d_here} <strong class="text-big">{area.d.destination.toLocaleString()}</strong>
        </div>
        {:else}
        <div class="text-muted">{ds.alluvial.all_here} <strong>{(area.d.nomove + area.d.within).toLocaleString()}</strong></div>
        {/if}
        {#if !highlight || area.state === "hovered" || highlight === "to"}
        <div class="text-muted text-right">{ds.alluvial.d_other} <strong>{(area.d.origin - area.d.nomove - area.d.within).toLocaleString()}</strong></div>
        {/if}
      {/if}
      {#if interactive}
      <div style:grid-column="span 2" class="toggles">
        <button class="btn-toggle" on:click={() => showModal = true} title="Dataset information" use:tooltip={{pos: "bottom"}}><Icon type="info"/></button>
        <button class="btn-toggle" on:click={() => open = !open} title="{open ? "Hide details" : "Show details"}" use:tooltip={{pos: "bottom"}}><Icon type="arrow" rotation={open ? -90 : 90}/></button>
      </div>
      {/if}
    {/if}
    </div>
  {:else if data.dataset}
  <h2>{data.dataset.label}</h2>
  <div class="info-grid" style:margin-top="12px">
    {#if open}
    <div style:grid-column="span 2">
      <p>Select an area from the map or search box to explore the data.</p>
      <p style:margin-bottom={0}>Click the info button below at any time for information about the data.</p>
    </div>
    {/if}
    {#if interactive}
    <div style:grid-column="span 2" class="toggles">
      <button class="btn-toggle" on:click={() => showModal = true} title="Dataset information" use:tooltip={{pos: "bottom"}}><Icon type="info"/></button>
      <button class="btn-toggle" on:click={() => open = !open} title="{open ? "Hide details" : "Show details"}" use:tooltip={{pos: "bottom"}}><Icon type="arrow" rotation={open ? -90 : 90}/></button>
    </div>
    {/if}
  </div>
  {:else}
  <h2>Census flows map</h2>
  <div class="info-grid">
    <div style:grid-column="span 2" style:margin-top="12px">
      <p>Origin-destination data shows the movement of people from one location to another, allowing us to explore things like migration and commuting patterns.</p>
      <p>Select a Census 2021 dataset to explore it on the map:</p>
      <ul>
        <li><a href="{base}/embed/odmg01ew/">Internal migration</a></li>
        <li><a href="{base}/embed/odwp01ew/">Workplace flows</a></li>
      </ul>
    </div>
  </div>
  {/if}
</div>

<style>
  .info-palette {
    position: absolute;
    z-index: 10;
    top: 0;
    left: 0;
    width: 300px;
    padding: 24px 24px 12px;
    color: var(--text, white);
  }
  .info-palette::before {
    position: absolute;
    content: " ";
    z-index: -1;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--background, #222);
    opacity: 0.8;
    box-shadow: 3px 3px 4px rgba(0, 0, 0, 0.2);
  }
  .info-palette h2 {
    display: inline-block;
    margin: 6px 0 0;
    line-height: 1.2;
  }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-gap: 4px;
    width: 100%;
    font-size: 16px;
    line-height: 1.2;
  }
  .info-grid > div {
    padding: 0;
    margin: 0;
  }
  .text-right {
    text-align: right;
  }
  .text-big {
    display: block;
    font-size: 28px;
  }
  .text-muted {
    color: var(--muted, #bbb);
  }
	.btn-link {
    display: inline-block;
		margin: 0;
		padding: 0;
		background: none;
		border: none;
		color: var(--text, white);
    text-decoration: underline;
    text-underline-position: under;
		font-size: 14px;
	}
  .btn-link:hover {
    text-decoration-thickness: 2px;
  }
  label {
    display: block;
    font-size: 16px;
  }
  label > span {
    margin-right: 4px;
  }
  label > select {
    width: 100%;
  }
  select {
    height: 32px;
    background: var(--background, #222);
		color: var(--text, white);
    border-color: var(--muted, #aaa);
    border-radius: 2px;
    padding-left: 4px;
  }
  .toggles {
    text-align: right;
  }
  .btn-toggle {
    margin-left: 2px;
    padding: 0;
    display: inline-block;
    width: 32px;
    font-size: 28px;
    background: none;
    border: none;
    color: var(--text, white);
  }
</style>