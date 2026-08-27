<script lang="ts">
	import ListMusicIcon from "@lucide/svelte/icons/list-music";
	import PauseCircleIcon from "@lucide/svelte/icons/pause-circle";
	import PlayCircleIcon from "@lucide/svelte/icons/play-circle";
	import SkipBackIcon from "@lucide/svelte/icons/skip-back";
	import SkipForwardIcon from "@lucide/svelte/icons/skip-forward";
	import { toast } from "svelte-sonner";

	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as MediaPlayer from "$lib/components/ui/media-player/index.js";
	import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
	import { Spinner } from "$lib/components/ui/spinner/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { cn } from "$lib/utils.js";

	/**
	 * The Media player component page.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART, and this is the furthest any component in the batch sits from the
	 * theme: the controls are drawn over video, so they answer to the frame behind them rather than
	 * to the page ground. The overlay keeps its own dark scrim, and the sliders and buttons on it
	 * keep their own contrast, in both light and dark mode. That is deliberate — a control bar that
	 * turned white on the classic theme's light theme would be unreadable over a bright frame.
	 *
	 * Where the player is NOT over video — the audio player, the settings menus — it uses the
	 * theme's popover and button surfaces like everything else.
	 *
	 * THE SAMPLES ARE SELF-HOSTED, in `public/assets`, for the reason upstream self-hosts its own:
	 * a demo whose media 404s teaches nothing, and third-party sample URLs rot.
	 */

	type PropRow = { prop: string; type: string; default: string; description: string };

	// --- Sources ------------------------------------------------------------
	// Upstream self-hosts its two primary samples under `docs/public/assets`, and so do we: a demo
	// whose media 404s teaches nothing, and third-party sample URLs rot. Upstream's own Mux and
	// media-chrome URLs are kept for the chaptered/HLS demos because the credits section names them.
	//
	// Prefixed with Vite's base rather than left root-absolute. This app has no equivalent of
	// SvelteKit's `asset()`, and it is deployed under a subdirectory (`vite.config.ts` sets a
	// build `base`), where a root-absolute `/assets/…` resolves against the domain root rather
	// than the deployed site — on a GitHub Pages project site that is the owner root, and it 404s.
	// `import.meta.env.BASE_URL` has to be spelled exactly like that: Vite substitutes the literal
	// member expression at build time and sees neither an alias nor a `["BASE_URL"]` lookup. It
	// already ends in a slash, so the tail carries none.
	const VIDEO_SRC = `${import.meta.env.BASE_URL}assets/cloud.mp4`;
	const AUDIO_SRC = `${import.meta.env.BASE_URL}assets/lofi.mp3`;
	const CHAPTERED_SRC =
		"https://stream.mux.com/Sc89iWAyNkhJ3P1rQ02nrEdCFTnfT01CZ2KmaEcxXfB008/low.mp4";
	const VTT_BASE = "https://media-chrome.mux.dev/examples/vanilla/vtt/elephantsdream";
	const HLS_SRC = "https://stream.mux.com/A3VXy02VoUinw01pwyomEO3bHnG4P32xzV7u1j1FSzjNg.m3u8";
	const MISSING_SRC = "/media/nonexistent-video.mp4";

	// --- With Settings Menu --------------------------------------------------
	const renditions = [
		{ id: "high", width: 1920, height: 1080 },
		{ id: "medium", width: 1280, height: 720 },
		{ id: "low", width: 854, height: 480 },
	];
	let renditionId = $state<string | undefined>(undefined);

	// --- With Playlist -------------------------------------------------------
	type Track = { id: string; title: string; artist: string; src: string; cover: string };

	const tracks: Track[] = [
		{
			id: "1",
			title: "Lofi",
			artist: "the reference implementation",
			src: AUDIO_SRC,
			cover: "https://picsum.photos/seed/lofi/200/200",
		},
		{
			id: "2",
			title: "Medieval: Battle",
			artist: "RandomMind",
			src: "https://opengameart.org/sites/default/files/battle.mp3",
			cover: "https://picsum.photos/seed/battle/200/200",
		},
	];

	let currentTrackIndex = $state(0);
	let playing = $state(false);
	let loadingTrack = $state(false);
	let audioEl = $state<HTMLAudioElement | null>(null);

	const currentTrack = $derived(tracks[currentTrackIndex] ?? tracks[0]);

	async function playCurrent() {
		if (!audioEl) return;
		try {
			await audioEl.play();
			playing = true;
		} catch (error) {
			playing = false;
			toast.error(error instanceof Error ? error.message : "Failed to play track");
		}
	}

	function selectTrack(index: number) {
		if (index === currentTrackIndex) {
			if (playing) audioEl?.pause();
			else void playCurrent();
			return;
		}

		currentTrackIndex = index;
		loadingTrack = true;
	}

	function previousTrack() {
		selectTrack((currentTrackIndex - 1 + tracks.length) % tracks.length);
	}

	function nextTrack() {
		selectTrack((currentTrackIndex + 1) % tracks.length);
	}

	function onPlaylistKeydown(event: KeyboardEvent) {
		if (event.key.toLowerCase() === "n") {
			event.preventDefault();
			nextTrack();
		} else if (event.key.toLowerCase() === "b") {
			event.preventDefault();
			previousTrack();
		}
	}

	// --- Props reference -----------------------------------------------------
	const sharedNote =
		"Every part also accepts ref, class, child and the rest of its element’s HTML attributes.";

	const rootProps: PropRow[] = [
		{
			prop: "dir",
			type: "'ltr' | 'rtl'",
			default: "provider / DOM / ltr",
			description: "Reading direction of the chrome. Arrow-key seeking stays physical.",
		},
		{ prop: "label", type: "string", default: "'Media player'", description: "Accessible name." },
		{
			prop: "tooltipDelayDuration",
			type: "number",
			default: "600",
			description: "Hover dwell before a control’s tooltip opens.",
		},
		{
			prop: "tooltipSideOffset",
			type: "number",
			default: "10",
			description: "Distance between a control and its tooltip.",
		},
		{
			prop: "autoHide",
			type: "boolean",
			default: "false",
			description: "Fade the controls out after three idle seconds while playing.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "Suppress every pointer and keyboard interaction.",
		},
		{
			prop: "withoutTooltip",
			type: "boolean",
			default: "false",
			description: "Render every control without its tooltip.",
		},
		{
			prop: "onPlay / onPause / onEnded",
			type: "() => void",
			default: "—",
			description: "Forwarded from the media element’s own events.",
		},
		{
			prop: "onTimeUpdate",
			type: "(time: number) => void",
			default: "—",
			description: "Current time, in seconds, on every timeupdate.",
		},
		{
			prop: "onVolumeChange / onMuted",
			type: "(value) => void",
			default: "—",
			description: "Volume and muted state on every volumechange.",
		},
		{
			prop: "onMediaError",
			type: "(error: MediaError | null) => void",
			default: "—",
			description: "The element’s error, when it reports one.",
		},
		{
			prop: "onPipError",
			type: "(error: unknown, state: 'enter' | 'exit') => void",
			default: "—",
			description: "A refused Picture-in-Picture transition.",
		},
		{
			prop: "onFullscreenChange",
			type: "(fullscreen: boolean) => void",
			default: "—",
			description: "Every document fullscreen change.",
		},
	];

	const mediaProps: PropRow[] = [
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "<source> and <track> elements.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description:
				"Render your own element — the props carry an attachment that registers it with the player.",
		},
	];

	const loadingProps: PropRow[] = [
		{
			prop: "delay",
			type: "number",
			default: "500",
			description: "How long a mid-playback stall must last before the spinner appears.",
		},
	];

	const errorProps: PropRow[] = [
		{
			prop: "error",
			type: "MediaError | null",
			default: "the media’s own",
			description: "The error to report.",
		},
		{
			prop: "label",
			type: "string",
			default: "from error.code",
			description: "Headline override.",
		},
		{
			prop: "description",
			type: "string",
			default: "from error.code",
			description: "Supporting sentence override.",
		},
		{
			prop: "onRetry",
			type: "() => void",
			default: "mediaElement.load()",
			description: "What “Try again” does.",
		},
		{
			prop: "onReload",
			type: "() => void",
			default: "location.reload()",
			description: "What “Reload page” does.",
		},
	];

	const buttonProps: PropRow[] = [
		{
			prop: "seconds",
			type: "number",
			default: "5 / 10",
			description: "On SeekBackward and SeekForward: how far a click jumps.",
		},
		{
			prop: "onPipError",
			type: "(error, state) => void",
			default: "—",
			description: "On PiP: a refused transition, in place of the root’s handler.",
		},
		{
			prop: "children",
			type: "Snippet | Snippet<[boolean]>",
			default: "—",
			description: "Replaces the default icon. PiP’s snippet receives the current PiP state.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "the root’s",
			description: "Disables this control alone.",
		},
	];

	const seekProps: PropRow[] = [
		{
			prop: "withTime",
			type: "boolean",
			default: "false",
			description: "Flank the slider with a current and a remaining readout.",
		},
		{
			prop: "withoutChapter",
			type: "boolean",
			default: "false",
			description: "Drop the chapter separators and the chapter title.",
		},
		{
			prop: "withoutTooltip",
			type: "boolean",
			default: "false",
			description: "Drop the hover preview tooltip.",
		},
		{
			prop: "tooltipThumbnailSrc",
			type: "string | ((time: number) => string)",
			default: "—",
			description: "Preview image for the hovered time.",
		},
		{
			prop: "tooltipTimeVariant",
			type: "'current' | 'progress'",
			default: "'current'",
			description: "Hovered time alone, or “hovered / duration”.",
		},
		{
			prop: "tooltipSideOffset",
			type: "number",
			default: "the root’s",
			description: "Distance between the track and the tooltip.",
		},
		{
			prop: "tooltipCollisionBoundary",
			type: "Element | Element[]",
			default: "the player root",
			description: "What the tooltip must stay inside.",
		},
		{
			prop: "tooltipCollisionPadding",
			type: "number | Partial<Record<Side, number>>",
			default: "10",
			description: "How far from each boundary edge it must stay.",
		},
	];

	const volumeProps: PropRow[] = [
		{
			prop: "expandable",
			type: "boolean",
			default: "false",
			description: "Collapse the slider until the control is hovered or holds focus.",
		},
	];

	const timeProps: PropRow[] = [
		{
			prop: "variant",
			type: "'progress' | 'remaining' | 'duration'",
			default: "'progress'",
			description: "Which clock to render.",
		},
	];

	const menuProps: PropRow[] = [
		{
			prop: "open",
			type: "boolean",
			default: "defaultOpen",
			description: "Bindable open state of the menu.",
		},
		{
			prop: "defaultOpen",
			type: "boolean",
			default: "false",
			description: "Initial open state when uncontrolled.",
		},
		{
			prop: "onOpenChange",
			type: "(open: boolean) => void",
			default: "—",
			description: "Fires in both modes.",
		},
		{
			prop: "modal",
			type: "boolean",
			default: "false",
			description: "Whether the menu blocks the page behind it.",
		},
		{
			prop: "sideOffset",
			type: "number",
			default: "10",
			description: "Distance between the trigger and the menu.",
		},
		{
			prop: "speeds",
			type: "number[]",
			default: "[0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]",
			description: "The rates on offer.",
		},
		{
			prop: "renditions",
			type: "MediaPlayerRendition[]",
			default: "[]",
			description: "Settings only: the qualities the Quality submenu offers.",
		},
		{
			prop: "renditionId",
			type: "string | undefined",
			default: "undefined (Auto)",
			description: "Settings only: bindable selected quality.",
		},
		{
			prop: "onRenditionChange",
			type: "(renditionId: string | undefined) => void",
			default: "—",
			description: "Settings only: fires in both modes.",
		},
	];

	const utilityProps: PropRow[] = [
		{
			prop: "container",
			type: "Element | DocumentFragment | null",
			default: "the root while fullscreen, else document.body",
			description: "Portal: where the content is moved to.",
		},
		{
			prop: "tooltip",
			type: "string",
			default: "—",
			description: "Tooltip: the text. With no tooltip and no shortcut the trigger renders bare.",
		},
		{
			prop: "shortcut",
			type: "string | string[]",
			default: "—",
			description: "Tooltip: keyboard shortcut pills beside the text.",
		},
		{
			prop: "delayDuration / sideOffset",
			type: "number",
			default: "the root’s",
			description: "Tooltip: dwell before opening, and distance from the trigger.",
		},
	];

	const dataAttributes = [
		{
			attribute: "data-state",
			on: "Root, Controls, ControlsOverlay, Error",
			when: '"fullscreen" or "windowed".',
		},
		{
			attribute: "data-state",
			on: "Play, Loop, Fullscreen, PiP, Captions, volume trigger",
			when: '"on" or "off".',
		},
		{ attribute: "data-controls-visible", on: "Root", when: "The controls are showing." },
		{
			attribute: "data-visible",
			on: "Controls, ControlsOverlay",
			when: "The controls are showing.",
		},
		{
			attribute: "data-disabled",
			on: "Root and every control",
			when: "The player or the control is disabled.",
		},
		{
			attribute: "data-hovering",
			on: "Seek",
			when: "The pointer is previewing a time on the track.",
		},
		{
			attribute: "data-slider",
			on: "Seek, Volume",
			when: "Always — the shared hit-area recipe keys off it.",
		},
	];

	const keyboard = [
		{ keys: "Space / K", description: "Toggle play and pause." },
		{ keys: "→ / ←", description: "Seek ±5s. On audio, hold Shift." },
		{ keys: "L / J", description: "Seek ±10s, on video and audio alike." },
		{ keys: "0 – 9", description: "Seek to 0 %–90 % of the duration." },
		{ keys: "Home / End", description: "Seek to the start or to the end." },
		{ keys: "↑ / ↓", description: "Volume ±10 % and flash the volume HUD. Video only." },
		{ keys: "M", description: "Toggle mute." },
		{ keys: "R", description: "Toggle loop." },
		{ keys: "F", description: "Toggle fullscreen." },
		{ keys: "Escape", description: "Leave fullscreen, while fullscreen." },
		{ keys: "< / >", description: "Step the playback speed down or up." },
		{ keys: "C", description: "Toggle captions, on a video with at least one text track." },
		{ keys: "P", description: "Toggle Picture-in-Picture, on video." },
		{ keys: "D", description: "Download the current source, while a Download part is mounted." },
	];
