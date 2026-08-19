<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as SegmentedInput from "$lib/components/ui/segmented-input/index.js";
	import * as Table from "$lib/components/ui/table/index.js";

	/**
	 * The Segmented input component page.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART as a component, but it has one per box: each cell is a
	 * `.form-control`, and `app.css`'s `[data-slot='input']` rule reaches them, so the border,
	 * focus ring and disabled treatment are the classic theme's.
	 *
	 * What the component adds is the movement between them — auto-advance, backspace-to-previous,
	 * paste-across-all — which is behaviour, and the same in any theme.
	 */

	let name = $state({ first: "", second: "", third: "" });

	let phone = $state({ countryCode: "+1", areaCode: "", number: "" });
	let submitted = $state<string | null>(null);

	let rgb = $state({ r: "255", g: "128", b: "0" });

	let address = $state({ street: "", city: "", zipCode: "" });

	function onSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitted = `${phone.countryCode} ${phone.areaCode}-${phone.number}`;
	}

	/** Upstream clamps each channel to 0…255 and ignores anything else (segmented-input-rgb-demo). */
	function clampChannel(next: string): string {
		const parsed = Number.parseInt(next, 10);
		if (Number.isNaN(parsed)) return "";
		return String(Math.min(255, Math.max(0, parsed)));
	}

	const rootProps = [
		{
			prop: "size",
			type: "'default' | 'sm' | 'lg'",
			default: "'default'",
			description: "The size of every input in the segment.",
		},
		{
			prop: "orientation",
			type: "'horizontal' | 'vertical'",
			default: "'horizontal'",
			description: "Lays the segments out in a row or a column, and picks the arrow-key axis.",
		},
		{
			prop: "dir",
			type: "'ltr' | 'rtl'",
			default: "resolved",
			description:
				'Falls back to the nearest DirectionProvider, then the DOM [dir], then "ltr". Inverts the horizontal arrows.',
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables every item unless the item passes its own disabled={false}.",
		},
		{
			prop: "invalid",
			type: "boolean",
			default: "false",
			description: "Marks every item aria-invalid. There is no per-item override.",
		},
		{
			prop: "required",
			type: "boolean",
			default: "false",
			description: "Marks every item required unless the item overrides it.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description:
				"Renders the group onto your own element instead of the default div. Replaces upstream asChild.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "...restProps",
			type: "Omit<HTMLAttributes<HTMLDivElement>, 'dir'>",
			default: "—",
			description: "Spread onto the element; class is merged last.",
		},
	];

	const itemProps = [
		{
			prop: "value",
			type: "string | number | null",
			default: "undefined",
			description:
				"Bindable — bind:value moves your state, bind:value={get, set} keeps you authoritative, including against a distributed paste.",
		},
		{
			prop: "position",
			type: "'isolated' | 'first' | 'middle' | 'last'",
			default: "auto-detected",
			description:
				"Derived from the item’s document-order index among the registered items. An explicit value always wins.",
		},
		{
			prop: "type",
			type: "Exclude<HTMLInputTypeAttribute, 'file'>",
			default: "undefined",
			description: "Any native input type except file, which has no caret and no maxlength.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "inherits the group",
			description: "An explicit false opts this segment out of a disabled group.",
		},
		{
			prop: "required",
			type: "boolean",
			default: "inherits the group",
			description: "Same inheritance rule as disabled.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description:
				"Renders the segment onto your own element. Spread props onto an input and the segment still registers, keeping its position, navigation and paste share.",
		},
		{
			prop: "ref",
			type: "HTMLInputElement | null",
			default: "null",
			description:
				"Bindable reference to the rendered input — also the node registered for navigation.",
		},
		{
			prop: "...restProps",
			type: "Omit<HTMLInputAttributes, 'type' | 'value' | 'files'>",
			default: "—",
			description:
				"Spread onto the input. A caller onkeydown or onpaste runs first and may preventDefault() the built-in behaviour.",
		},
	];

	const keyboard = [
		{ keys: "Tab", description: "Moves focus to the next input in the segment." },
		{ keys: "Shift + Tab", description: "Moves focus to the previous input in the segment." },
		{
			keys: "ArrowRight",
			description:
				'Horizontal: next segment when the caret is at the end of the value; previous under dir="rtl".',
		},
		{
			keys: "ArrowLeft",
			description:
				'Horizontal: previous segment when the caret is at the start of the value; next under dir="rtl".',
		},
		{
			keys: "ArrowDown",
			description: "Vertical: next segment when the caret is at the end of the value.",
		},
		{
			keys: "ArrowUp",
			description: "Vertical: previous segment when the caret is at the start of the value.",
		},
		{ keys: "Home", description: "Moves focus to the first enabled segment." },
		{ keys: "End", description: "Moves focus to the last enabled segment." },
	];
</script>

