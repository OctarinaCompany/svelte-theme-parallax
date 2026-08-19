import Content from "./carousel-content.svelte";
import Item from "./carousel-item.svelte";
import Next from "./carousel-next.svelte";
import Previous from "./carousel-previous.svelte";
import Root from "./carousel.svelte";

// Local divergence from the upstream barrel: the embla API type is re-exported so pages can
// type their `setApi` state without a deep import into context.ts.
export type { CarouselAPI } from "./context.js";

export {
	Root,
	Content,
	Item,
	Previous,
	Next,
	//
	Root as Carousel,
	Content as CarouselContent,
	Item as CarouselItem,
	Previous as CarouselPrevious,
	Next as CarouselNext,
};
