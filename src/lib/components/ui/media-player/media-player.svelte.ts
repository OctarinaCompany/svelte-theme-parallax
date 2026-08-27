import { getContext, hasContext, setContext, untrack } from "svelte";

import type { Direction } from "$lib/components/ui/direction-provider/index.js";

/** `'ltr' | 'rtl'` — the reading direction of the player chrome. */
export type MediaPlayerDirection = Direction;

/** Upstream's `mediaVolumeLevel`: `off` while muted or silent, `high` from 50 % up, `low` below. */
export type MediaPlayerVolumeLevel = "off" | "low" | "high";

/** Which clock `<MediaPlayer.Time>` renders. */
export type MediaPlayerTimeVariant = "progress" | "remaining" | "duration";

/** Which clock the seek hover tooltip renders. */
export type MediaPlayerSeekTooltipTimeVariant = "current" | "progress";

/** Which Picture-in-Picture transition failed. */
export type MediaPlayerPipErrorState = "enter" | "exit";

/** A named time range parsed from a `kind="chapters"` text track. */
export type MediaPlayerChapterCue = { startTime: number; endTime: number; text: string };

/**
 * A caller-supplied playback-quality option. Upstream reads these from
 * `media-chrome`'s `mediaRenditionList`, which only ever populates behind an adaptive-bitrate
 * engine; here the list is an input so the Quality submenu is reachable.
 */
export type MediaPlayerRendition = { id: string; width?: number; height?: number };

/** The subset of `TextTrack` the player reads and writes, plus the live track itself. */
export type MediaPlayerTextTrack = {
	id: string;
	kind: TextTrackKind;
	label: string;
	language: string;
	mode: TextTrackMode;
	track: TextTrack;
};

/** How far the seek hover tooltip must stay from each edge of its collision boundary. */
export type MediaPlayerCollisionPadding =
	number | Partial<Record<"top" | "right" | "bottom" | "left", number>>;

/** A contiguous buffered or seekable span, in seconds. */
export type MediaPlayerTimeRange = { start: number; end: number };

/** The nine notifications `<MediaPlayer>` forwards from the media element and the document. */
export type MediaPlayerCallbacks = {
	onPlay?: () => void;
	onPause?: () => void;
	onEnded?: () => void;
	onTimeUpdate?: (time: number) => void;
	onVolumeChange?: (volume: number) => void;
	onMuted?: (muted: boolean) => void;
	onMediaError?: (error: MediaError | null) => void;
	onPipError?: (error: unknown, state: MediaPlayerPipErrorState) => void;
	onFullscreenChange?: (fullscreen: boolean) => void;
};

/** Upstream `SPEEDS`. */
export const MEDIA_PLAYER_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

/** Seconds `ArrowLeft` / `ArrowRight` and `<MediaPlayer.SeekBackward>` move by. */
export const SEEK_STEP_SHORT = 5;

/** Seconds `J` / `L` and `<MediaPlayer.SeekForward>` move by. */
export const SEEK_STEP_LONG = 10;

/** Default `sideOffset` for the speed and settings menus. */
export const FLOATING_MENU_SIDE_OFFSET = 10;

/** Default `tooltipCollisionPadding` for the seek hover tooltip. */
export const SEEK_COLLISION_PADDING = 10;

/** Width the seek tooltip is assumed to have before it has been measured. */
export const SEEK_TOOLTIP_WIDTH_FALLBACK = 240;

/** How long the controls stay up after the last pointer move while `autoHide` is set. */
export const CONTROLS_HIDE_DELAY = 3000;

/** How long the transient volume HUD stays up after a keyboard volume change. */
export const VOLUME_INDICATOR_DELAY = 2000;

/** Default `delay` of `<MediaPlayer.Loading>`. */
export const LOADING_DELAY = 500;

/** Custom property carrying the hovered fraction of the seek track. */
export const SEEK_HOVER_PERCENT = "--seek-hover-percent";

