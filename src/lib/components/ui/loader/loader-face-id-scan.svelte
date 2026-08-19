<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A face outline in a framed window with a scan line travelling down it.
	 *
	 * THE SCAN LINE TRAVELS BY `transform`, NOT BY `top`, AND THE UNITS FOLLOW FROM IT.
	 * The obvious spelling animates `top: -100% → 100% → -100%`, and a percentage
	 * `top` resolves against the CONTAINING BLOCK, which is the frame's PADDING box — `size-12` is
	 * 48px border-box and the `border-2` takes 2px off each side, so the box the percentage measures
	 * is 44px and the travel is ±44px, not ±48px. A percentage in `translateY` measures the ELEMENT
	 * instead, which is the 32px band, so the same spelling would give ±32px and a shorter sweep
	 * again. The travel is therefore written as ±2.75rem — the ±44px the design means, exactly.
	 * `transform` earns the swap: none of the three cases that license animating a layout property
	 * applies here — the band is a straight-edged rectangle, it pushes no sibling, and nothing is
	 * positioned against it — so this is the cheaper spelling of the same picture rather than a
	 * different one.
	 *
	 * THE GREENS ARE A STATUS FILL, WHICH IS THE ONE ROLE A STATUS COLOUR MAY TAKE. `to-green-400/30`
	 * and `border-green-500` become `to-success/30` and `border-success`: a thin edge and a soft tint
	 * behind it, never type on a tint. `--success` is the same value in both themes by design, so the
	 * band is kept low-alpha and thin here for the same reason `loader-dynamic-island.svelte` keeps
	 * its status dot small.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();
</script>

<!--
	The frame's `border-2` is a track rather than a mark — the
	window the scan happens in, not the thing being looked at — so it takes the `/20` ring weight.
	`overflow-hidden` is what turns the frame into a window: the band is 32px tall and travels a full
	44px each way, so most of its journey happens outside the box.
-->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="face-id-scan"
	{role}
	aria-label={ariaLabel}
	class={cn(
		"relative flex size-12 items-center justify-center overflow-hidden rounded-xl border-2 border-muted-foreground/20",
		className,
	)}
>
	<!--
		The face glyph: an unlit fill rather than a mark,
		so it takes the `/20` weight. It is deliberately dim — it is the thing being scanned, and the
		moving band is the loader's subject.
	-->
	<svg class="size-6 fill-muted-foreground/20" viewBox="0 0 24 24" aria-hidden="true">
		<path
			d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
		/>
	</svg>

	<!--
		The band, written as utilities rather than in the block wherever it can be. `top-0` anchors
		it; the travel is the transform's job.
	-->
	<span
		class="scan absolute top-0 left-0 h-8 w-full border-b border-success bg-linear-to-b from-transparent to-success/30"
	></span>
</div>

<style>
	/* The sweep over three equal intervals, as the ±44px
	   it measures against the frame's padding box (see the component comment for why the box is
	   44px and not 48px). The first and last values are equal, which is why
	   they share a selector, and `linear` because a scanner sweeps at a constant rate. */
	@keyframes loader-face-id-scan-sweep {
		0%,
		100% {
			transform: translateY(-2.75rem);
		}
		50% {
			transform: translateY(2.75rem);
		}
	}

	.scan {
		/* The rest state: the band across the middle of the window, which is the midpoint of its travel
		   rather than either end. Both endpoints are outside the frame, so freezing on one would leave
		   an empty box with a dim face in it and nothing to say a scan was in progress. */
		transform: translateY(0);

		animation: loader-face-id-scan-sweep 2.5s linear infinite;
	}
</style>
