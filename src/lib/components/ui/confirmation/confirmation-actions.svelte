<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type ConfirmationActionsProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	import { getConfirmationContext } from "./confirmation.svelte.js";

	/**
	 * The row of answers — Reject and Approve, by convention in that order, so the affirmative
	 * button is the outermost one.
	 *
	 * Renders only in the `request` phase, whether it sits inside `Request` or directly under the
	 * root, which is upstream's own gate (`confirmation.tsx`, `ConfirmationActions`): the row is
	 * the thing that must not survive the answer, and gating it here means a caller who forgets
	 * the `Request` wrapper still gets a settled card with no buttons on it. `self-end` is
	 * upstream's, and it needs a flex-column parent — the root and `Request` both are.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ConfirmationActionsProps = $props();

	const confirmation = getConfirmationContext("`<Confirmation.Actions>`");
</script>

{#if confirmation.is("request")}
	<div
		bind:this={ref}
		data-slot="confirmation-actions"
		class={cn("flex items-center justify-end gap-2 self-end", className)}
		{...restProps}
	>
		{@render children?.()}
	</div>
{/if}
