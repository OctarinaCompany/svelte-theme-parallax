import Root from "./json-viewer.svelte";
import Toolbar from "./json-viewer-toolbar.svelte";
import LineNumbers from "./json-viewer-line-numbers.svelte";
import Node from "./json-viewer-node.svelte";
import Branch from "./json-viewer-branch.svelte";
import Key from "./json-viewer-key.svelte";
import Value from "./json-viewer-value.svelte";

export type { JsonViewerProps, JsonViewerRootProps } from "./json-viewer.svelte";
export {
	JSON_VIEWER_COPY_RECEIPT_MS,
	type JsonViewerToolbarProps,
} from "./json-viewer-toolbar.svelte";
export type { JsonViewerLineNumbersProps } from "./json-viewer-line-numbers.svelte";
export type { JsonViewerNodeProps } from "./json-viewer-node.svelte";
export type { JsonViewerBranchProps } from "./json-viewer-branch.svelte";
export type { JsonViewerKeyProps } from "./json-viewer-key.svelte";
export type { JsonViewerValueProps } from "./json-viewer-value.svelte";

export {
	collectExpandablePaths,
	countRenderedLines,
	DEFAULT_JSON_VIEWER_ITEMS_PER_ARRAY,
	detectJsonDate,
	formatJsonRelativeTime,
	getJsonDataType,
	getJsonViewerContext,
	hasJsonViewerContext,
	isJsonBranch,
	isJsonColorLiteral,
	isJsonHttpUrl,
	JSON_VIEWER_CLAMP_CHARS,
	JSON_VIEWER_COLLAPSE_MODES,
	JSON_VIEWER_DATA_TYPES,
	JSON_VIEWER_INDENT_TONES,
	JSON_VIEWER_ROOT_PATH,
	JSON_VIEWER_WRAP_CHARS,
	jsonChildPath,
	jsonIndexPath,
	JsonViewerState,
	jsonViewerIndentTone,
	jsonViewerIndentVariants,
	jsonViewerValueVariants,
	resolveJsonViewerCollapseMode,
	setJsonViewerContext,
	useJsonViewer,
	type JsonViewerCollapseMode,
	type JsonViewerDataType,
	type JsonViewerIndentTone,
	type JsonViewerLineCountOptions,
	type JsonViewerStateProps,
	type JsonViewerTruncation,
} from "./json-viewer.svelte.js";

export {
	Root,
	Toolbar,
	LineNumbers,
	Node,
	Branch,
	Key,
	Value,
	//
	Root as JsonViewer,
	Toolbar as JsonViewerToolbar,
	LineNumbers as JsonViewerLineNumbers,
	Node as JsonViewerNode,
	Branch as JsonViewerBranch,
	Key as JsonViewerKey,
	Value as JsonViewerValue,
};
