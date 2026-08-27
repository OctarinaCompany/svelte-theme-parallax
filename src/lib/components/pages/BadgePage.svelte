<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import XIcon from "@lucide/svelte/icons/x";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import { Badge, type BadgeVariant } from "$lib/components/ui/badge/index.js";
	import * as BadgeOverflow from "$lib/components/ui/badge-overflow/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { href } from "$lib/hooks/route.svelte.js";

	/**
	 * The Badge component page.
	 *
	 * The classic theme shows three families: solid `.text-bg-*`, the same set as `.rounded-pill`, and
	 * its own `.text-bg-*-subtle`.
	 */

	/**
	 * Geometry, overriding shadcn's Badge base. Every value below is one shadcn default that
	 * the classic theme contradicts, so none of them is redundant:
	 *
	 *   h-auto        the base pins `h-5`; the classic theme's height falls out of its em padding
	 *   rounded-md    the base is `rounded-4xl`, i.e. already a pill — the classic default
	 *                 badge is `border-radius` and the pill is an opt-in modifier
	 *   px/py [em]    `badge-padding-x: .5em` / `badge-padding-y: .33em`, deliberately in
	 *                 `em` so the box tracks the 76% font size below
	 *   text-[76%]    `badge-font-size: 76%` — a percentage in the classic theme too, so a badge
	 *                 inherits its context: 11.4px in 15px body copy, smaller inside `small`
	 *   font-normal   `badge-font-weight: font-weight-normal`; the base is `font-medium`
	 *   leading-none  the classic `.badge { line-height: 1 }`
	 *   align-middle  the reference stylesheet's single the classic framework override, `vertical-align: middle`
	 */
	const shape =
		"h-auto rounded-md px-[0.5em] py-[0.33em] align-middle text-[76%] leading-none font-normal";

	/** `.rounded-pill` — a fuller radius and `border-radius-pill-padding-x: .6em`. */
	const pill = "rounded-4xl px-[0.6em]";

	/**
	 * Solid badges. `.text-bg-{state}` is the classic framework's own helper: the full-strength theme
	 * colour as the ground, `color-contrast()` as the type.
	 *
	 * The mapping is the same one AlertPage documents at length, for the same reason — the
	 * two components read the identical `theme-colors` loop. In short: `--primary-foreground`
	 * and `--warning-foreground` are the two tokens that hold `color-contrast()`'s only two
	 * outputs (white and gray-900) and do NOT invert between modes, which `--background` /
	 * `--foreground` would.
	 *
	 * `secondary` carries the one inexact value in the set. The classic theme's `secondary` is
	 * `gray-700` (#6E84A3); `--muted-foreground` is exactly that in dark mode and one step
	 * lighter (#95AAC9) in light. See §4.1 of the theme notes for why `--secondary` itself
	 * could not be used.
	 */
	const solid = {
		Primary: "bg-primary text-primary-foreground",
		// `--background`, not `--primary-foreground`: the ground is the muted TYPE colour used as a
		// fill, so the ink that reads on it is the page, and the pair inverts correctly with the mode.
		Secondary: "bg-muted-foreground text-background",
		Success: "bg-success text-success-foreground",
		Danger: "bg-destructive text-destructive-foreground",
		Warning: "bg-warning text-warning-foreground",
		Info: "bg-info text-info-foreground",
		// The neutral pair, and the one place on this page a ground and its ink have to be
		// declared together. `--secondary` / `--foreground` invert between modes on their own,
		// so each takes the ink already solved FOR it — never `--primary-foreground`, which is
		// the ink for the brand fill and is a DARK value wherever the dark primary is a pastel.
		Light: "bg-secondary text-secondary-foreground",
		Dark: "bg-foreground text-background dark:bg-background dark:text-foreground",
	} as const;

	/**
	 * Subtle badges — a tint of each colour as the ground, with an ink solved against that tint.
	 *
	 * The five status names have a real `--{state}-subtle` token pair in `src/app.css`, so those
	 * rows are the Badge component's own `{state}-subtle` variants and carry no classes at all.
	 * Their type is the contrast-walked `--{state}-subtle-foreground` rather than the raw status
	 * colour, which is the rule `docs/CONVENTIONS.md` §3 states: the raw colour is a fill, not an
	 * ink on a tint, and pairing it with its own tint measured 1.5–4.4:1.
	 *
	 * THE THREE NEUTRALS — `secondary`, `light` and `dark` — have no `--*-subtle` token, because
	 * nothing else in the codebase needs one. They are written here as three steps of one ramp,
	 * `color-mix()`ing `--muted-foreground` into `--card` at 10 / 25 / 40%, with `--foreground`
	 * as the type. Promote any of them to a real token the moment a second consumer appears.
	 *
	 * WHICH TOKEN GETS MIXED is the whole of it, and it was wrong here before. The ground has to
	 * stay on the CARD's side of the lightness scale in both modes, or the ink solved for the card
	 * stops reading on it. `--muted-foreground` is a mid grey in both modes, so mixing it into
	 * `--card` nudges the ground toward grey and never past it. `--primary-foreground`, which
	 * these three used to mix, only looks like a neutral: it is the ink for the BRAND fill, so it
	 * is white where the primary is dark and near-black where the dark-mode primary is a pastel —
	 * which is how the Light and Dark chips came to be dark ink on a dark plate, at 1.2:1.
	 *
	 * The three steps also have to stay apart from each other and from the card behind them, which
	 * is what 10 / 25 / 40 buys: at 8% the light chip disappears into the card, and above 45% the
	 * dark chip stops reading as a tint at all.
	 *
	 * They are written out rather than generated from the percentage: Tailwind scans this file as
	 * TEXT, so a class assembled in a template literal compiles to nothing and the chip renders
	 * bare.
	 */
	const neutralSubtle = {
		light: "bg-[color-mix(in_srgb,var(--muted-foreground)_10%,var(--card))] text-foreground",
		mid: "bg-[color-mix(in_srgb,var(--muted-foreground)_25%,var(--card))] text-foreground",
		dark: "bg-[color-mix(in_srgb,var(--muted-foreground)_40%,var(--card))] text-foreground",
	} as const;

	const subtle: { label: string; variant?: BadgeVariant; class?: string }[] = [
		{ label: "Primary", variant: "primary-subtle" },
		{ label: "Secondary", class: neutralSubtle.mid },
		{ label: "Success", variant: "success-subtle" },
		{ label: "Info", variant: "info-subtle" },
		{ label: "Warning", variant: "warning-subtle" },
		{ label: "Danger", variant: "destructive-subtle" },
		{ label: "Light", class: neutralSubtle.light },
		{ label: "Dark", class: neutralSubtle.dark },
	];

	const solidEntries = Object.entries(solid);

	/**
	 * The list the overflow section measures.
	 *
	 * Long enough that a 280px row hides several of them at one line and fewer at two, which is
	 * the whole point of the demo — a shorter list would fit either way and show nothing.
	 */
	const overflowSkills = [
		"TypeScript",
		"Svelte",
		"Tailwind",
		"Vite",
		"Playwright",
		"PostgreSQL",
		"Docker",
		"Terraform",
	];
