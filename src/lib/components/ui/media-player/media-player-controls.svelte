<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type MediaPlayerControlsChildProps = {
		"data-slot": "media-player-controls";
		"data-state": "fullscreen" | "windowed";
		"data-visible": "" | undefined;
		"data-disabled": "" | undefined;
		class: string;
	} & Record<string, unknown>;

	export type MediaPlayerControlsProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, "dir">,
		HTMLDivElement
	> & {
		/** Render the controls bar onto your own element. Replaces upstream's `asChild`. */
		child?: Snippet<[{ props: MediaPlayerControlsChildProps }]>;
		/** The controls. */
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
	}: MediaPlayerControlsProps = $props();

	const root = getMediaPlayerContext("<MediaPlayer.Controls>");

	const controlsAttrs = $derived({
		"data-slot": "media-player-controls",
		"data-state": root.fullscreen ? "fullscreen" : "windowed",
		"data-visible": root.controlsVisible ? "" : undefined,
		"data-disabled": root.disabled ? "" : undefined,
		dir: root.dir,
		...restProps,
		// Hidden by opacity and `pointer-events`, never `display: none`, so a screen reader can
		// still reach the controls while they are faded out.
		//
		// No `dark` scope: the bar draws in the page's ink, and `<MediaPlayer.ControlsOverlay>`
		// washes the foot of the picture in the matching ground, so dark controls sit on a light
		// scrim in light mode and light controls on a dark one in dark mode.
		class: cn(
			"pointer-events-none absolute right-0 bottom-0 left-0 z-50 flex items-center gap-2 px-4 py-3 opacity-0 transition-opacity duration-200 in-[:fullscreen]:px-6 in-[:fullscreen]:py-4 data-visible:pointer-events-auto data-visible:opacity-100",
			className,
		),
	} as MediaPlayerControlsChildProps);
</script>

{#if child}
	{@render child({ props: controlsAttrs })}
{:else}
	<div bind:this={ref} {...controlsAttrs}>
		{@render children?.()}
	</div>
{/if}
