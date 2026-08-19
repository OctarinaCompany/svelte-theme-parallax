<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as ColorPicker from "$lib/components/ui/color-picker/index.js";
	import * as Table from "$lib/components/ui/table/index.js";

	/**
	 * The Color picker component page.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. The reference stylesheet restyles the third-party widgets the classic theme bundles
	 * — select, picker, dropzone, editor — and a colour picker is not among them.
	 *
	 * The saturation field, hue and alpha sliders are all drawn from the value being edited, so
	 * they are the one surface in this theme that is deliberately theme-independent: a picker that
	 * tinted its own gamut would be lying about the colour. The chrome around them — popover,
	 * inputs, swatch borders — is the theme's.
	 */

	type PropRow = { prop: string; type: string; default: string; description: string };

	const presetColors = [
		"#ef4444",
		"#f97316",
		"#eab308",
		"#22c55e",
		"#3b82f6",
		"#8b5cf6",
		"#ec4899",
		"#64748b",
	];

	// Controlled preview.
	let controlledColor = $state("#3b82f6");
	let controlledOpen = $state(false);

	function resetControlled() {
		controlledColor = "#000000";
		controlledOpen = false;
	}

	// Inline preview.
	let inlineColor = $state("#f59e0b");

	// Form preview — a native <form>, since this repo ships neither react-hook-form nor zod.
	const HEX_PATTERN = /^#([0-9a-f]{3}){1,2}$/i;

	const formDefaults = {
		primaryColor: "#3b82f6",
		secondaryColor: "#10b981",
		accentColor: "#f59e0b",
	};

	let primaryColor = $state(formDefaults.primaryColor);
	let secondaryColor = $state(formDefaults.secondaryColor);
	let accentColor = $state(formDefaults.accentColor);

	let submitted = $state<Record<string, string> | null>(null);
	let formError = $state<string | null>(null);

	const formFields = $derived([
		{ name: "primaryColor", label: "Primary Color", value: primaryColor },
		{ name: "secondaryColor", label: "Secondary Color", value: secondaryColor },
		{ name: "accentColor", label: "Accent Color", value: accentColor },
	]);

	function handleSubmit(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
		event.preventDefault();

		const data = new FormData(event.currentTarget);
		const entries: Record<string, string> = {};

		for (const [name, value] of data.entries()) {
			entries[name] = String(value);
		}

		const invalid = Object.entries(entries).find(([, value]) => !HEX_PATTERN.test(value));
		if (invalid) {
			formError = `${invalid[0]} must be a valid hex color`;
			submitted = null;
			return;
		}

		formError = null;
		submitted = entries;
	}

	function resetForm() {
		primaryColor = formDefaults.primaryColor;
		secondaryColor = formDefaults.secondaryColor;
		accentColor = formDefaults.accentColor;
		submitted = null;
		formError = null;
	}

	const rootProps: PropRow[] = [
		{
			prop: "value",
			type: "string",
			default: "—",
			description:
				"Bindable. The current color as a CSS string in the active format. A function binding that declines the write keeps the picker where it was.",
		},
		{
			prop: "defaultValue",
			type: "string",
			default: "'#000000'",
			description: "Seeds the color once when uncontrolled.",
		},
		{
			prop: "onValueChange",
			type: "(value: string) => void",
			default: "—",
			description:
				"Fires on every color change with colorToString(next, format). Never fires for a format or open change.",
		},
		{
			prop: "open",
			type: "boolean",
			default: "—",
			description: "Bindable. The popover open state. Ignored entirely when inline.",
		},
		{
			prop: "defaultOpen",
			type: "boolean",
			default: "false",
			description: "Seeds the open state once when uncontrolled.",
		},
		{
			prop: "onOpenChange",
			type: "(open: boolean) => void",
			default: "—",
			description: "Fires whenever the popover opens or closes.",
		},
		{
			prop: "modal",
			type: "boolean",
			default: "false",
			description:
				"Whether the open popover traps focus and locks scrolling, forwarded to the content as trapFocus/preventScroll.",
		},
		{
			prop: "format",
			type: "'hex' | 'rgb' | 'hsl' | 'hsb'",
			default: "—",
			description: "Bindable. The display format. Changing it never changes the color.",
		},
		{
			prop: "defaultFormat",
			type: "'hex' | 'rgb' | 'hsl' | 'hsb'",
			default: "'hex'",
			description: "Seeds the format once when uncontrolled.",
		},
		{
			prop: "onFormatChange",
			type: "(format: ColorFormat) => void",
			default: "—",
			description: "Fires whenever the display format changes.",
		},
		{
			prop: "dir",
			type: "'ltr' | 'rtl'",
			default: "resolved",
			description:
				"Falls back to the nearest DirectionProvider, then the DOM [dir], then ltr. Inverts the area and both sliders.",
		},
		{
			prop: "inline",
			type: "boolean",
			default: "false",
			description: "Renders the parts in the page with no popover, portal or overlay at all.",
		},
		{
			prop: "name",
			type: "string",
			default: "—",
			description:
				"The name of the hidden input rendered inside a <form>. It always submits a 6-digit hex.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "Suppresses pointer and keyboard interaction on every part.",
		},
		{
			prop: "readOnly",
			type: "boolean",
			default: "false",
			description: "Suppresses every color mutation while leaving the parts focusable.",
		},
		{
			prop: "required",
			type: "boolean",
			default: "false",
			description: "Mirrored onto the hidden form input.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: ColorPickerChildProps }]>",
			default: "—",
			description: "Render the picker onto your own element. In child mode ref stays null.",
		},
	];

	const triggerProps: PropRow[] = [
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "OR-ed with the picker's own disabled.",
		},
		{
			prop: "variant",
			type: "ButtonVariant",
			default: "'outline'",
			description: "The button style, from buttonVariants.",
		},
		{ prop: "size", type: "ButtonSize", default: "'icon'", description: "The button size." },
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "Typically <ColorPicker.Swatch />.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: ColorPickerTriggerChildProps }]>",
			default: "—",
			description: "Render the trigger onto your own element.",
		},
	];

	const contentProps: PropRow[] = [
		{
			prop: "side",
			type: "'top' | 'right' | 'bottom' | 'left'",
			default: "'bottom'",
			description: "Popover placement.",
		},
		{
			prop: "align",
			type: "'start' | 'center' | 'end'",
			default: "'start'",
			description: "Popover alignment.",
		},
		{ prop: "sideOffset", type: "number", default: "4", description: "Distance from the trigger." },
		{
			prop: "trapFocus / preventScroll",
			type: "boolean",
			default: "the root's modal",
			description: "Override the modality the root asked for.",
		},
		{
			prop: "…Popover.Content",
			type: "PopoverContentProps",
			default: "—",
			description:
				"Every other popover prop — onOpenAutoFocus, onEscapeKeydown, onInteractOutside, portalProps, forceMount, child. Ignored when the root is inline, which renders a plain div instead.",
		},
	];

	const areaProps: PropRow[] = [
		{
			prop: "step",
			type: "number",
			default: "1",
			description: "Arrow-key increment, in percentage points.",
		},
		{
			prop: "shiftStep",
			type: "number",
			default: "10",
			description: "Increment while Shift is held, and for PageUp/PageDown.",
		},
		{
			prop: "aria-label",
			type: "string",
			default: "'Saturation and brightness'",
			description: "The area’s accessible name.",
		},
		{
			prop: "onpointerdown / onpointermove / onpointerup",
			type: "PointerEventHandler",
			default: "—",
			description: "Called first; preventDefault() opts out of the built-in handling.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: ColorPickerAreaChildProps }]>",
			default: "—",
			description:
				"Render the area onto your own element; the gradient layers become yours to draw.",
		},
	];

	const hueSliderProps: PropRow[] = [
		{
			prop: "aria-label",
			type: "string",
			default: "'Hue'",
			description: 'Applied to the thumb, which also carries aria-valuetext="{hue} degrees".',
		},
		{
			prop: "…Slider.Root",
			type: "SliderRootProps",
			default: "—",
			description:
				"Every bits-ui slider prop except type, value, onValueChange, min, max, dir and disabled, which the picker owns (0–360, step 1).",
		},
	];

	const alphaSliderProps: PropRow[] = [
		{
			prop: "aria-label",
			type: "string",
			default: "'Alpha'",
			description: 'Applied to the thumb, which also carries aria-valuetext="{percent}%".',
		},
		{
			prop: "…Slider.Root",
			type: "SliderRootProps",
			default: "—",
			description:
				"Every bits-ui slider prop except the ones the picker owns (0–100 percent, step 1).",
		},
	];

	const swatchProps: PropRow[] = [
		{
			prop: "size",
			type: "'default' | 'sm' | 'lg'",
			default: "'default'",
			description: "Forwarded to ColorSwatch.",
		},
		{
			prop: "withoutTransparency",
			type: "boolean",
			default: "false",
			description: "Suppresses the checkerboard behind a translucent color.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: ColorPickerSwatchChildProps }]>",
			default: "—",
			description: "Render the swatch onto your own element.",
		},
	];

	const eyeDropperProps: PropRow[] = [
		{
			prop: "variant",
			type: "ButtonVariant",
			default: "'outline'",
			description: "The button style.",
		},
		{
			prop: "size",
			type: "ButtonSize",
			default: "'icon' without children",
			description: "The button size.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "OR-ed with the picker's own disabled.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "<PipetteIcon />",
			description: "The button content.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: ColorPickerEyeDropperChildProps }]>",
			default: "—",
			description: "Render the button onto your own element.",
		},
	];

	const formatSelectProps: PropRow[] = [
		{ prop: "size", type: "'sm' | 'default'", default: "'sm'", description: "The trigger's size." },
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "OR-ed with the picker's own disabled.",
		},
		{
			prop: "open",
			type: "boolean",
			default: "false",
			description: "Bindable listbox open state.",
		},
		{
			prop: "aria-label",
			type: "string",
			default: "'Color format'",
			description: "The trigger's accessible name.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: ColorPickerFormatSelectChildProps }]>",
			default: "—",
			description: "Render the trigger onto your own element.",
		},
	];

	const inputProps: PropRow[] = [
		{
			prop: "withoutAlpha",
			type: "boolean",
			default: "false",
			description:
				'Omits the alpha field in every format. With format="hex" this renders a single isolated field and no wrapper.',
		},
		{
			prop: "…input attributes",
			type: "HTMLInputAttributes",
			default: "—",
			description: "Spread onto every rendered field, except value, oninput and type.",
		},
	];

	const inputFieldProps: PropRow[] = [
		{
			prop: "channel",
			type: "'hex' | 'r' | 'g' | 'b' | 'h' | 's' | 'l' | 'v' | 'a'",
			default: "—",
			description:
				"Which channel of the active format this field edits. A channel outside the active format renders nothing.",
		},
		{
			prop: "position",
			type: "'first' | 'middle' | 'last' | 'isolated'",
			default: "from the channel model",
			description: "Drives the joined-border variant from colorPickerInputVariants.",
		},
		{
			prop: "…input attributes",
			type: "HTMLInputAttributes",
			default: "—",
			description: "Spread onto the rendered <input>, except value, oninput and type.",
		},
	];

	// Upstream exports a `useColorPicker(selector)` hook so a deep part can subscribe to one slice of
	// the store. Runes subscribe on read, so the Svelte port needs no selector at all: one accessor
	// returns the state and every field read off it is tracked individually.
	const contextExample = `<script lang="ts">
	import { getColorPickerContext } from '$lib/components/ui/color-picker/index.js';

	// Call this during initialisation of any part rendered inside <ColorPicker.Root>.
	// It throws when there is no root above it.
	const picker = getColorPickerContext('<ColorPicker.Readout>');
${"<"}/script>

<dl>
	<dt>rgb</dt>
	<dd>rgb({picker.rgb.r}, {picker.rgb.g}, {picker.rgb.b})</dd>
	<dt>hsv</dt>
	<dd>hsv({picker.hsv.h}, {picker.hsv.s}, {picker.hsv.v})</dd>
	<dt>hue</dt>
	<dd>{picker.hue}°</dd>
	<dt>alpha</dt>
	<dd>{picker.alpha}</dd>
	<dt>format</dt>
	<dd>{picker.format}</dd>
	<dt>state</dt>
	<dd>{picker.open ? 'open' : 'closed'}</dd>
</dl>`;

	type StateRow = { member: string; type: string; description: string };

	const contextMembers: StateRow[] = [
		{
			member: "rgb",
			type: "RgbaColor",
			description: "The authoritative color, channels 0–255 and alpha 0–1.",
		},
		{
			member: "hsv",
			type: "HsvaColor",
			description:
				"The same color as hue/saturation/brightness. Stored alongside rgb, never derived from it, so the hue survives the greyscale axis.",
		},
		{ member: "hue", type: "number", description: "The hue in degrees, 0–360." },
		{
			member: "saturation / brightness",
			type: "number",
			description: "The area’s two axes, each 0–100.",
		},
		{
			member: "alpha / alphaPercent",
			type: "number",
			description: "The alpha as 0–1 and as a whole percentage.",
		},
		{
			member: "hex / formatted",
			type: "string",
			description:
				"#rrggbb — what the hidden input submits — and the color in the active notation.",
		},
		{ member: "valueText", type: "string", description: "The area’s aria-valuetext." },
		{
			member: "format",
			type: "ColorFormat",
			description: "The active notation: hex, rgb, hsl or hsb.",
		},
		{
			member: "open",
			type: "boolean",
			description: "Whether the popover is open. Always meaningful, even when inline ignores it.",
		},
		{
			member: "dir / inline / modal / disabled / readOnly / required / name",
			type: "—",
			description: "The root’s configuration, as every part reads it.",
		},
		{
			member: "isEmpty",
			type: "boolean",
			description: "Whether the picker was handed an empty value.",
		},
		{
			member: "inputFields",
			type: "ColorPickerInputFieldModel[]",
			description: "The channel model of the active format, one entry per rendered field.",
		},
		{
			member: "setFromRgb / setFromHsv / setHue / setSaturationBrightness / setAlpha",
			type: "(…) => void",
			description: "The color mutators. Each is a no-op while the picker is disabled or read-only.",
		},
		{
			member: "setFormat / setOpen / commitField",
			type: "(…) => void",
			description:
				"Switch notation, open or close the popover, and commit one input field’s raw text.",
		},
	];

	const apiSections = [
		{
			name: "ColorPicker.Root",
			description: "The container that owns the color, the format and the popover state.",
			rows: rootProps,
		},
		{
			name: "ColorPicker.Trigger",
			description: 'A real <button type="button"> that opens the popover.',
			rows: triggerProps,
		},
		{
			name: "ColorPicker.Content",
			description: "The panel — a popover dialog, or a plain container when the root is inline.",
			rows: contentProps,
		},
		{
			name: "ColorPicker.Area",
			description:
				'The 2D saturation/brightness area, exposed as role="slider" with a describing aria-valuetext.',
			rows: areaProps,
		},
		{ name: "ColorPicker.HueSlider", description: "The 0–360° hue track.", rows: hueSliderProps },
		{
			name: "ColorPicker.AlphaSlider",
			description: "The transparent → opaque alpha track, over a checkerboard.",
			rows: alphaSliderProps,
		},
		{
			name: "ColorPicker.Swatch",
			description: 'A role="img" preview of the current color, checkerboard included.',
			rows: swatchProps,
		},
		{
			name: "ColorPicker.EyeDropper",
			description:
				"Samples a color from the screen. Renders nothing at all where the browser has no EyeDropper API.",
			rows: eyeDropperProps,
		},
		{
			name: "ColorPicker.FormatSelect",
			description: "A listbox offering HEX, RGB, HSL and HSB.",
			rows: formatSelectProps,
		},
		{
			name: "ColorPicker.Input",
			description: "One text field per channel of the active format.",
			rows: inputProps,
		},
		{
			name: "ColorPicker.InputField",
			description: "A single channel field, exported so you can rebuild the row yourself.",
			rows: inputFieldProps,
		},
	];
