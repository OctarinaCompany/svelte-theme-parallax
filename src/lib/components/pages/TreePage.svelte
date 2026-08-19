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
</DocPage>
