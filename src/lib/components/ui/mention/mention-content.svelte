<script lang="ts" module>
	import { cn } from "$lib/utils.js";
	import type { Popover } from "bits-ui";
	import type { Snippet } from "svelte";

	/** The four sides the popup can be placed on. */
	export type MentionSide = "top" | "right" | "bottom" | "left";
	/** The three alignments the popup can take along its side. */
	export type MentionAlign = "start" | "center" | "end";

	export type MentionContentProps = Omit<
		Popover.ContentProps,
		| "child"
		| "customAnchor"
		| "onEscapeKeydown"
		| "onInteractOutside"
		| "onOpenAutoFocus"
		| "onCloseAutoFocus"
		| "preventScroll"
		| "trapFocus"
		| "updatePositionStrategy"
	> & {
		/**
		 * The preferred side of the caret to render against.
		 *
		 * @default "bottom"
		 */
		side?: MentionSide;
		/**
		 * The distance in pixels between the caret and the popup.
		 *
		 * @default 4
		 */
		sideOffset?: number;
		/**
		 * The preferred alignment against the caret. Mirrored (`start` ↔ `end`) under `dir="rtl"`.
		 *
		 * @default "start"
		 */
		align?: MentionAlign;
		/**
		 * An offset in pixels from the `start` or `end` alignment.
		 *
		 * @default 0
		 */
		alignOffset?: number;
		/**
		 * The padding between the arrow and the edges of the popup.
		 *
		 * @default 0
		 */
		arrowPadding?: number;
		/**
		 * Padding around the viewport edges used for collision detection.
		 *
		 * @default 0
		 */
		collisionPadding?: number | Partial<Record<MentionSide, number>>;
		/**
		 * Whether the popup keeps its side when it would otherwise collide.
		 *
		 * @default "partial"
		 */
		sticky?: "partial" | "always";
		/**
		 * The CSS positioning strategy for the popup.
		 *
		 * @default "absolute"
		 */
		strategy?: "absolute" | "fixed";
		/**
		 * Whether the popup flips away from collisions.
		 *
		 * @default true
		 */
		avoidCollisions?: boolean;
		/**
		 * Whether the popup is clamped to the space the viewport actually has.
		 *
		 * @default false
		 */
		fitViewport?: boolean;
		/**
		 * Whether the popup hides when the caret is scrolled out of view.
		 *
		 * @default false
		 */
		hideWhenDetached?: boolean;
		/**
		 * Whether the popup keeps following a caret that moves.
		 *
		 * @default true
		 */
		trackAnchor?: boolean;
		/**
		 * Whether the popup stays mounted while closed.
		 *
		 * @default false
		 */
		forceMount?: boolean;
		/** Called when `Escape` is pressed. `preventDefault()` keeps the popup open. */
		onEscapeKeyDown?: (event: KeyboardEvent) => void;
		/** Called on a pointer press outside the popup. `preventDefault()` keeps it open. */
		onPointerDownOutside?: (event: PointerEvent) => void;
		/** The list: normally a set of `<Mention.Item>`s. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";

	import { getMentionContext } from "./mention.svelte.js";

	let {
		ref = $bindable(null),
		side = "bottom",
		sideOffset = 4,
		align = "start",
		alignOffset = 0,
		arrowPadding = 0,
		collisionBoundary,
		collisionPadding = 0,
		sticky = "partial",
		strategy = "absolute",
		avoidCollisions = true,
		fitViewport = false,
		hideWhenDetached = false,
		trackAnchor = true,
		forceMount = false,
		onEscapeKeyDown,
		onPointerDownOutside,
		style,
		class: className,
		children,
		...restProps
	}: MentionContentProps = $props();

	const root = getMentionContext("<Mention.Content>");

	/** Upstream's `rtlAwareAlign`. */
	const resolvedAlign = $derived.by<MentionAlign>(() => {
		if (root.dir !== "rtl") return align;
		if (align === "start") return "end";
		if (align === "end") return "start";
		return align;
	});

	/**
	 * Upstream's documented CSS variables, aliased onto the ones `bits-ui` computes (divergence D-4)
	 * under a component-owned `--mention-*` prefix, plus `fitViewport`'s clamp (divergence D-5) —
	 * `bits-ui` does not expose floating-ui's `size` middleware, and the available-space variables
	 * reproduce the same result.
	 *
	 * While a paste resolves the content stays mounted (so items keep registering) but is clipped out
	 * of sight, which is upstream's `visuallyHidden` branch.
	 */
	const cssVariables = $derived(
		[
			"--mention-transform-origin: var(--bits-popover-content-transform-origin)",
			"--mention-anchor-width: var(--bits-popover-anchor-width)",
			"--mention-anchor-height: var(--bits-popover-anchor-height)",
			"--mention-available-width: var(--bits-popover-content-available-width)",
			"--mention-available-height: var(--bits-popover-content-available-height)",
			...(fitViewport
				? [
						"max-width: var(--mention-available-width)",
						"max-height: var(--mention-available-height)",
					]
				: []),
			...(root.isPasting
				? [
						"position: absolute",
						"width: 1px",
						"height: 1px",
						"overflow: hidden",
						"clip-path: inset(50%)",
						"white-space: nowrap",
					]
				: []),
		].join("; "),
	);

	const composedStyle = $derived(
		typeof style === "string" && style.length > 0 ? `${cssVariables}; ${style}` : cssVariables,
	);

	/**
	 * `bits-ui` consumes `id` and `dir` as component props — they drive the floating, dismissible and
	 * text-selection layers — and re-emits neither onto the content element itself. The APG pattern
	 * needs both there: the field's `aria-controls` has to resolve to this element, and the list has
	 * to carry its own reading direction. Both are written back with the values `bits-ui` was handed.
	 */
	$effect(() => {
		const element = ref;
		if (!element) return;

		element.id = root.listId;
		element.dir = root.dir;
	});

	function handleEscapeKeydown(event: KeyboardEvent) {
		onEscapeKeyDown?.(event);
	}

	function handleInteractOutside(event: PointerEvent) {
		onPointerDownOutside?.(event);
	}

	/** The APG combobox pattern keeps DOM focus in the field, so the popup never takes it. */
	function preventAutoFocus(event: Event) {
		event.preventDefault();
	}
</script>

<PopoverPrimitive.Content
	bind:ref
	id={root.listId}
	role="listbox"
	aria-orientation="vertical"
	data-slot="mention-content"
	data-state={root.dataState}
	data-pasting={root.isPasting ? "" : undefined}
	{side}
	{sideOffset}
	align={resolvedAlign}
	{alignOffset}
	{arrowPadding}
	{collisionBoundary}
	{collisionPadding}
	{sticky}
	{strategy}
	{avoidCollisions}
	{hideWhenDetached}
	{forceMount}
	updatePositionStrategy={trackAnchor ? "always" : "optimized"}
	customAnchor={root.caretAnchor ?? root.inputElement}
	dir={root.dir}
	trapFocus={false}
	preventScroll={root.modal}
	onOpenAutoFocus={preventAutoFocus}
	onCloseAutoFocus={preventAutoFocus}
	onEscapeKeydown={handleEscapeKeydown}
	onInteractOutside={handleInteractOutside}
	style={composedStyle}
	{...restProps}
	class={cn(
		"relative z-50 max-h-fit min-w-(--mention-anchor-width) origin-(--mention-transform-origin) overflow-hidden rounded-lg bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10 duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
		className,
	)}
>
	{@render children?.()}
</PopoverPrimitive.Content>
