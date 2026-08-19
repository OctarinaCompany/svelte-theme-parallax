<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet, spread onto the select trigger. */
	export type ColorPickerFormatSelectChildProps = {
		"aria-label": string;
		"data-slot": "color-picker-format-select-trigger";
		"data-disabled": "" | undefined;
		"data-readonly": "" | undefined;
		class: string;
	} & Record<string, unknown>;

	/**
	 * Every `Select.Root` prop the picker does not own itself — `type`, `value` and `onValueChange`
	 * are driven by the picker's `format`. Everything else spreads onto the select trigger, which is
	 * the element a consumer actually styles and queries.
	 */
	export type ColorPickerFormatSelectProps = Omit<
		WithElementRef<HTMLButtonAttributes, HTMLButtonElement>,
		"type" | "children"
	> & {
		/**
		 * The trigger's size.
		 *
		 * @default "sm"
		 */
		size?: "sm" | "default";
		/**
		 * Whether the select is disabled. OR-ed with the picker's own `disabled`.
		 *
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Whether the listbox is open.
		 *
		 * Bindable.
		 */
		open?: boolean;
		/** Callback fired whenever the listbox opens or closes. */
		onOpenChange?: (open: boolean) => void;
		/**
		 * The trigger's accessible name.
		 *
		 * @default "Color format"
		 */
		"aria-label"?: string;
		/**
		 * Render the trigger onto your own element instead of the default select trigger. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild`. In `child` mode `ref` stays `null`.
		 */
		child?: Snippet<[{ props: ColorPickerFormatSelectChildProps }]>;
	};
</script>

<script lang="ts">
	import * as Select from "$lib/components/ui/select/index.js";
	import { Select as SelectPrimitiveComponents } from "bits-ui";

	import { COLOR_FORMATS, isColorFormat } from "./color.js";
	import { getColorPickerContext } from "./color-picker.svelte.js";

	let {
		ref = $bindable(null),
		size = "sm",
		disabled = false,
		open = $bindable(false),
		onOpenChange,
		"aria-label": ariaLabel = "Color format",
		class: className,
		child: childSnippet,
		...restProps
	}: ColorPickerFormatSelectProps = $props();

	const root = getColorPickerContext("<ColorPicker.FormatSelect>");

	const isDisabled = $derived(disabled || root.disabled);

	const triggerAttrs = $derived({
		"aria-label": ariaLabel,
		"data-slot": "color-picker-format-select-trigger",
		"data-disabled": isDisabled ? "" : undefined,
		"data-readonly": root.readOnly ? "" : undefined,
		...restProps,
		class: cn("uppercase", className),
	} as ColorPickerFormatSelectChildProps);
</script>

<Select.Root
	type="single"
	disabled={isDisabled}
	bind:open
	{onOpenChange}
	bind:value={() => root.format, (next) => root.setFormat(isColorFormat(next) ? next : "hex")}
>
	{#if childSnippet}
		<SelectPrimitiveComponents.Trigger {...triggerAttrs}>
			{#snippet child({ props })}
				{@render childSnippet({
					props: { ...triggerAttrs, ...props } as ColorPickerFormatSelectChildProps,
				})}
			{/snippet}
		</SelectPrimitiveComponents.Trigger>
	{:else}
		<Select.Trigger bind:ref {size} {...triggerAttrs}>
			{root.format.toUpperCase()}
		</Select.Trigger>
	{/if}
	<Select.Content data-slot="color-picker-format-select">
		<Select.Group>
			{#each COLOR_FORMATS as format (format)}
				<Select.Item value={format} label={format.toUpperCase()}>
					{format.toUpperCase()}
				</Select.Item>
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root>
