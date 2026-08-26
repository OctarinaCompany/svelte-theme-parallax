<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import InfoIcon from "@lucide/svelte/icons/info";
	import LockIcon from "@lucide/svelte/icons/lock";
	import MailIcon from "@lucide/svelte/icons/mail";
	import PencilIcon from "@lucide/svelte/icons/pencil";

	import * as Card from "$lib/components/ui/card/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import * as InputGroup from "$lib/components/ui/input-group/index.js";
	import * as InputOTP from "$lib/components/ui/input-otp/index.js";
	import * as NativeSelect from "$lib/components/ui/native-select/index.js";
	import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Checkbox } from "$lib/components/ui/checkbox/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Slider } from "$lib/components/ui/slider/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { href } from "$lib/hooks/route.svelte.js";

	/**
	 * The Field component page, from shadcn-svelte's own documentation
	 * (https://shadcn-svelte.com/docs/components/field) — the labelled-field primitive every
	 * form in this gallery is composed from, per the house forms rules: `FieldGroup` +
	 * `Field` instead of a raw `div` stack, `FieldSet` + `FieldLegend` instead of a `div`
	 * with a heading.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. Its nearest concept is `.form-group`
	 * (the reference stylesheet, two lines spending `form-group-margin-bottom: 1.375rem`) —
	 * a stack rhythm, not a primitive that knows about labels, descriptions, orientation or
	 * validity. So unlike most pages here there is no pixel target to hit, and the primitive
	 * renders exactly as shipped — the same call every Field consumer already in this gallery
	 * (Pending, Stepper, Mask Input, Phone Input) has made. Restating the classic theme's 22px
	 * `.form-group` gap or its 400-weight `.form-label` on this page alone would fork the one
	 * house primitive into two rhythms; where a page reproduces a literal the classic theme form
	 * example it derives those values at the call site, as the Textarea page does.
	 *
	 * The one weight override below is `font-normal` on the checkbox labels in the Fieldset
	 * section — the call the Checkbox page derives from `.form-check-label` (which sets
	 * nothing but the cursor, so it inherits 400) and that the forms rule itself makes:
	 * three checkbox rows at `font-medium` read as three headings.
	 *
	 * The form controls need no classes at all: the classic `.form-control`, switch and
	 * checkbox recipes live in `app.css` on their `data-slot`s, so the bare primitives
	 * already render the classic look here.
	 */

	/**
	 * THIS PAGE ABSORBED THE LABEL PAGE — the sections from "the classic theme form group" down. The route
	 * `/components/label` is retired and aliases here (`src/lib/hooks/route.svelte.ts`);
	 * `src/lib/components/ui/label/` is untouched and still imported across the app. The page
	 * went, not the component.
	 *
	 * IT WENT BECAUSE MOST OF IT WAS ALREADY WRITTEN TWICE. Seven of its demos were
	 * label decorations, and
	 * the Input page carried the same seven subjects in its INPUT demo
	 * set — required asterisk, optional marker, tooltip icon,
	 * badge, character counter, helper text, error state. Resolving each subject to one version
	 * left three sections that were about nothing but how a label attaches to a control —
	 * The classic theme's `.form-group` rhythm, a label over a multi-line control, and a label under a
	 * disabled field — and that is this page's subject. A page whose remainder is a subset of
	 * another page's subject is a section of it.
	 *
	 * WHICH VERSION SURVIVED is recorded per section below, and every one of those sections names
	 * BOTH upstream files, so the dropped port stays findable by the file it came from. Three
	 * rules settled the six real pairs:
	 *
	 * 1. A DECORATION THAT BELONGS TO THE LABEL GOES INSIDE THE LABEL, because that is what makes
	 *    it inherit the label's own `opacity-50` when the field is disabled — the argument the
	 *    "Fields with input groups" section above already makes for the required asterisk. It
	 *    settles the tooltip, the badge and the character counter, where only the label port put
	 *    the decoration in the label and the input port set it in a `div` beside one.
	 * 2. A DEMO STATES ITS SUBJECT COMPLETELY. The error pair splits on this and nothing else:
	 *    demo 11 marks the field `data-invalid` AND the control `aria-invalid`,
	 *    demo 5 only the control, and the Validation section above is already on record
	 *    that invalidity styles two surfaces and so has to be said twice.
	 * 3. WHERE THE TWO ARE EQUAL, THE FIELD-BUILT ONE WINS. That is the required indicator: both
	 *    ports put the asterisk in the label, and only the wording differed.
	 *
	 * THE HELPER-TEXT PAIR ANSWERED TO NONE OF THE THREE and was decided by what this page
	 * already shows. demo 3 is label, control, description — the card at the top of this
	 * page and every demo form between here and it, so a section of it would demonstrate nothing.
	 * demo 10 is the other placement, the description tucked under the label ABOVE the
	 * control, and that is the only thing such a section can add here.
	 *
	 * ONE OF THE SEVEN WAS NOT A PAIR. A field is marked optional two different ways —
	 * demo 6 with a muted `(optional)` inside the label, demo 18 with a Badge
	 * pushed to the far edge — which is a different component in a different place, not the same
	 * demo written twice. Only the first is below; the second stays on the Input page next to the
	 * "Forgot password?" demo that shares its justified label row.
	 *
	 * TWO CAME ACROSS UNOPPOSED, the Input page having never ported them: the inline edit toggle
	 * (demo 12) and the status indicator dot (demo 13). TWO DID NOT COME ACROSS
	 * AT ALL: demo 1 was the Label page's Usage section and is the "the classic theme form group"
	 * section below, and demo 2 was its preview card — a checkbox with the label beside
	 * it, which is the row the Fieldset section above already renders three times from Field
	 * parts.
	 *
	 * EVERY ABSORBED LABEL IS A `FieldLabel` where the Label page called the bare `Label`, and
	 * that is not a preference: `field-label.svelte` carries
	 * `group-data-[disabled=true]/field:opacity-50`, keyed on the `group/field` marker
	 * `field.svelte` sets, while `label.svelte` carries the UNNAMED
	 * `group-data-[disabled=true]:opacity-50`, which looks for a plain `group` class no `Field`
	 * has. A bare `Label` inside a `Field` therefore does not fade with it. The one exception is
	 * "the classic theme form group", which is bare `div`s and bare `Label`s on purpose — reproducing
	 * the classic theme's own markup is that section's whole point, and there is no field state there for a
	 * label to read.
	 *
	 * THE `font-normal` CORRECTION DID NOT TRAVEL. Both source pages put the classic theme's 400-weight
	 * `.form-label` on every label they rendered. This page renders the primitive as shipped, per
	 * the paragraph above, so the absorbed sections carry no weight class either — with the one
	 * exception that paragraph already carves out: "the classic theme form group" reproduces a literal
	 * the classic theme form example, so it derives its values at the call site.
	 */

	/** The Horizontal section's switches — bound, so the rows actually toggle. */
	let twoFactor = $state(true);
	let sessionAlerts = $state(false);

	/** The Fieldset section's notification checkboxes. */
	let notifyComments = $state(true);
	let notifyMentions = $state(true);
	let notifyDeploys = $state(false);

	/**
	 * The Validation section's live field. `touched` gates the error to a field the user has
	 * actually visited: the empty-is-invalid rule would otherwise paint the field red on
	 * first paint, before anyone has typed. Once visited, the error re-derives per keystroke,
	 * so the fix is acknowledged the moment it lands rather than on the next blur.
	 */
	let workEmail = $state("");
	let workEmailTouched = $state(false);
	const workEmailError = $derived.by(() => {
		const value = workEmail.trim();
		if (value === "") return "An email address is required.";
		// Deliberately loose — something@somewhere.tld. The real gate is the server's; a
		// client regex strict enough to reject unusual-but-valid addresses is worse than
		// one that lets a typo through.
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
			return "Enter a valid email address, like dianna.smiley@example.com.";
		}
		return undefined;
	});
	const showWorkEmailError = $derived(workEmailTouched && workEmailError !== undefined);

	/**
	 * ELEVEN MORE SECTIONS — the form demo set, in
	 * its documented order. They document the same primitive from the other direction:
	 * the sections above isolate one prop each, these are whole forms showing which control goes
	 * inside a `Field` and how a column of them reads together.
	 *
	 * Four decisions apply to all eleven, so they are stated once here instead of at every call
	 * site:
	 *
	 * 1. LEFT-ALIGNED, NOT CENTRED. Every form demo is wrapped in `w-full max-w-xs`. An
	 *    `mx-auto` is dropped so these cards line up with the five above, which sit at the
	 *    leading edge; the widths (`max-w-xs`, `max-w-lg` for the wide one) are kept, because a
	 *    form that spans the whole card stops looking like a form.
	 * 2. AN INVALID FIELD'S MESSAGE IS A `FieldError`. demo 1 puts "Please enter a valid
	 *    email address." in a `FieldDescription` under a `data-invalid` field, so the label turns
	 *    destructive while the sentence explaining why stays muted. `FieldError` is what that
	 *    sentence is, and what the Validation section above already uses.
	 * 3. UNCONTROLLED BECOMES BOUND. Upstream's `defaultChecked` / `defaultValue` are React
	 *    uncontrolled inputs, which in Svelte would simply be initial attributes on a control
	 *    nothing reads back. Each becomes a `$state` below, so the switches, checkboxes, radios,
	 *    selects and sliders in these demos actually move — and the two character counters
	 *    upstream hardcodes ("0/500", "24/160") count real characters.
	 * 4. NAMES ARE PREFIXED BY SECTION. One script block serves every section on the page, and
	 *    several demos would otherwise reuse ids like `notify-updates`.
	 */

	/** "Field with input and textarea" — bound for the 0/500 counter. */
	let ticketMessage = $state("");

	/** "Field with select control". */
	const planOptions = [
		{ value: "free", label: "Free - Basic features" },
		{ value: "pro", label: "Pro - Advanced tools" },
		{ value: "enterprise", label: "Enterprise - Custom solutions" },
	];
	const billingOptions = [
		{ value: "monthly", label: "Monthly billing" },
		{ value: "yearly", label: "Yearly billing (Save 20%)" },
	];
	let planValue = $state("pro");
	let billingValue = $state("yearly");
	const planLabel = $derived(planOptions.find((o) => o.value === planValue)?.label);
	const billingLabel = $derived(billingOptions.find((o) => o.value === billingValue)?.label);

	/** "Field with radio groups and checkboxes". */
	let choicesUpdates = $state(true);
	let choicesSecurity = $state(true);
	let choicesPrivacy = $state("public");

	/**
	 * "Field with slider and switch" — one thumb, so a `type="single"` slider.
	 * The section heading fixes upstream's typo, which reads "Filed with slider and switch".
	 */
	let performanceMode = $state(true);
	let cpuAllocation = $state(75);

	/** "Field with OTP input". */
	let verificationMethod = $state("email");

	/** "Settings form with validation" — upstream's seeded values. */
	let settingsBio = $state("Software engineer & open source contributor.");
	let settingsEmailNotifications = $state(true);
	let settingsMarketing = $state(false);
	let settingsTerms = $state(false);

	/** "Permission settings with checkboxes". */
	let permissionRead = $state(true);
	let permissionWrite = $state(true);
	let permissionDelete = $state(false);
	let permissionAdmin = $state(false);

	/** "Responsive field layout". */
	const inviteRoles = [
		{ value: "admin", label: "Admin" },
		{ value: "member", label: "Member" },
		{ value: "viewer", label: "Viewer" },
	];
	let inviteRole = $state("member");
	const inviteRoleLabel = $derived(inviteRoles.find((o) => o.value === inviteRole)?.label);

	/** "Notification preferences form". */
	let prefsPush = $state(true);
	let prefsEmailDigest = $state(true);
	let prefsSms = $state(false);
	let prefsComments = $state(true);
	let prefsMentions = $state(true);
	let prefsProductUpdates = $state(false);

	/**
	 * The stacked field label of the "the classic theme form group" section — the classic theme's `.form-label`, and
	 * the only place on this page that restates it. A sweep of the reference source
	 * returns nothing: the reference stylesheet overrides `.form-text`, `.form-control`, `.form-select`,
	 * `.form-check`, floating labels, input groups and validation, and leaves the label to
	 * the classic framework. The compiled reference bundle agrees — `.form-label` is one
	 * declaration, `margin-bottom: .5rem`, with `form-label-font-weight` and
	 * `form-label-color` left at the classic `null`.
	 *
	 *   mb-2          `form-label-margin-bottom: .5rem`, the classic untouched default. A margin
	 *                 rather than a gap because that section's rhythm is margins throughout
	 *   font-normal   `font-weight-base`, inherited from the body because `.form-label` declares
	 *                 no `font-weight` at all, where shadcn's Label asks for `font-medium`
	 *
	 * The size needs no correction: `--bs-body-font-size` compiles to 0.9375rem and `--text-sm`
	 * in `app.css` is mapped to that same `font-size-base` rather than to Tailwind's 14px, so
	 * shadcn's `text-sm` is already 15px here.
	 */
	const fieldLabel = "mb-2 font-normal";

	/**
	 * That section's two fields. The classic theme's own forms example.
	 * is this same pair and its placeholders are kept verbatim; only the first label is the
	 * shadcn-svelte Label docs' wording rather than the classic theme's "Email address".
	 */
	const formGroupFields = [
		{
			id: "form-group-email",
			type: "email",
			label: "Your email address",
			placeholder: "Enter email",
		},
		{ id: "form-group-password", type: "password", label: "Password", placeholder: "Password" },
	] as const;

	/** "Label with character counter" — the live count for the Bio textarea. */
	let labelCounterBio = $state("");

	/** "Label with inline edit toggle". */
	let labelInlineEditEditing = $state(false);
	let labelInlineEditValue = $state("My Awesome Project");
