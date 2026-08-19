<script lang="ts" module>
	import type { WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type EditableCancelChildProps = {
		type: "button";
		"aria-controls": string;
		"data-slot": "editable-cancel";
		"data-disabled": "" | undefined;
		"data-readonly": "" | undefined;
		class: string | undefined;
	} & Record<string, unknown>;

	export type EditableCancelProps = WithElementRef<
		Omit<HTMLButtonAttributes, "type">,
		HTMLButtonElement
	> & {
		/**
		 * Render the cancel button onto your own element instead of the default `<button>`. The
		 * snippet receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null` — the caller owns the element.
		 */
		child?: Snippet<[{ props: EditableCancelChildProps }]>;
		/** The button's content. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { getEditableContext } from "./editable.svelte.js";

	let {
		ref = $bindable(null),
		onclick: onclickProp,
		class: className,
		child,
		children,
		...restProps
	}: EditableCancelProps = $props();

	const root = getEditableContext("<Editable.Cancel>");

	function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		if (root.disabled || root.readOnly) return;

		onclickProp?.(event);
		if (event.defaultPrevented) return;

		root.cancel();
	}

	// `data-disabled` / `data-readonly` are additions (divergence D-8): upstream emits no state
	// attributes here, and both states are reachable because the button renders while read-only.
	const cancelAttrs = $derived({
		type: "button",
		"aria-controls": root.rootId,
		"data-disabled": root.disabled ? "" : undefined,
		"data-readonly": root.readOnly ? "" : undefined,
		"data-slot": "editable-cancel",
		...restProps,
		// Upstream styles this button through `asChild` only, so there is no default class to merge.
		class: className,
		onclick,
	} as EditableCancelChildProps);
</script>

{#if root.editing || root.readOnly}
	{#if child}
		{@render child({ props: cancelAttrs })}
	{:else}
		<button bind:this={ref} {...cancelAttrs}>
			{@render children?.()}
		</button>
	{/if}
{/if}
