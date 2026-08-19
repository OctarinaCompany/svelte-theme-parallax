<script lang="ts" module>
	import type { WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	import type { MediaPlayerPipErrorState } from "./media-player.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type MediaPlayerPiPChildProps = {
		type: "button";
		"data-slot": "media-player-pip";
		"data-state": "on" | "off";
		"data-disabled": "" | undefined;
		"aria-label": string;
		"aria-controls": string;
		disabled: boolean;
		class: string;
	} & Record<string, unknown>;

	/**
	 * `children` is omitted from the element attributes because this part redefines it: intersecting
	 * `Snippet` with `Snippet<[boolean]>` would leave a snippet no caller can write.
	 */
	export type MediaPlayerPiPProps = WithElementRef<
		Omit<HTMLButtonAttributes, "type" | "children">,
		HTMLElement
	> & {
		/** Fired when entering or leaving Picture-in-Picture is refused, in place of the root's. */
		onPipError?: (error: unknown, state: MediaPlayerPipErrorState) => void;
		/** Render the control onto your own element. Replaces upstream's `asChild`. */
		child?: Snippet<[{ props: MediaPlayerPiPChildProps }]>;
		/**
		 * Replaces the default icon. Receives the current Picture-in-Picture state — the Svelte form
		 * of upstream's `(isPictureInPicture: boolean) => ReactNode` render prop.
		 */
		children?: Snippet<[boolean]>;
	};
</script>

<script lang="ts">
	import PictureInPicture2Icon from "@lucide/svelte/icons/picture-in-picture-2";
	import PictureInPictureIcon from "@lucide/svelte/icons/picture-in-picture";

	import { Button } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";

	import MediaPlayerTooltip from "./media-player-tooltip.svelte";
	import { getMediaPlayerContext } from "./media-player.svelte.js";

	let {
		ref = $bindable(null),
		onPipError,
		disabled,
		onclick: onclickProp,
		class: className,
		child,
		children,
		...restProps
	}: MediaPlayerPiPProps = $props();

	const root = getMediaPlayerContext("<MediaPlayer.PiP>");

	const isDisabled = $derived(Boolean(disabled) || root.disabled);

	function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onclickProp?.(event);
		if (event.defaultPrevented) return;

		void root.togglePip(onPipError);
	}

	const pipAttrs = $derived({
		type: "button",
		"aria-controls": root.mediaId,
		"aria-label": root.pip ? "Exit pip" : "Enter pip",
		"data-disabled": isDisabled ? "" : undefined,
		"data-slot": "media-player-pip",
		"data-state": root.pip ? "on" : "off",
		...restProps,
		disabled: isDisabled,
		class: cn("size-8", className),
		onclick,
	} as MediaPlayerPiPChildProps);
</script>

<MediaPlayerTooltip tooltip="Picture in picture" shortcut="P">
	{#if child}
		{@render child({ props: pipAttrs })}
	{:else}
		<Button bind:ref variant="ghost" size="icon" {...pipAttrs}>
			{#if children}
				{@render children(root.pip)}
			{:else if root.pip}
				<PictureInPicture2Icon />
			{:else}
				<PictureInPictureIcon />
			{/if}
		</Button>
	{/if}
</MediaPlayerTooltip>
