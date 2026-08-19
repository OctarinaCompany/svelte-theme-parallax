<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import {
		CircularProgressState,
		DEFAULT_MAX,
		DEFAULT_MIN,
		DEFAULT_SIZE,
		DEFAULT_THICKNESS,
		getDefaultValueText,
		isValidMaxNumber,
		isValidValueNumber,
		setCircularProgressContext,
		type ProgressState,
	} from "./circular-progress.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type CircularProgressChildProps = {
		role: "progressbar";
		"aria-describedby"?: string;
		"aria-labelledby"?: string;
		"aria-valuemax": number;
		"aria-valuemin": number;
		"aria-valuenow"?: number;
		"aria-valuetext"?: string;
		"data-slot": "circular-progress";
		"data-state": ProgressState;
		"data-value"?: number;
		"data-max": number;
		"data-min": number;
		"data-percentage"?: number;
		class: string;
	} & Record<string, unknown>;

	export type CircularProgressRootProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * The current progress value as a number between the min and max values.
		 * Set to `null` or `undefined` for indeterminate progress.
		 */
		value?: number | null | undefined;
		/**
		 * A function that returns the accessible text representation of the current value.
		 * Useful for providing custom formatting or localization.
		 *
		 * @default (value, min, max) => Math.round(((value - min) / (max - min)) * 100) + "%"
		 */
		getValueText?: (value: number, min: number, max: number) => string;
		/**
		 * The minimum allowed value for the progress.
		 * @default 0
		 */
		min?: number;
		/**
		 * The maximum allowed value for the progress.
		 * Must be a positive number greater than 0.
		 * @default 100
		 */
		max?: number;
		/**
		 * The size of the circular progress in pixels.
		 * This determines both the width and height of the component.
		 * @default 48
		 */
		size?: number;
		/**
		 * The thickness of the progress track and range in pixels.
		 * A larger value creates a thicker progress ring.
		 * @default 4
		 */
		thickness?: number;
		/** Visible label rendered inside the root and wired via `aria-labelledby`. */
		label?: string;
		/**
		 * Render the progress onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children`/`label` are not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: CircularProgressChildProps }]>;
	};
</script>

<script lang="ts">
	import { untrack } from "svelte";

	let {
		ref = $bindable(null),
		value = null,
		getValueText = getDefaultValueText,
		min = DEFAULT_MIN,
		max = DEFAULT_MAX,
		size = DEFAULT_SIZE,
		thickness = DEFAULT_THICKNESS,
		label,
		class: className,
		children,
		child,
		...restProps
	}: CircularProgressRootProps = $props();

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
				`Invalid prop \`max\` of value \`${max}\` supplied to \`CircularProgress\`. Only numbers greater than 0 are valid. Defaulting to ${DEFAULT_MAX}.`,
			);
		}
		if (thickness >= size) {
			console.warn(
				`CircularProgress: thickness (${thickness}) should be less than size (${size}) for proper rendering.`,
			);
		}
	});

	const state = new CircularProgressState({
		getValue: () => value,
		getGetValueText: () => getValueText,
		getMin: () => min,
		getMax: () => max,
		getSize: () => size,
		getThickness: () => thickness,
		getValueTextId: () => valueTextId,
	});

	setCircularProgressContext(state);

	untrack(() => {
		if (!import.meta.env.DEV) return;

		if (value !== null && value !== undefined && !isValidValueNumber(value, state.min, state.max)) {
			console.error(
				`Invalid prop \`value\` of value \`${value}\` supplied to \`CircularProgress\`. The \`value\` prop must be a number between \`min\` and \`max\` (inclusive), or \`null\`/\`undefined\` for indeterminate progress. The value will be clamped to the valid range.`,
			);
		}
	});

	// Built once and shared by both branches, so a `child` element is styled and wired exactly like
	// the default `<div>`. `class` can never arrive through `restProps` — it is destructured out —
	// so the computed class always wins, matching upstream's `{...rootProps} className={cn(...)}`.
	const rootAttrs = $derived({
		role: "progressbar",
		// `describedBy` is set only while a `<CircularProgress.ValueText>` is mounted, and the label
		// element only renders in the default branch — neither idref may dangle in `child` mode.
		"aria-describedby": state.describedBy,
		"aria-labelledby": label && !child ? labelId : undefined,
		"aria-valuemax": state.max,
		"aria-valuemin": state.min,
		"aria-valuenow": state.value ?? undefined,
		"aria-valuetext": state.valueText,
		"data-slot": "circular-progress",
		"data-state": state.state,
		"data-value": state.value ?? undefined,
		"data-max": state.max,
		"data-min": state.min,
		"data-percentage": state.percentage ?? undefined,
		...restProps,
		class: cn("relative inline-flex w-fit items-center justify-center", className),
	} as CircularProgressChildProps);
</script>

{#if child}
	{@render child({ props: rootAttrs })}
{:else}
	<div bind:this={ref} {...rootAttrs}>
		{@render children?.()}
		{#if label}
			<div id={labelId}>{label}</div>
		{/if}
	</div>
{/if}
