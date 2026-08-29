import Root from "./question.svelte";
import Prompt from "./question-prompt.svelte";
import Description from "./question-description.svelte";
import Options from "./question-options.svelte";
import Option from "./question-option.svelte";
import Input from "./question-input.svelte";
import Actions from "./question-actions.svelte";
import Submit from "./question-submit.svelte";

export type { QuestionProps, QuestionRootProps } from "./question.svelte";
export type { QuestionPromptProps } from "./question-prompt.svelte";
export type { QuestionDescriptionProps } from "./question-description.svelte";
export type { QuestionOptionsProps } from "./question-options.svelte";
export type { QuestionOptionProps } from "./question-option.svelte";
export type { QuestionInputProps } from "./question-input.svelte";
export type { QuestionActionsProps } from "./question-actions.svelte";
export type { QuestionSubmitProps } from "./question-submit.svelte";

export {
	EMPTY_QUESTION_VALUE,
	getQuestionContext,
	hasQuestionContext,
	hasQuestionResponse,
	nextQuestionValue,
	nextSelectedValues,
	QUESTION_ENTRY_FOCUS,
	QUESTION_SELECTION_MODES,
	QuestionState,
	resolveQuestionSelectionMode,
	setQuestionContext,
	toQuestionResponse,
	useQuestion,
	type QuestionResponse,
	type QuestionSelectionMode,
	type QuestionStateProps,
	type QuestionValue,
} from "./question.svelte.js";

export {
	Root,
	Prompt,
	Description,
	Options,
	Option,
	Input,
	Actions,
	Submit,
	//
	Root as Question,
	Prompt as QuestionPrompt,
	Description as QuestionDescription,
	Options as QuestionOptions,
	Option as QuestionOption,
	Input as QuestionInput,
	Actions as QuestionActions,
	Submit as QuestionSubmit,
};
