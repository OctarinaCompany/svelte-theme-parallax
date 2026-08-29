<script lang="ts" module>
	import type { Slider as SliderPrimitive } from "bits-ui";
	import type { Snippet } from "svelte";

	import type {
		MediaPlayerCollisionPadding,
		MediaPlayerSeekTooltipTimeVariant,
	} from "./media-player.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type MediaPlayerSeekChildProps = {
		"data-slot": "media-player-seek-container";
		class: string;
	} & Record<string, unknown>;

	/**
	 * Every single-value `bits-ui` `Slider.Root` prop except the ones this part owns. `bits-ui` has
	 * no `Slider.Track` component, so upstream's `Root > Control > Track` anatomy is rebuilt with a
	 * plain track div inside `Slider.Root`: the track owns the `overflow-hidden` clipping so the
	 * thumb and its hover/focus rings render outside the 4px bar, while every documented
	 * `data-slot` keeps its upstream element.
	 */
	export type MediaPlayerSeekProps = Omit<
		SliderPrimitive.RootProps,
		| "type"
		| "value"
		| "onValueChange"
		| "onValueCommit"
		| "min"
		| "max"
		| "step"
		| "dir"
		| "children"
		| "child"
	> & {
		/**
		 * Flank the slider with a current-time and a remaining-time readout.
		 *
		 * @default false
		 */
		withTime?: boolean;
		/**
		 * Suppress the chapter separators and the chapter title in the hover tooltip.
		 *
		 * Upstream's published type tags this `@default true`, which contradicts its own
		 * implementation; the implementation wins.
		 *
		 * @default false
		 */
		withoutChapter?: boolean;
		/**
		 * Suppress the hover tooltip entirely.
		 *
		 * @default false
		 */
		withoutTooltip?: boolean;
		/** A preview image for the hovered time, either fixed or computed per second. */
		tooltipThumbnailSrc?: string | ((time: number) => string);
		/**
		 * Whether the tooltip shows the hovered time alone or `{hovered} / {duration}`.
		 *
		 * @default 'current'
		 */
		tooltipTimeVariant?: MediaPlayerSeekTooltipTimeVariant;
		/**
		 * Distance in pixels between the track and the tooltip.
		 *
		 * @default the root's `tooltipSideOffset`
		 */
		tooltipSideOffset?: number;
		/**
		 * Element(s) the tooltip must stay inside.
		 *
		 * @default the player root
		 */
		tooltipCollisionBoundary?: Element | Element[];
		/**
		 * How far from each boundary edge the tooltip must stay.
		 *
		 * @default 10
		 */
		tooltipCollisionPadding?: MediaPlayerCollisionPadding;
		/**
		 * Render the seek container onto your own element. Replaces upstream's `asChild`. In `child`
		 * mode the slider is not rendered — the caller owns the element.
		 */
		child?: Snippet<[{ props: MediaPlayerSeekChildProps }]>;
	};

	type CollisionData = {
		padding: { top: number; right: number; bottom: number; left: number };
		boundaries: Element[];
	};
</script>

