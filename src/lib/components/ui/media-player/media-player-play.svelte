<script lang="ts" module>
	import type { WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type MediaPlayerPlayChildProps = {
		type: "button";
		"data-slot": "media-player-play-button";
		"data-state": "on" | "off";
		"data-disabled": "" | undefined;
		"aria-label": string;
		"aria-pressed": boolean;
		"aria-controls": string;
		disabled: boolean;
		class: string;
	} & Record<string, unknown>;

	export type MediaPlayerPlayProps = WithElementRef<
		Omit<HTMLButtonAttributes, "type">,
		HTMLElement
	> & {
		/**
		 * Render the control onto your own element instead of the default `<Button>`.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`). In `child` mode `children` is not rendered
		 * and `ref` stays `null` — the caller owns the element.
		 */
		child?: Snippet<[{ props: MediaPlayerPlayChildProps }]>;
		/** Replaces the default play/pause icon. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import PauseIcon from "@lucide/svelte/icons/pause";
	import PlayIcon from "@lucide/svelte/icons/play";

	import { Button } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";

	import MediaPlayerTooltip from "./media-player-tooltip.svelte";
	import { getMediaPlayerContext } from "./media-player.svelte.js";

	let {
		ref = $bindable(null),
		disabled,
		onclick: onclickProp,
		class: className,
		child,
		children,
		...restProps
	}: MediaPlayerPlayProps = $props();

	const root = getMediaPlayerContext("<MediaPlayer.Play>");

	const isDisabled = $derived(Boolean(disabled) || root.disabled);
	const action = $derived(root.paused ? "Play" : "Pause");

	function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onclickProp?.(event);
		if (event.defaultPrevented) return;

		root.togglePlay();
	}

	const playAttrs = $derived({
		type: "button",
		"aria-controls": root.mediaId,
		"aria-label": action,
		"aria-pressed": !root.paused,
		"data-disabled": isDisabled ? "" : undefined,
		"data-slot": "media-player-play-button",
		"data-state": root.paused ? "off" : "on",
		...restProps,
		disabled: isDisabled,
		class: cn("size-8 [&_svg:not([class*='fill-'])]:fill-current", className),
		onclick,
	} as MediaPlayerPlayChildProps);
</script>

<MediaPlayerTooltip tooltip={action} shortcut="Space">
	{#if child}
		{@render child({ props: playAttrs })}
	{:else}
		<Button bind:ref variant="ghost" size="icon" {...playAttrs}>
			{#if children}
				{@render children()}
			{:else if root.paused}
				<PlayIcon />
			{:else}
				<PauseIcon />
			{/if}
		</Button>
	{/if}
</MediaPlayerTooltip>
