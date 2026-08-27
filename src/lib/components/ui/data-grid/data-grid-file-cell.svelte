<script lang="ts" module>
	import type { RowData } from "@tanstack/table-core";

	import type { DataGridCellVariantProps } from "./data-grid-cell-wrapper.svelte";

	export type DataGridFileCellProps<TData extends RowData> = DataGridCellVariantProps<TData>;
</script>

<script lang="ts" generics="TData extends RowData">
	import UploadIcon from "@lucide/svelte/icons/upload";
	import XIcon from "@lucide/svelte/icons/x";
	import { toast } from "svelte-sonner";

	import { Badge } from "$lib/components/ui/badge/index.js";
	import { BadgeOverflow } from "$lib/components/ui/badge-overflow/index.js";
	import { Button } from "$lib/components/ui/button/index.js";

	import DataGridCellEditor from "./data-grid-cell-editor.svelte";
	import DataGridCellWrapper from "./data-grid-cell-wrapper.svelte";
	import { formatFileSize, getFileIcon, getLineCount } from "./data-grid-utils.js";
	import { useDataGridContext } from "./data-grid.svelte.js";
	import type { FileCellData } from "./types.js";

	const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;
	const DEFAULT_MAX_FILES = 10;

	let {
		grid: gridProp,
		cell,
		rowIndex,
		columnId,
		rowHeight,
		isEditing,
		isFocused,
		isSelected,
		isSearchMatch,
		isActiveSearchMatch,
		readOnly,
	}: DataGridFileCellProps<TData> = $props();

	const contextGrid = useDataGridContext<TData>(() => gridProp, "<DataGrid.Cell>");
	const grid = $derived(gridProp ?? contextGrid!);

	const cellOpts = $derived(cell.column.columnDef.meta?.cell);
	const fileOpts = $derived(cellOpts?.variant === "file" ? cellOpts : null);
	const maxFileSize = $derived(fileOpts?.maxFileSize ?? DEFAULT_MAX_FILE_SIZE);
	const maxFiles = $derived(fileOpts?.maxFiles ?? DEFAULT_MAX_FILES);
	const accept = $derived(fileOpts?.accept);
	const multiple = $derived(fileOpts?.multiple ?? false);
	const acceptedTypes = $derived(accept ? accept.split(",").map((type) => type.trim()) : null);

	const files = $derived((cell.getValue() as FileCellData[] | null | undefined) ?? []);

	let cellRef = $state<HTMLDivElement | null>(null);
	let inputRef = $state<HTMLInputElement | null>(null);
	let isPending = $state(false);
	let isDragOver = $state(false);
	let error = $state<string | null>(null);

	function validate(file: File): string | null {
		if (maxFileSize && file.size > maxFileSize) {
			return `File size exceeds ${formatFileSize(maxFileSize)}`;
		}
		if (!acceptedTypes) return null;

		const extension = `.${file.name.split(".").pop()}`;
		const isAccepted = acceptedTypes.some((type) => {
			if (type.endsWith("/*")) return file.type.startsWith(`${type.slice(0, -2)}/`);
			if (type.startsWith(".")) return extension.toLowerCase() === type.toLowerCase();
			return file.type === type;
		});

		return isAccepted ? null : "File type not accepted";
	}

	async function addFiles(incoming: File[]): Promise<void> {
		if (readOnly || isPending || incoming.length === 0) return;
		error = null;

		if (maxFiles && files.length + incoming.length > maxFiles) {
			error = `Maximum ${maxFiles} files allowed`;
			toast.error(error);
			return;
		}

		const accepted: File[] = [];
		const rejected: string[] = [];
		for (const file of incoming) {
			const reason = validate(file);
			if (reason) rejected.push(reason);
			else accepted.push(file);
		}

		if (rejected.length > 0) {
			error = rejected[0] ?? null;
			if (error) toast.error(error);
		}

		if (accepted.length === 0) return;

		isPending = true;
		try {
			const uploaded = grid.onFilesUpload
				? await grid.onFilesUpload({ files: accepted, rowIndex, columnId })
				: accepted.map((file) => ({
						id: crypto.randomUUID(),
						name: file.name,
						size: file.size,
						type: file.type,
						url: URL.createObjectURL(file),
					}));

			grid.updateData({ rowIndex, columnId, value: [...files, ...uploaded] });
		} catch (uploadError) {
			toast.error(
				uploadError instanceof Error
					? uploadError.message
					: `Failed to upload ${accepted.length} file${accepted.length !== 1 ? "s" : ""}`,
			);
		} finally {
			isPending = false;
		}
	}

	async function removeFiles(fileIds: string[]): Promise<void> {
		if (readOnly || isPending || fileIds.length === 0) return;
		error = null;

		isPending = true;
		try {
			await grid.onFilesDelete?.({ fileIds, rowIndex, columnId });
			const removed = new Set(fileIds);
			for (const file of files) {
				if (removed.has(file.id) && file.url?.startsWith("blob:")) URL.revokeObjectURL(file.url);
			}
			grid.updateData({
				rowIndex,
				columnId,
				value: files.filter((file) => !removed.has(file.id)),
			});
		} catch (deleteError) {
			toast.error(deleteError instanceof Error ? deleteError.message : "Failed to delete files");
		} finally {
			isPending = false;
		}
	}

	/**
	 * Dismissal — `Escape` and outside presses — belongs to the editor layer, whose listeners are on
	 * the document and so fire wherever focus sits. Space and Tab stay here: they only ever arrive
	 * while focus is still on the cell wrapper, before the user has reached into the panel.
	 *
	 * Files are written the moment they are added or removed, so like upstream neither dismissal
	 * path rolls anything back; only the transient `error` is cleared.
	 */
	function handleWrapperKeydown(event: KeyboardEvent): void {
		if (isEditing) {
			if (event.key === " ") {
				event.preventDefault();
				event.stopPropagation();
				inputRef?.click();
			} else if (event.key === "Tab") {
				event.preventDefault();
				event.stopPropagation();
				error = null;
				grid.stopEditing({ direction: grid.getTabDirection(event.shiftKey) });
			}
			return;
		}

		// Tab on a resting cell is plain navigation: the grid's own handler owns it, so it must be
		// allowed to bubble.
	}
