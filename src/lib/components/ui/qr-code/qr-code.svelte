<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import {
		DEFAULT_BACKGROUND_COLOR,
		DEFAULT_FOREGROUND_COLOR,
		DEFAULT_LEVEL,
		DEFAULT_MARGIN,
		DEFAULT_QUALITY,
		DEFAULT_SIZE,
		QRCodeState,
		setQRCodeContext,
		type QRCodeLevel,
		type QRCodeStatus,
	} from "./qr-code.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type QRCodeChildProps = {
		"data-slot": "qr-code";
		"data-state": QRCodeStatus;
		style: string;
		class: string;
	} & Record<string, unknown>;

	export type QRCodeRootProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * The data to encode in the QR code.
		 *
		 * An empty string generates nothing at all.
		 *
		 * @example "https://example.com"
		 */
		value: string;
		/**
		 * The size of the QR code in pixels.
		 *
		 * Also published as the `--qr-code-size` custom property.
		 *
		 * @default 200
		 */
		size?: number;
		/**
		 * The background color of the QR code.
		 * @default "#ffffff"
		 */
		backgroundColor?: string;
		/**
		 * The foreground color of the QR code.
		 * @default "#000000"
		 */
		foregroundColor?: string;
		/**
		 * The error correction level.
		 *
		 * - `L`: Low (~7% correction)
		 * - `M`: Medium (~15% correction)
		 * - `Q`: Quartile (~25% correction)
		 * - `H`: High (~30% correction)
		 *
		 * @default "M"
		 */
		level?: QRCodeLevel;
		/**
		 * The width of the quiet zone in modules.
		 *
		 * When set to `0`, the quiet zone will be removed.
		 *
		 * @default 1
		 */
		margin?: number;
		/**
		 * The quality of the generated image (0-1).
		 *
		 * Only applies to formats that support quality settings like JPEG and WebP.
		 *
		 * @default 0.92
		 */
		quality?: number;
		/** Callback fired when the QR code fails to generate. */
		onError?: (error: Error) => void;
		/** Callback fired when the QR code is successfully generated. */
		onGenerated?: () => void;
		/**
		 * Render the QR code container onto your own element instead of the default `<div>`. The
		 * snippet receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: QRCodeChildProps }]>;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		value,
		size = DEFAULT_SIZE,
		level = DEFAULT_LEVEL,
		margin = DEFAULT_MARGIN,
		quality = DEFAULT_QUALITY,
		backgroundColor = DEFAULT_BACKGROUND_COLOR,
		foregroundColor = DEFAULT_FOREGROUND_COLOR,
		onError,
		onGenerated,
		class: className,
		style,
		children,
		child,
		...restProps
	}: QRCodeRootProps = $props();

	const state = new QRCodeState({
		getValue: () => value,
		getSize: () => size,
		getLevel: () => level,
		getMargin: () => margin,
		getQuality: () => quality,
		getForegroundColor: () => foregroundColor,
		getBackgroundColor: () => backgroundColor,
		getOnError: () => onError,
		getOnGenerated: () => onGenerated,
	});

	setQRCodeContext(state);

	// The theme of upstream's `useLayoutEffect` + `requestAnimationFrame` pair.
	// The frame defer is load-bearing: `<QRCode.Canvas>` must have mounted and registered its element
	// before `QRCode.toCanvas` runs. `generate()` writes only state that never feeds
	// `generationTarget`, and writes it from inside the frame callback, so nothing loops.
	$effect(() => {
		const key = state.generationTarget;
		if (!key) return;

		const frame = requestAnimationFrame(() => {
			void state.generate(key);
		});

		return () => cancelAnimationFrame(frame);
	});

	// Built once and shared by both branches, so a `child` element is styled and wired exactly like
	// the default `<div>`. `class` merges last (a recorded divergence from upstream, which lets its
	// own defaults win) so callers can always override the layout.
	const rootAttrs = $derived({
		"data-slot": "qr-code",
		"data-state": state.status,
		...restProps,
		style: `--qr-code-size: ${size}px;${style ? ` ${style}` : ""}`,
		class: cn("relative flex flex-col items-center gap-2", className),
	} as QRCodeChildProps);
</script>

{#if child}
	{@render child({ props: rootAttrs })}
{:else}
	<div bind:this={ref} {...rootAttrs}>
		{@render children?.()}
	</div>
{/if}
