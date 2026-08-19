<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { AspectRatio } from "$lib/components/ui/aspect-ratio/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Aspect ratio component page, ported from
	 * `https://shadcn-svelte.com/docs/components/aspect-ratio` — one demo (a 16:9 photo) plus a
	 * `Usage` snippet that puts the same demo inside a fixed-width parent.
	 *
	 * WHAT THE CLASSIC THEME HAS: the classic `.ratio` helper, inherited untouched. There is no `_ratio`
	 * partial anywhere under the reference source (the reference stylesheet imports its colour helpers and
	 * nothing else), and the reference stylesheet never mentions `aspect-ratios`, so the classic stock
	 * helper reaches the reference bundle verbatim:
	 *
	 *   .ratio        { position: relative; width: 100% }
	 *   .ratio:before { content: ""; display: block; padding-top: var(--bs-aspect-ratio) }
	 *   .ratio > *    { position: absolute; top: 0; left: 0; width: 100%; height: 100% }
	 *
	 * with `--bs-aspect-ratio` at 100% / 75% / 56.25% / 42.8571428571% for `.ratio-1x1`,
	 * `.ratio-4x3`, `.ratio-16x9` and `.ratio-21x9`.
	 *
	 * WHAT THE COMPONENT DOES: exactly that, computed instead of tabulated. bits-ui's
	 * `AspectRatio.Root` wraps the content in `position: relative; width: 100%; padding-bottom:
	 * (100 / ratio)%` and absolutely pins the inner element — the one `class` lands on — to
	 * `top/right/bottom/left: 0`. `ratio={16 / 9}` yields 56.25%, the same number the classic framework
	 * hardcodes for `.ratio-16x9`. So the geometry needs no porting at all: it is already
	 * the classic theme's, down to the decimal.
	 *
	 * WHAT THE CLASSIC THEME DOES NOT HAVE: any styling of its own for this. It never restyles `.ratio`
	 * and documents it only in passing, inside the `Map` section of the reference docs:
	 * `<div class="ratio ratio-21x9 overflow-hidden rounded">`. That single line is the only
	 * reachable difference on this page, and it is a corner radius — see `frame` below. The one
	 * ratio-related thing the classic theme adds anywhere is `.avatar-4by3` in the reference stylesheet
	 * (`width: calc(var(--bs-avatar-size) * 4 / 3)`), which stretches a fixed-size avatar rather
	 * than shaping a fluid container, so it is not a counterpart to this component.
	 *
	 * NO REMOTE IMAGE: the docs demo loads a stock photo. This repo makes no network requests
	 * at runtime, so every frame holds the same `bg-muted` block the Cards page uses as a chart
	 * stand-in (`--muted` is `gray-200` #EDF2F9 light, `gray-900-dark` #132A46 dark). The docs'
	 * `dark:brightness-[0.2] dark:grayscale` on the `<img>` goes with it — there is no photograph
	 * left to dim.
	 */

	/**
	 * The frame, i.e. what the docs put on `<AspectRatio>` itself.
	 *
	 *   rounded-md       the classic theme's own use of the helper asks for `.rounded`, which is
	 *                    `var(--bs-border-radius)` = `border-radius` (0.375rem) — `--radius-md`
	 *                    here. The docs demo uses `rounded-lg` (0.5rem = `border-radius-lg`),
	 *                    one step too round for a classic page
	 *   overflow-hidden  also from that line. The child is absolutely positioned, so without it
	 *                    the child's square corners paint over the frame's rounded ones
	 *
	 * No background: it lives on the child instead, since the child is what stands in for the
	 * photo the docs load.
	 */
	const frame = "overflow-hidden rounded-md";

	/**
	 * The classic `aspect-ratios` map, which the classic theme inherits without editing. `padding` is the
	 * `--bs-aspect-ratio` each class sets, quoted from the compiled `theme.bundle.css` so the
	 * computed and the tabulated values can be compared: `100 / ratio` reproduces every one.
	 */
	const ratios = [
		{ label: "1x1", ratio: 1, padding: "100%" },
		{ label: "4x3", ratio: 4 / 3, padding: "75%" },
		{ label: "16x9", ratio: 16 / 9, padding: "56.25%" },
		{ label: "21x9", ratio: 21 / 9, padding: "42.8571428571%" },
	];
</script>

<!--
	Stands in for the docs' `<img class="h-full w-full object-cover">`: `size-full` is that pair,
	and the caption replaces the photo's subject so an empty grey rectangle does not read as a
	failed load. `text-muted-foreground` is `body-secondary-color` (`gray-600` light,
	`gray-700` dark), the classic theme's colour for text that labels rather than informs.
-->
{#snippet placeholder(caption: string)}
	<div class="flex size-full items-center justify-center bg-muted text-xs text-muted-foreground">
		{caption}
	</div>
{/snippet}

<DocPage title="Aspect ratio">
	{#snippet subtitle()}
		Displays content within a desired ratio. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/aspect-ratio"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<AspectRatio ratio={16 / 9} class={frame}>
				{@render placeholder("16 / 9")}
			</AspectRatio>
		</Card.Content>
	</Card.Root>

	<DocSection title="Fixed width">
		{#snippet blurb()}
			The docs' usage snippet constrains the parent instead of the frame: the ratio is a
			relationship, so it is the width that has to be decided somewhere.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`w-[450px]` verbatim from the docs, with `max-w-full` added: this reading column is
					narrower than 450px on a phone, and the classic framework's own `.ratio` is `width: 100%` for
					the same reason — a ratio box must never be the thing that makes a page scroll
					sideways.
				-->
				<div class="w-[450px] max-w-full">
					<AspectRatio ratio={16 / 9} class={frame}>
						{@render placeholder("16 / 9 in a 450px column")}
					</AspectRatio>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="The classic ratios">
		{#snippet blurb()}
			The four values the classic theme inherits from the classic <code
				class="text-[87.5%] text-primary">aspect-ratios</code
			> map, written as numbers rather than as class names. The last one is the ratio the classic theme
			itself uses, for the map embed.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Two columns from `md` up so the tall 1x1 and the wide 21x9 can be seen against each
					other; `gap-6` is `card-spacer-x` / `grid-gutter-width` (1.5rem), the spacing
					the classic theme uses between anything card-sized.
				-->
				<div class="grid gap-6 md:grid-cols-2">
					{#each ratios as entry (entry.label)}
						<div>
							<AspectRatio ratio={entry.ratio} class={frame}>
								{@render placeholder(entry.label)}
							</AspectRatio>
							<!--
								`.ratio-{entry.label}` and the padding it sets, so the equivalence is on the
								page and not only in this file's header.
							-->
							<p class="mt-2 text-xs text-muted-foreground">
								<code class="text-[87.5%] text-primary">.ratio-{entry.label}</code>
								— padding-top: {entry.padding}
							</p>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		The four sections below add the ratios the classic map does not carry:
		portrait and photographic ones. The everyday four —
		16:9 / 4:3 / 1:1 / 21:9 — are already on this page above. Each
		demo is a `max-w-xs` or `max-w-md` column holding an `<AspectRatio>` with a placeholder
		inside; the columns are deliberate, the visual is this page's `placeholder` snippet —
		same reason as the header's NO REMOTE IMAGE note — framed by this
		page's `frame` (`rounded-md`) with no `border`: a filled `bg-muted` block
		needs no outline the way a photo that may fail to load does.
	-->
	<DocSection title="9:16 portrait aspect ratio">
		{#snippet blurb()}
			The widescreen ratio turned on its side — a phone screen, a story, a reel.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`max-w-xs` from demo 5: at 9:16 the height is ~1.78x the width, so
					the column must stay narrow for the frame to fit on screen.
				-->
				<div class="w-full max-w-xs">
					<AspectRatio ratio={9 / 16} class={frame}>
						{@render placeholder("9 / 16")}
					</AspectRatio>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="3:2 classic photography aspect ratio">
		{#snippet blurb()}
			The 35mm film frame, still the default sensor ratio on most DSLR and mirrorless cameras.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 6 -->
				<div class="w-full max-w-md">
					<AspectRatio ratio={3 / 2} class={frame}>
						{@render placeholder("3 / 2")}
					</AspectRatio>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="4:5 social media portrait aspect ratio">
		{#snippet blurb()}
			The tallest portrait crop the major social feeds allow.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 7 -->
				<div class="w-full max-w-xs">
					<AspectRatio ratio={4 / 5} class={frame}>
						{@render placeholder("4 / 5")}
					</AspectRatio>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="16:10 computer monitor aspect ratio">
		{#snippet blurb()}
			The laptop-display ratio — slightly taller than 16:9, which is why the two are easy to confuse
			and worth seeing side by side.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 8 -->
				<div class="w-full max-w-md">
					<AspectRatio ratio={16 / 10} class={frame}>
						{@render placeholder("16 / 10")}
					</AspectRatio>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
