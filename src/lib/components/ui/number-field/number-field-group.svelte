<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { NumberFieldSize } from "./number-field.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type NumberFieldGroupChildProps = {
		"data-slot": "number-field-group";
		"data-size": NumberFieldSize;
		"data-disabled": "" | undefined;
		role: "group";
		"aria-invalid": true | undefined;
		class: string;
	} & Record<string, unknown>;

	export type NumberFieldGroupProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/**
		 * The size of this group's frame. Inherits from the `<NumberField.Root>` if not specified —
		 * upstream's context fallback.
		 */
		size?: NumberFieldSize;
		/**
		 * Render the group onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 */
		child?: Snippet<[{ props: NumberFieldGroupChildProps }]>;
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { getNumberFieldContext, numberFieldGroupVariants } from "./number-field.svelte.js";

	let {
		ref = $bindable(null),
		size: sizeProp,
		class: className,
		child,
		children,
		...restProps
	}: NumberFieldGroupProps = $props();

	const root = getNumberFieldContext("<NumberField.Group>");

	const size = $derived(sizeProp ?? root.size);

	// `aria-invalid` reflects the root's `invalid` but sits before `..restProps`, so a caller
	// passing it explicitly — as the form demo does on this very part — always wins.
	const groupAttrs = $derived({
		"data-slot": "number-field-group",
		"data-size": size,
		"data-disabled": root.disabled ? "" : undefined,
		role: "group",
		"aria-invalid": root.invalid ? true : undefined,
		...restProps,
		class: cn(numberFieldGroupVariants({ size }), className),
	} as NumberFieldGroupChildProps);
</script>

{#if child}
	{@render child({ props: groupAttrs })}
{:else}
	<div bind:this={ref} {...groupAttrs}>
		{@render children?.()}
	</div>
{/if}
