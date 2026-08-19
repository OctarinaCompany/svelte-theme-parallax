<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type FrameTitleChildProps = {
		"data-slot": "frame-panel-title";
		class: string;
	} & Record<string, unknown>;

	export type FrameTitleProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Render the title onto your own element instead of the default `<div>` - e.g. an `<h2>`
		 * when the frame heads a document section. The snippet receives the merged props to
		 * spread onto that element. In `child` mode `children` is not rendered and `ref` stays
		 * `null`.
		 */
		child?: Snippet<[{ props: FrameTitleChildProps }]>;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		...restProps
	}: FrameTitleProps = $props();

	const titleAttrs = $derived({
		"data-slot": "frame-panel-title",
		...restProps,
		class: cn("text-sm font-semibold", className),
	} as FrameTitleChildProps);
</script>

{#if child}
	{@render child({ props: titleAttrs })}
{:else}
	<div bind:this={ref} {...titleAttrs}>
		{@render children?.()}
	</div>
{/if}
