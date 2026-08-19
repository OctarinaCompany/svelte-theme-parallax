<script lang="ts" module>
	import { cn } from "$lib/utils.js";
	import type { Popover } from "bits-ui";
	import type { Snippet } from "svelte";

	/** The four sides the popup can be placed on. */
	export type AutocompleteSide = "top" | "right" | "bottom" | "left";
	/** The three alignments the popup can take along its side. */
	export type AutocompleteAlign = "start" | "center" | "end";

	export type AutocompleteContentProps = Omit<
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
		 * The preferred side of the field to render against.
		 *
		 * @default "bottom"
		 */
		side?: AutocompleteSide;
		/**
		 * The distance in pixels between the field and the popup.
		 *
		 * @default 4
		 */
		sideOffset?: number;
		/**
		 * The preferred alignment against the field.
		 *
		 * @default "start"
		 */
		align?: AutocompleteAlign;
		/**
		 * An offset in pixels from the `start` or `end` alignment.
		 *
		 * @default 0
		 */
		alignOffset?: number;
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
		/** The popup's parts: normally a `<Autocomplete.Empty>` and a `<Autocomplete.List>`. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";

	import { getAutocompleteContext } from "./autocomplete.svelte.js";

	/**
	 * The portalled popup.
	 *
	 * Only the shell is `bits-ui`'s: the portal, the floating position and the dismissible layer.
	 * Everything the list does — filtering, highlighting, selection — belongs to
	 * `<Autocomplete.Root>`, which is why this is a `Popover` and not a `Combobox` (see
	 * `autocomplete.svelte.ts`).
	 *
	 * `w-(--bits-floating-anchor-width)` is what makes the popup exactly as wide as the field, which
	 * is upstream's `w-(--anchor-width)` under `bits-ui`'s name for the same measurement.
	 */

	let {
		ref = $bindable(null),
		side = "bottom",
		sideOffset = 4,
		align = "start",
		alignOffset = 0,
		portalTo,
		portalDisabled = false,
		onEscapeKeydown,
		onPointerDownOutside,
		class: className,
		children,
		...restProps
	}: AutocompleteContentProps = $props();

	const root = getAutocompleteContext("<Autocomplete.Content>");

	// The field closes on blur, and needs to know which element is the one exception to that.
	$effect(() => {
		root.contentElement = ref;
		return () => {
			if (root.contentElement === ref) root.contentElement = null;
		};
	});

	/** The APG combobox pattern keeps DOM focus in the field, so the popup never takes it. */
	function preventAutoFocus(event: Event) {
		event.preventDefault();
	}

	/**
	 * The field is not inside the popup, so every click that puts the caret back in it reads as an
	 * interaction outside — and would close the list under the user mid-edit. The anchor is part of
	 * the widget; only a press somewhere else dismisses it.
	 */
	function isWithinField(target: EventTarget | null): boolean {
		const input = root.inputElement;
		return !!input && target instanceof Node && (target === input || input.contains(target));
	}

	function handleInteractOutside(event: PointerEvent) {
		if (isWithinField(event.target)) {
			event.preventDefault();
			return;
		}
		onPointerDownOutside?.(event);
	}

	function handleFocusOutside(event: FocusEvent) {
		if (isWithinField(event.target)) event.preventDefault();
	}
</script>

<PopoverPrimitive.Portal to={portalTo} disabled={portalDisabled}>
	<PopoverPrimitive.Content
		bind:ref
		data-slot="autocomplete-content"
		{side}
		{sideOffset}
		{align}
		{alignOffset}
		customAnchor={root.inputElement}
		trapFocus={false}
		preventScroll={false}
		onOpenAutoFocus={preventAutoFocus}
		onCloseAutoFocus={preventAutoFocus}
		onInteractOutside={handleInteractOutside}
		onFocusOutside={handleFocusOutside}
		{onEscapeKeydown}
		{...restProps}
		class={cn(
			"relative z-50 flex max-h-[min(var(--bits-floating-available-height),24rem)] w-(--bits-floating-anchor-width) max-w-(--bits-floating-available-width) flex-col overflow-hidden overscroll-contain rounded-lg bg-popover py-0.5 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
			className,
		)}
	>
		{@render children?.()}
	</PopoverPrimitive.Content>
</PopoverPrimitive.Portal>
