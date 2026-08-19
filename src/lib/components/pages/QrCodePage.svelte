<script lang="ts">
	import Dice4Icon from "@lucide/svelte/icons/dice-4";

	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import * as QRCode from "$lib/components/ui/qr-code/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";

	/**
	 * The QR code component page.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. A QR code is a two-colour bitmap, so the theme's only real say is
	 * which two colours — and the answer has to be contrast, not palette: the code is drawn in
	 * `--foreground` on `--background`, which keeps it scannable in both modes and under every
	 * palette. Tinting it would break the thing it exists to do.
	 *
	 * ENCODING NEEDS THE `qrcode` PACKAGE at runtime, loaded dynamically so it is not in the entry
	 * chunk. It is a dependency of this page, not of the theme.
	 */

	const VALUE = "https://example.com";

	// --- Playground ----------------------------------------------------------
	let playgroundValue = $state(VALUE);
	let playgroundSize = $state(180);
	let playgroundLevel = $state<string>("M");

	// Narrows the toggle group's `string` back to the documented union without a cast.
	const level = $derived(
		QRCode.QR_CODE_LEVELS.find((candidate) => candidate === playgroundLevel) ??
			QRCode.DEFAULT_LEVEL,
	);

	type PropRow = { prop: string; type: string; default: string; description: string };

	const rootProps: PropRow[] = [
		{
			prop: "value",
			type: "string",
			default: "— (required)",
			description: "The data to encode. An empty string generates nothing at all.",
		},
		{
			prop: "size",
			type: "number",
			default: "200",
			description: "Pixel size of the code; also published as the --qr-code-size custom property.",
		},
		{
			prop: "level",
			type: "'L' | 'M' | 'Q' | 'H'",
			default: "'M'",
			description: 'Error correction level. Use "H" whenever an Overlay covers the code.',
		},
		{
			prop: "margin",
			type: "number",
			default: "1",
			description: "Width of the quiet zone in modules. 0 removes it entirely.",
		},
		{
			prop: "quality",
			type: "number",
			default: "0.92",
			description: "Image quality between 0 and 1, for output formats that support it.",
		},
		{
			prop: "backgroundColor",
			type: "string",
			default: "'#ffffff'",
			description: "Colour of the light modules.",
		},
		{
			prop: "foregroundColor",
			type: "string",
			default: "'#000000'",
			description: "Colour of the dark modules.",
		},
		{
			prop: "onError",
			type: "(error: Error) => void",
			default: "undefined",
			description: "Fired after a failed generation, with the normalised Error.",
		},
		{
			prop: "onGenerated",
			type: "() => void",
			default: "undefined",
			description: "Fired after each successful generation.",
		},
		{
			prop: "style",
			type: "string",
			default: "undefined",
			description: "Appended after --qr-code-size, so it can override it.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "undefined",
			description: "Renders the container onto your own element. Replaces upstream asChild.",
		},
	];

	const canvasProps: PropRow[] = [
		{
			prop: "aria-label",
			type: "string",
			default: "`QR code for ${value}`",
			description: "Accessible name. Pass your own to override the default.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "undefined",
			description: "Fallback content rendered inside the <canvas> element.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "undefined",
			description: "Renders the code onto your own element instead of a <canvas>.",
		},
	];

	const svgProps: PropRow[] = [
		{
			prop: "aria-label",
			type: "string",
			default: "`QR code for ${value}`",
			description: "Accessible name. Pass your own to override the default.",
		},
		{
			prop: "style",
			type: "string",
			default: "undefined",
			description: "Appended after the computed width/height.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "undefined",
			description: "Renders the wrapper onto your own element. children is not accepted.",
		},
	];

	const imageProps: PropRow[] = [
		{
			prop: "alt",
			type: "string",
			default: "'QR Code'",
			description: "Alternative text for the generated image.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "undefined",
			description: "Renders the code onto your own element instead of an <img>.",
		},
	];

	const overlayProps: PropRow[] = [
		{
			prop: "children",
			type: "Snippet",
			default: "undefined",
			description: "The logo or icon centred over the code.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "undefined",
			description: "Renders the overlay onto your own element.",
		},
	];

	const skeletonProps: PropRow[] = [
		{
			prop: "style",
			type: "string",
			default: "undefined",
			description: "Appended after the computed width/height.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "undefined",
			description: "Custom placeholder content.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "undefined",
			description: "Renders the placeholder onto your own element.",
		},
	];

	const downloadProps: PropRow[] = [
		{
			prop: "filename",
			type: "string",
			default: "'qrcode'",
			description: "Downloaded filename, without its extension.",
		},
		{
			prop: "format",
			type: "'png' | 'svg'",
			default: "'png'",
			description: "Which generated output to download.",
		},
		{
			prop: "onclick",
			type: "(event: MouseEvent) => void",
			default: "undefined",
			description: "Runs before the download; call preventDefault() to suppress it.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "`Download ${format.toUpperCase()}`",
			description: "The button label.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "undefined",
			description: "Renders the trigger onto your own element, e.g. a Button.",
		},
	];

	const cssVariables = [
		{
			variable: "--qr-code-size",
			value: "Based on the size prop (e.g. 200px)",
			description: "Set by Root and used to constrain every child part to the QR code dimensions.",
		},
	];

	const keyboard = [
		{ keys: "Enter", description: "Activates the download button when focused." },
		{ keys: "Space", description: "Activates the download button when focused." },
	];

	const levels = [
		{ level: "L", recovery: "~7%", description: "Low — the least dense, least resilient code." },
		{ level: "M", recovery: "~15%", description: "Medium — the default." },
		{ level: "Q", recovery: "~25%", description: "Quartile." },
		{
			level: "H",
			recovery: "~30%",
			description: "High — required when an Overlay covers the centre.",
		},
	];
