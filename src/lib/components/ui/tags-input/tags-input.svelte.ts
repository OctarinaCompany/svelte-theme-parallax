import { getContext, hasContext, setContext, tick, untrack } from "svelte";

import type { Direction } from "$lib/components/ui/direction-provider/index.js";

/**
 * What the input's text becomes when it loses focus.
 *
 * - `"add"` — commit it as a new tag, through the same validation path as `Enter`.
 * - `"clear"` — discard it.
 * - `undefined` — leave it in the field.
 */
export type TagsInputBlurBehavior = "add" | "clear" | undefined;

/**
 * Split pasted text into tag candidates: split on `delimiter`, trim each part, drop the empties.
 *
 */
export function splitByDelimiter(text: string, delimiter: string): string[] {
	return text
		.split(delimiter)
		.map((value) => value.trim())
		.filter(Boolean);
}

export type FindAdjacentIndexOptions = {
	/** The index the traversal starts from; `null` means "no tag is highlighted yet". */
	readonly current: number | null;
	/** How many tags exist. */
	readonly count: number;
	readonly direction: "next" | "prev";
	/** Whether the traversal wraps last ↔ first. */
	readonly loop: boolean;
	/** Whether the tag at `index` may hold the highlight. */
	readonly isEnabled: (index: number) => boolean;
};

/**
 * The next enabled tag index in `direction`, wrapping when `loop`, else `null`.
 *
 * From `current === null` it answers the first (`"next"`) or last (`"prev"`) enabled index, which is
 * what `Home`, `End`, `Backspace` and the arrow-into-the-list transitions need. Unlike upstream's
 * `findNextEnabledIndex`, which builds `[0..enabledCount-1]` and then treats those *positions* as
 * value indices, this walks real value indices — identical while nothing is disabled, correct once
 * something is (divergence D-5).
 */
export function findAdjacentIndex({
	current,
	count,
	direction,
	loop,
	isEnabled,
}: FindAdjacentIndexOptions): number | null {
	const enabled: number[] = [];
	for (let index = 0; index < count; index++) {
		if (isEnabled(index)) enabled.push(index);
	}
	if (enabled.length === 0) return null;

	const first = enabled[0] ?? null;
	const last = enabled[enabled.length - 1] ?? null;

	if (current === null) return direction === "prev" ? last : first;

	if (direction === "next") {
		const next = enabled.find((index) => index > current);
		return next ?? (loop ? first : null);
	}

	const previous = enabled.filter((index) => index < current).pop();
	return previous ?? (loop ? last : null);
}

export type TagsInputRootStateProps = {
	readonly getValue: () => string[];
	readonly setValue: (value: string[]) => void;
	readonly getOnValidate: () => ((value: string) => boolean) | undefined;
	readonly getOnInvalid: () => ((value: string) => void) | undefined;
	readonly getDisplayValue: () => (value: string) => string;
	readonly getAddOnPaste: () => boolean;
	readonly getAddOnTab: () => boolean;
	readonly getDisabled: () => boolean;
	readonly getEditable: () => boolean;
	readonly getLoop: () => boolean;
	readonly getReadOnly: () => boolean;
	readonly getBlurBehavior: () => TagsInputBlurBehavior;
	readonly getDelimiter: () => string;
	readonly getMax: () => number;
	readonly getDir: () => Direction;
	/** The one `$props.id()` every part's id is derived from. */
	readonly id: string;
};

/**
 * What a mounted `<TagsInput.Item>` tells the root about itself, so navigation can skip it and the
 * input's `aria-activedescendant` can point at it.
 */
type ItemRegistration = {
	readonly getValue: () => string;
	readonly getDisabled: () => boolean;
	readonly getId: () => string;
};

/**
 * One instance per `<TagsInput.Root>`, published on context.
 *
 * Replaces upstream's 26-field `TagsInputContextValue` plus its
 * `useControllableState` and `useItemCollection`. Reactive inputs arrive as getter functions rather
 * than snapshots, and the value is read straight from the root's `$bindable` prop — there is no
 * mirror `$state`, which is what lets an authoritative parent decline a write.
 */
