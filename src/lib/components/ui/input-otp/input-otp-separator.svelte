<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	export type InputOTPSeparatorProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/**
		 * Replaces the default minus glyph. Upstream hard-codes its icon and silently discards
		 * caller children; a snippet is the Svelte-idiomatic escape
		 * hatch for callers that want a dot or a dash instead.
		 */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import MinusIcon from "@lucide/svelte/icons/minus";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: InputOTPSeparatorProps = $props();
</script>

<!--
	Upstream renders a minus icon between groups (the
	`IconPlaceholder` there is docs tooling resolving to lucide's `MinusIcon`). The svg sizing
	lives on the wrapper, exactly like `.cn-input-otp-separator`
	— so a caller-supplied icon inherits it
	unless it brings its own `size-*`.
-->
<div
	bind:this={ref}
	data-slot="input-otp-separator"
	role="separator"
	class={cn("flex items-center [&_svg:not([class*='size-'])]:size-4", className)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{:else}
		<MinusIcon />
	{/if}
</div>
