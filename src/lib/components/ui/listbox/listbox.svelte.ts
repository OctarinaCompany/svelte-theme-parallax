import type { Direction } from "$lib/components/ui/direction-provider/index.js";
import { getContext, hasContext, setContext, untrack } from "svelte";
import { SvelteSet } from "svelte/reactivity";

/**
 * The Root's public value type: a plain string in single-selection mode, an array when `multiple`.
 * Internally every consumer sees a normalised `readonly string[]` ({@link ListboxRootState.values}).
 */
export type ListboxValue<Multiple extends boolean = false> = Multiple extends true
	? string[]
	: string;

/** Upstream's `orientation` union: a column, a row, or a two-axis grid. */
export type ListboxOrientation = "horizontal" | "vertical" | "mixed";

/**
 * One registered `<Listbox.Item>`.
 *
 * A plain snapshot rather than a bag of getters: the item re-registers whenever any of these move,
 * so the collection never has to reach back into a component that may already be gone.
 */
export type ListboxItemData = {
	/** The rendered element — `null` until the item mounts. Collection key and focus target. */
	readonly element: HTMLElement | null;
	readonly value: string;
	/** The item's own `disabled`, OR-ed with the root's. */
	readonly disabled: boolean;
	readonly onSelect: ((value: string) => void) | undefined;
	/** The item's trimmed text content — the typeahead haystack. */
	readonly textValue: string;
};

/** A {@link ListboxItemData} whose element is in the DOM — what navigation and selection walk. */
export type ListboxMountedItem = ListboxItemData & { readonly element: HTMLElement };

/** Upstream's `compareNodePosition` (the shared-utils reference `lib/node.ts`). */
function compareNodePosition(a: Node, b: Node): number {
	const position = a.compareDocumentPosition(b);
	if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
	if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
	return 0;
}

/**
 * Normalise the Root's public value to the array shape every part works with:
 * `undefined → []`, `'' → []`, `'x' → ['x']`, `string[] → as-is`.
 */
export function normalizeListboxValue(value: string | string[] | undefined): string[] {
	if (Array.isArray(value)) return value;
	if (typeof value === "string") return value === "" ? [] : [value];
	return [];
}

/**
 * Upstream's `useCollection` — a DOM-ordered item registry.
 * Deliberately mirrors `ComboboxCollection`'s `register()` / `getItems()` contract so
 * the two read identically, with a listbox-shaped {@link ListboxItemData}.
 */
export class ListboxCollection {
	// `$state.raw`: the entries are replaced wholesale, and a deep proxy would make the teardown's
	// identity comparison against the original snapshot fail.
	#items = $state.raw<readonly ListboxItemData[]>([]);

