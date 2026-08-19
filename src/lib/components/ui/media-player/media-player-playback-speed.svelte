<script lang="ts" module>
	import type { WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type MediaPlayerPlaybackSpeedChildProps = {
		type: "button";
		"data-slot": "media-player-playback-speed";
		"data-disabled": "" | undefined;
		"aria-controls": string;
		disabled: boolean;
		class: string;
	} & Record<string, unknown>;

	export type MediaPlayerPlaybackSpeedProps = WithElementRef<
		Omit<HTMLButtonAttributes, "type">,
		HTMLElement
	> & {
		/**
		 * Controlled open state of the menu.
		 *
		 * Bindable: `bind:open={open}` lets the menu move your state, while the function binding
		 * `bind:open={() => open, (next) => …}` keeps you authoritative.
		 */
		open?: boolean;
		/**
		 * Initial open state when uncontrolled.
		 *
		 * @default false
		 */
		defaultOpen?: boolean;
		/** Called whenever the menu opens or closes, in both modes. */
		onOpenChange?: (open: boolean) => void;
		/**
		 * Whether the menu traps focus and blocks the page behind it.
		 *
		 * @default false
		 */
		modal?: boolean;
		/**
		 * Distance in pixels between the trigger and the menu.
		 *
		 * @default 10
		 */
		sideOffset?: number;
		/**
		 * The rates the menu offers.
		 *
		 * @default [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
		 */
		speeds?: number[];
		/** Render the trigger onto your own element. Replaces upstream's `asChild`. */
		child?: Snippet<[{ props: MediaPlayerPlaybackSpeedChildProps }]>;
		/** Replaces the default `{rate}x` trigger label. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";

	import { Button } from "$lib/components/ui/button/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { cn } from "$lib/utils.js";
	import { untrack } from "svelte";

	import MediaPlayerTooltip from "./media-player-tooltip.svelte";
	import {
		FLOATING_MENU_SIDE_OFFSET,
		getMediaPlayerContext,
		MEDIA_PLAYER_SPEEDS,
	} from "./media-player.svelte.js";

	let {
		ref = $bindable(null),
		open = $bindable(),
		defaultOpen = false,
		onOpenChange,
		modal = false,
		sideOffset = FLOATING_MENU_SIDE_OFFSET,
		speeds = MEDIA_PLAYER_SPEEDS,
		disabled,
		class: className,
		child: childSnippet,
		children,
		...restProps
	}: MediaPlayerPlaybackSpeedProps = $props();

	const root = getMediaPlayerContext("<MediaPlayer.PlaybackSpeed>");

	// Uncontrolled: seed once from `defaultOpen`. Controlled: the caller's binding wins, and a
	// binding that declines the write keeps the menu where it was.
	if (open === undefined) open = untrack(() => defaultOpen);

	const isDisabled = $derived(Boolean(disabled) || root.disabled);

	function handleOpenChange(next: boolean) {
		open = next;
		// An open menu pins the controls up and suppresses the seek tooltip and volume HUD.
		root.menuOpen = next;
		onOpenChange?.(next);
	}

	const triggerAttrs = $derived({
		type: "button",
		"aria-controls": root.mediaId,
		"data-disabled": isDisabled ? "" : undefined,
		"data-slot": "media-player-playback-speed",
		...restProps,
		disabled: isDisabled,
		class: cn("h-8 w-16 aria-expanded:bg-accent/50", className),
	} as MediaPlayerPlaybackSpeedChildProps);
</script>

<DropdownMenu.Root bind:open={() => open ?? false, handleOpenChange}>
	<MediaPlayerTooltip tooltip="Playback speed" shortcut={["<", ">"]}>
		<DropdownMenu.Trigger>
			{#snippet child({ props: triggerProps })}
				{#if childSnippet}
					{@render childSnippet({ props: { ...triggerProps, ...triggerAttrs } })}
				{:else}
					<Button bind:ref variant="ghost" size="icon" {...triggerProps} {...triggerAttrs}>
						{#if children}
							{@render children()}
						{:else}
							{root.playbackRate}x
						{/if}
					</Button>
				{/if}
			{/snippet}
		</DropdownMenu.Trigger>
	</MediaPlayerTooltip>
	<DropdownMenu.Content
		align="center"
		{sideOffset}
		preventScroll={modal}
		portalProps={{ to: root.portalContainer ?? undefined }}
		class="min-w-(--bits-dropdown-menu-anchor-width) data-[side=top]:mb-3.5"
	>
		<DropdownMenu.Group>
			{#each speeds as speed (speed)}
				<DropdownMenu.Item class="justify-between" onSelect={() => root.setPlaybackRate(speed)}>
					{speed}x
					{#if root.playbackRate === speed}
						<CheckIcon />
					{/if}
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
