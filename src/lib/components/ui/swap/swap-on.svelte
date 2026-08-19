<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { getSwapContext, type SwapFaceChildProps } from "./swap.svelte.js";

	export type SwapOnProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Render the face onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child` mode
		 * `children` is not rendered and `ref` is not populated — the caller owns the element.
		 */
		child?: Snippet<[{ props: SwapFaceChildProps }]>;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		...restProps
	}: SwapOnProps = $props();

	const state = getSwapContext("`<SwapOn>`");

	const faceAttrs: SwapFaceChildProps = $derived({
		"data-slot": "swap-on",
		"data-state": state.dataState,
		...restProps,
		class: cn(
			!state.reducedMotion && "transition-all duration-300",
			"data-[state=off]:absolute data-[state=off]:opacity-0 data-[state=on]:opacity-100 motion-reduce:transition-none",
			"[*[data-animation=rotate]_&]:data-[state=off]:rotate-180 [*[data-animation=rotate]_&]:data-[state=on]:rotate-0 motion-reduce:[*[data-animation=rotate]_&]:data-[state=off]:rotate-0",
			"[*[data-animation=flip]_&]:data-[state=off]:transform-[rotateY(180deg)] [*[data-animation=flip]_&]:data-[state=on]:transform-[rotateY(0deg)] motion-reduce:[*[data-animation=flip]_&]:data-[state=off]:transform-[rotateY(0deg)]",
			"[*[data-animation=scale]_&]:data-[state=off]:scale-0 [*[data-animation=scale]_&]:data-[state=on]:scale-100 motion-reduce:[*[data-animation=scale]_&]:data-[state=off]:scale-100",
			className,
		),
	});
</script>

{#if child}
	{@render child({ props: faceAttrs })}
{:else}
	<div bind:this={ref} {...faceAttrs}>
		{@render children?.()}
	</div>
{/if}
