<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type TextGradientRootProps = WithElementRef<
		HTMLAttributes<HTMLSpanElement>,
		HTMLSpanElement
	> & {
		/**
		 * How far the band reaches either side of its centre — half its width.
		 *
		 * A number is pixels, as upstream. A string is any CSS length, and `em` is the one worth
		 * reaching for: it resolves against the element's own font size, so the band keeps its
		 * proportion to the type it is sweeping through (divergence D-01).
		 * @default "1.375em"
		 */
		spread?: number | string;
		/**
		 * The colour of the travelling band. Any CSS colour; a token is the house answer
		 * (divergence D-02).
		 * @default "var(--foreground)"
		 */
		highlightColor?: string;
		/**
		 * The colour of the text the band travels through.
		 * @default "var(--muted-foreground)"
		 */
		baseColor?: string;
		/**
		 * Seconds for one pass.
		 *
		 * A pass is measured in element widths, not pixels, so this is a period and not a speed:
		 * a long phrase and a short one given the same duration finish together, which means the
		 * band crosses the long one faster. Nothing here can fix that without measuring the
		 * element (divergence D-03).
		 *
		 * The width being measured is the BOX, not the words. Hand this component to a flex or grid
		 * container and its `inline-block` is blockified away; in a column it then stretches to the
		 * container, and the band spends most of the pass crossing empty space beside the text.
		 * `align-items: start` on that container is the fix, and it is the caller's to make.
		 * @default 2
		 */
		duration?: number;
	};

	/** Upstream-parity alias of {@link TextGradientRootProps}. */
	export type TextGradientProps = TextGradientRootProps;
</script>

<script lang="ts">
	import { textGradientCustomProperties } from "./text-gradient.svelte.js";

	/**
	 * Text under a travelling highlight — the "the model is thinking" label, an effect the AI-era
	 * ecosystem converged on.
	 *
	 * HOW IT DRAWS, because nothing about it is guessable from the props. Two background layers
	 * sit under `background-clip: text`, so the text is a window onto them rather than ink: a flat
	 * `baseColor` fill at the element's own size, and above it a transparent → `highlightColor` →
	 * transparent band on a layer 250% as wide. Animating `background-position` from 100% to 0%
	 * drags that band across the window, and because the wide layer is 2.5 element widths, one
	 * pass moves it exactly 1.5 of them — from a quarter-width off the left edge to a quarter-width
	 * off the right. That clearance is a quarter of the ELEMENT, not a constant, so a label
	 * narrower than four spreads (about 82px at the default, at this theme's body size) still shows
	 * a sliver of the band when the loop wraps. Widening the layer past 250% would buy the
	 * clearance back at the cost of a longer travel for the same duration; upstream's number is
	 * kept.
	 *
	 * THE ONE PART, and no `child` snippet. The keyframes are scoped component CSS, so the effect
	 * cannot be lent to an element this component does not render: the scoping class is
	 * compiler-generated and a caller's own element would never carry it. Same constraint, same
	 * answer as `ui/shake`.
	 *
	 * DIVERGENCES
	 *
	 *   D-01  `spread` takes a CSS length as well as a number, and defaults to `1.375em` where
	 *         upstream defaults to `22` px (`text-gradient.tsx:39`, `:49`). 1.375em is upstream's
	 *         22px exactly at the 16px root a stock Tailwind app has, and 20.6px at this theme's
	 *         body size — `--text-sm`/`--text-base` are both 0.9375rem in `src/app.css`, so the
	 *         default rendering is upstream's to within 6%. What changes is every other size: a px
	 *         band is a fixed 44px whatever it sweeps, which is 2.9em wide at the body size and
	 *         1.2em at `text-4xl`, less than half the relative width. An em band is 2.75em at both.
	 *         Upstream's own documentation demonstrates the effect at three sizes without adjusting
	 *         it.
	 *   D-02  `highlightColor` defaults to `var(--foreground)`, not upstream's `var(--background)`.
	 *         Upstream's band is a hole punched in the text, which only
	 *         reads where the text sits directly on the page ground — inside a Card, a Popover or
	 *         an Alert it paints the page's colour over type that is not on the page, and in this
	 *         theme `--background` (#f4f6f8) and `--card` (#fbfbfb) differ, so the hole shows as a
	 *         smear. Sweeping UP to the strongest ink on the surface is surface-independent. The
	 *         upstream look is one prop away and the page demonstrates it.
	 *   D-03  `duration` defaults to `2`, upstream's actual default,
	 *         rather than the `3` its prop table claims. That table is
	 *         stale in three places at once — it also documents `hsl(var(--background))` and
	 *         `hsl(var(--muted-foreground))` for two defaults the same file writes without the
	 *         `hsl()` (`text-gradient.tsx:15-19` and `:21-25` against `:40-41`), a Tailwind v3
	 *         leftover. `ui/marquee` made the opposite call for `pauseOnKeyboard`, letting a
	 *         published prop table outrank its own source; that was a table nothing contradicted.
	 *         This one contradicts itself, so the code wins.
	 *   D-04  The paint is one scoped rule and the keyframes are hoisted into the bundle's
	 *         stylesheet. Upstream renders a style ELEMENT inside every span,
	 *         so a list of ten shimmering labels ships ten copies of
	 *         the same keyframes into the DOM. (Written without its angle brackets on purpose:
	 *         with them, `npm run check` reports this file's script as unclosed — `svelte2tsx`
	 *         takes the mention inside this comment for a real tag. The Svelte compiler itself
	 *         builds the file either way.)
	 *   D-05  `background-repeat: no-repeat` is actually applied. Upstream's
	 *         `[background-repeat:no-repeat,padding-box]` names a value
	 *         `background-repeat` does not have, so the whole declaration is invalid and dropped,
	 *         and the layers tile. Nothing renders differently for it, at any `spread`: `spread`
	 *         moves colour stops, never the layer, and a layer 2.5 element widths wide covers the
	 *         box at every frame of the sweep, so the neighbouring tiles stay off it. This is
	 *         hygiene — the declaration now says what it was written to say instead of being
	 *         silently discarded.
	 *   D-06  `prefers-reduced-motion`, print and forced colours each drop the effect and paint
	 *         `baseColor` as ordinary text. Upstream handles none of the three, and the three are
	 *         NOT one case with three names — only the second is a legibility bug:
	 *           reduced motion   the label is perfectly legible; it is the endless two-second loop
	 *                            that the setting exists to be spared.
	 *           print            browsers omit background images from print by default, and here
	 *                            the text's colour IS a background — so an unhandled label prints
	 *                            as blank paper.
	 *           forced colours   the UA forces `color` itself, so nothing is lost; what is left is
	 *                            an animation repainting a gradient the reader cannot see, under a
	 *                            palette they asked to have flattened. It goes with the other two.
	 *   D-07  A caller's `style` is composed AFTER the custom properties, so it wins. Upstream
	 *         spreads the caller's style in the middle of its own object,
	 *         which lets it override the spread and nothing else.
	 */
	let {
		ref = $bindable(null),
		spread = "1.375em",
		highlightColor = "var(--foreground)",
		baseColor = "var(--muted-foreground)",
		duration = 2,
		class: className,
		style,
		children,
		...restProps
	}: TextGradientRootProps = $props();

	const customProperties = $derived(
		textGradientCustomProperties({ spread, highlightColor, baseColor, duration }),
	);
