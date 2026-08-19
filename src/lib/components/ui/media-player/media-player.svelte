<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { MediaPlayerDirection, MediaPlayerPipErrorState } from "./media-player.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type MediaPlayerChildProps = {
		"data-slot": "media-player";
		"data-state": "fullscreen" | "windowed";
		"data-controls-visible": "" | undefined;
		"data-disabled": "" | undefined;
		dir: MediaPlayerDirection;
		class: string;
	} & Record<string, unknown>;

	/**
	 * The native `onTimeUpdate` / `onVolumeChange` handlers are omitted because the player redefines
	 * both to carry a value, exactly as upstream does.
	 */
	export type MediaPlayerRootProps = Omit<
		WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement>,
		"dir" | "onTimeUpdate" | "onVolumeChange"
	> & {
		/**
		 * The reading direction of the player chrome. Arrow-key seeking stays physical in both
		 * directions; only the layout mirrors.
		 *
		 * @default the nearest `<DirectionProvider>`, else the DOM `[dir]`, else "ltr"
		 */
		dir?: MediaPlayerDirection;
		/**
		 * The player's accessible name.
		 *
		 * @default "Media player"
		 */
		label?: string;
		/**
		 * How long the pointer must rest on a control before its tooltip opens.
		 *
		 * @default 600
		 */
		tooltipDelayDuration?: number;
		/**
		 * Distance in pixels between a control and its tooltip.
		 *
		 * @default 10
		 */
		tooltipSideOffset?: number;
		/**
		 * Fade the controls out after three idle seconds while the media is playing. A paused media,
		 * an open menu or a seek drag pins them visible.
		 *
		 * @default false
		 */
		autoHide?: boolean;
		/**
		 * Suppresses every pointer and keyboard interaction and marks every part `data-disabled`.
		 *
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Render every control without its tooltip.
		 *
		 * @default false
		 */
		withoutTooltip?: boolean;
		/** Fired when the media starts playing. */
		onPlay?: () => void;
		/** Fired when the media is paused. */
		onPause?: () => void;
		/** Fired when the media reaches its end. */
		onEnded?: () => void;
		/** Fired on every `timeupdate` with the media's current time, in seconds. */
		onTimeUpdate?: (time: number) => void;
		/** Fired on every `volumechange` with the media's volume, `0`–`1`. */
		onVolumeChange?: (volume: number) => void;
		/** Fired on every `volumechange` with the media's muted state. */
		onMuted?: (muted: boolean) => void;
		/** Fired when the media element reports an error. */
		onMediaError?: (error: MediaError | null) => void;
		/** Fired when entering or leaving Picture-in-Picture is refused. */
		onPipError?: (error: unknown, state: MediaPlayerPipErrorState) => void;
		/** Fired when this player enters or leaves fullscreen. */
		onFullscreenChange?: (fullscreen: boolean) => void;
		/**
		 * Render the root onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null` — the caller owns the element, so
		 * the screen-reader label and description render as its siblings instead of its children.
		 */
		child?: Snippet<[{ props: MediaPlayerChildProps }]>;
		/** The player's parts. */
		children?: Snippet;
	};

	/** Upstream-parity alias of {@link MediaPlayerRootProps}. */
	export type MediaPlayerProps = MediaPlayerRootProps;
</script>

