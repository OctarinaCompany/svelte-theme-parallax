<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import type { ConversationLiveMode } from "./conversation.svelte.js";

	export type ConversationRootProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * How the viewport reaches the bottom when it mounts. Overridden to `instant` under
		 * `prefers-reduced-motion: reduce`.
		 * @default "smooth"
		 */
		initial?: ScrollBehavior;
		/**
		 * How the viewport follows content that grows while the reader is at the bottom — every
		 * streamed token, every appended message. Overridden to `instant` under
		 * `prefers-reduced-motion: reduce`.
		 * @default "smooth"
		 */
		resize?: ScrollBehavior;
		/**
		 * How many pixels short of the bottom still count as being at the bottom. A negative value
		 * is read as `0`.
		 * @default 16
		 */
		offset?: number;
		/**
		 * What the log announces. `off` (the default, and a deliberate override of `role="log"`'s
		 * implicit `polite`) announces nothing; `polite` announces additions when the reader is
		 * idle. Anything else normalises to `off`.
		 * @default "off"
		 */
		live?: ConversationLiveMode;
		/**
		 * Fired when the reader enters or leaves the bottom band — never for the initial `true`.
		 * The value is not bindable: the component is its only writer, so read it here or from
		 * `getConversationContext().atBottom`.
		 */
		onAtBottomChange?: (atBottom: boolean) => void;
		/**
		 * The scrolling element — the inner `role="log"` viewport, not the outer anchor `ref`
		 * points at. An element reference like `ref`, so it carries no change callback.
		 */
		viewportRef?: HTMLDivElement | null;
	};

	/** Alias of {@link ConversationRootProps}, present for parity with the upstream type name. */
	export type ConversationProps = ConversationRootProps;
</script>

