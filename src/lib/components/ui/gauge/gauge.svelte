<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import {
		DEFAULT_MAX,
		DEFAULT_MIN,
		isValidMaxNumber,
		isValidValueNumber,
	} from "$lib/components/ui/circular-progress/index.js";
	import {
		DEFAULT_END_ANGLE,
		DEFAULT_GAUGE_SIZE,
		DEFAULT_GAUGE_THICKNESS,
		DEFAULT_START_ANGLE,
		getDefaultGaugeValueText,
		GaugeRootState,
		setGaugeContext,
		type GaugeState,
	} from "./gauge.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type GaugeChildProps = {
		role: "meter";
		"aria-describedby"?: string;
		"aria-labelledby"?: string;
		"aria-valuemax": number;
		"aria-valuemin": number;
		"aria-valuenow"?: number;
		"aria-valuetext"?: string;
		"data-slot": "gauge";
		"data-state": GaugeState;
		"data-value"?: number;
		"data-max": number;
		"data-min": number;
		"data-percentage"?: number;
		class: string;
	} & Record<string, unknown>;

	export type GaugeRootProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * The current gauge value as a number between the min and max values.
		 * Set to `null` or `undefined` for indeterminate state.
		 */
		value?: number | null | undefined;
		/**
		 * A function that returns the accessible text representation of the current value.
		 * Useful for providing custom formatting or localization.
		 *
		 * @default (value, min, max) => Math.round(((value - min) / (max - min)) * 100).toString()
		 */
		getValueText?: (value: number, min: number, max: number) => string;
		/**
		 * The minimum allowed value for the gauge.
		 * @default 0
		 */
		min?: number;
		/**
		 * The maximum allowed value for the gauge.
		 * Must be a positive number greater than 0.
		 * @default 100
		 */
		max?: number;
		/**
		 * The size of the gauge in pixels.
		 * This determines both the width and height of the component.
		 * @default 120
		 */
		size?: number;
		/**
		 * The thickness of the gauge track and range in pixels.
		 * A larger value creates a thicker gauge ring.
		 * @default 8
		 */
		thickness?: number;
		/**
		 * The starting angle of the gauge arc, in degrees clockwise from 12 o'clock.
		 * @default 0
		 */
		startAngle?: number;
		/**
		 * The ending angle of the gauge arc, in degrees clockwise from 12 o'clock.
		 * @default 360
		 */
		endAngle?: number;
		/**
		 * Render the gauge onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: GaugeChildProps }]>;
	};
</script>

<script lang="ts">
	import { untrack } from "svelte";

	let {
		ref = $bindable(null),
		value = null,
		getValueText = getDefaultGaugeValueText,
		min = DEFAULT_MIN,
		max = DEFAULT_MAX,
		size = DEFAULT_GAUGE_SIZE,
		thickness = DEFAULT_GAUGE_THICKNESS,
		startAngle = DEFAULT_START_ANGLE,
		endAngle = DEFAULT_END_ANGLE,
		class: className,
		children,
		child,
		...restProps
	}: GaugeRootProps = $props();

	const uid = $props.id();
	const labelId = `${uid}-label`;
	const valueTextId = `${uid}-value-text`;

	// Dev-only diagnostics, upstream verbatim, evaluated once against the initial props — not part
	// of the test surface. `untrack` documents that this is a deliberate one-time
	// read of reactive props, not a reactivity bug.
	untrack(() => {
		if (!import.meta.env.DEV) return;

		if (!isValidMaxNumber(max)) {
			console.error(
				`Invalid prop \`max\` of value \`${max}\` supplied to \`Gauge\`. Only numbers greater than 0 are valid. Defaulting to ${DEFAULT_MAX}.`,
			);
		}
		if (thickness >= size) {
			console.warn(
				`Gauge: thickness (${thickness}) should be less than size (${size}) for proper rendering.`,
			);
		}
	});

	const state = new GaugeRootState({
		getValue: () => value,
		getGetValueText: () => getValueText,
		getMin: () => min,
		getMax: () => max,
		getSize: () => size,
		getThickness: () => thickness,
		getStartAngle: () => startAngle,
		getEndAngle: () => endAngle,
		getLabelId: () => labelId,
		getValueTextId: () => valueTextId,
	});

	setGaugeContext(state);

	untrack(() => {
		if (!import.meta.env.DEV) return;

		if (value !== null && value !== undefined && !isValidValueNumber(value, state.min, state.max)) {
			console.error(
				`Invalid prop \`value\` of value \`${value}\` supplied to \`Gauge\`. The \`value\` prop must be a number between \`min\` and \`max\` (inclusive), or \`null\`/\`undefined\` for indeterminate state. The value will be clamped to the valid range.`,
			);
		}
	});

	// Built once and shared by both branches, so a `child` element is styled and wired exactly like
	// the default `<div>`. `class` can never arrive through `restProps` — it is destructured out —
	// so the computed class always wins, matching upstream's `{...rootProps} className={cn(...)}`.
	const rootAttrs = $derived({
		role: "meter",
		"aria-describedby": state.hasValueText ? valueTextId : undefined,
		"aria-labelledby": state.hasLabel ? labelId : undefined,
		"aria-valuemax": state.max,
		"aria-valuemin": state.min,
		"aria-valuenow": state.value ?? undefined,
		"aria-valuetext": state.valueText,
		"data-slot": "gauge",
		"data-state": state.state,
		"data-value": state.value ?? undefined,
		"data-max": state.max,
		"data-min": state.min,
		"data-percentage": state.percentage ?? undefined,
		...restProps,
		class: cn("relative inline-flex w-fit flex-col items-center justify-center", className),
	} as GaugeChildProps);
</script>

{#if child}
	{@render child({ props: rootAttrs })}
{:else}
	<div bind:this={ref} {...rootAttrs}>
		{@render children?.()}
	</div>
{/if}
