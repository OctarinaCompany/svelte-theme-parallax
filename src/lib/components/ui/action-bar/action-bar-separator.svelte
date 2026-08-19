<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { ActionBarOrientation } from "./action-bar.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type ActionBarSeparatorChildProps = {
		role: "separator";
		"aria-orientation": ActionBarOrientation;
		"aria-hidden": "true";
		"data-slot": "action-bar-separator";
		class: string;
	} & Record<string, unknown>;

	export type ActionBarSeparatorProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/**
		 * Which way the divider runs. Defaults to the action bar's own orientation.
		 *
		 * @default the root's `orientation`
		 */
		orientation?: ActionBarOrientation;
		/**
		 * Render the separator onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null` — the caller owns the element.
		 */
		child?: Snippet<[{ props: ActionBarSeparatorChildProps }]>;
	};
</script>

<script lang="ts">
	import { actionBarSeparatorVariants, getActionBarContext } from "./action-bar.svelte.js";

	let {
		ref = $bindable(null),
		orientation: orientationProp,
		class: className,
		child,
		children,
		...restProps
	}: ActionBarSeparatorProps = $props();

	const root = getActionBarContext("<ActionBar.Separator>");

	const orientation = $derived(orientationProp ?? root.orientation);

	// `role="separator"` paired with `aria-hidden="true"` is upstream's deliberate combination
	//: a decorative divider that is still selectable for styling.
	const separatorAttrs = $derived({
		role: "separator",
		"aria-orientation": orientation,
		"aria-hidden": "true",
		"data-slot": "action-bar-separator",
		...restProps,
		class: cn(actionBarSeparatorVariants({ orientation }), className),
	} as ActionBarSeparatorChildProps);
</script>

{#if child}
	{@render child({ props: separatorAttrs })}
{:else}
	<div bind:this={ref} {...separatorAttrs}>
		{@render children?.()}
	</div>
{/if}
