<script lang="ts" module>
	import type { WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type TourCloseChildProps = {
		type: "button";
		"aria-label": string;
		"data-slot": "tour-close";
		class: string;
	} & Record<string, unknown>;

	export type TourCloseProps = WithElementRef<HTMLButtonAttributes, HTMLButtonElement> & {
		/**
		 * Render the control onto your own element instead of the default `<button>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: TourCloseChildProps }]>;
	};

	/**
	 * Upstream's class list, with the legacy `focus:` offset ring replaced by
	 * this repo's focus-visible ring family (button.svelte) and disabled dimming added.
	 */
	const CLOSE_CLASSES =
		"absolute top-4 right-4 rounded-xs opacity-70 transition-opacity outline-none hover:opacity-100 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";
	import XIcon from "@lucide/svelte/icons/x";

	import { getTourContext } from "./tour.svelte.js";

	let {
		ref = $bindable(null),
		onclick: onclickProp,
		class: className,
		children,
		child,
		...restProps
	}: TourCloseProps = $props();

	const root = getTourContext("<Tour.Close>");

	function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onclickProp?.(event);
		if (event.defaultPrevented) return;

		// Closing before the last step is a skip, never a completion.
		root.close();
	}

	const closeAttrs = $derived({
		type: "button",
		"aria-label": "Close tour",
		// Additive: upstream's `TourClose` carries no `data-slot`, and every part here emits one.
		"data-slot": "tour-close",
		...restProps,
		class: cn(CLOSE_CLASSES, className),
		onclick,
	} as TourCloseChildProps);
</script>

{#if child}
	{@render child({ props: closeAttrs })}
{:else}
	<button bind:this={ref} {...closeAttrs}>
		{#if children}
			{@render children()}
		{:else}
			<XIcon class="size-4" />
		{/if}
	</button>
{/if}
