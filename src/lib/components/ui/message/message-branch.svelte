<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type MessageBranchRootProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Which alternative is on screen, zero-based. Bindable, and paired with
		 * {@link MessageBranchRootProps.onBranchChange}. An index outside `0 … count - 1` renders the
		 * nearest branch and is NOT corrected in place, so a value a parent owns is never rewritten
		 * from in here.
		 */
		branch?: number;
		/**
		 * Where to start when `branch` is not bound. A SEED, read once at init: changing it later
		 * moves nothing.
		 * @default 0
		 */
		defaultBranch?: number;
		/**
		 * Fired when a step actually moves the index — never for a parent's write through `branch`,
		 * and never for a step the ends refused.
		 */
		onBranchChange?: (branch: number) => void;
		/**
		 * Whether stepping past an end wraps to the other one. `true` is upstream's behaviour, which
		 * has no opt-out there; `false` disables `Message.BranchPrevious` on the first branch and
		 * `Message.BranchNext` on the last.
		 * @default true
		 */
		loop?: boolean;
	};

	/** Alias of {@link MessageBranchRootProps}, present for parity with the upstream type name. */
	export type MessageBranchProps = MessageBranchRootProps;
</script>

<script lang="ts">
	import { untrack } from "svelte";
	import { MessageBranchState, setMessageBranchContext } from "./message.svelte.js";

	/**
	 * Several answers to one prompt, one of them on screen, with a pager underneath. What a
	 * "regenerate" button produces: the turn is replaced rather than appended, and the reader can
	 * walk back to the answer they preferred.
	 *
	 * The root is the state and nothing else visual — a column that stacks the content over the
	 * selector. It sits AROUND whole `<Message.Root>` turns, not inside one.
	 *
	 * WHAT DIVERGES FROM UPSTREAM, AND WHY:
	 *
	 * 1. THE ALTERNATIVES ARE A `branches: Snippet[]` PROP ON `Message.BranchContent`, not children
	 *    it counts. `message-branch-content.svelte` states the decision and the option it was
	 *    weighed against; `MessageBranchState` in `message.svelte.ts` says what that costs (the
	 *    count arrives one flush after the mount).
	 *
	 * 2. ONLY THE ACTIVE BRANCH IS MOUNTED. Upstream renders every alternative and hides all but
	 *    one with a `hidden` class, so a hidden branch keeps its DOM, its component state and any
	 *    timer it started. Here the inactive ones do not exist: stepping away destroys a branch and
	 *    stepping back builds it again. A transcript pays less DOM for it, and a branch that was
	 *    animating text restarts rather than resuming.
	 *
	 * 3. `branch` IS BINDABLE AND PAIRS WITH `onBranchChange`. Upstream keeps the index in its own
	 *    `useState` with `defaultBranch` as the seed and no controlled form at all, so a parent can
	 *    read the index through the callback but never write it. The house rule is that a bindable
	 *    prop and its `onXChange` come together (`docs/CONVENTIONS.md` §6), which is also what lets
	 *    a caller persist the reader's choice and restore it.
	 *
	 * 4. THE STEP CAN BE MADE TO STOP AT THE ENDS. Upstream ALWAYS loops — its previous from the
	 *    first goes to the last, its next from the last goes to the first — and disables the two
	 *    buttons only when there is a single branch. `loop` defaults to `true` so the port behaves
	 *    as upstream out of the box, and `loop={false}` disables each button at its end instead.
	 *
	 * 5. THE COUNTER IS ANNOUNCED. Upstream renders "2 of 3" as bare text, so a screen-reader user
	 *    who presses an icon button called "Next branch" is told nothing about what happened.
	 *    `message-branch-page.svelte` makes it a polite live region with a spoken label.
	 *
	 * SMALLER ONES: the root is `flex flex-col` rather than upstream's `grid`, matching the rest of
	 * the message family; `data-branch` and `data-branch-count` are stamped where upstream stamps
	 * nothing, so a stylesheet or a test can address the pager's state without reaching into the
	 * component; and upstream's blanket `[&>div]:pb-0` is narrowed to the turn it was aimed at, in
	 * `message-branch-content.svelte`.
	 */
	let {
		ref = $bindable(null),
		branch = $bindable(),
		defaultBranch = 0,
		onBranchChange,
		loop = true,
		class: className,
		children,
		...restProps
	}: MessageBranchRootProps = $props();

	// The seed, read once — the shape `ui/reasoning`'s root uses for `defaultOpen`. `branch` is left
	// without a destructuring default so a caller who binds it and one who does not both pass
	// through here; `untrack` documents that this is a deliberate one-time read, not a missed
	// dependency.
	untrack(() => {
		if (branch === undefined) branch = defaultBranch;
	});

	/** The one place a part writes the bindable. Guarded, so `onBranchChange` reports real moves. */
	function setBranch(next: number): void {
		if (next === branch) return;
		branch = next;
		onBranchChange?.(next);
	}

	const state = setMessageBranchContext(
		new MessageBranchState({
			// `?? 0` is type narrowing rather than behaviour: `branch` is optional in the props type,
			// and the seed above has already given it a value by the time anything reads this.
			getBranch: () => branch ?? 0,
			setBranch,
			getLoop: () => loop,
		}),
	);
</script>

<div
	bind:this={ref}
	data-slot="message-branch"
	data-branch={state.activeIndex}
	data-branch-count={state.count}
	class={cn("flex w-full flex-col gap-2", className)}
	{...restProps}
>
	{@render children?.()}
</div>