</script>

<DocPage title="Badge">
	{#snippet subtitle()}
		A small count and labeling component. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/badge"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<DocSection title="Basic">
		{#snippet blurb()}
			The eight contextual variants, then the same set as pills.
		{/snippet}
		<Card.Root>
			<!--
				`flex-wrap` with `gap-2` stands in for the classic theme's inline-block badges separated by
				whitespace: the source relies on the newline between two `<span>`s rendering as a
				space, which a formatted Svelte template does not guarantee.
			-->
			<Card.Content class="flex flex-wrap gap-2">
				{#each solidEntries as [label, variant] (label)}
					<Badge class="{shape} {variant}">{label}</Badge>
				{/each}
				{#each solidEntries as [label, variant] (label)}
					<Badge class="{shape} {pill} {variant}">{label}</Badge>
				{/each}
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Subtle">
		{#snippet blurb()}
			A tint of each status colour instead of the full-strength fill, with the ink walked up until
			it clears the contrast floor against that tint. Use them exactly like the solid badges above —
			on their own, as an <code class="text-[87.5%] text-primary">&lt;a&gt;</code>, or inside a
			<code class="text-[87.5%] text-primary">&lt;button&gt;</code>.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-wrap gap-2">
				{#each subtle as entry (entry.label)}
					<Badge variant={entry.variant} class="{shape} {entry.class ?? ''}">{entry.label}</Badge>
				{/each}
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		The sections from here down are the registry demo set. Unlike the two
		sections above, which restyle the component into the classic geometry with the
		`shape` recipe, these render the house Badge exactly as the registry ships it — pill
		radius, h-5, `text-xs font-medium` — because what they document is the component's own
		variant API rather than the classic look.

		Not every demo appears. The solid state set (demo 4/5/6: success/info/warning)
		is what the Basic section's contextual row already shows, and both the `{state}-outline`
		family (`c-badge-8` … `c-badge-12`) and its `{state}-light` family (`c-badge-13` …
		`c-badge-17`) map onto the `{state}-subtle` variants here — the soft family is this
		theme's one answer to both — which the Subtle section already renders in full. Repeating
		five swatches twice more would document the mapping, not the component.
	-->

	<DocSection title="Default badge">
		{#snippet blurb()}
			The component as it ships, no variant and no overrides — from here down the examples show the
			registry Badge rather than the restyling above.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 1 verbatim: the `default` variant is the implicit one. -->
				<Badge>Badge</Badge>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Secondary badge">
		<Card.Root>
			<Card.Content>
				<!--
					demo 2. Distinct from the Basic section's "Secondary", which paints
					the classic theme's `secondary` via `--muted-foreground`; this is the registry variant on
					the `--secondary` token itself.
				-->
				<Badge variant="secondary">Badge</Badge>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Destructive badge">
		{#snippet blurb()}
			A solid destructive badge is one option; the house variant keeps the registry's tinted wash
			with destructive type, so that is what renders here.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 3 asks for `bg-destructive text-white`. The house `destructive`
					variant is upstream registry API — the `/10` wash, not a solid — and registry
					components are not modified, so the demo adapts to it. The solid look, for
					anyone who wants it, is the Basic section's "Danger" recipe.
				-->
				<Badge variant="destructive">Badge</Badge>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Outline badge">
		<Card.Root>
			<Card.Content>
				<!-- demo 7: the neutral outline, `--border` ring with foreground type. -->
				<Badge variant="outline">Badge</Badge>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Badge size variations">
		{#snippet blurb()}
			The house Badge deliberately ships one size; the small and large steps here are drawn with
			utilities forming a three-step ramp.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-wrap items-center gap-2.5">
				<!--
					demo 18 wants a `size` axis (`sm` h-4.5 / `default` h-5 / `lg` h-5.5).
					The registry Badge has none and is not modified, so the outer steps are
					class overrides scaled around the house base (h-5 / px-2 / text-xs) —
					one spacing unit of height and half a unit of padding
					either side, with `sm` dropping to 0.625rem type.
				-->
				<Badge class="h-4.5 px-1.5 text-[0.625rem]">Small</Badge>
				<Badge>Default</Badge>
				<Badge class="h-5.5 px-2.5">Large</Badge>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Badge with full radius">
		{#snippet blurb()}
			A <code class="text-[87.5%] text-primary">radius="full"</code> opt-in is unnecessary: the house
			Badge is pill-radius by default, so these rows render with no radius prop at all.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col items-center gap-6">
				<!--
					demo 19. Two of its three axes collapse onto house defaults: `radius="full"`
					is the base `rounded-4xl`, and the `size` steps reuse the utility ramp the size
					section above derived (the registry Badge has no size axis). The variant row keeps
					outline and secondary; the light-badge idea maps to `success-subtle`, the
					soft family being this theme's one answer to it.
				-->
				<div class="flex items-center gap-2.5">
					<Badge class="h-4.5 px-1.5 text-[0.625rem]">3</Badge>
					<Badge>3</Badge>
					<Badge class="h-5.5 px-2.5">3</Badge>
				</div>
				<div class="flex items-center gap-2.5">
					<Badge class="h-4.5 px-1.5 text-[0.625rem]">New</Badge>
					<Badge>New</Badge>
					<Badge class="h-5.5 px-2.5">New</Badge>
				</div>
				<div class="flex items-center gap-2.5">
					<Badge variant="outline" class="h-4.5 px-1.5 text-[0.625rem]">New</Badge>
					<Badge variant="secondary">New</Badge>
					<Badge variant="success-subtle" class="h-5.5 px-2.5">New</Badge>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Badge with an icon">
		<Card.Root>
			<Card.Content>
				<!--
					demo 20, lucide check for its icon placeholder. The icon carries no sizing
					class — the Badge base pins direct-child svgs to `size-3`.
				-->
				<Badge variant="outline">
					<CheckIcon />
					Badge
				</Badge>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Badge with a dismiss button">
		<Card.Root>
			<Card.Content>
				<!--
					demo 21. The dismiss control is a real Button squeezed to `size-3`, exactly
					as upstream does it; the demo is presentational, so no state is wired. Upstream's
					plain `size="icon"` relies on its badge sizing every descendant svg — the house
					Badge only sizes direct children, so `icon-xs` supplies the `size-3` icon step
					instead. `hover:bg-transparent` mutes the ghost hover, which would paint a square
					muted block inside the pill. The `aria-label` is ours: an icon-only button
					otherwise has no accessible name.
				-->
				<Badge variant="outline" class="gap-0.5">
					Badge
					<Button
						variant="ghost"
						size="icon-xs"
						class="size-3 hover:bg-transparent"
						aria-label="Dismiss"
					>
						<XIcon />
					</Button>
				</Badge>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Badge with a status dot">
		<Card.Root>
			<Card.Content>
				<!--
					demo 22 asks for `info-light`; the soft family maps it to `info-subtle`.
					The dot is `bg-current`, so it takes the variant's type colour — swap the variant
					and the dot follows. Upstream's `rounded-full!` important flag fought its own base
					styles; nothing here competes, so the plain utility suffices.
				-->
				<Badge variant="info-subtle">
					<span class="ms-0.25 size-1.25 rounded-full bg-current"></span>
					Badge
				</Badge>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Badge rendered as a link">
		<Card.Root>
			<Card.Content>
				<!--
					demo 23 uses Radix `asChild` to swap the element; the house Badge already
					renders an `<a>` whenever `href` is set, so the prop is the whole port. The
					outline variant carries the `[a]:hover` muted wash, visible on hover here.
				-->
				<Badge variant="outline" href={href("/components/badge")}>Badge</Badge>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Badge with avatar">
		<Card.Root>
			<Card.Content>
				<!--
					demo 24. Upstream loads a stock portrait; this repository ships no
					images and fetches none (the Filters page records the rule), so the demo renders
					the fallback it already declared — `AL` initials, the same substitution the Alert
					and Button group pages make. The avatar keeps upstream's `size-3.5`, with the
					fallback type stepped down to fit; the dismiss button is the same adaptation as
					the dismiss section above.
				-->
				<Badge variant="outline">
					<Avatar.Root class="size-3.5">
						<Avatar.Fallback class="text-[8px]">AL</Avatar.Fallback>
					</Avatar.Root>
					Alex
					<Button
						variant="ghost"
						size="icon-xs"
						class="size-3 hover:bg-transparent"
						aria-label="Remove"
					>
						<XIcon />
					</Button>
				</Badge>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Badge with flag image">
		<Card.Root>
			<Card.Content>
				<!--
					demo 25 fetches `https://flagcdn.com/us.svg`. The no-images rule removes
					the fetch, and the Select page's country list is the precedent for what replaces
					it: the flag as emoji code points — text, loading nothing.
				-->
				<Badge variant="outline">
					<span aria-hidden="true">{"\u{1F1FA}\u{1F1F8}"}</span>
					USA
				</Badge>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Badge overflow">
		{#snippet blurb()}
			A row of badges that keeps to a fixed number of lines and counts what did not fit. The split
			is measured, not estimated: the component lays every badge out off-screen, reads the widths,
			and re-runs the pass whenever the container resizes or the list changes — so the same list
			gives a different <code class="text-[87.5%] text-primary">+n</code> at a different width.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-6">
				<!--
					The width is stated on the wrapper rather than left to the card. The container has
					to resolve to a definite width or there is nothing for the measurement pass to
					measure against, which is the component's own documented prerequisite.
				-->
				<div class="flex flex-col gap-2">
					<p class="text-xs text-muted-foreground">One line, 280px wide</p>
					<div class="w-[280px]">
						<BadgeOverflow.Root items={overflowSkills}>
							{#snippet badge(_item, label)}
								<Badge variant="secondary">{label}</Badge>
							{/snippet}
						</BadgeOverflow.Root>
					</div>
				</div>

				<div class="flex flex-col gap-2">
					<p class="text-xs text-muted-foreground">
						Two lines, same list, same width — fewer hidden
					</p>
					<div class="w-[280px]">
						<BadgeOverflow.Root items={overflowSkills} lineCount={2}>
							{#snippet badge(_item, label)}
								<Badge variant="secondary">{label}</Badge>
							{/snippet}
						</BadgeOverflow.Root>
					</div>
				</div>

				<div class="flex flex-col gap-2">
					<p class="text-xs text-muted-foreground">
						A counter of your own, through the overflow snippet
					</p>
					<div class="w-[280px]">
						<BadgeOverflow.Root items={overflowSkills}>
							{#snippet badge(_item, label)}
								<Badge variant="primary-subtle">{label}</Badge>
							{/snippet}
							{#snippet overflow(count)}
								<Badge variant="outline">{count} more</Badge>
							{/snippet}
						</BadgeOverflow.Root>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
