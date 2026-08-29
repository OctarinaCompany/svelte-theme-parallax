<script lang="ts" module>
	import type { ComponentProps } from "svelte";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";

	export type PromptInputActionMenuItemProps = ComponentProps<typeof DropdownMenu.Item>;
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	/**
	 * One command in the action menu — `DropdownMenu.Item` untouched, keeping its `data-slot` for
	 * the reason `prompt-input-action-menu-content.svelte` gives.
	 *
	 * The item lays its children out with `gap-2` and sizes any icon among them, so an icon here
	 * carries no margin and no size of its own — upstream's `mr-2` would double the gap.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: PromptInputActionMenuItemProps = $props();
</script>

<DropdownMenu.Item bind:ref class={cn(className)} {...restProps}>
	{@render children?.()}
</DropdownMenu.Item>
