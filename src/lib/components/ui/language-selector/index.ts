import Content from "./language-selector-content.svelte";
import Option from "./language-selector-option.svelte";
import Trigger from "./language-selector-trigger.svelte";
import Root from "./language-selector.svelte";

export type { LanguageSelectorRootProps } from "./language-selector.svelte";
export type { LanguageSelectorTriggerProps } from "./language-selector-trigger.svelte";
export {
	LANGUAGE_SELECTOR_COLUMNS,
	type LanguageSelectorColumns,
	type LanguageSelectorContentProps,
} from "./language-selector-content.svelte";
export type { LanguageSelectorOptionProps } from "./language-selector-option.svelte";

export {
	LOCALES,
	LanguageSelectorState,
	getLanguageSelectorContext,
	hasLanguageSelectorContext,
	localeByCode,
	setLanguageSelectorContext,
	type LanguageSelectorStateProps,
	type Locale,
} from "./language-selector.svelte.js";

export {
	Root,
	Trigger,
	Content,
	Option,
	//
	Root as LanguageSelector,
	Trigger as LanguageSelectorTrigger,
	Content as LanguageSelectorContent,
	Option as LanguageSelectorOption,
};
