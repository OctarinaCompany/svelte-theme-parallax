<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { NumberFieldSize } from "./number-field.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type NumberFieldRootChildProps = {
		"data-slot": "number-field";
		"data-size": NumberFieldSize;
		"data-disabled": "" | undefined;
		"data-readonly": "" | undefined;
		"data-invalid": "" | undefined;
		"data-required": "" | undefined;
		class: string;
	} & Record<string, unknown>;

	export type NumberFieldRootProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/**
		 * The committed numeric value; `null` is the empty field.
		 *
		 * Bindable: `bind:value={amount}` lets the field move your state, while the function binding
		 * `bind:value={() => amount, (next) => …}` keeps you authoritative — a setter that declines
		 * the write leaves the rendered value exactly where it was.
		 */
		value?: number | null;
		/**
		 * The initial value when uncontrolled.
		 *
		 * @default null
		 */
		defaultValue?: number | null;
		/** Called whenever the value changes — never for a write that did not move it. */
		onValueChange?: (value: number | null) => void;
		/** The smallest value the field can hold; steps and commits clamp to it. */
		min?: number;
		/** The largest value the field can hold; steps and commits clamp to it. */
		max?: number;
		/**
		 * The delta of one arrow key, spinner press, wheel notch or scrub tick.
		 *
		 * @default 1
		 */
		step?: number;
		/**
		 * The delta while `Alt` is held on an arrow key.
		 *
		 * @default 0.1
		 */
		smallStep?: number;
		/**
		 * The delta of `PageUp`/`PageDown`, and of arrow keys while `Shift` is held.
		 *
		 * @default 10
		 */
		largeStep?: number;
		/**
		 * Whether a step lands on the nearest multiple of the step used, anchored at `min` (else 0).
		 *
		 * @default false
		 */
		snapOnStep?: boolean;
		/**
		 * Whether every interaction on every part is suppressed.
		 *
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Whether the value can be focused and read but not changed.
		 *
		 * @default false
		 */
		readOnly?: boolean;
		/**
		 * Whether the field is required in a form context.
		 *
		 * @default false
		 */
		required?: boolean;
		/**
		 * Whether the field is invalid; the input mirrors it as `aria-invalid`.
		 *
		 * @default false
		 */
		invalid?: boolean;
		/** Name of the form field when used in a form. */
		name?: string;
		/** Locale of the display format; the runtime default locale when omitted. */
		locale?: Intl.LocalesArgument;
		/** `Intl.NumberFormat` options for the display format (currency, percent, precision…). */
		format?: Intl.NumberFormatOptions;
		/**
		 * Whether a wheel gesture over the focused input steps the value.
		 *
		 * @default false
		 */
		allowWheelScrub?: boolean;
		/**
		 * The size of every part; a part-level `size` overrides it locally.
		 *
		 * @default "default"
		 */
		size?: NumberFieldSize;
		/**
		 * Render the root onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element, and `children` is not rendered — the caller
		 * places the parts itself.
		 *
		 * Replaces upstream's Base UI `render` prop, which has no Svelte equivalent. In `child` mode
		 * `ref` stays `null`, so the form-control probe falls back to its optimistic pre-mount answer.
		 */
		child?: Snippet<[{ props: NumberFieldRootChildProps }]>;
		/** The composed parts. */
		children?: Snippet;
	};

	/** Upstream-parity alias of {@link NumberFieldRootProps}. */
	export type NumberFieldProps = NumberFieldRootProps;
</script>

