<script lang="ts" module>
	import { Popover as PopoverPrimitive } from "bits-ui";

	export type DataGridCellEditorProps = Omit<PopoverPrimitive.ContentProps, "customAnchor"> & {
		/** Whether the editor is open. Mirrors the cell's `isEditing`. */
		open?: boolean;
		/** The cell wrapper the editor opens over. */
		anchor?: HTMLElement | null;
		/**
		 * Called when the layer dismisses itself — an outside press, or `Escape` from anywhere. The
		 * variant decides what that means: upstream flushes a pending draft on an outside press and
		 * reverts it on `Escape`, so a variant that debounces its writes must commit here.
		 */
		onDismiss?: () => void;
	};
</script>

<script lang="ts">
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		open = false,
		anchor = null,
		onDismiss,
		class: className,
		children,
		...restProps
	}: DataGridCellEditorProps = $props();

	/**
	 * Upstream anchors its popover to the cell with `sideOffset: -cellHeight`, which cancels out the
	 * `side="bottom"` placement and lands the editor flush over the cell it edits.
	 */
	const sideOffset = $derived(-(anchor?.offsetHeight ?? 0));

	/** The grid owns focus: `stopEditing()` puts it back on the cell, so the layer must not move it. */
	function preventAutoFocus(event: Event): void {
		event.preventDefault();
	}
</script>

<!--
	A real bits-ui popover layer, not a bare portal. Two things depend on it:

	- The grid scrolls with `overflow: auto`, so an editor rendered inside the cell is clipped by its
	  own grid instead of floating over the table. The layer portals it out and positions it against
	  `customAnchor`, exactly as upstream's `<PopoverAnchor>` does.
	- Dismissal. The escape layer listens on the document, so `Escape` closes the editor wherever
	  focus sits — on the cell wrapper, or inside the portalled content once the user clicks the
	  search field. The dismissable layer closes it on an outside press. Neither is reachable from a
	  handler bound to the cell wrapper once the content is portalled away from it.
-->
<PopoverPrimitive.Root
	bind:open={
		() => open,
		(next) => {
			if (!next) onDismiss?.();
		}
	}
>
	<PopoverPrimitive.Portal>
		<PopoverPrimitive.Content
			bind:ref
			data-grid-cell-editor=""
			data-slot="data-grid-cell-editor"
			customAnchor={anchor}
			align="start"
			{sideOffset}
			trapFocus={false}
			onOpenAutoFocus={preventAutoFocus}
			onCloseAutoFocus={preventAutoFocus}
			{...restProps}
			class={cn(
				"z-50 min-w-(--bits-floating-anchor-width) rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10",
				className,
			)}
		>
			{@render children?.()}
		</PopoverPrimitive.Content>
	</PopoverPrimitive.Portal>
</PopoverPrimitive.Root>
