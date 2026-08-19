<script lang="ts">
	import { cn } from "$lib/utils.js";

	import type { LoaderTextProps } from "./loader.svelte.js";

	/**
	 * A word scrolling up through a slot, the way iOS reveals a status line.
	 *
	 * THE SLOT IS THE POINT, so `overflow-hidden` on the root is geometry rather than tidiness: the
	 * word enters from below the box, crosses it, and leaves above it, and without the clip it is
	 * simply a word sliding around a page. The slot's `h-6` is deliberate even though `text-lg`
	 * has a 1.75rem line box — the slot is deliberately shorter than the line, which is what crops
	 * the ascenders as the word arrives and gives the reveal its edge.
	 *
	 * THE PERCENTAGES ARE THE WORD'S OWN HEIGHT, NOT THE SLOT'S. `translateY(100%)` resolves
	 * against the moving element's own box, so the 24px-vs-28px difference between slot and line
	 * box is part of the picture, not a rounding error.
	 *
	 * THE WORD IS `aria-hidden`. `label` feeds both the visible string and the root's `aria-label`,
	 * so there is one name and it cannot drift from what is on screen — the same shape
	 * `loader-text-shimmer.svelte` uses.
	 */
	let {
		ref = $bindable(null),
		label = "Loading",
		class: className,
		role = "status",
		"aria-label": ariaLabel = label,
		...restProps
	}: LoaderTextProps = $props();
</script>

<!--
	`w-fit` because a block `<div>` would stretch to whatever it is dropped into and leave the word
	pinned to the left of a wide, mostly empty slot. `text-zinc-900 dark:text-white` is the primary
	ink: the light-mode shade decides the token and the `dark:` half is dropped, because
	`--foreground` already carries both themes.
-->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="apple-text-reveal"
	{role}
	aria-label={ariaLabel}
	class={cn("relative h-6 w-fit overflow-hidden text-lg font-medium text-foreground", className)}
>
	<span class="word block" aria-hidden="true">{label}</span>
</div>

<style>
	/* The word travels 100% → 0% → -100% over three equal intervals — evenly spaced stops.
	   The animation loops rather than alternates, so
	   the word snaps from above the slot back to below it; the snap happens off-screen, which is why
	   the loop reads as one word after another rather than as a jump. */
	@keyframes loader-apple-text-reveal-scroll {
		0% {
			transform: translateY(100%);
		}
		50% {
			transform: translateY(0%);
		}
		100% {
			transform: translateY(-100%);
		}
	}

	.word {
		/* The rest state: the word parked in the slot, legible. The two endpoints of this animation
		   are both off-screen, so freezing on either of them would leave an empty box — the one thing
		   a reduced-motion frame must not be. While the animation runs this value never shows: the
		   keyframes declare `transform` at both ends. */
		transform: translateY(0%);

		/* `ease-in-out` is exactly CSS's keyword —
		   cubic-bezier(0.42, 0, 0.58, 1) — and not Tailwind's `--ease-in-out`. */
		animation: loader-apple-text-reveal-scroll 2s ease-in-out infinite;
	}
</style>
