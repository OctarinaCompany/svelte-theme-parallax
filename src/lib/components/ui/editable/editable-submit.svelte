<script lang="ts" module>
	import type { WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type EditableSubmitChildProps = {
		type: "button";
		"aria-controls": string;
		"data-slot": "editable-submit";
		"data-disabled": "" | undefined;
		"data-readonly": "" | undefined;
		class: string | undefined;
	} & Record<string, unknown>;

	export type EditableSubmitProps = WithElementRef<
		Omit<HTMLButtonAttributes, "type">,
		HTMLButtonElement
	> & {
		/**
		 * Render the submit button onto your own element instead of the default `<button>`. The
		 * snippet receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null` — the caller owns the element.
		 */
		child?: Snippet<[{ props: EditableSubmitChildProps }]>;
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
	}: EditableSubmitProps = $props();

	const root = getEditableContext("<Editable.Submit>");

	function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		if (root.disabled || root.readOnly) return;

		onclickProp?.(event);
		if (event.defaultPrevented) return;

		// The input's own text, not the state's: a parent that declines value writes still gets the
		// text the user actually typed handed to `onSubmit`.
		root.submit(root.inputElement?.value ?? root.value);
	}

	// `data-disabled` / `data-readonly` are additions (divergence D-8): upstream emits no state
	// attributes here, and both states are reachable because the button renders while read-only.
	const submitAttrs = $derived({
		type: "button",
		"aria-controls": root.rootId,
		"data-disabled": root.disabled ? "" : undefined,
		"data-readonly": root.readOnly ? "" : undefined,
		"data-slot": "editable-submit",
		...restProps,
		// Upstream styles this button through `asChild` only, so there is no default class to merge.
		class: className,
		onclick,
	} as EditableSubmitChildProps);
</script>

{#if root.editing || root.readOnly}
	{#if child}
		{@render child({ props: submitAttrs })}
	{:else}
		<button bind:this={ref} {...submitAttrs}>
			{@render children?.()}
		</button>
	{/if}
{/if}
