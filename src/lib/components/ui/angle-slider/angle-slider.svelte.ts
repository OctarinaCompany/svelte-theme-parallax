import { getContext, hasContext, setContext } from "svelte";
import { SvelteMap } from "svelte/reactivity";

import type { Direction } from "$lib/components/ui/direction-provider/index.js";

/** `min` fallback. */
export const DEFAULT_MIN = 0;
/** `max` fallback. */
export const DEFAULT_MAX = 100;
/** `step` fallback. */
export const DEFAULT_STEP = 1;
/** Dial **radius** in px. */
export const DEFAULT_SIZE = 60;
/** Track stroke width in px. */
export const DEFAULT_THICKNESS = 8;
/** `-90` puts `min` at 12 o'clock. */
export const DEFAULT_START_ANGLE = -90;
/** `270` closes the full circle. */
export const DEFAULT_END_ANGLE = 270;
/**
 * Padding in px between the track radius and the root box, so a thumb sitting on the rail is not
 * clipped. Upstream spells it inline as `size + 20` / `size * 2 + 40`.
 */
export const THUMB_HALO = 20;
/** Keys that move by `10 · step`. */
export const PAGE_KEYS = ["PageUp", "PageDown"] as const;
/** Keys that move by `step`. */
export const ARROW_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"] as const;

/** Everything the value ⇄ angle conversions need — upstream's `StoreState` subset. */
export type AngleSliderGeometry = {
	min: number;
	max: number;
	inverted: boolean;
	startAngle: number;
	endAngle: number;
};

/** One registered `<AngleSlider.Thumb>`, keyed by its index in the value array. */
export type AngleSliderThumbData = {
	index: number;
	/** The positioned wrapper `<span>`; `contains()` on it also matches the `child` element. */
	element: HTMLElement;
};

/** Upstream `clamp`, with the tuple flattened into two arguments. */
export function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

/** Upstream `getDecimalCount`. */
export function getDecimalCount(value: number): number {
	return (String(value).split(".")[1] ?? "").length;
}

/** Upstream `roundValue`. */
export function roundValue(value: number, decimalCount: number): number {
	const rounder = 10 ** decimalCount;
	return Math.round(value * rounder) / rounder;
}

/**
 * Upstream's snap-then-clamp pair, inlined in `updateValue`.
 * The rounding precision comes from `step`'s own decimal count, which is what keeps
 * `step={0.5}` from emitting `44.999999999999993`.
 */
export function snapToStep(value: number, min: number, max: number, step: number): number {
	const decimalCount = getDecimalCount(step);
	const snapped = roundValue(Math.round((value - min) / step) * step + min, decimalCount);
	return clamp(snapped, min, max);
}

/** Upstream `getNextSortedValues`. */
export function getNextSortedValues(
	prevValues: number[] = [],
	nextValue: number,
	atIndex: number,
): number[] {
	const nextValues = [...prevValues];
	nextValues[atIndex] = nextValue;
	return nextValues.sort((a, b) => a - b);
}

/** Upstream `getStepsBetweenValues`. */
export function getStepsBetweenValues(values: number[]): number[] {
	return values.slice(0, -1).map((value, index) => {
		const nextValue = values[index + 1];
		return nextValue !== undefined ? nextValue - value : 0;
	});
}

/** Upstream `hasMinStepsBetweenValues`. */
export function hasMinStepsBetweenValues(values: number[], minStepsBetweenValues: number): boolean {
	if (minStepsBetweenValues > 0) {
		const stepsBetweenValues = getStepsBetweenValues(values);
		const actualMinStepsBetweenValues =
			stepsBetweenValues.length > 0 ? Math.min(...stepsBetweenValues) : 0;
		return actualMinStepsBetweenValues >= minStepsBetweenValues;
	}
	return true;
}

/** Upstream `getClosestValueIndex`. */
export function getClosestValueIndex(values: number[], nextValue: number): number {
	if (values.length === 1) return 0;
	const distances = values.map((value) => Math.abs(value - nextValue));
	const closestDistance = Math.min(...distances);
	return distances.indexOf(closestDistance);
}

/**
 * The swept angle of the dial in degrees — upstream's
 * `(endAngle - startAngle + 360) % 360 || 360`
 * and `677`. The `|| 360` is what makes `startAngle === endAngle` a full circle rather than a
 * zero-width dial that divides by zero.
 */