/** Custom property carrying the seek tooltip's clamped viewport X. */
export const SEEK_TOOLTIP_X = "--seek-tooltip-x";

/** Custom property carrying the seek tooltip's viewport Y. */
export const SEEK_TOOLTIP_Y = "--seek-tooltip-y";

/** Which parts announce themselves to the root so it can stop duplicating them. */
export type MediaPlayerPartKind = "volume-indicator" | "download";

export type MediaPlayerStateProps = {
	readonly getDir: () => MediaPlayerDirection;
	readonly getLabel: () => string;
	readonly getDisabled: () => boolean;
	readonly getAutoHide: () => boolean;
	readonly getWithoutTooltip: () => boolean;
	readonly getTooltipDelayDuration: () => number;
	readonly getTooltipSideOffset: () => number;
	readonly getCallbacks: () => MediaPlayerCallbacks;
	/** `$props.id()`-derived ids, minted once by the root. */
	readonly mediaId: string;
	readonly labelId: string;
	readonly descriptionId: string;
};

/** Events after which the scalar mirror is refreshed from the element. */
const SCALAR_EVENTS = [
	"loadedmetadata",
	"loadeddata",
	"durationchange",
	"timeupdate",
	"volumechange",
	"ratechange",
	"play",
	"pause",
	"playing",
	"ended",
	"seeking",
	"seeked",
	"canplay",
	"waiting",
	"stalled",
	"emptied",
	"loadstart",
	"error",
] as const;

/** Events after which the buffered / seekable mirror is rebuilt. */
const RANGE_EVENTS = [
	"loadedmetadata",
	"durationchange",
	"progress",
	"canplay",
	"seeked",
	"ended",
	"emptied",
	"loadstart",
] as const;

function toRanges(ranges: TimeRanges | null | undefined): MediaPlayerTimeRange[] {
	if (!ranges) return [];
	const out: MediaPlayerTimeRange[] = [];
	for (let index = 0; index < ranges.length; index += 1) {
		out.push({ start: ranges.start(index), end: ranges.end(index) });
	}
	return out;
}

/** `TextTrackCue` does not declare `text`; only `VTTCue` does, and jsdom may not expose the class. */
function cueText(cue: TextTrackCue): string {
	return "text" in cue && typeof cue.text === "string" ? cue.text : "";
}

const SUBTITLE_KINDS: TextTrackKind[] = ["subtitles", "captions"];

/**
 * One instance per `<MediaPlayer>`, published on context under a `Symbol` key.
 *
 * Collapses upstream's two React contexts — the `useSyncExternalStore` `Store` for ephemeral UI
 * state and `MediaPlayerContext` for ids, refs and config — into a single rune class.
 *
 * The data flow is deliberately one-way, matching upstream: the element's own events are the only
 * thing that writes this state, through the listeners {@link attachMedia} and {@link attachRoot}
 * install, and every mutator writes the element imperatively. `<MediaPlayer.Video>` and
 * `<MediaPlayer.Audio>` must therefore carry **no** `bind:` media properties — Svelte's media
 * bindings are two-way, so pairing them with these listeners makes each `timeupdate` write
 * `currentTime` back onto the element, and assigning `currentTime` is a seek. Both return the
 * teardown their caller's `$effect` must run.
 */
export class MediaPlayerState {
	// $derived below is lazy at runtime (evaluated only when read), but svelte-check's static
	// analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: MediaPlayerStateProps;

	/** The player root. Written by `<MediaPlayer>` through `bind:this`. */
	rootEl = $state<HTMLElement | null>(null);
	/** The media element. Written by `<MediaPlayer.Video>` / `<MediaPlayer.Audio>`. */
	mediaEl = $state<HTMLVideoElement | HTMLAudioElement | null>(null);
	/** `false` until the root's first `$effect` runs, so the portal target stays SSR-safe. */
	mounted = $state(false);

