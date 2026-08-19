<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLVideoAttributes } from "svelte/elements";
	import type { CropperObjectFit } from "./cropper.svelte.js";

	export type CropperVideoProps = WithElementRef<HTMLVideoAttributes, HTMLVideoElement> & {
		/** Overrides the root's fit for this element only. */
		objectFit?: CropperObjectFit;
		/** Round the transform to whole device pixels. */
		snapPixels?: boolean;
	};
</script>

<script lang="ts">
	import { untrack } from "svelte";
	import { cropperMediaVariants, getCropperContext, snapToDevicePixel } from "./cropper.svelte.js";
	import { observeCropperResize } from "./cropper-resize.js";

	/**
	 * A video being cropped.
	 *
	 * The image's twin, differing only in where the natural dimensions come from: `videoWidth` and
	 * `videoHeight`, which are zero until `loadedmetadata` — so that, not `load`, is the event to
	 * measure on.
	 */
	let {
		ref = $bindable(null),
		objectFit,
		snapPixels = false,
		class: className,
		style,
		onloadedmetadata,
		children,
		...restProps
	}: CropperVideoProps = $props();

	const state = getCropperContext("<Cropper.Video>");

	/**
	 * `untrack` for the same reason as the image part: `state.measure` reads the crop and writes it
	 * back, so calling it bare inside an `$effect` makes that effect wake on its own write.
	 */
	function measure() {
		if (!ref || ref.videoWidth === 0) return;
		const element = ref;
		untrack(() => state.measure(element, element.videoWidth, element.videoHeight));
	}

	function handleLoadedMetadata(event: Event & { currentTarget: HTMLVideoElement }) {
		measure();
		onloadedmetadata?.(event);
	}

	// `readyState >= HAVE_METADATA` means the event already fired, which happens with a cached
	// video for the same reason a cached image is already `complete`.
	$effect(() => {
		if (ref && ref.readyState >= 1 && ref.videoWidth > 0) measure();
	});

	$effect(() => observeCropperResize(state.root, () => (ref?.videoWidth ?? 0) > 0, measure));

	const x = $derived(snapPixels ? snapToDevicePixel(state.crop.x) : state.crop.x);
	const y = $derived(snapPixels ? snapToDevicePixel(state.crop.y) : state.crop.y);
	const transform = $derived(
		`translate(${x}px, ${y}px) rotate(${state.rotation}deg) scale(${state.zoom})`,
	);
</script>

<!-- svelte-ignore a11y_media_has_caption -->
<video
	bind:this={ref}
	data-slot="cropper-video"
	{...restProps}
	class={cn(cropperMediaVariants({ objectFit: objectFit ?? state.objectFit }), className)}
	style="transform: {transform};{style ?? ''}"
	onloadedmetadata={handleLoadedMetadata}
>
	{@render children?.()}
</video>
