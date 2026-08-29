import Root from "./task.svelte";
import Trigger from "./task-trigger.svelte";
import Content from "./task-content.svelte";
import Item from "./task-item.svelte";
import ItemFile from "./task-item-file.svelte";

/*
 * THERE IS NO `task.svelte.ts`, AND THAT IS DELIBERATE. The only state a task has is `open`, and
 * Bits UI's Collapsible already owns it: the trigger and the content find the root through Bits
 * UI's own context, `data-state` on every part is stamped by it, and `Task.Root` merely seeds and
 * forwards the value. A state class here would be a second source of truth for one boolean, and
 * `ui/collapsible` is a verbatim shadcn-svelte port with no context accessors to re-export. So
 * this barrel carries the parts and their Props types, and nothing else.
 */

export type { TaskProps, TaskRootProps } from "./task.svelte";
export type { TaskTriggerProps } from "./task-trigger.svelte";
export type { TaskContentProps } from "./task-content.svelte";
export type { TaskItemProps } from "./task-item.svelte";
export type { TaskItemFileProps } from "./task-item-file.svelte";

export {
	Root,
	Trigger,
	Content,
	Item,
	ItemFile,
	//
	Root as Task,
	Trigger as TaskTrigger,
	Content as TaskContent,
	Item as TaskItem,
	ItemFile as TaskItemFile,
};
