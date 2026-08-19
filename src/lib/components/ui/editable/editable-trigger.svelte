<script lang="ts" module>
	import type { WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type EditableTriggerChildProps = {
		type: "button";
		"aria-controls": string;
		"aria-disabled": boolean;
		"data-slot": "editable-trigger";
		"data-disabled": "" | undefined;
		"data-readonly": "" | undefined;
		class: string | undefined;
	} & Record<string, unknown>;

	export type EditableTriggerProps = WithElementRef<
		Omit<HTMLButtonAttributes, "type">,
		HTMLButtonElement
	> & {
		/**
		 * Whether the trigger stays rendered while editing or read-only.
		 *
		 * @default false
		 */
		forceMount?: boolean;
		/**
		 * Render the trigger onto your own element instead of the default `<button>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null` — the caller owns the element.
		 */
		child?: Snippet<[{ props: EditableTriggerChildProps }]>;
		/** The button's content. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { getEditableContext } from "./editable.svelte.js";

	let {
		ref = $bindable(null),
		forceMount = false,
		onclick: onclickProp,
		ondblclick: ondblclickProp,
		class: className,
		child,
		children,
		...restProps
	}: EditableTriggerProps = $props();

	const root = getEditableContext("<Editable.Trigger>");

	// Each handler runs the caller's first and `preventDefault()` suppresses ours, reproducing
	// upstream's `propsRef` + `defaultPrevented` pattern. Upstream instead overwrites
	// the caller's handler outright, and leaves the button inert under `triggerMode="focus"` — a
	// rendered "Edit" button that does nothing (divergence D-4).
	function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onclickProp?.(event);
		if (event.defaultPrevented) return;
		if (root.triggerMode === "dblclick") return;

		root.edit(event.currentTarget);
	}

	function ondblclick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		ondblclickProp?.(event);
		if (event.defaultPrevented || root.triggerMode !== "dblclick") return;

		root.edit(event.currentTarget);
	}

	const triggerAttrs = $derived({
		type: "button",
		"aria-controls": root.rootId,
		"aria-disabled": root.disabled || root.readOnly,
		"data-disabled": root.disabled ? "" : undefined,
		"data-readonly": root.readOnly ? "" : undefined,
		"data-slot": "editable-trigger",
		...restProps,
		// Upstream styles the trigger through `asChild` only, so there is no default class to merge.
		class: className,
		onclick,
		ondblclick,
	} as EditableTriggerChildProps);
</script>

<!-- Upstream wraps this in no `Presence`; `forceMount` is the documented escape hatch. -->
{#if forceMount || (!root.editing && !root.readOnly)}
	{#if child}
		{@render child({ props: triggerAttrs })}
	{:else}
		<button bind:this={ref} {...triggerAttrs}>
			{@render children?.()}
		</button>
	{/if}
{/if}
