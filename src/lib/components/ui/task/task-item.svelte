<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type TaskItemProps = WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
</script>

<script lang="ts">
	/**
	 * One line of the task's record — "Read", "Found 3 matches in" — in the muted ink, with
	 * `Task.ItemFile` chips flowing inline wherever a file is named. A plain `<div>`, as upstream;
	 * the rail in `Task.Content` does the layout, so this part carries type only.
	 */
	let { ref = $bindable(null), class: className, children, ...restProps }: TaskItemProps = $props();
</script>

<div
	bind:this={ref}
	data-slot="task-item"
	class={cn("text-sm text-muted-foreground", className)}
	{...restProps}
>
	{@render children?.()}
</div>
