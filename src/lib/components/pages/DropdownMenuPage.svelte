<script lang="ts">
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import * as Tabs from "$lib/components/ui/tabs/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import ActivityIcon from "@lucide/svelte/icons/activity";
	import ArchiveIcon from "@lucide/svelte/icons/archive";
	import ArrowDownIcon from "@lucide/svelte/icons/arrow-down";
	import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
	import ArrowUpIcon from "@lucide/svelte/icons/arrow-up";
	import BellIcon from "@lucide/svelte/icons/bell";
	import BookOpenIcon from "@lucide/svelte/icons/book-open";
	import BuildingIcon from "@lucide/svelte/icons/building";
	import CheckIcon from "@lucide/svelte/icons/check";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import ChevronsUpDownIcon from "@lucide/svelte/icons/chevrons-up-down";
	import CopyIcon from "@lucide/svelte/icons/copy";
	import CreditCardIcon from "@lucide/svelte/icons/credit-card";
	import EllipsisIcon from "@lucide/svelte/icons/ellipsis";
	import EllipsisVerticalIcon from "@lucide/svelte/icons/ellipsis-vertical";
	import FileIcon from "@lucide/svelte/icons/file";
	import FileSpreadsheetIcon from "@lucide/svelte/icons/file-spreadsheet";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import FolderIcon from "@lucide/svelte/icons/folder";
	import FolderOpenIcon from "@lucide/svelte/icons/folder-open";
	import ImageIcon from "@lucide/svelte/icons/image";
	import LayoutIcon from "@lucide/svelte/icons/layout";
	import LifeBuoyIcon from "@lucide/svelte/icons/life-buoy";
	import LinkIcon from "@lucide/svelte/icons/link";
	import LogOutIcon from "@lucide/svelte/icons/log-out";
	import MailIcon from "@lucide/svelte/icons/mail";
	import MessageCircleIcon from "@lucide/svelte/icons/message-circle";
	import MonitorIcon from "@lucide/svelte/icons/monitor";
	import MoonIcon from "@lucide/svelte/icons/moon";
	import PaletteIcon from "@lucide/svelte/icons/palette";
	import PanelLeftIcon from "@lucide/svelte/icons/panel-left";
	import PencilIcon from "@lucide/svelte/icons/pencil";
	import PhoneIcon from "@lucide/svelte/icons/phone";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import PrinterIcon from "@lucide/svelte/icons/printer";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import Share2Icon from "@lucide/svelte/icons/share-2";
	import ShoppingCartIcon from "@lucide/svelte/icons/shopping-cart";
	import StarIcon from "@lucide/svelte/icons/star";
	import SunIcon from "@lucide/svelte/icons/sun";
	import TrashIcon from "@lucide/svelte/icons/trash";
	import UploadIcon from "@lucide/svelte/icons/upload";
	import UserIcon from "@lucide/svelte/icons/user";
	import UserPlusIcon from "@lucide/svelte/icons/user-plus";
	import UsersIcon from "@lucide/svelte/icons/users";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Dropdown Menu component page.
	 *
	 * The classic theme replaces the classic CSS-triangle caret with a Feather chevron
	 * (`.dropdown-toggle::after { content: '\e92e'; font-family: 'Feather' }`). Lucide's
	 * `chevron-down` is the same glyph, so the toggles below carry it as a real element.
	 */

	/** The three button sizes this page needs, from ButtonPage's derivation. */
	const btnBase = "h-10 rounded-md px-3 text-sm font-normal";

	/**
	 * The menu surface. Four values, all from `.dropdown-menu` in the compiled bundle:
	 *
	 *   min-w-40     `dropdown-min-width: 10rem`, against shadcn's `min-w-32`
	 *   py-2 px-0    `dropdown-padding-y: .5rem` with no horizontal padding — the items
	 *                run edge to edge and supply their own inset
	 *   rounded-md   `dropdown-border-radius: border-radius`
	 *   text-sm      `dropdown-font-size: font-size-base` (15px, which `--text-sm` holds)
	 *
	 * `w-(--bits-dropdown-menu-anchor-width)` in shadcn's base ties the menu to the trigger's
	 * width; the classic menu is content-sized, so it is reset to `w-auto`.
	 */
	const menu = "w-auto min-w-40 rounded-md px-0 py-2 text-sm";

	/**
	 * THE CLASSIC DROPDOWNS ARE NOT MODAL; bits-ui's are.
	 *
	 * While a menu is open, bits-ui locks the page — `document.body` gets `overflow: hidden`
	 * AND `pointer-events: none`, with the menu itself re-enabling pointer events. The visible
	 * consequence is that clicking a SECOND trigger while the first menu is open only dismisses
	 * the first: the click never reaches the second trigger, so it takes two clicks to move
	 * between menus. The classic framework closes one and opens the other in a single click.
	 *
	 * `preventScroll={false}` drops the lock, which restores the one-click behaviour. It is
	 * passed on every `Content` on this page rather than fixed globally: this is bits-ui's
	 * considered default for menus that can contain focusable content, and changing it for the
	 * whole app — the sidebar user menu, the data-table row menus — is a decision about
	 * behaviour, not about theme.
	 */
	const nonModal = false;

	/**
	 * A menu item.
	 *
	 * THE HOVER FILL IS THE ONE PLACE THIS PAGE DOES NOT REPRODUCE THE CLASSIC THEME, and it is deliberate.
	 * `--bs-dropdown-link-hover-bg` is TRANSPARENT there: an item signals hover by darkening its
	 * type and painting nothing, and this page used to say so with `focus:bg-transparent`. Read on
	 * its own that is faithful. Read next to the rest of this application it is the odd surface
	 * out — the sidebar's workspace switcher, the user menu and the Filters menu all light the row
	 * up, because they are shadcn components used as they ship. A page that documents the theme by
	 * behaving unlike every menu around it teaches the wrong thing, so the component's
	 * `focus:bg-accent` is left standing.
	 *
	 * EVERYTHING ELSE STAYS THE CLASSIC THEME'S. The row is still full-bleed (`rounded-none`, against
	 * shadcn's `rounded-sm`) and still inset by `dropdown-item-padding-x: 1.5rem` rather than
	 * shadcn's 0.5rem, so what the fill paints is a band the width of the menu, not a pill floating
	 * inside it. The resting colour is `gray-700`, which `--muted-foreground` holds exactly in dark
	 * (where the classic theme itself switches to `secondary-color`, the same #6E84A3) and one step lighter
	 * in light; hovered is now `--accent-foreground`, the token that pairs with the fill, and which
	 * is `black` / `white` — the same two values `dropdown-link-hover-color` asks for.
	 */
	const item = "rounded-none px-6 py-1.5 text-sm text-muted-foreground";

	/**
	 * `dropdown-divider-bg` is `rgba(black, .1)` in light and solid `black` in dark. Over the
	 * menu surface the light value resolves to roughly #E7EAEE, a shade off `--border`'s
	 * #EDF2F9; the dark value is one step darker than `--border`. Using the token keeps the
	 * divider tied to every other hairline in the app rather than to two loose values.
	 */
	const divider = "my-3 bg-border";

	/**
	 * `.dropdown-ellipses` — `font-size: font-size-lg` in `gray-400`, hovering to
	 * `link-hover-color`. `--input` is #D2DDEC exactly; as with the breadcrumb divider,
	 * the reference stylesheet leaves this one alone, so the dark half falls back to the token
	 * that plays the same role there instead of keeping a light-mode grey.
	 */
	const ellipses =
		"text-input transition-colors hover:text-primary dark:text-muted-foreground [&>svg]:size-[1.0625rem]";

	const items = ["Action", "Another action", "Something else here"];

	/* ---------------------------------------------------------------------------------------
	 * The pattern appendix
	 * ------------------------------------------------------------------------------------ */

	/**
	 * Everything below serves the eighteen dropdown-menu demo sections
	 * (demo 1 … demo 18). Three repository-wide substitutions
	 * apply throughout:
	 *
	 * - NO PHOTOGRAPHS. Upstream loads stock portraits and the shadcn GitHub avatar; this
	 *   repository ships no images and fetches none (the ItemPage precedent), so every avatar
	 *   is an `Avatar.Fallback` with initials.
	 * - NO RAW PALETTE COLOURS. The presence dots in demo 14 are
	 *   `bg-green-500` / `bg-amber-500` / `bg-red-500` / `bg-gray-400` upstream; here they are
	 *   the status tokens (success / warning / destructive / muted-foreground).
	 * - NO ICON SIZING CLASSES. Button, item and tab already size any inline svg; upstream's
	 *   scattered `size-4` / `size-3.5` are dropped and only `opacity-60` kept where it was.
	 */

	/** demo 2 — the four `side` values, in the order upstream lists them. */
	const menuSides = [
		{ side: "left", label: "Left" },
		{ side: "top", label: "Top" },
		{ side: "bottom", label: "Bottom" },
		{ side: "right", label: "Right" },
	] as const;

	/** demo 6 — one flag per checkbox, prefixed to keep this script collision-free. */
	let appearanceStatusBar = $state(true);
	let appearanceActivityBar = $state(false);
	let appearancePanel = $state(false);

	/** demo 7. */
	let panelPosition = $state("bottom");

	/**
	 * demo 8. Upstream's state also carries `sms` and `push` flags its menu
	 * never renders; only the email checkbox — the one the demo exercises — is kept.
	 */
	let advancedTheme = $state("light");
	let advancedEmailNotifications = $state(true);

	/**
	 * demo 10. The first two entries draw inline brand SVGs (the path data
	 * below), the third an initials avatar where upstream loads a photograph.
	 */
	const workspaceOptions: { id: string; name: string; plan: string; initials?: string }[] = [
		{ id: "1", name: "Anthropic", plan: "Enterprise" },
		{ id: "2", name: "Claude", plan: "Pro" },
		{ id: "3", name: "Alex Wong", plan: "Team", initials: "AW" },
	];
	let workspaceActiveId = $state(workspaceOptions[1].id);
	const workspaceActive = $derived(
		workspaceOptions.find((w) => w.id === workspaceActiveId) ?? workspaceOptions[0],
	);

	/** demo 11, data unchanged apart from the portraits-to-initials substitution. */
	const notificationFeed = [
		{
			id: "1",
			user: "Sarah",
			initials: "SC",
			action: "commented on",
			target: "Design System v2",
			time: "2 min ago",
			unread: false,
		},
		{
			id: "2",
			user: "James Wilson",
			initials: "JW",
			action: "shared",
			target: "Q4 Report",
			time: "1 hour ago",
			unread: true,
		},
		{
			id: "3",
			user: "Emily Davis",
			initials: "ED",
			action: "invited you to",
			target: "Project Alpha",
			time: "3 hours ago",
			unread: false,
		},
	];

	/** demo 14 — presence ladder on status tokens, see the block comment above. */
	const profileStatuses = [
		{ value: "available", label: "Available", dot: "bg-success" },
		{ value: "away", label: "Away", dot: "bg-warning" },
		{ value: "busy", label: "Busy", dot: "bg-destructive" },
		{ value: "offline", label: "Offline", dot: "bg-muted-foreground" },
	];
	let profileStatus = $state("available");
	let profileThemeTab = $state("light");
	const profileActiveStatus = $derived(
		profileStatuses.find((s) => s.value === profileStatus) ?? profileStatuses[0],
	);

	/**
	 * Brand-mark path data for demo 10 and demo 18, as
	 * inline SVGs. The marks keep their brand fills where they
	 * have one — a logo is content, not theme — with two flattenings: the OpenAI mark drops its
	 * separate white dark-mode twin for a single `fill-current` glyph (currentColor is what the
	 * pair was emulating), and the Gemini mark keeps only its glyph path, upstream's layered
	 * blur-filter rendition being scenery the 16px slot cannot show.
	 */
	const anthropicLogoPath =
		"M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z";
	const claudeLogoPath =
		"m50.228 170.321 50.357-28.257.843-2.463-.843-1.361h-2.462l-8.426-.518-28.775-.778-24.952-1.037-24.175-1.296-6.092-1.297L0 125.796l.583-3.759 5.12-3.434 7.324.648 16.202 1.101 24.304 1.685 17.629 1.037 26.118 2.722h4.148l.583-1.685-1.426-1.037-1.101-1.037-25.147-17.045-27.22-18.017-14.258-10.37-7.713-5.25-3.888-4.925-1.685-10.758 7-7.713 9.397.649 2.398.648 9.527 7.323 20.35 15.75L94.817 91.9l3.889 3.24 1.555-1.102.195-.777-1.75-2.917-14.453-26.118-15.425-26.572-6.87-11.018-1.814-6.61c-.648-2.723-1.102-4.991-1.102-7.778l7.972-10.823L71.42 0 82.05 1.426l4.472 3.888 6.61 15.101 10.694 23.786 16.591 32.34 4.861 9.592 2.592 8.879.973 2.722h1.685v-1.556l1.36-18.211 2.528-22.36 2.463-28.776.843-8.1 4.018-9.722 7.971-5.25 6.222 2.981 5.12 7.324-.713 4.73-3.046 19.768-5.962 30.98-3.889 20.739h2.268l2.593-2.593 10.499-13.934 17.628-22.036 7.778-8.749 9.073-9.657 5.833-4.601h11.018l8.1 12.055-3.628 12.443-11.342 14.388-9.398 12.184-13.48 18.147-8.426 14.518.778 1.166 2.01-.194 30.46-6.481 16.462-2.982 19.637-3.37 8.88 4.148.971 4.213-3.5 8.62-20.998 5.184-24.628 4.926-36.682 8.685-.454.324.519.648 16.526 1.555 7.065.389h17.304l32.21 2.398 8.426 5.574 5.055 6.805-.843 5.184-12.962 6.611-17.498-4.148-40.83-9.721-14-3.5h-1.944v1.167l11.666 11.406 21.387 19.314 26.767 24.887 1.36 6.157-3.434 4.86-3.63-.518-23.526-17.693-9.073-7.972-20.545-17.304h-1.36v1.814l4.73 6.935 25.017 37.59 1.296 11.536-1.814 3.76-6.481 2.268-7.13-1.297-14.647-20.544-15.1-23.138-12.185-20.739-1.49.843-7.194 77.448-3.37 3.953-7.778 2.981-6.48-4.925-3.436-7.972 3.435-15.749 4.148-20.544 3.37-16.333 3.046-20.285 1.815-6.74-.13-.454-1.49.194-15.295 20.999-23.267 31.433-18.406 19.702-4.407 1.75-7.648-3.954.713-7.064 4.277-6.286 25.47-32.405 15.36-20.092 9.917-11.6-.065-1.686h-.583L44.07 198.125l-12.055 1.555-5.185-4.86.648-7.972 2.463-2.593 20.35-13.999-.064.065Z";
	const openAiLogoPath =
		"M239.184 106.203a64.716 64.716 0 0 0-5.576-53.103C219.452 28.459 191 15.784 163.213 21.74A65.586 65.586 0 0 0 52.096 45.22a64.716 64.716 0 0 0-43.23 31.36c-14.31 24.602-11.061 55.634 8.033 76.74a64.665 64.665 0 0 0 5.525 53.102c14.174 24.65 42.644 37.324 70.446 31.36a64.72 64.72 0 0 0 48.754 21.744c28.481.025 53.714-18.361 62.414-45.481a64.767 64.767 0 0 0 43.229-31.36c14.137-24.558 10.875-55.423-8.083-76.483Zm-97.56 136.338a48.397 48.397 0 0 1-31.105-11.255l1.535-.87 51.67-29.825a8.595 8.595 0 0 0 4.247-7.367v-72.85l21.845 12.636c.218.111.37.32.409.563v60.367c-.056 26.818-21.783 48.545-48.601 48.601Zm-104.466-44.61a48.345 48.345 0 0 1-5.781-32.589l1.534.921 51.722 29.826a8.339 8.339 0 0 0 8.441 0l63.181-36.425v25.221a.87.87 0 0 1-.358.665l-52.335 30.184c-23.257 13.398-52.97 5.431-66.404-17.803ZM23.549 85.38a48.499 48.499 0 0 1 25.58-21.333v61.39a8.288 8.288 0 0 0 4.195 7.316l62.874 36.272-21.845 12.636a.819.819 0 0 1-.767 0L41.353 151.53c-23.211-13.454-31.171-43.144-17.804-66.405v.256Zm179.466 41.695-63.08-36.63L161.73 77.86a.819.819 0 0 1 .768 0l52.233 30.184a48.6 48.6 0 0 1-7.316 87.635v-61.391a8.544 8.544 0 0 0-4.4-7.213Zm21.742-32.69-1.535-.922-51.619-30.081a8.39 8.39 0 0 0-8.492 0L99.98 99.808V74.587a.716.716 0 0 1 .307-.665l52.233-30.133a48.652 48.652 0 0 1 72.236 50.391v.205ZM88.061 139.097l-21.845-12.585a.87.87 0 0 1-.41-.614V65.685a48.652 48.652 0 0 1 79.757-37.346l-1.535.87-51.67 29.825a8.595 8.595 0 0 0-4.246 7.367l-.051 72.697Zm11.868-25.58 28.138-16.217 28.188 16.218v32.434l-28.086 16.218-28.188-16.218-.052-32.434Z";
	const geminiLogoPath =
		"M141.201 4.886c2.282-6.17 11.042-6.071 13.184.148l5.985 17.37a184.004 184.004 0 0 0 111.257 113.049l19.304 6.997c6.143 2.227 6.156 10.91.02 13.155l-19.35 7.082a184.001 184.001 0 0 0-109.495 109.385l-7.573 20.629c-2.241 6.105-10.869 6.121-13.133.025l-7.908-21.296a184 184 0 0 0-109.02-108.658l-19.698-7.239c-6.102-2.243-6.118-10.867-.025-13.132l20.083-7.467A183.998 183.998 0 0 0 133.291 26.28l7.91-21.394Z";
