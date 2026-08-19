<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import XIcon from "@lucide/svelte/icons/x";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import { Badge, type BadgeVariant } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

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
		Secondary: "bg-muted-foreground text-primary-foreground",
		Success: "bg-success text-success-foreground",
		Danger: "bg-destructive text-destructive-foreground",
		Warning: "bg-warning text-warning-foreground",
		Info: "bg-info text-info-foreground",
		Light: "bg-secondary text-warning-foreground dark:bg-card dark:text-primary-foreground",
		Dark: "bg-foreground text-primary-foreground dark:bg-background",
	} as const;

	/**
	 * Subtle badges — the classic theme's `.text-bg-{state}-subtle` is `background-color:
	 * var(--bs-{state}-bg-subtle)` with the FULL-STRENGTH colour as the type. The five states
	 * whose `--*-subtle` token exists in app.css are the Badge component's own `{state}-subtle`
	 * variants now (the classic theme's `danger` spells `destructive-subtle` there), so those rows carry a
	 * `variant` and no classes at all — and since 2026-08-11 the variant departs from the source
	 * on ONE deliberate axis: the type is the contrast-walked `--{state}-subtle-foreground`
	 * rather than the raw colour, because the raw pairing measured 1.5-4.4:1 (app.css §status
	 * tokens has the numbers and the derivation).
	 *
	 * THE OTHER THREE remain the documented exception, page-local as before. `secondary`,
	 * `light` and `dark` have no `--*-subtle` token here, because
	 * nothing else in this codebase uses them. They are written with `color-mix()` instead,
	 * which is the literal CSS translation of the Sass that produced the five tokens:
	 *
	 *   bg-subtle:      shift-color(value,  80%) = mix(white, value, 80%)
	 *   bg-subtle-dark: shift-color(value, -55%) = mix(black, value, 55%)
	 *
	 * so `color-mix(in srgb, X 20%, white)` and `color-mix(in srgb, X 45%, black)` reproduce
	 * them exactly — `--primary-subtle` checks out against #D5E5FA and #143767. Promote any of
	 * the three to a real token the moment a second consumer appears.
	 *
	 * WHICH COLOUR GETS SHIFTED, for the neutral pair, is the one thing on this page that is easy
	 * to get wrong — and was wrong here first. The classic theme's compiled grounds are #FBFCFE/#6B6D70 for
	 * `light` and #D0D4D9/#08111C for `dark`, and those are NOT derived from the classic theme's `light`
	 * (#EDF2F9 / #152E4D) at all: the theme overrides the base colours but never regenerates
	 * their subtle derivatives, so the classic framework's own #F8F9FA and #212529 are what got shifted.
	 *
	 * Shifting the classic theme's `light` instead — the first attempt here — collapses in dark mode:
	 * `--card` at 45% black is #09141F, near-black, where the classic theme shows a mid grey, and it lands
	 * within one unit of the `dark` badge beside it, so the two render as the same swatch.
	 *
	 * `--primary-foreground` is the fix, and it is not a trick: it holds `white` in BOTH modes,
	 * which is what the classic `light` is a hair off. It reproduces #6B6D70 as #737373 in dark
	 * and #FBFCFE as #FFFFFF in light. `dark` needs no such care — `--foreground` in light and
	 * `--background` in dark are both `dark` exactly, and land on #D0D4D9 and #081119.
	 *
	 * THE TYPE IS THE COLOUR ITSELF, including where that reads badly. `.text-bg-*-subtle` sets
	 * `color: var(--bs-{state})` for all eight, and for the two neutrals that colour is a
	 * near-white or a near-black sitting on a ground shifted from the same value: #EDF2F9 on
	 * #FBFCFE in light, #152E4D on #6B6D70 and #12263F on #08111C in dark. All three are close
	 * to invisible, and all three are what the theme ships.
	 *
	 * An earlier version of this page "fixed" them, on the reasoning that classic patched the
	 * identical problem on the SOLID badge (the reference stylesheet ends with a dark-mode block forcing
	 * `.text-bg-light` to white) and simply forgot the subtle pair. That reasoning was wrong to
	 * act on: a port that quietly repairs its source stops being a reference for what the source
	 * does. The tokens are the exact ones — `light` is `--secondary` in light and `--card` in
	 * dark, `dark` is `--foreground` in light and `--background` in dark — so anyone who does
	 * want the legible variant can see precisely what to change.
	 */
	const subtle: { label: string; variant?: BadgeVariant; class?: string }[] = [
		{ label: "Primary", variant: "primary-subtle" },
		{
			label: "Secondary",
			class:
				"bg-[color-mix(in_srgb,var(--muted-foreground)_20%,white)] text-muted-foreground dark:bg-[color-mix(in_srgb,var(--muted-foreground)_45%,black)]",
		},
		{ label: "Success", variant: "success-subtle" },
		{ label: "Info", variant: "info-subtle" },
		{ label: "Warning", variant: "warning-subtle" },
		{ label: "Danger", variant: "destructive-subtle" },
		{
			label: "Light",
			class:
				"bg-[color-mix(in_srgb,var(--primary-foreground)_20%,white)] text-secondary dark:bg-[color-mix(in_srgb,var(--primary-foreground)_45%,black)] dark:text-card",
		},
		{
			label: "Dark",
			class:
				"bg-[color-mix(in_srgb,var(--foreground)_20%,white)] text-foreground dark:bg-[color-mix(in_srgb,var(--background)_45%,black)] dark:text-background",
		},
	];

	const solidEntries = Object.entries(solid);
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
			Creates a subtle variant of a corresponding contextual badge variation. These can be used
			exactly like the classic core badges, including modifying classes like
			<code class="text-[87.5%] text-primary">rounded-pill</code>, as an
			<code class="text-[87.5%] text-primary">&lt;a&gt;</code> itself, or inside of
			<code class="text-[87.5%] text-primary">&lt;button&gt;</code> or
			<code class="text-[87.5%] text-primary">&lt;a&gt;</code> elements.
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
				<Badge variant="outline" href="#/components/badge">Badge</Badge>
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
</DocPage>
