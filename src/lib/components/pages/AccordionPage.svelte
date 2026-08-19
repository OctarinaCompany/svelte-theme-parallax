<script lang="ts">
	import ArrowUpRightIcon from "@lucide/svelte/icons/arrow-up-right";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
	import CircleHelpIcon from "@lucide/svelte/icons/circle-help";
	import LockIcon from "@lucide/svelte/icons/lock";
	import MinusIcon from "@lucide/svelte/icons/minus";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import QrCodeIcon from "@lucide/svelte/icons/qr-code";
	import SettingsIcon from "@lucide/svelte/icons/settings";

	import * as Accordion from "$lib/components/ui/accordion/index.js";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Frame from "$lib/components/ui/frame/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Spinner } from "$lib/components/ui/spinner/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Accordion component page.
	 *
	 * The classic theme's example is a plain classic accordion: three items, the first open, and
	 * `data-bs-parent` making it single-open. `Accordion.Root type="single"` is the direct
	 * equivalent — opening one item closes the others — and `value="item-1"` reproduces the
	 * `.collapse.show` on the first.
	 *
	 * The surrounding markup mirrors the classic theme's `.header` block: a title and a subtitle, then
	 * the example itself. The subtitle's link points at shadcn-svelte rather than the classic framework,
	 * since that is the component actually rendered here.
	 */

	/**
	 * The three items. The classic theme's copy is kept verbatim apart from the class it names —
	 * `.accordion-body` there, `Accordion.Content` here — so the two can be compared
	 * side by side.
	 */
	const items = [
		{
			value: "item-1",
			title: "First item",
			lead: "The first item opens onto this panel.",
			state: "shown by default",
		},
		{
			value: "item-2",
			title: "Second item",
			lead: "The second item's panel is identical apart from its state.",
			state: "hidden by default",
		},
		{
			value: "item-3",
			title: "Third item",
			lead: "The third item's panel, again identical apart from its state.",
			state: "hidden by default",
		},
	];

	/**
	 * Everything below this line is the accordion demo set, in its documented order.
	 *
	 * The first demo, demo 1, is not among them: it is the same plain
	 * single-expand accordion the classic example above already shows, with different copy.
	 *
	 * FOUR STANDING SUBSTITUTIONS, all of them the repository's own rules:
	 *
	 * 1. NO PHOTOGRAPHS. demo 9 loads three stock portraits; this repository
	 *    ships no images and fetches none, so the avatars fall back to their initials — the same
	 *    substitution the Filters page makes for the same reason.
	 *
	 * 2. NO RAW PALETTE COLOURS. demo 11 paints its in-progress step with
	 *    `bg-yellow-100 dark:bg-yellow-950` and `bg-yellow-500`. Those become `--warning-subtle`
	 *    and `--warning`, which is the same signal expressed as tokens.
	 *
	 * 3. THE SOFT BADGE FAMILY IS `{state}-subtle` — the one soft family this repository has
	 *    (see the house conventions).
	 *
	 * 4. NO `max-w-lg` WRAPPER. A preview tile would centre each demo in a 32rem column.
	 *    Here the sections sit in the page's own reading column, the
	 *    same width as the example above.
	 *
	 * The house `Accordion.Trigger` already carries the two styling hooks — the
	 * `group/accordion-trigger` name and `data-slot="accordion-trigger-icon"` on its chevrons —
	 * so the demos that swap the indicator (demo 2, demo 10) hide the
	 * built-in pair with `*:data-[slot=accordion-trigger-icon]:hidden` and render their own,
	 * exactly as upstream does.
	 */

	/** demo 2 — a multi-expand accordion whose indicator is a plus/minus pair. */
	const plusMinusItems = [
		{
			value: "security",
			trigger: "Data Security",
			content:
				"We use industry-standard AES-256 encryption to protect your sensitive information at rest and in transit.",
		},
		{
			value: "integration",
			trigger: "API Integration",
			content:
				"Seamlessly connect with your favorite tools using our robust REST API and pre-built connectors.",
		},
		{
			value: "collaboration",
			trigger: "Team Collaboration",
			content:
				"Invite team members, assign roles, and work together in real-time on shared projects and documents.",
		},
	];

	/** demo 3 — each item is its own bordered card. */
	const borderedItems = [
		{
			value: "billing",
			trigger: "How does billing work?",
			paragraphs: [
				"We offer monthly and annual subscription plans. Billing is charged at the beginning of each cycle, and you can cancel anytime. All plans include automatic backups, 24/7 support, and unlimited team members. There are no hidden fees or setup costs.",
			],
		},
		{
			value: "security",
			trigger: "Is my data secure?",
			paragraphs: [
				"Yes. We use end-to-end encryption, SOC 2 Type II compliance, and regular third-party security audits. All data is encrypted at rest and in transit using industry-standard protocols. We also offer optional two-factor authentication and single sign-on for enterprise customers.",
			],
		},
		{
			value: "integration",
			trigger: "What integrations do you support?",
			paragraphs: [
				"We integrate with 500+ popular tools including Slack, Zapier, Salesforce, HubSpot, and more. You can also build custom integrations using our REST API and webhooks.",
				"Our API documentation includes code examples in 10+ programming languages.",
			],
		},
	];

	/** demo 4 — the FAQ that lives in a card's body. */
	const cardItems = [
		{
			value: "billing",
			trigger: "How does billing work?",
			paragraphs: [
				"Billing occurs automatically at the start of each billing cycle. We accept all major credit cards, PayPal, and ACH transfers for enterprise customers.",
			],
		},
		{
			value: "security",
			trigger: "Is my data secure?",
			paragraphs: [
				"We take security seriously. All data is encrypted at rest using AES-256 and in transit via TLS 1.3. We perform regular third-party security audits and maintain SOC 2 Type II compliance.",
				"You can also enable multi-factor authentication (MFA) and single sign-on (SSO) for additional security.",
			],
		},
	];

	/** demo 5 — one item is locked, and the open one takes a highlight ground. */
	const disabledItems = [
		{
			value: "item-1",
			trigger: "Can I access my account history?",
			content:
				"Yes, you can view your complete account history including all transactions, plan changes, and support tickets in the Account History section of your dashboard.",
			disabled: false,
		},
		{
			value: "item-2",
			trigger: "Premium feature information (Locked)",
			content:
				"This section contains information about premium features. Upgrade your plan to access this content.",
			disabled: true,
		},
		{
			value: "item-3",
			trigger: "How do I update my email address?",
			content:
				"You can update your email address in your account settings. You'll receive a verification email at your new address to confirm the change.",
			disabled: false,
		},
	];

	/**
	 * demo 6 and demo 7 share this list verbatim — the second demo
	 * only changes the container, so the data is declared once and used twice.
	 */
	const settingsItems = [
		{
			value: "account",
			icon: SettingsIcon,
			trigger: "Account Settings",
			badge: "New",
			content:
				"Manage your account preferences, security settings, and personal information. You can also configure two-factor authentication here.",
		},
		{
			value: "privacy",
			icon: LockIcon,
			trigger: "Privacy & Security",
			badge: undefined,
			content:
				"Control who can see your profile and what data we collect. View our latest security audits and transparency reports.",
		},
		{
			value: "support",
			icon: CircleHelpIcon,
			trigger: "Help & Support",
			badge: undefined,
			content:
				"Access our help center, community forums, and contact support. We're here to help you 24/7.",
		},
	];

	/** demo 8 — the inner accordion nested inside the "Additional Details" item. */
	const nestedInnerItems = [
		{
			value: "sub-item-1",
			trigger: "Technical Specifications",
			content: "Detailed technical specs including dimensions, weight, and power requirements.",
		},
		{
			value: "sub-item-2",
			trigger: "Compatibility",
			content: "List of supported devices and operating systems for this product.",
		},
	];

	/** demo 8 — the outer accordion; `details` carries the nested one. */
	const nestedOuterItems = [
		{
			value: "product-info",
			trigger: "Product Overview",
			content:
				"This product is designed for high-performance enterprise environments requiring maximum reliability.",
			nested: false,
		},
		{
			value: "details",
			trigger: "Additional Details",
			content: "",
			nested: true,
		},
		{
			value: "shipping",
			trigger: "Shipping & Returns",
			content: "Free standard shipping on orders over $500. 30-day return policy applies.",
			nested: false,
		},
	];

	/**
	 * demo 9 — one member per frame panel. Upstream's `avatar` URLs are dropped
	 * (see substitution 1 above), so `initials` is what the fallback renders.
	 */
	const memberItems = [
		{
			id: "1",
			name: "Alex Johnson",
			role: "Admin",
			initials: "AJ",
			content:
				"Alex has full administrative access to the platform, including billing management, user provisioning, and security configurations.",
		},
		{
			id: "2",
			name: "Sarah Chen",
			role: "Viewer",
			initials: "SC",
			content:
				"Sarah has read-only access to projects and reports. She cannot modify settings or invite new members.",
		},
		{
			id: "3",
			name: "Michael Rodriguez",
			role: "Editor",
			initials: "MR",
			content:
				"Michael is part of the design team and has permissions to edit projects, manage assets, and update design system components.",
		},
	];

	/** demo 10 — the indicator is a leading chevron that rotates a quarter turn. */
	const rotatingItems = [
		{
			value: "item-1",
			trigger: "Can I use this for my project?",
			content:
				"Yes, you can use Parallax for any of your personal or commercial projects, under the terms of its licence.",
		},
		{
			value: "item-2",
			trigger: "Is there a Figma file available?",
			content:
				"We are currently working on a comprehensive Figma design system that will be released soon to all Parallax users.",
		},
		{
			value: "item-3",
			trigger: "How do I contribute to Parallax?",
			content:
				"You can contribute by reporting bugs, suggesting features, or submitting pull requests on our GitHub repository.",
		},
	];

	/** demo 11 — the address the setup step's link is sent to. */
	let onboardingEmail = $state("");
