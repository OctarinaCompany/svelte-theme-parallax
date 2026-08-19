<script lang="ts" module>
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type JsonViewerKeyProps = WithoutChildren<
		WithElementRef<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>
	> & {
		/** The property name, rendered quoted the way upstream renders it. */
		name: string;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		name,
		...restProps
	}: JsonViewerKeyProps = $props();
</script>

<!--
	A property name and the colon after it. Extracted from upstream's three copies (`:695-699`,
	`:773-776`, `:856-859`) so the purple->`primary-subtle-foreground` mapping is stated once; the
	mapping itself is argued in `json-viewer.svelte.ts`.

	`inline-flex` is load-bearing, not decoration. The two spans sit next to each other with no
	space between them, and a flex container drops whitespace-only anonymous items — so however the
	formatter breaks these lines, no stray space can appear between the name and its colon.
-->
<span
	bind:this={ref}
	data-slot="json-viewer-key"
	class={cn("inline-flex items-center", className)}
	{...restProps}
>
	<span class="font-medium text-primary-subtle-foreground">{`'${name}'`}</span>
	<span class="mr-1 text-muted-foreground">:</span>
</span>