export function getTotalAngle(startAngle: number, endAngle: number): number {
	return (endAngle - startAngle + 360) % 360 || 360;
}

/**
 * Upstream `getValueFromPointer`.
 *
 * Returns `null` — rather than upstream's `NaN`-producing arithmetic — when the element has not
 * been laid out (a zero-size box, which is what jsdom always reports) or when the pointer sits
 * exactly on the centre, where the angle is undefined. Callers keep the previous value in both
 * cases.
 */
export function getValueFromPointer(
	clientX: number,
	clientY: number,
	rect: DOMRect,
	geometry: AngleSliderGeometry,
): number | null {
	const { min, max, inverted, startAngle, endAngle } = geometry;

	if (rect.width === 0 || rect.height === 0) return null;

	const centerX = rect.left + rect.width / 2;
	const centerY = rect.top + rect.height / 2;

	const deltaX = clientX - centerX;
	const deltaY = clientY - centerY;

	if (deltaX === 0 && deltaY === 0) return null;

	let angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
	if (angle < 0) angle += 360;

	angle = (angle - startAngle + 360) % 360;

	let percent = angle / getTotalAngle(startAngle, endAngle);
	if (inverted) percent = 1 - percent;

	return min + percent * (max - min);
}

/** Upstream `getAngleFromValue`. */
export function getAngleFromValue(value: number, geometry: AngleSliderGeometry): number {
	const { min, max, inverted, startAngle, endAngle } = geometry;

	let percent = max === min ? 0 : (value - min) / (max - min);
	if (inverted) percent = 1 - percent;

	return startAngle + percent * getTotalAngle(startAngle, endAngle);
}

/** Upstream `getPositionFromAngle`. Offsets from the dial centre. */
export function getPositionFromAngle(angle: number, size: number): { x: number; y: number } {
	const radians = (angle * Math.PI) / 180;
	return { x: size * Math.cos(radians), y: size * Math.sin(radians) };
}

/**
 * The `d` of an SVG arc between two dial angles — upstream's duplicated inline path builders at
 * `angle-slider.tsx:600-637` (Track) and `681-698` (Range).
 *
 * `clockwise` picks which of the two arcs joining the endpoints is drawn, and with it the swept
 * angle the large-arc flag is derived from:
 *
 * - `true` (SVG sweep-flag `1`, upstream's only mode) sweeps `(endAngle - startAngle + 360) % 360`.
 * - `false` (sweep-flag `0`) sweeps `(startAngle - endAngle + 360) % 360` — the same two endpoints,
 *   the other side of the circle. An `inverted` dial needs it, because `getAngleFromValue` makes
 *   the dial angle *decrease* as the value increases there.
 *
 * With `clockwise` left at its default the output is byte-identical to upstream's.
 */
