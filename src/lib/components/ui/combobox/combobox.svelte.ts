import { getContext, hasContext, setContext, tick, untrack } from "svelte";

/**
 * The state behind `<Combobox.Root>`.
 *
 * WHY A HAND-BUILT PRIMITIVE — `bits-ui` ships a `Combobox` too, and unlike the Autocomplete case
 * its value model even agrees with upstream's (value = selection, field text separate). What it
 * does not offer is control over that field text: `inputValue` is a non-bindable prop the
 * primitive writes to itself — on every selection it stamps the item's label into the field, which
 * is exactly wrong for the chips flow (Base UI *clears* the field after each multi-select), and it
 * highlights the first candidate on every keystroke, which makes upstream's `autoHighlight` (off
 * by default, an explicit prop in seven of the ported demos) unimplementable. The select-shaped
 * demos also put the input *inside* the popup, and `bits-ui`'s input registers itself as the
 * floating anchor — an anchor inside the element it positions. So this folder makes the same split
 * `<Autocomplete.Root>` already made and documented: `bits-ui`'s `Popover` supplies the portal,
 * the floating position and the dismissible layer; the selection, filtering and highlight are
 * ours.
 *
 * The filter helpers below (`createFilter`, `defaultFilter`, `defaultItemToStringValue`) duplicate
 * the ones in `ui/autocomplete` on purpose: both fold the same Base UI `useFilter()`, but neither
 * component composes the other, and `src/lib/shared/` takes machinery only once two residents
 * need it — hoisting both copies there is the follow-up, not a reason to make combobox reach into
 * a sibling's barrel for a pure function.
 */

/** One move {@link ComboboxRootState.highlightMove} understands. */
export type ComboboxHighlightDirection = "next" | "prev" | "first" | "last";

/** The signature of a single matcher — Base UI's `useFilter()` returns three of these. */
export type ComboboxMatcher = (itemString: string, query: string) => boolean;

/** What {@link createFilter} returns: Base UI's `useFilter()` trio. */
export type ComboboxFilters = {
	/** Whether `itemString` contains `query` anywhere. */
	contains: ComboboxMatcher;
	/** Whether `itemString` begins with `query`. */
	startsWith: ComboboxMatcher;
	/** Whether `itemString` ends with `query`. */
	endsWith: ComboboxMatcher;
};

/**
 * Locale-aware matchers, the theme's port of Base UI's `Combobox.useFilter()`.
 *
 * `Intl.Collator` with `usage: 'search'` is what makes "e" find "Édition" — a
 * `toLowerCase().includes()` filter does not. Length-changing folds such as "strasse"/"Straße"
 * are matched only by `startsWith` and `endsWith`, whose slices span the whole haystack;
 * `contains` scans fixed-width windows, so it matches same-length forms only. The
 * default `sensitivity: 'base'` is what the upstream demos assume.
 */
export function createFilter(
	options: Intl.CollatorOptions = { sensitivity: "base" },
	locale?: string,
): ComboboxFilters {
	const collator = new Intl.Collator(locale, { usage: "search", ...options });

	// NFC first: "é" typed as one code point and as "e" + U+0301 are the same string to a reader and
	// two different strings to `slice`, which is what the scan below compares.
	const normalise = (value: string) => value.normalize("NFC");

	return {
		contains(itemString, query) {
			if (query === "") return true;

			const haystack = normalise(itemString);
			const needle = normalise(query);
			const width = needle.length;

			for (let start = 0; start + width <= haystack.length; start++) {
				if (collator.compare(haystack.slice(start, start + width), needle) === 0) return true;
			}
			return false;
		},
		startsWith(itemString, query) {
			if (query === "") return true;

			const haystack = normalise(itemString);
			const needle = normalise(query);
			return collator.compare(haystack.slice(0, needle.length), needle) === 0;
		},
		endsWith(itemString, query) {
			if (query === "") return true;

			const haystack = normalise(itemString);
			const needle = normalise(query);
			return (
				collator.compare(haystack.slice(Math.max(0, haystack.length - needle.length)), needle) === 0
			);
		},
	};
}

