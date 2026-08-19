<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	export type CheckboxGroupIndicatorProps = WithElementRef<
		HTMLAttributes<HTMLSpanElement>,
		HTMLSpanElement
	> & {
		/**
		 * Whether the indicator should always be rendered, checked or not.
		 *
		 * @default false
		 */
		forceMount?: boolean;
		/**
		 * The glyph.
		 *
		 * @default the `check` icon
		 */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";

	import { getCheckboxGroupItemContext } from "./checkbox-group.svelte.js";

	let {
		ref = $bindable(null),
		forceMount = false,
		class: className,
		children,
		...restProps
	}: CheckboxGroupIndicatorProps = $props();

	const item = getCheckboxGroupItemContext("<CheckboxGroup.Indicator>");
</script>

{#if forceMount || item.checked}
	<span
		bind:this={ref}
		data-slot="checkbox-group-indicator"
		data-state={item.dataState}
		data-disabled={item.disabled ? "" : undefined}
		{...restProps}
		class={cn("flex items-center justify-center text-current", className)}
	>
		{#if children}
			{@render children()}
		{:else}
			<CheckIcon class="size-3.5" />
		{/if}
	</span>
{/if}
