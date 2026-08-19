<script lang="ts" module>
	import type { Popover } from "bits-ui";
	import type { Snippet } from "svelte";

	import { cn } from "$lib/utils.js";

	/** The four sides the popup can be placed on. */
	export type ComboboxSide = "top" | "right" | "bottom" | "left";
	/** The three alignments the popup can take along its side. */
	export type ComboboxAlign = "start" | "center" | "end";

	export type ComboboxContentProps = Omit<
		Popover.ContentProps,
		| "child"
		| "children"
		| "customAnchor"
		| "onCloseAutoFocus"
		| "onFocusOutside"
		| "onInteractOutside"
		| "onOpenAutoFocus"
		| "preventScroll"
		| "side"
		| "align"
		| "trapFocus"
	> & {
		/**
		 * The preferred side of the anchor to render against.
		 *
		 * @default "bottom"
		 */
		side?: ComboboxSide;
		/**
		 * The distance in pixels between the anchor and the popup.
		 *
		 * @default 6
		 */
		sideOffset?: number;
		/**
		 * The preferred alignment against the anchor.
		 *
		 * @default "start"
		 */
		align?: ComboboxAlign;
		/**
		 * An offset in pixels from the `start` or `end` alignment.
		 *
		 * @default 0
		 */
		alignOffset?: number;
		/**
		 * What the popup positions against, overriding the default resolution (chips container,
		 * else field, else trigger). Takes an element, or the holder `createComboboxAnchor()`
		 * returns — upstream's `useComboboxAnchor()` ref.
		 */
		anchor?: HTMLElement | { readonly current: HTMLElement | null } | null;
		/**
		 * Where the popup is portalled to — an element or a selector.
		 *
		 * @default document.body
		 */
		portalTo?: Element | string;
		/**
		 * Whether to leave the popup in place instead of portalling it.
		 *
		 * @default false
		 */
		portalDisabled?: boolean;
		/** Called on a pointer press outside the popup. `preventDefault()` keeps it open. */
		onPointerDownOutside?: (event: PointerEvent) => void;
		/** The popup's parts: normally a `<Combobox.Empty>` and a `<Combobox.List>`. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";

	import { getComboboxContext, setComboboxContentMarker } from "./combobox.svelte.js";

	/**
	 * The portalled popup (Base UI's Portal → Positioner → Popup
	 * pyramid, folded into one part exactly as upstream folds it).
	 *
	 * Only the shell is `bits-ui`'s: the portal, the floating position and the dismissible layer.
	 * Everything the list does — filtering, highlighting, selection — belongs to `<Combobox.Root>`
	 * (see combobox.svelte.ts for why this is a `Popover` and not `bits-ui`'s `Combobox`).
	 *
	 * `w-(--bits-floating-anchor-width)` is upstream's `w-(--anchor-width)` under `bits-ui`'s name
	 * for the same measurement — the popup exactly as wide as whatever it anchors to. The
	 * `*:data-[slot=input-group]` adjustments are upstream's treatment of a field rendered inside
	 * the popup (the select-shaped demos); this repository's `input-group` already carries the
	 * matching `in-data-[slot=combobox-content]` focus compensations.
	 */

	let {
		ref = $bindable(null),
		side = "bottom",
		sideOffset = 6,
		align = "start",
		alignOffset = 0,
		anchor,
		portalTo,
		portalDisabled = false,
		onEscapeKeydown,
		onPointerDownOutside,
		class: className,
		children,
		...restProps
	}: ComboboxContentProps = $props();

	const root = getComboboxContext("<Combobox.Content>");

	// Lets a field rendered in this subtree know it lives inside the popup.
	setComboboxContentMarker();

	// The fields close on blur, and need to know which element is the one exception to that.
	$effect(() => {
		root.contentElement = ref;
		return () => {
			if (root.contentElement === ref) root.contentElement = null;
		};
	});

	/**
	 * What the popup positions against. An explicit `anchor` wins — the chips demos pass the chips
	 * container. Otherwise: the chips container when one is mounted, else the field, else the
	 * trigger — with the field skipped when it lives *inside* this popup, because an anchor inside
	 * the element it positions is a feedback loop.
	 */
	const resolvedAnchor = $derived.by(() => {
		if (anchor) return "current" in anchor ? anchor.current : anchor;
		if (root.chipsElement) return root.chipsElement;
		if (!root.inputInsideContent && root.inputElement) return root.inputElement;
		return root.triggerElement;
	});

	/** The APG combobox pattern keeps DOM focus in the field, so the popup never takes it. */
	function preventAutoFocus(event: Event) {
		event.preventDefault();
	}

	/**
	 * The field is not inside the popup, so every click that puts the caret back in it reads as an
	 * interaction outside — and would close the list under the user mid-edit. The anchor and the
	 * trigger are part of the widget; only a press somewhere else dismisses it.
	 */
	function isWithinWidget(target: EventTarget | null): boolean {
		if (!(target instanceof Node)) return false;

		const surfaces = [root.inputElement, root.chipsElement, root.triggerElement];
		return surfaces.some(
			(surface) => !!surface && (surface === target || surface.contains(target)),
		);
	}

	function handleInteractOutside(event: PointerEvent) {
		if (isWithinWidget(event.target)) {
			event.preventDefault();
			return;
		}
		onPointerDownOutside?.(event);
	}

	function handleFocusOutside(event: FocusEvent) {
		if (isWithinWidget(event.target)) event.preventDefault();
	}
</script>

<PopoverPrimitive.Portal to={portalTo} disabled={portalDisabled}>
	<PopoverPrimitive.Content
		bind:ref
		data-slot="combobox-content"
		data-chips={root.chipsElement ? true : undefined}
		{side}
		{sideOffset}
		{align}
		{alignOffset}
		customAnchor={resolvedAnchor}
		trapFocus={false}
		preventScroll={false}
		onOpenAutoFocus={preventAutoFocus}
		onCloseAutoFocus={preventAutoFocus}
		onInteractOutside={handleInteractOutside}
		onFocusOutside={handleFocusOutside}
		{onEscapeKeydown}
		{...restProps}
		class={cn(
			"relative z-50 flex max-h-[min(var(--bits-floating-available-height),24rem)] w-(--bits-floating-anchor-width) max-w-(--bits-floating-available-width) min-w-32 flex-col overflow-hidden overscroll-contain rounded-lg bg-popover py-0.5 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 *:data-[slot=input-group]:m-1 *:data-[slot=input-group]:mb-0 *:data-[slot=input-group]:h-8 *:data-[slot=input-group]:border-none *:data-[slot=input-group]:bg-input/20 *:data-[slot=input-group]:shadow-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
			className,
		)}
	>
		{@render children?.()}
	</PopoverPrimitive.Content>
</PopoverPrimitive.Portal>
