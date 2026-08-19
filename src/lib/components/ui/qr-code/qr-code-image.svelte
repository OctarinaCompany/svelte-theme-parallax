<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLImgAttributes } from "svelte/elements";
	import { DEFAULT_IMAGE_ALT, getQRCodeContext } from "./qr-code.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type QRCodeImageChildProps = {
		"data-slot": "qr-code-image";
		src: string;
		alt: string;
		width: number;
		height: number;
		class: string;
	} & Record<string, unknown>;

	export type QRCodeImageProps = WithElementRef<HTMLImgAttributes, HTMLImageElement> & {
		/**
		 * Alternative text for the QR code image.
		 *
		 * ```ts
		 * alt="New QR Code"
		 * ```
		 *
		 * @default "QR Code"
		 */
		alt?: string;
		/**
		 * Render the QR code onto your own element instead of the default `<img>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `ref` stays `null`.
		 */
		child?: Snippet<[{ props: QRCodeImageChildProps }]>;
	};
</script>

<script lang="ts">
	let {
		/** The rendered `<img>` element. */
		ref = $bindable(null),
		alt = DEFAULT_IMAGE_ALT,
		/** Extra classes, merged last so they win over the defaults. */
		class: className,
		child,
		...restProps
	}: QRCodeImageProps = $props();

	const state = getQRCodeContext("QRCode.Image");

	const imageAttrs = $derived({
		"data-slot": "qr-code-image",
		src: state.dataUrl ?? "",
		alt,
		width: state.size,
		height: state.size,
		...restProps,
		class: cn("relative max-h-(--qr-code-size) max-w-(--qr-code-size)", className),
	} as QRCodeImageChildProps);
</script>

{#if state.dataUrl}
	{#if child}
		{@render child({ props: imageAttrs })}
	{:else}
		<img bind:this={ref} {...imageAttrs} />
	{/if}
{/if}
