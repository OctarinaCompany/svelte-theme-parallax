<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { getSwapContext, type SwapFaceChildProps } from "./swap.svelte.js";

	export type SwapOffProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
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
	}: SwapOffProps = $props();

	const state = getSwapContext("`<SwapOff>`");

	const faceAttrs: SwapFaceChildProps = $derived({
		"data-slot": "swap-off",
		"data-state": state.dataState,
		...restProps,
		class: cn(
			!state.reducedMotion && "transition-all duration-300",
			"data-[state=off]:opacity-100 data-[state=on]:absolute data-[state=on]:opacity-0 motion-reduce:transition-none",
			"[*[data-animation=rotate]_&]:data-[state=off]:rotate-0 [*[data-animation=rotate]_&]:data-[state=on]:rotate-180 motion-reduce:[*[data-animation=rotate]_&]:data-[state=on]:rotate-0",
			"[*[data-animation=flip]_&]:data-[state=off]:transform-[rotateY(0deg)] [*[data-animation=flip]_&]:data-[state=on]:transform-[rotateY(180deg)] motion-reduce:[*[data-animation=flip]_&]:data-[state=on]:transform-[rotateY(0deg)]",
			"[*[data-animation=scale]_&]:data-[state=off]:scale-100 [*[data-animation=scale]_&]:data-[state=on]:scale-0 motion-reduce:[*[data-animation=scale]_&]:data-[state=on]:scale-100",
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
