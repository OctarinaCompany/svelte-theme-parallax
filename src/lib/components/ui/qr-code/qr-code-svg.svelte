<script lang="ts" module>
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { getQRCodeContext } from "./qr-code.svelte.js";

	/**
	 * The merged attribute payload handed to the `child` snippet.
	 *
	 * The `Record<string, unknown>` tail carries `restProps` and the `createAttachmentKey()` entry —
	 * a `symbol` key, which is why the index signature is required.
	 */
	export type QRCodeSvgChildProps = {
		"data-slot": "qr-code-svg";
		role: "img";
		"aria-label": string;
		style: string;
		class: string;
	} & Record<string, unknown>;

	/**
	 * `children` is not accepted: the element's content is the generated SVG markup, exactly as
	 * upstream sets it through `dangerouslySetInnerHTML`.
	 */
	export type QRCodeSvgProps = WithoutChildren<WithElementRef<HTMLAttributes<HTMLDivElement>>> & {
		/**
		 * Render the QR code onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. The spread also
		 * adopts the generated SVG markup into the element, so it keeps showing the code; `ref` stays
		 * `null`.
		 */
		child?: Snippet<[{ props: QRCodeSvgChildProps }]>;
	};
</script>

<script lang="ts">
	import { createAttachmentKey } from "svelte/attachments";

	let {
		/** The rendered `<div>` element wrapping the generated SVG markup. */
		ref = $bindable(null),
		/** Extra classes, merged last so they win over the defaults. */
		class: className,
		style,
		child,
		...restProps
	}: QRCodeSvgProps = $props();

	const state = getQRCodeContext("QRCode.Svg");

	const ATTACHMENT = createAttachmentKey();

	/**
	 * Adopts the generated markup into whichever element the attributes land on — the component's own
	 * `<div>`, or the consumer's element in `child` mode.
	 *
	 * Upstream forwards `dangerouslySetInnerHTML` through `Slot`, so `asChild`
	 * keeps showing the code; spreading these props does the same here. The markup is parsed into a
	 * real `<svg>` node rather than assigned as HTML, so nothing in it can execute. Attachments run in
	 * an effect, so reading `state.svgString` here re-adopts on every regeneration.
	 */
	function adoptMarkup(element: Element) {
		const markup = state.svgString;
		if (!markup) return;

		const parsed = new DOMParser().parseFromString(markup, "image/svg+xml");
		if (parsed.querySelector("parsererror")) return;

		element.replaceChildren(document.importNode(parsed.documentElement, true));

		return () => element.replaceChildren();
	}

	const svgAttrs = $derived({
		"data-slot": "qr-code-svg",
		role: "img",
		"aria-label": state.label,
		...restProps,
		style: `width: ${state.size}px; height: ${state.size}px;${style ? ` ${style}` : ""}`,
		class: cn("relative max-h-(--qr-code-size) max-w-(--qr-code-size)", className),
		[ATTACHMENT]: adoptMarkup,
	} as QRCodeSvgChildProps);
</script>

{#if state.svgString}
	{#if child}
		{@render child({ props: svgAttrs })}
	{:else}
		<div bind:this={ref} {...svgAttrs}></div>
	{/if}
{/if}
