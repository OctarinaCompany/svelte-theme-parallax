<script lang="ts" module>
	import type { WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type StepperPrevChildProps = {
		type: "button";
		"data-slot": "stepper-prev";
		disabled: boolean;
	} & Record<string, unknown>;

	export type StepperPrevProps = WithElementRef<HTMLButtonAttributes, HTMLButtonElement> & {
		/**
		 * Render the control onto your own element instead of the default `<button>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`. This is how a styled `Button` is
		 * composed in, exactly as upstream's demos use `asChild`.
		 */
		child?: Snippet<[{ props: StepperPrevChildProps }]>;
	};
</script>

<script lang="ts">
	import { getStepperContext } from "./stepper.svelte.js";

	let {
		ref = $bindable(null),
		disabled,
		onclick: onclickProp,
		child,
		children,
		...restProps
	}: StepperPrevProps = $props();

	const root = getStepperContext("<Stepper.Prev>");

	const isDisabled = $derived(disabled === true || !root.canGoPrev);

	function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onclickProp?.(event);
		if (event.defaultPrevented || isDisabled) return;

		// Backward moves are never gated: upstream writes the value directly here.
		root.goPrev();
	}

	const prevAttrs = $derived({
		type: "button",
		"data-slot": "stepper-prev",
		disabled: isDisabled,
		...restProps,
		onclick,
	} as StepperPrevChildProps);
</script>

{#if child}
	{@render child({ props: prevAttrs })}
{:else}
	<button bind:this={ref} {...prevAttrs}>
		{@render children?.()}
	</button>
{/if}
