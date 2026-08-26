<script lang="ts">
	import type { Snippet } from "svelte";
	import SectionAnchor from "$lib/components/layout/SectionAnchor.svelte";
	import { sectionId } from "$lib/components/layout/section-id.js";

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
		children: Snippet;
	} = $props();

	const id = $derived(idProp ?? sectionId(title));
</script>

<section class="not-first:mt-12 not-first:border-t not-first:pt-12">
	<!--
		`-my-px` on the control: `text-xl` leads at 1.1 (`src/app.css`), so the heading's line box is
		22px and the smallest rung of the control ramp is 24px. Without it every heading row on every
		page would grow by 2px, and the section rhythm with it. A ghost button is transparent at
		rest, so the 1px it overhangs on each side is invisible.

		The control is revealed by hovering the heading rather than shown outright — 1300 of them,
		one per section, would be a column of link glyphs down the page. `focus-visible:` keeps it
		reachable by keyboard, `data-[copied]:` keeps the receipt on screen, and the hover gate is
		lifted wherever a finger might be the input: Tailwind resolves `hover:` under
		`@media (hover: hover)`, so without an escape the control is unreachable by touch. The test
		is `any-hover` and not `hover`, because `hover` reports the PRIMARY pointer — a touchscreen
		laptop answers `hover: hover`, and its user would never reach the control with the finger
		they are actually using.
	-->
	<div class="group/heading mb-2 flex items-center gap-2">
		<h2 {id} data-slot="section-heading" tabindex="-1" class="text-xl font-medium outline-hidden">
			{title}
		</h2>
		<SectionAnchor
			href="#{id}"
			label="Copy link to {title}"
			class="-my-px opacity-0 group-hover/heading:opacity-100 focus-visible:opacity-100 data-[copied]:opacity-100 [@media(any-hover:none)]:opacity-100"
		/>
	</div>
	{#if blurb}
		<p class="mb-4 text-sm text-muted-foreground">{@render blurb()}</p>
	{/if}
	{@render children()}
</section>
