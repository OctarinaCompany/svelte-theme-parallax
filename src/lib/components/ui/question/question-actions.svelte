<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type QuestionActionsProps = WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
</script>

<script lang="ts">
	/**
	 * The button row at the foot of the form, end-aligned so the submit sits where a dialog's
	 * primary action does. Upstream's `QuestionActions`, kept verbatim. Holds `<Question.Submit>`
	 * and whatever else the caller wants beside it — a "Skip" ghost button is the usual companion.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: QuestionActionsProps = $props();
</script>

<div
	bind:this={ref}
	data-slot="question-actions"
	class={cn("flex items-center justify-end gap-2", className)}
	{...restProps}
>
	{@render children?.()}
</div>
