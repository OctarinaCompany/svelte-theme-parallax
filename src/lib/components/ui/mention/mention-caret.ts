/**
 * Caret geometry, the word-boundary trigger rule and the mention-span algebra, ported from
 * `packages/mention/src/mention-input.tsx` (`:25-134` geometry, `:136-264` trigger) and
 * `packages/mention/src/mention-root.tsx` (`:287-367` span algebra).
 *
 * Deliberately **rune-free**: none of this needs a reactive context, so any later caret-anchored
 * component (a slash-command palette, an autocomplete textarea) can import it directly, and the
 * trigger rule and the span arithmetic stay unit-testable without rendering anything.
 */

/** The text field a caret can live in. */
export type MentionField = HTMLInputElement | HTMLTextAreaElement;

/** One inserted mention's position in the field text (upstream's `Mention` interface). */
export type MentionSpan = {
	/** The item's `value`, not its label. */
	readonly value: string;
	/** Offset of the trigger character in the current field text. */
	readonly start: number;
	/** `start + trigger.length + label.length` — exclusive, and excluding the trailing space. */
	readonly end: number;
};

/** What {@link resolveMentionTrigger} reports when the caret sits in an active mention query. */
export type TriggerMatch = {
	/** Offset of the trigger character that opened the query. */
	readonly triggerIndex: number;
	/** The text between the trigger and the caret — the filter term. */
	readonly search: string;
};

/**
 * A virtual anchor for `bits-ui`'s `Popover.Content` `customAnchor`, which accepts
 * `Measurable = { getBoundingClientRect(): DOMRect }`. `getClientRects` is carried too so the object
 * is interchangeable with the `VirtualElement` upstream hands to `@floating-ui/react`.
 */
export type CaretAnchor = {
	getBoundingClientRect(): DOMRect;
	getClientRects(): DOMRect[];
};

/** A computed length that jsdom (and `line-height: normal`) can report as `NaN` — see D-9. */
function finite(value: number, fallback: number): number {
	return Number.isFinite(value) ? value : fallback;
}

/**
 * Measure `text` in `element`'s own typography with one off-screen `<span>`.
 */
export function measureTextWidth(text: string, element: MentionField): number {
	const style = window.getComputedStyle(element);
	const measureSpan = document.createElement("span");
	measureSpan.style.cssText = `position: absolute; visibility: hidden; white-space: pre; font: ${style.font}; letter-spacing: ${style.letterSpacing}; text-transform: ${style.textTransform};`;
	measureSpan.textContent = text;
	document.body.appendChild(measureSpan);
	const width = measureSpan.offsetWidth;
	document.body.removeChild(measureSpan);
	return width;
}

/**
 * The field's line height.
 *
 * Divergence **D-9**: upstream writes `Number.parseInt(style.lineHeight, 10) ?? input.offsetHeight`,
 * but `??` never fires for `NaN`, so a computed `line-height: normal` poisons the whole caret rect.
 * The intended fallback is kept, guarded on finiteness instead.
 */
export function getLineHeight(element: MentionField): number {
	const style = window.getComputedStyle(element);
	return finite(Number.parseInt(style.lineHeight, 10), element.offsetHeight);
}

/**
 * The `DOMRect` of the caret at `caret`, wrap- and RTL-aware.
 *
 * Every computed length goes through the same finiteness guard as {@link getLineHeight}: a layout
 * engine that reports nothing (jsdom) must still yield a usable rect rather than a box full of `NaN`
 * the floating layer cannot position against.
 */
export function getCaretRect(element: MentionField, caret: number, dir: "ltr" | "rtl"): DOMRect {
	const rect = element.getBoundingClientRect();
	const textBeforeCaret = element.value.slice(0, caret);
	const lines = textBeforeCaret.split("\n");
	const currentLine = lines.length - 1;
	const currentLineText = lines[currentLine] ?? "";
	const textWidth = measureTextWidth(currentLineText, element);

	const style = window.getComputedStyle(element);
	const lineHeight = getLineHeight(element);
	const paddingLeft = finite(Number.parseFloat(style.getPropertyValue("padding-left")), 0);
	const paddingRight = finite(Number.parseFloat(style.getPropertyValue("padding-right")), 0);
	const paddingTop = finite(Number.parseFloat(style.getPropertyValue("padding-top")), 0);

	// Wrapped lines before the caret. A container with no measurable width cannot wrap.
	const containerWidth = element.clientWidth - paddingLeft - paddingRight;
	const canWrap = containerWidth > 0;
	const wrappedLines = canWrap ? Math.floor(textWidth / containerWidth) : 0;
	const totalLines = currentLine + wrappedLines;

	const scrollTop = element.scrollTop;
	const scrollLeft = element.scrollLeft;

	const effectiveTextWidth = canWrap ? textWidth % containerWidth : textWidth;
	const x =
		dir === "rtl"
			? Math.min(rect.right - paddingRight - effectiveTextWidth + scrollLeft, rect.right - 10)
			: Math.min(rect.left + paddingLeft + effectiveTextWidth - scrollLeft, rect.right - 10);

	const y = rect.top + paddingTop + (totalLines * lineHeight - scrollTop);

	return {
		width: 0,
		height: lineHeight,
		x,
		y,
		top: y,
		right: x,
		bottom: y + lineHeight,
		left: x,
		toJSON() {
			return this;
		},
	} satisfies DOMRect;
}

