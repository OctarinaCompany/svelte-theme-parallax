import type { Direction } from "$lib/components/ui/direction-provider/index.js";
import { DomOrderedCollection } from "$lib/shared/dom-ordered-collection.svelte.js";

/** Every value a segment group's `orientation` accepts, in upstream declaration order. */
export const SEGMENT_ORIENTATIONS = ["horizontal", "vertical"] as const;

/** Every position a segment can occupy, in upstream declaration order. */
export const SEGMENT_POSITIONS = ["isolated", "first", "middle", "last"] as const;

/** `'horizontal' | 'vertical'`. */
export type SegmentOrientation = (typeof SEGMENT_ORIENTATIONS)[number];

/** `'isolated' | 'first' | 'middle' | 'last'`. */
export type SegmentPosition = (typeof SEGMENT_POSITIONS)[number];

/** What a navigation key asks for, once orientation and direction have been applied. */
export type SegmentIntent = "previous" | "next" | "first" | "last";

/**
 * Where a segment sits in its group, from its document-order index.
 *
 * Replaces upstream's `React.Children.map` + `cloneElement` position injection,
 * which has no Svelte equivalent — an unregistered segment
 * (`index === -1`) reads `"isolated"`, which is also the value every segment carries for the first
 * frame, before its registration effect has run (divergence D-02).
 */
export function resolveSegmentPosition(index: number, count: number): SegmentPosition {
	if (index < 0 || count <= 1) return "isolated";
	if (index === 0) return "first";
	if (index === count - 1) return "last";
	return "middle";
}

/**
 * The key → intent table for segment navigation. Vertical navigation is direction-independent,
 * matching every ARIA vertical-orientation pattern; horizontal navigation inverts under
 * `dir="rtl"`. Anything else returns `null` and the browser keeps the key.
 */
export function resolveSegmentIntent(
	key: string,
	orientation: SegmentOrientation,
	dir: Direction,
): SegmentIntent | null {
	if (key === "Home") return "first";
	if (key === "End") return "last";

	if (orientation === "horizontal") {
		if (key === "ArrowRight") return dir === "rtl" ? "previous" : "next";
		if (key === "ArrowLeft") return dir === "rtl" ? "next" : "previous";
		return null;
	}

	if (key === "ArrowDown") return "next";
	if (key === "ArrowUp") return "previous";
	return null;
}

/** Anything that is neither a letter nor a number separates two pasted parts. */
const SEPARATOR = /[^\p{L}\p{N}]+/u;
/** A separator run at the very start is not *between* parts, so it stays with the first part. */
const LEADING_SEPARATOR = /^[^\p{L}\p{N}]+/u;

function truncate(parts: string[], maxLengths: readonly (number | undefined)[]): string[] {
	return parts.map((part, index) => {
		const max = maxLengths[index];
		return max === undefined ? part : part.slice(0, max);
	});
}

/**
 * Split a pasted string into one part per target segment.
 *
 * Total: never throws, returns `[]` for blank input, never returns more parts than `maxLengths`
 * has entries, and never returns a part longer than its segment's own `maxLength`.
 *
 * - **Separator path** — when the text contains a non-alphanumeric character, it splits there.
 *   `"Ada Byron King"` ⇒ `["Ada", "Byron", "King"]`. A separator run at the very start of the text
 *   is not between two parts, so it stays attached to the first one: `"+1 555 1234567"` keeps its
 *   `"+1"` country code rather than degrading it to `"1"`.
 * - **Character path** — with no separator, each segment consumes its own `maxLength` worth of
 *   characters (`"5551234567"` ⇒ `["555", "1234567"]`). A segment that declares no `maxLength`
 *   expects any length, so it takes the whole remainder and ends the walk.
 */
export function splitPastedValue(
	text: string,
	maxLengths: readonly (number | undefined)[],
): string[] {
	const trimmed = text.trim();
	if (trimmed === "" || maxLengths.length === 0) return [];

	if (SEPARATOR.test(trimmed)) {
		const prefix = LEADING_SEPARATOR.exec(trimmed)?.[0] ?? "";
		const parts = trimmed
			.slice(prefix.length)
			.split(SEPARATOR)
			.filter((part) => part !== "");
		if (parts.length === 0) return [];
		parts[0] = `${prefix}${parts[0]}`;
		return truncate(parts.slice(0, maxLengths.length), maxLengths);
	}

	const parts: string[] = [];
	let rest = trimmed;
	for (const max of maxLengths) {
		if (rest === "") break;
		if (max === undefined) {
			parts.push(rest);
			break;
		}
		parts.push(rest.slice(0, max));
		rest = rest.slice(max);
	}
	return parts;
}

/** What every segment supplies at registration time, read live so it is never stale. */
export type SegmentEntryMeta = {
	readonly getDisabled: () => boolean;
	readonly getReadOnly: () => boolean;
	readonly getMaxLength: () => number | undefined;
	readonly setValue: (next: string) => void;
};

export type SegmentNavigationProps = {
	readonly getOrientation: () => SegmentOrientation;
	readonly getDir: () => Direction;
};

/** `null` means the input type has no caret at all, which counts as "at both edges". */
function isCaretAtStart(element: HTMLInputElement): boolean {
	const { selectionStart, selectionEnd } = element;
	if (selectionStart === null) return true;
	return selectionStart === selectionEnd && selectionStart === 0;
}

function isCaretAtEnd(element: HTMLInputElement): boolean {
	const { selectionStart, selectionEnd } = element;
	if (selectionStart === null) return true;
	return selectionStart === selectionEnd && selectionStart === element.value.length;
}

