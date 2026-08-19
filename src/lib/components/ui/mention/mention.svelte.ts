import type { Direction } from "$lib/components/ui/direction-provider/index.js";
import { getContext, hasContext, setContext, tick, untrack } from "svelte";

import {
	addMentionSpan,
	createCaretAnchor,
	measureTextWidth,
	removeMentionSpans,
	resolveMentionTrigger,
	shiftMentionSpans,
	type CaretAnchor,
	type MentionField,
	type MentionSpan,
} from "./mention-caret.js";
import { MentionFilterStore, normalizeWithGaps } from "./mention-filter.js";

/** The four moves {@link MentionRootState.highlightMove} understands. */
export type MentionHighlightDirection = "next" | "prev" | "first" | "last";

/**
 * One registered `<Mention.Item>`.
 *
 * A plain immutable snapshot rather than a bag of getters: the item re-registers whenever any field
 * moves, so the collection never reaches back into a component that may already be gone.
 */
export type MentionItemData = {
	/** The rendered element — `null` while the item is filtered out. Collection key and DOM-order source. */
	readonly element: HTMLElement | null;
	/** The `aria-activedescendant` target. */
	readonly id: string;
	/** **Invariant: never `''`** — `<Mention.Item>` throws at initialisation. */
	readonly value: string;
	/** The `label` prop, else `value`. This is what is spliced into the field text. */
	readonly label: string;
	/** The item's own `disabled`, OR-ed with the root's. */
	readonly disabled: boolean;
};

/** A {@link MentionItemData} whose element is in the DOM — what navigation and selection walk. */
export type MentionMountedItem = MentionItemData & { readonly element: HTMLElement };

/** Upstream's `compareNodePosition` (the shared-utils reference `lib/node.ts`). */
function compareNodePosition(a: Node, b: Node): number {
	const position = a.compareDocumentPosition(b);
	if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
	if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
	return 0;
}

/**
 * Upstream's `useCollection` — a DOM-ordered item registry.
 *
 * A filtered-out `<Mention.Item>` renders nothing but stays registered with a `null` element, which
 * is what lets it come back when the search clears: {@link entries} feeds the filter and includes
 * every registration, while {@link getItems} feeds navigation and only includes mounted items.
 */
export class MentionCollection {
	// `$state.raw`: entries are replaced wholesale, and a deep proxy would make the teardown's
	// identity comparison against the original snapshot fail.
	#items = $state.raw<readonly MentionItemData[]>([]);

	/** Every registered item's value — the filter store's input. */
	readonly entries: readonly { readonly value: string }[] = $derived(
		this.#items.map((item) => ({ value: item.value })),
	);

	/** How many items are registered, mounted or not. */
	readonly size: number = $derived(this.#items.length);

	/**
	 * Called from the item's `$effect`; the returned thunk is its teardown. Both reads of the list
	 * are untracked — the caller is an effect, and subscribing it to the very list it appends to
	 * would re-run it forever.
	 */
	register(item: MentionItemData): () => void {
		this.#items = [...untrack(() => this.#items), item];
		return () => {
			this.#items = untrack(() => this.#items).filter((registered) => registered !== item);
		};
	}

	/** Every mounted item, in document order. */
	getItems(): MentionMountedItem[] {
		return this.#items
			.filter((item): item is MentionMountedItem => item.element !== null)
			.sort((a, b) => compareNodePosition(a.element, b.element));
	}

	/** Upstream `getEnabledItems`. */
	getEnabledItems(): MentionMountedItem[] {
		return this.getItems().filter((item) => !item.disabled);
	}
}

export type MentionRootStateProps = {
	readonly getValues: () => string[];
	readonly setValues: (values: string[]) => void;
	readonly getOpen: () => boolean;
	readonly setOpen: (open: boolean) => void;
	readonly getInputValue: () => string;
	readonly setInputValue: (value: string) => void;
	readonly getTrigger: () => string;
	readonly getOnFilter: () => ((options: string[], term: string) => string[]) | undefined;
	readonly getDisabled: () => boolean;
	readonly getReadonly: () => boolean;
	readonly getExactMatch: () => boolean;
	readonly getLoop: () => boolean;
	readonly getModal: () => boolean;
	readonly getDir: () => Direction;
	/** The one `$props.id()` every part's id derives from. */
	readonly id: string;
};

/** Keys the popup owns while it is open, so the caret never moves under it. */
const NAVIGATION_KEYS = ["ArrowDown", "ArrowUp", "Enter", "Escape", "Tab", "Home", "End"] as const;

/**
 * One instance per `<Mention.Root>`, published on the root context.
 *
 * Replaces upstream's 35-field `MentionContextValue` plus its
 * `useControllableState`, `useCollection`, `useFilterStore` and `useListHighlighting`. Reactive
 * inputs arrive as getter functions rather than snapshots, and the value is read straight from the
 * Root's `$bindable` props — there is no mirror `$state`, which is what lets an authoritative parent
 * decline a write.
 */
export class MentionRootState {
	// $derived below is lazy at runtime (evaluated only when the field is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: MentionRootStateProps;

