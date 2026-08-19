<script lang="ts" module>
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { AriaRole, HTMLAttributes } from "svelte/elements";
	import { tv } from "tailwind-variants";
	import { getColorBackgroundStyle, hasAlpha, isCssColor, normalizeColorValue } from "./color.js";

	/** Every value `size` accepts, in upstream declaration order. */
	export const COLOR_SWATCH_SIZES = ["default", "sm", "lg"] as const;

	/** The size of the color swatch. */
	export type ColorSwatchSize = (typeof COLOR_SWATCH_SIZES)[number];

	/**
	 * Normalise a possibly untyped runtime value to a known size.
	 * Anything outside {@link COLOR_SWATCH_SIZES} falls back to `"default"`.
	 */
	export function resolveColorSwatchSize(value?: string): ColorSwatchSize {
		return COLOR_SWATCH_SIZES.includes(value as ColorSwatchSize)
			? (value as ColorSwatchSize)
			: "default";
	}

	export const colorSwatchVariants = tv({
		base: "box-border rounded-sm border bg-clip-padding shadow-sm data-disabled:pointer-events-none data-disabled:opacity-50",
		variants: {
			size: {
				default: "size-8",
				sm: "size-6",
				lg: "size-12",
			},
		},
		defaultVariants: {
			size: "default",
		},
	});

	/** The merged attribute payload handed to the `child` snippet. */
	export type ColorSwatchChildProps = {
		/**
		 * `"img"` unless the caller passes its own `role` through `restProps`, in which case the
		 * caller's value wins (matches upstream's `{...props}` spread order).
		 */
		role?: AriaRole | null;
		/**
		 * `Color swatch: <value>` or `No color selected`, unless overridden through `restProps`.
		 */
		"aria-label"?: string | null;
		/**
		 * `"true"` iff `disabled`, otherwise absent, unless overridden through `restProps`.
		 */
		"aria-disabled"?: boolean | "true" | "false" | null;
		/** Always `"color-swatch"`. */
		"data-slot": "color-swatch";
		/** The resolved size. */
		"data-size": ColorSwatchSize;
		/** Present (`""`) iff `disabled`. */
		"data-disabled"?: "";
		/** Present (`""`) iff the checkerboard background renders. */
		"data-transparent"?: "";
		/** Present (`""`) iff no colour value resolves. */
		"data-empty"?: "";
		/** Variant classes with the caller's `class` merged last. */
		class: string;
		/** The computed background declarations, with the caller's `style` appended last. */
		style: string;
	} & Record<string, unknown>;

	export type ColorSwatchRootProps = WithoutChildren<
		WithElementRef<HTMLAttributes<HTMLDivElement>>
	> & {
		/**
		 * The color value to display. Can be any valid CSS color value.
		 * @default undefined
		 * @example "#ff0000" | "rgb(255, 0, 0)" | "hsl(0, 100%, 50%)" | "rgba(255, 0, 0, 0.5)"
		 */
		color?: string;
		/**
		 * The size of the color swatch.
		 * @default "default"
		 */
		size?: ColorSwatchSize;
		/**
		 * Whether to hide the checkerboard pattern for transparent colors.
		 * @default false
		 */
		withoutTransparency?: boolean;
		/**
		 * Whether the color swatch is disabled.
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Render the swatch onto your own element instead of the default `<div>`.
		 * The snippet receives the merged props (role, aria-label, data attributes, class, style
		 * and every forwarded attribute) to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent.
		 * In `child` mode `ref` is not populated — the caller owns the element.
		 */
		child?: Snippet<[{ props: ColorSwatchChildProps }]>;
	};

	/** Alias of {@link ColorSwatchRootProps}, present for parity with the upstream type name. */
	export type ColorSwatchProps = ColorSwatchRootProps;
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		color,
		size = "default",
		withoutTransparency = false,
		disabled = false,
		class: className,
		style,
		child,
		...restProps
	}: ColorSwatchRootProps = $props();

	const resolvedSize = $derived(resolveColorSwatchSize(size));
	const colorValue = $derived(normalizeColorValue(color));
	const isValidColor = $derived(colorValue !== undefined && isCssColor(colorValue));
	const isTransparent = $derived(
		isValidColor && !withoutTransparency && hasAlpha(colorValue as string),
	);

	const ariaLabel = $derived(
		colorValue === undefined ? "No color selected" : `Color swatch: ${colorValue}`,
	);

	const backgroundStyle = $derived(getColorBackgroundStyle(colorValue, { withoutTransparency }));

	const computedStyle = $derived(
		`${backgroundStyle}; forced-color-adjust: none` + (style ? `; ${style}` : ""),
	);

	// Built once and shared by both branches, so a `child` element is styled exactly like the
	// default `<div>`. `class`/`style` can never arrive through `restProps` — they are destructured
	// out — so the computed values always win, matching upstream's `{...props} className={cn(...)} style={{...}}`.
	const rootAttrs: ColorSwatchChildProps = $derived({
		role: "img",
		"aria-label": ariaLabel,
		"aria-disabled": disabled ? "true" : undefined,
		"data-slot": "color-swatch",
		"data-size": resolvedSize,
		"data-disabled": disabled ? "" : undefined,
		"data-transparent": isTransparent ? "" : undefined,
		"data-empty": colorValue === undefined ? "" : undefined,
		...restProps,
		class: cn(colorSwatchVariants({ size: resolvedSize }), className),
		style: computedStyle,
	});
</script>

{#if child}
	{@render child({ props: rootAttrs })}
{:else}
	<div bind:this={ref} {...rootAttrs}></div>
{/if}
