<script lang="ts" module>
	import type { ButtonSize, ButtonVariant } from "$lib/components/ui/button/index.js";
	import type { WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type TourNextChildProps = {
		type: "button";
		/** `"Next step"`, or `"Finish tour"` on the last step, so it always contains the visible label. */
		"aria-label": string;
		"data-slot": "tour-next";
		class: string;
	} & Record<string, unknown>;

	export type TourNextProps = WithElementRef<HTMLButtonAttributes, HTMLButtonElement> & {
		/**
		 * Button style, forwarded to `buttonVariants()`.
		 * @default "default"
		 */
		variant?: ButtonVariant;
		/**
		 * Button size, forwarded to `buttonVariants()`.
		 * @default "default"
		 */
		size?: ButtonSize;
		/**
		 * Render the control onto your own element instead of the default `<button>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: TourNextChildProps; isLastStep: boolean }]>;
	};
</script>

<script lang="ts">
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";

	import { getTourContext } from "./tour.svelte.js";

	let {
		ref = $bindable(null),
		variant = "default",
		size = "default",
		onclick: onclickProp,
		class: className,
		children,
		child,
		...restProps
	}: TourNextProps = $props();

	const root = getTourContext("<Tour.Next>");

	const isLastStep = $derived(root.isLastStep);

	function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onclickProp?.(event);
		if (event.defaultPrevented) return;

		// On the last step this fires `onComplete` once and closes, rather than advancing.
		root.goNext();
	}

	const nextAttrs = $derived({
		type: "button",
		// Upstream hard-codes `"Next step"` even where the visible label reads `Finish`,
		// which fails WCAG 2.5.3 "Label in Name"; the accessible name follows the label here instead.
		"aria-label": isLastStep ? "Finish tour" : "Next step",
		"data-slot": "tour-next",
		...restProps,
		class: cn(buttonVariants({ variant, size }), className),
		onclick,
	} as TourNextChildProps);
</script>

{#if child}
	{@render child({ props: nextAttrs, isLastStep })}
{:else}
	<button bind:this={ref} {...nextAttrs}>
		{#if children}
			{@render children()}
		{:else}
			{isLastStep ? "Finish" : "Next"}
			{#if !isLastStep}
				<ChevronRightIcon />
			{/if}
		{/if}
	</button>
{/if}
