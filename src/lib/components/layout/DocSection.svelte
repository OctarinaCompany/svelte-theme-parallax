<script lang="ts">
	import type { Snippet } from "svelte";
	import SectionAnchor from "$lib/components/layout/SectionAnchor.svelte";
	import SectionCode from "$lib/components/layout/SectionCode.svelte";
	import { sectionId } from "$lib/components/layout/section-id.js";
	import {
		getSectionSourceContext,
		sectionSourceText,
	} from "$lib/components/layout/section-source.js";

	/**
	 * One numbered section of a component documentation page: an `h2`, an optional
	 * secondary-coloured blurb, then the example — with a rule between consecutive sections.
	 *
	 * The rule is rendered as a TOP border on the following section rather than as a
	 * trailing `<hr>`, so the last section on a page does not end with a dangling line.
	 * `not-first:` resolves against `:first-child`, which means the sections must be direct
	 * siblings inside a wrapper of their own — every page groups them in a plain `<div>`
	 * after `PageIntro`, so the first one really is first. Putting them straight after
	 * `PageIntro` instead would make section one match `not-first:` too, and stack a second
	 * rule 96px below the intro's own.
	 *
	 * `blurb` is a snippet, not a string: several carry inline `<code>`. Same shape as
	 * `PageIntro`'s `subtitle`.
	 *
	 * THE ID IS ON THE HEADING, NOT ON THE `<section>`, and that is not a detail. A section
	 * carries `pt-12` above its heading, so a fragment naming the section would stop the browser
	 * 48px of empty rule short of the thing the reader followed the link for. Naming the heading
	 * also makes the two ways of arriving agree: a click on the anchor below is resolved by the
	 * browser, a cold visit is resolved by `DocPage` after the page chunk mounts, and both look
	 * the id up the same way and land in the same place.
	 */
	let {
		title,
		blurb,
		id: idProp,
		code = true,
		children,
	}: {
		title: string;
		blurb?: Snippet;
		/**
		 * Override the derived id.
		 *
		 * The id is the title's kebab, which means rewording a title moves the section's address.
		 * That is the accepted cost everywhere except where the title is not a constant — a title
		 * that interpolates data would silently take a new address the day the data changes, and
		 * that is what this is for.
		 */
		id?: string;
		/**
		 * Offer the copy-code control.
		 *
		 * Default true. `false` is for a section the build cannot extract, which today means one
		 * shape: a title built from an expression, whose key nothing in Node can match to what the
		 * browser asks for. The flag is explicit rather than inferred so the two halves cannot
		 * silently disagree — a section that opts out here is also the one the extractor skips,
		 * and it says so at build time.
		 */
		code?: boolean;
		children: Snippet;
	} = $props();

	const id = $derived(idProp ?? sectionId(title));

	/**
	 * The example, if this page has one extracted.
	 *
	 * The KEY is the explicit id or the raw title — not the derived anchor id. Deriving it in the
	 * build tool would put a second copy of `sectionId` in Node, free to drift from this one;
	 * asking with a string both halves can see removes the possibility.
	 */
	const sections = getSectionSourceContext();
	const hasCode = $derived(code && sections?.available === true);

	/**
	 * When the controls are on screen.
	 *
	 * Written once and shared, because the two must reveal together — a pair that faded in
	 * separately would read as one control and a glitch. `data-[pending]:` is what holds the code
	 * control visible while its chunk is in flight: without it, a reader who presses and moves the
	 * pointer away watches the spinner vanish before the receipt it was promising.
	 */
	const reveal =
		"-my-px opacity-0 transition-opacity group-hover/heading:opacity-100 group-has-[:focus-visible]/heading:opacity-100 data-[copied]:opacity-100 data-[pending]:opacity-100";

	/**
	 * The link is offered on touch as well; the code control is not.
	 *
	 * `hover:` resolves under `@media (any-hover: hover)`, so on a phone neither control can be
	 * revealed by pointing — the link takes an escape hatch because sharing a section is exactly
	 * what someone does from a phone. Copying a Svelte component is not, and the control is not
	 * merely hidden there but removed: 32px of permanently reserved width wrapped twelve more
	 * headings onto a second line on one page alone, and a control nobody can reveal should not
	 * be taking space or a tab stop.
	 */
	const linkReveal = `${reveal} [@media(any-hover:none)]:opacity-100`;
	const codeReveal = `${reveal} hidden [@media(any-hover:hover)]:inline-flex`;

	/**
	 * NOT `async`. An async function always returns a promise, and `CopyButtonState` shows its
	 * pending face for exactly that — so declaring one here would defeat the synchronous cache in
	 * `DocPage` and flash a spinner on every press after the first, which is the behaviour that
	 * cache exists to prevent. The branch below keeps the synchronous answer synchronous.
	 */
	function copyValue(): string | Promise<string> {
		const url = new URL(`#${id}`, window.location.href).href;
		const source = sections!.get(idProp ?? title);
		return source instanceof Promise
			? source.then((resolved) => sectionSourceText(resolved, url, title))
			: sectionSourceText(source, url, title);
	}
</script>

<section class="not-first:mt-12 not-first:border-t not-first:pt-12">
	<!--
		`-my-px` on the control: `text-xl` leads at 1.1 (`src/app.css`), so the heading's line box is
		22px and the smallest rung of the control ramp is 24px. Without it every heading row on every
		page would grow by 2px, and the section rhythm with it. A ghost button is transparent at
		rest, so the 1px it overhangs on each side is invisible.

		BOTH controls are revealed by hovering the heading rather than shown outright: two per
		section across thirteen hundred of them would be a column of glyphs running down every page.
		They reveal TOGETHER — `group-has-[:focus-visible]/heading:` and not a per-element
		`focus-visible:`, or a keyboard user sees one 24px glyph jump sideways and change shape
		rather than a pair — and `data-[copied]:` / `data-[pending]:` hold whichever was pressed on
		screen while it answers, so a receipt is never cut short by the pointer moving away.

		The `any-hover` test is what the two do NOT share, and why is above the constants. It is
		`any-hover` rather than `hover` because `hover` reports the PRIMARY pointer: a touchscreen
		laptop answers `hover: hover`, and its user still has a finger.
	-->
	<div class="group/heading mb-2 flex items-center gap-2">
		<h2 {id} data-slot="section-heading" tabindex="-1" class="text-xl font-medium outline-hidden">
			{title}
		</h2>
		<SectionAnchor href="#{id}" label="Copy link to {title}" class={linkReveal} />
		{#if hasCode}
			<SectionCode label="Copy code for {title}" value={copyValue} class={codeReveal} />
		{/if}
	</div>
	{#if blurb}
		<p class="mb-4 text-sm text-muted-foreground">{@render blurb()}</p>
	{/if}
	{@render children()}
</section>
