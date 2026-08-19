<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { tv, type VariantProps } from "tailwind-variants";

	import type { IconTileSize, IconTileVariant } from "./icon-tile.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type IconTileChildProps = {
		"data-slot": "icon-tile";
		"data-variant": IconTileVariant;
		"data-size": IconTileSize;
		class: string;
	} & Record<string, unknown>;

	/*
	 * CSS variable architecture, ported from the original source.
	 *
	 * The root owns four variables so every part of the tile stays in proportion
	 * and stays overridable from a single `class`:
	 *
	 *   --icon-tile-size       tile width/height
	 *   --icon-tile-icon-size  glyph size applied to child svgs
	 *   --icon-tile-radius     corner radius (also drives the nested inner card)
	 *   --icon-tile-inset      gap between the outer ring and the inner card
	 *
	 * The `frame` and `soft` variants paint their inner card with an `::after`
	 * pseudo element instead of a wrapper node. `isolate` makes the root a stacking
	 * context, so the negative z-index pseudo paints above the root background but
	 * below the in-flow icon — no extra DOM, and `child` composition keeps working.
	 *
	 * Tone: `soft` and `solid` derive every fill and border from `currentColor`, so
	 * a single text color class (e.g. `text-success`) retints the whole tile. They
	 * default to `text-primary`; override it to recolor without touching internals.
	 */
	export const iconTileVariants = tv({
		base: [
			"relative inline-flex shrink-0 items-center justify-center align-middle",
			"size-(--icon-tile-size) rounded-(--icon-tile-radius)",
			"[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-(--icon-tile-icon-size)",
		],
		variants: {
			variant: {
				/** Plain bordered surface. The quiet default for list rows and toolbars. */
				outline: "border border-border bg-background dark:bg-input/32",
				/** Raised muted fill with a background-colored ring. Reads as a physical chip. */
				elevated:
					"border-2 border-background bg-muted text-accent-foreground shadow-[0_1px_3px_0_rgb(0_0_0/0.14)] dark:border",
				/**
				 * Tinted double container: an opacity-filled outer ring with no border
				 * around a bordered inner card, all derived from `currentColor`. The
				 * quiet, colorful sibling of `frame`. Retint with a text color class.
				 */
				soft: [
					"isolate bg-current/10 p-(--icon-tile-inset) text-primary",
					"after:absolute after:inset-(--icon-tile-inset) after:-z-10",
					"after:rounded-[calc(var(--icon-tile-radius)-var(--icon-tile-inset))]",
					"after:border after:border-current/20 after:bg-current/5",
				],
				/** Filled tone with a contrasting glyph. Retint with `bg-*` + a text color. */
				solid: "bg-primary text-primary-foreground",
				/** Double container — a muted ring around an inset card, matching Frame. */
				frame: [
					"isolate border border-border bg-muted/50 p-(--icon-tile-inset)",
					"after:absolute after:inset-(--icon-tile-inset) after:-z-10",
					"after:rounded-[calc(var(--icon-tile-radius)-var(--icon-tile-inset))]",
					"after:border after:border-border after:bg-card after:shadow-xs",
				],
			},
			size: {
				xs: "[--icon-tile-icon-size:--spacing(3.5)] [--icon-tile-inset:--spacing(0.5)] [--icon-tile-size:--spacing(6)]",
				sm: "[--icon-tile-icon-size:--spacing(4)] [--icon-tile-inset:--spacing(0.5)] [--icon-tile-size:--spacing(8)]",
				default:
					"[--icon-tile-icon-size:--spacing(4.5)] [--icon-tile-inset:--spacing(0.75)] [--icon-tile-size:--spacing(10)]",
				lg: "[--icon-tile-icon-size:--spacing(5.5)] [--icon-tile-inset:--spacing(0.75)] [--icon-tile-size:--spacing(12)]",
				xl: "[--icon-tile-icon-size:--spacing(7)] [--icon-tile-inset:--spacing(1)] [--icon-tile-size:--spacing(14)]",
			},
			/**
			 * `default`: theme radius. `full`: circular.
			 *
			 * The radius is clamped to a third of the tile. A flat radius is a
			 * circle once it reaches half the box, so an unclamped value would
			 * render `xs` (24px) and `sm` (32px) as plain circles and swallow the
			 * `full` variant's meaning; clamping keeps one corner ratio at every
			 * size, so a tile still reads as the same shape when it scales.
			 *
			 * Upstream also emits one `style-*` scoped token per registry style;
			 * this kit ships a single theme, so only the unscoped fallback is kept
			 * and it resolves against this repo's `--radius-md` (src/app.css).
			 */
			radius: {
				default: "[--icon-tile-radius:min(var(--radius-md),calc(var(--icon-tile-size)/3))]",
				full: "[--icon-tile-radius:calc(infinity*1px)]",
			},
		},
		defaultVariants: {
			variant: "outline",
			size: "default",
			radius: "default",
		},
	});

	export type IconTileProps = WithElementRef<HTMLAttributes<HTMLSpanElement>> &
		VariantProps<typeof iconTileVariants> & {
			/**
			 * Render the tile onto your own element instead of the default `<span>` — e.g. an
			 * `<a>` for an interactive tile. The snippet receives the merged props to spread
			 * onto that element.
			 *
			 * Replaces upstream's `asChild` (Radix `Slot`, the original source), which has
			 * no Svelte equivalent. In `child` mode `children` is not rendered and `ref`
			 * stays `null`.
			 */
			child?: Snippet<[{ props: IconTileChildProps }]>;
		};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		variant = "outline",
		size = "default",
		radius = "default",
		children,
		child,
		...restProps
	}: IconTileProps = $props();

	const tileAttrs = $derived({
		"data-slot": "icon-tile",
		"data-variant": variant,
		"data-size": size,
		...restProps,
		class: cn(iconTileVariants({ variant, size, radius }), className),
	} as IconTileChildProps);
</script>

{#if child}
	{@render child({ props: tileAttrs })}
{:else}
	<span bind:this={ref} {...tileAttrs}>
		{@render children?.()}
	</span>
{/if}
