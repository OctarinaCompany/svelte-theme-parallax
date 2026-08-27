<script lang="ts">
	import BracesIcon from "@lucide/svelte/icons/braces";
	import FileCodeIcon from "@lucide/svelte/icons/file-code";
	import FileIcon from "@lucide/svelte/icons/file";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import FolderIcon from "@lucide/svelte/icons/folder";
	import FolderOpenIcon from "@lucide/svelte/icons/folder-open";
	import PaletteIcon from "@lucide/svelte/icons/palette";
	import { SvelteSet } from "svelte/reactivity";

	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Tree from "$lib/components/ui/tree/index.js";
	import { Checkbox } from "$lib/components/ui/checkbox/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { TreeState } from "$lib/components/ui/tree/index.js";
	import { getInitials } from "$lib/shared/get-initials.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Tree component page — its seven examples in the order that page gives them.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. Its navigation is a flat sidebar with one level of collapse; a
	 * roving-focus, multi-level, keyboard-navigable tree exists nowhere in the theme, so the
	 * component and this page were built together.
	 *
	 * Upstream every demo calls `useTree` from `@headless-tree/react` with the
	 * `syncDataLoaderFeature` and `hotkeysCoreFeature` features. Here that store is the runes-based
	 * `TreeState` from `$lib/components/ui/tree/`, constructed at exactly the same place — one
	 * instance per demo, since expansion, selection and focus are per-view state. `TreeState` has no
	 * `indent` option: the indent is a presentation concern and lives on `<Tree.Root indent>`, which
	 * publishes it as `--tree-indent` for the guide-line backgrounds below to read.
	 *
	 * THREE STANDING REPOSITORY RULES apply:
	 *
	 * 1. NO RAW PALETTE COLOURS. The file-explorer demo paints its type icons
	 *    `text-amber-500`, `text-blue-500`, `text-purple-500` and `text-yellow-500`. The glyphs
	 *    themselves already carry the type; all of them take `--muted-foreground` here, like every
	 *    other leading icon in this repository.
	 *
	 * 2. NO PHOTOGRAPHS. The org-chart demo loads eleven stock portraits. This
	 *    repository fetches no images at runtime, so the avatars are initials, produced by the
	 *    shared `getInitials` helper — the same substitution the Filters and Card pages make.
	 *
	 * 3. NO SIZE OVERRIDES ON CONTROLS. demo 7 shrinks its checkboxes to `size-3.5`; the
	 *    house Checkbox is registry-tier and keeps its `size-4`, which is also the size of the
	 *    label's own icons, so the rows line up without the override.
	 */

	type CrmItem = {
		name: string;
		children?: string[];
	};

	/** The CRM fixture shared by demo 1 through demo 4, verbatim. */
	const crmItems: Record<string, CrmItem> = {
		crm: { name: "CRM", children: ["leads", "accounts", "activities", "support"] },
		leads: { name: "Leads", children: ["new-lead", "contacted-lead", "qualified-lead"] },
		"new-lead": { name: "New Lead" },
		"contacted-lead": { name: "Contacted Lead" },
		"qualified-lead": { name: "Qualified Lead" },
		accounts: { name: "Accounts", children: ["acme-corp", "globex-inc"] },
		"acme-corp": { name: "Acme Corp", children: ["acme-contacts", "acme-opportunities"] },
		"acme-contacts": { name: "Contacts", children: ["john-smith", "jane-doe"] },
		"john-smith": { name: "John Smith" },
		"jane-doe": { name: "Jane Doe" },
		"acme-opportunities": {
			name: "Opportunities",
			children: ["website-redesign", "annual-maintenance"],
		},
		"website-redesign": { name: "Website Redesign" },
		"annual-maintenance": { name: "Annual Maintenance" },
		"globex-inc": { name: "Globex Inc", children: ["globex-contacts", "globex-opportunities"] },
		"globex-contacts": { name: "Contacts", children: ["alice-johnson"] },
		"alice-johnson": { name: "Alice Johnson" },
		"globex-opportunities": { name: "Opportunities", children: ["cloud-migration"] },
		"cloud-migration": { name: "Cloud Migration" },
		activities: { name: "Activities", children: ["calls", "meetings", "emails"] },
		calls: { name: "Calls" },
		meetings: { name: "Meetings" },
		emails: { name: "Emails" },
		support: { name: "Support", children: ["open-tickets", "closed-tickets"] },
		"open-tickets": { name: "Open Tickets" },
		"closed-tickets": { name: "Closed Tickets" },
	};

	/**
	 * The four CRM demos differ only in chrome, so they share one factory — but never one
	 * instance: expansion and selection are per-tree state, and a shared instance would make the
	 * four examples move together.
	 */
	function createCrmTree(): TreeState<CrmItem> {
		return new TreeState<CrmItem>({
			rootItemId: "crm",
			initialState: { expandedItems: ["leads", "accounts", "activities"] },
			getItemName: (item) => item.getItemData().name,
			isItemFolder: (item) => (item.getItemData().children?.length ?? 0) > 0,
			dataLoader: {
				getItem: (itemId) => crmItems[itemId]!,
				getChildren: (itemId) => crmItems[itemId]?.children ?? [],
			},
		});
	}

	const basicTree = createCrmTree();
	const linesTree = createCrmTree();
	const chevronIconTree = createCrmTree();
	const plusMinusIconTree = createCrmTree();

	/**
	 * The guide-line background from demo 2:98 — a repeating gradient one pixel wide at every
	 * `--tree-indent` step, painted in `--border` so the rails sit at the same weight as every
	 * other divider on the page.
	 */
	const treeLines =
		"relative before:absolute before:inset-0 before:-ms-1 before:bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)))]";

	/**
	 * The same rails shifted a further quarter pixel-step for the plus/minus variant, whose
	 * square toggles sit wider than the chevrons.
	 */
	const treeLinesWide = treeLines.replace("before:-ms-1", "before:-ms-1.25");

	/**
	 * Labels in the guided demos knock a background out behind themselves so the rails do not run
	 * through the text.
	 *
	 * `--card`, not the `--background` upstream uses: the knock-out has to match the surface it is
	 * cut out of, and every tree on this page sits inside a `Card.Content`. Painting the page
	 * ground here would hide the rails and leave a darker rectangle behind each label instead —
	 * which is the same assumption `tree-item-label.svelte` had to drop.
	 */
	const labelOverRails =
		"before:bg-card relative before:absolute before:inset-x-0 before:-inset-y-0.5 before:-z-10";

	type FileItem = {
		name: string;
		children?: string[];
		type?: "folder" | "ts" | "tsx" | "css" | "json" | "md" | "config";
	};

	const fileItems: Record<string, FileItem> = {
		root: { name: "my-project", children: ["src", "public", "package-json", "readme", "tsconfig"] },
		src: { name: "src", children: ["app", "components", "lib", "globals-css"], type: "folder" },
		app: { name: "app", children: ["page-tsx", "layout-tsx", "loading-tsx"], type: "folder" },
		"page-tsx": { name: "page.tsx", type: "tsx" },
		"layout-tsx": { name: "layout.tsx", type: "tsx" },
		"loading-tsx": { name: "loading.tsx", type: "tsx" },
		components: {
			name: "components",
			children: ["button-tsx", "card-tsx", "dialog-tsx"],
			type: "folder",
		},
		"button-tsx": { name: "button.tsx", type: "tsx" },
		"card-tsx": { name: "card.tsx", type: "tsx" },
		"dialog-tsx": { name: "dialog.tsx", type: "tsx" },
		lib: { name: "lib", children: ["utils-ts", "api-ts"], type: "folder" },
		"utils-ts": { name: "utils.ts", type: "ts" },
		"api-ts": { name: "api.ts", type: "ts" },
		"globals-css": { name: "globals.css", type: "css" },
		public: { name: "public", children: ["favicon"], type: "folder" },
		favicon: { name: "favicon.ico", type: "config" },
		"package-json": { name: "package.json", type: "json" },
		readme: { name: "README.md", type: "md" },
		tsconfig: { name: "tsconfig.json", type: "json" },
	};

	const fileTree = new TreeState<FileItem>({
		rootItemId: "root",
		initialState: { expandedItems: ["src", "app", "components"] },
		getItemName: (item) => item.getItemData().name,
		isItemFolder: (item) => (item.getItemData().children?.length ?? 0) > 0,
		dataLoader: {
			getItem: (itemId) => fileItems[itemId]!,
			getChildren: (itemId) => fileItems[itemId]?.children ?? [],
		},
	});

	type OrgItem = {
		name: string;
		role?: string;
		children?: string[];
	};

	const orgItems: Record<string, OrgItem> = {
		company: { name: "Acme Inc.", children: ["ceo"] },
		ceo: { name: "Sarah Chen", role: "CEO", children: ["cto", "coo", "cfo"] },
		cto: { name: "Alex Johnson", role: "CTO", children: ["eng-lead", "design-lead"] },
		coo: { name: "Emma Wilson", role: "COO", children: ["ops-mgr", "hr-mgr"] },
		cfo: { name: "David Kim", role: "CFO", children: ["finance-mgr"] },
		"eng-lead": {
			name: "Michael Rodriguez",
			role: "Engineering Lead",
			children: ["dev-1", "dev-2"],
		},
		"design-lead": { name: "Lisa Park", role: "Design Lead" },
		"ops-mgr": { name: "James Brown", role: "Operations Manager" },
		"hr-mgr": { name: "Amy Taylor", role: "HR Manager" },
		"finance-mgr": { name: "Robert Davis", role: "Finance Manager" },
		"dev-1": { name: "Tom Harris", role: "Senior Developer" },
		"dev-2": { name: "Nina Patel", role: "Developer" },
	};

	const orgTree = new TreeState<OrgItem>({
		rootItemId: "company",
		initialState: { expandedItems: ["ceo", "cto"] },
		getItemName: (item) => item.getItemData().name,
		isItemFolder: (item) => (item.getItemData().children?.length ?? 0) > 0,
		dataLoader: {
			getItem: (itemId) => orgItems[itemId]!,
			getChildren: (itemId) => orgItems[itemId]?.children ?? [],
		},
	});

	type PermissionItem = {
		name: string;
		children?: string[];
	};

	const permissionItems: Record<string, PermissionItem> = {
		permissions: { name: "All Permissions", children: ["users", "content", "billing", "api"] },
		users: {
			name: "User Management",
			children: ["users-view", "users-create", "users-edit", "users-delete"],
		},
		"users-view": { name: "View users" },
		"users-create": { name: "Create users" },
		"users-edit": { name: "Edit users" },
		"users-delete": { name: "Delete users" },
		content: {
			name: "Content Management",
			children: ["content-view", "content-publish", "content-delete"],
		},
		"content-view": { name: "View content" },
		"content-publish": { name: "Publish content" },
		"content-delete": { name: "Delete content" },
		billing: { name: "Billing", children: ["billing-view", "billing-manage"] },
		"billing-view": { name: "View invoices" },
		"billing-manage": { name: "Manage subscriptions" },
		api: { name: "API Access", children: ["api-read", "api-write"] },
		"api-read": { name: "Read access" },
		"api-write": { name: "Write access" },
	};

	const permissionsTree = new TreeState<PermissionItem>({
		rootItemId: "permissions",
		initialState: { expandedItems: ["users", "content"] },
		getItemName: (item) => item.getItemData().name,
		isItemFolder: (item) => (item.getItemData().children?.length ?? 0) > 0,
		dataLoader: {
			getItem: (itemId) => permissionItems[itemId]!,
			getChildren: (itemId) => permissionItems[itemId]?.children ?? [],
		},
	});

	/** `useState<Set<string>>` in demo 7:50; a `SvelteSet` here, so membership is reactive. */
	const permissionsChecked = new SvelteSet([
		"users-view",
		"content-view",
		"content-publish",
		"billing-view",
		"api-read",
	]);

	function togglePermission(id: string): void {
		if (permissionsChecked.has(id)) permissionsChecked.delete(id);
		else permissionsChecked.add(id);
	}

	/**
	 * `<Tree.Item>` registers its own element for keyboard focus, but only when it renders its
	 * default `<button>`; a row rendered through `child` leaves `ref` null and hands the caller a
	 * `register` callback instead. This action is where the permissions rows call it, so Up/Down
	 * still land on them.
	 */
	function registerTreeItem(node: HTMLElement, register: (element: HTMLElement) => () => void) {
		const unregister = register(node);
		return { destroy: unregister };
	}
	type PropRow = { prop: string; type: string; default: string; description: string };

	const rootProps: PropRow[] = [
		{
			prop: "tree",
			type: "TreeState<T>",
			default: "—",
			description:
				"The state this view renders. It is only published on the root context: `Tree.Item` reaches its state through `item.getTree()`, so omitting it changes nothing rendered — the demos pass it for parity with upstream.",
		},
		{
			prop: "indent",
			type: "number",
			default: "20",
			description:
				"Pixels of start padding added per depth level. Published on the root as `--tree-indent`; each `Tree.Item` multiplies it by its level into its own `--tree-padding`, so top-level rows get none.",
		},
		{
			prop: "toggleIconType",
			type: "'chevron' | 'plus-minus'",
			default: "'chevron'",
			description:
				"Which affordance the default `Tree.ItemLabel` draws before a folder name: a chevron that rotates closed off the row’s `aria-expanded`, or a plus/minus glyph swapped on expansion. Leaves draw neither, and a label rendered through `child` draws nothing.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered `<div>`. Stays `null` in `child` mode.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged after the root’s own `flex flex-col`, so caller utilities win.",
		},
		{
			prop: "style",
			type: "string | null",
			default: "—",
			description:
				"Appended after the `--tree-indent` declaration, so a caller value of that variable overrides the `indent` prop for the guide rails without changing the rows’ padding.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: TreeChildProps }]>",
			default: "—",
			description:
				'Render the root onto your own element. `props` carries `data-slot`, `role="tree"`, `aria-multiselectable`, the merged `style` and `class`, and every rest attribute. In `child` mode `children` is not rendered and `ref` stays `null`.',
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"The rows — normally an `{#each}` over `tree.getItems()` rendering one `Tree.Item` per instance. Not rendered in `child` mode.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description:
				"Spread onto the element before `style` and `class`, so a caller can override `role` or `aria-multiselectable` but not the two merged attributes.",
		},
	];

	const itemProps: PropRow[] = [
		{
			prop: "item",
			type: "TreeItemInstance<T>",
			default: "—",
			description:
				"The row to render, from `tree.getItems()` or `tree.getItemInstance(id)`. Every varying attribute — `aria-expanded`/`selected`, `aria-level`/`posinset`/`setsize`, indent, tab stop, the `data-*` flags — is read off it, and it is published downward, through a live getter, to the `Tree.ItemLabel` this row encloses.",
		},
		{
			prop: "ref",
			type: "HTMLButtonElement | null",
			default: "null",
			description:
				"Bindable reference to the rendered `<button>`. While set, the element is registered with the tree’s focus registry so keyboard moves can land on it. Stays `null` in `child` mode.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Merged after the row’s own classes: `ps-(--tree-padding)`, the focus `z-20`, and the `data-[disabled]` dimming.",
		},
		{
			prop: "style",
			type: "string | null",
			default: "—",
			description:
				"Appended after the `--tree-padding` declaration, so a caller value of that variable wins over the computed indent.",
		},
		{
			prop: "onclick",
			type: "MouseEventHandler<HTMLButtonElement>",
			default: "—",
			description:
				"Runs after the tree’s own click handling — focus, plain select and folder toggle, Ctrl/Cmd toggle, Shift range — and cannot cancel it. Enter and Space arrive here as the native button click.",
		},
		{
			prop: "onkeydown",
			type: "KeyboardEventHandler<HTMLButtonElement>",
			default: "—",
			description:
				"Runs after the tree’s Up/Down/Home/End/Left/Right navigation, which has already called `preventDefault()` on any key it handled. Right on a leaf, and every other key, reach it untouched.",
		},
		{
			prop: "onfocus",
			type: "FocusEventHandler<HTMLButtonElement>",
			default: "—",
			description:
				"Runs after the row has recorded itself as the tree’s focused item. `onFocusedItemChange` has fired before it only when the focused id actually changed — tabbing back onto the row still recorded as focused fires nothing.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: TreeItemChildProps }]>",
			default: "—",
			description:
				'Render the row onto your own element. `props` carries `data-slot`, `role="treeitem"`, `type="button"` — drop it when your element is not a button — the aria attributes, `tabindex`, the `data-*` flags, every rest attribute, the merged `style` and `class`, the three handlers, and a `register(element)` callback returning its unregister — call it, or keyboard navigation can no longer land on the row. `children` is not rendered; place your own `Tree.ItemLabel` inside, the item context still reaches it.',
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The row’s content, normally a `Tree.ItemLabel`. Not rendered in `child` mode.",
		},
		{
			prop: "...restProps",
			type: "HTMLButtonAttributes",
			default: "—",
			description:
				"Spread onto the `<button>` before `style`, `class` and the handlers, so a caller can override `type`, `tabindex` or any aria attribute. A `data-disabled` attribute dims the row and removes its pointer events; nothing else sets it.",
		},
	];

	const itemLabelProps: PropRow[] = [
		{
			prop: "item",
			type: "TreeItemInstance<T>",
			default: "—",
			description:
				"Explicit row override, which lets the label stand outside a `Tree.Item`. When omitted the enclosing `Tree.Item`’s item is used: only the context is looked up at init, its `item` is a live getter, so a later change to that prop is followed. With neither, the label renders no element at all.",
		},
		{
			prop: "ref",
			type: "HTMLSpanElement | null",
			default: "null",
			description: "Bindable reference to the rendered `<span>`. Stays `null` in `child` mode.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Merged after the label’s own classes — padding, `hover:bg-accent`, the selected fill, the focus ring and the `ps-7` a leaf takes to line up with folder names — so any of them can be undone.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: TreeItemLabelChildProps }]>",
			default: "—",
			description:
				"Render the label onto your own element. `props` carries `data-slot`, the merged `class` and every rest attribute. In `child` mode neither `children` nor the toggle icon and name are rendered — the caller owns the whole content.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"Replaces the item name only: the folder toggle icon is still drawn before it. Without it the label renders `item.getItemName()`.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLSpanElement>",
			default: "—",
			description:
				"Spread onto the `<span>` before `class`; `style` passes through untouched, the label sets none of its own.",
		},
	];

	const treeStateOptions: PropRow[] = [
		{
			prop: "rootItemId",
			type: "string",
			default: "—",
			description:
				"Id of the conceptual root. It never renders: its children are the top-level rows (level 0), so it need not appear in `expandedItems`. It also seeds the cycle guard, so a child id pointing back at it is skipped.",
		},
		{
			prop: "dataLoader",
			type: "TreeDataLoader<T>",
			default: "—",
			description:
				"Synchronous accessors. `getChildren(id)` resolves the ordered child ids (`[]` or `undefined` for a leaf). On each re-derivation of the visible list it runs once for the root and twice for every expanded folder — the default `isItemFolder` asks it before the walk descends and asks again — then twice more per rendered row, for the row’s `aria-expanded` and the default label’s toggle icon; so it must be cheap and pure — an id met twice in one walk is rendered once. `getItem(id)` resolves a payload and runs only when a row’s data is asked for: the default `getItemName`, or `item.getItemData()`.",
		},
		{
			prop: "getItemName",
			type: "(item: TreeItemInstance<T>) => string",
			default: "String(item.getItemData())",
			description:
				"Display name of a row — what the default `Tree.ItemLabel` prints and `item.getItemName()` returns.",
		},
		{
			prop: "isItemFolder",
			type: "(item: TreeItemInstance<T>) => boolean",
			default: "has at least one child id",
			description:
				"Whether a row can hold children. Decides `aria-expanded`, the toggle icon, the leaf indent, and whether a click or Right expands it; a folder whose loader returns no children expands to nothing.",
		},
		{
			prop: "initialState",
			type: "{ expandedItems?: readonly string[]; selectedItems?: readonly string[]; focusedItem?: string | null }",
			default: "—",
			description:
				"Seeds the three pieces of state once, at construction — copied, so later edits to the arrays passed in do nothing. Missing lists start empty and `focusedItem` starts `null`, which makes the first visible row the tab stop.",
		},
		{
			prop: "onExpandedItemsChange",
			type: "(expandedItems: string[]) => void",
			default: "—",
			description:
				"Fires with a fresh copy after every real change to the expanded set — a plain click on a folder, Right/Left, or `expandItem`/`collapseItem`/`setExpandedItems`. A call that leaves the array identical is dropped without firing.",
		},
		{
			prop: "onSelectedItemsChange",
			type: "(selectedItems: string[]) => void",
			default: "—",
			description:
				"Fires with a fresh copy after every real change to the selection: a plain click replaces it with one id, Ctrl/Cmd click toggles the id, Shift click replaces it with the visible range from the anchor — the last plain or Ctrl/Cmd click, or the clicked row itself while there is none; an anchor hidden under a collapsed folder selects nothing. Keyboard navigation moves focus only and never fires it.",
		},
		{
			prop: "onFocusedItemChange",
			type: "(focusedItem: string | null) => void",
			default: "—",
			description:
				"Fires when the focused id changes — on a row’s DOM focus, a click, or a keyboard move — and never for a repeat of the current id. `null` arrives only from an explicit `setFocusedItem(null)`; the tree never clears it itself.",
		},
	];

	const keyboard = [
		{
			keys: "Tab / Shift + Tab",
			description:
				"Enters or leaves the tree, which is a single tab stop: the focused row while it is visible, otherwise the first visible row.",
		},
		{
			keys: "ArrowDown / ArrowUp",
			description: "Next / previous visible row. The ends clamp rather than wrap.",
		},
		{ keys: "Home / End", description: "First / last visible row." },
		{
			keys: "ArrowRight",
			description:
				'Expands a collapsed folder; on an expanded folder, steps into its first child. On a leaf the key is not handled. Inverted under `dir="rtl"`.',
		},
		{
			keys: "ArrowLeft",
			description:
				'Collapses an expanded folder; otherwise moves focus to the parent row, and does nothing on a top-level row. Inverted under `dir="rtl"`.',
		},
		{
			keys: "Enter / Space",
			description:
				"Activates the row through the native button click: focuses it, selects it alone, and toggles a folder.",
		},
	];
