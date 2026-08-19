<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { getGaugeContext, type GaugeState } from "./gauge.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type GaugeLabelChildProps = {
		id: string;
		"data-slot": "gauge-label";
		"data-state": GaugeState;
		class: string;
	} & Record<string, unknown>;

	export type GaugeLabelProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Render the label onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: GaugeLabelChildProps }]>;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		...restProps
	}: GaugeLabelProps = $props();

	const state = getGaugeContext("GaugeLabel");

	// Registration is synchronous here so the root's `aria-labelledby` is correct on first render;
	// de-registration is the teardown of the component's one `$effect`.
	state.registerLabel();
	$effect(() => {
		return () => state.unregisterLabel();
	});

	const labelAttrs = $derived({
		id: state.labelId,
		"data-slot": "gauge-label",
		"data-state": state.state,
		...restProps,
		class: cn("mt-2 text-sm font-medium text-muted-foreground", className),
	} as GaugeLabelChildProps);
</script>

{#if child}
	{@render child({ props: labelAttrs })}
{:else}
	<div bind:this={ref} {...labelAttrs}>
		{@render children?.()}
	</div>
{/if}
