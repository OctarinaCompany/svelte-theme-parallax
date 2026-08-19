<script lang="ts">
	import type { LucideIcon } from "@lucide/svelte";

	import BellIcon from "@lucide/svelte/icons/bell";
	import BookOpenIcon from "@lucide/svelte/icons/book-open";
	import CalculatorIcon from "@lucide/svelte/icons/calculator";
	import CalendarIcon from "@lucide/svelte/icons/calendar";
	import CircleQuestionMarkIcon from "@lucide/svelte/icons/circle-question-mark";
	import ClipboardIcon from "@lucide/svelte/icons/clipboard";
	import ClockIcon from "@lucide/svelte/icons/clock";
	import CodeIcon from "@lucide/svelte/icons/code";
	import CopyIcon from "@lucide/svelte/icons/copy";
	import CreditCardIcon from "@lucide/svelte/icons/credit-card";
	import FileIcon from "@lucide/svelte/icons/file";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import FolderIcon from "@lucide/svelte/icons/folder";
	import FolderPlusIcon from "@lucide/svelte/icons/folder-plus";
	import HouseIcon from "@lucide/svelte/icons/house";
	import ImageIcon from "@lucide/svelte/icons/image";
	import InboxIcon from "@lucide/svelte/icons/inbox";
	import LayoutGridIcon from "@lucide/svelte/icons/layout-grid";
	import LifeBuoyIcon from "@lucide/svelte/icons/life-buoy";
	import ListIcon from "@lucide/svelte/icons/list";
	import MessageSquareIcon from "@lucide/svelte/icons/message-square";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import ScissorsIcon from "@lucide/svelte/icons/scissors";
	import SearchIcon from "@lucide/svelte/icons/search";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import SmileIcon from "@lucide/svelte/icons/smile";
	import StarIcon from "@lucide/svelte/icons/star";
	import TrashIcon from "@lucide/svelte/icons/trash";
	import UserIcon from "@lucide/svelte/icons/user";
	import ZoomInIcon from "@lucide/svelte/icons/zoom-in";
	import ZoomOutIcon from "@lucide/svelte/icons/zoom-out";

	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Command from "$lib/components/ui/command/index.js";
	import * as Kbd from "$lib/components/ui/kbd/index.js";
	import { Badge, type BadgeVariant } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { getInitials } from "$lib/shared/get-initials.js";

	/**
	 * The Command component page, ported from the shadcn-svelte documentation
	 * (`https://shadcn-svelte.com/docs/components/command`).
	 *
	 * THE CLASSIC FRAMEWORK HAS NO COMMAND MENU, and neither does the classic theme — the reference docs
	 * contains the word "command" exactly once, as the name of a Feather glyph in the icon
	 * table. There is no counterpart to port wholesale. Two the classic theme surfaces do map onto its
	 * parts, though, and everything applied below comes from one of them:
	 *
	 *   the menu    `.dropdown-menu` with `.dropdown-header`, `.dropdown-item` and
	 *               `.dropdown-divider` — a scrolling list of headed groups separated by
	 *               rules, which is structurally what a command list is
	 *   the dialog  the "Add a member" modal at the top of the reference “index” demo page:
	 *               `.modal-dialog-centered > .modal-content > .modal-card.card`, whose
	 *               `.card-header` holds a flush search field
	 *               (`.input-group.input-group-flush.input-group-merge.input-group-reverse`)
	 *               and whose body is a list capped at `modal-card-body-max-height: 350px`.
	 *               That is the classic theme's command dialog in all but the keyboard driving.
	 *
	 * What has NO classic counterpart at all, and therefore keeps shadcn's default:
	 *
	 *   the empty state     the classic framework has no "no results" element, so `Command.Empty`'s
	 *                       `py-6 text-center text-sm` is left exactly as generated
	 *   `Command.Shortcut`  the classic theme never puts a key hint in a menu row. The nearest rule is
	 *                       `.dropdown-item.dropdown-toggle { display: flex; justify-content:
	 *                       space-between }`, which supplies the trailing
	 *                       -content layout that `ml-auto` already does, and nothing about
	 *                       how the hint itself should look
	 *   the placeholder     `input-placeholder-color: gray-500` (#B1C2D9) has no token —
	 *                       `--muted-foreground` is #95AAC9, one step darker — so shadcn's
	 *                       `placeholder:text-muted-foreground` is left alone rather than
	 *                       swapped for a near miss
	 *
	 * `Command.Input` renders its own wrapper and its own `InputGroup.Root`, and exposes
	 * `class` only for the `<input>` inside them. The flush search field therefore cannot be
	 * written at a call site; those three rules were handed to `app.css` instead.
	 *
	 * The docs page's third section, "Combobox", is a cross-reference to another page with no
	 * example of its own, so nothing is reproduced from it here.
	 */

	/**
	 * The menu surface, from `.dropdown-menu` in the compiled bundle — the same reading the
	 * Dropdowns page makes, restated because `Command.Root` is a different component:
	 *
	 *   rounded-md!   `dropdown-border-radius: border-radius` (6px). The `!` is not
	 *                 emphasis: the component's own class is `rounded-xl!`, and only an
	 *                 equally important utility replaces it through `cn`
	 *   border        `dropdown-border-color: rgba(black, .1)`, which resolves to roughly
	 *                 #E7EAEE over white against `--border`'s #EDF2F9 — the same one-step
	 *                 substitution the Dropdowns page documents for `dropdown-divider-bg`
	 *   p-0           `dropdown-padding-x: 0` with the `dropdown-padding-y: .5rem` moved
	 *                 onto the list below, so the items can run edge to edge and supply
	 *                 their own 24px inset the way `.dropdown-item` does
	 *   md:w          `dropdown-card-min-width: 350px`. The classic theme's plain menu is
	 *                 `dropdown-min-width: 10rem`, far too narrow for a search field; 350px
	 *                 is the width it gives a menu that carries content rather than links,
	 *                 which is what this is. The docs demo asks for 450px, a number with no
	 *                 classic-theme origin.
	 *
	 *                 A WIDTH, not a `min-width`. The docs write `md:min-w-[450px]`, which does
	 *                 nothing on its own — `Command.Root` is already `w-full` — and only reads
	 *                 as 450px there because the docs preview centres it in a shrink-wrapping
	 *                 box. Dropped straight into a card it stretches to the full column and
	 *                 keeps resizing with the viewport, which a dropdown panel never does:
	 *                 `dropdown-card-min-width` describes a panel of a fixed size. `w-full`
	 *                 below the `md` breakpoint keeps it from overflowing a narrow screen
	 *   mx-auto       centres the panel in the card, which is the other half of what the docs
	 *                 preview does for free. Below `md` it is a no-op, the panel being full
	 *                 width there
	 *
	 * NO SHADOW, although the docs demo carries `shadow-md` and `dropdown-box-shadow` is a
	 * real value (`var(--bs-box-shadow)` = `0 .5rem 1rem rgba(18,38,63,.15)`). Elevation is
	 * deferred repository-wide — see the `[data-slot='card']` rule in `app.css`, which ports
	 * the card outline and explicitly leaves `card-box-shadow` out. Adding it here alone
	 * would make this menu the only raised object in the app.
	 *
	 * `bg-popover` and `text-popover-foreground` need no work: `dropdown-bg` is `white` /
	 * `gray-800-dark` and `--popover` holds both exactly, and `--bs-dropdown-color` is
	 * `--bs-body-color`.
	 */
	const menu = "rounded-md! mx-auto w-full border p-0 md:w-[350px]";

	/**
	 * The scrolling body.
	 *
	 *   max-h-[350px]  `dropdown-card-body-max-height` and `modal-card-body-max-height` are
	 *                  both 350px — the classic theme caps a scrolling menu body and a scrolling modal
	 *                  card body at the same height, so one value serves both demos below.
	 *                  shadcn's `max-h-72` is 288px
	 *   py-2           `dropdown-padding-y: .5rem`, taken off the root above so it is spent
	 *                  once around the whole list rather than once per group
	 *
	 * `overflow-y-auto` is already on the component, and is what the classic theme's rule asks for.
	 */
	const list = "max-h-[350px] py-2";

	/**
	 * A group and its heading.
	 *
	 * `p-0` because the classic theme has no group box at all — `.dropdown-menu` pads itself and
	 * `.dropdown-item` pads itself, and nothing sits in between. shadcn's `p-1` would add
	 * 4px on every side of every group.
	 *
	 * The heading is `.dropdown-header`: `padding: .5rem 1.5rem`, `font-size: .8125rem`, and
	 * `dropdown-header-color: inherit` — the classic theme overrides the classic `gray-600` there on
	 * purpose, so the heading is body-coloured, not muted, and it inherits `font-weight-base`
	 * (400) because `.dropdown-header` sets no weight. Against shadcn's `px-2 py-1.5
	 * font-medium text-muted-foreground` only the size agrees — 13px is exactly `--text-xs`.
	 *
	 * Written as descendant utilities rather than passed down, because `Command.Group`'s
	 * `class` lands on the group container and its heading's classes are hard-coded inside the
	 * component. `[data-command-group-heading]` is the attribute bits-ui actually emits
	 * (`createBitsAttrs({ component: 'command' })`); the component's own
	 * `**:[[cmdk-group-heading]]:…` utilities are inherited from cmdk and match nothing here,
	 * which is why the heading has to be reached a second time. A class plus an attribute
	 * outranks the plain utilities sitting on the element itself.
	 */
	const group =
		"p-0 **:[[data-command-group-heading]]:px-6 **:[[data-command-group-heading]]:py-2 **:[[data-command-group-heading]]:font-normal **:[[data-command-group-heading]]:text-inherit";

	/**
	 * An item — `.dropdown-item`, whose padding is `.375rem 1.5rem`.
	 *
	 * The colours are the interesting half. `--bs-dropdown-link-hover-bg` is TRANSPARENT in
	 * the classic theme, and `dropdown-link-active-bg` is defined as that same value, so neither
	 * hovering an item nor making it the active one paints anything behind it: the row
	 * signals itself by darkening from `gray-700` to `black`. shadcn fills with `bg-muted`
	 * instead. `data-selected` rather than `focus`, because a command list moves one
	 * attribute along the rows as the arrow keys travel instead of moving focus.
	 *
	 * The consequence is worth stating: with the fill gone, the keyboard cursor in this list
	 * is a text-colour change and nothing else. That is the classic theme's convention applied
	 * literally, and it is weaker here than it is in a mouse-driven dropdown.
	 *
	 * `--muted-foreground` is exactly `gray-700` in dark mode (where the classic theme itself switches
	 * to `secondary-color`, the same #6E84A3) and one step lighter in light; `--foreground`
	 * is `black` in both. Same pair as the Dropdowns page.
	 *
	 * `.dropdown-item` also carries `border-radius: 0`, which is NOT reproduced: nothing is
	 * ever painted behind an item now, so the corner radius has nothing to round, and asking
	 * for it would mean fighting the component's `in-data-[slot=dialog-content]:rounded-lg!`
	 * with a second important utility for no visible gain.
	 *
	 * The font size needs nothing — `--bs-dropdown-font-size` is `font-size-base` (0.9375rem),
	 * which is what `--text-sm` holds and what the component already asks for.
	 */
	const item =
		"px-6 py-1.5 text-muted-foreground data-selected:bg-transparent data-selected:text-foreground";

	/**
	 * `.dropdown-divider`: `margin: dropdown-divider-margin-y 0` (0.75rem) and a 1px rule.
	 * `mx-0` cancels the component's `-mx-1`, which exists to bleed the rule past a menu that
	 * has horizontal padding; this one no longer does. The colour argument is the Dropdowns
	 * page's — `dropdown-divider-bg` is `rgba(black, .1)` in light and solid `black` in
	 * dark, and `--border` keeps the divider tied to every other hairline in the app instead
	 * of to two loose values.
	 */
	const separator = "mx-0 my-3 bg-border";

	/**
	 * The dialog.
	 *
	 *   sm:max-w-[600px]   `modal-width: 600px`, against shadcn's `sm:max-w-md` (448px)
	 *   top-1/2, -translate-y-1/2   the classic theme's search modal is `.modal-dialog-centered`, so it
	 *                      sits in the middle of the viewport. `Command.Dialog` overrides the
	 *                      base dialog to `top-1/3 translate-y-0` — the command-palette
	 *                      convention, not a classic one — and this puts it back
	 *
	 * `rounded-xl` needs nothing: `--bs-modal-border-radius` is `border-radius-lg` (0.5rem),
	 * which is exactly what `--radius-xl` holds here. Neither does the surface — the classic theme's
	 * `--bs-modal-bg` is the BODY background, but its own modal then puts a `.modal-card.card`
	 * inside it, so what the eye lands on is `card-bg`: white / `gray-800-dark`, i.e.
	 * `bg-popover`, which is already there.
	 *
	 * One thing this cannot reach: `Command.Dialog` mounts the inner `Command.Root` itself,
	 * with `p-1` baked in, so the dialog's menu carries 4px that the standalone one above
	 * does not.
	 */
	const dialog = "top-1/2 -translate-y-1/2 sm:max-w-[600px]";

	const suggestions: { icon: LucideIcon; label: string; disabled?: boolean }[] = [
		{ icon: CalendarIcon, label: "Calendar" },
		{ icon: SmileIcon, label: "Search Emoji" },
		{ icon: CalculatorIcon, label: "Calculator", disabled: true },
	];

	/**
	 * The shortcuts carry the ⌘ they are written with in the demo source
	 * (`docs/src/lib/registry/examples/command-demo.svelte`). Worth stating, because the docs
	 * page served as markdown drops every one of these glyphs — ⌘ ⇧ ⌥ ⌃ ⏎ — so reading the
	 * page rather than the source yields a bare "P", "B", "S" and silently loses the modifier.
	 */
	const settings: { icon: LucideIcon; label: string; shortcut: string }[] = [
		{ icon: UserIcon, label: "Profile", shortcut: "⌘P" },
		{ icon: CreditCardIcon, label: "Billing", shortcut: "⌘B" },
		{ icon: SettingsIcon, label: "Settings", shortcut: "⌘S" },
	];

	let open = $state(false);

	/**
	 * The docs example binds the shortcut with `<svelte:document onkeydown={…} />`. An
	 * `$effect` is used instead so the listener is added and removed in one place, and so the
	 * teardown is visible rather than implied — the page is mounted and unmounted by the hash
	 * router on every navigation, and a listener left on `document` would keep firing from a
	 * page that is no longer on screen.
	 *
	 * `metaKey || ctrlKey` covers ⌘J and Ctrl+J with one branch, as the docs example does.
	 */
	$effect(() => {
		function onKeydown(event: KeyboardEvent) {
			if (event.key === "j" && (event.metaKey || event.ctrlKey)) {
				event.preventDefault();
				open = !open;
			}
		}

		document.addEventListener("keydown", onKeydown);
		return () => document.removeEventListener("keydown", onKeydown);
	});

	/* ---------------------------------------------------------------------------------------
	 * The sections below are the command demo set. Its first three demos are not here:
	 * demo 1 is the inline menu the top of this page already shows, and
	 * demo 2 / demo 3 are the same Settings/Suggestions groups inside a
	 * dialog, which the Dialog section already is — a button trigger instead of ⌘J being the
	 * only difference. demo 7 (Create/Navigate/System groups with shortcuts) is
	 * likewise the composition the Dialog and many-groups sections already cover.
	 *
	 * The dialogs reuse this page's the classic theme reading — the `dialog`, `list`, `group`, `item`
	 * and `separator` constants above — rather than per-demo classes, so every menu on the page
	 * is the same menu. Three substitutions, all standing repository rules:
	 *
	 *   - demo 6 loads five stock portraits; this repository ships no images and
	 *     fetches none, so the avatars are initials (`getInitials`, as the Avatar page does).
	 *   - The `Badge` soft variants `primary-light` / `info-light` / `success-light` map to
	 *     the house `{state}-subtle` family, and its `size="sm"` is dropped — the house Badge
	 *     has one size.
	 *   - demo 8 paints its favorite stars `text-yellow-500`; raw palette colours
	 *     are banned, so they take `text-warning`.
	 * ------------------------------------------------------------------------------------ */

	type CommandEntry = { icon: LucideIcon; label: string; shortcut?: string };

	/** demo 4 — five groups, enough rows for the 350px list cap to scroll. */
	const manyGroups: { heading: string; items: CommandEntry[] }[] = [
		{
			heading: "Navigation",
			items: [
				{ icon: HouseIcon, label: "Home", shortcut: "⌘H" },
				{ icon: InboxIcon, label: "Inbox", shortcut: "⌘I" },
				{ icon: FileTextIcon, label: "Documents", shortcut: "⌘D" },
				{ icon: FolderIcon, label: "Folders", shortcut: "⌘F" },
			],
		},
		{
			heading: "Actions",
			items: [
				{ icon: PlusIcon, label: "New File", shortcut: "⌘N" },
				{ icon: FolderPlusIcon, label: "New Folder", shortcut: "⇧⌘N" },
				{ icon: CopyIcon, label: "Copy", shortcut: "⌘C" },
				{ icon: ScissorsIcon, label: "Cut", shortcut: "⌘X" },
				{ icon: ClipboardIcon, label: "Paste", shortcut: "⌘V" },
				{ icon: TrashIcon, label: "Delete", shortcut: "⌫" },
			],
		},
		{
			heading: "View",
			items: [
				{ icon: LayoutGridIcon, label: "Grid View" },
				{ icon: ListIcon, label: "List View" },
				{ icon: ZoomInIcon, label: "Zoom In", shortcut: "⌘+" },
				{ icon: ZoomOutIcon, label: "Zoom Out", shortcut: "⌘-" },
			],
		},
		{
			heading: "Account",
			items: [
				{ icon: UserIcon, label: "Profile", shortcut: "⌘P" },
				{ icon: CreditCardIcon, label: "Billing", shortcut: "⌘B" },
				{ icon: SettingsIcon, label: "Settings", shortcut: "⌘S" },
				{ icon: BellIcon, label: "Notifications" },
				{ icon: CircleQuestionMarkIcon, label: "Help & Support" },
			],
		},
		{
			heading: "Tools",
			items: [
				{ icon: CalculatorIcon, label: "Calculator" },
				{ icon: CalendarIcon, label: "Calendar" },
				{ icon: ImageIcon, label: "Image Editor" },
				{ icon: CodeIcon, label: "Code Editor" },
			],
		},
	];

	let manyGroupsOpen = $state(false);

	/** demo 5 — a file finder: name, dimmed path, and the extension as a badge. */
	const searchFiles: { name: string; path: string; type: string }[] = [
		{ name: "page.tsx", path: "src/app/page.tsx", type: "tsx" },
		{ name: "layout.tsx", path: "src/app/layout.tsx", type: "tsx" },
		{ name: "globals.css", path: "src/styles/globals.css", type: "css" },
		{ name: "utils.ts", path: "src/lib/utils.ts", type: "ts" },
		{ name: "api.ts", path: "src/lib/api.ts", type: "ts" },
		{ name: "button.tsx", path: "src/components/ui/button.tsx", type: "tsx" },
		{ name: "package.json", path: "package.json", type: "json" },
		{ name: "README.md", path: "README.md", type: "md" },
	];

	let fileSearchOpen = $state(false);

	/** demo 6, minus the stock portraits — see the block comment above. */
	const searchUsers: { name: string; email: string; role: string }[] = [
		{ name: "Alex Johnson", email: "alex@example.com", role: "Admin" },
		{ name: "Sarah Chen", email: "sarah@example.com", role: "Editor" },
		{ name: "David Kim", email: "david@example.com", role: "Viewer" },
		{ name: "Emma Wilson", email: "emma@example.com", role: "Admin" },
		{ name: "Michael Rodriguez", email: "michael@example.com", role: "Editor" },
	];

	const roleBadgeVariant: Record<string, BadgeVariant> = {
		Admin: "primary-subtle",
		Editor: "info-subtle",
		Viewer: "success-subtle",
	};

	let userSearchOpen = $state(false);

	/** demo 8 — the trailing slot carries a timestamp instead of a key hint. */
	const recentFavorites = ["Design System", "API Documentation"];

	const recentEntries: { label: string; time: string }[] = [
		{ label: "Dashboard Analytics", time: "2m ago" },
		{ label: "User Settings", time: "15m ago" },
		{ label: "Team Members", time: "1h ago" },
		{ label: "Billing & Plans", time: "2h ago" },
	];

	const recentQuickLinks: CommandEntry[] = [
		{ icon: BookOpenIcon, label: "Documentation" },
		{ icon: LifeBuoyIcon, label: "Help & Support" },
		{ icon: MessageSquareIcon, label: "Contact Us" },
	];

	let recentOpen = $state(false);
