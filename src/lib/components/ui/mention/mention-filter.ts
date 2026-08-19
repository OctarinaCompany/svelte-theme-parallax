/**
 * The matcher, the scorer and the filter store, ported from the shared-utils reference's `use-filter.ts` and
 * `use-filter-store.ts`.
 *
 * Originated in the (since-removed) `combobox` port, which shared it with `mention` — its only
 * other consumer. `mention` is now its sole owner.
 *
 * Deliberately rune-free: the scoring contract is observable API (`2` exact, `1.5` prefix, `1`/`0`
 * from the matcher, sorted descending, batched at 250 items), and keeping it out of `.svelte.ts`
 * needs no component and no reactive context to exercise.
 */

/** Least-recently-used cache — upstream's `LRUCache` (`use-filter.ts:3-58`), same eviction order. */
class LRUCache<K, V> {
	#cache = new Map<K, V>();
	#keyOrder: K[] = [];
	readonly #maxSize: number;

	constructor(maxSize: number) {
		this.#maxSize = maxSize;
	}

	get(key: K): V | undefined {
		const value = this.#cache.get(key);
		if (value !== undefined) {
			// Move to most recently used.
			const index = this.#keyOrder.indexOf(key);
			if (index > -1) {
				this.#keyOrder.splice(index, 1);
				this.#keyOrder.push(key);
			}
		}
		return value;
	}

	set(key: K, value: V): void {
		if (this.#cache.has(key)) {
			this.#cache.set(key, value);
			const index = this.#keyOrder.indexOf(key);
			if (index > -1) this.#keyOrder.splice(index, 1);
		} else {
			if (this.#keyOrder.length >= this.#maxSize) {
				const lruKey = this.#keyOrder.shift();
				if (lruKey !== undefined) this.#cache.delete(lruKey);
			}
			this.#cache.set(key, value);
		}
		this.#keyOrder.push(key);
	}

	clear(): void {
		this.#cache.clear();
		this.#keyOrder.length = 0;
	}

	get size(): number {
		return this.#cache.size;
	}
}

// Cache sizes tuned for typical usage patterns, exactly as upstream tunes them: few collator option
// combinations are ever used, but a large list normalises a great many distinct strings.
const collatorCache = new LRUCache<string, Intl.Collator>(10);
const normalizedCache = new LRUCache<string, string>(1000);

const SEPARATORS_PATTERN = /[-_\s./\\|:;,]+/g;
const UNWANTED_CHARS = /[^\p{L}\p{N}\s]/gu;

/**
 * Lower-case, NFC-normalise, strip punctuation and separators, then remove every remaining space —
 * so `"Fuzzy-Search v2"` and `"fuzzysearchv2"` compare equal.
 *
 * A string made entirely of punctuation normalises to `"\u0000"` rather than `""`, which is
 * upstream's sentinel for "matches nothing" (an empty needle would otherwise match everything).
 */
export function normalizeWithGaps(value: string): string {
	if (!value) return "";
	if (typeof value !== "string") return "";

	const cached = normalizedCache.get(value);
	if (cached !== undefined) return cached;

	let normalized: string;
	try {
		normalized = value
			.toLowerCase()
			.normalize("NFC")
			.replace(UNWANTED_CHARS, " ")
			.replace(SEPARATORS_PATTERN, " ")
			.trim()
			.replace(/\s+/g, "");
	} catch {
		// A runtime without Unicode property escapes falls back to the ASCII-only pipeline.
		normalized = value
			.toLowerCase()
			.normalize("NFC")
			.replace(/[^a-z0-9\s]/g, " ")
			.trim()
			.replace(/\s+/g, "");
	}

	if (normalized === "" && value.length > 0) normalized = "\u0000";

	normalizedCache.set(value, normalized);
	return normalized;
}

export type MentionFilterOptions = {
	/**
	 * Whether to match strings with gaps between words, ignoring case, punctuation and separators.
	 *
	 * @default false
	 */
	gapMatch?: boolean;
	/**
	 * The sensitivity of the collator used when `gapMatch` is off.
	 *
	 * @default "base"
	 */
	sensitivity?: Intl.CollatorOptions["sensitivity"];
};

