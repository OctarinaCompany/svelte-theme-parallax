<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import { Skeleton } from "$lib/components/ui/skeleton/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Skeleton component page, ported from
	 * https://shadcn-svelte.com/docs/components/skeleton — its two examples, the avatar-plus-two-
	 * lines default and the `Card` one, in that order.
	 *
	 * The classic theme's counterpart is the classic `.placeholder`, documented as "Placeholders":
	 * one card holding three bare
	 * `<span class="placeholder">` bars at `col-6`, `w-75` and `width: 25%`, with no
	 * `.placeholder-glow` wrapper, so the classic theme's own example does not animate.
	 *
	 * THE CLASSIC THEME ADDS NOTHING OF ITS OWN HERE. The classic theme's stylesheet pulls the
	 * classic framework's placeholder rules in unchanged, and its own source declares no
	 * `placeholder-*` variable — a case-insensitive grep over the theme's Sass finds only
	 * `input-placeholder-color`, which is the `::placeholder` text of a form control and
	 * unrelated. Every value quoted below is therefore the classic framework's default, inherited
	 * unchanged, and read back off the classic theme's compiled bundle:
	 *
	 *   .placeholder { background-color: currentcolor; cursor: wait; display: inline-block;
	 *                  min-height: 1em; opacity: .5; vertical-align: middle }
	 *   .placeholder-glow .placeholder { animation: placeholder-glow 2s ease-in-out infinite }
	 *   @keyframes placeholder-glow { 50% { opacity: .2 } }
	 *
	 * What that changes about shadcn's skeleton is covered on `placeholder` below. What has no
	 * counterpart, and is therefore left as the docs page has it:
	 *
	 *   sizing    the classic framework sizes a placeholder as an inline span: `min-height: 1em` scaled by
	 *             `.placeholder-xs/-sm/-lg` (.6em / .8em / 1.2em) for the height, and grid
	 *             columns or width utilities for the length. shadcn's demos give explicit block
	 *             dimensions (`size-12`, `h-4 w-[250px]`, `h-[125px]`) instead, which the theme
	 *             keeps — a 1em-tall span cannot express the 125px image tile the Card example
	 *             is built around
	 *   wave      `.placeholder-wave` animates a `mask-image` sweep across the bar rather than
	 *             its opacity. shadcn has no equivalent and its docs page has no wave example,
	 *             so it is not ported
	 */

	/**
	 * The classic skin, applied to every skeleton on this page.
	 *
	 *   bg-current   `background-color: currentcolor` — the bar is painted in the text colour of
	 *                whatever contains it, here `--card-foreground` (#0F263F in light, #FBFBFB in
	 *                dark). That is why no `dark:` override is needed, and it is also the fix for
	 *                a real problem: shadcn's `bg-muted` is #162B48 in dark, DARKER than the
	 *                #182F4F card it sits on, so the skeleton reads as a hole punched in the
	 *                surface — 1.06:1 against the card, i.e. nothing at all.
	 *                `currentcolor` also survives a theme swap where a token would not:
	 *                `--foreground` is the neutral ink at L .265 in EVERY light theme and pure
	 *                white in every dark one (`themes.css`), so the composite below measures the
	 *                same under all twelve. `--muted-foreground` is solved per theme (L .535 /
	 *                .668) and Parallax's is the odd one out, so painting with it would drift
	 *   opacity-20   NOT the classic `placeholder-opacity-max: .5`, the one value on this page
	 *                deliberately overruled. At .5 the bar composites to #85919D on the light
	 *                card and #8A95A5 on the dark one — 3.1:1 and 4.4:1 against the surface,
	 *                which is the contrast of live TEXT. A skeleton has to read as absence, not
	 *                as content, and the failure is asymmetric in the way that gives it away:
	 *                because `currentcolor` is the MAXIMUM-contrast token in either mode, the
	 *                offending end swaps sides — too dark in light, too light in dark.
	 *                The whole ramp therefore steps down one classic notch, to .2 / .08: .2
	 *                was already the classic framework's own MIN, and the .4 ratio between the ends is kept
	 *                exactly (Material UI's skeleton pulses on the same .4, 1 → .4 over a base
	 *                alpha of .11 light / .13 dark, and lands in the same band). That measures
	 *                1.49:1 → 1.17:1 in light and 1.85:1 → 1.27:1 in dark — a bar that is
	 *                plainly there and plainly not content.
	 *                On the element, not the colour, because the glow animates the element's
	 *                `opacity` and needs this as its resting value
	 *   rounded-none `.placeholder` sets no `border-radius` at all; shadcn's default is
	 *                `rounded-md`. Demos that want a shape re-state it after this class
	 *   cursor-wait  `cursor: wait`, the one affordance the classic framework gives a placeholder
	 *   animate-[…]  `.placeholder-glow .placeholder`: 2s ease-in-out infinite, against shadcn's
	 *                `animate-pulse` (2s cubic-bezier(.4,0,.6,1), opacity 1 → .5 → 1). The
	 *                durations match; the curve and the range do not. The fade is .2 → .08 → .2,
	 *                and the keyframe sets only the 50% step so the 0%/100% ends come from
	 *                `opacity-20` above. `@keyframes placeholder-glow` cannot be written as a
	 *                utility, so it is the one rule this page hands to `app.css`
	 *
	 * The classic theme's own card shows the un-animated `.placeholder`; the glow is opted into per parent
	 * there. It is on by default here because shadcn's skeleton is defined as an animated
	 * component, and because the whole point of both is a surface that is visibly still loading.
	 */
	const placeholder =
		"animate-[placeholder-glow_2s_ease-in-out_infinite] cursor-wait rounded-none bg-current opacity-20";
