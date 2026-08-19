<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLInputAttributes } from "svelte/elements";
	import { tv, type VariantProps } from "tailwind-variants";

	import type { ColorPickerInputChannel } from "./color.js";

	/** The joined-border variants upstream declares as `inputGroupItemVariants`. */
	export const colorPickerInputVariants = tv({
		base: "h-8 [-moz-appearance:textfield] focus-visible:z-10 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none",
		variants: {
			position: {
				first: "rounded-e-none",
				middle: "-ms-px rounded-none border-s-0",
				last: "-ms-px rounded-s-none border-s-0",
				isolated: "",
			},
		},
		defaultVariants: {
			position: "isolated",
		},
	});

	/** Where a field sits in the joined row. */
	export type ColorPickerInputFieldPosition = NonNullable<
		VariantProps<typeof colorPickerInputVariants>["position"]
	>;

	export type ColorPickerInputFieldProps = Omit<
		WithElementRef<HTMLInputAttributes, HTMLInputElement>,
		"value" | "oninput" | "type" | "files" | "color" | "children"
	> & {
		/**
		 * Which channel of the active format this field edits. A channel that is not part of the
		 * active format renders nothing.
		 */
		channel: ColorPickerInputChannel;
		/**
		 * Where the field sits in the joined row, driving its border-radius variant. Defaults to the
		 * position the channel model assigns it.
		 */
		position?: ColorPickerInputFieldPosition;
	};
</script>

<script lang="ts">
	import { Input } from "$lib/components/ui/input/index.js";

	import { getColorPickerContext } from "./color-picker.svelte.js";

	let {
		ref = $bindable(null),
		channel,
		position,
		"aria-label": ariaLabel,
		placeholder,
		class: className,
		onblur,
		...restProps
	}: ColorPickerInputFieldProps = $props();

	const root = getColorPickerContext("<ColorPicker.InputField>");

	const field = $derived(root.inputFields.find((entry) => entry.channel === channel));

	/**
	 * The half-typed text, or `null` when the field is showing the canonical value.
	 *
	 * React re-renders a controlled `<input>` back to its last valid value for free, which is how
	 * upstream discards `#3b82f`. Svelte never rewrites a DOM value the state did not change, so
	 * rejecting a keystroke by doing nothing would strand the bad text — and force-writing it back on
	 * every keystroke would send the caret to the end after each character. The draft holds the text
	 * until the field loses focus.
	 */
	let draft = $state<string | null>(null);

	const displayValue = $derived(draft ?? field?.value ?? "");

	function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
		draft = event.currentTarget.value;
		root.commitField(channel, draft);
	}

	function handleBlur(event: FocusEvent & { currentTarget: EventTarget & HTMLInputElement }) {
		onblur?.(event);
		draft = null;
	}
</script>

{#if field}
	<Input
		bind:ref
		data-slot="color-picker-input"
		data-channel={channel}
		data-disabled={root.disabled ? "" : undefined}
		data-readonly={root.readOnly ? "" : undefined}
		aria-label={ariaLabel ?? field.label}
		placeholder={placeholder ?? field.placeholder}
		inputmode={field.numeric ? "numeric" : undefined}
		pattern={field.numeric ? "[0-9]*" : undefined}
		min={field.numeric ? field.min : undefined}
		max={field.numeric ? field.max : undefined}
		disabled={root.disabled}
		readonly={root.readOnly}
		{...restProps}
		value={displayValue}
		oninput={handleInput}
		onblur={handleBlur}
		class={cn(colorPickerInputVariants({ position: position ?? field.position }), className)}
	/>
{/if}
