<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as CircularProgress from "$lib/components/ui/circular-progress/index.js";
	import CircularProgressColorTile from "./circular-progress-color-tile.svelte";
	import * as Table from "$lib/components/ui/table/index.js";
	import { Button } from "$lib/components/ui/button/index.js";

	/**
	 * The Circular progress component page.
	 *
	 * THE CLASSIC THEME'S PROGRESS BAR IS LINEAR ONLY. `.progress` is a 1rem track (ported on the Progress
	 * page, against shadcn's `h-1.5`), and neither the classic framework nor the classic theme ships a ring.
	 *
	 * So the geometry is the component's own and only the colours are the theme's: `--primary` on
	 * the range, `--muted` behind it. The one place this page departs from the rest of the theme is
	 * the Colors example, whose subject IS colour variety — those swatches name their hues directly
	 * because a demo about picking a colour cannot be drawn in one.
	 */

	let demoValue = $state(0);

	// The effect must not read `demoValue`, or every tick invalidates it and restarts the interval.
	// The running total lives in a plain `let` the effect owns; the rune only receives it.
	$effect(() => {
		let progress = 0;
		const interval = setInterval(() => {
			progress = Math.min(100, progress + 2);
			demoValue = progress;
			if (progress >= 100) clearInterval(interval);
		}, 150);

		return () => clearInterval(interval);
	});

	let uploadProgress = $state<number | null>(0);
	let isUploading = $state(false);
	let uploadInterval: ReturnType<typeof setInterval> | null = null;

	function startUpload() {
		isUploading = true;
		uploadProgress = 0;
		uploadInterval = setInterval(() => {
			uploadProgress = Math.min(100, (uploadProgress ?? 0) + Math.random() * 15);
			if (uploadProgress >= 100) {
				if (uploadInterval) clearInterval(uploadInterval);
				uploadInterval = null;
				isUploading = false;
			}
		}, 200);
	}

	function resetUpload() {
		uploadProgress = 0;
		isUploading = false;
		if (uploadInterval) {
			clearInterval(uploadInterval);
			uploadInterval = null;
		}
	}

	function forceIndeterminate() {
		uploadProgress = null;
	}

	$effect(() => {
		return () => {
			if (uploadInterval) clearInterval(uploadInterval);
		};
	});

	const themes = [
		{ name: "Default", trackClass: "", rangeClass: "text-primary", textClass: "text-foreground" },
		{
			name: "Success",
			trackClass: "text-success/20",
			rangeClass: "text-success",
			textClass: "text-success",
		},
		{
			name: "Warning",
			trackClass: "text-warning/20",
			rangeClass: "text-warning",
			textClass: "text-warning",
		},
		{
			name: "Destructive",
			trackClass: "text-destructive/20",
			rangeClass: "text-destructive",
			textClass: "text-destructive",
		},
		{ name: "Info", trackClass: "text-info/20", rangeClass: "text-info", textClass: "text-info" },
		// The last three are the decorative hues. No semantic token carries them, so they take
		// fixed palette shades — the same trio the event calendar's colour picker uses.
		{
			name: "Violet",
			trackClass: "text-violet-500/20",
			rangeClass: "text-violet-500",
			textClass: "text-violet-500",
		},
		{
			name: "Teal",
			trackClass: "text-teal-500/20",
			rangeClass: "text-teal-500",
			textClass: "text-teal-500",
		},
		{
			name: "Rose",
			trackClass: "text-rose-500/20",
			rangeClass: "text-rose-500",
			textClass: "text-rose-500",
		},
	];

	const rootProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "value",
			type: "number | null | undefined",
			default: "null",
			description:
				"The current progress value. `null`/`undefined` renders the indeterminate state.",
		},
		{
			prop: "getValueText",
			type: "(value, min, max) => string",
			default: "getDefaultValueText",
			description: "Formats the accessible/visible value text.",
		},
		{
			prop: "min",
			type: "number",
			default: "0",
			description: "The minimum allowed value. A non-finite value falls back to `0`.",
		},
		{
			prop: "max",
			type: "number",
			default: "100",
			description:
				"The maximum allowed value. Non-finite or `<= 0` falls back to `100`; `<= min` corrects to `min + 1`.",
		},
		{
			prop: "size",
			type: "number",
			default: "48",
			description: "The width/height of the ring, in pixels.",
		},
		{
			prop: "thickness",
			type: "number",
			default: "4",
			description: "The stroke width of both circles, in pixels.",
		},
		{
			prop: "label",
			type: "string | undefined",
			default: "undefined",
			description: "Visible label rendered as the last child and wired via `aria-labelledby`.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, so it overrides the container’s own classes.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The composed parts.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description:
				"Replaces upstream `asChild`. `children`/`label` are not rendered and `ref` stays `null`.",
		},
	];

	const svgProps = [
		{
			prop: "ref",
			type: "SVGSVGElement | null",
			default: "null",
			description: "Bindable reference to the rendered `<svg>`.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, so it overrides the base `-rotate-90 transform` classes.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "Normally `Track` + `Range`.",
		},
	];

	const circleProps = [
		{
			prop: "ref",
			type: "SVGCircleElement | null",
			default: "null",
			description: "Bindable reference to the rendered `<circle>`.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, so it overrides the base classes.",
		},
	];

	const valueTextProps = [
		{
			prop: "ref",
			type: "HTMLSpanElement | null",
			default: "null",
			description: "Bindable reference to the rendered `<span>`.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, so it overrides the base classes.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "Takes precedence over the computed value text.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Replaces upstream `asChild`.",
		},
	];
