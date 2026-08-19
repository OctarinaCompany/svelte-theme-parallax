<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as RadioGroup from "$lib/components/ui/radio-group/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import * as Frame from "$lib/components/ui/frame/index.js";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { IconTile } from "$lib/components/ui/icon-tile/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import ChartNoAxesColumnDecreasingIcon from "@lucide/svelte/icons/chart-no-axes-column-decreasing";
	import CircleDollarSignIcon from "@lucide/svelte/icons/circle-dollar-sign";
	import CircleHelpIcon from "@lucide/svelte/icons/circle-help";
	import CreditCardIcon from "@lucide/svelte/icons/credit-card";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import MailIcon from "@lucide/svelte/icons/mail";
	import MessageCircleIcon from "@lucide/svelte/icons/message-circle";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import SmartphoneIcon from "@lucide/svelte/icons/smartphone";
	import WalletIcon from "@lucide/svelte/icons/wallet";

	/**
	 * The Radio group component page, ported from shadcn-svelte's own documentation
	 * (https://shadcn-svelte.com/docs/components/radio-group), which shows one example plus the
	 * `Usage` snippet — the two sections below.
	 *
	 * The classic theme never documents a radio button. The reference docs use `.form-check`
	 * only as a checkbox (the checklist card) and as a switch, and the one `type="radio"` on the
	 * whole page is a `.btn-check` inside a button group — a control painted as a button, not as
	 * a radio. So there is no classic example to copy; what is ported here is the compiled
	 * `.form-check-input[type=radio]` rule from the reference bundle, i.e.
	 * the classic shape carrying the classic theme's overrides from the reference stylesheet and the
	 * `form-check-*` block of the reference stylesheet.
	 *
	 * Four properties differ from shadcn and all four are reachable from the call site: the
	 * unchecked ground, the border, the dot size and the spacing between rows. One is
	 * deliberately not ported — see {@link item}.
	 *
	 * The disabled state needs nothing. `.form-check-input:disabled { opacity: .5 }` is exactly
	 * shadcn's `disabled:opacity-50`; the classic theme adds `pointer-events: none` and `cursor: default`
	 * on the label where shadcn shows `cursor-not-allowed`, which is a cursor glyph and has no
	 * example on the docs page to show it on.
	 */

	/**
	 * One radio.
	 *
	 *   border-0            `form-check-input-border: transparent` — the shorthand `border:
	 *                       transparent` leaves `border-style` at `none`, so the classic theme's radio
	 *                       carries no border at all where shadcn draws a 1px `border-input`.
	 *                       It silences `data-checked:border-primary` and
	 *                       `focus-visible:border-ring` with it, which is the same trade the
	 *                       `[data-slot='switch']` rule in `app.css` already makes for
	 *                       the same Sass variable.
	 *   bg-secondary        `form-check-input-bg` is `gray-300` (#E3EBF6) in light and
	 *                       `form-check-input-bg-dark` = `gray-600-dark` (#244166) in dark: an
	 *                       unchecked the classic theme radio is a FILLED grey disc, not an outlined ring.
	 *                       `--secondary` holds #EDF2F9 / #1E3A5C — one grey step off in both
	 *                       modes, the nearest token, and the same substitution the Switch and
	 *                       Progress ports make for this exact variable.
	 *   dark:bg-secondary   present only to unseat the component's own `dark:bg-input/30`, which
	 *                       would otherwise win in dark mode on variant order alone. It is not a
	 *                       second colour — it repeats the line above.
	 *   [&_svg]:size-1.5    the dot, an inner element the component takes no `class` for.
	 *                       `form-check-radio-checked-bg-image` is `circle r='2'` inside
	 *                       `viewBox='-4 -4 8 8'`, i.e. half the image wide, and the classic theme scales
	 *                       that image to `form-check-input-checked-bg-size: 75% 75%` of the
	 *                       16px input (`.form-check:not(.form-switch):not(.form-check-circle)
	 *                       .form-check-input:checked`). 12px image, 6px dot — against shadcn's
	 *                       `size-2`, 8px.
	 *
	 * Everything else already agrees: `form-check-size: 1rem` is `size-4`, `[type=radio]`'s
	 * `border-radius: 50%` is `rounded-full`, and `:checked { background-color: #2c7be5 }` with
	 * a white circle is `data-checked:bg-primary` over `bg-primary-foreground`.
	 *
	 * NOT PORTED — the focus state. `form-check-input-focus-box-shadow: none` and
	 * `form-check-input-focus-border: transparent` leave the classic theme with no focus ring at all,
	 * replaced by `:focus:not(:checked) { background-color: #CBDEF9 }` (`lighten(primary, 35%)`)
	 * — a tint that shows nothing once the radio is checked, which is when a keyboard user most
	 * needs to know where they are. shadcn's `focus-visible:ring-3 ring-ring/50` is kept instead,
	 * the same call `app.css` records for the switch.
	 */
	const item = "border-0 bg-secondary dark:bg-secondary [&_svg]:size-1.5";

	/**
	 * The label.
	 *
	 *   font-normal      `.form-check-label` sets `cursor: pointer` and nothing else, so it
	 *                    inherits `font-weight-base` (400) where shadcn's `Label` asks for 500.
	 *   leading-normal   `line-height-base` (1.5), which shadcn's `Label` drops with
	 *                    `leading-none`. It is what gives the row its height: `.form-check` is
	 *                    `min-height: 1.40625rem` = `font-size-base * line-height-base` =
	 *                    22.5px, and with `--text-sm` mapped to `font-size-base` (0.9375rem)
	 *                    the label's own line box is that same 22.5px. Without it every row
	 *                    collapses to the radio's 16px and the 2px group gap below reads as a
	 *                    solid block.
	 */
	const label = "font-normal leading-normal";

	/**
	 * The group. `.form-check + .form-check { margin-top: form-check-margin-bottom }` is 2px —
	 * the classic default, which the classic theme does not override — because the breathing room is
	 * already inside the 22.5px rows. shadcn's Root is `gap-3`, six times as far apart.
	 */
	const group = "gap-0.5";

	/**
	 * `.form-check` is `padding-left: 1.5rem` with the input floated back out of it by
	 * `margin-left: -1.5rem` at `width: 1rem` — the classic way of laying out a bare `<input>`
	 * and its sibling label, and what it measures out to is 8px between the disc and the text.
	 * `margin-top: calc(.75em - .5rem)` then centres the 16px input in the 22.5px line box. A
	 * flex row states both facts directly, as the Switch page does.
	 */
	const row = "flex items-center gap-2";

	/** The docs page's first example: three densities, `comfortable` preselected. */
	const densities = [
		{ value: "default", id: "r1", label: "Default" },
		{ value: "comfortable", id: "r2", label: "Comfortable" },
		{ value: "compact", id: "r3", label: "Compact" },
	];

	/** The docs page's `Usage` snippet, bound so a Svelte caller can read the selection back. */
	let option = $state("option-one");

	/*
	 * Everything below is the radio-group demo set.
	 * demo 1 is the three-density group with `comfortable` preselected — the card
	 * this page already opens with — so it is not repeated.
	 *
	 * Three decisions run through every section below.
	 *
	 * 1. THE DISC STAYS THE CLASSIC THEME. Every ported item still carries {@link item}, so the page shows
	 *    one radio throughout instead of the classic theme's filled grey disc above and shadcn's outlined
	 *    ring below. What comes from upstream is the ROW — and only the row, so `group`, `row` and
	 *    `label` above are not reused here: these demos lay their rows out with `Field`, which owns
	 *    its own label rhythm and its own disabled, invalid and checked plumbing. That is the same
	 *    call the Switch page makes for its own demo set.
	 * 2. TOKENS ONLY, per docs/CONVENTIONS.md §8. The colour example resists raw `blue-500`,
	 *    `green-500` and `yellow-500` tints, and draws the Visa and Mastercard brand marks in their brand
	 *    hexes; see {@link colorSwatches} and {@link paymentMethods} for what each becomes.
	 * 3. NO REMOTE ASSETS. Upstream's assignee cards load two stock portraits; this repository
	 *    makes no network requests at runtime, so they keep their initials fallback — the
	 *    substitution the Card and Filters pages already make.
	 *
	 * Each group binds its own page-level state rather than leaning on an uncontrolled default: a
	 * section that starts on a particular option has to say so from the page, and the binding is
	 * what makes the demo answer a click.
	 */
	let disabledValue = $state("comfortable");
	let descriptionValue = $state("comfortable");
	let invalidValue = $state("email");
	let colorValue = $state("primary");
	let batteryValue = $state("medium");
	let planCardValue = $state("plus");
	let shippingValue = $state("standard");
	let contactValue = $state("email");
	let languageValue = $state("en");
	let featureValue = $state("payments");
	let assigneeValue = $state("emma");
	let paymentValue = $state("visa");
	let visibilityValue = $state("public");
	let channelValue = $state("stable");
	let roleValue = $state("viewer");
	let pricingValue = $state("pro");

	/**
	 * The invalid disc, demo 4. The component paints an invalid item with
	 * `aria-invalid:border-destructive`, which {@link item} has nothing to colour — the classic theme's disc
	 * carries no border at all. The width is restored for that one state, because the wash the
	 * component also draws (`aria-invalid:ring-destructive/20`) reads as a shadow against a filled
	 * grey disc rather than as an error.
	 */
	const invalidItem = `${item} aria-invalid:border aria-invalid:border-destructive`;

	/**
	 * demo 5 tints its three discs `blue-500`, `green-500` and `yellow-500`. Raw
	 * palette colours are out, so the swatches become the theme's own primary, success and warning.
	 *
	 * Upstream tints the BORDER and the indicator glyph. The classic theme's disc has neither: no edge, and a
	 * dot that is `primary-foreground` punched out of the fill, so tinting it would erase it. The
	 * tint therefore lands on the checked FILL — the surface this theme actually paints, carrying
	 * the same information. Each `dark:` line repeats its own value only to unseat the component's
	 * `dark:data-checked:bg-primary`, which would otherwise win in dark mode on variant order
	 * alone; it is not a second colour, the same trick {@link item} already plays with
	 * `dark:bg-secondary`.
	 */
	const colorSwatches = [
		{ value: "primary", id: "color-primary", label: "Primary", item },
		{
			value: "success",
			id: "color-success",
			label: "Success",
			item: `${item} data-checked:bg-success dark:data-checked:bg-success`,
		},
		{
			value: "warning",
			id: "color-warning",
			label: "Warning",
			item: `${item} data-checked:bg-warning dark:data-checked:bg-warning`,
		},
	];

	/** demo 11 — the two-up grid of workspace features. */
	const featureCards = [
		{
			value: "payments",
			title: "Payments",
			description: "Receive payments from your customers",
			icon: CircleDollarSignIcon,
		},
		{
			value: "invoices",
			title: "Invoices",
			description: "Create and send invoices to your customers",
			icon: FileTextIcon,
		},
		{
			value: "billing",
			title: "Billing",
			description: "Manage your billing and subscriptions",
			icon: CreditCardIcon,
		},
		{
			value: "reports",
			title: "Reports",
			description: "View your reports and analytics",
			icon: ChartNoAxesColumnDecreasingIcon,
		},
	];

	/** demo 12, with the two stock portraits reduced to their initials. */
	const assignees = [
		{
			value: "emma",
			id: "assignee-emma",
			name: "Emma Wilson",
			handle: "@emmawilson",
			initials: "EW",
		},
		{ value: "john", id: "assignee-john", name: "John Doe", handle: "@johndoe", initials: "JD" },
	];

	/**
	 * demo 13 draws the Visa and Mastercard marks as inline SVG in their brand hexes
	 * (`#1A1F71`, `#EB001B`, `#F79E1B`). A brand mark is not a token and not this repository's to
	 * redraw, so each card takes a neutral glyph and keeps the copy that says which card it is —
	 * which is what the row is read for anyway.
	 */
	const paymentMethods = [
		{
			value: "visa",
			id: "pay-visa",
			icon: CreditCardIcon,
			title: "Visa ending in 4242",
			expiry: "Expires 12/26",
		},
		{
			value: "mastercard",
			id: "pay-mc",
			icon: WalletIcon,
			title: "Mastercard ending in 8888",
			expiry: "Expires 09/25",
		},
	];

	/** demo 17 — the three tiers, price on the same line as the name. */
	const pricingPlans = [
		{
			value: "free",
			title: "Free",
			price: "$0",
			description: "For personal projects and experiments.",
		},
		{ value: "pro", title: "Pro", price: "$19", description: "For professionals and small teams." },
		{
			value: "enterprise",
			title: "Enterprise",
			price: "$49",
			description: "For organizations with advanced needs.",
		},
	];
