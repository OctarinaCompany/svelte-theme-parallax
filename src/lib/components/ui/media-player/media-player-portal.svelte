<script lang="ts" module>
	import type { Snippet } from "svelte";

	export type MediaPlayerPortalProps = {
		/**
		 * Where the content is moved to.
		 *
		 * @default the player root while fullscreen, otherwise `document.body`
		 */
		container?: Element | DocumentFragment | null;
		/** The content to portal. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { Portal } from "bits-ui";

	import { getMediaPlayerContext } from "./media-player.svelte.js";

	let { container, children }: MediaPlayerPortalProps = $props();

	const root = getMediaPlayerContext("<MediaPlayer.Portal>");

	const target = $derived(container ?? root.portalContainer);
	const element = $derived(
		typeof Element !== "undefined" && target instanceof Element ? target : null,
	);
</script>

{#if element}
	<Portal to={element}>
		{@render children?.()}
	</Portal>
{:else if target}
	<!--
		`bits-ui`'s `Portal` targets an `Element` or a selector, never a `DocumentFragment`. A
		fragment therefore renders in place rather than silently vanishing.
	-->
	{@render children?.()}
{/if}
