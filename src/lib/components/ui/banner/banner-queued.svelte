<script lang="ts" module>
	import type { BannerSide, QueuedBanner } from "./banner.svelte.js";

	export type BannerQueuedProps = {
		banner: QueuedBanner;
		side: BannerSide;
		index: number;
	};
</script>

<script lang="ts">
	import { untrack } from "svelte";

	import {
		BANNER_ANIMATION_DURATION,
		BANNER_ANIMATION_EASING,
		BannerState,
		bannerVariants,
		DEFAULT_BANNER_DISMISSIBLE,
		type BannerRenderProps,
		getBannersContext,
		setBannerContext,
	} from "./banner.svelte.js";

	let { banner, side, index }: BannerQueuedProps = $props();

	const queue = getBannersContext("<Banner.Queue>");

	let bannerRef = $state<HTMLDivElement | null>(null);
	let mounted = $state(false);
	let frozenOffset = $state(0);

	const removing = $derived(queue.isRemoving(banner.id));
	const offset = $derived(queue.offsetOf(banner.id));
	const dismissible = $derived(banner.dismissible ?? DEFAULT_BANNER_DISMISSIBLE);
	const variant = $derived(banner.variant ?? "default");
	const isTop = $derived(side === "top");
	const currentOffset = $derived(removing ? frozenOffset : offset);

	function onClose() {
		queue.setRemoving(banner.id, true);
	}

	function onRemove() {
		queue.removeBanner(banner.id);
	}

	setBannerContext(
		new BannerState({
			getId: () => banner.id,
			getVariant: () => variant,
			getDismissible: () => dismissible,
			close: onClose,
			remove: onRemove,
		}),
	);

	const renderProps: BannerRenderProps = $derived({
		id: banner.id,
		variant,
		dismissible,
		onClose,
		onRemove,
	});

	// Upstream `useEffect`: flip to the entered position one frame after mount.
	$effect(() => {
		const frame = requestAnimationFrame(() => {
			mounted = true;
		});
		return () => cancelAnimationFrame(frame);
	});

	// Upstream `useLayoutEffect`: report this banner's measured height, so the
	// container and its siblings can offset around it. The write is `untrack`ed because `setHeight`
	// reads `heights` to short-circuit an unchanged value before writing it back.
	$effect.pre(() => {
		if (!bannerRef || removing) return;
		const height = bannerRef.getBoundingClientRect().height;
		untrack(() => queue.setHeight(banner.id, height));
	});

	// Freezes the last non-removing offset, so the exit transform starts from where the banner
	// actually was. Read, not written, by the transform below.
	$effect.pre(() => {
		if (!removing) frozenOffset = offset;
	});

	// Upstream `useEffect`: drop the height so the container shrinks and the
	// banners behind this one slide up, then complete the dismissal after the exit animation.
	$effect(() => {
		if (!removing) return;

		queue.removeHeight(banner.id);
		const timeoutId = setTimeout(() => queue.removeBanner(banner.id), BANNER_ANIMATION_DURATION);
		return () => clearTimeout(timeoutId);
	});

	function getTransform(): string {
		if (!mounted) return isTop ? "translateY(-100%)" : "translateY(100%)";
		if (removing) {
			return isTop
				? `translateY(calc(${currentOffset}px - 100%))`
				: `translateY(calc(-${currentOffset}px + 100%))`;
		}
		return isTop ? `translateY(${currentOffset}px)` : `translateY(-${currentOffset}px)`;
	}

	const bannerStyle = $derived(
		`position:absolute;${isTop ? "top" : "bottom"}:0;left:0;right:0;` +
			`z-index:${removing ? 0 : 50 - index};` +
			`transform:${getTransform()};` +
			`opacity:${mounted && !removing ? 1 : 0};` +
			`transition:transform ${BANNER_ANIMATION_DURATION}ms ${BANNER_ANIMATION_EASING}, opacity ${removing ? BANNER_ANIMATION_DURATION / 2 : BANNER_ANIMATION_DURATION}ms ease;`,
	);
</script>

<div
	bind:this={bannerRef}
	role="status"
	aria-live="polite"
	data-slot="queued-banner"
	data-state={removing ? "closed" : "open"}
	data-mounted={mounted}
	data-removed={removing}
	data-side={side}
	data-front={index === 0}
	data-index={index}
	data-variant={variant}
	class={bannerVariants({ variant })}
	style={bannerStyle}
>
	{@render banner.content(renderProps)}
</div>
