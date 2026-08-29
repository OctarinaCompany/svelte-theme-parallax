<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type QuestionDescriptionProps = WithElementRef<
		HTMLAttributes<HTMLParagraphElement>,
		HTMLParagraphElement
	>;
</script>

<script lang="ts">
	/**
	 * Supporting copy under the prompt — why the assistant is asking, or what the answer changes.
	 * Upstream's `QuestionDescription`: a `<p>` in the muted ink, kept verbatim.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: QuestionDescriptionProps = $props();
</script>

<p
	bind:this={ref}
	data-slot="question-description"
	class={cn("text-sm text-muted-foreground", className)}
	{...restProps}
>
	{@render children?.()}
</p>
