import BaselineIcon from "@lucide/svelte/icons/baseline";
import CalendarIcon from "@lucide/svelte/icons/calendar";
import SquareCheckIcon from "@lucide/svelte/icons/square-check";
import FileIcon from "@lucide/svelte/icons/file";
import FileArchiveIcon from "@lucide/svelte/icons/file-archive";
import FileMusicIcon from "@lucide/svelte/icons/file-music";
import FileImageIcon from "@lucide/svelte/icons/file-image";
import FileSpreadsheetIcon from "@lucide/svelte/icons/file-spreadsheet";
import FileTextIcon from "@lucide/svelte/icons/file-text";
import FilePlayIcon from "@lucide/svelte/icons/file-play";
import HashIcon from "@lucide/svelte/icons/hash";
import LinkIcon from "@lucide/svelte/icons/link";
import ListIcon from "@lucide/svelte/icons/list";
import ListChecksIcon from "@lucide/svelte/icons/list-checks";
import PresentationIcon from "@lucide/svelte/icons/presentation";
import TextInitialIcon from "@lucide/svelte/icons/text-initial";
import type { Column, RowData, Table } from "@tanstack/table-core";

import { formatBytes } from "$lib/shared/format-bytes.js";

import type {
	CellOpts,
	CellPosition,
	CellSelectOption,
	CellUpdate,
	DataGridIcon,
	Direction,
	FileCellData,
	RowHeightValue,
} from "./types.js";

/**
 * Columns that render but never take focus: they are part of `columnIds`, never of
 * `navigableColumnIds`, so focus, Tab order, paste targeting and TSV serialization skip them.
 */
export const NON_NAVIGABLE_COLUMN_IDS: ReadonlySet<string> = new Set(["select", "actions"]);

/** How far past the viewport edge a cell must sit before a scroll is issued, in pixels. */
export const VIEWPORT_OFFSET = 1;

/** How many columns `Alt+PageUp` / `Alt+PageDown` jump. */
export const HORIZONTAL_PAGE_SIZE = 5;

/** table-core's `defaultColumn.minSize` for this theme. */
export const MIN_COLUMN_SIZE = 60;

/** table-core's `defaultColumn.maxSize` for this theme. */
export const MAX_COLUMN_SIZE = 800;

/** How many pixels one arrow key adds to or removes from a column's width. */
export const COLUMN_RESIZE_STEP = 10;

/** Breathing room added to the widest measured cell when a resizer auto-fits its column. */
export const COLUMN_AUTO_FIT_PADDING = 24;

const DOMAIN_REGEX = /^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i;
const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}.*)?$/;
const TRUTHY_BOOLEANS = new Set(["true", "1", "yes", "checked"]);
const VALID_BOOLEANS = new Set(["true", "false", "1", "0", "yes", "no", "checked", "unchecked"]);

// ---------------------------------------------------------------------------
// Cell keys
// ---------------------------------------------------------------------------

/** The canonical `"rowIndex:columnId"` key every selection set is built from. */
export function getCellKey(rowIndex: number, columnId: string): string {
	return `${rowIndex}:${columnId}`;
}

/** Inverse of {@link getCellKey}. A malformed key resolves to `{ rowIndex: 0, columnId: '' }`. */
export function parseCellKey(cellKey: string): CellPosition {
	const parts = cellKey.split(":");
	const rowIndexStr = parts[0];
	const columnId = parts[1];
	if (rowIndexStr && columnId) {
		const rowIndex = Number.parseInt(rowIndexStr, 10);
		if (!Number.isNaN(rowIndex)) {
			return { rowIndex, columnId };
		}
	}
	return { rowIndex: 0, columnId: "" };
}

// ---------------------------------------------------------------------------
// Row height
// ---------------------------------------------------------------------------

/**
 * The pixel height of one row at `rowHeight`.
 *
 * `short` is 40, not upstream's 36: the table density tiers (`app.css`, `--table-row-h`)
 * put their compact step at 40px, and the grid's presets read as the same ladder —
 * `short`/`medium`/`tall` are the table's `sm`/`default`/`lg`, with `extra-tall` grid-only.
 */
