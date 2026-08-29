<script lang="ts" module>
	import type { ButtonProps } from "$lib/components/ui/button/index.js";
	import type { ConversationMessage } from "./conversation.svelte.js";

	/**
	 * `href` is omitted: the part is a command, never a link. `onclick` is kept, unlike upstream's
	 * `Omit<…, "onClick">` — a caller's handler runs first and may cancel the download.
	 */
	export type ConversationDownloadProps = Omit<ButtonProps, "href"> & {
		/** The transcript to export. Only the `text` parts of each message are written. */
		messages: readonly ConversationMessage[];
		/**
		 * The name the browser saves under. Path separators and reserved punctuation are stripped;
		 * a name left empty falls back to the default.
		 * @default "conversation.md"
		 */
		filename?: string;
		/**
		 * Per-message rendering. Replaces the default `## Role` heading plus text entirely; the
		 * blank line between messages is still written.
		 */
		formatMessage?: (message: ConversationMessage, index: number) => string;
	};
</script>

<script lang="ts">
	import type { MouseEventHandler } from "svelte/elements";
	import { Button } from "$lib/components/ui/button/index.js";
	import { downloadText, sanitiseFilename } from "$lib/shared/download-text.js";
	import DownloadIcon from "@lucide/svelte/icons/download";
	import { messagesToMarkdown } from "./conversation.svelte.js";

	/**
	 * Save the transcript as a Markdown file.
	 *
	 * A toolbar control the caller places, not a corner overlay (divergence 5 in
	 * `conversation.svelte`), at `icon-sm` — the size the kit's other toolbar icons take. The
	 * file itself comes from `messagesToMarkdown` and the anchor trick from
	 * `src/lib/shared/download-text.ts`, which `ui/code-block`'s download button shares.
	 *
	 * Standalone on purpose: it reads no context, because the messages come from the caller and
	 * a transcript's export button usually lives in a header outside the scrolling root.
	 *
	 * THE DEFAULT `aria-label` ONLY APPLIES TO THE ICON FORM. `children` replaces the icon, and a
	 * button whose visible text is "Download transcript" must not carry the accessible name
	 * "Download conversation" — a speech-input user says the text they see, and WCAG 2.5.3 (Label
	 * in Name) requires the name to contain it. With `children` the name comes from the content,
	 * or from an `aria-label` the caller passes through `restProps`.
	 */
	let {
		ref = $bindable(null),
		messages,
		filename = "conversation.md",
		formatMessage,
		variant = "outline",
		size = "icon-sm",
		onclick: onclickProp,
		children,
		...restProps
	}: ConversationDownloadProps = $props();

	const onclick: MouseEventHandler<HTMLElement> = (event) => {
		onclickProp?.(event as MouseEvent & { currentTarget: EventTarget & HTMLButtonElement });
		if (event.defaultPrevented) return;
		downloadText(
			sanitiseFilename(filename, "conversation.md"),
			messagesToMarkdown(messages, formatMessage),
			"text/markdown;charset=utf-8",
		);
	};
</script>

<Button
	bind:ref
	data-slot="conversation-download"
	{variant}
	{size}
	aria-label={children ? undefined : "Download conversation"}
	{onclick}
	{...restProps}
>
	{#if children}
		{@render children()}
	{:else}
		<DownloadIcon />
	{/if}
</Button>
