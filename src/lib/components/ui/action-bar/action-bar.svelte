<script lang="ts" module>
	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { ActionBarAlign, ActionBarOrientation, ActionBarSide } from "./action-bar.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type ActionBarChildProps = {
		role: "toolbar";
		"aria-orientation": ActionBarOrientation;
		"data-slot": "action-bar";
		"data-side": ActionBarSide;
		"data-align": ActionBarAlign;
		"data-orientation": ActionBarOrientation;
		dir: Direction;
		class: string;
		/** The viewport-edge declarations, with the caller's own `style` appended last. */
		style: string;
	} & Record<string, unknown>;

	export type ActionBarRootProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/** Controlled open state. Bindable; `onOpenChange` still fires on every transition. */
		open?: boolean;
		/**
		 * Open state the action bar seeds itself with when uncontrolled.
		 *
		 * @default false
		 */
		defaultOpen?: boolean;
		/** Called whenever the action bar opens or closes, in both controlled and uncontrolled modes. */
		onOpenChange?: (open: boolean) => void;
		/**
		 * Called on every `Escape` while the bar is open, before it closes. `preventDefault()` keeps
		 * the bar open.
		 */
		onEscapeKeyDown?: (event: KeyboardEvent) => void;
		/**
		 * Which viewport edge the bar is docked to.
		 *
		 * @default "bottom"
		 */
		side?: ActionBarSide;
		/**
		 * Distance from the docked edge, in px.
		 *
		 * @default 16
		 */
		sideOffset?: number;
		/**
		 * How the bar is aligned along the docked edge.
		 *
		 * @default "center"
		 */
		align?: ActionBarAlign;
		/**
		 * Distance from the aligned edge, in px. Ignored for `align="center"`.
		 *
		 * @default 0
		 */
		alignOffset?: number;
		/**
		 * Where the bar is portalled to. `null` and `undefined` both mean `document.body`.
		 *
		 * @default document.body
		 */
		portalContainer?: Element | DocumentFragment | string | null;
		/**
		 * Reading direction. Falls back to the nearest `<DirectionProvider>`, then to the ambient DOM
		 * `dir`, then to `"ltr"`.
		 */
		dir?: Direction;
		/**
		 * Layout axis of the bar and the arrow-key axis of its group.
		 *
		 * @default "horizontal"
		 */
		orientation?: ActionBarOrientation;
		/**
		 * Whether arrow navigation wraps around the ends of the group.
		 *
		 * @default true
		 */
		loop?: boolean;
		/**
		 * Render the action bar onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null` — the caller owns the element.
		 */
		child?: Snippet<[{ props: ActionBarChildProps }]>;
	};

	/** Upstream-parity alias of {@link ActionBarRootProps}. */
	export type ActionBarProps = ActionBarRootProps;
</script>

<script lang="ts">
	import { useDirection } from "$lib/components/ui/direction-provider/index.js";
	import { untrack } from "svelte";

	import ActionBarPortal from "./action-bar-portal.svelte";
	import {
		DEFAULT_ALIGN_OFFSET,
		DEFAULT_SIDE_OFFSET,
		EscapeDismissState,
		floatingSurfaceVariants,
		getViewportEdgeStyle,
	} from "./action-bar-floating.svelte.js";
	import { ActionBarRootState, setActionBarContext } from "./action-bar.svelte.js";

	let {
		ref = $bindable(null),
		open = $bindable(),
		defaultOpen = false,
		onOpenChange,
		onEscapeKeyDown,
		side = "bottom",
		sideOffset = DEFAULT_SIDE_OFFSET,
		align = "center",
		alignOffset = DEFAULT_ALIGN_OFFSET,
		portalContainer,
		dir,
		orientation = "horizontal",
		loop = true,
		class: className,
		style,
		child,
		children,
		...restProps
	}: ActionBarRootProps = $props();

	// Uncontrolled: seed once from `defaultOpen`. Controlled: the caller's binding wins, and a
	// binding that declines the write keeps the bar where it was. The seed is a one-shot
	// initialisation, so `defaultOpen` is read through `untrack` — reading it bare here would
	// capture only its initial value while looking like a reactive read.
	open ??= untrack(() => defaultOpen);

	const direction = useDirection({ dir: () => dir, element: () => ref });

	const state = setActionBarContext(
		new ActionBarRootState({
			getOpen: () => open ?? false,
			setOpen: (next) => {
				// Settle `open` against the caller's current value *before* writing it. A caller that
				// passes `open` one-way — upstream's contract, a plain controlled prop — gets a local
				// override from any assignment: Svelte marks the prop's derived clean and stamps it with
				// a fresh write version, so a value the caller has already reached pins the override and
				// the caller's expression can never move the bar again. That is exactly what an item's
				// `onSelect` does when it empties the state feeding `open` before the bar closes.
				// Writing only a genuine change keeps the caller authoritative.
				if ((open ?? false) !== next) open = next;
				onOpenChange?.(next);
			},
			getDir: () => direction.current,
			getOrientation: () => orientation,
			getLoop: () => loop,
		}),
	);

	// Upstream's document-level `Escape` listener, attached only while the
	// bar is open and removed by the effect's teardown.
	new EscapeDismissState({
		getEnabled: () => state.open,
		getOwnerDocument: () => ref?.ownerDocument ?? document,
		onEscapeKeyDown: (event) => onEscapeKeyDown?.(event),
		onDismiss: () => state.setOpen(false),
	});

	const rootAttrs = $derived({
		role: "toolbar",
		"aria-orientation": orientation,
		"data-slot": "action-bar",
		"data-side": side,
		"data-align": align,
		"data-orientation": orientation,
		dir: direction.current,
		...restProps,
		class: cn(floatingSurfaceVariants({ orientation }), className),
		// The caller's declarations come last, so they win over the viewport-edge ones.
		style: `${getViewportEdgeStyle({ side, sideOffset, align, alignOffset })}${style ? ` ${style}` : ""}`,
	} as ActionBarChildProps);
</script>

{#if state.open}
	<ActionBarPortal to={portalContainer}>
		{#if child}
			{@render child({ props: rootAttrs })}
		{:else}
			<div bind:this={ref} {...rootAttrs}>
				{@render children?.()}
			</div>
		{/if}
	</ActionBarPortal>
{/if}
