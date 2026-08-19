<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { getGaugeContext, type GaugeState } from "./gauge.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type GaugeValueTextChildProps = {
		id: string;
		"data-slot": "gauge-value-text";
		"data-state": GaugeState;
		style: string;
		class: string;
	} & Record<string, unknown>;

	export type GaugeValueTextProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Render the value text onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: GaugeValueTextChildProps }]>;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		style,
		children,
		child,
		...restProps
	}: GaugeValueTextProps = $props();

	const state = getGaugeContext("GaugeValueText");

	// Registration is synchronous here so the root's `aria-describedby` is correct on first render;
	// de-registration is the teardown of the component's one `$effect`.
	state.registerValueText();
	$effect(() => {
		return () => state.unregisterValueText();
	});

	const valueTextAttrs = $derived({
		id: state.valueTextId,
		"data-slot": "gauge-value-text",
		"data-state": state.state,
		...restProps,
		style: `top: ${state.arcCenterY}px;${style ?? ""}`,
		class: cn(
			"absolute right-0 left-0 flex -translate-y-1/2 items-center justify-center text-2xl font-semibold",
			className,
		),
	} as GaugeValueTextChildProps);
</script>

{#if child}
	{@render child({ props: valueTextAttrs })}
{:else}
	<div bind:this={ref} {...valueTextAttrs}>
		{#if children}
			{@render children()}
		{:else}
			{state.valueText}
		{/if}
	</div>
{/if}