</script>

<DocPage title="Radio group">
	{#snippet subtitle()}
		A set of checkable buttons — known as radio buttons — where no more than one of the buttons can
		be checked at a time. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/radio-group"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<RadioGroup.Root value="comfortable" class={group}>
				{#each densities as density (density.value)}
					<div class={row}>
						<RadioGroup.Item value={density.value} id={density.id} class={item} />
						<Label for={density.id} class={label}>{density.label}</Label>
					</div>
				{/each}
			</RadioGroup.Root>
		</Card.Content>
	</Card.Root>

	<DocSection title="Usage">
		{#snippet blurb()}
			The same control with its selection bound through
			<code class="text-[87.5%] text-primary">bind:value</code>, which is how the group reports the
			chosen option back to the page.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<RadioGroup.Root bind:value={option} class={group}>
					<div class={row}>
						<RadioGroup.Item value="option-one" id="option-one" class={item} />
						<Label for="option-one" class={label}>Option One</Label>
					</div>
					<div class={row}>
						<RadioGroup.Item value="option-two" id="option-two" class={item} />
						<Label for="option-two" class={label}>Option Two</Label>
					</div>
				</RadioGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Disabled radio group">
		{#snippet blurb()}
			One option out of reach. The disabled flag is set twice — on the control, which stops the
			click, and on its field, which dims the label with it so the whole row reads as unavailable
			rather than leaving a live-looking word beside a dead disc.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 2 -->
				<RadioGroup.Root bind:value={disabledValue} class="w-fit">
					<Field.Field orientation="horizontal">
						<RadioGroup.Item value="default" id="disabled-r1" class={item} />
						<Field.Label for="disabled-r1">Default</Field.Label>
					</Field.Field>
					<Field.Field orientation="horizontal" data-disabled="true">
						<RadioGroup.Item value="comfortable" id="disabled-r2" disabled class={item} />
						<Field.Label for="disabled-r2">Comfortable</Field.Label>
					</Field.Field>
					<Field.Field orientation="horizontal">
						<RadioGroup.Item value="compact" id="disabled-r3" class={item} />
						<Field.Label for="disabled-r3">Compact</Field.Label>
					</Field.Field>
				</RadioGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Radio with description">
		{#snippet blurb()}
			A second line under each option. <code class="text-[87.5%] text-primary">Field.Content</code>
			stacks the label and its description, and the horizontal field pins the disc to the first line instead
			of centring it against the whole block.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 3 -->
				<RadioGroup.Root bind:value={descriptionValue} class="w-fit">
					<Field.Field orientation="horizontal">
						<RadioGroup.Item value="default" id="desc-r1" class={item} />
						<Field.Content>
							<Field.Label for="desc-r1">Default</Field.Label>
							<Field.Description>Standard spacing for most use cases.</Field.Description>
						</Field.Content>
					</Field.Field>
					<Field.Field orientation="horizontal">
						<RadioGroup.Item value="comfortable" id="desc-r2" class={item} />
						<Field.Content>
							<Field.Label for="desc-r2">Comfortable</Field.Label>
							<Field.Description>More space between elements.</Field.Description>
						</Field.Content>
					</Field.Field>
					<Field.Field orientation="horizontal">
						<RadioGroup.Item value="compact" id="desc-r3" class={item} />
						<Field.Content>
							<Field.Label for="desc-r3">Compact</Field.Label>
							<Field.Description>Minimal spacing for dense layouts.</Field.Description>
						</Field.Content>
					</Field.Field>
				</RadioGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Invalid radio group">
		{#snippet blurb()}
			A group a form has rejected. The field turns its label destructive and the disc gets its edge
			back for that state alone — see <code class="text-[87.5%] text-primary">invalidItem</code> in this
			file.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 4 -->
				<RadioGroup.Root bind:value={invalidValue} class="w-fit">
					<Field.Field orientation="horizontal" data-invalid="true">
						<RadioGroup.Item
							value="email"
							id="invalid-r1"
							aria-invalid="true"
							class={invalidItem}
						/>
						<Field.Label for="invalid-r1">Email only</Field.Label>
					</Field.Field>
					<Field.Field orientation="horizontal" data-invalid="true">
						<RadioGroup.Item value="sms" id="invalid-r2" aria-invalid="true" class={invalidItem} />
						<Field.Label for="invalid-r2">SMS only</Field.Label>
					</Field.Field>
				</RadioGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Colored radio group">
		{#snippet blurb()}
			One disc per status colour, tinted on the checked fill rather than on a border the classic
			theme's radio does not draw.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 5 -->
				<RadioGroup.Root bind:value={colorValue} class="w-fit">
					{#each colorSwatches as swatch (swatch.value)}
						<Field.Field orientation="horizontal">
							<RadioGroup.Item value={swatch.value} id={swatch.id} class={swatch.item} />
							<Field.Label for={swatch.id}>{swatch.label}</Field.Label>
						</Field.Field>
					{/each}
				</RadioGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Radio group with legend and description">
		{#snippet blurb()}
			The group inside a fieldset, so the question itself is markup: the legend names what the three
			options answer, and screen readers announce it with every one of them.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 6 -->
				<div class="flex justify-center">
					<Field.Set class="w-full max-w-xs">
						<Field.Legend>Battery Level</Field.Legend>
						<Field.Description>Choose your preferred battery level.</Field.Description>
						<RadioGroup.Root bind:value={batteryValue}>
							<Field.Field orientation="horizontal">
								<RadioGroup.Item value="high" id="battery-high" class={item} />
								<Field.Label for="battery-high">High</Field.Label>
							</Field.Field>
							<Field.Field orientation="horizontal">
								<RadioGroup.Item value="medium" id="battery-medium" class={item} />
								<Field.Label for="battery-medium">Medium</Field.Label>
							</Field.Field>
							<Field.Field orientation="horizontal">
								<RadioGroup.Item value="low" id="battery-low" class={item} />
								<Field.Label for="battery-low">Low</Field.Label>
							</Field.Field>
						</RadioGroup.Root>
					</Field.Set>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Card radio group with descriptions">
		{#snippet blurb()}
			Each option becomes its own bordered card, so the whole block is the hit target and not just
			the disc. The selected card tints itself from the item's checked state — the label's
			<code class="text-[87.5%] text-primary">has-data-checked</code> rule, no page state involved.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 7 -->
				<div class="flex justify-center">
					<RadioGroup.Root bind:value={planCardValue} class="w-full max-w-xs">
						<Field.Label for="plus-plan">
							<Field.Field orientation="horizontal">
								<Field.Content>
									<Field.Title>Plus</Field.Title>
									<Field.Description>For individuals and small teams.</Field.Description>
								</Field.Content>
								<RadioGroup.Item value="plus" id="plus-plan" class={item} />
							</Field.Field>
						</Field.Label>
						<Field.Label for="pro-plan">
							<Field.Field orientation="horizontal">
								<Field.Content>
									<Field.Title>Pro</Field.Title>
									<Field.Description>For growing businesses.</Field.Description>
								</Field.Content>
								<RadioGroup.Item value="pro" id="pro-plan" class={item} />
							</Field.Field>
						</Field.Label>
					</RadioGroup.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Radio group in card with separators">
		{#snippet blurb()}
			The list as a settings panel: one card, rules between the rows, and the padding on the labels
			so the whole width of each row is clickable.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 8 -->
				<div class="flex justify-center">
					<Card.Root class="w-full max-w-xs p-0">
						<RadioGroup.Root bind:value={shippingValue}>
							<Field.Group class="gap-0">
								<Field.Field>
									<Field.Label class="px-4 py-3">
										<RadioGroup.Item value="standard" id="ship-standard" class={item} />
										<Field.Title>Standard Shipping</Field.Title>
									</Field.Label>
								</Field.Field>
								<Separator />
								<Field.Field>
									<Field.Label class="px-4 py-3">
										<RadioGroup.Item value="express" id="ship-express" class={item} />
										<Field.Title>Express Shipping</Field.Title>
									</Field.Label>
								</Field.Field>
								<Separator />
								<Field.Field>
									<Field.Label class="px-4 py-3">
										<RadioGroup.Item value="overnight" id="ship-overnight" class={item} />
										<Field.Title>Overnight Shipping</Field.Title>
									</Field.Label>
								</Field.Field>
							</Field.Group>
						</RadioGroup.Root>
					</Card.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Radio group in card with icons">
		{#snippet blurb()}
			The same panel with a glyph in front of each channel and the disc pushed to the trailing edge,
			which is where a settings list is read down.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 9 -->
				<div class="flex justify-center">
					<Card.Root class="w-full max-w-xs p-0">
						<RadioGroup.Root bind:value={contactValue}>
							<Field.Group class="gap-0">
								<Field.Field>
									<Field.Label class="justify-between px-4 py-3">
										<Field.Title class="flex items-center gap-2">
											<MailIcon class="size-4 opacity-60" aria-hidden="true" />
											Email
										</Field.Title>
										<RadioGroup.Item value="email" id="contact-email" class={item} />
									</Field.Label>
								</Field.Field>
								<Separator />
								<Field.Field>
									<Field.Label class="justify-between px-4 py-3">
										<Field.Title class="flex items-center gap-2">
											<SmartphoneIcon class="size-4 opacity-60" aria-hidden="true" />
											Phone
										</Field.Title>
										<RadioGroup.Item value="phone" id="contact-phone" class={item} />
									</Field.Label>
								</Field.Field>
								<Separator />
								<Field.Field>
									<Field.Label class="justify-between px-4 py-3">
										<Field.Title class="flex items-center gap-2">
											<MessageCircleIcon class="size-4 opacity-60" aria-hidden="true" />
											Chat
										</Field.Title>
										<RadioGroup.Item value="chat" id="contact-chat" class={item} />
									</Field.Label>
								</Field.Field>
							</Field.Group>
						</RadioGroup.Root>
					</Card.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Radio group in frame">
		{#snippet blurb()}
			The same list inside a <code class="text-[87.5%] text-primary">Frame</code>, which gives the
			group a titled shell and an inset panel instead of a bare card.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 10 — the panel is padded by its rows, not by itself, so `p-0!`
					overrides the frame's own `--frame-panel-*` padding and `overflow-hidden` keeps the
					first and last rows inside the panel's rounded corners.
				-->
				<div class="flex justify-center">
					<Frame.Root spacing="sm" class="w-full max-w-xs">
						<Frame.Header>
							<Frame.Title>Language</Frame.Title>
						</Frame.Header>
						<Frame.Panel class="overflow-hidden p-0!">
							<RadioGroup.Root bind:value={languageValue}>
								<Field.Group class="gap-0">
									<Field.Field>
										<Field.Label class="p-3">
											<RadioGroup.Item value="en" id="lang-en" class={item} />
											<Field.Title>English</Field.Title>
										</Field.Label>
									</Field.Field>
									<Separator />
									<Field.Field>
										<Field.Label class="p-3">
											<RadioGroup.Item value="es" id="lang-es" class={item} />
											<Field.Title>Spanish</Field.Title>
										</Field.Label>
									</Field.Field>
									<Separator />
									<Field.Field>
										<Field.Label class="p-3">
											<RadioGroup.Item value="fr" id="lang-fr" class={item} />
											<Field.Title>French</Field.Title>
										</Field.Label>
									</Field.Field>
									<Separator />
									<Field.Field>
										<Field.Label class="p-3">
											<RadioGroup.Item value="de" id="lang-de" class={item} />
											<Field.Title>German</Field.Title>
										</Field.Label>
									</Field.Field>
								</Field.Group>
							</RadioGroup.Root>
						</Frame.Panel>
					</Frame.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Radio group with grid layout">
		{#snippet blurb()}
			Option cards two to a row, each with the disc parked in its top corner so it never competes
			with the title for the first line.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 11 — upstream draws the icon chip inline with a bordered `div`;
					`IconTile` in its `outline` variant is that same chip as a component, so the glyph
					size comes from the tile rather than from a class here. `p-0!` on the label hands the
					padding to the field inside it, which is what the label's own
					`*:data-[slot=field]:p-2.5` rule expects.
				-->
				<div class="flex justify-center">
					<RadioGroup.Root bind:value={featureValue} class="grid w-full max-w-xs grid-cols-2 gap-4">
						{#each featureCards as feature (feature.value)}
							{@const Icon = feature.icon}
							<Field.Label for={feature.value} class="relative p-0!">
								<Field.Field orientation="horizontal">
									<div class="absolute top-3 right-3">
										<RadioGroup.Item value={feature.value} id={feature.value} class={item} />
									</div>
									<Field.Title class="flex flex-col items-start">
										<IconTile variant="outline" size="sm" aria-hidden="true">
											<Icon />
										</IconTile>
										<div class="flex flex-col items-start gap-0.5">
											<span class="text-sm font-semibold">{feature.title}</span>
											<span class="text-xs text-muted-foreground">{feature.description}</span>
										</div>
									</Field.Title>
								</Field.Field>
							</Field.Label>
						{/each}
					</RadioGroup.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Avatar based card radio group">
		{#snippet blurb()}
			Picking a person rather than a setting: the avatar and handle carry the identification, and
			the disc only records the choice.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 12 -->
				<div class="flex justify-center">
					<RadioGroup.Root bind:value={assigneeValue} class="w-full max-w-xs">
						{#each assignees as person (person.value)}
							<Field.Label for={person.id} class="p-0!">
								<Field.Field orientation="horizontal">
									<Field.Title class="flex items-center gap-2">
										<Avatar.Root>
											<Avatar.Fallback>{person.initials}</Avatar.Fallback>
										</Avatar.Root>
										<div class="flex flex-col items-start">
											<span class="text-sm font-semibold">{person.name}</span>
											<span class="text-xs text-muted-foreground">{person.handle}</span>
										</div>
									</Field.Title>
									<RadioGroup.Item value={person.value} id={person.id} class={item} />
								</Field.Field>
							</Field.Label>
						{/each}
					</RadioGroup.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Payment method radio cards">
		{#snippet blurb()}
			Saved cards plus an escape hatch. The last row has no disc of its own to describe — it is the
			same control used as an "add another" affordance.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 13 -->
				<div class="mx-auto w-full max-w-xs">
					<RadioGroup.Root bind:value={paymentValue} class="flex flex-col gap-3">
						{#each paymentMethods as method (method.value)}
							{@const Icon = method.icon}
							<Field.Label for={method.id} class="relative p-0!">
								<Field.Field orientation="horizontal">
									<div class="absolute top-3 right-3">
										<RadioGroup.Item value={method.value} id={method.id} class={item} />
									</div>
									<Field.Title class="flex flex-col items-start gap-4">
										<IconTile variant="outline" aria-hidden="true">
											<Icon />
										</IconTile>
										<div class="flex flex-col items-start gap-0.5">
											<span class="text-sm font-medium">{method.title}</span>
											<span class="text-xs text-muted-foreground">{method.expiry}</span>
										</div>
									</Field.Title>
								</Field.Field>
							</Field.Label>
						{/each}
						<Field.Label for="pay-new" class="relative p-0!">
							<Field.Field orientation="horizontal" class="justify-center">
								<RadioGroup.Item value="new" id="pay-new" class="{item} absolute top-3 right-3" />
								<Field.Title class="flex items-center gap-2">
									<PlusIcon class="size-4 opacity-60" aria-hidden="true" />
									Add new payment method
								</Field.Title>
							</Field.Field>
						</Field.Label>
					</RadioGroup.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Radio group with tooltip info">
		{#snippet blurb()}
			The help glyph sits outside the label, so clicking it opens the tooltip instead of selecting
			the option it explains.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 14 -->
				<div class="flex justify-center">
					<Tooltip.Provider>
						<RadioGroup.Root bind:value={visibilityValue} class="w-full max-w-xs">
							<Field.Field orientation="horizontal">
								<RadioGroup.Item value="public" id="vis-public" class={item} />
								<div class="flex items-center gap-1.5">
									<Field.Label for="vis-public">Public</Field.Label>
									<Tooltip.Root>
										<Tooltip.Trigger
											class="text-muted-foreground"
											aria-label="About public visibility"
										>
											<CircleHelpIcon class="size-3.5" aria-hidden="true" />
										</Tooltip.Trigger>
										<Tooltip.Content side="right">
											Anyone on the internet can see this.
										</Tooltip.Content>
									</Tooltip.Root>
								</div>
							</Field.Field>
							<Field.Field orientation="horizontal">
								<RadioGroup.Item value="private" id="vis-private" class={item} />
								<div class="flex items-center gap-1.5">
									<Field.Label for="vis-private">Private</Field.Label>
									<Tooltip.Root>
										<Tooltip.Trigger
											class="text-muted-foreground"
											aria-label="About private visibility"
										>
											<CircleHelpIcon class="size-3.5" aria-hidden="true" />
										</Tooltip.Trigger>
										<Tooltip.Content side="right">
											Only you and collaborators can access this.
										</Tooltip.Content>
									</Tooltip.Root>
								</div>
							</Field.Field>
						</RadioGroup.Root>
					</Tooltip.Provider>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Radio group with badges">
		{#snippet blurb()}
			Release channels, two of them annotated. The badge sits beside the label rather than inside
			it, so the pill is not part of the click target.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 15 -->
				<RadioGroup.Root bind:value={channelValue} class="w-fit">
					<Field.Field orientation="horizontal">
						<RadioGroup.Item value="stable" id="ch-stable" class={item} />
						<div class="flex items-center gap-2">
							<Field.Label for="ch-stable">Stable</Field.Label>
							<Badge
								variant="secondary"
								class="h-4.5 rounded-full px-1.5 text-[10px] tracking-wider uppercase"
							>
								Recommended
							</Badge>
						</div>
					</Field.Field>
					<Field.Field orientation="horizontal">
						<RadioGroup.Item value="beta" id="ch-beta" class={item} />
						<div class="flex items-center gap-2">
							<Field.Label for="ch-beta">Beta</Field.Label>
							<Badge class="h-4.5 rounded-full px-1.5 text-[10px] tracking-wider uppercase">
								New
							</Badge>
						</div>
					</Field.Field>
					<Field.Field orientation="horizontal">
						<RadioGroup.Item value="canary" id="ch-canary" class={item} />
						<Field.Label for="ch-canary">Canary</Field.Label>
					</Field.Field>
				</RadioGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Inline horizontal radio group">
		{#snippet blurb()}
			Three short options on one line — the shape a role picker takes when it sits inside a wider
			form row. It wraps rather than compressing once the line runs out.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 16 -->
				<RadioGroup.Root
					bind:value={roleValue}
					class="mx-auto flex w-auto flex-wrap items-center gap-6"
				>
					<Field.Field orientation="horizontal" class="w-auto">
						<RadioGroup.Item value="admin" id="role-admin" class={item} />
						<Field.Label for="role-admin" class="cursor-pointer">Admin</Field.Label>
					</Field.Field>
					<Field.Field orientation="horizontal" class="w-auto">
						<RadioGroup.Item value="editor" id="role-editor" class={item} />
						<Field.Label for="role-editor" class="cursor-pointer">Editor</Field.Label>
					</Field.Field>
					<Field.Field orientation="horizontal" class="w-auto">
						<RadioGroup.Item value="viewer" id="role-viewer" class={item} />
						<Field.Label for="role-viewer" class="cursor-pointer">Viewer</Field.Label>
					</Field.Field>
				</RadioGroup.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Pricing plan radio cards">
		{#snippet blurb()}
			The plan cards a checkout puts the price on. The title row spreads name against price, so the
			three figures line up down the right edge and can be compared without reading the names.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 17 — `Field.Title` is `w-fit`, which would collapse the title row
					around its text and leave `justify-between` nothing to spread; `w-full` gives the row
					the width the price needs to reach the card's edge.
				-->
				<div class="flex justify-center">
					<RadioGroup.Root bind:value={pricingValue} class="w-full max-w-xs">
						{#each pricingPlans as plan (plan.value)}
							<Field.Label for={plan.value}>
								<Field.Field orientation="horizontal">
									<RadioGroup.Item value={plan.value} id={plan.value} class={item} />
									<Field.Content>
										<Field.Title class="w-full items-center justify-between">
											<span>{plan.title}</span>
											<span class="text-sm font-semibold">{plan.price}/mo</span>
										</Field.Title>
										<Field.Description>{plan.description}</Field.Description>
									</Field.Content>
								</Field.Field>
							</Field.Label>
						{/each}
					</RadioGroup.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
