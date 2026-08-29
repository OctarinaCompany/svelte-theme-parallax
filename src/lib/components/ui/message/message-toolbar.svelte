<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type MessageToolbarProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	/**
	 * The strip under a turn: actions on one side, metadata — a timestamp, the model that
	 * answered, a token count — on the other. `justify-between` is what puts them at the two
	 * edges; a caller with only one side gets it at the left.
	 *
	 * `mt-2`, half of upstream's `mt-4`: the body already ends in `leading-relaxed` text, and the
	 * kit's turn carries `gap-2` between its children, so the toolbar sits one step below the
	 * prose rather than in a band of its own.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: MessageToolbarProps = $props();
</script>

<div
	bind:this={ref}
	data-slot="message-toolbar"
	class={cn("mt-2 flex w-full items-center justify-between gap-4", className)}
	{...restProps}
>
	{@render children?.()}
</div>
