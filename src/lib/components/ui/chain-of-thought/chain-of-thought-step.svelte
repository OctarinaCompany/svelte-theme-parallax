<script lang="ts" module>
	import type { WithElementRef } from "$lib/utils.js";
	import type { Component } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import type { ChainOfThoughtStepStatus } from "./chain-of-thought.svelte.js";

	export type ChainOfThoughtStepProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/** What the model did — one line, in the step's ink. */
		label: string;
		/** A second line beneath the label, always in the muted ink and one size smaller. */
		description?: string;
		/**
		 * Where the step is in the model's work. Drives the ink and the `data-status` stamp; an
		 * unknown runtime value normalises to `"complete"`.
		 * @default "complete"
		 */
		status?: ChainOfThoughtStepStatus;
		/**
		 * The glyph in the gutter, a Lucide icon component. Sized by the step, so pass it bare.
		 * @default DotIcon
		 */
		icon?: Component;
	};
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";
	import DotIcon from "@lucide/svelte/icons/dot";
	import {
		chainOfThoughtStepVariants,
		resolveChainOfThoughtStepStatus,
	} from "./chain-of-thought.svelte.js";

	/**
	 * One thing the model did: a glyph in a gutter, a label, an optional description, and
	 * whatever the step produced beneath them — search results, an image, a paragraph.
	 *
	 * THE CONNECTOR IS THE STEP'S, NOT THE GUTTER'S. Upstream positions it inside the icon wrapper,
	 * which only reaches the step's bottom because a flex row stretches its items; here it is
	 * positioned against the step itself (`relative` on the root) at `left-2`, the centre of the
	 * 16px glyph, so a caller's `class` that changes the gutter's alignment cannot detach the line
	 * from it. It starts at `top-7` — below the glyph, with the same clearance upstream leaves —
	 * and ends at the step's bottom, so the run between two steps reads as a dashed link rather
	 * than a solid rail. The last step hides it (`group-last/step:hidden`).
	 *
	 * `min-w-0 overflow-hidden` on the body is what lets a long search-result row wrap inside the
	 * step instead of widening the whole trace: a flex item's minimum width is its content's.
	 */
	let {
		ref = $bindable(null),
		label,
		description,
		status = "complete",
		icon: Icon = DotIcon,
		class: className,
		children,
		...restProps
	}: ChainOfThoughtStepProps = $props();

	const resolved = $derived(resolveChainOfThoughtStepStatus(status));
</script>

<div
	bind:this={ref}
	data-slot="chain-of-thought-step"
	data-status={resolved}
	class={cn(chainOfThoughtStepVariants({ status: resolved }), className)}
	{...restProps}
>
	<div
		aria-hidden="true"
		class="absolute top-7 bottom-0 left-2 w-px bg-border group-last/step:hidden"
	></div>
	<div class="mt-0.5 flex shrink-0 [&>svg]:size-4">
		<Icon />
	</div>
	<div class="flex min-w-0 flex-1 flex-col gap-2 overflow-hidden">
		<div>{label}</div>
		{#if description}
			<div class="text-xs text-muted-foreground">{description}</div>
		{/if}
		{@render children?.()}
	</div>
</div>