	paused = $state(true);
	currentTime = $state(0);
	duration = $state(Number.NaN);
	volume = $state(1);
	muted = $state(false);
	playbackRate = $state(1);
	buffered = $state<MediaPlayerTimeRange[]>([]);
	seekable = $state<MediaPlayerTimeRange[]>([]);
	ended = $state(false);
	readyState = $state(0);
	seeking = $state(false);

	loop = $state(false);
	loading = $state(false);
	hasPlayed = $state(false);
	error = $state<MediaError | null>(null);
	fullscreen = $state(false);
	pip = $state(false);
	textTracks = $state<MediaPlayerTextTrack[]>([]);

	controlsVisible = $state(true);
	dragging = $state(false);
	menuOpen = $state(false);
	volumeIndicatorVisible = $state(false);

	volumeIndicatorCount = $state(0);
	downloadCount = $state(0);

	#hideControlsTimer: ReturnType<typeof setTimeout> | null = null;
	#volumeIndicatorTimer: ReturnType<typeof setTimeout> | null = null;
	#lastSubtitleTrackId: string | null = null;
	#observedTracks: TextTrack[] = [];
	/** Stable identity so the per-track listener can be removed again. */
	#onCueChange = () => this.#syncTextTracks();

	readonly dir: MediaPlayerDirection = $derived(this.#props.getDir());
	readonly label: string = $derived(this.#props.getLabel());
	readonly disabled: boolean = $derived(this.#props.getDisabled());
	readonly autoHide: boolean = $derived(this.#props.getAutoHide());
	readonly withoutTooltip: boolean = $derived(this.#props.getWithoutTooltip());
	readonly tooltipDelayDuration: number = $derived(this.#props.getTooltipDelayDuration());
	readonly tooltipSideOffset: number = $derived(this.#props.getTooltipSideOffset());

	readonly isVideo: boolean = $derived(
		typeof HTMLVideoElement !== "undefined" && this.mediaEl instanceof HTMLVideoElement,
	);

	readonly seekableStart: number = $derived(this.seekable[0]?.start ?? 0);

	readonly seekableEnd: number = $derived(
		this.seekable.at(-1)?.end ?? (Number.isFinite(this.duration) ? this.duration : 0),
	);

	readonly volumeLevel: MediaPlayerVolumeLevel = $derived(
		this.muted || this.volume === 0 ? "off" : this.volume >= 0.5 ? "high" : "low",
	);

	/** Upstream's `bufferedProgress` memo, as a `0…1` fraction. */
	readonly bufferedProgress: number = $derived.by(() => {
		const end = this.seekableEnd;
		if (this.buffered.length === 0 || end <= 0) return 0;
		if (this.ended) return 1;

		const containing = this.buffered.find(
			(range) => range.start <= this.currentTime && this.currentTime <= range.end,
		);
		if (containing) return Math.min(1, containing.end / end);

		return Math.min(1, this.seekableStart / end);
	});

	readonly chapterCues: MediaPlayerChapterCue[] = $derived.by(() => {
		const chapters = this.textTracks.find((entry) => entry.kind === "chapters");
		if (!chapters) return [];

		return Array.from(chapters.track.cues ?? []).map((cue) => ({
			startTime: cue.startTime,
			endTime: cue.endTime,
			text: cueText(cue),
		}));
	});

	readonly subtitleTracks: MediaPlayerTextTrack[] = $derived(
		this.textTracks.filter((entry) => SUBTITLE_KINDS.includes(entry.kind)),
	);

	readonly showingSubtitles: MediaPlayerTextTrack[] = $derived(
		this.subtitleTracks.filter((entry) => entry.mode === "showing"),
	);

	readonly captionsActive: boolean = $derived(this.showingSubtitles.length > 0);

	/**
	 * Where floating surfaces are portalled: the root while fullscreen (so they stay inside the
	 * fullscreen element and remain visible), `document.body` otherwise.
	 */
	readonly portalContainer: Element | null = $derived(
		this.mounted ? (this.fullscreen ? this.rootEl : globalThis.document?.body) : null,
	);

	get mediaId(): string {
		return this.#props.mediaId;
	}

	get labelId(): string {
		return this.#props.labelId;
	}

	get descriptionId(): string {
		return this.#props.descriptionId;
	}

	constructor(props: MediaPlayerStateProps) {
		this.#props = props;
	}

	// -------------------------------------------------------------------------
	// Element mirroring
	// -------------------------------------------------------------------------

	/**
	 * Mirror everything Svelte's media bindings do not reach and forward the root's callbacks.
	 * Called from the media part's `$effect`; the returned teardown removes every listener and
	 * disconnects the `loop` observer.
	 */
	attachMedia(): () => void {
		const element = this.mediaEl;
		if (!element) return () => {};

		const callbacks = () => this.#props.getCallbacks();

		const syncScalars = () => {
			this.paused = element.paused;
			this.currentTime = element.currentTime;
			this.duration = element.duration;
			this.volume = element.volume;
			this.muted = element.muted;
			this.playbackRate = element.playbackRate;
			this.ended = element.ended;
			this.readyState = element.readyState;
			this.seeking = element.seeking;
			this.loop = element.loop;
		};

		const syncRanges = () => {
			this.buffered = toRanges(element.buffered);
			this.seekable = toRanges(element.seekable);
		};

		const syncTracks = () => this.#syncTextTracks();

		const onPlay = () => callbacks().onPlay?.();
		const onPause = () => callbacks().onPause?.();
		const onEnded = () => callbacks().onEnded?.();
		const onTimeUpdate = () => callbacks().onTimeUpdate?.(element.currentTime);
		const onVolumeChange = () => {
			callbacks().onVolumeChange?.(element.volume);
			callbacks().onMuted?.(element.muted);
		};
		const onLoadingStart = () => {
			this.loading = true;
		};
		const onLoadingEnd = () => {
			this.loading = false;
		};
		const onPlaying = () => {
			this.hasPlayed = true;
			this.loading = false;
		};
		const onError = () => {
			this.loading = false;
			this.error = element.error;
			callbacks().onMediaError?.(element.error);
		};
		const onErrorCleared = () => {
			this.error = null;
		};
		const onEnterPip = () => {
			this.pip = true;
		};
		const onLeavePip = () => {
			this.pip = false;
		};

		for (const type of SCALAR_EVENTS) element.addEventListener(type, syncScalars);
		for (const type of RANGE_EVENTS) element.addEventListener(type, syncRanges);

		element.addEventListener("play", onPlay);
		element.addEventListener("pause", onPause);
		element.addEventListener("ended", onEnded);
		element.addEventListener("timeupdate", onTimeUpdate);
		element.addEventListener("volumechange", onVolumeChange);
		element.addEventListener("waiting", onLoadingStart);
		element.addEventListener("stalled", onLoadingStart);
		element.addEventListener("playing", onPlaying);
		element.addEventListener("canplay", onLoadingEnd);
		element.addEventListener("seeked", onLoadingEnd);
		element.addEventListener("error", onError);
		element.addEventListener("emptied", onErrorCleared);
		element.addEventListener("loadstart", onErrorCleared);
		element.addEventListener("enterpictureinpicture", onEnterPip);
		element.addEventListener("leavepictureinpicture", onLeavePip);
		// `<track>` `load` events do not bubble, so the capture phase is the only way to hear a
		// chapter or caption file finishing parsing without a listener per track element.
		element.addEventListener("load", syncTracks, true);

		// jsdom ships a `TextTrackList` that is not an `EventTarget`, so the list events are
		// feature-detected rather than assumed.
		const trackList: TextTrackList | null =
			typeof element.textTracks?.addEventListener === "function" ? element.textTracks : null;

		trackList?.addEventListener("addtrack", syncTracks);
		trackList?.addEventListener("removetrack", syncTracks);
		trackList?.addEventListener("change", syncTracks);

		// `loop` has no Svelte binding. The observer only hears content-attribute flips
		// (`setAttribute` / `removeAttribute`); writes to the IDL property (`element.loop = x`) do
		// not reflect to the attribute and are picked up by `syncScalars` on the next media event
		// instead, so external property flips should go through `toggleLoop()` to stay in sync.
		const observer =
			typeof MutationObserver === "undefined"
				? null
				: new MutationObserver(() => {
						this.loop = element.loop;
					});
		observer?.observe(element, { attributes: true, attributeFilter: ["loop"] });

		syncScalars();
		syncRanges();
		syncTracks();
		this.error = element.error;

		return () => {
			for (const type of SCALAR_EVENTS) element.removeEventListener(type, syncScalars);
			for (const type of RANGE_EVENTS) element.removeEventListener(type, syncRanges);

			element.removeEventListener("play", onPlay);
			element.removeEventListener("pause", onPause);
			element.removeEventListener("ended", onEnded);
			element.removeEventListener("timeupdate", onTimeUpdate);
			element.removeEventListener("volumechange", onVolumeChange);
			element.removeEventListener("waiting", onLoadingStart);
			element.removeEventListener("stalled", onLoadingStart);
			element.removeEventListener("playing", onPlaying);
			element.removeEventListener("canplay", onLoadingEnd);
			element.removeEventListener("seeked", onLoadingEnd);
			element.removeEventListener("error", onError);
			element.removeEventListener("emptied", onErrorCleared);
			element.removeEventListener("loadstart", onErrorCleared);
			element.removeEventListener("enterpictureinpicture", onEnterPip);
			element.removeEventListener("leavepictureinpicture", onLeavePip);
			element.removeEventListener("load", syncTracks, true);

			trackList?.removeEventListener("addtrack", syncTracks);
			trackList?.removeEventListener("removetrack", syncTracks);
			trackList?.removeEventListener("change", syncTracks);

			for (const track of this.#observedTracks) {
				track.removeEventListener("cuechange", this.#onCueChange);
			}
			this.#observedTracks = [];

			observer?.disconnect();
		};
	}

	/**
	 * Track the Fullscreen API for the root element. Called from `<MediaPlayer>`'s `$effect`; the
	 * returned teardown removes the document listener and clears both auto-hide timers.
	 */
	attachRoot(): () => void {
		this.mounted = true;

		const onFullscreenChange = () => {
			// Scoped to this player, like `data-state`: an unrelated element (or another player)
			// toggling fullscreen must not notify, so the callback fires only on a real change.
			const next = document.fullscreenElement === this.rootEl;
			if (next !== this.fullscreen) {
				this.fullscreen = next;
				this.#props.getCallbacks().onFullscreenChange?.(next);
			}
		};

		document.addEventListener("fullscreenchange", onFullscreenChange);

		return () => {
			document.removeEventListener("fullscreenchange", onFullscreenChange);
			this.#clearHideControlsTimer();
			this.#clearVolumeIndicatorTimer();
			this.mounted = false;
		};
	}

	#syncTextTracks() {
		const element = this.mediaEl;
		if (!element) {
			this.textTracks = [];
			return;
		}

		const list = element.textTracks;
		const next: MediaPlayerTextTrack[] = [];

		for (let index = 0; index < (list?.length ?? 0); index += 1) {
			const track = list[index];
			if (!track) continue;

			const observable: TextTrack | null =
				typeof track.addEventListener === "function" ? track : null;

			// A `disabled` track is never parsed, so its cues would stay empty; chapters and
			// thumbnail metadata have to be `hidden` — parsed but not painted.
			if ((track.kind === "chapters" || track.kind === "metadata") && track.mode === "disabled") {
				track.mode = "hidden";
			}

			if (observable && !this.#observedTracks.includes(track)) {
				this.#observedTracks.push(track);
				observable.addEventListener("cuechange", this.#onCueChange);
			}

			next.push({
				id: track.id,
				kind: track.kind,
				label: track.label,
				language: track.language,
				mode: track.mode,
				track,
			});
		}

		this.textTracks = next;
	}

	/**
	 * Count a mounted `<MediaPlayer.VolumeIndicator>` or `<MediaPlayer.Download>` so the root can
	 * stop rendering a duplicate live region and the `D` shortcut only fires when a download button
	 * exists. The increment is untracked: it is written from a caller's `$effect`,
	 * and a tracked write to state that sibling effects read would self-invalidate them.
	 */
	registerPart(kind: MediaPlayerPartKind): () => void {
		untrack(() => {
			if (kind === "volume-indicator") this.volumeIndicatorCount += 1;
			else this.downloadCount += 1;
		});

		return () => {
			untrack(() => {
				if (kind === "volume-indicator") this.volumeIndicatorCount -= 1;
				else this.downloadCount -= 1;
			});
		};
	}

	// -------------------------------------------------------------------------
	// Transport
	// -------------------------------------------------------------------------

	togglePlay() {
		const element = this.mediaEl;
		if (!element || this.disabled) return;

		if (element.paused) {
			// A rejected `play()` (autoplay policy, no source) is not an application error.
			Promise.resolve(element.play()).catch(() => {});
		} else {
			element.pause();
		}
	}

	seekTo(time: number) {
		const element = this.mediaEl;
		if (!element) return;

		const end = this.seekableEnd;
		if (!(end > 0)) return;

		const next = Math.min(Math.max(0, time), end);
		element.currentTime = next;
		this.currentTime = next;
	}

	seekBy(delta: number) {
		const element = this.mediaEl;
		this.seekTo((element?.currentTime ?? this.currentTime) + delta);
	}

	seekToPercent(percent: number) {
		this.seekTo(this.seekableEnd * percent);
	}

	setVolume(volume: number) {
		const element = this.mediaEl;
		if (!element) return;

		const next = Math.min(1, Math.max(0, volume));
		element.volume = next;
		this.volume = next;
	}

	toggleMute() {
		const element = this.mediaEl;
		if (!element) return;

		element.muted = !element.muted;
		this.muted = element.muted;
	}

	toggleLoop() {
		const element = this.mediaEl;
		if (!element) return;

		element.loop = !element.loop;
		this.loop = element.loop;
	}

	setPlaybackRate(rate: number) {
		const element = this.mediaEl;
		if (!element) return;

		element.playbackRate = rate;
		this.playbackRate = rate;
	}

	/**
	 * Move one entry through `speeds`, clamped at both ends. A rate absent from the list resolves to
	 * `speeds[0]` in either direction — upstream's `indexOf` behaviour.
	 */
	stepPlaybackRate(direction: -1 | 1, speeds: number[] = MEDIA_PLAYER_SPEEDS) {
		const element = this.mediaEl;
		if (!element) return;

		const index = speeds.indexOf(element.playbackRate);
		const nextIndex =
			direction < 0 ? Math.max(0, index - 1) : Math.min(speeds.length - 1, index + 1);

		this.setPlaybackRate(speeds[nextIndex] ?? 1);
	}

	// -------------------------------------------------------------------------
	// Captions
	// -------------------------------------------------------------------------

	toggleCaptions() {
		if (this.subtitleTracks.length === 0) return;

		if (this.captionsActive) {
			this.hideSubtitles();
			return;
		}

		const remembered = this.subtitleTracks.find((entry) => entry.id === this.#lastSubtitleTrackId);
		const next = remembered ?? this.subtitleTracks[0];
		if (next) this.showSubtitleTrack(next);
	}

	showSubtitleTrack(track: MediaPlayerTextTrack) {
		for (const entry of this.subtitleTracks) {
			entry.track.mode = entry.track === track.track ? "showing" : "disabled";
		}
		this.#lastSubtitleTrackId = track.id;
		this.#syncTextTracks();
	}

	hideSubtitles() {
		for (const entry of this.subtitleTracks) {
			if (entry.track.mode === "showing") this.#lastSubtitleTrackId = entry.id;
			entry.track.mode = "disabled";
		}
		this.#syncTextTracks();
	}

	// -------------------------------------------------------------------------
	// Fullscreen, Picture-in-Picture, download
	// -------------------------------------------------------------------------

	async toggleFullscreen() {
		const root = this.rootEl;
		if (!root) return;

		try {
			if (document.fullscreenElement) await document.exitFullscreen();
			else await root.requestFullscreen();
		} catch {
			// A refused or unsupported transition leaves `data-state="windowed"`.
		}
	}

	async togglePip(onPipError?: MediaPlayerCallbacks["onPipError"]) {
		const element = this.mediaEl;
		if (!this.isVideo || !element || !("requestPictureInPicture" in element)) return;

		const report = onPipError ?? this.#props.getCallbacks().onPipError;
		const video = element as HTMLVideoElement;

		if (document.pictureInPictureElement === video) {
			try {
				await document.exitPictureInPicture();
			} catch (error) {
				report?.(error, "exit");
			}
			return;
		}

		try {
			await video.requestPictureInPicture();
		} catch (error) {
			report?.(error, "enter");
		}
	}

	download() {
		const source = this.mediaEl?.currentSrc;
		if (!source) return;

		const link = document.createElement("a");
		link.href = source;
		link.download = "";
		document.body.appendChild(link);
		link.click();
		link.remove();
	}

	retry() {
		this.mediaEl?.load();
	}

	// -------------------------------------------------------------------------
	// Auto-hide and the volume HUD
	// -------------------------------------------------------------------------

	#clearHideControlsTimer() {
		if (this.#hideControlsTimer === null) return;
		clearTimeout(this.#hideControlsTimer);
		this.#hideControlsTimer = null;
	}

	#clearVolumeIndicatorTimer() {
		if (this.#volumeIndicatorTimer === null) return;
		clearTimeout(this.#volumeIndicatorTimer);
		this.#volumeIndicatorTimer = null;
	}

	/** True while the controls must stay up regardless of the idle timer (data-model §1.5). */
	get controlsPinned(): boolean {
		return this.paused || this.menuOpen || this.dragging;
	}

	showControls() {
		this.controlsVisible = true;
		this.#clearHideControlsTimer();

		if (!this.autoHide || this.controlsPinned) return;

		this.#hideControlsTimer = setTimeout(() => {
			this.#hideControlsTimer = null;
			this.controlsVisible = false;
		}, CONTROLS_HIDE_DELAY);
	}

	hideControls() {
		this.#clearHideControlsTimer();
		if (!this.autoHide || this.controlsPinned) return;
		this.controlsVisible = false;
	}

	flashVolumeIndicator() {
		if (this.menuOpen) return;

		this.volumeIndicatorVisible = true;
		this.#clearVolumeIndicatorTimer();

		this.#volumeIndicatorTimer = setTimeout(() => {
			this.#volumeIndicatorTimer = null;
			this.volumeIndicatorVisible = false;
		}, VOLUME_INDICATOR_DELAY);

		if (this.autoHide) this.showControls();
	}

	/** Stops every timer this class owns. The root's `$effect` teardown calls it. */
	destroy() {
		this.#clearHideControlsTimer();
		this.#clearVolumeIndicatorTimer();
	}

	// -------------------------------------------------------------------------
	// Keyboard
	// -------------------------------------------------------------------------

	/** True while the root or the media element owns focus — upstream's guard, tightened for `null`. */
	#isFocused(): boolean {
		const element = this.mediaEl;
		const active = document.activeElement;
		if (active === element) return true;
		return (active?.closest('[data-slot="media-player"]') ?? null) !== null;
	}

	onRootKeydown(event: KeyboardEvent) {
		if (this.disabled) return;

		const element = this.mediaEl;
		if (!element) return;
		if (!this.#isFocused()) return;

		if (this.autoHide) this.showControls();

		const isVideo = this.isVideo;
		const currentTime = element.currentTime;

		switch (event.key.toLowerCase()) {
			case " ":
			case "k":
				event.preventDefault();
				this.togglePlay();
				break;

			case "f":
				event.preventDefault();
				void this.toggleFullscreen();
				break;

			case "escape":
				// Browsers exit fullscreen on `Escape` themselves; the explicit call keeps the
				// shortcut working for the programmatic path and is inert otherwise.
				if (!this.fullscreen) break;
				event.preventDefault();
				void this.toggleFullscreen();
				break;

			case "m":
				event.preventDefault();
				if (isVideo) this.flashVolumeIndicator();
				this.toggleMute();
				break;

			case "arrowright":
				event.preventDefault();
				if (isVideo || event.shiftKey) this.seekTo(currentTime + SEEK_STEP_SHORT);
				break;

			case "arrowleft":
				event.preventDefault();
				if (isVideo || event.shiftKey) this.seekTo(currentTime - SEEK_STEP_SHORT);
				break;

			case "arrowup":
				event.preventDefault();
				// Volume is as meaningful for audio as for video — the description announces the
				// keys for both, so only the visual HUD stays video-scoped, like `m` above.
				if (isVideo) this.flashVolumeIndicator();
				this.setVolume(element.volume + 0.1);
				break;

			case "arrowdown":
				event.preventDefault();
				if (isVideo) this.flashVolumeIndicator();
				this.setVolume(element.volume - 0.1);
				break;

			case "<":
				event.preventDefault();
				this.stepPlaybackRate(-1);
				break;

			case ">":
				event.preventDefault();
				this.stepPlaybackRate(1);
				break;

			case "c":
				event.preventDefault();
				if (isVideo && element.textTracks.length > 0) this.toggleCaptions();
				break;

			case "d":
				// The shortcut is owned by a mounted `<MediaPlayer.Download>`.
				if (this.downloadCount === 0) break;
				event.preventDefault();
				this.download();
				break;

			case "p":
				event.preventDefault();
				if (isVideo && "requestPictureInPicture" in element) void this.togglePip();
				break;

			case "r":
				event.preventDefault();
				this.toggleLoop();
				break;

			case "j":
				event.preventDefault();
				this.seekTo(currentTime - SEEK_STEP_LONG);
				break;

			case "l":
				event.preventDefault();
				this.seekTo(currentTime + SEEK_STEP_LONG);
				break;

			case "0":
			case "1":
			case "2":
			case "3":
			case "4":
			case "5":
			case "6":
			case "7":
			case "8":
			case "9":
				event.preventDefault();
				this.seekToPercent(Number.parseInt(event.key, 10) / 10);
				break;

			case "home":
				event.preventDefault();
				this.seekTo(0);
				break;

			case "end":
				event.preventDefault();
				this.seekTo(this.seekableEnd);
				break;
		}
	}

	onRootKeyup(event: KeyboardEvent) {
		// The HUD reports a *visual* volume change, so it belongs to video only, exactly like the
		// keydown branch that performs the change.
		if (this.disabled || !this.isVideo) return;

		const key = event.key.toLowerCase();
		if (key === "arrowup" || key === "arrowdown" || key === "m") this.flashVolumeIndicator();
	}
}

const MEDIA_PLAYER_CONTEXT_KEY = Symbol("media-player");

export function setMediaPlayerContext(state: MediaPlayerState): MediaPlayerState {
	return setContext(MEDIA_PLAYER_CONTEXT_KEY, state);
}

/**
 * Read the player state every non-root part depends on.
 *
 * @param consumerName The part asking, spelt as it appears in markup, e.g. `<MediaPlayer.Seek>`.
 * @throws when the part is rendered outside `<MediaPlayer>`.
 */
export function getMediaPlayerContext(consumerName: string): MediaPlayerState {
	if (!hasContext(MEDIA_PLAYER_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`<MediaPlayer>\`.`);
	}
	return getContext<MediaPlayerState>(MEDIA_PLAYER_CONTEXT_KEY);
}
