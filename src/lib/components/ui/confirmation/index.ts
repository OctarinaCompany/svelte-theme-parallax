import Root from "./confirmation.svelte";
import Title from "./confirmation-title.svelte";
import Request from "./confirmation-request.svelte";
import Accepted from "./confirmation-accepted.svelte";
import Rejected from "./confirmation-rejected.svelte";
import Actions from "./confirmation-actions.svelte";
import Action from "./confirmation-action.svelte";

export type { ConfirmationProps, ConfirmationRootProps } from "./confirmation.svelte";
export type { ConfirmationTitleProps } from "./confirmation-title.svelte";
export type { ConfirmationRequestProps } from "./confirmation-request.svelte";
export type { ConfirmationAcceptedProps } from "./confirmation-accepted.svelte";
export type { ConfirmationRejectedProps } from "./confirmation-rejected.svelte";
export type { ConfirmationActionsProps } from "./confirmation-actions.svelte";
export type { ConfirmationActionProps } from "./confirmation-action.svelte";

export {
	CONFIRMATION_PHASE_VARIANTS,
	CONFIRMATION_PHASES,
	ConfirmationState,
	confirmationPhaseVariant,
	getConfirmationContext,
	hasConfirmationContext,
	isConfirmationVisible,
	resolveConfirmationPhase,
	resolveConfirmationPhaseValue,
	setConfirmationContext,
	useConfirmation,
	type ConfirmationPhase,
	type ConfirmationStateProps,
} from "./confirmation.svelte.js";

export {
	Root,
	Title,
	Request,
	Accepted,
	Rejected,
	Actions,
	Action,
	//
	Root as Confirmation,
	Title as ConfirmationTitle,
	Request as ConfirmationRequest,
	Accepted as ConfirmationAccepted,
	Rejected as ConfirmationRejected,
	Actions as ConfirmationActions,
	Action as ConfirmationAction,
};