export function getRowHeightValue(rowHeight: RowHeightValue): number {
	const rowHeightMap: Record<RowHeightValue, number> = {
		short: 40,
		medium: 56,
		tall: 76,
		"extra-tall": 96,
	};

	return rowHeightMap[rowHeight];
}

/** How many lines of text a cell shows at `rowHeight`. */
export function getLineCount(rowHeight: RowHeightValue): number {
	const lineCountMap: Record<RowHeightValue, number> = {
		short: 1,
		medium: 2,
		tall: 3,
		"extra-tall": 4,
	};

	return lineCountMap[rowHeight];
}

// ---------------------------------------------------------------------------
// Column presentation
// ---------------------------------------------------------------------------

/** Which vertical borders a column draws, so pinned edges do not double up. */
export function getColumnBorderVisibility<TData extends RowData>(params: {
	column: Column<TData, unknown>;
	nextColumn?: Column<TData, unknown>;
	isLastColumn: boolean;
}): { showEndBorder: boolean; showStartBorder: boolean } {
	const { column, nextColumn, isLastColumn } = params;

	const isPinned = column.getIsPinned();
	const isFirstRightPinnedColumn = isPinned === "right" && column.getIsFirstColumn("right");
	const isLastRightPinnedColumn = isPinned === "right" && column.getIsLastColumn("right");

	const nextIsPinned = nextColumn?.getIsPinned();
	const isBeforeRightPinned = nextIsPinned === "right" && nextColumn?.getIsFirstColumn("right");

	return {
		showEndBorder: !isBeforeRightPinned && (isLastColumn || !isLastRightPinnedColumn),
		showStartBorder: isFirstRightPinnedColumn,
	};
}

/**
 * The inline style that sticks a pinned column to the correct **physical** edge.
 *
 * Under `dir="rtl"` the logical `left`/`right` pins swap physical sides, and the inset box shadow
 * that marks the pinned edge flips with them — the same swap upstream performs.
 *
 * Like its data-table sibling, this departs from upstream in painting a background on PINNED
 * cells only, in `--table-pinned-ground` (the card by default; `app.css` rebinds it to
 * `--background` inside the grid's head and footer rowgroups, which paint the page ground) —
 * unpinned cells stay transparent so the card shows through, as on every other table here.
 */
export function getColumnPinningStyle<TData extends RowData>(params: {
	column: Column<TData, unknown>;
	withBorder?: boolean;
	dir?: Direction;
}): string {
	const { column, dir = "ltr", withBorder = false } = params;

	const isPinned = column.getIsPinned();
	const isLastLeftPinnedColumn = isPinned === "left" && column.getIsLastColumn("left");
	const isFirstRightPinnedColumn = isPinned === "right" && column.getIsFirstColumn("right");
	const isRtl = dir === "rtl";

	const declarations: string[] = [];

	if (withBorder && isLastLeftPinnedColumn) {
		declarations.push(
			isRtl
				? "box-shadow: 4px 0 4px -4px var(--border) inset"
				: "box-shadow: -4px 0 4px -4px var(--border) inset",
		);
	} else if (withBorder && isFirstRightPinnedColumn) {
		declarations.push(
			isRtl
				? "box-shadow: -4px 0 4px -4px var(--border) inset"
				: "box-shadow: 4px 0 4px -4px var(--border) inset",
		);
	}

	const leftPosition = isPinned === "left" ? `${column.getStart("left")}px` : undefined;
	const rightPosition = isPinned === "right" ? `${column.getAfter("right")}px` : undefined;

	const physicalLeft = isRtl ? rightPosition : leftPosition;
	const physicalRight = isRtl ? leftPosition : rightPosition;

	if (physicalLeft !== undefined) declarations.push(`left: ${physicalLeft}`);
	if (physicalRight !== undefined) declarations.push(`right: ${physicalRight}`);

	declarations.push(`opacity: ${isPinned ? 0.97 : 1}`);
	declarations.push(`position: ${isPinned ? "sticky" : "relative"}`);
	if (isPinned) declarations.push("background: var(--table-pinned-ground, var(--card))");
	declarations.push(`width: ${column.getSize()}px`);
	if (isPinned) declarations.push("z-index: 1");

	return `${declarations.join("; ")};`;
}

