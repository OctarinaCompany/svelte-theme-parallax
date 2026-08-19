<script lang="ts" module>
	import type { Header, RowData } from "@tanstack/table-core";
	import type { HTMLAttributes } from "svelte/elements";

	import type { WithElementRef, WithoutChildren } from "$lib/utils.js";

	import type { DataGridState } from "./data-grid.svelte.js";

	export type DataGridColumnResizerProps<TData extends RowData> = WithoutChildren<
		WithElementRef<HTMLAttributes<HTMLDivElement>>
	> & {
		/** The grid state. Defaults to the one `<DataGrid.Root>` published. */
		grid?: DataGridState<TData>;
		/** The header whose column this handle resizes. */
		header: Header<TData, unknown>;
		/** The column's human label, used in the handle's accessible name. */
		label: string;
	};
</script>

<script lang="ts" generics="TData extends RowData">
	import { cn } from "$lib/utils.js";

	import {
		COLUMN_AUTO_FIT_PADDING,
		COLUMN_RESIZE_STEP,
		MAX_COLUMN_SIZE,
		MIN_COLUMN_SIZE,
	} from "./data-grid-utils.js";
	import { useDataGridContext } from "./data-grid.svelte.js";

	let {
		ref = $bindable(null),
		grid: gridProp,
		header,
		label,
		class: className,
		...restProps
	}: DataGridColumnResizerProps<TData> = $props();

	const contextGrid = useDataGridContext<TData>(() => gridProp, "<DataGrid.ColumnResizer>");
	const grid = $derived(gridProp ?? contextGrid!);

	const column = $derived(header.column);
	const defaultColumnDef = $derived(header.getContext().table._getDefaultColumnDef());
	const minSize = $derived(column.columnDef.minSize ?? defaultColumnDef.minSize ?? MIN_COLUMN_SIZE);
	const maxSize = $derived(column.columnDef.maxSize ?? defaultColumnDef.maxSize ?? MAX_COLUMN_SIZE);

	/** The width the handle was focused at, so `Escape` can put it back. Deliberately not `$state`. */
	let sizeAtFocus: number | null = null;

	function setSize(next: number): void {
		const clamped = Math.round(Math.min(maxSize, Math.max(minSize, next)));
		grid.table.setColumnSizing((previous) => ({ ...previous, [column.id]: clamped }));
	}

	/**
	 * The width that fits the column's widest rendered content, clamped to the column's bounds.
	 *
	 * Only the rows currently mounted by the virtualizer can be measured — measuring the rest would
	 * mean rendering them off-screen, which is exactly the cost virtualization exists to avoid.
	 *
	 * Upstream calls `column.resetSize()` here, which restores the column's *configured* size rather
	 * than fitting it to content; its own docs describe the gesture as auto-fit, so this theme
	 * measures.
	 */
	function getAutoFitSize(): number {
		let widest = 0;

		const headerContent = ref?.parentElement?.querySelector<HTMLElement>(
			'[data-slot="data-grid-column-header"]',
		);
		if (headerContent) widest = Math.max(widest, headerContent.scrollWidth);

		for (let rowIndex = 0; rowIndex < grid.rows.length; rowIndex++) {
			const cell = grid.getCellElement(rowIndex, column.id);
			if (cell) widest = Math.max(widest, cell.scrollWidth);
		}

		return widest + COLUMN_AUTO_FIT_PADDING;
	}

	/**
	 * The keyboard equivalent of the drag gesture: arrows step the width (mirrored under `rtl`, so
	 * the key that visually widens the column always widens it), `Home`/`End` jump to the bounds,
	 * `Enter` commits the current width and `Escape` restores the one the handle was focused at.
	 */
	function handleKeydown(event: KeyboardEvent): void {
		const isRtl = grid.dir === "rtl";
		const size = column.getSize();

		switch (event.key) {
			case "ArrowLeft":
				event.preventDefault();
				event.stopPropagation();
				setSize(size + (isRtl ? COLUMN_RESIZE_STEP : -COLUMN_RESIZE_STEP));
				break;
			case "ArrowRight":
				event.preventDefault();
				event.stopPropagation();
				setSize(size + (isRtl ? -COLUMN_RESIZE_STEP : COLUMN_RESIZE_STEP));
				break;
			case "Home":
				event.preventDefault();
				event.stopPropagation();
				setSize(minSize);
				break;
			case "End":
				event.preventDefault();
				event.stopPropagation();
				setSize(maxSize);
				break;
			case "Enter":
				event.preventDefault();
				event.stopPropagation();
				sizeAtFocus = size;
				break;
			case "Escape":
				if (sizeAtFocus === null || sizeAtFocus === size) return;
				event.preventDefault();
				event.stopPropagation();
				setSize(sizeAtFocus);
				break;
		}
	}
</script>

<!--
	A focusable `role="separator"` is the ARIA pattern for a keyboard-operable window splitter
	(the keydown handler above is the element's whole point); the a11y rule only sees a
	noninteractive role next to a tabindex.
-->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	bind:this={ref}
	role="separator"
	aria-orientation="vertical"
	aria-label={`Resize ${label} column`}
	aria-valuenow={column.getSize()}
	aria-valuemin={minSize}
	aria-valuemax={maxSize}
	data-slot="data-grid-column-resizer"
	data-resizing={column.getIsResizing() ? "" : undefined}
	tabindex={0}
	class={cn(
		"absolute -end-px top-0 z-50 h-full w-0.5 cursor-ew-resize touch-none bg-border transition-opacity select-none after:absolute after:inset-y-0 after:start-1/2 after:h-full after:w-[18px] after:-translate-x-1/2 after:content-[''] hover:bg-primary focus:bg-primary focus:outline-none",
		column.getIsResizing() ? "bg-primary" : "opacity-0 hover:opacity-100 focus-visible:opacity-100",
		className,
	)}
	onfocus={() => {
		sizeAtFocus = column.getSize();
	}}
	ondblclick={() => setSize(getAutoFitSize())}
	onkeydown={handleKeydown}
	onmousedown={header.getResizeHandler()}
	ontouchstart={header.getResizeHandler()}
	{...restProps}
></div>
