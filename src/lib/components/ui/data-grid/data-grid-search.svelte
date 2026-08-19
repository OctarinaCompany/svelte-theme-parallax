<script lang="ts" module>
	import type { HTMLAttributes } from "svelte/elements";

	import type { WithElementRef, WithoutChildren } from "$lib/utils.js";

	import type { DataGridSearchState } from "./data-grid-search.svelte.js";

	export type DataGridSearchProps = WithoutChildren<
		WithElementRef<HTMLAttributes<HTMLDivElement>>
	> & {
		/** The search state. Defaults to the one on the grid `<DataGrid.Root>` published. */
		search?: DataGridSearchState;
	};
</script>

<script lang="ts">
	import { untrack } from "svelte";

	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import ChevronUpIcon from "@lucide/svelte/icons/chevron-up";
	import XIcon from "@lucide/svelte/icons/x";

	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { cn } from "$lib/utils.js";

	import { useDataGridContext } from "./data-grid.svelte.js";

	let {
		ref = $bindable(null),
		search: searchProp,
		class: className,
		...restProps
	}: DataGridSearchProps = $props();

	const contextGrid = useDataGridContext<Record<string, unknown>>(
		() => searchProp,
		"<DataGrid.Search>",
	);
	const search = $derived(searchProp ?? contextGrid?.search);

	let inputRef = $state<HTMLInputElement | null>(null);

	$effect(() => {
		if (!search?.open) return;
		untrack(() => inputRef?.focus());
	});
</script>

{#if search?.open}
	<div
		bind:this={ref}
		role="search"
		data-slot="data-grid-search"
		class={cn(
			"absolute end-4 top-4 z-50 flex flex-col gap-2 rounded-lg bg-popover p-2 text-popover-foreground shadow-md ring-1 ring-foreground/10",
			className,
		)}
		{...restProps}
	>
		<div class="flex items-center gap-2">
			<Input
				bind:ref={inputRef}
				autocomplete="off"
				autocorrect="off"
				autocapitalize="off"
				spellcheck={false}
				aria-label="Find in table"
				placeholder="Find in table..."
				class="h-8 w-64"
				value={search.query}
				oninput={(event) => search.setQuery(event.currentTarget.value)}
				onkeydown={(event) => {
					event.stopPropagation();

					// Focus sits in the box, outside the grid container, so the box owns its own
					// Escape and Ctrl/Cmd+F rather than relying on the grid's handler.
					if (event.key === "Escape" || ((event.ctrlKey || event.metaKey) && event.key === "f")) {
						event.preventDefault();
						search.setOpen(false);
						return;
					}

					if (event.key !== "Enter") return;
					event.preventDefault();
					if (event.shiftKey) search.prev();
					else search.next();
				}}
			/>
			<div class="flex items-center gap-1">
				<Button
					aria-label="Previous match"
					variant="ghost"
					size="icon-sm"
					disabled={search.matches.length === 0}
					onclick={() => search.prev()}
				>
					<ChevronUpIcon />
				</Button>
				<Button
					aria-label="Next match"
					variant="ghost"
					size="icon-sm"
					disabled={search.matches.length === 0}
					onclick={() => search.next()}
				>
					<ChevronDownIcon />
				</Button>
				<Button
					aria-label="Close search"
					variant="ghost"
					size="icon-sm"
					onclick={() => search.setOpen(false)}
				>
					<XIcon />
				</Button>
			</div>
		</div>
		<div class="flex items-center gap-1 text-xs whitespace-nowrap text-muted-foreground">
			{#if search.matches.length > 0}
				<span>{search.matchIndex + 1} of {search.matches.length}</span>
			{:else if search.query}
				<span>No results</span>
			{:else}
				<span>Type to search</span>
			{/if}
		</div>
	</div>
{/if}
