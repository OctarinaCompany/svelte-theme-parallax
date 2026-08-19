import Root from "./responsive-dialog.svelte";
import Trigger from "./responsive-dialog-trigger.svelte";
import Close from "./responsive-dialog-close.svelte";
import Portal from "./responsive-dialog-portal.svelte";
import Overlay from "./responsive-dialog-overlay.svelte";
import Content from "./responsive-dialog-content.svelte";
import Header from "./responsive-dialog-header.svelte";
import Footer from "./responsive-dialog-footer.svelte";
import Title from "./responsive-dialog-title.svelte";
import Description from "./responsive-dialog-description.svelte";

export type { ResponsiveDialogRootProps } from "./responsive-dialog.svelte";
export type { ResponsiveDialogTriggerProps } from "./responsive-dialog-trigger.svelte";
export type { ResponsiveDialogCloseProps } from "./responsive-dialog-close.svelte";
export type { ResponsiveDialogPortalProps } from "./responsive-dialog-portal.svelte";
export type { ResponsiveDialogOverlayProps } from "./responsive-dialog-overlay.svelte";
export type { ResponsiveDialogContentProps } from "./responsive-dialog-content.svelte";
export type { ResponsiveDialogHeaderProps } from "./responsive-dialog-header.svelte";
export type { ResponsiveDialogFooterProps } from "./responsive-dialog-footer.svelte";
export type { ResponsiveDialogTitleProps } from "./responsive-dialog-title.svelte";
export type { ResponsiveDialogDescriptionProps } from "./responsive-dialog-description.svelte";

export {
	ResponsiveDialogState,
	getResponsiveDialogContext,
	hasResponsiveDialogContext,
	setResponsiveDialogContext,
	type ResponsiveDialogStateProps,
	type ResponsiveDialogVariant,
} from "./responsive-dialog.svelte.js";

export {
	Root,
	Trigger,
	Close,
	Portal,
	Overlay,
	Content,
	Header,
	Footer,
	Title,
	Description,
	//
	Root as ResponsiveDialog,
	Trigger as ResponsiveDialogTrigger,
	Close as ResponsiveDialogClose,
	Portal as ResponsiveDialogPortal,
	Overlay as ResponsiveDialogOverlay,
	Content as ResponsiveDialogContent,
	Header as ResponsiveDialogHeader,
	Footer as ResponsiveDialogFooter,
	Title as ResponsiveDialogTitle,
	Description as ResponsiveDialogDescription,
};
