import { isSameValue } from "./filters-utils.js";
import type { FilterFieldConfig, FilterOption } from "./types.js";

/**
 * A field's options, resolved.
 *
 * This is upstream's `useFieldOptions` hook as a runes class. A static field returns its list
 * verbatim and none of the machinery below runs; a field with `loadOptions` debounces the query,
 * drops out-of-order responses, and keeps a value→label cache so a selected value stays labelled
 * after it falls out of the loader's latest page.
 *
 * WHY A CLASS. The hook returns `{ isAsync, options, loading, error, resolveSelected }` and React
 * re-runs the whole function on every render to keep those five in step. Runes do not need the
 * re-run — the reads are live — so the hook collapses into one instance per consumer, exactly as
 * `hooks/file-upload.svelte.ts` does for `useFileUpload`. The getters are what `useState` was.
 */

/**
 * value → option, shared by every instance resolving the SAME field object.
 *
 * Keyed on the config object, so the Add filter submenu and the chip it creates — which are two
 * components handed the same reference out of the fields map — share one cache. That sharing is
 * the entire point: pick "Marie Curie" in the submenu of an async field and the chip has to
 * render her name, at a moment when the chip's own loader has not run once.
 *
 * A `WeakMap` rather than a `Map` so a fields array that is rebuilt takes its caches with it.
 */
const fieldOptionCaches = new WeakMap<object, Map<unknown, FilterOption>>();

function getFieldOptionCache<T = unknown>(
	field: FilterFieldConfig<T>,
): Map<unknown, FilterOption<T>> {
	let cache = fieldOptionCaches.get(field as object);
	if (!cache) {
		cache = new Map();
		fieldOptionCaches.set(field as object, cache);
	}
	return cache as Map<unknown, FilterOption<T>>;
}

/**
 * What an entry is stored under: the field's `getOptionKey` when it declares one, the value itself
 * when not. The value alone cannot key object values — the lookup side reads them back out of a
 * `$state` array as proxies, which `Map.get` does not recognise.
 */
function cacheKey<T = unknown>(field: FilterFieldConfig<T>, value: T): unknown {
	return field.getOptionKey ? field.getOptionKey(value) : value;
}

/** How long the query sits still before an async field's loader is called. */
const LOAD_DEBOUNCE_MS = 250;

export interface FieldOptionsProps<T = unknown> {
	/** The field being resolved. Read through a thunk so a swapped config is picked up. */
	readonly field: () => FilterFieldConfig<T>;
	/** The live search box contents. Debounced before it reaches the loader. */
	readonly query: () => string;
	/** Whether the surface is on screen. An unopened popover must not fetch. */
	readonly enabled: () => boolean;
}

export class FieldOptions<T = unknown> {
	readonly #props: FieldOptionsProps<T>;

	/** The loader's latest result. `$state.raw` — the array is replaced, never mutated. */
	#loaded = $state.raw<FilterOption<T>[]>([]);
	#loading = $state(false);
	#error = $state(false);

	/** The query the loader actually sees. Trails {@link FieldOptionsProps.query} by the debounce. */
	#debouncedQuery = $state("");

	/**
	 * Monotonic request counter. Not `$state`: it exists to be compared, never rendered, and
	 * making it reactive would subscribe the effect that increments it to its own write.
	 */
	#requestId = 0;

	constructor(props: FieldOptionsProps<T>) {
		this.#props = props;

		const field = props.field();
		this.#loaded = field.options ?? [];
		this.#debouncedQuery = props.query();

		// Seed the shared cache from any static options an async field also carries, HERE rather
		// than in an effect: `resolveSelected` runs during the first render, and an effect would
		// seed after it — long enough to paint a row of raw values where labels belong.
		this.#seed(field, field.options);

		$effect(() => {
			if (!this.isAsync) return;
			const query = this.#props.query();
			const timer = setTimeout(() => (this.#debouncedQuery = query), LOAD_DEBOUNCE_MS);
			return () => clearTimeout(timer);
		});

		$effect(() => {
			const field = this.#props.field();
			const loader = field.loadOptions;
			if (typeof loader !== "function" || !this.#props.enabled()) return;

			const query = this.#debouncedQuery;
			const requestId = ++this.#requestId;
			let cancelled = false;

			this.#loading = true;
			this.#error = false;

			// `Promise.resolve().then(...)` and not `await`: a loader is free to be synchronous,
			// and this keeps the synchronous case on the same path — including its rejections,
			// which a bare call would throw past the `.catch` and out of the effect.
			Promise.resolve()
				.then(() => loader(query))
				.then((result) => {
					// The out-of-order guard. Two keystrokes 300ms apart start two requests; if the
					// first server answer arrives second, this is what stops it overwriting the
					// second's — the bug where a list settles on the results for `ma` after you
					// have typed `marie`.
					if (cancelled || requestId !== this.#requestId) return;
					this.#seed(field, result);
					this.#loaded = result;
					this.#loading = false;
					this.#error = false;
				})
				.catch(() => {
					if (cancelled || requestId !== this.#requestId) return;
					this.#loading = false;
					this.#error = true;
				});

			return () => {
				cancelled = true;
			};
		});
	}

	#seed(field: FilterFieldConfig<T>, options: FilterOption<T>[] | undefined) {
		if (!options || typeof field.loadOptions !== "function") return;
		const cache = getFieldOptionCache(field);
		for (const option of options) cache.set(cacheKey(field, option.value), option);
	}

	/** Whether this field loads its options rather than declaring them. */
	get isAsync(): boolean {
		return typeof this.#props.field().loadOptions === "function";
	}

	/** The list to offer. Static fields are handed straight back, untouched. */
	get options(): FilterOption<T>[] {
		const field = this.#props.field();
		return typeof field.loadOptions === "function" ? this.#loaded : (field.options ?? []);
	}

	/** A loader call is in flight. Only ever true for an async field. */
	get loading(): boolean {
		return this.isAsync && this.#loading;
	}

	/** The last loader call rejected. Cleared when the next one starts. */
	get error(): boolean {
		return this.isAsync && this.#error;
	}

	/**
	 * Selected values as full options — label and icon included.
	 *
	 * The static list is consulted after the cache so a field whose config was swapped for one
	 * with the same options still labels its selection. Upstream reads the cache alone; the
	 * difference only shows in that one case, and showing a raw value there would be a defect.
	 */
	resolveSelected(values: T[]): FilterOption<T>[] {
		const field = this.#props.field();
		const cache = getFieldOptionCache(field);
		return values.map(
			(value) =>
				cache.get(cacheKey(field, value)) ??
				field.options?.find((option) => isSameValue(field, option.value, value)) ?? {
					value,
					label: String(value),
				},
		);
	}
}
