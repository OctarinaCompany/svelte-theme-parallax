<script lang="ts" module>
	import type { WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type MediaPlayerCaptionsChildProps = {
		type: "button";
		"data-slot": "media-player-captions";
		"data-state": "on" | "off";
		"data-disabled": "" | undefined;
		"aria-label": string;
		"aria-pressed": boolean;
		"aria-controls": string;
		disabled: boolean;
		class: string;
	} & Record<string, unknown>;

	export type MediaPlayerCaptionsProps = WithElementRef<
		Omit<HTMLButtonAttributes, "type">,
		HTMLElement
	> & {
		/** Render the control onto your own element. Replaces upstream's `asChild`. */
		child?: Snippet<[{ props: MediaPlayerCaptionsChildProps }]>;
		/** Replaces the default subtitles icon. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import CaptionsOffIcon from "@lucide/svelte/icons/captions-off";
	import SubtitlesIcon from "@lucide/svelte/icons/subtitles";

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
	}: MediaPlayerCaptionsProps = $props();

	const root = getMediaPlayerContext("<MediaPlayer.Captions>");

	const isDisabled = $derived(Boolean(disabled) || root.disabled);
	const action = $derived(root.captionsActive ? "Disable captions" : "Enable captions");

	function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onclickProp?.(event);
		if (event.defaultPrevented) return;

		// A media with no subtitle or caption track has nothing to toggle.
		root.toggleCaptions();
	}

	const captionsAttrs = $derived({
		type: "button",
		"aria-controls": root.mediaId,
		"aria-label": action,
		"aria-pressed": root.captionsActive,
		"data-disabled": isDisabled ? "" : undefined,
		"data-slot": "media-player-captions",
		"data-state": root.captionsActive ? "on" : "off",
		...restProps,
		disabled: isDisabled,
		class: cn("size-8", className),
		onclick,
	} as MediaPlayerCaptionsChildProps);
</script>

<MediaPlayerTooltip tooltip="Captions" shortcut="C">
	{#if child}
		{@render child({ props: captionsAttrs })}
	{:else}
		<Button bind:ref variant="ghost" size="icon" {...captionsAttrs}>
			{#if children}
				{@render children()}
			{:else if root.captionsActive}
				<SubtitlesIcon />
			{:else}
				<CaptionsOffIcon />
			{/if}
		</Button>
	{/if}
</MediaPlayerTooltip>
