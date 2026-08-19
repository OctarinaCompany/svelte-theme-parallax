<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type FrameDescriptionChildProps = {
		"data-slot": "frame-panel-description";
		class: string;
	} & Record<string, unknown>;

	export type FrameDescriptionProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Render the description onto your own element instead of the default `<div>`. The
		 * snippet receives the merged props to spread onto that element. In `child` mode
		 * `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: FrameDescriptionChildProps }]>;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		...restProps
	}: FrameDescriptionProps = $props();

	const descriptionAttrs = $derived({
		"data-slot": "frame-panel-description",
		...restProps,
		class: cn("text-sm text-muted-foreground", className),
	} as FrameDescriptionChildProps);
</script>

{#if child}
	{@render child({ props: descriptionAttrs })}
{:else}
	<div bind:this={ref} {...descriptionAttrs}>
		{@render children?.()}
	</div>
{/if}
