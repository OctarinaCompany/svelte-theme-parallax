<script lang="ts" module>
	import type { WithElementRef } from "$lib/utils.js";
	import type { HTMLAnchorAttributes } from "svelte/elements";

	/**
	 * The Badge's own attributes. `href` is the one that changes the element: with it the badge
	 * is an `<a>` and the source is a link; without it, a `<span>`.
	 */
	export type ChainOfThoughtSearchResultProps = WithElementRef<HTMLAnchorAttributes>;
</script>

<script lang="ts">
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { cn } from "$lib/utils.js";

	/**
	 * One source: a `secondary` Badge, in regular weight because a row of bold pills reads as a
	 * row of buttons. The Badge already sets the size, padding and the 12px icon; `gap-1` closes
	 * the space between a favicon-sized glyph and a domain.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ChainOfThoughtSearchResultProps = $props();
</script>

<Badge
	bind:ref
	variant="secondary"
	data-slot="chain-of-thought-search-result"
	class={cn("gap-1 text-xs font-normal", className)}
	{...restProps}
>
	{@render children?.()}
</Badge>
