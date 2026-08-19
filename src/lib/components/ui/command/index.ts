import Dialog from "./command-dialog.svelte";
import Empty from "./command-empty.svelte";
import Group from "./command-group.svelte";
import Input from "./command-input.svelte";
import Item from "./command-item.svelte";
// Local addition to the upstream barrel: LinkItem renders an item as a real anchor so
// command-palette results can middle-click and open in new tabs.
import LinkItem from "./command-link-item.svelte";
import List from "./command-list.svelte";
import Loading from "./command-loading.svelte";
import Separator from "./command-separator.svelte";
import Shortcut from "./command-shortcut.svelte";
import Root from "./command.svelte";

export {
	Root,
	Dialog,
	Empty,
	Group,
	Item,
	LinkItem,
	Input,
	List,
	Separator,
	Shortcut,
	Loading,
	//
	Root as Command,
	Dialog as CommandDialog,
	Empty as CommandEmpty,
	Group as CommandGroup,
	Item as CommandItem,
	LinkItem as CommandLinkItem,
	Input as CommandInput,
	List as CommandList,
	Separator as CommandSeparator,
	Shortcut as CommandShortcut,
	Loading as CommandLoading,
};
