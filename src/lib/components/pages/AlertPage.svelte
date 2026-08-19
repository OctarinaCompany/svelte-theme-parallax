<script lang="ts">
	import * as Alert from "$lib/components/ui/alert/index.js";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Frame from "$lib/components/ui/frame/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Progress } from "$lib/components/ui/progress/index.js";
	import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
	import CheckCheckIcon from "@lucide/svelte/icons/check-check";
	import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
	import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
	import CreditCardIcon from "@lucide/svelte/icons/credit-card";
	import DatabaseIcon from "@lucide/svelte/icons/database";
	import FileExclamationPointIcon from "@lucide/svelte/icons/file-exclamation-point";
	import GlobeIcon from "@lucide/svelte/icons/globe";
	import InfoIcon from "@lucide/svelte/icons/info";
	import LightbulbIcon from "@lucide/svelte/icons/lightbulb";
	import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
	import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
	import ShieldCheckIcon from "@lucide/svelte/icons/shield-check";
	import TriangleAlertIcon from "@lucide/svelte/icons/triangle-alert";
	import UploadIcon from "@lucide/svelte/icons/upload";
	import UserCheckIcon from "@lucide/svelte/icons/user-check";
	import UserRoundXIcon from "@lucide/svelte/icons/user-round-x";
	import XIcon from "@lucide/svelte/icons/x";
	import ZapIcon from "@lucide/svelte/icons/zap";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Alert component page. It has TWO upstreams, and they disagree about what an alert
	 * looks like — which is the most interesting thing on the page, so it is stated first.
	 *
	 * §1 is the classic theme's own documentation: eight solid
	 * bands, one per theme colour. Everything after it is the composition gallery — thirty examples in the
	 * order that page numbers them.
	 *
	 * The two are not rival ports of one component. The classic theme answers "what does an `.alert`
	 * look like in this theme"; the gallery answers "what can you *build* out of the shadcn
	 * Alert" — an upload progress card, a mention with a task bar, a left-edge status
	 * indicator. Only its last thirteen (§5–§7) overlap the classic theme's question, and there the two
	 * disagree on purpose: §7 is the classic theme's answer, and §5/§6 are the gallery's.
	 */

	/**
	 * WHAT THE GALLERY BATCH COST THE THEME.
	 *
	 * The gallery composes primitives this repository already has — Alert, Avatar, Button, Progress. One
	 * thing genuinely needed deciding, and it needed deciding twenty-two times.
	 *
	 * IT PAINTS WITH RAW TAILWIND PALETTE COLOURS — seventy-six occurrences across thirteen of the
	 * thirty. `sky-600 / dark:sky-400` for info, `green-600 / dark:green-400` for success,
	 * `amber-600 / dark:amber-400` for warning; `--destructive` and `--primary` are the only two
	 * statuses it reaches for by token. §12 of the theme notes forbids that here (it is the
	 * reason the grey ramp was never registered as Tailwind colours), so every one of them
	 * becomes the token that means the same thing:
	 *
	 *   sky → --info      green → --success      amber → --warning
	 *
	 * That is not a cosmetic substitution, it is the whole point of the page: painted in tokens,
	 * all thirty follow the palette picker and both modes for free. Painted in `sky-600` they
	 * would stay the same blue under every theme.
	 *
	 * THE `dark:` HALVES DISAPPEAR WITH IT. Upstream needs `sky-600 dark:sky-400` because a
	 * -600 step is too dark on a dark ground. The four status tokens here are FIXED across
	 * modes (§5 of the theme notes — `success` is `#00D97E` in both), so `text-info` alone is
	 * the whole declaration and a `dark:` variant would be a second name for the same colour.
	 * The generated palettes do vary theirs per mode, and the token still resolves correctly.
	 *
	 * `bg-{status}/10` BECOMES `bg-{status}-subtle`. Upstream tints its soft alerts with a 10%
	 * wash of the status colour. The classic theme has a real token for that ground and §5 of the theme
	 * notes calls the `-subtle` ground plus full-strength type "the dominant classic-theme pattern";
	 * §16 records the same substitution already being made for the reference implementation's Status component,
	 * which also shipped `bg-{state}/10`. Two spellings of one idea is one too many.
	 *
	 * `border-none` BECOMES `border-transparent`, for the reason §1 already gives below: the
	 * box keeps its 1px size, so a soft alert and a bordered one are the same height in the
	 * same stack.
	 *
	 * THE STATUS TYPE ON THE BARE CARD IS LOW-CONTRAST, AND THAT IS REPRODUCED RATHER THAN
	 * CORRECTED. §5's coloured-border alerts put `text-{status}` on the card itself, where the
	 * four measure `--destructive` 4.2:1, `--info` 2.6:1, `--success` 1.9:1 and `--warning`
	 * 1.6:1 in light mode. That is the colour's own contrast on white — nothing a variant can
	 * fix without changing the status tokens themselves — and §16's divergence table has the
	 * standing rule for cases like it: reproduce, do not invent a colour to paper over a gap.
	 *
	 * THE SOFT FAMILY IS THE OPPOSITE CASE, corrected on 2026-08-11: `-subtle` grounds now
	 * carry a dedicated contrast-walked `-subtle-foreground` ink (4.5:1 even for the 80%
	 * description, 5.9-7.6:1 at full strength, both modes) instead of the raw status colour,
	 * which measured 1.5-4.4:1. The correction is a token the whole soft family shares, not a
	 * page-local repaint; app.css §status tokens holds the derivation.
	 *
	 * ONE PAIRING IS DELIBERATELY *NOT* REPRODUCED, and it is the one upstream gets wrong:
	 * §7's solid warning is white on `amber-600` upstream, which measures 3.2:1 in light and
	 * 1.7:1 on `amber-400` in dark. `--warning-foreground` is `gray-900`, because the classic
	 * `color-contrast()` resolves it against the yellow ground — 6.7:1 on `--warning`, in both
	 * modes. The token already holds the right answer, so using it is both the faithful move
	 * and the legible one.
	 *
	 * NO PHOTOGRAPHS. §2 and §9 of the gallery batch want a remote
	 * avatar. This repository ships no images and fetches none — `dashboard.ts`
	 * records the same for its own avatars — so both render `Avatar.Fallback` initials, which
	 * is what every other avatar in this app does.
	 *
	 * DISMISSED ALERTS COME BACK. Four of the thirty can be closed, and upstream's close is
	 * final until a reload. Four demos that a stray click blanks for good is a defect on a
	 * documentation page, so each leaves a Restore button in its place — the same answer
	 * `BannerPage` already gives for its own dismissible banner. §1 is left alone: it is a port
	 * of the classic theme's page, where dismissal really is final, and it has two of them rather than
	 * four.
	 */

	/* ---------------------------------------------------------------------------------------
	 * §1 — the classic theme
	 * ------------------------------------------------------------------------------------ */

	/**
	 * The load-bearing fact: **the classic theme's alerts are solid, not subtle.** The classic framework ships
	 * tinted alerts (`*-bg-subtle` ground, `*-text-emphasis` type), and the reference stylesheet
	 * regenerates every variant to override them —
	 *
	 *   @each $state, value in theme-colors {
	 *     .alert-#{$state} {
	 *       --bs-alert-bg: var(--bs-#{$state});
	 *       --bs-alert-color: #{color-contrast(value)};
	 *     }
	 *   }
	 *
	 * — so the ground is the full-strength theme colour and the type is whatever
	 * `color-contrast()` picks against it. Both rulesets survive into the compiled bundle;
	 * the classic theme's wins on source order. Porting the subtle version would look like the classic framework,
	 * not like the classic theme.
	 */

	/**
	 * Geometry shared by every alert in §1. `px-5 py-3` is `alert-padding-x` /
	 * `alert-padding-y` (1.25rem / 0.75rem) against the component's own `px-4 py-3`, and
	 * `rounded-md` is `alert-border-radius` = `border-radius` — the component defaults to
	 * `rounded-lg`, which is the card radius here. The classic theme sets the border to the same colour
	 * as the ground, so it is transparent rather than removed: the box keeps its 1px size.
	 */
	const shape = "rounded-md border-transparent px-5 py-3";

	/**
	 * Ground and type per variant, from the compiled bundle.
	 *
	 * TYPE COLOUR. `color-contrast()` has exactly two outcomes in this theme — `white` for
	 * every variant but one, and `gray-900` for `warning` (and for `light` in light mode).
	 * Both already exist as tokens that are FIXED across modes: `--primary-foreground` holds
	 * `white`, `--warning-foreground` holds `gray-900`. That fixedness is the whole point:
	 * an earlier version used `--background` / `--foreground`, which invert, and silently
	 * turned the secondary alert's white type navy in dark mode.
	 *
	 * Where a variant carries its own `-foreground` token (primary, success, destructive, info)
	 * that one is used, since it means the same thing and reads better.
	 *
	 * GROUNDS. Three need care, two of them via a `dark:` variant because no single token
	 * holds the value in both modes:
	 *
	 * - `dark` is `dark` = `black` (#12263F), and the reference stylesheet does NOT override
	 *   `dark` — it stays navy in dark mode. `bg-foreground` alone would invert to white
	 *   there, so it is pinned with `dark:bg-background`, the same #12263F.
	 * - `light` is `light` = gray-200 in light and `light-dark` = `gray-800-dark` in dark.
	 *   `--secondary` is exactly the first, `--card` exactly the second. Its type splits the
	 *   same way: `gray-900` in light, `white` in dark.
	 * - `secondary` is the one the palette port cannot fully reproduce. The classic theme's
	 *   `secondary` is `gray-700` (#6E84A3), but §4.1 of the theme notes deliberately
	 *   mapped `--secondary` to the *surface* role because that is what shadcn means by the
	 *   name. `--muted-foreground` lands on #6E84A3 exactly in DARK mode and on #95AAC9 —
	 *   one step lighter — in light. Writing the hex would break the "semantic tokens, never
	 *   raw colours" house rule, so the light-mode step stands.
	 */
	const variants = {
		primary: "bg-primary text-primary-foreground",
		secondary: "bg-muted-foreground text-primary-foreground",
		success: "bg-success text-success-foreground",
		destructive: "bg-destructive text-destructive-foreground",
		warning: "bg-warning text-warning-foreground",
		info: "bg-info text-info-foreground",
		light: "bg-secondary text-warning-foreground dark:bg-card dark:text-primary-foreground",
		dark: "bg-foreground text-primary-foreground dark:bg-background",
	} as const;

	/**
	 * The dismiss button, shared by both upstreams. The pointer cursor comes from the reboot
	 * rule restored in `@layer base` of app.css, so it is not repeated here.
	 *
	 * The opacity pair is `btn-close-opacity` / `btn-close-hover-opacity` (0.5 / 0.75).
	 * The gallery's own close buttons carry no treatment at all beyond a cursor, so they
	 * take the classic theme's — one page, one dismiss control.
	 *
	 * `size-5` is NOT in here, because §1's two sit in `items-center` rows and are already
	 * glyph-sized. §2's four sit in rows that default to `items-stretch`, so without a size the
	 * button grows to the alert's full content height — measured at 115px on the update alert —
	 * and leaves a full-height invisible dismiss strip down the right edge. Each of those four
	 * writes `size-5` at its call site, which is also where upstream puts it on two of them.
	 * The glyph then lands top-right, where this component's own `Alert.Action` part places an
	 * action (`absolute top-2.5 right-3`).
	 */
	const closeButton = "shrink-0 opacity-50 transition-opacity hover:opacity-75";

	/* ---------------------------------------------------------------------------------------
	 * §2–§7 — the composition gallery
	 * ------------------------------------------------------------------------------------ */

	/*
	 * The soft and solid status recipes this page used to define locally are now the Alert
	 * component's own `{state}-subtle` and `solid-{state}` variants — promoted verbatim,
	 * including the /80 description tint, so the call sites below carry a `variant` prop and
	 * nothing else. §1's classic-theme geometry maps above stay page-local: they document the
	 * classic-framework port, not the component API.
	 */

	/**
	 * Every dismissible alert on the page, keyed so each closes independently. The first two
	 * keys are §1's; the last four are §2's, and those four are the ones {@link restore} brings
	 * back.
	 */
	let dismissed = $state<Record<string, boolean>>({});

	/**
	 * The two progress bars in §2 animate in from zero, which is the only reason upstream
	 * reaches for `useEffect` — the indicator carries `transition-all`, so a value set after
	 * the first paint slides rather than appears. One effect covers both: it has no reactive
	 * dependencies, so it runs once on mount, and the cleanup drops the timer if the page is
	 * navigated away from inside those 100ms.
	 */
	let uploadProgress = $state(0);
	let taskProgress = $state(0);

	$effect(() => {
		const timer = setTimeout(() => {
			uploadProgress = 50;
			taskProgress = 50;
		}, 100);

		return () => clearTimeout(timer);
	});

	/* ---------------------------------------------------------------------------------------
	 * §8 onward — the action-slot demo set
	 * ------------------------------------------------------------------------------------ */

	/**
	 * A THIRD DEMO SET, AND THE ONLY ONE THAT SHIPS AN ACTION SLOT.
	 *
	 * The sections from here on are
	 * appended rather than merged into the run above: eight of the twenty are the same
	 * status alert the "Soft" section already renders, and what the rest add is genuinely new here —
	 * the `Alert.Action` corner, an alert nested inside a `Frame` panel, and an inverted surface.
	 *
	 * WHAT THE SIX APPEARANCES MAP ONTO. The set's alert has six variants against this one's
	 * eleven, and four of the six are one idea: `border-{state}/30 bg-{state}/4` with the icon tinted
	 * and the type left neutral. That is the soft family, so `info` / `success` / `warning` /
	 * `destructive` all become `{state}-subtle` — any `error`-flavoured wording included, since
	 * the negative status is `destructive` here and nowhere `error`.
	 *
	 * The one thing the substitution changes is how far the colour reaches: the six-variant set
	 * tints only the icon,
	 * where `{state}-subtle` tints title and description too. The house soft pairing is a whole
	 * coloured block — it is what the badges do 126 times and what the "Soft" section renders — so
	 * matching the house is the right side to fall on, and a page that spelled the narrower
	 * version out in classes would put two soft alerts with different rules on one page.
	 *
	 * The sixth, `invert`, has no counterpart at all and is handled by {@link invertSurface}.
	 *
	 * NO RAW PALETTE COLOURS, as everywhere else here: three icons that suggest raw yellow and
	 * emerald, and one hand-tinted blue button, all become
	 * `--warning`, `--success` and the plain primary button.
	 *
	 * THE BUTTON RAMP NEEDS NO ADAPTING. The demos ask for `xs` (h-6), which the repository has;
	 * the one place a demo reaches past the ramp — an
	 * ad-hoc `h-7` on a Retry button — drops back onto it.
	 */

	/**
	 * `Alert.Action` is `absolute top-2.5 right-3`, and the alert reserves room for it with
	 * `has-data-[slot=alert-action]:pr-18` — 72px, which fits one short button. A third grid
	 * COLUMN would never have to size that gap; with the absolute corner, the
	 * reservation has to be widened per call site, or a long title runs under the buttons.
	 *
	 * The variant prefix is repeated verbatim rather than written as a bare `pr-*`: tailwind-merge
	 * pairs classes by modifier as well as by group, so only the identical spelling REPLACES the
	 * base's reservation instead of stacking beside it and losing on specificity. §2's fourth
	 * composition documents the same trap for `*:[svg]:translate-y-0`.
	 */
	const actionGutter = {
		/** One `xs` button, up to about the width of "Renew Now". */
		one: "has-data-[slot=alert-action]:pr-24",
		/** Two `xs` buttons — the Dismiss/Update pair four demos repeat. */
		two: "has-data-[slot=alert-action]:pr-32",
	} as const;

	/**
	 * The sixth appearance, `invert`: a surface that swaps
	 * with the mode so the alert reads as the page's negative.
	 *
	 * The house Alert carries the classic theme's two status families — `{state}-subtle` soft and
	 * `solid-{state}` solid — and nothing that means this, so the recipe stays on the page rather
	 * than becoming a twelfth variant on a component the CLI regenerates.
	 *
	 * `--foreground` / `--background` are exactly the inverting pair the idea needs: navy type
	 * on white becomes white type on navy. That is deliberately NOT §1's `dark` band, which pins
	 * itself with `dark:bg-background` because the classic `dark` does not flip — this one is
	 * supposed to.
	 *
	 * The description tint is spelled the way the component's own variants spell theirs, so it beats
	 * the description part's `text-muted-foreground` on the same terms.
	 */
	const invertSurface =
		"border-transparent bg-foreground text-background *:data-[slot=alert-description]:text-background/70";

	/**
	 * Dismissal state for the appendix sections, kept apart from §1/§2's {@link dismissed} so the two
	 * runs cannot collide on a key. Only the controls upstream labels as a dismissal are wired —
	 * "Verify", "Renew Now" and "Retry" are actions, not closes, and are left as affordances.
	 */
	let demoDismissed = $state<Record<string, boolean>>({});
