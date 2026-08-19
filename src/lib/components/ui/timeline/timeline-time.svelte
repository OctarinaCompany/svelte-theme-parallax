<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLTimeAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type TimelineTimeChildProps = {
		"data-slot": "timeline-time";
		datetime?: string;
		class: string;
	} & Record<string, unknown>;

	export type TimelineTimeProps = WithElementRef<HTMLTimeAttributes, HTMLTimeElement> & {
		/**
		 * Upstream-parity alias for the native `datetime` attribute. A `datetime` value passed
		 * directly (the native spelling `svelte/elements` types) wins over this alias.
		 */
		dateTime?: string;
		/**
		 * Render the time onto your own element instead of the default `<time>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: TimelineTimeChildProps }]>;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		dateTime,
		class: className,
		children,
		child,
		...restProps
	}: TimelineTimeProps = $props();

	const timeAttrs = $derived({
		"data-slot": "timeline-time",
		datetime: dateTime,
		...restProps,
		class: cn("text-xs text-muted-foreground", className),
	} as TimelineTimeChildProps);
</script>

{#if child}
	{@render child({ props: timeAttrs })}
{:else}
	<time bind:this={ref} {...timeAttrs}>
		{@render children?.()}
	</time>
{/if}
