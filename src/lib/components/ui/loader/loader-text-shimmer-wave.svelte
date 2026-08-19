<script lang="ts">
	import { cn } from "$lib/utils.js";

	import type { LoaderTextProps } from "./loader.svelte.js";

	/**
	 * A word whose letters brighten and lift one after another, like a wave running through it.
	 *
	 *
	 * THE STAGGER IS DRIVEN BY A CALLER'S STRING, WHICH IS WHY IT IS WRAPPED. A bare
	 * `delay: i * 0.1` per letter against a 1.5s cycle
	 * is fine for an eight-letter word topping out at 0.7s, but `label` is a prop: a
	 * twenty-character label would reach 1.9s, so the last letters would be a whole cycle behind and
	 * the wave would read as two waves. `% DURATION_S` folds the stagger back into one cycle, which
	 * costs nothing for a short label and keeps a long one a single wave.
	 *
	 * BOTH ANIMATED PROPERTIES RIDE ONE KEYFRAME SET. The brighten and the lift belong to one
	 * motion; CSS has a single `transform` property, and writing them as two
	 * animations would let them drift apart. They are one set of stops.
	 *
	 * EVERY LETTER IS `aria-hidden`. A word split into per-character spans is a word a screen reader
	 * may spell out; the root's `aria-label` is the one name this loader has, and `label` feeds both
	 * it and the visible text so they cannot disagree. Same reasoning as
	 * `loader-text-shimmer.svelte`.
	 *
	 * `text-zinc-900 dark:text-white` is primary ink: the light-mode shade decides the token and the
	 * `dark:` half is dropped, because `--foreground` already carries both themes.
	 */
	let {
		ref = $bindable(null),
		label = "Thinking",
		class: className,
		role = "status",
		"aria-label": ariaLabel = label,
		...restProps
	}: LoaderTextProps = $props();

	/** The cycle length, spelled again in the block below. */
	const DURATION_S = 1.5;

	/**
	 * A letter's stagger, and the frame it is frozen on when motion is reduced.
	 *
	 * `lit` is not decorative. With `animation-delay: delay - 1.5s`, a letter's phase on the first
	 * painted frame is `(-(delay - 1.5)) mod 1.5 / 1.5`, and the keyframes below draw a triangle
	 * that is 0 at both ends and 1 in the middle. Evaluating that triangle at the letter's own phase
	 * gives the frame the wave would really be showing, so the still picture is a wave rather than a
	 * row of identical letters. The block reads it as `0.3 + 0.7 × lit` for opacity and
	 * `lit × -2px` for the lift — the same four constants that appear in the `@keyframes`, and the
	 * two spellings have to agree.
	 */
	const characters = $derived(
		label.split("").map((char, index) => {
			const delay = (index * 0.1) % DURATION_S;
			// A whole cycle wraps to the start of the next one, which is why the modulo is here and
			// not in a `delay === 0` special case: at `delay = 0` the seek is a full 1.5s, i.e. phase
			// 0, not phase 1.
			const phase = ((DURATION_S - delay) / DURATION_S) % 1;

			return { index, char, delay, lit: 1 - Math.abs(2 * phase - 1) };
		}),
	);
</script>

<!--
	`w-fit` because the letters size this loader and a bare block `<div>` would stretch to its
	container, leaving the word pinned to the left of whatever it is dropped into.
-->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="text-shimmer-wave"
	{role}
	aria-label={ariaLabel}
	class={cn("flex w-fit text-lg font-medium text-foreground", className)}
>
	<!-- `whitespace-pre` so a multi-word label keeps its spaces: a lone space in a flex item would
	     otherwise collapse to nothing and the words would run together. -->
	{#each characters as character (character.index)}
		<span
			class="char whitespace-pre"
			style:--delay="{character.delay}s"
			style:--lit={character.lit}
			aria-hidden="true">{character.char}</span
		>
	{/each}
</div>

<style>
	/* `opacity` runs 0.3 → 1 → 0.3 as `y` runs 0 → -2px → 0 —
	   three evenly spaced stops, and the matching first and last share a
	   selector. */
	@keyframes loader-text-shimmer-wave-lift {
		0%,
		100% {
			opacity: 0.3;
			transform: translateY(0);
		}
		50% {
			opacity: 1;
			transform: translateY(-2px);
		}
	}

	.char {
		--duration: 1.5s;

		/* The rest state, computed per letter in the script above: the same triangle the keyframes
		   draw, evaluated at this letter's phase on the first painted frame. The constants 0.3, 0.7
		   and -2px are the keyframes' own endpoints written a second way. */
		opacity: calc(0.3 + 0.7 * var(--lit));
		transform: translateY(calc(var(--lit) * -2px));

		animation: loader-text-shimmer-wave-lift var(--duration) ease-in-out infinite;

		/* The stagger delay shifted back one whole cycle. Phase is periodic in the duration, so
		   moving every letter by the same cycle changes nothing between them — but it makes every
		   delay negative, and a negative delay seeks backwards, so the wave is already running on
		   the first painted frame instead of the word standing still while it winds up. Subtracting
		   rather than negating is what keeps the wave travelling left to right. */
		animation-delay: calc(var(--delay) - var(--duration));
	}
</style>