	/** How many items are registered, mounted or not. */
	readonly size: number = $derived(this.#items.length);

	/**
	 * Called from the item's `$effect`; the returned thunk is its teardown. Both reads of the list
	 * are untracked: the caller is an effect, and subscribing it to the very list it is appending to
	 * would re-run it forever.
	 */
	register(item: ListboxItemData): () => void {
		this.#items = [...untrack(() => this.#items), item];
		return () => {
			this.#items = untrack(() => this.#items).filter((registered) => registered !== item);
		};
	}

	/** Every mounted item, in document order. */
	getItems(): ListboxMountedItem[] {
		return this.#items
			.filter((item): item is ListboxMountedItem => item.element !== null)
			.sort((a, b) => compareNodePosition(a.element, b.element));
	}

	/** The mounted items keyboard navigation and selection are allowed to land on. */
	getEnabledItems(): ListboxMountedItem[] {
		return this.getItems().filter((item) => !item.disabled);
	}
}

/** Upstream `findEnabledItem`, ported unchanged. */
export function findEnabledItem(
	items: ListboxMountedItem[],
	{
		startingIndex,
		decrement = false,
		loop = false,
	}: {
		startingIndex: number;
		decrement?: boolean;
		loop?: boolean;
	},
): ListboxMountedItem | null {
	const len = items.length;
	let index = startingIndex;

	do {
		index = decrement ? index - 1 : index + 1;

		if (loop) {
			if (index < 0) {
				index = len - 1;
			} else if (index >= len) {
				index = 0;
			}
		} else {
			if (index < 0 || index >= len) {
				return items[decrement ? 0 : len - 1] ?? null;
			}
		}

		const item = items[index];

		if (item && !item.disabled) {
			return item;
		}
	} while (index !== startingIndex);

	return items[startingIndex] ?? null;
}

/** Upstream `getMinItemValue` — the first enabled value. */
export function getMinItemValue(items: ListboxMountedItem[]): string | null {
	for (const item of items) {
		if (!item.disabled) return item.value;
	}

	return items[0]?.value ?? null;
}

/** Upstream `getMaxItemValue` — the last enabled value. */
export function getMaxItemValue(items: ListboxMountedItem[]): string | null {
	for (let i = items.length - 1; i >= 0; i--) {
		const item = items[i];
		if (item && !item.disabled) return item.value;
	}

	return items[items.length - 1]?.value ?? null;
}

/**
 * Upstream `calculateGridLayout`, ported verbatim including the 10px
 * same-row tolerance. Measured lazily, from the arrow-key handler only, so no `$derived` ever
 * triggers a synchronous reflow.
 */
export function calculateGridLayout(
	items: ListboxMountedItem[],
	orientation: string,
): { columnCount: number; rowCount: number } {
	if (orientation !== "mixed" || items.length <= 1) {
		return { columnCount: 1, rowCount: items.length };
	}

	const elements = items.map((item) => item.element);

	const rect1 = elements[0]?.getBoundingClientRect();
	const rect2 = elements[1]?.getBoundingClientRect();

	if (!rect1 || !rect2) {
		return { columnCount: 1, rowCount: items.length };
	}

	const sameRow = Math.abs(rect1.top - rect2.top) < 10;
	if (!sameRow) {
		return { columnCount: 1, rowCount: items.length };
	}

	const firstRowY = rect1.top;
	let colCount = 0;

	for (const element of elements) {
		const rect = element.getBoundingClientRect();
		if (Math.abs(rect.top - firstRowY) < 10) {
			colCount++;
		} else {
			break;
		}
	}

	const columnCount = Math.max(1, colCount);
	const rowCount = Math.ceil(items.length / columnCount);

	return { columnCount, rowCount };
}

/** How long a typed character stays in the typeahead buffer, in milliseconds. */
export const LISTBOX_TYPEAHEAD_RESET_MS = 1000;

/**
 * The buffered character matcher behind APG typeahead. Upstream has no equivalent;
 * the 1000 ms window is the convention every other ported typeahead in this repo uses.
 */
export class ListboxTypeahead {
	/** The characters typed since the last reset, lower-cased. */
	search = $state("");

	#timer: ReturnType<typeof setTimeout> | null = null;

