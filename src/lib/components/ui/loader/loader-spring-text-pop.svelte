<script lang="ts">
	import { cn } from "$lib/utils.js";

	import type { LoaderTextProps } from "./loader.svelte.js";

	/**
	 * A word whose letters hop one after another.
	 *
	 * NO SPRING, DESPITE THE NAME. The hop is a plain
	 * `ease-in-out`, not `var(--ease-loader-spring)`. The spring token exists for the four
	 * loaders that genuinely want one; borrowing it here because of the file name would give a
	 * letter an overshoot this design never draws.
	 *
	 * THE STAGGER IS WRAPPED, AND THE WRAP IS LOAD-BEARING. A bare
	 * `delay: i * 0.08` is safe for a ten-character "Loading..", but `label` is a
	 * caller's string: at sixteen characters the last letter's delay passes the 1.2s duration, and the
	 * offset it is drawn at stops matching the wave the earlier letters are riding. `% DURATION_S`
	 * folds the stagger back into one cycle, so a long label wraps into a second wave rather than
	 * drifting out of the pattern, and the uniform `delay − duration` rule in the block still holds.
	 *
	 * THE LETTERS ARE `aria-hidden`. Split into per-character spans they would be announced one glyph
	 * at a time; `label` feeds both the visible text and the root's `aria-label`, so there is one
	 * accessible name and it cannot drift from what is on screen.
	 */
	let {
		ref = $bindable(null),
		label = "Loading..",
		class: className,
		role = "status",
		"aria-label": ariaLabel = label,
		...restProps
	}: LoaderTextProps = $props();

	/** The cycle, stagger and lift: `duration: 1.2`, `delay: i * 0.08`, `y: [0, -6, 0]`. */
	const DURATION_S = 1.2;
	const STAGGER_S = 0.08;
	const LIFT_PX = 6;

	/**
	 * Each letter's stagger, and the offset it is frozen at when motion is reduced.
	 *
	 * The rest lift is not a guess. With `animation-delay: delay − DURATION`, a letter's phase on the
	 * first painted frame is `((DURATION − delay) mod DURATION) / DURATION`, and the keyframes below
	 * draw a triangle that is 0 at both ends and −6px in the middle. Evaluated at that phase the
	 * triangle is `LIFT_PX × (1 − |1 − 2·phase|)`, so the still frame is the real wave running through
	 * the word rather than a flat line of letters. `LIFT_PX` is spelled again in the `@keyframes`
	 * below and the two have to agree.
	 */
	const characters = $derived(
		[...label].map((char, index) => {
			const delay = (index * STAGGER_S) % DURATION_S;
			const phase = ((DURATION_S - delay) % DURATION_S) / DURATION_S;

			return {
				index,
				// A literal space collapses in a flex row and would swallow the gap between two words,
				// so a non-breaking space stands in.
				char: char === " " ? "\u00A0" : char,
				// Rounded only so the emitted custom properties read as numbers rather than as
				// floating-point noise; three decimals is a millisecond.
				delay: Number(delay.toFixed(3)),
				lift: Number((LIFT_PX * (1 - Math.abs(1 - 2 * phase))).toFixed(2)),
			};
		}),
	);
</script>

<!--
	`w-fit` because a block `<div>` stretches to its container and would leave the word pinned to the
	left of it. `text-zinc-800 dark:text-white` is the primary ink: the light-mode shade decides the
	token and the `dark:` half is dropped, because `--foreground` already carries both themes.

	Each letter's text sits hard against its tags: a `<span>` is inline, so a newline between the tag
	and the glyph would render as a real space and spell the word out letter by letter.
-->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="spring-text-pop"
	{role}
	aria-label={ariaLabel}
	class={cn("flex w-fit text-sm font-medium tracking-widest text-foreground", className)}
>
	{#each characters as character (character.index)}
		<span
			class="char inline-block origin-bottom"
			aria-hidden="true"
			style:--delay="{character.delay}s"
			style:--rest="{character.lift}px">{character.char}</span
		>
	{/each}
</div>

<style>
	/* The hop, 0 → -6px → 0, over three equal intervals — evenly spaced
	   stops whose first and last values are equal, which is why they share a
	   selector.

	   The 6px below is `LIFT_PX` in the script, which evaluates this same triangle per letter to get
	   the frozen frame reduced motion shows. They are two spellings of one fact and nothing will
	   report it when they drift, so change both or neither. */
	@keyframes loader-spring-text-pop-hop {
		0%,
		100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-6px);
		}
	}

	.char {
		--duration: 1.2s;

		/* The rest state, computed per letter in the script above; negated here because `--rest` is a
		   lift and the transform axis points down. */
		transform: translateY(calc(var(--rest) * -1));

		animation: loader-spring-text-pop-hop var(--duration) ease-in-out infinite;

		/* The stagger delay shifted back one whole cycle. Phase is periodic in the duration, so moving
		   every letter by the same cycle changes nothing between them, and it makes every delay
		   negative — a negative delay seeks the animation backwards, so the word is already rippling
		   on the first painted frame instead of standing still while the stagger winds up. Negating
		   each delay instead would run the ripple right to left. */
		animation-delay: calc(var(--delay) - var(--duration));
	}
</style>
