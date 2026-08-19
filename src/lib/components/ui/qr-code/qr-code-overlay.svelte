<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { getQRCodeContext } from "./qr-code.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type QRCodeOverlayChildProps = {
		"data-slot": "qr-code-overlay";
		class: string;
	} & Record<string, unknown>;

	export type QRCodeOverlayProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Render the overlay onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: QRCodeOverlayChildProps }]>;
	};
</script>

<script lang="ts">
	let {
		/** The rendered `<div>` element. */
		ref = $bindable(null),
		/** Extra classes, merged last so they win over the defaults. */
		class: className,
		children,
		child,
		...restProps
	}: QRCodeOverlayProps = $props();

	// The overlay reads nothing from the state, but an overlay outside a root is meaningless, so the
	// guard is applied here too — uniformly across all seven parts.
	getQRCodeContext("QRCode.Overlay");

	const overlayAttrs = $derived({
		"data-slot": "qr-code-overlay",
		...restProps,
		class: cn(
			"absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-sm bg-background",
			className,
		),
	} as QRCodeOverlayChildProps);
</script>

{#if child}
	{@render child({ props: overlayAttrs })}
{:else}
	<div bind:this={ref} {...overlayAttrs}>
		{@render children?.()}
	</div>
{/if}
