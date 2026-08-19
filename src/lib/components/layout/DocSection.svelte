<script lang="ts">
	import type { Snippet } from "svelte";

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
	 */
	let {
		title,
		blurb,
		children,
	}: {
		title: string;
		blurb?: Snippet;
		children: Snippet;
	} = $props();
</script>

<section class="not-first:mt-12 not-first:border-t not-first:pt-12">
	<h2 class="mb-2 text-xl font-medium">{title}</h2>
	{#if blurb}
		<p class="mb-4 text-sm text-muted-foreground">{@render blurb()}</p>
	{/if}
	{@render children()}
</section>
