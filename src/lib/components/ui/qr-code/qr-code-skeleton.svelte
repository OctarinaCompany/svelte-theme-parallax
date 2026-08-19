<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { getQRCodeContext } from "./qr-code.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type QRCodeSkeletonChildProps = {
		"data-slot": "qr-code-skeleton";
		style: string;
		class: string;
	} & Record<string, unknown>;

	export type QRCodeSkeletonProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Render the placeholder onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: QRCodeSkeletonChildProps }]>;
	};
</script>

<script lang="ts">
	let {
		/** The rendered `<div>` element. */
		ref = $bindable(null),
		/** Extra classes, merged last so they win over the defaults. */
		class: className,
		/** Inline styles, emitted after the computed `width`/`height`. */
		style,
		children,
		child,
		...restProps
	}: QRCodeSkeletonProps = $props();

	const state = getQRCodeContext("QRCode.Skeleton");

	const skeletonAttrs = $derived({
		"data-slot": "qr-code-skeleton",
		...restProps,
		style: `width: ${state.size}px; height: ${state.size}px;${style ? ` ${style}` : ""}`,
		class: cn(
			"absolute max-h-(--qr-code-size) max-w-(--qr-code-size) animate-pulse bg-accent",
			className,
		),
	} as QRCodeSkeletonChildProps);
</script>

{#if !state.isLoaded}
	{#if child}
		{@render child({ props: skeletonAttrs })}
	{:else}
		<div bind:this={ref} {...skeletonAttrs}>
			{@render children?.()}
		</div>
	{/if}
{/if}
