<!--
	KNOWN UPSTREAM DEFECT, LEFT IN PLACE ON PURPOSE.

	This part emits `data-slot="field-label"` — the same value `field-label.svelte` emits — and
	`field.svelte` keys a layout rule off it: `[&>[data-slot=field-label]]:flex-auto`. So a
	`FieldTitle` placed directly inside a horizontal `Field` silently inherits the rule written
	for the label, and grows to fill the row.

	It is NOT patched here. This folder is a registry component (`CONVENTIONS.md` §1): it mirrors
	the upstream export surface exactly so that re-running the shadcn-svelte CLI yields a
	reviewable diff, and a silent local fix would turn the next regeneration into a conflict
	nobody remembers the reason for. The duplicated `leading-snug leading-snug` on the class below,
	which also appears in `field-label.svelte`, is the fingerprint confirming the bug is
	upstream's rather than a local typo.

	If it ever needs fixing before upstream does, the change is `data-slot="field-title"` here,
	and the affected demos are the Horizontal and Responsive sections of the Field page.
-->
<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> = $props();
</script>

<div
	bind:this={ref}
	data-slot="field-label"
	class={cn(
		"flex w-fit items-center gap-2 text-sm leading-snug leading-snug font-medium group-data-[disabled=true]/field:opacity-50",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</div>
