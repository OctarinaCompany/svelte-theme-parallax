<script lang="ts">
	import { cn } from "$lib/utils.js";

	import type { LoaderTextProps } from "./loader.svelte.js";

	/**
	 * A small terminal panel with a prompt line and a blinking block caret.
	 *
	 * THIS IS AN INVERTED CHIP, AND THE WHOLE TOKEN FAMILY TURNS OVER INSIDE IT. The panel
	 * imitates a terminal, so
	 * it is dark against a light page and light against a dark one, always the opposite of the
	 * ground. This repo has no permanently-dark surface token and does not want one; what it has is
	 * `bg-foreground` + `text-background`, the pairing `ui/tooltip` already uses. Everything within
	 * flips with it: the `text-zinc-100` body becomes `text-background`, and the quiet
	 * `text-zinc-500 dark:text-zinc-300` prompt line becomes `text-background/70`, the same
	 * quiet-ink weight `loader-dynamic-island.svelte` uses on this ground. Reaching for
	 * `muted-foreground` inside the chip would be the mistake `CONVENTIONS.md` §3 exists to prevent:
	 * a token is only quiet relative to the ground it sits on.
	 *
	 * THE PROMPT IS NOT GREEN, AND THAT IS THE RULE RATHER THAN A PREFERENCE. The classic
	 * terminal-green glyph would be `text-success`, but `--success` is
	 * `#1cde7f` in BOTH themes by deliberate design, so on the dark theme's inverted chip — where
	 * the chip's ground is near-white — that glyph measures roughly 1.7:1. `CONVENTIONS.md` §3
	 * allows the raw status colour as a small FILL, never as ink, which is why
	 * `loader-dynamic-island.svelte` may keep its six-pixel `bg-success` dot and this caret prompt
	 * may not. It takes the chip's full-strength ink instead, which still sets it apart from the
	 * `/70` line above it.
	 *
	 * THE PANEL IS DELIBERATELY FLUID. `w-full h-16`,
	 * because a terminal is a box that takes the width it is given. The rule that a loader root
	 * must state its own width exists to stop a fixed picture stretching, not to pin a width onto
	 * something meant to be elastic.
	 */
	let {
		ref = $bindable(null),
		label = "loading..",
		class: className,
		role = "status",
		"aria-label": ariaLabel = label,
		...restProps
	}: LoaderTextProps = $props();
</script>

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="terminal-loader"
	{role}
	aria-label={ariaLabel}
	class={cn(
		"flex h-16 w-full flex-col justify-end overflow-hidden rounded-md bg-foreground p-3 font-mono text-[10px] text-background shadow-sm",
		className,
	)}
>
	<div class="mb-1 flex leading-none text-background/70">
		<!-- The root's `aria-label` is this loader's one accessible name, so the whole prompt line is
		     hidden: a screen reader reading "dollar" before the label adds nothing, and `role="img"`
		     collapses its subtree to presentational only while nothing inside claims to be text, so an
		     unhidden label would be announced a second time after the name. -->
		<span aria-hidden="true">$</span>
		<span class="ml-2" aria-hidden="true">{label}</span>
	</div>
	<div class="flex items-center leading-none">
		<span aria-hidden="true">&gt;</span>
		<!-- No `block` on the caret: it is a flex
		     item of this row, and a flex item is blockified whatever its `display` says. -->
		<span class="caret ml-2 h-2.5 w-1.5 bg-background"></span>
	</div>
</div>

<style>
	/* The blink: `opacity` 1 → 0 → 1 over 0.8s — three evenly spaced stops whose ends match, so
	   they share a
	   selector. `linear` is the right choice: a terminal caret is a
	   square wave, and easing it would turn the blink into a throb. */
	@keyframes loader-terminal-loader-blink {
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
		animation: loader-terminal-loader-blink 0.8s linear infinite;
	}
</style>
