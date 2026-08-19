<script lang="ts" module>
	import { buttonVariants, type ButtonProps } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import type { Snippet } from "svelte";

	import type { SelectionToolbarItemSelectEvent } from "./selection-toolbar.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type SelectionToolbarItemChildProps = {
		type: "button";
		"data-slot": "selection-toolbar-item";
		/** Button variant classes, the square icon size, and the caller's `class` merged last. */
		class: string;
	} & Record<string, unknown>;

	export type SelectionToolbarItemProps = Omit<ButtonProps, "onselect"> & {
		/**
		 * Called with the text that was selected when the item was activated, and with the bubbling,
		 * cancelable `selectiontoolbar.select` event it is registered on.
		 */
		onSelect?: (text: string, event: SelectionToolbarItemSelectEvent) => void;
		/**
		 * Render the item onto your own element instead of the default `<button>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null` — the caller owns the element.
		 */
		child?: Snippet<[{ props: SelectionToolbarItemChildProps }]>;
	};
</script>

<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";

	import {
		getSelectionToolbarContext,
		SELECTION_TOOLBAR_ITEM_SELECT,
		SELECTION_TOOLBAR_ITEM_SELECT_OPTIONS,
	} from "./selection-toolbar.svelte.js";

	let {
		ref = $bindable(null),
		variant = "ghost",
		size = "icon",
		disabled,
		onSelect,
		onclick: onclickProp,
		onpointerdown: onpointerdownProp,
		onpointerup: onpointerupProp,
		class: className,
		child,
		children,
		...restProps
	}: SelectionToolbarItemProps = $props();

	const root = getSelectionToolbarContext("<SelectionToolbar.Item>");

	/**
	 * Upstream's `pointerTypeRef` (603-604), defaulted to `"touch"` on purpose: a keyboard
	 * activation produces a `click` with no pointer event at all, and the `"touch"` default is what
	 * routes it down the `click` branch. Unlike upstream's, the flag is consumed in `onclick`
	 * (see there), so the routing survives past the first mouse activation. A plain `let`,
	 * never rendered.
	 */
	let pointerType: string = "touch";

	// `ButtonProps` handlers are the intersection of the button and anchor DOM signatures, because
	// `Button` renders either element depending on `href`. Widening to their shared supertype here is
	// what lets one implementation satisfy both call signatures (the `action-bar-item.svelte`
	// precedent).
	const onclickCaller = $derived(
		onclickProp as unknown as ((event: MouseEvent) => void) | undefined,
	);
	const onpointerdownCaller = $derived(
		onpointerdownProp as unknown as ((event: PointerEvent) => void) | undefined,
	);
	const onpointerupCaller = $derived(
		onpointerupProp as unknown as ((event: PointerEvent) => void) | undefined,
	);

	/**
	 * Upstream's `onSelect` (606-627): a real DOM event with `onSelect` as its one-shot listener.
	 *
	 * The element comes from the activating event rather than from `ref`, so the dispatch still
	 * happens on the caller's own element in `child` mode, where `ref` stays `null` by contract.
	 */
	function activate(element: EventTarget) {
		const text = root.selectedText;
		const selectEvent = new CustomEvent(SELECTION_TOOLBAR_ITEM_SELECT, {
			...SELECTION_TOOLBAR_ITEM_SELECT_OPTIONS,
			detail: { text },
		});

		element.addEventListener(
			SELECTION_TOOLBAR_ITEM_SELECT,
			(event) => onSelect?.(text, event as SelectionToolbarItemSelectEvent),
			{ once: true },
		);

		element.dispatchEvent(selectEvent);
	}

	function onpointerdown(event: PointerEvent) {
		pointerType = event.pointerType;
		onpointerdownCaller?.(event);

		// Mouse only. Preventing the default is what stops the browser from collapsing the selection
		// on press; doing it for touch would break the platform's own selection handles.
		if (event.pointerType === "mouse") {
			event.preventDefault();
		}
	}

	function onclick(event: MouseEvent) {
		onclickCaller?.(event);
		if (event.defaultPrevented) return;

		// A disabled button is inert by native semantics, but pointer events still reach it in some
		// engines, so the guard is explicit rather than implied.
		if (disabled || !event.currentTarget) return;

		// Consume the flag here, and only here: `click` is the last event of a mouse sequence, so
		// restoring the `"touch"` default lets a later keyboard activation (a `click` with no
		// pointer event) take this branch. Resetting in `onpointerup` instead would double-activate
		// — the trailing `click` would see `"touch"` and fire again. Divergence from upstream,
		// which never resets and swallows keyboard activations after a mouse press.
		const type = pointerType;
		pointerType = "touch";
		if (type !== "mouse") activate(event.currentTarget);
	}

	function onpointerup(event: PointerEvent) {
		onpointerupCaller?.(event);
		if (event.defaultPrevented) return;

		if (disabled || !event.currentTarget) return;
		if (pointerType === "mouse") activate(event.currentTarget);
	}

	const itemAttrs = $derived({
		type: "button",
		"data-slot": "selection-toolbar-item",
		disabled,
		...restProps,
		class: cn(buttonVariants({ variant, size }), "size-8", className),
		onclick,
		onpointerdown,
		onpointerup,
	} as SelectionToolbarItemChildProps);
</script>

{#if child}
	{@render child({ props: itemAttrs })}
{:else}
	<Button
		bind:ref
		type="button"
		data-slot="selection-toolbar-item"
		{variant}
		{size}
		{disabled}
		{...restProps}
		class={cn("size-8", className)}
		{onclick}
		{onpointerdown}
		{onpointerup}
	>
		{@render children?.()}
	</Button>
{/if}
