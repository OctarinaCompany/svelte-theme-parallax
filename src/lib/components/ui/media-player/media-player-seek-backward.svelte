<script lang="ts" module>
	import type { WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type MediaPlayerSeekBackwardChildProps = {
		type: "button";
		"data-slot": "media-player-seek-backward";
		"data-disabled": "" | undefined;
		"aria-label": string;
		"aria-controls": string;
		disabled: boolean;
		class: string;
	} & Record<string, unknown>;

	export type MediaPlayerSeekBackwardProps = WithElementRef<
		Omit<HTMLButtonAttributes, "type">,
		HTMLElement
	> & {
		/**
		 * How far back a click jumps, in seconds.
		 *
		 * @default 5
		 */
		seconds?: number;
		/** Render the control onto your own element. Replaces upstream's `asChild`. */
		child?: Snippet<[{ props: MediaPlayerSeekBackwardChildProps }]>;
		/** Replaces the default rewind icon. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import RewindIcon from "@lucide/svelte/icons/rewind";

	import { Button } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";

	import MediaPlayerTooltip from "./media-player-tooltip.svelte";
	import { getMediaPlayerContext, SEEK_STEP_SHORT } from "./media-player.svelte.js";

	let {
		ref = $bindable(null),
		seconds = SEEK_STEP_SHORT,
		disabled,
		onclick: onclickProp,
		class: className,
		child,
		children,
		...restProps
	}: MediaPlayerSeekBackwardProps = $props();

	const root = getMediaPlayerContext("<MediaPlayer.SeekBackward>");

	const isDisabled = $derived(Boolean(disabled) || root.disabled);

	function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onclickProp?.(event);
		if (event.defaultPrevented) return;

		root.seekBy(-seconds);
	}

	const seekBackwardAttrs = $derived({
		type: "button",
		"aria-controls": root.mediaId,
		"aria-label": `Back ${seconds} seconds`,
		"data-disabled": isDisabled ? "" : undefined,
		"data-slot": "media-player-seek-backward",
		...restProps,
		disabled: isDisabled,
		class: cn("size-8", className),
		onclick,
	} as MediaPlayerSeekBackwardChildProps);
</script>

<MediaPlayerTooltip tooltip={`Back ${seconds}s`} shortcut={root.isVideo ? ["←"] : ["Shift ←"]}>
	{#if child}
		{@render child({ props: seekBackwardAttrs })}
	{:else}
		<Button bind:ref variant="ghost" size="icon" {...seekBackwardAttrs}>
			{#if children}
				{@render children()}
			{:else}
				<RewindIcon />
			{/if}
		</Button>
	{/if}
</MediaPlayerTooltip>