/**
 * A {@link CaretAnchor} that re-measures on every read, so the popup keeps following the caret while
 * the field scrolls or resizes.
 */
export function createCaretAnchor(
	element: MentionField,
	caret: number,
	dir: "ltr" | "rtl",
): CaretAnchor {
	return {
		getBoundingClientRect() {
			return getCaretRect(element, caret, dir);
		},
		getClientRects() {
			return [this.getBoundingClientRect()];
		},
	};
}

/**
 * Whether the caret sits in an active mention query, and what it is searching for.
 *
 * All six conditions must hold for `i = text.lastIndexOf(trigger, caret)`:
 *
 * 1. the trigger occurs at or before the caret;
 * 2. the trigger is not inside an already-inserted mention;
 * 3. there is no text before the trigger at all, or the character before it is a space or a newline
 *    — the word-boundary rule, which is what stops `foo@bar.com` from opening the popup;
 * 4. the text between the trigger and the caret contains no space;
 * 5. the caret is past the trigger;
 * 6. nothing interferes after the caret: the next character is absent, a space, a newline or the
 *    trigger itself — unless the caret sits inside an already-inserted mention.
 */
export function resolveMentionTrigger(
	text: string,
	caret: number,
	trigger: string,
	spans: readonly MentionSpan[],
): TriggerMatch | null {
	const triggerIndex = text.lastIndexOf(trigger, caret);
	if (triggerIndex === -1) return null;

	const isPartOfExistingMention = spans.some(
		(span) => span.start <= triggerIndex && span.end > triggerIndex,
	);
	if (isPartOfExistingMention) return null;

	const textBeforeTrigger = text.slice(0, triggerIndex);
	if (/\S/.test(textBeforeTrigger)) {
		const lastCharBeforeTrigger = textBeforeTrigger.slice(-1);
		if (lastCharBeforeTrigger !== " " && lastCharBeforeTrigger !== "\n") return null;
	}

	const textAfterTrigger = text.slice(triggerIndex + 1, caret);
	if (textAfterTrigger.includes(" ")) return null;

	if (caret <= triggerIndex) return null;

	const textAfterCaret = text.slice(caret);
	const firstCharAfterCaret = textAfterCaret[0];
	const isSeparated =
		!firstCharAfterCaret ||
		firstCharAfterCaret === " " ||
		firstCharAfterCaret === "\n" ||
		firstCharAfterCaret === trigger;
	const isPartOfMention = spans.some((span) => caret >= span.start && caret < span.end);
	if (textAfterCaret.length > 0 && !isSeparated && !isPartOfMention) return null;

	return {
		triggerIndex,
		search: caret === triggerIndex + 1 ? "" : textAfterTrigger,
	};
}

/**
 * Splice `span` into `spans`, shifting every span that starts at or after the insertion point.
 */
export function addMentionSpan(
	spans: readonly MentionSpan[],
	span: MentionSpan,
	insertionPoint: number,
	insertionLength: number,
): MentionSpan[] {
	const shifted = spans.map((current) =>
		current.start >= insertionPoint
			? { ...current, start: current.start + insertionLength, end: current.end + insertionLength }
			: current,
	);
	return [...shifted, span];
}

/**
 * Drop every span whose value is being removed and pull the survivors left.
 *
 * Each survivor shifts by `Σ (r.end - r.start + 1)` over the removed spans that started before it —
 * the `+ 1` is the trailing space that leaves with the mention.
 */
export function removeMentionSpans(
	spans: readonly MentionSpan[],
	removed: readonly MentionSpan[],
): MentionSpan[] {
	// Must match their actual order in the text, whatever order the caller collected them in.
	const ordered = [...removed].sort((a, b) => a.start - b.start);
	const removedValues = new Set(ordered.map((span) => span.value));

	return spans
		.filter((span) => !removedValues.has(span.value))
		.map((span) => {
			const shift = ordered
				.filter((current) => current.start < span.start)
				.reduce((total, current) => total + (current.end - current.start + 1), 0);
			return { ...span, start: span.start - shift, end: span.end - shift };
		});
}

/**
 * Move every span that sits after a plain text edit.
 * `delta` is the signed change in the field's length.
 */
export function shiftMentionSpans(
	spans: readonly MentionSpan[],
	caret: number,
	delta: number,
): MentionSpan[] {
	if (delta === 0) return [...spans];

	const threshold = caret - Math.max(delta, 0);
	return spans.map((span) =>
		span.start >= threshold ? { ...span, start: span.start + delta, end: span.end + delta } : span,
	);
}
