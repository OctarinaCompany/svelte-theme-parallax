<script lang="ts">
	import BadgeCheckIcon from "@lucide/svelte/icons/badge-check";
	import CheckIcon from "@lucide/svelte/icons/check";
	import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
	import LogOutIcon from "@lucide/svelte/icons/log-out";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import ShieldCheckIcon from "@lucide/svelte/icons/shield-check";
	import StarIcon from "@lucide/svelte/icons/star";
	import UserIcon from "@lucide/svelte/icons/user";
	import UserPlusIcon from "@lucide/svelte/icons/user-plus";
	import UsersIcon from "@lucide/svelte/icons/users";

	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Frame from "$lib/components/ui/frame/index.js";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Spinner } from "$lib/components/ui/spinner/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { cn } from "$lib/utils.js";
	import { getInitials } from "$lib/shared/get-initials.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Avatar component page — a theme-specific component, six sections: Sizing,
	 * Status Indicator, Shape, Ratio, Initials and Groups.
	 *
	 * WHAT THE CLASSIC THEME HAS. One driving number, `--bs-avatar-size`
	 * (`avatar-size-base: 3rem`), which sets the square AND the type — `font-size:
	 * calc(var(--bs-avatar-size) / 3)` — so every modifier below is that variable moved and
	 * everything else derived: five extra sizes, a status dot at 20% of the size inset 5% from
	 * the corner, a group overlap of 25%, and a 4by3 width of 4/3. The ratios are kept AS
	 * ratios here (`text-[calc(2.5rem/3)]`, `size-[20%]`) rather than resolved to the nearest
	 * step, because on this page the ratio is the exhibit; `EmptyPage` rounded its one group to
	 * `text-xs` and said why, and both readings are a third of a pixel apart.
	 *
	 * THREE SUBSTITUTIONS, the same ones the rest of the gallery already made:
	 *
	 *   photographs -> initials   the repo ships no images and fetches none (the theme notes
	 *                             §17's substitution table). The one exception is the Initials
	 *                             section, whose subject IS the image-to-fallback pipeline — an
	 *                             initials-only demo of it would document nothing. Its
	 *                             "photograph" is a data: URI authored in this file, so nothing
	 *                             is shipped and nothing is fetched.
	 *   masks -> rings            the classic theme separates grouped and status-dotted avatars by
	 *                             masking a notch out of each (`assets/img/masks/*.svg`), so
	 *                             the ground shows through. Those rasters are not in this repo;
	 *                             the primitives' `ring-2` in the ground colour is the same
	 *                             separation drawn additively — recoloured `ring-card`, since
	 *                             every demo sits on a card. The group-hover mask dance
	 *                             (`.avatar:hover { z-index: 1 }` plus two more masks) travels
	 *                             with the mask files and is not reproduced.
	 *   hairline -> none          shadcn's `Avatar.Root` inscribes `after:border-border` in the
	 *                             circle. The classic theme's own `.avatar:after` is a 0x0 mask PRELOADER
	 *                             that draws nothing, so the hairline goes — {@link avatar}.
	 *
	 * SIZES ARE CLASSES, NOT THE PROP. The component's `size` prop has three steps (24/32/40px)
	 * keyed to `data-size`; the classic theme's ladder has six, and they share exactly one value
	 * (`avatar-size-sm` = 40px = `size="lg"`). So every avatar here leaves the prop at
	 * `default` and states its square as a `size-*` class — which is also why the status dot
	 * restates its size under the `group-data-[size=default]/avatar:` modifier the badge's own
	 * sizing already uses: same-modifier classes merge in tailwind-merge, where a bare `size-*`
	 * would stay in the stylesheet and lose to the compound selector on specificity.
	 */

	/**
	 * The size ladder, `avatar-size-*` resolved: xs 1.625rem, sm 2.5rem, base 3rem, lg 4rem,
	 * xl 5.125rem, xxl 8rem. Only sm/base/lg land on Tailwind's scale; the other three are
	 * stated raw. `.avatar-xxl` is responsive in the SCSS — `avatar-size-xl` below `md`, 8rem
	 * from `md` up — so its entry carries the breakpoint.
	 *
	 * `type` is `font-size: calc(var(--bs-avatar-size) / 3)` written per size; the base entry
	 * is the one calc worth resolving (3rem / 3 = 1rem). An arbitrary `text-[...]` sets no
	 * line-height, which is safe here: `.avatar-title` zeroes it and centres by flex, exactly
	 * what the fallback primitive does too.
	 */
	const sizes = {
		xxl: {
			box: "size-[5.125rem] md:size-32",
			type: "text-[calc(5.125rem/3)] md:text-[calc(8rem/3)]",
		},
		xl: { box: "size-[5.125rem]", type: "text-[calc(5.125rem/3)]" },
		lg: { box: "size-16", type: "text-[calc(4rem/3)]" },
		base: { box: "size-12", type: "text-[1rem]" },
		sm: { box: "size-10", type: "text-[calc(2.5rem/3)]" },
		xs: { box: "size-[1.625rem]", type: "text-[calc(1.625rem/3)]" },
	} as const;

	/** The classic theme's demo order — largest first — reused by Sizing and Status Indicator. */
	const sizeOrder = ["xxl", "xl", "lg", "base", "sm", "xs"] as const;

	/** The Shape demo's three rungs, each drawn squared then circular, as the classic theme's demo does. */
	const shapeOrder = ["xxl", "lg", "base"] as const;

	/**
	 * `.avatar-title` in its default colours, `EmptyPage`'s derivation restated rather than
	 * re-derived so the two pages cannot drift: `avatar-title-bg` is `gray-500` (#B1C2D9) in
	 * light and `gray-600-dark` (#244166) in dark, neither held by a token, and the nearest
	 * honest neighbours land on DIFFERENT tokens — hence the `dark:` half. `EmptyPage.svelte`
	 * carries the full argument, including why `--chart-5` (the one exact match) is refused.
	 */
	const avatarTitle = "bg-muted-foreground text-primary-foreground dark:bg-secondary";

	/**
	 * `Avatar.Root` draws `after:border after:border-border`, a hairline the classic theme does not have:
	 * its `.avatar:after` only preloads the mask images at 0x0. Same call as `EmptyPage`.
	 */
	const avatar = "after:border-0";

	/**
	 * `.avatar-online::before` / `.avatar-offline::before` — a dot 20% of the avatar's size,
	 * 5% in from the bottom-right corner. The badge's own sizes are fixed steps keyed to
	 * `data-size`, so the 20% is restated under the SAME `group-data-[size=default]/avatar:`
	 * modifier (see the header comment for why), and its `right-0 bottom-0` becomes the 5%
	 * inset. `ring-card` is the mask notch drawn additively, as everywhere on this page.
	 */
	const statusDot = "right-[5%] bottom-[5%] ring-card group-data-[size=default]/avatar:size-[20%]";

	/**
	 * The dot's two fills. Online is `var(--bs-success)`, which `--success` holds exactly.
	 * Offline is `var(--bs-gray-500)` (#B1C2D9) in BOTH modes — the classic theme's dark block recolours
	 * only the title ground, not the dot — and no semantic token holds that grey; this is the
	 * same near-miss the `.avatar-title` ground documents, answered the same way, one grey step
	 * dark in each mode rather than borrowing `--chart-5`'s exact value under a chart name.
	 */
	const online = "bg-success";
	const offline = "bg-muted-foreground";

	/**
	 * `.rounded` on an `.avatar-img` or `.avatar-title` — `border-radius: .375rem`, which is
	 * `rounded-md` exactly. The root is the only place it is written: the hairline ring, the image
	 * and the fallback all take `rounded-[inherit]`, so squaring the box squares the three of them.
	 * (This used to need `after:rounded-md` restated and a `rounded-md` on the fallback —
	 * tailwind-merge keys `rounded-*` and `after:rounded-*` into different groups, and the ring was
	 * a hardcoded `after:rounded-full`, so the box alone left a circle inscribed in it.)
	 */
	const squared = "rounded-md";

	/**
	 * `.avatar-4by3` — `width: calc(var(--bs-avatar-size) * 4 / 3)` while the height, and
	 * therefore the type, stay on the ladder. The classic theme's demo shows xxl through base, every
	 * one `.rounded`: this is the project-thumbnail shape (`PageHeadersPage` ports the lg one),
	 * so the circle never applies. Widths are the heights times 4/3: 8rem -> 10.6667rem,
	 * 5.125rem -> 6.8333rem, 4rem -> 5.3333rem, 3rem -> 4rem (= `w-16`, the one exact step).
	 */
	const ratio = [
		{ box: "h-[5.125rem] w-[6.8333rem] md:h-32 md:w-[10.6667rem]", type: sizes.xxl.type },
		{ box: "h-[5.125rem] w-[6.8333rem]", type: sizes.xl.type },
		{ box: "h-16 w-[5.3333rem]", type: sizes.lg.type },
		{ box: "h-12 w-16", type: sizes.base.type },
	] as const;

	/**
	 * The Initials demo's "photograph": a data: URI, so the repo still ships no image files and
	 * fetches nothing — the picture is authored right here. It exists because this page is the
	 * one place `Avatar.Image` must be seen actually loading; every other avatar in the app
	 * stops at the fallback. The two fills are the classic theme's `primary-bg-subtle` and `primary`
	 * as hex, since a data: URI resolves no CSS custom properties.
	 */
	const portrait = `data:image/svg+xml,${encodeURIComponent(
		"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 96'>" +
			"<rect width='96' height='96' fill='#D5E5FA'/>" +
			"<circle cx='48' cy='38' r='15' fill='#2C7BE5'/>" +
			"<ellipse cx='48' cy='83' rx='27' ry='20' fill='#2C7BE5'/>" +
			"</svg>",
	)}`;

	/** Whether the Initials demo shows the portrait or lets the fallback answer. */
	let photograph = $state(false);

	/**
	 * The three people the classic theme's own group demo names in its tooltips, plus the `CF` chip its
	 * markup ends every group with — an `.avatar-title` with no name attached anywhere in the
	 * theme, so it stays a literal.
	 */
	const members = ["Ab Hadley", "Adolfo Hess", "Daniela Dewitt"] as const;

	/** Group overlap is `margin-left: calc(var(--bs-avatar-size) * .25 * -1)`, restated per size. */
	const groups = [
		{ ...sizes.lg, overlap: "-space-x-4" },
		{ ...sizes.base, overlap: "-space-x-3" },
		{ ...sizes.xs, overlap: "-space-x-[0.40625rem]" },
	] as const;

	/**
	 * The overflow demo's roster — every name a person the classic theme itself draws in
	 * `profile-groups.html`, where the pattern being ported lives: four avatars and a `+7`
	 * `.avatar-title` chip closing the group.
	 */
	const team = [
		"Ab Hadley",
		"Adolfo Hess",
		"Daniela Dewitt",
		"Miyah Myles",
		"Dianna Smiley",
		"Glen Rouse",
		"Grace Gross",
		"Ryu Duke",
	] as const;

	/** How many of {@link team} have joined; the group shows four, the chip absorbs the rest. */
	let joined = $state(5);
	const visible = $derived(team.slice(0, Math.min(joined, 4)));
	const overflow = $derived(joined - visible.length);

	/* ---------------------------------------------------------------------------------------
	 * The gallery half of the page
	 *
	 * Everything below documents the SAME primitives through the avatar demo gallery. The two
	 * halves answer different questions and are worth keeping apart: the classic sections above
	 * reproduce a theme — one `--bs-avatar-size` ladder, one status dot, one group overlap — while
	 * these reproduce the component's own surface, the `size` prop, the badge slot, the group
	 * count chip and the fallback grounds a product actually reaches for.
	 *
	 * THREE THINGS DIFFER FROM THE SECTIONS ABOVE, all of them deliberate:
	 *
	 *   the hairline stays.  The classic sections blank `after:border` ({@link avatar}) because
	 *                        the classic avatar draws no hairline. The gallery's avatar has the
	 *                        same inscribed hairline this component ships and two of its demos
	 *                        (`c-avatar-14`, `c-avatar-15`) recolour it as part of the exhibit, so
	 *                        here it is left alone.
	 *   the sizes are the prop. Above, every square is a `size-*` class because the classic theme's ladder
	 *                        has six rungs and the prop has three. `c-avatar-3` documents the
	 *                        prop itself, so it uses it.
	 *   `ring-card`, still.  Badges and grouped avatars ring themselves in the ground colour to
	 *                        separate from their neighbour; upstream says `ring-background`, and
	 *                        every demo on this page sits on a card, where `--card` and
	 *                        `--background` are different values.
	 *
	 * Portraits are initials, as everywhere else in this repository — {@link portrait}, the one
	 * authored data: URI, serves the two demos whose subject really is the image.
	 */

	/**
	 * The four people the avatar demos name over and over. The group demos take three of them —
	 * a fifth (Nick Johnson) rotates through some of the rosters, which changes nothing
	 * about what the group is showing.
	 */
	const demoPeople = ["Alex Johnson", "Sarah Chen", "Michael Rodriguez", "Emma Wilson"] as const;

	/**
	 * demo 4's radius ramp. One class per rung, on the root: the hairline, the image and the fallback
	 * inherit it. Upstream's third rung reads `rounded-lg after:rounded-xl` with an `rounded-xl`
	 * image, which is a typo — three radii on one avatar; it is one radius here, and can only be one.
	 */
	const demoRadii = ["rounded-md", "rounded-lg", "rounded-xl", ""] as const;

	/**
	 * demo 6's presence vocabulary. Upstream paints it `bg-primary` / `bg-green-500` /
	 * `bg-yellow-500` / `bg-destructive`; the two raw palette steps are the status tokens they
	 * stand for. Warning carries its own foreground: `Avatar.Badge` types in
	 * `--primary-foreground` (white), which is unreadable on `--warning` (#F6C343).
	 */
	const demoPresence = [
		{ name: "Nick Johnson", label: "In a meeting", tone: "bg-primary" },
		{ name: "Alex Johnson", label: "Online", tone: "bg-success" },
		{ name: "Sarah Chen", label: "Away", tone: "bg-warning text-warning-foreground" },
		{ name: "Michael Rodriguez", label: "Do not disturb", tone: "bg-destructive" },
	] as const;

	/**
	 * demo 8 — the badge at each of the four corners of a circular avatar. The slot
	 * anchors itself `right-0 bottom-0`, so only the other three corners need to say anything, and
	 * the ones that move left must clear `right` explicitly.
	 */
	const demoBadgeCorners = [
		{ name: "Alex Johnson", corner: "top-0 right-0", tone: "bg-success" },
		{ name: "Sarah Chen", corner: "", tone: "bg-warning" },
		{ name: "Michael Rodriguez", corner: "top-0 right-auto left-0", tone: "bg-destructive" },
		{ name: "Emma Wilson", corner: "right-auto left-0", tone: "bg-info" },
	] as const;

	/**
	 * demo 9 — the same four corners on a squared avatar, where the badge overhangs by a
	 * quarter of its own size instead of tucking inside the circle's curve.
	 */
	const demoSquaredBadgeCorners = [
		{ name: "Alex Johnson", corner: "-top-1 -right-1", tone: "bg-success" },
		{ name: "Sarah Chen", corner: "-right-1 -bottom-1", tone: "bg-warning" },
		{
			name: "Michael Rodriguez",
			corner: "-top-1 right-auto bottom-auto -left-1",
			tone: "bg-destructive",
		},
		{ name: "Emma Wilson", corner: "right-auto -bottom-1 -left-1", tone: "bg-info" },
	] as const;

	/**
	 * demo 13's ring colours — upstream's `ring-violet-500` and `ring-yellow-500` become
	 * the two status tokens nearest them. `ring-offset-*` takes the card rather than the body for
	 * the reason the header note gives.
	 */
	const demoRings = [
		{ name: "Alex Johnson", ring: "ring-primary" },
		{ name: "Sarah Chen", ring: "ring-destructive" },
		{ name: "Michael Rodriguez", ring: "ring-info" },
		{ name: "Emma Wilson", ring: "ring-warning" },
	] as const;

	/**
	 * demo 14 — the soft fallback family. Upstream mixes `bg-primary/10` with
	 * `bg-green-50 dark:bg-green-900`; here all four are the `--*-subtle` tokens, the same opaque
	 * ground Badge's `{state}-subtle` variants use, which means no `dark:` half is needed. The
	 * hairline follows the type colour at 20% so the circle keeps an edge against the card.
	 */
	const demoSubtleFallbacks = [
		{
			initials: "AB",
			tone: "bg-primary-subtle text-primary-subtle-foreground",
			edge: "after:border-primary/20",
		},
		{
			initials: "DV",
			tone: "bg-destructive-subtle text-destructive-subtle-foreground",
			edge: "after:border-destructive/20",
		},
		{
			initials: "SB",
			tone: "bg-success-subtle text-success-subtle-foreground",
			edge: "after:border-success/20",
		},
		{
			initials: "DB",
			tone: "bg-info-subtle text-info-subtle-foreground",
			edge: "after:border-info/20",
		},
	] as const;

	/**
	 * demo 15 — the solid fallback family, upstream's `bg-green-500` and `bg-blue-500`
	 * resolved to tokens and its bare `text-white` to each ground's own `--*-foreground`, which is
	 * white for three of them and `--warning-foreground` where it must not be.
	 */
	const demoSolidFallbacks = [
		{ initials: "AB", tone: "bg-primary text-primary-foreground", edge: "after:border-primary" },
		{
			initials: "DV",
			tone: "bg-destructive text-destructive-foreground",
			edge: "after:border-destructive",
		},
		{ initials: "SB", tone: "bg-success text-success-foreground", edge: "after:border-success" },
		{ initials: "CB", tone: "bg-info text-info-foreground", edge: "after:border-info" },
	] as const;

	/**
	 * demo 20's roster. Upstream's fourth member is the `@leerob` GitHub avatar rather than
	 * a named person; every face on this page is an initials chip, so the handle is written out as
	 * the name it stands for.
	 */
	const demoSocialProof = [
		"Liam Thompson",
		"Nick Johnson",
		"Maria Garcia",
		"Lee Robinson",
	] as const;

	/**
	 * The GitHub handles demo 21, demo 28 and demo 29 fill their groups
	 * with, spelled as names for the same reason — an initials chip needs one.
	 */
	const demoDevelopers = ["Max Leiter", "Evil Rabbit", "Lee Robinson", "Jenny Wilson"] as const;

	/**
	 * The four people the three hover groups share (demo 22 .. demo 24). Upstream
	 * repeats the same roster across all three, which is what makes the three treatments comparable.
	 */
	const demoHoverPeople = ["David Kim", "Max Leiter", "James Brown", "Jenny Wilson"] as const;

	/**
	 * demo 31 — one verified badge at each corner of a large avatar. Unlike
	 * {@link demoBadgeCorners} these are not `Avatar.Badge` offsets: the mark is its own element
	 * pinned to the root, so each corner names both edges and overhangs by half a step.
	 */
	const demoCustomBadgeCorners = [
		{ name: "Aron Thompson", corner: "-bottom-0.5 -left-0.5" },
		{ name: "Aron Thompson", corner: "-top-0.5 -left-0.5" },
		{ name: "Aron Thompson", corner: "-right-0.5 -bottom-0.5" },
		{ name: "James Brown", corner: "-top-0.5 -right-0.5" },
	] as const;

	/**
	 * demo 30 flips its own loading flag every two seconds so the overlay can be seen
	 * arriving and leaving; the `$effect` below is that interval with its cleanup.
	 */
	let demoLoading = $state(true);

	$effect(() => {
		const timer = setInterval(() => (demoLoading = !demoLoading), 2000);
		return () => clearInterval(timer);
	});
</script>

<DocPage title="Avatar">
	{#snippet subtitle()}
		The image-with-fallback block that stands in for a person, in every size and shape the theme
		uses, alone or stacked into groups. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/avatar"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<DocSection title="Sizing">
		{#snippet blurb()}
			One avatar at each rung of the size ramp, from the chip a table row can hold to the block a
			profile header opens with.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					The classic theme's demo is inline-block avatars separated by source whitespace: one collapsed
					space at the card's 15px type is ~3.75px, which `gap-1` (4px) restates, and the
					image-filled boxes rest their bottom edges on the shared baseline, which `items-end`
					restates. Both rows recur on every section of this page.
				-->
				<div class="flex flex-wrap items-end gap-1">
					{#each sizeOrder as k (k)}
						<Avatar.Root class="{sizes[k].box} {avatar}">
							<Avatar.Fallback class="{sizes[k].type} {avatarTitle}">CF</Avatar.Fallback>
						</Avatar.Root>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Status indicator">
		{#snippet blurb()}
			A coloured dot pinned to the avatar's corner reports whether the person is available.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap items-end gap-1">
					<!--
						The classic theme's demo alternates the two states down the ladder, starting offline at
						xxl — the parity below is its exact sequence, not a decoration.
					-->
					{#each sizeOrder as k, i (k)}
						<Avatar.Root class="{sizes[k].box} {avatar}">
							<Avatar.Fallback class="{sizes[k].type} {avatarTitle}">CF</Avatar.Fallback>
							<Avatar.Badge class={cn(statusDot, i % 2 === 1 ? online : offline)} />
						</Avatar.Root>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Shape">
		{#snippet blurb()}
			The same avatar rounded, squared off, or taken all the way to a circle.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap items-end gap-1">
					{#each shapeOrder as k (k)}
						<Avatar.Root class="{sizes[k].box} {squared} {avatar}">
							<Avatar.Fallback class="{sizes[k].type} {avatarTitle}">CF</Avatar.Fallback>
						</Avatar.Root>
						<Avatar.Root class="{sizes[k].box} {avatar}">
							<Avatar.Fallback class="{sizes[k].type} {avatarTitle}">CF</Avatar.Fallback>
						</Avatar.Root>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Ratio">
		{#snippet blurb()}
			Widens the box to a 4:3 landscape ratio with the
			<code class="text-[87.5%] text-primary">.avatar-4by3</code> modifier.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap items-end gap-1">
					{#each ratio as r (r.box)}
						<Avatar.Root class="{r.box} {squared} {avatar}">
							<!-- `HP` is the Homepage project, the thumbnail `PageHeadersPage` names. -->
							<Avatar.Fallback class="{r.type} {avatarTitle}">HP</Avatar.Fallback>
						</Avatar.Root>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Initials">
		{#snippet blurb()}
			You won't always have an image for every user, so easily use initials instead — here the
			standing substitution runs the other way, and the photograph is the exception the switch lets
			in.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap items-center gap-4">
					<!--
						A conditional `src` round-trips cleanly through bits-ui: `avatar.svelte.js`
						watches it, marks the root `error` whenever it goes nullish — which shows the
						fallback — and restarts the load when it returns, so the switch can be flipped
						repeatedly without remounting anything.
					-->
					<Avatar.Root class="size-12 {avatar}">
						<Avatar.Image src={photograph ? portrait : undefined} alt="Dianna Smiley" />
						<Avatar.Fallback class="text-[1rem] {avatarTitle}"
							>{getInitials("Dianna Smiley")}</Avatar.Fallback
						>
					</Avatar.Root>
					<div class="flex items-center gap-2">
						<Switch id="avatarPhotograph" bind:checked={photograph} />
						<!-- `font-normal` for `font-weight-base`, the same reading as the Switch page. -->
						<Label for="avatarPhotograph" class="font-normal">Load the photograph</Label>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Groups">
		{#snippet blurb()}
			Easily group avatars of any size, shape and content with a single component. Past four members
			the group closes with a <code class="text-[87.5%] text-primary">+7</code> chip rather than running
			off the row.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap items-end gap-1">
					{#each groups as g (g.overlap)}
						<!--
							The group primitive hardcodes `-space-x-2` and `ring-background`; the overlap
							becomes the classic theme's 25% ratio per size, and the ring takes the card's colour —
							both restated with the primitive's own selectors so tailwind-merge replaces
							rather than stacks (`EmptyPage` documents the pattern).
						-->
						<Avatar.Group class="{g.overlap} *:data-[slot=avatar]:ring-card">
							{#each members as name (name)}
								<Avatar.Root class="{g.box} {avatar}">
									<Avatar.Fallback class="{g.type} {avatarTitle}"
										>{getInitials(name)}</Avatar.Fallback
									>
								</Avatar.Root>
							{/each}
							<!-- The classic theme ends each demo group with its `CF` initials chip. -->
							<Avatar.Root class="{g.box} {avatar}">
								<Avatar.Fallback class="{g.type} {avatarTitle}">CF</Avatar.Fallback>
							</Avatar.Root>
						</Avatar.Group>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root class="mt-4">
			<Card.Content>
				<div class="flex flex-wrap items-center gap-4">
					<Avatar.Group class="-space-x-3 *:data-[slot=avatar]:ring-card">
						{#each visible as name (name)}
							<Avatar.Root class="size-12 {avatar}">
								<Avatar.Fallback class="text-[1rem] {avatarTitle}"
									>{getInitials(name)}</Avatar.Fallback
								>
							</Avatar.Root>
						{/each}
						{#if overflow > 0}
							<!--
								`GroupCount` is the `+7` chip: an `.avatar-title` at the group's size, so it
								takes the same ground, type ratio and ring as its neighbours — its stock
								`bg-muted text-muted-foreground text-sm` is a surface the classic theme does not draw.
							-->
							<Avatar.GroupCount class="size-12 text-[1rem] ring-card {avatarTitle}"
								>+{overflow}</Avatar.GroupCount
							>
						{/if}
					</Avatar.Group>
					<div class="flex gap-3">
						<Button
							variant="outline"
							size="sm"
							disabled={joined >= team.length}
							onclick={() => joined++}>Invite</Button
						>
						<Button variant="outline" size="sm" disabled={joined <= 1} onclick={() => joined--}
							>Remove</Button
						>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Basic avatar">
		{#snippet blurb()}
			The component at rest, with none of the ladder above applied: a 32px circle whose fallback
			answers because the photograph a stock demo would load is an initials chip in this repository.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 1. The classic sections above never show this square, because every one of
					them overrides it with a `size-*` class off `--bs-avatar-size`; the prop's own default
					is what a page gets when it asks for nothing.
				-->
				<Avatar.Root>
					<Avatar.Fallback>{getInitials("Michael Rodriguez")}</Avatar.Fallback>
				</Avatar.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar with fallback">
		{#snippet blurb()}
			The fallback is a slot, not a string — initials when a name is known, a generic figure when
			one is not.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex items-center gap-2">
					<!--
						demo 2. The icon keeps upstream's `size-4`: `Avatar.Fallback` sizes text but
						not SVGs, so an unstyled Lucide icon would come in at 24px inside a 32px circle.
					-->
					<Avatar.Root>
						<Avatar.Fallback>{getInitials("Alex Johnson")}</Avatar.Fallback>
					</Avatar.Root>
					<Avatar.Root>
						<Avatar.Fallback>
							<UserIcon class="size-4" aria-hidden="true" />
						</Avatar.Fallback>
					</Avatar.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatars with different sizes">
		{#snippet blurb()}
			The <code class="text-[87.5%] text-primary">size</code> prop's three steps — 24, 32 and 40px —
			which also drive the badge and the group count chip through
			<code class="text-[87.5%] text-primary">data-size</code>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 3, the one section on this page that uses the prop rather than a `size-*`
					class: it is the exhibit here, where above it was the wrong ladder.
				-->
				<div class="flex items-center gap-2">
					<Avatar.Root size="sm">
						<Avatar.Fallback>{getInitials("Alex Johnson")}</Avatar.Fallback>
					</Avatar.Root>
					<Avatar.Root>
						<Avatar.Fallback>{getInitials("Alex Johnson")}</Avatar.Fallback>
					</Avatar.Root>
					<Avatar.Root size="lg">
						<Avatar.Fallback>{getInitials("Alex Johnson")}</Avatar.Fallback>
					</Avatar.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatars with different border radiuses">
		{#snippet blurb()}
			The Shape section above shows the two ends of this ramp; demo 4 walks the rungs between them,
			from <code class="text-[87.5%] text-primary">rounded-md</code> back to the circle.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex items-center gap-2">
					{#each demoRadii as radius, i (i)}
						<Avatar.Root class={radius}>
							<Avatar.Fallback>{getInitials("Emma Wilson")}</Avatar.Fallback>
						</Avatar.Root>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar with an online status badge">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">Avatar.Badge</code> as a presence dot, one ground per state.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 6. The Status Indicator section above runs the same slot down the classic theme's
					size ladder with two states; this is the four-state vocabulary at one size, which is
					what a member list actually renders.
				-->
				<div class="flex items-center gap-2">
					{#each demoPresence as person (person.name)}
						<Avatar.Root>
							<Avatar.Fallback>{getInitials(person.name)}</Avatar.Fallback>
							<Avatar.Badge class="ring-card {person.tone}" aria-label={person.label} />
						</Avatar.Root>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar with badge icon">
		{#snippet blurb()}
			The badge takes children, and sizes them itself off the avatar's
			<code class="text-[87.5%] text-primary">data-size</code> — so the icons carry no classes of their
			own.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 7: add, verified, featured, protected. -->
				<div class="flex items-center gap-2">
					<Avatar.Root>
						<Avatar.Fallback>{getInitials("Nick Johnson")}</Avatar.Fallback>
						<Avatar.Badge class="ring-card">
							<PlusIcon aria-hidden="true" />
						</Avatar.Badge>
					</Avatar.Root>
					<Avatar.Root>
						<Avatar.Fallback>{getInitials("Alex Johnson")}</Avatar.Fallback>
						<Avatar.Badge class="bg-success ring-card">
							<CheckIcon aria-hidden="true" />
						</Avatar.Badge>
					</Avatar.Root>
					<Avatar.Root>
						<Avatar.Fallback>{getInitials("Sarah Chen")}</Avatar.Fallback>
						<Avatar.Badge class="bg-warning text-warning-foreground ring-card">
							<StarIcon aria-hidden="true" />
						</Avatar.Badge>
					</Avatar.Root>
					<Avatar.Root>
						<Avatar.Fallback>{getInitials("Michael Rodriguez")}</Avatar.Fallback>
						<Avatar.Badge class="bg-info ring-card">
							<ShieldCheckIcon aria-hidden="true" />
						</Avatar.Badge>
					</Avatar.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar with different badge positions">
		{#snippet blurb()}
			The badge anchors bottom-right; the other three corners are a pair of utilities, and the two
			on the left have to clear <code class="text-[87.5%] text-primary">right</code> explicitly.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 8. -->
				<div class="flex items-center gap-2">
					{#each demoBadgeCorners as person (person.name)}
						<Avatar.Root>
							<Avatar.Fallback>{getInitials(person.name)}</Avatar.Fallback>
							<Avatar.Badge class="ring-card {person.corner} {person.tone}" />
						</Avatar.Root>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar with different badge positions on squared avatars">
		{#snippet blurb()}
			The same four corners on a squared avatar, where the badge overhangs the box instead of
			tucking into the circle's curve.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 9. Upstream titles this exactly as the demo above it; the two are kept
					apart here because a page with two identical headings has no way to link to either.
				-->
				<div class="flex items-center gap-2">
					{#each demoSquaredBadgeCorners as person (person.name)}
						<Avatar.Root class={squared}>
							<Avatar.Fallback>{getInitials(person.name)}</Avatar.Fallback>
							<Avatar.Badge class="ring-card {person.corner} {person.tone}" />
						</Avatar.Root>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar group with an icon count">
		{#snippet blurb()}
			The trailing chip does not have to be a number: an icon in the same slot turns the group into
			an invite affordance.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 12. `GroupCount` sizes its own icon off the group's `data-size`, so the
					plus carries no classes; only the ring moves to the card's ground.
				-->
				<Avatar.Group class="*:data-[slot=avatar]:ring-card">
					{#each demoPeople.slice(0, 3) as name (name)}
						<Avatar.Root>
							<Avatar.Fallback>{getInitials(name)}</Avatar.Fallback>
						</Avatar.Root>
					{/each}
					<Avatar.GroupCount class="ring-card">
						<PlusIcon aria-hidden="true" />
					</Avatar.GroupCount>
				</Avatar.Group>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar with a distinct border ring">
		{#snippet blurb()}
			A ring with an offset reads as a selection or an ownership colour, and unlike the group's ring
			it is meant to be seen rather than to hide an overlap.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 13. -->
				<div class="flex items-center gap-3">
					{#each demoRings as person (person.name)}
						<Avatar.Root class="ring-2 ring-offset-2 ring-offset-card {person.ring}">
							<Avatar.Fallback>{getInitials(person.name)}</Avatar.Fallback>
						</Avatar.Root>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar with light background color fallback">
		{#snippet blurb()}
			The soft family applied to a fallback: the same
			<code class="text-[87.5%] text-primary">--*-subtle</code> grounds Badge's subtle variants are built
			on.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 14. -->
				<div class="flex items-center gap-2">
					{#each demoSubtleFallbacks as chip (chip.tone)}
						<Avatar.Root class={chip.edge}>
							<Avatar.Fallback class={chip.tone}>{chip.initials}</Avatar.Fallback>
						</Avatar.Root>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar with a solid background color fallback">
		{#snippet blurb()}
			The same four states at full strength — the reading a colour-coded roster wants when the
			avatars are small.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 15. -->
				<div class="flex items-center gap-2">
					{#each demoSolidFallbacks as chip (chip.tone)}
						<Avatar.Root class={chip.edge}>
							<Avatar.Fallback class={chip.tone}>{chip.initials}</Avatar.Fallback>
						</Avatar.Root>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar with user details and badge">
		{#snippet blurb()}
			The identity block every account menu and member row is built from: avatar, name, plan, role.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 16. Upstream's plan chip is `size="xs"`; Badge here has no size axis — it
					is one 20px pill by design — so the chip is the stock badge, which at `text-xs` sits on
					the same line as the name without shifting it.
				-->
				<div class="flex items-center gap-1.5">
					<Avatar.Root>
						<Avatar.Fallback>{getInitials("Alex Johnson")}</Avatar.Fallback>
					</Avatar.Root>
					<div class="flex flex-col">
						<div class="flex items-center gap-1.5">
							<span class="text-sm font-semibold">Alex Johnson</span>
							<Badge>Pro</Badge>
						</div>
						<span class="text-xs text-muted-foreground">Founder &amp; CEO</span>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar with grayscale image filter">
		{#snippet blurb()}
			A filter on <code class="text-[87.5%] text-primary">Avatar.Image</code> — how a deactivated or archived
			member is usually drawn.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 17. This is the second demo whose subject is the image itself rather than
					the circle around it, so like the Initials section it borrows the authored data: URI
					instead of substituting initials — a greyscaled initials chip would show nothing.
				-->
				<Avatar.Root>
					<Avatar.Image src={portrait} alt="Dianna Smiley" class="grayscale" />
					<Avatar.Fallback>{getInitials("Dianna Smiley")}</Avatar.Fallback>
				</Avatar.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar group with online status on one">
		{#snippet blurb()}
			The badge survives the overlap: the group stacks left-to-right, so a dot on the leading avatar
			is the one that stays fully visible.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 18. -->
				<Avatar.Group class="*:data-[slot=avatar]:ring-card">
					{#each demoPeople.slice(1) as name, i (name)}
						<Avatar.Root>
							<Avatar.Fallback>{getInitials(name)}</Avatar.Fallback>
							{#if i === 0}
								<Avatar.Badge class="bg-success ring-card" aria-label="Online" />
							{/if}
						</Avatar.Root>
					{/each}
				</Avatar.Group>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar inside small outline button">
		{#snippet blurb()}
			An avatar small enough to ride inside a control — the account chip a toolbar sets beside a
			handle.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 19. `size-5` is below the prop's smallest step (24px), so the square stays a
					class — and the fallback's `text-sm` has to come down with it, because every avatar in
					this half shows its fallback where upstream's showed a photograph.
				-->
				<Button variant="outline" size="sm">
					<Avatar.Root class="size-5">
						<Avatar.Fallback class="text-[0.625rem]">{getInitials("Nick Bold")}</Avatar.Fallback>
					</Avatar.Root>
					<span class="text-xs">@nick.bold</span>
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar social proof with text label">
		{#snippet blurb()}
			The landing-page proof pill: a group of members, then the number they stand for in words.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 20. Upstream's `shadow-sm shadow-black/5` is a tinted shadow stated as a raw
					colour; `shadow-xs` is the same weight in the theme's own ramp. `w-fit` because the pill
					is a chip, and a card's content box is far wider than it.
				-->
				<div class="flex w-fit items-center gap-1.5 rounded-full border p-1 shadow-xs">
					<Avatar.Group class="*:data-[slot=avatar]:ring-card">
						{#each demoSocialProof as name (name)}
							<Avatar.Root class="size-7">
								<Avatar.Fallback class="text-xs">{getInitials(name)}</Avatar.Fallback>
							</Avatar.Root>
						{/each}
					</Avatar.Group>
					<p class="me-1.5 text-xs text-muted-foreground">
						Trusted by <span class="font-semibold text-foreground">100K+</span> users.
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Compact social proof with initials">
		{#snippet blurb()}
			The same proof line inside a <code class="text-[87.5%] text-primary">Frame</code> panel, which supplies
			the chrome instead of a hand-drawn pill.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 21. Upstream forces the panel's padding down with `p-2!`; the frame here has
					a spacing ladder whose `xs` rung IS 8px, so the panel keeps its own padding and nothing
					has to be overridden.
				-->
				<Frame.Root spacing="xs" class="w-fit">
					<Frame.Panel class="flex items-center gap-2">
						<Avatar.Group class="*:data-[slot=avatar]:ring-card">
							{#each demoDevelopers as name (name)}
								<Avatar.Root class="size-7">
									<Avatar.Fallback class="text-xs">{getInitials(name)}</Avatar.Fallback>
								</Avatar.Root>
							{/each}
						</Avatar.Group>
						<p class="me-1.5 text-xs text-muted-foreground">
							Joined by <span class="font-semibold text-foreground">500+</span> developers.
						</p>
					</Frame.Panel>
				</Frame.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar group with hover tooltips and lift effect">
		{#snippet blurb()}
			Each member names itself on hover and lifts clear of the stack, so an overlapped face can
			still be read.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 22. The overlap is written out rather than taken from `Avatar.Group`: the
					group's ring and spacing rules select `*:data-[slot=avatar]`, i.e. its DIRECT children,
					and here every direct child is a tooltip trigger with the avatar inside it. The trigger
					stays a button — upstream's is one too — which is also what makes the tooltip reachable
					from the keyboard.
				-->
				<Tooltip.Provider>
					<div class="flex -space-x-2">
						{#each demoHoverPeople as name (name)}
							<Tooltip.Root>
								<Tooltip.Trigger class="rounded-full">
									<Avatar.Root
										class="ring-2 ring-card transition-all duration-300 ease-in-out hover:z-10 hover:-translate-y-1 hover:shadow-md"
									>
										<Avatar.Fallback class="text-xs">{getInitials(name)}</Avatar.Fallback>
									</Avatar.Root>
								</Tooltip.Trigger>
								<Tooltip.Content sideOffset={10}>{name}</Tooltip.Content>
							</Tooltip.Root>
						{/each}
					</div>
				</Tooltip.Provider>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar group with hover effect">
		{#snippet blurb()}
			Hovering the group fans it open: every avatar slides by a multiple of its own index, so the
			stack unpacks in place rather than reflowing.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 23. The fan is one CSS variable per item: `--index` carries the position and
					the two translate utilities read it — `-8px` per step at rest (the overlap), `+6px` per
					step while the container is hovered (the spread). The stacking order is inline as well,
					because it descends with the index rather than following DOM order.

					The container's group is named `avatars`, not `avatar`: `Avatar.Root` already opens a
					`group/avatar` of its own for the badge sizing rules, and reusing the name would make
					`group-hover/avatar:` resolve to whichever of the two is nearer.
				-->
				<div class="group/avatars flex items-center px-2 py-4">
					{#each demoHoverPeople as name, i (name)}
						<div
							class="group/avatar-item translate-x-[calc(var(--index)*-8px)] transition-all duration-300 ease-in-out will-change-transform group-hover/avatars:translate-x-[calc(var(--index)*6px)]"
							style="--index: {i}; z-index: {demoHoverPeople.length - i};"
						>
							<Avatar.Root
								class="origin-center ring-2 ring-card transition-transform duration-300 ease-in-out group-hover/avatar-item:scale-110"
							>
								<Avatar.Fallback class="text-xs">{getInitials(name)}</Avatar.Fallback>
							</Avatar.Root>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar group with hover effect and tooltips">
		{#snippet blurb()}
			The fan-out above with a name attached to each face — the two treatments compose, which is
			what upstream ships this third demo to show.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 24. Identical to c-avatar-23 except that each avatar is wrapped in a tooltip
					trigger; the transform stays on the positioned wrapper, so the trigger inherits it rather
					than fighting it.
				-->
				<Tooltip.Provider>
					<div class="group/avatars flex items-center px-2 py-4">
						{#each demoHoverPeople as name, i (name)}
							<div
								class="group/avatar-item translate-x-[calc(var(--index)*-8px)] transition-all duration-300 ease-in-out will-change-transform group-hover/avatars:translate-x-[calc(var(--index)*6px)]"
								style="--index: {i}; z-index: {demoHoverPeople.length - i};"
							>
								<Tooltip.Root>
									<Tooltip.Trigger class="rounded-full">
										<Avatar.Root
											class="origin-center ring-2 ring-card transition-transform duration-300 ease-in-out group-hover/avatar-item:scale-110"
										>
											<Avatar.Fallback class="text-xs">{getInitials(name)}</Avatar.Fallback>
										</Avatar.Root>
									</Tooltip.Trigger>
									<Tooltip.Content sideOffset={10}>{name}</Tooltip.Content>
								</Tooltip.Root>
							</div>
						{/each}
					</div>
				</Tooltip.Provider>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar group with numerical count">
		{#snippet blurb()}
			The overflow stated outside the group instead of inside it: the pill carries the remainder as
			text, which keeps every circle a face.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 25. Upstream separates the avatars with `border-background border-2`; the
					group primitive already draws that separation as a ring, so only its colour moves to the
					card — the same call every group on this page makes.
				-->
				<div class="flex w-fit items-center gap-1.5 rounded-full border p-0.5 shadow-xs">
					<Avatar.Group class="-space-x-1.5 *:data-[slot=avatar]:ring-card">
						{#each demoPeople as name (name)}
							<Avatar.Root class="size-7">
								<Avatar.Fallback class="text-xs">{getInitials(name)}</Avatar.Fallback>
							</Avatar.Root>
						{/each}
					</Avatar.Group>
					<p class="me-1.5 text-xs text-muted-foreground">+3</p>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Pilled small outline button with avatar">
		{#snippet blurb()}
			The same chip as a pill, with the avatar pulled out onto the rounded edge.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 26. `ps-0.5` is what lets the circle sit on the pill's curve instead of
					inside its padding. The avatar rings itself in `--background` rather than `--card` here,
					because an outline button IS the ground behind it.
				-->
				<Button variant="outline" size="sm" class="rounded-full ps-0.5">
					<Avatar.Root class="size-6 ring-2 ring-background">
						<Avatar.Fallback class="text-[0.625rem]">{getInitials("Shad Cn")}</Avatar.Fallback>
					</Avatar.Root>
					<span class="text-xs">@shadcn</span>
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Pilled small button with avatar">
		{#snippet blurb()}
			The filled twin of the pill above, where the ring has to take the button's own colour to read
			as a cut-out.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 27. -->
				<Button size="sm" class="rounded-full ps-0.5">
					<Avatar.Root class="size-6 ring-2 ring-primary">
						<Avatar.Fallback class="text-[0.625rem]">{getInitials("Shad Cn")}</Avatar.Fallback>
					</Avatar.Root>
					<span class="text-xs">@shadcn</span>
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar inside an empty state example">
		{#snippet blurb()}
			A group used as the illustration of an empty state, with the count chip doubling as the invite
			affordance.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 28. Two departures from upstream, both forced by what the faces are here:
					its three photographs carry `grayscale` to read as inactive, which does nothing to an
					initials chip already drawn in `--muted`; and the copy stays upstream's compact pair
					rather than moving to the house `Empty` component, whose title is `text-lg` — this is an
					inline empty state inside a card, not a full-page one.
				-->
				<div class="flex flex-col items-center gap-4 text-center">
					<Avatar.Group class="*:data-[slot=avatar]:ring-card">
						{#each demoDevelopers.slice(0, 3) as name (name)}
							<Avatar.Root>
								<Avatar.Fallback>{getInitials(name)}</Avatar.Fallback>
							</Avatar.Root>
						{/each}
						<Avatar.GroupCount class="ring-card" aria-label="Add collaborator">
							<UserPlusIcon aria-hidden="true" />
						</Avatar.GroupCount>
					</Avatar.Group>
					<div class="flex flex-col gap-0.5">
						<h3 class="text-sm font-medium">No active collaborators</h3>
						<p class="text-xs text-muted-foreground">Invite teammates to start working together.</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar group with icon count and button">
		{#snippet blurb()}
			The overflow chip states the remainder and a separate round button adds to it — the split a
			member list wants once the group itself stops being clickable.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 29. The button is `icon-sm` (32px) rather than upstream's `icon` (36px), so
					it lines up with the group's own 32px circles instead of standing a step proud of them.
				-->
				<Tooltip.Provider>
					<div class="flex gap-2">
						<Avatar.Group class="*:data-[slot=avatar]:ring-card">
							{#each demoDevelopers.slice(0, 3) as name (name)}
								<Avatar.Root>
									<Avatar.Fallback>{getInitials(name)}</Avatar.Fallback>
								</Avatar.Root>
							{/each}
							<Avatar.GroupCount class="ring-card">+5</Avatar.GroupCount>
						</Avatar.Group>
						<Tooltip.Root>
							<Tooltip.Trigger>
								{#snippet child({ props })}
									<Button {...props} variant="outline" size="icon-sm" class="rounded-full">
										<PlusIcon aria-hidden="true" />
									</Button>
								{/snippet}
							</Tooltip.Trigger>
							<Tooltip.Content>Add user</Tooltip.Content>
						</Tooltip.Root>
					</div>
				</Tooltip.Provider>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar with loading state demonstration">
		{#snippet blurb()}
			A spinner over a scrim, for the moment between choosing a new picture and the upload
			answering. It toggles every two seconds so both states can be seen.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 30. The overlay is a sibling of the avatar rather than a child, so the circle
					it clips to is the wrapper's — a child would sit UNDER the image, which is the one place a
					scrim must not be.
				-->
				<div class="relative w-fit">
					<Avatar.Root>
						<Avatar.Fallback>{getInitials("Alex Johnson")}</Avatar.Fallback>
					</Avatar.Root>
					{#if demoLoading}
						<div
							class="absolute inset-0 flex items-center justify-center rounded-full bg-background/60"
						>
							<Spinner class="text-primary" />
						</div>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar with custom badge">
		{#snippet blurb()}
			A mark of your own pinned to the root, for what
			<code class="text-[87.5%] text-primary">Avatar.Badge</code> does not cover — here a verified rosette
			at each of the four corners.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 31. Upstream inlines the rosette as a two-path SVG filled `blue-500` and
					white; Lucide's `badge-check` is that same shape, so it is drawn from the icon set every
					other page uses and takes `--primary` for the body with `--primary-foreground` for the
					check. The icon states its own size because its parent is a bare span — nothing here is
					sizing it for us.
				-->
				<div class="flex flex-wrap gap-4">
					{#each demoCustomBadgeCorners as person (person.corner)}
						<Avatar.Root size="lg">
							<Avatar.Fallback>{getInitials(person.name)}</Avatar.Fallback>
							<span class="absolute {person.corner}">
								<BadgeCheckIcon
									class="size-4 fill-primary text-primary-foreground"
									aria-hidden="true"
								/>
							</span>
						</Avatar.Root>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar with ring animation">
		{#snippet blurb()}
			A pulsing ring for someone who is live right now — louder than the presence dot, and meant to
			be noticed from across the page.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 32. The dot is a sibling of the avatar, not an `Avatar.Badge` inside it: the
					pulse animates opacity across the whole subtree, and a presence dot that fades in and out
					is reporting something it does not mean. Upstream's `green-500` is `--success`, and the
					ring offset takes the card for the reason the header note gives.
				-->
				<div class="relative w-fit">
					<Avatar.Root class="animate-pulse ring-2 ring-success ring-offset-2 ring-offset-card">
						<Avatar.Fallback>{getInitials("Alex Johnson")}</Avatar.Fallback>
					</Avatar.Root>
					<span
						class="absolute -right-1 -bottom-1 size-3 rounded-full bg-success ring-2 ring-card"
						aria-label="Online"
					></span>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar with gradient animated ring">
		{#snippet blurb()}
			The story ring: a blurred gradient turning behind the avatar, tightening when it is hovered.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 33. Upstream sweeps `yellow-400 -> fuchsia-500 -> violet-600`; the three
					semantic tokens nearest that arc are warning, destructive and primary, which keeps the
					sweep without inventing a palette the theme does not hold.

					The wrapper's group is named `story` for the reason the fan-out section gives: `avatar` is
					already taken by `Avatar.Root` itself.
				-->
				<div class="group/story relative flex w-fit items-center justify-center">
					<div
						class="absolute -inset-1 animate-[spin_3s_linear_infinite] rounded-full bg-linear-to-tr from-warning via-destructive to-primary opacity-75 blur-xs transition-all duration-500 group-hover/story:opacity-100 group-hover/story:blur-sm"
					></div>
					<Avatar.Root
						size="lg"
						class="ring-2 ring-card transition-transform duration-500 group-hover/story:scale-95"
					>
						<Avatar.Fallback>{getInitials("Jenny Wilson")}</Avatar.Fallback>
					</Avatar.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar with multiple badges">
		{#snippet blurb()}
			Two marks on one avatar: presence in the slot that anchors bottom-right, and an unread count
			pinned to the opposite corner.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 34. Only one of the two is `Avatar.Badge` — the slot anchors itself, so a
					second would land on top of the first; the counter is a bare span with its own corner,
					overhanging the circle the way a notification bubble does.
				-->
				<Avatar.Root>
					<Avatar.Fallback>{getInitials("Alex Johnson")}</Avatar.Fallback>
					<Avatar.Badge class="bg-success ring-card" aria-label="Online" />
					<span
						class="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground ring-2 ring-card"
					>
						3
					</span>
				</Avatar.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Compact avatar dropdown menu">
		{#snippet blurb()}
			The account switcher a compact header carries: the avatar, the name, and the two-way chevron
			that says the pill opens.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 35. The chevron drops its `size-3.5`: `Button` sizes any unsized icon inside
					it, and the opacity was the part actually saying something. Teams takes the multi-person
					icon — upstream draws it with the same single figure as Profile, which its icon-placeholder
					scaffolding explains and a real menu does not.
				-->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Button {...props} variant="outline" size="sm" class="rounded-full ps-1 pe-2.5">
								<Avatar.Root class="size-6 ring-2 ring-background">
									<Avatar.Fallback class="text-[0.625rem]"
										>{getInitials("Liam Thompson")}</Avatar.Fallback
									>
								</Avatar.Root>
								<span class="text-xs font-medium">Liam Thompson</span>
								<ChevronsUpDownIcon class="opacity-60" aria-hidden="true" />
							</Button>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content class="w-44" align="center" sideOffset={8}>
						<DropdownMenu.Group>
							<DropdownMenu.Label>Management</DropdownMenu.Label>
							<DropdownMenu.Item>
								<UserIcon />
								<span>Profile</span>
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<SettingsIcon />
								<span>Settings</span>
							</DropdownMenu.Item>
						</DropdownMenu.Group>
						<DropdownMenu.Separator />
						<DropdownMenu.Group>
							<DropdownMenu.Item>
								<UsersIcon />
								<span>Teams</span>
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<PlusIcon />
								<span>Invite</span>
							</DropdownMenu.Item>
						</DropdownMenu.Group>
						<DropdownMenu.Separator />
						<DropdownMenu.Item variant="destructive">
							<LogOutIcon />
							<span>Log out</span>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
