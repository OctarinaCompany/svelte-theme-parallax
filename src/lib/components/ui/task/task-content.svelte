<script lang="ts" module>
	import type { Collapsible as CollapsiblePrimitive } from "bits-ui";

	export type TaskContentProps = CollapsiblePrimitive.ContentProps;
</script>

<script lang="ts">
	import * as Collapsible from "$lib/components/ui/collapsible/index.js";
	import { cn } from "$lib/utils.js";

	/**
	 * The panel under the trigger: Bits UI's Collapsible content around a rail — a 2px left border
	 * with the items stacked beside it, the visual that says "these lines belong to that title".
	 *
	 * The panel is always rendered; Bits UI stamps the `hidden` attribute on it while closed, and
	 * holds that attribute back until the `animate-out` has finished (`PresenceManager` in
	 * bits-ui), so the exit slide upstream declares actually plays here.
	 * `motion-reduce:animate-none` empties both directions for a reader who asked for less motion;
	 * with no animation to wait for, the panel simply appears and disappears. The first render of
	 * an already-open task does not animate either — Bits UI suppresses the mount animation while
	 * it measures the panel.
	 *
	 * In `child` mode the rail is NOT rendered: Bits UI hands the snippet the props and renders
	 * nothing of its own, exactly as upstream's `asChild` replaced the whole element. A caller who
	 * takes over the element takes over the rail with it.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: TaskContentProps = $props();
</script>

<Collapsible.Content
	bind:ref
	data-slot="task-content"
	class={cn(
		"outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:animate-in data-[state=open]:slide-in-from-top-2 motion-reduce:animate-none",
		className,
	)}
	{...restProps}
>
	<div class="mt-4 flex flex-col gap-2 border-l-2 border-border pl-4">
		{@render children?.()}
	</div>
</Collapsible.Content>
