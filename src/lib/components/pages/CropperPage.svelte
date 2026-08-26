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

	const rootProps = [
		{
			prop: "crop",
			type: "CropperPoint",
			default: "{ x: 0, y: 0 }",
			description: "Media offset from centre, in container pixels. Bindable.",
		},
		{
			prop: "zoom",
			type: "number",
			default: "1",
			description: "Scale factor. Bindable, and clamped to `minZoom`/`maxZoom`.",
		},
		{ prop: "rotation", type: "number", default: "0", description: "Degrees. Bindable." },
		{
			prop: "aspectRatio",
			type: "number",
			default: "4 / 3",
			description: "Width over height of the selection.",
		},
		{
			prop: "minZoom / maxZoom",
			type: "number",
			default: "1 / 3",
			description: "Bounds every zoom path is clamped to.",
		},
		{ prop: "zoomSpeed", type: "number", default: "1", description: "Multiplier on wheel travel." },
		{
			prop: "keyboardStep",
			type: "number",
			default: "1",
			description: "Pixels of crop travel per arrow press; a fifth of that with shift.",
		},
		{
			prop: "shape",
			type: '"rectangle" | "circle"',
			default: '"rectangle"',
			description: "Only changes the mask; the crop maths is identical.",
		},
		{
			prop: "objectFit",
			type: '"contain" | "cover" | "horizontal-cover" | "vertical-cover"',
			default: '"contain"',
			description: "How the media is fitted before cropping.",
		},
		{
			prop: "allowOverflow",
			type: "boolean",
			default: "false",
			description: "Let the selection run past the media's edges.",
		},
		{
			prop: "preventScrollZoom",
			type: "boolean",
			default: "false",
			description: "Leave the wheel to the page instead of zooming.",
		},
		{
			prop: "withGrid",
			type: "boolean",
			default: "false",
			description: "Draw rule-of-thirds guides inside the selection.",
		},
		{
			prop: "onCropAreaChange",
			type: "(percentages, pixels) => void",
			default: "—",
			description: "Throttled to one animation frame while anything moves.",
		},
		{
			prop: "onCropComplete",
			type: "(percentages, pixels) => void",
			default: "—",
			description: "Fired once when an interaction finishes — the one to persist from.",
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

	<DocSection title="Root props">
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
								<Table.Cell class="font-mono text-xs">{row.prop}</Table.Cell>
								<Table.Cell class="font-mono text-xs text-muted-foreground">{row.type}</Table.Cell>
								<Table.Cell class="font-mono text-xs text-muted-foreground"
									>{row.default}</Table.Cell
								>
								<Table.Cell class="text-sm">{row.description}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
