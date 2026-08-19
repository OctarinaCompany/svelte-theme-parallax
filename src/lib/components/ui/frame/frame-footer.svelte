<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type FrameFooterChildProps = {
		"data-slot": "frame-panel-footer";
		class: string;
	} & Record<string, unknown>;

	export type FrameFooterProps = WithElementRef<HTMLAttributes<HTMLElement>, HTMLElement> & {
		/**
		 * Render the footer onto your own element instead of the default `<footer>`. The snippet
		 * receives the merged props to spread onto that element. In `child` mode `children` is
		 * not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: FrameFooterChildProps }]>;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		...restProps
	}: FrameFooterProps = $props();

	const footerAttrs = $derived({
		"data-slot": "frame-panel-footer",
		...restProps,
		class: cn(
			"flex flex-col gap-(--frame-panel-footer-gap) px-(--frame-panel-footer-px) py-(--frame-panel-footer-py)",
			className,
		),
	} as FrameFooterChildProps);
</script>

{#if child}
	{@render child({ props: footerAttrs })}
{:else}
	<footer bind:this={ref} {...footerAttrs}>
		{@render children?.()}
	</footer>
{/if}
