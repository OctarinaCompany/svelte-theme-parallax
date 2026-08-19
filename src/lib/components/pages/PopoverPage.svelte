<script lang="ts">
	import { Popover as PopoverPrimitive } from "bits-ui";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Field from "$lib/components/ui/field/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Slider } from "$lib/components/ui/slider/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
	import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
	import CompassIcon from "@lucide/svelte/icons/compass";
	import ExternalLinkIcon from "@lucide/svelte/icons/external-link";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import SparklesIcon from "@lucide/svelte/icons/sparkles";
	import { format, formatDistanceToNow } from "date-fns";

	/**
	 * The Popover component page.
	 *
	 * The classic theme documents one card of four placements, so this page has no `DocSection`s.
	 */

	/** `.btn-secondary` at the base size, as derived on the Button page. */
	const trigger = cn(
		buttonVariants(),
		"h-10 rounded-md px-3 text-sm font-normal",
		"border-muted-foreground bg-muted-foreground text-primary-foreground hover:border-[color-mix(in_srgb,var(--muted-foreground)_85%,black)] hover:bg-[color-mix(in_srgb,var(--muted-foreground)_85%,black)]",
	);

	/**
	 * The popover surface. The reference stylesheet is one of the files the classic theme rewrites most heavily:
	 *
	 *   px/py         `popover-padding-x: .95rem` / `popover-padding-y: .8rem`, applied to
	 *                 the popover itself — the classic theme zeroes `popover-body-padding-*` and
	 *                 `popover-header-padding-*` so the box, not its parts, owns the inset
	 *   max-w-40      `popover-max-width: 10rem`, a THIRD of shadcn's `w-72`; the classic theme's
	 *                 popovers are labels, not panels
	 *   rounded-lg    `popover-border-radius: border-radius-lg`
	 *   text-xs       `popover-font-size` resolves to 13px, i.e. `font-size-sm`
	 *   gap-0         shadcn stacks header/body with `gap-4`; there is one child here
	 *
	 * The body colour is `popover-body-color: body-secondary-color` = `gray-600`, compiled
	 * as a literal rather than per-mode, so the classic theme keeps #95AAC9 in dark mode too;
	 * `--muted-foreground` steps to #6E84A3 there, which is the token that plays the role.
	 *
	 * THE OUTLINE, measured on the classic theme's own rendered page rather than reasoned about:
	 *
	 *   light   `popover-border-color` is `--bs-border-color-translucent` = rgba(18,38,63,.175),
	 *           i.e. `--foreground` at 17.5% — noticeably darker than a hairline
	 *   dark    the reference stylesheet's dark block pins it to `black` = #12263F, which `--background`
	 *           holds exactly in that mode
	 *
	 * `ring-border` was wrong in both: `--border` is #EDF2F9 in light, far paler than the
	 * translucent navy, and #1E3A5C in dark against the #12263F asked for. shadcn's own default
	 * `ring-foreground/10` was actually the closer of the two — the theme moved away from it.
	 */
	const content =
		"w-auto max-w-40 gap-0 rounded-lg px-[0.95rem] py-[0.8rem] text-xs text-muted-foreground ring-foreground/[17.5%] dark:ring-background";

	/**
	 * THE ARROW. The classic popover has one — `.popover-arrow`, at
	 * `popover-arrow-width: 1rem` by `popover-arrow-height: .5rem` — and shadcn's `Popover`
	 * does not render any, which is the one structural piece this theme was missing. Its
	 * `Tooltip` DOES ship an arrow, so the two components disagree with each other as well as
	 * with the classic framework.
	 *
	 * `PopoverPrimitive.Arrow` comes from bits-ui, which the generated component already wraps —
	 * so this composes around `ui/` rather than editing it, by house rule. It
	 * has to sit INSIDE `Popover.Content`: floating-ui's arrow middleware positions it by
	 * measuring it against its own content box.
	 *
	 * ITS OUTLINE IS TWO TRIANGLES, which is how the classic framework draws it and how it is drawn below.
	 * Measured on the classic theme's own page, `.popover-arrow` is a 16x8 box holding:
	 *
	 *   ::before   border-width: 8px 8px 0, border-top-color: <border colour>, bottom: 0
	 *   ::after    border-width: 8px 8px 0, border-top-color: <background>,    bottom: 1px
	 *
	 * The second triangle sits 1px higher than the first, so the border colour survives only as
	 * a sliver along the two slanted edges — and, because that 1px of overlap pushes the
	 * background triangle past the arrow's own top edge, it also covers the popover's border
	 * where the arrow meets it. The join is seamless; the outline is not.
	 *
	 * bits-ui's default arrow is a single SVG polygon, which cannot express that. Its `children`
	 * snippet replaces it, and the two CSS triangles below are the same construction as
	 * the classic, minus the pseudo-elements. `width`/`height` go unused once `children` is
	 * supplied, so the span is sized by class instead — floating-ui measures the element itself
	 * to place it.
	 */
	const arrow = "block h-2 w-4";

	/** `border-x-8 border-t-8` with transparent sides is a 16x8 downward triangle. */
	const arrowTriangle = "absolute size-0 border-x-8 border-x-transparent border-t-8";

	const placements = [
		{ side: "top", label: "Popover on top", body: "Top popover" },
		{ side: "right", label: "Popover on right", body: "Right popover" },
		{ side: "bottom", label: "Popover on bottom", body: "Bottom popover" },
		{ side: "left", label: "Popover on left", body: "Left popover" },
	] as const;

	/**
	 * THE PATTERN APPENDIX. Everything below the first card is the popover demo set, one
	 * `DocSection` per demo, in its documented order. Demo 2
	 * — four buttons opening a popover on each side — is the one demo not repeated, because the
	 * classic theme card above already shows exactly that composition.
	 *
	 * The appendix sections use the house `Popover.Content` as-is — no arrow, no `max-w-40`
	 * label sizing — because these popovers are panels, which is the shape the generated
	 * component ships. Portraits are the usual substitution: the repository ships no photographs,
	 * so demo 6's stock-photo headshots become initials, while demo 8's
	 * picsum preview stays remote — picsum is a placeholder service other pages here already use.
	 */

	/** demo 3 — the form's two inputs, live so typing works. */
	let popoverFormWidth = $state("100%");
	let popoverFormHeight = $state("25px");

	/**
	 * demo 9 — a ticking clock so the local-time row runs, and a reference time
	 * pinned two hours behind it so the relative label stays "about 2 hours ago".
	 */
	let relativeTimeNow = $state(new Date());
	const relativeTimeReference = $derived(new Date(relativeTimeNow.getTime() - 1000 * 60 * 120));
	const relativeTimeZone =
		Intl.DateTimeFormat().resolvedOptions().timeZone.split("/").pop()?.replace("_", " ") ?? "Local";

	$effect(() => {
		const timer = setInterval(() => (relativeTimeNow = new Date()), 1000);
		return () => clearInterval(timer);
	});

	/** demo 10 — the quick-settings controls. */
	let controlsDarkMode = $state(false);
	let controlsNotifications = $state(true);
	let controlsVolume = $state(75);

	/** demo 11 — the feature-tour steps and the cursor into them. */
	const navigationSteps = [
		{
			title: "Invite Your Team",
			description:
				"Add team members by email to collaborate on projects in real time. Assign roles and manage permissions from the team settings.",
		},
		{
			title: "Create a Project",
			description:
				"Set up your first project with a name, description, and timeline. Choose from templates or start from scratch.",
		},
		{
			title: "Connect Integrations",
			description:
				"Link tools like GitHub, Slack, and Figma to streamline your workflow and keep everything in sync.",
		},
		{
			title: "Set Up Notifications",
			description:
				"Customize which events trigger alerts — mentions, due dates, status changes, and deployment updates.",
		},
	];
	let navigationStep = $state(0);
