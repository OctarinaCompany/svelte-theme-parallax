import {
	functionalUpdate,
	type RowData,
	type Table,
	type TableState,
	type Updater,
} from "@tanstack/table-core";

/**
 * The runes bridge under `@tanstack/table-core`: one table instance created **once** and never
 * re-created, with reactivity flowing through `table.options`.
 *
 * Lives in `src/lib/shared/` (registry:lib pattern): consumed by `data-table`'s `DataTableState`
 * and `data-grid`'s `DataGridState`, kept out of either folder so a registry install of one does
 * not drag in the other.
 *
 * HOW REACTIVITY FLOWS — `data`, `columns` and `state` are redefined as getter properties that read
 * the owner's `$state.raw` slices, so every `table.getRowModel()` / `column.getIsSorted()` /
 * `table.getState()` call made inside a template or a `$derived` registers a fine-grained
 * dependency and re-runs when the slice it touched changes (research D-02).
 *
 * WHY THE GETTERS ARE INSTALLED IN {@link TanstackTableBridge.attach}, AFTER `createTable` — the
 * owner builds its `TableOptionsResolved` (row models, defaults and change handlers differ per
 * consumer), calls `createTable`, then attaches. `createTable` merges the options object it is
 * handed with `{ ...defaultOptions, ...options }`, and a spread evaluates getters and copies their
 * values — installing them any earlier would freeze the bridge at its initial state.
 */

/**
 * One `$state.raw` slice the owner materialises as its own field: how the bridge reads it into the
 * composed {@link TanstackTableBridge.getState} and replaces it wholesale (seeding, updater
 * resolution).
 */
export type TableStateSliceMap = {
	readonly [K in keyof TableState]?: {
		readonly get: () => TableState[K];
		readonly set: (next: TableState[K]) => void;
	};
};

export type TanstackTableBridgeOptions = {
	/** The slices the owner owns as `$state.raw` fields, by table-core state key. */
	readonly slices: TableStateSliceMap;
	/** The consumer's `data`, resolved (value or getter already unwrapped). */
	readonly getData: () => readonly unknown[];
	/** The consumer's `columns`, resolved. */
	readonly getColumns: () => readonly unknown[];
	/** The consumer's controlled `state` option, resolved — `{}` when none was given. */
	readonly getControlledState: () => Partial<TableState>;
};

export class TanstackTableBridge<TData extends RowData> {
	#options: TanstackTableBridgeOptions;

	/**
	 * The slices the owner does not own — `expanded`, `grouping`, `globalFilter`, `columnSizing` and
	 * friends. Seeded from `table.initialState` inside {@link getState} and updated through
	 * {@link onStateChange}, so a feature the owner does not surface still behaves normally.
	 */
	#restState = $state.raw<Partial<TableState>>({});

	// Assigned in `attach`, which the owner's constructor calls right after `createTable` — before
	// any handler or getter installed here can run. The assertion tells svelte-check the same.
	#table!: Table<TData>;

	constructor(options: TanstackTableBridgeOptions) {
		this.#options = options;
	}

	/** `onStateChange` for the resolved options: routes whole-state writes into `#restState`. */
	readonly onStateChange = (updater: Updater<TableState>): void => {
		this.#restState = functionalUpdate(updater, this.getState());
	};

	/**
	 * The composed `TableState` the `state` getter serves: every feature's resolved initial value,
	 * overlaid by `#restState`, then by the owner's slices, then by the consumer's controlled state
	 * — the same precedence both owners implemented before the bridge existed.
	 */
	getState(): TableState {
		const state: TableState = { ...this.#table.initialState, ...this.#restState };
		for (const [key, slice] of Object.entries(this.#options.slices)) {
			// Double cast: `TableState` has no index signature, so TS refuses the direct assertion.
			if (slice) (state as unknown as Record<string, unknown>)[key] = slice.get();
		}
		return { ...state, ...this.#options.getControlledState() };
	}

	/**
	 * A change handler for one slice, for the owner's `on<Slice>Change` table option: resolves the
	 * `Updater<T>` table-core hands it against the current slice, assigns the slice, then calls
	 * `onChange` with the **resolved next value** — never the updater function (data-model.md
	 * § State transitions).
	 *
	 * Slices whose change must do more than assign-and-notify (data-grid's `rowSelection` projects
	 * onto the cell selection) keep their own bespoke handler in the owner and use the bridge only
	 * for seeding and `getState` composition.
	 */
	sliceHandler<K extends keyof TableState>(
		key: K,
		onChange?: (next: TableState[K]) => void,
	): (updater: Updater<TableState[K]>) => void {
		const slice = this.#options.slices[key];
		if (!slice) throw new Error(`No slice registered for \`${String(key)}\`.`);
		return (updater) => {
			const next = functionalUpdate(updater, slice.get());
			slice.set(next);
			onChange?.(next);
		};
	}

	/**
	 * Adopt the freshly created table: seed every registered slice from `table.initialState` — the
	 * caller's `initialState` merged with every feature's defaults, so the one place that knows the
	 * resolved shape of every slice — then install the reactive getters on `table.options` (see the
	 * module comment for why this must happen after `createTable`).
	 *
	 * @param extraOptionGetters Additional option properties to serve through getters — e.g.
	 * data-grid's direction-reactive `columnResizeDirection`.
	 */
	attach(table: Table<TData>, extraOptionGetters?: Record<string, () => unknown>): void {
		this.#table = table;

		for (const [key, slice] of Object.entries(this.#options.slices)) {
			if (slice)
				(slice.set as (next: unknown) => void)(table.initialState[key as keyof TableState]);
		}

		const descriptors: PropertyDescriptorMap = {
			data: { get: () => this.#options.getData(), enumerable: true, configurable: true },
			columns: { get: () => this.#options.getColumns(), enumerable: true, configurable: true },
			state: { get: () => this.getState(), enumerable: true, configurable: true },
		};
		for (const [name, get] of Object.entries(extraOptionGetters ?? {})) {
			descriptors[name] = { get, enumerable: true, configurable: true };
		}
		Object.defineProperties(table.options, descriptors);
	}
}
