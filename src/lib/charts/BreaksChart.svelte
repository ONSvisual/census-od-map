<script>
	import { createEventDispatcher } from "svelte";
	const dispatch = createEventDispatcher();

	export let data;
	export let valueKey = "value";
	export let idKey = "id";
	export let hovered = null;
	export let lineWidth = 3;
	export let height = 15;
	export let breaks = [0,10,25,50,75,100];
	export let colors = ['rgba(255,255,255,0.0)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.3)', 'rgba(255,255,255,0.4)'];
	export let formatTick = d => Math.round(d).toLocaleString();
	export let suffix = "";
	export let snapTicks = true;

	const dataSortFilter = (data, key) => {
		const sorted = [...data].sort((a, b) => a[key] - b[key]);
		const vals = sorted.map(d => d[key]);
		const filtered = [];
		for (let i = 0; i < sorted.length - 1; i ++) {
			if (vals.indexOf(sorted[i][key]) === i) filtered.push(sorted[i]);
		}
		return filtered;
	};

	$: _data = dataSortFilter(data, valueKey);

	const avg = (val1, val2) => (val1 + val2) / 2;
	const scale = (val) => 100 * ((val - breaks[0]) / (breaks[breaks.length - 1] - breaks[0]));
	const doHover = (code) => {
		hovered = code;
		dispatch("hover", {id: code});
	};
</script>

<div class="container" style="height: {height}px">
	<svg viewBox="0 0 100 100" preserveAspectRatio="none" on:mouseleave={() => doHover(null)} role="none">
		<g class="chart-breaks">
			{#each breaks.slice(0, breaks.length - 1) as brk, i}
				<rect x={scale(brk)} y={0} width={scale(breaks[i + 1]) - scale(brk)} height={100} fill={colors[i]}/>
			{/each}
			<rect x={0} y={0} width={100} height={100} fill="none" stroke="#999"/>
		</g>
		<!-- <g class="chart-ticks">
			{#each breaks as brk}
				<line x1={scale(brk)} x2={scale(brk)} y1={0} y2={155} stroke="white"/>
			{/each}
		</g> -->
		<g class="chart-hover">
			{#each _data as d, i}
				<!-- <line x1={scale(d[valueKey])} x2={scale(d[valueKey])} y1={0} y2={100} stroke="lightgrey" stroke-width="0.5"/> -->
				<rect x={scale(i === 0 ? breaks[0] : avg(d[valueKey], _data[i - 1][valueKey]))}
					y={0}
					width={Math.abs(scale(
						(i === _data.length - 1 ? breaks[breaks.length - 1] : avg(d[valueKey], _data[i + 1][valueKey])) - 
						(i === 0 ? breaks[0] : avg(d[valueKey], _data[i - 1][valueKey]))
					))}
					height={100}
					fill="rgba(0,0,0,0)"
					title={`${(i === _data.length - 1 ? breaks[breaks.length - 1] : avg(d[valueKey], _data[i + 1][valueKey]))}-${ 
						(i === 0 ? breaks[0] : avg(d[valueKey], _data[i - 1][valueKey]))
					}`}
					on:mouseenter={() => doHover(d[idKey])} role="none"/>
			{/each}
		</g>
	</svg>
	{#each breaks.slice(0, breaks.length - 1) as brk, i}
		<div class="tick" style:left="{scale(brk)}%"/>
		<div class="tick-value" style="left: {scale(brk)}%; transform: translateX({i == 0 && snapTicks ? '-2px' : '-50%'});">{formatTick(breaks[i])}</div>
	{/each}
	<div class="tick" style:right={0}/>
	<div class="tick-value" style="right: 0; transform: translateX({snapTicks ? '2px' : '50%'});">{formatTick(breaks[breaks.length - 1])}{suffix}</div>
	{#if typeof hovered === "string"}
		{#each data.filter(d => d[idKey] === hovered) as d}
		<div class="marker" style="width: {lineWidth}px; left: calc({scale(d[valueKey])}% - {lineWidth / 2}px);"/>
		<!-- <div class="value" style="left: {scale(d[valueKey])}%">{Math.round(d[valueKey]).toLocaleString()}{suffix}</div> -->
		{/each}
	{/if}
</div>

<style>
	.container {
		margin: 20px 0 24px 0;
		box-sizing: border-box;
		position: relative;
		width: 100%;
		transform: translateY(-10px);
	}
	.tick {
		position: absolute;
		top: 0;
		height: calc(100% + 6px);
		border-left: 1px solid currentColor;
	}
	.tick-value {
		position: absolute;
		z-index: 1;
		top: calc(100% + 6px);
		text-align: center;
		transform: translateX(-50%);
	}
	.marker {
		position: absolute;
		z-index: 2;
		top: -5px;
		width: 0; 
		height: 0; 
		border-left: 10px solid transparent;
		border-right: 10px solid transparent;
		border-top: 18px solid currentColor;
		pointer-events: none;
		transform: translateX(-8px);
	}
	.value {
		position: absolute;
		top: -32px;
		text-align: center;
		transform: translateX(-50%);
		background-color: rgba(0,0,0,.8);
	}
	svg {
		position: absolute;
		/* overflow: visible; */
		width: 100%;
		height: 100%;
	}
	svg * {
		vector-effect: non-scaling-stroke;
		shape-rendering: crispEdges;
	}
</style>