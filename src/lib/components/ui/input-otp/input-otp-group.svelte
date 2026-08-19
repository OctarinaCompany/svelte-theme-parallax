<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	export type InputOTPGroupProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		children?: Snippet;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: InputOTPGroupProps = $props();
</script>

<!--
	Upstream's structural "flex items-center" plus its stylesheet
	skin re-anchored to this repo's `Input`:
	nova's rounded-lg becomes the house rounded-md and its invalid ring becomes Input's
	ring-3 / ring-destructive/20 pair. The `has-aria-invalid:` guards fire when a caller marks
	the slots invalid, mirroring how nova's `.cn-input-otp-group` reacts.
-->
<div
	bind:this={ref}
	data-slot="input-otp-group"
	class={cn(
		"flex items-center rounded-md has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 dark:has-aria-invalid:ring-destructive/40",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</div>
