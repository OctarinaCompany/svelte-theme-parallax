<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import type { ContextCost, TokenUsage } from "./context-usage.svelte.js";

	export type ContextUsageRootProps = WithElementRef<
		HTMLAttributes<HTMLSpanElement>,
		HTMLSpanElement
	> & {
		/** Tokens currently occupying the model's context window. */
		usedTokens: number;
		/**
		 * The window's size in tokens. A value that is not a finite number greater than zero makes
		 * every ratio read as `0` rather than `NaN`.
		 */
		maxTokens: number;
		/** Per-kind token counts for the usage rows. A row with no count renders nothing. */
		usage?: TokenUsage;
		/**
		 * Per-kind dollar figures for the usage rows and the footer. A row shows its figure only
		 * when the matching field is present; the footer renders nothing without one.
		 */
		cost?: ContextCost;
		/**
		 * The model the window belongs to. Stamped as `data-model` and carried on the state for a
		 * custom body; no default part renders it, since the cost is supplied rather than looked up.
		 */
		modelId?: string;
		/** Whether the popover is showing. Bindable. */
		open?: boolean;
		/** Fired when the hover card opens or closes itself, never for a parent-driven write. */
		onOpenChange?: (open: boolean) => void;
		/**
		 * Milliseconds the pointer rests on the trigger before the card opens.
		 * @default 0
		 */
		openDelay?: number;
		/**
		 * Milliseconds after the pointer leaves before the card closes.
		 * @default 0
		 */
		closeDelay?: number;
		/**
		 * Whether a pointer-driven focus on the trigger is ignored, so only keyboard focus opens the
		 * card. Bits UI's `LinkPreview.Root` prop, forwarded.
		 */
		ignoreNonKeyboardFocus?: boolean;
	};

	/** Alias of {@link ContextUsageRootProps}, present for parity with the upstream type name. */
	export type ContextUsageProps = ContextUsageRootProps;
</script>

<script lang="ts">
	import * as HoverCard from "$lib/components/ui/hover-card/index.js";
	import { ContextUsageState, setContextUsageContext } from "./context-usage.svelte.js";

	/**
	 * How full the model's context window is: a percentage and a ring in a toolbar, and on
	 * hover or focus a card with the used-of-max figures, a bar, one row per kind of token and
	 * the call's cost.
	 *
	 * A port of AI Elements' `Context`, renamed: `context` alone names a Svelte primitive and the
	 * accessor pattern every folder in this kit uses, and a `getContextContext()` is a name nobody
	 * should have to write.
	 *
	 * WHAT DIVERGES FROM UPSTREAM, AND WHY:
	 *
	 * 1. THE COST IS SUPPLIED, NOT LOOKED UP. Upstream prices every row from `modelId` through
	 *    `tokenlens` and prints `$0.00` for a model its table does not know. The kit takes a
	 *    `cost` object instead (`context-usage.svelte.ts` says why), a row shows its figure only
	 *    when the field exists, and the footer renders nothing without a total — a false zero is
	 *    worse than a blank.
	 *
	 * 2. THE ROOT RENDERS AN ELEMENT. Upstream's `Context` is a provider around a headless
	 *    `HoverCard` and paints nothing. Every component in this kit publishes its state as data
	 *    attributes on a root, and there has to be an element to carry `data-percent`,
	 *    `data-state` and `data-model`; the `<span>` is `inline-flex`, so it sits in a toolbar
	 *    exactly where the trigger button would have.
	 *
	 * 3. THE RATIO IS CLAMPED AND GUARDED. Upstream divides the raw props: an overrun window reads
	 *    `120%` and hands the ring a negative dash offset, and a `maxTokens` of `0` prints `NaN`.
	 *    Here the ratio lives in `[0, 1]` and a non-positive window reads as empty; see
	 *    `usedRatio` in `context-usage.svelte.ts`.
	 *
	 * 4. THE ICON IS THE HOUSE `CircularProgress`, not a hand-rolled `<svg role="img">`. It is
	 *    painted in the kit's track and range tokens rather than upstream's two opacities of
	 *    `currentColor`, and standing alone — a status bar, a table cell — it is a real
	 *    `role="progressbar"` whose `aria-valuenow` tracks the window. Inside the trigger that role
	 *    is not exposed: the icon is a descendant of the trigger's `<button>`, and ARIA makes the
	 *    children of `role="button"` presentational, so the progressbar and its `aria-value*` are
	 *    dropped from the accessibility tree there. Nothing is lost, since the trigger's own text
	 *    carries the percentage.
	 *
	 * 5. THE TRIGGER IS `size="sm"`. Upstream uses the default button size; the home of this
	 *    control is a prompt footer beside small buttons, and the house ramp names that rung `sm`
	 *    (`docs/CONVENTIONS.md` §3).
	 *
	 * 6. DOLLARS CARRY UP TO FOUR DECIMALS. Upstream's two-decimal currency format prints a
	 *    `$0.0048` input cost as `$0.00`, and per-call figures are mostly fractions of a cent.
	 *
	 * SMALLER ONES, recorded so they are not read as oversights: `space-y-2` is `flex` + `gap`
	 * (house rule); the usage rows keep their wrapper element in `children` mode so the
	 * `data-slot` is always stamped, where upstream returns the children bare; and the
	 * `Intl.NumberFormat` instances are built once at module scope rather than on every render.
	 *
	 * `onOpenChange` fires only when the hover card opens or closes itself — pointer, focus,
	 * Escape — never for a parent-driven write, which is Bits UI's contract for a bound prop
	 * (`LinkPreview.Root` in the Bits UI docs, "State management").
	 */
	let {
		ref = $bindable(null),
		class: className,
		usedTokens,
		maxTokens,
		usage,
		cost,
		modelId,
		open = $bindable(false),
		onOpenChange,
		openDelay = 0,
		closeDelay = 0,
		ignoreNonKeyboardFocus,
		children,
		...restProps
	}: ContextUsageRootProps = $props();

	const state = new ContextUsageState({
		getUsedTokens: () => usedTokens,
		getMaxTokens: () => maxTokens,
		getUsage: () => usage,
		getCost: () => cost,
		getModelId: () => modelId,
	});

	setContextUsageContext(state);
</script>

<span
	bind:this={ref}
	data-slot="context-usage"
	data-percent={state.percent}
	data-state={open ? "open" : "closed"}
	data-model={modelId}
	class={cn("inline-flex", className)}
	{...restProps}
>
	<HoverCard.Root bind:open {onOpenChange} {openDelay} {closeDelay} {ignoreNonKeyboardFocus}>
		{@render children?.()}
	</HoverCard.Root>
</span>