<script lang="ts">
	import { Slider } from "bits-ui";
	import { untrack } from "svelte";

	import { cn } from "$lib/utils.js";

	import MediaPlayerPortal from "./media-player-portal.svelte";
	import {
		getMediaPlayerContext,
		SEEK_COLLISION_PADDING,
		SEEK_HOVER_PERCENT,
		SEEK_TOOLTIP_WIDTH_FALLBACK,
		SEEK_TOOLTIP_X,
		SEEK_TOOLTIP_Y,
	} from "./media-player.svelte.js";
	import { formatTime } from "./time.js";

	let {
		ref = $bindable(null),
		withTime = false,
		withoutChapter = false,
		withoutTooltip = false,
		tooltipThumbnailSrc,
		tooltipTimeVariant = "current",
		tooltipSideOffset,
		tooltipCollisionBoundary,
		tooltipCollisionPadding = SEEK_COLLISION_PADDING,
		disabled,
		class: className,
		child,
		...restProps
	}: MediaPlayerSeekProps = $props();

	const root = getMediaPlayerContext("<MediaPlayer.Seek>");

	let seekEl = $state<HTMLElement | null>(null);
	let tooltipEl = $state<HTMLElement | null>(null);

	let hovering = $state(false);
	let hasInitialPosition = $state(false);
	let hoverTime = $state(0);
	let pendingSeekTime = $state<number | null>(null);

	// Upstream keeps these in `useRef` boxes purely to defeat React's re-render model; here they are
	// plain non-reactive locals.
	let seekRect: DOMRect | null = null;
	let collisionData: CollisionData | null = null;
	let rafId: number | null = null;
	let seekThrottleId: number | null = null;
	let justCommitted = false;
	let lastPointerX = 0;
	let lastPointerY = 0;
	let pointerEnterTime = 0;
	let horizontalMovement = 0;
	let verticalMovement = 0;
	let lastSeekCommitTime = 0;

	/** The slider's step, in seconds. Also the granularity the echo guard reasons about. */
	const SEEK_STEP = 0.01;

	const isDisabled = $derived(Boolean(disabled) || root.disabled);
	const tooltipDisabled = $derived(withoutTooltip || root.withoutTooltip || root.menuOpen);
	const sideOffset = $derived(tooltipSideOffset ?? root.tooltipSideOffset);

	const displayValue = $derived(pendingSeekTime ?? root.currentTime);
	const currentLabel = $derived(formatTime(displayValue, root.seekableEnd));
	const durationLabel = $derived(formatTime(root.seekableEnd, root.seekableEnd));
	const remainingLabel = $derived(formatTime(root.seekableEnd - displayValue, root.seekableEnd));
	const hoverLabel = $derived(formatTime(hoverTime, root.seekableEnd));

	const chapterSeparators = $derived(
		withoutChapter || root.chapterCues.length <= 1 || root.seekableEnd <= 0
			? []
			: root.chapterCues.slice(1).map((cue, index) => ({
					key: `chapter-${index}-${cue.startTime}`,
					position: (cue.startTime / root.seekableEnd) * 100,
				})),
	);

	const hoveredChapter = $derived(
		withoutChapter || root.chapterCues.length === 0
			? undefined
			: root.chapterCues.find((cue) => hoverTime >= cue.startTime && hoverTime < cue.endTime),
	);

	const thumbnailSrc = $derived(
		tooltipDisabled || !tooltipThumbnailSrc
			? undefined
			: typeof tooltipThumbnailSrc === "function"
				? tooltipThumbnailSrc(hoverTime)
				: tooltipThumbnailSrc,
	);

	// Once the element catches up with the value the user dropped the thumb on, the optimistic
	// position is released and the media becomes authoritative again. The write is
	// untracked: this effect must depend on `currentTime` alone, never on what it clears.
	$effect(() => {
		const time = root.currentTime;
		untrack(() => {
			if (pendingSeekTime === null) return;
			if (Math.abs(time - pendingSeekTime) < 0.5) pendingSeekTime = null;
		});
	});

	// Scrolling moves the track out from under the pointer, so the tooltip is dismissed rather than
	// left floating at a stale position. Capture phase: `scroll` does not bubble, and inside the
	// shell the canvas scrolls, never the document (`src/app.css`), so only a capturing listener
	// hears it; removed with `capture` too — the flag is part of the listener's identity.
	$effect(() => {
		if (!hovering || tooltipDisabled) return;

		const onScroll = () => {
			hovering = false;
			hasInitialPosition = false;
		};

		document.addEventListener("scroll", onScroll, { passive: true, capture: true });
		return () => document.removeEventListener("scroll", onScroll, { capture: true });
	});

	// Every frame and throttle this part schedules is cancelled with it.
	$effect(() => () => {
		if (rafId !== null) cancelAnimationFrame(rafId);
		if (seekThrottleId !== null) cancelAnimationFrame(seekThrottleId);
		rafId = null;
		seekThrottleId = null;
	});

	function readCollisionData(): CollisionData {
		if (collisionData) return collisionData;

		const padding =
			typeof tooltipCollisionPadding === "number"
				? {
						top: tooltipCollisionPadding,
						right: tooltipCollisionPadding,
						bottom: tooltipCollisionPadding,
						left: tooltipCollisionPadding,
					}
				: { top: 0, right: 0, bottom: 0, left: 0, ...tooltipCollisionPadding };

		const boundaries = tooltipCollisionBoundary
			? Array.isArray(tooltipCollisionBoundary)
				? tooltipCollisionBoundary
				: [tooltipCollisionBoundary]
			: root.rootEl
				? [root.rootEl]
				: [];

		collisionData = { padding, boundaries };
		return collisionData;
	}

	/**
	 * `bits-ui`'s `Tooltip` anchors to a *trigger element*; the seek preview has to follow the
	 * pointer's X, reposition every frame while dragging and clamp against a caller-supplied
	 * boundary. Only the maths is bespoke — the portal is composed.
	 */
	function updateTooltipPosition(clientX: number) {
		if (!seekEl) return;

		const tooltipWidth = tooltipEl?.offsetWidth || SEEK_TOOLTIP_WIDTH_FALLBACK;
		const halfWidth = tooltipWidth / 2;
		const data = readCollisionData();

		let x = clientX;
		const y = seekRect?.top ?? 0;

		let minLeft = 0;
		let maxRight = window.innerWidth;

		for (const boundary of data.boundaries) {
			const rect = boundary.getBoundingClientRect();
			minLeft = Math.max(minLeft, rect.left + data.padding.left);
			maxRight = Math.min(maxRight, rect.right - data.padding.right);
		}

		if (x - halfWidth < minLeft) x = minLeft + halfWidth;
		else if (x + halfWidth > maxRight) x = maxRight - halfWidth;

		if (x - halfWidth < SEEK_COLLISION_PADDING) {
			x = SEEK_COLLISION_PADDING + halfWidth;
		} else if (x + halfWidth > window.innerWidth - SEEK_COLLISION_PADDING) {
			x = window.innerWidth - SEEK_COLLISION_PADDING - halfWidth;
		}

		tooltipEl?.style.setProperty(SEEK_TOOLTIP_X, `${x}px`);
		tooltipEl?.style.setProperty(SEEK_TOOLTIP_Y, `${y}px`);

		if (!hasInitialPosition) hasInitialPosition = true;
	}

	function updateHoverProgress() {
		if (!seekEl || root.seekableEnd <= 0) return;
		const percent = Math.min(100, (hoverTime / root.seekableEnd) * 100);
		seekEl.style.setProperty(SEEK_HOVER_PERCENT, `${percent.toFixed(4)}%`);
	}

	function onpointerenter() {
		seekRect = seekEl?.getBoundingClientRect() ?? null;
		collisionData = null;
		pointerEnterTime = performance.now();
		horizontalMovement = 0;
		verticalMovement = 0;

		if (root.seekableEnd > 0 && !tooltipDisabled && lastPointerX && seekRect) {
			const clientX = Math.max(seekRect.left, Math.min(lastPointerX, seekRect.right));
			updateTooltipPosition(clientX);
		}
	}

	function onpointerleave() {
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}

		hovering = false;
		hasInitialPosition = false;
		justCommitted = false;
		seekRect = null;
		collisionData = null;
		pointerEnterTime = 0;
		horizontalMovement = 0;
		verticalMovement = 0;
		lastPointerX = 0;
		lastPointerY = 0;
		lastSeekCommitTime = 0;
	}

	function onpointermove(event: PointerEvent) {
		if (root.seekableEnd <= 0) return;

		seekRect ??= seekEl?.getBoundingClientRect() ?? null;
		if (!seekRect) return;

		if (lastPointerX !== 0 && lastPointerY !== 0) {
			horizontalMovement += Math.abs(event.clientX - lastPointerX);
			verticalMovement += Math.abs(event.clientY - lastPointerY);
		}

		lastPointerX = event.clientX;
		lastPointerY = event.clientY;

		if (rafId !== null) cancelAnimationFrame(rafId);

		rafId = requestAnimationFrame(() => {
			rafId = null;

			const wasJustCommitted = justCommitted;
			justCommitted = false;

			const rect = seekRect;
			if (!rect) return;

			const clientX = lastPointerX;
			const offset = Math.max(0, Math.min(clientX - rect.left, rect.width));
			hoverTime = (offset / rect.width) * root.seekableEnd;

			updateHoverProgress();

			const wasHovering = hovering;
			const isOverTrack = clientX >= rect.left && clientX <= rect.right;

			// Upstream's "intentional hover" heuristic: dwell, mostly-horizontal travel, or a
			// near-stationary pointer, with a cooldown so a commit does not immediately re-open it.
			const timeHovering = performance.now() - pointerEnterTime;
			const totalMovement = horizontalMovement + verticalMovement;
			const horizontalRatio = totalMovement > 0 ? horizontalMovement / totalMovement : 0;
			const inSeekCooldown = performance.now() - lastSeekCommitTime < 300;

			const shouldShowTooltip =
				!wasJustCommitted &&
				!inSeekCooldown &&
				(timeHovering > 150 || horizontalRatio > 0.6 || (totalMovement < 10 && timeHovering > 50));

			if (!wasHovering && isOverTrack && shouldShowTooltip && !tooltipDisabled) hovering = true;

			if (!tooltipDisabled && isOverTrack && (wasHovering || shouldShowTooltip)) {
				updateTooltipPosition(clientX);
			}
		});
	}

	/**
	 * `bits-ui` calls `onValueChange` for *any* change to its value, including the one it performs
	 * itself when the controlled `value` prop is re-synced. Playback therefore echoes back through
	 * this callback ~60 times a second: `currentTime` advances, `displayValue` changes, `bits-ui`
	 * reports it as a change, and the seek below re-seeks the element to where it already is —
	 * flushing the decode pipeline every frame. Measured at 56 seeks/s and a third of real speed.
	 *
	 * An echo carries the value we just handed down, so anything within half a step of it is not a
	 * user gesture. A real drag or an arrow key always moves at least a full step.
	 */
	function isEchoOfDisplayedValue(value: number): boolean {
		return Math.abs(value - displayValue) < SEEK_STEP / 2;
	}

	function onValueChange(value: number) {
		if (isEchoOfDisplayedValue(value)) return;

		pendingSeekTime = value;
		root.dragging = true;

		// The visible thumb has already moved; the real seek is throttled to one frame so a rapid
		// drag does not queue dozens of them.
		if (seekThrottleId !== null) cancelAnimationFrame(seekThrottleId);
		seekThrottleId = requestAnimationFrame(() => {
			seekThrottleId = null;
			root.seekTo(value);
		});
	}

	function onValueCommit(value: number) {
		// Same echo guard: a commit that lands on the displayed value is not a gesture the user made.
		if (isEchoOfDisplayedValue(value) && !root.dragging) return;

		if (seekThrottleId !== null) {
			cancelAnimationFrame(seekThrottleId);
			seekThrottleId = null;
		}
		if (rafId !== null) {
			cancelAnimationFrame(rafId);
			rafId = null;
		}

		pendingSeekTime = value;
		hovering = false;
		hasInitialPosition = false;
		justCommitted = true;
		collisionData = null;
		lastSeekCommitTime = performance.now();
		pointerEnterTime = performance.now();
		horizontalMovement = 0;
		verticalMovement = 0;

		root.dragging = false;
		root.seekTo(value);
	}

	// `bits-ui` reads `dir` as a behavioural prop and does not render it, so the container carries
	// the attribute the documented direction chain is read from.
	const containerAttrs = $derived({
		"data-slot": "media-player-seek-container",
		dir: root.dir,
		class: "relative w-full",
	} as MediaPlayerSeekChildProps);
