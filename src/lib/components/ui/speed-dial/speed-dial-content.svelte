<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { SpeedDialOrientation, SpeedDialSide } from "./speed-dial.svelte.js";

	/** Payload of the cancelable `speedDial.interactOutside` event (upstream `InteractOutsideEvent`). */
	export type SpeedDialInteractOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;

	/** The merged attribute payload handed to the `child` snippet. */
	export type SpeedDialContentChildProps = {
		id: string;
		role: "group";
		"aria-label": string;
		"data-slot": "speed-dial-content";
		"data-state": "open" | "closed";
		"data-orientation": SpeedDialOrientation;
		"data-side": SpeedDialSide;
		/** The CSS custom properties and the four positioning declarations, caller's `style` last. */
		style: string;
		class: string;
	} & Record<string, unknown>;

	export type SpeedDialContentProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Distance in px between the trigger and the content.
		 *
		 * @default 8
		 */
		offset?: number;
		/**
		 * Gap in px between action items.
		 *
		 * @default 8
		 */
		gap?: number;
		/**
		 * Keep the content mounted even while the speed dial is closed, so an external animation
		 * library can own the exit.
		 *
		 * @default false
		 */
		forceMount?: boolean;
		/** Called on `Escape` before the speed dial closes. `preventDefault()` keeps it open. */
		onEscapeKeyDown?: (event: KeyboardEvent) => void;
		/**
		 * Called when a pointer press lands outside the speed dial, before it closes.
		 * `preventDefault()` keeps it open.
		 */
		onInteractOutside?: (event: SpeedDialInteractOutsideEvent) => void;
		/**
		 * Render the content onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child` mode
		 * `children` is not rendered and `ref` stays `null` — the caller owns the element.
		 */
		child?: Snippet<[{ props: SpeedDialContentChildProps }]>;
	};
</script>

