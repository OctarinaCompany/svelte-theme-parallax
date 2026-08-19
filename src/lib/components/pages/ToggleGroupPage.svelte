<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";
	import AlignCenterIcon from "@lucide/svelte/icons/align-center";
	import AlignLeftIcon from "@lucide/svelte/icons/align-left";
	import AlignRightIcon from "@lucide/svelte/icons/align-right";
	import BellIcon from "@lucide/svelte/icons/bell";
	import BluetoothIcon from "@lucide/svelte/icons/bluetooth";
	import BoldIcon from "@lucide/svelte/icons/bold";
	import BookmarkIcon from "@lucide/svelte/icons/bookmark";
	import HeartIcon from "@lucide/svelte/icons/heart";
	import ItalicIcon from "@lucide/svelte/icons/italic";
	import MailIcon from "@lucide/svelte/icons/mail";
	import MapPinIcon from "@lucide/svelte/icons/map-pin";
	import MenuIcon from "@lucide/svelte/icons/menu";
	import MessageSquareIcon from "@lucide/svelte/icons/message-square";
	import MonitorIcon from "@lucide/svelte/icons/monitor";
	import MoonIcon from "@lucide/svelte/icons/moon";
	import PhoneIcon from "@lucide/svelte/icons/phone";
	import PlaneIcon from "@lucide/svelte/icons/plane";
	import StarIcon from "@lucide/svelte/icons/star";
	import SunIcon from "@lucide/svelte/icons/sun";
	import UnderlineIcon from "@lucide/svelte/icons/underline";
	import WifiIcon from "@lucide/svelte/icons/wifi";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Toggle group component page, ported from the shadcn-svelte documentation
	 * (`https://shadcn-svelte.com/docs/components/toggle-group.md`): the hero demo, then
	 * Outline, Single, Small, Large, Disabled and Spacing.
	 *
	 * WHAT THE CLASSIC THEME HAS. The classic framework builds a toggle group out of `.btn-check` inputs and `.btn`
	 * labels, and the classic theme ships TWO different looks for it — which is why this page overrides
	 * the "on" state twice rather than once:
	 *
	 *   joined     `.nav.btn-group` holding `.btn-white` buttons (the reference stylesheet, used on
	 *              the reference “crm-companies” demo page for the list/grid switch). The rule is three
	 *              declarations — `.btn-white.active` gets `background-color: primary`,
	 *              `border-color: primary`, `color: white` — a SOLID primary fill, not a
	 *              tint. This is shadcn's default `spacing={0}` group
	 *   separated  `.btn-group-toggle` holding `.btn-check` + `.btn-white` (the reference stylesheet,
	 *              documented at `the reference docs#buttons`). Checked gets
	 *              `background-color: input-bg`, `border-color: input-focus-border-color`,
	 *              `box-shadow: none`, `color: primary` — the fill does NOT change, only the
	 *              outline and the type. This is shadcn's `spacing={2}` group
	 *
	 * Neither of shadcn's grounds survives: its `data-[state=on]:bg-muted` is a grey tint that
	 * the classic theme never uses for either shape.
	 *
	 * WHAT THE CLASSIC THEME DOES NOT HAVE. `.btn-group-toggle` has no layout rules at all — it is a bare
	 * scoping class, and its items are inline-block labels separated by the word space between
	 * them in the HTML. There is therefore no classic value for `spacing`; `spacing={2}` (8px)
	 * is shadcn's own, and is the value the Buttons page already settled on for the same demo.
	 * The classic theme also has no counterpart for the hero's icon tinting — the classic framework toggles never
	 * recolour their glyph independently of their label — so that demo keeps shadcn's intent
	 * and only swaps the raw palette colours for theme tokens.
	 *
	 * FOCUS RING, deliberately left alone. `input-btn-focus-box-shadow: none` and
	 * `btn-focus-box-shadow: input-btn-focus-box-shadow`, so a focused the classic theme button shows
	 * nothing at all. shadcn's `focus-visible:ring-[3px]` is kept here, as it is on the Buttons
	 * and Button group pages, rather than reproducing a theme decision that removes the only
	 * keyboard affordance the control has.
	 *
	 * ICONS. Lucide, as everywhere in this theme; the classic theme's own markup uses Feather (`fe-list`,
	 * `fe-grid`, `fe-check-circle`), of which Lucide is the maintained successor.
	 */

	/**
	 * `.btn-white`, the ground both the classic theme toggle shapes are built on. Same string as the
	 * Buttons page uses, and it carries the same caveat: the border is one grey step off in
	 * both modes — the classic theme asks for `gray-300` (#E3EBF6) in light and `gray-600-dark`
	 * (#244166) in dark, `--border` holds `gray-200` and `gray-700-dark` — and neither grey
	 * exists as a token here.
	 *
	 * `shadow-none` is the one addition. `variant="outline"` brings shadcn's `shadow-xs`, and
	 * the compiled `.btn` rule declares `--bs-btn-box-shadow` but never applies it: the classic theme
	 * builds with `enable-shadows` off, so no button in the theme has one.
	 */
	const white =
		"border-border bg-card text-card-foreground shadow-none hover:bg-accent dark:hover:bg-background";

	/**
	 * Geometry per size, every number `btn-*` from the reference stylesheet and the heights resolved
	 * exactly as on the Buttons page (base 40.5px, lg 48.5px, sm 28.75px, the `sm` one shorter
	 * than it looks because `btn-line-height-sm` is 1.75 rather than the base 1.5).
	 *
	 * TWO SHADCN RULES HAVE TO BE RESTATED RATHER THAN OVERRIDDEN, because the component scopes
	 * them to the group and a plain utility therefore neither conflicts with them (so
	 * tailwind-merge cannot evict the loser) nor outranks them (so the cascade keeps them):
	 *
	 *   padding   `group-data-[spacing=0]/toggle-group:px-2` narrows every item in a joined
	 *             group to 8px. `btn-padding-x` is .75rem and `btn-padding-x-lg` is 1.25rem,
	 *             so base and lg restate it under the same variant. `sm` needs nothing —
	 *             `btn-padding-x-sm` IS .5rem
	 *   radius    the first and last items get `rounded-l-md` / `rounded-r-md` under
	 *             `group-data-horizontal/toggle-group:data-[spacing=0]:first:`. `.btn-group-lg`
	 *             and `.btn-group-sm` set `--bs-btn-border-radius` per size, so the group's
	 *             outer corners follow the size — `border-radius-lg` (8px) at lg,
	 *             `border-radius-sm` (4px) at sm, and `border-radius` (6px) at the base,
	 *             which is already what shadcn emits
	 *
	 * The plain `rounded-*` is what the SEPARATED (`spacing={2}`) groups use, where every item
	 * keeps all four corners.
	 *
	 * `min-w-9` / `min-w-8` / `min-w-10` from `toggleVariants` are left in place: the classic framework sets
	 * no minimum width, but at these paddings an icon-only item is always wider than the
	 * minimum (42px, 34px and 58px against 36px, 32px and 40px), so the rule never binds.
	 */
	const size = {
		lg: "h-12 rounded-lg px-5 text-sm font-normal group-data-[spacing=0]/toggle-group:px-5 group-data-horizontal/toggle-group:data-[spacing=0]:first:rounded-l-lg group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-r-lg",
		base: "h-10 rounded-md px-3 text-sm font-normal group-data-[spacing=0]/toggle-group:px-3",
		sm: "h-(--control-h-sm) rounded-sm px-2 text-xs font-normal group-data-horizontal/toggle-group:data-[spacing=0]:first:rounded-l-sm group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-r-sm",
	} as const;

	/**
	 * WHERE THE CLASSIC FRAMEWORK AND SHADCN DISAGREE about joining items — the same disagreement the Button
	 * group page documents, and here it is visible rather than theoretical.
	 *
	 * shadcn drops the left border of every outline item after the first
	 * (`..:data-[variant=outline]:border-l-0`). The classic framework keeps all four borders and pulls each
	 * item 1px left instead — `.btn-group > :not(.btn-check:first-child) + .btn` gets
	 * `margin-left: calc(var(--bs-border-width) * -1)` — so the two adjacent hairlines occupy
	 * one pixel.
	 *
	 * On the solid buttons of the Button group page the two constructions looked identical. They
	 * do not here: an "on" item is filled `primary` WITH a `primary` border, and under
	 * shadcn's rule a non-first active item has no left border at all, so the line between it
	 * and its neighbour stays grey where the classic theme paints it blue. Restating `border-l` under the
	 * component's own variant chain is what lets tailwind-merge evict `border-l-0` — the two
	 * classes have to be scoped identically to count as a conflict.
	 *
	 * `z-10` is `.btn-group > .btn.active { z-index: 1 }`: the active item's border has to paint
	 * over both its neighbours', which is the whole point of overlapping them.
	 */
	const seam =
		"group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:border-l group-data-horizontal/toggle-group:data-[spacing=0]:not-first:-ml-px data-[state=on]:z-10";

	/**
	 * `.nav.btn-group .btn-white.active` — solid `primary` fill, `primary` border, `white`
	 * type. `text-primary-foreground` is that white, and it is the same token the solid button
	 * variants use.
	 *
	 * THE THREE HEDGES ARE NOT PADDING:
	 *
	 *   aria-pressed   `toggleVariants` carries `aria-pressed:bg-muted` alongside the item's own
	 *                  `data-[state=on]:bg-muted`. bits-ui sets `aria-pressed` only on
	 *                  `type="multiple"` items (single-type ones get `aria-checked` instead), so
	 *                  on a multiple group both rules match at equal specificity and stylesheet
	 *                  order decides the winner. Restating the `aria-pressed` variant lets
	 *                  tailwind-merge remove the competitor instead of racing it
	 *   hover          `hover:bg-muted` in the base ties with `data-[state=on]:bg-primary` the
	 *                  same way. In the classic theme the active rule outranks `.btn:hover` — four
	 *                  selector parts against two — so an active item does not change colour
	 *                  under the pointer, and `data-[state=on]:hover:` states that at a
	 *                  specificity that wins
	 *   text           `hover:text-foreground` needs the same treatment, or the white type turns
	 *                  dark on hover
	 */
	const onSolid =
		"data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary data-[state=on]:hover:text-primary-foreground aria-pressed:bg-primary";

	/**
	 * `.btn-group-toggle .btn-check:checked + .btn-white` — the separated shape. The fill stays
	 * put and only the outline and the type change:
	 *
	 *   background  `input-bg` is `white`, which `--card` holds in light mode
	 *   border      `input-focus-border-color` is `var(--bs-primary)`, and `--ring` is defined
	 *               in app.css as exactly that variable
	 *   color       `var(--bs-primary)`
	 *
	 * THE DARK HALF IS A REAL SPLIT, not a preference. The classic theme's dark override changes the
	 * ground to `gray-700-dark` (#1E3A5C) while keeping the primary border and type. In dark
	 * mode `--card` is `gray-800-dark` (#152E4D) — one step lighter than asked — and the value
	 * the classic theme wants is the one `--secondary` carries there, where app.css records it as
	 * "gray-700-dark, matching input-bg-dark". No single token spans both modes, since
	 * `--secondary` in light is #EDF2F9 rather than white, so this is one of the cases the house
	 * rule allows a `dark:` colour override for. The Buttons page leaves the same demo at
	 * `bg-card` and is therefore one grey step off in dark mode; the value below is the exact
	 * one.
	 *
	 * `box-shadow: none` in the same rule is already covered by {@link white}.
	 */
	const onWhite =
		"data-[state=on]:border-ring data-[state=on]:bg-card data-[state=on]:text-primary data-[state=on]:hover:bg-card data-[state=on]:hover:text-primary aria-pressed:bg-card dark:data-[state=on]:bg-secondary dark:data-[state=on]:hover:bg-secondary dark:aria-pressed:bg-secondary";

	/**
	 * `--bs-btn-disabled-opacity: 0.65`, read off the compiled `.btn` rule, against shadcn's
	 * `disabled:opacity-50`. The classic theme changes nothing else when a button is disabled —
	 * `.btn-white` restates its own background and border at the same values it already has.
	 */
	const dimmed = "disabled:opacity-65";

	/** The joined group, minus the sizing: `.nav.btn-group` + `.btn-white`. */
	const joined = `${white} ${dimmed} ${seam} ${onSolid}`;

	/**
	 * The three text marks the docs page uses for every example after the hero. `aria-label` is
	 * required on each: the items are icon-only, so there is no accessible name otherwise.
	 */
	const marks = [
		{ value: "bold", label: "Toggle bold", icon: BoldIcon },
		{ value: "italic", label: "Toggle italic", icon: ItalicIcon },
		{ value: "strikethrough", label: "Toggle strikethrough", icon: UnderlineIcon },
	];

	/**
	 * The hero's three items.
	 *
	 * shadcn tints the glyph `yellow-500` / `red-500` / `blue-500`; those are raw palette values,
	 * and the theme carries the same three hues as tokens — `warning` (#F6C343), `destructive`
	 * (#E63757) and `primary` (#2C7BE5) — so the demo is expressed in those instead.
	 *
	 * The tint classes are written out per item rather than built from a variable: Tailwind
	 * scans the source for complete class names, and an interpolated one would never be
	 * generated.
	 *
	 * Tinting an icon without touching the item's ground is the one demo on this page with no
	 * classic-theme counterpart. `data-[state=on]:bg-transparent` cancels the fill, `aria-pressed:` is
	 * restated for the reason set out in {@link onSolid} (this group really is `type="multiple"`,
	 * so that variant is live), and `data-[state=on]:hover:bg-accent` keeps `.btn-white`'s own
	 * hover ground reachable while the item is on.
	 */
	const marked = [
		{
			value: "star",
			text: "Star",
			label: "Toggle star",
			icon: StarIcon,
			tint: "data-[state=on]:bg-transparent aria-pressed:bg-transparent data-[state=on]:hover:bg-accent data-[state=on]:*:[svg]:fill-warning data-[state=on]:*:[svg]:stroke-warning",
		},
		{
			value: "heart",
			text: "Heart",
			label: "Toggle heart",
			icon: HeartIcon,
			tint: "data-[state=on]:bg-transparent aria-pressed:bg-transparent data-[state=on]:hover:bg-accent data-[state=on]:*:[svg]:fill-destructive data-[state=on]:*:[svg]:stroke-destructive",
		},
		{
			value: "bookmark",
			text: "Bookmark",
			label: "Toggle bookmark",
			icon: BookmarkIcon,
			tint: "data-[state=on]:bg-transparent aria-pressed:bg-transparent data-[state=on]:hover:bg-accent data-[state=on]:*:[svg]:fill-primary data-[state=on]:*:[svg]:stroke-primary",
		},
	];

	/** The classic theme ships the first control of its own toggle demo already selected. */
	let heroValue = $state<string[]>(["star"]);
	let outlineValue = $state<string[]>(["bold"]);
	let singleValue = $state("bold");
	let smallValue = $state("bold");
	let largeValue = $state<string[]>(["bold"]);
	let disabledValue = $state("bold");
	let spacedValue = $state("bold");

	/* ---------------------------------------------------------------------------------------
	 * Pattern appendix.
	 *
	 * The sections after Spacing are the pattern demo set, skipping the ones whose
	 * shape a section above already shows. They reuse this page's the classic theme grounds unchanged:
	 * a joined outline demo takes {@link joined}, a separated outline demo takes
	 * {@link white} + {@link onWhite}, and the borderless default-variant demos keep the
	 * registry look as-is — both the classic theme shapes in the header are built on `.btn-white`'s
	 * border, so a borderless toggle has no classic value to reproduce.
	 * ------------------------------------------------------------------------------------ */

	/**
	 * Bold/italic/underline marks for the appendix demos (demo 1 and
	 * demo 6). Not {@link marks}: the shadcn set above pairs the underline
	 * glyph with a "strikethrough" value — a docs quirk this page preserves there — and
	 * the appendix set does not have it.
	 */
	const formatItems = [
		{ value: "bold", label: "Toggle bold", icon: BoldIcon },
		{ value: "italic", label: "Toggle italic", icon: ItalicIcon },
		{ value: "underline", label: "Toggle underline", icon: UnderlineIcon },
	];

	/** demo 5 — the four task states its filter cycles through. */
	const filterStatusItems = [
		{ value: "all", label: "All" },
		{ value: "active", label: "Active" },
		{ value: "completed", label: "Completed" },
		{ value: "archived", label: "Archived" },
	];

	/** demo 7. The justify glyph is upstream's own choice of the menu icon. */
	const alignItems = [
		{ value: "left", label: "Align left", icon: AlignLeftIcon },
		{ value: "center", label: "Align center", icon: AlignCenterIcon },
		{ value: "right", label: "Align right", icon: AlignRightIcon },
		{ value: "justify", label: "Justify", icon: MenuIcon },
	];

	/** demo 9 — quick-settings switches, two of them on by default. */
	const settingsItems = [
		{ value: "wifi", label: "Wi-Fi", icon: WifiIcon },
		{ value: "bluetooth", label: "Bluetooth", icon: BluetoothIcon },
		{ value: "airplane", label: "Airplane Mode", icon: PlaneIcon },
		{ value: "location", label: "Location", icon: MapPinIcon },
	];

	/** demo 10. */
	const themeItems = [
		{ value: "light", label: "Light theme", text: "Light", icon: SunIcon },
		{ value: "dark", label: "Dark theme", text: "Dark", icon: MoonIcon },
		{ value: "system", label: "System theme", text: "System", icon: MonitorIcon },
	];

	/** demo 13. */
	const channelItems = [
		{ value: "email", label: "Email notifications", text: "Email", icon: MailIcon },
		{ value: "sms", label: "SMS notifications", text: "SMS", icon: PhoneIcon },
		{ value: "push", label: "Push notifications", text: "Push", icon: BellIcon },
		{ value: "slack", label: "Slack notifications", text: "Slack", icon: MessageSquareIcon },
	];

	let basicFormatValue = $state<string[]>([]);
	let filterStatusValue = $state("active");
	let verticalFormatValue = $state<string[]>([]);
	let alignValue = $state("left");
	let settingsValue = $state<string[]>(["wifi", "bluetooth"]);
	let themeValue = $state("light");
	let channelsValue = $state<string[]>(["email", "push"]);
	let pricingValue = $state("monthly");
