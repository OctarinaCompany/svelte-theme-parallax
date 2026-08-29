<script lang="ts" module>
	import type { ComponentProps } from "svelte";
	import type * as Command from "$lib/components/ui/command/index.js";

	export type ModelSelectorItemProps = ComponentProps<typeof Command.Item> & {
		/**
		 * Whether a pick closes the picker. Runs AFTER `onSelect`, and only when the item sits
		 * under a `ModelSelector.Root` or `ModelSelector.Dialog`; an item rendered under a bare
		 * `Command.Root` has nothing to close and this is ignored. A disabled item never
		 * selects, so it never closes either.
		 * @default true
		 */
		closeOnSelect?: boolean;
	};
</script>

<script lang="ts">
	import * as CommandParts from "$lib/components/ui/command/index.js";
	import { cn } from "$lib/utils.js";
	import {
		getModelSelectorContext,
		hasModelSelectorContext,
		type ModelSelectorState,
	} from "./model-selector.svelte.js";

	/**
	 * One model. A command item — filtered by `value` (or its text), highlighted by the arrow
	 * keys, picked by Enter or a click — that closes the picker afterwards.
	 *
	 * `rounded-lg` is restated because the command item only rounds itself that far under
	 * `[data-slot=dialog-content]`, and `ModelSelector.Content` replaces that slot name with its
	 * own. `gap-2` is the command item's own value, restated so a caller reading this file sees
	 * the layout the logo, name and description rely on.
	 *
	 * Stamp `data-checked={selected}` to show the command item's built-in check mark on the
	 * current model — the same indicator `command-item.svelte` paints for a checked entry.
	 *
	 * THE DISABLED LOOK IS RESTATED HERE ON PURPOSE. `command-item.svelte` dims a disabled row
	 * through `data-[disabled=true]:...`, but bits-ui never writes that value: the command item
	 * stamps `data-disabled=""` when disabled and drops the attribute otherwise (the same
	 * present-or-absent shape as `data-selected`), so the house selector never matches and a
	 * disabled model row would render at full opacity, told apart from its neighbours by nothing
	 * but its text. The bare-attribute variants below match what the primitive emits — the same
	 * idiom `autocomplete-item.svelte` uses. The click is already swallowed by the primitive;
	 * `pointer-events-none` only stops the hover highlight from landing on a row that cannot
	 * be picked.
	 */
	let {
		ref = $bindable(null),
		class: className,
		onSelect,
		closeOnSelect = true,
		...restProps
	}: ModelSelectorItemProps = $props();

	// Resolved once at init: context is an init-time API. Optional on purpose — the item must
	// still work under a bare `Command.Root`, where upstream's does.
	const selector: ModelSelectorState | undefined = hasModelSelectorContext()
		? getModelSelectorContext("`<ModelSelector.Item>`")
		: undefined;

	function handleSelect(): void {
		onSelect?.();
		if (closeOnSelect) selector?.close();
	}
</script>

<CommandParts.Item
	bind:ref
	data-slot="model-selector-item"
	class={cn(
		"gap-2 rounded-lg data-disabled:pointer-events-none data-disabled:opacity-50",
		className,
	)}
	onSelect={handleSelect}
	{...restProps}
/>
