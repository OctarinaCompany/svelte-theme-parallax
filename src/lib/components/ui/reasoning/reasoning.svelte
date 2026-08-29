<script lang="ts" module>
	import type { Collapsible as CollapsiblePrimitive } from "bits-ui";
	import { cn, type WithoutChild } from "$lib/utils.js";
	import { REASONING_AUTO_CLOSE_MS } from "./reasoning.svelte.js";

	/**
	 * Built on the Collapsible primitive's own props rather than on Svelte's `HTMLAttributes`,
	 * the way `ui/tool` and `ui/calendar` wrap theirs: the two disagree on whether `id` may be
	 * `null`, and a spread typed the Svelte way does not assign to the primitive. `open`,
	 * `onOpenChange`, `disabled`, `ref` and `children` are the primitive's; the five below are the
	 * thought's own.
	 */
	export type ReasoningRootProps = WithoutChild<CollapsiblePrimitive.RootProps> & {
		/**
		 * Whether the model is still writing this thought. Pass the part's `state === "streaming"`.
		 * The first `true` opens the panel (unless `defaultOpen={false}`) and starts the clock; the
		 * `false` after it stops the clock into `duration` and arms the auto-close.
		 * @default false
		 */
		isStreaming?: boolean;
		/**
		 * The panel's initial state when `open` is not bound. A SEED, read once: `true` mounts it
		 * open, `false` mounts it closed AND vetoes auto-open for the life of the instance, and
		 * leaving it out mounts it open exactly when `isStreaming` is already `true`.
		 * @default isStreaming
		 */
		defaultOpen?: boolean;
		/**
		 * How long the thought took, in whole seconds. Bindable. Written by the root when a stream
		 * it watched ends — `Math.ceil` of the elapsed time, so never 0 — and otherwise the caller's,
		 * for a transcript replayed with the duration it recorded. `undefined` prints as "a few
		 * seconds"; so does a non-positive value.
		 */
		duration?: number;
		/** Fired when the root measures a stream, never for a parent-driven write. */
		onDurationChange?: (duration: number | undefined) => void;
		/**
		 * Milliseconds between the stream stopping and the panel folding itself. Read when the timer
		 * is armed, so a change mid-window does not move a timer already running.
		 * @default REASONING_AUTO_CLOSE_MS (1000)
		 */
		autoCloseDelay?: number;
	};

	/** Alias of {@link ReasoningRootProps}, present for parity with the upstream type name. */
	export type ReasoningProps = ReasoningRootProps;
</script>