</script>

<DocPage title="Field">
	{#snippet subtitle()}
		Combines labels, controls and help text into accessible form fields — the layout primitive every
		form in this gallery is built from. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/field"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<!--
				The default shape: vertical fields in a `FieldGroup`, each field owning its label
				and help text so the pieces can never drift apart. `FieldSeparator` carries negative
				margins that pull against the group's gap, so the rule sits centred between the two
				halves of the form without any margin bookkeeping at the call site.
			-->
			<div class="w-full max-w-md">
				<Field.FieldGroup>
					<Field.Field>
						<Field.FieldLabel for="field-full-name">Full name</Field.FieldLabel>
						<Input id="field-full-name" value="Dianna Smiley" placeholder="Your full name" />
					</Field.Field>
					<Field.Field>
						<Field.FieldLabel for="field-email">Email address</Field.FieldLabel>
						<Input
							id="field-email"
							type="email"
							value="dianna.smiley@example.com"
							placeholder="you@example.com"
						/>
						<Field.FieldDescription>
							Used for sign-in and receipts — never shown publicly.
						</Field.FieldDescription>
					</Field.Field>
					<Field.FieldSeparator />
					<Field.Field>
						<Field.FieldLabel for="field-bio">Bio</Field.FieldLabel>
						<Textarea id="field-bio" placeholder="A few words about yourself." />
						<Field.FieldDescription>
							Shown on your public profile, next to your avatar.
						</Field.FieldDescription>
					</Field.Field>
				</Field.FieldGroup>
			</div>
		</Card.Content>
	</Card.Root>

	<DocSection title="Horizontal">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">orientation="horizontal"</code> moves the control to
			the trailing edge — the settings-row shape — with
			<code class="text-[87.5%] text-primary">FieldContent</code> stacking the label over its description
			on the leading one.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.FieldGroup>
					<Field.Field orientation="horizontal">
						<Field.FieldContent>
							<Field.FieldLabel for="field-2fa">Two-factor authentication</Field.FieldLabel>
							<Field.FieldDescription>
								Ask for a verification code on every sign-in from a new device.
							</Field.FieldDescription>
						</Field.FieldContent>
						<Switch id="field-2fa" bind:checked={twoFactor} />
					</Field.Field>
					<Field.FieldSeparator />
					<Field.Field orientation="horizontal">
						<Field.FieldContent>
							<Field.FieldLabel for="field-session-alerts">Session alerts</Field.FieldLabel>
							<Field.FieldDescription>
								Email me when a new device signs in to my account.
							</Field.FieldDescription>
						</Field.FieldContent>
						<Switch id="field-session-alerts" bind:checked={sessionAlerts} />
					</Field.Field>
				</Field.FieldGroup>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Responsive">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">orientation="responsive"</code> stacks the field when
			its <code class="text-[87.5%] text-primary">FieldGroup</code> is narrow and rows it out past 28rem.
			Resize the window to watch it fold.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					No `max-w-*` on this demo, unlike the others: the breakpoint is a CONTAINER query
					— `FieldGroup` is the `@container/field-group` the `@md` variants resolve against
					— so the same markup stacks inside a narrow dialog and rows out in a wide card.
					Capping the group at `max-w-md` (exactly 28rem) would leave it forever a hair
					under its own breakpoint, and the "responsive" demo would never change shape.
				-->
				<Field.FieldGroup>
					<Field.Field orientation="responsive">
						<Field.FieldContent>
							<Field.FieldLabel for="field-workspace-name">Workspace name</Field.FieldLabel>
							<Field.FieldDescription>
								Shown in the sidebar and on every invoice.
							</Field.FieldDescription>
						</Field.FieldContent>
						<Input id="field-workspace-name" value="Northwind" placeholder="Workspace name" />
					</Field.Field>
					<Field.Field orientation="responsive">
						<Field.FieldContent>
							<Field.FieldLabel for="field-support-email">Support email</Field.FieldLabel>
							<Field.FieldDescription>
								Replies to invoice emails land in this inbox.
							</Field.FieldDescription>
						</Field.FieldContent>
						<Input id="field-support-email" type="email" placeholder="support@example.com" />
					</Field.Field>
				</Field.FieldGroup>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Fieldset">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">FieldSet</code> and
			<code class="text-[87.5%] text-primary">FieldLegend</code> group related choices under one
			caption — a real <code class="text-[87.5%] text-primary">&lt;fieldset&gt;</code>, so the
			legend is announced with every control inside it.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-md">
					<Field.FieldSet>
						<!--
							`variant="label"` drops the legend to the same size as a field label:
							this set sits among ordinary fields in a form, and the default
							`text-base` legend would outrank the labels around it.
						-->
						<Field.FieldLegend variant="label">Email notifications</Field.FieldLegend>
						<Field.FieldDescription>Choose what lands in your inbox.</Field.FieldDescription>
						<Field.FieldGroup class="gap-3">
							<Field.Field orientation="horizontal">
								<Checkbox id="field-notify-comments" bind:checked={notifyComments} />
								<!--
									`font-normal` — `.form-check-label` sets nothing but the cursor, so a
									classic-theme check label inherits the body's 400 where `FieldLabel` asks
									for 500; the Checkbox page derives the same override.
								-->
								<Field.FieldLabel for="field-notify-comments" class="font-normal">
									Comments on my projects
								</Field.FieldLabel>
							</Field.Field>
							<Field.Field orientation="horizontal">
								<Checkbox id="field-notify-mentions" bind:checked={notifyMentions} />
								<Field.FieldLabel for="field-notify-mentions" class="font-normal">
									Mentions of my name
								</Field.FieldLabel>
							</Field.Field>
							<Field.Field orientation="horizontal">
								<Checkbox id="field-notify-deploys" bind:checked={notifyDeploys} />
								<Field.FieldLabel for="field-notify-deploys" class="font-normal">
									Deploy summaries
								</Field.FieldLabel>
							</Field.Field>
						</Field.FieldGroup>
					</Field.FieldSet>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Validation">
		{#snippet blurb()}
			Invalidity is stated twice because it styles two things:
			<code class="text-[87.5%] text-primary">data-invalid</code> on the field tints the label,
			<code class="text-[87.5%] text-primary">aria-invalid</code> on the control recolours the border.
			Leave the field, or clear it, to trip the error.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-md">
					<Field.FieldGroup>
						<!--
							`|| undefined`, not a bare boolean: Svelte writes `true` as the string
							"true" — exactly what the field's `data-[invalid=true]:` selector matches —
							and removes the attribute for `undefined`, where `false` would leave
							`aria-invalid="false"` on a field that was never wrong.
						-->
						<Field.Field data-invalid={showWorkEmailError || undefined}>
							<Field.FieldLabel for="field-work-email">Work email</Field.FieldLabel>
							<Input
								id="field-work-email"
								type="email"
								placeholder="you@company.com"
								bind:value={workEmail}
								aria-invalid={showWorkEmailError || undefined}
								onblur={() => (workEmailTouched = true)}
							/>
							<!--
								The description yields to the error rather than stacking under it —
								two sentences making different claims about the same field would
								read as a contradiction.
							-->
							{#if showWorkEmailError}
								<Field.FieldError>{workEmailError}</Field.FieldError>
							{:else}
								<Field.FieldDescription>
									We only use this to route support tickets.
								</Field.FieldDescription>
							{/if}
						</Field.Field>
					</Field.FieldGroup>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Disabled">
		{#snippet blurb()}
			The same two-surface split as validation:
			<code class="text-[87.5%] text-primary">data-disabled</code> on the field dims the label,
			<code class="text-[87.5%] text-primary">disabled</code> on the control actually switches it off.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-md">
					<Field.FieldGroup>
						<Field.Field data-disabled>
							<Field.FieldLabel for="field-api-token">API token</Field.FieldLabel>
							<Input id="field-api-token" disabled value="dk_live_4eC39HqLyjWDarjt" />
							<Field.FieldDescription>
								Rotated by your workspace owner — contact them to issue a new one.
							</Field.FieldDescription>
						</Field.Field>
					</Field.FieldGroup>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Fields with input groups">
		{#snippet blurb()}
			A <code class="text-[87.5%] text-primary">InputGroup</code> drops into a field wherever an
			<code class="text-[87.5%] text-primary">Input</code> would, so a prefix, a suffix and the field's
			own label, description and validity all keep working together.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 1. The required marker is a `text-destructive` asterisk inside the
					label, not a separate node beside it: it has to inherit the label's own
					`opacity-50` when the field is disabled.
				-->
				<div class="w-full max-w-xs">
					<Field.FieldGroup>
						<Field.Field>
							<Field.FieldLabel for="profile-name">
								Full Name <span class="text-destructive">*</span>
							</Field.FieldLabel>
							<Input id="profile-name" placeholder="Enter your full name" required />
							<Field.FieldDescription>
								This name will be displayed on your public profile.
							</Field.FieldDescription>
						</Field.Field>
						<Field.Field>
							<Field.FieldLabel for="profile-username">Username</Field.FieldLabel>
							<InputGroup.Root>
								<InputGroup.Addon>
									<InputGroup.Text>@</InputGroup.Text>
								</InputGroup.Addon>
								<InputGroup.Input id="profile-username" placeholder="username" />
							</InputGroup.Root>
							<!--
								The one place a description carries a colour: `text-success` states the
								outcome of a check the field passed, which the muted default cannot.
							-->
							<Field.FieldDescription class="text-success">
								Username is available.
							</Field.FieldDescription>
						</Field.Field>
						<Field.Field data-invalid="true">
							<Field.FieldLabel for="profile-email">Email Address</Field.FieldLabel>
							<InputGroup.Root>
								<InputGroup.Input id="profile-email" placeholder="email" />
								<InputGroup.Addon align="inline-end">
									<InputGroup.Text>@gmail.com</InputGroup.Text>
								</InputGroup.Addon>
							</InputGroup.Root>
							<Field.FieldError>Please enter a valid email address.</Field.FieldError>
						</Field.Field>
					</Field.FieldGroup>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Field with input and textarea">
		{#snippet blurb()}
			A counter belongs on the label's row rather than under the control, so it reads as part of the
			field's caption and not as a second description.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 2. The label and the counter share a flex row INSIDE the field, which
					is why the counter still sits on the label's baseline when the field goes
					`data-disabled` or invalid — the row is just layout, the field owns the states.
				-->
				<div class="w-full max-w-xs">
					<Field.FieldGroup>
						<Field.Field>
							<Field.FieldLabel for="ticket-subject">Subject</Field.FieldLabel>
							<Input id="ticket-subject" placeholder="Briefly describe the issue" />
							<Field.FieldDescription>
								Use a clear and descriptive subject line.
							</Field.FieldDescription>
						</Field.Field>
						<Field.Field>
							<div class="flex items-center justify-between">
								<Field.FieldLabel for="ticket-message">Message</Field.FieldLabel>
								<span class="text-xs text-muted-foreground">{ticketMessage.length}/500</span>
							</div>
							<Textarea
								id="ticket-message"
								maxlength={500}
								bind:value={ticketMessage}
								placeholder="Tell us more about your problem…"
								class="min-h-30"
							/>
							<Field.FieldDescription>
								Include any relevant details to help us resolve your issue.
							</Field.FieldDescription>
						</Field.Field>
					</Field.FieldGroup>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Field with select control">
		{#snippet blurb()}
			A vertical field stretches every child to its full width, so a
			<code class="text-[87.5%] text-primary">Select.Trigger</code> — normally
			<code class="text-[87.5%] text-primary">w-fit</code> — lines its edge up with the inputs above it
			without a width class.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 3. `Select.Trigger` renders the label itself here rather than a
					`SelectValue` child: bits-ui has no value part, so the selected option's label is
					derived in the script block and rendered as the trigger's content.
				-->
				<div class="w-full max-w-xs">
					<Field.FieldGroup>
						<Field.Field>
							<Field.FieldLabel for="plan-selection">Subscription Plan</Field.FieldLabel>
							<Select.Root type="single" bind:value={planValue}>
								<Select.Trigger id="plan-selection">{planLabel}</Select.Trigger>
								<Select.Content>
									{#each planOptions as plan (plan.value)}
										<Select.Item value={plan.value} label={plan.label}>{plan.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
							<Field.FieldDescription>
								Choose the plan that best fits your needs.
							</Field.FieldDescription>
						</Field.Field>
						<Field.Field>
							<Field.FieldLabel for="billing-cycle">Billing Cycle</Field.FieldLabel>
							<Select.Root type="single" bind:value={billingValue}>
								<Select.Trigger id="billing-cycle">{billingLabel}</Select.Trigger>
								<Select.Content>
									{#each billingOptions as cycle (cycle.value)}
										<Select.Item value={cycle.value} label={cycle.label}>{cycle.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
							<Field.FieldDescription>
								Billing cycles can be changed at any time.
							</Field.FieldDescription>
						</Field.Field>
					</Field.FieldGroup>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Field with radio groups and checkboxes">
		{#snippet blurb()}
			Two <code class="text-[87.5%] text-primary">FieldSet</code>s in one group: a checkbox set
			where each row carries a description, and a radio set where the label is the whole row.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 4. The difference between the two sets is `FieldContent`: with it the
					horizontal field aligns the control to the TOP of a title-plus-description stack;
					without it, a single-line label centres against the control.

					The radio set keeps its `RadioGroup.Root` OUTSIDE the inner `FieldGroup` — the
					roving-focus context has to wrap both items, and a `FieldGroup` between them would
					only add a second flex column with the same gap.
				-->
				<div class="w-full max-w-xs">
					<Field.FieldGroup>
						<Field.FieldSet>
							<Field.FieldLegend variant="label">Email Notifications</Field.FieldLegend>
							<Field.FieldGroup class="gap-4">
								<Field.Field orientation="horizontal">
									<Checkbox id="notify-updates" bind:checked={choicesUpdates} />
									<Field.FieldContent>
										<Field.FieldTitle>Product updates</Field.FieldTitle>
										<Field.FieldDescription>
											Receive emails about new features and improvements.
										</Field.FieldDescription>
									</Field.FieldContent>
								</Field.Field>
								<Field.Field orientation="horizontal">
									<Checkbox id="notify-security" checked={choicesSecurity} disabled />
									<Field.FieldContent>
										<Field.FieldTitle>Security alerts</Field.FieldTitle>
										<Field.FieldDescription>
											Critical security notifications cannot be disabled.
										</Field.FieldDescription>
									</Field.FieldContent>
								</Field.Field>
							</Field.FieldGroup>
						</Field.FieldSet>
						<Field.FieldSet>
							<Field.FieldLegend variant="label">Profile Privacy</Field.FieldLegend>
							<RadioGroup.Root bind:value={choicesPrivacy}>
								<Field.FieldGroup class="gap-2">
									<Field.Field orientation="horizontal">
										<RadioGroup.Item value="public" id="privacy-public" />
										<Field.FieldLabel for="privacy-public" class="font-normal">
											Public - visible to everyone
										</Field.FieldLabel>
									</Field.Field>
									<Field.Field orientation="horizontal">
										<RadioGroup.Item value="private" id="privacy-private" />
										<Field.FieldLabel for="privacy-private" class="font-normal">
											Private - only visible to you
										</Field.FieldLabel>
									</Field.Field>
								</Field.FieldGroup>
							</RadioGroup.Root>
						</Field.FieldSet>
					</Field.FieldGroup>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Field with slider and switch">
		{#snippet blurb()}
			A slider has no text of its own, so the field's label row carries the readout — the same
			label-plus-value row the textarea used for its character count.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 5. Upstream holds the slider as a one-element array because the React
					primitive is always multi-thumb; bits-ui splits that into `type="single"` with a
					number, so the readout is the value itself rather than `value[0]`.
				-->
				<div class="w-full max-w-xs">
					<Field.FieldGroup>
						<Field.Field orientation="horizontal">
							<Field.FieldContent>
								<Field.FieldTitle>High Performance Mode</Field.FieldTitle>
								<Field.FieldDescription>
									Prioritize speed over battery life for intensive tasks.
								</Field.FieldDescription>
							</Field.FieldContent>
							<Switch id="high-performance" bind:checked={performanceMode} />
						</Field.Field>
						<Field.Field>
							<div class="flex items-center justify-between">
								<Field.FieldLabel for="cpu-allocation">CPU Allocation</Field.FieldLabel>
								<span class="text-xs font-medium text-muted-foreground">{cpuAllocation}%</span>
							</div>
							<Slider
								id="cpu-allocation"
								type="single"
								bind:value={cpuAllocation}
								max={100}
								step={5}
							/>
							<Field.FieldDescription>
								Limit the maximum CPU resources used by the application.
							</Field.FieldDescription>
						</Field.Field>
					</Field.FieldGroup>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Field with OTP input">
		{#snippet blurb()}
			Both controls here are labelled by the field, including the segmented code input — its
			<code class="text-[87.5%] text-primary">id</code> reaches the hidden input the slots are driven
			from.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 6. A native select rather than the popup one: the point is
					that a plain `<select>` is still a field's control, and the OS list is the
					right answer for three short options on a phone.
				-->
				<div class="w-full max-w-xs">
					<Field.FieldGroup>
						<Field.Field>
							<Field.FieldLabel for="verification-method">Verification Method</Field.FieldLabel>
							<NativeSelect.Root id="verification-method" bind:value={verificationMethod}>
								<NativeSelect.Option value="email">Email Address</NativeSelect.Option>
								<NativeSelect.Option value="sms">SMS Text Message</NativeSelect.Option>
								<NativeSelect.Option value="app">Authenticator App</NativeSelect.Option>
							</NativeSelect.Root>
							<Field.FieldDescription>
								Choose how you want to receive your security code.
							</Field.FieldDescription>
						</Field.Field>
						<Field.Field>
							<Field.FieldLabel for="otp-code">Security Code</Field.FieldLabel>
							<InputOTP.Root id="otp-code" maxlength={6}>
								<InputOTP.Group>
									<InputOTP.Slot index={0} />
									<InputOTP.Slot index={1} />
									<InputOTP.Slot index={2} />
								</InputOTP.Group>
								<InputOTP.Separator />
								<InputOTP.Group>
									<InputOTP.Slot index={3} />
									<InputOTP.Slot index={4} />
									<InputOTP.Slot index={5} />
								</InputOTP.Group>
							</InputOTP.Root>
							<Field.FieldDescription>
								Enter the 6-digit code to verify your identity.
							</Field.FieldDescription>
						</Field.Field>
					</Field.FieldGroup>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Settings form with validation">
		{#snippet blurb()}
			A whole settings pane in one <code class="text-[87.5%] text-primary">FieldGroup</code>: text
			fields, an invalid one, two switch rows and a consent checkbox, split into three blocks by
			<code class="text-[87.5%] text-primary">FieldSeparator</code>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 7. Nothing here is a new part — it is the four shapes above stacked, and
					the point of the demo is that one group's gap and one separator are all the layout a
					form of this size needs.
				-->
				<div class="w-full max-w-xs">
					<Field.FieldGroup>
						<Field.Field>
							<Field.FieldLabel for="settings-name">
								Display Name <span class="text-destructive">*</span>
							</Field.FieldLabel>
							<Input id="settings-name" value="Alex Johnson" />
							<Field.FieldDescription>This is your public display name.</Field.FieldDescription>
						</Field.Field>
						<Field.Field data-invalid="true">
							<Field.FieldLabel for="settings-slug">URL Slug</Field.FieldLabel>
							<Input id="settings-slug" value="alex johnson" aria-invalid="true" />
							<Field.FieldError>
								Slug can only contain lowercase letters, numbers, and hyphens.
							</Field.FieldError>
						</Field.Field>
						<Field.Field>
							<div class="flex items-center justify-between">
								<Field.FieldLabel for="settings-bio">Bio</Field.FieldLabel>
								<span class="text-xs text-muted-foreground">{settingsBio.length}/160</span>
							</div>
							<Textarea
								id="settings-bio"
								maxlength={160}
								bind:value={settingsBio}
								class="min-h-20"
							/>
							<Field.FieldDescription>Brief description for your profile.</Field.FieldDescription>
						</Field.Field>
						<Field.FieldSeparator />
						<Field.Field orientation="horizontal">
							<Field.FieldContent>
								<Field.FieldTitle>Email Notifications</Field.FieldTitle>
								<Field.FieldDescription>
									Receive emails about account activity.
								</Field.FieldDescription>
							</Field.FieldContent>
							<Switch id="settings-email-notif" bind:checked={settingsEmailNotifications} />
						</Field.Field>
						<Field.Field orientation="horizontal">
							<Field.FieldContent>
								<Field.FieldTitle>Marketing Emails</Field.FieldTitle>
								<Field.FieldDescription>
									Receive emails about new features and tips.
								</Field.FieldDescription>
							</Field.FieldContent>
							<Switch id="settings-marketing" bind:checked={settingsMarketing} />
						</Field.Field>
						<Field.FieldSeparator />
						<Field.Field orientation="horizontal">
							<Checkbox id="settings-terms" bind:checked={settingsTerms} />
							<Field.FieldContent>
								<Field.FieldTitle>Terms of Service</Field.FieldTitle>
								<Field.FieldDescription>
									<!--
										Upstream's placeholder `href="#"` points at this route instead, for the
										reason `BreadcrumbPage.svelte` states once: a link that visibly goes
										nowhere teaches a reader the gallery is dead.
									-->
									I agree to the
									<a
										class="text-primary underline underline-offset-3"
										href={href("/components/field")}
									>
										Terms of Service
									</a>
									and
									<a
										class="text-primary underline underline-offset-3"
										href={href("/components/field")}
									>
										Privacy Policy
									</a>.
								</Field.FieldDescription>
							</Field.FieldContent>
						</Field.Field>
						<Button class="w-full">Save Changes</Button>
					</Field.FieldGroup>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Permission settings with checkboxes">
		{#snippet blurb()}
			One <code class="text-[87.5%] text-primary">FieldSet</code> whose legend and description caption
			the whole list, so each row only has to say what its own permission does.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 8. The disabled row is the reason the checkbox carries `disabled` and the
					field does not: `group-has-disabled/field:opacity-50` on the control already dims the
					`FieldContent` beside it, so a second `data-disabled` on the field would fade the
					same text twice.
				-->
				<div class="w-full max-w-xs">
					<Field.FieldGroup>
						<Field.FieldSet>
							<Field.FieldLegend variant="label">Access Permissions</Field.FieldLegend>
							<Field.FieldDescription>Configure what this role can access.</Field.FieldDescription>
							<Field.FieldGroup class="gap-4">
								<Field.Field orientation="horizontal">
									<Checkbox id="perm-read" bind:checked={permissionRead} />
									<Field.FieldContent>
										<Field.FieldTitle>Read</Field.FieldTitle>
										<Field.FieldDescription>
											View resources and data. Cannot make changes.
										</Field.FieldDescription>
									</Field.FieldContent>
								</Field.Field>
								<Field.Field orientation="horizontal">
									<Checkbox id="perm-write" bind:checked={permissionWrite} />
									<Field.FieldContent>
										<Field.FieldTitle>Write</Field.FieldTitle>
										<Field.FieldDescription>
											Create and edit resources. Requires read access.
										</Field.FieldDescription>
									</Field.FieldContent>
								</Field.Field>
								<Field.Field orientation="horizontal">
									<Checkbox id="perm-delete" bind:checked={permissionDelete} />
									<Field.FieldContent>
										<Field.FieldTitle>Delete</Field.FieldTitle>
										<Field.FieldDescription>
											Permanently remove resources. This action is irreversible.
										</Field.FieldDescription>
									</Field.FieldContent>
								</Field.Field>
								<Field.Field orientation="horizontal">
									<Checkbox id="perm-admin" checked={permissionAdmin} disabled />
									<Field.FieldContent>
										<Field.FieldTitle>Admin</Field.FieldTitle>
										<Field.FieldDescription>
											Full access to all settings. Only available to owners.
										</Field.FieldDescription>
									</Field.FieldContent>
								</Field.Field>
							</Field.FieldGroup>
						</Field.FieldSet>
					</Field.FieldGroup>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Responsive field layout">
		{#snippet blurb()}
			The invite dialog the responsive orientation is for: four label-beside-control rows that fold
			into a stack the moment the group is narrower than 28rem.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 9, and the applied version of the Responsive section above — same
					container query, but with the labels bare rather than in a `FieldContent`, so each
					row is a single line at both sizes.

					The trailing description and button row are `FieldGroup` children rather than
					`Field`s: neither labels a control, and putting them in the group is what keeps them
					on the same rhythm as the rows above.
				-->
				<div class="w-full max-w-lg">
					<Field.FieldGroup>
						<Field.Field orientation="responsive">
							<Field.FieldLabel for="resp-first">First Name</Field.FieldLabel>
							<Input id="resp-first" placeholder="First name" />
						</Field.Field>
						<Field.Field orientation="responsive">
							<Field.FieldLabel for="resp-last">Last Name</Field.FieldLabel>
							<Input id="resp-last" placeholder="Last name" />
						</Field.Field>
						<Field.Field orientation="responsive">
							<Field.FieldLabel for="resp-email">Email</Field.FieldLabel>
							<Input id="resp-email" type="email" placeholder="you@example.com" />
						</Field.Field>
						<Field.Field orientation="responsive">
							<Field.FieldLabel for="resp-role">Role</Field.FieldLabel>
							<Select.Root type="single" bind:value={inviteRole}>
								<Select.Trigger id="resp-role">{inviteRoleLabel}</Select.Trigger>
								<Select.Content>
									{#each inviteRoles as role (role.value)}
										<Select.Item value={role.value} label={role.label}>{role.label}</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</Field.Field>
						<Field.FieldSeparator />
						<Field.FieldDescription>
							The invited member will receive an email with a link to join.
						</Field.FieldDescription>
						<div class="flex justify-end gap-2">
							<Button variant="outline">Cancel</Button>
							<Button>Send Invite</Button>
						</div>
					</Field.FieldGroup>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Notification preferences form">
		{#snippet blurb()}
			Two sets, one separator: the channels a notification can arrive on, then the events worth
			sending. Switches on the trailing edge for a channel, checkboxes on the leading one for a list
			of events.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 10. Which side the control sits on is the whole convention here: a switch
					acts on the thing named beside it and follows the text, while a checkbox marks an item
					in a list and precedes it. Both rows are the same `orientation="horizontal"` field —
					only the child order differs.
				-->
				<div class="w-full max-w-xs">
					<Field.FieldGroup>
						<Field.FieldSet>
							<Field.FieldLegend variant="label">Notification Channels</Field.FieldLegend>
							<Field.FieldGroup class="gap-4">
								<Field.Field orientation="horizontal">
									<Field.FieldContent>
										<Field.FieldTitle>Push Notifications</Field.FieldTitle>
										<Field.FieldDescription>
											Alerts sent to your device in real time.
										</Field.FieldDescription>
									</Field.FieldContent>
									<Switch id="notif-push" bind:checked={prefsPush} />
								</Field.Field>
								<Field.Field orientation="horizontal">
									<Field.FieldContent>
										<Field.FieldTitle>Email Digest</Field.FieldTitle>
										<Field.FieldDescription>
											A daily summary of activity sent to your inbox.
										</Field.FieldDescription>
									</Field.FieldContent>
									<Switch id="notif-email" bind:checked={prefsEmailDigest} />
								</Field.Field>
								<Field.Field orientation="horizontal">
									<Field.FieldContent>
										<Field.FieldTitle>SMS Alerts</Field.FieldTitle>
										<Field.FieldDescription>
											Text messages for critical notifications only.
										</Field.FieldDescription>
									</Field.FieldContent>
									<Switch id="notif-sms" bind:checked={prefsSms} />
								</Field.Field>
							</Field.FieldGroup>
						</Field.FieldSet>
						<Field.FieldSeparator />
						<Field.FieldSet>
							<Field.FieldLegend variant="label">Notify me about</Field.FieldLegend>
							<Field.FieldGroup class="gap-4">
								<Field.Field orientation="horizontal">
									<Checkbox id="notif-comments" bind:checked={prefsComments} />
									<Field.FieldContent>
										<Field.FieldTitle>Comments</Field.FieldTitle>
										<Field.FieldDescription>
											When someone comments on your posts.
										</Field.FieldDescription>
									</Field.FieldContent>
								</Field.Field>
								<Field.Field orientation="horizontal">
									<Checkbox id="notif-mentions" bind:checked={prefsMentions} />
									<Field.FieldContent>
										<Field.FieldTitle>Mentions</Field.FieldTitle>
										<Field.FieldDescription>
											When someone mentions you in a conversation.
										</Field.FieldDescription>
									</Field.FieldContent>
								</Field.Field>
								<Field.Field orientation="horizontal">
									<Checkbox id="notif-product-updates" bind:checked={prefsProductUpdates} />
									<Field.FieldContent>
										<Field.FieldTitle>Product Updates</Field.FieldTitle>
										<Field.FieldDescription>
											News about new features and improvements.
										</Field.FieldDescription>
									</Field.FieldContent>
								</Field.Field>
							</Field.FieldGroup>
						</Field.FieldSet>
					</Field.FieldGroup>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Form with validation errors">
		{#snippet blurb()}
			A submitted form showing everything that is wrong at once.
			<code class="text-[87.5%] text-primary">FieldError</code> takes either a message or a list of them,
			and renders the list as bullets so two rules about one field cannot read as one sentence.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 11. This
					repository has one icon set, so the icons are Lucide members. No size class on either — `InputGroup.Addon` sizes the icons it contains.
				-->
				<div class="w-full max-w-xs">
					<Field.FieldGroup>
						<Field.Field data-invalid="true">
							<Field.FieldLabel for="val-email">
								Email <span class="text-destructive">*</span>
							</Field.FieldLabel>
							<InputGroup.Root>
								<InputGroup.Addon>
									<MailIcon aria-hidden="true" />
								</InputGroup.Addon>
								<InputGroup.Input
									id="val-email"
									type="email"
									value="invalid-email"
									placeholder="you@example.com"
									aria-invalid="true"
								/>
							</InputGroup.Root>
							<Field.FieldError>Please enter a valid email address.</Field.FieldError>
						</Field.Field>
						<Field.Field data-invalid="true">
							<Field.FieldLabel for="val-password">
								Password <span class="text-destructive">*</span>
							</Field.FieldLabel>
							<InputGroup.Root>
								<InputGroup.Addon>
									<LockIcon aria-hidden="true" />
								</InputGroup.Addon>
								<InputGroup.Input
									id="val-password"
									type="password"
									value="short"
									placeholder="Enter password"
									aria-invalid="true"
								/>
							</InputGroup.Root>
							<Field.FieldError
								errors={[
									{ message: "Must be at least 8 characters." },
									{ message: "Must contain at least one number." },
								]}
							/>
						</Field.Field>
						<Field.Field>
							<Field.FieldLabel for="val-confirm">Confirm Password</Field.FieldLabel>
							<InputGroup.Root>
								<InputGroup.Addon>
									<LockIcon aria-hidden="true" />
								</InputGroup.Addon>
								<InputGroup.Input id="val-confirm" type="password" placeholder="Repeat password" />
							</InputGroup.Root>
							<Field.FieldDescription>Re-enter your password to confirm.</Field.FieldDescription>
						</Field.Field>
						<Button class="w-full">Create Account</Button>
					</Field.FieldGroup>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Classic form group">
		{#snippet blurb()}
			The only shape the classic theme documents a label in, and the reason this page's primitive
			has no classic counterpart: <code class="text-[87.5%] text-primary">.form-group</code>
			holding a
			<code class="text-[87.5%] text-primary">.form-label</code> above a
			<code class="text-[87.5%] text-primary">.form-control</code> is a margin rhythm, not a part that
			knows anything about the control it wraps.
		{/snippet}
		<Card.Root>
			<Card.Content>
				{#each formGroupFields as field (field.id)}
					<!--
						`.form-group` is a classic addition, not a classic 5 class — the classic framework dropped it
						at v5 and the reference stylesheet puts it back as
						`margin-bottom: form-group-margin-bottom` (1.375rem). No spacing token holds 22px,
						hence the arbitrary value.

						`last:mb-0` departs from the classic theme, which keeps the margin on every group: its own
						example ends with a submit button that needs the gap. Here the last field is the
						last thing in the card, so the margin would only double the card's own padding.
					-->
					<div class="mb-[1.375rem] last:mb-0">
						<Label for={field.id} class={fieldLabel}>{field.label}</Label>
						<Input id={field.id} type={field.type} placeholder={field.placeholder} />
					</div>
				{/each}
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Label for a textarea field">
		{#snippet blurb()}
			Nothing about the label changes when the control is multi-line: the
			<code class="text-[87.5%] text-primary">for</code> attribute reaches a
			<code class="text-[87.5%] text-primary">&lt;textarea&gt;</code> exactly as it reaches an input,
			and the field's own gap still sets the distance between them.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 3 — the label serves a multi-line control the same way. -->
				<Field.Field class="max-w-xs">
					<Field.FieldLabel for="label-message">Message</Field.FieldLabel>
					<Textarea id="label-message" placeholder="Type your message here…" />
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Label in a disabled state">
		{#snippet blurb()}
			The label half of the Disabled section above, on its own — and the reason the sections here
			call <code class="text-[87.5%] text-primary">FieldLabel</code> rather than the bare
			<code class="text-[87.5%] text-primary">Label</code>. Only the first keys its fade to the
			enclosing field, so only the first actually dims.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 4. The fade is `group-data-[disabled=true]/field:opacity-50` in
					`field-label.svelte`, keyed on the `group/field` marker `field.svelte` sets;
					`label.svelte`'s own unnamed `group-data-[disabled=true]:opacity-50` looks for a plain
					`group` class the Field does not carry, so a bare Label here would stay lit. The input
					carries its native `disabled` separately.
				-->
				<Field.Field data-disabled class="max-w-xs">
					<Field.FieldLabel for="label-disabled">Disabled Field</Field.FieldLabel>
					<Input id="label-disabled" placeholder="Disabled input…" disabled />
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Label with required indicator">
		{#snippet blurb()}
			The asterisk convention isolated from the forms above: a
			<code class="text-[87.5%] text-primary">text-destructive</code> star inside the label, rather than
			any styling on the field.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 13 over demo 5. Both ports put the star inside the label, so the
					Field-built one wins the tie. `required` is the label port's, the only one of the two
					that backed the asterisk with the constraint it announces.
				-->
				<Field.Field class="max-w-xs">
					<Field.FieldLabel for="label-required">
						Company <span class="text-destructive">*</span>
					</Field.FieldLabel>
					<Input id="label-required" placeholder="Wotso Inc." required />
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Label with optional indicator">
		{#snippet blurb()}
			The quiet way to mark a field optional — a muted parenthetical inside the label, where the
			Input page's badge version pushes a <code class="text-[87.5%] text-primary">Badge</code> to the
			far edge of the label's row.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 6, and NOT a duplicate of demo 18: there are two optional markers, a
					muted parenthetical and a badge, and they are different components in different places.
					Both survive, one per page.
				-->
				<Field.Field class="max-w-xs">
					<Field.FieldLabel for="label-optional">
						Phone number <span class="text-muted-foreground">(optional)</span>
					</Field.FieldLabel>
					<Input id="label-optional" type="tel" placeholder="+1 (555) 000-0000" />
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Label with tooltip info icon">
		{#snippet blurb()}
			A help icon inside the label, so it dims with the caption when the field is disabled instead
			of staying lit beside it.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 7 over demo 16, which sets the same icon in a `div` beside the label
					and then repeats the tooltip's sentence as a visible FieldDescription — the icon belongs
					to the caption, and a tooltip that duplicates text already on screen is not a tooltip.

					The trigger is a real button (bits-ui renders one), so the tooltip also opens on keyboard
					focus; `cursor-help` on the inner span keeps the upstream pointer affordance.
				-->
				<Field.Field class="max-w-xs">
					<Field.FieldLabel for="label-tooltip" class="gap-1">
						API Key
						<Tooltip.Provider>
							<Tooltip.Root>
								<Tooltip.Trigger class="inline-flex items-center">
									<span class="inline-flex cursor-help text-muted-foreground">
										<InfoIcon class="size-3.5" />
									</span>
								</Tooltip.Trigger>
								<Tooltip.Content>
									<p>Your API key can be found in the developer settings.</p>
								</Tooltip.Content>
							</Tooltip.Root>
						</Tooltip.Provider>
					</Field.FieldLabel>
					<Input id="label-tooltip" placeholder="sk_live_..." class="font-mono" />
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Label with badge indicator">
		{#snippet blurb()}
			A status badge riding inside the label rather than beside it, so the caption stays one node
			and the badge answers to every state the label does.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 8 over demo 17, which sets the badge in a `div` next to the label.
					The light-badge idea becomes the house soft family's
					`success-subtle`; this Badge has a single fixed height, so no size prop.
				-->
				<Field.Field class="max-w-xs">
					<Field.FieldLabel for="label-badge">
						Webhook URL
						<Badge variant="success-subtle">Active</Badge>
					</Field.FieldLabel>
					<Input
						id="label-badge"
						type="url"
						value="https://api.example.com/webhooks"
						class="font-mono text-xs"
					/>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Label with character counter">
		{#snippet blurb()}
			The second answer to the label-plus-readout row: the counter INSIDE the label, spread by
			<code class="text-[87.5%] text-primary">justify-between</code>, where "Field with input and
			textarea" above builds the same row from a sibling
			<code class="text-[87.5%] text-primary">div</code>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 9 over demo 6. Both put a counter on the label's row; only this one
					puts it in the label, which is what makes it dim with the label when the field goes
					`data-disabled` — the `div` row above leaves its counter at full opacity, nothing on a
					plain sibling reading the field's state.

					`w-full` is what `justify-between` needs: FieldLabel is `w-fit`, and a shrink-wrapped
					row has no free space to spread. `maxlength` caps the textarea; the counter derives from
					the bound value rather than from a change handler.
				-->
				<Field.Field class="max-w-xs">
					<Field.FieldLabel for="label-counter" class="w-full justify-between">
						Bio
						<span class="text-muted-foreground">{labelCounterBio.length}/200</span>
					</Field.FieldLabel>
					<Textarea
						id="label-counter"
						placeholder="Tell us about yourself…"
						maxlength={200}
						bind:value={labelCounterBio}
					/>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Label with helper description text">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">FieldDescription</code> read as a sub-caption — tucked under
			the label, above the control — where every field above uses the same part as a footnote below it.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 10 over demo 3, which is label, control, description: the card at the
					top of this page and every demo form between, so a section of it would demonstrate
					nothing. The `div` is what buys the other reading — it tightens the pair to `gap-1`
					against the field's own `gap-2`, so the two lines read as one caption rather than as two
					children of the field.

					Not a `FieldContent`: that part carries `flex-1` for the leading column of a horizontal
					row, which is not what a vertical field wants.
				-->
				<Field.Field class="max-w-xs">
					<div class="flex flex-col gap-1">
						<Field.FieldLabel for="label-helper">API Key</Field.FieldLabel>
						<Field.FieldDescription>Your secret key for API authentication</Field.FieldDescription>
					</div>
					<Input id="label-helper" placeholder="sk_live_..." class="font-mono" />
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Label with error state">
		{#snippet blurb()}
			The Validation section's two attributes on a field that is wrong from first paint:
			<code class="text-[87.5%] text-primary">data-invalid</code> turns the label destructive,
			<code class="text-[87.5%] text-primary">aria-invalid</code> recolours the control's border.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 11 over demo 5, which marks only the control: invalidity styles two
					surfaces and has to be stated on both, the argument the Validation section above already
					makes at length.
				-->
				<Field.Field data-invalid="true" class="max-w-xs">
					<Field.FieldLabel for="label-error">Email</Field.FieldLabel>
					<Input id="label-error" type="email" value="invalid-email" aria-invalid="true" />
					<Field.FieldError>Please enter a valid email address</Field.FieldError>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Label with inline edit toggle">
		{#snippet blurb()}
			A control inside the label rather than a decoration: the pencil swaps the field's read-only
			description for an input, and the tick swaps it back.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 12, which the Input page never ported. Focusing the freshly mounted input is
					the point of the toggle, hence the autofocus the a11y lint would otherwise flag.
				-->
				<Field.Field class="max-w-xs">
					<Field.FieldLabel for="label-inline-edit">
						Project Name
						<Button
							size="icon-xs"
							variant="ghost"
							onclick={() => (labelInlineEditEditing = !labelInlineEditEditing)}
						>
							{#if labelInlineEditEditing}
								<CheckIcon class="size-3.5" />
							{:else}
								<PencilIcon class="size-3.5" />
							{/if}
						</Button>
					</Field.FieldLabel>
					{#if labelInlineEditEditing}
						<!-- svelte-ignore a11y_autofocus -->
						<Input id="label-inline-edit" bind:value={labelInlineEditValue} autofocus />
					{:else}
						<Field.FieldDescription>{labelInlineEditValue}</Field.FieldDescription>
					{/if}
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Label with status indicator dot">
		{#snippet blurb()}
			A live state carried by the caption itself — a pinging dot in the label, over a read-only
			field holding the value it reports.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 13, which the Input page never ported. Upstream paints the dot
					`bg-green-400`/`bg-green-500`; both halves take the `--success` token here, the ping
					ring distinguished by its opacity alone.
				-->
				<Field.Field class="max-w-xs">
					<Field.FieldLabel for="label-status" class="gap-1.5">
						Server Status
						<span class="relative flex size-2">
							<span
								class="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-75"
							></span>
							<span class="relative inline-flex size-2 rounded-full bg-success"></span>
						</span>
					</Field.FieldLabel>
					<Input id="label-status" value="Online" disabled />
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
