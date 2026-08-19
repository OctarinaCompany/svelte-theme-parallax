<script lang="ts" module>
	import type { HTMLAttributes } from "svelte/elements";

	import { cn, type WithElementRef } from "$lib/utils.js";

	export type ComboboxLabelProps = WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
</script>

<script lang="ts">
	import { getComboboxGroupContext } from "./combobox.svelte.js";

	/**
	 * The heading a `<Combobox.Group>` names itself with — its `aria-labelledby` target. Upstream
	 * calls this part `ComboboxLabel` even though it labels the group, not the combobox, and
	 * the theme keeps the name.
	 */

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ComboboxLabelProps = $props();

	const group = getComboboxGroupContext("<Combobox.Label>");
</script>

<div
	bind:this={ref}
	id={group.labelId}
	data-slot="combobox-label"
	{...restProps}
	class={cn("px-1.5 py-1 text-xs font-medium text-muted-foreground", className)}
>
	{@render children?.()}
</div>
