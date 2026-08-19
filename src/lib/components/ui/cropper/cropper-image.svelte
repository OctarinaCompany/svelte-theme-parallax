<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLImgAttributes } from "svelte/elements";
	import type { CropperObjectFit } from "./cropper.svelte.js";

	export type CropperImageProps = WithElementRef<HTMLImgAttributes, HTMLImageElement> & {
		/** Overrides the root's fit for this element only. */
		objectFit?: CropperObjectFit;
		/**
		 * Round the transform to whole device pixels.
		 *
		 * Off by default: it trades a little smoothness during a drag for a crisper still, and which
		 * of those matters depends on the picture.
		 */
		snapPixels?: boolean;
	};
</script>

<script lang="ts">
	import { untrack } from "svelte";
	import { cropperMediaVariants, getCropperContext, snapToDevicePixel } from "./cropper.svelte.js";
	import { observeCropperResize } from "./cropper-resize.js";

	/**
	 * The image being cropped.
	 *
	 * The transform is the whole component: translate by the crop offset, rotate, scale by the zoom.
	 * Everything else — where the selection sits, how large it is — is computed from the measured
	 * sizes rather than expressed here.
	 */
	let {
		ref = $bindable(null),
		objectFit,
		snapPixels = false,
		class: className,
		style,
		onload,
		...restProps
	}: CropperImageProps = $props();

	const state = getCropperContext("<Cropper.Image>");

	/**
	 * `untrack`, and it is load-bearing.
	 *
	 * `state.measure` READS the crop and WRITES it back through `reclampCrop`. Called bare inside an
	 * `$effect`, every one of those reads becomes a dependency of that effect — so the effect wakes
	 * on its own write and Svelte stops it with `effect_update_depth_exceeded`. The measurement is
	 * an imperative response to the media loading or the container resizing, not a derivation, so it
	 * must not subscribe to anything it touches.
	 */
	function measure() {
		if (!ref || ref.naturalWidth === 0) return;
		const element = ref;
		untrack(() => state.measure(element, element.naturalWidth, element.naturalHeight));
	}

	// Typed as the bare DOM `Event` the `img` attribute map declares, rather than narrowing
	// `currentTarget`: the element is already in hand as `ref`, so nothing here needs the narrowing,
	// and asking for it makes the handler unassignable to the attribute's own signature.
	function handleLoad(event: Event) {
		measure();
		onload?.(event as Parameters<NonNullable<typeof onload>>[0]);
	}

	// A cached image can be `complete` before this effect ever runs, in which case `load` has
	// already fired and will not fire again — so the first measurement has to be taken here.
	$effect(() => {
		if (ref?.complete && ref.naturalWidth > 0) measure();
	});

	$effect(() => observeCropperResize(state.root, () => ref?.complete === true, measure));

	const x = $derived(snapPixels ? snapToDevicePixel(state.crop.x) : state.crop.x);
	const y = $derived(snapPixels ? snapToDevicePixel(state.crop.y) : state.crop.y);
	const transform = $derived(
		`translate(${x}px, ${y}px) rotate(${state.rotation}deg) scale(${state.zoom})`,
	);
</script>

<img
	bind:this={ref}
	data-slot="cropper-image"
	{...restProps}
	class={cn(cropperMediaVariants({ objectFit: objectFit ?? state.objectFit }), className)}
	style="transform: {transform};{style ?? ''}"
	onload={handleLoad}
/>
