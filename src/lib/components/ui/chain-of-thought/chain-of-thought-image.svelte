<script lang="ts" module>
	import type { WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type ChainOfThoughtImageProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/** A line beneath the frame, in the muted ink. Nothing renders when it is empty. */
		caption?: string;
	};
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	/**
	 * A framed figure a step produced — a chart the model drew, a screenshot it took — with an
	 * optional caption. `children` is the image itself, whatever element that is.
	 *
	 * The frame is `max-h-88` (upstream's 22rem) and clips, so a tall image is cropped rather than
	 * letting one step run the height of the transcript; the ground is `bg-muted` so a transparent
	 * PNG has something to sit on. The corner is `rounded-md` rather than upstream's `rounded-lg`
	 * — the radius every block in this kit takes (`ui/code-block`, `ui/json-viewer`).
	 */
	let {
		ref = $bindable(null),
		caption,
		class: className,
		children,
		...restProps
	}: ChainOfThoughtImageProps = $props();
</script>

<div
	bind:this={ref}
	data-slot="chain-of-thought-image"
	class={cn("mt-2 flex flex-col gap-2", className)}
	{...restProps}
>
	<div
		data-slot="chain-of-thought-image-frame"
		class="relative flex max-h-88 items-center justify-center overflow-hidden rounded-md bg-muted p-3"
	>
		{@render children?.()}
	</div>
	{#if caption}
		<p data-slot="chain-of-thought-image-caption" class="text-xs text-muted-foreground">
			{caption}
		</p>
	{/if}
</div>