</script>

{#snippet slider()}
	<div {...containerAttrs}>
		<Slider.Root
			bind:ref={
				() => ref,
				(next) => {
					ref = next;
					seekEl = next;
				}
			}
			type="single"
			aria-controls={root.mediaId}
			aria-valuetext="{currentLabel} of {durationLabel}"
			data-hovering={hovering ? "" : undefined}
			data-disabled={isDisabled ? "" : undefined}
			data-slider=""
			data-slot="media-player-seek"
			dir={root.dir}
			disabled={isDisabled}
			{...restProps}
			min={root.seekableStart}
			max={root.seekableEnd}
			step={SEEK_STEP}
			value={displayValue}
			{onValueChange}
			{onValueCommit}
			{onpointerenter}
			{onpointerleave}
			{onpointermove}
			class={cn(
				"relative flex h-1 w-full touch-none items-center select-none data-disabled:pointer-events-none data-disabled:opacity-50",
				className,
			)}
		>
			{#snippet children({ thumbItems })}
				<!--
					The track owns the clipping so the thumb and its rings stay visible.

					THE BAR IS `currentColor`, NOT `--primary`. Every other control in this row —
					play, skip, mute, the timestamp — draws in the inherited colour, which is the
					page's own foreground: dark ink in light mode, light ink in dark mode. A bar in
					`--primary` was the one blue object in a monochrome set, and it read as a
					different component rather than the same one. Taking `currentColor` is also what
					lets the whole row re-ink with the theme without a single control naming a
					colour, and what keeps a bar over a video and a bar on a card identical without
					either knowing which it is in.

					The three tints keep their upstream weights, now as alphas of that same colour:
					the trough behind everything, the buffered span, and the hover preview.
				-->
				<div class="relative h-1 w-full grow overflow-hidden rounded-full bg-current/40">
					<div
						data-slot="media-player-seek-buffered"
						style="width: {root.bufferedProgress * 100}%"
						class="absolute h-full bg-current/70 will-change-[width]"
					></div>
					<Slider.Range class="absolute h-full bg-current will-change-[width]" />
					{#if hovering && root.seekableEnd > 0}
						<div
							data-slot="media-player-seek-hover-range"
							style="width: var({SEEK_HOVER_PERCENT}, 0%); transition: opacity 150ms ease-out"
							class="absolute h-full bg-current/70 will-change-[width,opacity]"
						></div>
					{/if}
					{#each chapterSeparators as separator (separator.key)}
						<div
							role="presentation"
							aria-hidden="true"
							data-slot="media-player-seek-chapter-separator"
							style="width: 0.1563rem; left: {separator.position}%; transform: translateX(-50%)"
							class="absolute top-0 h-full bg-background"
						></div>
					{/each}
				</div>
				{#each thumbItems as thumb (thumb.index)}
					<!--
						`bits-ui` puts `role="slider"` on the thumb, so the accessible name and the value
						text have to live there too; the root keeps them as well for parity with the
						documented attribute set.
					-->
					<Slider.Thumb
						index={thumb.index}
						data-slot="media-player-seek-thumb"
						aria-label="Seek"
						aria-controls={root.mediaId}
						aria-valuetext="{currentLabel} of {durationLabel}"
						class="relative z-10 block size-2.5 shrink-0 rounded-full bg-current shadow-sm ring-ring/50 transition-[color,box-shadow] will-change-transform hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
					/>
				{/each}
			{/snippet}
		</Slider.Root>
		{#if !tooltipDisabled && hovering && root.seekableEnd > 0}
			<MediaPlayerPortal>
				<div
					bind:this={tooltipEl}
					data-slot="media-player-seek-tooltip"
					style="position: fixed; left: var({SEEK_TOOLTIP_X}, 0px); top: var({SEEK_TOOLTIP_Y}, 0px); transform: translateX(-50%) translateY(calc(-100% - {sideOffset}px)); visibility: {hasInitialPosition
						? 'visible'
						: 'hidden'}; opacity: {hasInitialPosition ? 1 : 0}"
					class="pointer-events-none z-50 [transition:opacity_150ms_ease-in-out] backface-hidden"
				>
					<div
						class={cn(
							"flex flex-col items-center gap-1.5 rounded-md border bg-popover text-popover-foreground shadow-sm",
							thumbnailSrc && "min-h-10",
							!thumbnailSrc && hoveredChapter && "px-3 py-1.5",
						)}
					>
						{#if thumbnailSrc}
							<div
								data-slot="media-player-seek-thumbnail"
								class="h-32 w-56 overflow-hidden rounded-md rounded-b-none"
							>
								<img
									src={thumbnailSrc}
									alt="Preview at {hoverLabel}"
									class="size-full object-cover"
								/>
							</div>
						{/if}
						{#if hoveredChapter}
							<div
								data-slot="media-player-seek-chapter-title"
								class="line-clamp-2 max-w-48 text-center text-xs text-balance"
							>
								{hoveredChapter.text}
							</div>
						{/if}
						<div
							data-slot="media-player-seek-time"
							class={cn(
								"text-center text-xs whitespace-nowrap tabular-nums",
								thumbnailSrc && "pb-1.5",
								!thumbnailSrc && !hoveredChapter && "px-2.5 py-1",
							)}
						>
							{tooltipTimeVariant === "progress" ? `${hoverLabel} / ${durationLabel}` : hoverLabel}
						</div>
					</div>
				</div>
			</MediaPlayerPortal>
		{/if}
	</div>
{/snippet}

{#if child}
	{@render child({ props: containerAttrs })}
{:else if withTime}
	<div data-slot="media-player-seek-time-container" class="flex w-full items-center gap-2">
		<span data-slot="media-player-seek-current-time" class="text-sm tabular-nums">
			{currentLabel}
		</span>
		{@render slider()}
		<span data-slot="media-player-seek-remaining-time" class="text-sm tabular-nums">
			{remainingLabel}
		</span>
	</div>
{:else}
	{@render slider()}
{/if}
