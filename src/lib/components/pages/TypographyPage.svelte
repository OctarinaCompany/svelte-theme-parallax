<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { href } from "$lib/hooks/route.svelte.js";

	/**
	 * The Typography component page.
	 *
	 * WHY THE HEADINGS CARRY CLASSES. The classic theme styles `h1`–`h6` globally in the reference stylesheet;
	 * app.css deliberately does not, because this codebase has almost no semantic headings —
	 * `CardTitle` is a `<div>` — and a base-layer rule that nothing matches is a rule that
	 * drifts out of date unnoticed. The scale instead lives on the `text-*` steps, mapped by
	 * consumer, and this page states each level explicitly. That makes the page honest about
	 * what a reader would have to type.
	 *
	 * Four of the six sizes are theme steps; two are written out because the classic theme puts them
	 * between Tailwind's:
	 *
	 *   h1  1.5rem, then h1-font-size 1.625rem from `md`   text-2xl + md:text-[1.625rem]
	 *   h2  h2-font-size 1.25rem                           text-xl
	 *   h3  h3-font-size 1.0625rem                         text-lg  (remapped in app.css)
	 *   h4  h4-font-size 0.9375rem                         text-sm
	 *   h5  h5-font-size 0.8125rem                         text-xs
	 *   h6  h6-font-size 0.625rem                          text-[0.625rem]
	 *
	 * `h1` is the only responsive step in the whole theme.
	 */

	/**
	 * `headings-font-weight: 500`, `headings-line-height: 1.1`, `headings-letter-spacing:
	 * -.02em`.
	 *
	 * For `text-2xl` and `text-xl` the leading and tracking merely restate what `@theme inline`
	 * already attaches to those two steps; they are repeated so all six lines read the same way
	 * rather than leaving a reader to work out which levels get the treatment for free.
	 */
	const heading = "font-medium leading-[1.1] tracking-[-0.02em]";

	/**
	 * `headings-margin-bottom` is `spacer * .75` = 1.125rem, and the reference stylesheet scales it per
	 * level: full for `h1`/`h2`, three quarters for `h3`, half for `h4`–`h6`.
	 */
	const levels = [
		{ tag: "h1", size: "text-2xl md:text-[1.625rem]", margin: "mb-[1.125rem]" },
		{ tag: "h2", size: "text-xl", margin: "mb-[1.125rem]" },
		{ tag: "h3", size: "text-lg", margin: "mb-[0.84375rem]" },
		{ tag: "h4", size: "text-sm", margin: "mb-[0.5625rem]" },
		{ tag: "h5", size: "text-xs", margin: "mb-[0.5625rem]" },
		{ tag: "h6", size: "text-[0.625rem]", margin: "mb-[0.5625rem]" },
	] as const;

	/**
	 * The classic reboot gives `<p>` `margin-bottom: 1rem`, which Tailwind's preflight removes.
	 * The last paragraph in a block keeps it in the classic theme too, so it is not dropped here.
	 */
	const paragraph = "mb-4 text-sm";
</script>

<DocPage title="Typography">
	{#snippet subtitle()}
		This theme uses the Hanken Grotesk webfont for both headings and body content — an open
		(OFL-1.1) grotesque by Hanken Design Co.
	{/snippet}

	<div>
		<DocSection title="Headings">
			{#snippet blurb()}
				Six levels, each stating its own step. Nothing here comes from a base-layer rule, so what
				you read is exactly what you would have to type — see the note at the top of this file for
				why the scale is not applied to bare <code>h1</code>–<code>h6</code>.
			{/snippet}
			<Card.Root>
				<Card.Content>
					{#each levels as level (level.tag)}
						<svelte:element this={level.tag} class="{heading} {level.size} {level.margin}">
							{level.tag}. Heading specimen
						</svelte:element>
					{/each}
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Body copy">
			{#snippet blurb()}
				Two weights of the same 15px body step: full-strength ink for the sentence a reader is meant
				to read, and <code>--muted-foreground</code> for the one explaining it.
			{/snippet}
			<Card.Root>
				<Card.Content>
					<p class={paragraph}>
						Hanken Grotesk is a variable font, so every weight on this page comes from one file and
						the numeric axis is continuous — a heading at 500 and body copy at 400 cost the same
						download.
					</p>

					<!-- The secondary ink, `--muted-foreground`: a caption under a line, not a second voice. -->
					<p class="{paragraph} text-muted-foreground">
						Secondary type is a token rather than an opacity, so it stays legible when the palette
						changes and does not fade further on a tinted surface.
					</p>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Links">
			{#snippet blurb()}
				A link in running text is coloured rather than underlined, and darkens on hover.
			{/snippet}
			<Card.Root>
				<Card.Content>
					<!--
						The hover colour is the primary mixed 70/30 toward black. It is written as a
						`color-mix()` rather than a second token because it is one state of one colour;
						the Button page's `link` variant makes the same call for the same reason.
					-->
					<p class={paragraph}>
						Every palette on the
						<a
							href={href("/components/themes")}
							class="text-primary no-underline transition-colors hover:text-[color-mix(in_srgb,var(--primary)_70%,black)]"
						>
							Themes
						</a>
						page repaints this link, because its colour is <code>--primary</code> and nothing here names
						a hue.
					</p>
				</Card.Content>
			</Card.Root>
		</DocSection>
	</div>
</DocPage>
