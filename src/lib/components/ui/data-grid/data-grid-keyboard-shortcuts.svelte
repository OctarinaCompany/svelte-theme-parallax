<script lang="ts" module>
	/** One row of the dialog. */
	export type DataGridShortcut = {
		keys: string[];
		description: string;
	};

	/** One titled section of the dialog. */
	export type DataGridShortcutGroup = {
		title: string;
		shortcuts: DataGridShortcut[];
	};

	export type DataGridKeyboardShortcutsProps = {
		/** Whether the dialog is open. Bindable. */
		open?: boolean;
		/**
		 * Initial open state when uncontrolled.
		 * @default false
		 */
		defaultOpen?: boolean;
		/** Called whenever the dialog opens or closes. */
		onOpenChange?: (open: boolean) => void;
		/**
		 * Add the Search group (Ctrl+F, Enter, Shift+Enter, Esc).
		 * @default false
		 */
		enableSearch?: boolean;
		/**
		 * Add the undo/redo rows to Editing.
		 * @default false
		 */
		enableUndoRedo?: boolean;
		/**
		 * Add the paste row to Editing.
		 * @default false
		 */
		enablePaste?: boolean;
		/**
		 * Add the insert-row row to Editing.
		 * @default false
		 */
		enableRowAdd?: boolean;
		/**
		 * Add the delete-rows rows to Editing.
		 * @default false
		 */
		enableRowsDelete?: boolean;
	};

	/** Ctrl/Cmd+`/` opens the dialog. */
	const SHORTCUT_KEY = "/";
</script>

<script lang="ts">
	import SearchIcon from "@lucide/svelte/icons/search";
	import XIcon from "@lucide/svelte/icons/x";

	import { Button } from "$lib/components/ui/button/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";

	import DataGridShortcutCard from "./data-grid-shortcut-card.svelte";

	let {
		open = $bindable(),
		defaultOpen = false,
		onOpenChange,
		enableSearch = false,
		enableUndoRedo = false,
		enablePaste = false,
		enableRowAdd = false,
		enableRowsDelete = false,
	}: DataGridKeyboardShortcutsProps = $props();

	// Uncontrolled: seed once from `defaultOpen`. Controlled: the parent's binding wins.
	// svelte-ignore state_referenced_locally
	open ??= defaultOpen;

	let filter = $state("");
	let filterRef = $state<HTMLInputElement | null>(null);

	function setOpen(next: boolean): void {
		open = next;
		if (!next) filter = "";
		onOpenChange?.(next);
	}

	const modKey = $derived(
		typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)
			? "⌘"
			: "Ctrl",
	);

	const groups: DataGridShortcutGroup[] = $derived([
		{
			title: "Navigation",
			shortcuts: [
				{ keys: ["↑", "↓", "←", "→"], description: "Navigate between cells" },
				{ keys: ["Tab"], description: "Move to next cell" },
				{ keys: ["Shift", "Tab"], description: "Move to previous cell" },
				{ keys: ["Home"], description: "Move to first column" },
				{ keys: ["End"], description: "Move to last column" },
				{ keys: [modKey, "Home"], description: "Move to first cell" },
				{ keys: [modKey, "End"], description: "Move to last cell" },
				{ keys: ["PgUp"], description: "Move up one page" },
				{ keys: ["PgDn"], description: "Move down one page" },
			],
		},
		{
			title: "Selection",
			shortcuts: [
				{ keys: ["Shift", "↑↓←→"], description: "Extend selection" },
				{ keys: [modKey, "A"], description: "Select all cells" },
				{ keys: [modKey, "Click"], description: "Toggle cell selection" },
				{ keys: ["Shift", "Click"], description: "Select range" },
				{ keys: ["Esc"], description: "Clear selection" },
			],
		},
		{
			title: "Editing",
			shortcuts: [
				{ keys: ["Enter"], description: "Start editing cell" },
				{ keys: ["Double Click"], description: "Start editing cell" },
				{ keys: ["Delete"], description: "Clear selected cells" },
				{ keys: ["Backspace"], description: "Clear selected cells" },
				...(enablePaste ? [{ keys: [modKey, "V"], description: "Paste cells" }] : []),
				...(enableRowAdd ? [{ keys: ["Shift", "Enter"], description: "Insert row below" }] : []),
				...(enableRowsDelete
					? [
							{ keys: [modKey, "Backspace"], description: "Delete selected rows" },
							{ keys: [modKey, "Delete"], description: "Delete selected rows" },
						]
					: []),
				...(enableUndoRedo
					? [
							{ keys: [modKey, "Z"], description: "Undo" },
							{ keys: [modKey, "Shift", "Z"], description: "Redo" },
							{ keys: [modKey, "Y"], description: "Redo" },
						]
					: []),
			],
		},
		...(enableSearch
			? [
					{
						title: "Search",
						shortcuts: [
							{ keys: [modKey, "F"], description: "Open search" },
							{ keys: ["Enter"], description: "Next match" },
							{ keys: ["Shift", "Enter"], description: "Previous match" },
							{ keys: ["Esc"], description: "Close search" },
						],
					},
				]
			: []),
		{
			title: "General",
			shortcuts: [{ keys: [modKey, "/"], description: "Show keyboard shortcuts" }],
		},
	]);

	const filteredGroups = $derived.by(() => {
		const query = filter.trim().toLowerCase();
		if (!query) return groups;

		return groups
			.map((group) => ({
				...group,
				shortcuts: group.shortcuts.filter(
					(shortcut) =>
						shortcut.description.toLowerCase().includes(query) ||
						shortcut.keys.some((key) => key.toLowerCase().includes(query)),
				),
			}))
			.filter((group) => group.shortcuts.length > 0);
	});

	$effect(() => {
		function onKeydown(event: KeyboardEvent) {
			if (!(event.ctrlKey || event.metaKey) || event.key !== SHORTCUT_KEY) return;
			event.preventDefault();
			setOpen(true);
		}

		window.addEventListener("keydown", onKeydown);
		return () => window.removeEventListener("keydown", onKeydown);
	});
