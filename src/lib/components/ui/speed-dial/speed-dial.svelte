<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { SpeedDialActivationMode, SpeedDialSide } from "./speed-dial.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type SpeedDialChildProps = {
		"data-slot": "speed-dial";
		"data-state": "open" | "closed";
		/** Present only while `disabled` — the house boolean-attribute rule. */
		"data-disabled": "" | undefined;
		class: string;
	} & Record<string, unknown>;

	export type SpeedDialRootProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/** Controlled open state. Bindable; `onOpenChange` still fires on every transition. */
		open?: boolean;
		/**
		 * Open state the speed dial seeds itself with when uncontrolled.
		 *
		 * @default false
		 */
		defaultOpen?: boolean;
		/** Called whenever the speed dial opens or closes, in both controlled and uncontrolled modes. */
		onOpenChange?: (open: boolean) => void;
		/**
		 * Which side of the trigger the actions fan out towards.
		 *
		 * @default "top"
		 */
		side?: SpeedDialSide;
		/**
		 * Whether the trigger opens the speed dial on click or on hover.
		 *
		 * @default "click"
		 */
		activationMode?: SpeedDialActivationMode;
		/**
		 * How long, in ms, hovering the trigger must dwell before the speed dial opens. Only read in
		 * `activationMode="hover"`.
		 *
		 * @default 250
		 */
		delay?: number;
		/**
		 * Whether the speed dial is disabled. Disables the trigger and suppresses every activation.
		 *
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Render the speed dial onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child` mode
		 * `children` is not rendered and `ref` stays `null` — the caller owns the element.
		 */
		child?: Snippet<[{ props: SpeedDialChildProps }]>;
	};

	/** Upstream-parity alias of {@link SpeedDialRootProps}. */
	export type SpeedDialProps = SpeedDialRootProps;
</script>

<script lang="ts">
	import {
		DEFAULT_HOVER_OPEN_DELAY,
		getDataState,
		setSpeedDialContext,
		SpeedDialRootState,
	} from "./speed-dial.svelte.js";

	let {
		ref = $bindable(null),
		open = $bindable(),
		defaultOpen = false,
		onOpenChange,
		side = "top",
		activationMode = "click",
		delay = DEFAULT_HOVER_OPEN_DELAY,
		disabled = false,
		onpointerdowncapture: onpointerdowncaptureProp,
		class: className,
		child,
		children,
		...restProps
	}: SpeedDialRootProps = $props();

	// Uncontrolled: seed once from `defaultOpen`. Controlled: the caller's binding wins.
	// svelte-ignore state_referenced_locally
	open ??= defaultOpen;

	const contentId = $props.id();

	const state = setSpeedDialContext(
		new SpeedDialRootState({
			getOpen: () => open ?? false,
			setOpen: (next) => {
				open = next;
				onOpenChange?.(next);
			},
			getSide: () => side,
			getActivationMode: () => activationMode,
			getDelay: () => delay,
			getDisabled: () => disabled,
			contentId,
		}),
	);

	// The content's outside-dismissal listener needs the root element for its `contains()` check, and
	// the element only exists once the root is mounted. Publishing it here keeps elements out of the
	// context *value*, which has no Svelte counterpart for React's `RefObject`-in-context pattern.
	$effect(() => {
		state.rootElement = ref;
		return () => {
			state.rootElement = null;
		};
	});

	// The shared hover-close timer outlives both the trigger and the content, so the root owns its
	// teardown.
	$effect(() => () => state.destroy());

	/**
	 * Capture phase, so it runs before the document-level dismissal listener sees the same gesture:
	 * a press that landed inside a registered node (the trigger or an action) must not dismiss.
	 * The caller's own handler runs first and `preventDefault()` suppresses this entirely, exactly
	 * as upstream.
	 */
	function onpointerdowncapture(
		event: PointerEvent & { currentTarget: EventTarget & HTMLDivElement },
	) {
		onpointerdowncaptureProp?.(event);
		if (event.defaultPrevented) return;

		state.markPointerInsideTree(event.target);
	}

	const rootAttrs = $derived({
		"data-slot": "speed-dial",
		"data-state": getDataState(state.open),
		"data-disabled": disabled ? "" : undefined,
		...restProps,
		class: cn("relative flex flex-col items-end", className),
		onpointerdowncapture,
	} as SpeedDialChildProps);
</script>

{#if child}
	{@render child({ props: rootAttrs })}
{:else}
	<div bind:this={ref} {...rootAttrs}>
		{@render children?.()}
	</div>
{/if}