</script>

<DocPage title="Tree">
	{#snippet subtitle()}
		A multi-level tree view with expand/collapse, selection and WAI-ARIA keyboard navigation.
	{/snippet}

	<DocSection title="Basic tree">
		<Card.Root>
			<Card.Content>
				<div class="w-full lg:w-xs">
					<Tree.Root indent={20} tree={basicTree}>
						{#each basicTree.getItems() as item (item.getId())}
							<Tree.Item {item}>
								<Tree.ItemLabel />
							</Tree.Item>
						{/each}
					</Tree.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Tree with indented lines">
		{#snippet blurb()}
			The rails are a repeating gradient on the root that steps with <code>--tree-indent</code>, so
			changing <code>indent</code> moves the lines with the rows.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full lg:w-xs">
					<Tree.Root indent={20} tree={linesTree} class={treeLines}>
						{#each linesTree.getItems() as item (item.getId())}
							<Tree.Item {item}>
								<Tree.ItemLabel />
							</Tree.Item>
						{/each}
					</Tree.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Tree with custom indent">
		{#snippet blurb()}
			Folder and file glyphs in front of each name, over the guide rails.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full lg:w-xs">
					<Tree.Root indent={20} tree={chevronIconTree} class={treeLines}>
						{#each chevronIconTree.getItems() as item (item.getId())}
							<Tree.Item {item}>
								<Tree.ItemLabel class={labelOverRails}>
									<span class="flex items-center gap-2">
										{#if item.isFolder()}
											{#if item.isExpanded()}
												<FolderOpenIcon class="text-muted-foreground" />
											{:else}
												<FolderIcon class="text-muted-foreground" />
											{/if}
										{:else}
											<FileIcon class="text-muted-foreground" />
										{/if}
										{item.getItemName()}
									</span>
								</Tree.ItemLabel>
							</Tree.Item>
						{/each}
					</Tree.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Tree with custom indent (plus/minus toggles)">
		{#snippet blurb()}
			The same tree with <code>toggleIconType="plus-minus"</code> — meta.json gives this demo the previous
			one's title, so the affordance is spelled out here to keep the two headings apart.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full lg:w-xs">
					<Tree.Root
						indent={20}
						tree={plusMinusIconTree}
						toggleIconType="plus-minus"
						class={treeLinesWide}
					>
						{#each plusMinusIconTree.getItems() as item (item.getId())}
							<Tree.Item {item}>
								<Tree.ItemLabel class={labelOverRails}>
									<span class="ms-1 flex items-center gap-2">
										{#if item.isFolder()}
											{#if item.isExpanded()}
												<FolderOpenIcon class="text-muted-foreground" />
											{:else}
												<FolderIcon class="text-muted-foreground" />
											{/if}
										{:else}
											<FileIcon class="text-muted-foreground" />
										{/if}
										{item.getItemName()}
									</span>
								</Tree.ItemLabel>
							</Tree.Item>
						{/each}
					</Tree.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="File explorer tree with type icons">
		<Card.Root>
			<Card.Content>
				<div class="w-full lg:w-xs">
					<Tree.Root indent={20} tree={fileTree}>
						{#each fileTree.getItems() as item (item.getId())}
							{@const type = item.getItemData().type}
							<Tree.Item {item}>
								<Tree.ItemLabel class={labelOverRails}>
									<span class="flex items-center gap-2">
										{#if !type || type === "folder"}
											{#if item.isExpanded()}
												<FolderOpenIcon class="text-muted-foreground" />
											{:else}
												<FolderIcon class="text-muted-foreground" />
											{/if}
										{:else if type === "ts" || type === "tsx"}
											<FileCodeIcon class="text-muted-foreground" />
										{:else if type === "css"}
											<PaletteIcon class="text-muted-foreground" />
										{:else if type === "json"}
											<BracesIcon class="text-muted-foreground" />
										{:else if type === "md"}
											<FileTextIcon class="text-muted-foreground" />
										{:else}
											<FileIcon class="text-muted-foreground" />
										{/if}
										{item.getItemName()}
									</span>
								</Tree.ItemLabel>
							</Tree.Item>
						{/each}
					</Tree.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Organization chart tree with avatars">
		{#snippet blurb()}
			A reporting line read as a tree: the label carries an avatar and a two-line name/role stack
			instead of a single string.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full lg:w-xs">
					<Tree.Root indent={24} tree={orgTree}>
						{#each orgTree.getItems() as item (item.getId())}
							{@const person = item.getItemData()}
							<Tree.Item {item}>
								<Tree.ItemLabel class="gap-2 py-1">
									<Avatar.Root size="sm">
										<Avatar.Fallback class="text-[9px]">{getInitials(person.name)}</Avatar.Fallback>
									</Avatar.Root>
									<span class="flex flex-col items-start">
										<span class="text-sm leading-tight">{person.name}</span>
										{#if person.role}
											<span class="text-[10px] leading-tight text-muted-foreground">
												{person.role}
											</span>
										{/if}
									</span>
								</Tree.ItemLabel>
							</Tree.Item>
						{/each}
					</Tree.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Permissions tree with checkboxes">
		{#snippet blurb()}
			The leaves carry a checkbox, so the rows render through <code>child</code> onto a
			<code>&lt;div&gt;</code>: a checkbox inside the default row <code>&lt;button&gt;</code> would be
			invalid markup.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full lg:w-xs">
					<Tree.Root indent={24} tree={permissionsTree} toggleIconType="plus-minus">
						{#each permissionsTree.getItems() as item (item.getId())}
							{@const id = item.getId()}
							<Tree.Item {item}>
								{#snippet child({ props })}
									{@const { register, ...rowProps } = props}
									<div {...rowProps} use:registerTreeItem={register}>
										<Tree.ItemLabel class="not-in-data-[folder=true]:ps-5">
											<span class="flex items-center gap-2">
												{#if !item.isFolder()}
													<!-- The row's own click toggles selection and expansion; the checkbox
													     owns a different piece of state, so its click stops there. -->
													<Checkbox
														class="shrink-0"
														checked={permissionsChecked.has(id)}
														onCheckedChange={() => togglePermission(id)}
														onclick={(event) => event.stopPropagation()}
													/>
												{/if}
												{item.getItemName()}
											</span>
										</Tree.ItemLabel>
									</div>
								{/snippet}
							</Tree.Item>
						{/each}
					</Tree.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Tree.Root</h3>
			<p class="text-sm text-muted-foreground">
				The <code>role="tree"</code> container, also exported as <code>Tree.Tree</code>. It renders
				a
				<code>&lt;div&gt;</code> that publishes <code>indent</code> and <code>toggleIconType</code>
				to every part beneath it, and declares <code>--tree-indent</code> for anything that wants to draw
				at the row steps.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each rootProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Tree.Item</h3>
			<p class="text-sm text-muted-foreground">
				One <code>role="treeitem"</code> row, also exported as <code>Tree.TreeItem</code>. It
				renders a
				<code>&lt;button&gt;</code> that carries the roving tab stop, the aria position attributes
				and the click, keyboard and focus handling, and it throws outside <code>Tree.Root</code>.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each itemProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Tree.ItemLabel</h3>
			<p class="text-sm text-muted-foreground">
				The visible content of a row, also exported as <code>Tree.TreeItemLabel</code>. It renders a
				<code>&lt;span&gt;</code> holding the folder toggle (chevron or plus/minus, per the root’s
				<code>toggleIconType</code>) followed by the item name; it reads its row from the enclosing
				<code>Tree.Item</code>, so it normally takes no props at all, and it throws outside
				<code>Tree.Root</code>.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each itemLabelProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">TreeState</h3>
			<p class="text-sm text-muted-foreground">
				The runes-based store behind <code>Tree.Root</code>’s <code>tree</code> prop — one instance
				per view, constructed with <code>new TreeState(options)</code> wherever that view’s
				expansion, selection and focus should live. <code>getItems()</code> returns the visible rows
				in order, and every mutator fires its <code>on*Change</code> callback only on a real change. These
				are its constructor options.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each treeStateOptions as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Keyboard interactions</h3>
			<p class="text-sm text-muted-foreground">
				The tree follows the WAI-ARIA Tree View pattern, with the keys handled on each row.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Key</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each keyboard as row (row.keys)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.keys}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>
</DocPage>