/** The header's variant icon + tooltip label. `null` for a column with no declared variant. */
export function getColumnVariant(
	variant?: CellOpts["variant"],
): { icon: DataGridIcon; label: string } | null {
	switch (variant) {
		case "short-text":
			return { label: "Short text", icon: BaselineIcon };
		case "long-text":
			return { label: "Long text", icon: TextInitialIcon };
		case "number":
			return { label: "Number", icon: HashIcon };
		case "url":
			return { label: "URL", icon: LinkIcon };
		case "checkbox":
			return { label: "Checkbox", icon: SquareCheckIcon };
		case "select":
			return { label: "Select", icon: ListIcon };
		case "multi-select":
			return { label: "Multi-select", icon: ListChecksIcon };
		case "date":
			return { label: "Date", icon: CalendarIcon };
		case "file":
			return { label: "File", icon: FileIcon };
		default:
			return null;
	}
}

// ---------------------------------------------------------------------------
// Scrolling
// ---------------------------------------------------------------------------

/** Which horizontal edge a navigation move should bring into view, if any. */
export function getScrollDirection(
	direction: string,
): "left" | "right" | "home" | "end" | undefined {
	if (
		direction === "left" ||
		direction === "right" ||
		direction === "home" ||
		direction === "end"
	) {
		return direction;
	}
	if (direction === "pageleft") return "left";
	if (direction === "pageright") return "right";
	return undefined;
}

/**
 * Scroll `container` horizontally so `targetCell` clears the pinned columns on both edges.
 *
 * A negative `scrollLeft` is how Chromium reports an RTL scroll box, so it is treated as RTL even
 * when the resolved direction says otherwise — upstream does the same.
 */
export function scrollCellIntoView<TData extends RowData>(params: {
	container: HTMLElement;
	targetCell: HTMLElement;
	table: Table<TData> | null;
	viewportOffset: number;
	direction?: "left" | "right" | "home" | "end";
	isRtl: boolean;
}): void {
	const { container, targetCell, table, direction, viewportOffset, isRtl } = params;

	const containerRect = container.getBoundingClientRect();
	const cellRect = targetCell.getBoundingClientRect();

	const hasNegativeScroll = container.scrollLeft < 0;
	const isActuallyRtl = isRtl || hasNegativeScroll;

	const leftPinnedWidth = (table?.getLeftVisibleLeafColumns() ?? []).reduce(
		(sum, column) => sum + column.getSize(),
		0,
	);
	const rightPinnedWidth = (table?.getRightVisibleLeafColumns() ?? []).reduce(
		(sum, column) => sum + column.getSize(),
		0,
	);

	const viewportLeft = isActuallyRtl
		? containerRect.left + rightPinnedWidth + viewportOffset
		: containerRect.left + leftPinnedWidth + viewportOffset;
	const viewportRight = isActuallyRtl
		? containerRect.right - leftPinnedWidth - viewportOffset
		: containerRect.right - rightPinnedWidth - viewportOffset;

	if (cellRect.left >= viewportLeft && cellRect.right <= viewportRight) return;

	const isClippedLeft = cellRect.left < viewportLeft;
	const isClippedRight = cellRect.right > viewportRight;

	let scrollDelta = 0;

	if (!direction) {
		if (isClippedRight) {
			scrollDelta = cellRect.right - viewportRight;
		} else if (isClippedLeft) {
			scrollDelta = -(viewportLeft - cellRect.left);
		}
	} else {
		const shouldScrollRight = isActuallyRtl
			? direction === "right" || direction === "home"
			: direction === "right" || direction === "end";

		scrollDelta = shouldScrollRight
			? cellRect.right - viewportRight
			: -(viewportLeft - cellRect.left);
	}

	container.scrollLeft += scrollDelta;
}

// ---------------------------------------------------------------------------
// Clipboard: TSV
// ---------------------------------------------------------------------------

