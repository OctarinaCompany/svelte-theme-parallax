<script lang="ts" module>
	import type { Snippet } from "svelte";

	import type { BannerSide, BannerStrategy } from "./banner.svelte.js";

	export type BannerQueueProps = {
		/** @default 1 */
		maxVisible?: number;
		/** @default 'top' */
		side?: BannerSide;
		/** @default 'fixed' */
		strategy?: BannerStrategy;
		/**
		 * Only consulted for `strategy="fixed"` and `strategy="absolute"`, which portal through the
		 * `bits-ui` `Portal` utility (default target `document.body`). Accepts an `Element` or a CSS
		 * selector.
		 */
		container?: Element | string | null;
		children?: Snippet;
	};

	/** Upstream-parity alias of {@link BannerQueueProps}. */
	export type BannersProps = BannerQueueProps;
</script>

<script lang="ts">
	import { Portal } from "bits-ui";

	import { cn } from "$lib/utils.js";

	import BannerQueued from "./banner-queued.svelte";
	import {
		BANNER_ANIMATION_DURATION,
		BANNER_ANIMATION_EASING,
		BannersState,
		DEFAULT_MAX_VISIBLE,
		isPortalStrategy,
		setBannersContext,
	} from "./banner.svelte.js";

	let {
		maxVisible = DEFAULT_MAX_VISIBLE,
		side = "top",
		strategy = "fixed",
		container,
		children,
	}: BannerQueueProps = $props();

	const state = new BannersState({
		getMaxVisible: () => maxVisible,
	});

	setBannersContext(state);

	// Clears every pending timer on unmount, so a page navigation cannot leave one running.
	$effect(() => () => state.destroy());

	const containerStyle = $derived(
		`height:${state.totalHeight > 0 ? `${state.totalHeight}px` : "auto"};` +
			`transition:height ${BANNER_ANIMATION_DURATION}ms ${BANNER_ANIMATION_EASING};`,
	);
</script>

{#snippet stack()}
	{#if state.visibleBanners.length > 0}
		<div
			data-slot="banner-container"
			data-side={side}
			data-strategy={strategy}
			class={cn(
				"pointer-events-none isolate z-50",
				// `left-0 right-0` stretch a box only while it is out of flow. The in-flow strategies
				// need a real width instead: every banner inside is absolutely positioned, so none of
				// them contributes intrinsic width, and the container would otherwise collapse to zero
				// wherever its parent sizes children to their content — a flex or grid item, say.
				isPortalStrategy(strategy) ? "right-0 left-0" : "w-full",
				strategy === "fixed" && "fixed",
				strategy === "static" && "relative",
				strategy === "sticky" && "sticky",
				strategy === "absolute" && "absolute",
				side === "top" ? "top-0" : "bottom-0",
			)}
			style={containerStyle}
		>
			{#each state.visibleBanners as banner, index (banner.id)}
				<BannerQueued {banner} {side} {index} />
			{/each}
		</div>
	{/if}
{/snippet}

{#if !isPortalStrategy(strategy)}
	{#if side === "top"}
		{@render stack()}
	{/if}
	{@render children?.()}
	{#if side === "bottom"}
		{@render stack()}
	{/if}
{:else}
	{@render children?.()}
	<Portal to={container ?? undefined}>
		{@render stack()}
	</Portal>
{/if}
