<script>
	export let title;
	export let x;
	export let y;
	export let width;
	export let pos = "top";
	
	let w;
	
	const xPad = 4;
	
	$: xPos = w && x + (w / 2) > width - xPad ? width - (w / 2) - xPad : w && x - (w / 2) < 0 + xPad ? (w / 2) + xPad : x;
</script>

{#if title}
<div class="ons-tooltip" style:top="{y}px" style:left="{xPos}px" bind:clientWidth={w} style:transform="translate(-50%,{pos === 'top' ? 'calc(-100% - 8px)' : '8px'})">
  <div class="ons-tooltip-caret" class:ons-tooltip-caret-bottom={pos == 'bottom'} class:ons-tooltip-caret-top={pos == 'top'} style:transform="translateX({(w / x) + (x - xPos)}px)"></div>
  <span class="ons-tooltip-content">{title}</span>
</div>
{/if}

<style>
	.ons-tooltip {
		position: absolute;
        font-family: Arial, sans-serif;
		background: #222;
		color: white;
		border-radius: 2px;
		padding: 4px;
        font-size: 13px;
        white-space: nowrap;
		pointer-events: none;
        max-width: 150px;
        text-wrap: wrap;
		z-index: 1000;
	}
    .ons-tooltip > span {
        position: relative;
    }
	.ons-tooltip-caret {
		content: " ";
		position: absolute;
		left: 50%;
		margin-left: -8px;
		border-width: 8px;
		border-style: solid;
		pointer-events: none;
	}
	.ons-tooltip-caret-bottom {
		bottom: calc(100% - 1px);
		border-color: transparent transparent #222 transparent;
	}
	.ons-tooltip-caret-top {
		top: calc(100% - 1px);
		border-color: #222 transparent transparent transparent;
	}
</style>