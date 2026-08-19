<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Three dots swelling and brightening in turn.
	 *
	 * THE SCALE AND THE OPACITY ARE ONE ANIMATION. `scale` runs 1 → 1.5 → 1 as
	 * `opacity` runs 0.5 → 1 → 0.5, on one shared
	 * timeline — so they share a keyframe block. Splitting them into two
	 * `animation`s would compile and run and would let the swell and the brightening drift apart at
	 * the first dropped frame.
	 *
	 * THE SWELL OVERFLOWS ITS BOX AND IS MEANT TO. A 12px dot at scale 1.5 is 18px, i.e. 3px past its
	 * own edge on each side, against an 8px gap — the dots never touch, and the performance gate in
	 * `src/app.css` sits on the gallery tile rather than on the loader precisely so nothing here gets
	 * clipped.
	 *
	 * Other divergences: `bg-zinc-800 dark:bg-white` is the single token `bg-foreground`;
	 * `space-x-2` is `gap-2`; the stagger `delay: i * 0.2` is shifted back one whole cycle;
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();

	const dots = [0, 1, 2];
</script>

<!-- `w-fit` so the three dots size the row rather than it stretching to its container. -->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="pulsating-dots"
	{role}
	aria-label={ariaLabel}
	class={cn("flex w-fit gap-2", className)}
>
	{#each dots as index (index)}
		<span class="dot size-3 rounded-full bg-foreground" style:--index={index}></span>
	{/each}
</div>

<style>
	/* Both ramps over two equal intervals — three values each, so the
	   peak is at 50%. The ends agree, so the loop back has no visible snap. */
	@keyframes loader-pulsating-dots-swell {
		0%,
		100% {
			opacity: 0.5;
			transform: scale(1);
		}
		50% {
			opacity: 1;
			transform: scale(1.5);
		}
	}

	.dot {
		--duration: 1.2s;
		/* The stagger: `delay: i * 0.2`. */
		--stagger: 0.2s;

		/* The rest state: a real frame of this animation, with the three dots caught at scale
		   1 / 1.17 / 1.33 and opacity 0.5 / 0.67 / 0.83. With `animation-delay: i·0.2s − 1.2s` a
		   dot's phase on the first painted frame is (1.2 − 0.2i)/1.2 — all three on the falling leg —
		   so the keyframes above evaluate to `1 + 0.5 × (2 × 0.2i / 1.2)` and
		   `0.5 + 0.5 × (2 × 0.2i / 1.2)`, both of which reduce to a sixth of the index. The 1.5 and
		   the 0.5 are the keyframe's own stops, spelled again here; the two sites have to agree. */
		opacity: calc(0.5 + var(--index) / 6);
		transform: scale(calc(1 + var(--index) / 6));

		animation: loader-pulsating-dots-swell var(--duration) ease-in-out infinite;
		/* The stagger delay shifted back one whole cycle: same phase order — the swell still travels
		   left to right — and no wind-up on mount. */
		animation-delay: calc(var(--index) * var(--stagger) - var(--duration));
	}
</style>
