<script lang="ts" module>
	import { cn } from "$lib/utils.js";
	import { tv } from "tailwind-variants";

	import type { ScrollerRootProps } from "$lib/components/ui/scroller/index.js";

	/** Every value `layout` accepts, upstream's one behaviour first. */
	export const SUGGESTION_LAYOUTS = ["scroll", "wrap"] as const;

	/** How the strip lays its chips out: one scrolling line, or as many lines as they need. */
	export type SuggestionLayout = (typeof SUGGESTION_LAYOUTS)[number];

	/**
	 * Normalise a possibly untyped runtime value to a known layout.
	 * Anything outside {@link SUGGESTION_LAYOUTS} falls back to `"scroll"`.
	 */
	export function resolveSuggestionLayout(value?: string): SuggestionLayout {
		return SUGGESTION_LAYOUTS.includes(value as SuggestionLayout)
			? (value as SuggestionLayout)
			: "scroll";
	}

	/**
	 * The inner strip — upstream's `flex w-max flex-nowrap items-center gap-2` (`suggestion.tsx`
	 * L20), plus the padding divergence D-03 below explains and a `wrap` layout it never had.
	 *
	 * `w-max` is what keeps the chips on one line: a max-content box is as wide as its content
	 * and so never has a reason to wrap, which is also why `flex-wrap` alone could never turn it
	 * into a grid — the `wrap` layout has to swap the width to `w-full` at the same time.
	 */
	export const suggestionVariants = tv({
		base: "flex items-center gap-2 p-1",
		variants: {
			layout: {
				scroll: "w-max flex-nowrap",
				wrap: "w-full flex-wrap",
			},
		},
		defaultVariants: {
			layout: "scroll",
		},
	});

	export type SuggestionRootProps = Omit<
		ScrollerRootProps,
		"orientation" | "child" | "hideScrollbar"
	> & {
		/**
		 * How the strip lays its chips out.
		 *
		 * `scroll` keeps them on one line inside a horizontal scroll container that fades the edge
		 * where chips hide; `wrap` lets them flow onto as many lines as they need, and the container
		 * then has nothing to scroll. An unknown runtime value normalises to `scroll`.
		 * @default "scroll"
		 */
		layout?: SuggestionLayout;
		/**
		 * Whether to hide the scroll container's native scrollbar. Redeclared rather than inherited
		 * because the Scroller's own declaration says `@default false` and this part flips it: the
		 * edge fade stays either way (D-01 below).
		 * @default true
		 */
		hideScrollbar?: boolean;
	};

	/** Upstream-parity alias of {@link SuggestionRootProps} — upstream's `SuggestionsProps`. */
	export type SuggestionsProps = SuggestionRootProps;
</script>

<script lang="ts">
	import * as Scroller from "$lib/components/ui/scroller/index.js";

	/**
	 * A horizontal strip of suggestion chips — the "try asking…" starters under an empty chat and
	 * the follow-ups after an answer. Port of AI Elements' `suggestion.tsx`: `Suggestions` is this
	 * root, `Suggestion` is `suggestion-item.svelte`.
	 *
	 * TWO ELEMENTS, ONE PART. Upstream renders a `ScrollArea` around a `w-max` strip, and the split
	 * is load-bearing: the outer element is the thing that scrolls and the inner element is the
	 * thing that is wider than it. Props are split the way upstream splits them — `class` lands on
	 * the STRIP (upstream's `className`, `suggestion.tsx` L20), because that is the only element
	 * where a layout class such as `justify-center` means anything, and every other attribute,
	 * `ref` included, lands on the scroll container (upstream's `...props` on the `ScrollArea`).
	 *
	 * The stamp is `data-slot="suggestion"` on the container: it REPLACES the Scroller's own
	 * `data-slot="scroller"`, which is safe because nothing in `src/app.css` selects that value —
	 * the Scroller's edge-fade classes match its `data-*-scroll` attributes, not its slot.
	 *
	 * The container is scrollable but not focusable, and that is correct rather than an omission:
	 * the WCAG 2.1.1 rule that gives a scroll region `tabindex="0"` (`code-block-content.svelte`)
	 * is for regions with no focusable content. Every chip here is a `<button>`, and focusing one
	 * scrolls it into view, so the keyboard already reaches everything the strip holds.
	 *
	 * DIVERGENCES
	 *
	 *   D-01  `Scroller`, not `ScrollArea`. Upstream mounts a `ScrollBar` and hides it
	 *         (`suggestion.tsx` L23), which ships a scroll container with no affordance at all:
	 *         nothing says a fifth chip exists past the fourth. The Scroller keeps native scrolling
	 *         and fades the edge where chips hide, which is the affordance a hidden scrollbar
	 *         took away; its `withNavigation` buttons pass through for the mouse user whose wheel
	 *         only scrolls vertically. The scrollbar itself stays hidden by default, as upstream.
	 *   D-02  A `layout` variant. Upstream's strip cannot wrap — `w-max` is the reason, see
	 *         `suggestionVariants` — so the origin app's empty state lays its starters out in a
	 *         plain `div` of its own (`chat.tsx` L118) and forgoes the component entirely. `wrap`
	 *         keeps the part and its stamp for both arrangements.
	 *   D-03  The strip pads itself by 4px on every side and the container pulls the horizontal
	 *         4px back with `-mx-1`. `overflow-x: auto` clips at the padding box, and a Button's
	 *         focus ring is a 3px box-shadow that `active:` pushes a further 1px down, so
	 *         upstream's chips lose their focus indicator exactly where WCAG 2.4.7 requires one.
	 *         The padding buys the clearance; the negative margin keeps the first chip flush with
	 *         whatever sits above the strip instead of 4px indented from it.
	 *   D-04  No `cursor-pointer` on the chips. The base layer paints the hand on every `<button>`
	 *         (`docs/CONVENTIONS.md` §8), so the component writes nothing.
	 */
	let {
		ref = $bindable(null),
		layout = "scroll",
		hideScrollbar = true,
		class: className,
		children,
		...restProps
	}: SuggestionRootProps = $props();

	const resolvedLayout = $derived(resolveSuggestionLayout(layout));
</script>

<Scroller.Root
	bind:ref
	data-slot="suggestion"
	data-layout={resolvedLayout}
	orientation="horizontal"
	{hideScrollbar}
	class="-mx-1"
	{...restProps}
>
	<div
		data-slot="suggestion-strip"
		class={cn(suggestionVariants({ layout: resolvedLayout }), className)}
	>
		{@render children?.()}
	</div>
</Scroller.Root>
