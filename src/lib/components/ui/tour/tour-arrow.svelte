<script lang="ts" module>
	import type { WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type TourArrowChildProps = {
		"data-slot": "tour-arrow";
		class: string;
	} & Record<string, unknown>;

	export type TourArrowProps = Omit<
		WithElementRef<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>,
		"id"
	> & {
		/**
		 * `id` of the rendered arrow. Narrower than the DOM attribute (which also accepts `null`),
		 * because `bits-ui` generates and stores one when it is omitted.
		 */
		id?: string;
		/**
		 * Arrow width in pixels.
		 * @default 10
		 */
		width?: number;
		/**
		 * Arrow height in pixels.
		 * @default 5
		 */
		height?: number;
		/**
		 * Render the arrow onto your own element instead of the default `<span>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: TourArrowChildProps }]>;
	};
</script>

<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";

	import { getTourStepContext } from "./tour.svelte.js";

	let {
		ref = $bindable(null),
		width = 10,
		height = 5,
		class: className,
		children,
		child: childSnippet,
		...restProps
	}: TourArrowProps = $props();

	// Purely a guard rail: placement, orientation and the "cannot be centred" hide are owned by the
	// floating layer and consumed by `Popover.Arrow` through its own context. The
	// lookup exists so the part throws outside a step, exactly as upstream.
	getTourStepContext("<Tour.Arrow>");
</script>

<PopoverPrimitive.Arrow data-slot="tour-arrow" {width} {height} {...restProps} class={className}>
	{#snippet child({ props })}
		{#if childSnippet}
			{@render childSnippet({ props: props as TourArrowChildProps })}
		{:else}
			<span bind:this={ref} {...props}>
				{#if children}
					{@render children()}
				{:else}
					<!-- Upstream puts its colours on the `<svg>`; the span is the part
					     consumers style, and `fill`/`stroke` inherit into the polygon either way. -->
					<svg
						{width}
						{height}
						viewBox="0 0 30 10"
						preserveAspectRatio="none"
						data-arrow=""
						class="block fill-popover stroke-border"
					>
						<polygon points="0,0 30,0 15,10" />
					</svg>
				{/if}
			</span>
		{/if}
	{/snippet}
</PopoverPrimitive.Arrow>
