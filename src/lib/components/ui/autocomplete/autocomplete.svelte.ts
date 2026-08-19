import { getContext, hasContext, setContext, tick, untrack } from "svelte";

/**
 * The state behind `<Autocomplete.Root>`, ported from the gallery's Autocomplete, which
 * wraps Base UI's `Autocomplete` primitive.
 *
 * WHY A HAND-BUILT PRIMITIVE — `bits-ui` ships a `Combobox`, and it is the obvious substrate until
 * you look at what it owns. Its `value` is the *selected item*; the field text lives in a separate,
 * non-bindable `inputValue` the primitive writes to itself. Base UI inverts that: `value` IS the
 * field text, free text is a first-class outcome, and selection merely writes
 * `itemToStringValue(item)` into it. Reproducing that on top of `Combobox` means two sources of
 * truth for one string, with the primitive clobbering ours on every selection. `Combobox` also
 * auto-highlights the first candidate on every keystroke, which makes `autoHighlight` — a whole
 * demo on the source page — unimplementable.
 *
 * So the list behaviour is ours and only the popup is borrowed: `bits-ui`'s `Popover` supplies the
 * portal, the floating position and the dismissible layer, anchored to the input through
 * `customAnchor`. That is exactly the split `<Mention.Root>` already makes in this repository.
 */

/** One move {@link AutocompleteRootState.highlightMove} understands. */
export type AutocompleteHighlightDirection = "next" | "prev" | "first" | "last";

/** The signature of a single matcher — Base UI's `useFilter()` returns three of these. */
export type AutocompleteMatcher = (itemString: string, query: string) => boolean;

/** What {@link createFilter} returns: Base UI's `useFilter()` trio. */
export type AutocompleteFilters = {
	/** Whether `itemString` contains `query` anywhere. */
	contains: AutocompleteMatcher;
	/** Whether `itemString` begins with `query`. */
	startsWith: AutocompleteMatcher;
	/** Whether `itemString` ends with `query`. */
	endsWith: AutocompleteMatcher;
};

/**
 * Locale-aware matchers, the theme's port of Base UI's `Autocomplete.useFilter()`.
 *
 * `Intl.Collator` with `usage: 'search'` is what makes "e" find "Édition" — a
 * `toLowerCase().includes()` filter does not, and users notice. Length-changing equivalences such
 * as "strasse"/"Straße" are matched only by `startsWith` and `endsWith`, whose slices span the
 * whole haystack; `contains` scans fixed-width windows, so it matches same-length forms only. The
 * default `sensitivity: 'base'` is the one every demo on the source page asks for.
 *
 * Exported because two of the ported demos build their own filter over several fields and need the
 * same matcher the default filter uses, exactly as upstream's `useFilter({ sensitivity: 'base' })`
 * does.
 */
