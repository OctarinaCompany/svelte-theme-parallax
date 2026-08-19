<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import type {
		CropperArea,
		CropperMediaSize,
		CropperObjectFit,
		CropperPoint,
		CropperShape,
		CropperSize,
	} from "./cropper.svelte.js";

	export type CropperRootProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/** Media offset from centre, in container pixels. Bindable. */
		crop?: CropperPoint;
		/** Scale factor. Bindable. @default 1 */
		zoom?: number;
		/** Degrees. Bindable. @default 0 */
		rotation?: number;
		/** @default 1 */
		minZoom?: number;
		/** @default 3 */
		maxZoom?: number;
		/** Multiplier on wheel travel. @default 1 */
		zoomSpeed?: number;
		/** Pixels of crop travel per arrow press; a fifth of that with shift. @default 1 */
		keyboardStep?: number;
		/** Width over height of the selection. @default 4 / 3 */
		aspectRatio?: number;
		/** @default "rectangle" */
		shape?: CropperShape;
		/** How the media is fitted before cropping. @default "contain" */
		objectFit?: CropperObjectFit;
		/** Let the selection run past the media's edges. @default false */
		allowOverflow?: boolean;
		/** Leave the wheel to the page instead of zooming. @default false */
		preventScrollZoom?: boolean;
		/** Draw rule-of-thirds guides inside the selection. @default false */
		withGrid?: boolean;
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
		/** Called before the wheel is handled; `preventDefault()` to keep the zoom from happening. */
		onWheelZoom?: (event: WheelEvent) => void;
	};

	/** Safari's pinch events, which are not in the DOM lib. */
	interface SafariGestureEvent extends UIEvent {
		rotation: number;
		scale: number;
		clientX: number;
		clientY: number;
	}
</script>