export class TagsInputRootState {
	// $derived below is lazy at runtime (evaluated only when the field is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: TagsInputRootStateProps;

	/** The single tag selected by keyboard or pointer; `null` means the caret owns the interaction. */
	highlightedIndex = $state<number | null>(null);
	/** The single tag currently rendered as an inline edit field. */
	editingIndex = $state<number | null>(null);
	/** Transient: set by a rejected single add or update, cleared by the next successful one. */
	isInvalidInput = $state(false);
	/** Transient: what the root's polite live region announces — set on removal (divergence D-9). */
	announcement = $state("");
	/** Upstream's `inputRef` — the `<TagsInput.Input>` element every refocus lands on. */
	inputElement = $state<HTMLInputElement | null>(null);

	// `$state.raw`: the registrations are opaque holders of getter functions, and a deep proxy
	// would make the teardown's identity comparison against the original object fail.
	#items = $state.raw<readonly ItemRegistration[]>([]);
	#hasLabel = $state(false);

	readonly value: string[] = $derived(this.#props.getValue());
	readonly count: number = $derived(this.value.length);
	readonly disabled: boolean = $derived(this.#props.getDisabled());
	readonly readOnly: boolean = $derived(this.#props.getReadOnly());
	readonly editable: boolean = $derived(this.#props.getEditable());
	readonly loop: boolean = $derived(this.#props.getLoop());
	readonly addOnPaste: boolean = $derived(this.#props.getAddOnPaste());
	readonly addOnTab: boolean = $derived(this.#props.getAddOnTab());
	readonly blurBehavior: TagsInputBlurBehavior = $derived(this.#props.getBlurBehavior());
	readonly delimiter: string = $derived(this.#props.getDelimiter());
	readonly max: number = $derived(this.#props.getMax());
	readonly dir: Direction = $derived(this.#props.getDir());

	readonly inputId: string = $derived(`${this.#props.id}-input`);
	readonly labelId: string = $derived(`${this.#props.id}-label`);
	/** `undefined` unless a `<TagsInput.Label>` is mounted, so no idref ever dangles (divergence D-6). */
	readonly labelledBy: string | undefined = $derived(this.#hasLabel ? this.labelId : undefined);

	/** The tag values a mounted item reported as `disabled`. */
	readonly #disabledValues: readonly string[] = $derived(
		this.#items.filter((item) => item.getDisabled()).map((item) => item.getValue()),
	);

	/**
	 * The highlighted item's DOM id, for the input's `aria-activedescendant`. Upstream renders no
	 * activedescendant at all, which leaves the keyboard highlight inaudible to assistive
	 * technology (divergence D-9).
	 */
	readonly highlightedItemId: string | undefined = $derived.by(() => {
		const index = this.highlightedIndex;
		if (index === null) return undefined;
		const value = this.value[index];
		if (value === undefined) return undefined;
		return this.#items.find((item) => item.getValue() === value)?.getId();
	});

	constructor(props: TagsInputRootStateProps) {
		this.#props = props;
	}

	/** Render-only: the value itself is never transformed by it (divergence D-3). */
	displayValue(value: string): string {
		return this.#props.getDisplayValue()(value);
	}

	isEnabledIndex(index: number): boolean {
		const value = this.value[index];
		return value !== undefined && !this.#disabledValues.includes(value);
	}

	/**
	 * Called from `<TagsInput.Item>`'s `$effect`; the returned thunk is its teardown. Both reads of
	 * the list are untracked: the caller is an effect, and subscribing it to the very list it is
	 * appending to would re-run it forever.
	 */
	registerItem(
		getValue: () => string,
		getDisabled: () => boolean,
		getId: () => string,
	): () => void {
		const registration: ItemRegistration = { getValue, getDisabled, getId };
		this.#items = [...untrack(() => this.#items), registration];
		return () => {
			this.#items = untrack(() => this.#items).filter((item) => item !== registration);
		};
	}

	/** Called from `<TagsInput.Label>`'s `$effect`; the returned thunk is its teardown. */
	registerLabel(): () => void {
		this.#hasLabel = true;
		return () => {
			this.#hasLabel = false;
		};
	}

	#adjacentIndex(current: number | null, direction: "next" | "prev"): number | null {
		return findAdjacentIndex({
			current,
			count: this.count,
			direction,
			loop: this.loop,
			isEnabled: (index) => this.isEnabledIndex(index),
		});
	}

	#focusInput(): void {
		this.inputElement?.focus();
	}

	/**
	 * Upstream `onItemAdd`, asymmetries included: the `max` check runs
	 * before the trim and reports the *untrimmed* text, the paste path never touches `isInvalidInput`
	 * and reports nothing for an `onValidate` rejection, and a duplicate returns `true` so the input
	 * clears without the tag being added twice.
	 *
	 * @returns whether the caller should clear the text input.
	 */
	addItem(text: string, options?: { viaPaste?: boolean }): boolean {
		if (this.disabled || this.readOnly) return false;

		const value = this.value;
		const max = this.max;
		const onInvalid = this.#props.getOnInvalid();
		const onValidate = this.#props.getOnValidate();

		if (this.addOnPaste && options?.viaPaste) {
			const candidates = splitByDelimiter(text, this.delimiter);

			if (value.length + candidates.length > max && max > 0) {
				onInvalid?.(text);
				return false;
			}

			for (const candidate of candidates) {
				if (value.includes(candidate)) onInvalid?.(candidate);
			}

			// Upstream's `[...new Set(candidates.filter(…))]`: drop what is already a tag, then keep only
			// the first occurrence of each remaining candidate.
			const fresh = candidates.filter(
				(candidate, position) =>
					!value.includes(candidate) && candidates.indexOf(candidate) === position,
			);
			const valid = fresh.filter((candidate) => !onValidate || onValidate(candidate));

			if (valid.length === 0) return false;

			this.#props.setValue([...value, ...valid]);
			return true;
		}

		if (value.length >= max && max > 0) {
			onInvalid?.(text);
			return false;
		}

		const trimmed = text.trim();

		// Upstream commits whitespace-only text as an empty tag; rejected here instead, leaving the
		// typed text in the field (divergence D-10).
		if (!trimmed) return false;

		if (onValidate && !onValidate(trimmed)) {
			this.isInvalidInput = true;
			onInvalid?.(trimmed);
			return false;
		}

		if (value.includes(trimmed)) {
			this.isInvalidInput = true;
			onInvalid?.(trimmed);
			return true;
		}

		this.#props.setValue([...value, trimmed]);
		this.highlightedIndex = null;
		this.editingIndex = null;
		this.isInvalidInput = false;
		return true;
	}

	/**
	 * Upstream `onItemUpdate`, storing the **raw** trimmed value rather
	 * than `displayValue(trimmed)`: the display transform is render-only (divergence D-3), and the
	 * edit replaces the tag in place rather than appending (divergence D-4).
	 */
	updateItem(index: number, text: string): void {
		if (this.disabled || this.readOnly) return;
		if (index === -1) return;

		const onInvalid = this.#props.getOnInvalid();
		const onValidate = this.#props.getOnValidate();
		const trimmed = text.trim();

		// Same empty-commit guard as `addItem`: the edit stays open rather than blanking the tag
		// (divergence D-10).
		if (!trimmed) return;

		// A commit that changes nothing still closes the edit below, but skips the checks the current
		// value already passed and the `setValue` — `onValueChange` fires only on a real change.
		if (trimmed !== this.value[index]) {
			if (this.value.some((value, position) => position !== index && value === trimmed)) {
				this.isInvalidInput = true;
				onInvalid?.(trimmed);
				return;
			}

			if (onValidate && !onValidate(trimmed)) {
				this.isInvalidInput = true;
				onInvalid?.(trimmed);
				return;
			}

			const next = [...this.value];
			next[index] = trimmed;

			this.#props.setValue(next);
		}

		this.highlightedIndex = index;
		this.editingIndex = null;
		this.isInvalidInput = false;

		// The edit field has to unmount before focus can land on the text input, which is one flush
		// away — upstream's `requestAnimationFrame` is waiting for exactly that.
		void tick().then(() => this.#focusInput());
	}

	/** Upstream `onItemRemove`. */
	removeItem(index: number): void {
		if (this.disabled || this.readOnly) return;
		if (index === -1) return;

		const removed = this.value[index];
		const next = [...this.value];
		next.splice(index, 1);

		this.#props.setValue(next);
		// `aria-activedescendant` can only name a tag that still exists, so the removal itself is
		// announced through the root's live region (divergence D-9).
		if (removed !== undefined) this.announcement = `${this.displayValue(removed)} removed`;
		this.highlightedIndex = null;
		this.editingIndex = null;
		this.#focusInput();
	}

	/** Upstream `onItemLeave`. */
	leaveItem(): void {
		this.highlightedIndex = null;
		this.editingIndex = null;
		this.#focusInput();
	}

	/** Upstream `<TagsInputClear>`'s click handler. */
	clear(): void {
		if (this.disabled || this.readOnly) return;
		// A force-mounted `<TagsInput.Clear>` stays clickable while empty; `onValueChange` fires only
		// on a real change.
		if (this.value.length === 0) return;

		this.#props.setValue([]);
		this.highlightedIndex = null;
		this.editingIndex = null;
		this.#focusInput();
	}

	/**
	 * Upstream `onInputKeydown`. Navigation engages only with the caret
	 * at position 0, and horizontal keys are mapped through `dir` before anything else.
	 */
	onInputKeydown(event: KeyboardEvent): void {
		const target = event.target;
		if (!(target instanceof HTMLInputElement)) return;

		const dir = this.dir;
		const isArrowStart =
			(event.key === "ArrowLeft" && dir === "ltr") || (event.key === "ArrowRight" && dir === "rtl");
		const isArrowEnd =
			(event.key === "ArrowRight" && dir === "ltr") || (event.key === "ArrowLeft" && dir === "rtl");

		if (target.value && target.selectionStart !== 0) {
			this.highlightedIndex = null;
			this.editingIndex = null;
			return;
		}

		switch (event.key) {
			case "Backspace":
			case "Delete": {
				if (target.selectionStart !== 0 || target.selectionEnd !== 0) break;

				if (this.highlightedIndex !== null) {
					const removed = this.highlightedIndex;
					// `next` indexes the pre-removal list: a `loop` wrap can land at or past the removed
					// tag, so shift it back — and drop it when the wrap landed on the removed tag itself.
					let next = this.#adjacentIndex(removed, "prev");
					this.removeItem(removed);
					if (next !== null) {
						if (next === removed) next = null;
						else if (next > removed) next -= 1;
					}
					this.highlightedIndex = next;
					event.preventDefault();
				} else if (event.key === "Backspace" && this.count > 0) {
					this.highlightedIndex = this.#adjacentIndex(null, "prev");
					event.preventDefault();
				}
				break;
			}
			case "Enter": {
				// Same guard as `TagsInputItemState.edit()`, repeated so it holds for a caller reaching
				// the root state directly rather than through an item.
				if (this.highlightedIndex !== null && this.editable && !this.disabled && !this.readOnly) {
					this.editingIndex = this.highlightedIndex;
					event.preventDefault();
				}
				break;
			}
			case "ArrowLeft":
			case "ArrowRight": {
				if (
					target.selectionStart === 0 &&
					isArrowStart &&
					this.highlightedIndex === null &&
					this.count > 0
				) {
					this.highlightedIndex = this.#adjacentIndex(null, "prev");
					event.preventDefault();
				} else if (this.highlightedIndex !== null) {
					const next = this.#adjacentIndex(this.highlightedIndex, isArrowStart ? "prev" : "next");
					if (next !== null) {
						this.highlightedIndex = next;
						event.preventDefault();
					} else if (isArrowEnd) {
						this.highlightedIndex = null;
						target.setSelectionRange(0, 0);
					}
				}
				break;
			}
			case "Home": {
				if (this.highlightedIndex !== null) {
					this.highlightedIndex = this.#adjacentIndex(null, "next");
					event.preventDefault();
				}
				break;
			}
			case "End": {
				if (this.highlightedIndex !== null) {
					this.highlightedIndex = this.#adjacentIndex(null, "prev");
					event.preventDefault();
				}
				break;
			}
			case "Escape": {
				this.highlightedIndex = null;
				this.editingIndex = null;
				target.setSelectionRange(0, 0);
				break;
			}
		}
	}
}

export type TagsInputItemStateProps = {
	readonly root: TagsInputRootState;
	readonly getValue: () => string;
	readonly getDisabled: () => boolean;
	/** The item's own `$props.id()`. */
	readonly id: string;
};

/**
 * One instance per `<TagsInput.Item>`, published on context for its text and delete parts.
 *
 * Upstream `TagsInputItemContextValue` carried the same eight fields as
 * snapshots computed in the item component; keeping them derived here means the item, its text and
 * its delete button all read one source of truth.
 */
export class TagsInputItemState {
	#props!: TagsInputItemStateProps;

	readonly value: string = $derived(this.#props.getValue());
	readonly index: number = $derived(this.#props.root.value.indexOf(this.value));
	readonly isHighlighted: boolean = $derived(this.index === this.#props.root.highlightedIndex);
	readonly isEditing: boolean = $derived(this.index === this.#props.root.editingIndex);
	readonly disabled: boolean = $derived(this.#props.getDisabled() || this.#props.root.disabled);
	readonly displayValue: string = $derived(this.#props.root.displayValue(this.value));
	readonly id: string = $derived(this.#props.id);
	readonly textId: string = $derived(`${this.#props.id}-text`);
	readonly dataState: "active" | "inactive" = $derived(this.isHighlighted ? "active" : "inactive");

	get root(): TagsInputRootState {
		return this.#props.root;
	}

	constructor(props: TagsInputItemStateProps) {
		this.#props = props;
	}

	/** Upstream `onItemSelect`: highlight, but keep focus on the input. */
	select(): void {
		if (this.disabled || this.isEditing) return;
		this.#props.root.highlightedIndex = this.index;
		this.#props.root.inputElement?.focus();
	}

	/**
	 * `readOnly` is checked here as well as in `updateItem`: a read-only tags input must never even
	 * open the edit field, not merely decline the commit.
	 */
	edit(): void {
		if (!this.#props.root.editable || this.disabled || this.#props.root.readOnly) return;
		this.#props.root.editingIndex = this.index;
	}

	remove(): void {
		if (this.disabled) return;
		this.#props.root.removeItem(this.index);
	}
}

const TAGS_INPUT_CONTEXT_KEY = Symbol("tags-input");

export function setTagsInputContext(state: TagsInputRootState): TagsInputRootState {
	return setContext(TAGS_INPUT_CONTEXT_KEY, state);
}

/** Read the root's state, throwing when there is no `<TagsInput.Root>` ancestor. */
export function getTagsInputContext(consumerName: string): TagsInputRootState {
	if (!hasContext(TAGS_INPUT_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`<TagsInput.Root>\`.`);
	}
	return getContext<TagsInputRootState>(TAGS_INPUT_CONTEXT_KEY);
}

const TAGS_INPUT_ITEM_CONTEXT_KEY = Symbol("tags-input-item");

export function setTagsInputItemContext(state: TagsInputItemState): TagsInputItemState {
	return setContext(TAGS_INPUT_ITEM_CONTEXT_KEY, state);
}

/** Read the item's state, throwing when there is no `<TagsInput.Item>` ancestor. */
export function getTagsInputItemContext(consumerName: string): TagsInputItemState {
	if (!hasContext(TAGS_INPUT_ITEM_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`<TagsInput.Item>\`.`);
	}
	return getContext<TagsInputItemState>(TAGS_INPUT_ITEM_CONTEXT_KEY);
}
