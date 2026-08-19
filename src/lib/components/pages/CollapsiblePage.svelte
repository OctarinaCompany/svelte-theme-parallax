<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Collapsible from "$lib/components/ui/collapsible/index.js";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/* The sections below the two shadcn-svelte examples are the pattern appendix — see the note
	   that introduces them, further down this block. */
	import type { LucideIcon } from "@lucide/svelte";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import * as Frame from "$lib/components/ui/frame/index.js";
	import * as InputGroup from "$lib/components/ui/input-group/index.js";
	import * as Item from "$lib/components/ui/item/index.js";
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Checkbox } from "$lib/components/ui/checkbox/index.js";
	import { Progress } from "$lib/components/ui/progress/index.js";
	import BellIcon from "@lucide/svelte/icons/bell";
	import ChartBarIcon from "@lucide/svelte/icons/chart-bar";
	import CheckIcon from "@lucide/svelte/icons/check";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import ClockIcon from "@lucide/svelte/icons/clock";
	import CopyIcon from "@lucide/svelte/icons/copy";
	import CreditCardIcon from "@lucide/svelte/icons/credit-card";
	import DownloadIcon from "@lucide/svelte/icons/download";
	import EllipsisIcon from "@lucide/svelte/icons/ellipsis";
	import FileIcon from "@lucide/svelte/icons/file";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import FolderIcon from "@lucide/svelte/icons/folder";
	import LayoutDashboardIcon from "@lucide/svelte/icons/layout-dashboard";
	import LockIcon from "@lucide/svelte/icons/lock";
	import MapPinIcon from "@lucide/svelte/icons/map-pin";
	import MessageSquareIcon from "@lucide/svelte/icons/message-square";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import Settings2Icon from "@lucide/svelte/icons/settings-2";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import ShieldIcon from "@lucide/svelte/icons/shield";
	import TrashIcon from "@lucide/svelte/icons/trash";
	import UserIcon from "@lucide/svelte/icons/user";

	/**
	 * The Collapsible component page, ported from the shadcn-svelte documentation
	 * (https://shadcn-svelte.com/docs/components/collapsible). That page carries two
	 * examples — the "@huntabyte starred 3 repositories" demo and the minimal Usage form —
	 * and both are here, in that order.
	 *
	 * WHAT THE CLASSIC THEME HAS: ALMOST NOTHING. The reference source has no collapse
	 * partial of its own, and it overrides no collapse variable — not
	 * `transition-collapse`, not anything else. What ships in the classic theme's bundle is
	 * the base framework's collapse CSS, unmodified, and that is the whole component:
	 *
	 *   .collapse:not(.show) { display: none }
	 *   .collapsing { height: 0; overflow: hidden; transition: height .35s ease }
	 *   @media (prefers-reduced-motion: reduce) { .collapsing { transition: none } }
	 *
	 * (verbatim from the reference bundle). No surface, no border, no
	 * padding, no type, no colour — `.collapse` is behaviour expressed as three
	 * declarations. So there is no classic "look" to port onto the component itself, and
	 * the only value worth carrying over is the height transition, which lands on
	 * {@link panel} below.
	 *
	 * THE ONE EXCEPTION IS THE TOGGLE. The reference stylesheet styles the collapse toggles in the
	 * vertical navbar and nowhere else:
	 *
	 *   .navbar-vertical .navbar-nav .nav-link[data-bs-toggle='collapse']:after {
	 *     content: '\e92e'; font-family: 'Feather'; margin-left: auto;
	 *     transition: transform .2s;
	 *   }
	 *   ...&[aria-expanded='true']:after { transform: rotate(-180deg) }
	 *
	 * `\e92e` is `.fe-chevron-down` (checked against the compiled bundle), i.e. Lucide's
	 * `chevron-down` — same drawing, renamed export, as ButtonPage explains. That caret
	 * is reproduced in the Usage section, since it is the only collapse affordance the
	 * theme actually draws.
	 *
	 * The classic theme's own documentation has no collapse section at
	 * all: `.collapse` appears there only inside the sidebar and inside the accordion.
	 *
	 * EVERYTHING ELSE ON THIS PAGE is the docs demo's own ad-hoc chrome — bordered rows, a
	 * heading, a ghost icon button. Each takes the nearest classic-theme counterpart where one
	 * exists, and shadcn's default where none does; the comments below say which is which.
	 */

	/**
	 * `Collapsible.Content`, and the only genuine port on the page.
	 *
	 *   overflow-hidden       `.collapsing { overflow: hidden }` — also what makes an
	 *                         animated height clip rather than reflow
	 *   animate-collapsible-* `.collapsing { height: 0 }` -> the open height, and back.
	 *                         The keyframes come from `tw-animate-css` and interpolate to
	 *                         `--bits-collapsible-content-height`, which bits-ui measures
	 *                         onto the element; `data-open:` / `data-closed:` are the
	 *                         shadcn-svelte variants for its `data-state`, the same pair
	 *                         `accordion-content.svelte` uses
	 *   duration-350         `transition: height .35s` — tw-animate-css reads `--tw-duration`
	 *   ease-[ease]           ...and `--tw-ease`, so the pair restates `.35s ease` exactly.
	 *                         Its own defaults are `.2s ease-out`
	 *   motion-reduce:        `@media (prefers-reduced-motion: reduce) { .collapsing {
	 *                         transition: none } }`. The classic framework drops the transition rather
	 *                         than the height change, which is what `animate-none` does
	 *
	 * shadcn's collapsible is unstyled — `collapsible-content.svelte` passes `restProps`
	 * straight through and sets no classes — so none of this overrides anything.
	 */
	const panel =
		"overflow-hidden duration-350 ease-[ease] data-open:animate-collapsible-down data-closed:animate-collapsible-up motion-reduce:animate-none";

	/**
	 * One repository row. The docs ask for `rounded-md border px-4 py-3 font-mono text-sm`.
	 *
	 *   rounded-md   `border-radius` (6px). The docs value already IS the classic theme's — unchanged
	 *   border       resolves to `--border` through `@layer base`.
	 *                `list-group-border-color: var(--bs-gray-200)` is #EDF2F9, which
	 *                `--border` holds exactly, and `list-group-border-color-dark:
	 *                var(--bs-border-color)` resolves to `border-color-dark` (#1E3A5C),
	 *                which `--border` also holds — an exact match in both modes
	 *   px-5 py-4    `list-group-item-padding-x: 1.25rem` / `list-group-item-padding-y: 1rem`,
	 *                against the docs' 16/12. These rows are the demo's own invention;
	 *                `.list-group-item` is the nearest thing the classic theme has to "a bordered row
	 *                of text", and ListGroupPage already ports that pair
	 *   text-sm      `font-size-base` (15px) under this theme's type scale — unchanged
	 *   font-mono    left alone. This repo declares no `--font-mono`, so Tailwind's default
	 *                stack applies; `--bs-font-monospace` compiles to
	 *                `SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",
	 *                monospace`, the same list without Tailwind's leading `ui-monospace`
	 */
	const row = "rounded-md border px-5 py-4 font-mono text-sm";

	/**
	 * The icon-only trigger of the first demo.
	 *
	 * The classic framework has no ghost button, so the variant itself stays shadcn's — case (c). The
	 * geometry does not: the docs ask for `size: 'sm'` plus `w-9 p-0`, a 36px square, where
	 * `.btn-sm` resolves to 28.75px tall in the reference (13px x 1.75 line-height +
	 * 2 x .125rem padding + 2 x 1px border — the derivation ButtonPage writes out from
	 * `input-btn-*`); the square renders the ramp's `--control-h-sm` (32px) through
	 * `icon-sm` itself, the divergence `app.css` records. `rounded-sm` stays for
	 * `border-radius-sm`, the corner the classic framework pairs with that size — merged by `cn()`,
	 * where concatenating would leave the winner to Tailwind's sort order.
	 */
	const toggle = cn(buttonVariants({ variant: "ghost", size: "icon-sm" }), "rounded-sm");

	/**
	 * The Usage trigger, styled as the vertical-navbar link the classic theme hangs its caret on:
	 * `display: flex; align-items: center` plus `padding: nav-link-padding-y (.5rem)`.
	 *
	 * The horizontal padding is deliberately NOT ported — `.navbar-vertical .navbar-nav
	 * .nav-link` uses `navbar-vertical-padding-x` (1.5rem), which is the sidebar's gutter
	 * and means nothing inside a card. `.nav-link` sets no font-size or weight either, so
	 * both inherit the body: `font-size-base` (`text-sm` here) at `font-weight-normal`.
	 *
	 * The colour stays `--foreground` rather than `navbar-light-color` (gray-700): that
	 * grey belongs to the sidebar's own palette, not to a collapse toggle in general.
	 *
	 * `group` exists only so the caret can read the trigger's `aria-expanded` — the same
	 * attribute the classic selector matches on.
	 */
	const navToggle = "group flex w-full items-center py-2 text-sm font-normal";

	/**
	 * The caret itself.
	 *
	 *   ml-auto                  `margin-left: auto`, verbatim
	 *   transition-transform     `transition: transform .2s`
	 *   duration-200
	 *   -rotate-180              `&[aria-expanded='true'] { transform: rotate(-180deg) }`
	 *   size-4                   the classic theme's caret is an icon-font glyph, so it renders at the
	 *                            inherited `font-size-base` (15px); 16px is the nearest step
	 *                            and the size the button variants already give their icons
	 */
	const caret = "ml-auto size-4 transition-transform duration-200 group-aria-expanded:-rotate-180";

	/* =======================================================================================
	 * The appendix sections
	 *
	 * Everything from "Collapsible with checkbox settings" down is the collapsible demo set,
	 * in its documented order. shadcn-svelte's two
	 * examples above show what the primitive is; these nine show what it is FOR — a card that
	 * grows a detail list, a settings tray, a frame header that doubles as its own hit area, and
	 * two multi-level trees.
	 *
	 * FOUR THINGS ARE DONE THE HOUSE WAY THROUGHOUT, rather than upstream's:
	 *
	 * 1. THE OPEN-STATE ROTATION READS A NAMED GROUP. Upstream writes `in-data-[state=open]:` on
	 *    the caret, which matches ANY ancestor carrying the attribute — with a collapsible nested
	 *    inside a collapsible (the two tree demos) that is the wrong ancestor half the time. Every
	 *    caret here reads `group-data-[state=open]/collapsible:` off the nearest
	 *    `Collapsible.Root`, which is the precedent FramePage already set.
	 *
	 * 2. TRIGGERS THAT ARE A WHOLE BAR NEST THEIR CHROME INSIDE THE TRIGGER BUTTON, and triggers
	 *    that ARE a control take it through `child`. Upstream reaches for `asChild` either way;
	 *    bits-ui's `child` snippet is the same tool, and where the trigger contains a SECOND
	 *    control (the API-keys header's add button) the trigger is narrowed to the part that
	 *    toggles, so no button ends up inside another button.
	 *
	 * 3. THE OPEN TINT COMES FROM THE VARIANT. Upstream forces `bg-background!` on collapsible
	 *    triggers to cancel the tint its outline button takes when expanded. This repository's
	 *    outline and ghost variants already tint on `aria-expanded` — the attribute the trigger
	 *    sets — so the open state is legible without an override, and the override is dropped.
	 *
	 * 4. NO RAW PALETTE COLOURS, NO REMOTE IMAGERY. The API-key lock is `--success` rather than
	 *    `text-emerald-600`, and the profile demo drops its `flagcdn.com` flag and keeps the
	 *    country name — the same substitution the Filters and Tree pages make.
	 *
	 * The panel animation is {@link panel} in every one of them: the
	 * `animate-collapsible-up/down` pair, which the const above already carries plus the house
	 * duration and reduced-motion fallback.
	 *
	 * These demos also bring their own surface — every one is a card or a frame — so unlike the
	 * two shadcn-svelte examples above they sit straight in their section rather than inside a
	 * demo card, which is how CardPage and every other page of self-framing demos does it.
	 *
	 * ONE DEMO IS NOT REPEATED. demo 1 is the first example at the top of this page
	 * item for item — a heading, an icon-only chevrons-up-down trigger, one bordered summary row
	 * always on screen and two more behind the fold — with order details where shadcn-svelte has
	 * starred repositories. Porting it would restate the page's opening in different words.
	 * ==================================================================================== */

	/** demo 2. Open on load, as upstream's `defaultOpen` asks. */
	let notificationSettingsOpen = $state(true);

	/**
	 * The three rows of that tray. Upstream passes `defaultChecked` per row; here the checked
	 * flag lives on the datum and each row binds to it, so the demo keeps its answer.
	 */
	let notificationSettings = $state([
		{ id: "push", label: "Push notifications", checked: true },
		{ id: "email", label: "Email notifications", checked: false },
		{ id: "sms", label: "SMS notifications", checked: false },
	]);

	/** demo 4 — the usage breakdown hidden behind the card's bottom trigger. */
	const usageBreakdown = [
		{ label: "Requests", value: "$210.84" },
		{ label: "Active CPU", value: "$21.95" },
		{ label: "Events", value: "$21.20" },
		{ label: "Storage Usage", value: "$20.45" },
	];

	/** demo 6 — open on load, like upstream. */
	let deploymentPanelOpen = $state(true);

	/** demo 7 / demo 8 — likewise. */
	let apiKeysOpen = $state(true);
	let userProfileOpen = $state(true);

	/**
	 * demo 7. The list is state because the overflow menu deletes from it; the keys
	 * are the demo's own fixtures, not credentials.
	 */
	let apiKeys = $state([
		{ id: "1", name: "Production", key: "AUDO230454*242SDIFPPL" },
		{ id: "2", name: "Development", key: "DUILO30454*242SDIFUIP" },
		{ id: "3", name: "Staging", key: "IPPODAS230454*242SDI" },
	]);

	/** Which row's key is currently on the clipboard, so its menu item can show the receipt. */
	let copiedApiKeyId = $state<string | null>(null);
	let copiedApiKeyTimer: ReturnType<typeof setTimeout> | undefined;

	/**
	 * Upstream's `useCopyToClipboard` hook, inlined: this page needs the flag in one place, and
	 * `src/lib/shared/` is for machinery two components need. Same contract as the Input group
	 * page's copy demos — the receipt appears only after `writeText` RESOLVES, since the
	 * clipboard API can refuse (insecure context, denied permission), and the timer is re-armed
	 * from the last click rather than blinking on the first.
	 */
	async function copyApiKey(id: string, key: string) {
		try {
			await navigator.clipboard.writeText(key);
		} catch {
			return;
		}
		copiedApiKeyId = id;
		clearTimeout(copiedApiKeyTimer);
		copiedApiKeyTimer = setTimeout(() => (copiedApiKeyId = null), 2000);
	}

	/** demo 9 — a sidebar menu that nests three levels deep. */
	type NavMenuItem = {
		id: string;
		name: string;
		icon: LucideIcon;
		items?: NavMenuItem[];
	};

	const navMenuItems: NavMenuItem[] = [
		{
			id: "dashboard",
			name: "Dashboard",
			icon: LayoutDashboardIcon,
			items: [
				{
					id: "analytics",
					name: "Analytics",
					icon: ChartBarIcon,
					items: [
						{ id: "real-time", name: "Real-time", icon: FileTextIcon },
						{ id: "historical", name: "Historical", icon: FileTextIcon },
					],
				},
				{ id: "reports", name: "Reports", icon: MessageSquareIcon },
			],
		},
		{
			id: "team",
			name: "Team",
			icon: UserIcon,
			items: [
				{ id: "members", name: "Members", icon: UserIcon },
				{ id: "permissions", name: "Permissions", icon: ShieldIcon },
			],
		},
		{ id: "billing", name: "Billing", icon: CreditCardIcon },
		{ id: "settings", name: "Settings", icon: SettingsIcon },
		{ id: "notifications", name: "Notifications", icon: BellIcon },
	];

	/** The leaf the menu opens on, exactly as upstream seeds it. */
	let navMenuSelectedId = $state("real-time");

	/** demo 10 — the file tree, folders first. */
	type FileTreeItem = {
		name: string;
		items?: FileTreeItem[];
	};

	const fileTree: FileTreeItem[] = [
		{
			name: "components",
			items: [
				{
					name: "ui",
					items: [{ name: "button.tsx" }, { name: "card.tsx" }, { name: "dialog.tsx" }],
				},
				{ name: "login-form.tsx" },
			],
		},
		{ name: "lib", items: [{ name: "utils.ts" }, { name: "api.ts" }] },
		{ name: "hooks", items: [{ name: "use-debounce.ts" }, { name: "use-local-storage.ts" }] },
		{ name: "app.tsx" },
		{ name: "package.json" },
	];

	let fileTreeSelectedName = $state<string | null>(null);

	/**
	 * A tree leaf carries its own download and delete buttons, so it cannot itself be a `<button>`
	 * — nesting controls is invalid, and the inner ones stop receiving clicks. It is a row with
	 * `role="button"` instead, which owes the keyboard the activation a real button gives for
	 * free: Enter and Space both select, and Space's page-scroll default is suppressed.
	 */
	function onFileTreeLeafKeydown(event: KeyboardEvent, name: string) {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			fileTreeSelectedName = name;
		}
	}
