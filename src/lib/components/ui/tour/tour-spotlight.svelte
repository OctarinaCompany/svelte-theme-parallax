<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type TourSpotlightChildProps = {
		"data-slot": "tour-spotlight";
		"data-state": "open" | "closed";
		class: string;
		/** The `clip-path` cut-out, with the caller's own declarations appended last. */
		style: string;
	} & Record<string, unknown>;

	export type TourSpotlightProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/**
		 * Keep the backdrop in the document while the tour is closed, reporting
		 * `data-state="closed"`, so an exit transition can run.
		 * @default false
		 */
		forceMount?: boolean;
		/**
		 * Render the backdrop onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: TourSpotlightChildProps }]>;
	};

	/**
	 * Upstream's class list. `z-50` is load-bearing rather than a manual override:
	 * the backdrop is a bare positioned `div` that must sit above the page and below the step card.
	 * `bg-black/80` is a fixed dimming layer, not a theme colour — `bg-foreground/80` would invert to
	 * a *light* scrim in dark mode.
	 */
	const SPOTLIGHT_CLASSES =
		"fixed inset-0 z-50 bg-black/80 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0";
</script>

<script lang="ts">
	import { getTourContext } from "./tour.svelte.js";

	let {
		ref = $bindable(null),
		forceMount = false,
		class: className,
		style,
		children,
		child,
		...restProps
	}: TourSpotlightProps = $props();

	const root = getTourContext("<Tour.Spotlight>");

	const spotlightAttrs = $derived({
		"data-slot": "tour-spotlight",
		"data-state": root.open ? "open" : "closed",
		...restProps,
		class: cn(SPOTLIGHT_CLASSES, className),
		// Upstream spreads the caller's `style` after the cut-out (1294-1297), so a caller can replace it.
		style: [`clip-path: ${root.maskPath}`, style].filter(Boolean).join("; "),
	} as TourSpotlightChildProps);
</script>

{#if root.open || forceMount}
	{#if child}
		{@render child({ props: spotlightAttrs })}
	{:else}
		<div bind:this={ref} {...spotlightAttrs}>
			{@render children?.()}
		</div>
	{/if}
{/if}
