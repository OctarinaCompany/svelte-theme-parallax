<script lang="ts" module>
	import { buttonVariants, type ButtonProps } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import type { Snippet } from "svelte";

	/** The bubbling, cancelable `actionbar.itemSelect` event. `preventDefault()` keeps the bar open. */
	export type ActionBarItemSelectEvent = CustomEvent<never>;

	/** The merged attribute payload handed to the `child` snippet. */
	export type ActionBarItemChildProps = {
		type: "button";
		"data-slot": "action-bar-item";
		/** `0` only while this item owns the group's tab stop. */
		tabindex: number;
		/** Button variant classes, the vertical stretch, and the caller's `class` merged last. */
		class: string;
	} & Record<string, unknown>;

	export type ActionBarItemProps = Omit<ButtonProps, "onselect"> & {
		/**
		 * Called when the item is selected, before the action bar closes. `preventDefault()` keeps it
		 * open.
		 */
		onSelect?: (event: ActionBarItemSelectEvent) => void;
		/**
		 * Render the item onto your own element instead of the default `<button>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null` — the caller owns the element, so
		 * the item cannot register itself with the group's roving focus.
		 */
		child?: Snippet<[{ props: ActionBarItemChildProps }]>;
	};
</script>

<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { getRovingFocusContext } from "$lib/shared/roving-focus.svelte.js";

	import {
		ACTION_BAR_ITEM_SELECT,
		ACTION_BAR_ITEM_SELECT_OPTIONS,
		getActionBarContext,
	} from "./action-bar.svelte.js";

	let {
		ref = $bindable(null),
		variant = "secondary",
		size = "sm",
		disabled,
		onSelect,
		onclick: onclickProp,
		onfocus: onfocusProp,
		onkeydown: onkeydownProp,
		onmousedown: onmousedownProp,
		class: className,
		child,
		children,
		...restProps
	}: ActionBarItemProps = $props();

	const root = getActionBarContext("<ActionBar.Item>");
	const group = getRovingFocusContext("<ActionBar.Item>");

	const itemId = $props.id();

	// Registered with a *getter* for `disabled`, so navigation reads it at keydown time and an item
	// that becomes disabled after mounting is skipped without re-registering (upstream 449-466).
	$effect(() => {
		const element = ref;
		if (!element) return;

		group.register(itemId, element, { getDisabled: () => disabled ?? false });
		return () => group.unregister(itemId);
	});

	// `ButtonProps` handlers are the intersection of the button and anchor DOM signatures, because
	// `Button` renders either element depending on `href`. Widening to their shared supertype here is
	// what lets one implementation satisfy both call signatures (the `speed-dial-action.svelte`
	// precedent).
	const onclickCaller = $derived(
		onclickProp as unknown as ((event: MouseEvent) => void) | undefined,
	);
	const onfocusCaller = $derived(
		onfocusProp as unknown as ((event: FocusEvent) => void) | undefined,
	);
	const onkeydownCaller = $derived(
		onkeydownProp as unknown as ((event: KeyboardEvent) => void) | undefined,
	);
	const onmousedownCaller = $derived(
		onmousedownProp as unknown as ((event: MouseEvent) => void) | undefined,
	);

	function onclick(event: MouseEvent) {
		onclickCaller?.(event);
		if (event.defaultPrevented) return;

		// `currentTarget` rather than `ref`: in `child` mode the caller owns the element and
		// `ref` stays `null`, but the select event must still dispatch from — and close — there.
		const item = (event.currentTarget as HTMLElement | null) ?? ref;
		if (!item) return;

		// A real bubbling DOM event, exactly as upstream (476-489): consumers can listen for
		// `actionbar.itemSelect` on an ancestor, and `onSelect` is just a one-shot listener on it.
		const itemSelectEvent = new CustomEvent<never>(
			ACTION_BAR_ITEM_SELECT,
			ACTION_BAR_ITEM_SELECT_OPTIONS,
		);

		item.addEventListener(
			ACTION_BAR_ITEM_SELECT,
			(selectEvent) => onSelect?.(selectEvent as ActionBarItemSelectEvent),
			{ once: true },
		);

		item.dispatchEvent(itemSelectEvent);
		if (itemSelectEvent.defaultPrevented) return;

		root.setOpen(false);
	}

	function onfocus(event: FocusEvent) {
		onfocusCaller?.(event);
		if (event.defaultPrevented) return;

		group.onItemFocus(itemId);
	}

	function onkeydown(event: KeyboardEvent) {
		onkeydownCaller?.(event);
		if (event.defaultPrevented) return;

		if (event.key === "Tab" && event.shiftKey) {
			group.onItemShiftTab();
			return;
		}

		if (event.target !== event.currentTarget) return;

		const intent = group.focusIntentFor(event.key);
		if (intent === undefined) return;

		// A held modifier means the user is driving the browser, not the toolbar: no navigation and,
		// crucially, no `preventDefault()` (upstream 533-534).
		if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
		event.preventDefault();

		group.navigate(intent, event.currentTarget as HTMLElement);
	}

	function onmousedown(event: MouseEvent) {
		onmousedownCaller?.(event);
		if (event.defaultPrevented) return;

		if (disabled) {
			event.preventDefault();
		} else {
			group.onItemFocus(itemId);
		}
	}

	const isTabStop = $derived(group.isTabStop(itemId));
	const itemClass = $derived(cn(root.orientation === "vertical" && "w-full", className));

	const itemAttrs = $derived({
		type: "button",
		"data-slot": "action-bar-item",
		disabled,
		tabindex: isTabStop ? 0 : -1,
		...restProps,
		class: cn(buttonVariants({ variant, size }), itemClass),
		onclick,
		onfocus,
		onkeydown,
		onmousedown,
	} as ActionBarItemChildProps);
</script>

{#if child}
	{@render child({ props: itemAttrs })}
{:else}
	<Button
		bind:ref
		type="button"
		data-slot="action-bar-item"
		{variant}
		{size}
		{disabled}
		tabindex={isTabStop ? 0 : -1}
		{...restProps}
		class={itemClass}
		{onclick}
		{onfocus}
		{onkeydown}
		{onmousedown}
	>
		{@render children?.()}
	</Button>
{/if}