</script>

<DocPage title="Popover">
	{#snippet subtitle()}
		Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/popover"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content class="flex flex-wrap gap-2">
			{#each placements as placement (placement.side)}
				<Popover.Root>
					<Popover.Trigger class={trigger}>{placement.label}</Popover.Trigger>
					<!--
						The classic popovers open on click here (`data-bs-toggle="popover"` with no
						`trigger` override is click plus focus); shadcn's are click-only, which is the
						same interaction minus the focus half.
					-->
					<Popover.Content side={placement.side} sideOffset={8} class={content}>
						{placement.body}
						<!-- 16 x 8 is `popover-arrow-width` / `popover-arrow-height`. -->
						<PopoverPrimitive.Arrow class={arrow}>
							<!-- The border triangle, flush with the arrow box. -->
							<span
								class="{arrowTriangle} bottom-0 border-t-foreground/[17.5%] dark:border-t-background"
							></span>
							<!-- The background triangle, 1px higher — it hides all but the slanted edges. -->
							<span class="{arrowTriangle} bottom-px border-t-popover"></span>
						</PopoverPrimitive.Arrow>
					</Popover.Content>
				</Popover.Root>
			{/each}
		</Card.Content>
	</Card.Root>

	<!-- demo 1 — header parts only, on a tight px-3 py-2 inset. -->
	<DocSection title="Basic popover">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<Popover.Root>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" class="w-fit" {...props}>Open Popover</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content align="start" class="px-3 py-2">
						<Popover.Header>
							<Popover.Title>Dimensions</Popover.Title>
							<Popover.Description>Set the dimensions for the layer.</Popover.Description>
						</Popover.Header>
					</Popover.Content>
				</Popover.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 3 — the classic dimensions form, horizontal fields inside the panel. -->
	<DocSection title="Popover with form">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<Popover.Root>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Open Popover</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-64" align="start">
						<Popover.Header>
							<Popover.Title>Dimensions</Popover.Title>
							<Popover.Description>Set the dimensions for the layer.</Popover.Description>
						</Popover.Header>
						<Field.FieldGroup class="gap-2">
							<Field.Field orientation="horizontal">
								<Field.FieldLabel for="popover-form-width" class="w-1/2">Width</Field.FieldLabel>
								<Input id="popover-form-width" bind:value={popoverFormWidth} />
							</Field.Field>
							<Field.Field orientation="horizontal">
								<Field.FieldLabel for="popover-form-height" class="w-1/2">Height</Field.FieldLabel>
								<Input id="popover-form-height" bind:value={popoverFormHeight} />
							</Field.Field>
						</Field.FieldGroup>
					</Popover.Content>
				</Popover.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 4 — the `align` axis, complementing the `side` axis the classic card shows. -->
	<DocSection title="Popover alignment positions">
		<Card.Root>
			<Card.Content class="flex items-center justify-center gap-2">
				{#each ["start", "center", "end"] as const as alignment (alignment)}
					<Popover.Root>
						<Popover.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" size="sm" class="capitalize" {...props}>
									{alignment}
								</Button>
							{/snippet}
						</Popover.Trigger>
						<Popover.Content align={alignment} class="w-auto">
							<p>Aligned to {alignment}</p>
						</Popover.Content>
					</Popover.Root>
				{/each}
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 5 — layering: the popover portals above the dialog's overlay. -->
	<DocSection title="Popover within a dialog">
		<Card.Root>
			<Card.Content class="flex items-center justify-center">
				<Dialog.Root>
					<Dialog.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>Open Dialog</Button>
						{/snippet}
					</Dialog.Trigger>
					<Dialog.Content class="p-4">
						<Dialog.Header>
							<Dialog.Title>Popover Example</Dialog.Title>
							<Dialog.Description>Click the button below to see the popover.</Dialog.Description>
						</Dialog.Header>
						<Popover.Root>
							<Popover.Trigger>
								{#snippet child({ props })}
									<Button variant="outline" class="w-fit" {...props}>Open Popover</Button>
								{/snippet}
							</Popover.Trigger>
							<Popover.Content align="start" class="w-auto">
								<Popover.Header>
									<Popover.Title>Popover in Dialog</Popover.Title>
									<Popover.Description>
										This popover appears inside a dialog. Click the button to open it.
									</Popover.Description>
								</Popover.Header>
							</Popover.Content>
						</Popover.Root>
					</Dialog.Content>
				</Dialog.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 6 — a profile hover-card composition, click-triggered. The stock-photo
		portrait becomes an initials fallback, per the page header note.
	-->
	<DocSection title="Popover with user profile details">
		<Card.Root>
			<Card.Content class="flex min-h-[100px] items-center justify-center">
				<Popover.Root>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" class="h-auto justify-start py-1.5" {...props}>
								<Avatar.Root class="size-8">
									<Avatar.Fallback>MC</Avatar.Fallback>
								</Avatar.Root>
								<div class="flex flex-col gap-0.5 text-left">
									<p class="leading-none font-medium">Marcus Chen</p>
									<p class="text-muted-foreground">@mchen_design</p>
								</div>
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-64">
						<div class="flex flex-col gap-2.5">
							<div class="flex items-start justify-between">
								<Avatar.Root class="size-12">
									<Avatar.Fallback>MC</Avatar.Fallback>
								</Avatar.Root>
								<Button size="sm" variant="outline">Follow</Button>
							</div>
							<div class="flex flex-col gap-1">
								<h4 class="leading-none font-semibold">Marcus Chen</h4>
								<p class="text-muted-foreground">@mchen_design</p>
							</div>
							<p class="leading-relaxed">Product Designer specializing in design systems.</p>
							<div class="flex items-center gap-4">
								<div class="flex items-center gap-1">
									<span class="font-semibold tabular-nums">1.2k</span>
									<span class="text-muted-foreground">Followers</span>
								</div>
								<div class="flex items-center gap-1">
									<span class="font-semibold tabular-nums">482</span>
									<span class="text-muted-foreground">Following</span>
								</div>
							</div>
						</div>
					</Popover.Content>
				</Popover.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 7 — a zero-padding panel with its own tinted header band. -->
	<DocSection title="Popover with custom content">
		<Card.Root>
			<Card.Content class="flex min-h-[100px] items-center justify-center">
				<Popover.Root>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>
								<SparklesIcon data-icon="inline-start" />
								AI Assistant
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-80 gap-0 overflow-hidden p-0" align="center">
						<div class="border-b border-primary/10 bg-primary/5 p-2">
							<div class="flex items-center gap-2 font-semibold text-primary">
								<SparklesIcon class="size-4" />
								<span>Smart Suggestions</span>
							</div>
						</div>
						<div class="flex flex-col gap-3 p-2">
							<p class="leading-relaxed text-muted-foreground">
								Our AI analyzes your workflow to provide tailored recommendations. It helps you
								automate repetitive tasks and optimizes your design process in real-time.
							</p>
							<div class="grid grid-cols-2 items-center gap-2">
								<Button size="sm">Enable AI</Button>
								<Button size="sm" variant="outline">Learn more</Button>
							</div>
						</div>
					</Popover.Content>
				</Popover.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 8 — a template preview card; the image keeps upstream's picsum service. -->
	<DocSection title="Popover with media preview">
		<Card.Root>
			<Card.Content class="flex min-h-[100px] items-center justify-center">
				<Popover.Root>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" size="sm" {...props}>Preview Media</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-[320px] gap-0 overflow-hidden p-0" align="end">
						<div class="aspect-video w-full overflow-hidden bg-muted">
							<img
								src="https://picsum.photos/seed/portfolio/1000/800?grayscale"
								alt="Website Template Preview"
								width={320}
								height={180}
								class="size-full object-cover transition-transform duration-500 hover:scale-105"
							/>
						</div>
						<div class="flex flex-col gap-3 p-2">
							<div class="flex flex-col gap-1 pt-1">
								<h4 class="text-sm leading-none font-semibold">Portfolio Pro</h4>
								<p class="text-xs text-muted-foreground">
									Premium photography template with dark mode.
								</p>
							</div>
							<div class="grid grid-cols-2 items-center gap-2">
								<Button size="sm" class="flex-1">Install Template</Button>
								<Button size="sm" variant="outline" aria-label="View demo in new tab">
									Learn more
									<ExternalLinkIcon data-icon="inline-end" />
								</Button>
							</div>
						</div>
					</Popover.Content>
				</Popover.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 9 — a dashed-underline timestamp opening a two-timezone breakdown. The
		local row ticks once a second off `relativeTimeNow`; the reference row is UTC-labelled
		but rendered with `date-fns`'s local `format`, exactly as upstream does.
	-->
	<DocSection title="Relative time popover with timezone details">
		<Card.Root>
			<Card.Content class="flex min-h-[100px] items-center justify-center">
				<p class="text-sm text-muted-foreground">
					Last deployed
					<Popover.Root>
						<Popover.Trigger
							class="cursor-default text-foreground underline decoration-dashed decoration-1 underline-offset-4 outline-hidden"
						>
							{formatDistanceToNow(relativeTimeReference, { addSuffix: true })}
						</Popover.Trigger>
						<Popover.Content class="w-auto max-w-86 gap-0 p-0" align="start">
							<p class="border-b px-2 py-1 font-medium text-foreground">
								{formatDistanceToNow(relativeTimeReference, { addSuffix: true })}
							</p>
							<div class="px-2 py-1.5">
								<table>
									<tbody>
										<tr>
											<td class="pr-4 pb-1.5"><Badge variant="outline">UTC</Badge></td>
											<td class="pr-6 pb-1.5">{format(relativeTimeReference, "MMM d, yyyy")}</td>
											<td class="pb-1.5 text-muted-foreground">
												{format(relativeTimeReference, "hh:mm:ss a")}
											</td>
										</tr>
										<tr>
											<td class="pr-4">
												<span class="rounded bg-muted px-1.5 py-0.5 font-medium">
													{relativeTimeZone}
												</span>
											</td>
											<td class="pr-6">{format(relativeTimeNow, "MMM d, yyyy")}</td>
											<td class="w-28 text-muted-foreground">
												{format(relativeTimeNow, "hh:mm:ss a")}
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</Popover.Content>
					</Popover.Root>
					by CI/CD pipeline.
				</p>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 10 — live form controls inside the panel: two switches and a slider. -->
	<DocSection title="Popover with controls">
		<Card.Root>
			<Card.Content class="flex min-h-[100px] items-center justify-center">
				<Popover.Root>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" size="icon" aria-label="Quick settings" {...props}>
								<SettingsIcon aria-hidden="true" />
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-72 gap-0 p-0" align="end">
						<div class="border-b p-3">
							<h4 class="m-0 font-medium">Quick Settings</h4>
							<p class="text-muted-foreground">Adjust your preferences.</p>
						</div>
						<div class="flex flex-col gap-3 p-3 pb-4">
							<div class="flex items-center justify-between">
								<label for="popover-qs-dark">Dark Mode</label>
								<Switch id="popover-qs-dark" bind:checked={controlsDarkMode} />
							</div>
							<div class="flex items-center justify-between">
								<label for="popover-qs-notif">Notifications</label>
								<Switch id="popover-qs-notif" bind:checked={controlsNotifications} />
							</div>
							<div class="flex flex-col gap-2">
								<div class="flex items-center justify-between">
									<label for="popover-qs-volume">Volume</label>
									<span class="text-muted-foreground">{controlsVolume}%</span>
								</div>
								<Slider
									id="popover-qs-volume"
									type="single"
									bind:value={controlsVolume}
									max={100}
									step={1}
								/>
							</div>
						</div>
					</Popover.Content>
				</Popover.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 11 — a stepper inside the panel. Upstream sizes its ghost buttons with
		`className="size-6"` on `size="icon"`; the house ramp has that exact box as `icon-xs`,
		so the class goes away.
	-->
	<DocSection title="Popover with navigation">
		<Card.Root>
			<Card.Content class="flex min-h-[100px] items-center justify-center">
				<Popover.Root>
					<Popover.Trigger>
						{#snippet child({ props })}
							<Button variant="outline" {...props}>
								<CompassIcon data-icon="inline-start" aria-hidden="true" />
								Feature Tour
							</Button>
						{/snippet}
					</Popover.Trigger>
					<Popover.Content class="w-72 gap-2 px-3 pt-3 pb-2" side="top" sideOffset={8}>
						<div class="flex flex-col gap-2">
							<p class="leading-tight font-medium">{navigationSteps[navigationStep].title}</p>
							<p class="text-muted-foreground">{navigationSteps[navigationStep].description}</p>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-muted-foreground">
								{navigationStep + 1} of {navigationSteps.length}
							</span>
							<div class="flex gap-0.5">
								<Button
									aria-label="Previous step"
									disabled={navigationStep === 0}
									onclick={() => (navigationStep = Math.max(0, navigationStep - 1))}
									size="icon-xs"
									variant="ghost"
								>
									<ArrowLeftIcon aria-hidden="true" />
								</Button>
								<Button
									aria-label="Next step"
									disabled={navigationStep === navigationSteps.length - 1}
									onclick={() =>
										(navigationStep = Math.min(navigationSteps.length - 1, navigationStep + 1))}
									size="icon-xs"
									variant="ghost"
								>
									<ArrowRightIcon aria-hidden="true" />
								</Button>
							</div>
						</div>
					</Popover.Content>
				</Popover.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