</script>

<DocPage title="Circular Progress">
	{#snippet subtitle()}
		A circular progress indicator that displays completion progress in a ring format, with full
		support for indeterminate states. This is the closed-ring preset — a small loader, 48px on a 4px
		stroke, labelled as a percentage. When the arc itself carries meaning, and you need to set where
		it starts and ends, use
		<a class="text-primary underline underline-offset-3" href="#/components/gauge">Gauge</a>, which
		builds on the geometry defined here.
	{/snippet}

	<DocSection title="Default">
		<Card.Root>
			<Card.Content>
				<CircularProgress.Root value={demoValue} size={60}>
					<CircularProgress.Indicator>
						<CircularProgress.Track />
						<CircularProgress.Range />
					</CircularProgress.Indicator>
					<CircularProgress.ValueText />
				</CircularProgress.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Interactive">
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col items-center gap-6">
					<div class="flex items-center gap-6">
						<CircularProgress.Root value={uploadProgress} min={0} max={100} size={80} thickness={6}>
							<CircularProgress.Indicator>
								<CircularProgress.Track />
								<CircularProgress.Range />
							</CircularProgress.Indicator>
							<CircularProgress.ValueText class="text-base font-semibold" />
						</CircularProgress.Root>
						<div class="flex flex-col gap-2">
							<div class="text-sm font-medium">Upload Progress</div>
							<div class="text-xs text-muted-foreground">
								Status: {isUploading ? "Uploading…" : uploadProgress === 100 ? "Complete" : "Ready"}
							</div>
							<div class="text-xs text-muted-foreground">
								Progress: {uploadProgress === null
									? "Indeterminate"
									: `${Math.round(uploadProgress)}%`}
							</div>
						</div>
					</div>
					<div class="flex items-center gap-2">
						<Button size="sm" onclick={startUpload} disabled={isUploading}>Start upload</Button>
						<Button size="sm" onclick={resetUpload} disabled={isUploading}>Reset</Button>
						<Button
							variant="secondary"
							size="sm"
							onclick={forceIndeterminate}
							disabled={isUploading}
						>
							Indeterminate
						</Button>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Colors">
		{#snippet blurb()}
			Eight themed rings — each eases to 75% once the row scrolls into view, one after the next.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
					{#each themes as theme, index (theme.name)}
						<CircularProgressColorTile {theme} {index} />
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Combined">
		{#snippet blurb()}
			The one-line form, equivalent to the manual composition in the Default example.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<CircularProgress.Combined value={65} size={60} />
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">CircularProgress (Root)</h3>
			<p class="text-sm text-muted-foreground">
				The container that validates and clamps <code>value</code> against
				<code>min</code>/<code>max</code>, derives the ring geometry, and publishes it on context.
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
			<h3 class="text-base font-medium">CircularProgress.Indicator</h3>
			<p class="text-sm text-muted-foreground">
				The <code>&lt;svg&gt;</code> container that holds the track and range circles.
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
							{#each svgProps as row (row.prop)}
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
			<h3 class="text-base font-medium">CircularProgress.Track</h3>
			<p class="text-sm text-muted-foreground">
				The background circle representing the full range of possible values.
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
							{#each circleProps as row (row.prop)}
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
			<h3 class="text-base font-medium">CircularProgress.Range</h3>
			<p class="text-sm text-muted-foreground">
				The portion of the circle representing the current progress value; spins while
				indeterminate.
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
							{#each circleProps as row (row.prop)}
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
			<h3 class="text-base font-medium">CircularProgress.ValueText</h3>
			<p class="text-sm text-muted-foreground">
				The text element displaying the current progress value or custom content.
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
							{#each valueTextProps as row (row.prop)}
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
			<h3 class="text-base font-medium">CircularProgress.Combined</h3>
			<p class="text-sm text-muted-foreground">
				Takes the exact Root props (minus <code>children</code>/<code>child</code>) and renders
				<code>Root &gt; Indicator &gt; (Track, Range) + ValueText</code> in one step.
			</p>
		</div>
	</DocSection>
</DocPage>
