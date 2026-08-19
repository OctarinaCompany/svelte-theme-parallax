import { getContext, hasContext, setContext } from "svelte";

import type { Direction } from "$lib/components/ui/direction-provider/index.js";

/** Every value `orientation` accepts, in upstream declaration order. */
export const KEY_VALUE_ORIENTATIONS = ["vertical", "horizontal"] as const;

/** `'vertical' | 'horizontal'` — upstream `Orientation`. */
export type KeyValueOrientation = (typeof KEY_VALUE_ORIENTATIONS)[number];

/** Which half of a row an error, a validator or a `<KeyValue.Error>` addresses. Upstream `Field`. */
export type KeyValueField = "key" | "value";

/** One row of the list. Upstream `ItemData`. */
export type KeyValueItemData = {
	/** Stable across add / remove / paste. Minted by {@linkcode createKeyValueItemId}. */
	id: string;
	key: string;
	value: string;
};

/** The messages currently recorded against one row. Upstream's inline shape. */
export type KeyValueItemErrors = { key?: string; value?: string };

/**
 * Every row's errors, keyed by row id. A row id is absent from this record exactly when that row is
 * valid — the record is never populated with empty objects, because the whole list's validity is
 * `Object.keys(errors).length > 0`.
 */
export type KeyValueErrors = Record<string, KeyValueItemErrors>;

let itemIdCounter = 0;

/**
 * Mint a row id.
 *
 * A module-level counter rather than upstream's `crypto.randomUUID()` (`key-value.tsx:209`, `:523`,
 * `:794`), which is unavailable in some jsdom/SSR targets and makes ids non-deterministic. Ids are
 * never part of the public contract — they only key `errors` and derive the `aria-describedby` id
 * (divergence D-8).
 */
export function createKeyValueItemId(): string {
	itemIdCounter += 1;
	return `key-value-item-${itemIdCounter}`;
}

/**
 * Upstream `removeQuotes`, verbatim: returns the text untouched when
 * stripping is off, otherwise trims it and drops one matching pair of surrounding `"` or `'`.
 */
export function stripSurroundingQuotes(text: string, shouldStrip: boolean): string {
	if (!shouldStrip) return text;

	const trimmed = text.trim();
	if (
		(trimmed.startsWith('"') && trimmed.endsWith('"')) ||
		(trimmed.startsWith("'") && trimmed.endsWith("'"))
	) {
		return trimmed.slice(1, -1);
	}
	return trimmed;
}

/**
 * Split clipboard text into rows. Upstream's paste body, lifted into a
 * pure function so the MDX's paste-format table can be asserted without a DOM.
 *
 * Blank lines are dropped; each remaining line is split by the first format that matches — `=`,
 * then `:`, then `/\s{2,}|\t/` — and a line matching none of the three, or yielding an empty key,
 * produces no row. The split-then-rejoin is upstream's, so `URL=https://a?b=c` keeps its trailing
 * `=` and its `:`.
 *
 * Ids are deliberately not minted here: the caller owns them, which is what keeps this pure.
 */
export function parseKeyValueText(
	text: string,
	options: { stripQuotes: boolean },
): Array<{ key: string; value: string }> {
	const parsed: Array<{ key: string; value: string }> = [];

	for (const line of text.split(/\r?\n/).filter((line) => line.trim())) {
		let key = "";
		let value = "";

		if (line.includes("=")) {
			const parts = line.split("=");
			key = parts[0]?.trim() ?? "";
			value = stripSurroundingQuotes(parts.slice(1).join("=").trim(), options.stripQuotes);
		} else if (line.includes(":")) {
			const parts = line.split(":");
			key = parts[0]?.trim() ?? "";
			value = stripSurroundingQuotes(parts.slice(1).join(":").trim(), options.stripQuotes);
		} else if (/\s{2,}|\t/.test(line)) {
			const parts = line.split(/\s{2,}|\t/);
			key = parts[0]?.trim() ?? "";
			value = stripSurroundingQuotes(parts.slice(1).join(" ").trim(), options.stripQuotes);
		}

		if (key) parsed.push({ key, value });
	}

	return parsed;
}

