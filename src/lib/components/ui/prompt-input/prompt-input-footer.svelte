<script lang="ts" module>
	import type { ComponentProps } from "svelte";
	import * as InputGroup from "$lib/components/ui/input-group/index.js";

	/** `align` is fixed to `block-end`; everything else reaches the addon. */
	export type PromptInputFooterProps = Omit<ComponentProps<typeof InputGroup.Addon>, "align">;
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	/**
	 * The row below the textarea: `PromptInput.Tools` on the left, `PromptInput.Submit` on the
	 * right. A `block-end` addon — the addon already lays out as `flex items-center` — pushed apart
	 * with `justify-between`, so the two children land on the two edges whatever their widths.
	 *
	 * CLICK-TO-FOCUS IS OVERRIDDEN. The addon shows `cursor-text` and its own click handler focuses
	 * the group's `<input>`; a composer has a `<textarea>` instead, so the registry handler is a
	 * no-op here and a click on the empty footer would promise a caret and give nothing. The
	 * handler below keeps the addon's intent — skip clicks on buttons (and the select triggers,
	 * which are `role="combobox"` buttons) — and focuses the group's control, whatever element it
	 * is. The registry handler it replaces sits below `restProps`, so spreading `onclick` last is
	 * what makes the override take.
	 */
	let {
		ref = $bindable(null),
		class: className,
		onclick,
		children,
		...restProps
	}: PromptInputFooterProps = $props();
</script>

<InputGroup.Addon
	bind:ref
	align="block-end"
	data-slot="prompt-input-footer"
	class={cn("justify-between gap-1", className)}
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
