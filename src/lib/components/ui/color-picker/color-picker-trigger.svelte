<script lang="ts" module>
	import {
		buttonVariants,
		type ButtonSize,
		type ButtonVariant,
	} from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import type { Popover as PopoverPrimitive } from "bits-ui";
	import type { Snippet } from "svelte";

	/** The merged attribute payload handed to the `child` snippet. */
	export type ColorPickerTriggerChildProps = {
		type: "button";
		"data-slot": "color-picker-trigger";
		"data-disabled": "" | undefined;
		"data-readonly": "" | undefined;
		disabled: boolean;
		class: string;
	} & Record<string, unknown>;

	export type ColorPickerTriggerProps = Omit<
		PopoverPrimitive.TriggerProps,
		"children" | "child" | "disabled"
	> & {
		/**
		 * Whether the trigger is disabled. OR-ed with the picker's own `disabled`.
		 *
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * The button style. Upstream renders its trigger through the shared `Button`, so the same
		 * variants are available here.
		 *
		 * @default "outline"
		 */
		variant?: ButtonVariant;
		/**
		 * The button size.
		 *
		 * @default "icon"
		 */
		size?: ButtonSize;
		/**
		 * The trigger's content — typically `<ColorPicker.Swatch />`.
		 */
		children?: Snippet;
		/**
		 * Render the trigger onto your own element instead of the default `<button>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild`. In `child` mode `ref` stays `null`.
		 */
		child?: Snippet<[{ props: ColorPickerTriggerChildProps }]>;
	};
</script>

<script lang="ts">
	import * as Popover from "$lib/components/ui/popover/index.js";

	import { getColorPickerContext } from "./color-picker.svelte.js";

	let {
		ref = $bindable(null),
		disabled = false,
		variant = "outline",
		size = "icon",
		class: className,
		children,
		child: childSnippet,
		...restProps
	}: ColorPickerTriggerProps = $props();

	const root = getColorPickerContext("<ColorPicker.Trigger>");

	const isDisabled = $derived(disabled || root.disabled);

	/**
	 * A real `<button type="button">`, not upstream's `asChild`-merged `<div role="img">` swatch: that
	 * trigger is neither focusable nor activatable, which contradicts upstream's own documented
	 * `Enter`/`Space` behaviour. `data-state` and `aria-expanded` come from the
	 * composed `Popover.Trigger`, which is also where the keyboard activation comes from.
	 */
	const triggerAttrs = $derived({
		type: "button",
		"data-slot": "color-picker-trigger",
		"data-disabled": isDisabled ? "" : undefined,
		"data-readonly": root.readOnly ? "" : undefined,
		disabled: isDisabled,
		...restProps,
		class: cn(buttonVariants({ variant, size }), "p-0", className),
	} as ColorPickerTriggerChildProps);
</script>

{#if childSnippet}
	<Popover.Trigger {...triggerAttrs}>
		{#snippet child({ props })}
			{@render childSnippet({
				props: { ...triggerAttrs, ...props } as ColorPickerTriggerChildProps,
			})}
		{/snippet}
	</Popover.Trigger>
{:else}
	<Popover.Trigger bind:ref {...triggerAttrs}>
		{@render children?.()}
	</Popover.Trigger>
{/if}
