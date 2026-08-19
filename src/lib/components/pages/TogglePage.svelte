<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Toggle } from "$lib/components/ui/toggle/index.js";
	import BookmarkIcon from "@lucide/svelte/icons/bookmark";
	import ItalicIcon from "@lucide/svelte/icons/italic";
	import UnderlineIcon from "@lucide/svelte/icons/underline";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import BellIcon from "@lucide/svelte/icons/bell";
	import BoldIcon from "@lucide/svelte/icons/bold";
	import BookmarkCheckIcon from "@lucide/svelte/icons/bookmark-check";
	import HeartIcon from "@lucide/svelte/icons/heart";
	import PinIcon from "@lucide/svelte/icons/pin";
	import Repeat2Icon from "@lucide/svelte/icons/repeat-2";
	import Share2Icon from "@lucide/svelte/icons/share-2";
	import StrikethroughIcon from "@lucide/svelte/icons/strikethrough";
	import Volume2Icon from "@lucide/svelte/icons/volume-2";
	import VolumeOffIcon from "@lucide/svelte/icons/volume-off";

	/**
	 * The Toggle component page, ported from the shadcn-svelte documentation
	 * (https://shadcn-svelte.com/docs/components/toggle) — six demos: the bookmark hero,
	 * then Outline, With Text, Small, Large and Disabled.
	 *
	 * WHAT THE CLASSIC THEME HAS. A two-state button exists in the classic framework as `.btn-check` (a visually
	 * hidden radio or checkbox) followed by a `.btn` label, and the classic theme documents exactly one
	 * of them: the reference docs line 3337, a `.btn-group-toggle` holding three
	 * `.btn.btn-white` labels. So the classic toggle IS a button — same `input-btn-*`
	 * geometry, same `.btn-white` surface — with one extra rule for the pressed state in
	 * the reference stylesheet:
	 *
	 *   .btn-group-toggle .btn-check:checked + .btn-white {
	 *     background-color: input-bg;                 // white
	 *     border-color: input-focus-border-color;     // var(--bs-primary)
	 *     box-shadow: none;
	 *     color: var(--bs-primary);
	 *   }
	 *
	 * and a dark-mode override that moves the ground to `gray-700-dark` (#1E3A5C) while
	 * keeping the primary border and the primary type.
	 *
	 * WHAT THE CLASSIC THEME DOES NOT HAVE. A borderless toggle. Every classic toggle is a full `.btn`
	 * with a ground and a border, so shadcn's `default` variant — transparent, no border,
	 * `hover:bg-muted` — has no counterpart at all. The demos that use it keep shadcn's own
	 * ground and take only the classic geometry; the `outline` demos get the full `.btn-white`
	 * treatment, because that is literally the control the classic theme ships. The one half of the
	 * checked rule that carries onto the borderless variant is `color: var(--bs-primary)`,
	 * since the other two declarations describe a surface the variant does not draw.
	 *
	 * The values below are the ones the Buttons page already derived from `input-btn-*` and
	 * `.btn-white`, restated here rather than re-derived, so the two pages cannot drift.
	 *
	 * ICONS. The classic theme's toggle example uses Feather (`fe-check-circle`); this codebase uses
	 * Lucide, Feather's maintained successor, as documented at length on the Buttons page.
	 * The icons are NOT marked `data-icon="inline-start"`: that attribute triggers the
	 * primitive's own `has-data-[icon=inline-start]:pl-2`, which is a higher-specificity
	 * selector than a plain `px-*` utility and would quietly cut `btn-padding-x` from 12px to
	 * 8px. The classic theme changes no padding when a button contains an icon (the reference stylesheet styles the
	 * glyph, never its host), so the attribute is left off and the padding stands.
	 */

	/**
	 * Geometry, per size — the same three lines as the Buttons page, since a toggle in the classic theme
	 * is a `.btn`. Heights are `input-btn-*` resolved rather than guessed:
	 *
	 *   base  15px x 1.5 line-height + 2 x .5rem padding + 2 x 1px border = 40.5px -> h-10
	 *   lg    15px x 1.5             + 2 x .75rem        + 2px           = 48.5px -> h-12
	 *   sm    13px x 1.75            + 2 x .125rem       + 2px           = 28.75px — the reference; rendered at the ramp's `--control-h-sm` (32px, the divergence `app.css` records)
	 *
	 * `sm` is shorter than it looks because `btn-line-height-sm` is `line-height-sm` (1.75),
	 * not the base 1.5. `font-normal` is `btn-font-weight: font-weight-normal` against
	 * shadcn's `font-medium`, and the radii are `border-radius-{sm,,lg}` — the classic framework changes
	 * the corner with the size.
	 *
	 * The primitive's `min-w-9` / `min-w-8` / `min-w-10` are left in place because they never
	 * bind: at `btn-padding-x` an icon-only toggle already measures 12 + 16 + 12 + 2 = 42px
	 * at the base size, wider than the 40px height, so the floor is never the widest constraint.
	 */
	const size = {
		lg: "h-12 rounded-lg px-5 text-sm font-normal",
		base: "h-10 rounded-md px-3 text-sm font-normal",
		sm: "h-(--control-h-sm) rounded-sm px-2 text-xs font-normal",
	} as const;

	/**
	 * The chrome every `.btn` carries, whatever its variant.
	 *
	 *   shadow-none   the compiled `.btn` declares `--bs-btn-box-shadow` and then never uses
	 *                 it: `enable-shadows` is off, so no `box-shadow` property is emitted.
	 *                 shadcn's `outline` variant adds `shadow-xs`, which has to go
	 *   transition    `.btn` transitions `color, background-color, border-color, box-shadow`
	 *                 at `.15s ease-in-out`; shadcn narrows that to `[color,box-shadow]`, which
	 *                 would make the checked ground and border snap instead of fade. Tailwind's
	 *                 default duration is already 150ms, so only the property list and the
	 *                 timing function need restating
	 *   opacity-65    `--bs-btn-disabled-opacity: 0.65` against shadcn's `opacity-50`
	 *
	 * NOT ported: `input-btn-focus-box-shadow: none`, which switches the focus ring off for
	 * every button, reinforced by `.btn-group-toggle .btn-white:focus { box-shadow: none }`.
	 * The classic theme leaves a keyboard user with no focus indicator on a toggle at all, so shadcn's
	 * `focus-visible:ring-[3px]` is kept — the same trade the Buttons and Radio group pages
	 * make, and the opposite of the one the form controls make, where `.form-control:focus`
	 * still recolours the border.
	 */
	const chrome =
		"shadow-none transition-[color,background-color,border-color,box-shadow] ease-in-out disabled:opacity-65";

	/**
	 * `.btn-white` — the classic theme's answer to the classic `light` variant not working over light
	 * grounds, and the surface its own toggle example uses.
	 *
	 *   bg-card              `--bs-btn-bg: var(--bs-white)`; `--card` is `white` / `gray-800-dark`
	 *   text-card-foreground `--bs-btn-color` is the body colour in light and `white` in dark,
	 *                        which `--card-foreground` holds exactly in both
	 *   hover:bg-accent      `--bs-btn-hover-bg: var(--bs-gray-100)`; `--accent` is #F9FBFD, exact
	 *   dark:hover:bg-background  the dark override moves that hover to `black` (#12263F),
	 *                        which is `--background` in dark, exact
	 *   hover:border-input   `--bs-btn-hover-border-color` is `gray-400` (#D2DDEC) in light and
	 *                        `gray-700-dark` (#1E3A5C) in dark — and `--input` carries exactly
	 *                        those two values, so this one is exact in both modes
	 *
	 * The REST border is the single inexact value, as on the Buttons page: the classic theme asks for
	 * `gray-300` (#E3EBF6) in light and `gray-600-dark` (#244166) in dark, and `--border`
	 * holds `gray-200` and `gray-700-dark`. Neither grey has a token, and writing the hex
	 * would break the "semantic tokens, never raw colours" rule. `border-border` also evicts
	 * the `border-input` the `outline` variant ships, which is a step too dark in light mode.
	 */
	const white =
		"border-border bg-card text-card-foreground hover:border-input hover:bg-accent dark:hover:bg-background";

	/**
	 * `color: var(--bs-primary)` from the checked rule — the only half of it that means anything
	 * without a surface underneath, so it is applied to both variants.
	 *
	 * `aria-pressed:` rather than `data-[state=on]:`, even though bits-ui emits both. The
	 * primitive's base already carries `aria-pressed:bg-muted`; a `data-[state=on]:` override
	 * sits in a different tailwind-merge group, so BOTH would survive the merge and the winner
	 * would be decided by Tailwind's sort order. Same-modifier classes are merged properly.
	 *
	 * The `aria-pressed:hover:` half is stated explicitly for the same kind of reason: on its
	 * own, `aria-pressed:text-primary` and the base's `hover:text-foreground` have identical
	 * specificity. The classic framework resolves that tie by source order — `.btn-check:checked + .btn-white`
	 * is written after `.btn:hover` — and the compound variant states it instead of relying on it.
	 */
	const checkedType = "aria-pressed:text-primary aria-pressed:hover:text-primary";

	/**
	 * The other two declarations of the same rule, which need `.btn-white` under them.
	 *
	 *   border-ring   `border-color: input-focus-border-color`, and `--ring` is the token that
	 *                 variable was ported to; both resolve to #2C7BE5 in both modes
	 *   bg-card       `background-color: input-bg` = `white`, i.e. the button's own ground —
	 *                 The classic theme's checked toggle does NOT change fill in light mode
	 *   dark:bg-secondary  the dark block DOES change it, to `var(--bs-gray-700-dark)` (#1E3A5C),
	 *                 which `--secondary` holds exactly in dark
	 */
	const checkedSurface =
		"aria-pressed:border-ring aria-pressed:hover:border-ring aria-pressed:bg-card aria-pressed:hover:bg-card dark:aria-pressed:bg-secondary dark:aria-pressed:hover:bg-secondary";

	/**
	 * The hero demo fills the bookmark glyph when pressed. The docs write `fill-blue-500`;
	 * `--primary` is the classic theme's `primary` (#2C7BE5) and is what the checked rule types with, so
	 * the fill takes the token and the stroke comes free from {@link checkedType}.
	 */
	const pressedFill = "aria-pressed:*:[svg]:fill-primary";

	/*
	 * The sections below the shadcn six are the toggle demo set. They reuse the
	 * recipes above unchanged — the `default`/`outline` variants are the same two
	 * shadcn variants the top of this file already translated, so every demo toggle is just
	 * `{size.*} {chrome}` plus `{white} {checkedSurface}` when it is an outline one.
	 */

	// demo 1 boots with `defaultPressed` on the bold toggle; a bound $state makes
	// that initial press explicit instead of relying on an unbound bindable's fallback.
	let toggleBasicBoldPressed = $state(true);

	// demo 7 — the count badge renders only while the toggle is unpressed.
	let toggleNotificationsPressed = $state(false);

	// demo 10 — the label and the glyph both follow the pressed state.
	let toggleBookmarkSaved = $state(false);

	// demo 11 — four independent reaction toggles, each nudging its own count.
	let toggleReactionLiked = $state(false);
	let toggleReactionRetweeted = $state(false);
	let toggleReactionShared = $state(false);
	let toggleReactionBookmarked = $state(false);

	// demo 14 — muted swaps both the speaker glyph and the label.
	let toggleMuted = $state(false);
