<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
	import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
	import EyeIcon from "@lucide/svelte/icons/eye";
	import EyeOffIcon from "@lucide/svelte/icons/eye-off";
	import InfoIcon from "@lucide/svelte/icons/info";
	import TriangleAlertIcon from "@lucide/svelte/icons/triangle-alert";
	import XIcon from "@lucide/svelte/icons/x";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Button, buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { href } from "$lib/hooks/route.svelte.js";

	/**
	 * The Input component page. The first five examples follow shadcn-svelte's own documentation
	 * (https://shadcn-svelte.com/docs/components/input) in its order — default, file, disabled,
	 * with label, with button — and the sections from "Input with password type" down extend the
	 * set with the field's remaining types, states and compositions.
	 *
	 * THE FIELD'S BOX IS A THEME DECISION, not a page one: it is taller than the stock shadcn
	 * input, carries more padding on each side and no shadow, and answers focus by changing one
	 * border colour where the stock field draws a 3px ring. Its horizontal padding is symmetric,
	 * so a long value never runs into its own border.
	 */

	/**
	 * WHERE THE FIELD RECIPE LIVES. Not here — it is stated once in `app.css`, on
	 * `[data-slot='input']` and `[data-slot='textarea']`, with the full derivation of every
	 * value beside it. It began life as a constant on this page, which was wrong: the recipe is
	 * not a variant a documentation page opts into, it is what a text field looks like in this
	 * theme, and written here it reached this page and nothing else while the twenty other fields
	 * in the app kept shadcn's box and its 3px focus ring.
	 *
	 * The examples below therefore pass no classes of their own beyond layout. What follows is
	 * the one part of the recipe that IS local, the file button, plus the notes that belong to
	 * this page rather than to the rule.
	 *
	 * The placeholder keeps shadcn's `placeholder:text-muted-foreground`: the theme declares no
	 * separate placeholder token, the same trade the Progress track and the Switch ground
	 * already make.
	 */

	/**
	 * `input[type=file]`, on top of the global field recipe.
	 *
	 * The file button is drawn as a full-height segment flush against the field's left edge,
	 * separated from the value by a 1px rule in the field's own border colour. shadcn instead
	 * draws a short `h-7` transparent chip with no divider, so the whole segment has to be
	 * restated.
	 *
	 *   file:-my-2 file:-ms-3 file:me-3 file:h-auto file:px-3 file:py-2
	 *     the negative margins cancel the field's own padding so the button fills the border box
	 *     edge to edge, then `me-3` re-opens the field's horizontal padding between the button
	 *     and the value. `h-auto` evicts shadcn's `file:h-7`; the height then follows from the
	 *     padding, and lands on the field's 38px inner box.
	 *
	 *   file:border-solid file:border-e file:border-inherit
	 *     `inherit` rather than `border-input` on purpose: it means the divider turns the focus
	 *     border colour along with the rest of the border while the field is focused.
	 *     `border-solid` is stated because the width utilities alone leave the UA's own button
	 *     border style in place on the pseudo-element.
	 *
	 *   file:bg-accent hover:file:bg-secondary
	 *     the button rests on the accent step and hovers one step deeper. `--secondary` is the
	 *     hover rather than `--muted` for a dark-mode reason: `--muted` and `--accent` hold the
	 *     same value in dark, which would leave the button with no hover feedback at all.
	 *
	 *   file:font-normal
	 *     the button keeps the body weight (400) where shadcn asks for `font-medium`.
	 *     `file:text-sm` needs nothing: it is .9375rem here, and the button inherits the
	 *     field's type size.
	 *
	 *   file:pointer-events-none / cursor-pointer / overflow-hidden
	 *     the button is a label — the click target is the whole field, which `cursor-pointer`
	 *     then advertises. `overflow: hidden` is what keeps the negatively-margined button
	 *     inside the field's corner radius.
	 */
	const fileControl =
		"cursor-pointer overflow-hidden file:pointer-events-none file:-my-2 file:-ms-3 file:me-3 file:h-auto file:border-e file:border-solid file:border-inherit file:bg-accent file:px-3 file:py-2 file:font-normal hover:file:bg-secondary";

	/**
	 * Form labels keep the body's 15px and its 400 weight where shadcn's `Label` asks for
	 * `font-medium` — the same `font-normal` correction the Switch page makes, and the same
	 * reason.
	 *
	 * The 8px under the label is expressed as `gap-2` on the flex column rather than as a
	 * margin on the label, which is why the shadcn docs' `gap-1.5` becomes `gap-2` in the two
	 * labelled examples.
	 */
	const label = "font-normal";

	/**
	 * The Subscribe button. shadcn's docs use its `outline` variant, whose classic counterpart is
	 * `.btn-white` — the classic theme's own answer to `.btn-light` being unusable over light grounds,
	 * derived on the Buttons page. `h-10` is the base `btn-*` size from the same derivation, so
	 * the button and the field above resolve to the same 40px.
	 */
	const button = cn(
		buttonVariants(),
		"h-10 rounded-md px-3 text-sm font-normal",
		"border-border bg-card text-card-foreground hover:bg-accent dark:hover:bg-background",
	);

	/**
	 * THE PATTERN APPENDIX. Everything from "Input with password type" down is the input demo
	 * set — the same continuation the Textarea page
	 * makes after its shadcn half. Four demos are not repeated because a section above already
	 * shows the same composition: demo 1 is the intro card, demo 2 is
	 * "With label", demo 4 is "Disabled" and demo 12 is "File".
	 *
	 * SIX MORE ARE NOT HERE BECAUSE THEY WERE NEVER ABOUT THE INPUT. demo 3 (helper
	 * description), demo 5 (error message), demo 6 (character counter),
	 * demo 13 (required indicator), demo 16 (label tooltip) and demo 17
	 * (label badge) each decorate the LABEL of a field, and the label set covers the same six
	 * subjects a second time. `FieldPage.svelte` has absorbed the Label page, resolved all six
	 * pairs to one version each and records which won, so that is
	 * where they live now. What is left here is what the input itself does — its types, its box
	 * and its states.
	 *
	 * demo 18 below is not one of those pairs and stayed: the optional BADGE and the
	 * label set's muted `(optional)` are two different markers in two different places, so the two
	 * pages keep one each.
	 *
	 * Every demo builds on the Field primitives: this repository's
	 * `$lib/components/ui/field/` exports all the part names, so Field / FieldLabel / FieldError
	 * compose directly. The one house correction rides along on every FieldLabel:
	 * `class={label}` — the same `.form-label` weight note the "With label" section above records.
	 */

	/**
	 * The complex form's country select, from demo 15. bits-ui's Select keeps value and
	 * display apart — the trigger renders whatever it is given — so the upstream `<SelectValue />`
	 * becomes this derived label, the same translation every Select on the Select page makes.
	 */
	const inputFormCountries = [
		{ value: "us", label: "United States" },
		{ value: "uk", label: "United Kingdom" },
		{ value: "ca", label: "Canada" },
	];
	let inputFormCountry = $state("us");
	const inputFormCountryLabel = $derived(
		inputFormCountries.find((c) => c.value === inputFormCountry)?.label ?? "Select a country",
	);

	/**
	 * The eye button both password-reveal demos share — demo 19 and demo 23 state the same
	 * class string, so it is hoisted once like `label` above. Every
	 * colour in it is already semantic and it ports verbatim; the icon inside is sized at the
	 * call site (`size-4`, upstream's default) because the button is page markup, not a
	 * component that sizes its own icons.
	 */
	const inputVisibilityToggle =
		"absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 outline-none transition-[color,box-shadow] hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50";

	/** Visibility state for the label-with-link demo, from demo 19. */
	let inputLinkPasswordVisible = $state(false);

	/**
	 * The basic strength meter, from demo 22. The raw hues the picture suggests — emerald for
	 * the "strong" state, amber for "almost" — are not used, because the house rule is
	 * semantic tokens only (docs/CONVENTIONS.md §8), so they land on `--success` and
	 * `--warning` — the same two steps the Badge's soft family reads.
	 */
	let inputHintPassword = $state("");
	const inputHintMetCount = $derived(
		[
			inputHintPassword.length >= 8,
			/[0-9]/.test(inputHintPassword),
			/[!@#$%^&*]/.test(inputHintPassword),
		].filter(Boolean).length,
	);
	const inputHintStatus = $derived.by(() => {
		if (!inputHintPassword) {
			return {
				color: "text-muted-foreground",
				icon: InfoIcon,
				hint: "Use 8+ characters with a number and a special character.",
			};
		}
		if (inputHintMetCount === 3) {
			return {
				color: "text-success",
				icon: CircleCheckIcon,
				hint: "Strong password. You're all set!",
			};
		}
		if (inputHintMetCount === 2) {
			return {
				color: "text-warning",
				icon: TriangleAlertIcon,
				hint: "Almost there! Add the missing requirement.",
			};
		}
		return {
			color: "text-destructive",
			icon: TriangleAlertIcon,
			hint: "Weak password. Include 8+ characters, a number, and a special character.",
		};
	});

	/**
	 * The advanced strength meter, from demo 23. Upstream grades its five-segment bar
	 * through five raw hues — red, orange, amber, green, emerald — which the semantic-tokens
	 * rule forbids. The theme's status vocabulary has three negative-to-positive steps, and
	 * upstream's own caption ramp is also three steps (weak / medium / strong at ≤2 / ≤4 / 5),
	 * so the bar follows the captions: `--destructive`, `--warning`, `--success`. The met-state
	 * greens (`text-emerald-500` / `-600`) collapse onto `--success` the same way.
	 */
	const inputStrengthRequirements = [
		{ regex: /.{8,}/, text: "At least 8 characters" },
		{ regex: /[0-9]/, text: "At least 1 number" },
		{ regex: /[a-z]/, text: "At least 1 lowercase letter" },
		{ regex: /[A-Z]/, text: "At least 1 uppercase letter" },
		{ regex: /[!@#$%^&*(),.?":{}|<>]/, text: "At least 1 special character" },
	];
	let inputStrengthPassword = $state("");
	let inputStrengthVisible = $state(false);
	const inputStrengthChecks = $derived(
		inputStrengthRequirements.map((req) => ({
			met: req.regex.test(inputStrengthPassword),
			text: req.text,
		})),
	);
	const inputStrengthScore = $derived(inputStrengthChecks.filter((req) => req.met).length);
	const inputStrengthColor = $derived(
		inputStrengthScore <= 2
			? "bg-destructive"
			: inputStrengthScore <= 4
				? "bg-warning"
				: "bg-success",
	);
	const inputStrengthText = $derived(
		inputStrengthScore === 0
			? "Enter a password"
			: inputStrengthScore <= 2
				? "Weak security"
				: inputStrengthScore <= 4
					? "Medium security"
					: "Strong security",
	);

	/** Focus state for the pulsed-background demo, from demo 24. */
	let inputPulsedFocused = $state(false);

	/** Value for the range demo, from demo 29 — Svelte's range binding keeps it numeric. */
	let inputRangeValue = $state(50);
</script>

<DocPage title="Input">
	{#snippet subtitle()}
		Displays a form input field or a component that looks like an input field. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/input"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<Input type="email" placeholder="Email" class="max-w-xs" />
		</Card.Content>
	</Card.Root>

	<DocSection title="File">
		{#snippet blurb()}
			The file input, whose button segment is the base framework's rather than the theme's — nothing
			in the classic theme's Sass touches it.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="grid w-full max-w-sm items-center gap-2">
					<Label for="picture" class={label}>Picture</Label>
					<Input id="picture" type="file" class={fileControl} />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Disabled">
		{#snippet blurb()}
			The classic theme gives a disabled field the same background, border and text colour as an
			enabled one, so the only cue left is that it cannot be focused or typed into.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Input disabled type="email" placeholder="Email" class="max-w-sm" />
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With label">
		{#snippet blurb()}
			A label above its field, the shape the classic theme's own Forms card uses for every input.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex w-full max-w-sm flex-col gap-2">
					<Label for="email" class={label}>Email</Label>
					<Input type="email" id="email" placeholder="Email" />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="With button">
		{#snippet blurb()}
			A field and a button side by side. The classic theme's own answer to this is
			<code class="text-[87.5%] text-primary">.input-group</code>, which merges the two into one
			outline; the shadcn example keeps them apart, so this is a plain flex row.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`gap-2` rather than the `.input-group`'s zero: the classic theme joins the two controls and
					removes the seam (`.input-group > :not(:first-child) { margin-left: 0 }`), which
					is a different component from the one shadcn documents here.

					`items-center` leaves a half-pixel: the field's true the classic theme height is 40.5px and
					the button's is the same 40.5px, and both round to 40px, so the two agree.
				-->
				<div class="flex w-full max-w-sm items-center gap-2">
					<Input type="email" placeholder="Email" />
					<button type="submit" class={button}>Subscribe</button>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input with password type">
		{#snippet blurb()}
			The browser's own masked field. The visibility toggle is a separate, later demo; this one is
			the bare type.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Field.FieldLabel class={label} for="input-demo-password">Password</Field.FieldLabel>
					<Input id="input-demo-password" type="password" placeholder="Password" />
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input with phone type">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">type="tel"</code> for the mobile keypad, with no masking.
			The Phone input page is where the formatting version lives.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Field.FieldLabel class={label} for="input-demo-tel">Phone</Field.FieldLabel>
					<Input id="input-demo-tel" type="tel" placeholder="+1 (555) 123-4567" />
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input with URL type">
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Field.FieldLabel class={label} for="input-demo-url">URL</Field.FieldLabel>
					<Input id="input-demo-url" type="url" placeholder="https://example.com" />
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input with number type">
		{#snippet blurb()}
			The Number field page has the stepper-button version; this is the bare control.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Field.FieldLabel class={label} for="input-demo-number">Number</Field.FieldLabel>
					<Input id="input-demo-number" type="number" placeholder="123" />
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input with date type">
		{#snippet blurb()}
			The user agent's own date picker. The Calendar and Date selector pages hold the composed
			alternatives.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Field.FieldLabel class={label} for="input-demo-date">Date</Field.FieldLabel>
					<Input id="input-demo-date" type="date" />
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input with time type">
		<Card.Root>
			<Card.Content>
				<Field.Field class="max-w-xs">
					<Field.FieldLabel class={label} for="input-demo-time">Time</Field.FieldLabel>
					<Input id="input-demo-time" type="time" />
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Complex input form with multiple fields">
		{#snippet blurb()}
			Two columns, a select among the inputs, and a footer of actions.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`preventDefault` is deliberate:
					a real submit would navigate the SPA away.

					The trigger takes `w-full` because the house trigger's base is `w-fit`,
					so without it the Country column would shrink-wrap
					"United States" instead of matching the Phone field beside it.
				-->
				<form class="w-full" onsubmit={(event) => event.preventDefault()}>
					<Field.FieldGroup>
						<div class="grid grid-cols-2 gap-4">
							<Field.Field>
								<Field.FieldLabel class={label} for="form-phone">Phone</Field.FieldLabel>
								<Input id="form-phone" type="tel" placeholder="+1 (555) 123-4567" />
							</Field.Field>
							<Field.Field>
								<Field.FieldLabel class={label} for="form-country">Country</Field.FieldLabel>
								<Select.Root type="single" bind:value={inputFormCountry}>
									<Select.Trigger id="form-country" class="w-full">
										{inputFormCountryLabel}
									</Select.Trigger>
									<Select.Content>
										{#each inputFormCountries as country (country.value)}
											<Select.Item value={country.value} label={country.label}>
												{country.label}
											</Select.Item>
										{/each}
									</Select.Content>
								</Select.Root>
							</Field.Field>
						</div>
						<Field.Field>
							<Field.FieldLabel class={label} for="form-address">Address</Field.FieldLabel>
							<Input id="form-address" type="text" placeholder="123 Main St" />
						</Field.Field>
						<div class="flex justify-end gap-3 pt-4">
							<Button type="button" variant="outline">Cancel</Button>
							<Button type="submit">Submit</Button>
						</div>
					</Field.FieldGroup>
				</form>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input label with optional badge">
		{#snippet blurb()}
			The badge pushed to the far edge to mark a field optional.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					The obvious ask is `variant="warning-outline" size="sm"`. The house Badge has neither
					an outline state family nor a size prop — one badge size, per the registry
					component — so the nearest house variant is the soft `warning-subtle`
					(docs/CONVENTIONS.md §3), the same family substitution `FieldPage.svelte` makes
					in "Label with badge indicator".

					The blurb says "the far edge" because that is the whole difference from the muted
					`(optional)` marker on the Field page: same job, a Badge instead of a word, and
					`justify-between` instead of the label's own inline gap.
				-->
				<Field.Field class="max-w-xs">
					<div class="flex items-center justify-between gap-2">
						<Field.FieldLabel class={label} for="middle-name">Middle Name</Field.FieldLabel>
						<Badge variant="warning-subtle">Optional</Badge>
					</div>
					<Input id="middle-name" placeholder="Alexander" />
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input label with link and visibility toggle">
		{#snippet blurb()}
			A "Forgot password?" link opposite the label, and the eye button the plain password section
			above deferred.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`pe-9!` where upstream writes `pe-9`: the `.form-control` recipe in `app.css` is
					unlayered, so its `padding-inline` outranks any un-important utility — the `!`
					escape that recipe's own comment prescribes for call-site departures. Same on
					every padding, background and height override in the sections below.

					The link points at this page's own route, not upstream's `href="#"` — a link that
					goes nowhere reads as a dead gallery. The Breadcrumb page's standing correction.
				-->
				<Field.Field class="w-full max-w-xs">
					<div class="flex items-center justify-between">
						<Field.FieldLabel class={label} for="password-link">Password</Field.FieldLabel>
						<a
							href={href("/components/input")}
							class="text-xs font-medium text-primary hover:underline"
						>
							Forgot password?
						</a>
					</div>
					<div class="relative">
						<Input
							id="password-link"
							type={inputLinkPasswordVisible ? "text" : "password"}
							class="pe-9!"
						/>
						<button
							type="button"
							class={inputVisibilityToggle}
							aria-label={inputLinkPasswordVisible ? "Hide password" : "Show password"}
							aria-pressed={inputLinkPasswordVisible}
							onclick={() => (inputLinkPasswordVisible = !inputLinkPasswordVisible)}
						>
							{#if inputLinkPasswordVisible}
								<EyeOffIcon aria-hidden="true" class="size-4" />
							{:else}
								<EyeIcon aria-hidden="true" class="size-4" />
							{/if}
						</button>
					</div>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input with horizontal orientation">
		{#snippet blurb()}
			Label and field on one row, through Field's horizontal orientation.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field orientation="horizontal" class="w-full max-w-xs">
					<Field.FieldLabel class={cn(label, "w-24")} for="horizontal-name">Name</Field.FieldLabel>
					<Input id="horizontal-name" placeholder="John Doe" />
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input with multiple error messages">
		{#snippet blurb()}
			Several failed rules listed under one invalid field.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Slotted children rather than FieldError's `errors` array, because each row
					carries an icon the array form cannot render. Upstream's `space-y-1.5` becomes
					`flex flex-col gap-1.5` per docs/CONVENTIONS.md §8.
				-->
				<Field.Field class="max-w-xs">
					<Field.FieldLabel class={label} for="security-code">Security Code</Field.FieldLabel>
					<Input id="security-code" placeholder="Enter your security code" aria-invalid="true" />
					<Field.FieldError class="mt-2 flex flex-col gap-1.5 text-xs">
						<div class="flex items-center gap-1.5">
							<CircleAlertIcon class="size-3.5" />
							<span>Code must be at least 12 characters long</span>
						</div>
						<div class="flex items-center gap-1.5">
							<CircleAlertIcon class="size-3.5" />
							<span>Code must contain at least one uppercase letter</span>
						</div>
						<div class="flex items-center gap-1.5">
							<CircleAlertIcon class="size-3.5" />
							<span>Code cannot include common words or patterns</span>
						</div>
					</Field.FieldError>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Basic password strength with dynamic hint and icons">
		{#snippet blurb()}
			One sentence of feedback that recolours as requirements are met; the token mapping is derived
			with the state in the script block.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="w-full max-w-xs">
					<Field.FieldLabel class={label} for="input-demo-strength-basic">Password</Field.FieldLabel
					>
					<Input
						id="input-demo-strength-basic"
						type="password"
						bind:value={inputHintPassword}
						placeholder="Enter password"
					/>
					<div
						class={cn(
							"flex items-center gap-2 text-xs transition-colors duration-200",
							inputHintStatus.color,
						)}
					>
						<inputHintStatus.icon aria-hidden="true" class="size-3.5 shrink-0" />
						<p>{inputHintStatus.hint}</p>
					</div>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Advanced password strength indicator with progress">
		{#snippet blurb()}
			Five requirement rules, a segmented meter and a live checklist; the five-hue bar collapses
			onto the three status tokens, as the script block records.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Upstream's toggle carries `aria-controls="password"`, an id that exists nowhere
					in its own demo — dropped rather than reproduced; `aria-pressed` and the label
					already say everything the attribute tried to.
				-->
				<div class="w-full max-w-xs">
					<Field.Field>
						<Field.FieldLabel class={label} for="input-demo-strength-advanced">
							Secure Password
						</Field.FieldLabel>
						<div class="relative">
							<Input
								id="input-demo-strength-advanced"
								aria-describedby="input-demo-strength-advanced-description"
								class="pe-9!"
								type={inputStrengthVisible ? "text" : "password"}
								bind:value={inputStrengthPassword}
								placeholder="Create a strong password"
							/>
							<button
								type="button"
								class={inputVisibilityToggle}
								aria-label={inputStrengthVisible ? "Hide password" : "Show password"}
								aria-pressed={inputStrengthVisible}
								onclick={() => (inputStrengthVisible = !inputStrengthVisible)}
							>
								{#if inputStrengthVisible}
									<EyeOffIcon aria-hidden="true" class="size-4" />
								{:else}
									<EyeIcon aria-hidden="true" class="size-4" />
								{/if}
							</button>
						</div>
					</Field.Field>

					<div
						role="progressbar"
						aria-label="Password strength"
						aria-valuemin={0}
						aria-valuemax={5}
						aria-valuenow={inputStrengthScore}
						class="mt-3 mb-4 flex gap-1"
					>
						{#each { length: 5 } as _, segment (segment)}
							<div
								class={cn(
									"h-1 flex-1 rounded-full transition-colors duration-500",
									segment < inputStrengthScore ? inputStrengthColor : "bg-border",
								)}
							></div>
						{/each}
					</div>

					<div class="mb-3 flex items-center justify-between">
						<p
							class="text-sm font-medium text-foreground"
							id="input-demo-strength-advanced-description"
						>
							{inputStrengthText}
						</p>
						<span class="text-xs text-muted-foreground">
							{inputStrengthScore}/5 requirements met
						</span>
					</div>

					<ul aria-label="Password requirements" class="flex flex-col gap-1.5">
						{#each inputStrengthChecks as req (req.text)}
							<li class="flex items-center gap-1">
								{#if req.met}
									<CheckIcon aria-hidden="true" class="size-3.5 text-success" />
								{:else}
									<XIcon aria-hidden="true" class="size-3.5 text-muted-foreground/60" />
								{/if}
								<span
									class={cn(
										"text-xs transition-colors",
										req.met ? "text-success" : "text-muted-foreground",
									)}
								>
									{req.text}
									<span class="sr-only">
										{req.met ? " - Requirement met" : " - Requirement not met"}
									</span>
								</span>
							</li>
						{/each}
					</ul>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input with pulsed background animation">
		{#snippet blurb()}
			A primary-tinted pulse behind the field that settles once it takes focus.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					The field must go transparent for the pulsing layer behind it to show, and the
					unlayered recipe fills it with `--card`, hence `bg-transparent!`. On focus the
					house fill comes back per mode — `--card` light, `--input` dark, the recipe's
					own pair — where upstream restores `bg-background`; both importants, and the
					focus-visible pair wins on specificity.
				-->
				<Field.Field class="max-w-xs">
					<Field.FieldLabel class={label} for="pulsed-input">Pulsed Background</Field.FieldLabel>
					<div class="relative">
						<div
							class={cn(
								"pointer-events-none absolute inset-0 rounded-md bg-primary/20 transition-opacity duration-300",
								inputPulsedFocused ? "opacity-0" : "animate-pulse",
							)}
						></div>
						<Input
							id="pulsed-input"
							placeholder="Animation stops on focus..."
							onfocus={() => (inputPulsedFocused = true)}
							onblur={() => (inputPulsedFocused = false)}
							class="relative bg-transparent! transition-colors duration-300 focus-visible:bg-card! dark:focus-visible:bg-input!"
						/>
					</div>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input with custom focus ring">
		{#snippet blurb()}
			The focus treatment recoloured per field.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					This theme's focus state is one border-colour change and no ring — `app.css`
					switches the box-shadow off, as this page's header derives — so the
					customisation lands entirely on the border half: upstream's
					`focus-visible:border-emerald-500` becomes the `--success` token and its
					`focus-visible:ring-emerald-500/50` has nothing to colour and is dropped.
				-->
				<Field.Field class="w-full max-w-xs">
					<Field.FieldLabel class={label} for="custom-focus">Custom Focus</Field.FieldLabel>
					<Input
						id="custom-focus"
						class="focus-visible:border-success"
						placeholder="Green focus ring"
					/>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input with subtle background">
		{#snippet blurb()}
			The field filled with the muted step instead of the card fill.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					One `bg-muted!` where upstream states three (`bg-muted` plus the same again
					under hover: and focus-visible:): the important base already holds through
					both states against the unlayered `--card` fill, so restating it per state
					would be noise.
				-->
				<Field.Field class="w-full max-w-xs">
					<Field.FieldLabel class={label} for="subtle-bg">Subtle Background</Field.FieldLabel>
					<Input
						id="subtle-bg"
						class="bg-muted! transition-colors duration-300"
						placeholder="Enter text..."
					/>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Input with bottom border only">
		{#snippet blurb()}
			Everything stripped but a 2px underline that turns primary on focus. The classic theme's own
			name for this shape is <code class="text-[87.5%] text-primary">.form-control-flush</code>,
			which this page's header lists among the modifiers the shadcn docs never show.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Upstream's `shadow-none` is dropped — the recipe already zeroes the shadow —
					and `px-0` takes the `!` the unlayered padding demands.
				-->
				<Field.Field class="w-full max-w-xs">
					<Field.FieldLabel class={label} for="bottom-border">Bottom Border Only</Field.FieldLabel>
					<Input
						id="bottom-border"
						class="rounded-none border-x-0 border-t-0 border-b-2 px-0! focus-visible:border-primary"
						placeholder="Type here..."
					/>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Color input">
		{#snippet blurb()}
			The native colour picker inside the form-control box.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					The hex is the picker's initial VALUE — demo data, which ports as-is; the
					semantic-tokens rule governs styling classes, not what a colour input holds.
					`p-1!` against the unlayered padding is what lets the swatch fill the box.
				-->
				<Field.Field class="w-full max-w-xs">
					<Field.FieldLabel class={label} for="color-picker">Theme Color</Field.FieldLabel>
					<Input
						id="color-picker"
						type="color"
						class="h-10 w-20 cursor-pointer p-1!"
						value="#3b82f6"
					/>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Range input with value indicator">
		{#snippet blurb()}
			The native range control with its value read out beside the label. The Slider page has the
			composed control; this is the bare element.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`h-2!`, `bg-muted!` and the recipe's `.5rem` block padding zeroed with `p-0!`
					— an 8px control cannot carry 16px of padding, a collision upstream never has
					because shadcn's base box is not unlayered. `accent-primary` needs no escape:
					the recipe never touches accent-color.
				-->
				<Field.Field class="w-full max-w-xs">
					<div class="flex items-center justify-between">
						<Field.FieldLabel class={label} for="range-slider">Volume</Field.FieldLabel>
						<span class="text-xs font-medium text-muted-foreground">{inputRangeValue}</span>
					</div>
					<Input
						id="range-slider"
						type="range"
						min="0"
						max="100"
						bind:value={inputRangeValue}
						class="h-2! cursor-pointer appearance-none bg-muted! p-0! accent-primary"
					/>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Pill-shaped input">
		{#snippet blurb()}
			The classic theme's name for it is <code class="text-[87.5%] text-primary"
				>.form-control-rounded</code
			>, another of the modifiers from this page's header.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Field.Field class="w-full max-w-xs">
					<Field.FieldLabel class={label} for="pill-input">Search</Field.FieldLabel>
					<Input id="pill-input" class="rounded-full px-4!" placeholder="Search everything..." />
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Minimal input without borders or background">
		{#snippet blurb()}
			The field reduced to its text.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Upstream also states `shadow-none` and `focus-visible:ring-0`; the recipe
					already zeroes both, so what remains is the border, the fill and the padding —
					the latter two important, against the unlayered values.
				-->
				<Field.Field class="w-full max-w-xs">
					<Field.FieldLabel class={label} for="minimal-input">Invisible Input</Field.FieldLabel>
					<Input
						id="minimal-input"
						class="border-none bg-transparent! p-0!"
						placeholder="Type here..."
					/>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
