<script lang="ts" module>
	import type { RatingGroup as RatingGroupPrimitive } from "bits-ui";

	import { cn } from "$lib/utils.js";

	import type { RatingSize } from "./rating.svelte.js";

	/**
	 * Based on the bits-ui `RatingGroup.Root` props rather than plain div attributes — the
	 * editable branch spreads the rest props onto that primitive, whose attribute types are
	 * stricter than `svelte/elements` (`id` is never `null`, for one). Every prop this component
	 * owns or fixes is omitted: `value`/`onValueChange` become `rating`/`onRatingChange`, `max`
	 * becomes `maxRating`, `readonly` is derived from `editable`, and `min`, `orientation` and
	 * `hoverPreview` keep their upstream-equivalent defaults.
	 */
	export type RatingProps = Omit<
		RatingGroupPrimitive.RootProps,
		| "value"
		| "onValueChange"
		| "min"
		| "max"
		| "allowHalf"
		| "disabled"
		| "name"
		| "required"
		| "readonly"
		| "orientation"
		| "hoverPreview"
		| "aria-valuetext"
		| "children"
		| "child"
	> & {
		/**
		 * `aria-valuetext` for the editable slider. Narrowed to the plain-string form — bits-ui
		 * also accepts a `(value, max) => string` function, but the static branch spreads the rest
		 * props onto a plain `<div>` whose attribute types reject functions. The bits-ui default
		 * (`"{value} out of {max}"`) already covers the common case.
		 */
		"aria-valuetext"?: string;
		/**
		 * Current rating value. Decimals render as partially filled stars (`4.6` fills 60% of the
		 * fifth star). Bindable; in editable mode clicks and keyboard input write back into it.
		 */
		rating: number;
		/** Called with the next rating after a real change, click or keyboard. */
		onRatingChange?: (rating: number) => void;
		/**
		 * Maximum rating value — the number of stars.
		 * @default 5
		 */
		maxRating?: number;
		/**
		 * The gap, star and read-out scale.
		 * @default "default"
		 */
		size?: RatingSize;
		/**
		 * Whether to render the numeric read-out next to the stars.
		 * @default false
		 */
		showValue?: boolean;
		/**
		 * Class name for the value span. The name is a stable public hook (the
		 * rating.tsx:73-75, 171-176), where it is documented — and applied — as the *value span's*
		 * class despite what the name suggests. Kept as-is so the surface matches.
		 */
		starClassName?: string;
		/**
		 * Whether the rating is editable. When `true` the component becomes a bits-ui RatingGroup:
		 * a single-tab-stop slider with arrow-key / Home / End / digit input, hover preview, and
		 * click-to-clear on the first star. When `false` it is purely presentational.
		 * @default false
		 */
		editable?: boolean;
		/**
		 * Whether clicks and hover snap to half stars instead of whole ones. No upstream
		 * equivalent — upstream only ever commits whole stars — but the
		 * bits-ui primitive underneath supports it natively, so it is exposed.
		 * @default false
		 */
		allowHalf?: boolean;
		/**
		 * Suppresses every interaction and dims the control. Editable mode only; no upstream
		 * equivalent.
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * `name` of the hidden input the rating is submitted with. Editable mode only; when
		 * omitted no hidden input is rendered. No upstream equivalent.
		 */
		name?: string;
		/**
		 * Marks the hidden input as required for form submission. Editable mode only; pair it
		 * with `name`. No upstream equivalent.
		 * @default false
		 */
		required?: boolean;
	};
</script>

<script lang="ts">
	import StarIcon from "@lucide/svelte/icons/star";
	import { RatingGroup } from "bits-ui";

	import {
		getStarFillPercentage,
		ratingStarVariants,
		ratingValueVariants,
		ratingVariants,
	} from "./rating.svelte.js";

	let {
		ref = $bindable(null),
		rating = $bindable(),
		onRatingChange,
		maxRating = 5,
		size = "default",
		showValue = false,
		starClassName,
		editable = false,
		allowHalf = false,
		disabled = false,
		name,
		required = false,
		class: className,
		...restProps
	}: RatingProps = $props();

	/** The per-item shape bits-ui's root snippet yields (bits-ui rating-group/types.ts). */
	type RatingItem = { index: number; state: "active" | "partial" | "inactive" };

	/**
	 * Whether a mouse pointer is currently over the editable star row. bits-ui keeps its hover
	 * preview value private and only surfaces it through the item states, so this flag decides
	 * which source of truth the fill math reads: item states while hovering (they track the
	 * preview), the exact fractional `rating` otherwise. Touch is ignored to match bits-ui's own
	 * preview guard.
	 */
	let hovering = $state(false);

	function handlePointerMove(event: PointerEvent) {
		if (event.pointerType !== "touch" && !disabled) hovering = true;
	}

	function handlePointerLeave() {
		hovering = false;
	}

	/** House callback contract: `onRatingChange` fires only on a real change. */
	function handleValueChange(next: number) {
		if (next === rating) return;
		rating = next;
		onRatingChange?.(next);
	}

	/**
	 * Hover previews are always whole or half stars (bits-ui quantizes them), so while hovering
	 * the ternary item state is lossless; outside a hover the fractional upstream math keeps
	 * decimals like `3.5` rendering as an exact half star.
	 */
	function itemFill(item: RatingItem): number {
		if (!hovering) return getStarFillPercentage(rating, item.index);
		if (item.state === "active") return 100;
		if (item.state === "partial") return 50;
		return 0;
	}

	/**
	 * Upstream's `displayRating` prefers the hovered value in the
	 * read-out. The preview value is recovered from the item states — one point per active star,
	 * half per partial — which is exact because previews are always quantized to those states.
	 */
	function displayValue(items: RatingItem[]): number {
		if (!hovering) return rating;
		return items.reduce(
			(total, item) => total + (item.state === "active" ? 1 : item.state === "partial" ? 0.5 : 0),
			0,
		);
	}
