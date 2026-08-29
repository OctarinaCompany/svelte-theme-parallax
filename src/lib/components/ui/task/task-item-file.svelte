<script lang="ts" module>
	import type { ComponentProps } from "svelte";
	import { Badge } from "$lib/components/ui/badge/index.js";

	/**
	 * The house Badge's props, `variant` included — a chip for a file the agent CHANGED can be told
	 * apart from one it merely read (`warning-subtle` beside `secondary`) without leaving the part.
	 * `href` is Badge's too: given one, the chip renders as an `<a>` and the file becomes a link.
	 */
	export type TaskItemFileProps = ComponentProps<typeof Badge>;
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	/**
	 * A file the task touched, as an icon and a filename in a small chip. Upstream hand-rolls the
	 * chip; this is `Badge variant="secondary"` for the reason the root's divergence 3 gives, with
	 * `font-normal` because a filename is data, not a label, and `gap-1` between glyph and name.
	 *
	 * The icon needs no sizing class: Badge's own `[&>svg]:size-3!` sizes any direct-child svg.
	 * Badge stamps `data-slot="badge"` first and spreads its rest props last, so the
	 * `data-slot="task-item-file"` passed here is the one that lands — nothing in `src/app.css`
	 * keys on the badge slot, so nothing is lost by taking it over.
	 */
	let {
		ref = $bindable(null),
		variant = "secondary",
		class: className,
		children,
		...restProps
	}: TaskItemFileProps = $props();
</script>

<Badge
	bind:ref
	{variant}
	data-slot="task-item-file"
	class={cn("gap-1 font-normal", className)}
	{...restProps}
>
	{@render children?.()}
</Badge>
