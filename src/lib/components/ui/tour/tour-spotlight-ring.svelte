<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type TourSpotlightRingChildProps = {
		"data-slot": "tour-spotlight-ring";
		"data-state": "open" | "closed";
		class: string;
		/** `left`/`top`/`width`/`height` from the cut-out, with the caller's declarations last. */
		style: string;
	} & Record<string, unknown>;

	export type TourSpotlightRingProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/**
		 * Keep the ring in the document while the tour is closed, reporting `data-state="closed"`, so
		 * an exit transition can run. It still renders nothing until a cut-out has been measured.
		 * @default false
		 */
		forceMount?: boolean;
		/**
		 * Render the ring onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: TourSpotlightRingChildProps }]>;
	};

	/**
	 * Upstream's class list. `z-50` is load-bearing for the same reason as the
	 * backdrop's, and `border-ring` / `ring-ring` are already semantic tokens.
	 */
	const SPOTLIGHT_RING_CLASSES =
		"pointer-events-none fixed z-50 border-ring ring-[3px] ring-ring/50";
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
	}: TourSpotlightRingProps = $props();

	const root = getTourContext("<Tour.SpotlightRing>");

	const ringAttrs = $derived({
		"data-slot": "tour-spotlight-ring",
		"data-state": root.open ? "open" : "closed",
		...restProps,
		// The caller's `class` is merged last so a custom border, glow or animation wins on conflict.
		class: cn(SPOTLIGHT_RING_CLASSES, className),
		style: [
			root.spotlightRect
				? `left: ${root.spotlightRect.x}px; top: ${root.spotlightRect.y}px; width: ${root.spotlightRect.width}px; height: ${root.spotlightRect.height}px`
				: "",
			style,
		]
			.filter(Boolean)
			.join("; "),
	} as TourSpotlightRingChildProps);
</script>

{#if (root.open || forceMount) && root.spotlightRect}
	{#if child}
		{@render child({ props: ringAttrs })}
	{:else}
		<div bind:this={ref} {...ringAttrs}>
			{@render children?.()}
		</div>
	{/if}
{/if}