<script lang="ts">
	import { untrack } from "svelte";
	import {
		CROPPER_WHEEL_SETTLE_MS,
		CropperState,
		DEFAULT_CROPPER_ASPECT_RATIO,
		DEFAULT_CROPPER_KEYBOARD_STEP,
		DEFAULT_CROPPER_MAX_ZOOM,
		DEFAULT_CROPPER_MIN_ZOOM,
		DEFAULT_CROPPER_ZOOM_SPEED,
		getCenter,
		getDistanceBetweenPoints,
		getRotationBetweenPoints,
		setCropperContext,
	} from "./cropper.svelte.js";

	/**
	 * An image or video crop surface, with drag, wheel zoom, pinch-zoom-rotate and arrow keys.
	 *
	 * ONE COMPONENT WHERE UPSTREAM HAS TWO. React splits this into `Cropper` (which provides two
	 * contexts) and `CropperImpl` (which consumes them), because a provider cannot read its own
	 * context. `setContext` has no such rule — the same component can publish the state and use it
	 * — so the wrapper and the interactive surface are one file, and the two contexts collapse into
	 * one `CropperState`.
	 *
	 * THE POINTER LISTENERS LIVE ON `document`, not on the element. A crop drag that stopped the
	 * moment the cursor left the frame would be unusable, since the frame is exactly the region the
	 * user is dragging the picture out of. They are attached on press and removed on release.
	 */
	let {
		ref = $bindable(null),
		crop = $bindable(),
		zoom = $bindable(),
		rotation = $bindable(),
		minZoom = DEFAULT_CROPPER_MIN_ZOOM,
		maxZoom = DEFAULT_CROPPER_MAX_ZOOM,
		zoomSpeed = DEFAULT_CROPPER_ZOOM_SPEED,
		keyboardStep = DEFAULT_CROPPER_KEYBOARD_STEP,
		aspectRatio = DEFAULT_CROPPER_ASPECT_RATIO,
		shape = "rectangle",
		objectFit = "contain",
		allowOverflow = false,
		preventScrollZoom = false,
		withGrid = false,
		onCropChange,
		onZoomChange,
		onRotationChange,
		onCropSizeChange,
		onMediaLoaded,
		onCropAreaChange,
		onCropComplete,
		onInteractionStart,
		onInteractionEnd,
		onWheelZoom,
		class: className,
		children,
		...restProps
	}: CropperRootProps = $props();

	crop ??= untrack(() => ({ x: 0, y: 0 }));
	zoom ??= untrack(() => minZoom);
	rotation ??= untrack(() => 0);

	const cropper = new CropperState();
	setCropperContext(cropper);

	cropper.crop = crop;
	cropper.zoom = zoom;
	cropper.rotation = rotation;

	// Configuration flows down every render; the parts read it off the context rather than taking
	// ten props each.
	$effect(() => {
		cropper.aspectRatio = aspectRatio;
		cropper.minZoom = minZoom;
		cropper.maxZoom = maxZoom;
		cropper.zoomSpeed = zoomSpeed;
		cropper.keyboardStep = keyboardStep;
		cropper.shape = shape;
		cropper.objectFit = objectFit;
		cropper.allowOverflow = allowOverflow;
		cropper.preventScrollZoom = preventScrollZoom;
		cropper.withGrid = withGrid;
	});

	// Inbound half of the two-way binding: adopt a value the owner wrote, without echoing it back.
	$effect(() => {
		if (crop && (crop.x !== cropper.crop.x || crop.y !== cropper.crop.y)) cropper.crop = crop;
	});
	$effect(() => {
		if (zoom !== undefined && zoom !== cropper.zoom) {
			cropper.zoom = zoom;
			untrack(() => cropper.reclampCrop());
		}
	});
	$effect(() => {
		if (rotation !== undefined && rotation !== cropper.rotation) {
			cropper.rotation = rotation;
			untrack(() => cropper.reclampCrop());
		}
	});

	// Outbound half: the state notifies, the props follow.
	cropper.callbacks = {
		onCropChange: (next) => {
			crop = next;
			onCropChange?.(next);
		},
		onZoomChange: (next) => {
			zoom = next;
			onZoomChange?.(next);
		},
		onRotationChange: (next) => {
			rotation = next;
			onRotationChange?.(next);
		},
		onCropSizeChange: (next) => onCropSizeChange?.(next),
		onMediaLoaded: (next) => onMediaLoaded?.(next),
		onCropAreaChange: (percentages, pixels) => onCropAreaChange?.(percentages, pixels),
		onCropComplete: (percentages, pixels) => onCropComplete?.(percentages, pixels),
		onInteractionStart: () => onInteractionStart?.(),
		onInteractionEnd: () => onInteractionEnd?.(),
	};

	let surface = $state<HTMLElement | null>(null);
	$effect(() => {
		cropper.root = surface;
	});

	// Gesture bookkeeping. None of it is reactive: it is read and written inside handlers only, and
	// making it `$state` would invalidate readers sixty times a second for no visual change.
	let dragOrigin: CropperPoint = { x: 0, y: 0 };
	let dragOriginCrop: CropperPoint = { x: 0, y: 0 };
	let lastPinchDistance = 0;
	let lastPinchRotation = 0;
	let dragFrame: number | null = null;
	let pinchFrame: number | null = null;
	let wheelTimer: ReturnType<typeof setTimeout> | null = null;
	let touching = false;
	let gestureZoomStart = 0;
	let gestureRotationStart = 0;

	function cancelFrames() {
		if (dragFrame !== null) {
			cancelAnimationFrame(dragFrame);
			dragFrame = null;
		}
		if (pinchFrame !== null) {
			cancelAnimationFrame(pinchFrame);
			pinchFrame = null;
		}
		if (wheelTimer !== null) {
			clearTimeout(wheelTimer);
			wheelTimer = null;
		}
		touching = false;
	}

	function pointOf(event: MouseEvent | Touch): CropperPoint {
		return { x: Number(event.clientX), y: Number(event.clientY) };
	}

	function beginDrag(point: CropperPoint) {
		dragOrigin = point;
		dragOriginCrop = { ...cropper.crop };
		cropper.setDragging(true);
	}

	/**
	 * Move the media, once per frame.
	 *
	 * The 2px dead zone is upstream's and is what keeps a click from nudging
	 * the crop: a press-and-release always carries a pixel or two of pointer travel.
	 */
	function drag(point: CropperPoint) {
		if (dragFrame !== null) cancelAnimationFrame(dragFrame);

		dragFrame = requestAnimationFrame(() => {
			dragFrame = null;
			if (!cropper.cropSize || !cropper.mediaSize) return;

			const offsetX = point.x - dragOrigin.x;
			const offsetY = point.y - dragOrigin.y;
			if (Math.abs(offsetX) < 2 && Math.abs(offsetY) < 2) return;

			cropper.setCrop({ x: dragOriginCrop.x + offsetX, y: dragOriginCrop.y + offsetY });
		});
	}

	function onDocumentMouseMove(event: MouseEvent) {
		drag(pointOf(event));
	}

	function onDocumentTouchMove(event: TouchEvent) {
		event.preventDefault();

		const [first, second] = Array.from(event.touches);
		if (first && second) {
			const a = pointOf(first);
			const b = pointOf(second);
			const centre = getCenter(a, b);
			drag(centre);

			if (pinchFrame !== null) cancelAnimationFrame(pinchFrame);
			pinchFrame = requestAnimationFrame(() => {
				pinchFrame = null;

				const distance = getDistanceBetweenPoints(a, b);
				const ratio = lastPinchDistance === 0 ? 1 : distance / lastPinchDistance;
				if (Math.abs(ratio - 1) > 0.01) {
					cropper.zoomAt(cropper.zoom * ratio, null);
					lastPinchDistance = distance;
				}

				const angle = getRotationBetweenPoints(a, b);
				const delta = angle - lastPinchRotation;
				if (Math.abs(delta) > 0.5) {
					cropper.setRotation(cropper.rotation + delta);
					lastPinchRotation = angle;
				}
			});
			return;
		}

		if (first) drag(pointOf(first));
	}

	function endDrag() {
		touching = false;
		cropper.setDragging(false);
		cancelFrames();
		document.removeEventListener("mousemove", onDocumentMouseMove);
		document.removeEventListener("touchmove", onDocumentTouchMove);
		document.removeEventListener("mouseup", endDrag);
		document.removeEventListener("touchend", endDrag);
	}

	function onmousedown(event: MouseEvent & { currentTarget: HTMLDivElement }) {
		restProps.onmousedown?.(event);
		if (event.defaultPrevented) return;

		event.preventDefault();
		document.addEventListener("mousemove", onDocumentMouseMove);
		document.addEventListener("mouseup", endDrag);
		beginDrag(pointOf(event));
	}

	function ontouchstart(event: TouchEvent & { currentTarget: HTMLDivElement }) {
		restProps.ontouchstart?.(event);
		if (event.defaultPrevented) return;

		touching = true;
		// `passive: false` because `onDocumentTouchMove` calls `preventDefault` — without it the
		// browser scrolls the page instead of letting the drag through.
		document.addEventListener("touchmove", onDocumentTouchMove, { passive: false });
		document.addEventListener("touchend", endDrag);

		const [first, second] = Array.from(event.touches);
		if (first && second) {
			const a = pointOf(first);
			const b = pointOf(second);
			lastPinchDistance = getDistanceBetweenPoints(a, b);
			lastPinchRotation = getRotationBetweenPoints(a, b);
			beginDrag(getCenter(a, b));
			return;
		}
		if (first) beginDrag(pointOf(first));
	}

	/** Normalise the three `deltaMode` units to pixels. */
	function wheelDeltaY(event: WheelEvent): number {
		if (event.deltaMode === 1) return event.deltaY * 16;
		if (event.deltaMode === 2) return event.deltaY * 400;
		return event.deltaY;
	}

	function handleWheel(event: WheelEvent) {
		onWheelZoom?.(event);
		if (event.defaultPrevented) return;

		event.preventDefault();
		cropper.zoomAt(cropper.zoom - (wheelDeltaY(event) * cropper.zoomSpeed) / 200, pointOf(event));

		// A wheel has no end event, so the interaction is closed on a timer. That is what makes
		// `onCropComplete` fire once after the user stops scrolling rather than on every tick.
		cropper.wheelZooming = true;
		cropper.setDragging(true);

		if (wheelTimer !== null) clearTimeout(wheelTimer);
		wheelTimer = setTimeout(() => {
			wheelTimer = null;
			cropper.wheelZooming = false;
			cropper.setDragging(false);
		}, CROPPER_WHEEL_SETTLE_MS);
	}

	function onkeydown(event: KeyboardEvent & { currentTarget: HTMLDivElement }) {
		restProps.onkeydown?.(event);
		if (event.defaultPrevented || !cropper.cropSize || !cropper.mediaSize) return;

		const step = event.shiftKey ? cropper.keyboardStep * 0.2 : cropper.keyboardStep;
		const moves: Record<string, CropperPoint> = {
			ArrowUp: { x: cropper.crop.x, y: cropper.crop.y - step },
			ArrowDown: { x: cropper.crop.x, y: cropper.crop.y + step },
			ArrowLeft: { x: cropper.crop.x - step, y: cropper.crop.y },
			ArrowRight: { x: cropper.crop.x + step, y: cropper.crop.y },
		};

		const next = moves[event.key];
		if (!next) return;

		event.preventDefault();
		// Only the first press opens the interaction; `repeat` presses continue it, so a held arrow
		// produces one `onCropComplete` on release rather than one per repeat.
		if (!event.repeat) cropper.setDragging(true);
		cropper.setCrop(next);
	}

	function onkeyup(event: KeyboardEvent & { currentTarget: HTMLDivElement }) {
		restProps.onkeyup?.(event);
		if (event.defaultPrevented) return;

		if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) {
			event.preventDefault();
			cropper.setDragging(false);
		}
	}

	/**
	 * Safari's pinch, which arrives as `gesture*` rather than as two touches.
	 *
	 * Ignored while `touching`, because on an iPad both families fire for one pinch and applying
	 * each would double the zoom.
	 */
	function onGestureChange(event: Event) {
		const gesture = event as SafariGestureEvent;
		gesture.preventDefault();
		if (touching) return;

		cropper.zoomAt(gestureZoomStart - 1 + gesture.scale, {
			x: gesture.clientX,
			y: gesture.clientY,
		});
		cropper.setRotation(gestureRotationStart + gesture.rotation);
	}

	// Shared with the unmount teardown, so a component destroyed mid-gesture does not leave
	// document-level handlers driving the disposed cropper.
	function removeGestureListeners() {
		document.removeEventListener("gesturechange", onGestureChange);
		document.removeEventListener("gestureend", onGestureEnd);
	}

	function onGestureEnd(event: Event) {
		event.preventDefault();
		removeGestureListeners();
	}

	function onGestureStart(event: Event) {
		event.preventDefault();
		const gesture = event as SafariGestureEvent;
		gestureZoomStart = cropper.zoom;
		gestureRotationStart = cropper.rotation;
		document.addEventListener("gesturechange", onGestureChange);
		document.addEventListener("gestureend", onGestureEnd);
		void gesture;
	}

	$effect(() => {
		const element = surface;
		if (!element) return;

		// `passive: false` on the wheel, or `preventDefault` is ignored and the page scrolls under
		// the crop. This is also why the listener is attached here rather than written as
		// `onwheel` in the markup — Svelte attaches those passively.
		if (!preventScrollZoom) {
			element.addEventListener("wheel", handleWheel, { passive: false });
		}
		element.addEventListener("gesturestart", onGestureStart);

		return () => {
			element.removeEventListener("wheel", handleWheel);
			element.removeEventListener("gesturestart", onGestureStart);
		};
	});

	$effect(() => {
		return () => {
			cancelFrames();
			endDrag();
			removeGestureListeners();
			cropper.dispose();
		};
	});

	// The four handlers above already forward the caller's versions, so they must not also be
	// spread onto the element — doing both would run each one twice. `$derived`, because
	// destructuring `restProps` once would freeze it at its first value.
	const rest = $derived.by(() => {
		const {
			onmousedown: _mousedown,
			ontouchstart: _touchstart,
			onkeydown: _keydown,
			onkeyup: _keyup,
			...remaining
		} = restProps;
		return remaining;
	});
</script>

<div
	bind:this={ref}
	data-slot="cropper-wrapper"
	class={cn("relative size-full overflow-hidden", className)}
>
	<!--
		`tabindex="0"` makes the surface itself the keyboard target: the arrows move the crop, so the
		thing that receives them has to be the thing being cropped. `touch-none` keeps the browser
		from claiming a drag as a scroll before `touchmove` is delivered.

		The a11y rule fires because a `div` is not an interactive element by default. It is one here:
		`role="application"` tells assistive technology to pass the arrow keys through to this
		surface instead of using them for its own reading cursor, which is exactly what a pan-and-
		zoom canvas needs, and it is the only role that describes a control with two free axes and no
		value to announce. Same reasoning as `data-grid-column-resizer.svelte:133`.
	-->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		bind:this={surface}
		data-slot="cropper"
		data-dragging={cropper.dragging ? "" : undefined}
		tabindex="0"
		role="application"
		aria-label="Crop area"
		{...rest}
		class="absolute inset-0 flex cursor-move touch-none items-center justify-center overflow-hidden outline-none select-none"
		{onmousedown}
		{ontouchstart}
		{onkeydown}
		{onkeyup}
	>
		{@render children?.()}
	</div>
</div>
