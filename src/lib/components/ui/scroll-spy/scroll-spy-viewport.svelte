<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import type { ScrollSpyOrientation } from "./scroll-spy.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type ScrollSpyViewportChildProps = {
		"data-slot": "scroll-spy-viewport";
		"data-orientation": ScrollSpyOrientation;
		dir: Direction;
		class: string;
	} & Record<string, unknown>;

	export type ScrollSpyViewportProps = Omit<
		WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
		"dir"
	> & {
		/**
		 * Render the viewport onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null` — and since the demos hand `ref` to
		 * the root's `scrollContainer`, that wiring is the caller's job in `child` mode.
		 */
		child?: Snippet<[{ props: ScrollSpyViewportChildProps }]>;
	};
</script>

<script lang="ts">
	import { getScrollSpyContext } from "./scroll-spy.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		...restProps
	}: ScrollSpyViewportProps = $props();

	const state = getScrollSpyContext("Viewport");

	const viewportAttrs = $derived({
		"data-slot": "scroll-spy-viewport",
		"data-orientation": state.orientation,
		dir: state.dir,
		...restProps,
		class: cn("flex flex-1 flex-col gap-8", className),
	} as ScrollSpyViewportChildProps);
</script>

{#if child}
	{@render child({ props: viewportAttrs })}
{:else}
	<div bind:this={ref} {...viewportAttrs}>
		{@render children?.()}
	</div>
{/if}
