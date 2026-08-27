<script lang="ts">
	import { Command as CommandPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: CommandPrimitive.ListProps = $props();
</script>

<!--
	The `Viewport` is bits-ui's own part, added to upstream's port. The primitive hands the input its
	`aria-controls` and `aria-activedescendant` from this element — the id of the viewport, and the id
	of the highlighted option found inside it — so without one a `role="combobox"` input announces
	neither the popup it opens nor the option the arrow keys are on (WCAG 4.1.2). It also gives the
	primitive the subtree it reorders results in. It is a plain wrapper `<div>` inside the scroll
	container, and nothing in this repository selects a direct child of `[data-slot=command-list]`.
-->
<CommandPrimitive.List
	bind:ref
	data-slot="command-list"
	class={cn(
		"no-scrollbar max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none",
		className,
	)}
	{...restProps}
>
	<CommandPrimitive.Viewport data-slot="command-viewport">
		{@render children?.()}
	</CommandPrimitive.Viewport>
</CommandPrimitive.List>
