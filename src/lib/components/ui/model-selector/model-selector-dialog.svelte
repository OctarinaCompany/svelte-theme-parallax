<script lang="ts" module>
	import type { ComponentProps } from "svelte";
	import type * as Command from "$lib/components/ui/command/index.js";

	/**
	 * The house `Command.Dialog`'s props — the dialog root's and the command root's, plus
	 * `title`, `description`, `showCloseButton`, `portalProps` and `class`.
	 */
	export type ModelSelectorDialogProps = ComponentProps<typeof Command.Dialog>;
</script>

<script lang="ts">
	import * as CommandParts from "$lib/components/ui/command/index.js";
	import { ModelSelectorState, setModelSelectorContext } from "./model-selector.svelte.js";

	/**
	 * The one-shot form: root, content and command root in a single part, for a picker opened
	 * from code (a shortcut, a toolbar button that is not a `Trigger`) rather than from a trigger
	 * inside the tree. Upstream's `ModelSelectorDialog` is `CommandDialog` unchanged; this one
	 * also publishes a {@link ModelSelectorState}, so `ModelSelector.Item`'s `closeOnSelect`
	 * works here exactly as it does under `ModelSelector.Root`.
	 *
	 * The house `Command.Dialog` pins its content at `top-1/3` — the command-palette convention.
	 * Nothing here undoes that: a picker opened by a shortcut IS a palette.
	 *
	 * WHERE `data-slot="model-selector-dialog"` LANDS. `command-dialog.svelte` spreads its rest
	 * props twice: into `Dialog.Root`, a context provider that renders nothing and drops unknown
	 * attributes, and into the `<Command>` root, which stamps `data-slot="command"` BEFORE its
	 * own spread. The slot therefore lands on the command root — the element wrapping the input
	 * and the list — and replaces `command`, not on the dialog content, which keeps
	 * `dialog-content`. Nothing in this repo selects `[data-slot=command]`, so the replacement
	 * costs nothing; `command-item.svelte`'s `in-data-[slot=dialog-content]` rounding still
	 * applies because the content's slot is untouched.
	 */
	let {
		open = $bindable(false),
		onOpenChange,
		ref = $bindable(null),
		value = $bindable(""),
		title = "Model selector",
		description = "Type to filter the list, then pick a model.",
		...restProps
	}: ModelSelectorDialogProps = $props();

	const state = new ModelSelectorState({
		getOpen: () => open,
		setOpen: (next) => {
			open = next;
			onOpenChange?.(next);
		},
	});

	setModelSelectorContext(state);
</script>

<CommandParts.Dialog
	bind:open={() => state.open, (next) => state.setOpen(next)}
	bind:ref
	bind:value
	{title}
	{description}
	data-slot="model-selector-dialog"
	{...restProps}
/>
