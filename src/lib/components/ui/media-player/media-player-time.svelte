<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { MediaPlayerDirection, MediaPlayerTimeVariant } from "./media-player.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type MediaPlayerTimeChildProps = {
		"data-slot": "media-player-time";
		"data-variant": MediaPlayerTimeVariant;
		dir: MediaPlayerDirection;
		class: string;
	} & Record<string, unknown>;

	export type MediaPlayerTimeProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, "dir">,
		HTMLDivElement
	> & {
		/**
		 * Which clock to render: elapsed over total, time left, or total.
		 *
		 * @default 'progress'
		 */
		variant?: MediaPlayerTimeVariant;
		/** Render the readout onto your own element. Replaces upstream's `asChild`. */
		child?: Snippet<[{ props: MediaPlayerTimeChildProps }]>;
		/** Replaces the default readout. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { getMediaPlayerContext } from "./media-player.svelte.js";
	import { formatTime } from "./time.js";

	let {
		ref = $bindable(null),
		variant = "progress",
		class: className,
		child,
		children,
		...restProps
	}: MediaPlayerTimeProps = $props();

	const root = getMediaPlayerContext("<MediaPlayer.Time>");

	// `currentTime` is refreshed by the media element's own `timeupdate`, which fires at least four
	// times a second during playback, so the readout ticks without a timer of its own.
	const current = $derived(formatTime(root.currentTime, root.seekableEnd));
	const duration = $derived(formatTime(root.seekableEnd, root.seekableEnd));
	const remaining = $derived(formatTime(root.seekableEnd - root.currentTime, root.seekableEnd));

	const timeAttrs = $derived({
		"data-slot": "media-player-time",
		"data-variant": variant,
		dir: root.dir,
		...restProps,
		class: cn(
			variant === "progress"
				? "flex items-center gap-1 text-sm text-foreground/80"
				: "text-sm text-foreground/80 tabular-nums",
			className,
		),
	} as MediaPlayerTimeChildProps);
</script>

{#if child}
	{@render child({ props: timeAttrs })}
{:else}
	<div bind:this={ref} {...timeAttrs}>
		{#if children}
			{@render children()}
		{:else if variant === "remaining"}
			{remaining}
		{:else if variant === "duration"}
			{duration}
		{:else}
			<span class="tabular-nums">{current}</span>
			<span role="separator" aria-hidden="true">/</span>
			<span class="tabular-nums">{duration}</span>
		{/if}
	</div>
{/if}
