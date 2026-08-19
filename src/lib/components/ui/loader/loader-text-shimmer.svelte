<script lang="ts">
	import { cn } from "$lib/utils.js";

	import type { LoaderTextProps } from "./loader.svelte.js";

	/**
	 * A word with a highlight sweeping across it.
	 *
	 * TWO LAYERS, ONE MASKED. The word is rendered twice: a quiet copy underneath and a bright copy
	 * on top whose alpha mask is a moving gradient, so the bright ink only shows where the mask's
	 * bright band is. The animated `mask-position` is written prefixed AND
	 * unprefixed — see the block below for why it
	 * cannot be left to a build step.
	 *
	 * THE ROOT CARRIES ITS OWN WIDTH (`w-fit`), because `mask-size: 200% 100%` and the sweep's
	 * `mask-position` are percentages of this box. A block `<div>` dropped into a card or a flex
	 * column stretches to the container, and a 600px box turns the travelling highlight into a
	 * 600px band crossing 1200px — a slow uniform fade of the whole word instead of a band moving
	 * through the letters, which is the one thing this loader exists to show.
	 *
	 * THE QUIET COPY IS A TOKEN, AND THAT IS LOAD-BEARING. A fixed pale literal for the base word
	 * would leave dark mode with a near-white base under a white bright copy —
	 * a shimmer with nothing to move against.
	 * `text-muted-foreground` under `text-foreground` is the same relationship in both themes, which
	 * is the whole reason this repo styles through tokens instead of `dark:` pairs.
	 *
	 * BOTH COPIES ARE `aria-hidden`. Two identical words in the accessibility tree read as
	 * "Thinking Thinking" in a screen reader's browse mode; the root's `aria-label` is the one name
	 * this loader has, and `label` feeds both it and the visible text so they cannot disagree.
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

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="text-shimmer"
	{role}
	aria-label={ariaLabel}
	class={cn("relative w-fit text-lg font-medium", className)}
>
	<span class="text-muted-foreground" aria-hidden="true">{label}</span>
	<span class="shimmer absolute inset-0 text-foreground" aria-hidden="true">{label}</span>
</div>

<style>
	/* The sweep: `mask-position` 100% 0% → -100% 0%. With a mask twice the width of the box, a
	   percentage position resolves to `(box − mask) × p`, so 100% parks the mask's bright centre on
	   the left edge and −100% has carried it a full box-width past the right edge. */
	@keyframes loader-text-shimmer-sweep {
		from {
			-webkit-mask-position: 100% 0%;
			mask-position: 100% 0%;
		}
		to {
			-webkit-mask-position: -100% 0%;
			mask-position: -100% 0%;
		}
	}

	.shimmer {
		/* BOTH SPELLINGS OF EVERY MASK PROPERTY, and the prefixed one is not optional. Unprefixed
		   `mask-*` shipped in Chrome 120; Tailwind v4's baseline reaches back to Chrome 111, so on
		   111-119 an unprefixed-only mask is ignored outright — the bright copy then sits fully
		   opaque over the quiet one and there is no shimmer at all, in either theme.

		   Nothing in this build would add the prefix for us: `svelte.config.js` declares no
		   preprocessor, there is no postcss config and no browserslist, and `@tailwindcss/vite`'s
		   Lightning CSS pass only sees `src/app.css`, never a component's scoped block. The repo's
		   other mask users are prefix-safe by accident of where they are written — `ui/scroller`
		   and `ui/event-calendar` write theirs as Tailwind arbitrary utilities, which DO go through
		   Lightning CSS. Moving the same declaration into a `<style>` block moves it out of reach.

		   `black` and `transparent` here are alpha, not colour — for a gradient mask the browser
		   reads the alpha channel, so these two keywords mean "opaque" and "cut out" and no token
		   applies. The ink itself is `text-foreground`, on the element. */
		-webkit-mask-image: linear-gradient(90deg, transparent 0%, black 50%, transparent 100%);
		mask-image: linear-gradient(90deg, transparent 0%, black 50%, transparent 100%);
		-webkit-mask-size: 200% 100%;
		mask-size: 200% 100%;

		/* The rest state, chosen rather than inherited: `mask-position`'s initial value is `0% 0%`,
		   which parks the bright band on the right edge and leaves most of the word unlit. 50% puts
		   it over the middle, so the frame reduced motion freezes on is the word half-lit — legible,
		   obviously mid-something, and then breathed by the shared root pulse in `src/app.css`.
		   While the animation runs this value never shows: the keyframes declare both ends. */
		-webkit-mask-position: 50% 0%;
		mask-position: 50% 0%;

		/* `mask-repeat` is deliberately left at its `repeat` default: the
		   tiled copies are what let the highlight re-enter from the left instead of jumping when the
		   cycle restarts. */

		animation: loader-text-shimmer-sweep 1.5s linear infinite;
	}
</style>
