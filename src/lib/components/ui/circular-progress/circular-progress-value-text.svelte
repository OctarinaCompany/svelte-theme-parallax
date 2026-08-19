<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { getCircularProgressContext, type ProgressState } from "./circular-progress.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type CircularProgressValueTextChildProps = {
		id: string;
		"data-slot": "circular-progress-value-text";
		"data-state": ProgressState;
		class: string;
	} & Record<string, unknown>;

	export type CircularProgressValueTextProps = WithElementRef<HTMLAttributes<HTMLSpanElement>> & {
		/**
		 * Render the value text onto your own element instead of the default `<span>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: CircularProgressValueTextChildProps }]>;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		...restProps
	}: CircularProgressValueTextProps = $props();

	const state = getCircularProgressContext("CircularProgressValueText");

	// Registered only while this part is really in the document (the `child` element carries the id
	// too), so the root cannot leave `aria-describedby` pointing at an id that is never rendered.
	$effect(() => {
		return state.registerValueText();
	});

	const valueTextAttrs = $derived({
		id: state.valueTextId,
		"data-slot": "circular-progress-value-text",
		"data-state": state.state,
		...restProps,
		class: cn("absolute inset-0 flex items-center justify-center text-sm font-medium", className),
	} as CircularProgressValueTextChildProps);
</script>

{#if child}
	{@render child({ props: valueTextAttrs })}
{:else}
	<span bind:this={ref} {...valueTextAttrs}>
		{#if children}
			{@render children()}
		{:else}
			{state.valueText}
		{/if}
	</span>
{/if}
