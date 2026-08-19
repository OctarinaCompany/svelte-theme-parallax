<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as Field from "$lib/components/ui/field/index.js";
	import * as Frame from "$lib/components/ui/frame/index.js";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { IconTile } from "$lib/components/ui/icon-tile/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import BellIcon from "@lucide/svelte/icons/bell";
	import BugIcon from "@lucide/svelte/icons/bug";
	import ChartColumnIcon from "@lucide/svelte/icons/chart-column";
	import CircleHelpIcon from "@lucide/svelte/icons/circle-help";
	import DatabaseIcon from "@lucide/svelte/icons/database";
	import GlobeIcon from "@lucide/svelte/icons/globe";
	import MailIcon from "@lucide/svelte/icons/mail";
	import SmartphoneIcon from "@lucide/svelte/icons/smartphone";

	/**
	 * The Switch component page (`the reference docs#forms`, the `Switch` section).
	 *
	 * The classic theme shows one card holding one switch and its label, and nothing else — no sizes, no
	 * variants, no states. Everything the theme actually needed is in the control itself, so the
	 * geometry and the four state colours live in `app.css` beside the other `data-slot` rules;
	 * the comment there records why they cannot be call-site classes.
	 */
	let checked = $state(false);

	/*
	 * Everything below the first card is the switch demo set. demo 1
	 * is a bare switch beside its label, which the classic card above already shows, so it is not
	 * repeated here.
	 *
	 * Every demo binds its own page-level state rather than relying on an uncontrolled default:
	 * the switch's `checked` is a `$bindable`, and a section that starts ON has to say so from the
	 * page.
	 */
	let switchDescriptionChecked = $state(false);
	let switchSizeDefault = $state(false);

	let switchGroupEmail = $state(true);
	let switchGroupSms = $state(false);
	let switchGroupPush = $state(true);

	let switchListPush = $state(true);
	let switchListEmail = $state(false);
	let switchListSms = $state(false);

	let switchIconsPush = $state(true);
	let switchIconsEmail = $state(false);
	let switchIconsSms = $state(false);

	let switchFrameProfile = $state(true);
	let switchFrameOnline = $state(true);
	let switchFrameData = $state(false);

	let switchTooltipTwoFactor = $state(false);

	let switchBadgeCopilot = $state(true);
	let switchBadgeSuggestions = $state(false);

	let switchColorInfo = $state(true);
	let switchColorSuccess = $state(true);
	let switchColorWarning = $state(true);

	let switchDestructiveWipe = $state(false);

	/** demo 13 — the labels are static, only the checked column is state. */
	const switchEditorSettings = [
		{ id: "sw-auto-save", label: "Auto-save", description: "Save changes automatically" },
		{ id: "sw-spell-check", label: "Spell check", description: "Highlight spelling errors" },
		{ id: "sw-line-numbers", label: "Line numbers", description: "Show line numbers in editor" },
	];
	let switchEditorChecked = $state([true, true, false]);

	/** demo 14 — same split: the feature copy is constant, the toggles are state. */
	const switchFeatureCards = [
		{
			id: "sw-feat-analytics",
			title: "Analytics",
			description: "Track page views and user interactions",
			icon: ChartColumnIcon,
		},
		{
			id: "sw-feat-logging",
			title: "Error Logging",
			description: "Capture and report runtime errors",
			icon: BugIcon,
		},
		{
			id: "sw-feat-cdn",
			title: "CDN Caching",
			description: "Serve static assets from edge network",
			icon: GlobeIcon,
		},
		{
			id: "sw-feat-backup",
			title: "Auto Backup",
			description: "Daily snapshots of your database",
			icon: DatabaseIcon,
		},
	];
	let switchFeatureChecked = $state([true, true, false, false]);
</script>