<script lang="ts">
	import { useDirection } from "$lib/components/ui/direction-provider/index.js";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";

	import MediaPlayerVolumeIndicator from "./media-player-volume-indicator.svelte";
	import {
		FLOATING_MENU_SIDE_OFFSET,
		MediaPlayerState,
		setMediaPlayerContext,
	} from "./media-player.svelte.js";

	let {
		ref = $bindable(null),
		dir,
		label = "Media player",
		tooltipDelayDuration = 600,
		tooltipSideOffset = FLOATING_MENU_SIDE_OFFSET,
		autoHide = false,
		disabled = false,
		withoutTooltip = false,
		onPlay,
		onPause,
		onEnded,
		onTimeUpdate,
		onVolumeChange,
		onMuted,
		onMediaError,
		onPipError,
		onFullscreenChange,
		onkeydown,
		onkeyup,
		onmousemove,
		onmouseleave,
		class: className,
		child,
		children,
		...restProps
	}: MediaPlayerRootProps = $props();

	const direction = useDirection({ dir: () => dir, element: () => ref });

	const uid = $props.id();

	const root = setMediaPlayerContext(
		new MediaPlayerState({
			getDir: () => direction.current,
			getLabel: () => label,
			getDisabled: () => disabled,
			getAutoHide: () => autoHide,
			getWithoutTooltip: () => withoutTooltip,
			getTooltipDelayDuration: () => tooltipDelayDuration,
			getTooltipSideOffset: () => tooltipSideOffset,
			getCallbacks: () => ({
				onPlay,
				onPause,
				onEnded,
				onTimeUpdate,
				onVolumeChange,
				onMuted,
				onMediaError,
				onPipError,
				onFullscreenChange,
			}),
			mediaId: `${uid}-media`,
			labelId: `${uid}-label`,
			descriptionId: `${uid}-description`,
		}),
	);

	// The Fullscreen API listener and both auto-hide timers are owned here, so they stop with the
	// root rather than outliving it.
	$effect(() => {
		root.rootEl = ref;
		const detach = root.attachRoot();
		return () => {
			detach();
			root.destroy();
		};
	});

	// Data-model §1.5 invariant: a paused media, an open menu or a live drag pins the controls up
	// and clears the idle timer; anything else hands control back to `autoHide`.
	$effect(() => {
		if (root.controlsPinned) {
			root.showControls();
			return;
		}
		if (autoHide) root.showControls();
	});

	function handleKeydown(event: KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onkeydown?.(event);
		if (event.defaultPrevented) return;
		root.onRootKeydown(event);
	}

	function handleKeyup(event: KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onkeyup?.(event);
		if (event.defaultPrevented) return;
		root.onRootKeyup(event);
	}

	function handleMousemove(event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onmousemove?.(event);
		if (event.defaultPrevented) return;
		if (autoHide) root.showControls();
	}

	function handleMouseleave(event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onmouseleave?.(event);
		if (event.defaultPrevented) return;
		root.hideControls();
	}

	const rootAttrs = $derived({
		"data-slot": "media-player",
		"data-state": root.fullscreen ? "fullscreen" : "windowed",
		"data-controls-visible": root.controlsVisible ? "" : undefined,
		"data-disabled": disabled ? "" : undefined,
		"aria-labelledby": root.labelId,
		"aria-describedby": root.descriptionId,
		"aria-disabled": disabled,
		dir: root.dir,
		tabindex: disabled ? undefined : 0,
		...restProps,
		onkeydown: handleKeydown,
		onkeyup: handleKeyup,
		onmousemove: handleMousemove,
		onmouseleave: handleMouseleave,
		class: cn(
			/*
			 * The player paints no ground and scopes no palette: it is transparent, and every part
			 * inside draws in the page's own ink — dark controls in light mode, light controls in
			 * dark mode. The one surface a player has is its picture, and the picture paints
			 * itself: a `<video>` renders its own frame and its own black letterbox bars, so an
			 * audio player is a bare control strip on whatever card holds it while a video player
			 * still reads as a framed picture.
			 *
			 * This replaces a `dark bg-background text-foreground` root that forced a navy slab in
			 * both page themes. It was a defensible reading of "video chrome is always dark", but
			 * it made an audio player a dark box marooned on a light page, and it is not what this
			 * theme wants. Nothing here needs a scoped palette any more: the controls scrim
			 * (`from-background/80`), the seek bar (`currentColor`) and the timestamps
			 * (`text-foreground`) are all semantic tokens that follow the page on their own.
			 */
			"relative isolate flex size-full flex-col overflow-hidden rounded-lg outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-disabled:pointer-events-none data-disabled:opacity-50 [&_video]:relative [&_video]:object-contain",
			"in-[:fullscreen]:flex in-[:fullscreen]:h-full in-[:fullscreen]:max-h-screen in-[:fullscreen]:flex-col in-[:fullscreen]:justify-between data-[state=fullscreen]:[&_video]:size-full",
			"**:data-slider:relative [&_[data-slider]::before]:absolute [&_[data-slider]::before]:inset-x-0 [&_[data-slider]::before]:-top-4 [&_[data-slider]::before]:-bottom-2 [&_[data-slider]::before]:z-10 [&_[data-slider]::before]:h-8 [&_[data-slider]::before]:cursor-pointer [&_[data-slider]::before]:content-[''] [&_[data-slot='media-player-seek']:not([data-hovering])::before]:cursor-default",
			"[&_video::-webkit-media-text-track-display]:top-auto! [&_video::-webkit-media-text-track-display]:bottom-[4%]! [&_video::-webkit-media-text-track-display]:mb-0! data-controls-visible:[&_video::-webkit-media-text-track-display]:bottom-[13%]! data-[state=fullscreen]:[&_video::-webkit-media-text-track-display]:bottom-[7%]! data-[state=fullscreen]:data-controls-visible:[&_video::-webkit-media-text-track-display]:bottom-[9%]!",
			className,
		),
	} as MediaPlayerChildProps);
</script>

<!--
	The label and description are what `aria-labelledby` / `aria-describedby` resolve to on the root
	*and* on the media element. The description spells out the shortcut set, which differs between
	video and audio because `←`/`→` need `Shift` on audio.
-->
{#snippet announcements()}
	<span id={root.labelId} class="sr-only">{label}</span>
	<span id={root.descriptionId} class="sr-only">
		{root.isVideo
			? "Video player with custom controls for playback, volume, seeking, and more. Use space bar to play/pause, arrow keys (←/→) to seek, and arrow keys (↑/↓) to adjust volume."
			: "Audio player with custom controls for playback, volume, seeking, and more. Use space bar to play/pause, Shift + arrow keys (←/→) to seek, and arrow keys (↑/↓) to adjust volume."}
	</span>
{/snippet}

<Tooltip.Provider delayDuration={tooltipDelayDuration}>
	{#if child}
		{@render child({ props: rootAttrs })}
		{@render announcements()}
	{:else}
		<div bind:this={ref} {...rootAttrs}>
			{@render announcements()}
			{@render children?.()}
			<!--
				Upstream renders a volume indicator unconditionally, so a tree that mounts its own ends
				up with two `role="status" aria-live="polite"` regions announcing the same value. The
				root only fills the gap when nothing else does.
			-->
			{#if root.volumeIndicatorCount === 0}
				<MediaPlayerVolumeIndicator auto />
			{/if}
		</div>
	{/if}
</Tooltip.Provider>
