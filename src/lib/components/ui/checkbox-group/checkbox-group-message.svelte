<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	export type CheckboxGroupMessageProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/**
		 * Whether the message should be announced by screen readers immediately upon rendering.
		 *
		 * @default false
		 */
		announce?: boolean;
		/** Fallback content, rendered when `onValidate` supplied no message of its own. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { getCheckboxGroupContext } from "./checkbox-group.svelte.js";

	let {
		ref = $bindable(null),
		announce = false,
		class: className,
		children,
		...restProps
	}: CheckboxGroupMessageProps = $props();

	const state = getCheckboxGroupContext("<CheckboxGroup.Message>");

	// Upstream renders the region for every invalid group, even with nothing to say; an empty node
	// that `aria-describedby` points at is exactly the dangling reference to avoid, so the region
	// needs both an error state and something to put in it.
	const visible = $derived(
		state.isInvalid && (state.messageContent !== undefined || children !== undefined),
	);

	$effect(() => {
		if (!visible) return;
		return state.registerMessage();
	});
</script>

{#if visible}
	<div
		bind:this={ref}
		data-slot="checkbox-group-message"
		id={state.messageId}
		aria-live={announce ? "polite" : "off"}
		data-disabled={state.disabled ? "" : undefined}
		data-invalid={state.isInvalid ? "" : undefined}
		{...restProps}
		class={cn(
			"text-[0.8rem] leading-none text-muted-foreground data-invalid:text-destructive",
			className,
		)}
	>
		{#if state.messageContent !== undefined}
			{state.messageContent}
		{:else}
			{@render children?.()}
		{/if}
	</div>
{/if}
