<script module lang="ts">
	/**
	 * The cycle and its two ramps: each ring runs scale 0.3 → 1.6 while its opacity fades
	 * 0.8 → 0, over 2.2s.
	 *
	 * All five constants are spelled again as literals in the `@keyframes` block below, because a
	 * `<script module>` const cannot reach a CSS rule. They are two spellings of one fact and nothing
	 * will report it if they drift, so both sites carry a note.
	 */
	const DURATION_S = 2.2;
	const SCALE_FROM = 0.3;
	const SCALE_TO = 1.6;
	const OPACITY_FROM = 0.8;
	const OPACITY_TO = 0;

	const rings = Array.from({ length: 3 }, (_, index) => {
		// One ring born every 0.7s: `delay: i * 0.7`.
		const delay = index * 0.7;

		// The rest state, for `prefers-reduced-motion` — the shared rule in `src/app.css` stops the
		// animation but does not choose what it stops on. The block below shifts every ring back one
		// whole cycle, so this ring's phase on the first painted frame is `((-delay) mod D) / D`, and
		// evaluating the two ramps there leaves three rings at genuinely different radii and
		// brightnesses. In INDEX order — which is not size order, because the ring with the largest
		// delay is the one born most recently — they come out at scale 0.3 / 1.186 / 0.773 with
		// opacity 0.8 / 0.255 / 0.509: ring 0 just leaving the core, ring 1 nearly gone, ring 2
		// between them. Frozen at frame 0 instead, all three would sit exactly on top of each other
		// and the loader would look like a single ring around a dot.
		//
		// The phase is read straight off the ramp, ignoring `ease-out`'s curve: the easing decides how
		// fast a ring crosses the gap, not the order the three sit in, and the frozen picture only has
		// to be a plausible frame of this animation. `loader-waveform-loader.svelte` makes the same
		// approximation for the same reason.
		const phase = ((DURATION_S - delay) % DURATION_S) / DURATION_S;

		return {
			index,
			delay,
			scale: Number((SCALE_FROM + (SCALE_TO - SCALE_FROM) * phase).toFixed(3)),
			opacity: Number((OPACITY_FROM + (OPACITY_TO - OPACITY_FROM) * phase).toFixed(3)),
		};
	});
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A dot throwing off rings, like something dropped in water.
	 *
	 * THE RINGS ARE `border-foreground`, NOT THE HAIRLINE `border-border`. A solid ink ring at full
	 * opacity is the visible object of the loader, and the token inverts with the theme, so the
	 * rings stay legible on both grounds.
	 *
	 * THREE RINGS SHARE ONE KEYFRAME AND DIFFER ONLY BY PHASE, which is what a ripple is: the same
	 * event repeating every 0.7s. Their rest positions are per ring and computed in the module block
	 * above, because a shared keyframe plus a shared base would stack them into one.
	 *
	 * THE ANIMATION LOOPS RATHER THAN ALTERNATES, so the ring snaps from 1.6 back to 0.3 each
	 * cycle — invisible, because it has already faded to 0 by then. The core is the single token
	 * `bg-foreground`, and the delay is shifted back one whole cycle.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();
</script>

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="ripple-effect"
	{role}
	aria-label={ariaLabel}
	class={cn("relative flex size-12 items-center justify-center", className)}
>
	<!-- Everything here is `absolute` inside a centring flex container, which resolves each child to
	     its centred static position — so the core and all three rings share one centre with no offset
	     arithmetic. -->
	<span class="absolute size-2.5 rounded-full bg-foreground"></span>

	<!-- The class is `ripple`, not `ring`: `ring` is a Tailwind utility (a box-shadow outline), so a
	     bare `ring` in this list would paint a second, static ring around every expanding one. -->
	{#each rings as ring (ring.index)}
		<span
			class="ripple absolute size-8 rounded-full border border-foreground"
			style:--delay="{ring.delay}s"
			style:--rest-scale={ring.scale}
			style:--rest-opacity={ring.opacity}
		></span>
	{/each}
</div>

<style>
	/* The expand-and-fade ramp. The five numbers are `SCALE_FROM`/`SCALE_TO` and
	   `OPACITY_FROM`/`OPACITY_TO` in the module block, which evaluates these same two ramps to pick
	   each ring's rest frame; change one, change both. */
	@keyframes loader-ripple-effect-expand {
		from {
			opacity: 0.8;
			transform: scale(0.3);
		}
		to {
			opacity: 0;
			transform: scale(1.6);
		}
	}

	.ripple {
		--duration: 2.2s;

		/* The rest frame, computed per ring in the module block. Never seen while the animation runs,
		   because the keyframes declare both properties at both ends. */
		opacity: var(--rest-opacity);
		transform: scale(var(--rest-scale));

		/* `ease-out` — cubic-bezier(0, 0, 0.58, 1) — so each
		   ring leaps away from the core and then coasts outward, which is what makes it read as a
		   ripple rather than as a steady expansion. */
		animation: loader-ripple-effect-expand var(--duration) ease-out infinite;
		/* The stagger delay shifted back one whole cycle: the three rings keep their 0.7s spacing
		   and are already spread across the box on the first painted frame, instead of emerging one
		   at a time over the first 1.4 seconds. */
		animation-delay: calc(var(--delay) - var(--duration));
	}
</style>