	/**
	 * Append `key` to the buffer and return the value of the next enabled item whose `textValue`
	 * starts with it, scanning from the item after `from` and cycling. `null` when nothing matches.
	 */
	handle(key: string, items: ListboxMountedItem[], from: string | null): string | null {
		const search = this.search + key.toLowerCase();
		this.search = search;

		if (this.#timer !== null) clearTimeout(this.#timer);
		this.#timer = setTimeout(() => this.reset(), LISTBOX_TYPEAHEAD_RESET_MS);

		if (items.length === 0) return null;

		// Repeating one character cycles through the items starting with it, rather than looking for
		// an item literally named "hhh" — the APG rule native `<select>` also follows.
		const isRepeated = search.length > 1 && [...search].every((char) => char === search[0]);
		const needle = isRepeated ? (search[0] ?? "") : search;

		const currentIndex = from ? items.findIndex((item) => item.value === from) : -1;
		// A fresh single character moves past the current item so repeats advance; a growing buffer
		// re-matches from the current item so the second character narrows rather than skips.
		const offset = currentIndex === -1 || needle.length > 1 ? 0 : 1;
		const start = currentIndex === -1 ? 0 : currentIndex + offset;

		for (let step = 0; step < items.length; step++) {
			const item = items[(start + step) % items.length];
			if (item && item.textValue.toLowerCase().startsWith(needle)) return item.value;
		}

		return null;
	}

	/** Empty the buffer and drop the pending reset, so no timer outlives the component. */
	reset(): void {
		if (this.#timer !== null) {
			clearTimeout(this.#timer);
			this.#timer = null;
		}
		this.search = "";
	}
}

export type ListboxRootStateProps = {
	/** The normalised value: `[]`, `[one]` or the whole array when `multiple`. */
	readonly getValues: () => readonly string[];
	readonly setValues: (values: string[]) => void;
	readonly getDisabled: () => boolean;
	readonly getLoop: () => boolean;
	readonly getMultiple: () => boolean;
	readonly getOrientation: () => ListboxOrientation;
	readonly getVirtual: () => boolean;
	readonly getDir: () => Direction;
};

/** The keys the root consumes when the orientation makes them meaningful. */
function isNavigationKey(key: string, orientation: ListboxOrientation): boolean {
	const isVertical = orientation === "vertical" || orientation === "mixed";
	const isHorizontal = orientation === "horizontal" || orientation === "mixed";

	switch (key) {
		case "Home":
		case "End":
			return true;
		case "ArrowUp":
		case "ArrowDown":
		case "PageUp":
		case "PageDown":
			return isVertical;
		case "ArrowLeft":
		case "ArrowRight":
			return isHorizontal;
		default:
			return false;
	}
}

/**
 * One instance per `<Listbox.Root>`, published on the root context.
 *
 * Replaces upstream's `createSelectableStore` + `useSyncExternalStore` + `useCollection`
 * and its whole `onKeyDown`. Svelte's signals already
 * give the per-item granularity the external store existed to buy back, so the selection is read
 * straight from the Root's value prop and never mirrored.
 */
export class ListboxRootState {
	// $derived below is lazy at runtime (evaluated only when the field is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: ListboxRootStateProps;

	readonly collection = new ListboxCollection();
	readonly typeahead = new ListboxTypeahead();

	/** Which item holds roving focus right now. Cleared by `Escape`, blur and `Shift+Tab`. */
	focusedValue = $state<string | null>(null);
	/** Pointer or keyboard highlight, independent of both selection and DOM focus. */
	highlightedValue = $state<string | null>(null);
	/** Where `Shift`+navigation measures its range from — the last non-`Shift` focus move. */
	anchorValue = $state<string | null>(null);

	/**
	 * The option `Tab` returns to. Survives the blur that clears {@link focusedValue}, which is what
	 * makes tabbing back into the listbox land where the user left.
	 */
	#remembered: string | null = null;
	/** Non-reactive latch so the `focusin` that `Shift+Tab` triggers does not re-enter the list. */
	#isShiftTab = false;

	readonly values: readonly string[] = $derived(this.#props.getValues());
	readonly disabled: boolean = $derived(this.#props.getDisabled());
	readonly loop: boolean = $derived(this.#props.getLoop());
	readonly multiple: boolean = $derived(this.#props.getMultiple());
	readonly orientation: ListboxOrientation = $derived(this.#props.getOrientation());
	readonly virtual: boolean = $derived(this.#props.getVirtual());
	readonly dir: Direction = $derived(this.#props.getDir());

	/**
	 * O(1) `isSelected` lookups without a second source of truth: rebuilt from {@link values} on
	 * every change rather than mutated, so it can never drift from the Root's value prop.
	 */
	readonly selectedSet: ReadonlySet<string> = $derived(new SvelteSet(this.values));

	constructor(props: ListboxRootStateProps) {
		this.#props = props;
	}

	isSelected(value: string): boolean {
		return this.selectedSet.has(value);
	}

	/**
	 * Upstream `onItemSelect`. `onSelect` is invoked directly rather than
	 * through a synthetic `CustomEvent` round-trip, and always before the value moves.
	 */
	selectItem(value: string, isMultipleEvent = false): void {
		if (this.disabled) return;

		const item = this.collection.getItems().find((candidate) => candidate.value === value);
		if (item?.disabled) return;

		item?.onSelect?.(value);

		const current = this.values;

		if (this.multiple) {
			if (isMultipleEvent) {
				if (current.includes(value)) {
					this.#props.setValues(current.filter((entry) => entry !== value));
				} else {
					this.#props.setValues([...current, value]);
				}
			} else {
				this.#props.setValues([value]);
			}
		} else if (current.length === 1 && current[0] === value) {
			this.#props.setValues([]);
		} else {
			this.#props.setValues([value]);
		}

		this.anchorValue = value;
	}

	/** `Ctrl`/`Cmd`+`A` — every enabled value at once. A no-op outside `multiple`. */
	selectAll(): void {
		if (this.disabled || !this.multiple) return;
		this.#props.setValues(this.collection.getEnabledItems().map((item) => item.value));
	}

	/** The contiguous enabled slice between two values, inclusive. `multiple` only. */
	selectRange(from: string, to: string): void {
		if (this.disabled || !this.multiple) return;

		const items = this.collection.getEnabledItems();
		const fromIndex = items.findIndex((item) => item.value === from);
		const toIndex = items.findIndex((item) => item.value === to);
		if (fromIndex === -1 || toIndex === -1) return;

		const start = Math.min(fromIndex, toIndex);
		const end = Math.max(fromIndex, toIndex);
		this.#props.setValues(items.slice(start, end + 1).map((item) => item.value));
	}

	/**
	 * State-only focus move — upstream's `onItemFocus` + `onItemHighlight`. Called by the item's own
	 * `focus` handler, so it must never call `.focus()` back.
	 */
	markFocused(value: string): void {
		this.focusedValue = value;
		this.highlightedValue = value;
		this.anchorValue = value;
		this.#remembered = value;
	}

	/**
	 * Move the roving focus to `value`, actually focusing the element unless `virtual` (research
	 * R-05). `keepAnchor` preserves the range anchor across a `Shift`+navigation move — the DOM
	 * focus event would otherwise reset it through {@link markFocused}.
	 */
	focusItem(value: string, { keepAnchor = false }: { keepAnchor?: boolean } = {}): void {
		const anchor = this.anchorValue;

		if (!this.virtual) {
			this.collection
				.getItems()
				.find((item) => item.value === value)
				?.element.focus();
		}

		this.markFocused(value);
		if (keepAnchor) this.anchorValue = anchor;
	}

	/** `Escape`, and focus leaving the root: the selection is deliberately untouched. */
	clearFocus(): void {
		this.focusedValue = null;
		this.highlightedValue = null;
	}

	/** Upstream `onFocus` — first entry lands on the remembered option. */
	onRootFocusIn(event: FocusEvent): void {
		if (this.disabled || this.#isShiftTab) return;
		if (event.target !== event.currentTarget) return;

		const items = this.collection.getEnabledItems();
		if (items.length === 0) return;

		const remembered = this.#remembered;
		if (remembered !== null && items.some((item) => item.value === remembered)) {
			this.focusItem(remembered);
			return;
		}

		const first = items[0];
		if (first) this.focusItem(first.value);
	}

	/** Upstream `onBlur` — only when focus leaves the root subtree. */
	onRootFocusOut(event: FocusEvent): void {
		const root = event.currentTarget;
		if (!(root instanceof HTMLElement)) return;

		const next = event.relatedTarget;
		if (next instanceof Node && root.contains(next)) return;

		this.focusedValue = null;
	}

	/** The whole keyboard contract — upstream `onKeyDown` plus the four APG additions. */
	onRootKeydown(event: KeyboardEvent): void {
		if (this.disabled) return;

		if (event.key === "Tab") {
			if (!event.shiftKey) return;

			this.#isShiftTab = true;
			if (event.target !== event.currentTarget) {
				this.focusedValue = null;
				if (event.currentTarget instanceof HTMLElement) event.currentTarget.focus();
			}
			setTimeout(() => {
				this.#isShiftTab = false;
			}, 0);
			return;
		}

		const items = this.collection.getEnabledItems();
		if (items.length === 0) return;

		// Checked before everything else so select-all is never mistaken for a per-item toggle.
		if ((event.ctrlKey || event.metaKey) && (event.key === "a" || event.key === "A")) {
			if (!this.multiple) return;
			this.selectAll();
			event.preventDefault();
			return;
		}

		if (event.key === "Escape") {
			this.clearFocus();
			event.preventDefault();
			return;
		}

		// `Enter` always selects. A bare space only selects while no typeahead buffer is in progress —
		// mid-buffer it is just another character, so a multi-word label ("FS 540", "Hospital Flip")
		// stays matchable past its first word.
		const isSelectionKey =
			event.key === "Enter" || (event.key === " " && this.typeahead.search === "");

		if (isSelectionKey) {
			const focused = this.focusedValue;
			if (focused === null) return;

			// Upstream's `multiple && (multiple === true || ctrlKey || metaKey)` collapses to
			// `multiple`: with `multiple` on, the modifier never changes the outcome.
			this.selectItem(focused, this.multiple);

			if (!this.virtual) {
				items
					.find((item) => item.value === focused)
					?.element.scrollIntoView({ block: "nearest", inline: "nearest" });
			}

			event.preventDefault();
			return;
		}

		if (isNavigationKey(event.key, this.orientation)) {
			event.preventDefault();

			const next = this.getNextValue(event.key);
			if (next === null) return;

			const isRange = event.shiftKey && this.multiple;
			this.focusItem(next, { keepAnchor: isRange });

			if (isRange) this.selectRange(this.anchorValue ?? next, next);
			return;
		}

		// Typeahead. A space reaches this point only with a buffer already in progress — an empty
		// buffer made it the selection key above — so a buffer can never start with one.
		const isPrintable = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
		if (!isPrintable) return;

		const match = this.typeahead.handle(event.key, items, this.focusedValue);
		if (match === null) return;

		this.focusItem(match);
		event.preventDefault();
	}

	/**
	 * Pure destination resolution for one navigation key: orientation, RTL, grid geometry, `loop`
	 * and disabled-skipping, with no side effects. `null` when the key moves nowhere.
	 */
	getNextValue(key: string): string | null {
		const orientation = this.orientation;
		if (!isNavigationKey(key, orientation)) return null;

		const items = this.collection.getEnabledItems();
		const itemCount = items.length;
		if (itemCount === 0) return null;

		const loop = this.loop;
		const isRtl = this.dir === "rtl";
		const focused = this.focusedValue;
		const currentIndex = focused ? items.findIndex((item) => item.value === focused) : -1;
		const { columnCount, rowCount } = calculateGridLayout(items, orientation);
		const isGrid = orientation === "mixed" && columnCount > 1 && currentIndex >= 0;

		switch (key) {
			case "Home":
				return getMinItemValue(items);

			case "End":
				return getMaxItemValue(items);

			case "ArrowUp":
			case "PageUp": {
				if (isGrid) {
					const currentCol = currentIndex % columnCount;
					const targetIndex = currentIndex - columnCount;
					if (targetIndex >= 0) return items[targetIndex]?.value ?? null;
					if (!loop) return null;

					const lastRowItemIndex = currentCol + (rowCount - 1) * columnCount;
					return items[Math.min(lastRowItemIndex, itemCount - 1)]?.value ?? null;
				}
				if (currentIndex < 0) return items[0]?.value ?? null;
				return (
					findEnabledItem(items, { startingIndex: currentIndex, decrement: true, loop })?.value ??
					null
				);
			}

			case "ArrowDown":
			case "PageDown": {
				if (isGrid) {
					const currentCol = currentIndex % columnCount;
					const targetIndex = currentIndex + columnCount;
					if (targetIndex < itemCount) return items[targetIndex]?.value ?? null;
					if (!loop) return null;

					return items[currentCol]?.value ?? null;
				}
				if (currentIndex < 0) return items[0]?.value ?? null;
				return findEnabledItem(items, { startingIndex: currentIndex, loop })?.value ?? null;
			}

			case "ArrowLeft": {
				if (currentIndex < 0) return items[0]?.value ?? null;
				return (
					findEnabledItem(items, { startingIndex: currentIndex, decrement: !isRtl, loop })?.value ??
					null
				);
			}

			case "ArrowRight": {
				if (currentIndex < 0) return items[0]?.value ?? null;
				return (
					findEnabledItem(items, { startingIndex: currentIndex, decrement: isRtl, loop })?.value ??
					null
				);
			}

			default:
				return null;
		}
	}
}

export type ListboxGroupStateProps = {
	/** The group's own `$props.id()`. */
	readonly id: string;
};

/** One instance per `<Listbox.Group>`, published for `<Listbox.GroupLabel>` and its items. */
export class ListboxGroupState {
	#props!: ListboxGroupStateProps;

	readonly id: string = $derived(this.#props.id);
	readonly labelId: string = $derived(`${this.#props.id}-label`);

	constructor(props: ListboxGroupStateProps) {
		this.#props = props;
	}
}

export type ListboxItemStateProps = {
	readonly root: ListboxRootState;
	readonly getValue: () => string;
	readonly getDisabled: () => boolean;
};

/** One instance per `<Listbox.Item>`, published on the item context for its indicator. */
export class ListboxItemState {
	#props!: ListboxItemStateProps;

	readonly value: string = $derived(this.#props.getValue());
	readonly isDisabled: boolean = $derived(this.#props.getDisabled() || this.#props.root.disabled);
	readonly isSelected: boolean = $derived(this.#props.root.isSelected(this.value));
	readonly isHighlighted: boolean = $derived(this.#props.root.highlightedValue === this.value);
	readonly isFocused: boolean = $derived(this.#props.root.focusedValue === this.value);

	get root(): ListboxRootState {
		return this.#props.root;
	}

	constructor(props: ListboxItemStateProps) {
		this.#props = props;
	}
}

const LISTBOX_CONTEXT_KEY = Symbol("listbox");
const LISTBOX_GROUP_CONTEXT_KEY = Symbol("listbox-group");
const LISTBOX_ITEM_CONTEXT_KEY = Symbol("listbox-item");

export function setListboxContext(state: ListboxRootState): ListboxRootState {
	return setContext(LISTBOX_CONTEXT_KEY, state);
}

/** Read the root's state, throwing when there is no `<Listbox.Root>` ancestor. */
export function getListboxContext(consumerName: string): ListboxRootState {
	if (!hasContext(LISTBOX_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`<Listbox.Root>\`.`);
	}
	return getContext<ListboxRootState>(LISTBOX_CONTEXT_KEY);
}

export function setListboxGroupContext(state: ListboxGroupState): ListboxGroupState {
	return setContext(LISTBOX_GROUP_CONTEXT_KEY, state);
}

/**
 * Whether a `<Listbox.Group>` is above. `<Listbox.Item>` is the one consumer for which the group is
 * optional — upstream reads `React.useContext(ListboxGroupContext)` there without asserting.
 */
export function hasListboxGroupContext(): boolean {
	return hasContext(LISTBOX_GROUP_CONTEXT_KEY);
}

/** Read the group's state, throwing when there is no `<Listbox.Group>` ancestor. */
export function getListboxGroupContext(consumerName: string): ListboxGroupState {
	if (!hasListboxGroupContext()) {
		throw new Error(`\`${consumerName}\` must be used within \`<Listbox.Group>\`.`);
	}
	return getContext<ListboxGroupState>(LISTBOX_GROUP_CONTEXT_KEY);
}

export function setListboxItemContext(state: ListboxItemState): ListboxItemState {
	return setContext(LISTBOX_ITEM_CONTEXT_KEY, state);
}

/** Read the item's state, throwing when there is no `<Listbox.Item>` ancestor. */
export function getListboxItemContext(consumerName: string): ListboxItemState {
	if (!hasContext(LISTBOX_ITEM_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`<Listbox.Item>\`.`);
	}
	return getContext<ListboxItemState>(LISTBOX_ITEM_CONTEXT_KEY);
}
