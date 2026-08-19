<script lang="ts" module>
	import { cn } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { SVGAttributes } from "svelte/elements";
	import { getCircularProgressContext } from "./circular-progress.svelte.js";

	/**
	 * `WithElementRef<T, U extends HTMLElement>` cannot express an `SVGSVGElement`, so the ref is
	 * declared locally.
	 */
	export type CircularProgressIndicatorProps = SVGAttributes<SVGSVGElement> & {
		ref?: SVGSVGElement | null;
		children?: Snippet;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: CircularProgressIndicatorProps = $props();

	const state = getCircularProgressContext("CircularProgressIndicator");
</script>

<svg
	bind:this={ref}
	aria-hidden="true"
	focusable="false"
	width={state.size}
	height={state.size}
	viewBox="0 0 {state.size} {state.size}"
	data-slot="circular-progress-indicator"
	data-state={state.state}
	data-value={state.value ?? undefined}
	data-min={state.min}
	data-max={state.max}
	data-percentage={state.percentage ?? undefined}
	{...restProps}
	class={cn("-rotate-90 transform", className)}
>
	{@render children?.()}
</svg>
