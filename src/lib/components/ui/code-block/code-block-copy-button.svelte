<script lang="ts" module>
	import type { ComponentProps } from "svelte";
	import type { WithoutChildren } from "$lib/utils.js";
	import { Button } from "$lib/components/ui/button/index.js";

	export type CodeBlockCopyButtonProps = WithoutChildren<ComponentProps<typeof Button>>;

	/**
	 * How long the button shows its receipt before returning to the copy glyph. Upstream's own
	 * 1400ms.
	 */
	export const CODE_BLOCK_COPY_RECEIPT_MS = 1400;
</script>

<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import CopyIcon from "@lucide/svelte/icons/copy";
	import { getCodeBlockContext } from "./code-block.svelte.js";

	/**
	 * The copy button, and the receipt on it.
	 *
	 * A cross-fade via `t-icon-swap` / `t-icon` classes would need CSS the
	 * registry item does not ship, so in an installed
	 * copy those two classes would name nothing and both icons would render at once. An `{#if}` is what
	 * `ui/json-viewer`'s toolbar does and what this does.
	 *
	 * THREE THINGS UPSTREAM'S HANDLER GETS WRONG, all of them answered here:
	 *
	 * IT CATCHES NOTHING. Upstream awaits `writeText` — the receipt is not premature — but nothing
	 * consumes the rejection, so on an insecure origin, where
	 * `navigator.clipboard` is undefined, the call throws into an unhandled rejection and the
	 * button just looks broken. Here the failure is swallowed and the receipt never appears: a
	 * check mark for a copy that did not happen would be a lie.
	 *
	 * IT RE-ARMS WITHOUT CLEARING. Upstream schedules a second timer on the second click while the
	 * first is still pending, so the first click's timer fires almost immediately after the second
	 * click and the receipt blinks out early. The timer here is cleared before it is re-armed, so
	 * hammering the button holds the receipt steady 1400ms from the LAST click.
	 *
	 * IT NEVER DROPS THE RECEIPT. The check mark is a statement about what is on the clipboard, and
	 * changing the code makes it false; upstream leaves it up. The effect below watches
	 * `activeCode` rather than `activeLanguage` because the code is the thing that was copied — a
	 * caller who swaps `code` without touching the language changes it too.
	 *
	 * ONE HAZARD OF ITS OWN, from being async: a dismissal that lands while `writeText` is still
	 * pending would otherwise be undone by the resolving promise, re-arming a receipt for a snippet
	 * that is no longer on screen — and, on unmount, arming a timer nothing can clear. `receipt` is
	 * a generation counter: `dismiss` bumps it, and a resolution whose generation has moved on
	 * returns without touching anything.
	 */
	let { ref = $bindable(null), ...restProps }: CodeBlockCopyButtonProps = $props();

	const block = getCodeBlockContext("`<CodeBlock.CopyButton>`");

	let copied = $state(false);
	let receiptTimer: ReturnType<typeof setTimeout> | undefined;
	let receipt = 0;

	function dismiss() {
		receipt += 1;
		clearTimeout(receiptTimer);
		copied = false;
	}

	async function copy() {
		const mine = receipt;
		try {
			await navigator.clipboard.writeText(block.copyText());
			if (mine !== receipt) return;
			copied = true;
			clearTimeout(receiptTimer);
			receiptTimer = setTimeout(() => (copied = false), CODE_BLOCK_COPY_RECEIPT_MS);
		} catch {
			// The clipboard API refuses in an insecure context and when permission is denied.
			if (mine === receipt) copied = false;
		}
	}

	$effect(() => {
		block.activeCode;
		return dismiss;
	});
</script>

<Button
	bind:ref
	variant="ghost"
	size="icon-sm"
	aria-label={copied ? "Code copied" : "Copy code"}
	onclick={copy}
	{...restProps}
>
	{#if copied}
		<CheckIcon />
	{:else}
		<CopyIcon />
	{/if}
</Button>