/** The four matchers `createFilter` returns. Every one answers `true` for an empty needle. */
export type MentionFilter = {
	/** Whether `value` begins with `term`. */
	startsWith(value: string, term: string): boolean;
	/** Whether `value` ends with `term`. */
	endsWith(value: string, term: string): boolean;
	/** Whether `term` occurs anywhere in `value`. */
	contains(value: string, term: string): boolean;
	/** Whether every character of `pattern` occurs in `value`, in order but not necessarily adjacent. */
	fuzzy(value: string, pattern: string): boolean;
};

/**
 * Upstream's `useFilter` (`use-filter.ts:107-259`) as a plain factory. The collator is memoised on
 * the serialised options, so repeated calls with the same options share one `Intl.Collator`.
 */
export function createFilter(options?: MentionFilterOptions): MentionFilter {
	const cacheKey = options
		? Object.entries(options)
				.sort((a, b) => (a[0] < b[0] ? -1 : 1))
				.join()
		: "";

	let collator = collatorCache.get(cacheKey);
	if (!collator) {
		// `sensitivity` is a default the caller's options may override; `Intl.Collator` ignores the
		// non-collator `gapMatch` key.
		collator = new Intl.Collator("en", { sensitivity: "base", ...options });
		collatorCache.set(cacheKey, collator);
	}
	const compare = collator;
	const gapMatch = options?.gapMatch ?? false;

	function startsWith(value: string, term: string): boolean {
		if (term.length === 0) return true;

		if (gapMatch) {
			return normalizeWithGaps(value).startsWith(normalizeWithGaps(term));
		}

		const normalizedValue = value.normalize("NFC");
		const normalizedTerm = term.normalize("NFC");
		return compare.compare(normalizedValue.slice(0, normalizedTerm.length), normalizedTerm) === 0;
	}

	function endsWith(value: string, term: string): boolean {
		if (term.length === 0) return true;

		if (gapMatch) {
			return normalizeWithGaps(value).endsWith(normalizeWithGaps(term));
		}

		const normalizedValue = value.normalize("NFC");
		const normalizedTerm = term.normalize("NFC");
		return compare.compare(normalizedValue.slice(-normalizedTerm.length), normalizedTerm) === 0;
	}

	function contains(value: string, term: string): boolean {
		if (term.length === 0) return true;

		if (gapMatch) {
			return normalizeWithGaps(value).includes(normalizeWithGaps(term));
		}

		const normalizedValue = value.normalize("NFC");
		const normalizedTerm = term.normalize("NFC");

		const sliceLength = normalizedTerm.length;
		for (let scan = 0; scan + sliceLength <= normalizedValue.length; scan++) {
			const slice = normalizedValue.slice(scan, scan + sliceLength);
			if (compare.compare(normalizedTerm, slice) === 0) return true;
		}

		return false;
	}

	function fuzzy(value: string, pattern: string): boolean {
		if (pattern.length === 0) return true;
		if (value.length === 0) return false;

		if (gapMatch) {
			const normalizedValue = normalizeWithGaps(value);
			const normalizedPattern = normalizeWithGaps(pattern);

			let patternIndex = 0;
			let valueIndex = 0;

			while (valueIndex < normalizedValue.length && patternIndex < normalizedPattern.length) {
				if (normalizedValue[valueIndex] === normalizedPattern[patternIndex]) patternIndex++;
				valueIndex++;
			}

			return patternIndex === normalizedPattern.length;
		}

		const normalizedValue = value.normalize("NFC");
		const normalizedPattern = pattern.normalize("NFC");

		let patternIndex = 0;
		let valueIndex = 0;

		while (valueIndex < normalizedValue.length && patternIndex < normalizedPattern.length) {
			if (
				compare.compare(
					normalizedValue[valueIndex] ?? "",
					normalizedPattern[patternIndex] ?? "",
				) === 0
			) {
				patternIndex++;
			}
			valueIndex++;
		}

		return patternIndex === normalizedPattern.length;
	}

	return { startsWith, endsWith, contains, fuzzy };
}

export type ScoreItemOptions = {
	/**
	 * Whether to use substring matching rather than fuzzy matching.
	 *
	 * @default false
	 */
	exactMatch?: boolean;
	/** Replaces the built-in matcher entirely: an item scores `1` when the callback keeps it. */
	onFilter?: (options: string[], term: string) => string[];
};

/** The matcher every `scoreItem` call shares. `gapMatch` is upstream's own filter-store setting. */
const defaultFilter = createFilter({ sensitivity: "base", gapMatch: true });

