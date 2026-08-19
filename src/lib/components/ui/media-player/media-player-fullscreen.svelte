<script lang="ts" module>
	import type { WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type MediaPlayerFullscreenChildProps = {
		type: "button";
		"data-slot": "media-player-fullscreen";
		"data-state": "on" | "off";
		"data-disabled": "" | undefined;
		"aria-label": string;
		disabled: boolean;
		class: string;
	} & Record<string, unknown>;

	export type MediaPlayerFullscreenProps = WithElementRef<
		Omit<HTMLButtonAttributes, "type">,
		HTMLElement
	> & {
		/** Render the control onto your own element. Replaces upstream's `asChild`. */
		child?: Snippet<[{ props: MediaPlayerFullscreenChildProps }]>;
		/** Replaces the default maximise/minimise icon. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import Maximize2Icon from "@lucide/svelte/icons/maximize-2";
	import Minimize2Icon from "@lucide/svelte/icons/minimize-2";

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
	}: MediaPlayerFullscreenProps = $props();

	const root = getMediaPlayerContext("<MediaPlayer.Fullscreen>");

	const isDisabled = $derived(Boolean(disabled) || root.disabled);

	function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onclickProp?.(event);
		if (event.defaultPrevented) return;

		void root.toggleFullscreen();
	}

	const fullscreenAttrs = $derived({
		type: "button",
		"aria-label": root.fullscreen ? "Exit fullscreen" : "Enter fullscreen",
		"data-disabled": isDisabled ? "" : undefined,
		"data-slot": "media-player-fullscreen",
		"data-state": root.fullscreen ? "on" : "off",
		...restProps,
		disabled: isDisabled,
		class: cn("size-8", className),
		onclick,
	} as MediaPlayerFullscreenChildProps);
</script>

<MediaPlayerTooltip tooltip="Fullscreen" shortcut="F">
	{#if child}
		{@render child({ props: fullscreenAttrs })}
	{:else}
		<Button bind:ref variant="ghost" size="icon" {...fullscreenAttrs}>
			{#if children}
				{@render children()}
			{:else if root.fullscreen}
				<Minimize2Icon />
			{:else}
				<Maximize2Icon />
			{/if}
		</Button>
	{/if}
</MediaPlayerTooltip>
