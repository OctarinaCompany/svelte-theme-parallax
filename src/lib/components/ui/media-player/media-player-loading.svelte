<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type MediaPlayerLoadingChildProps = {
		"data-slot": "media-player-loading";
		role: "status";
		"aria-live": "polite";
		class: string;
	} & Record<string, unknown>;

	export type MediaPlayerLoadingProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/**
		 * How long a stall must last before the indicator appears, in milliseconds. The delay only
		 * applies once the media has played at least once — a first load shows it immediately.
		 *
		 * Upstream's implementation names this prop `delayMs` while its published type names it
		 * `delay`; the published type is the contract.
		 *
		 * @default 500
		 */
		delay?: number;
		/** Render the indicator onto your own element. Replaces upstream's `asChild`. */
		child?: Snippet<[{ props: MediaPlayerLoadingChildProps }]>;
		/** Replaces the default spinner. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { Spinner } from "$lib/components/ui/spinner/index.js";

	import { getMediaPlayerContext, LOADING_DELAY } from "./media-player.svelte.js";

	let {
		ref = $bindable(null),
		delay = LOADING_DELAY,
		class: className,
		child,
		children,
		...restProps
	}: MediaPlayerLoadingProps = $props();

	const root = getMediaPlayerContext("<MediaPlayer.Loading>");

	let visible = $state(false);

	// A paused media is not loading, it is waiting for the user. A stall during playback shows the
	// spinner immediately on the first load and only after `delay` once playback has started, so a
	// routine re-buffer does not flash. The timer is owned by this effect and
	// cleared in its teardown.
	$effect(() => {
		const shouldShow = root.loading && !root.paused;

		if (!shouldShow) {
			visible = false;
			return;
		}

		if (!root.hasPlayed || delay <= 0) {
			visible = true;
			return;
		}

		const timer = setTimeout(() => {
			visible = true;
		}, delay);

		return () => clearTimeout(timer);
	});

	const loadingAttrs = $derived({
		role: "status",
		"aria-live": "polite",
		"data-slot": "media-player-loading",
		...restProps,
		class: cn(
			"pointer-events-none absolute inset-0 z-50 flex animate-in items-center justify-center duration-200 fade-in-0 zoom-in-95",
			className,
		),
	} as MediaPlayerLoadingChildProps);
</script>

{#if visible}
	{#if child}
		{@render child({ props: loadingAttrs })}
	{:else}
		<div bind:this={ref} {...loadingAttrs}>
			{#if children}
				{@render children()}
			{:else}
				<!-- The wrapper is the live region; the spinner must not announce a second one.
					`text-primary` is upstream's tint, and it is the one ink here that must NOT follow
					the page: this spins over the picture, which is dark whatever the page theme is,
					and the brand colour carries against a frame in both. The Spinner primitive
					itself inherits `currentColor`. -->
				<Spinner
					role="presentation"
					aria-hidden="true"
					class="size-20 stroke-[0.0938rem] text-primary"
				/>
			{/if}
		</div>
	{/if}
{/if}
