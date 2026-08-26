<script lang="ts" module>
	/**
	 * The trail's step type lives with the component that renders it, and is re-exported here
	 * because `PageHeader` is what a page imports — `DocPage.svelte` builds a trail and never needs
	 * to know which component draws it.
	 */
	import type { Crumb } from "$lib/components/layout/BreadcrumbTrail.svelte";
	export type { Crumb };
</script>

<script lang="ts">
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import BreadcrumbTrail from "$lib/components/layout/BreadcrumbTrail.svelte";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";
	import ModeToggle from "$lib/components/navigation/ModeToggle.svelte";
	import { cn } from "$lib/utils.js";
	import { headerAutoHide, headerFloating } from "$lib/hooks/header-behaviour.svelte.js";
	import { useReducedMotion } from "$lib/shared/reduced-motion.svelte.js";

	/**
	 * The bar every page opens with: sidebar trigger, breadcrumb, the search field, then the
	 * light/dark toggle. It carried four appearance controls once — this bar's own mode, the
	 * sidebar's, the palette picker, light/dark — and the first three moved to the Settings page,
	 * which can name and explain them; the slot comment below says what that cost and bought.
	 *
	 * WHY THIS IS SHARED — the header itself is identical on every page; only the breadcrumb
	 * differs. Before this component each page carried its own copy, which was fine with one
	 * page and would have been four near-identical copies with four, let alone eighty-odd. The
	 * page still decides its own trail, and that is the rule: the breadcrumb is page-specific
	 * content, chosen by the page.
	 *
	 * `Sidebar.Trigger` only needs to be somewhere inside `Sidebar.Provider` to work — it
	 * reads the sidebar from context, not from a prop — so it does not care that it moved.
	 *
	 * TWO ELEMENTS, ALWAYS. The sticky box is the WRAPPER and the painted chrome is the BAR inside
	 * it. They are never collapsed into one and never rendered conditionally, so the floating option
	 * changes classes and nothing remounts. The split is what makes floating possible at all: that
	 * variant insets the bar by 8px, and if the sticky box were the rounded bar itself the page
	 * would scroll visibly through the gap above and beside it. The wrapper's own ground covers
	 * that band.
	 *
	 * NOTHING ABOVE THIS COMPONENT MAY GAIN `overflow-x: hidden`. `position: sticky` resolves
	 * against the nearest scrolling ancestor, and per MDN an `overflow-x: hidden` beside an
	 * `overflow-y: visible` is computed as `auto` — which silently turns the shell into a scroll
	 * container and kills the sticky on all 109 pages with no error anywhere. If a horizontal clip
	 * is ever needed up there, it has to be `overflow-x: clip`, which stays `clip`.
	 *
	 * EVERY SLOT IS A SNIPPET WITH A DEFAULT, AND NOTHING IS REQUIRED — `<PageHeader />` must
	 * render a correct bar. The defaults ARE the demo's bar; each snippet exists for the caller
	 * whose content differs, not to make assembly a chore:
	 *
	 *   `sidebarTrigger` — the trigger AND its separator, as one unit: a rule with nothing
	 *     before it is furniture pointing at nothing. A snippet rather than a boolean because
	 *     `Sidebar.Trigger` reads its context and THROWS outside a `Sidebar.Provider` — a
	 *     caller with a custom shell passes an empty snippet instead of crashing.
	 *   `breadcrumb` — receives `trail`; the default renders `BreadcrumbTrail`. Whatever
	 *     replaces it inherits the contract stated on the slot below: a box whose width its own
	 *     content must not change, or the measurement inside oscillates.
	 *   `search` — EMPTY by default. The one slot inseparable from an application's own route
	 *     table (the demo passes its command palette from `DocPage`). The bar's centring never
	 *     depended on it: the two `flex-1` halves simply meet.
	 *   `controls` — the light/dark toggle, alone. The palette picker and the two panel
	 *     switches moved to the Settings page, which can afford to name and explain them; a
	 *     caller who wants any of them back in the bar renders its own group here.
	 *
	 * `restProps` spreads onto `<header>` BEFORE the class and the two data attributes, so a
	 * caller can label the landmark but cannot clobber `data-floating`/`data-hidden` — those are
	 * the contract the published appearance CSS selects on.
	 */
	let {
		trail = [],
		class: className,
		barClass,
		sidebarTrigger,
		breadcrumb,
		search,
		controls,
		...restProps
	}: {
		trail?: Crumb[];
		class?: string;
		/** Merged onto the BAR (`data-slot="page-header-bar"`), not the sticky wrapper. */
		barClass?: string;
		sidebarTrigger?: Snippet;
		breadcrumb?: Snippet<[Crumb[]]>;
		search?: Snippet;
		controls?: Snippet;
		/*
		 * `children` is omitted too: `HTMLAttributes` declares it as a snippet, so nesting
		 * content in `<PageHeader>` would TYPE-CHECK, fall into `restProps`, and be stringified
		 * onto `<header>` as a junk attribute while rendering nothing. Omitting it turns that
		 * silent no-op into a compile error pointing at the snippets that do exist.
		 */
	} & Omit<HTMLAttributes<HTMLElement>, "class" | "children"> = $props();

	const reducedMotion = useReducedMotion();

	/**
	 * Auto-hide: is the bar currently slid out of the way?
	 *
	 * The algorithm is headroom.js's, read from its source rather than its docs because the two
	 * details that matter are only there.
	 *
	 * `ARM` is the height of the bar itself, which lets the rule state as "hide only once the header
	 * has scrolled its own height". Below it the bar is force-pinned — headroom's unconditional
	 * top check — because without that a fast flick can leave it hidden at the very top of a
	 * document, where there is nothing to reveal by scrolling up.
	 *
	 * `UP` is hysteresis, and it is deliberately asymmetric: reveal on the slightest upward intent,
	 * hide only on deliberate downward movement. A symmetric threshold makes the bar flap whenever
	 * a gesture wobbles across it.
	 */
	const ARM = 64;
	const UP = 5;
	const DOWN = 0;

	let hidden = $state(false);
	let lastY = 0;

	/**
	 * Seed from the CURRENT position, not from zero.
	 *
	 * A page change does reset the scroll — the demo's router hands a target to its shell, which
	 * applies it once the page's chunk has mounted — but this component cannot assume it has
	 * happened yet, or at all: a landing on a `#section` deliberately leaves the position to the
	 * page, and this bar has no way to tell the two apart. A component mounting at y=1200 with
	 * `lastY = 0` would read its first event as a 1200px scroll up, so the seed is measured
	 * rather than assumed. The jump guard in `onscroll` covers what happens next.
	 */
	$effect(() => {
		lastY = window.scrollY;
	});

	/**
	 * Drop the latch while a veto holds. `onscroll` returns early when auto-hide is off or
	 * motion is reduced, so a `hidden` latched beforehand would survive the whole veto and
	 * take effect the instant the flag comes back on — sliding the bar away wherever the
	 * reader happens to be, including the top of the page the `y <= ARM` pin exists to
	 * protect. `lastY` re-seeds on every flag change — veto entry AND exit — so the first
	 * live event never reads everything scrolled during the veto as one gesture.
	 */
	$effect(() => {
		if (!headerAutoHide.current || reducedMotion.current) {
			hidden = false;
		}
		lastY = window.scrollY;
	});

	function onscroll() {
		if (!headerAutoHide.current || reducedMotion.current) return;

		const y = window.scrollY;
		const max = document.documentElement.scrollHeight - window.innerHeight;

		// Safari reports positions past both ends during rubber-band; Chrome and Firefox clamp.
		// Those samples are genuine reversals in the numbers and would flap the bar at every end
		// of every page, so they are discarded rather than interpreted.
		if (y < 0 || y > max) return;

		if (y <= ARM) {
			hidden = false;
			lastY = y;
			return;
		}

		const delta = y - lastY;

		/*
		 * A jump further than the viewport is an ARRIVAL, not a gesture — and this bar answers
		 * gestures.
		 *
		 * A movement that large came from code: `scrollIntoView` when a reader opens a link to a
		 * section, or a router returning to a stored position. Measuring it as a downward gesture
		 * hides the bar the instant somebody arrives somewhere they did not scroll to, which is
		 * precisely when they most need the trail that says where they are. So the bar is shown
		 * and the measurement restarts from the landing.
		 *
		 * SHOWING IT, not merely re-seeding, is the half that matters: a reader who scrolled down
		 * (bar hidden) and then followed a section link would otherwise arrive at a page whose
		 * chrome is still tucked away, with nothing on screen naming where they now are.
		 *
		 * A very fast drag of the scrollbar can also clear a viewport between two events and will
		 * be read as an arrival. Revealing the bar is the harmless outcome of the two.
		 */
		if (Math.abs(delta) > window.innerHeight) {
			hidden = false;
			lastY = y;
			return;
		}

		if (delta > DOWN) hidden = true;
		else if (-delta > UP) hidden = false;
		lastY = y;
	}

	/**
	 * `data-hidden` is set ONLY when hidden, never as `data-hidden="false"`.
	 *
	 * The movement itself lives in `app.css`, on the `translate` property, together with the two
	 * rules that veto it — see the block there for why it is not a Tailwind utility. What matters
	 * on this side is the absence: with no attribute there is no `translate` declaration at all,
	 * and an element with no transform of any kind is not a containing block for fixed descendants.
	 * Every menu in this bar is portaled out today so nothing would break either way, but leaving a
	 * permanent containing block here is a trap for whoever adds the next control.
	 */
	const hiddenNow = $derived(headerAutoHide.current && !reducedMotion.current && hidden);
