<script lang="ts">
	import { cn } from "$lib/utils.js";

	import type { LoaderTextProps } from "./loader.svelte.js";

	/**
	 * A word with a terminal caret blinking after it.
	 *
	 * THE BLINK IS `linear`, AND THAT IS DELIBERATE. Every other text
	 * loader in this family eases; a caret does not, because a real terminal caret is a square wave
	 * and easing it turns a blink into a throb.
	 *
	 * THE CARET RESTS LIT. `opacity: [1, 0, 1]` starts at full strength and a caret that has stopped
	 * blinking is a caret that is simply there, so the frame reduced motion freezes on is the
	 * visible one — a hidden caret would read as a rendering fault rather than as a paused loader.
	 *
	 * The word and the caret are both primary marks, `text-foreground` / `bg-foreground` — one
	 * token, both themes. No `inline-block` on the caret — it
	 * is a flex item here, and a flex item is blockified whatever its `display` says.
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
	THE ROOT WIDTH IS A FLOOR, NOT A FIXED BOX. A bare `w-20` — 80px
	reserved for the default word plus the caret — would not survive a
	caller's `label`: a longer one inside a fixed 80px flex row does not merely overhang: the
	word is a flex item whose `min-width: auto` lets it shrink to its min-content, so a two-word
	label wraps and the caret lands beside the second line. `min-w-20` keeps the default label
	rendering at exactly 80px and `w-fit` lets any other label size the box, as
	`loader-text-blink.svelte` and `loader-text-shimmer-wave.svelte` already do.
-->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="typing"
	{role}
	aria-label={ariaLabel}
	class={cn("flex w-fit min-w-20 items-center text-lg font-medium text-foreground", className)}
>
	<!-- The word is wrapped so it can be hidden — it was a bare text node, and a text node takes no
	     attributes. The root's `aria-label` is this loader's one accessible name, and `role="img"`
	     collapses its subtree to presentational only while nothing inside claims to be text, so an
	     unhidden word is announced a second time after the name. A `<span>` is a flex item with the
	     same `min-width: auto` the anonymous item it replaces had, so the wrap behaviour the comment
	     above describes is unchanged. -->
	<span aria-hidden="true">{label}</span>
	<span class="caret ml-1 h-4 w-1.5 bg-foreground"></span>
</div>

<style>
	/* The blink: `opacity` 1 → 0 → 1 over 0.8s — three evenly
	   spaced stops whose ends match, so they share a selector. The animation loops rather than
	   alternates, but with matching ends there is nothing to snap. */
	@keyframes loader-typing-blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0;
		}
	}

	.caret {
		opacity: 1; /* the rest state: a caret that has stopped blinking is still a caret */
		animation: loader-typing-blink 0.8s linear infinite;
	}
</style>
