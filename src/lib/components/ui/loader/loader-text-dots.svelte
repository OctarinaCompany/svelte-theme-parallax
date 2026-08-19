<script lang="ts">
	import { cn } from "$lib/utils.js";

	import type { LoaderTextProps } from "./loader.svelte.js";

	/**
	 * A word followed by three dots that arrive one after another and leave together.
	 *
	 * THE STAGGER IS IN THE `times:` ARRAYS, AND THERE IS NO `delay` IN THIS FILE AT ALL. All three
	 * dots run the same 2s cycle from the same start, and what separates them is where each one's
	 * keyframes sit inside it: `times: [0, 0.2, 0.8, 1]`, `[0, 0.4, 0.8, 1]`, `[0, 0.6, 0.8, 1]`.
	 * Those numbers ARE the percentages — multiply by 100 — so the
	 * equal-interval rule that governs a bare value array does not apply here. Spacing the four
	 * stops evenly instead would give `0% 33% 66% 100%` three times over and three dots that blink
	 * in unison, with nothing in `svelte-check` to say so. Hence three keyframe sets rather than one
	 * shared set plus a delay.
	 *
	 * Note also that dot 1 fades UP through 20% while dots 2 and 3 are still at zero
	 * (`opacity: [0, 1, 1, 0]` against `[0, 0, 1, 0]`), which is why dot 1's second stop is `1` and
	 * the others' is `0`. All three then drop together at 80%.
	 *
	 * Every one of these stops runs on plain `ease-in-out`.
	 *
	 * `text-zinc-900 dark:text-white` is primary ink — the light-mode shade decides, and the `dark:`
	 * half is dropped because `--foreground` already carries both themes.
	 */
	let {
		ref = $bindable(null),
		label = "Thinking",
		class: className,
		role = "status",
		"aria-label": ariaLabel = label,
		...restProps
	}: LoaderTextProps = $props();
</script>

<!--
	The dots' `w-6` is load-bearing: the dot box is reserved
	at full width so the word never shifts as dots appear and vanish.

	THE ROOT WIDTH IS A FLOOR, NOT A FIXED BOX. A bare `w-24` — 96px
	measured against the default word — would not survive a caller's `label`: a longer one
	inside a fixed 96px flex row does not simply overhang: the text item's `min-width: auto` lets it
	shrink to its min-content, so a two-word label wraps onto a second line and the dots end up
	beside a paragraph. `min-w-24` keeps the default label rendering at exactly 96px and
	`w-fit` lets any other label size the box — which is what `loader-text-blink.svelte` and
	`loader-text-shimmer-wave.svelte` already do, for the same reason.
-->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="text-dots"
	{role}
	aria-label={ariaLabel}
	class={cn("flex w-fit min-w-24 text-lg font-medium text-foreground", className)}
>
	<!-- The root's `aria-label` is this loader's one accessible name, so EVERYTHING below it is
	     hidden. `role="img"` collapses its subtree to presentational only while nothing inside claims
	     to be text, so an unhidden word would be announced a second time after the label — and three
	     lone full stops read as "dot dot dot" in a screen reader's browse mode and mean nothing
	     there. The rest of this folder's text loaders hide their word the same way. -->
	<span aria-hidden="true">{label}</span>
	<span class="flex w-6 pl-0.5" aria-hidden="true">
		<span class="dot-1">.</span>
		<span class="dot-2">.</span>
		<span class="dot-3">.</span>
	</span>
</div>

<style>
	/* `times: [0, 0.2, 0.8, 1]` with `opacity: [0, 1, 1, 0]`. */
	@keyframes loader-text-dots-blink-1 {
		0% {
			opacity: 0;
		}
		20% {
			opacity: 1;
		}
		80% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}

	/* `times: [0, 0.4, 0.8, 1]` with `opacity: [0, 0, 1, 0]` — it holds at zero
	   until 40%, then rises across the interval dot 1 spends already lit. */
	@keyframes loader-text-dots-blink-2 {
		0% {
			opacity: 0;
		}
		40% {
			opacity: 0;
		}
		80% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}

	/* `times: [0, 0.6, 0.8, 1]` with `opacity: [0, 0, 1, 0]`. */
	@keyframes loader-text-dots-blink-3 {
		0% {
			opacity: 0;
		}
		60% {
			opacity: 0;
		}
		80% {
			opacity: 1;
		}
		100% {
			opacity: 0;
		}
	}

	/* The rest states are chosen, not inherited. Every one of these cycles starts at `opacity: 0`
	   and there is no delay to seek past it, so frame 0 is three invisible dots — a frozen frame
	   that says the loader is broken rather than busy. A 1 / 0.55 / 0.2 staircase is the picture
	   mid-cycle: an ellipsis being typed, which is exactly what the animation is drawing. */
	.dot-1 {
		opacity: 1;
		animation: loader-text-dots-blink-1 2s ease-in-out infinite;
	}

	.dot-2 {
		opacity: 0.55;
		animation: loader-text-dots-blink-2 2s ease-in-out infinite;
	}

	.dot-3 {
		opacity: 0.2;
		animation: loader-text-dots-blink-3 2s ease-in-out infinite;
	}
</style>