</script>

<DocPage title="Accordion">
	{#snippet subtitle()}
		Build vertically collapsing accordions. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/accordion"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<!--
		The wrapper supplies what the classic theme gets from `accordion-bg: card-bg` plus the classic
		default accordion border — the shadcn accordion is unstyled beyond its item dividers.
		`px-6` on each item is `accordion-button-padding-x` / `accordion-body-padding-x`
		(both `card-spacer-x`, 24px); the trigger's own `py-4` already matches the classic theme's
		`accordion-button-padding-y`.

		MEASURED ON THE CLASSIC THEME'S OWN PAGE, which corrected two guesses:

		  radius   `accordion-border-radius` is `border-radius` (6px), not the card's 8px —
		           so `rounded-md`, where this had `rounded-lg`
		  border   `accordion-border-color` is `--bs-border-color` = `gray-300` (#E3EBF6),
		           one step darker than the #EDF2F9 that `--border` carries for card outlines.
		           `--input` holds #E3EBF6's neighbour #D2DDEC — closer, still not exact; the
		           grey itself has no token, and `--sidebar-border` is the only one that holds
		           it, under a name that would not survive review here
	-->
	<div class="overflow-hidden rounded-md border bg-card">
		<Accordion.Root type="single" value="item-1">
			{#each items as item (item.value)}
				<Accordion.Item value={item.value} class="px-6">
					<!--
								shadcn underlines the trigger on hover; the classic theme's `.accordion-button` has no
								`text-decoration` rule at all — its only hover state is `z-index: 2`. With the
								pointer cursor restored in `@layer base`, the affordance is covered without it.
							-->
					<!--
							`font-normal` is `accordion-button-font-weight`, inherited from the body:
							measured at 400 on the classic theme against shadcn's `font-medium`.
						-->
					<Accordion.Trigger class="font-normal hover:no-underline">
						{item.title}
					</Accordion.Trigger>
					<!--
							Colours here are the classic theme's, and none of them are the shadcn defaults:

							  body text  `--bs-accordion-color: var(--bs-body-color)` — full strength,
							             NOT muted, so no `text-muted-foreground`
							  <strong>   `b, strong { font-weight: 600 }` (font-weight-bold) -> font-semibold
							  <code>     `color: var(--bs-code-color)` (primary) at `font-size: 87.5%`

							`87.5%` is kept as a percentage rather than swapped for `text-xs`: the classic framework
							sizes code relative to its context, so it tracks whatever it is nested in.
						-->
					<!--
							`pt-6` is `accordion-body-padding-y` = `card-spacer-y` (24px), which shadcn
							zeroes (`pt-0`). Measured, the classic theme puts 24px above the body text as well as
							below it, so the gap under the trigger is 16 + 24 rather than 16.
						-->
					<Accordion.Content class="pt-6 pb-6">
						<strong class="font-semibold">{item.lead}</strong>
						It is {item.state}, and stays that way until its trigger is clicked — the open state is
						what drives the height transition. Any block content can go inside
						<code class="text-[87.5%] text-primary">Accordion.Content</code> — text, a form, another component
						— though the transition clips whatever overflows while it runs.
					</Accordion.Content>
				</Accordion.Item>
			{/each}
		</Accordion.Root>
	</div>

	<!--
		demo 2. The built-in chevron pair is hidden and a plus/minus pair takes its
		place, toggled off the same `group-aria-expanded/accordion-trigger` hook the component's
		own icons use.

		The `hidden!` is deliberate. `*:data-[slot=accordion-trigger-icon]:hidden` and the
		component's `group-aria-expanded/accordion-trigger:inline` are both single-class display
		utilities, so which one wins is decided by generated source order rather than by intent;
		the important flag pins the answer.
	-->
	<DocSection title="Accordion with plus/minus indicators">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">type=&quot;multiple&quot;</code> — several items may stand
			open at once, so the indicator has to say open or closed per item rather than point at the one that
			is.
		{/snippet}
		<Accordion.Root type="multiple" value={["security"]}>
			{#each plusMinusItems as item (item.value)}
				<Accordion.Item value={item.value}>
					<Accordion.Trigger
						class="hover:no-underline *:data-[slot=accordion-trigger-icon]:hidden!"
					>
						<span>{item.trigger}</span>
						<PlusIcon
							class="ml-auto size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-aria-expanded/accordion-trigger:hidden"
						/>
						<MinusIcon
							class="ml-auto hidden size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 group-aria-expanded/accordion-trigger:inline"
						/>
					</Accordion.Trigger>
					<Accordion.Content>{item.content}</Accordion.Content>
				</Accordion.Item>
			{/each}
		</Accordion.Root>
	</DocSection>

	<!--
		demo 3. Each item becomes its own outlined card, so the root drops the shared
		divider (`border-0`) and the items are spaced by the root's own flex `gap-2` — upstream's
		`space-y-2`, restated the way this repository writes vertical rhythm.
	-->
	<DocSection title="Accordion with borders and rounded corners">
		<Accordion.Root type="single" value="billing" class="gap-2 border-0">
			{#each borderedItems as item (item.value)}
				<Accordion.Item value={item.value} class="rounded-lg border px-3">
					<Accordion.Trigger class="items-center py-3 font-medium hover:no-underline">
						{item.trigger}
					</Accordion.Trigger>
					<Accordion.Content class="pt-0 pb-4 text-muted-foreground">
						{#each item.paragraphs as paragraph (paragraph)}
							<p>{paragraph}</p>
						{/each}
					</Accordion.Content>
				</Accordion.Item>
			{/each}
		</Accordion.Root>
	</DocSection>

	<!--
		demo 4. The accordion carries no chrome of its own here: the card supplies the
		border, the ground and the heading, and the item dividers are all that is left to draw.
	-->
	<DocSection title="Accordion embedded within a Card">
		<Card.Root>
			<Card.Header>
				<Card.Title>Subscription &amp; Billing</Card.Title>
				<Card.Description>Common questions about your account, plans, and payments</Card.Description
				>
			</Card.Header>
			<Card.Content>
				<Accordion.Root type="multiple" value={["plans"]}>
					<Accordion.Item value="plans">
						<Accordion.Trigger>What subscription plans do you offer?</Accordion.Trigger>
						<Accordion.Content>
							<p>
								<a class="text-primary" href="#/components/accordion">Annual billing is available</a
								>
								with a 20% discount. All plans include a 14-day free trial with no credit card required.
							</p>
							<Button size="sm" class="mt-4">
								View plans
								<ArrowUpRightIcon data-icon="inline-end" />
							</Button>
						</Accordion.Content>
					</Accordion.Item>
					{#each cardItems as item (item.value)}
						<Accordion.Item value={item.value}>
							<Accordion.Trigger>{item.trigger}</Accordion.Trigger>
							<Accordion.Content>
								{#each item.paragraphs as paragraph (paragraph)}
									<p>{paragraph}</p>
								{/each}
							</Accordion.Content>
						</Accordion.Item>
					{/each}
				</Accordion.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 5. A disabled item keeps its row so the reader can see the feature exists
		and is locked; the component already dims it and drops its pointer events.

		`data-open:` is Tailwind's shorthand for `data-[state=open]`, the attribute bits-ui writes on
		the item — the same spelling the accordion's own content animation uses.
	-->
	<DocSection title="Accordion with disabled items and highlighted state">
		<Accordion.Root type="single" value="item-1" class="overflow-hidden rounded-lg border">
			{#each disabledItems as item (item.value)}
				<Accordion.Item value={item.value} disabled={item.disabled} class="data-open:bg-muted/50">
					<Accordion.Trigger class="px-4 py-4 hover:no-underline">
						{item.trigger}
					</Accordion.Trigger>
					<Accordion.Content class="px-4 pt-0 pb-4">{item.content}</Accordion.Content>
				</Accordion.Item>
			{/each}
		</Accordion.Root>
	</DocSection>

	<!--
		demo 6. The trigger becomes a settings row: an icon tile, the label, and an
		optional badge. `pl-11` on the body lines the copy up with the label rather than with the
		tile — 8 (tile) + 3 (gap) on the spacing scale.

		The soft badge is `success-subtle`, per the standing substitutions.
	-->
	<DocSection title="Advanced accordion with custom icons and badges">
		<Accordion.Root type="single" value="account" class="gap-3 border-0">
			{#each settingsItems as item (item.value)}
				<Accordion.Item value={item.value} class="rounded-lg border bg-card px-2">
					<Accordion.Trigger class="items-center px-1 py-3 font-semibold hover:no-underline">
						<div class="flex items-center gap-3">
							<div class="flex size-8 items-center justify-center rounded-lg bg-muted">
								<item.icon class="size-4 text-muted-foreground" />
							</div>
							<span>{item.trigger}</span>
							{#if item.badge}
								<Badge variant="success-subtle">{item.badge}</Badge>
							{/if}
						</div>
					</Accordion.Trigger>
					<Accordion.Content class="px-2 pt-0 pb-4 leading-relaxed text-muted-foreground">
						<div class="pl-11">{item.content}</div>
					</Accordion.Content>
				</Accordion.Item>
			{/each}
		</Accordion.Root>
	</DocSection>

	<!--
		demo 7. Same rows as the section above, with the hand-rolled outline traded for
		`Frame` + `FramePanel`: `stacked` fuses the panels into one segmented block and
		`spacing="sm"` sets the padding ladder, so nothing here has to restate a border or a corner
		radius.

		Each panel holds its OWN single-item accordion, which is upstream's arrangement and not an
		oversight — it is what lets every row open independently while the run still reads as one
		block.
	-->
	<DocSection title="Accordion items integrated within Frame and FramePanel">
		<Frame.Root stacked spacing="sm">
			{#each settingsItems as item (item.value)}
				<Frame.Panel>
					<Accordion.Root type="single" value={settingsItems[0].value} class="border-none">
						<Accordion.Item
							value={item.value}
							class="border-none bg-transparent not-last:border-b-0"
						>
							<Accordion.Trigger class="items-center px-1 py-1 font-semibold hover:no-underline">
								<div class="flex items-center gap-3">
									<div class="flex size-8 items-center justify-center rounded-lg bg-muted">
										<item.icon class="size-4 text-muted-foreground" />
									</div>
									<span>{item.trigger}</span>
									{#if item.badge}
										<Badge variant="success-subtle" class="ms-1">{item.badge}</Badge>
									{/if}
								</div>
							</Accordion.Trigger>
							<Accordion.Content class="p-0 ps-1 text-muted-foreground">
								<div class="ps-11 pe-2">{item.content}</div>
							</Accordion.Content>
						</Accordion.Item>
					</Accordion.Root>
				</Frame.Panel>
			{/each}
		</Frame.Root>
	</DocSection>

	<!--
		demo 8. An accordion inside an accordion's content. The inner root repeats the
		outer's card treatment one step tighter (`px-3` against `px-4`), which is what keeps the
		nesting legible without introducing a second border weight.
	-->
	<DocSection title="Nested accordion example with bordered items">
		<Accordion.Root type="single" value="details" class="gap-2 border-none">
			{#each nestedOuterItems as item (item.value)}
				<Accordion.Item value={item.value} class="rounded-lg border bg-transparent px-4">
					<Accordion.Trigger class="items-center py-3 font-medium hover:no-underline">
						{item.trigger}
					</Accordion.Trigger>
					<Accordion.Content class="text-muted-foreground">
						{#if item.nested}
							<Accordion.Root type="single" value="sub-item-1" class="gap-2 border-none">
								{#each nestedInnerItems as subItem (subItem.value)}
									<Accordion.Item
										value={subItem.value}
										class="rounded-lg border bg-transparent px-3"
									>
										<Accordion.Trigger
											class="items-center py-3 font-medium text-foreground hover:no-underline"
										>
											{subItem.trigger}
										</Accordion.Trigger>
										<Accordion.Content class="text-sm">{subItem.content}</Accordion.Content>
									</Accordion.Item>
								{/each}
							</Accordion.Root>
						{:else}
							{item.content}
						{/if}
					</Accordion.Content>
				</Accordion.Item>
			{/each}
		</Accordion.Root>
	</DocSection>

	<!--
		demo 9. The Frame arrangement again, this time carrying a member list: avatar,
		name, role badge, and the permissions the role actually grants.

		Two adaptations. The portraits are dropped for initials, as everywhere else here. And the
		role badge loses upstream's `size="sm"` — this repository's Badge has one height, so the
		prop has no counterpart to map onto.
	-->
	<DocSection title="User list accordion with avatars and role indicators">
		<Frame.Root stacked spacing="sm">
			{#each memberItems as user (user.id)}
				<Frame.Panel>
					<Accordion.Root type="single" value="1" class="border-none">
						<Accordion.Item
							value={user.id}
							class="border-none bg-transparent p-0 not-last:border-b-0"
						>
							<Accordion.Trigger class="items-center px-1 py-1 hover:no-underline">
								<div class="flex items-center gap-2">
									<Avatar.Root class="size-8 border">
										<Avatar.Fallback class="text-xs">{user.initials}</Avatar.Fallback>
									</Avatar.Root>
									<div class="inline-flex items-center gap-2">
										<span class="font-semibold tracking-tight text-foreground/90">{user.name}</span>
										<Badge variant={user.role === "Admin" ? "success-subtle" : "secondary"}>
											{user.role}
										</Badge>
									</div>
								</div>
							</Accordion.Trigger>
							<Accordion.Content class="py-0 pl-11 text-muted-foreground">
								{user.content}
							</Accordion.Content>
						</Accordion.Item>
					</Accordion.Root>
				</Frame.Panel>
			{/each}
		</Frame.Root>
	</DocSection>

	<!--
		demo 10. The indicator moves to the front of the row: `flex-row-reverse` with
		`justify-end` puts the chevron first and keeps the pair packed left, and the chevron rotates a
		quarter turn instead of flipping to a second glyph. The built-in pair is hidden the same way
		as in the plus/minus section.
	-->
	<DocSection title="Accordion with rotating arrow indicator">
		<Accordion.Root type="single" value="item-1">
			{#each rotatingItems as item (item.value)}
				<Accordion.Item value={item.value}>
					<Accordion.Trigger
						class="flex-row-reverse items-center justify-end gap-3 py-3 hover:no-underline *:data-[slot=accordion-trigger-icon]:hidden!"
					>
						<span class="font-medium text-foreground/90">{item.trigger}</span>
						<ChevronRightIcon
							class="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-aria-expanded/accordion-trigger:rotate-90"
						/>
					</Accordion.Trigger>
					<Accordion.Content class="ps-7 leading-relaxed text-muted-foreground">
						{item.content}
					</Accordion.Content>
				</Accordion.Item>
			{/each}
		</Accordion.Root>
	</DocSection>

	<!--
		demo 11. A setup checklist: one step done, one open, one still pending, each
		saying so through its leading marker — a filled check, a dot, a spinner.

		Upstream paints the in-progress dot `bg-yellow-500` on `bg-yellow-100 dark:bg-yellow-950`.
		Those are the `--warning` and `--warning-subtle` tokens here, and the subtle token already
		carries its own dark half, so the `dark:` override goes away with them.

		The steps are written out rather than driven from an array: each has a different marker, a
		different body and a different set of controls, so a loop would only be a switch statement
		wearing an each block.
	-->
	<DocSection
		title="Accordion pattern for onboarding or setup steps with icons, badges, and QR codes"
	>
		<Accordion.Root type="single" value="pos-app" class="overflow-hidden rounded-lg border">
			<Accordion.Item value="add-products" class="bg-transparent px-4">
				<Accordion.Trigger class="items-center py-4 font-semibold hover:no-underline">
					<div class="flex w-full items-center justify-between pr-4">
						<div class="flex items-center justify-center gap-3">
							<div class="flex size-5 items-center justify-center">
								<CircleCheckIcon class="size-5 fill-success text-background" />
							</div>
							<span class="text-sm font-medium">Add products</span>
						</div>
						<Badge variant="success-subtle">Ready</Badge>
					</div>
				</Accordion.Trigger>
				<Accordion.Content class="pr-0 pb-4 pl-8 leading-relaxed text-muted-foreground">
					Your products have been successfully added and are ready for sale.
				</Accordion.Content>
			</Accordion.Item>

			<Accordion.Item value="pos-app" class="bg-transparent px-4">
				<Accordion.Trigger class="items-center py-4 font-semibold hover:no-underline">
					<div class="flex w-full items-center justify-between pr-4">
						<div class="flex items-center gap-3">
							<div class="flex size-5 items-center justify-center rounded-full bg-warning-subtle">
								<div class="size-2 rounded-full bg-warning"></div>
							</div>
							<span class="text-sm font-medium text-foreground">
								Get the point of sale application
							</span>
						</div>
					</div>
				</Accordion.Trigger>
				<Accordion.Content class="pt-2 pl-8">
					<div class="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
						<div class="flex flex-1 flex-col gap-6">
							<p class="text-sm leading-relaxed text-muted-foreground">
								Scan the QR code or send yourself the link to get the app. The mobile app is where
								you'll manage orders, track inventory, and view analytics on the go.
							</p>
							<!--
								No size prop: the ramp's default rung IS `input-height` (40px,
								`--control-h-default`), so the button and the field share the
								group's seam with nothing to reconcile — the `lg`-for-40 recipe
								this demo used to carry is retired, and `lg` now means 48px.
							-->
							<ButtonGroup.Root>
								<Input placeholder="james@example.com" bind:value={onboardingEmail} />
								<Button variant="outline" aria-label="Send link">Send link</Button>
							</ButtonGroup.Root>
						</div>
						<div
							class="flex shrink-0 items-center justify-center rounded-lg border bg-muted/30 p-3"
						>
							<QrCodeIcon class="size-20" strokeWidth={1.5} />
						</div>
					</div>
				</Accordion.Content>
			</Accordion.Item>

			<Accordion.Item value="price-stock" class="bg-transparent px-4">
				<Accordion.Trigger class="items-center py-4 font-semibold hover:no-underline">
					<div class="flex w-full items-center justify-between pr-4">
						<div class="flex items-center gap-3">
							<div class="flex size-5 items-center justify-center">
								<Spinner class="opacity-60" />
							</div>
							<span class="text-sm font-medium text-muted-foreground"
								>Product price &amp; stock</span
							>
						</div>
					</div>
				</Accordion.Trigger>
				<Accordion.Content class="pl-8 text-sm leading-relaxed text-muted-foreground">
					Configure your product pricing and manage stock levels across all locations.
				</Accordion.Content>
			</Accordion.Item>
		</Accordion.Root>
	</DocSection>
</DocPage>
