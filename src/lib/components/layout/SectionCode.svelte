<script lang="ts">
	import CodeIcon from "@lucide/svelte/icons/code";
	import { CopyButton } from "$lib/components/ui/copy-button/index.js";
	import { cn } from "$lib/utils.js";

	/**
	 * The second control beside a section heading: copy the example's code.
	 *
	 * `ui/copy-button` DIRECTLY, unlike its neighbour. `SectionAnchor` had to fork the state
	 * machine because a link to a section must be a real `<a href>` — middle-click, "open in new
	 * tab", the address bar — and `CopyButton`'s props omit `href` on purpose. Nothing here wants
	 * to be a link: this control has one behaviour, and the published component already has it,
	 * down to the pending face and the live region.
	 *
	 * WHY THE PENDING FACE MATTERS HERE and did not next door. The examples for a page are their
	 * own chunk, fetched on the first press; `CopyButton` shows its spinner only while a producer
	 * has not answered, so the first press on a page shows it and every later one does not. That
	 * is also why the reveal classes below have to hold the control visible while it is pending —
	 * a reader who presses and moves the pointer away would otherwise watch the spinner disappear
	 * with no receipt to follow it.
	 *
	 * A CODE GLYPH, not a clipboard. Beside a link glyph that also copies, two clipboards would
	 * say nothing about which is which; each icon names what the control is ABOUT — an address,
	 * a source — and the check that replaces it names what happened, on both.
	 *
	 * `errorLabel` says "Copy failed" rather than anything about the example, because a refused
	 * clipboard is the only failure that can reach a reader: a section the build cannot extract
	 * fails the BUILD, so a control that exists always has an answer to give.
	 */
	let {
		label,
		value,
		class: className,
	}: {
		/** The accessible name. The only content is an icon, so this IS the name. */
		label: string;
		/** Produces the text. A promise on the first press for a page — see above. */
		value: () => string | Promise<string>;
		class?: string;
	} = $props();
</script>

<!--
	`data-slot` is NOT overridden here. `CopyButton` sets its own after the forwarded attributes,
	deliberately, so the published CSS has a name it can rely on — the same contract `PageHeader`
	keeps for its own slots. `data-section-code` marks this control without taking that away.
-->
<CopyButton
	{value}
	variant="ghost"
	size="icon-xs"
	aria-label={label}
	copiedLabel="Code copied"
	errorLabel="Copy failed"
	data-section-code=""
	class={cn("shrink-0 text-muted-foreground", className)}
>
	{#snippet icon()}
		<CodeIcon />
	{/snippet}
</CopyButton>
