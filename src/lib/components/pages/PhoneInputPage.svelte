<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import * as PhoneInput from "$lib/components/ui/phone-input/index.js";
	import type { Country } from "$lib/components/ui/phone-input/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { toast } from "svelte-sonner";

	/**
	 * The Phone input component page.
	 *
	 * THIS IS AN `.input-group` — a country select welded to a text field — and `input-group` is
	 * the theme's one acknowledged radius caveat (§7 of the theme notes). The classic framework joins the two
	 * controls by zeroing the inner corners in Sass; this theme's radius scale is written out as
	 * tokens, and the join is drawn by the component rather than derived.
	 *
	 * Both halves are otherwise themed: the field through `[data-slot='input']`, the select's menu
	 * through the popover surface.
	 */

	// --- Custom countries ----------------------------------------------------
	const NORTH_AMERICAN_COUNTRIES: Country[] = [
		{ code: "US", name: "United States", dialCode: "+1", flag: "🇺🇸" },
		{ code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
		{ code: "MX", name: "Mexico", dialCode: "+52", flag: "🇲🇽" },
		{ code: "BR", name: "Brazil", dialCode: "+55", flag: "🇧🇷" },
	];

	// --- With form -----------------------------------------------------------
	// Upstream drives this example with react-hook-form + zod; neither has a Svelte analogue in this
	// repo, so the same two rules — a phone number and a country are required — are a few lines of
	// rune state instead.
	let phone = $state("");
	let country = $state("US");
	let submitted = $state(false);

	const phoneError = $derived(submitted && phone === "" ? "Phone number is required." : undefined);
	const countryError = $derived(submitted && country === "" ? "Country is required." : undefined);

	function onSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitted = true;

		if (phone === "" || country === "") return;

		toast.success("Phone number submitted", {
			description: JSON.stringify({ country, phone }, null, 2),
		});
	}

	const rootProps = [
		{
			prop: "value",
			type: "string",
			default: "—",
			description:
				"Bindable canonical value — a + followed by digits only. The formatted string is display-only.",
		},
		{
			prop: "defaultValue",
			type: "string",
			default: "''",
			description: "Seeds the value once when uncontrolled.",
		},
		{
			prop: "onValueChange",
			type: "(value: string) => void",
			default: "—",
			description: "Called with the canonical value on every actual change, in both modes.",
		},
		{
			prop: "country",
			type: "string",
			default: "—",
			description: "Bindable ISO 3166-1 alpha-2 code of the selected country.",
		},
		{
			prop: "defaultCountry",
			type: "string",
			default: "''",
			description:
				'Seeds the country once when uncontrolled. Upstream’s type file documents "US", but its implementation falls back to "" — runtime behaviour wins here.',
		},
		{
			prop: "onCountryChange",
			type: "(country: string) => void",
			default: "—",
			description: "Called on a manual selection and on automatic detection alike.",
		},
		{
			prop: "countries",
			type: "Country[]",
			default: "getCountries()",
			description: "The list shown in the dropdown — 239 built-in entries, sorted by display name.",
		},
		{
			prop: "name",
			type: "string",
			default: "—",
			description: "Field name of the hidden input rendered inside a form.",
		},
		{
			prop: "placeholder",
			type: "string",
			default: "'Enter phone number'",
			description: "Wins over a placeholder set on PhoneInput.Field.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables the trigger and the field, and sets [data-disabled] on the root.",
		},
		{
			prop: "readOnly",
			type: "boolean",
			default: "false",
			description:
				"Keeps the field focusable but not editable; the country stays selectable. Sets [data-readonly].",
		},
		{
			prop: "required",
			type: "boolean",
			default: "false",
			description: "aria-required on the field and required on the hidden form input.",
		},
		{
			prop: "invalid",
			type: "boolean",
			default: "false",
			description: "aria-invalid on the field, and [data-invalid] on the root.",
		},
		{
			prop: "showFlag",
			type: "boolean",
			default: "true",
			description: "Hides the flags on the trigger and on every list item when false.",
		},
		{
			prop: "id",
			type: "string",
			default: "$props.id()",
			description: "Applied to the root element.",
		},
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered root element.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged last through cn(), so a caller can always override the layout.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The parts — PhoneInput.CountrySelect and PhoneInput.Field.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: PhoneInputChildProps }]>",
			default: "—",
			description:
				"Renders the group onto your own element. Replaces upstream’s asChild; ref stays null in this mode, and the props carry an attachment that keeps the form detection working.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description:
				"Spread after role, the data attributes and id, so a caller can override any of them.",
		},
	];

	const countrySelectProps = [
		{
			prop: "open",
			type: "boolean",
			default: "the root state (false)",
			description: "Bindable. A caller-supplied value wins over the internal state.",
		},
		{
			prop: "onOpenChange",
			type: "(open: boolean) => void",
			default: "—",
			description: "Composed with the internal handler, never replacing it.",
		},
		{
			prop: "onOpenChangeComplete",
			type: "(open: boolean) => void",
			default: "—",
			description: "Passed straight to Popover.Root; fires once the animation is done.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "OR-ed with the root’s disabled.",
		},
		{
			prop: "ref",
			type: "HTMLButtonElement | null",
			default: "null",
			description: "Bindable reference to the trigger button.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged last onto the trigger.",
		},
		{
			prop: "...restProps",
			type: "remaining Popover.RootProps",
			default: "—",
			description: "Spread onto Popover.Root, so the popover itself stays configurable.",
		},
	];

	const fieldProps = [
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "OR-ed with the root’s disabled.",
		},
		{
			prop: "readOnly",
			type: "boolean",
			default: "false",
			description: "OR-ed with the root’s readOnly.",
		},
		{
			prop: "required",
			type: "boolean",
			default: "false",
			description: "OR-ed with the root’s required.",
		},
		{
			prop: "oninput",
			type: "(event) => void",
			default: "—",
			description:
				"Runs before the field normalises the text. preventDefault() discards the edit and snaps the display back.",
		},
		{
			prop: "ref",
			type: "HTMLInputElement | null",
			default: "null",
			description:
				"Bindable reference to the input, also registered with the root for focus return.",
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged last onto the input.",
		},
		{
			prop: "...restProps",
			type: "Omit<HTMLInputAttributes, 'value' | 'type' | 'readonly' | 'files'>",
			default: "—",
			description:
				"Spread after inputmode, aria-required, aria-invalid and data-slot — which a caller can therefore override — and before class, the root’s placeholder, the display value and the internal oninput, which it cannot. value, type, readonly and files are removed from the type outright.",
		},
	];

	/* ---------------------------------------------------------------------------------------------
	 * The demo set.
	 *
	 * The demos assume a single component with a `variant` size prop (sm h-7 / default h-8 /
	 * lg h-9). The component here is part-shaped — Root + CountrySelect + Field — and its root is a
	 * fixed h-8 with both inner parts at h-full, so the sizes are adapted as `class` overrides on
	 * the root, mapped onto this repository's control ramp (sm h-8 / lg h-12).
	 * All eight demos are uncontrolled, so no rune state is needed; a fixed starting
	 * `value` is a `defaultValue`.
	 * ------------------------------------------------------------------------------------------ */

	const keyboard = [
		{
			keys: "Tab",
			description: "Moves between the country trigger and the field, in logical order.",
		},
		{ keys: "Space, Enter", description: "Opens the dropdown from the trigger." },
		{
			keys: "Escape",
			description:
				"Closes the dropdown with the selection unchanged and focus back on the trigger.",
		},
		{ keys: "ArrowUp, ArrowDown", description: "Moves the highlighted country." },
		{ keys: "Home, End", description: "Jumps to the first or last country." },
		{
			keys: "Enter",
			description: "Selects the highlighted country, closes the dropdown and focuses the field.",
		},
		{
			keys: "Type to search",
			description: "Filters the list by country name, dial code or ISO code.",
		},
		{
			keys: "Backspace, Delete",
			description: "Removes digits from the field and re-formats what is left.",
		},
	];
