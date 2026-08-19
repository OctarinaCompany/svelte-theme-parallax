<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Three fat bars stretching open from the centre line, one after the other.
	 *
	 * Decisions worth naming:
	 * - The bars are one semantic token, `bg-foreground`, which carries both themes on its own.
	 * - `space-x-2` becomes `flex` + `gap-2`, per `docs/CONVENTIONS.md`.
	 * - An unshifted delay winds up: a positive `animation-delay` would hold all three bars at their
	 *   8px minimum until it elapses, so the loader would visibly start up on mount. Every delay is
	 *   shifted back one whole cycle instead — same phase order, so the stretch still runs left to
	 *   right.
	 *
	 * WHY THIS ANIMATES `height` AND NOT `scaleY()`. A transform is composited and a layout property
	 * is not, so `transform` is the default wherever it is a cheaper spelling of the same picture.
	 * Here it is not: a bar is 8px wide and `rounded-full`, so its 4px cap radius is exactly half its
	 * smaller dimension, and under `scaleY(0.22)` those circular caps become slivers — the bar stops
	 * being a rounded bar at exactly the moment it is shortest.
	 * `ui/loader/loader-waveform-loader.svelte` and `ui/loader/loader-symmetric-wave.svelte` claim the
	 * same case, and `ui/loader/loader-morphing-bars.svelte` is the counter-example: its `rounded-sm`
	 * bars have a radius small enough to scale.
	 *
	 * A consequence worth stating out loud: a Svelte scoped rule is unlayered and Tailwind utilities
	 * live in `@layer utilities`, so the `height` below beats an `h-*` class a caller puts on a bar.
	 * These bars are not a caller's to resize — the loader has no `size` prop by design
	 * (`./loader.svelte.ts`) — but the rule is silent, so it is written down.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	const bars = Array.from({ length: 3 }, (_, index) => index);
</script>

<!-- `h-10` holds the row's box steady while the bars grow inside it; `w-fit`
     because a bare block `<div>` stretches to its container and would strand three centred bars in
     the middle of a full-width box that is trying to centre them itself. -->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="elastic-bars"
	{role}
	aria-label={ariaLabel}
	class={cn("flex h-10 w-fit items-center justify-center gap-2", className)}
>
	{#each bars as index (index)}
		<span class="bar w-2 rounded-full bg-foreground" style:--index={index}></span>
	{/each}
</div>

<style>
	/* `height` runs 8 → 36 → 8 over three equal intervals, its stops evenly spaced. First and last are the same value, which is why they share a
	   selector. */
	@keyframes loader-elastic-bars-stretch {
		0%,
		100% {
			height: 8px;
		}
		50% {
			height: 36px;
		}
	}

	.bar {
		--duration: 1.1s;
		--stagger: 0.15s; /* the stagger `delay: i * 0.15` */

		/* The rest state: the keyframe triangle evaluated at each bar's phase on the first painted
		   frame. With the whole cycle subtracted below that phase is `1 - i * 0.15 / 1.1`, which never
		   passes the peak, so the ramp comes out exactly linear — the row freezes at 8, 16 and 23px
		   rather than three stubs of one height. The 8px and the 28px it spans are the keyframe's two
		   stops above and the two have to agree. */
		height: calc(8px + var(--index) * 7.636px);

		animation: loader-elastic-bars-stretch var(--duration) ease-in-out infinite;
		/* The stagger delay shifted back one whole cycle: same phase order, no wind-up. */
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