</script>

<DocPage title="Skeleton">
	{#snippet subtitle()}
		Use to show a placeholder while content is loading. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/skeleton"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<!--
				The docs write this row as `space-x-4` / `space-y-2`; `gap-*` is the house
				equivalent. The measurements themselves are shadcn's, since the classic framework has no
				avatar-and-two-lines placeholder to compare them against.
			-->
			<div class="flex items-center gap-4">
				<!-- `rounded-full` after `rounded-none`: the demo stands in for a round avatar. -->
				<Skeleton class="{placeholder} size-12 rounded-full" />
				<div class="flex flex-col gap-2">
					<Skeleton class="{placeholder} h-4 w-[250px]" />
					<Skeleton class="{placeholder} h-4 w-[200px]" />
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<DocSection title="Card">
		{#snippet blurb()}
			An image block above two lines of text — the shape of a card that has not loaded yet.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-3">
					<!--
						`rounded-xl` is the demo's own request for an image tile, and overrides the
						square corners the same way the avatar above does. Nothing here is a classic
						value: the classic placeholders are text-sized bars and have no tile case.
					-->
					<Skeleton class="{placeholder} h-[125px] w-[250px] rounded-xl" />
					<div class="flex flex-col gap-2">
						<Skeleton class="{placeholder} h-4 w-[250px]" />
						<Skeleton class="{placeholder} h-4 w-[200px]" />
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		The sections below are the skeleton pattern set. Every skeleton keeps the `placeholder`
		skin defined at the top of this page, so the classic look stays uniform; each demo's own
		shapes (`rounded-full`, `rounded-md`, …) are re-stated after it, as the header comment
		prescribes.
	-->

	<DocSection title="Skeleton loader for a card component">
		{#snippet blurb()}
			Title and subtitle lines above a video-shaped media tile, inside real card chrome.
		{/snippet}
		<!--
			demo 2. Unlike the shadcn Card section above, this one composes skeletons
			inside the actual Card.Header / Card.Content parts, so the loading state keeps the
			card's own padding and rhythm.
		-->
		<Card.Root>
			<Card.Content>
				<Card.Root class="w-full max-w-xs">
					<Card.Header class="gap-2">
						<Skeleton class="{placeholder} h-4 w-2/3" />
						<Skeleton class="{placeholder} h-4 w-1/2" />
					</Card.Header>
					<Card.Content>
						<Skeleton class="{placeholder} aspect-video w-full rounded-md" />
					</Card.Content>
				</Card.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Skeleton loader for text and paragraphs">
		<!-- demo 3: two paragraphs, each with a shortened last line. -->
		<Card.Root>
			<Card.Content>
				<div class="mx-auto w-full max-w-xs">
					<div class="flex flex-col gap-2">
						<Skeleton class="{placeholder} h-4 w-full" />
						<Skeleton class="{placeholder} h-4 w-full" />
						<Skeleton class="{placeholder} h-4 w-3/4" />
						<div class="mt-4 flex flex-col gap-2">
							<Skeleton class="{placeholder} h-4 w-full" />
							<Skeleton class="{placeholder} h-4 w-5/6" />
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Skeleton loader for a form">
		<!--
			demo 4: two label-above-input pairs and a submit button. The h-10 inputs
			sit on the `default` step of the control ramp (`--control-h-default`, 40px), which is what a form control at rest is.
		-->
		<Card.Root>
			<Card.Content>
				<div class="mx-auto w-full max-w-xs">
					<div class="flex flex-col gap-6">
						<div class="flex flex-col gap-2">
							<Skeleton class="{placeholder} h-4 w-20" />
							<Skeleton class="{placeholder} h-10 w-full" />
						</div>
						<div class="flex flex-col gap-2">
							<Skeleton class="{placeholder} h-4 w-24" />
							<Skeleton class="{placeholder} h-10 w-full" />
						</div>
						<Skeleton class="{placeholder} h-10 w-28" />
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Skeleton loader for a data table">
		<!-- demo 5: a header row under a border, then four identical body rows. -->
		<Card.Root>
			<Card.Content>
				<div class="mx-auto flex w-full max-w-lg flex-col gap-4">
					<div class="flex gap-4 border-b pb-2">
						<Skeleton class="{placeholder} h-4 flex-1" />
						<Skeleton class="{placeholder} h-4 w-24" />
						<Skeleton class="{placeholder} h-4 w-20" />
					</div>
					{#each { length: 4 } as _, i (i)}
						<div class="flex gap-4">
							<Skeleton class="{placeholder} h-4 flex-1" />
							<Skeleton class="{placeholder} h-4 w-24" />
							<Skeleton class="{placeholder} h-4 w-20" />
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Skeleton loader for a dashboard stats row">
		<!-- demo 6: three stat cards — label, big value, delta line. -->
		<Card.Root>
			<Card.Content>
				<div class="mx-auto grid w-full max-w-lg grid-cols-3 gap-4">
					{#each { length: 3 } as _, i (i)}
						<Card.Root>
							<Card.Header class="pb-2">
								<Skeleton class="{placeholder} h-3 w-16" />
							</Card.Header>
							<Card.Content class="flex flex-col gap-2">
								<Skeleton class="{placeholder} h-8 w-24" />
								<Skeleton class="{placeholder} h-3 w-20" />
							</Card.Content>
						</Card.Root>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Skeleton loader for a list with actions">
		<!--
			demo 7: a titled list where every row is avatar + two lines + a trailing
			action button, separated by softened borders.
		-->
		<Card.Root>
			<Card.Content>
				<div class="mx-auto w-full max-w-xs">
					<div class="flex flex-col">
						<div class="flex items-center justify-between pb-4">
							<Skeleton class="{placeholder} h-5 w-28" />
							<Skeleton class="{placeholder} h-8 w-20 rounded-md" />
						</div>
						<Separator class="opacity-60" />
						{#each { length: 3 } as _, i (i)}
							<div class="flex items-center gap-3 border-b border-border/60 py-3 last:border-b-0">
								<Skeleton class="{placeholder} size-9 shrink-0 rounded-full" />
								<div class="flex flex-1 flex-col gap-1.5">
									<Skeleton class="{placeholder} h-3.5 w-32" />
									<Skeleton class="{placeholder} h-3 w-48" />
								</div>
								<Skeleton class="{placeholder} h-8 w-16 rounded-md" />
							</div>
						{/each}
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Skeleton loader for a card grid">
		<!--
			demo 8: one grid tile in full — media header, three text lines, a footer
			with a wide action and a square icon button (`size-8`, the demo's `h-8 w-8`).
		-->
		<Card.Root>
			<Card.Content>
				<Card.Root class="w-full max-w-xs">
					<Card.Header>
						<Skeleton class="{placeholder} aspect-video w-full" />
					</Card.Header>
					<Card.Content class="flex flex-col gap-2">
						<Skeleton class="{placeholder} h-4 w-3/4" />
						<Skeleton class="{placeholder} h-3 w-full" />
						<Skeleton class="{placeholder} h-3 w-2/3" />
					</Card.Content>
					<Card.Footer class="flex justify-between">
						<Skeleton class="{placeholder} h-8 w-20 rounded-md" />
						<Skeleton class="{placeholder} size-8 rounded-md" />
					</Card.Footer>
				</Card.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Skeleton loader for a full profile page">
		<!--
			demo 9: a centred profile header card (avatar, name, bio, three counters)
			above a key-value details card. The header centres with `justify-items-center`
			because the house Card.Header is a grid, not a flex column.
		-->
		<Card.Root>
			<Card.Content>
				<div class="mx-auto flex w-full max-w-xs flex-col gap-6">
					<Card.Root>
						<Card.Header class="justify-items-center gap-3">
							<Skeleton class="{placeholder} size-20 rounded-full" />
							<Skeleton class="{placeholder} h-5 w-32" />
							<Skeleton class="{placeholder} h-3 w-48" />
						</Card.Header>
						<Card.Content class="flex justify-center gap-8">
							{#each { length: 3 } as _, i (i)}
								<div class="flex flex-col items-center gap-1">
									<Skeleton class="{placeholder} h-5 w-10" />
									<Skeleton class="{placeholder} h-3 w-14" />
								</div>
							{/each}
						</Card.Content>
					</Card.Root>

					<Card.Root>
						<Card.Content class="flex flex-col gap-4 pt-4">
							<Skeleton class="{placeholder} h-4 w-24" />
							<Separator />
							{#each { length: 4 } as _, i (i)}
								<div class="flex items-center justify-between">
									<Skeleton class="{placeholder} h-3 w-20" />
									<Skeleton class="{placeholder} h-3 w-32" />
								</div>
							{/each}
						</Card.Content>
					</Card.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Skeleton loader for chat messages">
		<!--
			demo 10: two incoming bubbles and one outgoing, each with a sender line
			and a timestamp, then the composer row. The squared-off corner (`rounded-tl-none` /
			`rounded-tr-none`) is what points a bubble at its speaker.
		-->
		<Card.Root>
			<Card.Content>
				<Card.Root class="w-full max-w-xs">
					<Card.Content class="flex flex-col gap-4">
						<div class="flex items-start gap-2.5">
							<Skeleton class="{placeholder} size-8 shrink-0 rounded-full" />
							<div class="flex flex-col gap-1">
								<Skeleton class="{placeholder} h-3 w-16" />
								<Skeleton class="{placeholder} h-16 w-48 rounded-lg rounded-tl-none" />
								<Skeleton class="{placeholder} h-2.5 w-12" />
							</div>
						</div>

						<div class="flex items-start justify-end gap-2.5">
							<div class="flex flex-col items-end gap-1">
								<Skeleton class="{placeholder} h-10 w-40 rounded-lg rounded-tr-none" />
								<Skeleton class="{placeholder} h-2.5 w-12" />
							</div>
						</div>

						<div class="flex items-start gap-2.5">
							<Skeleton class="{placeholder} size-8 shrink-0 rounded-full" />
							<div class="flex flex-col gap-1">
								<Skeleton class="{placeholder} h-3 w-20" />
								<Skeleton class="{placeholder} h-24 w-56 rounded-lg rounded-tl-none" />
								<Skeleton class="{placeholder} h-2.5 w-12" />
							</div>
						</div>

						<div class="flex items-center gap-2 pt-2">
							<Skeleton class="{placeholder} h-9 flex-1 rounded-md" />
							<Skeleton class="{placeholder} size-9 rounded-md" />
						</div>
					</Card.Content>
				</Card.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
