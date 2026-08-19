<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type EditablePreviewChildProps = {
		role: "button";
		tabindex: 0 | undefined;
		"aria-disabled": boolean;
		"data-slot": "editable-preview";
		"data-empty": "" | undefined;
		"data-disabled": "" | undefined;
		"data-readonly": "" | undefined;
		class: string;
	} & Record<string, unknown>;

	export type EditablePreviewProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/**
		 * Render the preview onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null` — the caller owns the element.
		 */
		child?: Snippet<[{ props: EditablePreviewChildProps }]>;
		/** Replaces the default content, which is the value, or the placeholder while it is empty. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { getEditableContext } from "./editable.svelte.js";

	let {
		ref = $bindable(null),
		onclick: onclickProp,
		ondblclick: ondblclickProp,
		onfocus: onfocusProp,
		onkeydown: onkeydownProp,
		class: className,
		child,
		children,
		...restProps
	}: EditablePreviewProps = $props();

	const root = getEditableContext("<Editable.Preview>");

	// The preview is the fallback focus-restore target after a cancel (divergence D-1).
	$effect(() => {
		root.previewElement = ref;
		return () => {
			root.previewElement = null;
		};
	});

	// Each handler runs the caller's first and `preventDefault()` suppresses ours, reproducing
	// upstream's `propsRef` + `defaultPrevented` pattern.
	function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onclickProp?.(event);
		if (event.defaultPrevented || root.triggerMode !== "click") return;

		root.edit(event.currentTarget);
	}

	function ondblclick(event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		ondblclickProp?.(event);
		if (event.defaultPrevented || root.triggerMode !== "dblclick") return;

		root.edit(event.currentTarget);
	}

	function onfocus(event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onfocusProp?.(event);
		if (event.defaultPrevented || root.triggerMode !== "focus") return;

		root.edit(event.currentTarget);
	}

	function onkeydown(event: KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onkeydownProp?.(event);
		if (event.defaultPrevented || event.key !== "Enter") return;

		// `Enter` edits whatever the trigger mode is — a keyboard user has no other way in.
		root.onEnterKeyDown?.(event);
		if (event.defaultPrevented) return;

		root.edit(event.currentTarget);
	}

	const previewAttrs = $derived({
		role: "button",
		"aria-disabled": root.disabled || root.readOnly,
		"data-empty": root.isEmpty ? "" : undefined,
		"data-disabled": root.disabled ? "" : undefined,
		"data-readonly": root.readOnly ? "" : undefined,
		"data-slot": "editable-preview",
		tabindex: root.disabled || root.readOnly ? undefined : 0,
		...restProps,
		class: cn(
			"cursor-text truncate rounded-sm border border-transparent py-1 text-base focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-hidden aria-invalid:border-destructive data-empty:text-muted-foreground data-readonly:cursor-default md:text-sm dark:aria-invalid:border-destructive/50 data-disabled:cursor-not-allowed data-disabled:opacity-50",
			className,
		),
		onclick,
		ondblclick,
		onfocus,
		onkeydown,
	} as EditablePreviewChildProps);
</script>

<!-- Genuinely removed from the DOM and the accessibility tree while editing. -->
{#if !root.editing && !root.readOnly}
	{#if child}
		{@render child({ props: previewAttrs })}
	{:else}
		<div bind:this={ref} {...previewAttrs}>
			{#if children}
				{@render children()}
			{:else}
				{root.value || (root.placeholder ?? "")}
			{/if}
		</div>
	{/if}
{/if}
