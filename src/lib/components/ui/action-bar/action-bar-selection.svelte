<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type ActionBarSelectionChildProps = {
		"data-slot": "action-bar-selection";
		class: string;
	} & Record<string, unknown>;

	export type ActionBarSelectionProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/**
		 * Render the pill onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null` — the caller owns the element.
		 */
		child?: Snippet<[{ props: ActionBarSelectionChildProps }]>;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		child,
		children,
		...restProps
	}: ActionBarSelectionProps = $props();

	// Purely presentational, and deliberately **not** a context consumer: upstream's
	// `ActionBarSelection` never calls `useActionBarContext`, so it must not
	// throw when rendered outside an `<ActionBar>`.

	const selectionAttrs = $derived({
		"data-slot": "action-bar-selection",
		...restProps,
		class: cn(
			"flex items-center gap-1 rounded-sm border px-2 py-1 text-sm font-medium tabular-nums",
			className,
		),
	} as ActionBarSelectionChildProps);
</script>

{#if child}
	{@render child({ props: selectionAttrs })}
{:else}
	<div bind:this={ref} {...selectionAttrs}>
		{@render children?.()}
	</div>
{/if}
