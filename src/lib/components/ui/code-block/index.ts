import Root from "./code-block.svelte";
import Header from "./code-block-header.svelte";
import LanguageSelect from "./code-block-language-select.svelte";
import CopyButton from "./code-block-copy-button.svelte";
import DownloadButton from "./code-block-download-button.svelte";
import Content from "./code-block-content.svelte";
import Line from "./code-block-line.svelte";

export type { CodeBlockProps, CodeBlockRootProps } from "./code-block.svelte";
export type { CodeBlockHeaderProps } from "./code-block-header.svelte";
export type { CodeBlockLanguageSelectProps } from "./code-block-language-select.svelte";
export {
	CODE_BLOCK_COPY_RECEIPT_MS,
	type CodeBlockCopyButtonProps,
} from "./code-block-copy-button.svelte";
export type { CodeBlockDownloadButtonProps } from "./code-block-download-button.svelte";
export type { CodeBlockContentProps } from "./code-block-content.svelte";
export type { CodeBlockLineProps } from "./code-block-line.svelte";

export {
	classifyCodeBlockToken,
	CODE_BLOCK_COMMENT_SYNTAX,
	CODE_BLOCK_EXTENSIONS,
	CODE_BLOCK_FOREIGN_EXTENSIONS,
	CODE_BLOCK_LANGUAGE_ALIASES,
	CODE_BLOCK_LANGUAGES,
	CODE_BLOCK_MEDIA_TYPES,
	CODE_BLOCK_STRING_SYNTAX,
	CODE_BLOCK_TOKEN_KINDS,
	codeBlockExtension,
	codeBlockFilename,
	codeBlockLanguageKeywords,
	codeBlockLanguageLabel,
	codeBlockLanguageLabels,
	codeBlockMediaType,
	CodeBlockState,
	codeBlockTokenVariants,
	getCodeBlockContext,
	getCodeBlockHighlighterContext,
	hasCodeBlockContext,
	hasCodeBlockHighlighterContext,
	isCodeBlockLanguage,
	resolveCodeBlockLanguage,
	setCodeBlockContext,
	setCodeBlockHighlighterContext,
	tokenizeCodeBlockLine,
	useCodeBlock,
	useCodeBlockHighlighter,
	type CodeBlockCommentSyntax,
	type CodeBlockHighlighter,
	type CodeBlockLanguage,
	type CodeBlockLanguageId,
	type CodeBlockSnippet,
	type CodeBlockStateProps,
	type CodeBlockStringSyntax,
	type CodeBlockToken,
	type CodeBlockTokenKind,
} from "./code-block.svelte.js";

export {
	Root,
	Header,
	LanguageSelect,
	CopyButton,
	DownloadButton,
	Content,
	Line,
	//
	Root as CodeBlock,
	Header as CodeBlockHeader,
	LanguageSelect as CodeBlockLanguageSelect,
	CopyButton as CodeBlockCopyButton,
	DownloadButton as CodeBlockDownloadButton,
	Content as CodeBlockContent,
	Line as CodeBlockLine,
};
