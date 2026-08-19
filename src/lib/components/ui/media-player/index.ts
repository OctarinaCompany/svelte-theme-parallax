import Root from "./media-player.svelte";
import Video from "./media-player-video.svelte";
import Audio from "./media-player-audio.svelte";
import Controls from "./media-player-controls.svelte";
import ControlsOverlay from "./media-player-controls-overlay.svelte";
import Loading from "./media-player-loading.svelte";
import ErrorPart from "./media-player-error.svelte";
import VolumeIndicator from "./media-player-volume-indicator.svelte";
import Play from "./media-player-play.svelte";
import SeekBackward from "./media-player-seek-backward.svelte";
import SeekForward from "./media-player-seek-forward.svelte";
import Seek from "./media-player-seek.svelte";
import Volume from "./media-player-volume.svelte";
import Time from "./media-player-time.svelte";
import PlaybackSpeed from "./media-player-playback-speed.svelte";
import Loop from "./media-player-loop.svelte";
import Fullscreen from "./media-player-fullscreen.svelte";
import PiP from "./media-player-pip.svelte";
import Captions from "./media-player-captions.svelte";
import Download from "./media-player-download.svelte";
import Settings from "./media-player-settings.svelte";
import Portal from "./media-player-portal.svelte";
import Tooltip from "./media-player-tooltip.svelte";

export type {
	MediaPlayerChildProps,
	MediaPlayerProps,
	MediaPlayerRootProps,
} from "./media-player.svelte";
export type {
	MediaPlayerVideoChildProps,
	MediaPlayerVideoProps,
} from "./media-player-video.svelte";
export type {
	MediaPlayerAudioChildProps,
	MediaPlayerAudioProps,
} from "./media-player-audio.svelte";
export type {
	MediaPlayerControlsChildProps,
	MediaPlayerControlsProps,
} from "./media-player-controls.svelte";
export type {
	MediaPlayerControlsOverlayChildProps,
	MediaPlayerControlsOverlayProps,
} from "./media-player-controls-overlay.svelte";
export type {
	MediaPlayerLoadingChildProps,
	MediaPlayerLoadingProps,
} from "./media-player-loading.svelte";
export type {
	MediaPlayerErrorChildProps,
	MediaPlayerErrorProps,
} from "./media-player-error.svelte";
export type {
	MediaPlayerVolumeIndicatorChildProps,
	MediaPlayerVolumeIndicatorProps,
} from "./media-player-volume-indicator.svelte";
export type { MediaPlayerPlayChildProps, MediaPlayerPlayProps } from "./media-player-play.svelte";
export type {
	MediaPlayerSeekBackwardChildProps,
	MediaPlayerSeekBackwardProps,
} from "./media-player-seek-backward.svelte";
export type {
	MediaPlayerSeekForwardChildProps,
	MediaPlayerSeekForwardProps,
} from "./media-player-seek-forward.svelte";
export type { MediaPlayerSeekChildProps, MediaPlayerSeekProps } from "./media-player-seek.svelte";
export type {
	MediaPlayerVolumeChildProps,
	MediaPlayerVolumeProps,
} from "./media-player-volume.svelte";
export type { MediaPlayerTimeChildProps, MediaPlayerTimeProps } from "./media-player-time.svelte";
export type {
	MediaPlayerPlaybackSpeedChildProps,
	MediaPlayerPlaybackSpeedProps,
} from "./media-player-playback-speed.svelte";
export type { MediaPlayerLoopChildProps, MediaPlayerLoopProps } from "./media-player-loop.svelte";
export type {
	MediaPlayerFullscreenChildProps,
	MediaPlayerFullscreenProps,
} from "./media-player-fullscreen.svelte";
export type { MediaPlayerPiPChildProps, MediaPlayerPiPProps } from "./media-player-pip.svelte";
export type {
	MediaPlayerCaptionsChildProps,
	MediaPlayerCaptionsProps,
} from "./media-player-captions.svelte";
export type {
	MediaPlayerDownloadChildProps,
	MediaPlayerDownloadProps,
} from "./media-player-download.svelte";
export type {
	MediaPlayerSettingsChildProps,
	MediaPlayerSettingsProps,
} from "./media-player-settings.svelte";
export type { MediaPlayerPortalProps } from "./media-player-portal.svelte";
export type { MediaPlayerTooltipProps } from "./media-player-tooltip.svelte";

export {
	CONTROLS_HIDE_DELAY,
	FLOATING_MENU_SIDE_OFFSET,
	getMediaPlayerContext,
	LOADING_DELAY,
	MEDIA_PLAYER_SPEEDS,
	MediaPlayerState,
	SEEK_COLLISION_PADDING,
	SEEK_HOVER_PERCENT,
	SEEK_STEP_LONG,
	SEEK_STEP_SHORT,
	SEEK_TOOLTIP_WIDTH_FALLBACK,
	SEEK_TOOLTIP_X,
	SEEK_TOOLTIP_Y,
	setMediaPlayerContext,
	VOLUME_INDICATOR_DELAY,
	type MediaPlayerCallbacks,
	type MediaPlayerChapterCue,
	type MediaPlayerCollisionPadding,
	type MediaPlayerDirection,
	type MediaPlayerPartKind,
	type MediaPlayerPipErrorState,
	type MediaPlayerRendition,
	type MediaPlayerSeekTooltipTimeVariant,
	type MediaPlayerStateProps,
	type MediaPlayerTextTrack,
	type MediaPlayerTimeRange,
	type MediaPlayerTimeVariant,
	type MediaPlayerVolumeLevel,
} from "./media-player.svelte.js";

export { formatTime } from "./time.js";

export {
	Root,
	Video,
	Audio,
	Controls,
	ControlsOverlay,
	Loading,
	ErrorPart as Error,
	VolumeIndicator,
	Play,
	SeekBackward,
	SeekForward,
	Seek,
	Volume,
	Time,
	PlaybackSpeed,
	Loop,
	Fullscreen,
	PiP,
	Captions,
	Download,
	Settings,
	Portal,
	Tooltip,
	//
	Root as MediaPlayer,
	Video as MediaPlayerVideo,
	Audio as MediaPlayerAudio,
	Controls as MediaPlayerControls,
	ControlsOverlay as MediaPlayerControlsOverlay,
	Loading as MediaPlayerLoading,
	ErrorPart as MediaPlayerError,
	VolumeIndicator as MediaPlayerVolumeIndicator,
	Play as MediaPlayerPlay,
	SeekBackward as MediaPlayerSeekBackward,
	SeekForward as MediaPlayerSeekForward,
	Seek as MediaPlayerSeek,
	Volume as MediaPlayerVolume,
	Time as MediaPlayerTime,
	PlaybackSpeed as MediaPlayerPlaybackSpeed,
	Loop as MediaPlayerLoop,
	Fullscreen as MediaPlayerFullscreen,
	PiP as MediaPlayerPiP,
	Captions as MediaPlayerCaptions,
	Download as MediaPlayerDownload,
	Settings as MediaPlayerSettings,
	Portal as MediaPlayerPortal,
	Tooltip as MediaPlayerTooltip,
};
