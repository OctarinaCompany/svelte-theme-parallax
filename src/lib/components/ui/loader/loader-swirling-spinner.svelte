<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Two rings whose stroke fades out round the circle, turning against each other at different
	 * speeds.
	 *
	 * THE FOUR BORDER SIDES ARE ONE ALPHA RAMP, NOT FOUR COLOURS: full, /30, /10,
	 * transparent — one ink, stepped down to nothing over three quarters of the
	 * circle, which is how you draw a comet tail with a border. All three lit sides take
	 * `--foreground` at those alphas and the fourth stays `transparent`.
	 *
	 * `border-b-foreground/10` is NOT a hairline, despite matching the shape the token map routes to
	 * `border-border`. It is the faint end of this ramp: swapping it for `border-border` would give
	 * the tail a colour unrelated to the head and break the fade the loader is made of. The
	 * disambiguator is what the alpha is doing, not what number it is.
	 *
	 * The inner ring's ramp starts at the BOTTOM (`border-b-` lit, `border-t-` at 30%), so the two
	 * heads sit on opposite sides of the circle and the counter-rotation is visible from the first
	 * frame.
	 *
	 * The rings are inner elements rather than the root, so a caller's `class` and the a11y
	 * attributes never sit on something that spins.
	 *
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
	The inner ring is `absolute` with no offsets inside a centring flex container: an absolutely
	positioned child's static-position rectangle is the ALIGNED one, so it lands concentric with the
	outer ring without an `inset` of its own. `loader-clock-spinner.svelte` relies on the same rule.
-->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="swirling-spinner"
	{role}
	aria-label={ariaLabel}
	class={cn("relative flex size-10 items-center justify-center", className)}
>
	<span
		class="arc arc-outer absolute inset-0 rounded-full border-[2.5px] border-t-foreground border-r-foreground/30 border-b-foreground/10 border-l-transparent"
	></span>
	<span
		class="arc arc-inner absolute size-6 rounded-full border-[2.5px] border-t-foreground/30 border-r-foreground/10 border-b-foreground border-l-transparent"
	></span>
</div>

<style>
	/* One keyframe pair for both rings; the direction is a custom property, so the inner ring gets
	   its counter-rotation without a second `@keyframes`. A `var()`
	   inside a keyframe is substituted against the animated element, which is what lets two rings
	   share one motion and not its endpoint. */
	@keyframes loader-swirling-spinner-spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(var(--turn));
		}
	}

	.arc {
		/* The rest state, for `prefers-reduced-motion: reduce` (the shared rule in `src/app.css`
		   stops the animation but does not choose what it stops on). A ring is the same picture at
		   every angle, so this is the frame the animation starts on, with the two bright heads facing
		   opposite ways. Never seen while the animation runs: the keyframes declare `transform` at
		   both ends. */
		transform: rotate(0deg);
		animation: loader-swirling-spinner-spin var(--duration) linear infinite;
	}

	/* Two mismatched durations. The inner ring is the faster of
	   the two, so the pair never settles into a fixed relationship. */
	.arc-outer {
		--duration: 1.3s;
		--turn: 360deg;
	}

	.arc-inner {
		--duration: 0.9s;
		--turn: -360deg;
	}
</style>
