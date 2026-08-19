<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the item's `child` snippet. */
	export type ListboxItemChildProps = {
		role: "option";
		"aria-selected": boolean;
		"aria-disabled"?: "true";
		"data-slot": "listbox-item";
		"data-selected"?: "";
		"data-highlighted"?: "";
		"data-focused"?: "";
		"data-disabled"?: "";
		tabindex?: -1;
		class: string;
	} & Record<string, unknown>;

	export type ListboxItemProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, "onselect">,
		HTMLDivElement
	> & {
		/** The value of the option. Cannot be an empty string. */
		value: string;
		/**
		 * Whether the option is disabled, independently of the root's `disabled`.
		 * @default false
		 */
		disabled?: boolean;
		/** Called with the option's own value just before the selection is applied. */
		onSelect?: (value: string) => void;
		/** The option's content — normally its label and a `<Listbox.ItemIndicator>`. */
		children?: Snippet;
		/** Render the option onto your own element instead of the default `<div>`. */
		child?: Snippet<[{ props: ListboxItemChildProps }]>;
	};
</script>

<script lang="ts">
	import { untrack } from "svelte";
	import { createAttachmentKey } from "svelte/attachments";

	import { getListboxContext, ListboxItemState, setListboxItemContext } from "./listbox.svelte.js";

	let {
		ref = $bindable(null),
		value,
		disabled = false,
		onSelect,
		class: className,
		children,
		child,
		onclick,
		onfocus,
		onblur,
		onkeydown,
		onpointermove,
		onpointerleave,
		...restProps
	}: ListboxItemProps = $props();

	// A one-shot initialisation check, exactly where upstream's layout effect throws, so
	// `expect(() => render(...)).toThrow(...)` works. `untrack` says "read this once" rather than
	// looking like a reactive read that only ever captures the initial value.
	if (untrack(() => value) === "") {
		throw new Error("ListboxItem value cannot be an empty string");
	}

	const root = getListboxContext("<Listbox.Item>");

	const item = setListboxItemContext(
		new ListboxItemState({
			root,
			getValue: () => value,
			getDisabled: () => disabled,
		}),
	);

	/** The element the option rendered onto — `ref` is always `null` in `child` mode. */
	let mountedElement = $state<HTMLElement | null>(null);
	const attachItem = createAttachmentKey();

	function captureElement(element: HTMLElement) {
		mountedElement = element;
		return () => {
			if (mountedElement === element) mountedElement = null;
		};
	}

	const element = $derived(ref ?? mountedElement);

	// The collection holds a snapshot rather than a bag of getters, so re-registering is how a change
	// is published. Every read of the registry itself is untracked inside `register`, because a
	// tracked read of the list this effect appends to would re-run it forever.
	$effect(() =>
		root.collection.register({
			element,
			value,
			disabled: item.isDisabled,
			onSelect,
			textValue: (element?.textContent ?? "").trim(),
		}),
	);

	/** The `currentTarget`-narrowed event shapes Svelte hands to a `<div>`'s own handlers. */
	type ItemMouseEvent = MouseEvent & { currentTarget: EventTarget & HTMLDivElement };
	type ItemFocusEvent = FocusEvent & { currentTarget: EventTarget & HTMLDivElement };
	type ItemKeyboardEvent = KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement };
	type ItemPointerEvent = PointerEvent & { currentTarget: EventTarget & HTMLDivElement };

	// Each handler runs the caller's first and `preventDefault()` suppresses ours, reproducing
	// upstream's `composeEventHandlers`.
	function handleClick(event: ItemMouseEvent) {
		onclick?.(event);
		if (event.defaultPrevented || item.isDisabled) return;

		// Upstream's `multiple && (multiple === true || ctrlKey || metaKey)` collapses to `multiple`.
		root.selectItem(value, root.multiple);
	}

	function handleFocus(event: ItemFocusEvent) {
		onfocus?.(event);
		if (event.defaultPrevented || item.isDisabled) return;

		root.markFocused(value);
	}

	function handleBlur(event: ItemFocusEvent) {
		onblur?.(event);
		if (event.defaultPrevented) return;

		root.focusedValue = null;
	}

	function handleKeydown(event: ItemKeyboardEvent) {
		onkeydown?.(event);
		if (event.defaultPrevented) return;

		// Leaving forwards drops the active focus; `Shift+Tab` is the root's business.
		if (event.key === "Tab" && !event.shiftKey) root.focusedValue = null;
	}

	function handlePointermove(event: ItemPointerEvent) {
		onpointermove?.(event);
		if (event.defaultPrevented || item.isDisabled) return;

		root.highlightedValue = value;
	}

	function handlePointerleave(event: ItemPointerEvent) {
		onpointerleave?.(event);
		if (event.defaultPrevented) return;

		root.highlightedValue = null;
	}

	const itemAttrs = $derived({
		[attachItem]: captureElement,
		role: "option",
		"aria-selected": item.isSelected,
		"aria-disabled": item.isDisabled ? "true" : undefined,
		"data-slot": "listbox-item",
		"data-selected": item.isSelected ? "" : undefined,
		"data-highlighted": item.isHighlighted ? "" : undefined,
		"data-focused": item.isFocused ? "" : undefined,
		"data-disabled": item.isDisabled ? "" : undefined,
		tabindex: item.isDisabled ? undefined : -1,
		...restProps,
		onclick: handleClick,
		onfocus: handleFocus,
		onblur: handleBlur,
		onkeydown: handleKeydown,
		onpointermove: handlePointermove,
		onpointerleave: handlePointerleave,
		class: cn(
			"flex w-full cursor-default items-center justify-between gap-2 rounded-md p-4 ring-1 ring-border outline-hidden select-none focus-visible:ring-ring data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50",
			className,
		),
	} as ListboxItemChildProps);
</script>

{#if child}
	{@render child({ props: itemAttrs })}
{:else}
	<div bind:this={ref} {...itemAttrs}>
		{@render children?.()}
	</div>
{/if}
