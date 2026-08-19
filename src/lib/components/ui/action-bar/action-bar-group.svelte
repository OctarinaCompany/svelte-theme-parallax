<script lang="ts" module>
	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { ActionBarOrientation } from "./action-bar.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type ActionBarGroupChildProps = {
		role: "group";
		"data-slot": "action-bar-group";
		"data-orientation": ActionBarOrientation;
		dir: Direction;
		/** `0` while the group is a tab stop, `-1` while tabbing back out or with no enabled item. */
		tabindex: number;
		class: string;
	} & Record<string, unknown>;

	export type ActionBarGroupProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/**
		 * Render the group onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null` — the caller owns the element.
		 */
		child?: Snippet<[{ props: ActionBarGroupChildProps }]>;
	};
</script>

<script lang="ts">
	import { RovingFocusGroupState, setRovingFocusContext } from "$lib/shared/roving-focus.svelte.js";

	import {
		ACTION_BAR_ENTRY_FOCUS,
		ACTION_BAR_EVENT_OPTIONS,
		getActionBarContext,
	} from "./action-bar.svelte.js";

	let {
		ref = $bindable(null),
		onfocusin: onfocusinProp,
		onfocusout: onfocusoutProp,
		onmousedown: onmousedownProp,
		class: className,
		child,
		children,
		...restProps
	}: ActionBarGroupProps = $props();

	const root = getActionBarContext("<ActionBar.Group>");

	const state = setRovingFocusContext(
		new RovingFocusGroupState({
			getDir: () => root.dir,
			getOrientation: () => root.orientation,
			getLoop: () => root.loop,
			entryFocusEventName: ACTION_BAR_ENTRY_FOCUS,
			entryFocusEventOptions: ACTION_BAR_EVENT_OPTIONS,
		}),
	);

	/**
	 * React's `onFocus`/`onBlur` are the delegated, **bubbling** `focusin`/`focusout`, and upstream
	 * relies on that: `onBlur` must fire when focus leaves an *item* to clear the tabbing-back-out
	 * flag, which a native non-bubbling `blur` handler on the group would never see.
	 */
	function onfocusin(event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onfocusinProp?.(event);
		if (event.defaultPrevented) return;

		state.onGroupFocusIn(event);
	}

	function onfocusout(event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onfocusoutProp?.(event);
		if (event.defaultPrevented) return;

		state.onGroupFocusOut();
	}

	function onmousedown(event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onmousedownProp?.(event);
		if (event.defaultPrevented) return;

		state.onGroupMouseDown();
	}

	const groupAttrs = $derived({
		role: "group",
		"data-slot": "action-bar-group",
		"data-orientation": root.orientation,
		dir: root.dir,
		tabindex: state.tabIndex,
		...restProps,
		class: cn(
			"flex gap-2 outline-none",
			root.orientation === "horizontal" ? "items-center" : "w-full flex-col items-start",
			className,
		),
		onfocusin,
		onfocusout,
		onmousedown,
	} as ActionBarGroupChildProps);
</script>

{#if child}
	{@render child({ props: groupAttrs })}
{:else}
	<div bind:this={ref} {...groupAttrs}>
		{@render children?.()}
	</div>
{/if}
