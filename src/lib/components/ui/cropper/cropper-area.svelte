<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import type { CropperShape } from "./cropper.svelte.js";

	export type CropperAreaProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/** Overrides the root's shape for this element only. */
		shape?: CropperShape;
		/** Overrides the root's grid setting for this element only. */
		withGrid?: boolean;
		/** Round the box to whole pixels, so its border lands on the pixel grid. */
		snapPixels?: boolean;
	};
</script>

<script lang="ts">
	import { cropperAreaVariants, getCropperContext } from "./cropper.svelte.js";

	/**
	 * The selection window drawn over the media.
	 *
	 * Renders nothing until the media has been measured: its whole size comes from `cropSize`, and a
	 * frame drawn before that would flash at the wrong dimensions on every load.
	 *
	 * `pointer-events` are left alone deliberately — this sits above the media, but the root owns
	 * the drag through document-level listeners, so the frame never has to be transparent to the
	 * pointer for the drag to work.
	 */
	let {
		ref = $bindable(null),
		shape,
		withGrid,
		snapPixels = false,
		class: className,
		style,
		children,
		...restProps
	}: CropperAreaProps = $props();

	const state = getCropperContext("<Cropper.Area>");

	const size = $derived(state.cropSize);
	const width = $derived(size ? (snapPixels ? Math.round(size.width) : size.width) : 0);
	const height = $derived(size ? (snapPixels ? Math.round(size.height) : size.height) : 0);
</script>

{#if size}
	<div
		bind:this={ref}
		data-slot="cropper-area"
		data-shape={shape ?? state.shape}
		{...restProps}
		class={cn(
			cropperAreaVariants({
				shape: shape ?? state.shape,
				withGrid: withGrid ?? state.withGrid,
			}),
			className,
		)}
		style="width: {width}px; height: {height}px;{style ?? ''}"
	>
		{@render children?.()}
	</div>
{/if}
