<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type ConfirmationRequestProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	import { getConfirmationContext } from "./confirmation.svelte.js";

	/**
	 * What shows while the question is open — typically an explanation and the `Actions` row.
	 *
	 * Renders only in the `request` phase, and then as a flex column so a nested `Actions` row's
	 * `self-end` still lands it on the right, as it does when the row is a direct child of the
	 * root upstream. Outside that phase the element is not in the DOM at all — not hidden — so a
	 * settled confirmation carries no unreachable buttons.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ConfirmationRequestProps = $props();

	const confirmation = getConfirmationContext("`<Confirmation.Request>`");
</script>

{#if confirmation.is("request")}
	<div
		bind:this={ref}
		data-slot="confirmation-request"
		class={cn("flex flex-col gap-2", className)}
		{...restProps}
	>
		{@render children?.()}
	</div>
{/if}
