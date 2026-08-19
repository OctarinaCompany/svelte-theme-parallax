<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import { tv } from "tailwind-variants";

	/** Every value `size` accepts, smallest first. */
	export const STATUS_INDICATOR_SIZES = ["sm", "default", "lg"] as const;

	/** The diameter of the dot. */
	export type StatusIndicatorSize = (typeof STATUS_INDICATOR_SIZES)[number];

	/**
	 * Normalise a possibly untyped runtime value to a known size.
	 * Anything outside {@link STATUS_INDICATOR_SIZES} falls back to `"default"`.
	 */
	export function resolveStatusIndicatorSize(value?: string): StatusIndicatorSize {
		return STATUS_INDICATOR_SIZES.includes(value as StatusIndicatorSize)
			? (value as StatusIndicatorSize)
			: "default";
	}

	/**
	 * The dot. `before` is the ping halo, `after` the core that stays crisp while the halo
	 * scales away; both take their colour from the root through `bg-inherit`, so the size
	 * ramp has to move `after`'s inset with the diameter or the core stops being a quarter
	 * of the dot.
	 *
	 * The ramp is capped at 12px on purpose. `Status.Label` is `leading-none` on the root's
	 * `text-xs`, so the label is 12px tall and it — not the dot — sets the pill's content
	 * box at every size up to and including `lg`: the pill keeps the height it has in every
	 * table row in this theme, and the dot stays centred on the label. A fourth step at 16px
	 * would be the first one to
	 * outgrow the label and make the pill taller, so the ramp stops before it.
	 */
	export const statusIndicatorVariants = tv({
		base: "relative flex shrink-0 rounded-full before:absolute before:inset-0 before:rounded-full before:bg-inherit after:absolute after:rounded-full after:bg-inherit",
		variants: {
			size: {
				sm: "size-1.5 after:inset-[1.5px]",
				default: "size-2 after:inset-[2px]",
				lg: "size-3 after:inset-[3px]",
			},
			pulse: {
				true: "before:animate-ping",
				false: "",
			},
		},
		defaultVariants: {
			size: "default",
			pulse: true,
		},
	});

	export type StatusIndicatorProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * The diameter of the dot: `sm` 6px, `default` 8px, `lg` 12px. The pill's height is
		 * unchanged at every step. An unknown runtime value normalises to `default`.
		 *
		 * @default "default"
		 */
		size?: StatusIndicatorSize;
		/**
		 * Whether the halo pings. Pass `false` for a status that is not live — an idle or
		 * decommissioned row, or a list long enough that fifty simultaneous animations are
		 * the only thing the reader sees. The resting dot is the same dot, minus the halo.
		 *
		 * `(prefers-reduced-motion: reduce)` overrides this to `false`; the resolved value is
		 * on `[data-pulse]`.
		 *
		 * @default true
		 */
		pulse?: boolean;
	};
</script>

<script lang="ts">
	import { useReducedMotion } from "$lib/shared/reduced-motion.svelte.js";

	let {
		ref = $bindable(null),
		size = "default",
		pulse = true,
		class: className,
		children,
		...restProps
	}: StatusIndicatorProps = $props();

	// The house reader, shared with `<Swap>` and `<Shake>` rather than restated here.
	const reducedMotion = useReducedMotion();

	const resolvedSize = $derived(resolveStatusIndicatorSize(size));
	const pulsing = $derived(pulse && !reducedMotion.current);
</script>

<!--
	`data-slot="status-indicator"` is load-bearing: the root's variant classes colour this dot
	through `**:data-[slot=status-indicator]:bg-…`, and `bg-inherit` on both pseudo-elements picks
	that colour up for the ping and the core.
-->
<div
	bind:this={ref}
	data-slot="status-indicator"
	data-size={resolvedSize}
	data-pulse={pulsing ? "on" : "off"}
	class={cn(statusIndicatorVariants({ size: resolvedSize, pulse: pulsing }), className)}
	{...restProps}
>
	{@render children?.()}
</div>
