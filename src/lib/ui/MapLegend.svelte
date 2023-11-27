<script>
  export let metadata;
  export let data;
  export let selected;
  export let hovered;
  export let highlight;

  let hoveredItem;

  $: max = data ? Math.max(...data[highlight].map(d => d.value)) : 1;
</script>

{#if selected && data && max}
<div class="map-legend">
  <div class="map-legend-info">
    Areas with the most people working in {metadata[selected].areanm}
    {#if hoveredItem}
    <br/>{hoveredItem.rank}. <strong>{metadata[hoveredItem.code].areanm}</strong>, {hoveredItem.value.toLocaleString()} people
    {/if}
  </div>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    on:mouseleave={() => {
      hoveredItem = null;
      hovered = null;
    }}>
    {#each data[highlight] as d, i}
    <g
      transform="translate({100 - (((i + 1) / data[highlight].length) * 100)} 0)"
      on:mouseenter={() => {
        hoveredItem = {...d, rank: i + 1};
        hovered = d.code;
      }}>
      <rect
        class="rect-transparent"
        x={0} y={0}
        width={(1 / data[highlight].length) * 100} height={100}/>
      <rect
        class="rect-solid"
        x={0} y={100 - (d.value * (100 / max))}
        width={(1 / data[highlight].length) * 100} height={d.value * (100 / max)}
        opacity={i < 6 ? 0.9 : 0.7}/>
    </g>
    {/each}
  </svg>
</div>
{/if}

<style>
  .map-legend {
    box-sizing: border-box;
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100px;
    padding: 12px;
    background-color: rgba(0,0,0,0.5);
    z-index: 1;
    pointer-events: all;
  }
  .map-legend svg {
		width: 100%;
		height: 100%;
		shape-rendering: crispEdges;
	}
  .map-legend svg * {
    vector-effect: non-scaling-stroke;
  }
  .map-legend svg rect.rect-transparent {
    fill: rgba(0,0,0,0);
  }
  .map-legend svg rect.rect-solid {
    fill: white;
  }
  .map-legend svg g:hover rect.rect-solid {
    opacity: 1;
    stroke: white;
  }
  .map-legend-info {
    position: absolute;
    left: 12px;
    top: 8px;
    font-size: 0.9em;
    pointer-events: none;
  }
</style>