<script lang="ts" module>
	import type { Snippet } from "svelte";

	export type TourPortalProps = {
		/**
		 * Where the tour's floating content is rendered.
		 * @default document.body
		 */
		container?: HTMLElement | null;
		/** Normally the spotlight, the ring and the steps. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { Portal } from "bits-ui";
	import { onMount } from "svelte";

	import { getTourContext } from "./tour.svelte.js";

	let { container, children }: TourPortalProps = $props();

	// Upstream's `usePortalContext(PORTAL_NAME)` exists so the portal throws outside
	// a root, exactly like every other part.
	getTourContext("<Tour.Portal>");

	// Upstream defers the portal until after mount so it is inert during SSR.
	// `bits-ui`'s `Portal` is already browser-only, but the container has to be resolved on the
	// client too: `document.body` does not exist while rendering on the server.
	let mounted = $state(false);

	onMount(() => {
		mounted = true;
	});

	const target = $derived(container ?? (mounted ? document.body : undefined));
</script>

{#if mounted && target}
	<Portal to={target}>
		{@render children?.()}
	</Portal>
{/if}
