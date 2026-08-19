/**
 * Reusable element-visibility tracking: "which of these elements is topmost inside the viewport".
 *
 * This module is deliberately standalone — it imports nothing from the rest of the `scroll-spy`
 * folder, knows nothing about markup, context or the active value — and is exported from the barrel
 * so the `tour` port can consume it directly instead of re-deriving it.
 * `pickTopmostEntry`, `observeSections` and `SectionRegistry` are the stability promise to that
 * port: changing their signatures is a breaking change.
 *
 * Ported from the reference implementation's `scroll-spy.tsx`, lines 157-172 (the section map) and
 * 234-285 (the observer effect).
 */

/** {@link IntersectionObserverInit} minus the `Document` root upstream never passes. */
export type SectionObserverOptions = {
	/** The element whose box bounds the observation, or `null`/omitted for the viewport. */
	root?: Element | null;
	/** CSS-margin-shaped string shrinking or growing the observation band. */
	rootMargin?: string;
	/** Visible-fraction thresholds at which the observer reports. */
	threshold?: number | number[];
};

/**
 * The intersecting entry with the smallest `boundingClientRect.top`, or `null` when nothing
 * intersects — upstream lines 249-257. Pure: it reads no DOM and mutates nothing, so an empty
 * intersecting set leaves the caller's previous choice standing.
 */
export function pickTopmostEntry(
	entries: readonly IntersectionObserverEntry[],
): IntersectionObserverEntry | null {
	let topmost: IntersectionObserverEntry | null = null;

	for (const entry of entries) {
		if (!entry.isIntersecting) continue;
		if (!topmost || entry.boundingClientRect.top < topmost.boundingClientRect.top) {
			topmost = entry;
		}
	}

	return topmost;
}

/**
 * Observe `elements` and report the topmost intersecting one, coalescing each callback batch into a
 * single `requestAnimationFrame` so activation cannot flap within a frame (upstream lines 244-247).
 *
 * The returned teardown disconnects the observer, cancels any pending frame, and latches the
 * wrapper closed so a callback that is still in flight can no longer deliver — the caller may have
 * unmounted by then.
 *
 * SSR-guarded: with no `window` or no `IntersectionObserver` it observes nothing and returns a
 * no-op teardown, so a caller never has to branch (the `observeScrollPosition` precedent).
 */
export function observeSections(
	elements: Iterable<Element>,
	onTopmost: (element: Element) => void,
	options: SectionObserverOptions = {},
): () => void {
	if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") {
		return () => {};
	}

	let frameId: number | null = null;
	let disposed = false;

	const observer = new IntersectionObserver(
		(entries) => {
			if (disposed) return;

			if (frameId !== null) cancelAnimationFrame(frameId);

			frameId = requestAnimationFrame(() => {
				frameId = null;
				if (disposed) return;

				const topmost = pickTopmostEntry(entries);
				if (!topmost) return;

				onTopmost(topmost.target);
			});
		},
		{
			root: options.root ?? null,
			rootMargin: options.rootMargin,
			threshold: options.threshold,
		},
	);

	for (const element of elements) observer.observe(element);

	return () => {
		disposed = true;
		observer.disconnect();
		if (frameId !== null) {
			cancelAnimationFrame(frameId);
			frameId = null;
		}
	};
}

/** One reactive membership snapshot: everything {@link observeSections} needs, read in one pass. */
export type SectionRegistrySnapshot = {
	/** Bumped on every membership change. Reading it subscribes an effect to register/unregister. */
	version: number;
	/** The registered elements, in registration order. */
	elements: Element[];
};

/**
 * The set of elements currently eligible for tracking — upstream's `sectionMapRef` (line 157) plus
 * the reactive version counter Svelte needs.
 *
 * Upstream's observer effect deliberately excludes the section map from its dependencies, which
 * works in React only because child layout effects run before the parent's. Svelte guarantees no
 * such ordering, and the observer must be re-established whenever the tracked set changes, so
 * membership is a dependency here (divergence D-1).
 */
export class SectionRegistry {
	// A plain array of records rather than a `Map`: the storage must stay non-reactive (a reactive
	// map would make `register`'s own lookup a dependency of the effect that calls it), and the
	// section count is small enough that the linear lookups cost nothing.
	#entries: { id: string; element: Element }[] = [];
	#changes = 0;
	#version = $state(0);
	#size = $state(0);

	/** Reactive change counter. Bumped by {@link register} and {@link unregister}. */
	get version(): number {
		return this.#version;
	}

	/** How many elements are registered. Reactive. */
	get size(): number {
		return this.#size;
	}

	/**
	 * Store `element` under `id`. A falsy `id` is never stored, and re-registering the
	 * same id with the same element does not bump the version — otherwise a section whose
	 * registration effect re-runs with unchanged inputs would re-create the observer forever.
	 */
	register(id: string, element: Element): void {
		if (!id) return;

		const existing = this.#entries.find((entry) => entry.id === id);
		if (existing) {
			if (existing.element === element) return;
			existing.element = element;
		} else {
			this.#entries.push({ id, element });
		}

		this.#bump();
	}

	/** Forget `id`. A no-op — and no version bump — when it was never registered. */
	unregister(id: string): void {
		const index = this.#entries.findIndex((entry) => entry.id === id);
		if (index === -1) return;

		this.#entries.splice(index, 1);
		this.#bump();
	}

	/** Whether `id` is currently tracked. Non-reactive: it gates the observer callback. */
	has(id: string): boolean {
		return this.#entries.some((entry) => entry.id === id);
	}

	/** Read membership reactively. Call this from the effect that owns the observer. */
	snapshot(): SectionRegistrySnapshot {
		return { version: this.#version, elements: this.#entries.map((entry) => entry.element) };
	}

	/**
	 * Both reactive fields are *assigned*, never read-modify-written: the counter is kept in a plain
	 * field, because `this.#version += 1` would make the section's registration effect a dependent of
	 * the very signal it bumps — an effect that reads and writes the same state, i.e. a loop.
	 */
	#bump(): void {
		this.#changes += 1;
		this.#version = this.#changes;
		this.#size = this.#entries.length;
	}
}