export function createFilter(
	options: Intl.CollatorOptions = { sensitivity: "base" },
	locale?: string,
): AutocompleteFilters {
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

/** The matcher `<Autocomplete.Root>` filters with unless `filter` says otherwise. */
export const defaultFilter: AutocompleteMatcher = createFilter().contains;

/**
 * Upstream's default `itemToStringValue`: a string is its own label, and an object answers with
 * `value` then `label`. Everything else is stringified, which is what makes a bare array of numbers
 * work without any configuration.
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
 * One registered `<Autocomplete.Item>`.
 *
 * An immutable snapshot rather than a bag of getters, for the same reason `<Mention.Item>` uses
 * one: the item re-registers whenever a field moves, so the collection never reaches back into a
 * component that may already be gone.
 */
export type AutocompleteItemData = {
	/** The rendered element — the collection key and the document-order source. */
	readonly element: HTMLElement;
	/** The `aria-activedescendant` target. */
	readonly id: string;
	/** What lands in the field when this item is selected. */
	readonly stringValue: string;
	/** The item's own `disabled`, OR-ed with the root's. */
	readonly disabled: boolean;
};

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
 * Unlike `<Mention.Root>`'s collection this one holds *only* mounted items: the root filters the
 * data before rendering, so an item that does not match is never rendered in the first place and
 * has nothing to stay registered for.
 */
export class AutocompleteItemCollection {
	// `$state.raw`: entries are replaced wholesale, and a deep proxy would make the teardown's
	// identity comparison against the original snapshot fail.
	#items = $state.raw<readonly AutocompleteItemData[]>([]);

	/** How many items are mounted. */
	readonly size: number = $derived(this.#items.length);

	/**
	 * Called from the item's `$effect`; the returned thunk is its teardown. Both reads of the list
	 * are untracked — the caller is an effect, and subscribing it to the very list it appends to
	 * would re-run it forever.
	 */
	register(item: AutocompleteItemData): () => void {
		this.#items = [...untrack(() => this.#items), item];
		return () => {
			this.#items = untrack(() => this.#items).filter((registered) => registered !== item);
		};
	}

	/** Every mounted item, in document order. */
	getItems(): AutocompleteItemData[] {
		return [...this.#items]
			.filter((item) => item.element.isConnected)
			.sort((a, b) => compareNodePosition(a.element, b.element));
	}

	/** What navigation and selection walk. */
	getEnabledItems(): AutocompleteItemData[] {
		return this.getItems().filter((item) => !item.disabled);
	}
}

export type AutocompleteRootStateProps = {
	readonly getItems: () => readonly unknown[];
	readonly getValue: () => string;
	readonly setValue: (value: string) => void;
	readonly getOpen: () => boolean;
	readonly setOpen: (open: boolean) => void;
	readonly getFilter: () => AutocompleteMatcher | null | undefined;
	readonly getItemToStringValue: () => ((item: never) => string) | undefined;
	readonly getDisabled: () => boolean;
	readonly getReadonly: () => boolean;
	readonly getAutoHighlight: () => boolean;
	readonly getLoop: () => boolean;
	/** The one `$props.id()` every part's id derives from. */
	readonly id: string;
};

/**
 * One instance per `<Autocomplete.Root>`, published on the root context.
 *
 * The value is read straight from the Root's `$bindable` props rather than mirrored into `$state`,
 * which is what lets an authoritative parent decline a write — the same contract every other
 * compound component in this repository offers.
 */
export class AutocompleteRootState {
	// $derived below is lazy at runtime (evaluated only when the field is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: AutocompleteRootStateProps;

	/** The highlighted item's element. `aria-activedescendant` and `data-highlighted` follow it. */
	highlightedElement = $state<HTMLElement | null>(null);
	/** The field, and the popup's anchor. */
	inputElement = $state<HTMLInputElement | null>(null);
	/**
	 * The popup, once it is mounted.
	 *
	 * The field needs to recognise it: focus leaving the field is how an autocomplete closes, and a
	 * click that lands inside the popup is the one case where it must not.
	 */
	contentElement = $state<HTMLElement | null>(null);

	readonly collection = new AutocompleteItemCollection();

	/** Set from the root's teardown, so a deferred write cannot land after the component is gone. */
	#destroyed = false;

	readonly value: string = $derived(this.#props.getValue());
	readonly open: boolean = $derived(this.#props.getOpen());
	readonly disabled: boolean = $derived(this.#props.getDisabled());
	readonly readonly: boolean = $derived(this.#props.getReadonly());
	readonly autoHighlight: boolean = $derived(this.#props.getAutoHighlight());
	readonly loop: boolean = $derived(this.#props.getLoop());

	readonly dataState: "open" | "closed" = $derived(this.open ? "open" : "closed");

	readonly inputId: string = $derived(`${this.#props.id}-input`);
	readonly listId: string = $derived(`${this.#props.id}-list`);

	/**
	 * The items the list renders.
	 *
	 * `filter={null}` is upstream's opt-out and the reason two of its demos work at all: an async
	 * search and a grouped list have both already narrowed the data by the time it arrives here, and
	 * filtering a second time — against a group object, whose string form matches nothing — would
	 * empty the list on every keystroke.
	 */
	readonly filteredItems: readonly unknown[] = $derived.by(() => {
		const items = this.#props.getItems();
		const filter = this.#props.getFilter();

		if (filter === null) return items;

		const query = this.value;
		if (query === "") return items;

		const match = filter ?? defaultFilter;
		return items.filter((item) => match(this.itemToStringValue(item), query));
	});

	readonly highlightedItem: AutocompleteItemData | null = $derived.by(() => {
		const element = this.highlightedElement;
		if (!element) return null;
		return this.collection.getItems().find((item) => item.element === element) ?? null;
	});

	/** `undefined` rather than `null`, because that is what removes the attribute. */
	readonly highlightedId: string | undefined = $derived(this.highlightedItem?.id);

	constructor(props: AutocompleteRootStateProps) {
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

	setValue(next: string): void {
		// Guarded so `onValueChange` fires only on a real change — selecting an item whose string
		// value the field already holds is not one.
		if (next !== this.value) this.#props.setValue(next);
	}

	setOpen(next: boolean): void {
		// Guarded so `onOpenChange` fires only on a real transition.
		if (next !== this.open) this.#props.setOpen(next);
		if (!next) this.highlightedElement = null;
	}

	/**
	 * The field text changed under the user's fingers.
	 *
	 * Opening here rather than on focus is upstream's default (`openOnInputClick: false`): a
	 * suggestion list that appears before anything has been typed is a menu, not an autocomplete.
	 */
	onInput(next: string): void {
		if (this.disabled || this.readonly) return;

		this.setValue(next);
		this.setOpen(true);
		void this.resetHighlight();
	}

	/**
	 * Put the highlight back where a fresh set of matches leaves it.
	 *
	 * This is the whole of `autoHighlight`. With it off — upstream's default — a keystroke leaves
	 * *nothing* highlighted, so `Enter` submits the form instead of quietly picking whichever item
	 * happened to sort first. With it on, the best match is armed as you type. The `tick()` waits for
	 * the newly rendered items to register.
	 */
	async resetHighlight(): Promise<void> {
		await tick();
		if (this.#destroyed || !this.open) return;

		this.highlightedElement = this.autoHighlight
			? (this.collection.getEnabledItems()[0]?.element ?? null)
			: null;
	}

	/** Open from a key that also asks for a starting highlight — `ArrowDown` and `ArrowUp`. */
	async openWithHighlight(direction: "first" | "last"): Promise<void> {
		this.setOpen(true);
		await tick();
		if (this.#destroyed || !this.open) return;

		this.highlightMove(direction);
	}

	highlightMove(direction: AutocompleteHighlightDirection): void {
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
		// `nearest` rather than `center`: a list that jumps under the cursor on every arrow press is
		// harder to read than one that scrolls by exactly as much as it must.
		next.element.scrollIntoView({ block: "nearest" });
	}

	/** Commit an item: the field takes its string value, and the popup has nothing left to say. */
	selectItem(stringValue: string): void {
		if (this.disabled || this.readonly) return;

		this.setValue(stringValue);
		this.setOpen(false);
		this.inputElement?.focus();
	}

	/** `<Autocomplete.Clear>`: empty the field, close, and hand focus back so typing resumes. */
	clear(): void {
		if (this.disabled || this.readonly) return;

		this.setValue("");
		this.setOpen(false);
		this.inputElement?.focus();
	}
}

/**
 * The group a `<Autocomplete.Collection>` reads its items from.
 *
 * Kept separate from the root context because a group is a *nested* scope: the collection has to
 * find the group that encloses it, not the one that happens to be first.
 */
export class AutocompleteGroupState {
	// `$derived` is lazy at runtime, so the field below never reads this before the constructor has
	// assigned it — but svelte-check's static analysis cannot see that, hence the definite assignment.
	#getItems!: () => readonly unknown[];

	readonly labelId: string;

	readonly items: readonly unknown[] = $derived(this.#getItems());

	constructor(getItems: () => readonly unknown[], labelId: string) {
		this.#getItems = getItems;
		this.labelId = labelId;
	}
}

const AUTOCOMPLETE_CONTEXT_KEY = Symbol("autocomplete");
const AUTOCOMPLETE_GROUP_CONTEXT_KEY = Symbol("autocomplete-group");

export function setAutocompleteContext(state: AutocompleteRootState): AutocompleteRootState {
	return setContext(AUTOCOMPLETE_CONTEXT_KEY, state);
}

/** Read the root's state, throwing when there is no `<Autocomplete.Root>` ancestor. */
export function getAutocompleteContext(consumerName: string): AutocompleteRootState {
	if (!hasContext(AUTOCOMPLETE_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`<Autocomplete.Root>\`.`);
	}
	return getContext<AutocompleteRootState>(AUTOCOMPLETE_CONTEXT_KEY);
}

export function setAutocompleteGroupContext(state: AutocompleteGroupState): AutocompleteGroupState {
	return setContext(AUTOCOMPLETE_GROUP_CONTEXT_KEY, state);
}

/** Read the enclosing group, throwing when there is no `<Autocomplete.Group>` ancestor. */
export function getAutocompleteGroupContext(consumerName: string): AutocompleteGroupState {
	if (!hasContext(AUTOCOMPLETE_GROUP_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`<Autocomplete.Group>\`.`);
	}
	return getContext<AutocompleteGroupState>(AUTOCOMPLETE_GROUP_CONTEXT_KEY);
}
