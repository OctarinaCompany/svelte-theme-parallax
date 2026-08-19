import { getContext, hasContext, setContext } from "svelte";

/** Every value {@link ProgressState} accepts, in upstream declaration order. */
export const PROGRESS_STATES = ["indeterminate", "complete", "loading"] as const;

/** The classification of the current reading, derived from `value`/`max`. */
export type ProgressState = (typeof PROGRESS_STATES)[number];

/** `min` fallback when the `min` prop is not a finite number. */
export const DEFAULT_MIN = 0;
/** `max` fallback when the `max` prop is not a finite number greater than 0. */
export const DEFAULT_MAX = 100;
/** `size` fallback in pixels. */
export const DEFAULT_SIZE = 48;
/** `thickness` fallback in pixels. */
export const DEFAULT_THICKNESS = 4;

/** `{ radius, center, circumference }` derived from `size`/`thickness`. */
export type RingGeometry = {
	radius: number;
	center: number;
	circumference: number;
};

/** Upstream `getIsValidNumber`. */
export function isValidNumber(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value);
}

/** Upstream `getIsValidMaxNumber`. */
export function isValidMaxNumber(value: unknown): value is number {
	return isValidNumber(value) && value > 0;
}

/** Upstream `getIsValidValueNumber`. */
export function isValidValueNumber(value: unknown, min: number, max: number): value is number {
	return isValidNumber(value) && value <= max && value >= min;
}

/** `value == null ⇒ indeterminate`; `value === max ⇒ complete`; else `loading`. */
export function getProgressState(value: number | null, max: number): ProgressState {
	return value == null ? "indeterminate" : value === max ? "complete" : "loading";
}

/** `` `${Math.round(percentage)}%` ``, upstream verbatim including the `max === min` branch. */
export function getDefaultValueText(value: number, min: number, max: number): string {
	const percentage = max === min ? 100 : ((value - min) / (max - min)) * 100;
	return `${Math.round(percentage)}%`;
}

/**
 * Resolves the effective `{ min, max }`, guaranteeing `max > min`.
 * A non-finite `min` falls back to {@link DEFAULT_MIN}; a non-finite or non-positive `max` falls
 * back to {@link DEFAULT_MAX}; and a resolved `max <= min` is corrected to `min + 1`.
 */
export function resolveProgressBounds(
	minProp: unknown,
	maxProp: unknown,
): { min: number; max: number } {
	const min = isValidNumber(minProp) ? minProp : DEFAULT_MIN;
	const rawMax = isValidMaxNumber(maxProp) ? maxProp : DEFAULT_MAX;
	const max = rawMax <= min ? min + 1 : rawMax;
	return { min, max };
}

/**
 * Clamps `value` into `[min, max]`. Non-finite/`null`/`undefined` resolves to `null`
 * (indeterminate).
 */
export function clampProgressValue(
	value: number | null | undefined,
	min: number,
	max: number,
): number | null {
	if (isValidValueNumber(value, min, max)) return value;
	if (isValidNumber(value) && value > max) return max;
	if (isValidNumber(value) && value < min) return min;
	return null;
}

/** `null` for an indeterminate `value`; `max === min ⇒ 1`; else a decimal in `[0, 1]`. */
export function getProgressPercentage(
	value: number | null,
	min: number,
	max: number,
): number | null {
	if (value === null) return null;
	return max === min ? 1 : (value - min) / (max - min);
}

/**
 * `radius = max(0, (size - thickness) / 2)`, `center = size / 2`,
 * `circumference = 2 * PI * radius`.
 */
export function getRingGeometry(size: number, thickness: number): RingGeometry {
	const radius = Math.max(0, (size - thickness) / 2);
	const center = size / 2;
	const circumference = 2 * Math.PI * radius;
	return { radius, center, circumference };
}

/** A cartesian point on an SVG canvas. */
export type Point = { x: number; y: number };

/** Normalizes `angle` into `[0, 360)`, upstream verbatim. */
export function getNormalizedAngle(angle: number): number {
	return ((angle % 360) + 360) % 360;
}

/** Converts a polar angle (0° = 12 o'clock, clockwise) to a cartesian point on the given circle. */
export function polarToCartesian(
	centerX: number,
	centerY: number,
	radius: number,
	angleInDegrees: number,
): Point {
	const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
	return {
		x: centerX + radius * Math.cos(angleInRadians),
		y: centerY + radius * Math.sin(angleInRadians),
	};
}

/**
 * Builds the SVG `d` attribute for the arc from `startAngle` to `endAngle`. `|Δ| >= 360` draws a
 * full circle as two chained semicircle `A` segments (a single `A` cannot span 360°).
 */
export function describeArc(
	x: number,
	y: number,
	radius: number,
	startAngle: number,
	endAngle: number,
): string {
	const angleDiff = endAngle - startAngle;

	if (Math.abs(angleDiff) >= 360) {
		const start = polarToCartesian(x, y, radius, startAngle);
		const mid = polarToCartesian(x, y, radius, startAngle + 180);
		return [
			"M",
			start.x,
			start.y,
			"A",
			radius,
			radius,
			0,
			0,
			1,
			mid.x,
			mid.y,
			"A",
			radius,
			radius,
			0,
			0,
			1,
			start.x,
			start.y,
		].join(" ");
	}

	const start = polarToCartesian(x, y, radius, startAngle);
	const end = polarToCartesian(x, y, radius, endAngle);
	const largeArcFlag = angleDiff <= 180 ? "0" : "1";

	return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y].join(" ");
}

