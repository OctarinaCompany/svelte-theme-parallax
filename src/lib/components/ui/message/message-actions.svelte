<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type MessageActionsProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	/**
	 * A row of `Message.Action` buttons — copy, retry, rate. Usually one side of a
	 * `Message.Toolbar`, and on its own when the turn has nothing to put on the other side.
	 *
	 * `gap-1` because the buttons are `icon-sm` ghosts: they read as one cluster, and a wider gap
	 * would make four separate objects of them.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: MessageActionsProps = $props();
</script>

<div
	bind:this={ref}
	data-slot="message-actions"
	class={cn("flex items-center gap-1", className)}
	{...restProps}
>
	{@render children?.()}
</div>
