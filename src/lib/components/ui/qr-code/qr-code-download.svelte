<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";
	import {
		DEFAULT_FILENAME,
		DEFAULT_FORMAT,
		getQRCodeContext,
		type QRCodeFormat,
	} from "./qr-code.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type QRCodeDownloadChildProps = {
		type: "button";
		"data-slot": "qr-code-download";
		onclick: (event: MouseEvent) => void;
		class: string;
	} & Record<string, unknown>;

	export type QRCodeDownloadProps = WithElementRef<HTMLButtonAttributes, HTMLButtonElement> & {
		/**
		 * The filename for the downloaded QR code.
		 *
		 * @default "qrcode"
		 */
		filename?: string;
		/**
		 * The file format for download.
		 * @default "png"
		 */
		format?: QRCodeFormat;
		/**
		 * Render the trigger onto your own element instead of the default `<button>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: QRCodeDownloadChildProps }]>;
	};
</script>

<script lang="ts">
	let {
		/** The rendered `<button>` element. */
		ref = $bindable(null),
		filename = DEFAULT_FILENAME,
		format = DEFAULT_FORMAT,
		/** Extra classes, merged last so they win over the defaults. */
		class: className,
		onclick,
		children,
		child,
		...restProps
	}: QRCodeDownloadProps = $props();

	const state = getQRCodeContext("QRCode.Download");

	// Upstream `:404-405`: the caller's handler runs first and can cancel the download outright by
	// calling `preventDefault()`.
	function handleClick(event: MouseEvent) {
		onclick?.(event as MouseEvent & { currentTarget: EventTarget & HTMLButtonElement });
		if (event.defaultPrevented) return;

		state.download(filename, format);
	}

	const downloadAttrs = $derived({
		type: "button",
		"data-slot": "qr-code-download",
		...restProps,
		onclick: handleClick,
		class: cn(
			"max-w-(--qr-code-size) outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
			className,
		),
	} as QRCodeDownloadChildProps);
</script>

{#if child}
	{@render child({ props: downloadAttrs })}
{:else}
	<button bind:this={ref} {...downloadAttrs}>
		{#if children}
			{@render children()}
		{:else}
			Download {format.toUpperCase()}
		{/if}
	</button>
{/if}
