<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { tv } from "tailwind-variants";

	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import type { ScrollSpyOrientation } from "./scroll-spy.svelte.js";

	/**
	 * Upstream deliberately inverts the nav axis relative to the root (line 349-352): a horizontal root
	 * puts the nav beside the content, so the links themselves stack vertically. Kept verbatim, keyed
	 * on the *root's* orientation rather than the nav's own.
	 */
	export const scrollSpyNavVariants = tv({
		base: "flex gap-2",
		variants: {
			orientation: {
				horizontal: "flex-col",
				vertical: "flex-row",
			},
		},
		defaultVariants: {
			orientation: "horizontal",
		},
	});

	/** The merged attribute payload handed to the `child` snippet. */
	export type ScrollSpyNavChildProps = {
		"data-slot": "scroll-spy-nav";
		"data-orientation": ScrollSpyOrientation;
		dir: Direction;
		class: string;
	} & Record<string, unknown>;

	export type ScrollSpyNavProps = Omit<
		WithElementRef<HTMLAttributes<HTMLElement>, HTMLElement>,
		"dir"
	> & {
		/**
		 * Render the navigation onto your own element instead of the default `<nav>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: ScrollSpyNavChildProps }]>;
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
	}: ScrollSpyNavProps = $props();

	const state = getScrollSpyContext("Nav");

	const navAttrs = $derived({
		"data-slot": "scroll-spy-nav",
		"data-orientation": state.orientation,
		dir: state.dir,
		...restProps,
		class: cn(scrollSpyNavVariants({ orientation: state.orientation }), className),
	} as ScrollSpyNavChildProps);
</script>

{#if child}
	{@render child({ props: navAttrs })}
{:else}
	<nav bind:this={ref} {...navAttrs}>
		{@render children?.()}
	</nav>
{/if}