export type KeyValueRootStateProps = {
	readonly getValue: () => KeyValueItemData[];
	/** Writes the root's `$bindable` `value`, then calls `onValueChange`. */
	readonly setValue: (value: KeyValueItemData[]) => void;
	readonly getOnPaste: () =>
		((event: ClipboardEvent, items: KeyValueItemData[]) => void) | undefined;
	readonly getOnAdd: () => ((value: KeyValueItemData) => void) | undefined;
	readonly getOnRemove: () => ((value: KeyValueItemData) => void) | undefined;
	readonly getOnKeyValidate: () =>
		((key: string, value: KeyValueItemData[]) => string | undefined) | undefined;
	readonly getOnValueValidate: () =>
		((value: string, key: string, items: KeyValueItemData[]) => string | undefined) | undefined;
	readonly getMaxItems: () => number | undefined;
	readonly getMinItems: () => number;
	readonly getKeyPlaceholder: () => string;
	readonly getValuePlaceholder: () => string;
	readonly getAllowDuplicateKeys: () => boolean;
	readonly getEnablePaste: () => boolean;
	readonly getTrim: () => boolean;
	readonly getStripQuotes: () => boolean;
	readonly getDisabled: () => boolean;
	readonly getReadOnly: () => boolean;
	readonly getRequired: () => boolean;
	readonly getDir: () => Direction;
	/** The one `$props.id()` (or the caller's `id`) every error id derives from. */
	readonly rootId: string;
};

/**
 * One instance per `<KeyValue.Root>`, published on context.
 *
 * Replaces upstream's hand-rolled `Store` + `useSyncExternalStore` + `KeyValueContext`
 * (`key-value.tsx:54-138`, `:206-291`). Svelte's signal graph already gives the per-field
 * subscription granularity the store existed to provide, so the row array is read
 * straight from the root's `$bindable` `value` through a getter — which is what lets an
 * authoritative parent decline a write.
 */
export class KeyValueRootState {
	// $derived below is lazy at runtime (evaluated only when the field is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: KeyValueRootStateProps;

	/** Upstream `KeyValueState["errors"]`. A row id is present only while that row is invalid. */
	errors = $state<KeyValueErrors>({});

	/** Upstream `focusedId` — purely presentational, drives `data-highlighted`. */
	focusedId = $state<string | null>(null);

	/**
	 * A one-shot request for the named row's key field to take focus and enter edit mode, consumed by
	 * that field's `$effect`. Separate from {@linkcode focusedId} because clearing the request must
	 * not also clear the persistent highlight upstream's `focusedId` exists for.
	 */
	focusRequestId = $state<string | null>(null);