</script>

<DocPage title="Phone Input">
	{#snippet subtitle()}
		An accessible phone input with automatic country detection and international phone number
		formatting.
	{/snippet}

	<DocSection title="Default">
		{#snippet blurb()}
			The root's placeholder wins over the field's own, which is why upstream's demo shows “Enter
			phone number” rather than its own placeholder. Selecting a country seeds an empty field with
			its calling code and replaces any value under a different calling code; only a number already
			under the selected code is kept — a divergence from upstream, which leaves the value
			untouched.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-sm">
					<PhoneInput.Root>
						<PhoneInput.CountrySelect />
						<PhoneInput.Field placeholder="12345667777" />
					</PhoneInput.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Custom countries">
		{#snippet blurb()}
			Only the four supplied entries are searchable, and formatting uses their dial codes.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-sm">
					<PhoneInput.Root
						defaultValue="+14085551234"
						defaultCountry="US"
						countries={NORTH_AMERICAN_COUNTRIES}
					>
						<PhoneInput.CountrySelect />
						<PhoneInput.Field placeholder="Type phone number" />
					</PhoneInput.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With form">
		{#snippet blurb()}
			A native &lt;form&gt; with Field.FieldGroup and rune state stands in for react-hook-form and
			zod, which have no Svelte analogue here.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<form onsubmit={onSubmit} class="w-full max-w-sm">
					<Field.FieldGroup>
						<Field.Field data-invalid={phoneError || countryError ? "" : undefined}>
							<Field.FieldLabel for="phone-input-form">Phone number</Field.FieldLabel>
							<PhoneInput.Root
								bind:value={phone}
								bind:country
								required
								invalid={Boolean(phoneError || countryError)}
								name="phone"
							>
								<PhoneInput.CountrySelect />
								<PhoneInput.Field id="phone-input-form" />
							</PhoneInput.Root>
							{#if phoneError || countryError}
								<Field.FieldError>{phoneError ?? countryError}</Field.FieldError>
							{:else}
								<Field.FieldDescription>
									Enter your phone number with country code.
								</Field.FieldDescription>
							{/if}
						</Field.Field>
						<div class="flex justify-end">
							<Button type="submit">Submit</Button>
						</div>
					</Field.FieldGroup>
				</form>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">PhoneInput.Root</h3>
			<p class="text-sm text-muted-foreground">
				The group that owns the canonical value and the selected country, and renders a hidden input
				inside a <code>&lt;form&gt;</code>. The pure engine —
				<code>getCountries</code>, <code>formatPhoneNumber</code>,
				<code>detectCountryFromNumber</code>
				and <code>normalizePhoneInput</code> — is exported from the same module for reuse without rendering
				a field.
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
			<h3 class="text-base font-medium">PhoneInput.CountrySelect</h3>
			<p class="text-sm text-muted-foreground">
				The trigger and its searchable dropdown, composed from <code>Popover</code> and
				<code>Command</code>. It takes no children — upstream discards them too.
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
							{#each countrySelectProps as row (row.prop)}
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
			<h3 class="text-base font-medium">PhoneInput.Field</h3>
			<p class="text-sm text-muted-foreground">
				The <code>tel</code> input. Its value is one-way — the component formats what you type and puts
				the formatted string back, so a rejected character never survives a keystroke.
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
							{#each fieldProps as row (row.prop)}
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
				Under <code>dir="rtl"</code> the layout follows logical start/end and no key mapping changes —
				the widget has no left/right navigation to invert.
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

	<DocSection title="Small phone input">
		{#snippet blurb()}
			The small variant; this component has no size prop, so the small height is a class on the root
			— h-8, the sm step of the control ramp — and the h-full trigger and field follow it.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-sm">
					<PhoneInput.Root class="h-8" defaultValue="+31612345678" defaultCountry="NL">
						<PhoneInput.CountrySelect />
						<PhoneInput.Field placeholder="Enter phone number" />
					</PhoneInput.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Large phone input">
		{#snippet blurb()}
			The large variant, adapted the same way — h-12, the ramp's 48px lg step.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-sm">
					<PhoneInput.Root class="h-12" defaultValue="+12125551234" defaultCountry="US">
						<PhoneInput.CountrySelect />
						<PhoneInput.Field placeholder="Enter phone number" />
					</PhoneInput.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Disabled phone input">
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-sm">
					<PhoneInput.Root disabled>
						<PhoneInput.CountrySelect />
						<PhoneInput.Field placeholder="Enter phone number" />
					</PhoneInput.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Phone input with preset value">
		{#snippet blurb()}
			Seeding through defaultValue also detects the country — the +1 212 area code resolves to the
			United States without a defaultCountry.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-sm">
					<PhoneInput.Root defaultValue="+12125551234">
						<PhoneInput.CountrySelect />
						<PhoneInput.Field placeholder="Enter phone number" />
					</PhoneInput.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Phone input with error state">
		{#snippet blurb()}
			Setting aria-invalid on the input directly would work; here the invalid prop does that and
			also puts [data-invalid] on the root, so the whole group takes the destructive border and
			ring.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-sm">
					<PhoneInput.Root invalid>
						<PhoneInput.CountrySelect />
						<PhoneInput.Field placeholder="Enter phone number" />
					</PhoneInput.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Phone input with specific default country">
		{#snippet blurb()}
			An empty field opens on France; typing a full number under another calling code still
			re-detects the country.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-sm">
					<PhoneInput.Root defaultCountry="FR">
						<PhoneInput.CountrySelect />
						<PhoneInput.Field placeholder="Enter phone number" />
					</PhoneInput.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Read-only phone input">
		{#snippet blurb()}
			The field stays focusable but rejects edits; the country remains selectable, which is the
			root's documented readOnly contract.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-sm">
					<PhoneInput.Root readOnly defaultValue="+12125551234">
						<PhoneInput.CountrySelect />
						<PhoneInput.Field placeholder="Enter phone number" />
					</PhoneInput.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
