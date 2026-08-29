<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type ConfirmationRejectedProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	import { getConfirmationContext } from "./confirmation.svelte.js";

	/**
	 * The receipt for a `false` answer — an icon and a word, and the reason when there is one.
	 *
	 * Renders only in the `rejected` phase, as a row, for the reason `confirmation-accepted.svelte`
	 * gives. The two are separate parts rather than one `Answer` part with a prop because a caller
	 * authors them as two different sentences, and upstream's API is the two.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ConfirmationRejectedProps = $props();

	const confirmation = getConfirmationContext("`<Confirmation.Rejected>`");
</script>

{#if confirmation.is("rejected")}
	<div
		bind:this={ref}
		data-slot="confirmation-rejected"
		class={cn(
			"flex items-center gap-2 text-sm [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
			className,
		)}
		{...restProps}
	>
		{@render children?.()}
	</div>
{/if}