</script>

<span
	bind:this={ref}
	data-slot="text-gradient"
	{...restProps}
	style={style ? `${customProperties} ${style}` : customProperties}
	class={cn("inline-block bg-clip-text text-transparent", className)}
>
	{@render children?.()}
</span>

<style>
	/*
	 * ONLY THE PAINT IS SCOPED. `display`, `background-clip` and `color` stay on the element as
	 * utility classes so a caller can still evict them — Tailwind v4 emits its utilities inside
	 * `@layer utilities`, and unlayered styles beat layered ones no matter how specific, so
	 * anything written here outranks a caller's `inline` or `text-primary` outright. The four
	 * properties below are exactly the ones a caller should not be able to half-override; the
	 * three above are exactly the ones they should.
	 */
	[data-slot="text-gradient"] {
		background-image:
			linear-gradient(
				90deg,
				transparent calc(50% - var(--text-gradient-spread)),
				var(--text-gradient-highlight) 50%,
				transparent calc(50% + var(--text-gradient-spread))
			),
			linear-gradient(var(--text-gradient-base), var(--text-gradient-base));
		/* The band's layer is 2.5 element widths; the fill's is exactly one, so its position never
		   matters and the keyframes below can move both. */
		background-size:
			250% 100%,
			100% 100%;
		background-repeat: no-repeat;
		animation: text-gradient-sweep var(--text-gradient-duration) linear infinite;
	}

	/* Upstream's keyframes verbatim, renamed off `-shift`: it is the
	   background that shifts and the band that sweeps, and the band is the thing being described. */
	@keyframes text-gradient-sweep {
		from {
			background-position: 100% center;
		}
		to {
			background-position: 0% center;
		}
	}

	/*
	 * Three conditions, one answer — for three different reasons, set out in divergence D-06 above.
	 *
	 * `baseColor` rather than `highlightColor` is deliberate: the band is narrow, so the colour
	 * this label wears almost all the time IS the base. Falling back to it is falling back to what
	 * everyone else effectively sees, and it settles into the surrounding secondary text instead
	 * of standing out for the one reader who asked for less.
	 */
	@media (prefers-reduced-motion: reduce), (forced-colors: active), print {
		[data-slot="text-gradient"] {
			background-image: none;
			animation: none;
			color: var(--text-gradient-base);
		}
	}
</style>
