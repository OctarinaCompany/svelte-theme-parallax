<script lang="ts" module>
	import type { WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type StepperNextChildProps = {
		type: "button";
		"data-slot": "stepper-next";
		disabled: boolean;
	} & Record<string, unknown>;

	export type StepperNextProps = WithElementRef<HTMLButtonAttributes, HTMLButtonElement> & {
		/**
		 * Render the control onto your own element instead of the default `<button>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`. This is how a styled `Button` is
		 * composed in, exactly as upstream's demos use `asChild`.
		 */
		child?: Snippet<[{ props: StepperNextChildProps }]>;
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
	}: StepperNextProps = $props();

	const root = getStepperContext("<Stepper.Next>");

	const isDisabled = $derived(disabled === true || !root.canGoNext);

	async function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onclickProp?.(event);
		if (event.defaultPrevented || isDisabled) return;

		// Forward moves are gated: upstream routes this through `onValidate`.
		await root.goNext();
	}

	const nextAttrs = $derived({
		type: "button",
		"data-slot": "stepper-next",
		disabled: isDisabled,
		...restProps,
		onclick,
	} as StepperNextChildProps);
</script>

{#if child}
	{@render child({ props: nextAttrs })}
{:else}
	<button bind:this={ref} {...nextAttrs}>
		{@render children?.()}
	</button>
{/if}
