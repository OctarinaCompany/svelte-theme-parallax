<script lang="ts" module>
	import type { Dialog as DialogPrimitive } from "bits-ui";

	/** `vaul-svelte` re-exports `bits-ui`'s `DialogPortalProps` verbatim — one type for both branches. */
	export type ResponsiveDialogPortalProps = DialogPrimitive.PortalProps;
</script>

<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Drawer from "$lib/components/ui/drawer/index.js";

	import { getResponsiveDialogContext } from "./responsive-dialog.svelte.js";

	let { ...restProps }: ResponsiveDialogPortalProps = $props();

	const state = getResponsiveDialogContext("Portal");
</script>

<!-- No `data-slot`/`data-variant`: the underlying portal renders no element of its own. -->
{#if state.variant === "drawer"}
	<Drawer.Portal {...restProps} />
{:else}
	<Dialog.Portal {...restProps} />
{/if}
