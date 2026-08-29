<script lang="ts" module>
	import type { ComponentProps } from "svelte";
	import { Content as HoverCardContent } from "$lib/components/ui/hover-card/index.js";

	/**
	 * `HoverCard.Content`'s props, verbatim: Bits UI's floating-layer props (`side`, `align`,
	 * `sideOffset`, collision handling…) plus `portalProps`.
	 */
	export type ContextUsageContentProps = ComponentProps<typeof HoverCardContent>;
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	/**
	 * The card. `p-0` and `divide-y` because the header, body and footer each carry their own
	 * padding and the footer its own ground, so the rules between them run edge to edge;
	 * `overflow-hidden` clips that ground to the card's radius. It opens above the trigger by
	 * default — the trigger lives in a footer, and a card that opened downward would leave the
	 * viewport.
	 */
	let {
		ref = $bindable(null),
		class: className,
		side = "top",
		children,
		...restProps
	}: ContextUsageContentProps = $props();
</script>

<HoverCardContent
	bind:ref
	{side}
	data-slot="context-usage-content"
	class={cn("min-w-60 divide-y divide-border overflow-hidden p-0", className)}
	{...restProps}
>
	{@render children?.()}
</HoverCardContent>
