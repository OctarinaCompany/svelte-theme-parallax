<script lang="ts" module>
	import type { ComponentProps } from "svelte";
	import * as InputGroup from "$lib/components/ui/input-group/index.js";

	/** `align` is fixed to `block-start`; everything else reaches the addon. */
	export type PromptInputHeaderProps = Omit<ComponentProps<typeof InputGroup.Addon>, "align">;
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	/**
	 * The row above the textarea — attachment chips, referenced sources, a mode banner. A
	 * `block-start` addon that wraps, so a dozen chips flow onto a second line instead of
	 * stretching the frame.
	 *
	 * Upstream aligns it `block-end` and then `order-first`s it back to the top; the addon has a
	 * `block-start` alignment for exactly this and it is used directly.
	 *
	 * CLICK-TO-FOCUS IS OVERRIDDEN, for the reason `prompt-input-footer.svelte` gives: the addon's
	 * own handler looks for an `<input>` and a composer holds a `<textarea>`. Same handler, same
	 * button escape, and the caller's `onclick` runs first with `preventDefault()` as its veto.
	 */
	let {
		ref = $bindable(null),
		class: className,
		onclick,
		children,
		...restProps
	}: PromptInputHeaderProps = $props();
</script>

<InputGroup.Addon
	bind:ref
	align="block-start"
	data-slot="prompt-input-header"
	class={cn("flex-wrap gap-1", className)}
	{...restProps}
	onclick={(event) => {
		onclick?.(event);
		if (event.defaultPrevented) return;
		if ((event.target as HTMLElement).closest("button,[role=combobox]")) return;
		event.currentTarget.parentElement
			?.querySelector<HTMLElement>('[data-slot="input-group-control"]')
			?.focus();
	}}
>
	{@render children?.()}
</InputGroup.Addon>