function countTabs(value: string): number {
	let count = 0;
	for (let index = 0; index < value.length; index++) if (value[index] === "\t") count++;
	return count;
}

/**
 * Parse clipboard TSV into a rectangle of raw strings.
 *
 * Two grammars, chosen by a cheap sniff, exactly as upstream: text that opens with `"` or contains
 * `\t"` is parsed as quoted TSV (escaped `""`, embedded tabs and newlines inside a field);
 * everything else is split on tabs, with ragged lines joined until they reach the column count so a
 * value containing a bare newline survives.
 */
export function parseTsv(text: string, fallbackColumnCount: number): string[][] {
	if (text.startsWith('"') || text.includes('\t"')) {
		const rows: string[][] = [];
		let currentRow: string[] = [];
		let currentField = "";
		let inQuotes = false;
		let index = 0;

		function pushRow(): void {
			currentRow.push(currentField);
			if (currentRow.length > 1 || currentRow.some((field) => field.length > 0)) {
				rows.push(currentRow);
			}
			currentRow = [];
			currentField = "";
		}

		while (index < text.length) {
			const char = text[index];
			const nextChar = text[index + 1];

			if (inQuotes) {
				if (char === '"' && nextChar === '"') {
					currentField += '"';
					index += 2;
				} else if (char === '"') {
					inQuotes = false;
					index++;
				} else {
					currentField += char;
					index++;
				}
				continue;
			}

			if (char === '"' && currentField === "") {
				inQuotes = true;
				index++;
			} else if (char === "\t") {
				currentRow.push(currentField);
				currentField = "";
				index++;
			} else if (char === "\n") {
				pushRow();
				index++;
			} else if (char === "\r" && nextChar === "\n") {
				pushRow();
				index += 2;
			} else {
				currentField += char;
				index++;
			}
		}

		pushRow();

		return rows;
	}

	const lines = text.split("\n");
	let maxTabCount = 0;
	for (const line of lines) {
		const tabs = countTabs(line);
		if (tabs > maxTabCount) maxTabCount = tabs;
	}
	const columnCount = maxTabCount > 0 ? maxTabCount + 1 : fallbackColumnCount;
	if (columnCount <= 0) return [];

	const expectedTabCount = columnCount - 1;
	const rows: string[][] = [];
	let buffer = "";
	let bufferTabCount = 0;

	for (const line of lines) {
		const tabs = countTabs(line);

		if (tabs === expectedTabCount) {
			if (buffer && bufferTabCount === expectedTabCount) rows.push(buffer.split("\t"));
			buffer = "";
			bufferTabCount = 0;
			rows.push(line.split("\t"));
		} else {
			buffer = buffer ? `${buffer}\n${line}` : line;
			bufferTabCount += tabs;
			if (bufferTabCount === expectedTabCount) {
				rows.push(buffer.split("\t"));
				buffer = "";
				bufferTabCount = 0;
			}
		}
	}

	if (buffer && bufferTabCount === expectedTabCount) rows.push(buffer.split("\t"));

	return rows.length > 0
		? rows
		: lines.filter((line) => line.length > 0).map((line) => line.split("\t"));
}

/**
 * Serialize a selection to row-major TSV.
 *
 * Non-navigable columns are dropped before anything else, so a `select` checkbox column never
 * lands on the clipboard. Returns `null` when nothing navigable was selected.
 */