</script>

<DocPage title="Dropdown menu">
	{#snippet subtitle()}
		Toggle contextual overlays for displaying lists of links and more. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/dropdown-menu"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content class="flex flex-wrap gap-2">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger
					class={cn(
						buttonVariants(),
						btnBase,
						"gap-2 border-muted-foreground bg-muted-foreground text-primary-foreground hover:border-[color-mix(in_srgb,var(--muted-foreground)_85%,black)] hover:bg-[color-mix(in_srgb,var(--muted-foreground)_85%,black)]",
					)}
				>
					Dropdown button
					<ChevronDownIcon />
				</DropdownMenu.Trigger>
				<DropdownMenu.Content preventScroll={nonModal} class={menu}>
					{#each items as label (label)}
						<DropdownMenu.Item class={item}>{label}</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			<DropdownMenu.Root>
				<DropdownMenu.Trigger
					class={cn(
						buttonVariants(),
						btnBase,
						"gap-2 border-primary bg-primary text-primary-foreground hover:border-[color-mix(in_srgb,var(--primary)_85%,black)] hover:bg-[color-mix(in_srgb,var(--primary)_85%,black)]",
					)}
				>
					Dropdown button
					<ChevronDownIcon />
				</DropdownMenu.Trigger>
				<DropdownMenu.Content preventScroll={nonModal} class={menu}>
					{#each items as label (label)}
						<DropdownMenu.Item class={item}>{label}</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			<!--
				The split button. The classic `.btn-group` joins two buttons by removing the inner
				corners and collapsing the 1px seam between them (`margin-left: -1px`), and
				`.dropdown-toggle-split` narrows the caret half to `btn-padding-x * .75`.
			-->
			<div class="flex">
				<button
					type="button"
					class={cn(
						buttonVariants(),
						btnBase,
						"rounded-r-none border-destructive bg-destructive text-destructive-foreground hover:border-[color-mix(in_srgb,var(--destructive)_85%,black)] hover:bg-[color-mix(in_srgb,var(--destructive)_85%,black)]",
					)}
				>
					Action
				</button>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class={cn(
							buttonVariants(),
							btnBase,
							"-ml-px rounded-l-none border-destructive bg-destructive px-[0.5625rem] text-destructive-foreground hover:border-[color-mix(in_srgb,var(--destructive)_85%,black)] hover:bg-[color-mix(in_srgb,var(--destructive)_85%,black)]",
						)}
					>
						<span class="sr-only">Toggle Dropdown</span>
						<ChevronDownIcon />
					</DropdownMenu.Trigger>
					<DropdownMenu.Content preventScroll={nonModal} class={menu}>
						{#each items as label (label)}
							<DropdownMenu.Item class={item}>{label}</DropdownMenu.Item>
						{/each}
						<DropdownMenu.Separator class={divider} />
						<DropdownMenu.Item class={item}>Separated link</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</Card.Content>
	</Card.Root>

	<DocSection title="Dropdown ellipsis">
		{#snippet blurb()}
			Creates a compact dropdown toggler with an icon.
		{/snippet}
		<Card.Root>
			<Card.Header class="flex items-center justify-between gap-4">
				<Card.Title>Latest orders</Card.Title>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class={ellipses} aria-label="More">
						<EllipsisVerticalIcon />
					</DropdownMenu.Trigger>
					<DropdownMenu.Content preventScroll={nonModal} align="end" class={menu}>
						{#each items as label (label)}
							<DropdownMenu.Item class={item}>{label}</DropdownMenu.Item>
						{/each}
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Card.Header>
		</Card.Root>
	</DocSection>

	<DocSection title="Dropdown card">
		{#snippet blurb()}
			Turns the default dropdown menu into a fully functional card. The height of the body is
			limited and a scrollbar appears once that height is exceeded.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class={cn(
							buttonVariants(),
							btnBase,
							"gap-2 border-primary bg-primary text-primary-foreground hover:border-[color-mix(in_srgb,var(--primary)_85%,black)] hover:bg-[color-mix(in_srgb,var(--primary)_85%,black)]",
						)}
					>
						Card dropdown
						<ChevronDownIcon />
					</DropdownMenu.Trigger>
					<!--
						`.dropdown-menu-card`: `dropdown-card-min-width: 350px`, no vertical padding of
						its own, and a body capped at `dropdown-card-body-max-height: 350px` with
						`overflow-y: auto` and `card-spacer-*` padding. The menu becomes a card, so the
						surface stops being a list and starts being content.

						`w-[350px]`, NOT `w-auto min-w-[350px]`. The classic menu is absolutely positioned
						inside `.dropdown { position: relative }`, so its shrink-to-fit width is capped by
						the trigger's own box and `min-width` is what actually decides — 350px. Ours is
						portaled to `<body>`, where the available width is the viewport, so `w-auto` let a
						single unbroken line of text stretch the menu off the page. The fixed width states
						the value the classic theme resolves to.
					-->
					<DropdownMenu.Content preventScroll={nonModal} class="w-[350px] rounded-md p-0 text-sm">
						<div class="max-h-[350px] overflow-y-auto p-6">
							Lorem ipsum dolor sit amet, consectetur adipisicing elit. Quaerat recusandae rem autem
							impedit ad odio, enim tempore possimus non minus quod dignissimos ipsum eveniet odit,
							ratione molestiae, velit a dolorem!
						</div>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		The sections from here down are the dropdown-menu demo set in
		its documented order. Unlike the sections above they keep the registry
		component's stock look — they document the component as it ships — so none of the
		`menu` / `item` / `divider` constants apply below. `preventScroll={nonModal}` does: the
		one-click-between-menus decision at the top of this file covers every menu on the page.
	-->
	<DocSection title="Basic dropdown menu">
		<Card.Root>
			<Card.Content class="flex justify-center">
				<!-- Demo 1: two groups, a heading label, a disabled item. -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
						Open
					</DropdownMenu.Trigger>
					<DropdownMenu.Content preventScroll={nonModal}>
						<DropdownMenu.Group>
							<DropdownMenu.Label>My Account</DropdownMenu.Label>
							<DropdownMenu.Item>Profile</DropdownMenu.Item>
							<DropdownMenu.Item>Billing</DropdownMenu.Item>
							<DropdownMenu.Item>Settings</DropdownMenu.Item>
						</DropdownMenu.Group>
						<DropdownMenu.Separator />
						<DropdownMenu.Group>
							<DropdownMenu.Item>GitHub</DropdownMenu.Item>
							<DropdownMenu.Item>Support</DropdownMenu.Item>
							<DropdownMenu.Item disabled>API</DropdownMenu.Item>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Dropdown menus opening positions">
		{#snippet blurb()}
			The <code>side</code> prop on the content picks the edge of the trigger the menu opens from.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- Demo 2 — the four `side` values, one trigger each. -->
				<div class="mx-auto grid w-full max-w-xs grid-cols-2 gap-2">
					{#each menuSides as entry (entry.side)}
						<DropdownMenu.Root>
							<DropdownMenu.Trigger class={cn(buttonVariants({ variant: "outline" }), "w-full")}>
								{entry.label}
							</DropdownMenu.Trigger>
							<DropdownMenu.Content preventScroll={nonModal} side={entry.side}>
								<DropdownMenu.Group>
									<DropdownMenu.Item>Profile</DropdownMenu.Item>
									<DropdownMenu.Item>Billing</DropdownMenu.Item>
									<DropdownMenu.Item>Settings</DropdownMenu.Item>
								</DropdownMenu.Group>
							</DropdownMenu.Content>
						</DropdownMenu.Root>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Dropdown menu with icons">
		<Card.Root>
			<Card.Content class="flex justify-center">
				<!--
					Demo 3. The item sizes any inline svg itself, so the
					lucide glyphs carry no classes; `variant="destructive"` on the last item is
					already the vocabulary this component ships.
				-->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
						Options
					</DropdownMenu.Trigger>
					<DropdownMenu.Content preventScroll={nonModal}>
						<DropdownMenu.Group>
							<DropdownMenu.Item>
								<UserIcon />
								Profile
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<CreditCardIcon />
								Billing
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<SettingsIcon />
								Settings
							</DropdownMenu.Item>
						</DropdownMenu.Group>
						<DropdownMenu.Separator />
						<DropdownMenu.Item variant="destructive">
							<LogOutIcon />
							Log out
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Dropdown menu with keyboard shortcuts">
		<Card.Root>
			<Card.Content class="flex justify-center">
				<!-- Demo 4 — `Shortcut` right-aligns itself with `ml-auto`. -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
						Shortcuts
					</DropdownMenu.Trigger>
					<DropdownMenu.Content preventScroll={nonModal} align="start" class="w-40">
						<DropdownMenu.Group>
							<DropdownMenu.Label>My Account</DropdownMenu.Label>
							<DropdownMenu.Item>
								Profile
								<DropdownMenu.Shortcut>⇧⌘P</DropdownMenu.Shortcut>
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								Billing
								<DropdownMenu.Shortcut>⌘B</DropdownMenu.Shortcut>
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								Settings
								<DropdownMenu.Shortcut>⌘S</DropdownMenu.Shortcut>
							</DropdownMenu.Item>
						</DropdownMenu.Group>
						<DropdownMenu.Separator />
						<DropdownMenu.Item>
							Log out
							<DropdownMenu.Shortcut>⇧⌘Q</DropdownMenu.Shortcut>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Dropdown menu with nested submenus">
		<Card.Root>
			<Card.Content class="flex justify-center">
				<!--
					Demo 5. Upstream wraps the sub-content in an explicit
					`DropdownMenuPortal`; bits-ui floats sub-content on its own, so `Sub` +
					`SubTrigger` + `SubContent` is the whole recipe here.
				-->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
						With Submenu
					</DropdownMenu.Trigger>
					<DropdownMenu.Content preventScroll={nonModal} class="w-40">
						<DropdownMenu.Group>
							<DropdownMenu.Item>Team</DropdownMenu.Item>
							<DropdownMenu.Sub>
								<DropdownMenu.SubTrigger>Invite users</DropdownMenu.SubTrigger>
								<DropdownMenu.SubContent class="w-32">
									<DropdownMenu.Item>Email</DropdownMenu.Item>
									<DropdownMenu.Item>Message</DropdownMenu.Item>
									<DropdownMenu.Separator />
									<DropdownMenu.Item>More…</DropdownMenu.Item>
								</DropdownMenu.SubContent>
							</DropdownMenu.Sub>
							<DropdownMenu.Item>
								New Team
								<DropdownMenu.Shortcut>⌘+T</DropdownMenu.Shortcut>
							</DropdownMenu.Item>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Dropdown menu with checkboxes">
		<Card.Root>
			<Card.Content class="flex justify-center">
				<!-- Demo 6 — `bind:checked` is the useState pair upstream. -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
						Checkboxes
					</DropdownMenu.Trigger>
					<DropdownMenu.Content preventScroll={nonModal} class="min-w-40">
						<DropdownMenu.Group>
							<DropdownMenu.Label>Appearance</DropdownMenu.Label>
							<DropdownMenu.CheckboxItem bind:checked={appearanceStatusBar}>
								<LayoutIcon />
								Status Bar
							</DropdownMenu.CheckboxItem>
							<DropdownMenu.CheckboxItem bind:checked={appearanceActivityBar} disabled>
								<ActivityIcon />
								Activity Bar
							</DropdownMenu.CheckboxItem>
							<DropdownMenu.CheckboxItem bind:checked={appearancePanel}>
								<PanelLeftIcon />
								Panel
							</DropdownMenu.CheckboxItem>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Dropdown menu with radio groups">
		<Card.Root>
			<Card.Content class="flex justify-center">
				<!-- Demo 7. -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
						Radio Group
					</DropdownMenu.Trigger>
					<DropdownMenu.Content preventScroll={nonModal}>
						<DropdownMenu.Group>
							<DropdownMenu.Label>Panel Position</DropdownMenu.Label>
							<DropdownMenu.RadioGroup bind:value={panelPosition}>
								<DropdownMenu.RadioItem value="top">
									<ArrowUpIcon />
									Top
								</DropdownMenu.RadioItem>
								<DropdownMenu.RadioItem value="bottom">
									<ArrowDownIcon />
									Bottom
								</DropdownMenu.RadioItem>
								<DropdownMenu.RadioItem value="right" disabled>
									<ArrowRightIcon />
									Right
								</DropdownMenu.RadioItem>
							</DropdownMenu.RadioGroup>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Advanced dropdown menu">
		{#snippet blurb()}
			Every part in one menu: groups, submenus, a radio group, a checkbox and shortcuts.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex justify-center">
				<!-- Demo 8. -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class={cn(buttonVariants({ variant: "outline" }), "w-fit")}>
						Complex Menu
					</DropdownMenu.Trigger>
					<DropdownMenu.Content preventScroll={nonModal} class="w-56">
						<DropdownMenu.Group>
							<DropdownMenu.Label>File</DropdownMenu.Label>
							<DropdownMenu.Item>
								<FileIcon />
								New File
								<DropdownMenu.Shortcut>⌘N</DropdownMenu.Shortcut>
							</DropdownMenu.Item>
							<DropdownMenu.Sub>
								<DropdownMenu.SubTrigger>
									<FolderOpenIcon />
									Open Recent
								</DropdownMenu.SubTrigger>
								<DropdownMenu.SubContent>
									<DropdownMenu.Item>Project Alpha</DropdownMenu.Item>
									<DropdownMenu.Item>Project Beta</DropdownMenu.Item>
									<DropdownMenu.Separator />
									<DropdownMenu.Item>Browse…</DropdownMenu.Item>
								</DropdownMenu.SubContent>
							</DropdownMenu.Sub>
						</DropdownMenu.Group>
						<DropdownMenu.Separator />
						<DropdownMenu.Group>
							<DropdownMenu.Label>Appearance</DropdownMenu.Label>
							<DropdownMenu.Sub>
								<DropdownMenu.SubTrigger>
									<PaletteIcon />
									Theme
								</DropdownMenu.SubTrigger>
								<DropdownMenu.SubContent>
									<DropdownMenu.RadioGroup bind:value={advancedTheme}>
										<DropdownMenu.RadioItem value="light">Light</DropdownMenu.RadioItem>
										<DropdownMenu.RadioItem value="dark">Dark</DropdownMenu.RadioItem>
										<DropdownMenu.RadioItem value="system">System</DropdownMenu.RadioItem>
									</DropdownMenu.RadioGroup>
								</DropdownMenu.SubContent>
							</DropdownMenu.Sub>
							<DropdownMenu.CheckboxItem bind:checked={advancedEmailNotifications}>
								<MailIcon />
								Email Notifications
							</DropdownMenu.CheckboxItem>
						</DropdownMenu.Group>
						<DropdownMenu.Separator />
						<DropdownMenu.Item variant="destructive">
							<TrashIcon />
							Delete
							<DropdownMenu.Shortcut>⌘⌫</DropdownMenu.Shortcut>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="User profile dropdown menu">
		<Card.Root>
			<Card.Content class="flex justify-center">
				<!--
					Demo 9. The stock-photo portrait becomes an initials
					fallback (see the script's block comment), in the trigger and in the label
					alike.
				-->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class={cn(buttonVariants({ variant: "outline" }), "w-52")}>
						<span class="flex items-center gap-1.5">
							<Avatar.Root class="size-5">
								<Avatar.Fallback class="text-[0.5rem]">AJ</Avatar.Fallback>
							</Avatar.Root>
							<span class="text-sm font-medium">Alex Johnson</span>
						</span>
						<ChevronDownIcon data-icon="inline-end" class="ml-auto opacity-60" aria-hidden="true" />
					</DropdownMenu.Trigger>
					<DropdownMenu.Content preventScroll={nonModal} class="w-56" align="end" sideOffset={8}>
						<DropdownMenu.Group>
							<DropdownMenu.Label class="flex items-center gap-2 py-2">
								<Avatar.Root class="size-8">
									<Avatar.Fallback>AJ</Avatar.Fallback>
								</Avatar.Root>
								<span class="flex flex-col">
									<span class="text-sm font-medium text-foreground">Alex Johnson</span>
									<span class="text-xs font-normal text-muted-foreground">alex@example.com</span>
								</span>
							</DropdownMenu.Label>
							<DropdownMenu.Separator />
							<DropdownMenu.Group>
								<DropdownMenu.Item>
									<UserIcon />
									Profile
									<DropdownMenu.Shortcut>⇧⌘P</DropdownMenu.Shortcut>
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<CreditCardIcon />
									Billing
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<SettingsIcon />
									Settings
									<DropdownMenu.Shortcut>⌘S</DropdownMenu.Shortcut>
								</DropdownMenu.Item>
							</DropdownMenu.Group>
							<DropdownMenu.Separator />
							<DropdownMenu.Group>
								<DropdownMenu.Item>
									<UsersIcon />
									Team
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<PlusIcon />
									Invite Members
								</DropdownMenu.Item>
							</DropdownMenu.Group>
							<DropdownMenu.Separator />
							<DropdownMenu.Group>
								<DropdownMenu.Item>
									<LifeBuoyIcon />
									Support
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<BookOpenIcon />
									Documentation
								</DropdownMenu.Item>
							</DropdownMenu.Group>
							<DropdownMenu.Separator />
							<DropdownMenu.Item variant="destructive">
								<LogOutIcon />
								Log out
								<DropdownMenu.Shortcut>⇧⌘Q</DropdownMenu.Shortcut>
							</DropdownMenu.Item>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Workspace switcher dropdown menu">
		<Card.Root>
			<Card.Content>
				<!--
					Demo 10. The `workspaceLogo` snippet is declared inside
					this wrapper so both the trigger and the menu items can render the same mark —
					the Anthropic glyph in `fill-current`, the Claude glyph in its brand fill, and
					an initials avatar where upstream loads a photograph.
				-->
				<div class="flex justify-center">
					{#snippet workspaceLogo(workspace: (typeof workspaceOptions)[number])}
						{#if workspace.id === "1"}
							<svg viewBox="0 0 24 24" fill-rule="evenodd" class="size-4 shrink-0 fill-current">
								<path d={anthropicLogoPath} />
							</svg>
						{:else if workspace.id === "2"}
							<svg viewBox="0 0 256 257" preserveAspectRatio="xMidYMid" class="size-4 shrink-0">
								<path fill="#D97757" d={claudeLogoPath} />
							</svg>
						{:else}
							<Avatar.Root class="size-5 rounded-md">
								<Avatar.Fallback class="text-[10px]">
									{workspace.initials}
								</Avatar.Fallback>
							</Avatar.Root>
						{/if}
					{/snippet}
					<DropdownMenu.Root>
						<DropdownMenu.Trigger class={cn(buttonVariants({ variant: "outline" }), "w-52")}>
							<span class="flex items-center gap-1.5">
								{@render workspaceLogo(workspaceActive)}
								<span class="text-sm font-medium">{workspaceActive.name}</span>
							</span>
							<ChevronsUpDownIcon
								data-icon="inline-end"
								class="ml-auto opacity-60"
								aria-hidden="true"
							/>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content
							preventScroll={nonModal}
							class="w-56"
							align="start"
							sideOffset={8}
						>
							<DropdownMenu.Group>
								<DropdownMenu.Label>Workspaces</DropdownMenu.Label>
								{#each workspaceOptions as workspace (workspace.id)}
									<DropdownMenu.Item
										class="gap-3"
										onSelect={() => (workspaceActiveId = workspace.id)}
									>
										{@render workspaceLogo(workspace)}
										<span class="flex flex-1 flex-col">
											<span class="text-sm font-medium">{workspace.name}</span>
											<span class="text-xs text-muted-foreground">{workspace.plan}</span>
										</span>
										{#if workspaceActiveId === workspace.id}
											<CheckIcon class="text-primary" aria-hidden="true" />
										{/if}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Group>
							<DropdownMenu.Separator />
							<DropdownMenu.Group>
								<DropdownMenu.Item>
									<PlusIcon />
									Create Workspace
								</DropdownMenu.Item>
								<DropdownMenu.Item>
									<SettingsIcon />
									Manage Workspaces
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Notifications dropdown menu">
		<Card.Root>
			<Card.Content class="flex justify-center">
				<!--
					Demo 11. The counter drops upstream's `size="sm"` — this
					Badge has no size ramp — and states the small pill as layout (`h-4 px-1`)
					instead.
				-->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class={cn(buttonVariants({ variant: "outline", size: "icon" }), "relative")}
						aria-label="Notifications"
					>
						<BellIcon aria-hidden="true" />
						<Badge
							variant="destructive"
							class="absolute -top-1.5 -right-2 h-4 rounded-full px-1"
							aria-hidden="true"
						>
							8
						</Badge>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content preventScroll={nonModal} class="w-80" align="end" sideOffset={8}>
						<DropdownMenu.Group>
							<DropdownMenu.Label class="flex items-center justify-between">
								<span>Notifications</span>
								<button
									type="button"
									class="text-xs font-normal text-foreground underline-offset-2 hover:underline"
								>
									Mark all as read
								</button>
							</DropdownMenu.Label>
							<DropdownMenu.Separator />
							<DropdownMenu.Group>
								{#each notificationFeed as notification (notification.id)}
									<DropdownMenu.Item class="flex items-start gap-2 py-1">
										<Avatar.Root class="mt-0.5 size-6 shrink-0">
											<Avatar.Fallback class="text-[0.5rem]">
												{notification.initials}
											</Avatar.Fallback>
										</Avatar.Root>
										<span class="flex flex-1 flex-col gap-px">
											<span class="leading-snug">
												<span class="font-medium">{notification.user}</span>
												<span class="text-muted-foreground">{notification.action}</span>
												<span class="font-medium">{notification.target}</span>
											</span>
											<span class="text-muted-foreground">{notification.time}</span>
										</span>
										{#if notification.unread}
											<span class="mt-2 size-1.5 shrink-0 rounded-full bg-primary"></span>
										{/if}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Group>
							<DropdownMenu.Separator />
							<DropdownMenu.Item class="justify-center">View all notifications</DropdownMenu.Item>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Actions dropdown menu">
		<Card.Root>
			<Card.Content class="flex justify-center">
				<!-- Demo 12 — the ellipsis row menu with a "Move to" submenu. -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class={buttonVariants({ variant: "outline", size: "icon" })}
						aria-label="Actions"
					>
						<EllipsisVerticalIcon aria-hidden="true" />
					</DropdownMenu.Trigger>
					<DropdownMenu.Content preventScroll={nonModal} class="w-48" align="end">
						<DropdownMenu.Group>
							<DropdownMenu.Label>Actions</DropdownMenu.Label>
							<DropdownMenu.Item>
								<PencilIcon />
								Edit
								<DropdownMenu.Shortcut>⌘E</DropdownMenu.Shortcut>
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<CopyIcon />
								Duplicate
								<DropdownMenu.Shortcut>⌘D</DropdownMenu.Shortcut>
							</DropdownMenu.Item>
							<DropdownMenu.Sub>
								<DropdownMenu.SubTrigger>
									<ArrowRightIcon />
									Move to
								</DropdownMenu.SubTrigger>
								<DropdownMenu.SubContent>
									<DropdownMenu.Item>
										<FolderIcon />
										Projects
									</DropdownMenu.Item>
									<DropdownMenu.Item>
										<ArchiveIcon />
										Archive
									</DropdownMenu.Item>
									<DropdownMenu.Item>
										<StarIcon />
										Favorites
									</DropdownMenu.Item>
								</DropdownMenu.SubContent>
							</DropdownMenu.Sub>
						</DropdownMenu.Group>
						<DropdownMenu.Separator />
						<DropdownMenu.Group>
							<DropdownMenu.Item>
								<Share2Icon />
								Share
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<LinkIcon />
								Copy Link
							</DropdownMenu.Item>
						</DropdownMenu.Group>
						<DropdownMenu.Separator />
						<DropdownMenu.Item variant="destructive">
							<TrashIcon />
							Delete
							<DropdownMenu.Shortcut>⌘⌫</DropdownMenu.Shortcut>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Share and export dropdown menu">
		<Card.Root>
			<Card.Content class="flex justify-center">
				<!-- Demo 13 — two labelled groups plus a lone Print item. -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class={cn(buttonVariants({ variant: "outline" }), "w-fit gap-2")}>
						<Share2Icon data-icon="inline-start" aria-hidden="true" />
						Share
					</DropdownMenu.Trigger>
					<DropdownMenu.Content preventScroll={nonModal} class="w-48" align="start">
						<DropdownMenu.Group>
							<DropdownMenu.Label>Share via</DropdownMenu.Label>
							<DropdownMenu.Item>
								<MailIcon />
								Email
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<MessageCircleIcon />
								Message
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<LinkIcon />
								Copy Link
							</DropdownMenu.Item>
						</DropdownMenu.Group>
						<DropdownMenu.Separator />
						<DropdownMenu.Group>
							<DropdownMenu.Label>Export as</DropdownMenu.Label>
							<DropdownMenu.Item>
								<FileTextIcon />
								PDF
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<FileSpreadsheetIcon />
								CSV
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<ImageIcon />
								PNG
							</DropdownMenu.Item>
						</DropdownMenu.Group>
						<DropdownMenu.Separator />
						<DropdownMenu.Item>
							<PrinterIcon />
							Print
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="User profile dropdown menu with theme toggle and status selector">
		{#snippet blurb()}
			A menu that mixes non-menu content in: a header block, a <code>Tabs</code> theme toggle, and counters
			that keep the menu open when clicked.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex justify-center">
				<!--
					Demo 14. Two translations beyond the standing
					substitutions: upstream keeps its counter rows open with
					`onSelect={(e) => e.preventDefault()}`, which is bits-ui's `closeOnSelect`
					prop; and the Badge counters drop `size="sm"` (no size ramp here).
				-->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger class={cn(buttonVariants({ variant: "outline" }), "w-40")}>
						<Avatar.Root class="size-4">
							<Avatar.Fallback class="text-[0.5rem]">CN</Avatar.Fallback>
						</Avatar.Root>
						<span class="text-sm font-medium">shadcn</span>
						<ChevronsUpDownIcon
							data-icon="inline-end"
							class="ml-auto opacity-60"
							aria-hidden="true"
						/>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content preventScroll={nonModal} class="w-60" align="start" sideOffset={8}>
						<div class="flex items-center gap-3 px-1 pt-1.5">
							<Avatar.Root class="size-8">
								<Avatar.Fallback>CN</Avatar.Fallback>
							</Avatar.Root>
							<div class="flex flex-col">
								<span class="text-sm font-medium text-foreground">shadcn</span>
								<span class="text-xs text-muted-foreground">ui@shadcn.com</span>
							</div>
						</div>
						<div class="py-2.5">
							<Tabs.Root bind:value={profileThemeTab}>
								<Tabs.List class="w-full">
									<Tabs.Trigger value="light" class="h-6 flex-1" aria-label="Light theme">
										<SunIcon aria-hidden="true" />
									</Tabs.Trigger>
									<Tabs.Trigger value="dark" class="h-6 flex-1" aria-label="Dark theme">
										<MoonIcon aria-hidden="true" />
									</Tabs.Trigger>
									<Tabs.Trigger value="system" class="h-6 flex-1" aria-label="System theme">
										<MonitorIcon aria-hidden="true" />
									</Tabs.Trigger>
								</Tabs.List>
							</Tabs.Root>
						</div>
						<DropdownMenu.Group>
							<DropdownMenu.Item closeOnSelect={false} class="justify-between">
								<span class="flex items-center gap-2">
									<BuildingIcon aria-hidden="true" />
									Your Companies
								</span>
								<Badge variant="secondary" class="rounded-full px-1.5">12</Badge>
							</DropdownMenu.Item>
							<DropdownMenu.Item closeOnSelect={false} class="justify-between">
								<span class="flex items-center gap-2">
									<PhoneIcon aria-hidden="true" />
									Your Numbers
								</span>
								<Badge variant="secondary" class="rounded-full px-1.5">2</Badge>
							</DropdownMenu.Item>
						</DropdownMenu.Group>
						<DropdownMenu.Sub>
							<DropdownMenu.SubTrigger>
								<span class="flex items-center gap-2">
									<span class={cn("size-2 rounded-full", profileActiveStatus.dot)}></span>
									{profileActiveStatus.label}
								</span>
							</DropdownMenu.SubTrigger>
							<DropdownMenu.SubContent class="w-40">
								{#each profileStatuses as s (s.value)}
									<DropdownMenu.Item
										onSelect={() => (profileStatus = s.value)}
										class="justify-between"
									>
										<span class="flex items-center gap-2">
											<span class={cn("size-2 rounded-full", s.dot)}></span>
											{s.label}
										</span>
										{#if profileStatus === s.value}
											<CheckIcon class="text-muted-foreground" aria-hidden="true" />
										{/if}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.SubContent>
						</DropdownMenu.Sub>
						<DropdownMenu.Separator />
						<DropdownMenu.Group>
							<DropdownMenu.Item>
								<SettingsIcon />
								Settings
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<LifeBuoyIcon />
								Help Center
							</DropdownMenu.Item>
						</DropdownMenu.Group>
						<DropdownMenu.Separator />
						<DropdownMenu.Item variant="destructive">
							<LogOutIcon />
							Logout
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="User and create menu">
		{#snippet blurb()}
			The right end of an app bar: a create menu on a button, a hairline, and a user menu on a bare
			avatar.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Demo 15. The second trigger is the avatar itself — no
					button chrome, just a rounded focus ring on the trigger element.
				-->
				<div class="flex shrink-0 items-center justify-center gap-2">
					<DropdownMenu.Root>
						<DropdownMenu.Trigger class={buttonVariants({ size: "sm" })}>
							<PlusIcon data-icon="inline-start" aria-hidden="true" />
							New
						</DropdownMenu.Trigger>
						<DropdownMenu.Content preventScroll={nonModal} align="end" class="w-40" sideOffset={12}>
							<DropdownMenu.Group>
								<DropdownMenu.Label>Create</DropdownMenu.Label>
								<DropdownMenu.Group>
									<DropdownMenu.Item>
										<UserPlusIcon class="opacity-60" />
										New Customer
									</DropdownMenu.Item>
									<DropdownMenu.Item>
										<ShoppingCartIcon class="opacity-60" />
										New Order
									</DropdownMenu.Item>
									<DropdownMenu.Item>
										<FileTextIcon class="opacity-60" />
										New Invoice
									</DropdownMenu.Item>
								</DropdownMenu.Group>
								<DropdownMenu.Separator />
								<DropdownMenu.Item>
									<UploadIcon class="opacity-60" />
									Import Data
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>

					<Separator orientation="vertical" class="my-auto h-4" />

					<DropdownMenu.Root>
						<DropdownMenu.Trigger
							class="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
							aria-label="Account"
						>
							<Avatar.Root class="size-6">
								<Avatar.Fallback class="text-[0.5rem]">AJ</Avatar.Fallback>
							</Avatar.Root>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content preventScroll={nonModal} align="end" sideOffset={12} class="w-56">
							<DropdownMenu.Group>
								<DropdownMenu.Label>
									<span class="flex flex-col">
										<span class="text-sm text-foreground">Alex Johnson</span>
										<span class="text-xs text-muted-foreground">alex@example.com</span>
									</span>
								</DropdownMenu.Label>
								<DropdownMenu.Separator />
								<DropdownMenu.Group>
									<DropdownMenu.Item>
										<UserIcon class="opacity-60" />
										Profile
									</DropdownMenu.Item>
									<DropdownMenu.Item>
										<CreditCardIcon class="opacity-60" />
										Billing
									</DropdownMenu.Item>
									<DropdownMenu.Item>
										<SettingsIcon class="opacity-60" />
										Settings
									</DropdownMenu.Item>
								</DropdownMenu.Group>
								<DropdownMenu.Separator />
								<DropdownMenu.Item variant="destructive">
									<LogOutIcon />
									Sign out
								</DropdownMenu.Item>
							</DropdownMenu.Group>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Quick action menu">
		<Card.Root>
			<Card.Content class="flex justify-center">
				<!-- Demo 16 — the three-dot ghost trigger. -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class={cn(buttonVariants({ variant: "ghost", size: "icon" }), "-me-1.5")}
						aria-label="More options"
					>
						<EllipsisIcon aria-hidden="true" />
					</DropdownMenu.Trigger>
					<DropdownMenu.Content preventScroll={nonModal} align="start" class="w-36">
						<DropdownMenu.Group>
							<DropdownMenu.Item>
								<SettingsIcon />
								Settings
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<Share2Icon />
								Share
							</DropdownMenu.Item>
							<DropdownMenu.Separator />
							<DropdownMenu.Item variant="destructive">
								<TrashIcon />
								Remove
							</DropdownMenu.Item>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Notifications dropdown with items">
		<Card.Root>
			<Card.Content class="flex justify-center">
				<!-- Demo 17 — plain rows, a check marking the read one. -->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class={buttonVariants({ variant: "ghost", size: "icon" })}
						aria-label="Notifications"
					>
						<BellIcon aria-hidden="true" />
					</DropdownMenu.Trigger>
					<DropdownMenu.Content preventScroll={nonModal} align="start" class="w-56">
						<DropdownMenu.Group>
							<DropdownMenu.Label>Notifications</DropdownMenu.Label>
							<DropdownMenu.Item>
								<span class="flex-1">New message from Alex</span>
								<CheckIcon aria-hidden="true" />
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<span class="flex-1">Document approved</span>
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<span class="flex-1">Pipeline stage updated</span>
							</DropdownMenu.Item>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="AI model selector with provider icons">
		<Card.Root>
			<Card.Content class="flex justify-center">
				<!--
					Demo 18. Upstream ships four brand SVG components
					(openai + a white dark-mode twin, claudeAiIcon, gemini); the path constants in
					the script carry them, with the flattenings the script comment records.
				-->
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-36")}
					>
						Select model
						<ChevronDownIcon data-icon="inline-end" class="ml-auto" aria-hidden="true" />
					</DropdownMenu.Trigger>
					<DropdownMenu.Content preventScroll={nonModal} align="start" class="w-56">
						<DropdownMenu.Group>
							<DropdownMenu.Label>Model</DropdownMenu.Label>
							<DropdownMenu.Item>
								<svg
									viewBox="0 0 256 260"
									preserveAspectRatio="xMidYMid"
									class="size-4 shrink-0 fill-current"
									aria-hidden="true"
								>
									<path d={openAiLogoPath} />
								</svg>
								<span>GPT-5.4</span>
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<svg
									viewBox="0 0 256 257"
									preserveAspectRatio="xMidYMid"
									class="size-4 shrink-0"
									aria-hidden="true"
								>
									<path fill="#D97757" d={claudeLogoPath} />
								</svg>
								<span>Claude 4.6 Opus</span>
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<svg viewBox="0 0 296 298" class="size-4 shrink-0" aria-hidden="true">
									<path fill="#3186FF" d={geminiLogoPath} />
								</svg>
								<span>Gemini 3.1 Pro</span>
							</DropdownMenu.Item>
						</DropdownMenu.Group>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
