<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type MediaPlayerControlsOverlayChildProps = {
		"data-slot": "media-player-controls-overlay";
		"data-state": "fullscreen" | "windowed";
		"data-visible": "" | undefined;
		class: string;
	} & Record<string, unknown>;

	export type MediaPlayerControlsOverlayProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/** Render the backdrop onto your own element. Replaces upstream's `asChild`. */
		child?: Snippet<[{ props: MediaPlayerControlsOverlayChildProps }]>;
		/** Optional content painted over the backdrop. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { getMediaPlayerContext } from "./media-player.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		child,
		children,
		...restProps
	}: MediaPlayerControlsOverlayProps = $props();

	const root = getMediaPlayerContext("<MediaPlayer.ControlsOverlay>");

	const overlayAttrs = $derived({
		"data-slot": "media-player-controls-overlay",
		"data-state": root.fullscreen ? "fullscreen" : "windowed",
		"data-visible": root.controlsVisible ? "" : undefined,
		...restProps,
		class: cn(
			"pointer-events-none absolute inset-0 -z-10 bg-linear-to-t from-background/80 to-transparent opacity-0 transition-opacity duration-200 data-visible:opacity-100",
			className,
		),
	} as MediaPlayerControlsOverlayChildProps);
</script>

{#if child}
	{@render child({ props: overlayAttrs })}
{:else}
	<div bind:this={ref} {...overlayAttrs}>
		{@render children?.()}
	</div>
{/if}