</script>

<!--
	The two recursive rows of the last sections live at the top level of the markup rather than
	inside their own section: a snippet declared inside a component's children is read as a PROP of
	that component, and neither `DocSection` nor `DocPage` takes one by these names. Declared here
	they are in scope for the whole template and remain each other's neighbours, which is also the
	clearest place to compare them — the same recursion, once over a menu and once over a tree.
-->
{#snippet navMenuRow(item: NavMenuItem, level: number)}
	{@const Icon = item.icon}
	{@const childItems = item.items ?? []}
	{#if childItems.length > 0}
		<Collapsible.Root class="group/collapsible">
			<Collapsible.Trigger class="w-full">
				<Item.Root
					size="xs"
					class="cursor-pointer py-1.25 group-data-[state=open]/collapsible:bg-accent hover:bg-accent"
					style="padding-left: {level * 12 + 8}px"
				>
					<Item.Media variant="icon">
						<Icon class="text-muted-foreground group-hover/item:text-foreground" />
					</Item.Media>
					<Item.Title class="group-data-[state=open]/collapsible:font-semibold">
						{item.name}
					</Item.Title>
					<ChevronRightIcon
						class="ml-auto size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
					/>
				</Item.Root>
			</Collapsible.Trigger>
			<Collapsible.Content class={cn(panel, "pt-0.5")}>
				<div class="flex flex-col gap-0.5">
					{#each childItems as child (child.id)}
						{@render navMenuRow(child, level + 1)}
					{/each}
				</div>
			</Collapsible.Content>
		</Collapsible.Root>
	{:else}
		<button type="button" class="w-full" onclick={() => (navMenuSelectedId = item.id)}>
			<Item.Root
				size="xs"
				data-active={navMenuSelectedId === item.id}
				class="cursor-pointer py-1.25 hover:bg-accent data-[active=true]:bg-accent data-[active=true]:text-foreground"
				style="padding-left: {level * 12 + 8}px"
			>
				<Item.Media variant="icon">
					<Icon
						class="text-muted-foreground group-hover/item:text-foreground group-data-[active=true]/item:text-foreground"
					/>
				</Item.Media>
				<Item.Title>{item.name}</Item.Title>
			</Item.Root>
		</button>
	{/if}
{/snippet}

{#snippet fileTreeRow(item: FileTreeItem, level: number)}
	{@const childItems = item.items ?? []}
	{#if childItems.length > 0}
		<Collapsible.Root class="group/collapsible">
			<Collapsible.Trigger class="w-full">
				<Item.Root
					size="xs"
					class="cursor-pointer py-1.5 group-data-[state=open]/collapsible:bg-accent hover:bg-accent"
					style="padding-left: {level * 12 + 8}px"
				>
					<Item.Media variant="icon">
						<ChevronRightIcon
							class="size-3 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
						/>
						<FolderIcon class="size-3.5 text-muted-foreground group-hover/item:text-foreground" />
					</Item.Media>
					<Item.Title>{item.name}</Item.Title>
				</Item.Root>
			</Collapsible.Trigger>
			<Collapsible.Content class={cn(panel, "pt-0.5")}>
				<div class="flex flex-col gap-0.5 ps-1.5">
					{#each childItems as child (child.name)}
						{@render fileTreeRow(child, level + 1)}
					{/each}
				</div>
			</Collapsible.Content>
		</Collapsible.Root>
	{:else}
		<Item.Root
			role="button"
			tabindex={0}
			data-active={fileTreeSelectedName === item.name}
			class="cursor-pointer py-1.5 hover:bg-accent data-[active=true]:bg-accent"
			style="padding-left: {level * 12 + 9}px"
			onclick={() => (fileTreeSelectedName = item.name)}
			onkeydown={(event) => onFileTreeLeafKeydown(event, item.name)}
		>
			<Item.Media variant="icon">
				<FileIcon
					class="text-muted-foreground group-hover/item:text-foreground group-data-[active=true]/item:text-foreground"
				/>
			</Item.Media>
			<Item.Title
				class="text-secondary-foreground group-hover/item:text-foreground group-data-[active=true]/item:text-foreground"
			>
				{item.name}
			</Item.Title>
			<Item.Actions
				class="-mr-2 ml-auto gap-0 opacity-0 transition-opacity group-hover/item:opacity-100 group-data-[active=true]/item:opacity-100"
			>
				<Button variant="ghost" size="icon-xs">
					<DownloadIcon />
					<span class="sr-only">Download {item.name}</span>
				</Button>
				<Button variant="ghost" size="icon-xs">
					<TrashIcon />
					<span class="sr-only">Delete {item.name}</span>
				</Button>
			</Item.Actions>
		</Item.Root>
	{/if}
{/snippet}

<DocPage title="Collapsible">
	{#snippet subtitle()}
		An interactive component which expands and collapses a panel. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/collapsible"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<!--
				`w-[350px]` is the docs' own width; `max-w-full` keeps it from pushing the card
				wider than the reading column on a narrow viewport. The docs' `space-y-2` becomes
				`flex flex-col gap-2` — same 8px rhythm, and the repo does not use `space-*`.
			-->
			<Collapsible.Root class="flex w-[350px] max-w-full flex-col gap-2">
				<!--
					The docs put `px-4` on this row to line the heading up with the bordered rows
					below it. Those rows now carry `list-group-item-padding-x` (1.25rem), so the
					heading takes `px-5` to stay aligned with them.
				-->
				<div class="flex items-center justify-between gap-4 px-5">
					<!--
						`h4-font-size` is 0.9375rem, which `text-sm` already is here, and
						`headings-font-weight: 500` -> `font-medium`, against the docs'
						`font-semibold` (600 = `font-weight-bold`, which the classic theme reserves for
						`<b>`/`<strong>`).
					-->
					<h4 class="text-sm font-medium">@huntabyte starred 3 repositories</h4>
					<Collapsible.Trigger class={toggle}>
						<ChevronsUpDownIcon />
						<span class="sr-only">Toggle</span>
					</Collapsible.Trigger>
				</div>

				<div class={row}>@huntabyte/bits-ui</div>

				<Collapsible.Content class={cn(panel, "flex flex-col gap-2")}>
					<div class={row}>@melt-ui/melt-ui</div>
					<div class={row}>@sveltejs/svelte</div>
				</Collapsible.Content>
			</Collapsible.Root>
		</Card.Content>
	</Card.Root>

	<DocSection title="Usage">
		{#snippet blurb()}
			The bare form the documentation page shows under Usage — a trigger and a panel, with no chrome
			around them — carrying the one collapse affordance the classic theme does draw: the caret its
			vertical navbar puts on every
			<code class="text-[87.5%] text-primary">data-bs-toggle="collapse"</code> link.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Collapsible.Root class="w-[350px] max-w-full">
					<Collapsible.Trigger class={navToggle}>
						Can I use this in my project?
						<ChevronDownIcon class={caret} />
					</Collapsible.Trigger>
					<Collapsible.Content class={panel}>
						<!--
							`pb-2` mirrors the trigger's `nav-link-padding-y`, so the answer sits on the
							same rhythm as the row above it. The classic `.collapse` contributes no
							padding of its own — the sidebar spaces its panels with `.nav` instead.
						-->
						<p class="pb-2 text-sm">
							Yes. Free to use for personal and commercial projects. No attribution required.
						</p>
					</Collapsible.Content>
				</Collapsible.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Collapsible with checkbox settings">
		{#snippet blurb()}
			The trigger is an ordinary outline button and the panel behind it is a card of checkbox rows,
			so the tray reads as a menu that happens to fold away.
		{/snippet}
		<!--
			demo 2. The trigger takes the button through `child` — bits-ui's `asChild`:
			the button stays a button, and the trigger's click handler and `aria-expanded` land on it.
			That same attribute is what tints the outline variant while the tray is open, which is why
			upstream's `bg-background!` override is not carried over.
		-->
		<Collapsible.Root
			bind:open={notificationSettingsOpen}
			class="group/collapsible flex w-full max-w-xs flex-col gap-2"
		>
			<Collapsible.Trigger>
				{#snippet child({ props })}
					<Button variant="outline" class="w-full justify-start" {...props}>
						<ChevronRightIcon
							data-icon="inline-start"
							class="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
						/>
						Notification settings
					</Button>
				{/snippet}
			</Collapsible.Trigger>

			<Collapsible.Content class={panel}>
				<!-- `p-0` on the card, and the rows carry their own padding and rules instead. -->
				<Card.Root class="p-0">
					<Field.FieldGroup class="gap-0 divide-y">
						{#each notificationSettings as setting (setting.id)}
							<Field.Field>
								<Field.FieldLabel class="px-3 py-2">
									<Checkbox bind:checked={setting.checked} aria-label={setting.label} />
									<Field.FieldTitle>{setting.label}</Field.FieldTitle>
								</Field.FieldLabel>
							</Field.Field>
						{/each}
					</Field.FieldGroup>
				</Card.Root>
			</Collapsible.Content>
		</Collapsible.Root>
	</DocSection>

	<DocSection title="Collapsible animated card">
		{#snippet blurb()}
			One question inside a card — the smallest useful shape, and the one an FAQ repeats down a
			page.
		{/snippet}
		<!--
			demo 3. The whole row is the trigger, so the caret is decoration rather than
			the hit area; `text-start` is what keeps the question left-aligned once the trigger becomes
			a full-width button.
		-->
		<Card.Root class="w-full max-w-xs py-3">
			<Card.Content class="px-3">
				<Collapsible.Root class="group/collapsible">
					<Collapsible.Trigger
						class="flex w-full cursor-pointer items-center justify-between gap-4 text-start text-sm"
					>
						<span>How do I reset my password?</span>
						<ChevronDownIcon
							class="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180"
						/>
					</Collapsible.Trigger>
					<Collapsible.Content class={panel}>
						<p class="pt-3 text-sm text-muted-foreground">
							You can reset your password by clicking the "Forgot Password" link on the login page.
							We'll send you an email with instructions to create a new password.
						</p>
					</Collapsible.Content>
				</Collapsible.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Collapsible card with bottom trigger">
		{#snippet blurb()}
			The trigger straddles the card's bottom edge, which is what tells you the card itself is what
			grows — not a panel underneath it.
		{/snippet}
		<!--
			demo 4. `Collapsible.Root` is the positioned ancestor rather than the card, so
			the trigger can be absolutely placed against the card's edge while still being inside the
			collapsible. The card header is left at its own grid: it already places a `Card.Action` in
			a right-hand column, so upstream's `flex items-center justify-between` would only fight it.
		-->
		<Collapsible.Root class="group/collapsible relative w-full max-w-xs">
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-sm">3 days remaining in cycle</Card.Title>
					<Card.Action>
						<Button variant="outline" size="sm">Billing</Button>
					</Card.Action>
				</Card.Header>
				<Card.Content class="flex flex-col gap-4">
					<div class="flex flex-col gap-2 rounded-lg border bg-muted/60 p-3">
						<div class="flex justify-between text-sm font-medium">
							<span>$18.08 / $20</span>
							<span>$200</span>
						</div>
						<!-- The track is tinted with the bar's own hue so the meter reads as one object. -->
						<Progress value={90} class="bg-primary/20" />
					</div>

					<Collapsible.Content class={panel}>
						<div class="flex flex-col gap-2.5 pt-2">
							{#each usageBreakdown as line (line.label)}
								<div class="flex justify-between text-xs">
									<span class="font-medium text-muted-foreground">{line.label}</span>
									<span class="font-medium">{line.value}</span>
								</div>
							{/each}
						</div>
					</Collapsible.Content>
				</Card.Content>
			</Card.Root>

			<div class="absolute -bottom-3.5 left-1/2 -translate-x-1/2">
				<Collapsible.Trigger>
					{#snippet child({ props })}
						<Button variant="outline" size="icon-sm" class="rounded-full shadow-sm" {...props}>
							<ChevronDownIcon
								class="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180"
							/>
							<span class="sr-only">Toggle usage details</span>
						</Button>
					{/snippet}
				</Collapsible.Trigger>
			</div>
		</Collapsible.Root>
	</DocSection>

	<DocSection title="Collapsible form fields">
		{#snippet blurb()}
			The common field stays on screen and the adjustments that most forms leave at their defaults —
			tax and discount — wait behind a settings toggle beside it.
		{/snippet}
		<!--
			demo 5. The inputs are uncontrolled on purpose: the demo seeds each with a
			value and lets the field own it from there, which is what upstream's `defaultValue` does
			and what a pricing form actually wants.
		-->
		<Card.Root size="sm" class="w-full max-w-xs">
			<Card.Header>
				<Card.Title>Unit Pricing</Card.Title>
			</Card.Header>
			<Card.Content>
				<Collapsible.Root class="flex flex-col gap-3">
					<div class="flex items-end gap-2">
						<Field.Field class="flex-1">
							<Field.FieldLabel class="sr-only" for="collapsible-base-price">
								Base Price
							</Field.FieldLabel>
							<InputGroup.Root>
								<InputGroup.Input
									id="collapsible-base-price"
									type="number"
									placeholder="0.00"
									value="19.00"
								/>
								<InputGroup.Addon align="inline-end">
									<InputGroup.Text>$</InputGroup.Text>
								</InputGroup.Addon>
							</InputGroup.Root>
						</Field.Field>
						<Collapsible.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" size="icon" class="shrink-0" {...props}>
									<Settings2Icon />
									<span class="sr-only">Toggle price adjustments</span>
								</Button>
							{/snippet}
						</Collapsible.Trigger>
					</div>

					<Collapsible.Content class={panel}>
						<Field.FieldGroup class="gap-2">
							<Field.Field>
								<Field.FieldLabel for="collapsible-tax-rate">Tax Rate (%)</Field.FieldLabel>
								<InputGroup.Root>
									<InputGroup.Input
										id="collapsible-tax-rate"
										type="number"
										placeholder="0"
										value="15"
									/>
									<InputGroup.Addon align="inline-end">
										<InputGroup.Text>%</InputGroup.Text>
									</InputGroup.Addon>
								</InputGroup.Root>
							</Field.Field>
							<Field.Field>
								<Field.FieldLabel for="collapsible-discount">Discount (%)</Field.FieldLabel>
								<InputGroup.Root>
									<InputGroup.Input
										id="collapsible-discount"
										type="number"
										placeholder="0"
										value="0"
									/>
									<InputGroup.Addon align="inline-end">
										<InputGroup.Text>%</InputGroup.Text>
									</InputGroup.Addon>
								</InputGroup.Root>
							</Field.Field>
						</Field.FieldGroup>
					</Collapsible.Content>
				</Collapsible.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Collapsible frame">
		{#snippet blurb()}
			The frame's header doubles as the trigger, so the whole bar is the hit area and the panel it
			opens is the frame's own.
		{/snippet}
		<!--
			demo 6. `stacked` + `dense` fuse header and panel into one block and pull the
			panel flush to the shell edge; the collapsible wraps both, so the header stays put and only
			the panel leaves the flow. Frame page's own collapsible example shows the same wiring.
		-->
		<Frame.Root stacked dense spacing="sm" class="w-full max-w-xs">
			<Collapsible.Root bind:open={deploymentPanelOpen} class="group/collapsible">
				<Collapsible.Trigger class="flex w-full">
					<Frame.Header class="flex grow flex-row items-center justify-between gap-2">
						<!-- The frame title is semibold by default; this demo asks for the lighter weight. -->
						<Frame.Title class="font-medium">Deployment successful</Frame.Title>
						<ChevronRightIcon
							class="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
						/>
					</Frame.Header>
				</Collapsible.Trigger>
				<Collapsible.Content class={panel}>
					<Frame.Panel>
						<p class="text-xs leading-relaxed text-muted-foreground">
							Updated the core authentication logic and fixed a minor bug in the login flow.
							Improved session handling for better performance.
						</p>
					</Frame.Panel>
				</Collapsible.Content>
			</Collapsible.Root>
		</Frame.Root>
	</DocSection>

	<DocSection title="Nested collapsible list with actions">
		{#snippet blurb()}
			A frame header with a control of its own: the caret and the title toggle the panel, the plus
			beside them does not.
		{/snippet}
		<!--
			demo 7. Upstream puts the add button INSIDE the trigger, which nests one button
			in another — invalid, and the inner one stops toggling anything sensible. Here the header is
			the collapsible's sibling and the trigger covers only the caret and the title, so both
			controls do exactly one thing.

			The header's vertical padding is nudged with the frame's own `--frame-panel-header-py-adjust`
			rather than an `!important` override: that adjust variable exists so a caller can retune one
			region without restating the spacing ladder (see `frame.svelte`).
		-->
		<Frame.Root stacked dense spacing="sm" class="w-full max-w-xs">
			<Collapsible.Root bind:open={apiKeysOpen} class="group/collapsible">
				<Frame.Header
					class="flex flex-row items-center gap-1.5 [--frame-panel-header-py-adjust:-2px]"
				>
					<Collapsible.Trigger class="flex grow items-center gap-1.5">
						<ChevronRightIcon
							class="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
						/>
						<Frame.Title class="font-medium">API Keys</Frame.Title>
					</Collapsible.Trigger>
					<Button variant="ghost" size="icon-sm" class="ml-auto hover:border-border">
						<PlusIcon />
						<span class="sr-only">Add API key</span>
					</Button>
				</Frame.Header>

				<Collapsible.Content class={panel}>
					<Frame.Panel>
						<div class="flex flex-col gap-2.5">
							{#each apiKeys as apiKey (apiKey.id)}
								<div class="flex items-center justify-between gap-3.5">
									<div class="flex items-center gap-3">
										<div class="flex items-center gap-1.5">
											<!-- The padlock is `--success`: a live key, not a decorative green. -->
											<div
												class="flex size-5.5 shrink-0 items-center justify-center rounded-sm border-2 border-border/60 bg-muted"
											>
												<LockIcon class="size-3.5 text-success" />
											</div>
											<div class="w-10 truncate text-xs">{apiKey.name}</div>
										</div>
										<div class="w-40 truncate rounded-md bg-muted px-2 py-1 text-xs">
											{apiKey.key}
										</div>
									</div>
									<div class="flex shrink-0 items-center">
										<DropdownMenu.Root>
											<DropdownMenu.Trigger>
												{#snippet child({ props })}
													<Button variant="ghost" size="icon-xs" {...props}>
														<EllipsisIcon />
														<span class="sr-only">Actions for {apiKey.name}</span>
													</Button>
												{/snippet}
											</DropdownMenu.Trigger>
											<DropdownMenu.Content align="start" class="min-w-32">
												<DropdownMenu.Item onclick={() => copyApiKey(apiKey.id, apiKey.key)}>
													{#if copiedApiKeyId === apiKey.id}
														<CheckIcon class="text-success" />
														<span>Copied</span>
													{:else}
														<CopyIcon />
														<span>Copy key</span>
													{/if}
												</DropdownMenu.Item>
												<DropdownMenu.Item
													variant="destructive"
													onclick={() => (apiKeys = apiKeys.filter((k) => k.id !== apiKey.id))}
												>
													<TrashIcon />
													<span>Delete</span>
												</DropdownMenu.Item>
											</DropdownMenu.Content>
										</DropdownMenu.Root>
									</div>
								</div>
							{/each}
						</div>
					</Frame.Panel>
				</Collapsible.Content>
			</Collapsible.Root>
		</Frame.Root>
	</DocSection>

	<DocSection title="Collapsible User profile">
		{#snippet blurb()}
			The same frame with an identity in its header — a hover card that stays open, in effect.
		{/snippet}
		<!--
			demo 8. Upstream ends the location row with a flag from `flagcdn.com`; this
			repository fetches no imagery, so the row keeps the country name, which is the half a reader
			actually parses. The avatar is the one remote portrait the repo already allows itself
			(github.com/shadcn.png, as ButtonPage uses), with initials behind it while it loads.
		-->
		<Frame.Root stacked dense spacing="sm" class="w-full max-w-xs">
			<Collapsible.Root bind:open={userProfileOpen} class="group/collapsible">
				<Collapsible.Trigger class="flex w-full">
					<Frame.Header class="flex grow flex-row items-center justify-between gap-2">
						<div class="flex items-center gap-2">
							<Avatar.Root class="size-5">
								<Avatar.Image src="https://github.com/shadcn.png" alt="@shadcn" />
								<Avatar.Fallback>SC</Avatar.Fallback>
							</Avatar.Root>
							<span class="text-sm font-medium text-foreground">@shadcn</span>
						</div>
						<ChevronRightIcon
							class="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
						/>
					</Frame.Header>
				</Collapsible.Trigger>
				<Collapsible.Content class={panel}>
					<Frame.Panel>
						<div class="flex flex-col gap-2.5">
							<div class="flex items-center gap-2">
								<MessageSquareIcon class="size-3.5 text-muted-foreground" />
								<span class="text-xs text-muted-foreground">Last activity:</span>
								<span class="text-xs font-medium text-foreground">2 hours ago</span>
							</div>
							<div class="flex items-center gap-2">
								<ClockIcon class="size-3.5 text-muted-foreground" />
								<span class="text-xs text-muted-foreground">Online since:</span>
								<span class="text-xs font-medium text-foreground">Today, 9:00 AM</span>
							</div>
							<div class="flex items-center gap-2">
								<MapPinIcon class="size-3.5 text-muted-foreground" />
								<span class="text-xs text-muted-foreground">Location:</span>
								<span class="text-xs font-medium text-foreground">Canada</span>
							</div>
						</div>
					</Frame.Panel>
				</Collapsible.Content>
			</Collapsible.Root>
		</Frame.Root>
	</DocSection>

	<DocSection title="Multi-level collapsible menu">
		{#snippet blurb()}
			Three levels of navigation, each level a collapsible of its own. The indent is computed from
			the depth rather than nested padding, so a row's hit area still spans the full width.
		{/snippet}
		<!--
			demo 9. Upstream recurses through a React component; here the same recursion is
			a snippet that renders itself, which is why the whole menu fits on the page instead of in a
			helper file.

			Each branch owns a `group/collapsible`, so a child row's caret reads ITS state and not its
			parent's — the one place upstream's ancestor-matching `in-data-[state=open]:` would go
			wrong. Leaves are real buttons: they select, so they must answer the keyboard.
		-->

		<Card.Root class="w-full max-w-56 p-0">
			<Card.Content class="p-1">
				<div class="flex flex-col gap-0.5">
					{#each navMenuItems as item (item.id)}
						{@render navMenuRow(item, 0)}
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Tree view with file actions">
		{#snippet blurb()}
			The same recursion applied to a file tree, with per-file actions that appear on hover and stay
			visible on the selected row.
		{/snippet}
		<!--
			demo 10. A file row carries two buttons of its own, so it cannot itself be a
			button; it is a row with `role="button"`, a tab stop and an Enter/Space handler instead —
			the trade the script's `onFileTreeLeafKeydown` explains. Folder rows have no such problem
			and stay inside the collapsible trigger.

			`Item.Root` already declares `group/item`, which is what lets the actions fade in on hover
			without a wrapper of its own.
		-->

		<Card.Root size="sm" class="w-72 max-w-full gap-1 p-1">
			<Card.Header class="p-0">
				<Tabs.Root value="explorer">
					<Tabs.List class="h-8 w-full bg-accent p-1">
						<Tabs.Trigger value="explorer" class="text-xs">Explorer</Tabs.Trigger>
						<Tabs.Trigger value="outline" class="text-xs">Outline</Tabs.Trigger>
					</Tabs.List>
				</Tabs.Root>
			</Card.Header>
			<Card.Content class="p-0">
				<div class="flex flex-col gap-0.5">
					{#each fileTree as item (item.name)}
						{@render fileTreeRow(item, 0)}
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
