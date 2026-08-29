<script lang="ts" module>
	import type { ComponentProps } from "svelte";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";

	export type PromptInputActionMenuProps = ComponentProps<typeof DropdownMenu.Root>;
</script>

<script lang="ts">
	/**
	 * The "+" menu in the tools row — attach a file, and whatever else a caller adds to it.
	 *
	 * Renders no element of its own: Bits UI's `DropdownMenu.Root` is context only, so there is no
	 * `data-slot` and no `class` here, exactly as `PromptInput.Select` has none. The visible parts
	 * are `PromptInput.ActionMenuTrigger`, `.ActionMenuContent` and `.ActionMenuItem`.
	 *
	 * `open` is bindable and pairs with Bits UI's own `onOpenChange`, which reaches the root through
	 * `restProps` — the pairing `docs/CONVENTIONS.md` §6 asks for, satisfied the way
	 * `prompt-input-select.svelte` satisfies it.
	 */
	let { open = $bindable(false), ...restProps }: PromptInputActionMenuProps = $props();
</script>

<DropdownMenu.Root bind:open {...restProps} />
