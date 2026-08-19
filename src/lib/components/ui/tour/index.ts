import Root from "./tour.svelte";
import Arrow from "./tour-arrow.svelte";
import Close from "./tour-close.svelte";
import Description from "./tour-description.svelte";
import Footer from "./tour-footer.svelte";
import Header from "./tour-header.svelte";
import Next from "./tour-next.svelte";
import Portal from "./tour-portal.svelte";
import Prev from "./tour-prev.svelte";
import Skip from "./tour-skip.svelte";
import Spotlight from "./tour-spotlight.svelte";
import SpotlightRing from "./tour-spotlight-ring.svelte";
import Step from "./tour-step.svelte";
import StepCounter from "./tour-step-counter.svelte";
import Title from "./tour-title.svelte";

export type { TourProps, TourRootChildProps, TourRootProps } from "./tour.svelte";
export type { TourPortalProps } from "./tour-portal.svelte";
export type { TourSpotlightChildProps, TourSpotlightProps } from "./tour-spotlight.svelte";
export type {
	TourSpotlightRingChildProps,
	TourSpotlightRingProps,
} from "./tour-spotlight-ring.svelte";
export type { TourStepChildProps, TourStepProps } from "./tour-step.svelte";
export type { TourArrowChildProps, TourArrowProps } from "./tour-arrow.svelte";
export type { TourHeaderChildProps, TourHeaderProps } from "./tour-header.svelte";
export type { TourTitleChildProps, TourTitleProps } from "./tour-title.svelte";
export type { TourDescriptionChildProps, TourDescriptionProps } from "./tour-description.svelte";
export type { TourCloseChildProps, TourCloseProps } from "./tour-close.svelte";
export type { TourFooterChildProps, TourFooterProps } from "./tour-footer.svelte";
export type { TourStepCounterChildProps, TourStepCounterProps } from "./tour-step-counter.svelte";
export type { TourPrevChildProps, TourPrevProps } from "./tour-prev.svelte";
export type { TourNextChildProps, TourNextProps } from "./tour-next.svelte";
export type { TourSkipChildProps, TourSkipProps } from "./tour-skip.svelte";

export {
	computeSpotlight,
	DEFAULT_ALIGN_OFFSET,
	DEFAULT_SCROLL_OFFSET,
	DEFAULT_SIDE_OFFSET,
	DEFAULT_SPOTLIGHT_PADDING,
	getDefaultScrollBehavior,
	getTourContext,
	getTourStepContext,
	isInTourDefaultFooter,
	isTargetInViewport,
	resolveTarget,
	scrollTargetIntoView,
	setTourContext,
	setTourDefaultFooterContext,
	setTourStepContext,
	TOUR_ALIGNS,
	TOUR_CLOSE_AUTO_FOCUS,
	TOUR_EVENT_OPTIONS,
	TOUR_INTERACT_OUTSIDE,
	TOUR_OPEN_AUTO_FOCUS,
	TOUR_POINTER_DOWN_OUTSIDE,
	TOUR_SIDES,
	TourRootState,
	TourStepRegistry,
	TourStepState,
	type TourAlign,
	type TourBoundary,
	type TourCloseAutoFocusEvent,
	type TourEdgeRect,
	type TourInteractOutsideEvent,
	type TourMeasuredRect,
	type TourOpenAutoFocusEvent,
	type TourPointerDownOutsideEvent,
	type TourRootStateProps,
	type TourScrollBehavior,
	type TourScrollOffset,
	type TourSide,
	type TourSpotlightGeometry,
	type TourSpotlightRect,
	type TourStepData,
	type TourTarget,
	type TourViewport,
} from "./tour.svelte.js";

export {
	Root,
	Portal,
	Spotlight,
	SpotlightRing,
	Step,
	Arrow,
	Header,
	Title,
	Description,
	Close,
	Footer,
	StepCounter,
	Prev,
	Next,
	Skip,
	//
	Root as Tour,
	Portal as TourPortal,
	Spotlight as TourSpotlight,
	SpotlightRing as TourSpotlightRing,
	Step as TourStep,
	Arrow as TourArrow,
	Header as TourHeader,
	Title as TourTitle,
	Description as TourDescription,
	Close as TourClose,
	Footer as TourFooter,
	StepCounter as TourStepCounter,
	Prev as TourPrev,
	Next as TourNext,
	Skip as TourSkip,
};