</script>

<DocPage title="Command">
	{#snippet subtitle()}
		Fast, composable, unstyled command menu for Svelte. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/command"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<Command.Root class={menu}>
				<Command.Input placeholder="Type a command or search..." />
				<Command.List class={list}>
					<Command.Empty>No results found.</Command.Empty>
					<Command.Group heading="Suggestions" class={group}>
						{#each suggestions as entry (entry.label)}
							<!--
								The icons carry no classes. The component sizes them itself
								(`[&_svg:not([class*='size-'])]:size-4`) and spaces them with `gap-2`; the
								docs' older `me-2 size-4` predates that and would now double the gap.
							-->
							<Command.Item class={item} disabled={entry.disabled}>
								<entry.icon />
								<span>{entry.label}</span>
							</Command.Item>
						{/each}
					</Command.Group>
					<Command.Separator class={separator} />
					<Command.Group heading="Settings" class={group}>
						{#each settings as entry (entry.label)}
							<Command.Item class={item}>
								<entry.icon />
								<span>{entry.label}</span>
								<Command.Shortcut>{entry.shortcut}</Command.Shortcut>
							</Command.Item>
						{/each}
					</Command.Group>
				</Command.List>
			</Command.Root>
		</Card.Content>
	</Card.Root>

	<DocSection title="Dialog">
		{#snippet blurb()}
			Renders the same menu inside a dialog, opened from anywhere on the page by a keyboard
			shortcut. Use <code class="text-[87.5%] text-primary">Command.Dialog</code> instead of
			<code class="text-[87.5%] text-primary">Command.Root</code>; it takes the props of both.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<p class="text-sm text-muted-foreground">
					Press
					<!--
						The docs hand-build a cap here (`h-5 rounded border bg-muted text-[10px]`), which
						predates the `Kbd` component; `Kbd.Group` is the same shape as a real component,
						and it keeps this chip identical to the ones on the Kbd page. The classic framework's own
						`kbd` rule — an inverted, monospace, 87.5% chip — is deliberately not followed,
						for the reason that page's header records: the classic theme never opted into it.

						The label reads ⌘J, as the docs write it. The binding below is broader than the
						label — `metaKey || ctrlKey` — so Ctrl+J opens it too on a machine with no ⌘ key.
					-->
					<Kbd.Group>
						<Kbd.Root>⌘</Kbd.Root>
						<Kbd.Root>J</Kbd.Root>
					</Kbd.Group>
					to open the command menu.
				</p>

				<Command.Dialog bind:open class={dialog}>
					<Command.Input placeholder="Type a command or search..." />
					<Command.List class={list}>
						<Command.Empty>No results found.</Command.Empty>
						<Command.Group heading="Suggestions" class={group}>
							{#each suggestions as entry (entry.label)}
								<Command.Item class={item}>
									<entry.icon />
									<span>{entry.label}</span>
								</Command.Item>
							{/each}
						</Command.Group>
						<Command.Separator class={separator} />
						<Command.Group heading="Settings" class={group}>
							{#each settings as entry (entry.label)}
								<Command.Item class={item}>
									<entry.icon />
									<span>{entry.label}</span>
									<Command.Shortcut>{entry.shortcut}</Command.Shortcut>
								</Command.Item>
							{/each}
						</Command.Group>
					</Command.List>
				</Command.Dialog>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Command with many groups">
		{#snippet blurb()}
			Five headed groups in one dialog — enough rows that the 350px list cap actually scrolls.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Button variant="outline" onclick={() => (manyGroupsOpen = true)}>Open Command</Button>
				<Command.Dialog bind:open={manyGroupsOpen} class={dialog}>
					<Command.Input placeholder="Type a command or search..." />
					<Command.List class={list}>
						<Command.Empty>No results found.</Command.Empty>
						{#each manyGroups as section, index (section.heading)}
							{#if index > 0}
								<Command.Separator class={separator} />
							{/if}
							<Command.Group heading={section.heading} class={group}>
								{#each section.items as entry (entry.label)}
									<Command.Item class={item}>
										<entry.icon />
										<span>{entry.label}</span>
										{#if entry.shortcut}
											<Command.Shortcut>{entry.shortcut}</Command.Shortcut>
										{/if}
									</Command.Item>
								{/each}
							</Command.Group>
						{/each}
					</Command.List>
				</Command.Dialog>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="File search command palette">
		{#snippet blurb()}
			Rows that carry more than a label: file name, dimmed path, and the extension as an outline
			badge in the trailing slot.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Button variant="outline" class="w-52" onclick={() => (fileSearchOpen = true)}>
					<SearchIcon data-icon="inline-start" />
					Search files
					<!-- The `Kbd` chip sits in the trigger too; same component here. -->
					<Kbd.Root class="ml-auto">⌘K</Kbd.Root>
				</Button>
				<Command.Dialog bind:open={fileSearchOpen} class={dialog}>
					<Command.Input placeholder="Search files by name..." />
					<Command.List class={list}>
						<Command.Empty>No files found.</Command.Empty>
						<Command.Group heading="Files" class={group}>
							{#each searchFiles as file (file.path)}
								<Command.Item class={`${item} gap-2.5`}>
									<FileIcon />
									<div class="flex flex-1 items-center gap-2">
										<span class="font-medium">{file.name}</span>
										<span class="truncate text-xs text-muted-foreground">{file.path}</span>
									</div>
									<!--
										Hand-building a `div.ml-auto[data-slot=command-shortcut]` around the
										badge; `Command.Shortcut` renders exactly that span, so the part is used
										directly. Its `size="sm"` is dropped — the house Badge has one size.
									-->
									<Command.Shortcut>
										<Badge variant="outline">{file.type}</Badge>
									</Command.Shortcut>
								</Command.Item>
							{/each}
						</Command.Group>
					</Command.List>
				</Command.Dialog>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="User search command with avatars">
		{#snippet blurb()}
			Two-line people rows with an avatar and a role badge. The stock portraits become initials, and
			its <code class="text-[87.5%] text-primary">*-light</code> badge variants map to the house
			<code class="text-[87.5%] text-primary">*-subtle</code> family.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Button variant="outline" onclick={() => (userSearchOpen = true)}>Search Users</Button>
				<Command.Dialog bind:open={userSearchOpen} class={dialog}>
					<Command.Input placeholder="Search by name or email..." />
					<Command.List class={list}>
						<Command.Empty>No users found.</Command.Empty>
						<Command.Group heading="Team Members" class={group}>
							{#each searchUsers as user (user.email)}
								<Command.Item class={`${item} gap-2 py-2`}>
									<Avatar.Root class="size-6 shrink-0">
										<Avatar.Fallback class="text-xs">{getInitials(user.name)}</Avatar.Fallback>
									</Avatar.Root>
									<div class="flex flex-1 flex-col">
										<span class="text-sm font-medium">{user.name}</span>
										<span class="text-xs text-muted-foreground">{user.email}</span>
									</div>
									<Command.Shortcut>
										<Badge variant={roleBadgeVariant[user.role]}>{user.role}</Badge>
									</Command.Shortcut>
								</Command.Item>
							{/each}
						</Command.Group>
					</Command.List>
				</Command.Dialog>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Command with recent and favorites sections">
		{#snippet blurb()}
			The trailing slot carrying a relative timestamp instead of a key hint. The
			<code class="text-[87.5%] text-primary">text-yellow-500</code> stars take
			<code class="text-[87.5%] text-primary">text-warning</code> — raw palette colours are banned here.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Button variant="outline" onclick={() => (recentOpen = true)}>Search Everything</Button>
				<Command.Dialog bind:open={recentOpen} class={dialog}>
					<Command.Input placeholder="Search or jump to..." />
					<Command.List class={list}>
						<Command.Empty>No results found.</Command.Empty>
						<Command.Group heading="Favorites" class={group}>
							{#each recentFavorites as favorite (favorite)}
								<Command.Item class={item}>
									<StarIcon class="text-warning" />
									<span>{favorite}</span>
								</Command.Item>
							{/each}
						</Command.Group>
						<Command.Separator class={separator} />
						<Command.Group heading="Recent" class={group}>
							{#each recentEntries as entry (entry.label)}
								<!--
									The source wraps its third row in an extra flex div the other three do
									not have — same rendering either way, so all four share one shape.
								-->
								<Command.Item class={item}>
									<ClockIcon class="text-muted-foreground" />
									<span>{entry.label}</span>
									<Command.Shortcut>{entry.time}</Command.Shortcut>
								</Command.Item>
							{/each}
						</Command.Group>
						<Command.Separator class={separator} />
						<Command.Group heading="Quick Links" class={group}>
							{#each recentQuickLinks as entry (entry.label)}
								<Command.Item class={item}>
									<entry.icon />
									<span>{entry.label}</span>
								</Command.Item>
							{/each}
						</Command.Group>
					</Command.List>
				</Command.Dialog>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