</script>

<!--
Two stacked copies of the same star — a muted outline underneath, a filled copy clipped to the
fill percentage on top — exactly upstream's structure. The filled star
uses the house `warning` token in place of upstream's raw `fill-yellow-400 text-yellow-400`:
The classic theme's `--warning` IS its yellow (src/app.css), and raw palette colours are off-limits here.
-->
{#snippet starLayers(fill: number)}
	<StarIcon
		data-slot="rating-star-empty"
		class={cn(ratingStarVariants({ size }), "text-muted-foreground/30")}
	/>
	<div class="absolute inset-0 overflow-hidden" style="width: {fill}%">
		<StarIcon
			data-slot="rating-star-filled"
			class={cn(ratingStarVariants({ size }), "fill-warning text-warning")}
		/>
	</div>
{/snippet}

{#if editable}
	<!--
	Upstream hand-rolls editing with per-star click/hover handlers on plain divs — no keyboard path, no focus, nothing announced. bits-ui 2.18 ships a
	RatingGroup primitive that covers all of that (single tab stop, `role="slider"` semantics,
	arrow/Home/End/digit keys, quantized hover preview, hidden form input), so the editable mode
	is built on it instead of porting upstream's mouse-only version.
	-->
	<RatingGroup.Root
		bind:ref
		value={rating}
		onValueChange={handleValueChange}
		min={0}
		max={maxRating}
		{allowHalf}
		{disabled}
		{name}
		{required}
		data-slot="rating"
		{...restProps}
		class={cn(
			ratingVariants({ size }),
			"data-disabled:pointer-events-none data-disabled:opacity-50",
			className,
		)}
	>
		{#snippet children({ items })}
			<!--
			The hover flag is scoped to the star row, not the whole root: upstream only tracks
			hover per star, and the root also contains the value span,
			which must not switch the read-out into preview mode.
			-->
			<!--
			`role="presentation"` matches what bits-ui puts on the items themselves: the slider
			semantics live on the root, and these pointer handlers are hover bookkeeping, not an
			interaction of their own.
			-->
			<div
				role="presentation"
				class="flex items-center"
				onpointermove={handlePointerMove}
				onpointerleave={handlePointerLeave}
			>
				{#each items as item (item.index)}
					<RatingGroup.Item index={item.index} class="relative cursor-pointer">
						{@render starLayers(itemFill(item))}
					</RatingGroup.Item>
				{/each}
			</div>
			{#if showValue}
				<span data-slot="rating-value" class={cn(ratingValueVariants({ size }), starClassName)}>
					{displayValue(items).toFixed(1)}
				</span>
			{/if}
		{/snippet}
	</RatingGroup.Root>
{:else}
	<!--
	The static rating stays a plain element like upstream's — a display
	of someone else's score should not be a tab stop. Upstream's div is silent to assistive
	technology though, so this one adds `role="img"` with the value as its label; `restProps` can
	override the label when the caller has better wording.
	-->
	<div
		bind:this={ref}
		data-slot="rating"
		role="img"
		aria-label="{rating.toFixed(1)} out of {maxRating}"
		{...restProps}
		class={cn(ratingVariants({ size }), className)}
	>
		<div class="flex items-center">
			{#each Array.from({ length: maxRating }) as _, index (index)}
				<div class="relative">
					{@render starLayers(getStarFillPercentage(rating, index))}
				</div>
			{/each}
		</div>
		{#if showValue}
			<span data-slot="rating-value" class={cn(ratingValueVariants({ size }), starClassName)}>
				{rating.toFixed(1)}
			</span>
		{/if}
	</div>
{/if}
