<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLLabelAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type EditableLabelChildProps = {
		id: string;
		for: string;
		"data-slot": "editable-label";
		"data-disabled": "" | undefined;
		"data-invalid": "" | undefined;
		"data-required": "" | undefined;
		class: string;
	} & Record<string, unknown>;

	export type EditableLabelProps = WithElementRef<HTMLLabelAttributes, HTMLLabelElement> & {
		/**
		 * Render the label onto your own element instead of the default `<label>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null` — the caller owns the element.
		 */
		child?: Snippet<[{ props: EditableLabelChildProps }]>;
		/** The label's content. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { getEditableContext } from "./editable.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		child,
		children,
		...restProps
	}: EditableLabelProps = $props();

	const root = getEditableContext("<Editable.Label>");

	const labelAttrs = $derived({
		"data-disabled": root.disabled ? "" : undefined,
		"data-invalid": root.invalid ? "" : undefined,
		"data-required": root.required ? "" : undefined,
		"data-slot": "editable-label",
		...restProps,
		id: root.labelId,
		for: root.inputId,
		class: cn(
			"text-sm leading-none font-medium data-required:after:ml-0.5 data-required:after:text-destructive data-required:after:content-['*'] data-disabled:cursor-not-allowed data-disabled:opacity-50",
			className,
		),
	} as EditableLabelChildProps);
</script>

{#if child}
	{@render child({ props: labelAttrs })}
{:else}
	<label bind:this={ref} {...labelAttrs}>
		{@render children?.()}
	</label>
{/if}