<script lang="ts">
	import { onDestroy, untrack } from "svelte";
	import * as Collapsible from "$lib/components/ui/collapsible/index.js";
	import { ReasoningState, setReasoningContext } from "./reasoning.svelte.js";

	/**
	 * A model's reasoning trace in a chat transcript: a one-line trigger that says whether it is
	 * still thinking or how long it thought, over a collapsible body carrying the thought itself.
	 *
	 * FIVE THINGS DIVERGE FROM UPSTREAM (`reasoning.tsx` in AI Elements):
	 *
	 * 1. THE THREE EFFECTS ARE ONE METHOD. Upstream runs auto-open, the stopwatch and auto-close as
	 *    three `useEffect`s over two refs and a state flag. Here they are `ReasoningState.sync`,
	 *    called from ONE effect keyed on `isStreaming` alone; the state class in
	 *    `reasoning.svelte.ts` says why, and names the two guards it adds — a panel the reader has
	 *    touched is never auto-closed, and a resumed stream cancels a pending close. The keying
	 *    changes auto-OPEN too: upstream's auto-open effect also depends on `isOpen`
	 *    (`reasoning.tsx`, the second `useEffect`), so a reader who collapses the panel mid-stream
	 *    is overridden on the next render. Here a mid-stream collapse sticks until the next stream
	 *    begins, and the page's "Simulated stream" section relies on that.
	 *
	 * 2. THE CONTENT IS A `content` PROP, not children. Upstream types `ReasoningContent`'s
	 *    `children` as `string` because React can read a string child back; a Svelte snippet is a
	 *    render function with no text to read. The body goes through `Message.Response`, which has
	 *    the same shape for the same reason.
	 *
	 * 3. THE STREAMING LABEL IS `TextGradient`, the house name for upstream's `Shimmer`, and the
	 *    resting label is one string with a singular: "Thought for 1 second", not "1 seconds".
	 *    Upstream's `duration === 0` shows the shimmer; here a finished thought never reads as
	 *    unfinished — see `ReasoningState.restingLabel`.
	 *
	 * 4. THE CONTENT DOES NOT ANIMATE. Upstream slides and fades the body with
	 *    `tailwindcss-animate` classes; the house Collapsible is the verbatim shadcn-svelte port
	 *    and ships no animation, and `ui/tool` made the same call for the same reason. The words
	 *    still blur in while streaming, because `Message.Response` is told `isAnimating`.
	 *
	 * 5. THE ROOT STAMPS `data-streaming` AND `data-pending-close`. Upstream stamps nothing; a
	 *    transcript that wants to style every thought still being written — dim the finished ones,
	 *    say — needs a hook that is not the open state, which a reader can flip. `data-pending-close`
	 *    is present while the close timer is armed, so the one-second window before a panel folds
	 *    itself is visible to a stylesheet and to a test, not only to the person watching it.
	 *
	 * SMALLER ONES: the group class is NAMED (`group/reasoning`) so the chevron does not turn when
	 * some ancestor `group` opens — a message bubble is a group too; the root KEEPS upstream's
	 * `mb-4`, as `ui/tool` does, because `chat.tsx` interleaves thoughts and tool calls inside one
	 * assistant message and the two must stack with the same gap in either order (a caller that
	 * sets its own gaps overrides it through `class`); and the primitive's `disabled` passes
	 * through.
	 *
	 * THE OPEN STATE: `open` is bound straight through to the primitive, and the primitive's
	 * `onOpenChange` is where a READER's toggle arrives — Bits UI fires it only from the setter its
	 * trigger drives, never when the parent writes `open` through the binding. That is what lets
	 * the root tell a person's click from its own auto-open, and it is the house rule for
	 * `onXChange` (fired only on a real change). `setOpen` below, the path the state class takes,
	 * guards the same way by hand.
	 */
	let {
		ref = $bindable(null),
		class: className,
		isStreaming = false,
		open = $bindable(),
		defaultOpen,
		onOpenChange,
		duration = $bindable(),
		onDurationChange,
		autoCloseDelay = REASONING_AUTO_CLOSE_MS,
		children,
		...restProps
	}: ReasoningRootProps = $props();

	// The seed, read once. `open` is left without a destructuring default so a caller who binds
	// it and one who does not both pass through here: an unbound `open` is `undefined` at init,
	// and the resolution is upstream's `defaultOpen ?? isStreaming`. `untrack` documents that this
	// is a deliberate one-time read of two reactive props, not a reactivity bug.
	untrack(() => {
		if (open === undefined) open = defaultOpen ?? isStreaming;
	});

	/** The one place a PART writes the bindable; the trigger writes it through the primitive. */
	function setOpen(next: boolean): void {
		if (next === open) return;
		open = next;
		onOpenChange?.(next);
	}

	function setDuration(next: number | undefined): void {
		if (next === duration) return;
		duration = next;
		onDurationChange?.(next);
	}

	const reasoning = new ReasoningState({
		getIsStreaming: () => isStreaming,
		getOpen: () => open ?? false,
		setOpen,
		getDefaultOpen: () => defaultOpen,
		getDuration: () => duration,
		setDuration,
		getAutoCloseDelay: () => autoCloseDelay,
	});

	setReasoningContext(reasoning);

	// Keyed on `isStreaming` ALONE. Everything `sync` reads besides the flag — `open`, the delay,
	// its own bookkeeping — is untracked, so the effect runs on the flag's edges and never because
	// the reader toggled the panel. Tracking `open` here is exactly the bug upstream's third
	// effect has: it re-arms the close timer every time the panel is reopened.
	$effect(() => {
		const streaming = isStreaming;
		untrack(() => reasoning.sync(streaming));
	});

	// A close timer that outlives the component would write `open` on an unmounted instance.
	onDestroy(() => reasoning.destroy());
</script>

<!--
	`not-prose` is upstream's and load-bearing: a thought sits inside a Markdown-rendered assistant
	message, and the typography plugin would otherwise restyle the trigger's button and the body's
	own Markdown twice over.
-->
<Collapsible.Root
	bind:ref
	bind:open
	onOpenChange={(next) => {
		reasoning.noteUserToggle();
		onOpenChange?.(next);
	}}
	data-slot="reasoning"
	data-streaming={isStreaming ? "" : undefined}
	data-pending-close={reasoning.pendingClose ? "" : undefined}
	class={cn("group/reasoning not-prose mb-4 w-full", className)}
	{...restProps}
>
	{@render children?.()}
</Collapsible.Root>
