/**
 * A write-only `key → element` registry for focus and scrolling.
 *
 * Deliberately **not** reactive, and deliberately in a plain `.ts` module so it cannot become so:
 * every mounted cell and row writes to it from inside an `$effect`, and a reactive map would
 * invalidate each of those effects as its siblings registered — the classic self-invalidation loop.
 * Nothing renders from this data; it is only ever read imperatively, from an event handler.
 */
export class DataGridDomRegistry<TKey> {
	#elements = new Map<TKey, HTMLElement>();

	/** Register an element, or drop the entry when the element unmounts. */
	set(key: TKey, element: HTMLElement | null): void {
		if (element) this.#elements.set(key, element);
		else this.#elements.delete(key);
	}

	/** The registered element for a key, if it is currently mounted. */
	get(key: TKey): HTMLElement | undefined {
		return this.#elements.get(key);
	}
}
