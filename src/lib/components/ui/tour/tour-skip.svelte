<script lang="ts" module>
	import type { ButtonSize, ButtonVariant } from "$lib/components/ui/button/index.js";
	import type { WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type TourSkipChildProps = {
		type: "button";
		"aria-label": string;
		"data-slot": "tour-skip";
		class: string;
	} & Record<string, unknown>;

	export type TourSkipProps = WithElementRef<HTMLButtonAttributes, HTMLButtonElement> & {
		/**
		 * Button style, forwarded to `buttonVariants()`.
		 * @default "outline"
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
		child?: Snippet<[{ props: TourSkipChildProps }]>;
	};
</script>

<script lang="ts">
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";

	import { getTourContext } from "./tour.svelte.js";

	let {
		ref = $bindable(null),
		variant = "outline",
		size = "default",
		onclick: onclickProp,
		class: className,
		children,
		child,
		...restProps
	}: TourSkipProps = $props();

	const root = getTourContext("<Tour.Skip>");

	function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onclickProp?.(event);
		if (event.defaultPrevented) return;

		root.close();
	}

	const skipAttrs = $derived({
		type: "button",
		"aria-label": "Skip tour",
		"data-slot": "tour-skip",
		...restProps,
		class: cn(buttonVariants({ variant, size }), className),
		onclick,
	} as TourSkipChildProps);
</script>

{#if child}
	{@render child({ props: skipAttrs })}
{:else}
	<button bind:this={ref} {...skipAttrs}>
		{#if children}
			{@render children()}
		{:else}
			Skip
		{/if}
	</button>
{/if}