	readonly value: KeyValueItemData[] = $derived(this.#props.getValue());
	readonly maxItems: number | undefined = $derived(this.#props.getMaxItems());
	readonly minItems: number = $derived(this.#props.getMinItems());
	readonly keyPlaceholder: string = $derived(this.#props.getKeyPlaceholder());
	readonly valuePlaceholder: string = $derived(this.#props.getValuePlaceholder());
	readonly allowDuplicateKeys: boolean = $derived(this.#props.getAllowDuplicateKeys());
	readonly enablePaste: boolean = $derived(this.#props.getEnablePaste());
	readonly trim: boolean = $derived(this.#props.getTrim());
	readonly stripQuotes: boolean = $derived(this.#props.getStripQuotes());
	readonly disabled: boolean = $derived(this.#props.getDisabled());
	readonly readOnly: boolean = $derived(this.#props.getReadOnly());
	readonly required: boolean = $derived(this.#props.getRequired());
	readonly dir: Direction = $derived(this.#props.getDir());
	readonly rootId: string = $derived(this.#props.rootId);

	readonly count: number = $derived(this.value.length);
	readonly isInvalid: boolean = $derived(Object.keys(this.errors).length > 0);

	/** The `readOnly` term is divergence D-9: upstream lets a read-only list still be added to. */
	readonly canAdd: boolean = $derived(
		!this.disabled && !this.readOnly && (this.maxItems === undefined || this.count < this.maxItems),
	);
	/** The `readOnly` term is divergence D-9. */
	readonly canRemove: boolean = $derived(
		!this.disabled && !this.readOnly && this.count > this.minItems,
	);

	constructor(props: KeyValueRootStateProps) {
		this.#props = props;
	}

	getItem(id: string): KeyValueItemData | undefined {
		return this.value.find((item) => item.id === id);
	}

	/** Upstream `getErrorId`. */
	errorId(itemId: string, field: KeyValueField): string {
		return `${this.rootId}-${itemId}-${field}-error`;
	}

	errorFor(itemId: string, field: KeyValueField): string | undefined {
		return this.errors[itemId]?.[field];
	}

	/**
	 * Write one field of one row and revalidate it — upstream's `onChange` handlers, which are
	 * duplicated verbatim between the two fields (`key-value.tsx:424-478` == `:625-679`).
	 */
	setField(id: string, field: KeyValueField, text: string): void {
		if (this.disabled || this.readOnly) return;

		// Upstream publishes a fresh array on every keystroke, so `onValueChange` fires even when the
		// stored text did not move. Here the write is skipped instead, because composing `editable`
		// adds writes upstream never had: `<Editable.Root>`'s own `value ??= defaultValue` compiles to
		// an unconditional write through the binding, so every field would republish the whole list
		// — and re-run the row's validators — as it mounts. Same rule as `editable`'s own
		// `Object.is` short-circuit: a callback is a change notification.
		const current = this.getItem(id);
		const nextText = this.trim ? text.trim() : text;
		if (!current || current[field] === nextText) return;

		const next = this.value.map((item) => {
			if (item.id !== id) return item;
			const updated = { ...item, [field]: text };
			if (this.trim) updated[field] = updated[field].trim();
			return updated;
		});

		this.#props.setValue(next);
		this.validateItem(id, next);
	}

	/**
	 * Upstream's four-step routine, including the fact that editing the
	 * *key* also runs `onValueValidate` and editing the *value* also runs `onKeyValidate` and the
	 * duplicate check. Only the edited row is revalidated, so a row whose duplicate partner is fixed
	 * elsewhere keeps its error until it is itself edited — upstream's behaviour.
	 */
	validateItem(id: string, nextValue: KeyValueItemData[]): void {
		const updated = nextValue.find((item) => item.id === id);
		if (!updated) return;

		const itemErrors: KeyValueItemErrors = {};

		const keyError = this.#props.getOnKeyValidate()?.(updated.key, nextValue);
		if (keyError) itemErrors.key = keyError;

		if (!this.allowDuplicateKeys) {
			const duplicate = nextValue.find(
				(item) => item.id !== updated.id && item.key === updated.key && updated.key !== "",
			);
			if (duplicate) itemErrors.key = "Duplicate key";
		}

		const valueError = this.#props.getOnValueValidate()?.(updated.value, updated.key, nextValue);
		if (valueError) itemErrors.value = valueError;

		const nextErrors = { ...this.errors };
		if (Object.keys(itemErrors).length > 0) {
			nextErrors[id] = itemErrors;
		} else {
			delete nextErrors[id];
		}
		this.errors = nextErrors;
	}

	/** Upstream `KeyValueAdd`'s `onClick`, plus the focus request. */
	add(): void {
		if (!this.canAdd) return;

		const item: KeyValueItemData = { id: createKeyValueItemId(), key: "", value: "" };

		this.focusedId = item.id;
		this.focusRequestId = item.id;
		this.#props.setValue([...this.value, item]);
		this.#props.getOnAdd()?.(item);
	}

	/**
	 * Upstream `KeyValueRemove`'s `onClick`, plus the focus request: the
	 * next row's key field, or the previous row's when the removed row was last.
	 */
	remove(id: string): void {
		if (!this.canRemove) return;

		const items = this.value;
		const index = items.findIndex((item) => item.id === id);
		if (index === -1) return;

		const removed = items[index];
		const next = items.filter((item) => item.id !== id);

		const nextErrors = { ...this.errors };
		delete nextErrors[id];
		this.errors = nextErrors;

		const focusTarget = items[index + 1]?.id ?? items[index - 1]?.id ?? null;
		this.focusedId = focusTarget;
		this.focusRequestId = focusTarget;

		this.#props.setValue(next);
		this.#props.getOnRemove()?.(removed);
	}

	/**
	 * Upstream's paste handler minus the parsing, which lives in
	 * {@linkcode parseKeyValueText}.
	 *
	 * @returns whether the paste was intercepted — `false` leaves it to the browser, which is what
	 * makes a single-line paste ordinary text entry. Paste is additionally refused while the
	 * list is disabled or read-only (divergence D-4).
	 */
	pasteInto(id: string, text: string, event: ClipboardEvent): boolean {
		if (!this.enablePaste || this.disabled || this.readOnly) return false;

		// Upstream's own gate: only *multi-line* clipboard text splits into rows.
		if (text.split(/\r?\n/).filter((line) => line.trim()).length <= 1) return false;

		const parsed = parseKeyValueText(text, { stripQuotes: this.stripQuotes }).map((row) => ({
			id: createKeyValueItemId(),
			...row,
		}));
		if (parsed.length === 0) return false;

		const items = this.value;
		const index = items.findIndex((item) => item.id === id);
		if (index === -1) return false;

		const target = items[index];
		let next =
			target.key === "" && target.value === ""
				? [...items.slice(0, index), ...parsed, ...items.slice(index + 1)]
				: [...items.slice(0, index + 1), ...parsed, ...items.slice(index + 1)];

		if (this.maxItems !== undefined) next = next.slice(0, this.maxItems);

		// Rows can disappear here — the replaced empty target, or trailing rows dropped by the
		// truncation above — so their error entries must go too, the same way `remove()` clears its
		// row's. A stale entry would pin `isInvalid` on a row no `<KeyValue.Error>` can ever render.
		const nextErrors = { ...this.errors };
		for (const staleId of Object.keys(nextErrors)) {
			if (!next.some((item) => item.id === staleId)) delete nextErrors[staleId];
		}
		this.errors = nextErrors;

		// The last inserted row that survived the truncation, so focus never lands on a dropped row.
		const surviving = parsed.filter((row) => next.some((item) => item.id === row.id));
		const focusTarget = surviving[surviving.length - 1]?.id ?? null;
		this.focusedId = focusTarget;
		this.focusRequestId = focusTarget;

		this.#props.setValue(next);
		this.#props.getOnPaste()?.(event, parsed);

		return true;
	}

	/** Consume the one-shot focus request, if it is this row's. */
	consumeFocusRequest(id: string): boolean {
		if (this.focusRequestId !== id) return false;
		this.focusRequestId = null;
		return true;
	}
}

export type KeyValueItemStateProps = {
	readonly root: KeyValueRootState;
	readonly id: string;
};

/**
 * One instance per rendered row, created by the internal `key-value-item-provider.svelte` and
 * published on context. Every field is `$derived`, so a keystroke in row 2 never
 * invalidates row 1.
 */
export class KeyValueItemState {
	// Same svelte-check limitation as KeyValueRootState#props above.
	#props!: KeyValueItemStateProps;

	readonly id: string = $derived(this.#props.id);
	/** Falls back to an empty row for the frame between a removal and this provider unmounting. */
	readonly data: KeyValueItemData = $derived(
		this.#props.root.getItem(this.#props.id) ?? { id: this.#props.id, key: "", value: "" },
	);
	readonly key: string = $derived(this.data.key);
	readonly value: string = $derived(this.data.value);
	readonly isHighlighted: boolean = $derived(this.#props.root.focusedId === this.#props.id);
	readonly keyError: string | undefined = $derived(
		this.#props.root.errorFor(this.#props.id, "key"),
	);
	readonly valueError: string | undefined = $derived(
		this.#props.root.errorFor(this.#props.id, "value"),
	);

	get root(): KeyValueRootState {
		return this.#props.root;
	}

	constructor(props: KeyValueItemStateProps) {
		this.#props = props;
	}
}

const KEY_VALUE_CONTEXT_KEY = Symbol("key-value");

export function setKeyValueContext(state: KeyValueRootState): KeyValueRootState {
	return setContext(KEY_VALUE_CONTEXT_KEY, state);
}

/** Read the list's state, throwing when there is no `<KeyValue.Root>` ancestor. */
export function getKeyValueContext(consumerName: string): KeyValueRootState {
	if (!hasContext(KEY_VALUE_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`<KeyValue.Root>\`.`);
	}
	return getContext<KeyValueRootState>(KEY_VALUE_CONTEXT_KEY);
}

const KEY_VALUE_ITEM_CONTEXT_KEY = Symbol("key-value-item");

export function setKeyValueItemContext(state: KeyValueItemState): KeyValueItemState {
	return setContext(KEY_VALUE_ITEM_CONTEXT_KEY, state);
}

/** Read the row's state, throwing when there is no `<KeyValue.List>` ancestor. */
export function getKeyValueItemContext(consumerName: string): KeyValueItemState {
	if (!hasContext(KEY_VALUE_ITEM_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`<KeyValue.List>\`.`);
	}
	return getContext<KeyValueItemState>(KEY_VALUE_ITEM_CONTEXT_KEY);
}