</script>

<Dialog.Root open={open ?? false} onOpenChange={setOpen}>
	<Dialog.Content
		data-slot="data-grid-keyboard-shortcuts"
		class="max-w-2xl px-0"
		showCloseButton={false}
		onOpenAutoFocus={(event) => {
			event.preventDefault();
			filterRef?.focus();
		}}
	>
		<Dialog.Close class="absolute top-6 right-6">
			{#snippet child({ props })}
				<Button {...props} variant="ghost" size="icon-xs" aria-label="Close">
					<XIcon />
				</Button>
			{/snippet}
		</Dialog.Close>
		<Dialog.Header class="px-6">
			<Dialog.Title>Keyboard shortcuts</Dialog.Title>
			<Dialog.Description class="sr-only">
				Use these keyboard shortcuts to navigate and interact with the data grid more efficiently.
			</Dialog.Description>
		</Dialog.Header>
		<div class="px-6">
			<div class="relative">
				<SearchIcon
					class="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					bind:ref={filterRef}
					bind:value={filter}
					aria-label="Search shortcuts"
					placeholder="Search shortcuts..."
					class="h-8 pl-8"
				/>
			</div>
		</div>
		<Separator class="mx-auto data-[orientation=horizontal]:w-[calc(100%-(--spacing(12)))]" />
		<div class="h-[40vh] overflow-y-auto px-6">
			{#if filteredGroups.length === 0}
				<div class="flex h-full flex-col items-center justify-center gap-3 text-center">
					<div
						class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground"
					>
						<SearchIcon class="pointer-events-none size-6" />
					</div>
					<div class="flex flex-col gap-1">
						<div class="text-lg font-medium tracking-tight">No shortcuts found</div>
						<p class="text-sm text-muted-foreground">Try searching for a different term.</p>
					</div>
				</div>
			{:else}
				<div class="flex flex-col gap-6">
					{#each filteredGroups as group (group.title)}
						<div class="flex flex-col gap-2">
							<h3 class="text-sm font-semibold text-foreground">{group.title}</h3>
							<div class="divide-y divide-border rounded-md border">
								{#each group.shortcuts as shortcut (shortcut.keys.join("+") + shortcut.description)}
									<DataGridShortcutCard keys={shortcut.keys} description={shortcut.description} />
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>
