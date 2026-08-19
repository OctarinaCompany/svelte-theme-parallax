<script lang="ts" module>
	import { cn } from "$lib/utils.js";
	import type { Popover as PopoverPrimitive } from "bits-ui";

	/**
	 * Every `Popover.Content` prop, so positioning, portalling, dismissal, the focus scope and the
	 * scroll lock all stay configurable. `child` and `forceMount` are part of that surface already.
	 *
	 * When the root is `inline` the positioning props are silently ignored and a plain `<div>` renders
	 * instead, which is exactly what upstream's own inline branch does.
	 */
	export type ColorPickerContentProps = PopoverPrimitive.ContentProps;
</script>

<script lang="ts">
	import * as Popover from "$lib/components/ui/popover/index.js";

	import { getColorPickerContext } from "./color-picker.svelte.js";

	let {
		ref = $bindable(null),
		side = "bottom",
		align = "start",
		sideOffset = 4,
		trapFocus,
		preventScroll,
		class: className,
		children,
		child,
		...restProps
	}: ColorPickerContentProps = $props();

	const root = getColorPickerContext("<ColorPicker.Content>");

	const contentClass = $derived(cn("flex w-[340px] flex-col gap-4 p-4", className));

	// bits-ui puts Radix's `modal` on the content rather than the root, so the root's flag lands here.
	const isTrapped = $derived(trapFocus ?? root.modal);
	const isScrollLocked = $derived(preventScroll ?? root.modal);

	const inlineAttrs = $derived({
		"data-slot": "color-picker-content",
		"data-inline": "",
		...restProps,
		class: contentClass,
	} as Record<string, unknown>);
</script>

{#if root.inline}
	{#if child}
		{@render child({ props: inlineAttrs, open: true, wrapperProps: {} })}
	{:else}
		<div bind:this={ref} {...inlineAttrs}>
			{@render children?.()}
		</div>
	{/if}
{:else}
	<!-- bits-ui leaves the popover content unroled while its trigger advertises
	     `aria-haspopup="dialog"`; Radix's own `PopoverContent` carries `role="dialog"`, so upstream
	     parity and the trigger's promise both point the same way. A caller can still override it. -->
	<Popover.Content
		bind:ref
		role="dialog"
		data-slot="color-picker-content"
		{side}
		{align}
		{sideOffset}
		trapFocus={isTrapped}
		preventScroll={isScrollLocked}
		class={contentClass}
		{children}
		{child}
		{...restProps}
	/>
{/if}
