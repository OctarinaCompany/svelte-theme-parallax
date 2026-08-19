<script lang="ts" module>
	import type { ComponentProps } from "svelte";

	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Drawer from "$lib/components/ui/drawer/index.js";

	export type ResponsiveDialogRootProps = ComponentProps<typeof Dialog.Root> &
		ComponentProps<typeof Drawer.Root> & {
			/**
			 * Viewport width in px at or above which a dialog is rendered instead of a drawer.
			 * @default 768
			 */
			breakpoint?: number;
			/**
			 * Initial open state when uncontrolled. Ignored once `open` is bound.
			 * @default false
			 */
			defaultOpen?: boolean;
		};
</script>

<script lang="ts">
	import { untrack } from "svelte";

	import { DEFAULT_MOBILE_BREAKPOINT } from "$lib/hooks/is-mobile.svelte.js";

	import { ResponsiveDialogState, setResponsiveDialogContext } from "./responsive-dialog.svelte.js";

	let {
		breakpoint = DEFAULT_MOBILE_BREAKPOINT,
		open = $bindable(),
		defaultOpen = false,
		onOpenChange,
		onOpenChangeComplete,
		children,
		...restProps
	}: ResponsiveDialogRootProps = $props();

	// Uncontrolled: seed once from `defaultOpen`. Controlled: the caller's binding stays
	// authoritative — the guard keeps `??=` from round-tripping an already-set value back through a
	// function binding's setter, which would look like a write the caller never asked for.
	if (open === undefined) open = untrack(() => defaultOpen);

	const state = setResponsiveDialogContext(
		new ResponsiveDialogState({
			getOpen: () => open ?? false,
			setOpen: (next) => {
				open = next;
				onOpenChange?.(next);
			},
			getBreakpoint: () => breakpoint,
		}),
	);
</script>

{#if state.variant === "drawer"}
	<Drawer.Root bind:open={() => state.open, (next) => state.setOpen(next, "drawer")} {...restProps}>
		{@render children?.()}
	</Drawer.Root>
{:else}
	<Dialog.Root
		bind:open={() => state.open, (next) => state.setOpen(next, "dialog")}
		{onOpenChangeComplete}
		{...restProps}
	>
		{@render children?.()}
	</Dialog.Root>
{/if}
