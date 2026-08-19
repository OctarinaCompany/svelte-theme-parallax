<script lang="ts" module>
	import type { WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type MediaPlayerSeekForwardChildProps = {
		type: "button";
		"data-slot": "media-player-seek-forward";
		"data-disabled": "" | undefined;
		"aria-label": string;
		"aria-controls": string;
		disabled: boolean;
		class: string;
	} & Record<string, unknown>;

	export type MediaPlayerSeekForwardProps = WithElementRef<
		Omit<HTMLButtonAttributes, "type">,
		HTMLElement
	> & {
		/**
		 * How far ahead a click jumps, in seconds.
		 *
		 * @default 10
		 */
		seconds?: number;
		/** Render the control onto your own element. Replaces upstream's `asChild`. */
		child?: Snippet<[{ props: MediaPlayerSeekForwardChildProps }]>;
		/** Replaces the default fast-forward icon. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import FastForwardIcon from "@lucide/svelte/icons/fast-forward";

	import { Button } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";

	import MediaPlayerTooltip from "./media-player-tooltip.svelte";
	import { getMediaPlayerContext, SEEK_STEP_LONG, SEEK_STEP_SHORT } from "./media-player.svelte.js";

	let {
		ref = $bindable(null),
		seconds = SEEK_STEP_LONG,
		disabled,
		onclick: onclickProp,
		class: className,
		child,
		children,
		...restProps
	}: MediaPlayerSeekForwardProps = $props();

	const root = getMediaPlayerContext("<MediaPlayer.SeekForward>");

	const isDisabled = $derived(Boolean(disabled) || root.disabled);

	// `ArrowRight` moves by `SEEK_STEP_SHORT` and `L` by `SEEK_STEP_LONG`, so the advertised
	// shortcut follows the configured jump; any other `seconds` has no matching key.
	const shortcut = $derived(
		seconds === SEEK_STEP_SHORT
			? root.isVideo
				? ["→"]
				: ["Shift →"]
			: seconds === SEEK_STEP_LONG
				? "L"
				: undefined,
	);

	function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onclickProp?.(event);
		if (event.defaultPrevented) return;

		root.seekBy(seconds);
	}

	const seekForwardAttrs = $derived({
		type: "button",
		"aria-controls": root.mediaId,
		"aria-label": `Forward ${seconds} seconds`,
		"data-disabled": isDisabled ? "" : undefined,
		"data-slot": "media-player-seek-forward",
		...restProps,
		disabled: isDisabled,
		class: cn("size-8", className),
		onclick,
	} as MediaPlayerSeekForwardChildProps);
</script>

<MediaPlayerTooltip tooltip={`Forward ${seconds}s`} {shortcut}>
	{#if child}
		{@render child({ props: seekForwardAttrs })}
	{:else}
		<Button bind:ref variant="ghost" size="icon" {...seekForwardAttrs}>
			{#if children}
				{@render children()}
			{:else}
				<FastForwardIcon />
			{/if}
		</Button>
	{/if}
</MediaPlayerTooltip>
