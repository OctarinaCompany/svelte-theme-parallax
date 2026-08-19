<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type SpeedDialLabelChildProps = {
		id: string;
		"data-slot": "speed-dial-label";
		class: string;
	} & Record<string, unknown>;

	export type SpeedDialLabelProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Render the label onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child` mode
		 * `children` is not rendered and `ref` stays `null` — the caller owns the element.
		 */
		child?: Snippet<[{ props: SpeedDialLabelChildProps }]>;
	};
</script>

<script lang="ts">
	import { getSpeedDialItemContext } from "./speed-dial.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		child,
		children,
		...restProps
	}: SpeedDialLabelProps = $props();

	const item = getSpeedDialItemContext("<SpeedDial.Label>");

	// `class="sr-only"` is the documented way to keep the accessible name without the visual chip;
	// either way the sibling action is named by this element through `aria-labelledby`.
	const labelAttrs = $derived({
		id: item.labelId,
		"data-slot": "speed-dial-label",
		...restProps,
		class: cn(
			"pointer-events-none rounded-md bg-popover px-2 py-1 text-sm whitespace-nowrap text-popover-foreground shadow-md ring-1 ring-foreground/10",
			className,
		),
	} as SpeedDialLabelChildProps);
</script>

{#if child}
	{@render child({ props: labelAttrs })}
{:else}
	<div bind:this={ref} {...labelAttrs}>
		{@render children?.()}
	</div>
{/if}
