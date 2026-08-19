<script lang="ts" module>
	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { SelectionToolbarAlign, SelectionToolbarSide } from "./selection-toolbar.svelte.js";

	/** A single collision boundary. Upstream `Boundary`. */
	export type SelectionToolbarBoundary = Element | null;

	/** The merged attribute payload handed to the `child` snippet. */
	export type SelectionToolbarChildProps = {
		role: "toolbar";
		"aria-label": string;
		"data-slot": "selection-toolbar";
		"data-state": "open" | "closed";
		/** Resolved placement, written by the floating layer. */
		"data-side": SelectionToolbarSide;
		"data-align": SelectionToolbarAlign;
		class: string;
		/** The four `--selection-toolbar-*` variables, with the caller's own declarations last. */
		style: string;
	} & Record<string, unknown>;

	/**
	 * Chrome of the floating surface. Upstream's class list (555-558), with the exit half added so a
	 * consumer animating the close gets a symmetric transition.
	 *
	 * No `z-index`: the popover layer this surface is mounted through owns its own stacking.
	 */
	const SURFACE_CLASSES =
		"flex min-w-max items-center gap-1 rounded-lg border bg-card px-1.5 py-1.5 shadow-lg outline-none duration-200 [animation-timing-function:cubic-bezier(0.16,1,0.3,1)] data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 motion-reduce:animate-none motion-reduce:transition-none";

	export type SelectionToolbarRootProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, "id">,
		HTMLDivElement
	> & {
		/**
		 * `id` of the rendered surface. Narrower than the DOM attribute (which also accepts `null`),
		 * because the floating layer stores it and uses it to key its layer stack.
		 */
		id?: string;
		/**
		 * Controlled open state. Bindable; `onOpenChange` still fires on every transition, and a new
		 * selection may still open the toolbar, exactly as upstream.
		 *
		 * @default false
		 */
		open?: boolean;
		/** Called whenever the toolbar opens or closes, in both controlled and uncontrolled modes. */
		onOpenChange?: (open: boolean) => void;
		/** Called on every tracked selection change, including `""` when the selection is cleared. */
		onSelectionChange?: (text: string) => void;
		/**
		 * Restricts tracking to selections made inside this element. Leave it unset to track the whole
		 * document; `null` means "scoped, but not resolved yet" and suspends tracking.
		 */
		container?: HTMLElement | null;
		/**
		 * Where the surface is portalled to. `null` and `undefined` both mean `document.body`.
		 *
		 * @default document.body
		 */
		portalContainer?: Element | DocumentFragment | string | null;
		/**
		 * The preferred side of the selection to render against.
		 *
		 * @default "top"
		 */
		side?: SelectionToolbarSide;
		/**
		 * The distance in pixels between the selection and the toolbar.
		 *
		 * @default 8
		 */
		sideOffset?: number;
		/**
		 * The preferred alignment against the selection.
		 *
		 * @default "center"
		 */
		align?: SelectionToolbarAlign;
		/**
		 * An offset in pixels from the `start` or `end` alignment.
		 *
		 * @default 0
		 */
		alignOffset?: number;
		/**
		 * Whether the toolbar flips and shifts away from collisions.
		 *
		 * @default true
		 */
		avoidCollisions?: boolean;
		/**
		 * Elements the collision detection measures against. `null` entries are ignored.
		 *
		 * @default []
		 */
		collisionBoundary?: SelectionToolbarBoundary | SelectionToolbarBoundary[];
		/**
		 * Virtual padding around the boundary edges used for collision detection.
		 *
		 * @default 0
		 */
		collisionPadding?: number | Partial<Record<SelectionToolbarSide, number>>;
		/**
		 * Whether the toolbar stays fully in view (`"partial"`) or is allowed to detach (`"always"`).
		 *
		 * @default "partial"
		 */
		sticky?: "partial" | "always";
		/**
		 * Whether the toolbar hides — without closing — when the selection scrolls out of view.
		 *
		 * @default false
		 */
		hideWhenDetached?: boolean;
		/**
		 * `"always"` repositions on every animation frame; `"optimized"` only when necessary.
		 *
		 * @default "optimized"
		 */
		updatePositionStrategy?: "optimized" | "always";
		/**
		 * Reading direction. Falls back to the nearest `<DirectionProvider>`, then to the ambient DOM
		 * `dir`, then to `"ltr"`.
		 */
		dir?: Direction;
		/**
		 * Render the toolbar onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null` — the caller owns the element.
		 */
		child?: Snippet<[{ props: SelectionToolbarChildProps }]>;
	};

	/** Upstream-parity alias of {@link SelectionToolbarRootProps}. */
	export type SelectionToolbarProps = SelectionToolbarRootProps;
</script>

