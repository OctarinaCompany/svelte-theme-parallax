<script lang="ts" module>
	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type EditableAreaChildProps = {
		role: "group";
		dir: Direction;
		"data-slot": "editable-area";
		"data-disabled": "" | undefined;
		"data-editing": "" | undefined;
		class: string;
	} & Record<string, unknown>;

	export type EditableAreaProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, "dir">,
		HTMLDivElement
	> & {
		/**
		 * Render the area onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null` — the caller owns the element.
		 */
		child?: Snippet<[{ props: EditableAreaChildProps }]>;
		/** The preview and the input. */
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
	}: EditableAreaProps = $props();

	const root = getEditableContext("<Editable.Area>");

	const areaAttrs = $derived({
		role: "group",
		"data-disabled": root.disabled ? "" : undefined,
		"data-editing": root.editing ? "" : undefined,
		"data-slot": "editable-area",
		dir: root.dir,
		...restProps,
		class: cn(
			"relative inline-block min-w-0 data-disabled:cursor-not-allowed data-disabled:opacity-50",
			className,
		),
	} as EditableAreaChildProps);
</script>

{#if child}
	{@render child({ props: areaAttrs })}
{:else}
	<div bind:this={ref} {...areaAttrs}>
		{@render children?.()}
	</div>
{/if}
