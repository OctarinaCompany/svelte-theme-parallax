<script lang="ts" module>
	import type { Collapsible as CollapsiblePrimitive } from "bits-ui";

	export type TaskTriggerProps = CollapsiblePrimitive.TriggerProps & {
		/**
		 * What the task is doing, as the default rendering's label — "Searching the codebase".
		 * Consumed here, never forwarded: it is not the native `title` tooltip attribute, and the
		 * button gets no tooltip from it. Ignored when `children` or `child` replace the default
		 * rendering, but still required, so a custom trigger cannot be shipped without a name for
		 * what it stands for.
		 */
		title: string;
	};
</script>

<script lang="ts">
	import * as Collapsible from "$lib/components/ui/collapsible/index.js";
	import { cn } from "$lib/utils.js";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import SearchIcon from "@lucide/svelte/icons/search";

	/**
	 * The row that opens and closes a task: a search glyph, the title, and a chevron that turns
	 * over when the task is open.
	 *
	 * This IS the `<button>` Bits UI renders, so it toggles on Enter and Space, carries
	 * `aria-expanded` and `aria-controls`, and is reached by Tab with no code here (see the root's
	 * divergence 1). The default content sits inside it; `children` replaces that content while
	 * keeping the button, and Bits UI's `child` snippet — forwarded through the rest props —
	 * replaces the button itself, which is what upstream's `asChild` did.
	 *
	 * The chevron reads the ROOT's `data-state` through `group/task` rather than the button's own,
	 * so a `child` rendering that spreads the trigger props onto a different element still turns
	 * the chevron if it keeps the default markup around. `[&_svg:not([class*='size-'])]:size-4` is
	 * `ui/button`'s icon rule, so an icon a caller passes in `children` is sized the same way the
	 * default ones are and an explicit `size-*` still wins.
	 */
	let {
		ref = $bindable(null),
		title,
		class: className,
		children,
		...restProps
	}: TaskTriggerProps = $props();
</script>

<Collapsible.Trigger
	bind:ref
	data-slot="task-trigger"
	class={cn(
		"flex w-full items-center gap-2 rounded-md text-left text-sm text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
		className,
	)}
	{...restProps}
>
	{#if children}
		{@render children()}
	{:else}
		<SearchIcon />
		<span>{title}</span>
		<ChevronDownIcon
			class="transition-transform group-data-[state=open]/task:rotate-180 motion-reduce:transition-none"
		/>
	{/if}
</Collapsible.Trigger>
