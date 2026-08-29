import Root from "./model-selector.svelte";
import Trigger from "./model-selector-trigger.svelte";
import Content from "./model-selector-content.svelte";
import Dialog from "./model-selector-dialog.svelte";
import Input from "./model-selector-input.svelte";
import Item from "./model-selector-item.svelte";
import Logo from "./model-selector-logo.svelte";
import LogoGroup from "./model-selector-logo-group.svelte";
import Name from "./model-selector-name.svelte";
// PURE PASS-THROUGHS GET NO FILE. Upstream wraps each of these in a component that renders the
// command part unchanged; a file that only forwards props is a file that only drifts, so the
// command parts are re-exported as they are. Their `data-slot` therefore stays the command's
// (`command-list`, `command-group`, …) — see the page's data-attributes table.
import { Empty, Group, List, Separator, Shortcut } from "$lib/components/ui/command/index.js";

export type { ModelSelectorProps, ModelSelectorRootProps } from "./model-selector.svelte";
export type { ModelSelectorTriggerProps } from "./model-selector-trigger.svelte";
export type { ModelSelectorContentProps } from "./model-selector-content.svelte";
export type { ModelSelectorDialogProps } from "./model-selector-dialog.svelte";
export type { ModelSelectorInputProps } from "./model-selector-input.svelte";
export type { ModelSelectorItemProps } from "./model-selector-item.svelte";
export type { ModelSelectorLogoProps } from "./model-selector-logo.svelte";
export type { ModelSelectorLogoGroupProps } from "./model-selector-logo-group.svelte";
export type { ModelSelectorNameProps } from "./model-selector-name.svelte";

export {
	getModelSelectorContext,
	hasModelSelectorContext,
	isKnownModelProvider,
	MODEL_PROVIDER_LOGO_BASE,
	MODEL_PROVIDERS,
	modelProviderLogoUrl,
	ModelSelectorState,
	setModelSelectorContext,
	useModelSelector,
	type KnownModelProvider,
	type ModelProvider,
	type ModelSelectorEmptyProps,
	type ModelSelectorGroupProps,
	type ModelSelectorListProps,
	type ModelSelectorSeparatorProps,
	type ModelSelectorShortcutProps,
	type ModelSelectorStateProps,
} from "./model-selector.svelte.js";

export {
	Root,
	Trigger,
	Content,
	Dialog,
	Input,
	Item,
	Logo,
	LogoGroup,
	Name,
	List,
	Empty,
	Group,
	Separator,
	Shortcut,
	//
	Root as ModelSelector,
	Trigger as ModelSelectorTrigger,
	Content as ModelSelectorContent,
	Dialog as ModelSelectorDialog,
	Input as ModelSelectorInput,
	Item as ModelSelectorItem,
	Logo as ModelSelectorLogo,
	LogoGroup as ModelSelectorLogoGroup,
	Name as ModelSelectorName,
	List as ModelSelectorList,
	Empty as ModelSelectorEmpty,
	Group as ModelSelectorGroup,
	Separator as ModelSelectorSeparator,
	Shortcut as ModelSelectorShortcut,
};
