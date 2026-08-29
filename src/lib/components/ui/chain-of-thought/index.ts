import Root from "./chain-of-thought.svelte";
import Header from "./chain-of-thought-header.svelte";
import Content from "./chain-of-thought-content.svelte";
import Step from "./chain-of-thought-step.svelte";
import SearchResults from "./chain-of-thought-search-results.svelte";
import SearchResult from "./chain-of-thought-search-result.svelte";
import Image from "./chain-of-thought-image.svelte";

export type { ChainOfThoughtProps, ChainOfThoughtRootProps } from "./chain-of-thought.svelte";
export type { ChainOfThoughtHeaderProps } from "./chain-of-thought-header.svelte";
export type { ChainOfThoughtContentProps } from "./chain-of-thought-content.svelte";
export type { ChainOfThoughtStepProps } from "./chain-of-thought-step.svelte";
export type { ChainOfThoughtSearchResultsProps } from "./chain-of-thought-search-results.svelte";
export type { ChainOfThoughtSearchResultProps } from "./chain-of-thought-search-result.svelte";
export type { ChainOfThoughtImageProps } from "./chain-of-thought-image.svelte";

export {
	CHAIN_OF_THOUGHT_STEP_STATUSES,
	ChainOfThoughtState,
	chainOfThoughtStepVariants,
	getChainOfThoughtContext,
	hasChainOfThoughtContext,
	resolveChainOfThoughtStepStatus,
	setChainOfThoughtContext,
	useChainOfThought,
	type ChainOfThoughtStateProps,
	type ChainOfThoughtStepStatus,
} from "./chain-of-thought.svelte.js";

export {
	Root,
	Header,
	Content,
	Step,
	SearchResults,
	SearchResult,
	Image,
	//
	Root as ChainOfThought,
	Header as ChainOfThoughtHeader,
	Content as ChainOfThoughtContent,
	Step as ChainOfThoughtStep,
	SearchResults as ChainOfThoughtSearchResults,
	SearchResult as ChainOfThoughtSearchResult,
	Image as ChainOfThoughtImage,
};