/** The matcher `<Combobox.Root>` filters with unless `filter` says otherwise. */
export const defaultFilter: ComboboxMatcher = createFilter().contains;

/**
 * Upstream's default `itemToStringValue`: a string is its own label, and an object answers with
 * `value` then `label`. Everything else is stringified, which is what makes a bare array of
 * numbers work without any configuration.
 */
export function defaultItemToStringValue(item: unknown): string {
	if (item === null || item === undefined) return "";
	if (typeof item === "string") return item;

	if (typeof item === "object") {
		const record = item as Record<string, unknown>;
		if (typeof record.value === "string") return record.value;
		if (typeof record.label === "string") return record.label;
	}

	return String(item);
}

/**
 * A grouped-data entry: the shape the timezone demos pass as `items` — a heading value plus the
 * rows under it. `<Combobox.Group items>` receives one of these entries' `items`, and the root
 * filter treats the entry as transparent: a group survives while any of its rows matches.
 */
export function isGroupShapedItem(entry: unknown): entry is { items: readonly unknown[] } {
	return (
		typeof entry === "object" &&
		entry !== null &&
		Array.isArray((entry as Record<string, unknown>).items)
	);
}

/**
 * One registered `<Combobox.Item>`.
 *
 * An immutable snapshot rather than a bag of getters, for the same reason `<Autocomplete.Item>`
 * uses one: the item re-registers whenever a field moves, so the collection never reaches back
 * into a component that may already be gone.
 */
export type ComboboxItemData = {
	/** The rendered element — the collection key and the document-order source. */
	readonly element: HTMLElement;
	/** The `aria-activedescendant` target. */
	readonly id: string;
	/** The string the item filters and displays as — `itemToStringValue(item)`. */
	readonly stringValue: string;
	/** The value the item stands for; what `selectItem` commits. */
	readonly item: unknown;
	/** The item's own `disabled`, OR-ed with the root's. */
	readonly disabled: boolean;
};

/*
 * EVERY `focus()` IN THIS COMPONENT PASSES `preventScroll`, and the reason is the same one
 * `revealWithinList` below exists for.
 *
 * Focus is how a combobox works — opening one puts the caret in the field, selecting an option
 * hands it back, removing a chip returns it — and none of those are ever a request to move the
 * page. Without the flag the browser is entitled to scroll the focused element into view, and
 * while a popup is still parked off-page during measurement that lands the page at the top. It
 * was measured doing exactly that: one `focus()` on the field, and the offset went from 9756 to 0
 * inside that single call.
 *
 * The field is already on screen in every one of these paths — the user just clicked or typed in
 * it — so there is nothing legitimate for the scroll half of `focus()` to do here.
 */

/**
 * Brings an item into view by scrolling ITS LIST, and nothing else.
 *
 * `element.scrollIntoView({ block: "nearest" })` is the obvious call and it is the wrong one here,
 * because "nearest" still walks every scrollable ancestor up to the document. A popup is parked
 * off the page while it is measured — bits-ui, copying Radix, sets `transform: translate(0, -200%)`
 * on the floating wrapper until floating-ui has placed it — so an item revealed in that window is
 * an item 200% above the viewport, and the browser scrolls the whole page to reach it. The popup
 * then slides into place and the page stays where it was dragged. Measured, not theorised: it is
 * how this component used to throw the page to the top on open, and it is the same race bits-ui's
 * own `Command` still loses, while its `Select` guards against it with `content.isPositioned`.
 * That flag is internal, so rather than wait for placement this simply never asks the page to
 * move: the list's own `scrollTop` is the only thing touched, which is all a listbox ever needed.
 */
