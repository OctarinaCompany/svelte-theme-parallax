import Description from "./frame-description.svelte";
import Footer from "./frame-footer.svelte";
import Header from "./frame-header.svelte";
import Panel from "./frame-panel.svelte";
import Title from "./frame-title.svelte";
import Root from "./frame.svelte";

export {
	frameVariants,
	type FrameChildProps,
	type FrameProps,
	type FrameRootProps,
} from "./frame.svelte";
export { type FramePanelChildProps, type FramePanelProps } from "./frame-panel.svelte";
export { type FrameHeaderChildProps, type FrameHeaderProps } from "./frame-header.svelte";
export { type FrameTitleChildProps, type FrameTitleProps } from "./frame-title.svelte";
export {
	type FrameDescriptionChildProps,
	type FrameDescriptionProps,
} from "./frame-description.svelte";
export { type FrameFooterChildProps, type FrameFooterProps } from "./frame-footer.svelte";

export {
	FRAME_SPACINGS,
	FRAME_VARIANTS,
	type FrameSpacing,
	type FrameVariant,
} from "./frame.svelte.js";

export {
	Root,
	Panel,
	Header,
	Title,
	Description,
	Footer,
	//
	Root as Frame,
	Panel as FramePanel,
	Header as FrameHeader,
	Title as FrameTitle,
	Description as FrameDescription,
	Footer as FrameFooter,
};
