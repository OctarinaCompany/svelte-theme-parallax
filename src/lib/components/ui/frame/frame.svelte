<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { tv } from "tailwind-variants";

	import type { FrameSpacing, FrameVariant } from "./frame.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type FrameChildProps = {
		"data-slot": "frame";
		"data-spacing": FrameSpacing | undefined;
		class: string;
	} & Record<string, unknown>;

	/*
	 * CSS variable architecture for FramePanel theming (upstream comment, the original):
	 *
	 * The Frame parent sets --frame-panel-bg and --frame-panel-border-color. FramePanel consumes
	 * them directly via bg-(--frame-panel-bg) and border-(--frame-panel-border-color). This means:
	 *
	 *   - variant="inverse" overrides those vars on Frame -> all panels pick it up
	 *   - <FramePanel class="bg-blue-50"> adds a direct utility on the element which wins over
	 *     bg-(--frame-panel-bg) by Tailwind source order - no :not() or !important needed
	 *
	 * Upstream frame.tsx:20-21 and :25 additionally carried per-shadcn-style overrides of
	 * --frame-radius and the frame gap/padding, scoped to `data-style` presets the classic theme does not
	 * ship (the vendored snapshot also arrived with those selector prefixes corrupted). Only the
	 * style-agnostic defaults are ported; the classic look reaches the frame through the tokens
	 * in src/app.css instead.
	 */
	export const frameVariants = tv({
		base: [
			"relative flex flex-col gap-(--frame-gap) rounded-(--frame-radius) bg-muted/50 px-(--frame-px) py-(--frame-py)",
			"[--frame-radius:var(--radius-xl)]",
			"[--frame-gap:--spacing(0.75)] [--frame-panel-footer-gap:--spacing(1)] [--frame-panel-header-gap:0rem] [--frame-px:--spacing(0.75)] [--frame-py:--spacing(0.75)]",
			// Every padding var is base + adjust so a caller can nudge one region (e.g. a taller
			// header) without restating the whole spacing ladder.
			"[--frame-panel-footer-px-adjust:0px] [--frame-panel-footer-py-adjust:0px] [--frame-panel-header-px-adjust:0px] [--frame-panel-header-py-adjust:0px] [--frame-panel-px-adjust:0px] [--frame-panel-py-adjust:0px]",
			"[--frame-panel-footer-px:calc(var(--frame-panel-footer-px-base)_+_var(--frame-panel-footer-px-adjust))] [--frame-panel-footer-py:calc(var(--frame-panel-footer-py-base)_+_var(--frame-panel-footer-py-adjust))] [--frame-panel-header-px:calc(var(--frame-panel-header-px-base)_+_var(--frame-panel-header-px-adjust))] [--frame-panel-header-py:calc(var(--frame-panel-header-py-base)_+_var(--frame-panel-header-py-adjust))] [--frame-panel-px:calc(var(--frame-panel-px-base)_+_var(--frame-panel-px-adjust))] [--frame-panel-py:calc(var(--frame-panel-py-base)_+_var(--frame-panel-py-adjust))]",
			// Default panel token values - overridden per-variant below.
			"[--frame-border-color:var(--color-border)] [--frame-panel-bg:var(--color-card)] [--frame-panel-border-color:var(--color-border)]",
			// Concentric inner radius: the panel corner nests smoothly inside the frame corner
			// instead of matching it. The panel sits inset from the frame's outer edge by the
			// frame's 1px border + --frame-px padding, so its radius is reduced by that same gap
			// (radius - gap keeps the two arcs parallel). This base value assumes the bordered
			// default/inverse frame; `ghost` drops the 1px border term and `dense` pins it back to
			// the frame radius (its panels are pulled flush to the edge).
			"[--frame-panel-radius:calc(var(--frame-radius)_-_var(--frame-px)_-_1px)]",
		],
		variants: {
			variant: {
				default: "border border-(--frame-border-color) bg-clip-padding",
				inverse:
					"border border-(--frame-border-color) bg-background bg-clip-padding [--frame-panel-bg:color-mix(in_oklch,var(--color-muted)_40%,transparent)]",
				// No frame border, so the panel is inset by --frame-px padding only.
				ghost: "[--frame-panel-radius:calc(var(--frame-radius)_-_var(--frame-px))]",
			},
			// Header/footer vertical rhythm is tighter than the panel body's, and the gap widens
			// as the frame grows: the bars read as chrome rather than as another content block.
			// py ladder is 0.5 / 1.5 / 2 / 2.5 against a body py of 2 / 3.5 / 4 / 5. `px` is
			// deliberately left level with the body so header, content and footer stay
			// left-aligned. `xs` holds at 0.5 (2px): it is the practical floor, since anything
			// lower stops reading as padding.
			spacing: {
				xs: "[--frame-panel-footer-px-base:--spacing(2)] [--frame-panel-footer-py-base:--spacing(0.5)] [--frame-panel-header-px-base:--spacing(2)] [--frame-panel-header-py-base:--spacing(0.5)] [--frame-panel-px-base:--spacing(2)] [--frame-panel-py-base:--spacing(2)]",
				sm: "[--frame-panel-footer-px-base:--spacing(3)] [--frame-panel-footer-py-base:--spacing(1.5)] [--frame-panel-header-px-base:--spacing(3)] [--frame-panel-header-py-base:--spacing(1.5)] [--frame-panel-px-base:--spacing(3)] [--frame-panel-py-base:--spacing(3.5)]",
				default:
					"[--frame-panel-footer-px-base:--spacing(4)] [--frame-panel-footer-py-base:--spacing(2)] [--frame-panel-header-px-base:--spacing(4)] [--frame-panel-header-py-base:--spacing(2)] [--frame-panel-px-base:--spacing(4)] [--frame-panel-py-base:--spacing(4)]",
				lg: "[--frame-panel-footer-px-base:--spacing(5)] [--frame-panel-footer-py-base:--spacing(2.5)] [--frame-panel-header-px-base:--spacing(5)] [--frame-panel-header-py-base:--spacing(2.5)] [--frame-panel-px-base:--spacing(5)] [--frame-panel-py-base:--spacing(5)]",
			},
			stacked: {
				// Adjacent panels fuse: the corners facing another panel square off and the shared
				// border collapses, so the run reads as one segmented block.
				true: [
					"gap-0 *:has-[+[data-slot=frame-panel]]:rounded-b-none",
					"*:has-[+[data-slot=frame-panel]]:before:hidden",
					"*:[[data-slot=frame-panel]+[data-slot=frame-panel]]:rounded-t-none",
					"*:[[data-slot=frame-panel]+[data-slot=frame-panel]]:border-t-0",
				],
				// The extra margin between separated panels only applies when `spacing` is passed
				// explicitly: `data-spacing` mirrors the raw prop, which upstream leaves off the
				// element when undefined.
				false: [
					"data-[spacing=default]:*:[[data-slot=frame-panel]+[data-slot=frame-panel]]:mt-1",
					"data-[spacing=lg]:*:[[data-slot=frame-panel]+[data-slot=frame-panel]]:mt-2",
					"data-[spacing=sm]:*:[[data-slot=frame-panel]+[data-slot=frame-panel]]:mt-0.5",
				],
			},
			dense: {
				// Positional rules must stay as parent selectors - they cannot be expressed via
				// CSS vars. Padding is 0 and panels are pulled flush to the frame edge (-mx-px),
				// so their corners align with the frame radius rather than nesting inside it.
				//
				true: "gap-0 border-(--frame-border-color) p-0 [--frame-panel-radius:var(--frame-radius)] [&_[data-slot=frame-panel]]:-mx-px [&_[data-slot=frame-panel]]:before:hidden [&_[data-slot=frame-panel]:last-child]:-mb-px [&:not(:has([data-slot=frame-panel-header]))_[data-slot=frame-panel]:is(:first-child)]:-mt-px",
				false: "",
			},
		},
		defaultVariants: {
			variant: "default",
			spacing: "default",
			stacked: false,
			dense: false,
		},
	});

	export type FrameRootProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Chrome treatment of the frame shell. `"inverse"` swaps the shell/panel contrast,
		 * `"ghost"` drops the shell border.
		 * @default "default"
		 */
		variant?: FrameVariant;
		/**
		 * Padding ladder applied to panel bodies, headers and footers inside this frame.
		 * @default "default"
		 */
		spacing?: FrameSpacing;
		/**
		 * Fuse adjacent panels into one segmented block (shared borders, squared inner corners).
		 * @default false
		 */
		stacked?: boolean;
		/**
		 * Remove the frame's own padding and pull panels flush to its edge.
		 * @default false
		 */
		dense?: boolean;
		/**
		 * Render the frame onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element. In `child` mode `children` is
		 * not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: FrameChildProps }]>;
	};

	/** Upstream-parity alias of {@link FrameRootProps}. */
	export type FrameProps = FrameRootProps;
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		variant,
		spacing,
		stacked,
		dense,
		class: className,
		children,
		child,
		...restProps
	}: FrameRootProps = $props();

	// The variant props are passed through raw, not defaulted: the tv defaultVariants supply the
	// classes, and `data-spacing` must stay absent when the prop is - the stacked:false margin
	// rules key off the explicit attribute (see the comment on that variant).
	const rootAttrs = $derived({
		"data-slot": "frame",
		"data-spacing": spacing,
		...restProps,
		class: cn(frameVariants({ variant, spacing, stacked, dense }), className),
	} as FrameChildProps);
</script>

{#if child}
	{@render child({ props: rootAttrs })}
{:else}
	<div bind:this={ref} {...rootAttrs}>
		{@render children?.()}
	</div>
{/if}
