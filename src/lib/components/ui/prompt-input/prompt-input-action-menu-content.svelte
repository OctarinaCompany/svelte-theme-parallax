<script lang="ts" module>
	import type { ComponentProps } from "svelte";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";

	export type PromptInputActionMenuContentProps = ComponentProps<typeof DropdownMenu.Content>;
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	/**
	 * The menu's panel — `DropdownMenu.Content` untouched, named so a composer reads as one family
	 * of parts. Upstream sets `align="start"`; the registry content already defaults to it, so this
	 * part restates nothing and a caller can still pass another alignment.
	 *
	 * The `data-slot` stays `dropdown-menu-content`: `src/app.css` removes the popover shadow by
	 * that name, and renaming it would silently undo the theme — the same rule the select parts
	 * follow, stated in `prompt-input.svelte` §9.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: PromptInputActionMenuContentProps = $props();
</script>

<DropdownMenu.Content bind:ref class={cn(className)} {...restProps}>
	{@render children?.()}
</DropdownMenu.Content>
