<script lang="ts" module>
	import type { Collapsible as CollapsiblePrimitive } from "bits-ui";
	import { cn, type WithoutChild } from "$lib/utils.js";
	import type { Snippet } from "svelte";

	/** The primitive's trigger props — see `tool.svelte` for why not Svelte's `HTMLButtonAttributes`. */
	export type ToolHeaderProps = WithoutChild<CollapsiblePrimitive.TriggerProps> & {
		/**
		 * Replaces the left cluster — the wrench and the tool's name — with the caller's own. The
		 * status badge and the chevron on the right stay: they are the part's contract, and a header
		 * without them is a different component.
		 */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import WrenchIcon from "@lucide/svelte/icons/wrench";
	import * as Collapsible from "$lib/components/ui/collapsible/index.js";
	import * as Status from "$lib/components/ui/status/index.js";
	import { useReducedMotion } from "$lib/shared/reduced-motion.svelte.js";
	import { getToolContext } from "./tool.svelte.js";

	/**
	 * The trigger row: wrench, name, state badge, chevron. Everything it prints is read off the
	 * root's `ToolState`, which is what lets `<Tool.Header />` be called with no props at all —
	 * upstream's header takes the same three values the root already has (`tool.tsx:74-81`).
	 *
	 * THE BADGE SITS ON THE RIGHT, beside the chevron, rather than in the left cluster after the
	 * name as upstream places it (`tool.tsx:93-97`). In a transcript the tool names are ragged and
	 * the states are what a reader scans for; a right-aligned column of pills lines them up.
	 *
	 * The badge is `Status`, not `Badge`: the pill is the same one, and `Status.Indicator` already
	 * carries the pulse that upstream hand-rolls with `animate-pulse` on one of its five glyphs.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ToolHeaderProps = $props();

	const tool = getToolContext("`<Tool.Header>`");

	// The chevron's 150ms turn is the one transition this component owns; it goes through the
	// house reader (`src/lib/shared/reduced-motion.svelte.ts`) rather than a `motion-reduce:`
	// variant so a reader who asked for less motion gets the same answer here as from the dot.
	const reducedMotion = useReducedMotion();
</script>

<!--
	`text-left` is deliberate: a `<button>` centres its text, and a long tool name that wraps
	inside the left cluster would otherwise centre against the chevron.
-->
<Collapsible.Trigger
	bind:ref
	data-slot="tool-header"
	class={cn("flex w-full items-center justify-between gap-4 p-3 text-left", className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{:else}
		<div class="flex min-w-0 items-center gap-2">
			<WrenchIcon class="shrink-0 text-muted-foreground" />
			<span class="truncate text-sm font-medium">{tool.name}</span>
		</div>
	{/if}
	<div class="flex shrink-0 items-center gap-2">
		<Status.Root variant={tool.variant}>
			<Status.Indicator pulse={tool.active} />
			<Status.Label>{tool.label}</Status.Label>
		</Status.Root>
		<ChevronDownIcon
			class={cn(
				"text-muted-foreground group-data-[state=open]/tool:rotate-180",
				!reducedMotion.current && "transition-transform",
			)}
		/>
	</div>
</Collapsible.Trigger>
