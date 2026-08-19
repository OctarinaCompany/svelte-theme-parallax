<script lang="ts" module>
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type TagsInputClearChildProps = {
		type: "button";
		"data-slot": "tags-input-clear";
		"data-state": "visible" | "invisible";
		"data-disabled": "" | undefined;
		class: string;
	} & Record<string, unknown>;

	export type TagsInputClearProps = WithElementRef<
		Omit<HTMLButtonAttributes, "type">,
		HTMLButtonElement
	> & {
		/**
		 * Whether the clear button should always be rendered.
		 *
		 * Can be used to animate the enter and exit of the clear button.
		 *
		 * @default false
		 */
		forceMount?: boolean;
		/**
		 * Render the clear button onto your own element instead of the default `<button>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child` mode
		 * `children` is not rendered and `ref` stays `null` — the caller owns the element.
		 */
		child?: Snippet<[{ props: TagsInputClearChildProps }]>;
		/** The button's content. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { getTagsInputContext } from "./tags-input.svelte.js";

	let {
		ref = $bindable(null),
		forceMount = false,
		onclick: onclickProp,
		class: className,
		child,
		children,
		...restProps
	}: TagsInputClearProps = $props();

	const root = getTagsInputContext("<TagsInput.Clear>");

	function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onclickProp?.(event);
		if (event.defaultPrevented) return;

		root.clear();
	}

	// Upstream wraps the button in a `Presence`, whose only job here is deferring unmount for exit
	// animations; `forceMount` stays the documented escape hatch for that.
	const present = $derived(forceMount || root.count > 0);

	const clearAttrs = $derived({
		type: "button",
		"aria-disabled": root.disabled,
		"data-slot": "tags-input-clear",
		"data-state": root.count > 0 ? "visible" : "invisible",
		"data-disabled": root.disabled ? "" : undefined,
		...restProps,
		// Upstream's editable demo renders Clear as an outline `<Button>`, so compose the button
		// primitive's outline anatomy; disabling is conveyed via `data-disabled` (not the `disabled`
		// attribute), so the dimming is keyed off that.
		class: cn(
			buttonVariants({ variant: "outline" }),
			"data-disabled:cursor-not-allowed data-disabled:opacity-50",
			className,
		),
		onclick,
	} as TagsInputClearChildProps);
</script>

{#if present}
	{#if child}
		{@render child({ props: clearAttrs })}
	{:else}
		<button bind:this={ref} {...clearAttrs}>
			{@render children?.()}
		</button>
	{/if}
{/if}
