<script lang="ts" module>
	import { buttonVariants, type ButtonProps } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import type { Snippet } from "svelte";

	/** The merged attribute payload handed to the `child` snippet. */
	export type SpeedDialTriggerChildProps = {
		type: "button";
		role: "button";
		id: string;
		"aria-controls": string;
		"aria-expanded": boolean;
		"data-slot": "speed-dial-trigger";
		"data-state": "open" | "closed";
		disabled: boolean;
		/** Button variant classes, the round chrome, and the caller's `class` merged last. */
		class: string;
	} & Record<string, unknown>;

	export type SpeedDialTriggerProps = ButtonProps & {
		/**
		 * Render the trigger onto your own element instead of the default `<button>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child` mode
		 * `children` is not rendered and `ref` stays `null` — the caller owns the element. Spread the
		 * received props, or the trigger is neither registered as a `Tab` boundary nor the `Escape`
		 * focus-restore target.
		 */
		child?: Snippet<[{ props: SpeedDialTriggerChildProps }]>;
	};
</script>

<script lang="ts">
	import { createAttachmentKey } from "svelte/attachments";

	import { Button } from "$lib/components/ui/button/index.js";

	import {
		DEFAULT_HOVER_CLOSE_DELAY,
		getDataState,
		getSpeedDialContext,
	} from "./speed-dial.svelte.js";

	let {
		ref = $bindable(null),
		id,
		variant = "default",
		size = "icon",
		disabled: disabledProp,
		onclick: onclickProp,
		onmouseenter: onmouseenterProp,
		onmouseleave: onmouseleaveProp,
		class: className,
		child,
		children,
		...restProps
	}: SpeedDialTriggerProps = $props();

	const state = getSpeedDialContext("<SpeedDial.Trigger>");

	const instanceId = $props.id();
	const triggerId = $derived(id ?? instanceId);

	// Upstream `isDisabled = disabledProp || disabled`.
	const isDisabled = $derived(disabledProp || state.disabled);

	/** Hover-open is the trigger's own; hover-close is shared with the content, so the root owns it. */
	let hoverOpenTimer: ReturnType<typeof setTimeout> | null = null;

	function cancelHoverOpen() {
		if (hoverOpenTimer === null) return;
		clearTimeout(hoverOpenTimer);
		hoverOpenTimer = null;
	}

	// An attachment rather than `ref`-keyed effects, so the wiring travels with the spread props and
	// keeps working when the caller supplies their own element through `child` (the
	// `sortable-item.svelte` precedent). Without it a custom trigger never joins `state.nodes`, so
	// the content's outside-dismissal handler closes the dial on the very press whose `click` then
	// reopens it — the dial could never be closed from its own trigger. The function reference is
	// stable, so recomputing the attribute payload never re-attaches.
	const attachTrigger = createAttachmentKey();

	// The trigger is the *first* node of the composite, so `Shift+Tab` on it is what closes the dial.
	// `getDisabled` is a getter rather than a snapshot, so toggling `disabled` never
	// needs a re-registration.
	function attach(element: Element): (() => void) | void {
		if (!(element instanceof HTMLElement)) return;

		state.triggerElement = element;

		$effect(() => {
			const nodeId = triggerId;
			state.nodes.register(nodeId, element, { getDisabled: () => isDisabled });
			return () => state.nodes.unregister(nodeId);
		});

		return () => {
			state.triggerElement = null;
		};
	}

	// Upstream clears both timers on unmount.
	$effect(() => () => {
		cancelHoverOpen();
		state.cancelHoverClose();
	});

	// `ButtonProps` handlers are the intersection of the button and anchor DOM signatures, because
	// `Button` renders either element depending on `href`. Widening to their shared `MouseEvent`
	// supertype at the call boundary is what lets one implementation satisfy both call signatures
	// (the `banner-close.svelte` precedent).
	function callMouseHandler(handler: unknown, event: MouseEvent) {
		(handler as ((event: MouseEvent) => void) | undefined)?.(event);
	}

	function onclick(event: MouseEvent) {
		callMouseHandler(onclickProp, event);
		if (event.defaultPrevented) return;

		cancelHoverOpen();
		state.cancelHoverClose();
		state.toggle();
	}

	function onmouseenter(event: MouseEvent) {
		callMouseHandler(onmouseenterProp, event);
		if (event.defaultPrevented || state.activationMode !== "hover" || isDisabled) return;

		state.cancelHoverClose();
		cancelHoverOpen();
		hoverOpenTimer = setTimeout(() => {
			hoverOpenTimer = null;
			state.setOpen(true);
		}, state.delay);
	}

	function onmouseleave(event: MouseEvent) {
		callMouseHandler(onmouseleaveProp, event);
		if (event.defaultPrevented || state.activationMode !== "hover" || isDisabled) return;

		cancelHoverOpen();
		state.scheduleHoverClose(DEFAULT_HOVER_CLOSE_DELAY);
	}

	const triggerChildProps = $derived({
		type: "button",
		role: "button",
		id: triggerId,
		// Deliberate divergence from upstream: no `aria-haspopup="menu"` — the content is a
		// `role="group"`, not a menu (see `speed-dial-content.svelte`), so the trigger announces
		// only `aria-expanded`/`aria-controls`.
		"aria-controls": state.contentId,
		"aria-expanded": state.open,
		"data-slot": "speed-dial-trigger",
		"data-state": getDataState(state.open),
		disabled: isDisabled,
		...restProps,
		class: cn(buttonVariants({ variant, size }), "size-11 cursor-pointer rounded-full", className),
		onclick,
		onmouseenter,
		onmouseleave,
		[attachTrigger]: attach,
	} as SpeedDialTriggerChildProps);
</script>

{#if child}
	{@render child({ props: triggerChildProps })}
{:else}
	<Button
		bind:ref
		type="button"
		role="button"
		id={triggerId}
		aria-controls={state.contentId}
		aria-expanded={state.open}
		data-slot="speed-dial-trigger"
		data-state={getDataState(state.open)}
		disabled={isDisabled}
		{variant}
		{size}
		{...restProps}
		class={cn("size-11 cursor-pointer rounded-full", className)}
		{onclick}
		{onmouseenter}
		{onmouseleave}
		{@attach attach}
	>
		{@render children?.()}
	</Button>
{/if}
