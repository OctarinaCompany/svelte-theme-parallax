import Root from "./tool.svelte";
import Header from "./tool-header.svelte";
import Content from "./tool-content.svelte";
import Input from "./tool-input.svelte";
import Output from "./tool-output.svelte";

export type { ToolProps, ToolRootProps } from "./tool.svelte";
export type { ToolHeaderProps } from "./tool-header.svelte";
export type { ToolContentProps } from "./tool-content.svelte";
export type { ToolInputProps } from "./tool-input.svelte";
export type { ToolOutputProps } from "./tool-output.svelte";

export {
	getToolContext,
	hasToolContext,
	setToolContext,
	ToolState,
	useTool,
	type ToolStateProps,
} from "./tool.svelte.js";

export {
	Root,
	Header,
	Content,
	Input,
	Output,
	//
	Root as Tool,
	Header as ToolHeader,
	Content as ToolContent,
	Input as ToolInput,
	Output as ToolOutput,
};
