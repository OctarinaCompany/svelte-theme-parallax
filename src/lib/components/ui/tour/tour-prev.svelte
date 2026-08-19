<script lang="ts" module>
	import type { ButtonSize, ButtonVariant } from "$lib/components/ui/button/index.js";
	import type { WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type TourPrevChildProps = {
		type: "button";
		"aria-label": string;
		"data-slot": "tour-prev";
		disabled: boolean;
		class: string;
	} & Record<string, unknown>;

	export type TourPrevProps = WithElementRef<HTMLButtonAttributes, HTMLButtonElement> & {
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
		child?: Snippet<[{ props: TourPrevChildProps }]>;
	};
</script>

<script lang="ts">
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";

	import { getTourContext } from "./tour.svelte.js";

	let {
		ref = $bindable(null),
		variant = "outline",
		size = "default",
		disabled,
		onclick: onclickProp,
		class: className,
		children,
		child,
		...restProps
	}: TourPrevProps = $props();

	const root = getTourContext("<Tour.Prev>");

	// Upstream `disabled={value === 0}` — the first step has nothing to go back to.
	const isDisabled = $derived(disabled === true || !root.canGoPrev);

	function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onclickProp?.(event);
		if (event.defaultPrevented || isDisabled) return;

		root.goPrev();
	}

	// `buttonVariants()` rather than `<Button>`: the shared component renders `children` only and has
	// no `child` snippet, and the spec's scope boundary forbids changing it.
	const prevAttrs = $derived({
		type: "button",
		"aria-label": "Previous step",
		"data-slot": "tour-prev",
		disabled: isDisabled,
		...restProps,
		class: cn(buttonVariants({ variant, size }), className),
		onclick,
	} as TourPrevChildProps);
</script>

{#if child}
	{@render child({ props: prevAttrs })}
{:else}
	<button bind:this={ref} {...prevAttrs}>
		{#if children}
			{@render children()}
		{:else}
			<ChevronLeftIcon />
			Previous
		{/if}
	</button>
{/if}