</script>

<!--
	Stands in for a closed alert in §2, so the section keeps its shape and the demo is not lost
	to a stray click. See the header comment for why §1 has no equivalent.
-->
{#snippet restore(key: string)}
	<!-- `self-start`: the card content is now a stretch-aligned flex column, and without it the
	     button would widen to the full column width the alert it stands in for had. -->
	<Button variant="outline" size="sm" class="self-start" onclick={() => (dismissed[key] = false)}>
		<RotateCcwIcon data-icon="inline-start" />
		Restore
	</Button>
{/snippet}

<!--
	The same stand-in for the appendix sections, on their own state. It replaces the whole example —
	frame included, where there is one — because a Restore button rattling around inside an
	otherwise empty `Frame.Panel` documents the panel's padding rather than the alert.
-->
{#snippet demoRestore(key: string)}
	<Button variant="outline" size="sm" onclick={() => (demoDismissed[key] = false)}>
		<RotateCcwIcon data-icon="inline-start" />
		Restore
	</Button>
{/snippet}

<DocPage title="Alert">
	{#snippet subtitle()}
		A status-coloured message block for contextual feedback on what the user just did. It is the
		inline member of Feedback: a bordered block rendered in the flow where it is written, carrying
		no dismiss control of its own — Banner is the full-width strip a queue pins over the viewport,
		and Sonner the stack of toasts that clears itself. The first section is the classic set; the
		rest are thirty gallery examples, repainted in this theme's tokens. See the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/alert"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for the component's own API.
	{/snippet}

	<DocSection title="The classic contextual variants">
		{#snippet blurb()}
			One solid band per theme colour, with the type <code>color-contrast()</code> picks against it
			— the classic theme regenerates every classic <code>.alert-*</code> to override the tinted defaults.
		{/snippet}

		<!--
			The classic theme stacks the examples inside a plain `.card > .card-body`. `gap-6` is
			`alert-margin-bottom` (1.5rem) applied between them rather than after each, so the
			card does not gain a trailing gap.
		-->
		<Card.Root>
			<Card.Content class="flex flex-col gap-6">
				<Alert.Root class="{shape} {variants.primary}">
					New in this release: saved views can now be shared.
				</Alert.Root>

				<Alert.Root class="{shape} {variants.secondary}">
					Weekly digests are paused while your status is away.
				</Alert.Root>

				<!-- The long-form variant: heading, body, divider, body. -->
				<Alert.Root class="{shape} {variants.success}">
					<Alert.Title class="text-sm font-medium">Backup complete</Alert.Title>
					<Alert.Description class="text-current">
						Every file in this workspace was copied to the archive without a single conflict. This
						sentence runs a little longer on purpose, so the alert wraps and the spacing inside a
						multi-line message can be judged.
						<!--
							The classic theme darkens the ground by 5% for the rule (`hr { color: darken(value, 5%) }`).
							Measured on the classic theme's own page, that resolves to rgb(0, 192, 111) against the
							#00D97E ground — a darker GREEN, not a black tint, which is what
							`border-black/10` gave here before the page was measured.

							`darken()` is an HSL operation with no CSS equivalent, so the 88/12 srgb mix
							stands in: it lands on #00BF6F against the classic theme's #00C06F.
						-->
						<hr class="my-4 border-[color-mix(in_srgb,var(--success)_88%,black)]" />
						<span class="block">
							Below the rule, a second block shows how separated content sits on the same band.
						</span>
					</Alert.Description>
				</Alert.Root>

				{#if !dismissed.destructive}
					<Alert.Root
						class="{shape} {variants.destructive} flex items-center justify-between gap-4"
					>
						<span
							><strong class="font-semibold">Payment failed.</strong> The button on the right dismisses
							this alert.</span
						>
						<button
							type="button"
							aria-label="Close"
							class={closeButton}
							onclick={() => (dismissed.destructive = true)}
						>
							<XIcon class="size-4" />
						</button>
					</Alert.Root>
				{/if}

				{#if !dismissed.warning}
					<Alert.Root class="{shape} {variants.warning} flex items-center justify-between gap-4">
						<span
							><strong class="font-semibold">Storage almost full.</strong> Navy type is what keeps this
							yellow band legible.</span
						>
						<button
							type="button"
							aria-label="Close"
							class={closeButton}
							onclick={() => (dismissed.warning = true)}
						>
							<XIcon class="size-4" />
						</button>
					</Alert.Root>
				{/if}

				<Alert.Root class="{shape} {variants.info}">
					You are viewing a read-only preview of this document.
				</Alert.Root>

				<Alert.Root class="{shape} {variants.light}">
					This quiet band borrows the page's own grey surface.
				</Alert.Root>

				<Alert.Root class="{shape} {variants.dark}">
					This band stays navy in dark mode, on purpose.
				</Alert.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Compositions">
		{#snippet blurb()}
			The gallery's first ten (<code>alert-01</code> … <code>alert-10</code>). These are the ones
			that put things <em>inside</em> the alert — an avatar, a progress bar, a pair of buttons — rather
			than restyling its surface.
		{/snippet}

		<Card.Root>
			<Card.Content class="flex flex-col gap-6">
				<!--
					01. The component with nothing added. `grid-cols-[auto_1fr]` and the `row-span-2` on
					the icon come from the base recipe, so an icon and a title need no layout classes.
				-->
				<Alert.Root>
					<CircleAlertIcon />
					<Alert.Title>New message!</Alert.Title>
				</Alert.Root>

				<!--
					02. `flex` beats the base `grid` through `cn()`'s tailwind-merge — same property
					group, later wins — which is how every composition below escapes the two-column
					grid.

					Upstream wraps the text in `flex-1 flex-col justify-center gap-1` WITHOUT `flex`, so
					three of those four classes are inert, and it repeats that wrapper five times — here
					and in 03, 07, 08 and 09. Only the `flex-1` is ever doing anything, and only in two
					of the five: here and in 03 the wrapper is a direct child of the row-flex
					`Alert.Root`, so it is kept and written alone. In 07, 08 and 09 the same wrapper
					sits inside a `flex flex-1 flex-col` of its own, where growing along an auto-height
					column buys nothing, so it carries no class at all.

					THE AVATAR NEEDS ITS `after:` HALF. `Avatar.Root` draws a 1px hairline as
					`after:rounded-full after:border`, and tailwind-merge keys `rounded-*` and
					`after:rounded-*` into different groups — so `rounded-sm` alone squares the box and
					leaves a CIRCLE inscribed in it, visible in dark mode where `--border` and `--muted`
					differ. `PageHeadersPage` and `ListGroupPage` pair the two for the same reason.

					The initials replace upstream's remote photograph — see the header.
				-->
				<Alert.Root class="flex items-center justify-between">
					<Avatar.Root class="rounded-sm after:rounded-sm">
						<Avatar.Fallback class="rounded-sm text-xs">HR</Avatar.Fallback>
					</Avatar.Root>
					<div class="flex-1">
						<Alert.Title>Sara has replied on the uploaded image.</Alert.Title>
						<Alert.Description>12 unread messages. Tap to see.</Alert.Description>
					</div>
					<CircleAlertIcon />
				</Alert.Root>

				<!-- 03. The first of the four dismissible ones. -->
				{#if dismissed.closable}
					{@render restore("closable")}
				{:else}
					<Alert.Root class="flex justify-between">
						<CircleAlertIcon />
						<div class="flex-1">
							<Alert.Title>New message!</Alert.Title>
							<Alert.Description>12 unread messages. Tap to see.</Alert.Description>
						</div>
						<button
							type="button"
							aria-label="Close"
							class="{closeButton} size-5"
							onclick={() => (dismissed.closable = true)}
						>
							<XIcon class="size-5" />
						</button>
					</Alert.Root>
				{/if}

				<!--
					04. An outlined info alert whose action is a link.

					TWO THINGS ARE SPELLED DELIBERATELY.

					`*:[svg]:translate-y-0` cancels the base's `*:[svg]:translate-y-0.5`, which exists to
					drop an icon onto the first line of a two-line grid and is 2px of misalignment in a
					centred flex row. Upstream writes the cancellation as `[&>svg]:translate-y-0` — a
					DIFFERENT variant spelling for the same selector, which tailwind-merge cannot pair
					with the base, so both would survive and CSS source order would settle it. Matching
					the base's spelling exactly is what makes the override deterministic.

					`href` is this page's own route, not `#`. The router reads `location.hash`, so a bare
					`#` empties it and navigates to the home page — §16 of the theme notes records the
					same trap for the classic theme's `href="#!"` demo links.
				-->
				<Alert.Root
					class="flex items-center justify-between border-info text-info *:[svg]:translate-y-0"
				>
					<CircleAlertIcon />
					<Alert.Title class="flex-1">New message!</Alert.Title>
					<Button
						variant="outline"
						size="sm"
						href="#/components/alert"
						class="border-info bg-transparent text-info hover:bg-info/10 hover:text-info focus-visible:border-info focus-visible:ring-info/20 dark:border-info dark:bg-transparent dark:hover:bg-info/10"
					>
						Link
						<ArrowRightIcon />
					</Button>
				</Alert.Root>

				<!--
					05. The icon detaches into its own tinted panel. `p-0` clears the base's `px-4 py-3`
					so the panel can reach the alert's edges, and each half puts its padding back.
				-->
				<Alert.Root class="flex items-stretch p-0">
					<div
						class="flex items-center rounded-l-lg border-r bg-destructive-subtle p-2 text-destructive-subtle-foreground"
					>
						<FileExclamationPointIcon class="size-4" />
					</div>
					<Alert.Title class="p-3">This file contains virus!</Alert.Title>
				</Alert.Root>

				<!--
					06. The same icon, focused instead of attached: a solid destructive tile built out of
					`Avatar.Fallback`.

					The icon needs `size-4` written out. The base sizes only DIRECT child svgs
					(`*:[svg]:…`), and this one is two levels down.

					Upstream softens the tile to `dark:bg-destructive/60` because its own destructive is
					too hot on a dark ground. `--destructive` is #E63757 in both modes here, so the dark
					half is dropped rather than translated.
				-->
				<Alert.Root class="flex items-center gap-3">
					<Avatar.Root class="rounded-md after:rounded-md">
						<Avatar.Fallback class="rounded-md bg-destructive text-destructive-foreground">
							<FileExclamationPointIcon class="size-4" />
						</Avatar.Fallback>
					</Avatar.Root>
					<Alert.Title>This file contains virus!</Alert.Title>
				</Alert.Root>

				<!--
					07. Upload progress.

					`*:bg-info` repaints the bar's indicator, which ships `bg-primary`; the track takes
					the soft ground, where upstream uses a 20% wash.

					Cancel is wired to the same dismissal as the ✕ — upstream leaves it inert, and a
					button that does nothing is a defect rather than fidelity. "Upload another" keeps
					upstream's `disabled`, which is honest: it says "not yet" instead of lying.
				-->
				{#if dismissed.upload}
					{@render restore("upload")}
				{:else}
					<Alert.Root class="flex justify-between">
						<UploadIcon />
						<div class="flex flex-1 flex-col gap-4">
							<div>
								<Alert.Title>Uploading your ‘Img-234.png’</Alert.Title>
								<Alert.Description>Please wait while we upload your image.</Alert.Description>
							</div>
							<Progress
								value={uploadProgress}
								class="bg-info-subtle *:bg-info"
								aria-label="Upload progress"
							/>
							<div class="flex items-center gap-4">
								<Button variant="ghost" size="sm" onclick={() => (dismissed.upload = true)}>
									Cancel
								</Button>
								<Button
									variant="ghost"
									size="sm"
									disabled
									class="text-info hover:bg-info/10 hover:text-info"
								>
									Upload another
								</Button>
							</div>
						</div>
						<button
							type="button"
							aria-label="Close"
							class="{closeButton} size-5"
							onclick={() => (dismissed.upload = true)}
						>
							<XIcon class="size-5" />
						</button>
					</Alert.Root>
				{/if}

				<!--
					08. Two actions on a solid primary ground.

					UPSTREAM'S BUTTONS ARE `--secondary`, AND THAT TOKEN CANNOT BE USED HERE. §4.1 of
					the theme notes maps `--secondary` to the quiet-SURFACE role, so it is #EDF2F9 in
					light and #1E3A5C in dark — it inverts, and on a fixed blue ground the pair would
					read as a white chip in one mode and a navy one in the other. That is mistake #2 of
					§16 exactly.

					`--primary-foreground` is white in both modes, and it is already the type colour on
					this ground, so the two buttons are built from it: a translucent wash for the quiet
					action, the full white for the committing one.
				-->
				{#if dismissed.update}
					{@render restore("update")}
				{:else}
					<Alert.Root variant="solid-primary" class="flex justify-between">
						<CircleAlertIcon />
						<div class="flex flex-1 flex-col gap-4">
							<div>
								<Alert.Title>A new update is available</Alert.Title>
								<Alert.Description>
									Includes the new dashboard view. Pages and exports will now load faster.
								</Alert.Description>
							</div>
							<div class="flex items-center gap-4">
								<Button
									size="sm"
									class="bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
								>
									Skip this update
								</Button>
								<Button
									size="sm"
									class="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
								>
									Install now
								</Button>
							</div>
						</div>
						<button
							type="button"
							aria-label="Close"
							class="{closeButton} size-5"
							onclick={() => (dismissed.update = true)}
						>
							<XIcon class="size-5" />
						</button>
					</Alert.Root>
				{/if}

				<!-- 09. A mention with a task bar. Initials again, and the warning ramp on the bar. -->
				<Alert.Root class="flex gap-3">
					<Avatar.Root class="rounded-sm after:rounded-sm">
						<Avatar.Fallback class="rounded-sm text-xs">HR</Avatar.Fallback>
					</Avatar.Root>
					<div class="flex flex-1 flex-col gap-2">
						<div>
							<Alert.Title>@Rocky</Alert.Title>
							<Alert.Description>
								This project’s task is still open, and the deadline is near.
							</Alert.Description>
						</div>
						<Progress
							value={taskProgress}
							class="bg-warning-subtle *:bg-warning"
							aria-label="Task progress"
						/>
					</div>
				</Alert.Root>

				<!--
					10. The gradient one, and the only example that reaches for colour and still needed no
					substitution — it is already written in `--accent` / `--accent-foreground`.

					`bg-linear-to-b` is Tailwind v4's name for upstream's `bg-gradient-to-b`. It sets
					`background-image`, a different property group from the variant's `bg-card`, so
					tailwind-merge keeps BOTH and the card ground shows through beneath the wash — which
					is what upstream renders too.

					Expect it to be quiet: `--accent` is the page background in light (#F9FBFD on a white
					card) and the muted surface in dark. A gradient between two neighbouring surfaces is
					the effect, not a bug in the theme.
				-->
				{#if dismissed.verify}
					{@render restore("verify")}
				{:else}
					<Alert.Root
						class="flex justify-between border-accent-foreground/20 bg-linear-to-b from-accent to-transparent to-60% text-accent-foreground"
					>
						<CircleAlertIcon />
						<div class="flex flex-1 flex-col gap-1">
							<Alert.Title>Verify your email to activate your account</Alert.Title>
							<Alert.Description class="text-accent-foreground/60">
								We’ve sent a confirmation link to your inbox. Check your email to complete the
								sign-up.
							</Alert.Description>
						</div>
						<button
							type="button"
							aria-label="Close"
							class="{closeButton} size-5"
							onclick={() => (dismissed.verify = true)}
						>
							<XIcon class="size-5" />
						</button>
					</Alert.Root>
				{/if}
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Indicator">
		{#snippet blurb()}
			<code>alert-11</code> and <code>alert-12</code>: the status moves to a 6px bar on the left
			edge. The second drops the radius and the other three borders entirely, which is the shape for
			an alert pinned flush inside a panel.
		{/snippet}

		<Card.Root>
			<Card.Content class="flex flex-col gap-6">
				<!--
					11. `border-l-6` and the base's `border` sit in different tailwind-merge groups
					(`border-w-l` against `border-w`), so both survive — a 1px outline all round plus a
					6px bar on the left. The colour is one group, so the variant's `border-transparent`
					loses to the `border-success` merged after it, and the outline is green rather than
					invisible. That is upstream's rendering.
				-->
				<Alert.Root variant="success-subtle" class="rounded-md border-l-6 border-success">
					<UserCheckIcon />
					<Alert.Title>Your request to join the team is approved.</Alert.Title>
				</Alert.Root>

				<!-- 12. Same idea with the box opened up: no radius, no border except the bar. -->
				<Alert.Root
					variant="destructive-subtle"
					class="rounded-none border-0 border-l-6 border-destructive"
				>
					<UserRoundXIcon />
					<Alert.Title>Your request to join the team is denied.</Alert.Title>
				</Alert.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="The component as it ships">
		{#snippet blurb()}
			<code>alert-13</code> … <code>alert-17</code>: five that ask nothing of the palette — an
			action button, the component's own <code>destructive</code> variant with and without a matching
			border, the alert with no icon, and the alert with a description.
		{/snippet}

		<Card.Root>
			<Card.Content class="flex flex-col gap-6">
				<!-- 13. The same centred-row cancellation as 04, without the colour. -->
				<Alert.Root class="flex items-center justify-between *:[svg]:translate-y-0">
					<CircleAlertIcon />
					<Alert.Title class="flex-1">New message!</Alert.Title>
					<Button variant="outline" size="sm">Open</Button>
				</Alert.Root>

				<!--
					14. `variant="destructive"` as the component ships it: red type on the card ground,
					with the ordinary `--border` outline.
				-->
				<Alert.Root variant="destructive">
					<TriangleAlertIcon />
					<Alert.Title>Something went wrong!</Alert.Title>
				</Alert.Root>

				<!-- 15. The same variant with the outline brought up to match the type. -->
				<Alert.Root variant="destructive" class="border-destructive">
					<TriangleAlertIcon />
					<Alert.Title>Unable to process your payment.</Alert.Title>
				</Alert.Root>

				<!-- 16. No icon: the base's `has-[>svg]:` rules simply do not fire. -->
				<Alert.Root>
					<Alert.Title>New message!</Alert.Title>
				</Alert.Root>

				<!-- 17. Title and description, the two-line default. -->
				<Alert.Root>
					<CircleAlertIcon />
					<Alert.Title>Creating your account</Alert.Title>
					<Alert.Description>Fill in your details to get started.</Alert.Description>
				</Alert.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Outline">
		{#snippet blurb()}
			<code>alert-18</code> … <code>alert-20</code>: the card ground kept, the status carried by the
			border and the type. The description drops to 80% of the same colour rather than to
			<code>--muted-foreground</code>, so the block reads as one object.
		{/snippet}

		<Card.Root>
			<Card.Content class="flex flex-col gap-6">
				<Alert.Root class="border-info text-info">
					<CircleAlertIcon />
					<Alert.Title>Verify your email to activate your account</Alert.Title>
					<Alert.Description class="text-info/80">
						We’ve sent a confirmation link to your inbox. Check your email to complete the sign-up.
					</Alert.Description>
				</Alert.Root>

				<Alert.Root class="border-success text-success">
					<CheckCheckIcon />
					<Alert.Title>Account created successfully</Alert.Title>
					<Alert.Description class="text-success/80">
						You are all set! You can now log in and start exploring your dashboard.
					</Alert.Description>
				</Alert.Root>

				<!--
					All three rows are below AA in light mode — info 2.6:1, success 1.9:1 and this one
					1.6:1, #F6C343 type on a near-white card. Reproduced rather than corrected: see the
					header comment, and §17.3 of the theme notes for why a tint cannot fix it.
				-->
				<Alert.Root class="border-warning text-warning">
					<CircleAlertIcon />
					<Alert.Title>Your password is too weak</Alert.Title>
					<Alert.Description class="text-warning/80">
						Try using a mix of uppercase letters, numbers, and symbols for better security.
					</Alert.Description>
				</Alert.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Soft">
		{#snippet blurb()}
			<code>alert-21</code> … <code>alert-25</code>: the <code>-subtle</code> ground under its
			contrast-walked <code>-subtle-foreground</code> ink — the soft pairing every status surface
			shares. The first keeps the default type, as upstream does, because
			<code>--primary</code> is a brand colour rather than a status.
		{/snippet}

		<Card.Root>
			<Card.Content class="flex flex-col gap-6">
				<Alert.Root class="border-transparent bg-primary-subtle">
					<CircleAlertIcon />
					<Alert.Title>File should be PDF, DOCX, JPG, or PNG.</Alert.Title>
					<Alert.Description>
						If the file type is not one of these we can’t accept your upload.
					</Alert.Description>
				</Alert.Root>

				<Alert.Root variant="info-subtle">
					<CircleAlertIcon />
					<Alert.Title>Only certain file types are allowed</Alert.Title>
					<Alert.Description>
						You can upload PDF, DOCX, JPG, or PNG files up to 20MB.
					</Alert.Description>
				</Alert.Root>

				<Alert.Root variant="success-subtle">
					<CheckCheckIcon />
					<Alert.Title>File uploaded successfully</Alert.Title>
					<Alert.Description>
						Your document has been saved and is now available in your files.
					</Alert.Description>
				</Alert.Root>

				<Alert.Root variant="warning-subtle">
					<CircleAlertIcon />
					<Alert.Title>This file might be too large</Alert.Title>
					<Alert.Description>
						Uploading large files may take longer or fail. Consider compressing it first.
					</Alert.Description>
				</Alert.Root>

				<Alert.Root variant="destructive-subtle">
					<TriangleAlertIcon />
					<Alert.Title>Upload failed</Alert.Title>
					<Alert.Description>
						Something went wrong. Please try again or use a different file format.
					</Alert.Description>
				</Alert.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Solid">
		{#snippet blurb()}
			<code>alert-26</code> … <code>alert-30</code>: the full-strength fill, which is where the
			gallery and the classic theme finally agree — this is the same object as the first section,
			composed rather than reskinned. The warning row is the one place the theme improves on
			upstream: <code>--warning-foreground</code> is navy, where upstream sets white on amber.
		{/snippet}

		<Card.Root>
			<Card.Content class="flex flex-col gap-6">
				<Alert.Root variant="solid-primary">
					<CircleAlertIcon />
					<Alert.Title>Editing your profile</Alert.Title>
					<Alert.Description>Changes won’t be saved until you click “Update.”</Alert.Description>
				</Alert.Root>

				<Alert.Root variant="solid-success">
					<CheckCheckIcon />
					<Alert.Title>Profile updated</Alert.Title>
					<Alert.Description>Your changes have been saved successfully.</Alert.Description>
				</Alert.Root>

				<Alert.Root variant="solid-warning">
					<CircleAlertIcon />
					<Alert.Title>Some details are missing</Alert.Title>
					<Alert.Description>Complete your profile to get the best experience.</Alert.Description>
				</Alert.Root>

				<Alert.Root variant="solid-info">
					<CircleAlertIcon />
					<Alert.Title>Your profile is visible</Alert.Title>
					<Alert.Description>Anyone can view your basic information.</Alert.Description>
				</Alert.Root>

				<Alert.Root variant="solid-destructive">
					<TriangleAlertIcon />
					<Alert.Title>Couldn’t save changes</Alert.Title>
					<Alert.Description>Please try again or reload the page.</Alert.Description>
				</Alert.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Alert with icon and action buttons">
		{#snippet blurb()}
			<code>demo 3</code>, and the first thing on this page to use the component's own
			<code>Alert.Action</code> part: the controls are pinned to the alert's top-right corner instead
			of being laid out in the flow, so the message keeps the full width of its column.
		{/snippet}

		<Card.Root>
			<Card.Content>
				<!--
					`Alert.Action` positions itself and nothing else, so the row of buttons is arranged
					here — `flex gap-1.5`. The gutter
					const explains why the reservation is restated rather than nudged.
				-->
				{#if demoDismissed.security}
					{@render demoRestore("security")}
				{:else}
					<Alert.Root class={actionGutter.two}>
						<ShieldCheckIcon />
						<Alert.Title>Security Update</Alert.Title>
						<Alert.Description>Update your password and enable 2FA.</Alert.Description>
						<Alert.Action class="flex gap-1.5">
							<Button variant="outline" size="xs" onclick={() => (demoDismissed.security = true)}>
								Dismiss
							</Button>
							<Button size="xs">Update</Button>
						</Alert.Action>
					</Alert.Root>
				{/if}
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Destructive alert with icon and action buttons">
		{#snippet blurb()}
			<code>demo 4</code>. Upstream's title promises buttons; what the example actually shows is a
			description carrying a list, which is the more useful thing to document — the description part
			takes arbitrary block content, not just a string.
		{/snippet}

		<Card.Root>
			<Card.Content>
				<!--
					Upstream separates the paragraph from the list with `mt-1` and re-declares `text-sm` on
					the list. Neither is needed: `Alert.Description` already sizes its own text, and its
					`[&_p:not(:last-child)]:mb-4` rule spaces a paragraph that is followed by anything —
					adding the margin back on top would double it.
				-->
				<Alert.Root variant="destructive-subtle">
					<CircleAlertIcon />
					<Alert.Title>Payment Failed</Alert.Title>
					<Alert.Description>
						<p>Please check your payment details:</p>
						<ul class="flex list-inside list-disc flex-col gap-0.5">
							<li>Card number and expiry</li>
							<li>Billing address</li>
							<li>Available funds</li>
						</ul>
					</Alert.Description>
				</Alert.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Invert alert">
		{#snippet blurb()}
			<code>demo 9</code>: the sixth appearance, the page's own negative. It is the one variant of
			the six with no counterpart in this theme's status vocabulary, so it is built from
			<code>--foreground</code> / <code>--background</code> at the call site.
		{/snippet}

		<Card.Root>
			<Card.Content>
				<!--
					The icon keeps upstream's `text-success`: on an inverted ground the status has to be
					carried by something, and the type is already spoken for by the surface.
				-->
				<Alert.Root class={invertSurface}>
					<CircleAlertIcon class="text-success" />
					<Alert.Title>Notification! All good</Alert.Title>
					<Alert.Description>
						This is a notification alert with a title and description.
					</Alert.Description>
				</Alert.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Alert with description and action buttons">
		{#snippet blurb()}
			<code>demo 11</code>: the same pair of actions against a description with no title, so the
			whole alert is one line high and the buttons sit level with it.
		{/snippet}

		<Card.Root>
			<Card.Content>
				{#if demoDismissed.securityShort}
					{@render demoRestore("securityShort")}
				{:else}
					<Alert.Root class={actionGutter.two}>
						<ShieldCheckIcon />
						<Alert.Description>Update your password and enable 2FA.</Alert.Description>
						<Alert.Action class="flex gap-1.5">
							<Button
								variant="outline"
								size="xs"
								onclick={() => (demoDismissed.securityShort = true)}
							>
								Dismiss
							</Button>
							<Button size="xs">Update</Button>
						</Alert.Action>
					</Alert.Root>
				{/if}
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Alert integrated within a Frame with reset borders">
		{#snippet blurb()}
			<code>demo 12</code>: the alert gives up its own border and becomes the contents of a
			<code>Frame.Panel</code>, which supplies the chrome instead — the shape for an alert that is
			part of a panelled surface rather than a message floating on the page.
		{/snippet}

		<Card.Root>
			<Card.Content>
				<!--
					`p-0` on the panel and `border-0` on the alert. The panel's padding arrives as
					`px-(--frame-panel-px) py-(--frame-panel-py)`, and tailwind-merge drops both for the
					shorthand written after them — so upstream's `p-0!` needs no `!` here. The panel is
					already `overflow-hidden` in its base, which clips the alert's `rounded-lg` down to the
					panel's concentric radius; upstream has to ask for that explicitly.

					The red info icon is upstream's, kept as it stands: it is the example's point that the
					icon carries a status the surface does not.
				-->
				<div class="mx-auto w-full max-w-lg">
					<Frame.Root>
						<Frame.Panel class="p-0">
							<Alert.Root class="border-0">
								<InfoIcon class="text-destructive" />
								<Alert.Title>System Update</Alert.Title>
								<Alert.Description>
									A new system update is available. Please restart your application to apply the
									changes.
								</Alert.Description>
							</Alert.Root>
						</Frame.Panel>
					</Frame.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Stacked alerts within a Frame">
		{#snippet blurb()}
			<code>demo 13</code>: two status alerts in a <code>stacked</code> frame, where adjacent panels fuse
			— squared inner corners and one shared border, so the run reads as a single segmented block.
		{/snippet}

		<Card.Root>
			<Card.Content>
				<!--
					`rounded-none` as well as `border-0` this time: a stacked panel squares the corners
					facing its neighbour, and an alert keeping its own radius inside one would draw a
					rounded box against a square opening.

					The warning icon is upstream's `text-yellow-500` as a token — and it needs no class at
					all, since `warning-subtle` already makes `text-warning` the current colour and the
					base sizes and inherits into a direct child svg.
				-->
				<div class="mx-auto w-full max-w-lg">
					<Frame.Root stacked>
						<Frame.Panel class="p-0">
							<Alert.Root variant="success-subtle" class="rounded-none border-0">
								<CircleCheckIcon />
								<Alert.Title>Deployment Successful</Alert.Title>
								<Alert.Description>
									Your application has been successfully deployed to the production environment.
								</Alert.Description>
							</Alert.Root>
						</Frame.Panel>
						<Frame.Panel class="p-0">
							<Alert.Root variant="warning-subtle" class="rounded-none border-0 {actionGutter.one}">
								<TriangleAlertIcon />
								<Alert.Title>Resource Limit Reached</Alert.Title>
								<Alert.Action>
									<Button size="xs">Verify</Button>
								</Alert.Action>
								<Alert.Description>
									Your current plan has reached its resource limits. Consider upgrading to a higher
									tier.
								</Alert.Description>
							</Alert.Root>
						</Frame.Panel>
					</Frame.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Alert with actions integrated within a Frame">
		{#snippet blurb()}
			<code>demo 14</code>: the panelled alert with its action pair, which is where the
			corner-pinned <code>Alert.Action</code> pays off — the panel has no padding of its own to fight
			over.
		{/snippet}

		<Card.Root>
			<Card.Content>
				{#if demoDismissed.frameSecurity}
					{@render demoRestore("frameSecurity")}
				{:else}
					<!-- Upstream's `text-emerald-500` shield is `--success`, the token that means it. -->
					<div class="mx-auto w-full max-w-lg">
						<Frame.Root>
							<Frame.Panel class="p-0">
								<Alert.Root class="border-0 {actionGutter.two}">
									<ShieldCheckIcon class="text-success" />
									<Alert.Title>Security Update</Alert.Title>
									<Alert.Action class="flex gap-1.5">
										<Button
											variant="outline"
											size="xs"
											onclick={() => (demoDismissed.frameSecurity = true)}
										>
											Dismiss
										</Button>
										<Button size="xs">Update</Button>
									</Alert.Action>
									<Alert.Description>
										Update your password and enable 2FA to improve your account security.
									</Alert.Description>
								</Alert.Root>
							</Frame.Panel>
						</Frame.Root>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Inverted alert variant">
		{#snippet blurb()}
			<code>demo 15</code>: the inverted surface inside a frame, with the upsell pair it exists for.
		{/snippet}

		<Card.Root>
			<Card.Content>
				{#if demoDismissed.pro}
					{@render demoRestore("pro")}
				{:else}
					<!--
						THE TWO BUTTONS ARE BUILT OUT OF THE TYPE COLOUR, the same move §2's eighth
						composition makes on its solid primary ground and for the same reason: on a surface
						that flips with the mode, a button painted in any token that also flips reads as a
						white chip in one mode and a navy one in the other.

						So the quiet action is a wash of `--background` — the alert's own type colour — and
						the committing one is the plain primary button. Upstream paints that second one
						`bg-blue-500 border-blue-800 text-white`, which is `--primary` spelled as three raw
						palette steps, and painting it by token is what lets it follow the palette picker.
					-->
					<div class="mx-auto w-full max-w-lg">
						<Frame.Root>
							<Frame.Panel class="p-0">
								<Alert.Root class="border-0 {invertSurface} {actionGutter.two}">
									<ZapIcon class="text-warning" />
									<Alert.Title>Pro Feature</Alert.Title>
									<Alert.Action class="flex gap-1.5">
										<Button
											size="xs"
											class="bg-background/10 text-background hover:bg-background/20"
											onclick={() => (demoDismissed.pro = true)}
										>
											Dismiss
										</Button>
										<Button size="xs">Upgrade</Button>
									</Alert.Action>
									<Alert.Description>
										This feature is only available for Pro users. Upgrade your plan to get access.
									</Alert.Description>
								</Alert.Root>
							</Frame.Panel>
						</Frame.Root>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Urgent billing notice">
		{#snippet blurb()}
			<code>demo 16</code>: a soft destructive alert in a panel, with the one action that resolves
			it.
		{/snippet}

		<Card.Root>
			<Card.Content>
				<!--
					Upstream stacks its `destructive` variant with a `bg-destructive/5` override to soften
					the ground. `destructive-subtle` IS that ground, as a token rather than an opacity —
					§5 of the theme notes calls the `-subtle` ground with full-strength type the dominant
					classic-theme pattern — so the override goes away rather than being translated.

					The Renew button is the house `destructive` variant, which is itself a soft red rather
					than a solid fill; on a soft red ground that is the pairing the theme already uses.
				-->
				<div class="mx-auto w-full max-w-lg">
					<Frame.Root>
						<Frame.Panel class="p-0">
							<Alert.Root variant="destructive-subtle" class="border-0 {actionGutter.one}">
								<CreditCardIcon />
								<Alert.Title>Subscription Expiring</Alert.Title>
								<Alert.Action>
									<Button size="xs" variant="destructive">Renew Now</Button>
								</Alert.Action>
								<Alert.Description>
									Your annual subscription will expire in 3 days. Renew now to avoid service
									interruption and data loss.
								</Alert.Description>
							</Alert.Root>
						</Frame.Panel>
					</Frame.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Service status summary stacked within a frame">
		{#snippet blurb()}
			<code>demo 17</code>: the stacked frame again, this time with the alerts' grounds cleared so
			the panel's own surface shows through and only the type and icons carry the status.
		{/snippet}

		<Card.Root>
			<Card.Content>
				<!--
					`bg-transparent` written after the variant wins the `bg-*` group outright, which leaves
					`{state}-subtle` contributing exactly its colours — the readable half of the recipe on
					a surface that is already a panel.

					Retry drops upstream's `h-7`: the control ramp here is the `--control-h-*` ladder —
					xs 24 / sm 32 / default 40 / lg 48, these action buttons already on xs — and
					h-7's 28px is not a step on it. Its icon
					takes `data-icon` rather than upstream's `mr-1 size-3` — the button sizes and spaces
					its own icons.
				-->
				<div class="mx-auto w-full max-w-lg">
					<Frame.Root stacked>
						<Frame.Panel class="p-0">
							<Alert.Root variant="success-subtle" class="rounded-none border-0 bg-transparent">
								<DatabaseIcon />
								<Alert.Title>Database Connected</Alert.Title>
								<Alert.Description>
									All systems operational. Last sync: 2 minutes ago.
								</Alert.Description>
							</Alert.Root>
						</Frame.Panel>
						<Frame.Panel class="p-0">
							<Alert.Root
								variant="warning-subtle"
								class="rounded-none border-0 bg-transparent {actionGutter.one}"
							>
								<GlobeIcon />
								<Alert.Title>API Latency Warning</Alert.Title>
								<Alert.Action>
									<Button size="xs" variant="outline">
										<RefreshCwIcon data-icon="inline-start" />
										Retry
									</Button>
								</Alert.Action>
								<Alert.Description>
									Increased latency detected in US-East regions. Our engineers are investigating.
								</Alert.Description>
							</Alert.Root>
						</Frame.Panel>
					</Frame.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Feature discovery alert">
		{#snippet blurb()}
			<code>demo 18</code>: a <code>ghost</code> frame — no shell border, so the panel floats on the page
			— carrying an announcement with a close control and a link inside its description.
		{/snippet}

		<Card.Root>
			<Card.Content>
				{#if demoDismissed.analytics}
					{@render demoRestore("analytics")}
				{:else}
					<!--
						The close control is `size="icon-xs"` rather than upstream's `size-7 p-0` on an
						`xs` button: the square sizes are their own step on the ramp here, and icon-xs is
						the h-6 row's square. The negative margins stay — they pull the glyph out to the
						alert's corner, which is what `Alert.Action`'s `top-2.5 right-3` leaves room for.

						"Explore features" is a link button sized down to sit inside the sentence, tinted
						`--info` to match the alert it lives in rather than the primary the link variant
						assumes.
					-->
					<div class="mx-auto w-full max-w-lg">
						<Frame.Root variant="ghost">
							<Frame.Panel class="p-0">
								<Alert.Root variant="info-subtle" class="border-0">
									<LightbulbIcon />
									<Alert.Title>New: Advanced Analytics</Alert.Title>
									<Alert.Action>
										<Button
											size="icon-xs"
											variant="ghost"
											aria-label="Dismiss"
											class="-mt-1 -mr-2 text-muted-foreground hover:bg-transparent hover:text-foreground"
											onclick={() => (demoDismissed.analytics = true)}
										>
											<XIcon />
										</Button>
									</Alert.Action>
									<Alert.Description>
										We’ve just released a new dashboard for tracking your team’s performance.
										<Button
											variant="link"
											size="sm"
											href="#/components/alert"
											class="h-auto p-0 text-info underline"
										>
											Explore features
										</Button>
									</Alert.Description>
								</Alert.Root>
							</Frame.Panel>
						</Frame.Root>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="User message notification alert">
		{#snippet blurb()}
			<code>demo 19</code> and <code>demo 20</code>, which upstream gives the same title: the same
			notification row twice, once on the default surface and once inverted. The first column is an
			avatar rather than an icon — the one composition the component's own grid does not lay itself
			out for.
		{/snippet}

		<Card.Root>
			<Card.Content class="flex flex-col gap-6">
				<!--
					THE AVATAR IS NOT AN ICON, AND THE GRID ONLY KNOWS ABOUT ICONS. The base opens its
					second column with `has-[>svg]:grid-cols-[auto_1fr]` and spans the glyph down both
					rows with `*:[svg]:row-span-2`; `Alert.Title` moves itself with
					`group-has-[>svg]/alert:col-start-2`. An `Avatar.Root` matches none of the three, so
					left alone the avatar, the title and the description stack in a single column.

					`grid-cols-[2rem_1fr]` plus `row-span-2` on the avatar puts the two-column shape back
					— 2rem is the avatar's own `size-8` —
					and auto-placement then drops the title and the description into column
					two by itself. `gap-x-3` supplies the column gap the base only sets for an icon; its
					`gap-0.5` still spaces the two rows.

					`min-w-0` on the title is what lets the `1fr` track shrink below its content: a grid
					item defaults to `min-width: auto`, so without it a long name would widen the column
					and slide back under the corner-pinned buttons instead of truncating.

					Initials rather than upstream's stock photographs, for the reason the header gives.
				-->
				<div class="mx-auto w-full max-w-lg">
					<Frame.Root>
						<Frame.Panel class="p-0">
							<Alert.Root class="grid-cols-[2rem_1fr] gap-x-3 border-0 {actionGutter.two}">
								<Avatar.Root class="row-span-2">
									<Avatar.Fallback class="text-xs">AJ</Avatar.Fallback>
								</Avatar.Root>
								<Alert.Title class="flex min-w-0 items-center gap-2">
									<span class="truncate">Alex Johnson</span>
									<span class="truncate font-normal text-muted-foreground">sent you a message</span>
								</Alert.Title>
								<!-- View and Reply are actions, not closes, so neither is wired to a dismissal. -->
								<Alert.Action class="flex gap-1.5">
									<Button variant="outline" size="xs">View</Button>
									<Button size="xs">Reply</Button>
								</Alert.Action>
								<Alert.Description class="line-clamp-1">
									“Hey! I’ve finished the draft for the new design system. Let me know what you
									think when you have a moment.”
								</Alert.Description>
							</Alert.Root>
						</Frame.Panel>
					</Frame.Root>
				</div>

				{#if demoDismissed.mention}
					{@render demoRestore("mention")}
				{:else}
					<!--
						The same row on {@link invertSurface}. Upstream softens the descriptor span with
						`text-invert-foreground/60`; the type colour here is `--background`, so that tint is
						written against it — and the description's own /70 already arrives with the surface
						recipe rather than being repeated at the call site.

						The buttons take the pairing the "Inverted alert variant" section settles on: a wash
						of the alert's own type colour for the quiet action, and the plain primary button for
						the committing one, since upstream's `bg-blue-500 border-blue-800 text-white` is
						`--primary` spelled as three raw palette steps.
					-->
					<div class="mx-auto w-full max-w-lg">
						<Frame.Root>
							<Frame.Panel class="p-0">
								<Alert.Root
									class="grid-cols-[2rem_1fr] gap-x-3 border-0 {invertSurface} {actionGutter.two}"
								>
									<Avatar.Root class="row-span-2">
										<Avatar.Fallback class="text-xs">SC</Avatar.Fallback>
									</Avatar.Root>
									<Alert.Title class="flex min-w-0 items-center gap-2">
										<span class="truncate">Sarah Chen</span>
										<span class="truncate font-normal text-background/60">
											mentioned you in a comment
										</span>
									</Alert.Title>
									<Alert.Action class="flex gap-1.5">
										<Button
											size="xs"
											class="bg-background/10 text-background hover:bg-background/20"
											onclick={() => (demoDismissed.mention = true)}
										>
											Dismiss
										</Button>
										<Button size="xs">View</Button>
									</Alert.Action>
									<Alert.Description class="line-clamp-1">
										“Great work on the user profile layout! I’ve added some suggestions for the
										avatar spacing.”
									</Alert.Description>
								</Alert.Root>
							</Frame.Panel>
						</Frame.Root>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
