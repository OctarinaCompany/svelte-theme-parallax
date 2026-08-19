<script lang="ts" module>
	import type { WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type MediaPlayerDownloadChildProps = {
		type: "button";
		"data-slot": "media-player-download";
		"data-disabled": "" | undefined;
		"aria-label": "Download";
		"aria-controls": string;
		disabled: boolean;
		class: string;
	} & Record<string, unknown>;

	export type MediaPlayerDownloadProps = WithElementRef<
		Omit<HTMLButtonAttributes, "type">,
		HTMLElement
	> & {
		/** Render the control onto your own element. Replaces upstream's `asChild`. */
		child?: Snippet<[{ props: MediaPlayerDownloadChildProps }]>;
		/** Replaces the default download icon. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import DownloadIcon from "@lucide/svelte/icons/download";

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
	}: MediaPlayerDownloadProps = $props();

	const root = getMediaPlayerContext("<MediaPlayer.Download>");

	// Upstream gates the `D` shortcut on a `[data-slot="media-player-download"]` inside the
	// `<video>`, where a control can never be, so the shortcut is dead code there. Registering the
	// mounted part is what makes it work here.
	$effect(() => root.registerPart("download"));

	const isDisabled = $derived(Boolean(disabled) || root.disabled);

	function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onclickProp?.(event);
		if (event.defaultPrevented) return;

		root.download();
	}

	const downloadAttrs = $derived({
		type: "button",
		"aria-controls": root.mediaId,
		"aria-label": "Download",
		"data-disabled": isDisabled ? "" : undefined,
		"data-slot": "media-player-download",
		...restProps,
		disabled: isDisabled,
		class: cn("size-8", className),
		onclick,
	} as MediaPlayerDownloadChildProps);
</script>

<MediaPlayerTooltip tooltip="Download" shortcut="D">
	{#if child}
		{@render child({ props: downloadAttrs })}
	{:else}
		<Button bind:ref variant="ghost" size="icon" {...downloadAttrs}>
			{#if children}
				{@render children()}
			{:else}
				<DownloadIcon />
			{/if}
		</Button>
	{/if}
</MediaPlayerTooltip>
