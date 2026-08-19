<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type ActionBarCloseChildProps = {
		type: "button";
		"data-slot": "action-bar-close";
		class: string;
	} & Record<string, unknown>;

	export type ActionBarCloseProps = WithElementRef<HTMLButtonAttributes, HTMLButtonElement> & {
		/**
		 * Render the close control onto your own element instead of the default `<button>`. The
		 * snippet receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null` — the caller owns the element.
		 */
		child?: Snippet<[{ props: ActionBarCloseChildProps }]>;
	};
</script>

<script lang="ts">
	import { getActionBarContext } from "./action-bar.svelte.js";

	let {
		ref = $bindable(null),
		onclick: onclickProp,
		class: className,
		child,
		children,
		...restProps
	}: ActionBarCloseProps = $props();

	const root = getActionBarContext("<ActionBar.Close>");

	function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onclickProp?.(event);
		if (event.defaultPrevented) return;

		root.setOpen(false);
	}

	// Deliberately **not** registered with the group's roving focus: the close button keeps its own
	// independent tab stop (upstream 593-626).
	const closeAttrs = $derived({
		type: "button",
		"data-slot": "action-bar-close",
		...restProps,
		class: cn(
			"rounded-xs opacity-70 outline-none hover:opacity-100 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
			className,
		),
		onclick,
	} as ActionBarCloseChildProps);
</script>

{#if child}
	{@render child({ props: closeAttrs })}
{:else}
	<button bind:this={ref} {...closeAttrs}>
		{@render children?.()}
	</button>
{/if}
