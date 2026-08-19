import { getContext, hasContext, setContext } from "svelte";
import { tv, type VariantProps } from "tailwind-variants";
import {
	clamp,
	clampPosition,
	getCropSize,
	getCroppedArea,
	type CropperArea,
	type CropperMediaSize,
	type CropperObjectFit,
	type CropperPoint,
	type CropperShape,
	type CropperSize,
} from "./cropper-geometry.js";

export * from "./cropper-geometry.js";

/** `aspectRatio` fallback — upstream `aspectRatio = 4 / 3`. */
export const DEFAULT_CROPPER_ASPECT_RATIO = 4 / 3;

/** `minZoom` / `maxZoom` fallbacks. */
export const DEFAULT_CROPPER_MIN_ZOOM = 1;
export const DEFAULT_CROPPER_MAX_ZOOM = 3;

/** `zoomSpeed` fallback. */
export const DEFAULT_CROPPER_ZOOM_SPEED = 1;

/** `keyboardStep` fallback, in pixels of crop travel per arrow press. */
export const DEFAULT_CROPPER_KEYBOARD_STEP = 1;

/** How long after the last wheel tick the gesture counts as finished. */
export const CROPPER_WHEEL_SETTLE_MS = 250;

/**
 * The media element's own classes, by fit.
 *
 * `will-change-transform` is the load-bearing one: the crop transform changes on every animation
 * frame of a drag, and without the hint the browser re-rasterises the whole picture each time.
 */
export const cropperMediaVariants = tv({
	base: "will-change-transform",
	variants: {
		objectFit: {
			contain: "absolute inset-0 m-auto max-h-full max-w-full",
			cover: "h-auto w-full",
			"horizontal-cover": "h-auto w-full",
			"vertical-cover": "h-full w-auto",
		},
	},
	defaultVariants: { objectFit: "contain" },
});

/**
 * The selection window.
 *
 * THE ONE PLACE THIS KIT USES RAW COLOURS ON PURPOSE. `border-white/90` and the black scrim are
 * not theme decisions — they sit on top of whatever photograph the user loaded, not on a themed
 * surface, and a crop frame that turned dark on a dark theme would vanish against a dark picture.
 * `CONVENTIONS.md` §8 bars raw colours because they break the palette; here there is no palette to
 * break, and the same reasoning already keeps `ui/media-player`'s picture-locked parts as they are.
 *
 * The scrim is a 9999em spread shadow rather than four positioned overlays: one box-shadow darkens
 * everything outside the frame at any container size, and it costs no extra elements.
 */
export const cropperAreaVariants = tv({
	base: "absolute top-1/2 left-1/2 box-border -translate-x-1/2 -translate-y-1/2 overflow-hidden border-[2.5px] border-white/90 shadow-[0_0_0_9999em_rgba(0,0,0,0.5)]",
	variants: {
		shape: {
			rectangle: "",
			circle: "rounded-full",
		},
		withGrid: {
			true: "before:absolute before:top-0 before:right-1/3 before:bottom-0 before:left-1/3 before:box-border before:border before:border-t-0 before:border-b-0 before:border-white/50 before:content-[''] after:absolute after:top-1/3 after:right-0 after:bottom-1/3 after:left-0 after:box-border after:border after:border-r-0 after:border-l-0 after:border-white/50 after:content-['']",
			false: "",
		},
	},
	defaultVariants: { shape: "rectangle", withGrid: false },
});

export type CropperAreaVariants = VariantProps<typeof cropperAreaVariants>;
export type CropperMediaVariants = VariantProps<typeof cropperMediaVariants>;

/** Everything a caller can be told about, as the crop moves. */
export interface CropperCallbacks {
	onCropChange?: (crop: CropperPoint) => void;
	onZoomChange?: (zoom: number) => void;
	onRotationChange?: (rotation: number) => void;
	onCropSizeChange?: (cropSize: CropperSize) => void;
	onMediaLoaded?: (mediaSize: CropperMediaSize) => void;
	/** Throttled to one animation frame while anything moves. */
	onCropAreaChange?: (percentages: CropperArea, pixels: CropperArea) => void;
	/** Fired once when an interaction finishes — the one to persist from. */
	onCropComplete?: (percentages: CropperArea, pixels: CropperArea) => void;
	onInteractionStart?: () => void;
	onInteractionEnd?: () => void;
}

/**
 * The cropper's whole model: the transform, the measured sizes, and the geometry that ties them.
 *
 * WHY THIS REPLACES UPSTREAM'S STORE. `cropper.tsx:320-588` builds a subscribe/getState/setState
 * store behind `useSyncExternalStore`, with a hand-rolled `batch()` so that a zoom writing both
 * `crop` and `zoom` notifies once. Runes already give both halves: `$state` fields are read
 * fine-grained by whoever reads them, and Svelte batches within a tick, so `batch()` has no work to
 * do. What survives from upstream is the part that is genuinely the component's own logic — the
 * callback fan-out, and the animation-frame throttle on `onCropAreaChange`.
 */
