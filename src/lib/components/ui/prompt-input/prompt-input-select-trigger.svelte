<script lang="ts" module>
	import type { ComponentProps } from "svelte";
	import * as Select from "$lib/components/ui/select/index.js";

	export type PromptInputSelectTriggerProps = ComponentProps<typeof Select.Trigger>;
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	/**
	 * The picker's button, drawn as a ghost: no border, no fill, no shadow, muted ink that turns to
	 * page ink on hover and while the list is open. The same treatment `Button variant="ghost"`
	 * gets, so a select and a tool button in one row read as one row.
	 *
	 * `size="sm"` is the ramp's 32px rung, which the trigger's own classes already render.
	 * `dark:bg-transparent` cancels the trigger's `dark:bg-input/30` field tint — a ghost has no
	 * ground in either mode.
	 *
	 * IT RENDERS ITS CHILDREN AS THE LABEL. Put the selected option's text here; and since an
	 * `aria-label` replaces that text in the accessible name, a label that names the picker should
	 * carry the value too (`aria-label="Model: {label}"`), as `ui/code-block`'s language picker
	 * does. The `data-slot` stays `select-trigger`: `src/app.css` sizes the caret by that name.
	 */
	let {
		ref = $bindable(null),
		class: className,
		size = "sm",
		children,
		...restProps
	}: PromptInputSelectTriggerProps = $props();
</script>

<Select.Trigger
	bind:ref
	{size}
	class={cn(
		"border-none bg-transparent font-medium text-muted-foreground shadow-none transition-colors hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:bg-transparent dark:hover:bg-muted/50",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</Select.Trigger>