</script>

{#snippet propsTable(rows: PropRow[])}
	<!--
		The house wrapper, which the three tables further down this file already use and this snippet
		did not. Without it a `Table.Head` is `whitespace-nowrap` and the cells never wrap, so the
		widest type string sets the table's width and the whole PAGE scrolls sideways — the header
		stretches with it, which is how this surfaced. `px-0` because the table draws its own gutters,
		and the cell override is what lets a long description wrap instead of widening a column.
	-->
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
					{#each rows as row (row.prop)}
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
{/snippet}

<DocPage title="QR Code">
	{#snippet subtitle()}
		A flexible QR code component for generating and displaying QR codes with customization options.
	{/snippet}

	<DocSection title="Installation">
		<p class="text-sm text-muted-foreground">
			The component encodes with the <code>qrcode</code> package, which the registry entry declares
			as a runtime dependency. TypeScript consumers should also install
			<code>@types/qrcode</code> as a dev dependency — the shadcn-svelte registry-item schema has no field
			for dev dependencies, so the CLI cannot add it for you.
		</p>
	</DocSection>

	<DocSection title="Default">
		<Card.Root>
			<Card.Content>
				<QRCode.Root value={VALUE} size={200}>
					<QRCode.Skeleton />
					<QRCode.Canvas />
				</QRCode.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Different Formats">
		{#snippet blurb()}
			Each code renders through a different part, and each download button is composed onto a Button
			through the child snippet — this repository's replacement for upstream's asChild.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
					<div class="flex flex-col items-center gap-2">
						<QRCode.Root value={VALUE} size={120}>
							<QRCode.Canvas />
							<QRCode.Download format="png" filename="qr-canvas">
								{#snippet child({ props })}
									<Button size="sm" {...props}>Download PNG</Button>
								{/snippet}
							</QRCode.Download>
						</QRCode.Root>
						<p class="text-sm text-muted-foreground">Rendered as canvas</p>
					</div>

					<div class="flex flex-col items-center gap-2">
						<QRCode.Root value={VALUE} size={120}>
							<QRCode.Svg />
							<QRCode.Download format="svg" filename="qr-svg">
								{#snippet child({ props })}
									<Button size="sm" {...props}>Download SVG</Button>
								{/snippet}
							</QRCode.Download>
						</QRCode.Root>
						<p class="text-sm text-muted-foreground">Rendered as SVG</p>
					</div>

					<div class="flex flex-col items-center gap-2">
						<QRCode.Root value={VALUE} size={120}>
							<QRCode.Image alt="QR Code" />
							<QRCode.Download format="png" filename="qr-image">
								{#snippet child({ props })}
									<Button size="sm" {...props}>Download PNG</Button>
								{/snippet}
							</QRCode.Download>
						</QRCode.Root>
						<p class="text-sm text-muted-foreground">Rendered as image</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Customization">
		{#snippet blurb()}
			Colours are encoder inputs, not Tailwind classes, so upstream's hex values are kept verbatim.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
					<div class="flex flex-col items-center gap-2">
						<QRCode.Root
							value={VALUE}
							size={150}
							foregroundColor="#3b82f6"
							backgroundColor="#f1f5f9"
						>
							<QRCode.Canvas />
							<QRCode.Skeleton />
						</QRCode.Root>
						<p class="text-sm text-muted-foreground">Custom Colors</p>
					</div>

					<div class="flex flex-col items-center gap-2">
						<QRCode.Root value={VALUE} size={150} level="H" foregroundColor="#dc2626">
							<QRCode.Canvas />
							<QRCode.Skeleton />
						</QRCode.Root>
						<p class="text-sm text-muted-foreground">High Error Correction</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Overlay">
		{#snippet blurb()}
			Every code uses <code>level="H"</code> so it still scans with up to 30% of it covered.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
					<div class="flex flex-col items-center gap-2">
						<QRCode.Root value={VALUE} size={120} level="H" class="gap-4">
							<QRCode.Skeleton />
							<QRCode.Canvas />
							<QRCode.Overlay class="rounded-full border-2 border-background p-2">
								<Dice4Icon class="size-6" />
							</QRCode.Overlay>
						</QRCode.Root>
						<p class="text-center text-sm text-muted-foreground">Canvas with Logo</p>
					</div>

					<div class="flex flex-col items-center gap-2">
						<QRCode.Root value={VALUE} size={120} level="H" class="gap-4">
							<QRCode.Skeleton />
							<QRCode.Svg />
							<QRCode.Overlay
								class="rounded-full border-2 border-background bg-linear-to-br from-accent to-muted p-2"
							>
								<Dice4Icon class="size-6" />
							</QRCode.Overlay>
						</QRCode.Root>
						<p class="text-center text-sm text-muted-foreground">SVG with Logo</p>
					</div>

					<div class="flex flex-col items-center gap-2">
						<QRCode.Root value={VALUE} size={120} level="H" class="gap-4">
							<QRCode.Skeleton />
							<QRCode.Image />
							<QRCode.Overlay class="rounded-full border-2 border-background p-1.5">
								<Dice4Icon class="size-6" />
							</QRCode.Overlay>
						</QRCode.Root>
						<p class="text-center text-sm text-muted-foreground">Image with Logo</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Playground">
		{#snippet blurb()}
			Svelte-specific. The code regenerates as soon as any input changes, and clearing the value
			renders nothing at all rather than erroring.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex-col gap-6">
				<div class="grid w-full max-w-md gap-4">
					<div class="grid gap-2">
						<Label for="qr-playground-value">Value</Label>
						<Input
							id="qr-playground-value"
							bind:value={playgroundValue}
							placeholder="Anything to encode…"
						/>
					</div>

					<div class="grid gap-2">
						<Label for="qr-playground-size">Size ({playgroundSize}px)</Label>
						<Input
							id="qr-playground-size"
							type="number"
							min={80}
							max={280}
							step={10}
							bind:value={playgroundSize}
						/>
					</div>

					<div class="grid gap-2">
						<Label id="qr-playground-level-label">Error correction</Label>
						<ToggleGroup.Root
							type="single"
							variant="outline"
							bind:value={playgroundLevel}
							aria-labelledby="qr-playground-level-label"
						>
							{#each QRCode.QR_CODE_LEVELS as candidate (candidate)}
								<ToggleGroup.Item value={candidate} aria-label="Level {candidate}">
									{candidate}
								</ToggleGroup.Item>
							{/each}
						</ToggleGroup.Root>
					</div>
				</div>

				<QRCode.Root value={playgroundValue} size={playgroundSize} {level}>
					<QRCode.Skeleton />
					<QRCode.Canvas />
					<QRCode.Download filename="playground" />
				</QRCode.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">QRCode.Root</h3>
			<p class="text-sm text-muted-foreground">
				The container. It encodes the value client-side and publishes the result on context. Every
				part additionally accepts <code>ref</code>, <code>class</code> and the rest of its element’s
				HTML attributes, with the caller’s <code>class</code> merged last. The root exposes
				<code>data-state="idle | generating | ready | error"</code>.
			</p>
			{@render propsTable(rootProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">QRCode.Canvas</h3>
			<p class="text-sm text-muted-foreground">
				Renders the code into a <code>&lt;canvas&gt;</code> with <code>role="img"</code>. It stays
				<code>invisible</code> until the first generation completes.
			</p>
			{@render propsTable(canvasProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">QRCode.Svg</h3>
			<p class="text-sm text-muted-foreground">
				Renders the generated SVG markup inside a <code>&lt;div role="img"&gt;</code>. Renders
				nothing until that markup exists.
			</p>
			{@render propsTable(svgProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">QRCode.Image</h3>
			<p class="text-sm text-muted-foreground">
				Renders the code as an <code>&lt;img&gt;</code> pointing at the generated PNG data URL. Renders
				nothing until that data URL exists.
			</p>
			{@render propsTable(imageProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">QRCode.Overlay</h3>
			<p class="text-sm text-muted-foreground">
				Centres a logo or icon over the code. Pair it with <code>level="H"</code> so the code stays scannable.
			</p>
			{@render propsTable(overlayProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">QRCode.Skeleton</h3>
			<p class="text-sm text-muted-foreground">
				A pulsing placeholder shown while the code is generated. It removes itself as soon as any
				output exists.
			</p>
			{@render propsTable(skeletonProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">QRCode.Download</h3>
			<p class="text-sm text-muted-foreground">
				A native <code>&lt;button&gt;</code> that downloads the generated code. Clicking it before the
				requested format has produced output is a no-op.
			</p>
			{@render propsTable(downloadProps)}
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">CSS Variables</h3>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Variable</Table.Head>
								<Table.Head>Value</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each cssVariables as row (row.variable)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.variable}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.value}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Keyboard Interactions</h3>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Key</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each keyboard as row (row.keys)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.keys}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Error Correction Levels</h3>
			<p class="text-sm text-muted-foreground">
				Higher levels produce denser codes but survive more damage or coverage.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Level</Table.Head>
								<Table.Head>Recovery</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each levels as row (row.level)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.level}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.recovery}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>
</DocPage>
