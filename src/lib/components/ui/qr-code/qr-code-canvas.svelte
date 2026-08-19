<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLCanvasAttributes } from "svelte/elements";
	import { getQRCodeContext, loadQRCodeEncoder } from "./qr-code.svelte.js";

	/**
	 * The merged attribute payload handed to the `child` snippet.
	 *
	 * The `Record<string, unknown>` tail carries `restProps` and the `createAttachmentKey()` entry —
	 * a `symbol` key, which is why the index signature is required.
	 */
	export type QRCodeCanvasChildProps = {
		"data-slot": "qr-code-canvas";
		role: "img";
		"aria-label": string;
		width: number;
		height: number;
		class: string;
	} & Record<string, unknown>;

	export type QRCodeCanvasProps = WithElementRef<HTMLCanvasAttributes, HTMLCanvasElement> & {
		/** Fallback content rendered inside the `<canvas>` element. */
		children?: Snippet;
		/**
		 * Render the QR code onto your own element instead of the default `<canvas>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. The spread also
		 * registers the element for drawing, so a `<canvas>` handed the props keeps rendering the code.
		 * In `child` mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: QRCodeCanvasChildProps }]>;
	};
</script>

<script lang="ts">
	import { createAttachmentKey } from "svelte/attachments";

	let {
		/** The rendered `<canvas>` element. */
		ref = $bindable(null),
		/** Extra classes, merged last so they win over the defaults. */
		class: className,
		children,
		child,
		...restProps
	}: QRCodeCanvasProps = $props();

	const state = getQRCodeContext("QRCode.Canvas");

	const ATTACHMENT = createAttachmentKey();

	/**
	 * Registers whichever element the attributes land on — the component's own `<canvas>`, or the
	 * consumer's element in `child` mode — because `QRCode.toCanvas` draws straight into it.
	 *
	 * This is the Svelte-native equivalent of upstream's composed `context.canvasRef`
	 *: unlike a `child` snippet that only forwards attributes, spreading these
	 * props keeps the code actually being drawn. Elements other than a `<canvas>` are ignored rather
	 * than handed to the encoder, which would throw.
	 */
	function registerCanvas(element: Element) {
		if (!(element instanceof HTMLCanvasElement)) return;

		state.canvasElement = element;

		// A canvas mounted after a generation completed (tab, dialog, keyed remount) would otherwise
		// stay blank forever: `generate` early-returns on an unchanged key and never redraws.
		if (state.generationKey) {
			loadQRCodeEncoder()
				.then((QRCode) => {
					if (state.canvasElement !== element) return;
					return QRCode.toCanvas(element, state.value, state.options);
				})
				.catch(() => {
					// A late redraw failure is not a generation failure; the committed outputs stand.
				});
		}

		return () => {
			if (state.canvasElement === element) state.canvasElement = null;
		};
	}

	const canvasAttrs = $derived({
		"data-slot": "qr-code-canvas",
		role: "img",
		"aria-label": state.label,
		width: state.size,
		height: state.size,
		...restProps,
		class: cn(
			"relative max-h-(--qr-code-size) max-w-(--qr-code-size)",
			!state.generationKey && "invisible",
			className,
		),
		[ATTACHMENT]: registerCanvas,
	} as QRCodeCanvasChildProps);
</script>

{#if child}
	{@render child({ props: canvasAttrs })}
{:else}
	<canvas bind:this={ref} {...canvasAttrs}>
		{@render children?.()}
	</canvas>
{/if}
