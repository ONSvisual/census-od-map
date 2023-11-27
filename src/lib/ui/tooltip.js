import Tooltip from './Tooltip.svelte';

const tooltip = (element, options = {pos: "cursor"}) => {
	let title;
	let tooltipComponent;
    let tooltip_pos = options.pos;
    let cursor = tooltip_pos === "cursor";
    let top = tooltip_pos !== "bottom";
	let middle = tooltip_pos === "middle";
	
	function mouseOver(event) {
		// NOTE: remove the `title` attribute, to prevent showing the default browser tooltip
		// remember to set it back on `mouseleave`
		title = element.getAttribute('title');
		element.removeAttribute('title');

        let body = document.body.getBoundingClientRect();
		let pos = element.getBoundingClientRect();
		let y = cursor ? event.clientY : middle ? (pos.bottom + pos.top) / 2 : top ? pos.top : pos.bottom;
		let x = cursor ? event.clientX : (pos.left + pos.right) / 2;

		tooltipComponent = new Tooltip({
			props: {
				title: title,
				x: x,
				y: y + window.scrollY,
				width: body.width,
				pos: top ? "top" : "bottom"
			},
			target: document.body,
		});
	}
    function mouseMove(event) {
		tooltipComponent.$set({
			x: event.pageX,
			y: event.pageY,
		});
	}
	function mouseOut() {
		tooltipComponent.$destroy();
		// NOTE: restore the `title` attribute
		element.setAttribute('title', title);
	}
	
	element.addEventListener('mouseover', mouseOver);
  	element.addEventListener('mouseout', mouseOut);
	if (cursor) element.addEventListener('mousemove', mouseMove);
	
	return {
		destroy() {
			if (tooltipComponent) tooltipComponent.$destroy();
			element.removeEventListener('mouseover', mouseOver);
			element.removeEventListener('mouseout', mouseOut);
            if (cursor) element.removeEventListener('mousemove', mouseMove);
		}
	}
}

export default tooltip;