<script>
	import { onMount } from "svelte";
	
  export let data;
	export let height = 80;
	export let gap = 10;
	export let keys = ["from", "to"];
	export let highlight = "a";
	export let color = "#27a0cc";
	
	const width = 100;

	let _data, makePath;

	function scale(breaks, max) {
		const _width = width - (gap * (breaks.length - 1));
		return function(val) {
			const gaps = breaks.slice(1).reduce((a, b) => val >= b ? a + gap : a, 0);
			return (val * (_width / max)) + gaps;
		}
	};

	function init(data) {
		let newdata = JSON.parse(JSON.stringify(data));
		let domains = {};
		let breaks = {};
		let maxes = {};
		let scales = {};
		
		for (const key of keys) {
			domains[key] = {};
			for (const d of newdata) {
				if (!domains[key][d[key]]) domains[key][d[key]] = {key: d[key], size: 0};
				domains[key][d[key]].size += d.value;
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
			L ${scales[keys[0]](x1 + value - 0.1)},0
			C ${scales[keys[0]](x1 + value - 0.1)},40 ${scales[keys[1]](x2 + value - 0.1)},40 ${scales[keys[1]](x2 + value - 0.1)},80
			L ${scales[keys[1]](x2 + (value / 2))},100
			L ${scales[keys[1]](x2)},80
			C ${scales[keys[1]](x2)},40 ${scales[keys[0]](x1)},40 ${scales[keys[0]](x1)},0 Z`;
		_data = newdata;
	}
	
	onMount(() => init(data));
	$: init(data);
</script>

{#if _data}
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
		{/each}
  </defs>
	{#each _data as d}
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
			'solid'})"/>
	{/each}
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
</style>