<script lang="ts">
	import { FormControlState } from "$lib/shared/form-control.svelte.js";
	import { untrack } from "svelte";

	import { NumberFieldRootState, setNumberFieldContext } from "./number-field.svelte.js";

	let {
		ref = $bindable(null),
		value = $bindable(),
		defaultValue = null,
		onValueChange,
		min,
		max,
		step = 1,
		smallStep = 0.1,
		largeStep = 10,
		snapOnStep = false,
		disabled = false,
		readOnly = false,
		required = false,
		invalid = false,
		name,
		locale,
		format,
		allowWheelScrub = false,
		size = "default",
		id,
		class: className,
		child,
		children,
		...restProps
	}: NumberFieldRootProps = $props();

	// Uncontrolled: seed once from `defaultValue`. The check is against `undefined`, not `??=`,
	// because `null` is a legitimate controlled value (the empty field) that a default must not
	// overwrite. One-shot, so the default is read through `untrack` — reading it bare here would
	// capture only its initial value while looking like a reactive read.
	if (value === undefined) value = untrack(() => defaultValue);

	const uid = $props.id();

	setNumberFieldContext(
		new NumberFieldRootState({
			getValue: () => value ?? null,
			setValue: (next) => {
				// The callback is a change notification, so a clamped step that lands on the current
				// value must not fire it — the same `Object.is` guard `editable.svelte` uses.
				if (Object.is(value ?? null, next)) return;
				value = next;
				onValueChange?.(next);
			},
			getMin: () => min,
			getMax: () => max,
			getStep: () => step,
			getSmallStep: () => smallStep,
			getLargeStep: () => largeStep,
			getSnapOnStep: () => snapOnStep,
			getDisabled: () => disabled,
			getReadOnly: () => readOnly,
			getRequired: () => required,
			getInvalid: () => invalid,
			getSize: () => size,
			getLocale: () => locale,
			getFormat: () => format,
			getAllowWheelScrub: () => allowWheelScrub,
			// Upstream parks `id` on the root `<div>`, so a `<label for>`
			// pointing at it focuses nothing. Here the id lands on the `<input>` instead: the demo's
			// `FieldLabel htmlFor` and the scrub area's own label both reach a focusable control.
			// One-shot, like every other id in the repo.
			inputId: untrack(() => id) ?? uid,
		}),
	);

	const formControl = new FormControlState({ getElement: () => ref });

	let formInput = $state<HTMLInputElement | null>(null);

	/**
	 * The last value handed to the form. Deliberately not reactive: Svelte has already written the
	 * `value` attribute by the time the effect runs, so the element itself cannot say whether the
	 * value moved, and a form library listening on the form needs a native event — the same
	 * dispatch pattern as `editable.svelte`.
	 */
	let dispatchedValue = untrack(() => (value == null ? "" : String(value)));

	$effect(() => {
		const element = formInput;
		const next = value == null ? "" : String(value);
		if (!element || next === dispatchedValue) return;

		dispatchedValue = next;
		element.value = next;
		element.dispatchEvent(new Event("input", { bubbles: true }));
	});

	const rootAttrs = $derived({
		"data-slot": "number-field",
		"data-size": size,
		"data-disabled": disabled ? "" : undefined,
		"data-readonly": readOnly ? "" : undefined,
		"data-invalid": invalid ? "" : undefined,
		"data-required": required ? "" : undefined,
		...restProps,
		class: cn("flex w-full flex-col items-start gap-2", className),
	} as NumberFieldRootChildProps);
</script>

{#if child}
	{@render child({ props: rootAttrs })}
{:else}
	<div bind:this={ref} {...rootAttrs}>
		{@render children?.()}
	</div>
{/if}

{#if formControl.isFormControl}
	<!--
		A clipped `type="text"` input rather than `type="hidden"`: `type="hidden"` is barred from
		constraint validation, which would make a `required` field with no value submit happily.
		Same pattern as `editable`, `tags-input` and `checkbox-group-item`. It carries the raw
		number (`"1234.5"`), not the formatted display text — what a form consumer can parse.
	-->
	<input
		bind:this={formInput}
		type="text"
		data-slot="number-field-form-input"
		aria-hidden="true"
		tabindex={-1}
		{name}
		value={value == null ? "" : String(value)}
		{disabled}
		{required}
		readonly={readOnly}
		style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; white-space: nowrap; border: 0; clip-path: inset(50%);"
	/>
{/if}
