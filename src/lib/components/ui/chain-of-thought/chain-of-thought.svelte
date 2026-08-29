<script lang="ts" module>
	import type { WithoutChild } from "$lib/utils.js";
	import type { Collapsible as CollapsiblePrimitive } from "bits-ui";

	/**
	 * Bits UI's `Collapsible.Root` attributes, minus its `child` snippet — the root IS that
	 * collapsible (divergence 1 below), so `disabled` and `onOpenChangeComplete` pass straight
	 * through, and the rest is typed the way Bits accepts it: a plain `HTMLAttributes<HTMLDivElement>`
	 * rest would not spread onto it (Bits forbids `id: null`, which Svelte's element types allow).
	 */
	export type ChainOfThoughtRootProps = WithoutChild<CollapsiblePrimitive.RootProps> & {
		/**
		 * Whether the trace is expanded. Bind it to drive the disclosure from outside, or to follow
		 * the reader's choice. Left unset, it seeds from {@link ChainOfThoughtRootProps.defaultOpen}.
		 */
		open?: boolean;
		/**
		 * The initial state of an uncontrolled trace. A SEED for `open`, read once; changing it
		 * later leaves the reader's choice alone.
		 * @default false
		 */
		defaultOpen?: boolean;
		/**
		 * Fired when the header toggles the trace or a part calls `setOpen` with a new value — never
		 * for a parent-driven write to `open`.
		 */
		onOpenChange?: (open: boolean) => void;
	};

	/** Alias of {@link ChainOfThoughtRootProps}, present for parity with the upstream type name. */
	export type ChainOfThoughtProps = ChainOfThoughtRootProps;
</script>

<script lang="ts">
	import * as Collapsible from "$lib/components/ui/collapsible/index.js";
	import { cn } from "$lib/utils.js";
	import { ChainOfThoughtState, setChainOfThoughtContext } from "./chain-of-thought.svelte.js";

	/**
	 * A collapsible trace of the steps a model took to reach an answer: a header that names the
	 * work, then one step per thing it did, each carrying what it found — search hits, a document,
	 * an image — beneath its label.
	 *
	 * It shows a model's WORK. `ui/timeline` is the neighbour it is most easily confused with, and
	 * the difference is who the events happened to: a timeline lists things that happened to a
	 * SYSTEM (a deploy, an incident, a comment), read after the fact; a chain of thought lists what
	 * the MODEL did on its way to this one answer, and is usually read while it is still growing.
	 *
	 * SEVEN THINGS DIVERGE FROM UPSTREAM (`chain-of-thought.tsx` in the AI Elements package):
	 *
	 * 1. ONE COLLAPSIBLE, MOUNTED HERE. Upstream's root is a plain `div` that only publishes
	 *    `isOpen` on context; the header and the content each mount a `<Collapsible>` of their own
	 *    and keep them in step through that context. Two roots means two ids, so the trigger's
	 *    `aria-controls` names a region that lives in the OTHER collapsible — the pairing a screen
	 *    reader relies on is broken by construction. Here the root IS the `Collapsible.Root`
	 *    (`ui/collapsible`, the verbatim shadcn-svelte port over Bits UI), the header is its
	 *    trigger and the content its region, so `aria-expanded`, `aria-controls` and the
	 *    `data-state` stamps all describe one disclosure.
	 *
	 * 2. `open` IS A BINDABLE, paired with `onOpenChange` as every bindable in this kit is
	 *    (`docs/CONVENTIONS.md` §6), and the callback fires only for a change the component made —
	 *    the trigger, or a part calling `setOpen` — never for a parent's own write. Upstream's
	 *    `useControllableState` fires it for both. `defaultOpen` survives as the uncontrolled seed.
	 *
	 * 3. THE LAYOUT IS `flex-col gap-4`, not `space-y-4` (`docs/CONVENTIONS.md` §8), and the block
	 *    is capped at `max-w-prose`: a trace is a paragraph of work, and one that stretched across
	 *    a wide message bubble would set 65-character lines 200 characters wide.
	 *
	 * 4. THE CONTENT DOES NOT ANIMATE. Upstream slides the content in AND slides every step in, so
	 *    an opening trace plays the same entrance twice, nested. The steps keep theirs — they are
	 *    what arrives one at a time while the model works — and the content simply appears.
	 *
	 * 5. THE CONNECTOR STOPS AT THE LAST STEP. Upstream draws every step's connector to the bottom
	 *    of the step, including the last one, which leaves a tail hanging below the trace; here it
	 *    hides itself on the last step (`chainOfThoughtStepVariants` says how).
	 *
	 * 6. A STEP'S `label` AND `description` ARE STRINGS, not React nodes. Rich content goes in the
	 *    step's `children`, below the description, which is where upstream renders search results
	 *    and images anyway; a `Snippet` label would have forced every caller to write a snippet for
	 *    a five-word sentence.
	 *
	 * 7. `status` IS RESOLVED, NOT TRUSTED. Upstream indexes a lookup table with it, so an
	 *    untyped value paints no ink at all; here it normalises to `complete` and is stamped as
	 *    `data-status` so a stylesheet can address it.
	 */
	let {
		ref = $bindable(null),
		open = $bindable(),
		defaultOpen = false,
		onOpenChange,
		class: className,
		children,
		...restProps
	}: ChainOfThoughtRootProps = $props();

	// Uncontrolled: seed once from `defaultOpen`. Controlled: the caller's binding wins. Same
	// shape as `ui/banner`, which is where the kit settled the open/defaultOpen pair.
	// svelte-ignore state_referenced_locally
	open ??= defaultOpen;

	/**
	 * The programmatic write, for parts and for callers holding the context. Guarded so a write
	 * equal to the current value neither re-renders nor announces — `onOpenChange` means a change.
	 */
	function setOpen(next: boolean): void {
		if (next === open) return;
		open = next;
		onOpenChange?.(next);
	}

	setChainOfThoughtContext(
		new ChainOfThoughtState({
			getOpen: () => open ?? false,
			setOpen,
		}),
	);
</script>

<!--
	Bits UI's `onOpenChange` fires only from its own setter — the trigger's press — and not when
	`bind:open` carries a parent's write in, which is exactly the contract `onOpenChange` promises
	above. `data-slot` lands after the port's own `data-slot="collapsible"` because the port spreads
	its rest props last, so this one wins.
-->
<Collapsible.Root
	bind:ref
	bind:open
	onOpenChange={(next) => onOpenChange?.(next)}
	data-slot="chain-of-thought"
	class={cn("not-prose flex w-full max-w-prose flex-col gap-4", className)}
	{...restProps}
>
	{@render children?.()}
</Collapsible.Root>