</script>

<DocPage title="Toggle">
	{#snippet subtitle()}
		A two-state button that can be either on or off. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/toggle"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<!--
				`size="sm"` and `variant="outline"` are kept from the docs: the prop names the step,
				and the class supplies the classic theme's numbers for it.
			-->
			<Toggle
				aria-label="Toggle bookmark"
				size="sm"
				variant="outline"
				class="{size.sm} {chrome} {white} {checkedType} {checkedSurface} {pressedFill}"
			>
				<BookmarkIcon />
				Bookmark
			</Toggle>
		</Card.Content>
	</Card.Root>

	<DocSection title="Outline">
		{#snippet blurb()}
			The variant that maps onto the classic theme's own toggle: a
			<code class="text-[87.5%] text-primary">.btn-white</code> label driven by a hidden
			<code class="text-[87.5%] text-primary">.btn-check</code>, which turns its border and its type
			primary once pressed.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Toggle
					variant="outline"
					aria-label="Toggle italic"
					class="{size.base} {chrome} {white} {checkedType} {checkedSurface}"
				>
					<ItalicIcon />
				</Toggle>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With Text">
		{#snippet blurb()}
			An icon and a label in the same toggle.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					The gap between the two needs nothing: the classic theme's markup separates the glyph from
					the label with a literal space, which at the 15px body size is roughly 3.75px, and
					the primitive's `gap-1` is 4px.

					The default variant is the borderless one classic has no equivalent for, so it
					keeps shadcn's transparent ground and its `aria-pressed:bg-muted` fill.
				-->
				<Toggle aria-label="Toggle italic" class="{size.base} {chrome} {checkedType}">
					<ItalicIcon />
					Italic
				</Toggle>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Small">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">.btn-sm</code>, where a .125rem padding and a 1.75
			line height make a 28.75px control.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Toggle size="sm" aria-label="Toggle italic" class="{size.sm} {chrome} {checkedType}">
					<ItalicIcon />
				</Toggle>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Large">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">.btn-lg</code>, where the padding grows to .75rem and
			the corner to the large radius.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Toggle size="lg" aria-label="Toggle italic" class="{size.lg} {chrome} {checkedType}">
					<ItalicIcon />
				</Toggle>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Disabled">
		{#snippet blurb()}
			The classic framework dims a disabled button to 0.65, where shadcn dims to 0.5.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`disabled:pointer-events-none` in the primitive's base is already the classic
					`.btn:disabled { pointer-events: none }`, so only the opacity differs.
				-->
				<Toggle aria-label="Toggle underline" disabled class="{size.base} {chrome} {checkedType}">
					<UnderlineIcon />
				</Toggle>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Basic toggle">
		{#snippet blurb()}
			Three borderless formatting toggles, the first one pressed from the start.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 1 — the default variant keeps shadcn's transparent ground. -->
				<div class="flex flex-wrap items-center gap-2">
					<Toggle
						aria-label="Toggle bold"
						bind:pressed={toggleBasicBoldPressed}
						class="{size.base} {chrome} {checkedType}"
					>
						<BoldIcon />
					</Toggle>
					<Toggle aria-label="Toggle italic" class="{size.base} {chrome} {checkedType}">
						<ItalicIcon />
					</Toggle>
					<Toggle aria-label="Toggle underline" class="{size.base} {chrome} {checkedType}">
						<UnderlineIcon />
					</Toggle>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Toggle with button and icon">
		{#snippet blurb()}
			A toggle next to the button it is built on, at rest visually identical — only the pressed
			state tells them apart.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 4 pairs a Button and a Toggle to show they share one geometry. The
					registry Button takes the same the classic theme `.btn-white` classes at the use site that
					this page already derived for the outline toggle, so the pair lines up here too:
					Button's internal `cn()` lets the class prop evict its own conflicting utilities.
					Radix's `size="icon"` (a square) becomes the toggle's own base square, `size-10`.
				-->
				<div class="flex flex-col gap-4">
					<div class="flex items-center gap-2">
						<Button variant="outline" size="sm" class="{size.sm} {chrome} {white}">Button</Button>
						<Toggle
							variant="outline"
							size="sm"
							aria-label="Small toggle"
							class="{size.sm} {chrome} {white} {checkedType} {checkedSurface}"
						>
							Toggle
						</Toggle>
					</div>
					<div class="flex items-center gap-2">
						<Button
							variant="outline"
							size="icon"
							aria-label="Bold button"
							class="size-10 rounded-md font-normal {chrome} {white}"
						>
							<BoldIcon />
						</Button>
						<Toggle
							variant="outline"
							aria-label="Toggle bold icon"
							class="{size.base} {chrome} {white} {checkedType} {checkedSurface}"
						>
							<BoldIcon />
						</Toggle>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Toggle with notification count badge">
		{#snippet blurb()}
			The unread count sits on the bell until the toggle is pressed.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 7 floats a `size="xs"` destructive Badge over the bell. The house
					Badge has no size ramp — it is a fixed h-5 pill — so the extra-small circle is
					cut at the use site (`h-4 min-w-4 px-1`), and the destructive look is the house
					subtle wash rather than a solid red, per the status vocabulary.
				-->
				<Toggle
					aria-label="Toggle notifications"
					bind:pressed={toggleNotificationsPressed}
					class="{size.base} {chrome} {checkedType}"
				>
					<div class="relative">
						<BellIcon />
						{#if !toggleNotificationsPressed}
							<Badge
								variant="destructive"
								class="absolute -top-2 -right-2 h-4 min-w-4 rounded-full px-1"
							>
								3
							</Badge>
						{/if}
					</div>
				</Toggle>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Toggle with icon swap on press">
		{#snippet blurb()}
			The heart fills once pressed.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 9 re-renders the same HeartIcon with `fill-current` when pressed.
					The same outline is drawn either way, so no branch is needed: the hero's
					{@link pressedFill} recipe fills the glyph from the toggle's pressed state, and
					{@link checkedType} colours it primary — which is also what `fill-current`
					resolves to once the pressed type is primary.
				-->
				<Toggle
					aria-label="Toggle favorite"
					class="{size.base} {chrome} {checkedType} {pressedFill}"
				>
					<HeartIcon />
				</Toggle>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Toggle with text label that changes">
		{#snippet blurb()}
			Both the glyph and the label answer the pressed state.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 10 — the ternary icon-and-label swap becomes an {#if}. The pressed
					branch swaps to a different glyph (BookmarkCheck), so this one genuinely needs
					the branch that the heart demo above could avoid.
				-->
				<Toggle
					variant="outline"
					aria-label="Toggle bookmark"
					bind:pressed={toggleBookmarkSaved}
					class="{size.base} {chrome} {white} {checkedType} {checkedSurface} {pressedFill}"
				>
					{#if toggleBookmarkSaved}
						<BookmarkCheckIcon />
						Bookmarked
					{:else}
						<BookmarkIcon />
						Bookmark
					{/if}
				</Toggle>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Social media reaction toggles">
		{#snippet blurb()}
			Four independent reactions, each incrementing its own count while pressed.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 11 — the counts are the demo's own numbers, +1 while pressed. -->
				<div class="flex flex-wrap items-center gap-2">
					<Toggle
						variant="outline"
						aria-label="Like"
						bind:pressed={toggleReactionLiked}
						class="{size.base} {chrome} {white} {checkedType} {checkedSurface}"
					>
						<HeartIcon />
						{toggleReactionLiked ? 13 : 12}
					</Toggle>
					<Toggle
						variant="outline"
						aria-label="Retweet"
						bind:pressed={toggleReactionRetweeted}
						class="{size.base} {chrome} {white} {checkedType} {checkedSurface}"
					>
						<Repeat2Icon />
						{toggleReactionRetweeted ? 6 : 5}
					</Toggle>
					<Toggle
						variant="outline"
						aria-label="Share"
						bind:pressed={toggleReactionShared}
						class="{size.base} {chrome} {white} {checkedType} {checkedSurface}"
					>
						<Share2Icon />
						{toggleReactionShared ? 4 : 3}
					</Toggle>
					<Toggle
						variant="outline"
						aria-label="Bookmark"
						bind:pressed={toggleReactionBookmarked}
						class="{size.base} {chrome} {white} {checkedType} {checkedSurface}"
					>
						<BookmarkIcon />
						{toggleReactionBookmarked ? 9 : 8}
					</Toggle>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Toggle with tooltip">
		{#snippet blurb()}
			An icon-only toggle whose label lives in a tooltip.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 12 — Radix's `asChild` on the trigger becomes the `child` snippet,
					spreading the trigger props onto the toggle; the Buttons page set the precedent.
				-->
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Toggle
									variant="outline"
									{...props}
									aria-label="Pin to sidebar"
									class="{size.base} {chrome} {white} {checkedType} {checkedSurface}"
								>
									<PinIcon />
								</Toggle>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content>Pin to sidebar</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Disabled toggle states">
		{#snippet blurb()}
			The enabled/disabled matrix across both variants — the classic 0.65 dim either way.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 13 — enabled default, enabled outline, then their disabled twins. -->
				<div class="flex flex-wrap items-center gap-2">
					<Toggle aria-label="Enabled default" class="{size.base} {chrome} {checkedType}">
						<BoldIcon />
					</Toggle>
					<Toggle
						variant="outline"
						aria-label="Enabled outline"
						class="{size.base} {chrome} {white} {checkedType} {checkedSurface}"
					>
						<ItalicIcon />
					</Toggle>
					<Toggle disabled aria-label="Disabled default" class="{size.base} {chrome} {checkedType}">
						<UnderlineIcon />
					</Toggle>
					<Toggle
						variant="outline"
						disabled
						aria-label="Disabled outline"
						class="{size.base} {chrome} {white} {checkedType} {checkedSurface}"
					>
						<StrikethroughIcon />
					</Toggle>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Toggle as mute/unmute button">
		{#snippet blurb()}
			A large outline toggle wearing the state it controls.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 14 — `size="lg"` takes the classic theme's `.btn-lg` numbers. -->
				<Toggle
					size="lg"
					variant="outline"
					aria-label="Toggle mute"
					bind:pressed={toggleMuted}
					class="{size.lg} {chrome} {white} {checkedType} {checkedSurface}"
				>
					{#if toggleMuted}
						<VolumeOffIcon />
						Muted
					{:else}
						<Volume2Icon />
						Sound
					{/if}
				</Toggle>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
