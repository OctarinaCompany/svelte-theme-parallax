<script lang="ts" module>
	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type {
		TourCloseAutoFocusEvent,
		TourInteractOutsideEvent,
		TourOpenAutoFocusEvent,
		TourPointerDownOutsideEvent,
		TourScrollBehavior,
		TourScrollOffset,
	} from "./tour.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type TourRootChildProps = {
		"data-slot": "tour";
		dir: Direction;
	} & Record<string, unknown>;

	export type TourRootProps = Omit<
		WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
		"dir"
	> & {
		/**
		 * Whether the tour is showing. Bindable; an authoritative parent that declines the write keeps
		 * the tour where it was, and `onOpenChange` still reports every attempted transition.
		 */
		open?: boolean;
		/**
		 * Seeds {@link TourRootProps.open} once when the tour is uncontrolled.
		 * @default false
		 */
		defaultOpen?: boolean;
		/** Called whenever the tour opens or closes. */
		onOpenChange?: (open: boolean) => void;
		/** The active step index. Bindable, with the same controlled contract as `open`. */
		value?: number;
		/**
		 * Seeds {@link TourRootProps.value} once when the tour is uncontrolled.
		 * @default 0
		 */
		defaultValue?: number;
		/** Called with the next step index whenever the tour navigates. */
		onValueChange?: (step: number) => void;
		/** Called exactly once when the visitor finishes the last step. Never paired with `onSkip`. */
		onComplete?: () => void;
		/** Called exactly once when the tour is closed before its last step. Never paired with `onComplete`. */
		onSkip?: () => void;
		/**
		 * Called on every `Escape` while the tour is open, before it closes. `preventDefault()` keeps
		 * the tour open.
		 */
		onEscapeKeyDown?: (event: KeyboardEvent) => void;
		/**
		 * Called when a pointer interaction lands outside the step card and outside its target.
		 * `preventDefault()` keeps the tour open.
		 */
		onPointerDownOutside?: (event: TourPointerDownOutsideEvent) => void;
		/**
		 * Called for a pointer *or* focus interaction outside the step card and its target.
		 * `preventDefault()` keeps the tour open.
		 */
		onInteractOutside?: (event: TourInteractOutsideEvent) => void;
		/**
		 * Called as focus moves into the step card. `preventDefault()` leaves focus where it was.
		 */
		onOpenAutoFocus?: (event: TourOpenAutoFocusEvent) => void;
		/**
		 * Called as the tour closes, before focus returns to the element that held it beforehand.
		 * `preventDefault()` suppresses that restoration.
		 */
		onCloseAutoFocus?: (event: TourCloseAutoFocusEvent) => void;
		/**
		 * Reading direction. When omitted, resolves the nearest `<DirectionProvider>`, then an
		 * ancestor `[dir]`, then `"ltr"`.
		 */
		dir?: Direction;
		/**
		 * Default cross-axis gap between every step's card and its target. A step's own `alignOffset`
		 * wins.
		 * @default 0
		 */
		alignOffset?: number;
		/**
		 * Default main-axis gap between every step's card and its target. A step's own `sideOffset`
		 * wins.
		 * @default 16
		 */
		sideOffset?: number;
		/**
		 * Pixels added on every edge of the target's bounds when computing the spotlight cut-out and
		 * the ring.
		 * @default 4
		 */
		spotlightPadding?: number;
		/**
		 * Whether a newly active step scrolls its target into view.
		 * @default true
		 */
		autoScroll?: boolean;
		/**
		 * How that scroll animates.
		 * @default "auto" under `prefers-reduced-motion: reduce`, otherwise "smooth"
		 */
		scrollBehavior?: TourScrollBehavior;
		/**
		 * Per-edge viewport insets used to decide whether the target is already in view, and where it
		 * lands after scrolling.
		 * @default { top: 100, bottom: 100, left: 0, right: 0 }
		 */
		scrollOffset?: TourScrollOffset;
		/**
		 * Whether `Escape` and outside interaction may close the tour.
		 * @default true
		 */
		dismissible?: boolean;
		/**
		 * Whether the tour locks background scrolling while it is open.
		 * @default true
		 */
		modal?: boolean;
		/** Fallback footer rendered by every step that does not declare a `<Tour.Footer>` of its own. */
		stepFooter?: Snippet;
		/**
		 * Render the root onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: TourRootChildProps }]>;
	};

	/** Upstream-parity alias of {@link TourRootProps}. */
	export type TourProps = TourRootProps;
</script>

<script lang="ts">
	import { useDirection } from "$lib/components/ui/direction-provider/index.js";
	import { untrack } from "svelte";

	import {
		DEFAULT_ALIGN_OFFSET,
		DEFAULT_SIDE_OFFSET,
		DEFAULT_SPOTLIGHT_PADDING,
		getDefaultScrollBehavior,
		setTourContext,
		TOUR_CLOSE_AUTO_FOCUS,
		TOUR_EVENT_OPTIONS,
		TourRootState,
	} from "./tour.svelte.js";

	let {
		ref = $bindable(null),
		open = $bindable(),
		defaultOpen = false,
		onOpenChange,
		value = $bindable(),
		defaultValue = 0,
		onValueChange,
		onComplete,
		onSkip,
		onEscapeKeyDown,
		onPointerDownOutside,
		onInteractOutside,
		onOpenAutoFocus,
		onCloseAutoFocus,
		dir,
		alignOffset = DEFAULT_ALIGN_OFFSET,
		sideOffset = DEFAULT_SIDE_OFFSET,
		spotlightPadding = DEFAULT_SPOTLIGHT_PADDING,
		autoScroll = true,
		scrollBehavior = getDefaultScrollBehavior(),
		scrollOffset,
		dismissible = true,
		modal = true,
		stepFooter,
		class: className,
		children,
		child,
		...restProps
	}: TourRootProps = $props();

	// Read **before** the `??=` seed below: after it, an omitted prop is indistinguishable from a
	// supplied one, and upstream branches on that distinction twice.
	const isOpenControlled = open !== undefined;
	const isValueControlled = value !== undefined;

	// Uncontrolled: seed once. Controlled: the parent's binding wins, and one that declines the write
	// keeps the tour where it was.
	// svelte-ignore state_referenced_locally
	open ??= defaultOpen;
	// svelte-ignore state_referenced_locally
	value ??= defaultValue;

	// The DOM fallback walks up from `document.documentElement`, not from `ref`: the root always
	// renders a resolved `dir` of its own, so anchoring the walk at `ref` would only ever find that.
	const reader = useDirection({ dir: () => dir });

	const state = setTourContext(
		new TourRootState({
			getOpen: () => open ?? false,
			setOpen: (next) => {
				open = next;
				onOpenChange?.(next);
			},
			getValue: () => value ?? 0,
			setValue: (next) => {
				value = next;
				onValueChange?.(next);
			},
			isOpenControlled,
			isValueControlled,
			getDir: () => reader.current,
			getSideOffset: () => sideOffset,
			getAlignOffset: () => alignOffset,
			getSpotlightPadding: () => spotlightPadding,
			getDismissible: () => dismissible,
			getModal: () => modal,
			getAutoScroll: () => autoScroll,
			getScrollBehavior: () => scrollBehavior,
			getScrollOffset: () => scrollOffset,
			getStepFooter: () => stepFooter,
			getOnComplete: () => onComplete,
			getOnSkip: () => onSkip,
			getOnPointerDownOutside: () => onPointerDownOutside,
			getOnInteractOutside: () => onInteractOutside,
			getOnOpenAutoFocus: () => onOpenAutoFocus,
		}),
	);

	/**
	 * Upstream's root-level `keydown` listener. It lives on the document rather
	 * than on the step's escape layer because it must still work when the active step's target is
	 * missing and no card is mounted — which is why the layer's own handling is turned off
	 * (`escapeKeydownBehavior="ignore"`).
	 *
	 * The `dismissible` gate is a deliberate divergence: upstream omits the check here even though
	 * its own outside-interaction path applies it.
	 */
	$effect(() => {
		if (!state.open) return;

		function onKeydown(event: KeyboardEvent) {
			if (event.key !== "Escape") return;

			onEscapeKeyDown?.(event);
			if (event.defaultPrevented) return;
			if (!dismissible) return;

			state.close();
		}

		document.addEventListener("keydown", onKeydown);
		return () => document.removeEventListener("keydown", onKeydown);
	});

	/**
	 * Upstream's `useScrollLock`, kept bespoke because it is scoped to
	 * `open && modal` on the **root** — it must hold even when no step content is mounted, which
	 * `Popover.Content`'s content-scoped `preventScroll` cannot do.
	 *
	 * The previous *inline* styles are captured and restored, rather than upstream's computed
	 * `overflow`: restoring a computed `"visible"` would leave an inline declaration behind that was
	 * never there.
	 */
	$effect(() => {
		if (!state.open || !modal) return;

		const { body } = document;
		const previousOverflow = body.style.overflow;
		const previousPaddingRight = body.style.paddingRight;
		const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

		body.style.overflow = "hidden";
		if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

		return () => {
			body.style.overflow = previousOverflow;
			body.style.paddingRight = previousPaddingRight;
		};
	});

	// Upstream keeps the previous `open` in a ref precisely so writing it does not re-render
	//; a `$state` field here would make the effect below a dependent of its own write.
	let wasOpen = false;
	let previouslyFocused: HTMLElement | null = null;

	/**
	 * Upstream's focus bookkeeping: remember what held focus just before the tour
	 * opened, and hand it back once the tour closes, unless `onCloseAutoFocus` prevents it.
	 *
	 * The step's own focus scope owns *entering* the card and the trap; its close-restore is
	 * suppressed there, so it cannot fire on every step transition. The `setTimeout(…, 0)` is
	 * upstream's too — it lets the layer finish tearing down before focus is moved back.
	 */
	$effect(() => {
		const isOpen = state.open;
		const previously = wasOpen;
		wasOpen = isOpen;

		if (isOpen) {
			if (!previously) previouslyFocused = document.activeElement as HTMLElement | null;
			return;
		}

		if (!previously) return;

		const elementToFocus = previouslyFocused;
		previouslyFocused = null;

		const timerId = window.setTimeout(() => {
			const closeAutoFocusEvent = new CustomEvent(
				TOUR_CLOSE_AUTO_FOCUS,
				TOUR_EVENT_OPTIONS,
			) as TourCloseAutoFocusEvent;

			onCloseAutoFocus?.(closeAutoFocusEvent);
			if (closeAutoFocusEvent.defaultPrevented) return;

			if (elementToFocus && document.body.contains(elementToFocus)) {
				elementToFocus.focus({ preventScroll: true });
			}
		}, 0);

		return () => window.clearTimeout(timerId);
	});

	// The spotlight geometry is owned by whichever step is active; when none is, it must not linger.
	$effect(() => {
		if (state.open) return;

		state.clearSpotlight();
	});

	/**
	 * Upstream syncs a controlled `open` back through `store.setState`, which is
	 * what makes its out-of-range reset apply to an externally driven open too. `setOpenState` covers
	 * the internal path; this covers the external one, and is idempotent when both fire.
	 *
	 * The read is `untrack`ed apart from `open` itself, so moving `value` from here cannot re-enter
	 * the effect when the tour opens on an out-of-range index.
	 */
	$effect(() => {
		if (!state.open) return;

		untrack(() => {
			if (state.stepCount > 0 && state.value >= state.stepCount) state.setValueState(0);
		});
	});

	const rootAttrs = $derived({
		"data-slot": "tour",
		dir: reader.current,
		...restProps,
		class: className ? cn(className) : undefined,
	} as TourRootChildProps);
</script>

{#if child}
	{@render child({ props: rootAttrs })}
{:else}
	<div bind:this={ref} {...rootAttrs}>
		{@render children?.()}
	</div>
{/if}