<DocPage title="Switch">
	{#snippet subtitle()}
		A two-state toggle that trades the checkbox's tick for a sliding thumb. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/switch"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<!--
				`.form-check.form-switch` is `padding-left: 3.5rem` with the input floated back out
				of it by `-3.5rem` — the shape the classic framework needs to lay out a bare `<input>` and its
				sibling label. What it measures out to is a 24px switch, 8px of gap
				(`form-switch-padding-start - form-switch-width`), then the label centred against
				it: `margin-top: calc(.75rem - .75em)` is the centring formula written out, since
				the label's line box is `1.5em` = 22.5px inside a 24px row. A flex row states the
				same three facts directly.
			-->
			<div class="flex items-center gap-2">
				<Switch id="switch-classic-default" bind:checked />
				<!--
					`font-normal` because `.form-check-label` sets only `cursor`, so it inherits
					`font-weight-base` (400) where shadcn's `Label` asks for 500.
				-->
				<Label for="switch-classic-default" class="font-normal">
					The classic switch, unchecked to start
				</Label>
			</div>
		</Card.Content>
	</Card.Root>

	<DocSection title="Switch with description">
		<Card.Root>
			<Card.Content>
				<!--
					demo 2 — the whole row is the label, so the description text is a click
					target too. `Field.Content` is what makes the horizontal field top-align the
					switch against the first line rather than centring it on the two-line block.
				-->
				<div class="flex items-center justify-center">
					<Field.Label for="switch-with-desc" class="w-full max-w-xs">
						<Field.Field orientation="horizontal">
							<Field.Content>
								<Field.Title>Share across devices</Field.Title>
								<Field.Description>
									Focus is shared across devices, and turns off when you leave the app.
								</Field.Description>
							</Field.Content>
							<Switch id="switch-with-desc" bind:checked={switchDescriptionChecked} />
						</Field.Field>
					</Field.Label>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Disabled switch">
		{#snippet blurb()}
			<code>disabled</code> keeps the thumb where it is and drops the whole control to 50% opacity, so
			the off and on states stay distinguishable while unusable.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 3 -->
				<div class="flex flex-col items-start gap-3">
					<div class="flex items-center gap-2">
						<Switch id="switch-disabled-unchecked" disabled />
						<Label for="switch-disabled-unchecked">Disabled (Unchecked)</Label>
					</div>
					<div class="flex items-center gap-2">
						<!-- `checked={true}`, not the `checked` shorthand: that would read the page's own
						`checked` state from the card above. A disabled switch never writes back, so a
						literal is enough here. -->
						<Switch id="switch-disabled-checked" checked={true} disabled />
						<Label for="switch-disabled-checked">Disabled (Checked)</Label>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="One size, by design">
		{#snippet blurb()}
			Upstream ships a <code>sm</code> variant; this theme does not. The classic theme's
			<code>.form-switch</code> is one object — a 48×24 track with an 18px knob — and
			<code>app.css</code> states that geometry for every instance, so the component offers no size prop
			and every switch on this page is the same switch.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 4 showed upstream's two sizes; the theme has one. -->
				<div class="flex items-center gap-2">
					<Switch id="switch-default" bind:checked={switchSizeDefault} />
					<Label for="switch-default">The switch, at its only size</Label>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Switch group">
		<Card.Root>
			<Card.Content>
				<!--
					demo 5 — a vertical `Field` whose first label names the group and whose
					children are horizontal fields, so the group heading and its rows share one
					gap ladder.
				-->
				<Field.Field class="w-auto">
					<Field.Label>Notification Settings</Field.Label>
					<Field.Field orientation="horizontal">
						<Switch id="sg-email" bind:checked={switchGroupEmail} />
						<Field.Label for="sg-email">Email notifications</Field.Label>
					</Field.Field>
					<Field.Field orientation="horizontal">
						<Switch id="sg-sms" bind:checked={switchGroupSms} />
						<Field.Label for="sg-sms">SMS notifications</Field.Label>
					</Field.Field>
					<Field.Field orientation="horizontal">
						<Switch id="sg-push" bind:checked={switchGroupPush} />
						<Field.Label for="sg-push">Push notifications</Field.Label>
					</Field.Field>
				</Field.Field>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Switch list in card with separators">
		<Card.Root>
			<Card.Content>
				<!--
					demo 6 — the settings-list shape: a card with no padding of its own,
					`Field.Group` collapsed to `gap-0`, and each row padded from its label so the
					separators run edge to edge.
				-->
				<div class="flex justify-center">
					<Card.Root class="w-full max-w-xs p-0">
						<Field.Group class="gap-0">
							<Field.Field>
								<Field.Label class="justify-between px-4 py-3">
									<Field.Title>Push notifications</Field.Title>
									<Switch bind:checked={switchListPush} />
								</Field.Label>
							</Field.Field>
							<Separator />
							<Field.Field>
								<Field.Label class="justify-between px-4 py-3">
									<Field.Title>Email notifications</Field.Title>
									<Switch bind:checked={switchListEmail} />
								</Field.Label>
							</Field.Field>
							<Separator />
							<Field.Field>
								<Field.Label class="justify-between px-4 py-3">
									<Field.Title>SMS notifications</Field.Title>
									<Switch bind:checked={switchListSms} />
								</Field.Label>
							</Field.Field>
						</Field.Group>
					</Card.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Switch list in card with icons">
		<Card.Root>
			<Card.Content>
				<!--
					demo 7 — same list with a leading glyph per row. The icons carry
					`opacity-60` so they read as row markers, not as actions. `Field.Title` is a plain
					flex row with no icon rule of its own, so the glyph size is set here.
				-->
				<div class="flex justify-center">
					<Card.Root class="w-full max-w-xs p-0">
						<Field.Group class="gap-0">
							<Field.Field>
								<Field.Label class="justify-between px-4 py-3">
									<Field.Title class="flex items-center gap-2">
										<BellIcon class="size-4 opacity-60" aria-hidden="true" />
										Push notifications
									</Field.Title>
									<Switch bind:checked={switchIconsPush} />
								</Field.Label>
							</Field.Field>
							<Separator />
							<Field.Field>
								<Field.Label class="justify-between px-4 py-3">
									<Field.Title class="flex items-center gap-2">
										<MailIcon class="size-4 opacity-60" aria-hidden="true" />
										Email notifications
									</Field.Title>
									<Switch bind:checked={switchIconsEmail} />
								</Field.Label>
							</Field.Field>
							<Separator />
							<Field.Field>
								<Field.Label class="justify-between px-4 py-3">
									<Field.Title class="flex items-center gap-2">
										<SmartphoneIcon class="size-4 opacity-60" aria-hidden="true" />
										SMS notifications
									</Field.Title>
									<Switch bind:checked={switchIconsSms} />
								</Field.Label>
							</Field.Field>
						</Field.Group>
					</Card.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Switch in frame">
		{#snippet blurb()}
			The same list inside a <code>Frame</code>, which gives the group a titled shell and an inset
			panel instead of a bare card.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 8 — the panel is padded by its rows, not by itself, so `p-0!`
					overrides the frame's own `--frame-panel-*` padding and `overflow-hidden` keeps
					the first and last rows inside the panel's rounded corners.
				-->
				<div class="flex justify-center">
					<Frame.Root spacing="sm" class="w-full max-w-xs">
						<Frame.Header>
							<Frame.Title>Privacy Settings</Frame.Title>
						</Frame.Header>
						<Frame.Panel class="overflow-hidden p-0!">
							<Field.Group class="gap-0">
								<Field.Field>
									<Field.Label class="justify-between p-3">
										<Field.Title>Profile visibility</Field.Title>
										<Switch bind:checked={switchFrameProfile} />
									</Field.Label>
								</Field.Field>
								<Separator />
								<Field.Field>
									<Field.Label class="justify-between p-3">
										<Field.Title>Show online status</Field.Title>
										<Switch bind:checked={switchFrameOnline} />
									</Field.Label>
								</Field.Field>
								<Separator />
								<Field.Field>
									<Field.Label class="justify-between p-3">
										<Field.Title>Allow data collection</Field.Title>
										<Switch bind:checked={switchFrameData} />
									</Field.Label>
								</Field.Field>
							</Field.Group>
						</Frame.Panel>
					</Frame.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Switch with tooltip info">
		<Card.Root>
			<Card.Content>
				<!--
					demo 9 — the help glyph sits outside the label so clicking it opens the
					tooltip instead of toggling the switch.
				-->
				<div class="flex items-center justify-center">
					<Field.Field orientation="horizontal">
						<Switch id="sw-tooltip" bind:checked={switchTooltipTwoFactor} />
						<div class="flex items-center gap-1.5">
							<Field.Label for="sw-tooltip">Two-factor authentication</Field.Label>
							<Tooltip.Provider>
								<Tooltip.Root>
									<Tooltip.Trigger
										class="text-muted-foreground"
										aria-label="About two-factor authentication"
									>
										<CircleHelpIcon class="size-3.5" aria-hidden="true" />
									</Tooltip.Trigger>
									<Tooltip.Content side="right">
										Adds an extra layer of security by requiring a verification code on login.
									</Tooltip.Content>
								</Tooltip.Root>
							</Tooltip.Provider>
						</div>
					</Field.Field>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Switch with badges">
		<Card.Root>
			<Card.Content>
				<!--
					demo 10 — the badge annotates the setting, so it lives beside the label
					text and not inside it: a nested interactive-looking chip inside a `for=` label
					would still toggle the switch.
				-->
				<div class="flex flex-col gap-4">
					<Field.Field orientation="horizontal">
						<Switch id="sw-badge-1" bind:checked={switchBadgeCopilot} />
						<div class="flex items-center gap-2">
							<Field.Label for="sw-badge-1">AI Copilot</Field.Label>
							<Badge class="h-4.5 rounded-full px-1.5 text-[10px] tracking-wider uppercase">
								New
							</Badge>
						</div>
					</Field.Field>
					<Field.Field orientation="horizontal">
						<Switch id="sw-badge-2" bind:checked={switchBadgeSuggestions} />
						<div class="flex items-center gap-2">
							<Field.Label for="sw-badge-2">Smart suggestions</Field.Label>
							<Badge
								variant="secondary"
								class="h-4.5 rounded-full px-1.5 text-[10px] tracking-wider uppercase"
							>
								Beta
							</Badge>
						</div>
					</Field.Field>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Colored switches">
		{#snippet blurb()}
			The checked track is a single <code>data-checked:bg-*</code> class, so a switch can carry a status
			colour where the toggle itself means something.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 11 picks blue / green / yellow from the Tailwind palette. Raw
					colours have no place here, so the three become the theme's status tokens —
					info, success and warning — which are exactly those hues in `app.css`.
				-->
				<div class="flex flex-col gap-4">
					<Field.Field orientation="horizontal" class="w-auto">
						<Switch id="sw-info" class="data-checked:bg-info" bind:checked={switchColorInfo} />
						<Field.Label for="sw-info">Info</Field.Label>
					</Field.Field>
					<Field.Field orientation="horizontal" class="w-auto">
						<Switch
							id="sw-success"
							class="data-checked:bg-success"
							bind:checked={switchColorSuccess}
						/>
						<Field.Label for="sw-success">Success</Field.Label>
					</Field.Field>
					<Field.Field orientation="horizontal" class="w-auto">
						<Switch
							id="sw-warning"
							class="data-checked:bg-warning"
							bind:checked={switchColorWarning}
						/>
						<Field.Label for="sw-warning">Warning</Field.Label>
					</Field.Field>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Destructive switch with confirmation text">
		<Card.Root>
			<Card.Content>
				<!--
					demo 12 — a switch that arms a destructive behaviour: the title takes
					`text-destructive` and the description spells out that the action cannot be
					undone. Upstream calls the variant "danger"; here the token is `destructive`.
				-->
				<div class="mx-auto w-full max-w-xs">
					<Field.Label for="sw-danger">
						<Field.Field orientation="horizontal">
							<Field.Content>
								<Field.Title class="text-destructive">Delete all data on sign out</Field.Title>
								<Field.Description>
									When enabled, all local data will be permanently removed when you sign out. This
									action cannot be undone.
								</Field.Description>
							</Field.Content>
							<Switch
								id="sw-danger"
								class="data-checked:bg-destructive"
								bind:checked={switchDestructiveWipe}
							/>
						</Field.Field>
					</Field.Label>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Compact settings table with switches">
		<Card.Root>
			<Card.Content>
				<!--
					demo 13 — rows are `<label>` elements rather than a table, so the whole
					row toggles; `sm` switches keep the 3-row block compact.
				-->
				<div class="mx-auto w-full max-w-xs">
					<p class="mb-3 text-sm font-medium">Editor Preferences</p>
					<Separator />
					<div class="flex flex-col">
						{#each switchEditorSettings as setting, index (setting.id)}
							<label
								for={setting.id}
								class="flex cursor-pointer items-center justify-between border-b py-3 last:border-b-0"
							>
								<div class="flex flex-col gap-0.5">
									<span class="text-sm font-medium">{setting.label}</span>
									<span class="text-xs text-muted-foreground">{setting.description}</span>
								</div>
								<Switch id={setting.id} bind:checked={switchEditorChecked[index]} />
							</label>
						{/each}
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Switch with descriptions in card grid">
		<Card.Root>
			<Card.Content>
				<!--
					demo 14 — feature toggles as cards. Upstream draws the icon chip inline
					with a bordered `div`; `IconTile` in its `outline` variant is that same chip as a
					component, so the glyph size comes from the tile rather than from a class here.
					`p-0!` on the label hands the padding to the field inside it, which is what the
					label's own `*:data-[slot=field]:p-2.5` rule expects.
				-->
				<div class="flex justify-center">
					<Field.Group class="grid w-full max-w-md grid-cols-1 gap-4 sm:grid-cols-2">
						{#each switchFeatureCards as feature, index (feature.id)}
							{@const Icon = feature.icon}
							<Field.Label for={feature.id} class="p-0!">
								<Field.Field orientation="horizontal">
									<Field.Content>
										<Field.Title class="flex items-start gap-2">
											<IconTile variant="outline" size="sm" aria-hidden="true">
												<Icon />
											</IconTile>
											<div class="flex flex-col items-start gap-0.5">
												<span class="text-sm font-semibold">{feature.title}</span>
												<span class="text-xs text-muted-foreground">{feature.description}</span>
											</div>
										</Field.Title>
									</Field.Content>
									<Switch id={feature.id} bind:checked={switchFeatureChecked[index]} />
								</Field.Field>
							</Field.Label>
						{/each}
					</Field.Group>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
