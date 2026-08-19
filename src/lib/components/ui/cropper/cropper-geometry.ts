/**
 * The cropper's geometry.
 *
 * Pure functions and their caches, deliberately kept out of `cropper.svelte.ts`: none of this
 * touches Svelte, and a crop rectangle is the kind of arithmetic that is worth being able to reason
 * about — and test — without mounting anything.
 */

/** A point in the cropper's own coordinate space, origin at the centre of the crop box. */
export interface CropperPoint {
	x: number;
	y: number;
}

export interface CropperSize {
	width: number;
	height: number;
}

/** A rectangle, in percentages of the media or in natural pixels depending on who returns it. */
export interface CropperArea {
	width: number;
	height: number;
	x: number;
	y: number;
}

/** The displayed size of the media, and the size it was actually decoded at. */
export interface CropperMediaSize {
	width: number;
	height: number;
	naturalWidth: number;
	naturalHeight: number;
}

/** `circle` only changes the mask and the overlay; the crop maths is identical. */
export const CROPPER_SHAPES = ["rectangle", "circle"] as const;
export type CropperShape = (typeof CROPPER_SHAPES)[number];

export const CROPPER_OBJECT_FITS = [
	"contain",
	"cover",
	"horizontal-cover",
	"vertical-cover",
] as const;
export type CropperObjectFit = (typeof CROPPER_OBJECT_FITS)[number];

/** Upstream `MAX_CACHE_SIZE`. */
const MAX_CACHE_SIZE = 200;

/**
 * Device pixel ratio, read once.
 *
 * Upstream reads it at module scope too. It is the quantisation step for the
 * caches below, not a layout value, so a user dragging the window between a retina and a non-retina
 * screen gets slightly coarser cache keys rather than a wrong crop.
 */
const DPR = typeof window !== "undefined" ? (window.devicePixelRatio ?? 1) : 1;

const rotationSizeCache = new Map<string, CropperSize>();
const cropSizeCache = new Map<string, CropperSize>();
const croppedAreaCache = new Map<
	string,
	{ croppedAreaPercentages: CropperArea; croppedAreaPixels: CropperArea }
>();
const positionClampCache = new Map<string, CropperPoint>();

export function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

/**
 * Round to a step, so that near-identical inputs share a cache entry.
 *
 * Every one of these exists to keep the caches below from filling with a new key on every
 * sub-pixel of a drag — quantising the KEY, never the value that gets used.
 */
export function quantize(n: number, step = 2 / DPR): number {
	return Math.round(n / step) * step;
}

export function quantizePosition(n: number, step = 4 / DPR): number {
	return Math.round(n / step) * step;
}

export function quantizeZoom(n: number, step = 0.01): number {
	return Math.round(n / step) * step;
}

export function quantizeRotation(n: number, step = 1): number {
	return Math.round(n / step) * step;
}

/** Land a length on a whole device pixel, so an edge does not render as a blurred half-pixel. */
export function snapToDevicePixel(n: number): number {
	return Math.round(n * DPR) / DPR;
}

/** Read through, promoting the entry to most-recently-used. */
function lruGet<K, V>(map: Map<K, V>, key: K): V | undefined {
	const value = map.get(key);
	if (value !== undefined) {
		map.delete(key);
		map.set(key, value);
	}
	return value;
}

/** Write through, evicting the least-recently-used entry past `max`. */
function lruSet<K, V>(map: Map<K, V>, key: K, value: V, max = MAX_CACHE_SIZE): void {
	if (map.has(key)) map.delete(key);
	map.set(key, value);
	if (map.size > max) {
		const oldest = map.keys().next().value;
		if (oldest !== undefined) map.delete(oldest);
	}
}

export function getDistanceBetweenPoints(a: CropperPoint, b: CropperPoint): number {
	return Math.sqrt((a.y - b.y) ** 2 + (a.x - b.x) ** 2);
}

export function getCenter(a: CropperPoint, b: CropperPoint): CropperPoint {
	return { x: (b.x + a.x) * 0.5, y: (b.y + a.y) * 0.5 };
}

export function getRotationBetweenPoints(a: CropperPoint, b: CropperPoint): number {
	return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

export function getRadianAngle(degrees: number): number {
	return (degrees * Math.PI) / 180;
}

/** The axis-aligned bounding box a rotated rectangle occupies. */
export function rotateSize(width: number, height: number, rotation: number): CropperSize {
	const cacheKey = `${quantize(width)}-${quantize(height)}-${quantizeRotation(rotation)}`;
	const cached = lruGet(rotationSizeCache, cacheKey);
	if (cached) return cached;

	const rad = getRadianAngle(rotation);
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);

	const result: CropperSize = {
		width: Math.abs(cos * width) + Math.abs(sin * height),
		height: Math.abs(sin * width) + Math.abs(cos * height),
	};

	lruSet(rotationSizeCache, cacheKey, result);
	return result;
}

