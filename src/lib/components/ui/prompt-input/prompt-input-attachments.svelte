<script lang="ts" module>
	import type { ComponentProps, Snippet } from "svelte";
	import * as InputGroup from "$lib/components/ui/input-group/index.js";
	import type { PromptInputFile } from "./prompt-input.svelte.js";

	/**
	 * `align` is fixed to `block-start`; `children` is a snippet PER ATTACHMENT rather than the
	 * addon's plain one.
	 */
	export type PromptInputAttachmentsProps = Omit<
		ComponentProps<typeof InputGroup.Addon>,
		"align" | "children"
	> & {
		/**
		 * Rendered once per attachment, in the order they were added. Omit it and each one is drawn
		 * by `PromptInput.Attachment`.
		 */
		children?: Snippet<[PromptInputFile]>;
	};
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";
	import Attachment from "./prompt-input-attachment.svelte";
	import { getPromptInputContext } from "./prompt-input.svelte.js";

	/**
	 * The chip list above the textarea.
	 *
	 * IT RENDERS NOTHING AT ALL WHILE THE LIST IS EMPTY — no element, no padding, no border — so a
	 * composer with no attachments looks exactly as it did before this part was added to it, and a
	 * caller can leave it in the tree unconditionally.
	 *
	 * A `block-start` ADDON, like `PromptInput.Header`, rather than a bare div. The addon is what
	 * puts the group into its column layout (`InputGroup.Root`'s
	 * `has-[>[data-align=block-start]]:flex-col`), gives the row its full width and its padding, and
	 * dims with the group when the composer is disabled. A plain div would sit BESIDE the textarea
	 * in a composer that had no header and no footer to turn the group into a column.
	 *
	 * PUT IT DIRECTLY UNDER `PromptInput.Root`, beside `PromptInput.Body` rather than inside it.
	 * That `has-[>…]` selector reads the group's DOM CHILDREN, and `PromptInput.Body` is a
	 * `display: contents` div — which changes what boxes are generated, not what the selector sees,
	 * the same blind spot `prompt-input.svelte`'s `h-auto!` comment records for `has-[>textarea]`.
	 * Inside the body the chips still land above the textarea (the addon's `order-first` is a flex
	 * property, and `display: contents` does lift them into the group's flex layout), but the group
	 * only becomes a column if some OTHER block addon — the footer, in practice — is a direct child
	 * of it. Directly under the root, this part stands on its own.
	 *
	 * Its own `data-slot` is `prompt-input-attachments`, spread over the addon's the way
	 * `PromptInput.Header` does; `data-align="block-start"` stays, because the group's layout reads it.
	 *
	 * CLICK-TO-FOCUS IS OVERRIDDEN for the reason `prompt-input-footer.svelte` gives in full: the
	 * addon's own handler focuses the group's `<input>` and a composer holds a `<textarea>`. Clicks
	 * on a chip's remove button are left alone.
	 */
	let {
		ref = $bindable(null),
		class: className,
		onclick,
		children,
		...restProps
	}: PromptInputAttachmentsProps = $props();

	const input = getPromptInputContext("`<PromptInput.Attachments>`");
</script>

{#if input.attachments.files.length > 0}
	<InputGroup.Addon
		bind:ref
		align="block-start"
		data-slot="prompt-input-attachments"
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
		{#each input.attachments.files as attachment (attachment.id)}
			{#if children}
				{@render children(attachment)}
			{:else}
				<Attachment {attachment} />
			{/if}
		{/each}
	</InputGroup.Addon>
{/if}
