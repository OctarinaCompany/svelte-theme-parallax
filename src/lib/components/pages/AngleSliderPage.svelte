<script lang="ts">
	import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
	import ShuffleIcon from "@lucide/svelte/icons/shuffle";

	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as AngleSlider from "$lib/components/ui/angle-slider/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Table from "$lib/components/ui/table/index.js";

	/**
	 * The Angle slider component page.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. The classic range control is `.form-range`, which is linear and
	 * which the classic theme leaves at the classic framework's own drawing; there is no radial input anywhere in the
	 * theme. The dial keeps its own geometry and takes only the colours — `--primary` for the
	 * track fill, `--border` for the ring, `--ring` for the focus halo.
	 */

	const FORM_DEFAULTS = { rotation: [90], arc: [30, 210] };

	let controlled = $state([180]);
	let range = $state([45, 200]);
	let formRotation = $state([...FORM_DEFAULTS.rotation]);
	let formArc = $state([...FORM_DEFAULTS.arc]);
	let submitted = $state<string | null>(null);

	/** Drives the Reset/Randomize buttons; a plain rAF ramp, so the demo needs no motion library. */
	let animation: number | null = null;

	function animateTo(target: number) {
		if (animation !== null) cancelAnimationFrame(animation);

		const from = controlled[0] ?? 0;
		// Upstream normalises the delta into [-180, 180] and wraps every animated frame back into
		// [0, 360), so the dial always takes the short way round — a Reset from 350° sweeps forward
		// through 0 instead of unwinding backwards through 180°.
		let delta = target - from;
		if (delta > 180) delta -= 360;
		else if (delta < -180) delta += 360;

		const start = performance.now();
		const duration = 420;

		const tick = (now: number) => {
			const progress = Math.min(1, (now - start) / duration);
			// easeOutCubic
			const eased = 1 - (1 - progress) ** 3;
			const animated = from + delta * eased;
			controlled = [Math.round(((animated % 360) + 360) % 360)];

			if (progress < 1) {
				animation = requestAnimationFrame(tick);
			} else {
				controlled = [target];
				animation = null;
			}
		};

		animation = requestAnimationFrame(tick);
	}

	function resetForm() {
		formRotation = [...FORM_DEFAULTS.rotation];
		formArc = [...FORM_DEFAULTS.arc];
		submitted = null;
	}

	$effect(() => {
		return () => {
			if (animation !== null) cancelAnimationFrame(animation);
		};
	});

	function onSubmit(event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }) {
		event.preventDefault();
		const data = new FormData(event.currentTarget);
		submitted = `rotation=${data.get("rotation")}, arc=${data.getAll("arc[]").join(" → ")}`;
	}

	const themes = [
		{
			name: "Default",
			value: 60,
			trackClass: "[&>[data-slot='angle-slider-track-rail']]:stroke-muted-foreground/20",
			rangeClass: "stroke-primary",
			thumbClass: "border-primary bg-background ring-primary/50",
			textClass: "text-foreground",
		},
		{
			name: "Success",
			value: 120,
			trackClass: "[&>[data-slot='angle-slider-track-rail']]:stroke-success/20",
			rangeClass: "stroke-success",
			thumbClass: "border-success bg-background ring-success/50",
			textClass: "text-success",
		},
		{
			name: "Warning",
			value: 180,
			trackClass: "[&>[data-slot='angle-slider-track-rail']]:stroke-warning/20",
			rangeClass: "stroke-warning",
			thumbClass: "border-warning bg-background ring-warning/50",
			textClass: "text-warning",
		},
		{
			name: "Destructive",
			value: 240,
			trackClass: "[&>[data-slot='angle-slider-track-rail']]:stroke-destructive/20",
			rangeClass: "stroke-destructive",
			thumbClass: "border-destructive bg-background ring-destructive/50",
			textClass: "text-destructive",
		},
		{
			name: "Info 70%",
			value: 300,
			trackClass: "[&>[data-slot='angle-slider-track-rail']]:stroke-info/20",
			rangeClass: "stroke-info/70",
			thumbClass: "border-info/70 bg-background ring-info/40",
			textClass: "text-info/70",
		},
		{
			name: "Primary 70%",
			value: 45,
			trackClass: "[&>[data-slot='angle-slider-track-rail']]:stroke-primary/20",
			rangeClass: "stroke-primary/70",
			thumbClass: "border-primary/70 bg-background ring-primary/40",
			textClass: "text-primary/70",
		},
		{
			name: "Info",
			value: 90,
			trackClass: "[&>[data-slot='angle-slider-track-rail']]:stroke-info/20",
			rangeClass: "stroke-info",
			thumbClass: "border-info bg-background ring-info/50",
			textClass: "text-info",
		},
		{
			name: "Success 70%",
			value: 270,
			trackClass: "[&>[data-slot='angle-slider-track-rail']]:stroke-success/20",
			rangeClass: "stroke-success/70",
			thumbClass: "border-success/70 bg-background ring-success/40",
			textClass: "text-success/70",
		},
	];

	const rootProps = [
		{
			prop: "value",
			type: "number[]",
			default: "—",
			description: "Bindable angles, one per thumb.",
		},
		{
			prop: "defaultValue",
			type: "number[]",
			default: "[0]",
			description: "Seeds the dial when value is absent.",
		},
		{
			prop: "onValueChange",
			type: "(value: number[]) => void",
			default: "—",
			description: "Fires on every accepted change, pointer or keyboard.",
		},
		{
			prop: "onValueCommit",
			type: "(value: number[]) => void",
			default: "—",
			description: "Fires once per completed drag and per handled key press.",
		},
		{ prop: "min", type: "number", default: "0", description: "Lowest value of the dial." },
		{ prop: "max", type: "number", default: "100", description: "Highest value of the dial." },
		{
			prop: "step",
			type: "number",
			default: "1",
			description: "Granularity; its decimal count drives the rounding precision.",
		},
		{
			prop: "minStepsBetweenThumbs",
			type: "number",
			default: "0",
			description: "Minimum gap between thumbs, in steps.",
		},
		{
			prop: "size",
			type: "number",
			default: "60",
			description: "Dial radius in px; the box is size * 2 + 40.",
		},
		{ prop: "thickness", type: "number", default: "8", description: "Track stroke width in px." },
		{
			prop: "startAngle",
			type: "number",
			default: "-90",
			description: "Angle min sits at; -90 is 12 o’clock.",
		},
		{ prop: "endAngle", type: "number", default: "270", description: "Angle max sits at." },
		{
			prop: "dir",
			type: "'ltr' | 'rtl'",
			default: "inherited",
			description: "Overrides DirectionProvider and the inherited DOM dir.",
		},
		{
			prop: "form",
			type: "string",
			default: "—",
			description: "id of the form every hidden input submits with.",
		},
		{
			prop: "name",
			type: "string",
			default: "—",
			description: "name for one thumb, name[] for two or more.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "Suppresses interaction and dims the dial.",
		},
		{
			prop: "readOnly",
			type: "boolean",
			default: "false",
			description: "Suppresses interaction; thumbs stay focusable and submittable.",
		},
		{
			prop: "inverted",
			type: "boolean",
			default: "false",
			description: "Reverses value → angle and the sign of every arrow key.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Renders onto your own element instead of the default div.",
		},
	];

	const partProps = [
		{
			part: "AngleSlider.Track",
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "Rendered inside the <svg>, after the rail — this is where Range goes.",
		},
		{
			part: "AngleSlider.Range",
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged last; renders nothing when both ends are equal.",
		},
		{
			part: "AngleSlider.Thumb",
			prop: "index",
			type: "number",
			default: "0",
			description: "Which entry of the value array this thumb drives.",
		},
		{
			part: "AngleSlider.Thumb",
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Renders onto your own element; registration survives.",
		},
		{
			part: "AngleSlider.Value",
			prop: "unit",
			type: "string",
			default: "'°'",
			description: "Suffix appended to each rendered number.",
		},
		{
			part: "AngleSlider.Value",
			prop: "formatValue",
			type: "(value: number | number[]) => string",
			default: "—",
			description: "Formats the readout yourself.",
		},
		{
			part: "AngleSlider.HiddenInput",
			prop: "control",
			type: "HTMLElement | null",
			default: "—",
			description: "Element whose border box the visually hidden input mirrors.",
		},
	];

	const dataAttributes = [
		{ attribute: '[data-slot="angle-slider"]', on: "Root", when: "Always" },
		{ attribute: '[data-slot="angle-slider-track"]', on: "Track <svg>", when: "Always" },
		{
			attribute: '[data-slot="angle-slider-track-rail"]',
			on: "Rail <circle> / <path>",
			when: "Always",
		},
		{ attribute: '[data-slot="angle-slider-range"]', on: "Range <path>", when: "Ends differ" },
		{ attribute: '[data-slot="angle-slider-thumb"]', on: "Thumb", when: "values[index] defined" },
		{
			attribute: '[data-slot="angle-slider-thumb-wrapper"]',
			on: "The positioned <span> around each thumb — this is the element registered with the root, and it survives child mode",
			when: "values[index] defined",
		},
		{
			attribute: '[data-slot="angle-slider-hidden-input"]',
			on: "The visually hidden <input> carrying a thumb’s value into the form",
			when: "The dial is inside a <form> or has a form prop",
		},
		{ attribute: '[data-slot="angle-slider-value"]', on: "Value", when: "Always" },
		{ attribute: "[data-disabled]", on: "Every part", when: "disabled" },
		{ attribute: "[data-readonly]", on: "Every part", when: "readOnly" },
		{ attribute: "[data-index]", on: "Thumb", when: "Always" },
	];