<script lang="ts">
	import { untrack } from "svelte";
	import {
		ConversationState,
		resolveConversationLiveMode,
		setConversationContext,
	} from "./conversation.svelte.js";

	/**
	 * The scrolling transcript of a chat: a viewport that keeps the newest content in view while
	 * the reader is at the bottom, and leaves them alone once they scroll up to read.
	 *
	 * THE DOM IS TWO ELEMENTS, as it is upstream: `use-stick-to-bottom` renders an outer box and an
	 * inner scroller sized to fill it, and the button parts position themselves against the outer
	 * one. Here the outer `<div>` is the position anchor (`relative overflow-hidden`) and carries
	 * `ref`, `class` and every forwarded attribute; the inner `<div>` is the viewport
	 * (`role="log"`, `overflow-y-auto`) and is reached through `viewportRef`. It needs a height
	 * from outside — `class="flex-1"` in a flex column, or `class="h-96"` — because a viewport
	 * that grows with its content never scrolls and therefore never pins. `min-h-0` is baked in
	 * so that a flex child can shrink below its content at all; `flex-1` is NOT (divergence 8).
	 *
	 * WHAT DIVERGES FROM UPSTREAM (`conversation.tsx`), and why:
	 *
	 * 1. NO `use-stick-to-bottom`. The follow-the-bottom behaviour is `ConversationState` in
	 *    `conversation.svelte.ts`: a scroll listener and a `ResizeObserver` over the browser's own
	 *    `scrollTo`, rather than a spring animation of the library's own. The contract is kept —
	 *    pinned while content grows, released on a scroll up, back on return — and the animation
	 *    respects `prefers-reduced-motion` through the kit's shared reader, which a library
	 *    running its own frames would not.
	 *
	 * 2. `aria-live` IS `off` BY DEFAULT. `role="log"` implies `polite`, and upstream leaves it so.
	 *    A transcript that streams a reply announces every token as it lands; `live="polite"` is
	 *    there for a log that appends whole messages. `CONVERSATION_LIVE_MODES` says the rest.
	 *
	 * 3. THE VIEWPORT IS FOCUSABLE (`tabindex={0}`), which upstream's is not. A region that scrolls
	 *    and contains nothing focusable cannot be reached by a keyboard at all in Firefox and
	 *    Safari (WCAG 2.1.1; axe `scrollable-region-focusable`) — the same fix, for the same
	 *    reason, as `ui/code-block`'s content. A focused log scrolls with the arrow keys, PageUp
	 *    and PageDown, Home and End, and `End` re-pins.
	 *
	 * 4. THE ROOT STAMPS `data-at-bottom`, because every other component in this kit publishes its
	 *    state as a data attribute and this is that state — a caller can fade a gradient in over
	 *    the last line with `[&:not([data-at-bottom])]:…` and no script.
	 *
	 * 5. `Conversation.Download` IS NOT ABSOLUTELY POSITIONED, and is `size="icon-sm"`. Upstream
	 *    pins it to the top-right corner of the transcript at the full icon size, where it covers
	 *    the first line of whatever it overlays. Here it is a plain toolbar control the caller
	 *    places — a header, a footer, beside the prompt — at the size the kit's other toolbar
	 *    icons take. Its Markdown writes a `## Role` heading per turn where upstream writes a bold
	 *    prefix; `formatConversationMessage` explains why a table would not survive the prefix.
	 *
	 * 6. `Conversation.EmptyState` IS BUILT FROM `ui/empty`, not from utilities: the house empty
	 *    state already has the title, description and icon slots the part needs, so it takes the
	 *    kit's own type sizes rather than upstream's `text-sm` pair.
	 *
	 * 7. THE SCROLL BUTTON ANIMATES IN. Upstream mounts and unmounts it with no transition; here it
	 *    rises 8px through a fade, collapsed to nothing under reduced motion.
	 *
	 * 8. NO `flex-1` ON THE ROOT. Upstream bakes it in, which makes a root inside a flex column
	 *    ignore any `h-*` it is given — `flex-basis: 0%` wins over `height` on the main axis — so
	 *    the documented "or an `h-*`" would be false. Sizing is the caller's layout decision
	 *    (`docs/CONVENTIONS.md` §8: looks are variants, layout goes through `class`), and every
	 *    call site says `flex-1` or `h-*` itself.
	 */
	let {
		ref = $bindable(null),
		viewportRef = $bindable(null),
		class: className,
		initial = "smooth",
		resize = "smooth",
		offset = 16,
		live = "off",
		onAtBottomChange,
		children,
		...restProps
	}: ConversationRootProps = $props();

	const state = new ConversationState({
		getInitial: () => initial,
		getResize: () => resize,
		getOffset: () => offset,
		onAtBottomChange: (atBottom) => onAtBottomChange?.(atBottom),
	});

	setConversationContext(state);

	const resolvedLive = $derived(resolveConversationLiveMode(live));

	// `untrack` so the effect depends on the viewport element alone: `observe` scrolls to the
	// bottom, and that read of the reduced-motion flag must not re-observe the element every time
	// the media query flips.
	$effect(() => {
		const viewport = viewportRef;
		if (!viewport) return;
		return untrack(() => state.observe(viewport));
	});

	// A new `offset` changes the answer to "is the reader at the bottom?" without any scroll or
	// resize to prompt the question, so ask it here. Only `offset` is tracked: `measure` reads the
	// state's own derived tolerance and the live scroll position, neither of which should
	// re-trigger this.
	$effect(() => {
		offset;
		untrack(() => state.measure());
	});
</script>

<div
	bind:this={ref}
	data-slot="conversation"
	data-at-bottom={state.atBottom ? "" : undefined}
	class={cn("relative min-h-0 overflow-hidden", className)}
	{...restProps}
>
	<!--
		The a11y rule fires because a `div` with `role="log"` is not interactive. It has to be
		focusable anyway: this is a region that scrolls, and a transcript contains nothing focusable
		of its own, so without a tab stop a keyboard-only reader cannot reach the messages above the
		fold at all in Firefox or Safari (WCAG 2.1.1; axe `scrollable-region-focusable`). Same shape
		of exception as `code-block-content.svelte`.
	-->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		bind:this={viewportRef}
		data-slot="conversation-viewport"
		role="log"
		tabindex={0}
		aria-live={resolvedLive}
		class="size-full overflow-y-auto outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset"
	>
		{@render children?.()}
	</div>
</div>
