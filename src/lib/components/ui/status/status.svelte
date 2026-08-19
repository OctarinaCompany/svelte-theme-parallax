<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { tv } from "tailwind-variants";

	/**
	 * Every value `variant` accepts, in upstream declaration order — except that upstream's
	 * `error` is named `destructive` here, the severity this library's tokens and every other
	 * status API in it (Badge, Alert, Banner) already speak. One vocabulary, not two.
	 */
	export const STATUS_VARIANTS = ["default", "success", "destructive", "warning", "info"] as const;

	/** The visual style and color theme of the status badge. */
	export type StatusVariant = (typeof STATUS_VARIANTS)[number];

	/**
	 * Normalise a possibly untyped runtime value to a known variant.
	 * Anything outside {@link STATUS_VARIANTS} falls back to `"default"`.
	 */
	export function resolveStatusVariant(value?: string): StatusVariant {
		return STATUS_VARIANTS.includes(value as StatusVariant) ? (value as StatusVariant) : "default";
	}

	/** Every value `appearance` accepts, chrome-first. */
	export const STATUS_APPEARANCES = ["pill", "bare"] as const;

	/** How much chrome the status carries around its dot and label. */
	export type StatusAppearance = (typeof STATUS_APPEARANCES)[number];

	/**
	 * Normalise a possibly untyped runtime value to a known appearance.
	 * Anything outside {@link STATUS_APPEARANCES} falls back to `"pill"`.
	 */
	export function resolveStatusAppearance(value?: string): StatusAppearance {
		return STATUS_APPEARANCES.includes(value as StatusAppearance)
			? (value as StatusAppearance)
			: "pill";
	}

	/**
	 * THE SINGLE SOURCE OF TRUTH for what a status badge paints. The status variants carry
	 * The classic theme's grounds directly: the opaque `*-subtle` token with no outline at all, under
	 * the contrast-walked `*-subtle-foreground` ink the whole soft family shares (the raw
	 * colour it replaced measured 1.5-4.4:1; app.css §status tokens). The pill in every table
	 * row and activity feed in the theme, and the same object the Badge draws, so the two
	 * must not disagree. (An earlier version shipped upstream's `border-{state}/20
	 * bg-{state}/10` here and re-grounded it from an unlayered app.css patch, which left
	 * these classes describing something other than what painted; the patch is gone.)
	 */
	export const statusVariants = tv({
		base: "inline-flex w-fit shrink-0 items-center gap-1.5 overflow-hidden rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors",
		variants: {
			variant: {
				default:
					"border-transparent bg-muted text-muted-foreground **:data-[slot=status-indicator]:bg-muted-foreground",
				success:
					"border-transparent bg-success-subtle text-success-subtle-foreground **:data-[slot=status-indicator]:bg-success",
				destructive:
					"border-transparent bg-destructive-subtle text-destructive-subtle-foreground **:data-[slot=status-indicator]:bg-destructive",
				warning:
					"border-transparent bg-warning-subtle text-warning-subtle-foreground **:data-[slot=status-indicator]:bg-warning",
				info: "border-transparent bg-info-subtle text-info-subtle-foreground **:data-[slot=status-indicator]:bg-info",
			},
			/*
			 * `bare` strips the pill and leaves the dot and the label sitting on whatever ground
			 * the page already has — the presentation for a monitoring list, a sidebar footer or
			 * a card header, where a row of tinted pills would read as five separate objects
			 * instead of one list. It keeps the `variant`'s dot colour and gives the label the
			 * page's own ink, because with the ground gone the dot is the only thing carrying
			 * the state and the label is just text again.
			 * `overflow-visible` is the load-bearing one: the base clips the ping halo to the
			 * pill, and without a pill there is nothing to clip it to.
			 *
			 * Declared after `variant` so tailwind-variants emits it later and tailwind-merge
			 * resolves the ground, ink, radius and padding in its favour.
			 */
			appearance: {
				pill: "",
				bare: "gap-2 overflow-visible rounded-none border-0 bg-transparent p-0 text-sm font-normal text-foreground",
			},
		},
		defaultVariants: {
			variant: "default",
			appearance: "pill",
		},
	});

	/** The merged attribute payload handed to the `child` snippet. */
	export type StatusChildProps = {
		/** Always `"status"`. */
		"data-slot": "status";
		/** The resolved variant. */
		"data-variant": StatusVariant;
		/** The resolved appearance. */
		"data-appearance": StatusAppearance;
		/** Variant classes with the caller's `class` merged last. */
		class: string;
	} & Record<string, unknown>;

	export type StatusRootProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * The visual style and color theme of the status badge.
		 *
		 * - `"default"`: Neutral muted gray styling
		 * - `"success"`: Green styling for online/active states
		 * - `"destructive"`: Red styling for offline/error states
		 * - `"warning"`: Orange styling for away/warning states
		 * - `"info"`: Blue styling for idle/informational states
		 *
		 * @default "default"
		 */
		variant?: StatusVariant;
		/**
		 * How much chrome the status carries.
		 *
		 * - `"pill"`: the tinted, rounded badge — the chip in every table row and activity feed
		 * - `"bare"`: dot and label alone on the page ground, for monitoring lists and headers
		 *
		 * @default "pill"
		 */
		appearance?: StatusAppearance;
		/**
		 * Render the badge onto your own element instead of the default `<div>`.
		 * The snippet receives the merged props (class, data-slot, data-variant and every
		 * forwarded attribute) to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent.
		 * In `child` mode `children` is not rendered and `ref` is not populated — the
		 * caller owns the element.
		 */
		child?: Snippet<[{ props: StatusChildProps }]>;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		variant = "default",
		appearance = "pill",
		class: className,
		children,
		child,
		...restProps
	}: StatusRootProps = $props();

	const resolved = $derived(resolveStatusVariant(variant));
	const resolvedAppearance = $derived(resolveStatusAppearance(appearance));

	// Built once and shared by both branches, so a `child` element is styled exactly like the
	// default `<div>`. `class` can never arrive through `restProps` — it is destructured out — so
	// the computed class always wins, matching upstream's `{...rootProps} className={cn(...)}`.
	const rootAttrs: StatusChildProps = $derived({
		"data-slot": "status",
		"data-variant": resolved,
		"data-appearance": resolvedAppearance,
		class: cn(statusVariants({ variant: resolved, appearance: resolvedAppearance }), className),
		...restProps,
	});
</script>

{#if child}
	{@render child({ props: rootAttrs })}
{:else}
	<div bind:this={ref} {...rootAttrs}>
		{@render children?.()}
	</div>
{/if}
