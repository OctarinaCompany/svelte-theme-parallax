import Root from "./compare-slider.svelte";
import Before from "./compare-slider-before.svelte";
import After from "./compare-slider-after.svelte";
import Handle from "./compare-slider-handle.svelte";
import Label from "./compare-slider-label.svelte";

export { type CompareSliderRootProps, type CompareSliderChildProps } from "./compare-slider.svelte";
export { type CompareSliderBeforeProps } from "./compare-slider-before.svelte";
export { type CompareSliderAfterProps } from "./compare-slider-after.svelte";
export { type CompareSliderHandleProps } from "./compare-slider-handle.svelte";
export { type CompareSliderLabelProps } from "./compare-slider-label.svelte";
export {
	COMPARE_SLIDER_INTERACTIONS,
	COMPARE_SLIDER_ORIENTATIONS,
	COMPARE_SLIDER_SKIP_MULTIPLIER,
	CompareSliderState,
	DEFAULT_COMPARE_SLIDER_STEP,
	DEFAULT_COMPARE_SLIDER_VALUE,
	clampComparePercentage,
	compareSliderClipPath,
	getCompareSliderContext,
	hasCompareSliderContext,
	setCompareSliderContext,
	type CompareSliderInteraction,
	type CompareSliderOrientation,
	type CompareSliderSide,
} from "./compare-slider.svelte.js";

export {
	Root,
	Before,
	After,
	Handle,
	Label,
	//
	Root as CompareSlider,
	Before as CompareSliderBefore,
	After as CompareSliderAfter,
	Handle as CompareSliderHandle,
	Label as CompareSliderLabel,
};
