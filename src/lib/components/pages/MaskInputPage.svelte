<script lang="ts">
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import {
		MaskInput,
		type MaskInputValidationMode,
		type MaskPattern,
	} from "$lib/components/ui/mask-input/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { toast } from "svelte-sonner";

	/**
	 * The Mask input component page.
	 *
	 * THIS IS A `.form-control`, and it is already the classic theme's. `app.css` restates the input's
	 * padding, border, focus ring and disabled treatment under `[data-slot='input']`, and this
	 * component renders through that slot — so the field arrives themed and the mask is purely
	 * behaviour on top of it.
	 *
	 * The one visible addition is the placeholder skeleton some masks show, which uses
	 * `--muted-foreground` — the classic theme's `body-secondary-color`, the same grey as every other
	 * hint in the theme.
	 */

	// --- Default -------------------------------------------------------------
	let basic = $state({
		phone: "",
		date: "",
		dollar: "",
		euro: "",
		creditCard: "",
		percentage: "",
	});

	// --- Custom pattern ------------------------------------------------------

	/** A license plate: three letters then four digits. */
	const licensePattern: MaskPattern = {
		pattern: "###-####",
		transform: (value) => value.replace(/[^A-Z0-9]/gi, "").toUpperCase(),
		validate: (value) => {
			const cleaned = value.replace(/[^A-Z0-9]/gi, "").toUpperCase();
			return cleaned.length === 7 && /^[A-Z]{3}[0-9]{4}$/.test(cleaned);
		},
	};

	/** A product code, which prepends `PRD` once the caller is past a partial prefix. */
	const productCodePattern: MaskPattern = {
		pattern: "###-###-###",
		transform: (value) => {
			const cleaned = value.replace(/[^A-Z0-9]/gi, "").toUpperCase();

			if (cleaned.length === 0) return "";

			if (!cleaned.startsWith("PRD")) {
				if (cleaned.length <= 2 && "PRD".startsWith(cleaned)) return cleaned;
				return `PRD${cleaned}`;
			}

			return cleaned;
		},
		validate: (value) => {
			const cleaned = value.replace(/[^A-Z0-9]/gi, "").toUpperCase();
			return cleaned.length === 9 && cleaned.startsWith("PRD");
		},
	};

	let licenseValue = $state("");
	let productCodeValue = $state("");
	let licenseValid = $state(true);
	let productCodeValid = $state(true);

	// --- Validation modes ----------------------------------------------------
	const modes: { value: MaskInputValidationMode; label: string; description: string }[] = [
		{ value: "onChange", label: "onChange", description: "Validates on every keystroke" },
		{ value: "onBlur", label: "onBlur", description: "Validates when the field loses focus" },
		{
			value: "onTouched",
			label: "onTouched",
			description: "Validates after the first blur, then on change",
		},
		{ value: "onSubmit", label: "onSubmit", description: "Validates only on form submission" },
	];

	let modeValues = $state<Record<MaskInputValidationMode, string>>({
		onChange: "",
		onBlur: "",
		onTouched: "",
		onSubmit: "",
		all: "",
	});
	let modeStates = $state<Record<MaskInputValidationMode, { isValid: boolean; message: string }>>({
		onChange: { isValid: true, message: "" },
		onBlur: { isValid: true, message: "" },
		onTouched: { isValid: true, message: "" },
		onSubmit: { isValid: true, message: "" },
		all: { isValid: true, message: "" },
	});
	let submitAttempted = $state(false);

	function validationMessage(isValid: boolean, unmaskedValue: string): string {
		return `${isValid ? "✓ Valid" : "✗ Invalid"} (${unmaskedValue.length}/10)`;
	}

	function onModeValidate(mode: MaskInputValidationMode) {
		return (isValid: boolean, unmaskedValue: string) => {
			modeStates[mode] = { isValid, message: validationMessage(isValid, unmaskedValue) };
		};
	}

	function onModeValueChange(mode: MaskInputValidationMode) {
		return (_maskedValue: string, unmaskedValue: string) => {
			modeValues[mode] = unmaskedValue;
		};
	}

	function onModeSubmit(event: SubmitEvent) {
		event.preventDefault();
		submitAttempted = true;

		const unmaskedValue = modeValues.onSubmit;
		const isValid = unmaskedValue.length === 10;
		modeStates.onSubmit = { isValid, message: validationMessage(isValid, unmaskedValue) };
	}

	// --- Card information ----------------------------------------------------
	const cvcPattern: MaskPattern = {
		pattern: "###",
		transform: (value) => value.replace(/[^0-9]/g, ""),
		validate: (value) => value.length === 3,
	};

	let card = $state({ number: "", expiry: "", cvc: "" });
	let cardValid = $state({ number: true, expiry: true, cvc: true });

	const isCardFormValid = $derived(
		cardValid.number &&
			cardValid.expiry &&
			cardValid.cvc &&
			card.number.trim() !== "" &&
			card.expiry.trim() !== "" &&
			card.cvc.trim() !== "",
	);

	function onCardSubmit() {
		if (!isCardFormValid) {
			toast.error("Please fix validation errors before submitting");
			return;
		}

		toast.success(JSON.stringify(card, null, 2));
	}

	// --- With form -----------------------------------------------------------
	type PersonalField = "phone" | "ssn" | "birthDate" | "emergencyContact";

	const personalFields: {
		name: PersonalField;
		label: string;
		mask: "phone" | "ssn" | "date";
		placeholder: string;
		description: string;
		minLength: number;
		message: string;
	}[] = [
		{
			name: "phone",
			label: "Phone number",
			mask: "phone",
			placeholder: "Enter phone number",
			description: "Enter your primary phone number",
			minLength: 10,
			message: "Phone number must be at least 10 digits",
		},
		{
			name: "ssn",
			label: "Social security number",
			mask: "ssn",
			placeholder: "Enter SSN",
			description: "Enter your social security number",
			minLength: 9,
			message: "SSN must be 9 digits",
		},
		{
			name: "birthDate",
			label: "Birth date",
			mask: "date",
			placeholder: "Enter birth date",
			description: "Enter your date of birth",
			minLength: 8,
			message: "Birth date is required",
		},
		{
			name: "emergencyContact",
			label: "Emergency contact",
			mask: "phone",
			placeholder: "Enter emergency contact",
			description: "Enter emergency contact phone number",
			minLength: 10,
			message: "Emergency contact is required",
		},
	];

	let personal = $state<Record<PersonalField, string>>({
		phone: "",
		ssn: "",
		birthDate: "",
		emergencyContact: "",
	});
	let personalErrors = $state<Partial<Record<PersonalField, string>>>({});

	function onPersonalSubmit(event: SubmitEvent) {
		event.preventDefault();

		const errors: Partial<Record<PersonalField, string>> = {};
		for (const field of personalFields) {
			if (personal[field.name].length < field.minLength) errors[field.name] = field.message;
		}
		personalErrors = errors;

		if (Object.keys(errors).length > 0) return;

		toast.success("Form submitted successfully!");
	}

	function onPersonalReset() {
		personal = { phone: "", ssn: "", birthDate: "", emergencyContact: "" };
		personalErrors = {};
	}

	// --- API reference -------------------------------------------------------
	const rootProps = [
		{
			prop: "value",
			type: "string",
			default: "undefined",
			description:
				"The masked value. Bindable — bind:value follows the field, and the function binding bind:value={() => v, (next) => …} keeps you authoritative.",
		},
		{
			prop: "defaultValue",
			type: "string",
			default: "''",
			description: "Seeds an uncontrolled field once. The binding wins from then on.",
		},
		{
			prop: "onValueChange",
			type: "(maskedValue, unmaskedValue) => void",
			default: "undefined",
			description: "Called on every committed change with both the formatted and the raw value.",
		},
		{
			prop: "onValidate",
			type: "(isValid, unmaskedValue) => void",
			default: "undefined",
			description: "Called with the verdict of the pattern's validate, per validationMode.",
		},
		{
			prop: "validationMode",
			type: "'onChange' | 'onBlur' | 'onSubmit' | 'onTouched' | 'all'",
			default: "'onChange'",
			description: "When onValidate runs. onSubmit never fires it — you validate on submit.",
		},
		{
			prop: "mask",
			type: "MaskPatternKey | MaskPattern",
			default: "undefined",
			description: "A built-in key, or a custom { pattern, transform, validate } object.",
		},
		{
			prop: "maskPlaceholder",
			type: "string",
			default: "undefined",
			description: 'The placeholder shown while the field has focus, e.g. "(___) ___-____".',
		},
		{
			prop: "currency",
			type: "string",
			default: "'USD'",
			description: "ISO 4217 code used by the currency mask.",
		},
		{
			prop: "locale",
			type: "string",
			default: "'en-US'",
			description: "BCP 47 tag used by the currency mask.",
		},
		{
			prop: "invalid",
			type: "boolean",
			default: "false",
			description: "Always emitted as aria-invalid; adds data-invalid when true.",
		},
		{
			prop: "withoutMask",
			type: "boolean",
			default: "false",
			description: "Passes the typed text through unformatted, keeping the rest of the API.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables the field and suppresses typing, deletion and paste.",
		},
		{
			prop: "readonly",
			type: "boolean",
			default: "false",
			description: "HTML spelling of upstream readOnly. Suppresses every edit path.",
		},
		{
			prop: "required",
			type: "boolean",
			default: "false",
			description: "Marks the field required and adds data-required.",
		},
		{
			prop: "placeholder",
			type: "string",
			default: "undefined",
			description: "The unfocused placeholder. Absent when it resolves to undefined.",
		},
		{
			prop: "inputMode",
			type: "HTMLInputAttributes['inputmode']",
			default: "derived",
			description:
				"Overrides the hint derived from the mask: decimal for currency/percentage/ipv4, numeric for the digit-only keys.",
		},
		{
			prop: "maxlength",
			type: "number",
			default: "derived",
			description: "Falls back to the pattern's rendered length when it has fixed slots.",
		},
		{
			prop: "min / max",
			type: "string | number",
			default: "undefined",
			description: "Parsed and forwarded into the pattern's validate as { min, max }.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description:
				"Renders the field onto your own element. Spread props onto an input and masking, caret restoration and paste keep working.",
		},
		{
			prop: "ref",
			type: "HTMLInputElement | null",
			default: "null",
			description: "Bindable reference to the rendered input. Stays null in child mode.",
		},
		{
			prop: "...restProps",
			type: "Omit<HTMLInputAttributes, 'value' | 'defaultValue'>",
			default: "—",
			description:
				"Spread onto the input. A caller oninput, onkeydown, onpaste, onfocus, onblur or oncomposition* runs first and may preventDefault() the built-in behaviour.",
		},
	];

	const patterns = [
		{ key: "phone", format: "(###) ###-####", example: "(555) 123-4567" },
		{ key: "ssn", format: "###-##-####", example: "123-45-6789" },
		{ key: "date", format: "##/##/####", example: "12/25/2023" },
		{ key: "time", format: "##:##", example: "14:30" },
		{ key: "creditCard", format: "#### #### #### ####", example: "1234 5678 9012 3456" },
		{ key: "creditCardExpiry", format: "##/##", example: "12/25" },
		{ key: "zipCode", format: "#####", example: "12345" },
		{ key: "zipCodeExtended", format: "#####-####", example: "12345-6789" },
		{ key: "currency", format: "Intl.NumberFormat", example: "$1,234.56" },
		{ key: "percentage", format: "##.##%", example: "12.34%" },
		{ key: "licensePlate", format: "###-###", example: "ABC-123" },
		{ key: "ipv4", format: "###.###.###.###", example: "192.168.1.1" },
		{ key: "macAddress", format: "##:##:##:##:##:##", example: "00:1B:44:11:3A:B7" },
		{ key: "isbn", format: "###-#-###-#####-#", example: "978-0-123-45678-9" },
		{ key: "ein", format: "##-#######", example: "12-3456789" },
	];

	const keyboard = [
		{ keys: "Tab", description: "Moves focus to or away from the field. Never trapped." },
		{ keys: "Shift + Tab", description: "Moves focus to the previous focusable element." },
		{
			keys: "Backspace",
			description:
				"Removes the slot before the caret, reformats, and places the caret after the removed slot. Left to the browser for currency, percentage, ipv4 and any non-collapsed selection.",
		},
		{
			keys: "Delete",
			description: "Removes the slot at the caret and reformats. Same exclusions as Backspace.",
		},
		{
			keys: "Ctrl + V / Cmd + V",
			description:
				"Replaces the selection, reformats the whole value and parks the caret after the last pasted slot — before a trailing currency symbol or percent sign.",
		},
		{ keys: "Ctrl + A / Cmd + A", description: "Native select-all. Not intercepted." },
	];