export function serializeCellsToTsv(params: {
	cellKeys: Iterable<string>;
	getCellValue: (rowIndex: number, columnId: string) => unknown;
	getCellOpts: (columnId: string) => CellOpts | undefined;
}): { tsv: string; cellKeys: string[] } | null {
	const { cellKeys, getCellValue, getCellOpts } = params;

	const selectedColumnIds: string[] = [];
	const seenColumnIds = new Set<string>();
	const cellData = new Map<string, string>();
	const rowIndices = new Set<number>();
	const navigableCells: string[] = [];

	for (const cellKey of cellKeys) {
		const { rowIndex, columnId } = parseCellKey(cellKey);
		if (!columnId || NON_NAVIGABLE_COLUMN_IDS.has(columnId)) continue;

		navigableCells.push(cellKey);

		if (!seenColumnIds.has(columnId)) {
			seenColumnIds.add(columnId);
			selectedColumnIds.push(columnId);
		}
		rowIndices.add(rowIndex);

		const value = getCellValue(rowIndex, columnId);
		const variant = getCellOpts(columnId)?.variant;

		let serialized: string;
		if (variant === "file" || variant === "multi-select") {
			serialized = value ? JSON.stringify(value) : "";
		} else if (value instanceof Date) {
			serialized = value.toISOString();
		} else {
			serialized = String(value ?? "");
		}

		cellData.set(cellKey, serialized);
	}

	if (navigableCells.length === 0) return null;

	const colIndices = new Set<number>();
	for (const cellKey of navigableCells) {
		const { columnId } = parseCellKey(cellKey);
		const colIndex = selectedColumnIds.indexOf(columnId);
		if (colIndex >= 0) colIndices.add(colIndex);
	}

	const sortedRowIndices = [...rowIndices].sort((a, b) => a - b);
	const sortedColumnIds = [...colIndices]
		.sort((a, b) => a - b)
		.map((index) => selectedColumnIds[index] ?? "");

	const tsv = sortedRowIndices
		.map((rowIndex) =>
			sortedColumnIds
				.map((columnId) => cellData.get(getCellKey(rowIndex, columnId)) ?? "")
				.join("\t"),
		)
		.join("\n");

	return { tsv, cellKeys: navigableCells };
}

/** What a pasted string becomes for a given cell variant, or the instruction to skip it. */
export type CoercedPasteValue = { value: unknown } | { skip: true };

/** Whether {@link coercePastedValue} rejected the value. */
export function getIsSkippedPaste(result: CoercedPasteValue): result is { skip: true } {
	return "skip" in result;
}

/**
 * Validate and convert one pasted string for one cell variant.
 *
 * Ported one-for-one from the `switch` inside upstream's `onCellsPaste`, extracted so the nine
 * rule sets can be driven directly by tests — jsdom has no clipboard to drive them through.
 */
export function coercePastedValue(raw: string, cellOpts: CellOpts | undefined): CoercedPasteValue {
	const variant = cellOpts?.variant;

	switch (variant) {
		case "number": {
			if (!raw) return { value: null };
			const parsed = Number.parseFloat(raw);
			return Number.isNaN(parsed) ? { skip: true } : { value: parsed };
		}

		case "checkbox": {
			if (!raw) return { value: false };
			const lower = raw.toLowerCase();
			if (!VALID_BOOLEANS.has(lower)) return { skip: true };
			return { value: TRUTHY_BOOLEANS.has(lower) };
		}

		case "date": {
			if (!raw) return { value: null };
			const date = new Date(raw);
			return Number.isNaN(date.getTime()) ? { skip: true } : { value: date };
		}

		case "select": {
			const options = cellOpts?.variant === "select" ? cellOpts.options : [];
			if (!raw) return { value: "" };
			const matched = matchSelectOption(raw, options);
			return matched ? { value: matched } : { skip: true };
		}

		case "multi-select": {
			const options = cellOpts?.variant === "multi-select" ? cellOpts.options : [];
			let values: string[] = [];
			try {
				const parsed: unknown = JSON.parse(raw);
				if (Array.isArray(parsed)) {
					values = parsed.filter((entry): entry is string => typeof entry === "string");
				}
			} catch {
				values = raw ? raw.split(",").map((entry) => entry.trim()) : [];
			}

			const validated = values
				.map((entry) => matchSelectOption(entry, options))
				.filter((entry): entry is string => Boolean(entry));

			if (values.length > 0 && validated.length === 0) return { skip: true };
			return { value: validated };
		}

		case "file": {
			if (!raw) return { value: [] };
			try {
				const parsed: unknown = JSON.parse(raw);
				if (!Array.isArray(parsed)) return { skip: true };
				const validFiles = parsed.filter(getIsFileCellData);
				if (parsed.length > 0 && validFiles.length === 0) return { skip: true };
				return { value: validFiles };
			} catch {
				return { skip: true };
			}
		}

		case "url": {
			if (!raw) return { value: "" };
			const firstChar = raw[0];
			if (firstChar === "[" || firstChar === "{") return { skip: true };
			try {
				new URL(raw);
				return { value: raw };
			} catch {
				return DOMAIN_REGEX.test(raw) ? { value: raw } : { skip: true };
			}
		}

		default: {
			if (!raw) return { value: "" };

			if (ISO_DATE_REGEX.test(raw)) {
				const date = new Date(raw);
				if (!Number.isNaN(date.getTime())) return { value: date.toLocaleDateString() };
			}

			const firstChar = raw[0];
			if (firstChar === "[" || firstChar === "{" || firstChar === "t" || firstChar === "f") {
				try {
					const parsed: unknown = JSON.parse(raw);
					if (Array.isArray(parsed)) {
						if (parsed.length > 0 && parsed.every(getIsFileCellData)) {
							return { value: parsed.map((file) => file.name).join(", ") };
						}
						if (parsed.every((entry) => typeof entry === "string")) {
							return { value: (parsed as string[]).join(", ") };
						}
					} else if (typeof parsed === "boolean") {
						return { value: parsed ? "Checked" : "Unchecked" };
					}
				} catch {
					const lower = raw.toLowerCase();
					if (lower === "true" || lower === "false") {
						return { value: lower === "true" ? "Checked" : "Unchecked" };
					}
				}
			}

			return { value: raw };
		}
	}
}