<DocPage title="Segmented Input">
	{#snippet subtitle()}
		A group of connected input fields that appear as a single segmented visual unit.
	{/snippet}

	<DocSection title="Default">
		{#snippet blurb()}
			Arrow keys cross a segment boundary once the caret sits at that edge, and pasting “Ada Byron
			King” fills all three fields at once.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full max-w-sm flex-col gap-2">
					<span id="segmented-input-name-label" class="text-sm leading-none font-medium">
						Enter your details
					</span>
					<SegmentedInput.Root class="w-full" aria-labelledby="segmented-input-name-label">
						<SegmentedInput.Item
							bind:value={name.first}
							placeholder="First"
							aria-label="First name"
						/>
						<SegmentedInput.Item
							bind:value={name.second}
							placeholder="Middle"
							aria-label="Middle name"
						/>
						<SegmentedInput.Item
							bind:value={name.third}
							placeholder="Last"
							aria-label="Last name"
						/>
					</SegmentedInput.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Form Input">
		{#snippet blurb()}
			The area code and number segments declare their own maxlength, so pasting “5551234567” into
			the area code overflows the extra digits into the number field.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<form onsubmit={onSubmit} class="flex w-full max-w-sm flex-col gap-4">
					<div class="flex flex-col gap-2">
						<span id="segmented-input-phone-label" class="text-sm leading-none font-medium">
							Phone Number
						</span>
						<SegmentedInput.Root class="w-full" aria-labelledby="segmented-input-phone-label">
							<SegmentedInput.Item
								bind:value={phone.countryCode}
								placeholder="+1"
								class="w-16"
								aria-label="Country code"
							/>
							<SegmentedInput.Item
								bind:value={phone.areaCode}
								placeholder="555"
								class="w-20"
								maxlength={3}
								inputmode="numeric"
								pattern="[0-9]*"
								aria-label="Area code"
							/>
							<SegmentedInput.Item
								bind:value={phone.number}
								placeholder="1234567"
								class="flex-1"
								maxlength={7}
								inputmode="numeric"
								pattern="[0-9]*"
								aria-label="Phone number"
							/>
						</SegmentedInput.Root>
					</div>
					<div class="flex items-center gap-3">
						<Button type="submit" size="sm">Submit</Button>
						{#if submitted}
							<span class="text-sm text-muted-foreground">Submitted: {submitted}</span>
						{/if}
					</div>
				</form>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="RGB Color Input">
		{#snippet blurb()}
			Each channel clamps itself to 0–255, and a pasted “255, 128, 0” lands one value per channel.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-2">
					<span id="segmented-input-rgb-label" class="text-sm leading-none font-medium"
						>RGB Color</span
					>
					<SegmentedInput.Root class="w-fit" aria-labelledby="segmented-input-rgb-label">
						<SegmentedInput.Item
							bind:value={() => rgb.r, (next) => (rgb.r = clampChannel(String(next ?? "")))}
							placeholder="255"
							class="w-16"
							inputmode="numeric"
							pattern="[0-9]*"
							min="0"
							max="255"
							aria-label="Red channel (0-255)"
						/>
						<SegmentedInput.Item
							bind:value={() => rgb.g, (next) => (rgb.g = clampChannel(String(next ?? "")))}
							placeholder="128"
							class="w-16"
							inputmode="numeric"
							pattern="[0-9]*"
							min="0"
							max="255"
							aria-label="Green channel (0-255)"
						/>
						<SegmentedInput.Item
							bind:value={() => rgb.b, (next) => (rgb.b = clampChannel(String(next ?? "")))}
							placeholder="0"
							class="w-16"
							inputmode="numeric"
							pattern="[0-9]*"
							min="0"
							max="255"
							aria-label="Blue channel (0-255)"
						/>
					</SegmentedInput.Root>
					<span class="text-sm text-muted-foreground">
						rgb({rgb.r || 0}, {rgb.g || 0}, {rgb.b || 0})
					</span>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Vertical Layout">
		{#snippet blurb()}
			In a vertical group the up and down arrows move between fields and the horizontal ones stay
			with the caret.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full max-w-sm flex-col gap-4">
					<div class="flex flex-col gap-2">
						<span id="segmented-input-address-label" class="text-sm leading-none font-medium">
							Mailing Address
						</span>
						<SegmentedInput.Root
							class="w-full"
							orientation="vertical"
							aria-labelledby="segmented-input-address-label"
						>
							<SegmentedInput.Item
								bind:value={address.street}
								placeholder="Street Address"
								aria-label="Street address"
							/>
							<SegmentedInput.Item bind:value={address.city} placeholder="City" aria-label="City" />
							<SegmentedInput.Item
								bind:value={address.zipCode}
								placeholder="ZIP Code"
								aria-label="ZIP code"
							/>
						</SegmentedInput.Root>
					</div>
					<p class="text-sm text-muted-foreground">
						Use arrow keys (up/down) to navigate between fields in vertical orientation.
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">SegmentedInput.Root</h3>
			<p class="text-sm text-muted-foreground">
				The <code>role="group"</code> container. It publishes size, direction, orientation and the shared
				state flags, and owns the registry the segments join.
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
			<h3 class="text-base font-medium">SegmentedInput.Item</h3>
			<p class="text-sm text-muted-foreground">
				One segment. Renders the shared <code>Input</code>, so every native input attribute —
				<code>placeholder</code>, <code>maxlength</code>, <code>inputmode</code>,
				<code>pattern</code>, <code>readonly</code> — passes straight through.
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
							{#each itemProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Keyboard Interactions</h3>
			<p class="text-sm text-muted-foreground">
				Arrow keys only cross a boundary once the caret already sits at that edge with nothing
				selected, so editing the middle of a segment still works. Nothing wraps around, and disabled
				segments are skipped.
			</p>
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
	</DocSection>
</DocPage>
