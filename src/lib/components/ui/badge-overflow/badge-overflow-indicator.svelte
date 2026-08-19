<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type BadgeOverflowIndicatorChildProps = {
		"data-slot": "badge-overflow-indicator";
		"data-count": string;
		class: string;
	} & Record<string, unknown>;

	export type BadgeOverflowIndicatorProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * The number of hidden items, rendered as `+{count}` when no `children` snippet is given.
		 */
		count: number;
		/**
		 * Render the indicator onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: BadgeOverflowIndicatorChildProps }]>;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		count,
		class: className,
		children,
		child,
		...restProps
	}: BadgeOverflowIndicatorProps = $props();

	// Built once and shared by both branches, so a `child` element is styled and wired exactly like
	// the default `<div>`. `class` can never arrive through `restProps` — it is destructured out —
	// so the computed class always wins, matching upstream's `{...rootProps} className={cn(...)}`.
	const indicatorAttrs = $derived({
		"data-slot": "badge-overflow-indicator",
		"data-count": String(count),
		...restProps,
		class: cn(
			"inline-flex h-5 w-fit shrink-0 items-center justify-center rounded-4xl border border-border px-2 py-0.5 text-xs font-medium whitespace-nowrap text-foreground",
			className,
		),
	} as BadgeOverflowIndicatorChildProps);
</script>

{#if child}
	{@render child({ props: indicatorAttrs })}
{:else}
	<div bind:this={ref} {...indicatorAttrs}>
		{#if children}
			{@render children()}
		{:else}
			+{count}
		{/if}
	</div>
{/if}
