<script lang="ts" module>
	import { buttonVariants, type ButtonProps } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import type { Snippet } from "svelte";

	/** The bubbling, cancelable `speedDial.actionSelect` event. `preventDefault()` keeps the dial open. */
	export type SpeedDialActionSelectEvent = CustomEvent<never>;

	/** The merged attribute payload handed to the `child` snippet. */
	export type SpeedDialActionChildProps = {
		type: "button";
		role: "button";
		id: string;
		"aria-labelledby": string;
		"data-slot": "speed-dial-action";
		/** Button variant classes, the round chrome, and the caller's `class` merged last. */
		class: string;
	} & Record<string, unknown>;

	export type SpeedDialActionProps = Omit<ButtonProps, "onselect"> & {
		/**
		 * Called when the action is selected, before the speed dial closes. `preventDefault()` keeps it
		 * open.
		 */
		onSelect?: (event: SpeedDialActionSelectEvent) => void;
		/**
		 * Render the action onto your own element instead of the default `<button>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child` mode
		 * `children` is not rendered and `ref` stays `null` — the caller owns the element, so the
		 * action cannot register itself as a `Tab` boundary node.
		 */
		child?: Snippet<[{ props: SpeedDialActionChildProps }]>;
	};
</script>

<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";

	import {
		ACTION_SELECT_EVENT,
		getSpeedDialContext,
		getSpeedDialItemContext,
		SPEED_DIAL_EVENT_OPTIONS,
	} from "./speed-dial.svelte.js";

	let {
		ref = $bindable(null),
		id,
		variant = "outline",
		size = "icon",
		disabled,
		onSelect,
		onclick: onclickProp,
		class: className,
		child,
		children,
		...restProps
	}: SpeedDialActionProps = $props();

	const state = getSpeedDialContext("<SpeedDial.Action>");
	const item = getSpeedDialItemContext("<SpeedDial.Action>");

	const actionId = $derived(id ?? item.actionId);

	// Registered with a *getter* for `disabled`, so the `Tab` boundary is recomputed at keydown time
	// and a disabled action is never the first or last node (upstream 968-978).
	$effect(() => {
		const element = ref;
		if (!element) return;

		const nodeId = actionId;
		state.nodes.register(nodeId, element, { getDisabled: () => disabled ?? false });
		return () => state.nodes.unregister(nodeId);
	});

	function onclick(event: MouseEvent) {
		// `ButtonProps` handlers are the intersection of the button and anchor DOM signatures, because
		// `Button` renders either element depending on `href`. Widening to their shared `MouseEvent`
		// supertype here is what lets one implementation satisfy both call signatures (the
		// `banner-close.svelte` precedent).
		(onclickProp as unknown as ((event: MouseEvent) => void) | undefined)?.(event);
		if (event.defaultPrevented) return;

		const action = ref;
		if (!action) return;

		// A real bubbling DOM event, exactly as upstream (980-1003): consumers can listen for
		// `speedDial.actionSelect` on an ancestor, and `onSelect` is just a one-shot listener on it.
		const actionSelectEvent = new CustomEvent<never>(ACTION_SELECT_EVENT, SPEED_DIAL_EVENT_OPTIONS);

		action.addEventListener(
			ACTION_SELECT_EVENT,
			(selectEvent) => onSelect?.(selectEvent as SpeedDialActionSelectEvent),
			{ once: true },
		);

		action.dispatchEvent(actionSelectEvent);
		if (actionSelectEvent.defaultPrevented) return;

		state.setOpen(false);
	}

	const actionChildProps = $derived({
		type: "button",
		// Deliberate divergence from upstream's `role="menuitem"`: the content is a `role="group"`,
		// not a menu (see `speed-dial-content.svelte`), so the action is a plain button. Explicit
		// `role="button"` because `Button` renders an `<a>` when `href` is set.
		role: "button",
		id: actionId,
		"aria-labelledby": item.labelId,
		"data-slot": "speed-dial-action",
		disabled,
		...restProps,
		class: cn(
			buttonVariants({ variant, size }),
			"size-11 shrink-0 rounded-full bg-accent shadow-md",
			className,
		),
		onclick,
	} as SpeedDialActionChildProps);
</script>

{#if child}
	{@render child({ props: actionChildProps })}
{:else}
	<Button
		bind:ref
		type="button"
		role="button"
		id={actionId}
		aria-labelledby={item.labelId}
		data-slot="speed-dial-action"
		{variant}
		{size}
		{disabled}
		{...restProps}
		class={cn("size-11 shrink-0 rounded-full bg-accent shadow-md", className)}
		{onclick}
	>
		{@render children?.()}
	</Button>
{/if}