	/** The inserted mentions' positions in the field text; replaced wholesale on every edit. */
	mentions = $state.raw<MentionSpan[]>([]);
	/** The text between the trigger and the caret — upstream's `filterStore.search`. */
	search = $state("");
	/** The highlighted item's element. `aria-activedescendant` and `data-highlighted` follow it. */
	highlightedElement = $state<HTMLElement | null>(null);
	/** The virtual anchor handed to `Popover.Content`'s `customAnchor`. */
	caretAnchor = $state<CaretAnchor | null>(null);
	/** Every caret read and write target. */
	inputElement = $state<MentionField | null>(null);
	/** The content stays mounted but clipped while a paste resolves, so items can register. */
	isPasting = $state(false);

	/**
	 * Set from the root's teardown. Deliberately a plain field, not `$state`: every deferred path
	 * below checks it *before* touching a rune, so nothing reads a derived whose effect is already
	 * gone when a component unmounts mid-flight.
	 */
	#destroyed = false;

	/**
	 * The option set as last seen with the popup mounted.
	 *
	 * A closed popup unmounts its items, so `collection.entries` is empty for reasons that have
	 * nothing to do with the search. Without this memory, the "no items match, so do not open" rule
	 * would fire on *every* attempt to open with a non-empty search — including the legitimate one
	 * where the caret is put back inside an existing query.
	 */
	#knownEntries: readonly { readonly value: string }[] = [];

	readonly collection = new MentionCollection();

