<script>
  import { getName } from "@onsvisual/robo-utils";
  import BreaksChart from "../charts/BreaksChart.svelte";
  import { colors } from "../config";

  export let data;
  export let journeys;
  export let selected;
  export let hovered;
  export let highlight;
  export let pos;

  export let interactive = true;
  export let darkMode = true;
  export let showBreaks = true;

  $: ds = data.dataset;
</script>

<div class="legend-palette">
  {#if journeys && highlight && showBreaks}
  <strong>
    {#if hovered && (hovered !== selected)}
      {(journeys[`${highlight}Lookup`][hovered] || 0).toLocaleString()} people
    {:else}
      Number of people who
    {/if}
    {ds.legend.verb} {highlight === "to" ? "from" : "to"} {getName(data.metadata[selected], "the")}
    {#if hovered && (hovered !== selected)}
      {highlight} {getName(data.metadata[hovered], "the")}
    {/if}
  </strong>
  <BreaksChart data={journeys[highlight]} breaks={journeys[`${highlight}Breaks`]} colors={colors[`choro_${darkMode ? 'dark' : 'light'}`]} idKey="code" bind:hovered on:hover/>
  {/if}
  {#if ds}
  <div>
    <span class="bullet-point" style:background="{ds.color}"/>
    1 point = {ds.legend.ppd}
    {#if journeys}
      who
      <select bind:value={highlight}>
        <option value="to">{ds.highlight.o}</option>
        <option value="from">{ds.highlight.d}</option>
        <option value={null}>{ds.highlight.all}</option>
      </select>
    {/if}
    located at their
    <select bind:value={pos}>
      <option value="from">{ds.pos.o}</option>
      <option value="to">{ds.pos.d}</option>
    </select>
  </div>
  {/if}
</div>

<style>
  .legend-palette {
    position: absolute;
    z-index: 10;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 12px 24px;
    font-size: 14px;
    color: var(--text, white);
  }
  .legend-palette::before {
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
  .bullet-point {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    margin-right: 4px;
  }
  label {
    display: block;
    margin-bottom: 12px;
    font-size: 16px;
  }
  label > span {
    margin-right: 4px;
  }
  select {
    height: 32px;
    background: var(--background, #222);
    border-color: var(--muted, #aaa);
    border-radius: 2px;
    color: var(--text, white);
  }
</style>