<script lang="ts">
	import { untrack } from "svelte";

	import {
		DEFAULT_GAP,
		DEFAULT_HOVER_CLOSE_DELAY,
		DEFAULT_OFFSET,
		getContentPosition,
		getDataState,
		getSpeedDialContext,
		getTransformOrigin,
		INTERACT_OUTSIDE_EVENT,
		setSpeedDialContentContext,
		SPEED_DIAL_EVENT_OPTIONS,
		SpeedDialContentState,
		speedDialContentVariants,
	} from "./speed-dial.svelte.js";

	let {
		ref = $bindable(null),
		offset = DEFAULT_OFFSET,
		gap = DEFAULT_GAP,
		forceMount = false,
		onEscapeKeyDown,
		onInteractOutside,
		onmouseenter: onmouseenterProp,
		onmouseleave: onmouseleaveProp,
		style,
		class: className,
		child,
		children,
		...restProps
	}: SpeedDialContentProps = $props();

	const root = getSpeedDialContext("<SpeedDial.Content>");

	const state = setSpeedDialContentContext(
		new SpeedDialContentState({ root, getForceMount: () => forceMount }),
	);

	/**
	 * Upstream's `renderState` machine, with `mounted` driven from `open`
	 * directly rather than from this effect: the first open render must be synchronous, or a
	 * `render(… open …)` immediately followed by a query would miss the content.
	 * Only `animating` waits one frame, so the CSS transition has something to transition from.
	 */
	$effect(() => {
		if (root.open) {
			// Latched here, cleared only by the timer below, so nothing unmounts mid-transition.
			state.shouldRender = true;

			const frame = requestAnimationFrame(() => {
				state.animating = true;
			});
			return () => cancelAnimationFrame(frame);
		}

		state.animating = false;
		// Nothing was ever rendered (the first closed render), or the caller owns the exit.
		if (forceMount || !untrack(() => state.shouldRender)) return;

		// Read untracked: an item registering or unregistering mid-exit must not restart the timer.
		const duration = untrack(() => state.exitDuration);
		const timer = setTimeout(() => {
			state.shouldRender = false;
		}, duration);
		return () => clearTimeout(timer);
	});

	/**
	 * `Escape` closes and hands focus back to the trigger — the MDX keyboard table promises the focus
	 * restore that the upstream source omits. `Tab`/`Shift+Tab` close once focus is
	 * about to leave the composite, whose boundary nodes are the trigger and the enabled actions
	 * (upstream 662-698).
	 */
	$effect(() => {
		if (!root.open) return;

		const ownerDocument = ref?.ownerDocument ?? document;

		const onkeydown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onEscapeKeyDown?.(event);
				if (event.defaultPrevented) return;

				root.setOpen(false);
				root.focusTrigger();
			}

			if (event.key === "Tab") {
				const focusable = root.enabledNodeElements();
				if (focusable.length === 0) return;

				const first = focusable[0];
				const last = focusable[focusable.length - 1];
				const active = ownerDocument.activeElement;

				if (event.shiftKey) {
					if (active === first) root.setOpen(false);
				} else if (active === last) {
					root.setOpen(false);
				}
			}
		};

		ownerDocument.addEventListener("keydown", onkeydown);
		return () => ownerDocument.removeEventListener("keydown", onkeydown);
	});

	/**
	 * Outside dismissal, ported line-for-line from upstream (702-757) because every branch is
	 * observable: registration is deferred a tick so the very press that opened the dial cannot close
	 * it; a press inside a registered node is skipped by the root's capture-phase guard; a touch press
	 * defers to the following `click`; and `onInteractOutside` only fires — and can only cancel —
	 * when the press was genuinely outside the root.
	 */
	$effect(() => {
		if (!root.open) return;

		const ownerDocument = ref?.ownerDocument ?? document;
		root.resetPointerInsideTree();

		let pendingClick: (() => void) | null = null;

		const removePendingClick = () => {
			if (!pendingClick) return;
			ownerDocument.removeEventListener("click", pendingClick);
			pendingClick = null;
		};

		const onpointerdown = (event: PointerEvent) => {
			if (event.target && !root.pointerInsideTree) {
				const target = event.target as HTMLElement;
				const isOutside = !root.rootElement?.contains(target);

				const onDismiss = () => {
					pendingClick = null;

					if (isOutside) {
						const interactEvent = new CustomEvent(INTERACT_OUTSIDE_EVENT, {
							...SPEED_DIAL_EVENT_OPTIONS,
							detail: { originalEvent: event },
						});

						onInteractOutside?.(interactEvent);
						if (interactEvent.defaultPrevented) return;
					}

					root.setOpen(false);
				};

				if (event.pointerType === "touch") {
					removePendingClick();
					pendingClick = onDismiss;
					ownerDocument.addEventListener("click", pendingClick, { once: true });
				} else {
					onDismiss();
				}
			} else {
				removePendingClick();
			}

			root.resetPointerInsideTree();
		};

		const timer = setTimeout(() => {
			ownerDocument.addEventListener("pointerdown", onpointerdown);
		}, 0);

		return () => {
			clearTimeout(timer);
			ownerDocument.removeEventListener("pointerdown", onpointerdown);
			removePendingClick();
		};
	});

	function onmouseenter(event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onmouseenterProp?.(event);
		if (event.defaultPrevented || root.activationMode !== "hover") return;

		// Moving from the trigger into the content must not close the dial.
		root.cancelHoverClose();
	}

	function onmouseleave(event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onmouseleaveProp?.(event);
		if (event.defaultPrevented || root.activationMode !== "hover") return;

		root.scheduleHoverClose(DEFAULT_HOVER_CLOSE_DELAY);
	}

	// The caller's `style` comes last, so it overrides any custom property set here (upstream
	// 784-793).
	const contentStyle = $derived(
		[
			`--speed-dial-gap: ${gap}px;`,
			`--speed-dial-offset: ${offset}px;`,
			`--speed-dial-transform-origin: ${getTransformOrigin(root.side)};`,
			getContentPosition(root.side, offset),
			style,
		]
			.filter(Boolean)
			.join(" "),
	);

	const contentAttrs = $derived({
		id: root.contentId,
		// Deliberate divergence from upstream's `role="menu"`/`aria-orientation`: the composite
		// implements `Tab` traversal, not the menu pattern's focus-move-and-arrow-key contract, so it
		// announces what it is — a labelled group of buttons. Callers override the label via
		// `aria-label` in rest props.
		role: "group",
		"aria-label": "Speed dial",
		"data-slot": "speed-dial-content",
		"data-state": getDataState(state.animating),
		"data-orientation": root.orientation,
		"data-side": root.side,
		...restProps,
		style: contentStyle,
		class: cn(speedDialContentVariants({ side: root.side }), className),
		onmouseenter,
		onmouseleave,
	} as SpeedDialContentChildProps);
</script>

{#if state.mounted}
	{#if child}
		{@render child({ props: contentAttrs })}
	{:else}
		<div bind:this={ref} {...contentAttrs}>
			{@render children?.()}
		</div>
	{/if}
{/if}
