import Root from "./code-highlighter.svelte";

export type { CodeHighlighterProps, CodeHighlighterRootProps } from "./code-highlighter.svelte";

export {
	CODE_HIGHLIGHTER_CONTAINER_SCOPES,
	CODE_HIGHLIGHTER_GRAMMARS,
	CODE_HIGHLIGHTER_LINE_TIME_LIMIT_MS,
	CODE_HIGHLIGHTER_MAX_LINE_LENGTH,
	CODE_HIGHLIGHTER_SCOPES,
	CODE_HIGHLIGHTER_TYPE_CASED_LANGUAGES,
	CodeHighlighterState,
	codeHighlighterKindOf,
	getCodeHighlighterContext,
	hasCodeHighlighterContext,
	setCodeHighlighterContext,
	useCodeHighlighter,
	type CodeHighlighterContainerRule,
	type CodeHighlighterGrammar,
	type CodeHighlighterScopeRule,
	type CodeHighlighterStateProps,
} from "./code-highlighter.svelte.js";

export {
	Root,
	//
	Root as CodeHighlighter,
};