export function describeAngleArc(
	centre: number,
	radius: number,
	startAngle: number,
	endAngle: number,
	clockwise = true,
): string {
	const startRadians = (startAngle * Math.PI) / 180;
	const endRadians = (endAngle * Math.PI) / 180;

	const startX = centre + radius * Math.cos(startRadians);
	const startY = centre + radius * Math.sin(startRadians);
	const endX = centre + radius * Math.cos(endRadians);
	const endY = centre + radius * Math.sin(endRadians);

	const sweep = clockwise
		? (endAngle - startAngle + 360) % 360
		: (startAngle - endAngle + 360) % 360;
	const largeArcFlag = sweep > 180 ? 1 : 0;
	const sweepFlag = clockwise ? 1 : 0;

	return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${endX} ${endY}`;
}

/** Every reactive input the root hands to {@link AngleSliderRootState}, as getter functions. */
export type AngleSliderRootStateProps = {
	getValues: () => number[];
	setValues: (values: number[]) => void;
	getMin: () => number;
	getMax: () => number;
	getStep: () => number;
	getMinStepsBetweenThumbs: () => number;
	getSize: () => number;
	getThickness: () => number;
	getStartAngle: () => number;
	getEndAngle: () => number;
	getDir: () => Direction;
	getName: () => string | undefined;
	getForm: () => string | undefined;
	getDisabled: () => boolean;
	getReadOnly: () => boolean;
	getInverted: () => boolean;
	getOnValueCommit: () => ((value: number[]) => void) | undefined;
};

/**
 * The Svelte equivalent of upstream's `Store` + `StoreState` + `SliderContextValue`.
 * One instance per `<AngleSlider.Root>`, published on context and read by every part.
 */
export class AngleSliderRootState {
	// `$derived` is lazy at runtime (evaluated only when read), but svelte-check's static analysis
	// cannot see that across the constructor assignment, hence the definite-assignment `!`.
	#props!: AngleSliderRootStateProps;

	/** The thumb every keyboard command acts on — upstream `StoreState.valueIndexToChange`. */
	valueIndexToChange = $state(0);

	/** Registered thumbs by index — upstream `StoreState.thumbs`. */
	readonly thumbs = new SvelteMap<number, AngleSliderThumbData>();

	/** Deliberately non-reactive: read once on `pointerup` to decide whether to commit. */
	#valuesBeforeSlideStart: number[] = [];

	readonly values: number[] = $derived(this.#props.getValues());
	readonly min: number = $derived(this.#props.getMin());
	readonly max: number = $derived(this.#props.getMax());
	readonly step: number = $derived(this.#props.getStep());
	readonly minStepsBetweenThumbs: number = $derived(this.#props.getMinStepsBetweenThumbs());
	readonly size: number = $derived(this.#props.getSize());
	readonly thickness: number = $derived(this.#props.getThickness());
	readonly startAngle: number = $derived(this.#props.getStartAngle());
	readonly endAngle: number = $derived(this.#props.getEndAngle());
	readonly dir: Direction = $derived(this.#props.getDir());
	readonly name: string | undefined = $derived(this.#props.getName());
	readonly form: string | undefined = $derived(this.#props.getForm());
	readonly disabled: boolean = $derived(this.#props.getDisabled());
	readonly readOnly: boolean = $derived(this.#props.getReadOnly());
	readonly inverted: boolean = $derived(this.#props.getInverted());

	/** Ascending copy of {@link values}; drives `Range` and `Value`. */
	readonly sorted: number[] = $derived([...this.values].sort((a, b) => a - b));
	readonly totalAngle: number = $derived(getTotalAngle(this.startAngle, this.endAngle));
	readonly isFullCircle: boolean = $derived(this.totalAngle >= 359);
	/** Centre of the root box in its own coordinate space. */
	readonly centre: number = $derived(this.size + THUMB_HALO);
	readonly trackRadius: number = $derived(this.size);
	/** Width and height of the root box and of the track `<svg>`. */
	readonly boxSize: number = $derived(this.centre * 2);
	readonly geometry: AngleSliderGeometry = $derived({
		min: this.min,
		max: this.max,
		inverted: this.inverted,
		startAngle: this.startAngle,
		endAngle: this.endAngle,
	});
	/** `false` under `disabled` or `readOnly`; every command bails out on it. */
	readonly interactive: boolean = $derived(!this.disabled && !this.readOnly);

	constructor(props: AngleSliderRootStateProps) {
		this.#props = props;
	}

	/** Upstream `addThumb`. */
	register(index: number, element: HTMLElement): void {
		this.thumbs.set(index, { index, element });
	}

	/** Upstream `removeThumb`. */
	unregister(index: number): void {
		this.thumbs.delete(index);
	}

	/** The dial angle a value sits at, in degrees. */
	angleFor(value: number): number {
		return getAngleFromValue(value, this.geometry);
	}

	/** The pixel offset from {@link centre} a value's thumb sits at. */
	positionFor(value: number): { x: number; y: number } {
		return getPositionFromAngle(this.angleFor(value), this.size);
	}

	/**
	 * Upstream `getValueFromPointer` — the caller measures the root and passes the rect in, so no
	 * layout read ever happens inside an `$effect`.
	 */
	valueFromPointer(clientX: number, clientY: number, rect: DOMRect): number | null {
		return getValueFromPointer(clientX, clientY, rect, this.geometry);
	}

	/**
	 * Upstream `updateValue`. Snaps, rounds, clamps and re-sorts, then
	 * discards the write **whole** when it would violate `minStepsBetweenThumbs` (no
	 * `onValueChange`, no `onValueCommit`).
	 */
	updateValue(value: number, atIndex: number, options: { commit?: boolean } = {}): void {
		const { commit = false } = options;

		const nextValue = snapToStep(value, this.min, this.max, this.step);
		const nextValues = getNextSortedValues(this.values, nextValue, atIndex);

		if (!hasMinStepsBetweenValues(nextValues, this.minStepsBetweenThumbs * this.step)) return;

		this.valueIndexToChange = nextValues.indexOf(nextValue);

		if (String(nextValues) === String(this.values)) return;

		this.#props.setValues(nextValues);
		if (commit) this.#props.getOnValueCommit()?.(nextValues);
	}

	/** Snapshot taken on `pointerdown`, compared on `pointerup` — upstream `valuesBeforeSlideStartRef`. */
	snapshotValues(): void {
		this.#valuesBeforeSlideStart = this.values;
	}

	/** The thumb whose wrapper contains `target`, if any. */
	thumbFromTarget(target: Node | null): AngleSliderThumbData | undefined {
		if (!target) return undefined;
		return [...this.thumbs.values()].find((thumb) => thumb.element.contains(target));
	}

	/** Upstream `onSliderStart`. */
	startSlide(pointerValue: number): void {
		if (!this.interactive) return;

		const closestIndex = getClosestValueIndex(this.values, pointerValue);
		this.valueIndexToChange = closestIndex;
		this.updateValue(pointerValue, closestIndex);
	}

	/** Upstream `onSliderMove`. */
	moveSlide(pointerValue: number): void {
		if (!this.interactive) return;

		this.updateValue(pointerValue, this.valueIndexToChange);
	}

	/** Upstream `onSliderEnd`. Commits only on a real change. */
	endSlide(): void {
		if (!this.interactive) return;

		const prevValue = this.#valuesBeforeSlideStart[this.valueIndexToChange];
		const nextValue = this.values[this.valueIndexToChange];

		if (nextValue !== prevValue) this.#props.getOnValueCommit()?.(this.values);
	}

	/**
	 * Upstream `onKeyDown`, with two deliberate divergences:
	 *
	 * - `PageUp`/`ArrowUp` **increase** and `PageDown`/`ArrowDown` **decrease**, matching every
	 *   other slider on the platform; upstream lumps `ArrowUp` and `PageUp` in with `ArrowLeft` as
	 *   decrease keys.
	 * - `Home`/`End` act on the **active** thumb rather than always on index `0`/`length - 1`.
	 *
	 * Under `dir="rtl"` the horizontal arrows swap, which upstream never implements despite
	 * resolving a direction.
	 */
	handleKeydown(event: KeyboardEvent): void {
		if (!this.interactive) return;

		const index = this.valueIndexToChange;
		const currentValue = this.values[index] ?? this.min;
		const key = event.key;

		if (key === "Home") {
			event.preventDefault();
			this.updateValue(this.min, index, { commit: true });
			return;
		}

		if (key === "End") {
			event.preventDefault();
			this.updateValue(this.max, index, { commit: true });
			return;
		}

		const isPageKey = (PAGE_KEYS as readonly string[]).includes(key);
		const isArrowKey = (ARROW_KEYS as readonly string[]).includes(key);
		if (!isPageKey && !isArrowKey) return;

		event.preventDefault();

		const isSkipKey = isPageKey || (event.shiftKey && isArrowKey);
		const multiplier = isSkipKey ? 10 : 1;

		let direction = key === "ArrowDown" || key === "ArrowLeft" || key === "PageDown" ? -1 : 1;
		if (this.dir === "rtl" && (key === "ArrowLeft" || key === "ArrowRight")) direction *= -1;
		if (this.inverted) direction *= -1;

		this.updateValue(currentValue + this.step * multiplier * direction, index, { commit: true });
	}
}

const ANGLE_SLIDER_CONTEXT_KEY = Symbol("angle-slider");

export function setAngleSliderContext(state: AngleSliderRootState): AngleSliderRootState {
	return setContext(ANGLE_SLIDER_CONTEXT_KEY, state);
}

export function hasAngleSliderContext(): boolean {
	return hasContext(ANGLE_SLIDER_CONTEXT_KEY);
}

/**
 * The Svelte equivalent of upstream's `useStore` / `useAngleSlider`.
 * Throws when the part is rendered outside `<AngleSlider>`.
 */
export function getAngleSliderContext(consumerName = "<AngleSlider.Part>"): AngleSliderRootState {
	if (!hasAngleSliderContext()) {
		throw new Error(`\`${consumerName}\` must be used within \`<AngleSlider>\`.`);
	}
	return getContext<AngleSliderRootState>(ANGLE_SLIDER_CONTEXT_KEY);
}