export class CropperState {
	/** Media offset from centre, in container pixels. */
	crop = $state<CropperPoint>({ x: 0, y: 0 });
	zoom = $state(DEFAULT_CROPPER_MIN_ZOOM);
	rotation = $state(0);

	/** Set once the media reports its dimensions. Null until then. */
	mediaSize = $state<CropperMediaSize | null>(null);
	/** The selection window, recomputed from the container and the aspect ratio. */
	cropSize = $state<CropperSize | null>(null);

	dragging = $state(false);
	wheelZooming = $state(false);

	// Configuration, republished by the root on every render.
	aspectRatio = $state(DEFAULT_CROPPER_ASPECT_RATIO);
	minZoom = $state(DEFAULT_CROPPER_MIN_ZOOM);
	maxZoom = $state(DEFAULT_CROPPER_MAX_ZOOM);
	zoomSpeed = $state(DEFAULT_CROPPER_ZOOM_SPEED);
	keyboardStep = $state(DEFAULT_CROPPER_KEYBOARD_STEP);
	shape = $state<CropperShape>("rectangle");
	objectFit = $state<CropperObjectFit>("contain");
	allowOverflow = $state(false);
	preventScrollZoom = $state(false);
	withGrid = $state(false);

	/** The interactive element, needed for every coordinate conversion. */
	root = $state<HTMLElement | null>(null);

	callbacks: CropperCallbacks = {};

	#areaFrame: number | null = null;

	/** Write a crop, clamped unless overflow is allowed, and notify only on a real move. */
	setCrop(next: CropperPoint, { clampToMedia = true } = {}): void {
		let resolved = next;
		if (clampToMedia && !this.allowOverflow && this.mediaSize && this.cropSize) {
			resolved = clampPosition(next, this.mediaSize, this.cropSize, this.zoom, this.rotation);
		}
		if (resolved.x === this.crop.x && resolved.y === this.crop.y) return;

		this.crop = resolved;
		this.callbacks.onCropChange?.(resolved);
		this.scheduleAreaChange();
	}

	setZoom(next: number): void {
		const clamped = clamp(next, this.minZoom, this.maxZoom);
		if (clamped === this.zoom) return;

		this.zoom = clamped;
		this.callbacks.onZoomChange?.(clamped);
		this.scheduleAreaChange();
	}

	setRotation(next: number): void {
		if (next === this.rotation) return;

		this.rotation = next;
		this.callbacks.onRotationChange?.(next);
		this.scheduleAreaChange();
	}

	/**
	 * Zoom about a point in client coordinates, so the pixel under the cursor stays under it.
	 *
	 * `anchor` is what separates a wheel zoom from a slider: without it the media zooms about its
	 * own centre and the detail the user was pointing at slides away.
	 */
	zoomAt(next: number, anchor: CropperPoint | null): void {
		if (!this.cropSize || !this.mediaSize || !this.root) {
			this.setZoom(next);
			return;
		}

		const clamped = clamp(next, this.minZoom, this.maxZoom);

		if (anchor) {
			const rect = this.root.getBoundingClientRect();
			const pointOnContent = {
				x: rect.width / 2 - (anchor.x - rect.left),
				y: rect.height / 2 - (anchor.y - rect.top),
			};
			const pointOnMedia = {
				x: (pointOnContent.x + this.crop.x) / this.zoom,
				y: (pointOnContent.y + this.crop.y) / this.zoom,
			};
			this.setCrop({
				x: pointOnMedia.x * clamped - pointOnContent.x,
				y: pointOnMedia.y * clamped - pointOnContent.y,
			});
		}

		this.setZoom(clamped);
		this.reclampCrop();
	}

	/** Pull the media back inside its bounds after a zoom or rotation changed them. */
	reclampCrop(): void {
		if (this.allowOverflow || !this.mediaSize || !this.cropSize) return;

		const next = clampPosition(this.crop, this.mediaSize, this.cropSize, this.zoom, this.rotation);
		if (Math.abs(next.x - this.crop.x) < 0.001 && Math.abs(next.y - this.crop.y) < 0.001) return;

		this.crop = next;
		this.callbacks.onCropChange?.(next);
		this.scheduleAreaChange();
	}

	/** Mark the start or end of an interaction, firing `onCropComplete` on the falling edge. */
	setDragging(next: boolean): void {
		if (next === this.dragging) return;
		this.dragging = next;

		if (next) {
			this.callbacks.onInteractionStart?.();
			return;
		}

		this.callbacks.onInteractionEnd?.();
		const area = this.currentArea();
		if (area) this.callbacks.onCropComplete?.(area.croppedAreaPercentages, area.croppedAreaPixels);
	}

