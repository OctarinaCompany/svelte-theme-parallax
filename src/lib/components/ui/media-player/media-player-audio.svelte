<script lang="ts" module>
	import type { WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAudioAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type MediaPlayerAudioChildProps = {
		"data-slot": "media-player-audio";
		id: string;
	} & Record<string, unknown>;

	export type MediaPlayerAudioProps = WithElementRef<HTMLAudioAttributes, HTMLAudioElement> & {
		/**
		 * Render the media onto your own element. The snippet receives the merged props, including an
		 * attachment that registers the element with the player, so every control keeps working.
		 *
		 * Replaces upstream's `asChild`. Svelte's media bindings cannot be applied to a caller's
		 * element, so in `child` mode the player mirrors the media through its own listeners instead.
		 */
		child?: Snippet<[{ props: MediaPlayerAudioChildProps }]>;
		/** `<source>` and `<track>` elements. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { createAttachmentKey } from "svelte/attachments";

	import { getMediaPlayerContext } from "./media-player.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		child,
		children,
		...restProps
	}: MediaPlayerAudioProps = $props();

	const root = getMediaPlayerContext("<MediaPlayer.Audio>");

	// In `child` mode the attachment below owns registration, because the caller's element never
	// reaches `ref`.
	$effect(() => {
		if (child) return;
		root.mediaEl = ref;
		return () => {
			if (root.mediaEl === ref) root.mediaEl = null;
		};
	});

	// Everything Svelte's media bindings do not reach — `loop`, `loading`, `hasPlayed`, `error` and
	// the text tracks — plus the root's nine callbacks.
	$effect(() => root.attachMedia());

	const registerAttachment = createAttachmentKey();

	const audioAttrs = $derived({
		"aria-labelledby": root.labelId,
		"aria-describedby": root.descriptionId,
		...restProps,
		"data-slot": "media-player-audio",
		id: root.mediaId,
		class: className,
		[registerAttachment]: (node: Element) => {
			root.mediaEl = node as HTMLAudioElement;
			return () => {
				if (root.mediaEl === node) root.mediaEl = null;
			};
		},
	} as MediaPlayerAudioChildProps);
</script>

{#if child}
	{@render child({ props: audioAttrs })}
{:else}
	<!-- See `media-player-video.svelte`: the media bindings are a second writer and cause a seek loop. -->
	<audio
		bind:this={ref}
		aria-labelledby={root.labelId}
		aria-describedby={root.descriptionId}
		{...restProps}
		data-slot="media-player-audio"
		id={root.mediaId}
		class={className}
	>
		{@render children?.()}
	</audio>
{/if}
