<script lang="ts" module>
	import type { ComponentProps } from "svelte";
	import type { WithoutChildren } from "$lib/utils.js";
	import { Button } from "$lib/components/ui/button/index.js";

	export type CodeBlockDownloadButtonProps = WithoutChildren<ComponentProps<typeof Button>> & {
		/**
		 * Fired after the download has been handed to the browser, with the name it was saved
		 * under — the sanitised name, not the caller's string — and after the root's own
		 * `onDownload`. Never fired for a click the browser refused; `downloadText` is synchronous
		 * and cannot tell.
		 */
		onDownload?: (filename: string) => void;
	};
</script>

<script lang="ts">
	import DownloadIcon from "@lucide/svelte/icons/download";
	import { getCodeBlockContext } from "./code-block.svelte.js";

	/**
	 * The download button. This kit's own — upstream's code block copies and nothing else.
	 *
	 * IT NEVER HIDES ITSELF. Whether a block is downloadable is the root's decision (a `filename`
	 * is set or it is not), and the header is the part that acts on it: `{#if block.filename}`
	 * lives there, next to the same test that chooses a selector over a static tag. A part that
	 * rendered nothing on its own would leave a caller composing a custom header with a button
	 * that silently vanished. Composed by hand without a `filename`, this one still works: it
	 * saves under `block.downloadName`, which is `snippet.<ext>` for the language on screen.
	 *
	 * NO RECEIPT, unlike the copy button. A copy leaves nothing on screen, so the check mark is the
	 * only evidence it happened; a download opens the browser's own save UI, and a second receipt
	 * beside it would be noise. The root's `onDownload` is the hook for a caller who wants one;
	 * this part's own `onDownload` is for a hand-composed header, and fires second.
	 *
	 * WHAT IS SAVED, and how, is `block.download()` — the state owns the mechanics so the root's
	 * hook fires from one place. The content is the snippet verbatim, trailing newline and CRLFs
	 * included, for the reason the clipboard gets it verbatim; the MIME type is the root's
	 * `mediaType`, which defaults per language (`CODE_BLOCK_MEDIA_TYPES`).
	 *
	 * The name reads "Download customers.csv" rather than "Download code" because on a page of
	 * several blocks the filename is the one thing that tells them apart, and a screen reader
	 * gets it nowhere else.
	 */
	let { ref = $bindable(null), onDownload, ...restProps }: CodeBlockDownloadButtonProps = $props();

	const block = getCodeBlockContext("`<CodeBlock.DownloadButton>`");

	function download() {
		onDownload?.(block.download());
	}
</script>

<Button
	bind:ref
	data-slot="code-block-download-button"
	variant="ghost"
	size="icon-sm"
	aria-label="Download {block.downloadName}"
	onclick={download}
	{...restProps}
>
	<DownloadIcon />
</Button>
