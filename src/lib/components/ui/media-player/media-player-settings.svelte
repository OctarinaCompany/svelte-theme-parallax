<script lang="ts" module>
	import type { WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	import type { MediaPlayerRendition } from "./media-player.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type MediaPlayerSettingsChildProps = {
		type: "button";
		"data-slot": "media-player-settings";
		"data-disabled": "" | undefined;
		"aria-label": "Settings";
		"aria-controls": string;
		disabled: boolean;
		class: string;
	} & Record<string, unknown>;

	export type MediaPlayerSettingsProps = WithElementRef<
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
		 * The rates the Speed submenu offers.
		 *
		 * @default [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
		 */
		speeds?: number[];
		/**
		 * The playback qualities the Quality submenu offers. The submenu only renders for a video
		 * with at least one rendition — upstream reads the same list from its adaptive-bitrate
		 * engine, which this theme does not depend on.
		 *
		 * @default []
		 */
		renditions?: MediaPlayerRendition[];
		/**
		 * The selected rendition, or `undefined` for "Auto".
		 *
		 * Bindable: `bind:renditionId={id}` lets the menu move your state, while the function
		 * binding `bind:renditionId={() => id, (next) => …}` keeps you authoritative.
		 */
		renditionId?: string;
		/** Called whenever a quality is picked, in both modes. */
		onRenditionChange?: (renditionId: string | undefined) => void;
		/** Render the trigger onto your own element. Replaces upstream's `asChild`. */
		child?: Snippet<[{ props: MediaPlayerSettingsChildProps }]>;
		/** Replaces the default gear icon. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import SettingsIcon from "@lucide/svelte/icons/settings";

	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { cn } from "$lib/utils.js";
	import { untrack } from "svelte";

	import MediaPlayerTooltip from "./media-player-tooltip.svelte";
	import {
		FLOATING_MENU_SIDE_OFFSET,
		getMediaPlayerContext,
		MEDIA_PLAYER_SPEEDS,
		type MediaPlayerTextTrack,
	} from "./media-player.svelte.js";

	let {
		ref = $bindable(null),
		open = $bindable(),
		defaultOpen = false,
		onOpenChange,
		modal = false,
		sideOffset = FLOATING_MENU_SIDE_OFFSET,
		speeds = MEDIA_PLAYER_SPEEDS,
		renditions = [],
		renditionId = $bindable(),
		onRenditionChange,
		disabled,
		class: className,
		child: childSnippet,
		children,
		...restProps
	}: MediaPlayerSettingsProps = $props();

	const root = getMediaPlayerContext("<MediaPlayer.Settings>");

	// Uncontrolled: seed once from `defaultOpen`. Controlled: the caller's binding wins.
	if (open === undefined) open = untrack(() => defaultOpen);

	const isDisabled = $derived(Boolean(disabled) || root.disabled);

	function handleOpenChange(next: boolean) {
		open = next;
		// An open menu pins the controls up and suppresses the seek tooltip and volume HUD.
		root.menuOpen = next;
		onOpenChange?.(next);
	}

	function selectRendition(next: string | undefined) {
		renditionId = next;
		onRenditionChange?.(next);
	}

	const sortedRenditions = $derived(
		renditions
			.slice()
			.sort((first, second) => (second.height ?? 0) - (first.height ?? 0))
			.map((rendition) => ({
				...rendition,
				label: rendition.height
					? `${rendition.height}p`
					: rendition.width
						? `${rendition.width}p`
						: rendition.id,
			})),
	);

	const renditionLabel = $derived(
		sortedRenditions.find((rendition) => rendition.id === renditionId)?.label ?? "Auto",
	);

	const subtitleLabel = $derived(root.showingSubtitles[0]?.label ?? "Off");

	function showTrack(track: MediaPlayerTextTrack) {
		root.showSubtitleTrack(track);
	}

	const triggerAttrs = $derived({
		type: "button",
		"aria-controls": root.mediaId,
		"aria-label": "Settings",
		"data-disabled": isDisabled ? "" : undefined,
		"data-slot": "media-player-settings",
		...restProps,
		disabled: isDisabled,
		class: cn("size-8 aria-expanded:bg-accent/50", className),
	} as MediaPlayerSettingsChildProps);
</script>

<DropdownMenu.Root bind:open={() => open ?? false, handleOpenChange}>
	<MediaPlayerTooltip tooltip="Settings">
		<DropdownMenu.Trigger>
			{#snippet child({ props: triggerProps })}
				{#if childSnippet}
					{@render childSnippet({ props: { ...triggerProps, ...triggerAttrs } })}
				{:else}
					<Button bind:ref variant="ghost" size="icon" {...triggerProps} {...triggerAttrs}>
						{#if children}
							{@render children()}
						{:else}
							<SettingsIcon />
						{/if}
					</Button>
				{/if}
			{/snippet}
		</DropdownMenu.Trigger>
	</MediaPlayerTooltip>
	<DropdownMenu.Content
		align="end"
		side="top"
		{sideOffset}
		preventScroll={modal}
		portalProps={{ to: root.portalContainer ?? undefined }}
		class="w-56 data-[side=top]:mb-3.5"
	>
		<DropdownMenu.Group>
			<DropdownMenu.Label class="sr-only">Settings</DropdownMenu.Label>
			<DropdownMenu.Sub>
				<DropdownMenu.SubTrigger>
					<span class="flex-1">Speed</span>
					<Badge variant="outline" class="rounded-sm">{root.playbackRate}x</Badge>
				</DropdownMenu.SubTrigger>
				<!--
					PORTALLED, like the panel above it and for the same two reasons. `SubContent` is
					not portalled by the generated wrapper, so it renders as a DOM child of the panel
					that opened it — and `dropdown-menu-content` is `overflow-x-hidden`, which leaves a
					submenu opening to its right entirely outside the box and invisible. The target is
					the player's own container rather than the body, because in fullscreen the body is
					not on screen: only the fullscreen element and its descendants are drawn.

					`sideOffset` is the panel's `p-1` paid back, plus the 4px of air a top-level menu
					already takes from its trigger. A submenu anchors to its trigger, which sits inside
					that padding, so at the default offset of 0 it starts 4px short of the panel's edge
					and slides under it — and flush is not enough either, because `shadow-lg` blurs 15px
					with no offset and would smear across the panel it sits against.
				-->
				<DropdownMenu.Portal to={root.portalContainer ?? undefined}>
					<DropdownMenu.SubContent sideOffset={8}>
						<DropdownMenu.Group>
							{#each speeds as speed (speed)}
								<DropdownMenu.Item
									class="justify-between"
									onSelect={() => root.setPlaybackRate(speed)}
								>
									{speed}x
									{#if root.playbackRate === speed}
										<CheckIcon />
									{/if}
								</DropdownMenu.Item>
							{/each}
						</DropdownMenu.Group>
					</DropdownMenu.SubContent>
				</DropdownMenu.Portal>
			</DropdownMenu.Sub>

			{#if root.isVideo && sortedRenditions.length > 0}
				<DropdownMenu.Sub>
					<DropdownMenu.SubTrigger>
						<span class="flex-1">Quality</span>
						<Badge variant="outline" class="rounded-sm">{renditionLabel}</Badge>
					</DropdownMenu.SubTrigger>
					<!-- Portalled out of the clipping panel, as above. -->
					<DropdownMenu.Portal to={root.portalContainer ?? undefined}>
						<DropdownMenu.SubContent sideOffset={8}>
							<DropdownMenu.Group>
								<DropdownMenu.Item
									class="justify-between"
									onSelect={() => selectRendition(undefined)}
								>
									Auto
									{#if renditionId === undefined}
										<CheckIcon />
									{/if}
								</DropdownMenu.Item>
								{#each sortedRenditions as rendition (rendition.id)}
									<DropdownMenu.Item
										class="justify-between"
										onSelect={() => selectRendition(rendition.id)}
									>
										{rendition.label}
										{#if rendition.id === renditionId}
											<CheckIcon />
										{/if}
									</DropdownMenu.Item>
								{/each}
							</DropdownMenu.Group>
						</DropdownMenu.SubContent>
					</DropdownMenu.Portal>
				</DropdownMenu.Sub>
			{/if}

			<DropdownMenu.Sub>
				<DropdownMenu.SubTrigger>
					<span class="flex-1">Captions</span>
					<Badge variant="outline" class="rounded-sm">{subtitleLabel}</Badge>
				</DropdownMenu.SubTrigger>
				<!-- Portalled out of the clipping panel, as above. -->
				<DropdownMenu.Portal to={root.portalContainer ?? undefined}>
					<DropdownMenu.SubContent sideOffset={8}>
						<DropdownMenu.Group>
							<DropdownMenu.Item class="justify-between" onSelect={() => root.hideSubtitles()}>
								Off
								{#if !root.captionsActive}
									<CheckIcon />
								{/if}
							</DropdownMenu.Item>
							{#each root.subtitleTracks as track (`${track.kind}-${track.label}-${track.language}`)}
								<DropdownMenu.Item class="justify-between" onSelect={() => showTrack(track)}>
									{track.label}
									{#if track.mode === "showing"}
										<CheckIcon />
									{/if}
								</DropdownMenu.Item>
							{/each}
							{#if root.subtitleTracks.length === 0}
								<DropdownMenu.Item disabled>No captions available</DropdownMenu.Item>
							{/if}
						</DropdownMenu.Group>
					</DropdownMenu.SubContent>
				</DropdownMenu.Portal>
			</DropdownMenu.Sub>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