	readonly values: string[] = $derived(this.#props.getValues());
	readonly open: boolean = $derived(this.#props.getOpen());
	readonly inputValue: string = $derived(this.#props.getInputValue());
	readonly trigger: string = $derived(this.#props.getTrigger());
	readonly disabled: boolean = $derived(this.#props.getDisabled());
	readonly readonly: boolean = $derived(this.#props.getReadonly());
	readonly exactMatch: boolean = $derived(this.#props.getExactMatch());
	readonly loop: boolean = $derived(this.#props.getLoop());
	readonly modal: boolean = $derived(this.#props.getModal());
	readonly dir: Direction = $derived(this.#props.getDir());

	readonly dataState: "open" | "closed" = $derived(this.open ? "open" : "closed");

	readonly inputId: string = $derived(`${this.#props.id}-input`);
	readonly labelId: string = $derived(`${this.#props.id}-label`);
	readonly listId: string = $derived(`${this.#props.id}-list`);

	/**
	 * The scored view of the collection, reusing the already-ported filter module.
	 * Upstream's explicit `onItemsFilter()` call, made automatic — which is also why the
	 * "no items left" check can run synchronously instead of in `useFilterStore`'s callback.
	 */
	readonly filter: MentionFilterStore = $derived.by(() =>
		new MentionFilterStore(this.search).run(this.collection.entries, {
			exactMatch: this.exactMatch,
			onFilter: this.#props.getOnFilter(),
		}),
	);

	/** What keyboard navigation walks: mounted, enabled and not filtered out. */
	readonly visibleItems: MentionMountedItem[] = $derived(
		this.collection.getEnabledItems().filter((item) => this.isItemVisible(item.value)),
	);

	readonly highlightedItem: MentionMountedItem | null = $derived.by(() => {
		const element = this.highlightedElement;
		if (!element) return null;
		return this.collection.getItems().find((item) => item.element === element) ?? null;
	});

	constructor(props: MentionRootStateProps) {
		this.#props = props;
	}

	/** Called from the root's `$effect` teardown; stops every in-flight deferred write. */
	destroy(): void {
		this.#destroyed = true;
	}

	#rememberEntries(): void {
		const live = this.collection.entries;
		if (live.length > 0) this.#knownEntries = live;
	}

	/**
	 * How many items the current search keeps, or `-1` when the answer is not knowable yet because
	 * no item has ever registered. Scores against {@link #knownEntries} while the popup is closed.
	 */
	#matchCount(): number {
		this.#rememberEntries();

		if (this.collection.entries.length > 0) return this.filter.itemCount;
		if (this.#knownEntries.length === 0) return -1;

		return new MentionFilterStore(this.search).run(this.#knownEntries, {
			exactMatch: this.exactMatch,
			onFilter: this.#props.getOnFilter(),
		}).itemCount;
	}

	/** Upstream `getIsItemVisible` (`use-filter-store.ts:148-155`). */
	isItemVisible(value: string): boolean {
		return this.filter.isItemVisible(value);
	}

	isSelected(value: string): boolean {
		return this.values.includes(value);
	}

	/** Upstream `setValue`. */
	setValues(next: string[]): void {
		this.#props.setValues(next);
	}

	addValue(value: string): void {
		this.#props.setValues([...this.values, value]);
	}

	removeValues(removed: readonly string[]): void {
		this.#props.setValues(this.values.filter((value) => !removed.includes(value)));
	}

	/** Upstream `setInputValue`. */
	setInputValue(next: string): void {
		this.#props.setInputValue(next);
	}

	/**
	 * Upstream `onOpenChange`: a request to open while a non-empty
	 * search matches nothing is ignored, opening auto-highlights the first item, and closing drops
	 * both the highlight and the anchor.
	 */
	setOpen(next: boolean): void {
		if (next && this.search && this.#matchCount() === 0) return;

		// Guarded so `onOpenChange` fires only on a real transition, matching `useControllableState`.
		if (next !== this.open) this.#props.setOpen(next);

		if (next) {
			void this.#highlightFirstWhenReady();
			return;
		}

		this.highlightedElement = null;
		this.caretAnchor = null;
	}

	/** Upstream's local `onMenuClose`. */
	closeMenu(): void {
		this.setOpen(false);
		this.highlightedElement = null;
		this.search = "";
	}

	/**
	 * Upstream `useListHighlighting`'s `onHighlightMove` (`use-list-highlighting.ts:22-73`), over the
	 * visible, enabled items only.
	 */
	highlightMove(direction: MentionHighlightDirection): void {
		const items = this.visibleItems;
		if (items.length === 0) return;

		const currentIndex = items.findIndex((item) => item.element === this.highlightedElement);
		const lastIndex = items.length - 1;
		let nextIndex: number;

		switch (direction) {
			case "next": {
				nextIndex = currentIndex + 1;
				nextIndex = nextIndex > lastIndex ? (this.loop ? 0 : lastIndex) : nextIndex;
				break;
			}
			case "prev": {
				nextIndex = currentIndex - 1;
				nextIndex = nextIndex < 0 ? (this.loop ? lastIndex : 0) : nextIndex;
				break;
			}
			case "first":
				nextIndex = 0;
				break;
			case "last":
				nextIndex = lastIndex;
				break;
		}

		const nextItem = items[nextIndex];
		if (!nextItem) return;

		nextItem.element.scrollIntoView({ block: "nearest" });
		this.highlightedElement = nextItem.element;
	}

	/**
	 * Upstream `onMentionAdd` — the splice that inserts
	 * `<trigger><label> ` at `triggerIndex` and copies everything before it and everything from the
	 * caret on byte for byte.
	 */
	addMention(value: string, triggerIndex: number): void {
		const input = this.inputElement;
		if (!input) return;
		if (this.disabled || this.readonly) return;

		const label =
			this.collection.getEnabledItems().find((item) => item.value === value)?.label ?? value;
		const mentionText = `${this.trigger}${label}`;
		const text = input.value;
		const insertionPoint = input.selectionStart ?? triggerIndex;
		const nextText = `${text.slice(0, triggerIndex)}${mentionText} ${text.slice(insertionPoint)}`;
		const insertionLength = mentionText.length + 1;

		this.mentions = addMentionSpan(
			this.mentions,
			{ value, start: triggerIndex, end: triggerIndex + mentionText.length },
			insertionPoint,
			insertionLength,
		);

		input.value = nextText;
		this.setInputValue(nextText);
		this.addValue(value);

		const caret = triggerIndex + mentionText.length + 1;
		input.setSelectionRange(caret, caret);

		this.setOpen(false);
		this.highlightedElement = null;
		this.search = "";
	}

	/** Upstream `onMentionsRemove`. */
	removeMentions(spans: readonly MentionSpan[]): void {
		this.mentions = removeMentionSpans(this.mentions, spans);
	}

	/**
	 * Upstream `onMentionUpdate`: decide whether the caret sits in an
	 * active mention query, and open, filter or close accordingly. Returns whether the popup is
	 * driving the caret.
	 */
	updateTrigger(element: MentionField, caret: number | null = null): boolean {
		if (this.disabled || this.readonly) return false;

		const position = caret ?? element.selectionStart;
		if (position === null) return false;

		this.#rememberEntries();

		const match = resolveMentionTrigger(element.value, position, this.trigger, this.mentions);

		if (!match) {
			if (this.open) this.closeMenu();
			return false;
		}

		this.search = match.search;

		// Upstream closes from `useFilterStore`'s `onCallback` once the pass returns nothing; here the
		// store is a `$derived`, so the count is already fresh and the check is synchronous.
		if (this.search && this.#matchCount() === 0) {
			this.setOpen(false);
			this.highlightedElement = null;
			return false;
		}

		this.caretAnchor = createCaretAnchor(element, match.triggerIndex, this.dir);
		this.setOpen(true);
		return true;
	}

	/** Upstream `onChange`. */
	onInputChange(input: MentionField): void {
		if (this.disabled || this.readonly) return;

		const nextText = input.value;
		const caret = input.selectionStart ?? 0;
		const delta = nextText.length - this.inputValue.length;

		if (delta !== 0) this.mentions = shiftMentionSpans(this.mentions, caret, delta);

		this.setInputValue(nextText);
		this.updateTrigger(input);
	}

	/** Upstream `onBeforeInput` — mobile `deleteContentBackward`. */
	onInputBeforeInput(event: InputEvent, input: MentionField): void {
		if (this.disabled || this.readonly) return;
		if (event.inputType !== "deleteContentBackward") return;

		const caret = input.selectionStart ?? 0;
		const span = this.mentions.find((m) => caret > m.start && caret <= m.end);
		if (!span) return;

		event.preventDefault();
		this.#spliceOutMention(input, span);
	}

	/** Upstream `onCut`. */
	async onInputCut(input: MentionField): Promise<void> {
		if (this.disabled || this.readonly) return;

		const caret = input.selectionStart ?? 0;
		const selectionEnd = input.selectionEnd ?? caret;
		if (caret === selectionEnd) return;

		const affected = this.#mentionsInRange(caret, selectionEnd);
		if (affected.length === 0) return;

		// The browser owns the clipboard write and the text removal; the state catches up afterwards.
		await tick();
		if (this.#destroyed) return;

		const cutValues = affected.map((span) => span.value);
		this.removeValues(cutValues);
		// Deliberately not {@link removeMentions}: the native `input` event already ran
		// `onInputChange`, whose `shiftMentionSpans` re-based the survivors — `removeMentionSpans`
		// would shift them a second time, so the cut spans leave by value only.
		this.mentions = this.mentions.filter((span) => !cutValues.includes(span.value));
		this.setInputValue(input.value);
	}

	/** Upstream `onSelect` / `onFocus` / `onClick`. */
	onInputCaretMove(input: MentionField): void {
		this.updateTrigger(input);
	}

	/**
	 * Upstream `onPointerDown`: a press inside an inserted mention is
	 * atomic — the default caret placement is suppressed and the caret snaps to the mention's end.
	 */
	async onInputPointerDown(event: PointerEvent, input: MentionField): Promise<void> {
		if (this.disabled || this.readonly) return;
		if (input.value.length === 0) return;

		const rect = input.getBoundingClientRect();
		const style = window.getComputedStyle(input);
		const paddingLeft = Number.parseFloat(style.paddingLeft);
		const clickX = event.clientX - rect.left - (Number.isFinite(paddingLeft) ? paddingLeft : 0);

		const textWidth = measureTextWidth(input.value, input);
		const charWidth = textWidth / input.value.length;
		if (!Number.isFinite(charWidth) || charWidth <= 0) return;

		const approximateCaret = Math.round(clickX / charWidth);
		const span = this.mentions.find(
			(mention) => approximateCaret >= mention.start && approximateCaret < mention.end,
		);
		if (!span) return;

		event.preventDefault();
		// The caret write has to land after the browser's own pointer handling.
		await tick();
		if (this.#destroyed) return;

		input.setSelectionRange(span.end, span.end);
	}

	/**
	 * Upstream `onKeyDown`: atomic-mention caret navigation and
	 * deletion first, then the popup's own key set.
	 */
	onInputKeydown(event: KeyboardEvent, input: MentionField): void {
		const caret = input.selectionStart ?? 0;
		const selectionEnd = input.selectionEnd ?? caret;
		const hasSelection = caret !== selectionEnd;

		if (
			(event.key === "ArrowLeft" || event.key === "ArrowRight") &&
			!hasSelection &&
			// Never override a Shift+Arrow selection.
			!event.shiftKey
		) {
			if (this.#jumpOverMention(event, input, caret)) return;
			// No mention adjacent: let the browser do its own word navigation.
			if (event.metaKey || event.ctrlKey) return;
		}

		// Every branch below rewrites the field text itself rather than letting the browser edit it, so
		// each stays behind the same guard as the other value-changing paths.
		const canEdit = !this.disabled && !this.readonly;

		if (canEdit && (event.key === "Backspace" || event.key === "Delete") && hasSelection) {
			if (this.#deleteSelection(event, input, caret, selectionEnd)) return;
		}

		if (canEdit && event.key === "Backspace" && !this.open && !hasSelection) {
			if (this.#backspaceMention(event, input, caret)) return;
		}

		if (canEdit && event.key === "Delete" && !this.open && !hasSelection) {
			if (this.#deleteMention(event, input, caret)) return;
		}

		if (!this.open) return;

		const isNavigationKey = (NAVIGATION_KEYS as readonly string[]).includes(event.key);
		// `Tab` is never consumed — it either selects (modal) or lets focus move. `Enter` with nothing
		// highlighted is not consumed either, so the field keeps its native newline behaviour.
		const consumesKey =
			isNavigationKey &&
			event.key !== "Tab" &&
			!(event.key === "Enter" && this.highlightedItem === null);
		if (consumesKey) event.preventDefault();

		switch (event.key) {
			case "Enter": {
				if (!this.highlightedItem) {
					this.closeMenu();
					return;
				}
				this.#selectHighlighted(input, caret);
				break;
			}
			case "Tab": {
				if (this.modal) {
					event.preventDefault();
					this.#selectHighlighted(input, caret);
					return;
				}
				this.closeMenu();
				break;
			}
			case "ArrowDown": {
				if (this.readonly) return;
				this.highlightMove(this.highlightedItem ? "next" : "first");
				break;
			}
			case "ArrowUp": {
				if (this.readonly) return;
				this.highlightMove(this.highlightedItem ? "prev" : "last");
				break;
			}
			case "Home": {
				// Let the caret move natively for Ctrl/Cmd + Home.
				if (event.metaKey || event.ctrlKey) return;
				if (this.readonly) return;
				this.highlightMove("first");
				break;
			}
			case "End": {
				if (event.metaKey || event.ctrlKey) return;
				if (this.readonly) return;
				this.highlightMove("last");
				break;
			}
			case "Escape": {
				this.closeMenu();
				break;
			}
		}
	}

	/**
	 * Upstream `onPaste`: split the pasted text on the trigger and
	 * rebuild the longest word combination that matches a registered item, keeping everything else
	 * verbatim. Best-effort by upstream's own admission.
	 *
	 * **Divergence from upstream**: upstream returns early when the pasted text carries no
	 * trigger, and never removes the spans the paste overwrote on the trigger-bearing path either — so
	 * a paste over an inserted mention leaves that mention's value in the list with no text behind it.
	 * Here the overwritten range is absorbed on both paths, exactly as {@link onInputCut} does.
	 */
	async onInputPaste(event: ClipboardEvent, input: MentionField): Promise<void> {
		if (this.disabled || this.readonly) return;

		const pastedText = event.clipboardData?.getData("text") ?? "";
		const caret = input.selectionStart ?? 0;
		const selectionEnd = input.selectionEnd ?? caret;

		if (!pastedText.includes(this.trigger)) {
			// Nothing mention-related in range: leave the plain insertion to the browser, and to
			// `onInputChange`'s span shift.
			if (this.#mentionsInRange(caret, selectionEnd).length === 0) return;

			// Otherwise the edit has to be owned here, so the overwritten spans and values leave with
			// the text they described.
			event.preventDefault();
			const removed = this.#absorbRangeReplacement(caret, selectionEnd, pastedText.length);
			const pastedValue =
				input.value.slice(0, caret) + pastedText + input.value.slice(selectionEnd);

			input.value = pastedValue;
			this.setInputValue(pastedValue);
			this.setValues(this.values.filter((value) => !removed.includes(value)));

			const pastedCaret = caret + pastedText.length;
			input.setSelectionRange(pastedCaret, pastedCaret);
			return;
		}

		event.preventDefault();

		const parts = pastedText.split(this.trigger);
		let newText = parts[0] ?? "";

		// Open (clipped) so the items register, exactly like upstream's two-frame hop.
		this.isPasting = true;
		this.setOpen(true);
		await tick();
		await tick();
		if (this.#destroyed) return;

		const items = this.collection.getEnabledItems();
		const newSpans: MentionSpan[] = [];
		const matchedValues: string[] = [];
		const trailingSpaces = /\s+$/.exec(pastedText)?.[0] ?? "";

		for (let index = 1; index < parts.length; index++) {
			const part = parts[index];
			if (!part) continue;

			const words = part.split(/(\s+)/);
			let spaces = "";
			let remainingText = "";
			let matched: MentionMountedItem | undefined;

			// Longest combination first, so "@Olivia Martin" wins over "@Olivia".
			for (let wordCount = words.length; wordCount > 0; wordCount--) {
				const candidateWords = words.slice(0, wordCount).filter((_, i) => i % 2 === 0);
				const candidateText = candidateWords.join(" ").trim();
				if (!candidateText) continue;

				const item = items.find(
					(candidate) => normalizeWithGaps(candidate.value) === normalizeWithGaps(candidateText),
				);
				if (!item) continue;

				matched = item;

				const usedSegments = candidateWords.length * 2 - 1;
				const nextSegment = words[usedSegments];
				const afterNextSegment = words[usedSegments + 1];

				if (nextSegment && /^\s+/.test(nextSegment) && afterNextSegment) {
					spaces = nextSegment;
					remainingText = words.slice(usedSegments + 1).join("");
				} else {
					spaces = "";
					remainingText = words.slice(usedSegments).join("");
				}
				break;
			}

			const spanStart = caret + newText.length;

			if (matched) {
				const label = `${this.trigger}${matched.label}`;
				const shouldAddTrailingSpaces = index === parts.length - 1 && !remainingText;
				newText += label + spaces + remainingText + (shouldAddTrailingSpaces ? trailingSpaces : "");
				matchedValues.push(matched.value);
				newSpans.push({
					value: matched.value,
					start: spanStart,
					end: spanStart + label.length,
				});
			} else {
				const firstWord = words[0] ?? "";
				const spaceSegment = words[1] ?? "";
				const keptSpaces = /^\s+/.test(spaceSegment) ? spaceSegment : "";
				const rest = words.slice(2).join("");
				const shouldAddTrailingSpaces = index === parts.length - 1;
				newText += `${this.trigger}${firstWord}${keptSpaces}${rest}${shouldAddTrailingSpaces ? trailingSpaces : ""}`;
			}
		}

		// Absorb before appending, so the rebuilt spans are not themselves re-based.
		const removed = this.#absorbRangeReplacement(caret, selectionEnd, newText.length);

		const finalValue = input.value.slice(0, caret) + newText + input.value.slice(selectionEnd);
		input.value = finalValue;
		this.setInputValue(finalValue);

		if (newSpans.length > 0) this.mentions = [...this.mentions, ...newSpans];

		if (newSpans.length > 0 || removed.length > 0) {
			this.setValues([
				...this.values.filter((value) => !removed.includes(value)),
				...matchedValues,
			]);
		}

		const nextCaret = caret + newText.length;
		input.setSelectionRange(nextCaret, nextCaret);

		this.isPasting = false;
		this.setOpen(false);
	}

	/** Upstream's local `onItemSelect`, also used by an item click. */
	selectValue(value: string, input: MentionField, caret: number): void {
		if (this.disabled || this.readonly || !value) return;

		const triggerIndex = input.value.lastIndexOf(this.trigger, caret);
		if (triggerIndex === -1) return;

		this.addMention(value, triggerIndex);
	}

	#selectHighlighted(input: MentionField, caret: number): void {
		const highlighted = this.highlightedItem;
		if (!highlighted) return;
		this.selectValue(highlighted.value, input, caret);
	}

	/** Every mention fully or partially inside `[start, end)`. */
	#mentionsInRange(start: number, end: number): MentionSpan[] {
		return this.mentions.filter(
			(span) => (span.start >= start && span.start < end) || (span.end > start && span.end <= end),
		);
	}

	/**
	 * Account for `[start, end)` being replaced by `insertedLength` characters: drop every span the
	 * replacement overwrites and re-base the ones that sit after it.
	 *
	 * Deliberately not {@link removeMentionSpans}, whose shift assumes each removed mention took its
	 * trailing space with it and left nothing behind — here something of a different length is
	 * written in its place, so the survivors move by the signed length delta instead.
	 *
	 * Returns the overwritten values, for the caller to subtract from the value list.
	 */
	#absorbRangeReplacement(start: number, end: number, insertedLength: number): string[] {
		const overwritten = this.#mentionsInRange(start, end);
		if (overwritten.length === 0) return [];

		const delta = insertedLength - (end - start);

		this.mentions = this.mentions
			.filter((span) => !overwritten.includes(span))
			.map((span) =>
				span.start >= end ? { ...span, start: span.start + delta, end: span.end + delta } : span,
			);

		return overwritten.map((span) => span.value);
	}

	/** Remove `span`'s text, its trailing space and its value in one edit. */
	#spliceOutMention(input: MentionField, span: MentionSpan): void {
		const hasTrailingSpace = input.value[span.end] === " ";
		const nextText =
			input.value.slice(0, span.start) + input.value.slice(span.end + (hasTrailingSpace ? 1 : 0));

		input.value = nextText;
		this.setInputValue(nextText);
		this.removeValues([span.value]);
		this.removeMentions([span]);
		input.setSelectionRange(span.start, span.start);
	}

	/** */
	#jumpOverMention(event: KeyboardEvent, input: MentionField, caret: number): boolean {
		const isCtrlOrCmd = event.metaKey || event.ctrlKey;
		const isLeftArrow = event.key === "ArrowLeft";

		const adjacent = this.mentions.find((span) => {
			if (isLeftArrow) {
				const onlySpaces = /^\s*$/.test(input.value.slice(span.end, caret));

				if (isCtrlOrCmd) {
					return caret > span.start && (caret === span.end || (caret > span.end && onlySpaces));
				}

				return caret === span.end || (caret > span.end && caret <= span.end + 1 && onlySpaces);
			}

			const onlySpaces = /^\s*$/.test(input.value.slice(caret, span.start));

			if (isCtrlOrCmd) {
				return (caret >= span.start && caret < span.end) || (caret < span.start && onlySpaces);
			}

			return caret === span.start || (caret < span.start && caret >= span.start - 1 && onlySpaces);
		});

		if (!adjacent) return false;

		event.preventDefault();
		const next = isCtrlOrCmd
			? isLeftArrow
				? adjacent.start
				: adjacent.end
			: isLeftArrow
				? caret > adjacent.end
					? adjacent.end
					: adjacent.start
				: caret < adjacent.start
					? adjacent.start
					: adjacent.end;
		input.setSelectionRange(next, next);
		return true;
	}

	/** */
	#deleteSelection(
		event: KeyboardEvent,
		input: MentionField,
		caret: number,
		selectionEnd: number,
	): boolean {
		const affected = this.#mentionsInRange(caret, selectionEnd);
		if (affected.length === 0) return false;

		event.preventDefault();

		const nextText = input.value.slice(0, caret) + input.value.slice(selectionEnd);
		input.value = nextText;
		this.setInputValue(nextText);
		this.removeValues(affected.map((span) => span.value));
		this.removeMentions(affected);
		input.setSelectionRange(caret, caret);
		return true;
	}

	/** */
	#backspaceMention(event: KeyboardEvent, input: MentionField, caret: number): boolean {
		const isCtrlOrCmd = event.metaKey || event.ctrlKey;

		const span = this.mentions.find((mention) => {
			if (!isCtrlOrCmd) {
				return (
					caret === mention.end ||
					(caret === mention.end + 1 && input.value[mention.end] === " ") ||
					(caret > mention.start && caret <= mention.end)
				);
			}

			// Only whitespace may sit between the mention and the caret.
			return mention.end <= caret && /^\s*$/.test(input.value.slice(mention.end, caret));
		});

		if (!span) return false;

		const hasTrailingSpace = input.value[span.end] === " ";
		const isCaretInsideMention = caret > span.start && caret <= span.end;

		// A bare trailing space is removed on its own first — the mention survives one backspace.
		if (!isCaretInsideMention && !isCtrlOrCmd && hasTrailingSpace && caret === span.end + 1) {
			event.preventDefault();
			const nextText = input.value.slice(0, span.end) + input.value.slice(span.end + 1);
			input.value = nextText;
			this.setInputValue(nextText);
			input.setSelectionRange(span.end, span.end);
			return true;
		}

		event.preventDefault();
		this.#spliceOutMention(input, span);
		return true;
	}

	/**
	 * The forward-delete counterpart of {@link #backspaceMention}.
	 *
	 * **Divergence from upstream**: `mention-input.tsx:484` routes only `Backspace` into the
	 * mention-aware path, so a caret placed immediately before, or inside, an inserted mention and
	 * followed by `Delete` falls through to the browser, which shaves a single character off the
	 * mention's text while its span and its value stay in the lists. Here the whole span, its trailing
	 * space and its value leave in one edit, exactly as `Backspace` does from the other side.
	 *
	 * A caret sitting *at* `span.end` is deliberately not matched: the character in front of it is the
	 * mention's trailing space, and removing only that space mirrors {@link #backspaceMention},
	 * where a bare trailing space goes on its own first and the mention survives one keystroke.
	 */
	#deleteMention(event: KeyboardEvent, input: MentionField, caret: number): boolean {
		const isCtrlOrCmd = event.metaKey || event.ctrlKey;

		const candidates = this.mentions.filter((mention) =>
			isCtrlOrCmd
				? // Only whitespace may sit between the caret and the mention.
					mention.start >= caret && /^\s*$/.test(input.value.slice(caret, mention.start))
				: caret >= mention.start && caret < mention.end,
		);

		// Ctrl/Cmd reaches across whitespace, so more than one span can qualify — take the nearest.
		const span = candidates.reduce<MentionSpan | null>(
			(nearest, mention) => (nearest && nearest.start <= mention.start ? nearest : mention),
			null,
		);
		if (!span) return false;

		event.preventDefault();
		this.#spliceOutMention(input, span);
		return true;
	}

	/**
	 * Upstream's `requestAnimationFrame` hop in `onOpenChange`, waiting
	 * for the freshly-mounted items to register. `tick()` is Svelte's flush point and is
	 * deterministic under Vitest; the retry covers the extra flush `bits-ui`'s presence layer needs.
	 */
	async #highlightFirstWhenReady(): Promise<void> {
		for (let attempt = 0; attempt < 3; attempt++) {
			await tick();
			if (this.#destroyed) return;
			if (this.visibleItems.length > 0) break;
		}

		if (!this.open) return;

		// The safety net for upstream's `useFilterStore` `onCallback`: items that register *after* the
		// popup opened may leave the search matching nothing after all.
		if (this.search && this.collection.entries.length > 0 && this.filter.itemCount === 0) {
			this.setOpen(false);
			return;
		}

		this.highlightedElement = this.visibleItems[0]?.element ?? null;
	}
}

const MENTION_CONTEXT_KEY = Symbol("mention");

export function setMentionContext(state: MentionRootState): MentionRootState {
	return setContext(MENTION_CONTEXT_KEY, state);
}

/** Read the root's state, throwing when there is no `<Mention.Root>` ancestor. */
export function getMentionContext(consumerName: string): MentionRootState {
	if (!hasContext(MENTION_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`<Mention.Root>\`.`);
	}
	return getContext<MentionRootState>(MENTION_CONTEXT_KEY);
}