</script>

<DocPage title="Mask Input">
	{#snippet subtitle()}
		An input that formats what you type against a pattern like a phone number, date, credit card or
		currency amount — and keeps the caret where you left it.
	{/snippet}

	<DocSection title="Default">
		{#snippet blurb()}
			Six built-in patterns, each reporting both the masked and the unmasked value.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="grid w-full gap-6 md:grid-cols-2 lg:grid-cols-3">
					<div class="flex flex-col gap-2">
						<Label for="mask-input-phone">Phone number</Label>
						<MaskInput
							id="mask-input-phone"
							mask="phone"
							placeholder="Enter your phone number"
							bind:value={basic.phone}
						/>
						<p class="text-sm text-muted-foreground">Enter your phone number with area code</p>
					</div>
					<div class="flex flex-col gap-2">
						<Label for="mask-input-date">Birth date</Label>
						<MaskInput
							id="mask-input-date"
							mask="date"
							placeholder="Enter your birth date"
							bind:value={basic.date}
						/>
						<p class="text-sm text-muted-foreground">Enter your birth date</p>
					</div>
					<div class="flex flex-col gap-2">
						<Label for="mask-input-dollar">Currency</Label>
						<MaskInput
							id="mask-input-dollar"
							mask="currency"
							placeholder="$0.00"
							bind:value={basic.dollar}
						/>
						<p class="text-sm text-muted-foreground">Enter your currency</p>
					</div>
					<div class="flex flex-col gap-2">
						<Label for="mask-input-euro">Currency (German)</Label>
						<MaskInput
							id="mask-input-euro"
							mask="currency"
							currency="EUR"
							locale="de-DE"
							placeholder="0,00 €"
							bind:value={basic.euro}
						/>
						<p class="text-sm text-muted-foreground">Enter your currency</p>
					</div>
					<div class="flex flex-col gap-2">
						<Label for="mask-input-credit-card">Credit card</Label>
						<MaskInput
							id="mask-input-credit-card"
							mask="creditCard"
							placeholder="Enter your credit card number"
							bind:value={basic.creditCard}
						/>
						<p class="text-sm text-muted-foreground">Enter your credit card number</p>
					</div>
					<div class="flex flex-col gap-2">
						<Label for="mask-input-percentage">Percentage</Label>
						<MaskInput
							id="mask-input-percentage"
							mask="percentage"
							placeholder="0.00%"
							min={0}
							max={100}
							bind:value={basic.percentage}
						/>
						<p class="text-sm text-muted-foreground">Enter a percentage</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Custom pattern">
		{#snippet blurb()}
			A mask object brings its own pattern, transform and validate — the product code even prepends
			its PRD prefix.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full max-w-sm flex-col gap-6">
					<div class="flex flex-col gap-2">
						<Label for="mask-input-license">License plate</Label>
						<MaskInput
							id="mask-input-license"
							mask={licensePattern}
							bind:value={licenseValue}
							placeholder="Enter license plate"
							maskPlaceholder="ABC-1234"
							invalid={!licenseValid}
							onValidate={(isValid) => (licenseValid = isValid)}
						/>
						<p class="text-sm text-muted-foreground">Enter license plate (3 letters, 4 numbers)</p>
					</div>
					<div class="flex flex-col gap-2">
						<Label for="mask-input-product">Product code</Label>
						<MaskInput
							id="mask-input-product"
							mask={productCodePattern}
							bind:value={productCodeValue}
							placeholder="Enter product code"
							maskPlaceholder="PRD-ABC-123"
							invalid={!productCodeValid}
							onValidate={(isValid) => (productCodeValid = isValid)}
						/>
						<p class="text-sm text-muted-foreground">Enter product code (PRD-XXX-XXX format)</p>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Validation modes">
		{#snippet blurb()}
			The same phone mask under four modes — onSubmit never calls onValidate, so its card validates
			in the submit handler instead.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="grid w-full gap-4 sm:grid-cols-2">
					{#each modes as mode (mode.value)}
						{@const state = modeStates[mode.value]}
						<div
							class="flex flex-col gap-3 rounded-md border bg-card p-4 text-card-foreground shadow-sm"
						>
							<div class="flex flex-col gap-1">
								<h4 class="text-xs font-medium">{mode.label}</h4>
								<p class="text-xs leading-tight text-muted-foreground">{mode.description}</p>
							</div>
							{#snippet inputContent()}
								<div class="flex flex-col gap-1">
									<Label for="mask-input-mode-{mode.value}" class="sr-only">Phone number</Label>
									<MaskInput
										id="mask-input-mode-{mode.value}"
										mask="phone"
										validationMode={mode.value}
										placeholder="Enter phone number"
										onValueChange={onModeValueChange(mode.value)}
										onValidate={onModeValidate(mode.value)}
										invalid={!state.isValid}
										class="text-sm"
									/>
								</div>
							{/snippet}
							{#if mode.value === "onSubmit"}
								<form onsubmit={onModeSubmit} class="flex flex-col gap-2">
									{@render inputContent()}
									<Button type="submit" size="sm" class="text-xs">Submit</Button>
								</form>
							{:else}
								{@render inputContent()}
							{/if}
							<div class="flex items-center gap-1">
								<Badge
									variant={state.isValid ? "default" : "destructive"}
									class="h-5 px-1.5 text-xs"
								>
									{state.isValid ? "Valid" : "Invalid"}
								</Badge>
								<span class="text-xs text-muted-foreground">
									{state.message ||
										(mode.value === "onSubmit" && !submitAttempted
											? "Click 'Submit' to check…"
											: "Start typing to see validation…")}
								</span>
							</div>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Card information">
		{#snippet blurb()}
			Three masks — creditCard with its Luhn check, creditCardExpiry, and a custom three-digit CVC —
			all validating on blur.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Card.Root class="w-full max-w-md">
					<Card.Header>
						<Card.Title>Card information</Card.Title>
						<Card.Description>Enter your card information</Card.Description>
					</Card.Header>
					<Card.Content class="flex flex-col gap-4">
						<div class="flex flex-col gap-2">
							<Label for="mask-input-card-number">Card number</Label>
							<MaskInput
								id="mask-input-card-number"
								mask="creditCard"
								placeholder="1234 1234 1234 1234"
								validationMode="onBlur"
								bind:value={card.number}
								onValidate={(isValid) => (cardValid.number = isValid)}
								invalid={!cardValid.number}
							/>
							{#if !cardValid.number && card.number}
								<p class="text-sm text-destructive">Please enter a valid credit card number.</p>
							{/if}
						</div>
						<div class="grid grid-cols-2 gap-4">
							<div class="flex flex-col gap-2">
								<Label for="mask-input-card-expiry">Expiry date</Label>
								<MaskInput
									id="mask-input-card-expiry"
									mask="creditCardExpiry"
									placeholder="MM/YY"
									validationMode="onBlur"
									bind:value={card.expiry}
									onValidate={(isValid) => (cardValid.expiry = isValid)}
									invalid={!cardValid.expiry}
								/>
								{#if !cardValid.expiry && card.expiry}
									<p class="text-sm text-destructive">Your card's expiration date is invalid.</p>
								{/if}
							</div>
							<div class="flex flex-col gap-2">
								<Label for="mask-input-card-cvc">CVC</Label>
								<MaskInput
									id="mask-input-card-cvc"
									mask={cvcPattern}
									placeholder="123"
									validationMode="onBlur"
									bind:value={card.cvc}
									onValidate={(isValid) => (cardValid.cvc = isValid)}
									invalid={!cardValid.cvc}
								/>
								{#if !cardValid.cvc && card.cvc}
									<p class="text-sm text-destructive">CVC must be 3 digits.</p>
								{/if}
							</div>
						</div>
					</Card.Content>
					<Card.Footer>
						<Button onclick={onCardSubmit} class="w-full" disabled={!isCardFormValid}>Submit</Button
						>
					</Card.Footer>
				</Card.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With form">
		{#snippet blurb()}
			A plain &lt;form&gt; with Field.FieldGroup and rune state stands in for react-hook-form and
			zod, which have no Svelte analogue — each field stores its unmasked value and is checked on
			submit.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<form onsubmit={onPersonalSubmit} class="w-full max-w-2xl">
					<Field.FieldGroup class="grid gap-6 md:grid-cols-2">
						{#each personalFields as personalField (personalField.name)}
							<Field.Field data-invalid={personalErrors[personalField.name] ? "" : undefined}>
								<Field.FieldLabel for="mask-input-{personalField.name}">
									{personalField.label}
								</Field.FieldLabel>
								<MaskInput
									id="mask-input-{personalField.name}"
									mask={personalField.mask}
									placeholder={personalField.placeholder}
									value={personal[personalField.name]}
									onValueChange={(_maskedValue, unmaskedValue) => {
										personal[personalField.name] = unmaskedValue;
									}}
									invalid={Boolean(personalErrors[personalField.name])}
								/>
								{#if personalErrors[personalField.name]}
									<Field.FieldError>{personalErrors[personalField.name]}</Field.FieldError>
								{:else}
									<Field.FieldDescription>{personalField.description}</Field.FieldDescription>
								{/if}
							</Field.Field>
						{/each}
						<div class="flex w-full justify-end gap-2 md:col-span-2">
							<Button type="button" variant="outline" onclick={onPersonalReset}>Reset</Button>
							<Button type="submit">Submit</Button>
						</div>
					</Field.FieldGroup>
				</form>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">MaskInput</h3>
			<p class="text-sm text-muted-foreground">
				A single <code>&lt;input&gt;</code>. There are no sub-parts and no context, so the component
				can be dropped anywhere an <code>Input</code> would go. The engine —
				<code>MASK_PATTERNS</code>, <code>applyMask</code>, <code>getUnmaskedValue</code>,
				<code>toUnmaskedIndex</code> and <code>fromUnmaskedIndex</code> — is exported from the same module
				for reuse without rendering a field.
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
			<h3 class="text-base font-medium">Built-in patterns</h3>
			<p class="text-sm text-muted-foreground">
				Every key of <code>MASK_PATTERNS</code>. A <code>#</code> is a value slot; every other character
				is a literal the field inserts for you.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Pattern</Table.Head>
								<Table.Head>Format</Table.Head>
								<Table.Head>Example</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each patterns as row (row.key)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.key}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.format}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.example}</Table.Cell>
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
				Printable keys are handled through the <code>input</code> event, not
				<code>keydown</code>, so the caret is placed once per change. Deletion and paste are
				intercepted only when the field can do better than the browser.
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
