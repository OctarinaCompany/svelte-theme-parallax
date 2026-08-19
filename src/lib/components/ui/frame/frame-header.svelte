<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type FrameHeaderChildProps = {
		"data-slot": "frame-panel-header";
		class: string;
	} & Record<string, unknown>;

	export type FrameHeaderProps = WithElementRef<HTMLAttributes<HTMLElement>, HTMLElement> & {
		/**
		 * Render the header onto your own element instead of the default `<header>`. The snippet
		 * receives the merged props to spread onto that element. In `child` mode `children` is
		 * not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: FrameHeaderChildProps }]>;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		...restProps
	}: FrameHeaderProps = $props();

	// The `frame-panel-header` slot name (vs the file's `header`) is upstream's: Frame's dense
	// variant keys its first-panel margin off it.
	const headerAttrs = $derived({
		"data-slot": "frame-panel-header",
		...restProps,
		class: cn(
			"flex flex-col gap-(--frame-panel-header-gap) px-(--frame-panel-header-px) py-(--frame-panel-header-py)",
			className,
		),
	} as FrameHeaderChildProps);
</script>

{#if child}
	{@render child({ props: headerAttrs })}
{:else}
	<header bind:this={ref} {...headerAttrs}>
		{@render children?.()}
	</header>
{/if}