</script>

{#snippet propsTable(rows: PropRow[])}
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>Prop</Table.Head>
				<Table.Head>Type</Table.Head>
				<Table.Head>Default</Table.Head>
				<Table.Head>Description</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each rows as row (row.prop)}
				<Table.Row>
					<Table.Cell class="font-medium">{row.prop}</Table.Cell>
					<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
					<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
					<Table.Cell>{row.description}</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
{/snippet}

<DocPage title="Media player">
	{#snippet subtitle()}
		A fully featured media player supporting video and audio playback with custom controls,
		chapters, captions and a complete keyboard shortcut set.
	{/snippet}

	<DocSection title="Default">
		{#snippet blurb()}
			— a video surface, a seek bar and the transport controls.
		{/snippet}
		<Card.Root>
			<Card.Content class="p-0">
				<MediaPlayer.Root class="mx-auto max-w-2xl">
					<MediaPlayer.Video playsinline preload="metadata">
						<source src={VIDEO_SRC} type="video/mp4" />
					</MediaPlayer.Video>
					<MediaPlayer.Controls class="flex-col items-start gap-2.5">
						<MediaPlayer.ControlsOverlay />
						<MediaPlayer.Seek />
						<div class="flex w-full items-center gap-2">
							<div class="flex flex-1 items-center gap-2">
								<MediaPlayer.Play />
								<MediaPlayer.SeekBackward />
								<MediaPlayer.SeekForward />
								<MediaPlayer.Volume expandable />
								<MediaPlayer.Time />
							</div>
							<div class="flex items-center gap-2">
								<MediaPlayer.PlaybackSpeed />
								<MediaPlayer.PiP />
								<MediaPlayer.Fullscreen />
							</div>
						</div>
					</MediaPlayer.Controls>
				</MediaPlayer.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Audio player">
		{#snippet blurb()}
			— the same parts around an &lt;audio&gt; element, with the seek bar carrying its own clocks.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					A player with no picture paints no box of its own, so the demo draws one: the same
					`border` the playlist demo already uses. Video demos need none — the frame is the box.
				-->
				<MediaPlayer.Root class="mx-auto h-20 max-w-xl border">
					<MediaPlayer.Audio class="sr-only" preload="metadata">
						<source src={AUDIO_SRC} type="audio/mpeg" />
					</MediaPlayer.Audio>
					<MediaPlayer.Controls class="flex-col items-start gap-2.5">
						<MediaPlayer.Seek withTime />
						<div class="flex w-full items-center justify-center gap-2">
							<MediaPlayer.SeekBackward />
							<MediaPlayer.Play />
							<MediaPlayer.SeekForward />
							<MediaPlayer.Volume />
							<MediaPlayer.PlaybackSpeed />
							<MediaPlayer.Loop />
						</div>
					</MediaPlayer.Controls>
				</MediaPlayer.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With settings menu">
		{#snippet blurb()}
			— chapters, caption tracks, a settings menu with Speed, Quality and Captions submenus, and
			auto-hiding controls.
		{/snippet}
		<Card.Root>
			<Card.Content class="p-0">
				<MediaPlayer.Root autoHide class="mx-auto max-w-2xl">
					<MediaPlayer.Video src={CHAPTERED_SRC} crossorigin="" muted playsinline>
						<track default kind="chapters" src="{VTT_BASE}/chapters.vtt" />
						<track
							default
							label="English"
							kind="captions"
							srclang="en"
							src="{VTT_BASE}/captions.en.vtt"
						/>
						<track label="Japanese" kind="captions" srclang="ja" src="{VTT_BASE}/captions.ja.vtt" />
						<track label="Swedish" kind="captions" srclang="sv" src="{VTT_BASE}/captions.sv.vtt" />
					</MediaPlayer.Video>
					<MediaPlayer.Loading />
					<MediaPlayer.Error />
					<MediaPlayer.VolumeIndicator />
					<MediaPlayer.Controls class="flex-col items-start gap-2.5">
						<MediaPlayer.ControlsOverlay />
						<MediaPlayer.Seek />
						<div class="flex w-full items-center gap-2">
							<div class="flex flex-1 items-center gap-2">
								<MediaPlayer.Play />
								<MediaPlayer.SeekBackward />
								<MediaPlayer.SeekForward />
								<MediaPlayer.Volume expandable />
								<MediaPlayer.Time />
							</div>
							<div class="flex items-center gap-2">
								<MediaPlayer.Captions />
								<MediaPlayer.Settings {renditions} bind:renditionId />
								<MediaPlayer.PiP />
								<MediaPlayer.Fullscreen />
							</div>
						</div>
					</MediaPlayer.Controls>
				</MediaPlayer.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="HLS playback">
		{#snippet blurb()}
			Upstream reaches for a React wrapper around hls.js; this theme points a plain video at the
			.m3u8 instead, so browsers with native HLS play it and the rest fall through to the player’s
			own error state.
		{/snippet}
		<Card.Root>
			<Card.Content class="p-0">
				<MediaPlayer.Root autoHide class="mx-auto max-w-2xl">
					<MediaPlayer.Video src={HLS_SRC} crossorigin="" muted playsinline />
					<MediaPlayer.Loading />
					<MediaPlayer.Error />
					<MediaPlayer.VolumeIndicator />
					<MediaPlayer.Controls class="flex-col items-start gap-2.5">
						<MediaPlayer.ControlsOverlay />
						<MediaPlayer.Seek />
						<div class="flex w-full items-center gap-2">
							<div class="flex flex-1 items-center gap-2">
								<MediaPlayer.Play />
								<MediaPlayer.SeekBackward />
								<MediaPlayer.SeekForward />
								<MediaPlayer.Volume expandable />
								<MediaPlayer.Time />
							</div>
							<div class="flex items-center gap-2">
								<MediaPlayer.Captions />
								<MediaPlayer.Settings />
								<MediaPlayer.PiP />
								<MediaPlayer.Fullscreen />
							</div>
						</div>
					</MediaPlayer.Controls>
				</MediaPlayer.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With error handling">
		{#snippet blurb()}
			— the video source is deliberately absent, so the player surfaces its error state with “Try
			again” and “Reload page”.
		{/snippet}
		<Card.Root>
			<Card.Content class="p-0">
				<!--
					Bordered for the same reason as the audio demos: this source never loads, so the
					video paints nothing and the error panel would otherwise float on the bare card.

					The height is explicit because a `<video>` that never loads keeps the browser's
					intrinsic 150px, while the error panel's own content is 223px and centres itself
					over the whole box — at 150px it overflowed and collided with the 70px controls
					bar. Centred content clears that bar from 363px up; `h-96` (384px) also lines the
					demo up with the video demos, which land around 375px.
				-->
				<MediaPlayer.Root class="mx-auto h-96 max-w-2xl border">
					<MediaPlayer.Video src={MISSING_SRC} playsinline crossorigin="" />
					<MediaPlayer.Error />
					<MediaPlayer.Controls class="flex-col items-start gap-2.5">
						<MediaPlayer.ControlsOverlay />
						<MediaPlayer.Seek />
						<div class="flex w-full items-center gap-2">
							<div class="flex flex-1 items-center gap-2">
								<MediaPlayer.Play />
								<MediaPlayer.SeekBackward />
								<MediaPlayer.SeekForward />
								<MediaPlayer.Volume expandable />
								<MediaPlayer.Time />
							</div>
							<div class="flex items-center gap-2">
								<MediaPlayer.PlaybackSpeed />
								<MediaPlayer.PiP />
								<MediaPlayer.Fullscreen />
							</div>
						</div>
					</MediaPlayer.Controls>
				</MediaPlayer.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With playlist">
		{#snippet blurb()}
			— the page owns the track list, swaps the source, and advances on ended. B and N step through
			the playlist.
		{/snippet}
		<Card.Root>
			<Card.Content class="p-0">
				<MediaPlayer.Root
					class="mx-auto w-full max-w-2xl overflow-hidden rounded-lg border shadow-lg"
					onPlay={() => (playing = true)}
					onPause={() => (playing = false)}
					onEnded={nextTrack}
					onkeydown={onPlaylistKeydown}
				>
					<MediaPlayer.Audio
						bind:ref={audioEl}
						src={currentTrack?.src}
						class="sr-only"
						oncanplay={() => {
							loadingTrack = false;
						}}
						onloadstart={() => {
							loadingTrack = true;
						}}
						onerror={() => {
							loadingTrack = false;
							playing = false;
							toast.error("Failed to load track");
						}}
					/>
					<div class="flex w-full flex-col items-center gap-4 md:items-start">
						<div class="relative w-full overflow-hidden rounded-md rounded-b-none border-b">
							<img
								src={currentTrack?.cover}
								alt={currentTrack?.title}
								class="h-40 w-full object-cover"
							/>
							<div
								class="absolute inset-0 bg-linear-to-t from-background/80 via-background/20 to-transparent"
							></div>
							<div class="absolute right-0 bottom-0 left-0 p-4">
								<h2 class="text-2xl font-semibold tracking-tight">{currentTrack?.title}</h2>
								<p class="text-sm text-muted-foreground">{currentTrack?.artist}</p>
							</div>
						</div>
						<div class="w-full">
							<div class="flex items-center border-b border-border px-4 pb-4">
								<div class="flex flex-1 items-center gap-2">
									<h3 class="text-lg font-medium tracking-tight">Playlist</h3>
									<ListMusicIcon class="size-4" />
								</div>
								<span class="text-sm text-muted-foreground">
									{currentTrackIndex + 1} / {tracks.length}
								</span>
							</div>
							<ScrollArea class="max-h-[200px]">
								{#each tracks as track, index (track.id)}
									<Button
										variant="ghost"
										class={cn(
											"h-auto w-full justify-start rounded-none px-4 py-3 text-left",
											index === currentTrackIndex && "bg-accent",
										)}
										disabled={loadingTrack}
										onclick={() => selectTrack(index)}
									>
										<img
											src={track.cover}
											alt=""
											class="aspect-square size-9 rounded object-cover"
										/>
										<span class="flex flex-1 flex-col">
											<span
												class={cn(
													"leading-tight font-medium",
													index === currentTrackIndex && "text-primary",
												)}
											>
												{track.title}
											</span>
											<span class="text-sm text-muted-foreground">{track.artist}</span>
										</span>
										{#if index === currentTrackIndex && loadingTrack}
											<Spinner class="size-6" />
										{:else if index === currentTrackIndex && playing}
											<PauseCircleIcon class="size-6 text-primary" />
										{:else}
											<PlayCircleIcon class="size-6 text-muted-foreground" />
										{/if}
									</Button>
								{/each}
							</ScrollArea>
						</div>
						<MediaPlayer.Controls class="relative flex w-full flex-col gap-2.5">
							<MediaPlayer.Seek />
							<div class="flex w-full items-center justify-center gap-2">
								<MediaPlayer.Tooltip tooltip="Previous track" shortcut="B">
									<Button
										aria-label="Previous track"
										variant="ghost"
										size="icon-sm"
										disabled={loadingTrack}
										onclick={previousTrack}
									>
										<SkipBackIcon />
									</Button>
								</MediaPlayer.Tooltip>
								<MediaPlayer.Play />
								<MediaPlayer.Tooltip tooltip="Next track" shortcut="N">
									<Button
										aria-label="Next track"
										variant="ghost"
										size="icon-sm"
										disabled={loadingTrack}
										onclick={nextTrack}
									>
										<SkipForwardIcon />
									</Button>
								</MediaPlayer.Tooltip>
								<MediaPlayer.Time variant="progress" />
								<MediaPlayer.Volume class="ml-auto" />
							</div>
						</MediaPlayer.Controls>
					</div>
				</MediaPlayer.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Right to left">
		{#snippet blurb()}
			The video and audio compositions under <code>dir="rtl"</code>: the controls bar, both sliders
			and the time readout mirror, while the arrow keys keep seeking physically.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full flex-col items-center gap-6">
					<MediaPlayer.Root dir="rtl" class="max-w-2xl">
						<MediaPlayer.Video playsinline preload="metadata">
							<source src={VIDEO_SRC} type="video/mp4" />
						</MediaPlayer.Video>
						<MediaPlayer.Controls class="flex-col items-start gap-2.5">
							<MediaPlayer.ControlsOverlay />
							<MediaPlayer.Seek />
							<div class="flex w-full items-center gap-2">
								<div class="flex flex-1 items-center gap-2">
									<MediaPlayer.Play />
									<MediaPlayer.SeekBackward />
									<MediaPlayer.SeekForward />
									<MediaPlayer.Volume expandable />
									<MediaPlayer.Time />
								</div>
								<div class="flex items-center gap-2">
									<MediaPlayer.PlaybackSpeed />
									<MediaPlayer.PiP />
									<MediaPlayer.Fullscreen />
								</div>
							</div>
						</MediaPlayer.Controls>
					</MediaPlayer.Root>

					<MediaPlayer.Root dir="rtl" class="h-20 max-w-xl border">
						<MediaPlayer.Audio class="sr-only" preload="metadata">
							<source src={AUDIO_SRC} type="audio/mpeg" />
						</MediaPlayer.Audio>
						<MediaPlayer.Controls class="flex-col items-start gap-2.5">
							<MediaPlayer.Seek withTime />
							<div class="flex w-full items-center justify-center gap-2">
								<MediaPlayer.SeekBackward />
								<MediaPlayer.Play />
								<MediaPlayer.SeekForward />
								<MediaPlayer.Volume />
								<MediaPlayer.PlaybackSpeed />
								<MediaPlayer.Loop />
							</div>
						</MediaPlayer.Controls>
					</MediaPlayer.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<p class="text-sm text-muted-foreground">{sharedNote}</p>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">MediaPlayer.Root</h3>
			<p class="text-sm text-muted-foreground">
				The container. It owns the player state, publishes it on context, renders the screen-reader
				label and description, and hosts the keyboard shortcut set.
			</p>
			{@render propsTable(rootProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">MediaPlayer.Video &amp; MediaPlayer.Audio</h3>
			<p class="text-sm text-muted-foreground">
				The media element, mirrored through Svelte’s native media bindings. <code>Video</code>
				additionally toggles playback when its surface is clicked.
			</p>
			{@render propsTable(mediaProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">MediaPlayer.Controls &amp; MediaPlayer.ControlsOverlay</h3>
			<p class="text-sm text-muted-foreground">
				The controls bar and its gradient backdrop. Both fade with <code>autoHide</code> using
				opacity and <code>pointer-events</code>, never <code>display: none</code>, so a screen
				reader can still reach them.
			</p>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">MediaPlayer.Loading</h3>
			<p class="text-sm text-muted-foreground">
				A <code>role="status"</code> spinner shown only while the media is loading and not paused.
			</p>
			{@render propsTable(loadingProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">MediaPlayer.Error</h3>
			<p class="text-sm text-muted-foreground">
				A <code>role="alert"</code> surface deriving its headline and description from the media’s
				<code>MediaError.code</code>, with retry and reload actions.
			</p>
			{@render propsTable(errorProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">MediaPlayer.VolumeIndicator</h3>
			<p class="text-sm text-muted-foreground">
				The transient volume HUD. The root renders one itself only when the tree mounts none, so
				there is never a duplicated live region.
			</p>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">
				Play, SeekBackward, SeekForward, Loop, Fullscreen, PiP, Captions, Download
			</h3>
			<p class="text-sm text-muted-foreground">
				Icon buttons, each wrapped in <code>MediaPlayer.Tooltip</code> and pointing at the media
				element through <code>aria-controls</code>.
			</p>
			{@render propsTable(buttonProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">MediaPlayer.Seek</h3>
			<p class="text-sm text-muted-foreground">
				The scrub bar: buffered range, chapter separators and a pointer-anchored preview tooltip.
				The committed seek is throttled to one animation frame per drag.
			</p>
			{@render propsTable(seekProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">MediaPlayer.Volume</h3>
			<p class="text-sm text-muted-foreground">A mute toggle beside a volume slider.</p>
			{@render propsTable(volumeProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">MediaPlayer.Time</h3>
			<p class="text-sm text-muted-foreground">A tabular-numeral clock.</p>
			{@render propsTable(timeProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">MediaPlayer.PlaybackSpeed &amp; MediaPlayer.Settings</h3>
			<p class="text-sm text-muted-foreground">
				Dropdown menus. <code>Settings</code> adds Quality and Captions submenus; the Quality one
				renders only for a video with a non-empty <code>renditions</code> list.
			</p>
			{@render propsTable(menuProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">MediaPlayer.Portal &amp; MediaPlayer.Tooltip</h3>
			<p class="text-sm text-muted-foreground">
				The portal target follows fullscreen, so floating surfaces stay visible inside the
				fullscreen element. The tooltip collapses to its children when the root sets
				<code>withoutTooltip</code>.
			</p>
			{@render propsTable(utilityProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Non-component exports</h3>
			<p class="text-sm text-muted-foreground">
				<code>MediaPlayerState</code>, <code>setMediaPlayerContext</code>,
				<code>getMediaPlayerContext</code> (throws outside <code>&lt;MediaPlayer&gt;</code>),
				<code>formatTime</code>, <code>MEDIA_PLAYER_SPEEDS</code>, <code>SEEK_STEP_SHORT</code>,
				<code>SEEK_STEP_LONG</code> and every prop type.
			</p>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Data Attributes</h3>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Attribute</Table.Head>
								<Table.Head>On</Table.Head>
								<Table.Head>Present when</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each dataAttributes as row (row.attribute + row.on)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.attribute}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.on}</Table.Cell>
									<Table.Cell>{row.when}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Keyboard Interactions</h3>
			<p class="text-sm text-muted-foreground">
				Every shortcut requires the player root or the media element to hold focus, and is
				suppressed while the player is disabled.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Key</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each keyboard as row (row.keys)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.keys}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Credits</h3>
			<p class="text-sm text-muted-foreground">
				Ported from the reference implementation’s <code>media-player</code>, which credits
				<a class="underline underline-offset-4" href="https://www.media-chrome.org/">media-chrome</a
				>
				for the player primitives and
				<a class="underline underline-offset-4" href="https://github.com/muxinc/elements">Mux</a>
				for the sample streams and thumbnail storyboards used in its examples.
			</p>
		</div>
	</DocSection>
</DocPage>