	/** The selection right now, or null while the media has not reported its size. */
	currentArea() {
		if (!this.mediaSize || !this.cropSize) return null;
		return getCroppedArea(
			this.crop,
			this.mediaSize,
			this.cropSize,
			this.aspectRatio,
			this.zoom,
			this.rotation,
			this.allowOverflow,
		);
	}

	/**
	 * Report the selection at most once per frame.
	 *
	 * A drag writes `crop` on every animation frame, and `getCroppedArea` is not free — publishing
	 * synchronously from each setter would run it several times for one visual update.
	 */
	scheduleAreaChange(): void {
		if (!this.callbacks.onCropAreaChange || this.#areaFrame !== null) return;

		this.#areaFrame = requestAnimationFrame(() => {
			this.#areaFrame = null;
			const area = this.currentArea();
			if (area) {
				this.callbacks.onCropAreaChange?.(area.croppedAreaPercentages, area.croppedAreaPixels);
			}
		});
	}

	/**
	 * Measure the media against the container, and size the selection to match.
	 *
	 * Shared by the image and the video parts, which differ only in where the natural dimensions
	 * come from — `naturalWidth` on one, `videoWidth` on the other. Upstream expresses that as a
	 * hook taking a `getNaturalDimensions` callback; here the caller
	 * simply passes the two numbers, since it already has the element in hand.
	 */
	measure(media: HTMLElement, naturalWidth: number, naturalHeight: number): void {
		const content = this.root;
		if (!content || naturalWidth === 0 || naturalHeight === 0) return;

		const rect = content.getBoundingClientRect();
		if (rect.width === 0 || rect.height === 0) return;

		const containerAspect = rect.width / rect.height;
		const mediaAspect = naturalWidth / naturalHeight;
		const offsetWidth = (media as HTMLElement).offsetWidth;
		const offsetHeight = (media as HTMLElement).offsetHeight;

		// When the browser has already scaled the media down to fit, its offset box is the rendered
		// size and can be trusted. When it has not, the rendered size has to be derived from the fit
		// rule instead — reading the offset box then would measure the intrinsic size.
		const isScaledDown = offsetWidth < naturalWidth || offsetHeight < naturalHeight;

		let rendered: CropperSize;
		if (!isScaledDown) {
			rendered = { width: offsetWidth, height: offsetHeight };
		} else {
			switch (this.objectFit) {
				case "horizontal-cover":
					rendered = { width: rect.width, height: rect.width / mediaAspect };
					break;
				case "vertical-cover":
					rendered = { width: rect.height * mediaAspect, height: rect.height };
					break;
				case "cover":
					rendered =
						containerAspect < mediaAspect
							? { width: rect.width, height: rect.width / mediaAspect }
							: { width: rect.height * mediaAspect, height: rect.height };
					break;
				default:
					rendered =
						containerAspect > mediaAspect
							? { width: rect.height * mediaAspect, height: rect.height }
							: { width: rect.width, height: rect.width / mediaAspect };
			}
		}

		const mediaSize: CropperMediaSize = { ...rendered, naturalWidth, naturalHeight };
		this.mediaSize = mediaSize;
		this.callbacks.onMediaLoaded?.(mediaSize);

		const cropSize = getCropSize(
			mediaSize.width,
			mediaSize.height,
			rect.width,
			rect.height,
			this.aspectRatio,
			this.rotation,
		);
		this.cropSize = cropSize;
		this.callbacks.onCropSizeChange?.(cropSize);

		this.reclampCrop();
		this.scheduleAreaChange();
	}

	/** Cancel the pending area notification. Called when the root unmounts. */
	dispose(): void {
		if (this.#areaFrame === null) return;
		cancelAnimationFrame(this.#areaFrame);
		this.#areaFrame = null;
	}
}

const CROPPER_CONTEXT_KEY = Symbol("cropper");

export function setCropperContext(state: CropperState): CropperState {
	return setContext(CROPPER_CONTEXT_KEY, state);
}

export function hasCropperContext(): boolean {
	return hasContext(CROPPER_CONTEXT_KEY);
}

export function getCropperContext(part?: string): CropperState {
	if (!hasCropperContext()) {
		throw new Error(`${part ?? "This part"} must be used within <Cropper>.`);
	}
	return getContext<CropperState>(CROPPER_CONTEXT_KEY);
}

/**
 * Read the cropper's state from a descendant — upstream's `useCropper`.
 *
 * The whole state object, not a selector: a selector exists upstream to keep React from
 * re-rendering, and reading one field off a rune already has that property.
 */
export function useCropper(): CropperState {
	return getCropperContext("useCropper()");
}