/**
 * Upstream's `getItemScore` (`use-filter-store.ts:53-68`): `2` exact, `1.5` prefix, then `1`/`0`
 * from `onFilter` when supplied, else from `contains` (`exactMatch`) or `fuzzy`.
 *
 * An empty term scores `1` — nothing is filtered out. An empty value scores `0`.
 */
export function scoreItem(value: string, term: string, options?: ScoreItemOptions): number {
	if (!term) return 1;
	if (!value) return 0;

	if (value === term) return 2;
	if (value.startsWith(term)) return 1.5;

	const onFilter = options?.onFilter;
	if (onFilter) return Number(onFilter([value], term).length > 0);

	const matcher = options?.exactMatch ? defaultFilter.contains : defaultFilter.fuzzy;
	return Number(matcher(value, term));
}

export type MentionFilterRunOptions = ScoreItemOptions & {
	/**
	 * Whether the consumer filters the list itself. When `true` the store scores nothing and every
	 * item stays visible.
	 *
	 * @default false
	 */
	manualFiltering?: boolean;
};

/** One registered item, as the store needs to see it. */
export type MentionFilterItem = {
	readonly value: string;
	readonly groupId?: string;
};

/**
 * Upstream's `filterStore` plus `onItemsFilter` (`use-filter-store.ts:70-146`), as a plain object.
 *
 * It is recomputed wholesale rather than mutated in place, so the reactive layer can simply hold one
 * instance in a `$derived.by` keyed on `(search, items, options)` — there is never a partially
 * updated store to observe.
 */
export class MentionFilterStore {
	/** The trimmed input text driving the filter. `''` means "show everything". */
	search = "";
	/** How many items survived the last pass. */
	itemCount = 0;
	/** `value → score`, in descending-score insertion order. */
	readonly items = new Map<string, number>();
	/** Group ids that still contain at least one visible item. */
	readonly groups = new Map<string, Set<string>>();

	#manualFiltering = false;

	constructor(search = "") {
		this.search = search;
	}

	/**
	 * Score `items` against the current `search`, in batches of 250 exactly like upstream, and record
	 * which groups survived. A blank search or `manualFiltering` short-circuits to "everything is
	 * visible", which is also what leaves `items` empty.
	 */
	run(items: readonly MentionFilterItem[], options: MentionFilterRunOptions = {}): this {
		this.#manualFiltering = options.manualFiltering ?? false;
		this.items.clear();
		this.groups.clear();

		if (!this.search || this.#manualFiltering) {
			this.itemCount = items.length;
			return this;
		}

		const term = this.search;
		let itemCount = 0;
		let pendingBatch: MentionFilterItem[] = [];
		const BATCH_SIZE = 250;

		const processBatch = () => {
			if (pendingBatch.length === 0) return;

			const scores = new Map<string, number>();

			for (const item of pendingBatch) {
				const score = scoreItem(item.value, term, options);
				if (score > 0) {
					scores.set(item.value, score);
					itemCount++;
				}
			}

			// Descending score, so the strongest match is first in `items`.
			const sortedScores = Array.from(scores.entries()).sort(([, a], [, b]) => b - a);
			for (const [value, score] of sortedScores) {
				this.items.set(value, score);
			}

			pendingBatch = [];
		};

		for (const item of items) {
			pendingBatch.push(item);
			if (pendingBatch.length >= BATCH_SIZE) processBatch();
		}
		processBatch();

		this.itemCount = itemCount;

		if (itemCount > 0) {
			const matching = new Set(this.items.keys());
			for (const item of items) {
				if (item.groupId === undefined) continue;
				if (!matching.has(item.value)) continue;
				if (!this.groups.has(item.groupId)) this.groups.set(item.groupId, new Set());
				this.groups.get(item.groupId)?.add(item.value);
			}
		}

		return this;
	}

	/** Upstream `getIsItemVisible` (`use-filter-store.ts:148-155`). */
	isItemVisible(value: string): boolean {
		if (this.#manualFiltering) return true;
		if (!this.search) return true;
		return (this.items.get(value) ?? 0) > 0;
	}

	/** Upstream `getIsListEmpty` (`use-filter-store.ts:157-165`) — `manual` forces "empty". */
	isListEmpty(manual = false): boolean {
		return manual || (this.itemCount === 0 && this.search.trim() !== "");
	}

	/** Upstream `<ComboboxGroup>`'s visibility test. */
	isGroupVisible(groupId: string, forceMount = false): boolean {
		return forceMount || !this.search || this.groups.has(groupId);
	}
}