function revealWithinList(element: HTMLElement): void {
	const list = element.closest<HTMLElement>('[data-slot="combobox-list"]');
	if (!list) return;

	const item = element.getBoundingClientRect();
	const view = list.getBoundingClientRect();
	if (item.top < view.top) list.scrollTop -= view.top - item.top;
	else if (item.bottom > view.bottom) list.scrollTop += item.bottom - view.bottom;
}

/** Upstream's `compareNodePosition`, as `<Mention.Root>`'s collection already spells it. */
function compareNodePosition(a: Node, b: Node): number {
	const position = a.compareDocumentPosition(b);
	if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
	if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
	return 0;
}

/**
 * A DOM-ordered registry of the mounted items.
 *
 * It holds *only* mounted items: the root filters the data before rendering, so an item that does
 * not match is never rendered in the first place and has nothing to stay registered for.
 */
export class ComboboxItemCollection {
	// `$state.raw`: entries are replaced wholesale, and a deep proxy would make the teardown's
	// identity comparison against the original snapshot fail.
	#items = $state.raw<readonly ComboboxItemData[]>([]);

	/** How many items are mounted. */
	readonly size: number = $derived(this.#items.length);

	/**
	 * Called from the item's `$effect`; the returned thunk is its teardown. Both reads of the list
	 * are untracked — the caller is an effect, and subscribing it to the very list it appends to
	 * would re-run it forever.
	 */
	register(item: ComboboxItemData): () => void {
		this.#items = [...untrack(() => this.#items), item];
		return () => {
			this.#items = untrack(() => this.#items).filter((registered) => registered !== item);
		};
	}

	/** Every mounted item, in document order. */
	getItems(): ComboboxItemData[] {
		return [...this.#items]
			.filter((item) => item.element.isConnected)
			.sort((a, b) => compareNodePosition(a.element, b.element));
	}

	/** What navigation and selection walk. */
	getEnabledItems(): ComboboxItemData[] {
		return this.getItems().filter((item) => !item.disabled);
	}
}

export type ComboboxRootStateProps = {
	readonly getItems: () => readonly unknown[];
	readonly getMultiple: () => boolean;
	/** The raw `value` prop: `T | null` in single mode, `readonly T[]` in multiple mode. */
	readonly getValue: () => unknown;
	/** Writes the next value back in the same shape `getValue` reads. */
	readonly setValue: (value: unknown) => void;
	readonly getOpen: () => boolean;
	readonly setOpen: (open: boolean) => void;
	readonly getFilter: () => ComboboxMatcher | null | undefined;
	readonly getItemToStringValue: () => ((item: never) => string) | undefined;
	readonly getIsItemEqualToValue: () => ((item: never, value: never) => boolean) | undefined;
	readonly getDisabled: () => boolean;
	readonly getReadonly: () => boolean;
	readonly getAutoHighlight: () => boolean;
	readonly getLoop: () => boolean;
	/** The one `$props.id()` every part's id derives from. */
	readonly id: string;
};

/**
 * One instance per `<Combobox.Root>`, published on the root context.
 *
 * The value is read straight from the Root's `$bindable` props rather than mirrored into `$state`,
 * which is what lets an authoritative parent decline a write — the same contract every other
 * compound component in this repository offers.
 */
export class ComboboxRootState {
	// $derived below is lazy at runtime (evaluated only when the field is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: ComboboxRootStateProps;

	/** The highlighted item's element. `aria-activedescendant` and `data-highlighted` follow it. */
	highlightedElement = $state<HTMLElement | null>(null);
	/** The active field — the outer input, or the chips input, or the one inside the popup. */
	inputElement = $state<HTMLInputElement | null>(null);
	/** The trigger button, when one is rendered — the anchor of the select-shaped compositions. */
	triggerElement = $state<HTMLElement | null>(null);
	/** The `<Combobox.Chips>` container — the anchor of the multi-select compositions. */
	chipsElement = $state<HTMLElement | null>(null);
	/** The popup, once it is mounted — the one place focus may travel without closing the field. */
	contentElement = $state<HTMLElement | null>(null);
	/**
	 * Whether the mounted input lives inside the popup (the select-shaped demos put it there).
	 * The popup must then anchor to the trigger — an anchor inside the element it positions is a
	 * feedback loop — and a selection must hand focus back to the trigger, because the input
	 * unmounts with the popup.
	 */
	inputInsideContent = $state(false);

	/**
	 * What the user has typed since the popup opened — the filter's needle. Separate from the
	 * rendered field text: a single-select whose field shows the committed "Next.js" must still
	 * open onto the *full* list, so the query only becomes the field once `touched` says the text
	 * is the user's own (combobox.tsx:66-101 inherits this from Base UI's `Combobox.Input`).
	 */
	query = $state("");
	/** Whether the user has typed since the popup opened; cleared on close and after a commit. */
	touched = $state(false);

	readonly collection = new ComboboxItemCollection();

	/** Set from the root's teardown, so a deferred write cannot land after the component is gone. */
	#destroyed = false;

	readonly multiple: boolean = $derived(this.#props.getMultiple());
	readonly open: boolean = $derived(this.#props.getOpen());
	readonly disabled: boolean = $derived(this.#props.getDisabled());
	readonly readonly: boolean = $derived(this.#props.getReadonly());
	readonly autoHighlight: boolean = $derived(this.#props.getAutoHighlight());
	readonly loop: boolean = $derived(this.#props.getLoop());

	readonly dataState: "open" | "closed" = $derived(this.open ? "open" : "closed");

	readonly inputId: string = $derived(`${this.#props.id}-input`);
	readonly listId: string = $derived(`${this.#props.id}-list`);

	/** The selection as a list, whatever mode: `[]`, `[item]`, or the multi-select array. */
	readonly selectedItems: readonly unknown[] = $derived.by(() => {
		const value = this.#props.getValue();
		if (value === null || value === undefined) return [];
		if (this.multiple) return Array.isArray(value) ? value : [value];
		return [value];
	});

	readonly hasValue: boolean = $derived(this.selectedItems.length > 0);

	/** The selection's string forms — identity for `isSelected` and the item indicator. */
	readonly selectedStringValues: readonly string[] = $derived(
		this.selectedItems.map((item) => this.itemToStringValue(item)),
	);

	/** What a single-select field displays while the user is not mid-search. */
	readonly selectedText: string = $derived(this.selectedStringValues[0] ?? "");

	/**
	 * The text the field renders: the user's own query while typing, otherwise the committed
	 * selection (single) or nothing (multiple — the chips are the selection's rendering).
	 */
	readonly inputDisplayValue: string = $derived(
		this.touched ? this.query : this.multiple ? "" : this.selectedText,
	);

	/**
	 * The top-level entries the list renders. Group-shaped entries (the timezone demos) are kept
	 * while any of their rows matches; `<Combobox.Group>` then filters its own rows the same way.
	 */
	readonly filteredItems: readonly unknown[] = $derived.by(() => {
		const items = this.#props.getItems();
		return items.filter((entry) =>
			isGroupShapedItem(entry)
				? entry.items.some((item) => this.matches(item))
				: this.matches(entry),
		);
	});

	/**
	 * Whether any *row* survives the filter — the question `<Combobox.Empty>` asks. Distinct from
	 * `filteredItems.length` only in grouped data, where the top-level entries are group objects.
	 */
	readonly hasMatches: boolean = $derived.by(() => {
		const items = this.#props.getItems();
		return items.some((entry) =>
			isGroupShapedItem(entry)
				? entry.items.some((item) => this.matches(item))
				: this.matches(entry),
		);
	});

	readonly highlightedItem: ComboboxItemData | null = $derived.by(() => {
		const element = this.highlightedElement;
		if (!element) return null;
		return this.collection.getItems().find((item) => item.element === element) ?? null;
	});

	/** `undefined` rather than `null`, because that is what removes the attribute. */
	readonly highlightedId: string | undefined = $derived(this.highlightedItem?.id);

	constructor(props: ComboboxRootStateProps) {
		this.#props = props;
	}

	/** Called from the root's `$effect` teardown; stops every in-flight deferred write. */
	destroy(): void {
		this.#destroyed = true;
	}

	itemToStringValue(item: unknown): string {
		const custom = this.#props.getItemToStringValue();
		return custom ? custom(item as never) : defaultItemToStringValue(item);
	}

	/**
	 * Whether one row survives the current query. `filter={null}` is upstream's opt-out for data
	 * that is already the answer — an async search has nothing left to narrow.
	 */
	matches(item: unknown): boolean {
		if (!this.touched || this.query === "") return true;

		const filter = this.#props.getFilter();
		if (filter === null) return true;

		return (filter ?? defaultFilter)(this.itemToStringValue(item), this.query);
	}

	/**
	 * Whether two entries are the same selection — upstream's `isItemEqualToValue` (Base UI's
	 * `Combobox.Root` prop, passed through by the original) when the caller supplies one,
	 * else a string-form comparison. The fallback is right until two different records share a
	 * label, which is exactly the case the demos pass the prop for.
	 */
	itemsEqual(item: unknown, value: unknown): boolean {
		const custom = this.#props.getIsItemEqualToValue();
		if (custom) return custom(item as never, value as never);
		return this.itemToStringValue(item) === this.itemToStringValue(value);
	}

	/** Whether the item is part of the current selection, compared through {@link itemsEqual}. */
	isSelected(item: unknown): boolean {
		return this.selectedItems.some((selected) => this.itemsEqual(item, selected));
	}

	setOpen(next: boolean): void {
		// Guarded so `onOpenChange` fires only on a real transition.
		if (next !== this.open) this.#props.setOpen(next);
		if (!next) {
			// Closing forgets the search, so the next open starts from the full list with the field
			// showing the committed selection again — Base UI's reset-on-close.
			this.highlightedElement = null;
			this.query = "";
			this.touched = false;
		}
	}

	/** The field text changed under the user's fingers. */
	onInput(next: string): void {
		if (this.disabled || this.readonly) return;

		// Open first: opening is what clears a stale query, and this keystroke is the new one.
		this.setOpen(true);
		this.query = next;
		this.touched = true;
		void this.resetHighlight();
	}

	/**
	 * Put the highlight back where a fresh set of matches leaves it.
	 *
	 * Untouched with a selection, the selected row is armed — opening a combobox that says
	 * "Next.js" should resume at Next.js. Otherwise `autoHighlight` decides: with it off —
	 * upstream's default — a keystroke leaves *nothing* highlighted, so `Enter` submits the form
	 * instead of quietly picking whichever item sorted first. The `tick()` waits for the newly
	 * rendered items to register.
	 */
	async resetHighlight(): Promise<void> {
		await tick();
		if (this.#destroyed || !this.open) return;

		if (!this.touched && this.hasValue) {
			const selected = this.collection
				.getEnabledItems()
				.find((item) => this.selectedItems.some((value) => this.itemsEqual(item.item, value)));
			if (selected) {
				this.highlightedElement = selected.element;
				revealWithinList(selected.element);
				return;
			}
		}

		this.highlightedElement = this.autoHighlight
			? (this.collection.getEnabledItems()[0]?.element ?? null)
			: null;
	}

	/** Open from a key that also asks for a starting highlight — `ArrowDown` and `ArrowUp`. */
	async openWithHighlight(direction: "first" | "last"): Promise<void> {
		this.setOpen(true);
		await tick();
		if (this.#destroyed || !this.open) return;

		// Resume at the selection when there is one; otherwise take the end the key asked for.
		if (this.hasValue) {
			await this.resetHighlight();
			if (this.highlightedElement) return;
		}
		this.highlightMove(direction);
	}

	highlightMove(direction: ComboboxHighlightDirection): void {
		const items = this.collection.getEnabledItems();
		if (items.length === 0) return;

		const currentIndex = items.findIndex((item) => item.element === this.highlightedElement);
		const lastIndex = items.length - 1;
		let nextIndex: number;

		switch (direction) {
			case "first":
				nextIndex = 0;
				break;
			case "last":
				nextIndex = lastIndex;
				break;
			case "next":
				if (currentIndex === -1) nextIndex = 0;
				else if (currentIndex === lastIndex) nextIndex = this.loop ? 0 : lastIndex;
				else nextIndex = currentIndex + 1;
				break;
			case "prev":
				if (currentIndex === -1) nextIndex = lastIndex;
				else if (currentIndex === 0) nextIndex = this.loop ? lastIndex : 0;
				else nextIndex = currentIndex - 1;
				break;
		}

		const next = items[nextIndex];
		if (!next) return;

		this.highlightedElement = next.element;
		revealWithinList(next.element);
	}

	/** Where focus belongs when the popup gives it back. */
	#focusReturnTarget(): HTMLElement | null {
		if (this.inputInsideContent) return this.triggerElement;
		return this.inputElement ?? this.triggerElement;
	}

	/**
	 * Commit an item.
	 *
	 * Single mode selects and closes. Multiple mode *toggles* and stays open — picking three
	 * frameworks should not cost three openings — and clears the search so the next pick starts
	 * from the full list, which is Base UI's chips behaviour and the reason `bits-ui`'s `Combobox`
	 * (which stamps the label into the field instead) was not usable here.
	 */
	selectItem(item: unknown): void {
		if (this.disabled || this.readonly) return;

		if (this.multiple) {
			const next = this.isSelected(item)
				? this.selectedItems.filter((selected) => !this.itemsEqual(item, selected))
				: [...this.selectedItems, item];
			this.#props.setValue(next);
			this.query = "";
			this.touched = false;
			this.inputElement?.focus({ preventScroll: true });
			return;
		}

		this.#props.setValue(item);
		this.setOpen(false);
		this.#focusReturnTarget()?.focus({ preventScroll: true });
	}

	/** Remove one selected entry by its position in the selection — the chips' removal path. */
	removeAt(index: number): void {
		if (this.disabled || this.readonly) return;
		if (!this.multiple) return;
		if (index < 0 || index >= this.selectedItems.length) return;

		this.#props.setValue(this.selectedItems.filter((_, i) => i !== index));
		this.inputElement?.focus({ preventScroll: true });
	}

	/** `<Combobox.Clear>`: empty the selection and hand focus back so typing resumes. */
	clear(): void {
		if (this.disabled || this.readonly) return;
		if (!this.hasValue && this.query === "") return;

		this.#props.setValue(this.multiple ? [] : null);
		this.query = "";
		this.touched = false;
		this.#focusReturnTarget()?.focus({ preventScroll: true });
	}

	/**
	 * The keyboard contract every field shares — the outer input, the chips input and the popup
	 * one — and the trigger too, for the compositions that render no input at all (the date and
	 * label demos): DOM focus never enters the list, so whichever element holds it must drive the
	 * highlight. Returns `true` when the key was consumed, so the caller knows to
	 * `preventDefault()`.
	 */
	onFieldKeydown(event: KeyboardEvent): boolean {
		if (this.disabled) return false;

		switch (event.key) {
			case "ArrowDown":
				if (this.open) this.highlightMove("next");
				else void this.openWithHighlight("first");
				return true;
			case "ArrowUp":
				if (this.open) this.highlightMove("prev");
				else void this.openWithHighlight("last");
				return true;
			case "Home":
				if (!this.open) return false;
				this.highlightMove("first");
				return true;
			case "End":
				if (!this.open) return false;
				this.highlightMove("last");
				return true;
			case "Enter": {
				const highlighted = this.highlightedItem;
				if (!this.open || !highlighted) return false;

				// Only swallow the key when there is something to commit, so a form with nothing
				// highlighted still submits on Enter — which is the point of `autoHighlight` being off.
				this.selectItem(highlighted.item);
				return true;
			}
			case "Escape":
				if (!this.open) return false;
				this.setOpen(false);
				return true;
			case "Tab":
				this.setOpen(false);
				return false;
		}
		return false;
	}
}

/**
 * The group a `<Combobox.Collection>` reads its items from.
 *
 * Kept separate from the root context because a group is a *nested* scope: the collection has to
 * find the group that encloses it, not the one that happens to be first.
 */
export class ComboboxGroupState {
	// `$derived` is lazy at runtime, so the fields below never read these before the constructor
	// has assigned them — but svelte-check's static analysis cannot see that, hence the definite
	// assignment.
	#getItems!: () => readonly unknown[];
	#root!: ComboboxRootState;

	readonly labelId: string;

	readonly items: readonly unknown[] = $derived(this.#getItems());

	/** The group's rows that survive the root's filter — what the collection renders. */
	readonly filteredItems: readonly unknown[] = $derived(
		this.items.filter((item) => this.#root.matches(item)),
	);

	constructor(root: ComboboxRootState, getItems: () => readonly unknown[], labelId: string) {
		this.#root = root;
		this.#getItems = getItems;
		this.labelId = labelId;
	}
}

/**
 * The Svelte spelling of upstream's `useComboboxAnchor()`: a stable
 * holder the chips container writes itself into and `<Combobox.Content anchor>` reads. In markup:
 * `<Combobox.Chips bind:ref={anchor.current}>` … `<Combobox.Content anchor={anchor}>`.
 */
export class ComboboxAnchor {
	current = $state<HTMLElement | null>(null);
}

/** Construct a {@link ComboboxAnchor}; parity with upstream's hook, usable anywhere. */
export function createComboboxAnchor(): ComboboxAnchor {
	return new ComboboxAnchor();
}

const COMBOBOX_CONTEXT_KEY = Symbol("combobox");
const COMBOBOX_GROUP_CONTEXT_KEY = Symbol("combobox-group");
const COMBOBOX_CONTENT_MARKER_KEY = Symbol("combobox-content-marker");

export function setComboboxContext(state: ComboboxRootState): ComboboxRootState {
	return setContext(COMBOBOX_CONTEXT_KEY, state);
}

/** Read the root's state, throwing when there is no `<Combobox.Root>` ancestor. */
export function getComboboxContext(consumerName: string): ComboboxRootState {
	if (!hasContext(COMBOBOX_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`<Combobox.Root>\`.`);
	}
	return getContext<ComboboxRootState>(COMBOBOX_CONTEXT_KEY);
}

export function setComboboxGroupContext(state: ComboboxGroupState): ComboboxGroupState {
	return setContext(COMBOBOX_GROUP_CONTEXT_KEY, state);
}

/** Read the enclosing group, throwing when there is no `<Combobox.Group>` ancestor. */
export function getComboboxGroupContext(consumerName: string): ComboboxGroupState {
	if (!hasContext(COMBOBOX_GROUP_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`<Combobox.Group>\`.`);
	}
	return getContext<ComboboxGroupState>(COMBOBOX_GROUP_CONTEXT_KEY);
}

/**
 * `<Combobox.Content>` marks its subtree so `<Combobox.Input>` can tell whether it is rendered
 * inside the popup — the select-shaped compositions — and flag the root accordingly.
 */
export function setComboboxContentMarker(): void {
	setContext(COMBOBOX_CONTENT_MARKER_KEY, true);
}

/** Whether the caller sits inside a `<Combobox.Content>` subtree. */
export function hasComboboxContentMarker(): boolean {
	return hasContext(COMBOBOX_CONTENT_MARKER_KEY);
}
