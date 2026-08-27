<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Cropper from "$lib/components/ui/cropper/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Label } from "$lib/components/ui/label/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import { Slider } from "$lib/components/ui/slider/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
	import { SAMPLE_IMAGE_SRC } from "./cropper-sample-image.js";

	/**
	 * The Cropper component page.
	 *
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. Its own image handling stops at the avatar, and the classic framework ships
	 * no cropper at all, so nothing here is skinned against a classic surface.
	 *
	 * THE ONE PLACE THIS KIT WRITES RAW COLOURS ON PURPOSE is the selection frame — white border,
	 * black scrim. It sits over whatever photograph the user loaded rather than over a themed
	 * surface, so a frame that followed the palette would disappear against a dark picture in dark
	 * mode. `cropper.svelte.ts` records the reasoning beside the variants; it is the same argument
	 * that keeps `ui/media-player`'s picture-locked parts as they are.
	 *
	 * NO REMOTE IMAGE: upstream loads a stock photograph. The scene here is drawn and inlined
	 * as a data URI — see `cropper-sample-image.ts`, which also explains why a flat `bg-muted`
	 * block, the answer the Aspect ratio page gives, is the wrong one for a cropper.
	 */

	let crop = $state<Cropper.CropperPoint>({ x: 0, y: 0 });
	let zoom = $state(1);

	let shapedCrop = $state<Cropper.CropperPoint>({ x: 0, y: 0 });
	let shapedZoom = $state(1);
	let shape = $state<Cropper.CropperShape>("rectangle");
	let objectFit = $state<Cropper.CropperObjectFit>("contain");
	let withGrid = $state(false);
	let allowOverflow = $state(false);

	let liveCrop = $state<Cropper.CropperPoint>({ x: 0, y: 0 });
	let liveZoom = $state(1);
	let liveRotation = $state(0);
	let pixels = $state<Cropper.CropperAreaData | null>(null);
	let completed = $state<Cropper.CropperAreaData | null>(null);

	function reset() {
		liveCrop = { x: 0, y: 0 };
		liveZoom = 1;
		liveRotation = 0;
	}

	const shapes: { label: string; value: Cropper.CropperShape }[] = [
		{ label: "Rectangle", value: "rectangle" },
		{ label: "Circle", value: "circle" },
	];

	const fits: { label: string; value: Cropper.CropperObjectFit }[] = [
		{ label: "Contain", value: "contain" },
		{ label: "Cover", value: "cover" },
		{ label: "Horizontal cover", value: "horizontal-cover" },
		{ label: "Vertical cover", value: "vertical-cover" },
	];

	type PropRow = { prop: string; type: string; default: string; description: string };

	const rootProps: PropRow[] = [
		{
			prop: "crop",
			type: "CropperPoint",
			default: "{ x: 0, y: 0 }",
			description:
				"Bindable; the media's offset from the container centre, in container pixels. Moves made on the surface are clamped so the media's edges never enter the selection unless `allowOverflow`; a value written from outside is adopted as-is, without clamping and without firing `onCropChange`.",
		},
		{
			prop: "zoom",
			type: "number",
			default: "minZoom",
			description:
				"Bindable; the scale factor applied to the media. Wheel, pinch and gesture zooms are clamped to `minZoom`–`maxZoom` and fire `onZoomChange`; a value written from outside is applied unclamped and silently, then the crop is re-clamped to the new bounds.",
		},
		{
			prop: "rotation",
			type: "number",
			default: "0",
			description:
				"Bindable; rotation of the media in degrees, clockwise positive, applied about the media's own centre — the transform is `translate(crop) rotate() scale()` with the default origin, so the pivot moves with `crop` and coincides with the container centre only at `{ x: 0, y: 0 }`. Only two-finger pinch and Safari gestures change it from the surface — the wheel and the arrow keys do not. An outside write re-clamps the crop against the rotated bounding box.",
		},
		{
			prop: "minZoom",
			type: "number",
			default: "1",
			description:
				"Lower bound on every zoom made from the surface, and the value `zoom` starts at when not supplied. Not enforced on a `zoom` written from outside.",
		},
		{
			prop: "maxZoom",
			type: "number",
			default: "3",
			description:
				"Upper bound on every zoom made from the surface. Not enforced on a `zoom` written from outside.",
		},
		{
			prop: "zoomSpeed",
			type: "number",
			default: "1",
			description:
				"Multiplier on wheel travel: a tick changes the zoom by its `deltaY` (normalised to pixels) × `zoomSpeed` / 200, so 100px of scroll at 1 moves the zoom by 0.5. Scrolling down zooms out. Pinch and gesture zooms ignore it.",
		},
		{
			prop: "keyboardStep",
			type: "number",
			default: "1",
			description:
				"Pixels of crop travel per arrow press while the surface has focus; a fifth of that with Shift held. A held key repeats the move but counts as one interaction, so `onCropComplete` fires once on release.",
		},
		{
			prop: "aspectRatio",
			type: "number",
			default: "4 / 3",
			description:
				"Width over height of the selection. The selection is the largest box of that ratio fitting both the rotated media and the container, and it is sized when the media is measured — on load and on container resize — not on a later change of this prop alone.",
		},
		{
			prop: "shape",
			type: "'rectangle' | 'circle'",
			default: "'rectangle'",
			description:
				"Mask of the selection frame: `'circle'` rounds `Cropper.Area` fully. The crop maths is identical, so the reported areas are always the bounding rectangle.",
		},
		{
			prop: "objectFit",
			type: "'contain' | 'cover' | 'horizontal-cover' | 'vertical-cover'",
			default: "'contain'",
			description:
				"How the media is fitted to the container before any crop maths. It sets two things that do not always agree: the media's sizing classes, and the rule its rendered size is derived from when measured. `'contain'` shows it whole; `'horizontal-cover'` always fills the width and `'vertical-cover'` the height, in both the classes and the measure. `'cover'` measures along whichever axis binds, but its classes are the same `h-auto w-full` as `'horizontal-cover'`, so on screen it always fills the width — in a container wider than the media's aspect the measure and the picture disagree.",
		},
		{
			prop: "allowOverflow",
			type: "boolean",
			default: "false",
			description:
				"Lets the selection run past the media's edges: the crop offset is no longer clamped to the media, and the reported areas may carry negative or over-100% percentages and pixels outside the natural size. For a caller that letterboxes the result rather than refusing the crop.",
		},
		{
			prop: "preventScrollZoom",
			type: "boolean",
			default: "false",
			description:
				"Leaves the wheel to the page: no wheel listener is attached, so scrolling over the surface scrolls normally and `onWheelZoom` never fires. Pinch and gesture zoom still work.",
		},
		{
			prop: "withGrid",
			type: "boolean",
			default: "false",
			description:
				"Draws rule-of-thirds guides inside the selection, two translucent white lines per axis. `Cropper.Area` can override it per element.",
		},
		{
			prop: "onCropChange",
			type: "(crop: CropperPoint) => void",
			default: "—",
			description:
				"Called with the clamped offset whenever the crop actually moves from inside the cropper — a drag, an arrow key, an anchored zoom, or the re-clamp that follows a zoom or rotation change. Not called for a value written into `crop` from outside.",
		},
		{
			prop: "onZoomChange",
			type: "(zoom: number) => void",
			default: "—",
			description:
				"Called with the clamped zoom after a wheel tick, pinch or gesture that changed it. Silent when the clamp leaves the value where it was, and for an outside write to `zoom`.",
		},
		{
			prop: "onRotationChange",
			type: "(rotation: number) => void",
			default: "—",
			description:
				"Called after a pinch or Safari gesture changes the rotation. Silent for an outside write to `rotation`.",
		},
		{
			prop: "onCropSizeChange",
			type: "(cropSize: CropperSize) => void",
			default: "—",
			description:
				"Called with the selection's width and height in container pixels every time the media is measured — on load and on each container resize — just after `onMediaLoaded`.",
		},
		{
			prop: "onMediaLoaded",
			type: "(mediaSize: CropperMediaSize) => void",
			default: "—",
			description:
				"Called with the media's rendered size and its natural size every time it is measured, which includes container resizes, not only the first load. A media or container with a zero dimension is skipped, and so is the call.",
		},
		{
			prop: "onCropAreaChange",
			type: "(percentages: CropperArea, pixels: CropperArea) => void",
			default: "—",
			description:
				"Called with the selection as percentages of the displayed media and as pixels of the original, throttled to one animation frame while anything moves, and once more after each measurement. The frame is scheduled and the area computed whether or not this prop is given — the root always installs a forwarding wrapper on the state — so leaving it out saves no work.",
		},
		{
			prop: "onCropComplete",
			type: "(percentages: CropperArea, pixels: CropperArea) => void",
			default: "—",
			description:
				"Fired once when an interaction finishes — pointer release, arrow-key release, or 250 ms after the last wheel tick — with the same two rectangles. The one to persist from. Skipped while the media has not been measured.",
		},
		{
			prop: "onInteractionStart",
			type: "() => void",
			default: "—",
			description:
				"Called when a drag, pinch, arrow press or wheel burst begins. A held arrow key or a run of wheel ticks opens one interaction, not one per event.",
		},
		{
			prop: "onInteractionEnd",
			type: "() => void",
			default: "—",
			description: "Called when that interaction ends, immediately before `onCropComplete`.",
		},
		{
			prop: "onWheelZoom",
			type: "(event: WheelEvent) => void",
			default: "—",
			description:
				"Called with the raw wheel event before the zoom is applied. The listener is non-passive, so `preventDefault()` here cancels the zoom for that tick and swallows the wheel with it — the page does not scroll either; nothing happens. Never called while `preventScrollZoom` is set.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description:
				'Bindable reference to the outer wrapper `div` (`data-slot="cropper-wrapper"`), not to the focusable surface inside it. Declared as the `WithElementRef` default `HTMLElement`, not `HTMLDivElement`.',
		},
		{
			prop: "class",
			type: "ClassValue | undefined | null",
			default: "—",
			description:
				"Merged onto the outer wrapper, which is `relative` and full-size — this is where a height goes, since the surface fills it absolutely.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"Rendered inside the interactive surface; the `Image` or `Video` part and the `Area` go here.",
		},
	];

	const imageProps: PropRow[] = [
		{
			prop: "objectFit",
			type: "'contain' | 'cover' | 'horizontal-cover' | 'vertical-cover'",
			default: "—",
			description:
				"Overrides the root's fit for this element's sizing classes only. The measurement that sizes the selection still follows the root's `objectFit`, so an override here can make the two disagree.",
		},
		{
			prop: "snapPixels",
			type: "boolean",
			default: "false",
			description:
				"Rounds the translate to whole device pixels, trading a little smoothness during a drag for a crisper still. Applies to the crop offset only, not to the zoom or rotation.",
		},
		{
			prop: "ref",
			type: "HTMLImageElement | null",
			default: "null",
			description:
				"Bindable reference to the `img`. It is measured from `naturalWidth`/`naturalHeight` on `load`, or at mount when the image is already `complete` from cache, since `load` will not fire again then.",
		},
		{
			prop: "class",
			type: "ClassValue | undefined | null",
			default: "—",
			description: "Merged after the fit classes and `will-change-transform`.",
		},
		{
			prop: "style",
			type: "string | undefined | null",
			default: "—",
			description:
				"Appended after the computed `transform`, so a caller `transform` would replace the crop.",
		},
		{
			prop: "onload",
			type: "EventHandler<Event, Element> | undefined | null",
			default: "—",
			description:
				"Called after the cropper has tried to measure the image, so `onMediaLoaded` has already fired by the time it runs when the measurement went through. When it is skipped — an image reporting a zero `naturalWidth`, or a surface with a zero width or height — `onload` still runs, with no `onMediaLoaded` before it. Typed as the bare `img` attribute declares it — `currentTarget` is not narrowed to `HTMLImageElement`; use `ref` for the element.",
		},
	];

	const videoProps: PropRow[] = [
		{
			prop: "objectFit",
			type: "'contain' | 'cover' | 'horizontal-cover' | 'vertical-cover'",
			default: "—",
			description:
				"Overrides the root's fit for this element's sizing classes only. The measurement that sizes the selection still follows the root's `objectFit`, so an override here can make the two disagree.",
		},
		{
			prop: "snapPixels",
			type: "boolean",
			default: "false",
			description:
				"Rounds the translate to whole device pixels. Applies to the crop offset only, not to the zoom or rotation.",
		},
		{
			prop: "ref",
			type: "HTMLVideoElement | null",
			default: "null",
			description:
				"Bindable reference to the `video`. It is measured from `videoWidth`/`videoHeight` on `loadedmetadata`, or at mount when `readyState` already reports metadata from cache.",
		},
		{
			prop: "class",
			type: "ClassValue | undefined | null",
			default: "—",
			description: "Merged after the fit classes and `will-change-transform`.",
		},
		{
			prop: "style",
			type: "string | undefined | null",
			default: "—",
			description:
				"Appended after the computed `transform`, so a caller `transform` would replace the crop.",
		},
		{
			prop: "onloadedmetadata",
			type: "EventHandler<Event, HTMLVideoElement> | undefined | null",
			default: "—",
			description:
				"Called after the cropper has tried to measure the video, so `onMediaLoaded` has already fired by the time it runs when the measurement went through. When it is skipped — a zero `videoWidth`, or a surface with a zero width or height — `onloadedmetadata` still runs, with no `onMediaLoaded` before it.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "Rendered inside the `video`: `source` and `track` elements.",
		},
	];

	const areaProps: PropRow[] = [
		{
			prop: "shape",
			type: "'rectangle' | 'circle'",
			default: "—",
			description:
				"Overrides the root's shape for this element only. `'circle'` rounds the frame fully; the resolved value is also exposed as `data-shape`.",
		},
		{
			prop: "withGrid",
			type: "boolean",
			default: "—",
			description:
				"Overrides the root's grid setting for this element only; the guides are the frame's own pseudo-elements.",
		},
		{
			prop: "snapPixels",
			type: "boolean",
			default: "false",
			description:
				"Rounds the frame's width and height to whole CSS pixels so its 2.5px border lands on the pixel grid. Unlike the media parts, this rounds to CSS pixels, not device pixels.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description:
				"Bindable reference to the frame `div`, declared as the `WithElementRef` default `HTMLElement`. Stays `null` until the media has been measured, because nothing is rendered before then.",
		},
		{
			prop: "class",
			type: "ClassValue | undefined | null",
			default: "—",
			description:
				"Merged after the frame's own classes — the centring transform, the white border and the scrim shadow.",
		},
		{
			prop: "style",
			type: "string | undefined | null",
			default: "—",
			description:
				"Appended after the computed `width` and `height`, so a caller's own would replace them.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "Rendered inside the frame, over the media.",
		},
	];

	// Upstream exports a `useCropper(selector)` hook so a custom overlay can subscribe to one slice
	// of the store. Runes subscribe on read, so the port's `useCropper()` returns the whole state and
	// every field read off it is tracked individually.
	const cropperStateExample = `<script lang="ts">
	import { useCropper } from "$lib/components/ui/cropper/index.js";

	// Call this during initialisation of any component rendered inside <Cropper.Root>.
	// It throws when there is no root above it.
	const cropper = useCropper();
${"<"}/script>

<p>zoom {cropper.zoom.toFixed(2)} — {cropper.dragging ? 'dragging' : 'idle'}</p>`;

	type StateRow = { member: string; type: string; description: string };

	const cropperStateMembers: StateRow[] = [
		{
			member: "crop",
			type: "CropperPoint",
			description:
				"The media's offset from the container centre in container pixels — the root's `crop` after clamping. Reactive: a template reading it updates on every frame of a drag.",
		},
		{
			member: "zoom / rotation",
			type: "number",
			description:
				"The scale factor and the rotation in degrees, the same values as the root's props of those names.",
		},
		{
			member: "mediaSize",
			type: "CropperMediaSize | null",
			description:
				"The media's rendered and natural size, `null` until the image or video has been measured. `Cropper.Area` renders nothing while it is `null`.",
		},
		{
			member: "cropSize",
			type: "CropperSize | null",
			description:
				"The selection's width and height in container pixels, `null` until measured; set just after `mediaSize` on each measurement.",
		},
		{
			member: "dragging",
			type: "boolean",
			description:
				"`true` from the start of an interaction to its end — a pointer drag, a pinch, a held arrow key, or a wheel burst until 250 ms after its last tick. Also exposed as `data-dragging` on the surface.",
		},
		{
			member: "wheelZooming",
			type: "boolean",
			description:
				"`true` from a wheel tick until the 250 ms settle timer runs out; a subset of `dragging`.",
		},
		{
			member:
				"aspectRatio / minZoom / maxZoom / zoomSpeed / keyboardStep / shape / objectFit / allowOverflow / preventScrollZoom / withGrid",
			type: "—",
			description:
				"The root's configuration, republished from its props on every render; the media parts and `Cropper.Area` read their fallbacks from here.",
		},
		{
			member: "root",
			type: "HTMLElement | null",
			description:
				"The focusable surface `div`, not the wrapper the root's `ref` exposes; every coordinate conversion and every measurement is taken against its bounding box.",
		},
		{
			member: "callbacks",
			type: "CropperCallbacks",
			description:
				"The root's fan-out object, which forwards each notification to the matching prop and writes the bound values back. The root sets it once; replacing it from a descendant cuts the bindings.",
		},
		{
			member: "setCrop / setZoom / setRotation",
			type: "(…) => void",
			description:
				"The mutators the surface uses. `setCrop` clamps to the media unless `allowOverflow` or `{ clampToMedia: false }`, `setZoom` clamps to `minZoom`–`maxZoom`, `setRotation` does not clamp; each fires its callback only when the value actually changed, and schedules the area frame.",
		},
		{
			member: "zoomAt",
			type: "(next: number, anchor: CropperPoint | null) => void",
			description:
				"Zoom about a client-space point so the pixel under it stays put — the wheel and pinch path. With a `null` anchor, or before the media is measured, it falls back to `setZoom`; it re-clamps the crop afterwards.",
		},
		{
			member: "reclampCrop",
			type: "() => void",
			description:
				"Pull the crop back inside the media after a zoom or rotation changed the bounds, firing `onCropChange` when it moved. A no-op with `allowOverflow`, before measurement, or when the move would be under a thousandth of a pixel.",
		},
		{
			member: "setDragging",
			type: "(next: boolean) => void",
			description:
				"Open or close an interaction. `true` fires `onInteractionStart`; `false` fires `onInteractionEnd` and then `onCropComplete` with the current area — only `onInteractionEnd` while the media has not been measured. Repeats of the current value are ignored.",
		},
		{
			member: "currentArea",
			type: "() => { croppedAreaPercentages: CropperArea; croppedAreaPixels: CropperArea } | null",
			description:
				"The selection right now, in both units, or `null` before the media has been measured.",
		},
		{
			member: "measure",
			type: "(media: HTMLElement, naturalWidth: number, naturalHeight: number) => void",
			description:
				"What the media parts call on load and on resize: derives the rendered size from the element or from `objectFit`, sets `mediaSize` and `cropSize`, fires `onMediaLoaded` then `onCropSizeChange`, re-clamps the crop and schedules the area frame. Returns without doing any of that when either natural dimension or either side of the surface is zero, or before the surface has mounted.",
		},
		{
			member: "scheduleAreaChange / dispose",
			type: "() => void",
			description:
				"The animation-frame throttle behind `onCropAreaChange`, and its cancellation. The root calls `dispose` on unmount; a descendant has no reason to call either.",
		},
	];
