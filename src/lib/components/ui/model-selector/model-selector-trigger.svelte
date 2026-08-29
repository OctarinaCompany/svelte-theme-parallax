<script lang="ts" module>
	import type { Dialog as DialogPrimitive } from "bits-ui";

	/** The dialog trigger's props: a `<button>`, or a `child` snippet to render onto your own. */
	export type ModelSelectorTriggerProps = DialogPrimitive.TriggerProps;
</script>

<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index.js";

	/**
	 * Opens the picker. A plain `<button type="button">` by default; pass a `child` snippet and
	 * spread its `props` onto a `Button` to get the toolbar chip every demo wants — the
	 * primitive merges `aria-haspopup`, `aria-expanded`, `data-state` and the click handler into
	 * whatever element the snippet renders.
	 */
	let { ref = $bindable(null), ...restProps }: ModelSelectorTriggerProps = $props();
</script>

<Dialog.Trigger bind:ref data-slot="model-selector-trigger" {...restProps} />