</script>

<svelte:window {onscroll} />

<header
	{...restProps}
	data-slot="page-header"
	data-floating={headerFloating.current ? "" : undefined}
	data-hidden={hiddenNow ? "" : undefined}
	class={cn(
		// `transition-transform` covers `translate` too — in Tailwind v4 it resolves to
		// `transition-property: transform, translate, scale, rotate`. 300ms rather than the app's
		// usual 150-200ms reflex: NN/g put the readable range for a bar of this size at 300-400ms,
		// and this is not a menu.
		// `w-0 min-w-full` is the one that stops this bar widening the whole application, and it
		// is not interchangeable with `min-w-0`. The shell sizes `<main>` from its children's
		// MIN-CONTENT, and a header row holding a breadcrumb, a 256px search field and four
		// controls has a large one — measured, it pushed `<main>` from 783px to 1001px at a
		// 1032px viewport and put a horizontal scrollbar on every page. `width: 0` removes this
		// element from that calculation; `min-width: 100%` then fills whatever `<main>` settled
		// on. `min-w-0` alone does not work here: it lets the box shrink, but the row's
		// min-content still reaches the parent.
		"sticky top-0 z-40 w-0 min-w-full shrink-0 transition-transform duration-300 ease-linear",
		// The wrapper paints the page's own ground so that, in the floating variant, content cannot
		// be seen through the 8px band around the panel. Flat, it is simply the colour already
		// behind the bar.
		"bg-background",
		// `pb-0`, and it is the whole point of writing the inset out longhand.
		//
		// A symmetric `p-2` puts an 8px band of OPAQUE page ground below the panel as well as above
		// it. Above is necessary — the wrapper is what stops content being seen in the strip over a
		// floating bar. Below it is dead: content scrolling up is cut 8px before it reaches anything
		// visible, which reads as a gap that swallows a line of text rather than as a panel with
		// content passing under it.
		//
		// With the band gone the wrapper ends exactly at the panel's lower edge, and the fade in
		// `app.css` takes over from there — it sits BELOW the sticky box, so it dissolves the last
		// few pixels without reserving any space of its own.
		headerFloating.current && "p-2 pb-0",
		className,
	)}