</script>

<DataGridCellWrapper
	bind:ref={cellRef}
	{grid}
	{cell}
	{rowIndex}
	{columnId}
	{rowHeight}
	{isEditing}
	{isFocused}
	{isSelected}
	{isSearchMatch}
	{isActiveSearchMatch}
	{readOnly}
	data-slot="data-grid-file-cell"
	onkeydown={handleWrapperKeydown}
>
	{#if files.length > 0}
		<BadgeOverflow
			data-slot="data-grid-cell-content"
			items={files}
			getBadgeLabel={(file) => file.name}
			lineCount={getLineCount(rowHeight)}
		>
			{#snippet badge(file: FileCellData)}
				{@const FileTypeIcon = getFileIcon(file.type)}
				<Badge variant="secondary" class="gap-1 px-1.5 py-px">
					<FileTypeIcon class="size-3 shrink-0" />
					<span class="max-w-[100px] truncate">{file.name}</span>
				</Badge>
			{/snippet}
		</BadgeOverflow>
	{/if}
	{#if isEditing}
		<DataGridCellEditor
			open={isEditing}
			anchor={cellRef}
			onDismiss={() => {
				error = null;
				grid.stopEditing();
			}}
			class="flex w-[400px] flex-col gap-2 p-3"
		>
			<button
				type="button"
				data-disabled={isPending ? "" : undefined}
				data-invalid={error ? "" : undefined}
				data-drag-over={isDragOver ? "" : undefined}
				class="flex flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-6 transition-colors outline-none hover:bg-accent/30 focus-visible:border-ring/50 data-drag-over:border-ring/50 data-drag-over:bg-accent/30 data-invalid:border-destructive data-invalid:ring-3 data-invalid:ring-destructive/20 dark:data-invalid:ring-destructive/40 data-disabled:pointer-events-none data-disabled:opacity-50"
				disabled={isPending}
				onclick={() => inputRef?.click()}
				ondragover={(event) => {
					event.preventDefault();
					isDragOver = true;
				}}
				ondragleave={(event) => {
					// Moving over a child fires `dragleave` too; only a true exit ends the highlight.
					if (event.currentTarget.contains(event.relatedTarget as Node)) return;
					isDragOver = false;
				}}
				ondrop={(event) => {
					event.preventDefault();
					isDragOver = false;
					void addFiles([...(event.dataTransfer?.files ?? [])]);
				}}
			>
				<UploadIcon class="size-8 text-muted-foreground" />
				<span class="text-sm font-medium">Drag files here</span>
				<span class="text-xs text-muted-foreground">or click to browse</span>
				<span class="text-xs text-muted-foreground">
					Max size: {formatFileSize(maxFileSize)} • Max {maxFiles} files
				</span>
			</button>
			<input
				bind:this={inputRef}
				type="file"
				aria-label="Upload files"
				{multiple}
				{accept}
				class="sr-only"
				onchange={(event) => {
					const target = event.currentTarget;
					void addFiles([...(target.files ?? [])]);
					target.value = "";
				}}
			/>
			{#if error}
				<p class="text-xs text-destructive">{error}</p>
			{/if}
			{#if files.length > 0}
				<div class="flex items-center justify-between">
					<p class="text-xs font-medium text-muted-foreground">
						{files.length}
						{files.length === 1 ? "file" : "files"}
					</p>
					<Button
						variant="ghost"
						size="sm"
						class="h-6 text-xs text-muted-foreground"
						disabled={isPending}
						onclick={() => void removeFiles(files.map((file) => file.id))}
					>
						Clear all
					</Button>
				</div>
				<ul class="flex max-h-[200px] flex-col gap-1 overflow-y-auto">
					{#each files as file (file.id)}
						{@const FileTypeIcon = getFileIcon(file.type)}
						<li class="flex items-center gap-2 rounded-md border bg-muted/50 px-2 py-1.5">
							<FileTypeIcon class="size-4 shrink-0 text-muted-foreground" />
							<div class="flex-1 overflow-hidden">
								<p class="truncate text-sm">{file.name}</p>
								<p class="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
							</div>
							<Button
								variant="ghost"
								size="icon-xs"
								aria-label={`Remove ${file.name}`}
								disabled={isPending}
								onclick={() => void removeFiles([file.id])}
							>
								<XIcon />
							</Button>
						</li>
					{/each}
				</ul>
			{/if}
		</DataGridCellEditor>
	{/if}
</DataGridCellWrapper>
