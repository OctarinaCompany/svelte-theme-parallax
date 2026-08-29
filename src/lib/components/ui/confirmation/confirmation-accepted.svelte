<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type ConfirmationAcceptedProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	import { getConfirmationContext } from "./confirmation.svelte.js";

	/**
	 * The receipt for a `true` answer — an icon and a word, usually.
	 *
	 * Renders only in the `accepted` phase, as a row: an icon and a label are what this part
	 * carries in practice, and stacked in the root's column they would read as two lines. The icon
	 * is sized by the container rule rather than by a class on the icon, the same mechanism
	 * `button.svelte` uses, and only when the caller has not sized it.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ConfirmationAcceptedProps = $props();

	const confirmation = getConfirmationContext("`<Confirmation.Accepted>`");
</script>

{#if confirmation.is("accepted")}
	<div
		bind:this={ref}
		data-slot="confirmation-accepted"
		class={cn(
			"flex items-center gap-2 text-sm [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
			className,
		)}
		{...restProps}
	>
		{@render children?.()}
	</div>
{/if}