/**
 * Build the next data array from a batch of cell writes.
 *
 * The row model is post-sort/post-filter, so `getOriginal` maps each `rowIndex` back onto the row
 * object the consumer handed in; that object's position in `data` is the index actually written.
 * Rows nobody touched are carried over by reference, and touched rows are shallow-copied — the
 * consumer's array and row objects are never mutated.
 */
export function applyCellUpdates<TData>(params: {
	data: TData[];
	getOriginal: (rowIndex: number) => TData | undefined;
	updates: CellUpdate[];
}): TData[] {
	const { data, getOriginal, updates } = params;

	const rowUpdates = new Map<number, Omit<CellUpdate, "rowIndex">[]>();
	for (const update of updates) {
		const original = getOriginal(update.rowIndex);
		const originalIndex = original === undefined ? -1 : data.indexOf(original);
		const targetIndex = originalIndex !== -1 ? originalIndex : update.rowIndex;

		const existing = rowUpdates.get(targetIndex) ?? [];
		existing.push({ columnId: update.columnId, value: update.value });
		rowUpdates.set(targetIndex, existing);
	}

	const next: TData[] = new Array<TData>(data.length);

	for (let index = 0; index < data.length; index++) {
		const existingRow = data[index];
		if (existingRow == null) continue;

		const rowUpdate = rowUpdates.get(index);
		if (!rowUpdate) {
			next[index] = existingRow;
			continue;
		}

		const updatedRow: Record<string, unknown> = { ...existingRow };
		for (const { columnId, value } of rowUpdate) {
			updatedRow[columnId] = value;
		}
		next[index] = updatedRow as TData;
	}

	return next;
}

/** What Delete/Backspace, the context menu's Clear and cut-source clearing write per variant. */
export function getEmptyCellValue(variant: CellOpts["variant"] | undefined): unknown {
	if (variant === "multi-select" || variant === "file") return [];
	if (variant === "number" || variant === "date") return null;
	if (variant === "checkbox") return false;
	return "";
}

/**
 * Clamp a committed `number` cell value into the bounds its column declared.
 *
 * A `<input type="number">`'s `min`/`max` attributes only drive the spinner and native form
 * validation — a typed `5000` still reaches `change`/`blur` untouched — so the bounds have to be
 * enforced when the edit commits, or a column declaring `max: 1000` would store `5000`.
 *
 * @param value The parsed editor value, or `null` for an emptied cell.
 * @param bounds The column's `min`/`max`, when it declared any.
 */
