<script>
	import { onMount, onDestroy, createEventDispatcher } from "svelte";

	const dispatch = createEventDispatcher();

	let el, observer;
	let visible = false;

	const callback = (entries, observer) => {
	  entries.forEach((entry) => {
			let intersecting = entry.isIntersecting;
	    if (!visible && intersecting) dispatch("enter", entry);
			if (visible && !intersecting) dispatch("exit", entry);
			visible = intersecting;
	  });
	};

	onMount(() => {
		let options = {};
		
		observer = new IntersectionObserver(callback, options);
		observer.observe(el);
	});

	onDestroy(() => { if (observer) observer.unobserve(el) });
</script>

<div bind:this={el}>
	<slot/>
</div>