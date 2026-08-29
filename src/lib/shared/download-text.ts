/**
 * Hand the reader a text file — the mechanics behind `CodeBlock.DownloadButton` and
 * `Conversation.Download`.
 *
 * Lives in `src/lib/shared/` because two folders need it and neither owns the other
 * (`docs/CONVENTIONS.md` §2). `ui/qr-code` keeps its own routine: it writes a canvas to a PNG,
 * which shares the anchor trick and nothing else.
 *
 * WHY AN OBJECT URL AND NOT A `data:` URL. A `data:` href is shorter and would avoid the revoke,
 * but a browser may refuse a top-level `data:` navigation and length limits apply; an object URL
 * has neither problem and is what MDN documents for a generated download
 * (https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL_static).
 *
 * WHY THE ANCHOR IS APPENDED rather than clicked while detached: a detached element's `click()` is
 * ignored in some engines, and appending costs one frame nobody sees.
 *
 * SSR-SAFE: it returns without touching anything when there is no document, so a component may
 * call it from a handler that also exists on the server.
 */
export function downloadText(
	filename: string,
	content: string,
	mediaType = "text/plain;charset=utf-8",
): void {
	if (typeof document === "undefined") return;

	const url = URL.createObjectURL(new Blob([content], { type: mediaType }));
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.rel = "noopener";
	document.body.append(anchor);
	anchor.click();
	anchor.remove();
	// Deferred: revoking in the same task can cancel the download before it starts.
	setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * A filename a browser will accept, from a caller's string.
 *
 * Path separators are the point: `download` treats a separator as a directory hint, so a caption
 * like `src/app.css` lands under a name the caller did not choose. The reserved Windows
 * punctuation goes with it, and a string left empty falls back rather than downloading a file
 * called nothing.
 */
export function sanitiseFilename(name: string, fallback = "download.txt"): string {
	const cleaned = name
		.replace(/[/\\]/g, "-")
		.replace(/["*:<>?|]/g, "")
		.trim();
	return cleaned === "" ? fallback : cleaned;
}