/** The largest box of the requested aspect ratio that fits both the media and the container. */
export function getCropSize(
	mediaWidth: number,
	mediaHeight: number,
	contentWidth: number,
	contentHeight: number,
	aspect: number,
	rotation = 0,
): CropperSize {
	const cacheKey = `${quantize(mediaWidth, 8)}-${quantize(mediaHeight, 8)}-${quantize(contentWidth, 8)}-${quantize(contentHeight, 8)}-${quantize(aspect, 0.01)}-${quantizeRotation(rotation)}`;
	const cached = lruGet(cropSizeCache, cacheKey);
	if (cached) return cached;

	const { width, height } = rotateSize(mediaWidth, mediaHeight, rotation);
	const fittingWidth = Math.min(width, contentWidth);
	const fittingHeight = Math.min(height, contentHeight);

	const result: CropperSize =
		fittingWidth > fittingHeight * aspect
			? { width: fittingHeight * aspect, height: fittingHeight }
			: { width: fittingWidth, height: fittingWidth / aspect };

	lruSet(cropSizeCache, cacheKey, result);
	return result;
}

/** Hold the media so its edges never travel inside the crop box. */
export function clampPosition(
	position: CropperPoint,
	mediaSize: CropperSize,
	cropSize: CropperSize,
	zoom: number,
	rotation = 0,
): CropperPoint {
	const cacheKey = `${quantizePosition(position.x)}-${quantizePosition(position.y)}-${quantize(mediaSize.width)}-${quantize(mediaSize.height)}-${quantize(cropSize.width)}-${quantize(cropSize.height)}-${quantizeZoom(zoom)}-${quantizeRotation(rotation)}`;
	const cached = lruGet(positionClampCache, cacheKey);
	if (cached) return cached;

	const { width, height } = rotateSize(mediaSize.width, mediaSize.height, rotation);
	const maxX = width * zoom * 0.5 - cropSize.width * 0.5;
	const maxY = height * zoom * 0.5 - cropSize.height * 0.5;

	const result: CropperPoint = {
		x: clamp(position.x, -maxX, maxX),
		y: clamp(position.y, -maxY, maxY),
	};

	lruSet(positionClampCache, cacheKey, result);
	return result;
}

/**
 * The selected region, twice: as percentages of the displayed media, and as pixels of the
 * original.
 *
 * The pixel rectangle is what a caller feeds to a canvas to actually produce the cropped file, so
 * it is derived from `naturalWidth`/`naturalHeight` rather than from the on-screen size — a crop
 * taken from a picture displayed at 400px must still cut the full-resolution original.
 */
export function getCroppedArea(
	crop: CropperPoint,
	mediaSize: CropperMediaSize,
	cropSize: CropperSize,
	aspect: number,
	zoom: number,
	rotation = 0,
	allowOverflow = false,
): { croppedAreaPercentages: CropperArea; croppedAreaPixels: CropperArea } {
	const cacheKey = `${quantizePosition(crop.x)}-${quantizePosition(crop.y)}-${quantize(mediaSize.width)}-${quantize(mediaSize.height)}-${quantize(mediaSize.naturalWidth)}-${quantize(mediaSize.naturalHeight)}-${quantize(cropSize.width)}-${quantize(cropSize.height)}-${quantize(aspect, 0.01)}-${quantizeZoom(zoom)}-${quantizeRotation(rotation)}-${allowOverflow}`;
	const cached = lruGet(croppedAreaCache, cacheKey);
	if (cached) return cached;

	// `allowOverflow` lets the selection run past the media's edges, which is what a caller wants
	// when they intend to letterbox the result rather than refuse the crop.
	const limit = allowOverflow
		? (_max: number, value: number) => value
		: (max: number, value: number) => Math.min(max, Math.max(0, value));

	const mediaBox = rotateSize(mediaSize.width, mediaSize.height, rotation);
	const naturalBox = rotateSize(mediaSize.naturalWidth, mediaSize.naturalHeight, rotation);

	const croppedAreaPercentages: CropperArea = {
		x: limit(
			100,
			(((mediaBox.width - cropSize.width / zoom) / 2 - crop.x / zoom) / mediaBox.width) * 100,
		),
		y: limit(
			100,
			(((mediaBox.height - cropSize.height / zoom) / 2 - crop.y / zoom) / mediaBox.height) * 100,
		),
		width: limit(100, ((cropSize.width / mediaBox.width) * 100) / zoom),
		height: limit(100, ((cropSize.height / mediaBox.height) * 100) / zoom),
	};

	const widthInPixels = Math.round(
		limit(naturalBox.width, (croppedAreaPercentages.width * naturalBox.width) / 100),
	);
	const heightInPixels = Math.round(
		limit(naturalBox.height, (croppedAreaPercentages.height * naturalBox.height) / 100),
	);

	// Whichever axis is the binding constraint decides the other, so the pixel rectangle keeps the
	// requested aspect ratio exactly rather than inheriting two independent roundings.
	const isWiderThanHigh = naturalBox.width >= naturalBox.height * aspect;
	const sizePixels: CropperSize = isWiderThanHigh
		? { width: Math.round(heightInPixels * aspect), height: heightInPixels }
		: { width: widthInPixels, height: Math.round(widthInPixels / aspect) };

	const croppedAreaPixels: CropperArea = {
		...sizePixels,
		x: Math.round(
			limit(
				naturalBox.width - sizePixels.width,
				(croppedAreaPercentages.x * naturalBox.width) / 100,
			),
		),
		y: Math.round(
			limit(
				naturalBox.height - sizePixels.height,
				(croppedAreaPercentages.y * naturalBox.height) / 100,
			),
		),
	};

	const result = { croppedAreaPercentages, croppedAreaPixels };
	lruSet(croppedAreaCache, cacheKey, result);
	return result;
}
