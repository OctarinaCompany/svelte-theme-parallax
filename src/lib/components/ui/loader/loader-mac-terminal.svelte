<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A shell prompt with a blinking block caret.
	 *
	 * NOT A `label` LOADER, EVEN THOUGH IT SHOWS CHARACTERS. `~ %` is a prompt, not a message: it is
	 * part of the picture the way the caret is, and making it a caller's string would invite a
	 * sentence into a two-glyph slot. So the type is `LoaderProps`, the prompt is `aria-hidden`, and
	 * the accessible name is the folder's default — a screen reader hearing "tilde percent" would
	 * learn nothing about the wait.
	 *
	 * NOT AN INVERTED CHIP EITHER. The prompt sits on the page ground with no surface of its
	 * own, so its ink is simply the primary mark and the
	 * whole thing takes the page-ground family. The always-dark rule is for a loader that paints its
	 * own permanently dark surface; this one paints none.
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
	`w-fit` because a block `<div>` stretches to its container and would strand the prompt at the far
	left of it. `gap-1.5` on the row rather than a margin on the caret: the house style
	spaces a flex row with `gap-*` rather than a margin on one child.
-->
<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="mac-terminal"
	{role}
	aria-label={ariaLabel}
	class={cn("flex w-fit items-center gap-1.5 font-mono text-sm text-foreground", className)}
>
	<span aria-hidden="true">~ %</span>
	<!--
		The caret is the primary mark, `bg-foreground`, which carries both themes. `h-4 w-2` is
		a block caret's shape, deliberately not `size-*` — the two differ.
	-->
	<span class="caret inline-block h-4 w-2 bg-foreground"></span>
</div>

<style>
	/* `opacity` runs 1 → 0 → 1 over three equal intervals: on, off, on.
	   First and last values are equal, which is why they share a selector. `linear` is what makes
	   this a hard terminal blink rather than a soft breath. */
	@keyframes loader-mac-terminal-blink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0;
		}
	}

	.caret {
		/* The rest state: the caret showing. A terminal waiting for input has a caret on the line —
		   freezing on the blank half of the blink would leave a prompt with nothing after it, which
		   reads as finished rather than as waiting. */
		opacity: 1;

		animation: loader-mac-terminal-blink 1s linear infinite;
	}
</style>
