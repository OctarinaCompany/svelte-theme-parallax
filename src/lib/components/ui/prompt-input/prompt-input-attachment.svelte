<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import type { PromptInputFile } from "./prompt-input.svelte.js";

	export type PromptInputAttachmentProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/** The attachment to draw. `PromptInput.Attachments` hands each one to this part. */
		attachment: PromptInputFile;
	};
</script>

<script lang="ts">
	import FileIcon from "@lucide/svelte/icons/file";
	import XIcon from "@lucide/svelte/icons/x";
	import { Button } from "$lib/components/ui/button/index.js";
	import { getPromptInputContext } from "./prompt-input.svelte.js";

	/**
	 * One chip: a thumbnail for an image, a file glyph for anything else, the file's name, and the
	 * button that removes it.
	 *
	 * THE THUMBNAIL IS THE OBJECT URL ITSELF. Nothing is read, decoded or copied — the browser
	 * renders the blob straight from the URL `PromptInputAttachmentsState` minted, which is why the
	 * preview costs nothing and why it stops working the instant that URL is revoked. It is
	 * `alt=""` because the filename beside it says the same thing: a name announced twice is noise.
	 *
	 * THE IMAGE TEST IS THE MEDIA TYPE, not the extension — a file the browser could not type
	 * (`mediaType === ""`) gets the glyph, which is the honest answer rather than a broken image.
	 *
	 * The icon is sized by the chip (`[&>svg…]:size-4`), the way `InputGroup.Addon` and
	 * `Button` size theirs, so no icon in here carries a class of its own — `docs/CONVENTIONS.md` §8.
	 */
	let {
		ref = $bindable(null),
		class: className,
		attachment,
		...restProps
	}: PromptInputAttachmentProps = $props();

	const input = getPromptInputContext("`<PromptInput.Attachment>`");

	/** `filename` is optional on the type, mirroring `FileUIPart`; the chip always needs a word. */
	const name = $derived(attachment.filename ?? "Attachment");
	const isImage = $derived(attachment.mediaType.startsWith("image/"));
</script>

<div
	bind:this={ref}
	data-slot="prompt-input-attachment"
	class={cn(
		"flex max-w-full items-center gap-1.5 rounded-md border border-border bg-background py-0.5 ps-1.5 pe-0.5 text-xs text-foreground [&>svg]:text-muted-foreground [&>svg:not([class*='size-'])]:size-4",
		className,
	)}
	{...restProps}
>
	{#if isImage}
		<img src={attachment.url} alt="" class="size-5 shrink-0 rounded-sm object-cover" />
	{:else}
		<FileIcon aria-hidden="true" />
	{/if}
	<span class="max-w-40 truncate">{name}</span>
	<Button
		variant="ghost"
		size="icon-xs"
		aria-label="Remove {name}"
		disabled={input.disabled}
		onclick={() => input.attachments.remove(attachment.id)}
	>
		<XIcon aria-hidden="true" />
	</Button>
</div>
