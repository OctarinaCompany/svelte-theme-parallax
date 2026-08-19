import Root from "./scroll-spy.svelte";
import Link from "./scroll-spy-link.svelte";
import Nav from "./scroll-spy-nav.svelte";
import Section from "./scroll-spy-section.svelte";
import Viewport from "./scroll-spy-viewport.svelte";

export type { ScrollSpyChildProps, ScrollSpyProps, ScrollSpyRootProps } from "./scroll-spy.svelte";
export { scrollSpyVariants } from "./scroll-spy.svelte";
export type { ScrollSpyNavChildProps, ScrollSpyNavProps } from "./scroll-spy-nav.svelte";
export { scrollSpyNavVariants } from "./scroll-spy-nav.svelte";
export type { ScrollSpyLinkChildProps, ScrollSpyLinkProps } from "./scroll-spy-link.svelte";
export type {
	ScrollSpyViewportChildProps,
	ScrollSpyViewportProps,
} from "./scroll-spy-viewport.svelte";
export type {
	ScrollSpySectionChildProps,
	ScrollSpySectionProps,
} from "./scroll-spy-section.svelte";

export {
	DEFAULT_OFFSET,
	DEFAULT_ORIENTATION,
	DEFAULT_THRESHOLD,
	getDefaultScrollBehavior,
	getScrollSpyContext,
	SCROLL_SETTLE_DELAY,
	SCROLL_SPY_ORIENTATIONS,
	ScrollSpyState,
	setScrollSpyContext,
	type ScrollSpyOrientation,
	type ScrollSpyScrollBehavior,
	type ScrollSpyStateProps,
} from "./scroll-spy.svelte.js";

export {
	observeSections,
	pickTopmostEntry,
	SectionRegistry,
	type SectionObserverOptions,
	type SectionRegistrySnapshot,
} from "./section-observer.svelte.js";

export {
	Root,
	Nav,
	Link,
	Viewport,
	Section,
	//
	Root as ScrollSpy,
	Nav as ScrollSpyNav,
	Link as ScrollSpyLink,
	Viewport as ScrollSpyViewport,
	Section as ScrollSpySection,
};
