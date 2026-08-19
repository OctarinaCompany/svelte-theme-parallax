import { getContext, hasContext, setContext } from "svelte";

import {
	clampProgressValue,
	describeArc,
	getArcCenterY,
	getArcLength,
	getProgressPercentage,
	getProgressState,
	getRingGeometry,
	resolveProgressBounds,
	type ProgressState,
} from "$lib/components/ui/circular-progress/index.js";

/** Upstream's local `GaugeState` union — `indeterminate | complete | loading`. */
export type GaugeState = ProgressState;

/** `size` fallback in pixels. */
export const DEFAULT_GAUGE_SIZE = 120;
/** `thickness` fallback in pixels. */
export const DEFAULT_GAUGE_THICKNESS = 8;
/** `startAngle` fallback in degrees, clockwise from 12 o'clock. */
export const DEFAULT_START_ANGLE = 0;
/** `endAngle` fallback in degrees, clockwise from 12 o'clock. */
export const DEFAULT_END_ANGLE = 360;

/**
 * Upstream `getDefaultValueText`. Differs from `circular-progress`'s default: a bare rounded
 * percentage (`"45"`), no `%` suffix.
 */
export function getDefaultGaugeValueText(value: number, min: number, max: number): string {
	const percentage = max === min ? 100 : ((value - min) / (max - min)) * 100;
	return Math.round(percentage).toString();
}

type GaugeRootStateProps = {
	readonly getValue: () => number | null | undefined;
	readonly getGetValueText: () => (value: number, min: number, max: number) => string;
	readonly getMin: () => number;
	readonly getMax: () => number;
	readonly getSize: () => number;
	readonly getThickness: () => number;
	readonly getStartAngle: () => number;
	readonly getEndAngle: () => number;
	readonly getLabelId: () => string;
	readonly getValueTextId: () => string;
};

/** One instance per `<Gauge.Root>`. Published on context; every part reads it. */
export class GaugeRootState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: GaugeRootStateProps;

	readonly #bounds = $derived(resolveProgressBounds(this.#props.getMin(), this.#props.getMax()));
	readonly min: number = $derived(this.#bounds.min);
	readonly max: number = $derived(this.#bounds.max);
	readonly value: number | null = $derived(
		clampProgressValue(this.#props.getValue(), this.min, this.max),
	);
	readonly percentage: number | null = $derived(
		getProgressPercentage(this.value, this.min, this.max),
	);
	readonly state: GaugeState = $derived(getProgressState(this.value, this.max));
	readonly valueText: string | undefined = $derived(
		this.value === null ? undefined : this.#props.getGetValueText()(this.value, this.min, this.max),
	);
	readonly size: number = $derived(this.#props.getSize());
	readonly thickness: number = $derived(this.#props.getThickness());
	readonly #geometry = $derived(getRingGeometry(this.size, this.thickness));
	readonly radius: number = $derived(this.#geometry.radius);
	readonly center: number = $derived(this.#geometry.center);
	readonly startAngle: number = $derived(this.#props.getStartAngle());
	readonly endAngle: number = $derived(this.#props.getEndAngle());
	readonly arcPath: string = $derived(
		describeArc(this.center, this.center, this.radius, this.startAngle, this.endAngle),
	);
	readonly arcLength: number = $derived(getArcLength(this.radius, this.startAngle, this.endAngle));
	readonly arcCenterY: number = $derived(
		getArcCenterY(this.center, this.radius, this.startAngle, this.endAngle),
	);
	readonly strokeDasharray: number = $derived(this.arcLength);
	readonly strokeDashoffset: number = $derived(
		this.state === "indeterminate"
			? 0
			: this.percentage !== null
				? this.arcLength - this.percentage * this.arcLength
				: this.arcLength,
	);
	readonly labelId: string = $derived(this.#props.getLabelId());
	readonly valueTextId: string = $derived(this.#props.getValueTextId());

	#labelCount = $state(0);
	readonly hasLabel: boolean = $derived(this.#labelCount > 0);

	#valueTextCount = $state(0);
	readonly hasValueText: boolean = $derived(this.#valueTextCount > 0);

	constructor(props: GaugeRootStateProps) {
		this.#props = props;
	}

	registerLabel(): void {
		this.#labelCount++;
	}

	unregisterLabel(): void {
		this.#labelCount--;
	}

	registerValueText(): void {
		this.#valueTextCount++;
	}

	unregisterValueText(): void {
		this.#valueTextCount--;
	}
}

const GAUGE_CONTEXT_KEY = Symbol("gauge");

export function setGaugeContext(state: GaugeRootState): GaugeRootState {
	return setContext(GAUGE_CONTEXT_KEY, state);
}

export function hasGaugeContext(): boolean {
	return hasContext(GAUGE_CONTEXT_KEY);
}

export function getGaugeContext(consumerName?: string): GaugeRootState {
	if (!hasGaugeContext()) {
		const label = consumerName ? `\`<${consumerName}>\`` : "`<Gauge>` part";
		throw new Error(`${label} must be used within \`<Gauge>\`.`);
	}
	return getContext<GaugeRootState>(GAUGE_CONTEXT_KEY);
}
