<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import * as Stepper from "$lib/components/ui/stepper/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import { toast } from "svelte-sonner";

	// Imports below serve the appendix sections at the end of the page.
	import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
	import BookUserIcon from "@lucide/svelte/icons/book-user";
	import CheckIcon from "@lucide/svelte/icons/check";
	import CreditCardIcon from "@lucide/svelte/icons/credit-card";
	import LoaderCircleIcon from "@lucide/svelte/icons/loader-circle";
	import LockIcon from "@lucide/svelte/icons/lock";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { cn } from "$lib/utils.js";

	/**
	 * The Stepper component page.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. The classic framework ships no wizard, and the classic theme's multi-step flows are
	 * built out of cards and a progress bar rather than out of a stepper.
	 *
	 * The indicators do borrow the theme's vocabulary, though: a completed step is `--primary`
	 * filled, the current one is `--primary` outlined, and the rest are `--muted` — the same three
	 * weights the sidebar uses for visited, current and available.
	 */

	const setupSteps = [
		{
			value: "account",
			title: "Account Setup",
			description: "Create your account and verify email",
		},
		{
			value: "profile",
			title: "Profile Information",
			description: "Add your personal details and preferences",
		},
		{
			value: "payment",
			title: "Payment Details",
			description: "Set up billing and payment methods",
		},
		{
			value: "complete",
			title: "Complete Setup",
			description: "Review and finish your account setup",
		},
	];

	const orderSteps = [
		{ value: "placed", title: "Order Placed", description: "Your order has been placed" },
		{ value: "processing", title: "Processing", description: "We are preparing your items" },
		{ value: "shipped", title: "Shipped", description: "Your order is on its way to you" },
		{ value: "delivered", title: "Delivered", description: "Order delivered to your address" },
	];

	// ── With Validation ──────────────────────────────────────────────────────────
	// A plain local validator stands in for react-hook-form + zod, which have no Svelte analogue
	// here and are not worth a dependency for a demo.

	const validationSteps = [
		{
			value: "account",
			title: "Account Setup",
			description: "Create your account",
			fields: ["username", "email"] as const,
		},
		{
			value: "profile",
			title: "Profile Info",
			description: "Complete your profile",
			fields: ["firstName", "lastName", "bio"] as const,
		},
		{ value: "review", title: "Review", description: "Review your information", fields: [] },
	];

	type ValidationField = "username" | "email" | "firstName" | "lastName" | "bio";

	const validationRules: Record<ValidationField, (value: string) => string | undefined> = {
		username: (value) =>
			value.trim().length < 3
				? "Username must be at least 3 characters"
				: /^[a-zA-Z0-9_]+$/.test(value)
					? undefined
					: "Username can only contain letters, numbers and underscores",
		email: (value) =>
			/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value) ? undefined : "Enter a valid email",
		firstName: (value) => (value.trim() ? undefined : "First name is required"),
		lastName: (value) => (value.trim() ? undefined : "Last name is required"),
		bio: (value) => (value.trim().length < 10 ? "Bio must be at least 10 characters" : undefined),
	};

	let validationStep = $state("account");
	let validationValues = $state<Record<ValidationField, string>>({
		username: "",
		email: "",
		firstName: "",
		lastName: "",
		bio: "",
	});
	let validationErrors = $state<Partial<Record<ValidationField, string>>>({});

	const validationIndex = $derived(validationSteps.findIndex((s) => s.value === validationStep));

	function validateFields(fields: readonly ValidationField[]): boolean {
		const errors: Partial<Record<ValidationField, string>> = {};

		for (const field of fields) {
			const message = validationRules[field](validationValues[field]);
			if (message) errors[field] = message;
		}

		validationErrors = errors;
		return Object.keys(errors).length === 0;
	}

	function onValidate(_value: string, direction: "next" | "prev"): boolean {
		if (direction === "prev") return true;

		const current = validationSteps.find((step) => step.value === validationStep);
		if (!current) return true;

		const isValid = validateFields(current.fields);
		if (!isValid) {
			toast.info("Please complete all required fields to continue", {
				description: "Fix the validation errors and try again.",
			});
		}

		return isValid;
	}

	// ── With Form ────────────────────────────────────────────────────────────────

	const formSteps = [
		{
			value: "personal",
			title: "Personal Details",
			description: "Enter your basic information",
			fields: ["formFirstName", "formLastName", "formEmail"] as const,
		},
		{
			value: "about",
			title: "About You",
			description: "Tell us more about yourself",
			fields: ["formBio"] as const,
		},
		{
			value: "professional",
			title: "Professional Info",
			description: "Add your professional details",
			fields: ["formCompany", "formWebsite"] as const,
		},
	];

	type FormField =
		"formFirstName" | "formLastName" | "formEmail" | "formBio" | "formCompany" | "formWebsite";

	const formRules: Record<FormField, (value: string) => string | undefined> = {
		formFirstName: (value) =>
			value.trim().length < 2 ? "First name must be at least 2 characters" : undefined,
		formLastName: (value) =>
			value.trim().length < 2 ? "Last name must be at least 2 characters" : undefined,
		formEmail: (value) =>
			/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value) ? undefined : "Enter a valid email address",
		formBio: (value) =>
			value.trim().length < 10 ? "Bio must be at least 10 characters" : undefined,
		formCompany: (value) =>
			value.trim().length < 2 ? "Company name must be at least 2 characters" : undefined,
		formWebsite: (value) =>
			value.trim() === "" || /^https?:\/\/\S+$/.test(value) ? undefined : "Enter a valid URL",
	};

	let formStep = $state("personal");
	let formValues = $state<Record<FormField, string>>({
		formFirstName: "",
		formLastName: "",
		formEmail: "",
		formBio: "",
		formCompany: "",
		formWebsite: "",
	});
	let formErrors = $state<Partial<Record<FormField, string>>>({});

	const formIndex = $derived(formSteps.findIndex((s) => s.value === formStep));

	function validateFormFields(fields: readonly FormField[]): boolean {
		const errors: Partial<Record<FormField, string>> = {};

		for (const field of fields) {
			const message = formRules[field](formValues[field]);
			if (message) errors[field] = message;
		}

		formErrors = errors;
		return Object.keys(errors).length === 0;
	}

	function onFormValidate(_value: string, direction: "next" | "prev"): boolean {
		if (direction === "prev") return true;

		const current = formSteps.find((step) => step.value === formStep);
		if (!current) return true;

		const isValid = validateFormFields(current.fields);
		if (!isValid) toast.info("Please complete all required fields to continue");

		return isValid;
	}

	function onFormSubmit(event: SubmitEvent) {
		event.preventDefault();

		const current = formSteps[formIndex];
		if (current && !validateFormFields(current.fields)) return;

		toast.success("Profile submitted", {
			description: `${formValues.formFirstName} ${formValues.formLastName}`,
		});
	}

	const rootProps = [
		{
			prop: "value",
			type: "string",
			default: "—",
			description: "The active step value. Bindable; controlled when bound or passed.",
		},
		{
			prop: "defaultValue",
			type: "string",
			default: "''",
			description: "Seeds `value` once when the component is uncontrolled.",
		},
		{
			prop: "onValueChange",
			type: "(value: string) => void",
			default: "—",
			description: "Called when the active step actually changes.",
		},
		{
			prop: "onValidate",
			type: "(value, direction) => boolean | Promise<boolean>",
			default: "—",
			description: "Gates forward moves. `false` or a rejection blocks the change.",
		},
		{
			prop: "onValueAdd / onValueRemove",
			type: "(value: string) => void",
			default: "—",
			description: "Called when a `Stepper.Item` registers or unregisters.",
		},
		{
			prop: "onValueComplete",
			type: "(value: string, completed: boolean) => void",
			default: "—",
			description: "Called when a step's `completed` flag flips.",
		},
		{
			prop: "activationMode",
			type: "'automatic' | 'manual'",
			default: "'automatic'",
			description: "Whether keyboard focus activates a step, or `Enter`/`Space` does.",
		},
		{
			prop: "orientation",
			type: "'horizontal' | 'vertical'",
			default: "'horizontal'",
			description: "Layout axis, published as `data-orientation` on every part.",
		},
		{
			prop: "dir",
			type: "'ltr' | 'rtl'",
			default: "resolved",
			description: "Reading direction; falls back to `<DirectionProvider>`, then the DOM.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables every trigger and blocks interaction.",
		},
		{
			prop: "loop",
			type: "boolean",
			default: "false",
			description: "Arrow-key navigation wraps around the ends.",
		},
		{
			prop: "nonInteractive",
			type: "boolean",
			default: "false",
			description: "Blocks step navigation; the active step still follows `value`.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render the root onto your own element.",
		},
	];

	const listProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: 'Bindable reference to the rendered `<div role="tablist">`.',
		},
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged last through `cn()`.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render the list onto your own element.",
		},
	];

	const itemProps = [
		{
			prop: "value",
			type: "string",
			default: "— (required)",
			description: "The unique value that links the item with its content.",
		},
		{
			prop: "completed",
			type: "boolean",
			default: "false",
			description: "Marks the step completed regardless of its position.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "Disables this step; roving focus skips over it.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render the item onto your own element.",
		},
	];

	const triggerProps = [
		{
			prop: "disabled",
			type: "boolean",
			default: "—",
			description: "Effective disabled is `disabled || step.disabled || root.disabled`.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render the trigger onto your own element; it then cannot self-register.",
		},
	];

	const indicatorProps = [
		{
			prop: "children",
			type: "Snippet<[StepperDataState]>",
			default: "—",
			description: "Receives the step data state. Defaults to a check icon or the position.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render the indicator onto your own element.",
		},
	];

	const separatorProps = [
		{
			prop: "forceMount",
			type: "boolean",
			default: "false",
			description: "Keeps the separator mounted after the last step.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render the separator onto your own element.",
		},
	];

	const titleProps = [
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged last through `cn()`. The id is `${rootId}-title-${itemValue}`.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render the title onto your own element.",
		},
	];

	const descriptionProps = [
		{
			prop: "class",
			type: "string",
			default: "—",
			description: "Merged last through `cn()`. The id is `${rootId}-description-${itemValue}`.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render the description onto your own element.",
		},
	];

	const contentProps = [
		{
			prop: "value",
			type: "string",
			default: "— (required)",
			description: "The unique value that links the content with its item.",
		},
		{
			prop: "forceMount",
			type: "boolean",
			default: "false",
			description: "Keeps the panel mounted while the step is inactive.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render the content onto your own element.",
		},
	];

	const navigationProps = [
		{
			prop: "disabled",
			type: "boolean",
			default: "—",
			description: "Merged with the automatic first-step / last-step guard.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render the control onto your own element, e.g. a styled `Button`.",
		},
	];

	const propTables = [
		{ part: "Stepper.Root", rows: rootProps },
		{ part: "Stepper.List", rows: listProps },
		{ part: "Stepper.Item", rows: itemProps },
		{ part: "Stepper.Trigger", rows: triggerProps },
		{ part: "Stepper.Indicator", rows: indicatorProps },
		{ part: "Stepper.Separator", rows: separatorProps },
		{ part: "Stepper.Title", rows: titleProps },
		{ part: "Stepper.Description", rows: descriptionProps },
		{ part: "Stepper.Content", rows: contentProps },
		{ part: "Stepper.Prev / Stepper.Next", rows: navigationProps },
	];

	const dataAttributes = [
		{ part: "Stepper.Root", attribute: "[data-orientation]", value: '"horizontal" | "vertical"' },
		{ part: "Stepper.Root", attribute: "[data-disabled]", value: "present when disabled" },
		{ part: "Stepper.List", attribute: "[data-orientation]", value: '"horizontal" | "vertical"' },
		{
			part: "Stepper.Item",
			attribute: "[data-state]",
			value: '"inactive" | "active" | "completed"',
		},
		{
			part: "Stepper.Trigger",
			attribute: "[data-state]",
			value: '"inactive" | "active" | "completed"',
		},
		{
			part: "Stepper.Indicator",
			attribute: "[data-state]",
			value: '"inactive" | "active" | "completed"',
		},
		{
			part: "Stepper.Separator",
			attribute: "[data-state]",
			value: '"inactive" | "completed" — never "active"',
		},
	];

	const keyboardShortcuts = [
		{ keys: "Tab", description: "Moves focus into the list, onto the current step trigger." },
		{ keys: "Shift + Tab", description: "Moves focus out of the stepper." },
		{
			keys: "Enter, Space",
			description: "Activates the focused step in `manual` activation mode.",
		},
		{ keys: "ArrowLeft, ArrowUp", description: "Moves focus to the previous step trigger." },
		{ keys: "ArrowRight, ArrowDown", description: "Moves focus to the next step trigger." },
		{ keys: "Home, PageUp", description: "Moves focus to the first enabled step trigger." },
		{ keys: "End, PageDown", description: "Moves focus to the last enabled step trigger." },
	];

	// ── pattern appendix ─────────────────────────────────────────────────────────────────────────
	// The sections after the API reference are the stepper demo set. The
	// standing conventions, once for all of them: `Stepper.List` is the nav rail;
	// panel classes sit directly on
	// the `Stepper.Content` panels; and completed /
	// loading nodes render through the Indicator's `children` snippet, which already receives the
	// data state. Everything painted green is the `--success`
	// token family. Demos 1, 13 and 15 are not repeated: "Default" and "Vertical" above
	// already show those compositions.

	// Stepper with completed state — indicators keep their number when completed.
	const completedSteps = ["1", "2", "3", "4"];

	// Stepper with loading state. The house Item has no `loading` flag, so the
	// active step draws the spinner through the Indicator's children snippet — in the demo the
	// loading step and the active step are the same one anyway.
	const loadingSteps = ["1", "2", "3"];

	// Controlled stepper.
	const controlledSteps = ["1", "2", "3", "4"];
	let controlledStep = $state("2");

	// Stepper with title and indicator.
	const namedSteps = ["Step 1", "Step 2", "Step 3"];

	// Steps shared by the two progress-bar sections (demo 6, demo 11).
	const wizardSteps = ["User Details", "Payment Info", "Auth OTP", "Preview Form"];

	// Stepper with icons and badges.
	const iconSteps = [
		{ title: "User Details", icon: BookUserIcon },
		{ title: "Payment Info", icon: CreditCardIcon },
		{ title: "Auth OTP", icon: LockIcon },
	];
	let iconStep = $state("2");

	// Stepper with descriptions.
	const describedSteps = [
		{ title: "Account", description: "Create your account" },
		{ title: "Profile", description: "Set up your profile" },
		{ title: "Complete", description: "Review and finish" },
	];

	// Stepper with inline titles.
	const inlineSteps = ["Account", "Profile", "Review"];

	// Stepper with content for each step.
	const pairedSteps = [
		{ title: "Step 1", description: "Description" },
		{ title: "Step 2", description: "Description" },
		{ title: "Step 3", description: "Description" },
	];

	// Stepper with segmented progress bar.
	const segmentedSteps = ["1", "2", "3", "4"];
	let segmentedStep = $state("1");

	// Stepper with vertical orientation — loading adapted as in the loading
	// section.
	const verticalSteps = ["1", "2", "3"];