</script>

<DocPage title="Angle slider">
	{#snippet subtitle()}
		An interactive circular slider for selecting angles with support for single values and ranges.
	{/snippet}

	<DocSection title="Default">
		<Card.Root>
			<Card.Content>
				<AngleSlider.Root defaultValue={[180]} min={0} max={360} step={1}>
					<AngleSlider.Track>
						<AngleSlider.Range />
					</AngleSlider.Track>
					<AngleSlider.Thumb />
					<AngleSlider.Value />
				</AngleSlider.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Controlled">
		{#snippet blurb()}
			Reset and Randomize animate the dial with a plain requestAnimationFrame ramp.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col items-center gap-4">
					<AngleSlider.Root bind:value={controlled} min={0} max={360} step={1}>
						<AngleSlider.Track>
							<AngleSlider.Range />
						</AngleSlider.Track>
						<AngleSlider.Thumb />
						<AngleSlider.Value />
					</AngleSlider.Root>
					<div class="flex items-center gap-2">
						<Button variant="outline" size="sm" onclick={() => animateTo(0)}>
							<RotateCcwIcon data-icon="inline-start" />
							Reset
						</Button>
						<Button size="sm" onclick={() => animateTo(Math.floor(Math.random() * 360))}>
							<ShuffleIcon data-icon="inline-start" />
							Randomize
						</Button>
						<span class="text-sm text-muted-foreground tabular-nums">{controlled[0]}°</span>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Range">
		{#snippet blurb()}
			Two thumbs kept at least four steps apart.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col items-center gap-4">
					<AngleSlider.Root
						bind:value={range}
						min={0}
						max={360}
						step={5}
						minStepsBetweenThumbs={4}
						size={72}
					>
						<AngleSlider.Track>
							<AngleSlider.Range />
						</AngleSlider.Track>
						<AngleSlider.Thumb index={0} />
						<AngleSlider.Thumb index={1} />
						<AngleSlider.Value />
					</AngleSlider.Root>
					<span class="text-sm text-muted-foreground tabular-nums">
						arc of {Math.abs((range[1] ?? 0) - (range[0] ?? 0))}°
					</span>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Themes">
		{#snippet blurb()}
			Eight dial themes, each built entirely from semantic tokens.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="grid grid-cols-2 gap-6 sm:grid-cols-4">
					{#each themes as theme (theme.name)}
						<div class="flex flex-col items-center gap-2">
							<AngleSlider.Root defaultValue={[theme.value]} min={0} max={360} step={1} size={44}>
								<AngleSlider.Track class={theme.trackClass}>
									<AngleSlider.Range class={theme.rangeClass} />
								</AngleSlider.Track>
								<AngleSlider.Thumb class={theme.thumbClass} />
								<AngleSlider.Value class={theme.textClass} />
							</AngleSlider.Root>
							<div class="flex flex-col items-center gap-1 text-center">
								<h4 class="text-sm font-medium">{theme.name}</h4>
								<p class="text-xs text-muted-foreground tabular-nums">{theme.value}°</p>
							</div>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Form">
		{#snippet blurb()}
			Each dial carries a visually hidden input, so the whole form submits natively.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<form class="flex flex-col items-center gap-6" onsubmit={onSubmit}>
					<div class="flex flex-wrap items-center justify-center gap-8">
						<div class="flex flex-col items-center gap-2">
							<AngleSlider.Root
								name="rotation"
								bind:value={formRotation}
								min={0}
								max={360}
								step={1}
								size={48}
							>
								<AngleSlider.Track>
									<AngleSlider.Range />
								</AngleSlider.Track>
								<AngleSlider.Thumb />
								<AngleSlider.Value />
							</AngleSlider.Root>
							<span class="text-xs text-muted-foreground">rotation</span>
						</div>
						<div class="flex flex-col items-center gap-2">
							<AngleSlider.Root
								name="arc"
								bind:value={formArc}
								min={0}
								max={360}
								step={5}
								size={48}
							>
								<AngleSlider.Track>
									<AngleSlider.Range />
								</AngleSlider.Track>
								<AngleSlider.Thumb index={0} />
								<AngleSlider.Thumb index={1} />
								<AngleSlider.Value />
							</AngleSlider.Root>
							<span class="text-xs text-muted-foreground">arc[]</span>
						</div>
					</div>
					<div class="flex items-center gap-3">
						<Button type="button" variant="outline" size="sm" onclick={resetForm}>Reset</Button>
						<Button type="submit" size="sm">Submit</Button>
						{#if submitted}
							<span class="text-sm text-muted-foreground tabular-nums">{submitted}</span>
						{/if}
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">AngleSlider.Root</h3>
			<p class="text-sm text-muted-foreground">
				The dial itself. Owns the value, the geometry and every pointer and keyboard command.
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
			<h3 class="text-base font-medium">Parts</h3>
			<p class="text-sm text-muted-foreground">
				Every part also takes <code>ref</code>, <code>class</code> and the native attributes of the element
				it renders.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Part</Table.Head>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each partProps as row (`${row.part}.${row.prop}`)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.part}</Table.Cell>
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
			<h3 class="text-base font-medium">Data attributes</h3>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Attribute</Table.Head>
								<Table.Head>On</Table.Head>
								<Table.Head>Present when</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each dataAttributes as row (row.attribute + row.on)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.attribute}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.on}</Table.Cell>
									<Table.Cell>{row.when}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Keyboard</h3>
			<p class="text-sm text-muted-foreground">
				Arrow keys move the focused thumb by one step, <code>Page&nbsp;Up</code>/<code
					>Page&nbsp;Down</code
				>
				and <code>Shift</code>+arrow by ten. <code>Home</code> and <code>End</code> send the focused
				thumb to <code>min</code> and <code>max</code>. Under
				<code>dir="rtl"</code>
				the horizontal arrows swap; under <code>inverted</code> every sign flips.
			</p>
		</div>
	</DocSection>
</DocPage>
