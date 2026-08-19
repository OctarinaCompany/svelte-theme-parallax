<script lang="ts">
	import { cn } from "$lib/utils.js";

	import type { LoaderTextProps } from "./loader.svelte.js";

	/**
	 * The iPhone lock-screen sweep: quiet text with a bright band travelling through it.
	 *
	 * THERE IS NO `theme` PROP. This repo themes through the `dark` class and the tokens in
	 * `src/app.css`, and a prop that also decided light-or-dark would be a second source of truth
	 * free to disagree with the document.
	 *
	 * THE GRADIENT STOPS ARE TOKENS, WRITTEN LONGHAND. The utility spelling —
	 * `bg-gradient-to-r from-transparent via-current to-transparent` on an element that also sets
	 * its text colour AND `text-transparent` — would hinge on two classes that
	 * both set `color`, and which one wins is decided by Tailwind's emission order rather than by
	 * the order they are written in — and if `text-transparent` wins, `via-current` resolves to
	 * transparent and the sweep is invisible. Writing the gradient in the style block below with an
	 * explicit `var(--foreground)` mid-stop removes the coin flip: `color` is transparent because
	 * `background-clip: text` needs it to be, and the band's colour is stated rather than inherited.
	 * This is the one sanctioned exception to "colour lives in the markup as a token utility" — a
	 * gradient stop cannot be expressed as a utility once the element's own `color` is spoken for.
	 *
	 * `--foreground` is the same token `text-foreground` compiles to, so the sweep tracks the theme
	 * and the eleven generated palettes exactly as a utility would.
	 *
	 * THE ROOT CARRIES ITS OWN WIDTH (`w-fit`). Every percentage in the block below is measured
	 * against this box — `background-size: 200% 100%` and a `background-position` that travels
	 * 400% of it. A block `<div>` in a card or a flex column stretches to the container, so a
	 * 600px-wide box turns the travelling band into a 600px gradient crossing 2400px, i.e. a slow
	 * uniform fade of the whole word rather than a band moving through the letters.
	 */
	let {
		ref = $bindable(null),
		label = "Slide to unlock",
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
	data-loader="apple-unlock"
	{role}
	aria-label={ariaLabel}
	class={cn("relative w-fit text-sm font-medium tracking-wide select-none", className)}
>
	<span class="text-muted-foreground" aria-hidden="true">{label}</span>
	<span class="sweep absolute inset-0" aria-hidden="true">{label}</span>
</div>

<style>
	/* `background-position` travels 200% 0 → -200% 0. With a background twice
	   the box width, a full 400% of travel carries the band in from beyond one edge and out past the
	   other, which is the long pause between sweeps the lock screen actually has. */
	@keyframes loader-apple-unlock-sweep {
		from {
			background-position: 200% 0;
		}
		to {
			background-position: -200% 0;
		}
	}

	.sweep {
		background-image: linear-gradient(
			to right,
			transparent 0%,
			var(--foreground) 50%,
			transparent 100%
		);
		background-size: 200% 100%;

		/* The rest state: the band centred on the word, so reduced motion leaves a half-lit label
		   rather than an empty box. `background-position`'s initial `0% 0%` would park the band on
		   the right edge. */
		background-position: 50% 0;

		/* The glyphs become the paint surface; `color: transparent` is what lets the gradient show
		   through them instead of the text colour covering it.

		   THE `-webkit-` PREFIX IS WRITTEN BY HAND, and every prefixed property in this folder has
		   to be. Nothing in this build adds one to a Svelte scoped block: `svelte.config.js` is
		   `export default {}` so there is no `vitePreprocess`, the repo has no postcss config and
		   no browserslist, and `@tailwindcss/vite`'s Lightning CSS pass only touches the stylesheet
		   carrying the Tailwind directives (`src/app.css`) — never a component's `<style>`. The
		   same declaration written as the utility `bg-clip-text` WOULD be prefixed, which is the
		   trap: it looks like the two spellings are interchangeable and they are not.

		   Unprefixed `background-clip: text` is Safari 18+. Without the prefix, Safari 16.4-17
		   drops this line and keeps `color: transparent`, so the gradient paints the element's
		   whole rectangle as a sweeping band and the word disappears. `loader-text-shimmer.svelte`
		   carries the same hazard on `mask-*`. */
		-webkit-background-clip: text;
		background-clip: text;
		color: transparent;

		animation: loader-apple-unlock-sweep 2.2s linear infinite;
	}
</style>
