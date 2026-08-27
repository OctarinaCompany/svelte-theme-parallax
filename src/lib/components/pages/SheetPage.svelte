<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import * as Sheet from "$lib/components/ui/sheet/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
	import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
	import { cn } from "$lib/utils.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Sheet component page, ported from shadcn-svelte's own documentation
	 * (https://shadcn-svelte.com/docs/components/sheet) — its three examples in the order the
	 * docs give them: the "Edit profile" panel, `side`, and `size`.
	 *
	 * THE CLASSIC THEME'S COUNTERPART IS THE CLASSIC `.offcanvas`. It is documented at
	 * `the reference docs#offcanvas` with a single card holding one trigger ("Link with
	 * href"), and the classic theme ships three ready-made panels in `src/partials/offcanvas/`
	 * (`offcanvas-demo`, `offcanvas-search`, `offcanvas-activity`) that the dashboard pages open
	 * from the topbar.
	 *
	 * The classic theme's own reference-stylesheet section is twenty-three lines: it adds padding and a bottom rule to
	 * `.offcanvas-header`, and swaps the panel background in dark mode. Everything else the panel
	 * shows is the classic framework resolved against the classic theme's variables, read here from the compiled
	 * reference bundle rather than reasoned about:
	 *
	 *   --bs-offcanvas-width       350px      `offcanvas-horizontal-width` (the classic is 400px)
	 *   --bs-offcanvas-height      30vh
	 *   --bs-offcanvas-padding-x   1.5rem     `offcanvas-padding-x: modal-inner-padding`
	 *   --bs-offcanvas-padding-y   1.5rem     `modal-inner-padding`
	 *   --bs-offcanvas-bg          body-bg    `gray-800-dark` in dark
	 *   --bs-offcanvas-color       body-color
	 *   --bs-offcanvas-border-color transparent  via `modal-content-border-color: transparent`
	 *   --bs-offcanvas-transition  transform .3s ease-in-out
	 *
	 * WHAT ALREADY AGREES, and is therefore left alone: `bg-clip-padding` on `Sheet.Content` is
	 * the classic `background-clip: padding-box`; `text-sm` resolves to `font-size-base`, which
	 * is `--bs-offcanvas-color`'s size; `text-popover-foreground` is `body-color` in both modes;
	 * `fixed` and `flex flex-col` are the box the classic framework builds.
	 *
	 * THE EDGE ANCHORS NO LONGER MATCH IT. The classic panel is flush against the viewport with
	 * square corners, and that is what this page ported; `app.css` now insets every sheet by
	 * 8px and rounds it, so it reads as the same kind of object as the floating sidebar. That
	 * is a deliberate departure from the classic theme, argued at the rule — only the shape moves, and
	 * the surface below stays this theme's.
	 *
	 * WHAT THE CLASSIC THEME DOES NOT HAVE AT ALL:
	 *
	 *   the description   `.offcanvas-header` holds a title and a close control, nothing else.
	 *                     The classic theme's nearest idiom is `<p class="small text-body-secondary">` in
	 *                     the body (`offcanvas-demo.html`), which is not a header slot, so
	 *                     `Sheet.Description` keeps shadcn's `text-sm text-muted-foreground`
	 *   the footer        there is no `.offcanvas-footer`. The classic theme's own demo panel puts a SECOND
	 *                     `.offcanvas-header` after the body to carry its submit button, so the
	 *                     footer below borrows that element's metrics with the rule flipped
	 *   the close button  the classic `.btn-close` is a `.5em` background-image X sitting inside
	 *                     the header row, and the reference stylesheet adds `float: right` to it — a
	 *                     different object from shadcn's 32px ghost icon button, which
	 *                     `Sheet.Content` positions absolutely at `top-4 right-4` and exposes no
	 *                     `class` prop for. Kept as shipped; only `showCloseButton` is reachable,
	 *                     and hiding it would leave the panel with no dismiss affordance
	 *
	 * THE MOTION IS ONLY HALF PORTED. `offcanvas-transition` slides the panel its full width
	 * (`transform: translateX(-100%)` to none) with no opacity change; shadcn cross-fades a
	 * 2.5rem slide. The duration is a plain utility and is corrected below, but the distance and
	 * the fade live in `tw-animate-css` classes that tailwind-merge does not know, so overriding
	 * them would leave two rules setting the same custom property and let Tailwind's sort order
	 * decide the winner. Left as shadcn's rather than made non-deterministic.
	 *
	 * THE BACKDROP IS NOT REACHABLE FROM HERE. `Sheet.Content` renders `<SheetOverlay />` itself
	 * and forwards props only to the portal, so the classic theme's scrim (`offcanvas-backdrop-bg: black`
	 * at `.5`, against shadcn's `bg-black/10` plus a blur) is returned as a global rule instead.
	 */

	/**
	 * The panel's surface. Every class here evicts a shadcn default:
	 *
	 *   bg-background dark:bg-popover
	 *     `--bs-offcanvas-bg: var(--bs-body-bg)` = `gray-100` (#F9FBFD) in light, and
	 *     the reference stylesheet's dark block swaps it to `gray-800-dark` (#152E4D). No single token
	 *     holds both: `--background` is #F9FBFD / #12263F and `--popover` is #FFFFFF / #152E4D,
	 *     so each mode takes the token that is exact for it. This is the same split the Input
	 *     page makes for `input-bg`, and one of the few legitimate uses of `dark:` here — the
	 *     pair is not a colour override, it is two different classic-theme variables.
	 *
	 *   border-transparent
	 *     `--bs-offcanvas-border-color` resolves to `transparent` (the classic theme sets
	 *     `modal-content-border-color: transparent`, which `offcanvas-border-color` defaults
	 *     to). The 1px edge stays — with `bg-clip-padding` the background stops at the padding
	 *     box, so the frame shows the backdrop through it, exactly as the classic framework draws it.
	 *
	 *   shadow-none
	 *     `--bs-offcanvas-box-shadow` is declared and never consumed: the compiled `.offcanvas`
	 *     rule carries no `box-shadow` at all. shadcn ships `shadow-lg`. Elevation is deferred
	 *     repo-wide in any case, as the Select, Command and Hover card pages record.
	 *
	 *   gap-0
	 *     the classic offcanvas is a plain `flex-direction: column` with no gap — the header's
	 *     bottom rule is what separates it from the body. shadcn's `gap-4` would open 16px of
	 *     panel background under that rule.
	 *
	 *   duration-300
	 *     `offcanvas-transition: transform .3s ease-in-out`; shadcn animates for 200ms. The
	 *     easing already matches (`ease-in-out` on `Sheet.Content`).
	 */
	const panel = "gap-0 border-transparent bg-background shadow-none duration-300 dark:bg-popover";

	/**
	 * The panel's measurements.
	 *
	 *   left/right   `offcanvas-horizontal-width: 350px`, against shadcn's `w-3/4` capped at
	 *                `sm:max-w-sm` (384px). `max-w-full` is the classic `max-width: 100%`, which
	 *                shadcn only states from `sm` up
	 *   top/bottom   `--bs-offcanvas-height: 30vh`, against shadcn's `h-auto`
	 *
	 * The `data-[side=…]:` prefixes are not decoration. `Sheet.Content`'s own width and height
	 * classes carry them, which makes each selector `(0,2,0)`; a bare `w-[350px]` would be
	 * `(0,1,0)` and lose regardless of source order. Restating the prefix puts the two classes in
	 * the same tailwind-merge group so the later one simply replaces the earlier.
	 */
	const panelSize =
		"max-w-full data-[side=bottom]:h-[30vh] data-[side=left]:w-[350px] data-[side=right]:w-[350px] data-[side=top]:h-[30vh] data-[side=left]:sm:max-w-[350px] data-[side=right]:sm:max-w-[350px]";

	/**
	 * `.offcanvas-header`. The padding is `offcanvas-header-padding-y: 1rem` by
	 * `offcanvas-header-padding-x`, which is `--bs-offcanvas-padding-x` (1.5rem) — so the header
	 * is inset like the body horizontally but tighter vertically. shadcn uses a flat `p-4`.
	 *
	 * `border-b` is the ONE thing the reference stylesheet adds to the classic framework:
	 * `border-bottom: var(--bs-border-width) solid var(--bs-border-color)`. Neither the classic framework nor
	 * shadcn draws it. The colour is one grey step off in light — `--bs-border-color` is
	 * `gray-300` (#E3EBF6) where `--border` holds `gray-200` (#EDF2F9) — and exact in dark
	 * (both `gray-700-dark`). The same approximation the Accordion page documents; #E3EBF6 has
	 * no token of its own here.
	 *
	 * The header stays a COLUMN. The classic is a `justify-content: space-between` row holding
	 * the title and `.btn-close`, but it has no description to stack, and the docs example does.
	 * shadcn's `gap-1.5` between the two lines has no classic counterpart and is left alone.
	 */
	const header = "border-b px-6 py-4";

	/**
	 * `.offcanvas-body`: `flex-grow: 1; overflow-y: auto; padding: var(--bs-offcanvas-padding-y)
	 * var(--bs-offcanvas-padding-x)` — 1.5rem all round, both being `modal-inner-padding`.
	 * shadcn has no body component; its docs example is a bare `div` with `px-4` and no scroll
	 * container, which matters here because the panel now owns a fixed height on top and bottom.
	 */
	const body = "flex-1 overflow-y-auto p-6";

	/**
	 * The footer. The classic theme has no `.offcanvas-footer`, so the metrics come from the second
	 * `.offcanvas-header` its own demo panel uses for this job (`src/partials/offcanvas/
	 * offcanvas-demo.html`) — same `px-6 py-4`, with the rule moved to the top edge, which is
	 * where a bar below the body needs it. `mt-auto` and the stacked full-width buttons are
	 * shadcn's, and match what that demo does with `btn w-100`.
	 */
	const footer = "border-t px-6 py-4";

	/** `.btn-primary` at the base size, as derived on the Buttons page. */
	const trigger = cn(
		buttonVariants(),
		"h-10 rounded-md px-3 text-sm font-normal",
		"border-primary bg-primary text-primary-foreground hover:border-[color-mix(in_srgb,var(--primary)_85%,black)] hover:bg-[color-mix(in_srgb,var(--primary)_85%,black)]",
	);

	/** `.btn-white` at the base size, as derived on the Buttons page. */
	const neutral = cn(
		buttonVariants(),
		"h-10 rounded-md px-3 text-sm font-normal",
		"border-border bg-card text-card-foreground hover:bg-accent dark:hover:bg-background",
	);

	/*
	 * The two fields need no classes: `.form-control` is stated globally in `app.css`, on
	 * `[data-slot='input']`, so a plain `Input` already wears it.
	 */

	/**
	 * `form-label-margin-bottom: .5rem`, the classic untouched default, expressed as the grid
	 * gap; `font-normal` because `.form-label` declares no weight and inherits `font-weight-base`
	 * (400) where shadcn's `Label` asks for 500. Both as the Field page derives them.
	 *
	 * The docs example puts `text-end` on these labels — a leftover from the Dialog page it was
	 * copied from. The classic theme's `.form-group` stacks a start-aligned label above its control, so it
	 * is dropped.
	 */
	const fieldLabel = "font-normal";

	/**
	 * The four edges, in the order the shadcn docs list the `side` values.
	 *
	 * Each carries the dimension a panel on that edge is sized by, which is the one thing that
	 * differs between them: a side panel is measured across, a top or bottom one down.
	 */
	const sides = [
		{ side: "top", label: "Top", measure: "height" },
		{ side: "right", label: "Right", measure: "width" },
		{ side: "bottom", label: "Bottom", measure: "height" },
		{ side: "left", label: "Left", measure: "width" },
	] as const;

	/*
	 * The sections below are the sheet demo set. Its demo 1 (the "Edit profile"
	 * form) and demo 3 (one sheet per side) duplicate the surfaces this page already
	 * shows above, so only the two demos with something new are ported: the panel without its
	 * corner close button, and the panel whose body scrolls. Unlike the classic-derived sections
	 * above, these keep `Sheet.Content`'s own shadcn surface — they document component features,
	 * not the classic theme's offcanvas metrics.
	 */

	/** Twenty copies of one paragraph, matching demo 4's `Array.from({ length: 20 })`. */
	const scrollableParagraphs = Array.from(
		{ length: 20 },
		() =>
			"Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor " +
			"incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud " +
			"exercitation ullamco laboris.",
	);
</script>

<DocPage title="Sheet">
	{#snippet subtitle()}
		Extends the Dialog component to display content that complements the main content of the screen.
		Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/sheet"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<Sheet.Root>
				<Sheet.Trigger class={trigger}>Open</Sheet.Trigger>
				<Sheet.Content side="right" class="{panel} {panelSize}">
					<Sheet.Header class={header}>
						<!--
							`.offcanvas-title` is an `h4` in the classic theme's markup, and `h4-font-size` is
							`font-size-base` (0.9375rem) at `headings-font-weight: 500` — which is
							exactly what `Sheet.Title` already renders, since it inherits the panel's
							`text-sm` and carries `font-medium`. The only heading treatment it misses is
							`headings-letter-spacing: -.02em`, which `app.css` deliberately attaches to
							the display steps and not to the body steps this title sits on.
						-->
						<Sheet.Title>Edit profile</Sheet.Title>
						<Sheet.Description>
							Make changes to your profile here. Click save when you're done.
						</Sheet.Description>
					</Sheet.Header>

					<!--
						`gap-[1.375rem]` is `form-group-margin-bottom` — the classic theme's own addition
						(the reference stylesheet), the space it puts between two stacked fields.
						The docs example uses `gap-6` (24px).
					-->
					<div class="{body} grid auto-rows-min content-start gap-[1.375rem]">
						<div class="grid gap-2">
							<Label for="sheet-name" class={fieldLabel}>Name</Label>
							<Input id="sheet-name" value="Pedro Duarte" />
						</div>
						<div class="grid gap-2">
							<Label for="sheet-username" class={fieldLabel}>Username</Label>
							<Input id="sheet-username" value="@peduarte" />
						</div>
					</div>

					<Sheet.Footer class={footer}>
						<button type="submit" class={trigger}>Save changes</button>
						<Sheet.Close class={neutral}>Close</Sheet.Close>
					</Sheet.Footer>
				</Sheet.Content>
			</Sheet.Root>
		</Card.Content>
	</Card.Root>

	<DocSection title="Side">
		{#snippet blurb()}
			Pass the <code class="text-[87.5%] text-primary">side</code> property to
			<code class="text-[87.5%] text-primary">Sheet.Content</code> to indicate the edge of the
			screen where the component will appear. The values can be
			<code class="text-[87.5%] text-primary">top</code>,
			<code class="text-[87.5%] text-primary">right</code>,
			<code class="text-[87.5%] text-primary">bottom</code> or
			<code class="text-[87.5%] text-primary">left</code>.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-wrap gap-2">
				{#each sides as edge (edge.side)}
					<Sheet.Root>
						<Sheet.Trigger class={trigger}>{edge.label}</Sheet.Trigger>
						<!--
							`panelSize` covers all four edges at once, sizing the horizontal pair by width
							and the vertical pair by height — a side panel is measured across, a top or
							bottom one down.
						-->
						<Sheet.Content side={edge.side} class="{panel} {panelSize}">
							<Sheet.Header class={header}>
								<Sheet.Title>{edge.label}</Sheet.Title>
								<Sheet.Description>
									A panel on this edge is sized by its <code class="text-[87.5%] text-primary"
										>{edge.measure}</code
									>.
								</Sheet.Description>
							</Sheet.Header>
							<div class={body}>
								Build hidden sidebars into your project for navigation, shopping carts, and more.
							</div>
						</Sheet.Content>
					</Sheet.Root>
				{/each}
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Size">
		{#snippet blurb()}
			You can adjust the size of the sheet using CSS classes. There is no size variant to pick from:
			a wider panel is a width class on <code class="text-[87.5%] text-primary">Sheet.Content</code>
			itself.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Sheet.Root>
					<Sheet.Trigger class={trigger}>Open</Sheet.Trigger>
					<!--
						The docs write this as `w-[400px] sm:w-[540px]`. Both need the
						`data-[side=right]:` prefix here for the same specificity reason `panelSize`
						does, and `sm:max-w-none` has to release `Sheet.Content`'s own `sm:max-w-sm`
						(384px) — otherwise the 540px never takes effect. `panelSize` is deliberately
						NOT applied: it is the 350px default this example is replacing.
					-->
					<Sheet.Content
						side="right"
						class="{panel} max-w-full data-[side=right]:w-[400px] data-[side=right]:sm:w-[540px] data-[side=right]:sm:max-w-none"
					>
						<Sheet.Header class={header}>
							<Sheet.Title>Are you absolutely sure?</Sheet.Title>
							<Sheet.Description>
								This action cannot be undone. This will permanently delete your account and remove
								your data from our servers.
							</Sheet.Description>
						</Sheet.Header>
						<div class={body}>
							At 540px this panel is wider than the 350px every other sheet on the page opens at.
						</div>
					</Sheet.Content>
				</Sheet.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Without close button">
		{#snippet blurb()}
			Pass <code class="text-[87.5%] text-primary">showCloseButton={"{false}"}</code> to
			<code class="text-[87.5%] text-primary">Sheet.Content</code> to drop the corner icon button — the
			footer's own controls then carry the only dismiss affordance.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- the original source: the edit-profile form again, minus the corner X. -->
				<Sheet.Root>
					<Sheet.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>With No Close Button</Button>
						{/snippet}
					</Sheet.Trigger>
					<Sheet.Content showCloseButton={false}>
						<Sheet.Header>
							<Sheet.Title>Edit profile</Sheet.Title>
							<Sheet.Description>
								Make changes to your profile here. Click save when you're done.
							</Sheet.Description>
						</Sheet.Header>
						<div class="p-4">
							<Field.FieldGroup>
								<Field.Field>
									<Field.FieldLabel for="sheet-no-close-name">Name</Field.FieldLabel>
									<Input id="sheet-no-close-name" value="John Doe" />
								</Field.Field>
								<Field.Field>
									<Field.FieldLabel for="sheet-no-close-username">Username</Field.FieldLabel>
									<Input id="sheet-no-close-username" value="@john-doe" />
								</Field.Field>
							</Field.FieldGroup>
						</div>
						<Sheet.Footer>
							<Button type="submit">Save changes</Button>
							<Sheet.Close>
								{#snippet child({ props })}
									<Button variant="outline" {...props}>Cancel</Button>
								{/snippet}
							</Sheet.Close>
						</Sheet.Footer>
					</Sheet.Content>
				</Sheet.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Scrollable content">
		{#snippet blurb()}
			A <code class="text-[87.5%] text-primary">ScrollArea</code> between the header and footer keeps
			both pinned while a long body scrolls on its own.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					the original source. `gap-0` closes the panel's own gap so the scroll region
					meets the header and footer flush; the upstream also writes `space-y-0`, which
					is redundant next to the gap and dropped per the house flex+gap rule. The fixed
					`h-[calc(100vh-230px)]` is upstream's way of giving ScrollArea a definite
					height inside the full-height panel; `flex-1` alone would need a `min-h-0`
					chain, so the calc is kept as ported.
				-->
				<Sheet.Root>
					<Sheet.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Scrollable Sheet</Button>
						{/snippet}
					</Sheet.Trigger>
					<Sheet.Content class="gap-0">
						<Sheet.Header>
							<Sheet.Title>Scrollable Content</Sheet.Title>
							<Sheet.Description>Description of the scrollable content.</Sheet.Description>
						</Sheet.Header>
						<ScrollArea class="h-[calc(100vh-230px)] flex-1">
							<div class="flex flex-col gap-4 px-4">
								{#each scrollableParagraphs as paragraph, i (i)}
									<p class="text-sm text-muted-foreground">{paragraph}</p>
								{/each}
							</div>
						</ScrollArea>
						<Sheet.Footer>
							<Button type="submit">Save changes</Button>
							<Sheet.Close>
								{#snippet child({ props })}
									<Button variant="outline" {...props}>Cancel</Button>
								{/snippet}
							</Sheet.Close>
						</Sheet.Footer>
					</Sheet.Content>
				</Sheet.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
