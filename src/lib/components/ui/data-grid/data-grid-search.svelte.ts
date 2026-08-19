import { SvelteMap, SvelteSet } from "svelte/reactivity";

import { getCellKey } from "./data-grid-utils.js";
import type { CellPosition } from "./types.js";

/** How long the search box waits after the last keystroke before running a search. */
export const SEARCH_DEBOUNCE_MS = 150;

export type DataGridSearchStateProps = {
	/** How many rows the current row model holds. */
	getRowCount: () => number;
	/** Every column id, in render order — matches are collected row-major along this axis. */
	getColumnIds: () => string[];
	/** The value stored at a cell. */
	getCellValue: (rowIndex: number, columnId: string) => unknown;
	/** Bring a matched row into view. */
	scrollToIndex: (rowIndex: number) => void;
	/** Move grid focus onto a match. */
	focusCell: (rowIndex: number, columnId: string) => void;
	/** Restore focus to the grid container when the box closes. */
	restoreFocus: () => void;
};

/**
 * Find-in-grid: the query, the row-major list of matching cells, and the cursor into it.
 *
 * `setQuery` is debounced by {@link SEARCH_DEBOUNCE_MS} before it runs `search`, exactly as
 * upstream's `useDebouncedCallback(…, 150)` does, so typing does not rescan the row model on every
 * keystroke.
 */
export class DataGridSearchState {
	#props: DataGridSearchStateProps;
	#debounceTimer: ReturnType<typeof setTimeout> | null = null;

	/** Whether the search box is showing. */
	open = $state(false);
	/** The raw input value. */
	query = $state("");
	/** Every matching cell, row-major. */
	matches = $state.raw<CellPosition[]>([]);
	/** Index into {@link matches}; `-1` when there is none. */
	matchIndex = $state(-1);

	/** The match currently highlighted, if any. */
	readonly activeMatch: CellPosition | null = $derived(
		this.matchIndex < 0 ? null : (this.matches[this.matchIndex] ?? null),
	);

	/** `rowIndex → matched column ids`, so a row can answer "do I contain a match?" in O(1). */
	readonly matchesByRow: Map<number, Set<string>> | null = $derived.by(() => {
		if (this.matches.length === 0) return null;
		const rowMap = new SvelteMap<number, Set<string>>();
		for (const match of this.matches) {
			let columnSet = rowMap.get(match.rowIndex);
			if (!columnSet) {
				columnSet = new SvelteSet<string>();
				rowMap.set(match.rowIndex, columnSet);
			}
			columnSet.add(match.columnId);
		}
		return rowMap;
	});

	/** The matched cell keys, for the per-cell highlight lookup. */
	readonly #matchKeys: Set<string> = $derived(
		new SvelteSet(this.matches.map((match) => getCellKey(match.rowIndex, match.columnId))),
	);

	constructor(props: DataGridSearchStateProps) {
		this.#props = props;
	}

	#clearTimer(): void {
		if (this.#debounceTimer === null) return;
		clearTimeout(this.#debounceTimer);
		this.#debounceTimer = null;
	}

	/**
	 * Open or close the box. Closing clears the query and matches and moves grid focus onto the
	 * match that was active, so Escape leaves the user where they were looking.
	 */
	setOpen(open: boolean): void {
		if (open) {
			this.open = true;
			return;
		}

		const currentMatch = this.activeMatch;

		this.#clearTimer();
		this.open = false;
		this.query = "";
		this.matches = [];
		this.matchIndex = -1;

		if (currentMatch) {
			this.#props.focusCell(currentMatch.rowIndex, currentMatch.columnId);
		} else {
			this.#props.restoreFocus();
		}
	}

	/** Record the typed query and schedule the debounced search. */
	setQuery(query: string): void {
		this.query = query;
		this.#clearTimer();
		this.#debounceTimer = setTimeout(() => {
			this.#debounceTimer = null;
			this.search(query);
		}, SEARCH_DEBOUNCE_MS);
	}

	/** Rescan the row model now, bypassing the debounce. */
	search(query: string): void {
		if (!query.trim()) {
			this.matches = [];
			this.matchIndex = -1;
			return;
		}

		const lowerQuery = query.toLowerCase();
		const columnIds = this.#props.getColumnIds();
		const rowCount = this.#props.getRowCount();
		const matches: CellPosition[] = [];

		for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
			for (const columnId of columnIds) {
				const value = this.#props.getCellValue(rowIndex, columnId);
				if (
					String(value ?? "")
						.toLowerCase()
						.includes(lowerQuery)
				) {
					matches.push({ rowIndex, columnId });
				}
			}
		}

		this.matches = matches;
		this.matchIndex = matches.length > 0 ? 0 : -1;

		const firstMatch = matches[0];
		if (firstMatch) this.#props.scrollToIndex(firstMatch.rowIndex);
	}

	/** Advance to the next match, wrapping past the end. */
	next(): void {
		if (this.matches.length === 0) return;
		const nextIndex = (this.matchIndex + 1) % this.matches.length;
		this.#goTo(nextIndex);
	}

	/** Step back to the previous match, wrapping past the start. */
	prev(): void {
		if (this.matches.length === 0) return;
		const prevIndex = this.matchIndex - 1 < 0 ? this.matches.length - 1 : this.matchIndex - 1;
		this.#goTo(prevIndex);
	}

	#goTo(index: number): void {
		const match = this.matches[index];
		if (!match) return;
		this.matchIndex = index;
		this.#props.scrollToIndex(match.rowIndex);
	}

	/** Whether a cell matches the current query. */
	isMatch(rowIndex: number, columnId: string): boolean {
		return this.#matchKeys.has(getCellKey(rowIndex, columnId));
	}

	/** Whether a cell is the match currently being navigated to. */
	isActiveMatch(rowIndex: number, columnId: string): boolean {
		const active = this.activeMatch;
		return active?.rowIndex === rowIndex && active?.columnId === columnId;
	}

	/** Cancel a pending debounced search. Called from the root's teardown. */
	destroy(): void {
		this.#clearTimer();
	}
}
