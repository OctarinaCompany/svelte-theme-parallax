import Action from "./alert-dialog-action.svelte";
import Cancel from "./alert-dialog-cancel.svelte";
import Content from "./alert-dialog-content.svelte";
import Description from "./alert-dialog-description.svelte";
import Footer from "./alert-dialog-footer.svelte";
import Header from "./alert-dialog-header.svelte";
import Media from "./alert-dialog-media.svelte";
import Overlay from "./alert-dialog-overlay.svelte";
import Portal from "./alert-dialog-portal.svelte";
import Title from "./alert-dialog-title.svelte";
import Trigger from "./alert-dialog-trigger.svelte";
import Root from "./alert-dialog.svelte";

export { type AlertDialogRootProps } from "./alert-dialog.svelte";
export { type AlertDialogTriggerProps } from "./alert-dialog-trigger.svelte";
export { type AlertDialogPortalProps } from "./alert-dialog-portal.svelte";
export { type AlertDialogOverlayProps } from "./alert-dialog-overlay.svelte";
export {
	alertDialogContentVariants,
	type AlertDialogContentProps,
} from "./alert-dialog-content.svelte";
export { type AlertDialogHeaderProps } from "./alert-dialog-header.svelte";
export { type AlertDialogFooterProps } from "./alert-dialog-footer.svelte";
export { type AlertDialogMediaProps } from "./alert-dialog-media.svelte";
export { type AlertDialogTitleProps } from "./alert-dialog-title.svelte";
export { type AlertDialogDescriptionProps } from "./alert-dialog-description.svelte";
export { type AlertDialogActionProps } from "./alert-dialog-action.svelte";
export { type AlertDialogCancelProps } from "./alert-dialog-cancel.svelte";

export { ALERT_DIALOG_SIZES, type AlertDialogSize } from "./alert-dialog.svelte.js";

export {
	Root,
	Trigger,
	Portal,
	Overlay,
	Content,
	Header,
	Footer,
	Media,
	Title,
	Description,
	Action,
	Cancel,
	//
	Root as AlertDialog,
	Trigger as AlertDialogTrigger,
	Portal as AlertDialogPortal,
	Overlay as AlertDialogOverlay,
	Content as AlertDialogContent,
	Header as AlertDialogHeader,
	Footer as AlertDialogFooter,
	Media as AlertDialogMedia,
	Title as AlertDialogTitle,
	Description as AlertDialogDescription,
	Action as AlertDialogAction,
	Cancel as AlertDialogCancel,
};