>
	<!--
		Focus and open menus pin the bar, in CSS rather than in the scroll handler.

		`:has(:focus-visible)` catches a keyboard user who is inside the bar when the page scrolls
		(the block in `app.css` says why it is not `:focus-within`); `:has([data-state=open])`
		catches the portaled menus, where focus has left the header's DOM but the trigger still
		reports itself open. A dialog locks body scroll outright, so that case cannot arise at all.
	-->
	<div
		data-slot="page-header-bar"
		class={cn(
			"flex h-16 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12",
			// `text-foreground` is NOT redundant beside the alias block in `app.css`. That block
			// re-points `--foreground` on this element, but `color` INHERITS a computed value: every
			// control in here would otherwise keep the ink `<main>` resolved from the PAGE's
			// `--foreground`, so a bar pinned light on a dark page renders white icons on white. The
			// house note is exactly this — a subtree that scopes a ground must declare its ink too.
			"text-foreground",
			// `overflow-hidden` is not decoration: the bar is a fixed-height row whose children are
			// wider than it on a narrow viewport, and without it the appearance cluster paints
			// OUTSIDE the panel — over the page, in the chrome's ink, which on a pinned bar is the
			// page's own colour and therefore invisible. It also clips the rounded corners. Safe on
			// the sticky: the sticky box is the wrapper, and an overflow on a DESCENDANT does not
			// re-parent it.
			"overflow-hidden",
			"bg-sidebar",
			// `ring-inset` is what keeps the panel's LOWER hairline visible, and it became necessary
			// the day the wrapper went `pb-0`. A default ring is drawn outside the border box, and
			// with no bottom band the wrapper now ends exactly at the panel's lower edge — so the
			// ring's bottom pixel lands at `top: 100%`, which is precisely where `app.css` hangs the
			// fade. The fade is a positioned pseudo-element and paints over in-flow content, so it
			// covered that pixel and the panel appeared to have three edges. Inset, the hairline is
			// inside the box — where the flat variant's `border-b` has always drawn its own — and the
			// fade begins strictly below it.
			headerFloating.current
				? "rounded-lg shadow-sm ring-1 ring-sidebar-outline ring-inset"
				: "border-b border-b-sidebar-outline",
			barClass,
		)}
	>
		<!--
			`flex-1` and an EXPLICIT `min-w-36`, replacing the `min-w-0` this group used to carry. The
			pair is what gives `BreadcrumbTrail` a budget it can measure, and neither half is
			interchangeable with anything else.

			`flex-1` AND NOT `grow`, and the difference is the whole centring mechanism. `grow` is
			`flex-grow: 1` over a `flex-basis: auto`, which hands this group ALL of the bar's free
			space; the search field then sits wherever the trail's content pushes it, which is what it
			did for as long as this bar existed. `flex-1` is `flex: 1 1 0%`: both this group and the
			appearance cluster now grow from a ZERO basis, so flexbox deals the free space out in equal
			halves — and a field flanked by two equal flexes is at the centre of the bar, exactly, at
			every width where both halves clear their floors. (Auto margins on the field cannot do
			this: the spec resolves flexible lengths FIRST, so a margin beside a growing sibling
			receives nothing.)

			Either way the trail's slot stays a pure function of the BAR's width — all free space, or
			half of it — never of the trail's own content, which is the one precondition the
			measurement inside it cannot do without. The floor then stops the group being squeezed to
			nothing when the bar is over-subscribed: with `min-width: auto` the group's floor would be
			its own min-content — which INCLUDES the trail — and a floor that moves with the content is
			exactly the feedback loop `overflow-fit.ts` explains.

			BOTH FLOORS ARE MEASURED VALUES, not round numbers. The group's fixed furniture is ~85px
			(32px of padding, the 32px trigger, the rule and three gaps).

			`sm:min-w-36` — 144px, i.e. the furniture plus ~59px, which is the ellipsis and its
			separator. It was once the LARGEST floor that fitted: at a 780px viewport with the sidebar
			open the bar is 514px, and the appearance cluster alone claimed 377px of it, so 144 was
			exactly what remained. The cluster is one button now — 72px — and the same case has 442px
			to deal out, so this floor is no longer the ceiling it was. It stays where it is anyway:
			the floor only decides anything once the bar is over-subscribed, which now happens well
			below `sm`, and a larger number would only take the search field's width in the band where
			both still fit.

			`min-w-16` below `sm` — 64px, which is the trigger and its padding and nothing else. Under
			640px the bar is still over-subscribed by the search field, and the trail is the honest thing
			to give up there — but the sidebar trigger is not, because on a phone it is the only way to
			the navigation at all, and with no floor at all flexbox will happily shrink it away. (The
			pressure used to come from the cluster: four icon dropdowns were 302px on a phone, against
			the 72px one toggle costs now.)

			So the order in which this bar gives, narrowest first: the trail collapses its steps into the
			menu, the current page truncates, the search field gives up its label and its width, and
			below `sm` the trail goes entirely. The cluster never gives — an icon button has no
			compressible axis — but it no longer decides the numbers above either, now that it is one
			button rather than four. Centring moved
			the FIRST of those earlier: the trail's slot is now half the bar rather than all of it, so a
			long trail starts collapsing at widths where it used to fit whole. That is the price of a
			centred field, and it is paid by the one group that was built to give.

			`overflow-hidden` because the mirror `BreadcrumbTrail` measures itself against is wider than
			this box by design.
		-->
		<div class="flex min-w-16 flex-1 items-center gap-2 overflow-hidden px-4 sm:min-w-36">
			{#if sidebarTrigger}
				{@render sidebarTrigger()}
			{:else}
				<Sidebar.Trigger class="-ms-1 shrink-0" />
				<Separator orientation="vertical" class="me-2 shrink-0 data-[orientation=vertical]:h-4" />
			{/if}
			<!--
				`min-w-0 flex-1`: the slot takes whatever the group has left after the trigger and the
				rule, and contributes nothing back to the group's own minimum. That is what makes its
				width a pure function of the BAR's width — collapse a step and this box does not move —
				which is the one precondition the measurement inside it cannot do without. An override
				must keep that shape: render into a `min-w-0 flex-1` box whose width its own content
				cannot change, or the trail's measurement loops.
			-->
			{#if breadcrumb}
				{@render breadcrumb(trail)}
			{:else}
				<BreadcrumbTrail {trail} class="min-w-0 flex-1" />
			{/if}
		</div>
		<!--
		The search sits between the breadcrumb and the appearance cluster: it belongs to neither. The
		breadcrumb says where you are and the cluster says how the page looks; this is the one control
		that changes where you go, so it sits at the bar's centre with the gap around it doing the
		separating.

		THE SLOT IS EMPTY BY DEFAULT — the field is the one control inseparable from the
		application's own route table, so the application supplies it (the demo's `DocPage`
		passes its command palette here). Whatever is passed must still carry `min-w-0 shrink`: it
		is the designated giver when the bar runs out of room. It rarely has to give now — with the
		cluster down to one button the field holds its full width at every width from `sm` up, where
		it used to be squeezed to 18px at 780 — but the contract is unchanged, because a caller who
		puts its own group in `controls` can spend that room again.

		NO CLASS OF ITS OWN: the centring lives entirely in the two `flex-1` neighbours (see the
		comment above), which is what makes it degrade instead of break. When their equal halves stop
		fitting, the cluster freezes at its content and the trail's half gives — the field drifts off
		exact centre rather than overlapping anything — and once the bar itself is over-subscribed
		the field's own `min-w-0 shrink` compresses it, label first, exactly as before.

		WHY NOT ABSOLUTE CENTRING, which would hold the exact centre a little longer. It takes the
		field out of flow, where `min-w-0 shrink` stops applying — so in any over-subscribed bar (a
		caller with its own control group, or a viewport below `sm`) an exactly centred field would
		sit ON the breadcrumb.
		Worse, the trail's slot would extend underneath the field, so the mirror `BreadcrumbTrail`
		measures against would report room the reader cannot see, and the trail would truncate under
		the search instead of collapsing into its menu.
	-->
		{#if search}
			{@render search()}
		{/if}
		<!--
		ONE CONTROL, the light/dark toggle. The header toggle, the sidebar toggle and the palette
		picker used to stand beside it and now live on the Settings page, which offers all three with
		room for their names and a sentence each — and offers what the cluster could not, such as
		`system` mode, since this toggle is a deliberate two-state `Swap`.

		WHAT THAT BOUGHT, measured at 780px with the sidebar open, the tightest case in the range:
		the cluster's content was 377px and is 72px, and the difference came straight out of the
		search field, which was being squeezed to 18px while the cluster still overflowed the bar by
		41px and was clipped. The field now keeps its full 256px, at every width down to `sm`.

		Light/dark stays because it is the one appearance choice a reader makes WHILE READING — the
		room got brighter, the screen is too bright at night — where a palette or an inverted rail is
		set once and left. It is also the cheapest: one icon, no menu, no scope to explain. Everything
		with a scope to explain went to the page that can explain it.

		`flex-1 justify-end` is the right half of the centring pair — see the left group's comment.
		The default `min-width: auto` is kept DELIBERATELY, where the left group overrides its own:
		this cluster is the one part of the bar that never gives, and min-content is exactly the floor
		that says so — a floor that now costs 72px instead of 377. `justify-end` parks the button
		against the right edge, so the grown half is empty space on its left, between it and the
		search, where it belongs.

		`gap-1` rather than the header's own `gap-2` survives a single child on purpose: a caller
		overriding `controls` renders a GROUP here, and the gap is part of the slot's contract.
	-->
		<div class="flex flex-1 items-center justify-end gap-1 px-4">
			{#if controls}
				{@render controls()}
			{:else}
				<ModeToggle />
			{/if}
		</div>
	</div>
</header>