</script>

<DocPage title="Stepper">
	{#snippet subtitle()}
		A component that guides users through a multi-step process with clear visual progress
		indicators.
	{/snippet}

	<DocSection title="Default">
		{#snippet blurb()}
			— horizontal, indicator-only triggers, one content panel per step.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Stepper.Root defaultValue="account" class="w-full max-w-md">
					<Stepper.List>
						{#each setupSteps as step (step.value)}
							<Stepper.Item value={step.value}>
								<Stepper.Trigger>
									<Stepper.Indicator />
								</Stepper.Trigger>
								<Stepper.Separator />
							</Stepper.Item>
						{/each}
					</Stepper.List>
					{#each setupSteps as step (step.value)}
						<Stepper.Content
							value={step.value}
							class="flex flex-col items-center gap-4 rounded-md border bg-card p-4 text-card-foreground"
						>
							<div class="flex flex-col items-center gap-px text-center">
								<h3 class="text-lg font-semibold">{step.title}</h3>
								<p class="text-muted-foreground">{step.description}</p>
							</div>
							<p class="text-sm">Content for {step.title} goes here.</p>
						</Stepper.Content>
					{/each}
				</Stepper.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Vertical">
		{#snippet blurb()}
			— a vertical axis with titles, descriptions and an absolutely positioned separator.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-stretch">
				<Stepper.Root defaultValue="shipped" orientation="vertical">
					<Stepper.List>
						{#each orderSteps as step (step.value)}
							<Stepper.Item value={step.value}>
								<Stepper.Trigger class="not-last:pb-6">
									<Stepper.Indicator />
									<div class="flex flex-col gap-1">
										<Stepper.Title>{step.title}</Stepper.Title>
										<Stepper.Description>{step.description}</Stepper.Description>
									</div>
								</Stepper.Trigger>
								<Stepper.Separator
									class="absolute inset-y-0 top-5 left-3.5 -z-10 -order-1 h-full -translate-x-1/2"
								/>
							</Stepper.Item>
						{/each}
					</Stepper.List>
					{#each orderSteps as step (step.value)}
						<Stepper.Content
							value={step.value}
							class="flex flex-col gap-4 rounded-lg border bg-card p-6 text-card-foreground"
						>
							<div class="flex flex-col gap-px">
								<h4 class="font-semibold">{step.title}</h4>
								<p class="text-sm text-muted-foreground">{step.description}</p>
							</div>
							<p class="text-sm">
								This is the content for {step.title}. You can add forms, information, or any other
								content here.
							</p>
						</Stepper.Content>
					{/each}
				</Stepper.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With Validation">
		{#snippet blurb()}
			— the page owns `value` and `onValidate` gates every forward move. A local validator stands in
			for react-hook-form and zod.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-stretch">
				<Stepper.Root bind:value={validationStep} {onValidate} class="w-full">
					<Stepper.List>
						{#each validationSteps as step (step.value)}
							<Stepper.Item value={step.value}>
								<Stepper.Trigger>
									<Stepper.Indicator />
									<div class="flex flex-col gap-1">
										<Stepper.Title>{step.title}</Stepper.Title>
										<Stepper.Description>{step.description}</Stepper.Description>
									</div>
								</Stepper.Trigger>
								<Stepper.Separator class="mx-4" />
							</Stepper.Item>
						{/each}
					</Stepper.List>

					<Stepper.Content
						value="account"
						class="flex flex-col gap-4 rounded-md border bg-card p-4 text-card-foreground"
					>
						<Field.Field data-invalid={validationErrors.username ? true : undefined}>
							<Field.FieldLabel for="stepper-username">Username</Field.FieldLabel>
							<Input
								id="stepper-username"
								aria-invalid={validationErrors.username ? true : undefined}
								placeholder="Enter username"
								bind:value={validationValues.username}
							/>
							{#if validationErrors.username}
								<Field.FieldError>{validationErrors.username}</Field.FieldError>
							{/if}
						</Field.Field>
						<Field.Field data-invalid={validationErrors.email ? true : undefined}>
							<Field.FieldLabel for="stepper-email">Email</Field.FieldLabel>
							<Input
								id="stepper-email"
								aria-invalid={validationErrors.email ? true : undefined}
								type="email"
								placeholder="Enter email"
								bind:value={validationValues.email}
							/>
							{#if validationErrors.email}
								<Field.FieldError>{validationErrors.email}</Field.FieldError>
							{/if}
						</Field.Field>
					</Stepper.Content>

					<Stepper.Content
						value="profile"
						class="flex flex-col gap-4 rounded-md border bg-card p-4 text-card-foreground"
					>
						<div class="grid gap-4 sm:grid-cols-2">
							<Field.Field data-invalid={validationErrors.firstName ? true : undefined}>
								<Field.FieldLabel for="stepper-first-name">First Name</Field.FieldLabel>
								<Input
									id="stepper-first-name"
									aria-invalid={validationErrors.firstName ? true : undefined}
									placeholder="Enter first name"
									bind:value={validationValues.firstName}
								/>
								{#if validationErrors.firstName}
									<Field.FieldError>{validationErrors.firstName}</Field.FieldError>
								{/if}
							</Field.Field>
							<Field.Field data-invalid={validationErrors.lastName ? true : undefined}>
								<Field.FieldLabel for="stepper-last-name">Last Name</Field.FieldLabel>
								<Input
									id="stepper-last-name"
									aria-invalid={validationErrors.lastName ? true : undefined}
									placeholder="Enter last name"
									bind:value={validationValues.lastName}
								/>
								{#if validationErrors.lastName}
									<Field.FieldError>{validationErrors.lastName}</Field.FieldError>
								{/if}
							</Field.Field>
						</div>
						<Field.Field data-invalid={validationErrors.bio ? true : undefined}>
							<Field.FieldLabel for="stepper-bio">Bio</Field.FieldLabel>
							<Textarea
								id="stepper-bio"
								aria-invalid={validationErrors.bio ? true : undefined}
								placeholder="Tell us about yourself…"
								class="min-h-20"
								bind:value={validationValues.bio}
							/>
							{#if validationErrors.bio}
								<Field.FieldError>{validationErrors.bio}</Field.FieldError>
							{/if}
						</Field.Field>
					</Stepper.Content>

					<Stepper.Content
						value="review"
						class="grid gap-4 rounded-md border bg-card p-4 text-card-foreground sm:grid-cols-2 lg:grid-cols-3"
					>
						{#each Object.entries(validationValues) as [name, entry] (name)}
							<div class="flex flex-col gap-1 rounded-md border p-2">
								<span class="text-sm font-medium">{name}</span>
								<p class="text-sm">{entry || "Not provided"}</p>
							</div>
						{/each}
					</Stepper.Content>

					<div class="flex items-center justify-between">
						<Stepper.Prev>
							{#snippet child({ props })}
								<Button {...props} variant="outline">Previous</Button>
							{/snippet}
						</Stepper.Prev>
						<div class="text-sm text-muted-foreground">
							Step {validationIndex + 1} of {validationSteps.length}
						</div>
						{#if validationIndex === validationSteps.length - 1}
							<Button onclick={() => toast.success("Setup complete")}>Complete Setup</Button>
						{:else}
							<Stepper.Next>
								{#snippet child({ props })}
									<Button {...props}>Next</Button>
								{/snippet}
							</Stepper.Next>
						{/if}
					</div>
				</Stepper.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With Form">
		{#snippet blurb()}
			— a multi-step form built from Field, Input and Textarea, where each step is validated before
			the stepper advances.
		{/snippet}
		<Card.Root>
			<Card.Content class="items-stretch">
				<form class="w-full" onsubmit={onFormSubmit}>
					<Stepper.Root bind:value={formStep} onValidate={onFormValidate}>
						<Stepper.List>
							{#each formSteps as step (step.value)}
								<Stepper.Item value={step.value}>
									<Stepper.Trigger>
										<Stepper.Indicator />
										<div class="flex flex-col gap-px">
											<Stepper.Title>{step.title}</Stepper.Title>
											<Stepper.Description>{step.description}</Stepper.Description>
										</div>
									</Stepper.Trigger>
									<Stepper.Separator class="mx-4" />
								</Stepper.Item>
							{/each}
						</Stepper.List>

						<Stepper.Content value="personal" class="flex flex-col gap-4">
							<div class="grid gap-4 sm:grid-cols-2">
								<Field.Field data-invalid={formErrors.formFirstName ? true : undefined}>
									<Field.FieldLabel for="stepper-form-first-name">First Name</Field.FieldLabel>
									<Input
										id="stepper-form-first-name"
										aria-invalid={formErrors.formFirstName ? true : undefined}
										placeholder="John"
										bind:value={formValues.formFirstName}
									/>
									{#if formErrors.formFirstName}
										<Field.FieldError>{formErrors.formFirstName}</Field.FieldError>
									{/if}
								</Field.Field>
								<Field.Field data-invalid={formErrors.formLastName ? true : undefined}>
									<Field.FieldLabel for="stepper-form-last-name">Last Name</Field.FieldLabel>
									<Input
										id="stepper-form-last-name"
										aria-invalid={formErrors.formLastName ? true : undefined}
										placeholder="Doe"
										bind:value={formValues.formLastName}
									/>
									{#if formErrors.formLastName}
										<Field.FieldError>{formErrors.formLastName}</Field.FieldError>
									{/if}
								</Field.Field>
							</div>
							<Field.Field data-invalid={formErrors.formEmail ? true : undefined}>
								<Field.FieldLabel for="stepper-form-email">Email</Field.FieldLabel>
								<Input
									id="stepper-form-email"
									aria-invalid={formErrors.formEmail ? true : undefined}
									placeholder="john.doe@example.com"
									bind:value={formValues.formEmail}
								/>
								{#if formErrors.formEmail}
									<Field.FieldError>{formErrors.formEmail}</Field.FieldError>
								{/if}
							</Field.Field>
						</Stepper.Content>

						<Stepper.Content value="about">
							<Field.Field data-invalid={formErrors.formBio ? true : undefined}>
								<Field.FieldLabel for="stepper-form-bio">Bio</Field.FieldLabel>
								<Textarea
									id="stepper-form-bio"
									aria-invalid={formErrors.formBio ? true : undefined}
									placeholder="Tell us about yourself…"
									class="min-h-30"
									bind:value={formValues.formBio}
								/>
								{#if formErrors.formBio}
									<Field.FieldError>{formErrors.formBio}</Field.FieldError>
								{:else}
									<Field.FieldDescription>
										Write a brief description about yourself.
									</Field.FieldDescription>
								{/if}
							</Field.Field>
						</Stepper.Content>

						<Stepper.Content value="professional" class="flex flex-col gap-4">
							<Field.Field data-invalid={formErrors.formCompany ? true : undefined}>
								<Field.FieldLabel for="stepper-form-company">Company</Field.FieldLabel>
								<Input
									id="stepper-form-company"
									aria-invalid={formErrors.formCompany ? true : undefined}
									placeholder="Acme Inc."
									bind:value={formValues.formCompany}
								/>
								{#if formErrors.formCompany}
									<Field.FieldError>{formErrors.formCompany}</Field.FieldError>
								{/if}
							</Field.Field>
							<Field.Field data-invalid={formErrors.formWebsite ? true : undefined}>
								<Field.FieldLabel for="stepper-form-website">Website</Field.FieldLabel>
								<Input
									id="stepper-form-website"
									aria-invalid={formErrors.formWebsite ? true : undefined}
									placeholder="https://example.com"
									bind:value={formValues.formWebsite}
								/>
								{#if formErrors.formWebsite}
									<Field.FieldError>{formErrors.formWebsite}</Field.FieldError>
								{:else}
									<Field.FieldDescription>
										Optional: your personal or company website.
									</Field.FieldDescription>
								{/if}
							</Field.Field>
						</Stepper.Content>

						<div class="mt-4 flex items-center justify-between">
							<Stepper.Prev>
								{#snippet child({ props })}
									<Button {...props} variant="outline">Previous</Button>
								{/snippet}
							</Stepper.Prev>
							<div class="text-sm text-muted-foreground">
								Step {formIndex + 1} of {formSteps.length}
							</div>
							{#if formIndex === formSteps.length - 1}
								<Button type="submit">Complete</Button>
							{:else}
								<Stepper.Next>
									{#snippet child({ props })}
										<Button {...props}>Next</Button>
									{/snippet}
								</Stepper.Next>
							{/if}
						</div>
					</Stepper.Root>
				</form>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		{#each propTables as table (table.part)}
			<div class="flex flex-col gap-3">
				<h3 class="text-base font-medium tracking-tight">{table.part}</h3>
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
								{#each table.rows as row (row.prop)}
									<Table.Row>
										<Table.Cell class="font-medium">{row.prop}</Table.Cell>
										<Table.Cell class="font-mono text-xs">{row.type}</Table.Cell>
										<Table.Cell class="font-mono text-xs">{row.default}</Table.Cell>
										<Table.Cell class="text-muted-foreground">{row.description}</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</Card.Content>
				</Card.Root>
			</div>
		{/each}

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium tracking-tight">Data attributes</h3>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Part</Table.Head>
								<Table.Head>Attribute</Table.Head>
								<Table.Head>Value</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each dataAttributes as row (`${row.part}-${row.attribute}`)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.part}</Table.Cell>
									<Table.Cell class="font-mono text-xs">{row.attribute}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.value}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium tracking-tight">Keyboard interactions</h3>
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
							{#each keyboardShortcuts as row (row.keys)}
								<Table.Row>
									<Table.Cell class="font-mono text-xs">{row.keys}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>

	<!-- Ported from Demo 2. -->
	<DocSection title="Stepper with completed state">
		{#snippet blurb()}
			— completed steps and their separators recolour, through the <code>success</code> token family.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Stepper.Root defaultValue="2" class="w-full max-w-md">
					<Stepper.List>
						{#each completedSteps as step (step)}
							<Stepper.Item value={step}>
								<Stepper.Trigger>
									<Stepper.Indicator
										class="data-[state=completed]:border-success data-[state=completed]:bg-success data-[state=completed]:text-success-foreground"
									>
										{step}
									</Stepper.Indicator>
								</Stepper.Trigger>
								<Stepper.Separator class="data-[state=completed]:bg-success" />
							</Stepper.Item>
						{/each}
					</Stepper.List>
					{#each completedSteps as step (step)}
						<Stepper.Content value={step} class="flex items-center justify-center text-sm">
							Step {step} content
						</Stepper.Content>
					{/each}
				</Stepper.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- Ported from Demo 3. -->
	<DocSection title="Stepper with loading state">
		{#snippet blurb()}
			— the house Item has no <code>loading</code> flag, so the active step renders the spinner
			through the Indicator's children snippet, which the demo's <code>indicators.loading</code>
			node otherwise supplied.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Stepper.Root defaultValue="2" class="w-full max-w-md">
					<Stepper.List>
						{#each loadingSteps as step (step)}
							<Stepper.Item value={step}>
								<Stepper.Trigger>
									<Stepper.Indicator
										class="size-5 border-2 data-[state=completed]:border-success data-[state=completed]:bg-success data-[state=completed]:text-success-foreground"
									>
										{#snippet children(dataState)}
											{#if dataState === "completed"}
												<CheckIcon class="size-3.5" />
											{:else if dataState === "active"}
												<LoaderCircleIcon class="size-3.5 animate-spin" />
											{/if}
										{/snippet}
									</Stepper.Indicator>
								</Stepper.Trigger>
								<Stepper.Separator class="data-[state=completed]:bg-success" />
							</Stepper.Item>
						{/each}
					</Stepper.List>
					{#each loadingSteps as step (step)}
						<Stepper.Content value={step} class="flex items-center justify-center text-sm">
							Step {step} content
						</Stepper.Content>
					{/each}
				</Stepper.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- Ported from Demo 4. -->
	<DocSection title="Controlled stepper">
		{#snippet blurb()}
			— the page owns <code>value</code> and the buttons move it by number.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Stepper.Root bind:value={controlledStep} class="w-full max-w-md">
					<Stepper.List>
						{#each controlledSteps as step (step)}
							<Stepper.Item value={step}>
								<Stepper.Trigger>
									<Stepper.Indicator
										class="data-[state=completed]:border-success data-[state=completed]:bg-success data-[state=completed]:text-success-foreground"
									>
										{step}
									</Stepper.Indicator>
								</Stepper.Trigger>
								<Stepper.Separator class="data-[state=completed]:bg-success" />
							</Stepper.Item>
						{/each}
					</Stepper.List>
					{#each controlledSteps as step (step)}
						<Stepper.Content value={step} class="flex items-center justify-center text-sm">
							Step {step} content
						</Stepper.Content>
					{/each}
					<div class="flex items-center justify-between gap-2.5">
						<Button
							variant="outline"
							disabled={controlledStep === "1"}
							onclick={() => (controlledStep = String(Number(controlledStep) - 1))}
						>
							Previous
						</Button>
						<Button
							variant="outline"
							disabled={controlledStep === String(controlledSteps.length)}
							onclick={() => (controlledStep = String(Number(controlledStep) + 1))}
						>
							Next
						</Button>
					</div>
				</Stepper.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- Demo 5. The separator's `top` is 3.5, so
	     the hairline crosses the exact centre of this component's size-7 indicator. -->
	<DocSection title="Stepper with title and indicator">
		<Card.Root>
			<Card.Content>
				<Stepper.Root defaultValue="2" class="w-full max-w-md">
					<Stepper.List>
						{#each namedSteps as title, index (title)}
							<Stepper.Item value={String(index + 1)} class="flex-1 items-start">
								<Stepper.Trigger class="flex-col gap-2.5">
									<Stepper.Indicator />
									<Stepper.Title>{title}</Stepper.Title>
								</Stepper.Trigger>
								<Stepper.Separator
									class="absolute inset-x-0 top-3.5 left-[calc(50%+0.875rem)] m-0 w-[calc(100%-1.75rem)] flex-none"
								/>
							</Stepper.Item>
						{/each}
					</Stepper.List>
					{#each namedSteps as title, index (title)}
						<Stepper.Content
							value={String(index + 1)}
							class="flex items-center justify-center text-sm"
						>
							{title} content
						</Stepper.Content>
					{/each}
				</Stepper.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- Demo 6. The `group/step` class on the Item is what lets the
	     Title restyle itself per state. -->
	<DocSection title="Stepper with progress bar indicator">
		<Card.Root>
			<Card.Content>
				<Stepper.Root defaultValue="2" class="w-full max-w-lg">
					<Stepper.List class="gap-3">
						{#each wizardSteps as title, index (title)}
							<Stepper.Item value={String(index + 1)} class="group/step flex-1 items-start">
								<Stepper.Trigger class="grow flex-col items-start justify-center gap-3">
									<Stepper.Indicator />
									<Stepper.Title
										class="text-start font-semibold group-data-[state=inactive]/step:text-muted-foreground"
									>
										{title}
									</Stepper.Title>
								</Stepper.Trigger>
							</Stepper.Item>
						{/each}
					</Stepper.List>
					{#each wizardSteps as title, index (title)}
						<Stepper.Content
							value={String(index + 1)}
							class="flex items-center justify-center text-sm"
						>
							{title} content
						</Stepper.Content>
					{/each}
				</Stepper.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- Ported from Demo 7. -->
	<DocSection title="Stepper with icons and badges">
		{#snippet blurb()}
			— the badges are the house
			<code>primary-subtle</code> / <code>success-subtle</code> variants, at the one badge size this theme
			has.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Stepper.Root bind:value={iconStep} class="w-full max-w-xl">
					<Stepper.List class="gap-3">
						{#each iconSteps as step, index (step.title)}
							<Stepper.Item value={String(index + 1)} class="group/step flex-1 items-start">
								<Stepper.Trigger class="grow flex-col items-start justify-center gap-2.5">
									<Stepper.Indicator
										class="size-8 border-2 data-[state=completed]:border-success data-[state=completed]:bg-success data-[state=completed]:text-success-foreground data-[state=inactive]:border-border data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground"
									>
										{#snippet children(dataState)}
											{#if dataState === "completed"}
												<CheckIcon class="size-3.5" />
											{:else}
												<step.icon class="size-4" />
											{/if}
										{/snippet}
									</Stepper.Indicator>
									<div class="flex flex-col items-start gap-1">
										<div class="text-[10px] font-semibold text-muted-foreground uppercase">
											Step {index + 1}
										</div>
										<Stepper.Title
											class="text-start text-base font-semibold group-data-[state=inactive]/step:text-muted-foreground"
										>
											{step.title}
										</Stepper.Title>
										<div>
											<Badge
												variant="primary-subtle"
												class="hidden group-data-[state=active]/step:inline-flex"
											>
												In Progress
											</Badge>
											<Badge
												variant="success-subtle"
												class="hidden group-data-[state=completed]/step:inline-flex"
											>
												Completed
											</Badge>
											<Badge
												variant="secondary"
												class="hidden text-muted-foreground group-data-[state=inactive]/step:inline-flex"
											>
												Pending
											</Badge>
										</div>
									</div>
								</Stepper.Trigger>
								<Stepper.Separator
									class="absolute inset-x-0 start-9 top-4 m-0 w-[calc(100%-2rem)] flex-none data-[state=completed]:bg-success"
								/>
							</Stepper.Item>
						{/each}
					</Stepper.List>
					{#each iconSteps as step, index (step.title)}
						<Stepper.Content
							value={String(index + 1)}
							class="flex items-center justify-center text-sm"
						>
							{step.title} content
						</Stepper.Content>
					{/each}
					<div class="flex items-center justify-between gap-2.5">
						<Button
							variant="outline"
							disabled={iconStep === "1"}
							onclick={() => (iconStep = String(Number(iconStep) - 1))}
						>
							Previous
						</Button>
						<Button
							variant="outline"
							disabled={iconStep === String(iconSteps.length)}
							onclick={() => (iconStep = String(Number(iconStep) + 1))}
						>
							Next
						</Button>
					</div>
				</Stepper.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- Ported from Demo 8, with the same separator centring as the
	     title-and-indicator section. -->
	<DocSection title="Stepper with descriptions">
		<Card.Root>
			<Card.Content>
				<Stepper.Root defaultValue="2" class="w-full max-w-md">
					<Stepper.List>
						{#each describedSteps as step, index (step.title)}
							<Stepper.Item value={String(index + 1)} class="flex-1 items-start">
								<Stepper.Trigger class="flex-col gap-2.5">
									<Stepper.Indicator />
									<Stepper.Title>{step.title}</Stepper.Title>
									<Stepper.Description>{step.description}</Stepper.Description>
								</Stepper.Trigger>
								<Stepper.Separator
									class="absolute inset-x-0 top-3.5 left-[calc(50%+0.875rem)] m-0 w-[calc(100%-1.75rem)] flex-none"
								/>
							</Stepper.Item>
						{/each}
					</Stepper.List>
					{#each describedSteps as step, index (step.title)}
						<Stepper.Content
							value={String(index + 1)}
							class="flex items-center justify-center text-sm"
						>
							{step.title} content
						</Stepper.Content>
					{/each}
				</Stepper.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- Ported from Demo 9. -->
	<DocSection title="Stepper with inline titles">
		<Card.Root>
			<Card.Content>
				<Stepper.Root defaultValue="2" class="w-full max-w-md">
					<Stepper.List>
						{#each inlineSteps as title, index (title)}
							<Stepper.Item value={String(index + 1)}>
								<Stepper.Trigger class="justify-start gap-1.5">
									<Stepper.Indicator />
									<Stepper.Title>{title}</Stepper.Title>
								</Stepper.Trigger>
								<Stepper.Separator class="md:mx-2.5" />
							</Stepper.Item>
						{/each}
					</Stepper.List>
					{#each inlineSteps as title, index (title)}
						<Stepper.Content
							value={String(index + 1)}
							class="flex items-center justify-center text-sm"
						>
							{title} content
						</Stepper.Content>
					{/each}
				</Stepper.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- Ported from Demo 10. -->
	<DocSection title="Stepper with content for each step">
		<Card.Root>
			<Card.Content>
				<Stepper.Root defaultValue="2" class="w-full max-w-lg">
					<Stepper.List>
						{#each pairedSteps as step, index (step.title)}
							<Stepper.Item value={String(index + 1)}>
								<Stepper.Trigger class="justify-start gap-1.5">
									<Stepper.Indicator />
									<div class="flex flex-col items-start gap-0.5">
										<Stepper.Title>{step.title}</Stepper.Title>
										<Stepper.Description>{step.description}</Stepper.Description>
									</div>
								</Stepper.Trigger>
								<Stepper.Separator class="md:mx-2.5" />
							</Stepper.Item>
						{/each}
					</Stepper.List>
					{#each pairedSteps as step, index (step.title)}
						<Stepper.Content
							value={String(index + 1)}
							class="flex items-center justify-center text-sm"
						>
							{step.title} content
						</Stepper.Content>
					{/each}
				</Stepper.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- Ported from Demo 11: the indicator restyled from a circle into a bar, its
	     step number kept for screen readers only. -->
	<DocSection title="Stepper with progress bar and titles">
		<Card.Root>
			<Card.Content>
				<Stepper.Root defaultValue="2" class="w-full max-w-lg">
					<Stepper.List class="gap-5">
						{#each wizardSteps as title, index (title)}
							<Stepper.Item value={String(index + 1)} class="group/step flex-1 items-start">
								<Stepper.Trigger class="w-full grow flex-col items-start justify-center gap-3.5">
									<Stepper.Indicator
										class="h-1 w-full rounded-full border-0 bg-border data-[state=active]:bg-primary data-[state=completed]:bg-primary"
									>
										<span class="sr-only">{index + 1}</span>
									</Stepper.Indicator>
									<Stepper.Title
										class="text-start font-semibold group-data-[state=inactive]/step:text-muted-foreground"
									>
										{title}
									</Stepper.Title>
								</Stepper.Trigger>
							</Stepper.Item>
						{/each}
					</Stepper.List>
					{#each wizardSteps as title, index (title)}
						<Stepper.Content
							value={String(index + 1)}
							class="flex items-center justify-center text-sm"
						>
							{title} content
						</Stepper.Content>
					{/each}
				</Stepper.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- Ported from Demo 12. The Item clips its square indicator, so only the
	     first and last segments of the bar get rounded ends. -->
	<DocSection title="Stepper with segmented progress bar">
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-md">
					<Stepper.Root bind:value={segmentedStep}>
						<Stepper.List>
							{#each segmentedSteps as step (step)}
								<Stepper.Item
									value={step}
									class="flex-1 overflow-hidden transition-all duration-300 first:rounded-s-full last:rounded-e-full"
								>
									<Stepper.Trigger class="w-full">
										<Stepper.Indicator class="h-2 w-full rounded-none border-0 bg-border">
											<span class="sr-only">{step}</span>
										</Stepper.Indicator>
									</Stepper.Trigger>
								</Stepper.Item>
							{/each}
						</Stepper.List>
						<div class="flex items-center justify-between gap-2.5 py-1">
							<Button
								variant="link"
								class={cn("px-0", segmentedStep === "1" && "pointer-events-none opacity-0")}
								onclick={() => (segmentedStep = String(Number(segmentedStep) - 1))}
							>
								<ArrowLeftIcon data-icon="inline-start" />
								Back
							</Button>
							<div class="text-sm font-medium">
								<span class="text-foreground">{segmentedStep}</span>
								<span class="text-muted-foreground/60">/ {segmentedSteps.length}</span>
							</div>
						</div>
						{#each segmentedSteps as step (step)}
							<Stepper.Content
								value={step}
								class="flex w-full items-center justify-center py-6 text-sm"
							>
								Step {step} content
							</Stepper.Content>
						{/each}
						<div class="flex items-center justify-end gap-2.5">
							<Button
								variant="outline"
								disabled={segmentedStep === String(segmentedSteps.length)}
								onclick={() => (segmentedStep = String(Number(segmentedStep) + 1))}
							>
								Next
							</Button>
						</div>
					</Stepper.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- Demo 14: indicator-only steps on the vertical axis. The
	     spinner adaptation is the loading section's; the root's own vertical layout (list beside
	     content) is overridden to a stacked, centred one. -->
	<DocSection title="Stepper with vertical orientation">
		<Card.Root>
			<Card.Content>
				<Stepper.Root
					defaultValue="2"
					orientation="vertical"
					class="flex-col items-center justify-center gap-10"
				>
					<Stepper.List>
						{#each verticalSteps as step (step)}
							<Stepper.Item value={step}>
								<Stepper.Trigger>
									<Stepper.Indicator
										class="data-[state=completed]:border-success data-[state=completed]:bg-success data-[state=completed]:text-success-foreground"
									>
										{#snippet children(dataState)}
											{#if dataState === "completed"}
												<CheckIcon class="size-4" />
											{:else if dataState === "active"}
												<LoaderCircleIcon class="size-3.5 animate-spin" />
											{:else}
												{step}
											{/if}
										{/snippet}
									</Stepper.Indicator>
								</Stepper.Trigger>
								<Stepper.Separator class="data-[state=completed]:bg-success" />
							</Stepper.Item>
						{/each}
					</Stepper.List>
					{#each verticalSteps as step (step)}
						<Stepper.Content value={step} class="w-56 text-center text-sm">
							Step {step} content
						</Stepper.Content>
					{/each}
				</Stepper.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
