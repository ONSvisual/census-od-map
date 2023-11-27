<script>
	import { onMount } from "svelte";
	import tooltip from "$lib/ui/tooltip";
	
	export let data;
	export let height = 80;
	export let gap = 10;
	export let keys = ["from", "to"];
	export let highlight = "a";
	export let color = "#27a0cc";
	
	const width = 100;

	let _data, _maskData, makePath, makeMask, hovered;

	function scale(breaks, max) {
		const _width = width - (gap * (breaks.length - 1));
		return function(val) {
			const gaps = breaks.slice(1).reduce((a, b) => val >= b ? a + gap : a, 0);
			return (val * (_width / max)) + gaps;
		}
	};

	function init(data) {
		let newdata = JSON.parse(JSON.stringify(data)).map(d => ({...d, key: `${d.from}_${d.to}`}));
		let domains = {};
		let breaks = {};
		let maxes = {};
		let scales = {};
		
		for (const key of keys) {
			domains[key] = {};
			for (let i = 0; i < newdata.length; i ++) {
				const d = newdata[i];
				if (!domains[key][d[key]]) domains[key][d[key]] = {key: d[key], size: 0};
				domains[key][d[key]].size += d.value;
				d.id = i;
			}
			let start = 0;
			for (const id of Object.keys(domains[key]).sort((a, b) => a.localeCompare(b))) {
				domains[key][id].start = start;
				domains[key][id].current = start;
				start += domains[key][id].size;
				maxes[key] = start;
			}
			breaks[key] = Object.keys(domains[key]).map(id => domains[key][id].start);
			scales[key] = scale(breaks[key], maxes[key]);
		}
	
		for (const d of newdata) {
			for (const key of keys) {
				d[`${key}_start`] = domains[key][d[key]].current;
				domains[key][d[key]].current += d.value;
			}
		}
		
		makePath = (x1, x2, value) => `
			M ${scales[keys[0]](x1)},0
			L ${scales[keys[0]](x1 + value - 0.1) - 0.3},0
			C ${scales[keys[0]](x1 + value - 0.1) - 0.3},40 ${scales[keys[1]](x2 + value - 0.1) - 0.3},40 ${scales[keys[1]](x2 + value - 0.1) - 0.3},80
			L ${scales[keys[1]](x2 + value - 0.1) - 0.3},100
			L ${scales[keys[1]](x2 + (value / 2)) - 0.3},100
			L ${scales[keys[1]](x2)},100
			L ${scales[keys[1]](x2)},80
			C ${scales[keys[1]](x2)},40 ${scales[keys[0]](x1)},40 ${scales[keys[0]](x1)},0 Z`;

		makeMask = (data) => `
			M 100,0
			L 0,0
			${data.map((msk) => `
				L ${scales[keys[1]](msk.to_start)},80
				L ${scales[keys[1]](msk.to_start + (msk.value / 2))},100
				L ${scales[keys[1]](msk.to_start + msk.value - 0.1)},80`)}
			L 100,80 Z`;	

		_maskData = ((data) => {
			let md = {};
			for (const d of data) {
				if (!md[d.key]) md[d.key] = {...d};
				else md[d.key].value += d.value
			}
			return Object.keys(md).map(key => md[key]).sort((a, b) => a.to_start - b.to_start);
		})(newdata);

		_data = newdata;
	}
	
	onMount(() => init(data));
	$: init(data);
</script>

{#if _data && _maskData}
<svg 
	viewBox="0 0 100 100"
	preserveAspectRatio="none"
	style:height="{height}px">
	<defs>
		<linearGradient id="solid"><stop stop-color="{color}"/></linearGradient>
		<linearGradient id="transparent"><stop stop-color="{color}" stop-opacity="0.2"/></linearGradient>
		{#each keys as key, i}
    <linearGradient id="{key}_gradient" gradientTransform="rotate(90)">
      <stop offset="5%" stop-color="{color}" stop-opacity="{i === 0 ? 1 : 0.2}" />
      <stop offset="95%" stop-color="{color}" stop-opacity="{i === 0 ? 0.2 : 1}" />
    </linearGradient>
	<clipPath id="mask">
		<path d="{makeMask(_maskData)}"/>
	</clipPath>
		{/each}
  </defs>
  	<!-- svelte-ignore a11y-no-static-element-interactions -->
  	<!-- svelte-ignore a11y-mouse-events-have-key-events -->
  	<g clip-path="url(#mask)" on:mouseout={() => hovered = null}>
		{#each _data as d}
		<!-- svelte-ignore a11y-mouse-events-have-key-events -->
		<!-- svelte-ignore a11y-no-static-element-interactions -->
		<path
			d="{makePath(...keys.map(key => d[`${key}_start`]), d.value)}"
			fill="url(#{
				Array.isArray(highlight) ? `${d[highlight[0]] === highlight[1] ? 'solid' : 'transparent'}` :
				typeof highlight === 'string' ? `${
					d[keys[0]] === highlight && d[keys[1]] === highlight ? 'solid' :
					d[keys[0]] === highlight ? `${keys[0]}_gradient` : 
					d[keys[1]] === highlight ? `${keys[1]}_gradient` : 
					'transparent'
				}` :
				'solid'})"
			title="{d.value.toLocaleString()} {d.label}"
			style:pointer-events={
				(Array.isArray(highlight) && d[highlight[0]] !== highlight[1]) ||
				(typeof highlight === 'string' && ![d[keys[0]], d[keys[1]]].includes(highlight)) ?
				"none" : "all"
			}
			opacity={hovered != null && hovered !== d.id ? 0.7 : 1}
			on:mouseover={() => hovered = d.id}
			use:tooltip/>
		{/each}
	</g>
</svg>
{/if}

<style>
	:global(body) {
		background: #222;
	}
	svg {
		width: 100%;
		overflow: visible;
	}
	svg * {
		vector-effect: non-scaling-stroke;
	}
</style>