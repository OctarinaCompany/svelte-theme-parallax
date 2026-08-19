<script lang="ts" module>
	import type { HTMLAttributes } from "svelte/elements";

	import { cn, type WithElementRef } from "$lib/utils.js";

	export type ComboboxEmptyProps = WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
</script>

<script lang="ts">
	import { getComboboxContext } from "./combobox.svelte.js";

	/**
	 * What the popup says when the filter kept nothing.
	 *
	 * It renders only in that case, so it can sit beside `<Combobox.List>` unconditionally — the
	 * caller never has to duplicate the "are there matches?" test the root has already made. The
	 * question is asked of the *rows*, not the top-level entries: in grouped data an entry is a
	 * group object, and a list of empty groups is still empty.
	 */

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ComboboxEmptyProps = $props();

	const root = getComboboxContext("<Combobox.Empty>");
</script>

{#if !root.hasMatches}
	<div
		bind:this={ref}
		data-slot="combobox-empty"
		{...restProps}
		class={cn("px-2 py-1.5 text-center text-sm text-muted-foreground", className)}
	>
		{@render children?.()}
	</div>
{/if}