</script>

<DocPage title="Toggle group">
	{#snippet subtitle()}
		A set of two-state buttons that can be toggled on or off. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/toggle-group"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<!--
				`variant="outline"` on every group on this page: `.btn-white` always draws a border,
				and the variant is also what the component's corner- and border-collapsing rules
				select on. The default variant is borderless and has neither.
			-->
			<ToggleGroup.Root
				type="multiple"
				variant="outline"
				spacing={2}
				size="sm"
				bind:value={heroValue}
			>
				{#each marked as entry (entry.value)}
					<ToggleGroup.Item
						value={entry.value}
						aria-label={entry.label}
						class="{white} {dimmed} {size.sm} {entry.tint}"
					>
						<entry.icon />
						{entry.text}
					</ToggleGroup.Item>
				{/each}
			</ToggleGroup.Root>
		</Card.Content>
	</Card.Root>

	<DocSection title="Outline">
		{#snippet blurb()}
			A joined group of outlined items — the shape the classic framework builds with
			<code class="text-[87.5%] text-primary">.nav.btn-group</code>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`shadow-none` on the root cancels
					`data-[spacing=0]:data-[variant=outline]:shadow-xs`, which puts a shadow under the
					whole joined group. `enable-shadows` is off in the classic theme and `.btn-group` declares
					none of its own.
				-->
				<ToggleGroup.Root
					type="multiple"
					variant="outline"
					class="shadow-none"
					bind:value={outlineValue}
				>
					{#each marks as entry (entry.value)}
						<ToggleGroup.Item
							value={entry.value}
							aria-label={entry.label}
							class="{joined} {size.base}"
						>
							<entry.icon />
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Single">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">type="single"</code> allows one item at a time — the
			behaviour the classic framework gets from radio
			<code class="text-[87.5%] text-primary">.btn-check</code> inputs sharing a name.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<ToggleGroup.Root
					type="single"
					variant="outline"
					class="shadow-none"
					bind:value={singleValue}
				>
					{#each marks as entry (entry.value)}
						<ToggleGroup.Item
							value={entry.value}
							aria-label={entry.label}
							class="{joined} {size.base}"
						>
							<entry.icon />
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Small">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">.btn-group-sm</code>: 2px of vertical padding, 8px
			horizontal, a 13px type size and a 4px outer radius.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<ToggleGroup.Root
					type="single"
					variant="outline"
					class="shadow-none"
					bind:value={smallValue}
				>
					{#each marks as entry (entry.value)}
						<ToggleGroup.Item
							value={entry.value}
							aria-label={entry.label}
							class="{joined} {size.sm}"
						>
							<entry.icon />
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Large">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">.btn-group-lg</code>: 12px of vertical padding, 20px
			horizontal, and an 8px outer radius.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<ToggleGroup.Root
					type="multiple"
					variant="outline"
					class="shadow-none"
					bind:value={largeValue}
				>
					{#each marks as entry (entry.value)}
						<ToggleGroup.Item
							value={entry.value}
							aria-label={entry.label}
							class="{joined} {size.lg}"
						>
							<entry.icon />
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Disabled">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">disabled</code> on the root disables every item, at
			the classic
			<code class="text-[87.5%] text-primary">--bs-btn-disabled-opacity</code> of 0.65.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<ToggleGroup.Root
					type="single"
					variant="outline"
					disabled
					class="shadow-none"
					bind:value={disabledValue}
				>
					{#each marks as entry (entry.value)}
						<ToggleGroup.Item
							value={entry.value}
							aria-label={entry.label}
							class="{joined} {size.base}"
						>
							<entry.icon />
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Spacing">
		{#snippet blurb()}
			Use <code class="text-[87.5%] text-primary">spacing=&#123;2&#125;</code> to add spacing between
			toggle group items.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					The docs page repeats its hero demo here. It is shown with this page's three marks
					instead, because separating the items is what switches the classic theme from
					`.nav.btn-group` to `.btn-group-toggle` — and the hero's own classes blank the
					ground to tint its glyphs, which hides exactly the difference this section is
					about. `onWhite` rather than `onSolid`: the fill stays white, the border and the
					type turn `primary`.
				-->
				<ToggleGroup.Root type="single" variant="outline" spacing={2} bind:value={spacedValue}>
					{#each marks as entry (entry.value)}
						<ToggleGroup.Item
							value={entry.value}
							aria-label={entry.label}
							class="{white} {dimmed} {onWhite} {size.base}"
						>
							<entry.icon />
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Basic toggle group">
		{#snippet blurb()}
			A borderless <code class="text-[87.5%] text-primary">type="multiple"</code> group with 4px of spacing
			between the items.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 1 — the first group on this page without `variant="outline"`.
					Both the classic theme shapes in the header start from `.btn-white`'s border, so the
					borderless default variant has no classic value to reproduce; it keeps the
					registry look, including the `bg-muted` "on" ground the outline sections above
					replace.
				-->
				<ToggleGroup.Root type="multiple" spacing={1} bind:value={basicFormatValue}>
					{#each formatItems as entry (entry.value)}
						<ToggleGroup.Item value={entry.value} aria-label={entry.label}>
							<entry.icon />
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Toggle group with filter control">
		{#snippet blurb()}
			A joined <code class="text-[87.5%] text-primary">size="sm"</code> group as a status filter — text
			labels where the sections above use icon marks.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 5. The joined shape at the small size, as in the Small section. -->
				<ToggleGroup.Root
					type="single"
					variant="outline"
					class="shadow-none"
					bind:value={filterStatusValue}
				>
					{#each filterStatusItems as entry (entry.value)}
						<ToggleGroup.Item value={entry.value} class="{joined} {size.sm}">
							{entry.label}
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Toggle group with vertical orientation">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">orientation="vertical"</code> stacks the items and moves
			arrow-key focus to the vertical axis.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 6. `spacing={1}` separates the items, so this is the
					`.btn-group-toggle` shape (`onWhite`) — stacked rather than in a row.
				-->
				<ToggleGroup.Root
					type="multiple"
					orientation="vertical"
					variant="outline"
					spacing={1}
					bind:value={verticalFormatValue}
				>
					{#each formatItems as entry (entry.value)}
						<ToggleGroup.Item
							value={entry.value}
							aria-label={entry.label}
							class="{white} {dimmed} {onWhite} {size.base}"
						>
							<entry.icon />
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Toggle group for text alignment">
		<Card.Root>
			<Card.Content>
				<!--
					demo 7 — a single-select alignment picker on the borderless
					default variant, kept at the registry look for the reason the Basic toggle
					group section gives.
				-->
				<ToggleGroup.Root type="single" spacing={1} bind:value={alignValue}>
					{#each alignItems as entry (entry.value)}
						<ToggleGroup.Item value={entry.value} aria-label={entry.label}>
							<entry.icon />
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Vertical toggle group for settings">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">w-full</code> on each item makes the stacked switches share
			the width of the longest one.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 9 — quick-settings switches: vertical, multiple, and on the
					borderless default variant like the alignment picker above.
				-->
				<ToggleGroup.Root
					type="multiple"
					orientation="vertical"
					spacing={1}
					bind:value={settingsValue}
				>
					{#each settingsItems as entry (entry.value)}
						<ToggleGroup.Item value={entry.value} aria-label={entry.label} class="w-full">
							<entry.icon />
							{entry.label}
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Toggle group for color theme">
		<Card.Root>
			<Card.Content>
				<!--
					demo 10 — a joined single-select group whose items carry an icon
					AND a label, a pairing no section above shows inside the joined shape.
				-->
				<ToggleGroup.Root
					type="single"
					variant="outline"
					class="shadow-none"
					bind:value={themeValue}
				>
					{#each themeItems as entry (entry.value)}
						<ToggleGroup.Item
							value={entry.value}
							aria-label={entry.label}
							class="{joined} {size.base}"
						>
							<entry.icon />
							{entry.text}
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Toggle group for notification channels">
		{#snippet blurb()}
			A separated <code class="text-[87.5%] text-primary">type="multiple"</code> group where each channel
			toggles independently.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 13. Separated items, so `onWhite` rather than `onSolid` —
					the same shape as the Spacing section, here with labelled multi-select items
					and the demo's own 4px gap.
				-->
				<ToggleGroup.Root type="multiple" variant="outline" spacing={1} bind:value={channelsValue}>
					{#each channelItems as entry (entry.value)}
						<ToggleGroup.Item
							value={entry.value}
							aria-label={entry.label}
							class="{white} {dimmed} {onWhite} {size.base}"
						>
							<entry.icon />
							{entry.text}
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Toggle group for pricing tier">
		{#snippet blurb()}
			A large joined pair with a savings chip inside the second item.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 16. Upstream's chip stays `bg-primary` in both states, which
					works on its grey `bg-muted` active ground; the classic theme's joined active fill IS
					solid `primary` (`onSolid`), so an unchanged chip would vanish into it. The
					chip therefore inverts while its item is on — `group/toggle` comes from
					`toggleVariants`' own base class, and both values stay theme tokens.
				-->
				<ToggleGroup.Root
					type="single"
					variant="outline"
					class="shadow-none"
					bind:value={pricingValue}
				>
					<ToggleGroup.Item value="monthly" class="{joined} {size.lg}">Monthly</ToggleGroup.Item>
					<ToggleGroup.Item value="yearly" class="{joined} {size.lg} gap-2">
						Yearly
						<span
							class="rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground group-data-[state=on]/toggle:bg-primary-foreground group-data-[state=on]/toggle:text-primary"
						>
							Save 20%
						</span>
					</ToggleGroup.Item>
				</ToggleGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
