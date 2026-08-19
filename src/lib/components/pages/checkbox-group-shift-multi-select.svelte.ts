export type ShiftMultiSelectProps<T> = {
	/** The items available for selection, in the order they are rendered. */
	readonly items: readonly T[];
	/** The value of an item — the string the checkbox group stores. */
	readonly getItemValue: (item: T) => string;
};

/**
 * `Shift`-click range selection for the multi-selection demo.
 *
 * A rune implementation of `useShiftMultiSelect`, which lives in the demo file rather than in the
 * component — the checkbox group has no
 * shift-select prop and gains none here.
 *
 * `Shift` is only observed while focus is inside the element the handlers are attached to, which is
 * the same limitation as upstream's `onKeyDown`/`onKeyUp` on `CheckboxGroupList`.
 */
export class ShiftMultiSelect<T> {
	#props: ShiftMultiSelectProps<T>;

	/** The group's value. Bind it with `bind:value={helper.value, helper.onValueChange}`. */
	value = $state<string[]>([]);

	/** Index of the item that anchors the next range, or `null` before anything is selected. */
	lastSelected = $state<number | null>(null);

	/** Not `$state` — nothing renders from it. Upstream's `isShiftPressedRef`. */
	#shiftPressed = false;

	constructor(props: ShiftMultiSelectProps<T>) {
		this.#props = props;
	}

	get isShiftPressed(): boolean {
		return this.#shiftPressed;
	}

	#indexOfValue(value: string): number {
		return this.#props.items.findIndex((item) => this.#props.getItemValue(item) === value);
	}

	/** The single value that entered or left the selection, or `undefined` if nothing moved. */
	#clickedValue(next: string[]): string | undefined {
		return (
			next.find((value) => !this.value.includes(value)) ??
			this.value.find((value) => !next.includes(value))
		);
	}

	/** Attach to both `onkeydown` and `onkeyup` — the event type is what flips the flag. */
	onShiftKeyDown = (event: KeyboardEvent): void => {
		if (event.key !== "Shift") return;
		this.#shiftPressed = event.type === "keydown";
	};

	onValueChange = (next: string[]): void => {
		const clickedValue = this.#clickedValue(next);

		// Plain toggle: take the group's value as-is and remember the anchor for the next range.
		if (!this.#shiftPressed || this.lastSelected === null) {
			this.value = next;
			if (clickedValue !== undefined) {
				const index = this.#indexOfValue(clickedValue);
				if (index !== -1) this.lastSelected = index;
			}
			return;
		}

		if (clickedValue === undefined) return;

		const currentIndex = this.#indexOfValue(clickedValue);
		if (currentIndex === -1) return;

		const start = Math.min(this.lastSelected, currentIndex);
		const end = Math.max(this.lastSelected, currentIndex);
		const rangeValues = this.#props.items
			.slice(start, end + 1)
			.map((item) => this.#props.getItemValue(item));

		// The clicked item's own direction decides the whole range: clicking an unselected item selects
		// the range, clicking a selected one clears it. Upstream deduplicates through a `Set`, which
		// keeps insertion order — appending only the values that are not already selected is the same
		// order without a mutable collection.
		const selecting = !this.value.includes(clickedValue);

		this.value = selecting
			? [...this.value, ...rangeValues.filter((value) => !this.value.includes(value))]
			: this.value.filter((value) => !rangeValues.includes(value));
		this.lastSelected = currentIndex;
	};
}
