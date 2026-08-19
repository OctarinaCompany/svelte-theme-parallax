<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLInputAttributes } from "svelte/elements";

	export type ColorPickerInputProps = Omit<
		WithElementRef<HTMLInputAttributes, HTMLInputElement>,
		"value" | "oninput" | "type" | "files" | "color" | "children"
	> & {
		/**
		 * Omit the alpha field from every format.
		 *
		 * @default false
		 */
		withoutAlpha?: boolean;
	};
</script>

<script lang="ts">
	import { getColorPickerContext } from "./color-picker.svelte.js";
	import InputField from "./color-picker-input-field.svelte";

	let {
		ref = $bindable(null),
		withoutAlpha = false,
		class: className,
		...restProps
	}: ColorPickerInputProps = $props();

	const root = getColorPickerContext("<ColorPicker.Input>");

	const fields = $derived(root.getFields(withoutAlpha));

	/** Upstream widths: the hex field grows, every numeric channel is a fixed 3.5rem. */
	function fieldClass(channel: string): string {
		return channel === "hex" ? "flex-1 font-mono" : "w-14";
	}
</script>

{#if fields.length > 1}
	<div data-slot="color-picker-input-wrapper" class={cn("flex items-center", className)}>
		{#each fields as field (field.channel)}
			<InputField
				channel={field.channel}
				position={field.position}
				class={fieldClass(field.channel)}
				{...restProps}
			/>
		{/each}
	</div>
{:else if fields[0]}
	<!-- `format="hex"` with `withoutAlpha` is a lone field with no wrapper, matching upstream's
	     `HexInput` early return. -->
	<InputField
		bind:ref
		channel={fields[0].channel}
		position="isolated"
		class={cn("font-mono", className)}
		{...restProps}
	/>
{/if}
