import Combined from "./gauge-combined.svelte";
import Indicator from "./gauge-indicator.svelte";
import Label from "./gauge-label.svelte";
import Range from "./gauge-range.svelte";
import Root from "./gauge.svelte";
import Track from "./gauge-track.svelte";
import ValueText from "./gauge-value-text.svelte";

export { type GaugeChildProps, type GaugeRootProps } from "./gauge.svelte";
export { type GaugeCombinedProps } from "./gauge-combined.svelte";
export { type GaugeIndicatorProps } from "./gauge-indicator.svelte";
export { type GaugeLabelChildProps, type GaugeLabelProps } from "./gauge-label.svelte";
export { type GaugeRangeProps } from "./gauge-range.svelte";
export { type GaugeTrackProps } from "./gauge-track.svelte";
export { type GaugeValueTextChildProps, type GaugeValueTextProps } from "./gauge-value-text.svelte";

export {
	type Point,
	describeArc,
	getArcCenterY,
	getArcLength,
	getNormalizedAngle,
	getProgressPercentage,
	getProgressState,
	getRingGeometry,
	polarToCartesian,
	resolveProgressBounds,
	clampProgressValue,
	DEFAULT_MAX,
	DEFAULT_MIN,
} from "$lib/components/ui/circular-progress/index.js";

export {
	DEFAULT_END_ANGLE,
	DEFAULT_GAUGE_SIZE,
	DEFAULT_GAUGE_THICKNESS,
	DEFAULT_START_ANGLE,
	getDefaultGaugeValueText,
	getGaugeContext,
	GaugeRootState,
	type GaugeState,
	hasGaugeContext,
	setGaugeContext,
} from "./gauge.svelte.js";

export {
	Root,
	Indicator,
	Track,
	Range,
	ValueText,
	Label,
	Combined,
	//
	Root as Gauge,
	Indicator as GaugeIndicator,
	Track as GaugeTrack,
	Range as GaugeRange,
	ValueText as GaugeValueText,
	Label as GaugeLabel,
	Combined as GaugeCombined,
};
