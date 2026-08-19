<script lang="ts" module>
	import type { WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLVideoAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type MediaPlayerVideoChildProps = {
		"data-slot": "media-player-video";
		id: string;
	} & Record<string, unknown>;

	export type MediaPlayerVideoProps = WithElementRef<HTMLVideoAttributes, HTMLVideoElement> & {
		/**
		 * Render the media onto your own element — a custom element wrapping an adaptive-bitrate
		 * engine, for instance. The snippet receives the merged props, including an attachment that
		 * registers the element with the player, so every control keeps working.
		 *
		 * Replaces upstream's `asChild`. Svelte's media bindings cannot be applied to a caller's
		 * element, so in `child` mode the player mirrors the media through its own listeners instead.
		 */
		child?: Snippet<[{ props: MediaPlayerVideoChildProps }]>;
		/** `<source>` and `<track>` elements. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { createAttachmentKey } from "svelte/attachments";

	import { getMediaPlayerContext } from "./media-player.svelte.js";

	let {
		ref = $bindable(null),
		onclick,
		class: className,
		child,
		children,
		...restProps
	}: MediaPlayerVideoProps = $props();

	const root = getMediaPlayerContext("<MediaPlayer.Video>");

	// In `child` mode the attachment below owns registration, because the caller's element never
	// reaches `ref`.
	$effect(() => {
		if (child) return;
		root.mediaEl = ref;
		return () => {
			if (root.mediaEl === ref) root.mediaEl = null;
		};
	});

	// Everything Svelte's media bindings do not reach — `loop`, `loading`, `hasPlayed`, `error`,
	// Picture-in-Picture and the text tracks — plus the root's nine callbacks.
	$effect(() => root.attachMedia());

	function handleClick(event: MouseEvent & { currentTarget: EventTarget & HTMLVideoElement }) {
		onclick?.(event);
		if (event.defaultPrevented) return;
		root.togglePlay();
	}

	const registerAttachment = createAttachmentKey();

	const videoAttrs = $derived({
		"aria-labelledby": root.labelId,
		"aria-describedby": root.descriptionId,
		...restProps,
		"data-slot": "media-player-video",
		id: root.mediaId,
		onclick: handleClick,
		class: className,
		[registerAttachment]: (node: Element) => {
			root.mediaEl = node as HTMLVideoElement;
			return () => {
				if (root.mediaEl === node) root.mediaEl = null;
			};
		},
	} as MediaPlayerVideoChildProps);
</script>

{#if child}
	{@render child({ props: videoAttrs })}
{:else}
	<!--
		No `bind:` media properties. `attachMedia()` already mirrors every one of them from the
		element's own events, and every mutator (`seekTo`, `setVolume`, `toggleMute`, …) writes the
		element imperatively — so a two-way binding has nothing to push and only adds a second writer.
		Having both is a feedback loop: the listener copies `element.currentTime` into state, the
		binding writes that value straight back onto the element, and assigning `currentTime` *is* a
		seek. Measured, it produced 156 seeks/s and dropped playback to a fifth of real time.
	-->
	<video
		bind:this={ref}
		aria-labelledby={root.labelId}
		aria-describedby={root.descriptionId}
		{...restProps}
		data-slot="media-player-video"
		id={root.mediaId}
		onclick={handleClick}
		class={className}
	>
		{@render children?.()}
	</video>
{/if}
