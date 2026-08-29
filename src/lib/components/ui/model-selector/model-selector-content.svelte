<script lang="ts" module>
	import type { ComponentProps, Snippet } from "svelte";
	import type * as Dialog from "$lib/components/ui/dialog/index.js";
	import type * as Command from "$lib/components/ui/command/index.js";

	export type ModelSelectorContentProps = Omit<
		ComponentProps<typeof Dialog.Content>,
		"children" | "showCloseButton"
	> & {
		/** The parts of the picker — input, list, groups, items. */
		children?: Snippet;
		/**
		 * The dialog's accessible name. Rendered visually hidden: the input row is the visible
		 * heading of a picker, and a second one above it would be a caption on a caption.
		 * @default "Model selector"
		 */
		title?: string;
		/**
		 * The dialog's `X`. Off because in a `p-0` content it sits on the right end of the input
		 * row; Escape and a click outside both close the picker regardless.
		 * @default false
		 */
		showCloseButton?: boolean;
		/**
		 * Props for the command root inside — `filter`, `shouldFilter`, `loop`, `value`,
		 * `onValueChange`, `label`. Upstream renders the command root with no props at all; this
		 * is the escape hatch for the ones a picker actually needs (a custom scorer, a bound
		 * highlight). Not bindable through the spread — pass `value` and `onValueChange` together.
		 */
		commandProps?: Omit<ComponentProps<typeof Command.Root>, "children" | "child">;
	};
</script>

<script lang="ts">
	import * as DialogParts from "$lib/components/ui/dialog/index.js";
	import * as CommandParts from "$lib/components/ui/command/index.js";
	import { cn } from "$lib/utils.js";

	/**
	 * The dialog surface with a command root inside it. Renders the dialog content — the
	 * `data-slot` goes there, replacing the dialog's own, which is why `ModelSelector.Item`
	 * restates the `rounded-lg` the command item otherwise only gets under
	 * `[data-slot=dialog-content]` — then a visually hidden title, then the command root.
	 *
	 * `p-0` because the command root carries its own `p-1` and the input wrapper its own; the
	 * dialog's `p-6` would double-frame the list. `overflow-hidden` clips the list's scroll
	 * corners to the dialog's radius. The command root's `rounded-xl!` matches the dialog's
	 * `rounded-xl`, so no second radius is stated.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		title = "Model selector",
		showCloseButton = false,
		commandProps,
		...restProps
	}: ModelSelectorContentProps = $props();
</script>

<DialogParts.Content
	bind:ref
	data-slot="model-selector-content"
	class={cn("gap-0 overflow-hidden p-0", className)}
	{showCloseButton}
	{...restProps}
>
	<DialogParts.Title class="sr-only">{title}</DialogParts.Title>
	<CommandParts.Root {...commandProps}>
		{@render children?.()}
	</CommandParts.Root>
</DialogParts.Content>
