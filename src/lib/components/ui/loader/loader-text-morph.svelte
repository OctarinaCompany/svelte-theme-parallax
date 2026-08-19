<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * Two words trading places through a slot: "Loading" leaves upward as "Wait" arrives from below.
	 *
	 *
	 * NO `label` PROP, WHICH IS THE ODD ONE OUT IN THE TEXT FAMILY. Every other worded loader takes
	 * `LoaderTextProps` and lets `label` drive both the visible string and the accessible name. This
	 * one animates TWO hardcoded words against each other, and the shared
	 * prop surface has one `label`, not a pair — wiring `label` to the first word and leaving "Wait"
	 * fixed would give a caller half a knob, which is worse than none. So both words stay fixed,
	 * the type stays `LoaderProps`, and the accessible name is the folder's default.
	 *
	 * BOTH WORDS ARE `aria-hidden`. In the accessibility tree they read as "Loading Wait", which is
	 * not a message; the root's `aria-label` is the one name this loader has.
	 *
	 * THE TWO REST STATES DIFFER ON PURPOSE, and that is why there are two keyframe sets rather than
	 * one plus a half-cycle delay. A shared animation offset by half a cycle would give the same
	 * motion, but under reduced motion both words would freeze in the same place and print on top of
	 * each other. Here the frozen frame is "Loading" parked in the slot and "Wait" waiting below it,
	 * invisible — which is what this loader looks like at any moment a reader would call it still.
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
	The words are the primary ink, `text-foreground`, which carries both themes. The `h-6 w-24`
	box is load-bearing — `overflow-hidden` on a slot this size is what hides the two
	words' arrivals and departures, and both are absolutely positioned so neither pushes the other.
-->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="text-morph"
	{role}
	aria-label={ariaLabel}
	class={cn(
		"relative flex h-6 w-24 items-center justify-center overflow-hidden text-sm font-medium text-foreground",
		className,
	)}
>
	<span class="word word-first absolute" aria-hidden="true">Loading</span>
	<span class="word word-second absolute" aria-hidden="true">Wait</span>
</div>

<style>
	/* The first word: `opacity` 1 → 0 → 0 → 1 with `y` 0 → -16px → 16px → 0 — four values,
	   evenly spaced at 0 / 33.333 / 66.667 / 100%. The two properties
	   merge into one keyframe set because CSS has a single `transform`, and running them as two
	   animations would let them drift apart.

	   The middle leg is the trick: the word crosses the whole slot from −16px to +16px while its
	   opacity is 0 at both ends of that leg, so the return trip is invisible and the word appears to
	   have been replaced rather than to have flown back. */
	@keyframes loader-text-morph-first {
		0% {
			opacity: 1;
			transform: translateY(0);
		}
		33.333% {
			opacity: 0;
			transform: translateY(-16px);
		}
		66.667% {
			opacity: 0;
			transform: translateY(16px);
		}
		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* The second word: `opacity` 0 → 1 → 1 → 0, `y` 16px → 0 → 0 → -16px — the same
	   journey a third of a cycle along, but written out rather than expressed as a delay, because the
	   two words must come to rest in different places (see the component comment). */
	@keyframes loader-text-morph-second {
		0% {
			opacity: 0;
			transform: translateY(16px);
		}
		33.333% {
			opacity: 1;
			transform: translateY(0);
		}
		66.667% {
			opacity: 1;
			transform: translateY(0);
		}
		100% {
			opacity: 0;
			transform: translateY(-16px);
		}
	}

	.word {
		/* `ease-in-out` is exactly CSS's keyword —
		   cubic-bezier(0.42, 0, 0.58, 1) — and not Tailwind's `--ease-in-out`. */
		animation-duration: 3s;
		animation-timing-function: ease-in-out;
		animation-iteration-count: infinite;
	}

	.word-first {
		/* The rest state: the first word in the slot, legible. */
		opacity: 1;
		transform: translateY(0);
		animation-name: loader-text-morph-first;
	}

	.word-second {
		/* The rest state: the second word held below the slot and invisible, so the frozen frame is
		   one readable word rather than two printed over each other. */
		opacity: 0;
		transform: translateY(16px);
		animation-name: loader-text-morph-second;
	}
</style>