/**
 * Where a segment's caret lands on arrival.
 *
 * `'all'` selects the segment's whole text rather than collapsing the caret — Time Picker arrives at
 * every segment fully selected (upstream `focus(); select();`, radix/ui/time-picker.tsx:1166-1167),
 * while Segmented Input keeps using `'start'`/`'end'` for its mid-text editing.
 */
export type SegmentCaret = "start" | "end" | "all";

function setCaret(element: HTMLInputElement, caret: SegmentCaret): void {
	// `setSelectionRange` throws on input types that do not support selection; those are exactly the
	// types whose `selectionStart` reads `null`.
	if (element.selectionStart === null) return;
	if (caret === "all") {
		element.setSelectionRange(0, element.value.length);
		return;
	}
	const position = caret === "start" ? 0 : element.value.length;
	element.setSelectionRange(position, position);
}

function isInputElement(element: Element): element is HTMLInputElement {
	return element instanceof HTMLInputElement;
}

/**
 * Keyboard traversal and paste distribution over a set of self-registered `<input>` segments.
 *
 * Markup-independent by design: it imports nothing from any `.svelte` file, knows nothing about
 * `Input`, sizes, variants or `data-slot`s, and takes its orientation and direction as getter
 * functions — so Time Picker can construct one for its hour/minute/second fields and get identical
 * behaviour.
 *
 * ```ts
 * const nav = new SegmentNavigation({ getOrientation: () => 'horizontal', getDir: () => dir });
 * ```
 */
export class SegmentNavigation {
	// $derived below is lazy at runtime (evaluated only when the field is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: SegmentNavigationProps;

	/** Composed rather than re-written — the shared document-ordered collection. */
	readonly segments = new DomOrderedCollection<SegmentEntryMeta>();

	/** How many segments are currently registered and attached. */
	readonly count: number = $derived(this.segments.size);

	constructor(props: SegmentNavigationProps) {
		this.#props = props;
	}

	register(id: string, element: HTMLInputElement, meta: SegmentEntryMeta): void {
		this.segments.register(id, element, meta);
	}

	unregister(id: string): void {
		this.segments.unregister(id);
	}

	/** `-1` while the segment is unregistered. */
	indexOf(id: string): number {
		return this.segments.indexById.get(id) ?? -1;
	}

	positionOf(id: string): SegmentPosition {
		return resolveSegmentPosition(this.indexOf(id), this.count);
	}

	/** Focuses the segment at `index` and places its caret. No-op for an out-of-range index. */
	focusAt(index: number, caret: SegmentCaret): void {
		const element = this.segments.ordered[index]?.element;
		if (!element || !isInputElement(element)) return;
		element.focus();
		setCaret(element, caret);
	}

	/**
	 * The first enabled index in `direction` from `from`, exclusive. `-1` when there is none.
	 *
	 * Public so a second consumer can apply its own edge policy: Segmented Input hands the key back
	 * to the browser at the ends, while Time Picker clamps and always `preventDefault()`s.
	 */
	seek(from: number, step: 1 | -1): number {
		const entries = this.segments.ordered;
		for (let index = from + step; index >= 0 && index < entries.length; index += step) {
			if (!entries[index].meta.getDisabled()) return index;
		}
		return -1;
	}

	#edge(step: 1 | -1): number {
		return step === 1 ? this.seek(-1, 1) : this.seek(this.segments.ordered.length, -1);
	}

	/**
	 * Arrow keys move focus only when the caret already sits at that edge of the segment's own text
	 * with nothing selected, so editing the middle of a segment still works (divergence D-07);
	 * `Home`/`End` jump unconditionally. Modified keystrokes are left alone — `Ctrl+Home` stays the
	 * document shortcut and `Shift+Arrow` stays text selection.
	 */
	onKeydown(event: KeyboardEvent, id: string): void {
		if (event.defaultPrevented) return;
		if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;

		const intent = resolveSegmentIntent(
			event.key,
			this.#props.getOrientation(),
			this.#props.getDir(),
		);
		if (!intent) return;

		const index = this.indexOf(id);
		if (index < 0) return;

		const element = this.segments.ordered[index]?.element;
		if (!element || !isInputElement(element)) return;

		let target: number;
		let caret: "start" | "end";

		if (intent === "next") {
			if (!isCaretAtEnd(element)) return;
			target = this.seek(index, 1);
			caret = "start";
		} else if (intent === "previous") {
			if (!isCaretAtStart(element)) return;
			target = this.seek(index, -1);
			caret = "end";
		} else if (intent === "first") {
			target = this.#edge(1);
			caret = "start";
		} else {
			target = this.#edge(-1);
			caret = "end";
		}

		if (target < 0) return;

		event.preventDefault();
		this.focusAt(target, caret);
	}

	/**
	 * Distributes a multi-part paste across the focused segment and the eligible ones after it.
	 * Segments before the focused one are never touched, disabled and read-only
	 * segments are skipped, overflow parts are discarded, and a paste that yields a single untouched
	 * part is handed back to the browser so undo history and caret semantics survive.
	 */
	onPaste(event: ClipboardEvent, id: string): void {
		if (event.defaultPrevented) return;

		const index = this.indexOf(id);
		if (index < 0) return;

		const text = event.clipboardData?.getData("text") ?? "";
		const targets = this.segments.ordered
			.slice(index)
			.filter((entry) => !entry.meta.getDisabled() && !entry.meta.getReadOnly());
		if (targets.length === 0) return;

		const parts = splitPastedValue(
			text,
			targets.map((entry) => entry.meta.getMaxLength()),
		);
		if (parts.length === 0) return;
		if (parts.length === 1 && parts[0] === text.trim()) return;

		event.preventDefault();
		parts.forEach((part, offset) => targets[offset].meta.setValue(part));

		const last = targets[parts.length - 1].element;
		if (!isInputElement(last)) return;
		last.focus();
		setCaret(last, "end");
	}
}