export function clampCellNumber(
	value: number | null,
	bounds: { min?: number; max?: number } | undefined,
): number | null {
	if (value === null || Number.isNaN(value)) return null;

	let next = value;
	if (bounds?.min !== undefined) next = Math.max(bounds.min, next);
	if (bounds?.max !== undefined) next = Math.min(bounds.max, next);
	return next;
}

/** Exact value, then case-insensitive value, then case-insensitive label. */
export function matchSelectOption(value: string, options: CellSelectOption[]): string | undefined {
	return options.find(
		(option) =>
			option.value === value ||
			option.value.toLowerCase() === value.toLowerCase() ||
			option.label.toLowerCase() === value.toLowerCase(),
	)?.value;
}

/** The guard a pasted `file` cell entry must pass. */
export function getIsFileCellData(item: unknown): item is FileCellData {
	return (
		!!item &&
		typeof item === "object" &&
		"id" in item &&
		"name" in item &&
		"size" in item &&
		"type" in item
	);
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

/**
 * Whether an element lives inside a cell editor or a floating layer. Focus leaving the grid *into*
 * one of these must not blur the focused cell.
 */
export function getIsInPopover(element: unknown): boolean {
	if (!(element instanceof Element)) return false;

	return (
		element.closest("[data-grid-cell-editor]") !== null ||
		element.closest("[data-grid-popover]") !== null ||
		element.closest('[data-slot="dropdown-menu-content"]') !== null ||
		element.closest('[data-slot="popover-content"]') !== null ||
		element.closest('[data-slot="dialog-content"]') !== null
	);
}

/**
 * The `href` a `url` cell links to. Dangerous protocols resolve to `''` so the anchor is inert; a
 * bare domain gets an `https://` prefix.
 */
export function getUrlHref(urlString: string): string {
	if (!urlString || urlString.trim() === "") return "";

	const trimmed = urlString.trim();

	if (/^(javascript|data|vbscript|file):/i.test(trimmed)) return "";

	if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;

	return `https://${trimmed}`;
}

/**
 * Parse `YYYY-MM-DD` as a **local** date, with no timezone drift.
 *
 * A date the `Date` constructor silently corrected (Feb 30 → Mar 1/2) is rejected rather than
 * accepted, so a `date` cell never shows a day the consumer did not write.
 */
export function parseLocalDate(dateStr: unknown): Date | null {
	if (!dateStr) return null;
	if (dateStr instanceof Date) return dateStr;
	if (typeof dateStr !== "string") return null;

	const [year, month, day] = dateStr.split("-").map(Number);
	if (!year || !month || !day) return null;

	const date = new Date(year, month - 1, day);
	if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
		return null;
	}
	return date;
}

/** `Date` → `YYYY-MM-DD`, using local components. */
export function formatDateToString(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

/** What a `date` cell shows at rest. Unparseable input is echoed back verbatim. */
export function formatDateForDisplay(dateStr: unknown): string {
	if (!dateStr) return "";
	const date = parseLocalDate(dateStr);
	if (!date) return typeof dateStr === "string" ? dateStr : "";
	return date.toLocaleDateString();
}

/** `1536` → `1.5 KB` — the shared house formatter at one decimal. */
export function formatFileSize(bytes: number): string {
	return formatBytes(bytes, 1);
}

/** The badge icon for a stored file's MIME type. */
export function getFileIcon(type: string): DataGridIcon {
	if (type.startsWith("image/")) return FileImageIcon;
	if (type.startsWith("video/")) return FilePlayIcon;
	if (type.startsWith("audio/")) return FileMusicIcon;
	if (type.includes("pdf")) return FileTextIcon;
	if (type.includes("zip") || type.includes("rar")) return FileArchiveIcon;
	if (type.includes("word") || type.includes("document") || type.includes("doc")) {
		return FileTextIcon;
	}
	if (type.includes("sheet") || type.includes("excel") || type.includes("xls")) {
		return FileSpreadsheetIcon;
	}
	if (type.includes("presentation") || type.includes("powerpoint") || type.includes("ppt")) {
		return PresentationIcon;
	}
	return FileIcon;
}
