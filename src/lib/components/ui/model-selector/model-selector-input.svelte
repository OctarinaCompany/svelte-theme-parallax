<script lang="ts" module>
	import type { ComponentProps } from "svelte";
	import type * as Command from "$lib/components/ui/command/index.js";

	/** The command input's props — `value`, `placeholder`, and every `<input>` attribute. */
	export type ModelSelectorInputProps = ComponentProps<typeof Command.Input>;
</script>

<script lang="ts">
	import * as CommandParts from "$lib/components/ui/command/index.js";
	import { cn } from "$lib/utils.js";

	/**
	 * The search field. The house `Command.Input` unchanged: a 32px `InputGroup` with a search
	 * addon, sized by the control ramp (`docs/CONVENTIONS.md` §3).
	 *
	 * Upstream adds `h-auto py-3.5` here. That targets shadcn's bare command input, which has no
	 * chrome of its own and grows with its padding; the house field is a group pinned to `h-8!`
	 * and a 48px control inside it would overflow into the first result. The class is left out
	 * on purpose — see divergence 2 in `model-selector.svelte`. `class` still reaches the
	 * `<input>` for anything else.
	 */
	let {
		ref = $bindable(null),
		value = $bindable(""),
		class: className,
		placeholder = "Search models…",
		...restProps
	}: ModelSelectorInputProps = $props();
</script>

<CommandParts.Input
	bind:ref
	bind:value
	data-slot="model-selector-input"
	class={cn(className)}
	{placeholder}
	{...restProps}
/>