<script lang="ts">
	import { useDirection } from "$lib/components/ui/direction-provider/index.js";
	import { Popover as PopoverPrimitive } from "bits-ui";

	import SelectionToolbarPortal from "./selection-toolbar-portal.svelte";
	import {
		DEFAULT_ALIGN_OFFSET,
		DEFAULT_SIDE_OFFSET,
		SelectionToolbarRootState,
		setSelectionToolbarContext,
	} from "./selection-toolbar.svelte.js";

	let {
		ref = $bindable(null),
		open = $bindable(),
		onOpenChange,
		onSelectionChange,
		container,
		portalContainer,
		side = "top",
		sideOffset = DEFAULT_SIDE_OFFSET,
		align = "center",
		alignOffset = DEFAULT_ALIGN_OFFSET,
		avoidCollisions = true,
		collisionBoundary = [],
		collisionPadding = 0,
		sticky = "partial",
		hideWhenDetached = false,
		updatePositionStrategy = "optimized",
		dir,
		class: className,
		style,
		child: childSnippet,
		children,
		...restProps
	}: SelectionToolbarRootProps = $props();

	// Uncontrolled: seed once with upstream's `openProp ?? false` (143-147). Controlled: the caller's
	// binding wins, and a binding that declines the write keeps the toolbar where it was. Upstream
	// has no `defaultOpen`, because a toolbar that is open before there is a selection is meaningless.
	open ??= false;

	/** The floating surface itself. Separate from `ref`, which stays `null` in `child` mode. */
	let surfaceRef = $state<HTMLElement | null>(null);

	const direction = useDirection({ dir: () => dir, element: () => surfaceRef });

	const rootState = setSelectionToolbarContext(
		new SelectionToolbarRootState({
			getOpen: () => open ?? false,
			setOpen: (next) => {
				open = next;
				onOpenChange?.(next);
			},
			getContainer: () => container ?? null,
			isContainerScoped: () => container !== undefined,
			getSurface: () => surfaceRef,
			onSelectionChange: (text) => onSelectionChange?.(text),
		}),
	);

	// Upstream's `open && !!virtualElement` guard (365): with no selection there is nothing to
	// anchor to, so a controlled `open` on its own renders no surface.
	const surfaceOpen = $derived(rootState.open && rootState.anchor !== null);

	// Upstream filters `null` boundaries before handing them to the middleware (`isNotNull`, 46-48).
	const boundary = $derived(
		(Array.isArray(collisionBoundary) ? collisionBoundary : [collisionBoundary]).filter(
			(entry): entry is Element => entry !== null,
		),
	);

	/**
	 * Upstream's four documented CSS variables, aliased onto the ones the floating layer already
	 * computes from the same `size` middleware (divergence D-5). The caller's own
	 * declarations are appended last so they win.
	 */
	const composedStyle = $derived(
		[
			"--selection-toolbar-available-width: var(--bits-popover-content-available-width)",
			"--selection-toolbar-available-height: var(--bits-popover-content-available-height)",
			"--selection-toolbar-anchor-width: var(--bits-popover-anchor-width)",
			"--selection-toolbar-anchor-height: var(--bits-popover-anchor-height)",
			...(typeof style === "string" && style.length > 0 ? [style] : []),
		].join("; "),
	);

	/**
	 * `bits-ui` consumes `dir` as a component prop — it drives the floating layer's logical
	 * alignment — and writes it onto the positioned *wrapper*, not onto the surface. RTL styling
	 * inside the toolbar needs it here too, so it is written back with the value `bits-ui` was
	 * handed (the `combobox-content.svelte` precedent).
	 */
	$effect(() => {
		const element = surfaceRef;
		if (!element) return;

		element.dir = direction.current;
	});

	/** Moving focus into the surface would collapse the selection the toolbar exists to act on. */
	function preventAutoFocus(event: Event) {
		event.preventDefault();
	}

	/** `Escape` drops the browser's ranges before the layer closes the surface. */
	function handleEscapeKeydown() {
		rootState.clearSelection();
	}

	/**
	 * A pointer press outside the surface. The dismissible layer raises this from
	 * `pointerdown`, which is upstream's trigger too (501-506) — early enough that a drag which
	 * *starts* outside still produces a new selection for the `mouseup` read to pick up.
	 */
	function handleInteractOutside() {
		rootState.clearSelection();
	}
</script>

<PopoverPrimitive.Root
	bind:open={
		() => surfaceOpen,
		(next) => {
			if (!next) rootState.closeToolbar();
		}
	}
>
	<SelectionToolbarPortal to={portalContainer}>
		<PopoverPrimitive.Content
			bind:ref={surfaceRef}
			role="toolbar"
			aria-label="Text formatting toolbar"
			data-slot="selection-toolbar"
			{side}
			{sideOffset}
			{align}
			{alignOffset}
			{avoidCollisions}
			collisionBoundary={boundary}
			{collisionPadding}
			{sticky}
			{hideWhenDetached}
			{updatePositionStrategy}
			strategy="fixed"
			customAnchor={rootState.anchor}
			dir={direction.current}
			trapFocus={false}
			preventScroll={false}
			preventOverflowTextSelection={false}
			onOpenAutoFocus={preventAutoFocus}
			onCloseAutoFocus={preventAutoFocus}
			onEscapeKeydown={handleEscapeKeydown}
			onInteractOutside={handleInteractOutside}
			style={composedStyle}
			{...restProps}
			class={cn(SURFACE_CLASSES, className)}
		>
			{#snippet child({ props, wrapperProps })}
				<div {...wrapperProps}>
					{#if childSnippet}
						{@render childSnippet({ props: props as SelectionToolbarChildProps })}
					{:else}
						<div bind:this={ref} {...props}>
							{@render children?.()}
						</div>
					{/if}
				</div>
			{/snippet}
		</PopoverPrimitive.Content>
	</SelectionToolbarPortal>
</PopoverPrimitive.Root>
