<script lang="ts" module>
	import type { Dialog as DialogPrimitive } from "bits-ui";

	/**
	 * The dialog primitive's own root props — `open`, `onOpenChange`, `onOpenChangeComplete`,
	 * `children` — exactly as upstream's `ComponentProps<typeof Dialog>`.
	 */
	export type ModelSelectorRootProps = DialogPrimitive.RootProps;

	/** Alias of {@link ModelSelectorRootProps}, present for parity with the upstream type name. */
	export type ModelSelectorProps = ModelSelectorRootProps;
</script>

<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import { ModelSelectorState, setModelSelectorContext } from "./model-selector.svelte.js";

	/**
	 * A model picker: a dialog holding a filterable command list of models, opened from a
	 * trigger that shows the current choice. Port of `model-selector.tsx` from Vercel's AI
	 * Elements.
	 *
	 * The root renders NO ELEMENT — it is the dialog primitive's root, which is a context
	 * provider — so there is no `data-slot="model-selector"` in the DOM. The first element a
	 * caller can select is `[data-slot=model-selector-content]`.
	 *
	 * FOUR THINGS DIVERGE FROM UPSTREAM:
	 *
	 * 1. THE ROOT OWNS THE OPEN STATE. Upstream's parts are stateless wrappers and every demo
	 *    closes the dialog by hand inside each item's `onSelect`. Here `open` is a bindable prop
	 *    on the root, a {@link ModelSelectorState} publishes it on context, and
	 *    `ModelSelector.Item` closes the picker after a pick unless told not to
	 *    (`closeOnSelect={false}`). The binding is intercepted rather than forwarded, so
	 *    `onOpenChange` fires once per real transition whether the dialog primitive, an item, or
	 *    the caller made it.
	 *
	 * 2. THE INPUT KEEPS THE HOUSE HEIGHT. Upstream adds `h-auto py-3.5` to a bare, borderless
	 *    shadcn input, growing the search row to ~52px. The house `Command.Input` is an
	 *    `InputGroup` pinned to 32px with a search addon, and a 48px field inside a 32px group
	 *    overflows into the first result; the picker therefore looks like the house command
	 *    palette rather than like upstream's. `ModelSelector.Input` still exists so the part
	 *    tree matches.
	 *
	 * 3. THE CLOSE BUTTON IS OFF BY DEFAULT. Upstream inherits shadcn's dialog `X`; in a
	 *    `p-0` content it overlaps the right end of the input row. The house `Command.Dialog`
	 *    makes the same call. `showCloseButton` puts it back.
	 *
	 * 4. THE LOGO CAN BE FED. Upstream hard-codes `https://models.dev/logos/<slug>.svg` and
	 *    shows a broken image when it fails. Here `src` overrides the URL and a `fallback`
	 *    snippet renders on error — the gallery uses the first so it never leaves the origin.
	 */
	let {
		open = $bindable(false),
		onOpenChange,
		children,
		...restProps
	}: ModelSelectorRootProps = $props();

	const state = new ModelSelectorState({
		getOpen: () => open,
		setOpen: (next) => {
			open = next;
			onOpenChange?.(next);
		},
	});

	setModelSelectorContext(state);
</script>

<!--
	Function binding rather than `bind:open` + `{onOpenChange}` forwarding: the primitive writes
	through `state.setOpen`, which is the one place `onOpenChange` fires, so a close that comes
	from an item and the primitive's own Escape handling cannot each report it.
-->
<Dialog.Root bind:open={() => state.open, (next) => state.setOpen(next)} {...restProps}>
	{@render children?.()}
</Dialog.Root>