</script>

<DocPage title="Cropper">
	{#snippet subtitle()}
		An image and video crop surface, with drag, wheel zoom, pinch-zoom-rotate and arrow keys.
	{/snippet}

	<DocSection title="Usage">
		{#snippet blurb()}
			Drag the picture, or scroll to zoom about the pointer. The surface is a tab stop, so the arrow
			keys move the crop once it has focus — with shift for a fifth of a step.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Cropper.Root aspectRatio={1} bind:crop bind:zoom class="min-h-72">
					<Cropper.Image src={SAMPLE_IMAGE_SRC} alt="Sample scene to crop" />
					<Cropper.Area />
				</Cropper.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Shape, fit and guides">
		{#snippet blurb()}
			`shape` only changes the mask — a circular crop still returns a rectangle, because that is
			what an encoder takes. `objectFit` decides how the media is fitted before any of the crop
			maths runs, so it changes what there is to crop rather than how.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-4">
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="flex items-center gap-2">
						<Label for="cropper-shape">Shape</Label>
						<Select.Root type="single" bind:value={shape}>
							<Select.Trigger id="cropper-shape" size="sm" class="w-40">
								{shapes.find((s) => s.value === shape)?.label}
							</Select.Trigger>
							<Select.Content>
								{#each shapes as option (option.value)}
									<Select.Item value={option.value}>{option.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div class="flex items-center gap-2">
						<Label for="cropper-fit">Object fit</Label>
						<Select.Root type="single" bind:value={objectFit}>
							<Select.Trigger id="cropper-fit" size="sm" class="w-40">
								{fits.find((f) => f.value === objectFit)?.label}
							</Select.Trigger>
							<Select.Content>
								{#each fits as option (option.value)}
									<Select.Item value={option.value}>{option.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>

					<div class="flex items-center gap-2">
						<Switch id="cropper-grid" bind:checked={withGrid} />
						<Label for="cropper-grid">Rule-of-thirds guides</Label>
					</div>

					<div class="flex items-center gap-2">
						<Switch id="cropper-overflow" bind:checked={allowOverflow} />
						<Label for="cropper-overflow">Allow overflow</Label>
					</div>
				</div>

				<Cropper.Root
					aspectRatio={1}
					bind:crop={shapedCrop}
					bind:zoom={shapedZoom}
					{shape}
					{objectFit}
					{withGrid}
					{allowOverflow}
					class="min-h-72"
				>
					<Cropper.Image src={SAMPLE_IMAGE_SRC} alt="Sample scene to crop" />
					<Cropper.Area />
				</Cropper.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Controlled, with the selected region">
		{#snippet blurb()}
			`onCropAreaChange` reports continuously, throttled to one animation frame; `onCropComplete`
			fires once when the interaction ends. The second is the one to persist from — the first would
			write on every frame of a drag. Both give percentages and natural pixels, and it is the pixel
			rectangle a canvas needs to actually cut the original.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-4">
				<Cropper.Root
					aspectRatio={16 / 9}
					bind:crop={liveCrop}
					bind:zoom={liveZoom}
					bind:rotation={liveRotation}
					maxZoom={5}
					withGrid
					onCropAreaChange={(_percentages, next) => (pixels = next)}
					onCropComplete={(_percentages, next) => (completed = next)}
					class="min-h-72"
				>
					<Cropper.Image src={SAMPLE_IMAGE_SRC} alt="Sample scene to crop" />
					<Cropper.Area />
				</Cropper.Root>

				<div class="grid gap-4 sm:grid-cols-2">
					<div class="flex flex-col gap-1.5">
						<Label for="cropper-zoom">Zoom</Label>
						<Slider
							id="cropper-zoom"
							type="single"
							bind:value={liveZoom}
							min={1}
							max={5}
							step={0.01}
							aria-label="Zoom"
						/>
					</div>
					<div class="flex flex-col gap-1.5">
						<Label for="cropper-rotation">Rotation</Label>
						<Slider
							id="cropper-rotation"
							type="single"
							bind:value={liveRotation}
							min={-180}
							max={180}
							step={1}
							aria-label="Rotation"
						/>
					</div>
				</div>

				<div class="flex flex-wrap items-center gap-4">
					<Button variant="outline" size="sm" onclick={reset}>
						<RotateCcwIcon data-icon />
						Reset
					</Button>
					<p class="font-mono text-xs text-muted-foreground tabular-nums">
						live:
						{#if pixels}
							{pixels.width}&times;{pixels.height} at {pixels.x},{pixels.y}
						{:else}
							&mdash;
						{/if}
					</p>
					<p class="font-mono text-xs text-muted-foreground tabular-nums">
						committed:
						{#if completed}
							{completed.width}&times;{completed.height} at {completed.x},{completed.y}
						{:else}
							&mdash;
						{/if}
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Video">
		{#snippet blurb()}
			The same surface over a video element. It measures on `loadedmetadata` rather than `load`,
			because `videoWidth` is zero until then. The clip is the one the Media player page uses.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Cropper.Root aspectRatio={1} class="min-h-72">
					<!-- Through Vite's base, for the reason spelled out in `MediaPlayerPage.svelte`: a
					root-absolute public path is the domain root, not the deployed site's. -->
					<Cropper.Video
						src={`${import.meta.env.BASE_URL}assets/cloud.mp4`}
						muted
						loop
						autoplay
						playsinline
					/>
					<Cropper.Area />
				</Cropper.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Cropper.Root</h3>
			<p class="text-sm text-muted-foreground">
				The crop surface, and the context every other part reads. It renders a wrapper
				<code>div</code> with a focusable <code>role="application"</code> surface inside it, and
				attaches the drag, wheel, pinch and arrow-key handling there. Any other attribute is spread
				onto the surface; a caller <code>onmousedown</code>, <code>ontouchstart</code>,
				<code>onkeydown</code> or <code>onkeyup</code> runs first and may
				<code>preventDefault()</code> to opt out of the built-in handling.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each rootProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Cropper.Image</h3>
			<p class="text-sm text-muted-foreground">
				The image being cropped. It renders an <code>img</code> placed by the fit classes and moved
				by a translate, rotate, scale transform built from the root's state, and re-measures itself
				on load and whenever the surface resizes. Any other attribute is spread onto the
				<code>img</code> — <code>src</code> and <code>alt</code> are the caller's to give. Throws
				when used outside <code>Cropper.Root</code>.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each imageProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Cropper.Video</h3>
			<p class="text-sm text-muted-foreground">
				The image's twin over a <code>video</code> element, with the same transform. It measures on
				<code>loadedmetadata</code> rather than <code>load</code>, because <code>videoWidth</code>
				is zero until then. Any other attribute is spread onto the <code>video</code>. Throws when
				used outside <code>Cropper.Root</code>.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each videoProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Cropper.Area</h3>
			<p class="text-sm text-muted-foreground">
				The selection window drawn over the media: a white-bordered <code>div</code> centred on the
				surface, sized from the root's computed crop size, with a scrim darkening everything outside
				it. It renders nothing until the media has been measured. Any other attribute is spread onto
				the <code>div</code>. Throws when used outside <code>Cropper.Root</code>.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each areaProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">useCropper</h3>
			<p class="text-sm text-muted-foreground">
				The accessor for the cropper's state from a descendant — a custom overlay rendered inside
				<code>Cropper.Area</code>, or a readout beside it — and the replacement for upstream's
				<code>useCropper(selector)</code> hook. Call it during initialisation of any component
				rendered inside <code>Cropper.Root</code>; it throws when there is no root above. It returns
				the root's <code>CropperState</code>, whose fields are runes: reading one subscribes to it,
				so no selector is needed. <code>getCropperContext(part)</code> is the same accessor with
				your part's name in the error, and <code>hasCropperContext()</code> tests without throwing.
			</p>
			<pre
				class="w-full overflow-x-auto rounded-lg bg-muted p-3 text-xs">{cropperStateExample}</pre>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Member</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each cropperStateMembers as member (member.member)}
								<Table.Row>
									<Table.Cell class="font-medium">{member.member}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{member.type}</Table.Cell>
									<Table.Cell>{member.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>
</DocPage>
