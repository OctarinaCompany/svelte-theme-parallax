<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type PromptInputBodyProps = WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
</script>

<script lang="ts">
	/**
	 * The middle of the composer: the textarea, and — once attachments land — the chip list that
	 * sits above it.
	 *
	 * `display: contents`, as upstream. The `InputGroup` lays its direct children out as a column
	 * and reads `data-align` off them; a box here would swallow the textarea into a nested flex
	 * item the group cannot see. The div exists so a caller has one thing to hand a `class` to and
	 * so the follow-up parts have a parent, not to paint anything.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: PromptInputBodyProps = $props();
</script>

<div bind:this={ref} data-slot="prompt-input-body" class={cn("contents", className)} {...restProps}>
	{@render children?.()}
</div>