</script>

<DocPage title="Color Picker">
	{#snippet subtitle()}
		A color picker component that allows users to select colors using various input methods — a 2D
		saturation/brightness area, hue and alpha sliders, the native eyedropper, and per-channel text
		fields in hex, rgb, hsl or hsb.
	{/snippet}

	<DocSection title="Default">
		<Card.Root>
			<Card.Content>
				<ColorPicker.Root defaultFormat="hex" defaultValue="#3b82f6">
					<ColorPicker.Trigger>
						<ColorPicker.Swatch />
					</ColorPicker.Trigger>
					<ColorPicker.Content>
						<ColorPicker.Area />
						<div class="flex items-center gap-2">
							<ColorPicker.EyeDropper />
							<div class="flex flex-1 flex-col gap-2">
								<ColorPicker.HueSlider />
								<ColorPicker.AlphaSlider />
							</div>
						</div>
						<div class="flex items-center gap-2">
							<ColorPicker.FormatSelect />
							<ColorPicker.Input />
						</div>
					</ColorPicker.Content>
				</ColorPicker.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Inline">
		{#snippet blurb()}
			— the inline prop drops the popover entirely.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<ColorPicker.Root bind:value={inlineColor} inline defaultFormat="hex">
					<div class="flex flex-col gap-4">
						<div class="flex items-center gap-3">
							<ColorPicker.Swatch />
							<span class="text-sm font-medium">Selected Color</span>
							<code class="font-mono text-sm text-muted-foreground">{inlineColor}</code>
						</div>
						<ColorPicker.Content class="rounded-lg border">
							<ColorPicker.Area />
							<div class="flex items-center gap-2">
								<ColorPicker.EyeDropper />
								<div class="flex flex-1 flex-col gap-2">
									<ColorPicker.HueSlider />
									<ColorPicker.AlphaSlider />
								</div>
							</div>
							<div class="flex items-center gap-2">
								<ColorPicker.FormatSelect />
								<ColorPicker.Input />
							</div>
						</ColorPicker.Content>
					</div>
				</ColorPicker.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Controlled">
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-4">
					<div class="flex items-center gap-3">
						<ColorPicker.Root
							bind:value={controlledColor}
							bind:open={controlledOpen}
							defaultFormat="hex"
						>
							<ColorPicker.Trigger size="default" class="gap-2 px-2.5">
								<ColorPicker.Swatch size="sm" />
								Pick Color
							</ColorPicker.Trigger>
							<ColorPicker.Content>
								<ColorPicker.Area />
								<div class="flex items-center gap-2">
									<ColorPicker.EyeDropper />
									<div class="flex flex-1 flex-col gap-2">
										<ColorPicker.HueSlider />
										<ColorPicker.AlphaSlider />
									</div>
								</div>
								<div class="flex items-center gap-2">
									<ColorPicker.FormatSelect />
									<ColorPicker.Input />
								</div>
							</ColorPicker.Content>
						</ColorPicker.Root>

						<Button variant="outline" onclick={resetControlled}>Reset</Button>
					</div>

					<div class="flex flex-col gap-2">
						<h4 class="text-sm font-medium">Preset Colors</h4>
						<div class="flex flex-wrap gap-2">
							{#each presetColors as preset (preset)}
								<button
									type="button"
									class="size-8 rounded-lg border-2 border-transparent hover:border-border focus-visible:border-ring focus-visible:outline-none"
									style="background-color: {preset}"
									onclick={() => (controlledColor = preset)}
									aria-label="Select color {preset}"
								></button>
							{/each}
						</div>
					</div>

					<div class="flex flex-col gap-2 text-sm">
						<div>
							<span class="font-medium">Current color:</span>
							<code class="ml-2 font-mono">{controlledColor}</code>
						</div>
						<div>
							<span class="font-medium">Picker state:</span>
							<span class="ml-2">{controlledOpen ? "Open" : "Closed"}</span>
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Form">
		{#snippet blurb()}
			Adapts color-picker-form-demo.tsx to a native form — this repo ships neither react-hook-form
			nor zod, so the three named pickers submit through their hidden inputs and are hex-validated
			on submit.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<form
					class="flex w-full max-w-md flex-col gap-4 rounded-lg border p-6 shadow-sm"
					onsubmit={handleSubmit}
				>
					<div class="flex flex-col gap-1">
						<h3 class="text-lg font-semibold">Theme Colors</h3>
						<p class="text-sm text-muted-foreground">Configure your application's color scheme.</p>
					</div>

					{#each formFields as entry (entry.name)}
						<div class="flex flex-col gap-2">
							<span class="text-sm font-medium">{entry.label}</span>
							<ColorPicker.Root
								value={entry.value}
								onValueChange={(next) => {
									if (entry.name === "primaryColor") primaryColor = next;
									else if (entry.name === "secondaryColor") secondaryColor = next;
									else accentColor = next;
								}}
								name={entry.name}
								defaultFormat="hex"
								required
							>
								<div class="flex items-center gap-3">
									<ColorPicker.Trigger size="default" class="gap-2 px-2.5">
										<ColorPicker.Swatch size="sm" />
										<span class="font-mono">{entry.value}</span>
									</ColorPicker.Trigger>
								</div>
								<ColorPicker.Content>
									<ColorPicker.Area />
									<div class="flex items-center gap-2">
										<ColorPicker.EyeDropper />
										<div class="flex flex-1 flex-col gap-2">
											<ColorPicker.HueSlider />
											<ColorPicker.AlphaSlider />
										</div>
									</div>
									<div class="flex items-center gap-2">
										<ColorPicker.FormatSelect />
										<ColorPicker.Input />
									</div>
								</ColorPicker.Content>
							</ColorPicker.Root>
						</div>
					{/each}

					{#if formError}
						<p class="text-sm text-destructive">{formError}</p>
					{/if}

					{#if submitted}
						<pre class="w-full overflow-x-auto rounded-lg bg-muted p-3 text-xs">{JSON.stringify(
								submitted,
								null,
								2,
							)}</pre>
					{/if}

					<div class="flex justify-end gap-2">
						<Button type="button" variant="outline" onclick={resetForm}>Reset</Button>
						<Button type="submit">Save Theme</Button>
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		{#each apiSections as section (section.name)}
			<div class="flex flex-col gap-3">
				<h3 class="text-base font-medium">{section.name}</h3>
				<p class="text-sm text-muted-foreground">{section.description}</p>
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
								{#each section.rows as row (row.prop)}
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
		{/each}

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">getColorPickerContext</h3>
			<p class="text-sm text-muted-foreground">
				The single accessor for the picker's state, and the replacement for upstream's
				<code class="font-mono">useColorPicker</code> selector hook. Call it during initialisation
				of any component rendered inside
				<code class="font-mono">&lt;ColorPicker.Root&gt;</code> — pass your part's name so the error
				names it when there is no root above. It returns the
				<code class="font-mono">ColorPickerRootState</code>, whose fields are runes: reading one
				subscribes to it, so no selector is needed.
			</p>
			<pre class="w-full overflow-x-auto rounded-lg bg-muted p-3 text-xs">{contextExample}</pre>
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
							{#each contextMembers as member (member.member)}
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
