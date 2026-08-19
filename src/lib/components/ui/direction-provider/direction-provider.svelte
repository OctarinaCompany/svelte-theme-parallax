<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import {
		DirectionProviderState,
		setDirectionContext,
		type Direction,
	} from "./direction-provider.svelte.js";

	/**
	 * Upstream is a bare React context provider and renders no DOM at all; consumers must call
	 * `useDirection()` and forward `dir` themselves. We render a `display: contents` wrapper instead,
	 * so the real `dir` attribute reaches the subtree and descendants flip without opting in.
	 *
	 * The cost of that choice: `contents` suppresses the element's own box, so passing layout classes
	 * through `class` silently discards borders, padding and background. Style a child element, not
	 * the provider.
	 */
	export type DirectionProviderProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, "dir">,
		HTMLDivElement
	> & {
		/**
		 * The direction of the text.
		 * @default "ltr"
		 */
		dir?: Direction;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		dir = "ltr",
		class: className,
		children,
		...restProps
	}: DirectionProviderProps = $props();

	setDirectionContext(new DirectionProviderState({ getDir: () => dir }));
</script>

<div
	bind:this={ref}
	data-slot="direction-provider"
	data-dir={dir}
	{dir}
	class={cn("contents", className)}
	{...restProps}
>
	{@render children?.()}
</div>
