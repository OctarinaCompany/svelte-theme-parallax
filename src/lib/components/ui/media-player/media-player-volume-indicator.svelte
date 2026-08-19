<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type MediaPlayerVolumeIndicatorChildProps = {
		"data-slot": "media-player-volume-indicator";
		role: "status";
		"aria-live": "polite";
		"aria-label": string;
		class: string;
	} & Record<string, unknown>;

	export type MediaPlayerVolumeIndicatorProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/**
		 * Internal. Set by `<MediaPlayer>` on the indicator it renders when the tree contains none,
		 * so that indicator does not register itself and flip the very condition that rendered it.
		 *
		 * @default false
		 */
		auto?: boolean;
		/** Render the HUD onto your own element. Replaces upstream's `asChild`. */
		child?: Snippet<[{ props: MediaPlayerVolumeIndicatorChildProps }]>;
		/** Replaces the default icon, readout and bar graph. */
		children?: Snippet;
	};

	const BAR_COUNT = 10;
	const BARS = Array.from({ length: BAR_COUNT }, (_, index) => index);
</script>

<script lang="ts">
	import Volume1Icon from "@lucide/svelte/icons/volume-1";
	import Volume2Icon from "@lucide/svelte/icons/volume-2";
	import VolumeXIcon from "@lucide/svelte/icons/volume-x";

	import { getMediaPlayerContext } from "./media-player.svelte.js";

	let {
		ref = $bindable(null),
		auto = false,
		class: className,
		child,
		children,
		...restProps
	}: MediaPlayerVolumeIndicatorProps = $props();

	const root = getMediaPlayerContext("<MediaPlayer.VolumeIndicator>");

	// Announce this indicator so the root stops rendering its own. The one the root
	// renders itself opts out, or it would immediately un-render itself.
	$effect(() => {
		if (auto) return;
		return root.registerPart("volume-indicator");
	});

	const effectiveVolume = $derived(root.muted ? 0 : root.volume);
	const percent = $derived(Math.round(effectiveVolume * 100));
	const activeBars = $derived(Math.ceil(effectiveVolume * BAR_COUNT));

	const indicatorAttrs = $derived({
		role: "status",
		"aria-live": "polite",
		"aria-label": `Volume ${root.muted ? "muted" : `${percent}%`}`,
		"data-slot": "media-player-volume-indicator",
		...restProps,
		class: cn(
			"pointer-events-none absolute inset-0 z-50 flex items-center justify-center",
			className,
		),
	} as MediaPlayerVolumeIndicatorChildProps);
</script>

{#if root.volumeIndicatorVisible}
	{#if child}
		{@render child({ props: indicatorAttrs })}
	{:else}
		<div bind:this={ref} {...indicatorAttrs}>
			{#if children}
				{@render children()}
			{:else}
				<!--
					`dark` is deliberate here, and it is the exception to the player's rule that every
					part draws in the page's ink. This HUD is video-only — every path to
					`flashVolumeIndicator()` is guarded by `isVideo` — so it always floats over the
					picture, which is a dark surface whatever the page theme is. Its veil is only 30%
					opaque, far too thin to establish a ground of its own, so page ink would land as
					near-black on a dark frame in light mode. Scoping the chip keeps the pair
					self-contained: dark ground, light ink, legible over any frame.
				-->
				<div
					class="dark flex animate-in flex-col items-center gap-3 rounded-lg bg-background/30 px-6 py-4 text-foreground backdrop-blur-xs duration-200 fade-in-0 zoom-in-95"
				>
					<div class="flex items-center gap-2">
						{#if root.volumeLevel === "off"}
							<VolumeXIcon class="size-6" />
						{:else if root.volumeLevel === "high"}
							<Volume2Icon class="size-6" />
						{:else}
							<Volume1Icon class="size-6" />
						{/if}
						<span class="text-sm font-medium tabular-nums">
							{root.muted ? "Muted" : `${percent}%`}
						</span>
					</div>
					<div class="flex items-center gap-1">
						{#each BARS as index (index)}
							<div
								data-slot="media-player-volume-indicator-bar"
								style="height: {12 + index * 2}px"
								class={cn(
									"w-1.5 rounded-full transition-all duration-150",
									index < activeBars && !root.muted
										? "scale-100 bg-foreground"
										: "scale-90 bg-foreground/30",
								)}
							></div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}
{/if}
