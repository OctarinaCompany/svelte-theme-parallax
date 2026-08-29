<script lang="ts" module>
	import type { Collapsible as CollapsiblePrimitive } from "bits-ui";

	export type TaskRootProps = CollapsiblePrimitive.RootProps & {
		/**
		 * The state the task STARTS in when `open` is not bound — a seed, read once. A task that
		 * is still running is usually left open so its items land in view as they arrive; a
		 * finished one deep in a transcript is usually collapsed. Ignored the moment `open` is
		 * supplied, and changing it later does nothing.
		 *
		 * @default true
		 */
		defaultOpen?: boolean;
	};

	/** Upstream-parity alias of {@link TaskRootProps}. */
	export type TaskProps = TaskRootProps;
</script>

<script lang="ts">
	import * as Collapsible from "$lib/components/ui/collapsible/index.js";
	import { cn } from "$lib/utils.js";

	/**
	 * A collapsible record of one thing an agent did — "Searching the codebase" — with the files it
	 * touched listed underneath. A port of AI Elements' `task.tsx`, built on the kit's own
	 * `ui/collapsible`, the verbatim shadcn-svelte port of Bits UI's Collapsible.
	 *
	 * THERE IS NO STATE OF ITS OWN. The only thing a task knows is whether it is open, and Bits UI
	 * already holds that: the trigger and the content reach the root through Bits UI's context and
	 * every part's `data-state` is stamped by it. That is why this folder has no `task.svelte.ts`
	 * (`index.ts` says so too).
	 *
	 * WHAT DIVERGES FROM UPSTREAM, and why:
	 *
	 * 1. THE TRIGGER IS THE `<button>` BITS UI RENDERS, not an `asChild` `<div>`. Upstream slots a
	 *    `cursor-pointer` div into Radix's trigger; here the default rendering goes INSIDE the real
	 *    button, so it is keyboard-operable, focus-ringed and announced with `aria-expanded` with no
	 *    extra code, and it writes no cursor of its own — a button is exactly what the base layer's
	 *    hand rule covers (`docs/CONVENTIONS.md` §8). Upstream's `asChild` survives as Bits UI's
	 *    `child` snippet, forwarded untouched. The title is a `<span>`, not upstream's `<p>`: a
	 *    button's content model is phrasing content, and a `<p>` inside one is invalid HTML.
	 *
	 * 2. `open` IS BINDABLE AND PAIRS WITH `onOpenChange`; `defaultOpen` seeds it. Upstream leans on
	 *    Radix for both; here the seed is `open ??= defaultOpen`, the shape `ui/banner`'s root uses.
	 *    The callback fires from Bits UI's own setter — only when the trigger toggles — so a
	 *    parent-driven write through `bind:open` never echoes back as a change, which is the
	 *    contract every bindable in this kit keeps (`docs/CONVENTIONS.md` §6).
	 *
	 * 3. THE FILE CHIP IS THE HOUSE `Badge`. Upstream hand-rolls it from utilities (`rounded-md
	 *    border bg-secondary px-1.5 py-0.5 text-xs`); this kit has the object that describes, so
	 *    `Task.ItemFile` takes `Badge variant="secondary"` rather than another spelling of a chip —
	 *    the same trade `ui/code-block` makes for its language tag. It is a different SHAPE (the
	 *    house pill, `rounded-4xl`, and its `[&>svg]:size-3!` sizes the file icon), and a chip that
	 *    does not look like every other chip in the kit is the worse trade.
	 *
	 * 4. THE CONTENT RAIL IS `border-border`, NOT `border-muted`, and upstream's
	 *    `text-popover-foreground` is dropped. This is not a popover and nothing inside inherits
	 *    that ink — `Task.Item` sets its own — so the class described nothing. `space-y-2` is
	 *    `flex flex-col gap-2` (`docs/CONVENTIONS.md` §8).
	 *
	 * 5. MOTION HONOURS `prefers-reduced-motion`, which upstream ignores: the chevron's rotation
	 *    transition and the content's slide both carry a `motion-reduce:` opt-out. They are pure CSS,
	 *    so the media query is the right tool — the shared `useReducedMotion()` reader exists for
	 *    motion a media query cannot stop (a frame loop, a class toggle), and reaching for it here
	 *    would be a second answer to a question CSS already settles.
	 *
	 * 6. `group/task` IS ON THE ROOT, NAMED. Upstream puts a bare `group` on the trigger; a named
	 *    group cannot collide with an ancestor's (`CollapsiblePage.svelte` already wraps demos in
	 *    `group/collapsible`), and the root's `data-state` is the one the chevron reads.
	 */
	let {
		ref = $bindable(null),
		open = $bindable(),
		defaultOpen = true,
		onOpenChange,
		class: className,
		...restProps
	}: TaskRootProps = $props();

	// Uncontrolled: seed once from `defaultOpen`. Controlled: the caller's binding wins. Read
	// outside any reactive context so it is unambiguously a seed, not a subscription.
	// svelte-ignore state_referenced_locally
	open ??= defaultOpen;
</script>

<!--
	`data-slot="task"` lands after `ui/collapsible`'s own `data-slot="collapsible"` because that
	part spreads its rest props last — the part's slot wins, which is the rule for every part here.
-->
<Collapsible.Root
	bind:ref
	bind:open
	{onOpenChange}
	data-slot="task"
	class={cn("group/task", className)}
	{...restProps}
/>