/** `(min(|Δ|, 360) / 360) · 2πr` — the drawn length of the arc, clamped at a full circumference. */
export function getArcLength(radius: number, startAngle: number, endAngle: number): number {
	const angleDiff = Math.abs(endAngle - startAngle);
	return (Math.min(angleDiff, 360) / 360) * (2 * Math.PI * radius);
}

/**
 * The label-anchor `y` for the arc, for positioning a value label. Full circles use the geometric
 * centre; partial arcs use the midpoint of the endpoints' `y`, widened to the circle's top/bottom
 * extreme when the sweep crosses the side points 270°/90° (upstream verbatim) — any sweep spanning
 * both side points therefore resolves to the geometric centre, which is where symmetric gauges
 * place their value text.
 */
export function getArcCenterY(
	center: number,
	radius: number,
	startAngle: number,
	endAngle: number,
): number {
	const angleDiffDeg = Math.abs(endAngle - startAngle);
	const isFullCircle = angleDiffDeg >= 360;

	if (isFullCircle) return center;

	const startRad = (startAngle * Math.PI) / 180;
	const endRad = (endAngle * Math.PI) / 180;

	const startY = center - radius * Math.cos(startRad);
	const endY = center - radius * Math.cos(endRad);

	let minY = Math.min(startY, endY);
	let maxY = Math.max(startY, endY);

	const normStart = getNormalizedAngle(startAngle);
	const normEnd = getNormalizedAngle(endAngle);

	const includesTop =
		normStart > normEnd ? normStart <= 270 || normEnd >= 270 : normStart <= 270 && normEnd >= 270;
	const includesBottom =
		normStart > normEnd ? normStart <= 90 || normEnd >= 90 : normStart <= 90 && normEnd >= 90;

	if (includesTop) minY = Math.min(minY, center - radius);
	if (includesBottom) maxY = Math.max(maxY, center + radius);

	return (minY + maxY) / 2;
}

type CircularProgressStateProps = {
	readonly getValue: () => number | null | undefined;
	readonly getGetValueText: () => (value: number, min: number, max: number) => string;
	readonly getMin: () => number;
	readonly getMax: () => number;
	readonly getSize: () => number;
	readonly getThickness: () => number;
	readonly getValueTextId: () => string;
};

/** One instance per `<CircularProgress.Root>`. Published on context; every part reads it. */
export class CircularProgressState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: CircularProgressStateProps;

	/** Whether a `<CircularProgress.ValueText>` is currently in the document. */
	#hasValueText = $state(false);

	readonly #bounds = $derived(resolveProgressBounds(this.#props.getMin(), this.#props.getMax()));
	readonly min: number = $derived(this.#bounds.min);
	readonly max: number = $derived(this.#bounds.max);
	readonly value: number | null = $derived(
		clampProgressValue(this.#props.getValue(), this.min, this.max),
	);
	readonly percentage: number | null = $derived(
		getProgressPercentage(this.value, this.min, this.max),
	);
	readonly state: ProgressState = $derived(getProgressState(this.value, this.max));
	readonly valueText: string | undefined = $derived(
		this.value === null ? undefined : this.#props.getGetValueText()(this.value, this.min, this.max),
	);
	readonly size: number = $derived(this.#props.getSize());
	readonly thickness: number = $derived(this.#props.getThickness());
	readonly #geometry = $derived(getRingGeometry(this.size, this.thickness));
	readonly radius: number = $derived(this.#geometry.radius);
	readonly center: number = $derived(this.#geometry.center);
	readonly circumference: number = $derived(this.#geometry.circumference);
	readonly valueTextId: string = $derived(this.#props.getValueTextId());
	/**
	 * The root's `aria-describedby` — set only while a `<CircularProgress.ValueText>` is actually
	 * in the document, so the root never emits a dangling idref.
	 */
	readonly describedBy: string | undefined = $derived(
		this.#hasValueText && this.valueText !== undefined ? this.valueTextId : undefined,
	);
	readonly strokeDasharray: number = $derived(this.circumference);
	readonly strokeDashoffset: number = $derived(
		this.state === "indeterminate"
			? this.circumference * 0.75
			: this.percentage !== null
				? this.circumference - this.percentage * this.circumference
				: this.circumference,
	);

	constructor(props: CircularProgressStateProps) {
		this.#props = props;
	}

	/** Called from `<CircularProgress.ValueText>`'s `$effect`; the returned thunk is its teardown. */
	registerValueText(): () => void {
		this.#hasValueText = true;
		return () => {
			this.#hasValueText = false;
		};
	}
}

const CIRCULAR_PROGRESS_CONTEXT_KEY = Symbol("circular-progress");

export function setCircularProgressContext(state: CircularProgressState): CircularProgressState {
	return setContext(CIRCULAR_PROGRESS_CONTEXT_KEY, state);
}

export function hasCircularProgressContext(): boolean {
	return hasContext(CIRCULAR_PROGRESS_CONTEXT_KEY);
}

export function getCircularProgressContext(consumerName?: string): CircularProgressState {
	if (!hasCircularProgressContext()) {
		const label = consumerName ? `\`<${consumerName}>\`` : "`<CircularProgress>` part";
		throw new Error(`${label} must be used within \`<CircularProgress>\`.`);
	}
	return getContext<CircularProgressState>(CIRCULAR_PROGRESS_CONTEXT_KEY);
}
