import Root from "./cropper.svelte";
import Image from "./cropper-image.svelte";
import Video from "./cropper-video.svelte";
import Area from "./cropper-area.svelte";

export { type CropperRootProps } from "./cropper.svelte";
export { type CropperImageProps } from "./cropper-image.svelte";
export { type CropperVideoProps } from "./cropper-video.svelte";
export { type CropperAreaProps } from "./cropper-area.svelte";
export { observeCropperResize } from "./cropper-resize.js";
export {
	CROPPER_OBJECT_FITS,
	CROPPER_SHAPES,
	CROPPER_WHEEL_SETTLE_MS,
	CropperState,
	DEFAULT_CROPPER_ASPECT_RATIO,
	DEFAULT_CROPPER_KEYBOARD_STEP,
	DEFAULT_CROPPER_MAX_ZOOM,
	DEFAULT_CROPPER_MIN_ZOOM,
	DEFAULT_CROPPER_ZOOM_SPEED,
	clamp,
	clampPosition,
	cropperAreaVariants,
	cropperMediaVariants,
	getCropSize,
	getCroppedArea,
	getCropperContext,
	hasCropperContext,
	setCropperContext,
	snapToDevicePixel,
	useCropper,
	type CropperArea as CropperAreaData,
	type CropperCallbacks,
	type CropperMediaSize,
	type CropperObjectFit,
	type CropperPoint,
	type CropperShape,
	type CropperSize,
} from "./cropper.svelte.js";

export {
	Root,
	Image,
	Video,
	Area,
	//
	Root as Cropper,
	Image as CropperImage,
	Video as CropperVideo,
	Area as CropperArea,
};
