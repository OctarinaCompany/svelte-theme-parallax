<script lang="ts" module>
	import type { Snippet } from "svelte";
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type MessageBranchContentProps = WithoutChildren<
		WithElementRef<HTMLAttributes<HTMLDivElement>>
	> & {
		/**
		 * The alternatives, in the order the pager walks them: one snippet per answer, each usually
		 * a whole `<Message.Root>`. Only the active one is rendered. An empty array renders nothing
		 * and leaves the counter at `0 of 0`; the array's length is what every other branch part
		 * counts, so appending to it while an answer streams in is how a fourth alternative appears.
		 */
		branches: Snippet[];
	};
</script>

<script lang="ts">
	import { untrack } from "svelte";
	import { getMessageBranchContext } from "./message.svelte.js";

	/**
	 * The alternatives, of which one is on screen.
	 *
	 * WHY A `branches` PROP AND NOT CHILDREN. Upstream reads its React children as an array
	 * (`Children.toArray`), renders every one of them and hides all but the active with a `hidden`
	 * class. Svelte cannot do the first step at all: children arrive as ONE snippet, a render
	 * function with no list to inspect, so there is nothing to count and nothing to index.
	 *
	 * The alternative considered was a registration part — `<Message.BranchItem>` children that
	 * register themselves with the root through the shared `DomOrderedCollection`
	 * (`$lib/shared/dom-ordered-collection.svelte.js`), the way `ui/stepper`'s items and
	 * `ui/action-bar`'s roving focus do. It reads more like markup, and it was rejected for three
	 * reasons. It can only count what is MOUNTED, so every alternative would have to stay in the
	 * DOM to be counted — exactly the cost divergence 2 in `message-branch.svelte` exists to
	 * avoid — and hiding them is then mandatory rather than an optimisation. Registration is by
	 * element, so it needs a real DOM node per branch and cannot express "an alternative" that is
	 * only a fragment. And the order would be document order recovered at runtime, where an array
	 * already has the order the caller wrote, typed and indexable.
	 *
	 * So the branches are values. `Snippet[]` is what a caller writes as `{#snippet}` blocks and
	 * passes as an array literal, which is honest about the count, keyed by index, and checked by
	 * the compiler.
	 *
	 * THE COUNT IS PUBLISHED TWICE, AND THE FIRST WRITE IS THE ONE THAT MATTERS. `<Stepper.Item>`
	 * registers from an effect alone (`ui/stepper`), because what it registers is a mounted DOM
	 * item that also needs a teardown. Here the count is `branches.length` — a prop, known before
	 * anything renders — so it is published synchronously at init as well, and the effect is left
	 * to carry the later changes.
	 *
	 * Without the init write the count reaches the root one flush after mount, and everything that
	 * reads it renders wrong for that pass: `Message.BranchSelector` returns nothing below two
	 * branches, so the pager is ABSENT, and the counter reads `0 of 0`. In this gallery that is
	 * invisible — the correction lands before the browser paints — but a consumer rendering on the
	 * server is the case that shows it, because effects never run there: the HTML ships with no
	 * pager and the counter at zero, and hydration puts them right in front of the reader.
	 *
	 * Both writes are untracked: the write must not subscribe this part to the very field it
	 * writes. `MessageBranchState.setCount` drops a write of the count it already holds, so a
	 * caller rebuilding the array on every render invalidates nothing, and the effect's first run
	 * is a no-op after the init write.
	 *
	 * `[&>[data-slot=message]]:pb-0` is upstream's `[&>div]:pb-0` aimed at the element it was for:
	 * a turn inside a branch group ends at the selector, not at its own `py-4`. Upstream's version
	 * hits every direct `div` child, which here would also flatten a caller's own wrapper.
	 *
	 * `min-w-0` REPLACES upstream's `overflow-hidden`, which was there to contain the branches it
	 * keeps mounted. With one branch on screen there is nothing to contain, and a clip on this box
	 * would cut a focus ring at its edge; `min-w-0` is what `Message.Content` already uses to let a
	 * wide table scroll in its own box instead of widening the column.
	 */
	let {
		ref = $bindable(null),
		branches,
		class: className,
		...restProps
	}: MessageBranchContentProps = $props();

	const branch = getMessageBranchContext("`<Message.BranchContent>`");

	const count = $derived(branches.length);

	untrack(() => branch.setCount(branches.length));

	$effect(() => {
		const next = count;
		untrack(() => branch.setCount(next));
	});

	// `branches[i]` rather than a keyed block: the snippet's identity changes with the index, which
	// is what makes Svelte tear the old branch down and build the new one.
	const active = $derived(branches[branch.activeIndex]);
</script>

<div
	bind:this={ref}
	data-slot="message-branch-content"
	data-branch={branch.activeIndex}
	class={cn("flex min-w-0 flex-col gap-2 [&>[data-slot=message]]:pb-0", className)}
	{...restProps}
>
	{@render active?.()}
</div>
