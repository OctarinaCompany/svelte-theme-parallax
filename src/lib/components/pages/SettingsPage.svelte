<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import CircleOffIcon from "@lucide/svelte/icons/circle-off";
	import Grid3x3Icon from "@lucide/svelte/icons/grid-3x3";
	import GripIcon from "@lucide/svelte/icons/grip";
	import ContrastIcon from "@lucide/svelte/icons/contrast";
	import DropletIcon from "@lucide/svelte/icons/droplet";
	import MonitorIcon from "@lucide/svelte/icons/monitor";
	import MoonIcon from "@lucide/svelte/icons/moon";
	import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
	import SunIcon from "@lucide/svelte/icons/sun";
	import SunMoonIcon from "@lucide/svelte/icons/sun-moon";
	import { setMode, userPrefersMode } from "mode-watcher";

	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { useSidebar } from "$lib/components/ui/sidebar/index.js";
	import { cn } from "$lib/utils.js";
	import { activeTheme, DEFAULT_THEME, setTheme, THEMES } from "$lib/themes/index.js";
	import {
		headerAutoHide,
		headerFloating,
		setHeaderAutoHide,
		setHeaderFloating,
	} from "$lib/hooks/header-behaviour.svelte.js";
	import { setSidebarFloating, sidebarFloating } from "$lib/hooks/sidebar-behaviour.svelte.js";
	import HeaderToggle from "$lib/components/navigation/HeaderToggle.svelte";
	import SidebarModeToggle from "$lib/components/navigation/SidebarModeToggle.svelte";
	import {
		GRADIENTS,
		PATTERNS,
		activeGradient,
		activePattern,
		grainOn,
		markOn,
		backdropAngle,
		backdropDensity,
		backdropFade,
		backdropFadeAngle,
		markOffsetX,
		markOffsetY,
		markScale,
		markTurn,
		markCorner,
		markInkStrength,
		gradientStrength,
		patternStrength,
		MARK_ANCHORS,
		MARK_OPACITY_MAX,
		MARK_OPACITY_MIN,
		LAYER_OPACITY_MAX,
		LAYER_OPACITY_MIN,
		BACKDROP_DENSITY_MAX,
		BACKDROP_DENSITY_MIN,
		BACKDROP_FADE_MAX,
		BACKDROP_FADE_MIN,
		MARK_OFFSET_MAX,
		MARK_OFFSET_MIN,
		MARK_ZOOM_MAX,
		MARK_ZOOM_MIN,
		MARK_SOURCE,
		resetBackdrop,
		setBackdropAngle,
		setBackdropDensity,
		setBackdropFade,
		setBackdropFadeAngle,
		setGradient,
		setGrain,
		setMark,
		setMarkOffsetX,
		setMarkOffsetY,
		setMarkScale,
		setMarkTurn,
		setMarkAnchor,
		setMarkInkStrength,
		setGradientStrength,
		setPatternStrength,
		setPattern,
		type GradientId,
		type MarkAnchor,
		type PatternId,
	} from "$lib/hooks/backdrop.svelte.js";
	import { Slider } from "$lib/components/ui/slider/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import * as AngleSlider from "$lib/components/ui/angle-slider/index.js";
	import { headerMode, setHeaderMode, type HeaderMode } from "$lib/hooks/header-mode.svelte.js";
	import { setSidebarMode, sidebarMode, type SidebarMode } from "$lib/hooks/sidebar-mode.svelte.js";
	import { href } from "$lib/hooks/route.svelte.js";

	/**
	 * The Settings page: every look-and-feel control the theme has, on one page, driving the
	 * persisted state directly (seven localStorage keys plus the sidebar cookie) — so a switch here
	 * and the header's own toggle are the same state, in both directions.
	 *
	 * IT IS NOW THE ONLY HOME for three of them. The header bar carried four unlabelled icon
	 * dropdowns; it keeps the light/dark toggle — the one appearance choice a reader makes while
	 * reading — and the palette, the sidebar and the header's own options moved here, where each
	 * gets a section, a name and a sentence. The page also reaches one value the bar cannot:
	 * `System` mode, since that toggle is a deliberate two-state Swap.
	 *
	 * The organising idea is scope: one section per surface — the document, the palette, the
	 * backdrop, the sidebar, the header — which is the same widening order the icons used to sit in.
	 * The backdrop sits beside the palette because the two are read together: one chooses the ink,
	 * the other what is drawn with it.
	 */

	const sidebar = useSidebar();

	/**
	 * A BEARING HAS NO ENDS, AND A DIAL DOES. `AngleSlider` clamps to `[min, max]` on every key,
	 * which is right for what it is — a general arc control, where a 0–100 dial over a 270° sweep
	 * must stop at both ends. On a full circle the two ends are the same place, so clamping shows up
	 * as an asymmetry you can feel: turning clockwise past 360 wraps (the setter's own modulo takes
	 * 360 to 0 and the walk continues), while turning anticlockwise from 0 goes nowhere, because the
	 * component clamps −1 away before `onValueChange` is ever called.
	 *
	 * The root runs the caller's `onkeydown` BEFORE its own and stands down if the event was
	 * consumed, which is the seam to use: at 0, a decrementing key is answered with 359 and the
	 * component never sees it. Dragging needs no such help — a pointer crosses the top by moving,
	 * not by counting. One helper serves all three dials, since they differ only in their setter.
	 */
	const anchorNames = Object.fromEntries(MARK_ANCHORS.map((a) => [a.id, a.name]));
	const anchorLabels = $derived(
		MARK_ANCHORS.find((a) => a.id === markCorner.current) ?? MARK_ANCHORS[0],
	);

	function wrapAtZero(event: KeyboardEvent, value: number, set: (next: number) => void): void {
		if (value !== 0) return;
		if (event.key !== "ArrowDown" && event.key !== "ArrowLeft" && event.key !== "PageDown") return;
		event.preventDefault();
		set(event.key === "PageDown" ? 350 : 359);
	}

	type PageMode = "light" | "dark" | "system";

	type Choice<T extends string> = {
		value: T;
		label: string;
		hint: string;
		icon: typeof SunIcon;
	};

	const modeChoices: Choice<PageMode>[] = [
		{ value: "light", label: "Light", hint: "Always the light half.", icon: SunIcon },
		{ value: "dark", label: "Dark", hint: "Always the dark half.", icon: MoonIcon },
		{
			value: "system",
			label: "System",
			hint: "Follows the OS preference.",
			icon: MonitorIcon,
		},
	];

	const sidebarModeChoices: Choice<SidebarMode>[] = [
		{
			value: "default",
			label: "Default",
			hint: "The rail wears the page's mode.",
			icon: SunMoonIcon,
		},
		{
			value: "inverted",
			label: "Inverted",
			hint: "The opposite half — and it stays opposite when the mode flips.",
			icon: ContrastIcon,
		},
		{
			value: "vibrant",
			label: "Vibrant",
			hint: "The palette's brand, painted down the panel as a corner light.",
			icon: DropletIcon,
		},
	];

	const headerModeChoices: Choice<HeaderMode>[] = [
		{
			value: "default",
			label: "Default",
			hint: "The bar wears the page's mode.",
			icon: SunMoonIcon,
		},
		{
			value: "inverted",
			label: "Inverted",
			hint: "The opposite half — independent of the sidebar's axis.",
			icon: ContrastIcon,
		},
		{
			value: "vibrant",
			label: "Vibrant",
			hint: "The same brand light as the rail. Set both to draw one L-shaped surface.",
			icon: DropletIcon,
		},
	];

	function resetAll(): void {
		setMode("system");
		setTheme(DEFAULT_THEME);
		// One call rather than a dozen: the axis owns its own defaults, and a Reset that listed
		// them here would go stale the next time one is added.
		resetBackdrop();
		setSidebarMode("default");
		setHeaderMode("default");
		setSidebarFloating(true);
		setHeaderAutoHide(false);
		setHeaderFloating(true);
		sidebar.setOpen(true);
	}
</script>

<!--
	The generic three-way selector. A real `<button>` with `aria-pressed`, the same idiom as the
	Themes page's palette cards; the active treatment is the primary border over the subtle
	ground that selectable cards use everywhere in the kit.
-->
{#snippet choiceGrid(choices: Choice<string>[], current: string, apply: (value: string) => void)}
	<div class={cn("grid gap-3", choices.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
		{#each choices as choice (choice.value)}
			{@const active = choice.value === current}
			{@const Icon = choice.icon}
			<button
				type="button"
				aria-pressed={active}
				onclick={() => apply(choice.value)}
				class={cn(
					"flex flex-col gap-1.5 rounded-lg border p-4 text-start transition-colors hover:bg-accent",
					active && "border-primary bg-primary-subtle hover:bg-primary-subtle",
				)}
			>
				<span class="flex items-center gap-2">
					<Icon class={cn("size-4", active ? "text-primary" : "text-muted-foreground")} />
					<span class="text-sm font-medium">{choice.label}</span>
					{#if active}
						<CheckIcon class="ms-auto size-4 text-primary" />
					{/if}
				</span>
				<span class="text-xs text-muted-foreground">{choice.hint}</span>
			</button>
		{/each}
	</div>
{/snippet}

<!-- A boolean row: label and consequence on the left, the switch on the right. -->
{#snippet switchRow(
	id: string,
	label: string,
	hint: string,
	checked: boolean,
	apply: (value: boolean) => void,
)}
	<div class="flex items-center justify-between gap-6 py-4 first:pt-0 last:pb-0">
		<div class="flex min-w-0 flex-col gap-1">
			<Label for={id}>{label}</Label>
			<p class="text-sm text-muted-foreground">{hint}</p>
		</div>
		<Switch {id} {checked} onCheckedChange={apply} />
	</div>
{/snippet}

<DocPage title="Settings">
	{#snippet subtitle()}
		Every look-and-feel control from the header's top-right cluster, one section per surface it acts
		on. Both drive the same stored state, so a change here moves the header's controls and a change
		there moves these — nothing on this page is a second copy of anything.
	{/snippet}

	<div>
		<DocSection title="Mode">
			{#snippet blurb()}
				The document's light or dark half. Independent from the theme: every palette defines both
				halves. This is the one control where the page offers more than the header —
				<code class="text-[87.5%] text-primary">System</code> follows the OS preference, which the header's
				two-state toggle cannot express.
			{/snippet}
			<Card.Root>
				<Card.Content>
					{@render choiceGrid(modeChoices, userPrefersMode.current, (value) =>
						setMode(value as PageMode),
					)}
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Theme">
			{#snippet blurb()}
				{THEMES.length} palettes over one token set, applied live. The
				<a class="text-primary underline underline-offset-3" href={href("/components/themes")}
					>Themes</a
				>
				page is the gallery — descriptions, token detail and how they are built; this is just the switch.
			{/snippet}
			<Card.Root>
				<Card.Content>
					<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
						{#each THEMES as theme (theme.id)}
							{@const active = theme.id === activeTheme.current}
							<button
								type="button"
								aria-pressed={active}
								onclick={() => setTheme(theme.id)}
								class={cn(
									"flex flex-col gap-2.5 rounded-lg border p-4 text-start transition-colors hover:bg-accent",
									active && "border-primary bg-primary-subtle hover:bg-primary-subtle",
								)}
							>
								<span class="flex items-center gap-2">
									<span class="text-sm font-medium">{theme.name}</span>
									{#if active}
										<CheckIcon class="ms-auto size-4 text-primary" />
									{/if}
								</span>
								<span class="flex flex-col gap-1.5">
									{#each [["Light", theme.swatch.light], ["Dark", theme.swatch.dark]] as [label, colours] (label)}
										<span class="flex items-center gap-2">
											<span class="w-9 text-[0.6875rem] text-muted-foreground uppercase">
												{label}
											</span>
											<span
												class="flex h-4 flex-1 overflow-hidden rounded-sm ring-1 ring-foreground/10"
												aria-hidden="true"
											>
												{#each colours as colour, index (index)}
													<span class="flex-1" style="background-color: {colour}"></span>
												{/each}
											</span>
										</span>
									{/each}
								</span>
							</button>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Backdrop">
			{#snippet blurb()}
				A fifth axis, layered over the palette and the mode rather than beside them: the palette
				decides what the surfaces are painted with, and a backdrop decides what is painted behind
				them. It does not change the page colour — that stays the palette's — it paints over it.
				Four independent layers that COMPOSE: a light, a lattice, a texture and one mark. Every one
				derives its colours from the live tokens, so they all work with all {THEMES.length}
				palettes in both halves. The header's wand carries the same switches.
			{/snippet}

			<!--
				ONE ROW PER CARD: what to paint on the left, how to paint it on the right. The choice and
				its settings were stacked, which made a card as tall as the four of them used to be
				together and pushed the dial — the control most worth finding — below the fold.

				`items-start` rather than `items-center`: the left column grows by a line when a blurb
				wraps, and centring would then walk the dial up and down as the reader changes their
				mind. `flex-col` until `sm`, because three cells side by side on a phone is three
				unusable cells.
			-->
			<Card.Root>
				<Card.Header class="flex flex-col gap-1 space-y-0">
					<Card.Title>Gradient</Card.Title>
					<Card.Description>A light thrown across the page.</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
						{@render lookPicker("Gradient", GRADIENTS, activeGradient.current, (id) =>
							setGradient(id as GradientId),
						)}
						{#if activeGradient.current !== "none"}
							<div class="flex min-w-0 flex-1 flex-col gap-2">
								{@render slider(
									"backdrop-gradient-opacity",
									"Opacity",
									gradientStrength.current + "%",
									"As a share of the weight this light was designed at. 100% is the kit’s own calibration.",
									LAYER_OPACITY_MIN,
									LAYER_OPACITY_MAX,
									5,
									gradientStrength.current,
									setGradientStrength,
								)}
							</div>
							{@render dial(
								"Angle",
								"Where the light comes from. 0° is where this gradient sits by default.",
								backdropAngle.current,
								setBackdropAngle,
								"backdrop-angle",
							)}
						{/if}
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header class="flex flex-col gap-1 space-y-0">
					<Card.Title>Pattern</Card.Title>
					<Card.Description>A drawn lattice, fading out toward a bearing.</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
						{@render lookPicker("Pattern", PATTERNS, activePattern.current, (id) =>
							setPattern(id as PatternId),
						)}
						{#if activePattern.current !== "none"}
							<div class="flex min-w-0 flex-1 flex-col gap-5">
								{@render slider(
									"backdrop-pattern-opacity",
									"Opacity",
									patternStrength.current + "%",
									"As a share of the weight this lattice was designed at.",
									LAYER_OPACITY_MIN,
									LAYER_OPACITY_MAX,
									5,
									patternStrength.current,
									setPatternStrength,
								)}
								{@render slider(
									"backdrop-fade",
									"Fade length",
									backdropFade.current + "px",
									"How far the fade runs before the lattice is at full strength. At 0 it covers the page.",
									BACKDROP_FADE_MIN,
									BACKDROP_FADE_MAX,
									20,
									backdropFade.current,
									setBackdropFade,
								)}
							</div>
							{@render dial(
								"Fade angle",
								"Which side the lattice fades out toward. The lattice itself does not turn.",
								backdropFadeAngle.current,
								setBackdropFadeAngle,
								"backdrop-fade-angle",
							)}
						{/if}
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header class="flex flex-col gap-1 space-y-0">
					<Card.Title>Grain</Card.Title>
					<Card.Description>Paper texture over everything else.</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
						{@render toggle("backdrop-grain", "Grain", grainOn.current, setGrain)}
						{#if grainOn.current}
							<div class="flex min-w-0 flex-1 flex-col gap-2">
								{@render slider(
									"backdrop-density",
									"Density",
									backdropDensity.current + "%",
									"How much grain. It is balanced light against dark, so it textures the page without lifting it.",
									BACKDROP_DENSITY_MIN,
									BACKDROP_DENSITY_MAX,
									5,
									backdropDensity.current,
									setBackdropDensity,
								)}
							</div>
						{/if}
					</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header class="flex flex-col gap-1 space-y-0">
					<Card.Title>Mark</Card.Title>
					<Card.Description>
						One SVG, drawn behind the interface. It is a file rather than a setting —
						<code class="font-mono text-xs">{MARK_SOURCE}</code> — so a project brands itself by replacing
						that file, keeping the name.
					</Card.Description>
				</Card.Header>
				<Card.Content>
					<div class="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
						<div class="flex flex-col gap-3 sm:w-56 sm:shrink-0">
							<div class="flex items-center gap-3">
								<Switch id="backdrop-mark" checked={markOn.current} onCheckedChange={setMark} />
								<Label for="backdrop-mark">Mark</Label>
							</div>
							{#if markOn.current}
								<!--
									THE OFFSETS ARE NOT A POSITION UNTIL YOU SAY WHAT THEY COUNT FROM. They used
									to mean the top-left corner, because that is what CSS defaults to, which left
									a mark meant for the bottom-right to be placed by arithmetic against a
									viewport size nobody knows in advance — and moved on every resize.
								-->
								<div class="flex flex-col gap-1.5">
									<Label for="backdrop-mark-anchor">Measured from</Label>
									<Select.Root
										type="single"
										value={markCorner.current}
										onValueChange={(value) => setMarkAnchor(value as MarkAnchor)}
									>
										<Select.Trigger id="backdrop-mark-anchor" class="w-full">
											{anchorNames[markCorner.current]}
										</Select.Trigger>
										<Select.Content>
											{#each MARK_ANCHORS as anchor (anchor.id)}
												<Select.Item value={anchor.id} label={anchor.name} />
											{/each}
										</Select.Content>
									</Select.Root>
								</div>
							{/if}
						</div>
						{#if markOn.current}
							<div class="flex min-w-0 flex-1 flex-col gap-5">
								{@render slider(
									"backdrop-mark-opacity",
									"Opacity",
									markInkStrength.current + "%",
									"How much of the page’s own ink the mark is mixed from.",
									MARK_OPACITY_MIN,
									MARK_OPACITY_MAX,
									1,
									markInkStrength.current,
									setMarkInkStrength,
								)}
								{@render slider(
									"backdrop-mark-x",
									anchorLabels.x,
									markOffsetX.current + "px",
									`Counted from the ${anchorLabels.x.toLowerCase()} edge of the viewport.`,
									MARK_OFFSET_MIN,
									MARK_OFFSET_MAX,
									10,
									markOffsetX.current,
									setMarkOffsetX,
								)}
								{@render slider(
									"backdrop-mark-y",
									anchorLabels.y,
									markOffsetY.current + "px",
									`Counted from the ${anchorLabels.y.toLowerCase()} edge of the viewport.`,
									MARK_OFFSET_MIN,
									MARK_OFFSET_MAX,
									10,
									markOffsetY.current,
									setMarkOffsetY,
								)}
								{@render slider(
									"backdrop-mark-zoom",
									"Size",
									markScale.current + "px",
									"The file scales without loss, so this can go well past the page.",
									MARK_ZOOM_MIN,
									MARK_ZOOM_MAX,
									10,
									markScale.current,
									setMarkScale,
								)}
							</div>
							{@render dial(
								"Rotation",
								"Turned inside the image itself — a background cannot be rotated.",
								markTurn.current,
								setMarkTurn,
								"backdrop-mark-angle",
							)}
						{/if}
					</div>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Sidebar">
			{#snippet blurb()}
				<code class="text-[87.5%] text-primary">Inverted</code> wears the opposite chrome of the page
				— the dark-rail-on-light-page look most dashboards ship — and it stays inverted when the mode
				flips. The same axis sits behind the header's panel-left dropdown.
			{/snippet}
			<Card.Root>
				<Card.Content class="flex flex-col gap-6">
					{@render choiceGrid(sidebarModeChoices, sidebarMode.current, (value) =>
						setSidebarMode(value as SidebarMode),
					)}
					<div class="flex flex-col divide-y border-t pt-2">
						{@render switchRow(
							"settings-sidebar-floating",
							"Floating",
							"Detaches the rail into a rounded inset panel — the kit's default look; off seats it flush against the page edge.",
							sidebarFloating.current,
							setSidebarFloating,
						)}
						{@render switchRow(
							"settings-sidebar-open",
							"Expanded",
							"The full rail rather than the icon strip. Ctrl/Cmd+B does the same anywhere.",
							sidebar.open,
							(value) => sidebar.setOpen(value),
						)}
					</div>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Header">
			{#snippet blurb()}
				The bar's own axis, independent of the sidebar's: inverting the rail never drags the bar
				along, and <code class="text-[87.5%] text-primary">Inverted</code> here inverts only the bar.
				The two switches are the bar's behaviours — both off by default.
			{/snippet}
			<Card.Root>
				<Card.Content class="flex flex-col gap-6">
					{@render choiceGrid(headerModeChoices, headerMode.current, (value) =>
						setHeaderMode(value as HeaderMode),
					)}
					<div class="flex flex-col divide-y border-t pt-2">
						{@render switchRow(
							"settings-header-floating",
							"Floating",
							"Detaches the bar into a rounded panel inset from the page edges.",
							headerFloating.current,
							setHeaderFloating,
						)}
						{@render switchRow(
							"settings-header-auto-hide",
							"Hide on scroll",
							"The bar slides away scrolling down and returns the moment you scroll up.",
							headerAutoHide.current,
							setHeaderAutoHide,
						)}
					</div>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="The same axes, as bar controls">
			{#snippet blurb()}
				Everything above drives the axes through the hooks directly, in a page-sized layout that can
				name and explain each choice. <code class="text-[87.5%] text-primary"
					>SidebarModeToggle</code
				>
				and <code class="text-[87.5%] text-primary">HeaderToggle</code> are the compact form of the
				same two groups — the dropdowns this bar used to carry, published as
				<code class="text-[87.5%] text-primary">parallax-appearance-controls</code> for an
				application that wants them back in the header through
				<code class="text-[87.5%] text-primary">PageHeader</code>'s
				<code class="text-[87.5%] text-primary">controls</code> snippet. They are live: change one and
				the grids above follow, because both read the same state.
			{/snippet}
			<Card.Root>
				<Card.Content>
					<!--
						THE REASON THIS SECTION EXISTS. Both components ship as a registry item, and until
						this section they were rendered by nothing — the one thing `CONVENTIONS.md` §9 says
						must not happen, because a component no page renders is a component whose look
						nobody reviews. The Settings grids are a different presentation of the same axes,
						not a substitute for seeing these two draw.
					-->
					<div class="flex flex-wrap items-center gap-2">
						<SidebarModeToggle />
						<HeaderToggle />
					</div>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Reset">
			{#snippet blurb()}
				Back to the defaults: system mode, the {THEMES.find((t) => t.id === DEFAULT_THEME)?.name}
				palette, both chrome axes on Default, the sidebar floating and expanded, the header bar floating
				with auto-hide off.
			{/snippet}
			<Card.Root>
				<Card.Content>
					<Button variant="outline" onclick={resetAll}>
						<RotateCcwIcon />
						Reset to defaults
					</Button>
				</Card.Content>
			</Card.Root>
		</DocSection>
	</div>
</DocPage>

<!--
	THREE SNIPPETS RATHER THAN FOUR COPIES OF EACH. The backdrop section grew from one card to
	four, and every card needs the same shapes: a grid of named looks, a labelled slider, and the
	dial. Written out per card it was the same twenty lines five times over, which is how the fade
	slider and the density slider drift apart.
-->
<!--
	FOUR SNIPPETS RATHER THAN FOUR COPIES OF EACH. Every card needs the same shapes — a picker, a
	toggle, a labelled slider, a dial — and written out per card they were the same twenty lines
	five times over, which is how the fade slider and the density slider drift apart.
-->

<!--
	A DROPDOWN, NOT A GRID OF CARDS. Twelve gradients and ten patterns as two-line cards ran to
	about nine hundred pixels of Settings before the first adjustment, which buried the very
	controls the cards were there to introduce. The blurb is not lost: the chosen look's own
	sentence sits under the select, so the page still says what is on — it just says it once
	instead of twenty-two times.

	`Select` rather than `NativeSelect`: the rows carry a name and a sentence, and a native
	`<option>` is one line of unstyled text.
-->
{#snippet lookPicker(
	label: string,
	looks: { id: string; name: string; blurb: string }[],
	active: string,
	choose: (id: string) => void,
)}
	{@const chosen = looks.find((look) => look.id === active)}
	<div class="flex min-w-0 flex-col gap-2 sm:w-56 sm:shrink-0">
		<Select.Root type="single" value={active} onValueChange={choose}>
			<Select.Trigger class="w-full" aria-label={label}>
				{chosen ? chosen.name : "None"}
			</Select.Trigger>
			<!--
				The height cap because two-line rows run past a laptop viewport once the list is this
				long — the generated content scrolls but carries no height of its own. The panel is
				wider than its trigger on purpose: the trigger only has to hold a name, the rows hold a
				sentence, and `--bits-select-anchor-width` would wrap every one of them to three lines.
			-->
			<Select.Content class="max-h-(--bits-floating-available-height) w-72">
				<Select.Item value="none" label="None">
					<span class="flex min-w-0 flex-col">
						<span class="font-medium">None</span>
						<span class="text-xs text-wrap text-muted-foreground">This layer paints nothing.</span>
					</span>
				</Select.Item>
				{#each looks as look (look.id)}
					<Select.Item value={look.id} label={look.name}>
						<span class="flex min-w-0 flex-col">
							<span class="font-medium">{look.name}</span>
							<span class="text-xs text-wrap text-muted-foreground">{look.blurb}</span>
						</span>
					</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
		<p class="text-xs text-muted-foreground">
			{chosen ? chosen.blurb : "This layer paints nothing."}
		</p>
	</div>
{/snippet}

<!-- The on/off axes have no list, so their first cell is the switch itself. -->
{#snippet toggle(id: string, label: string, on: boolean, set: (next: boolean) => void)}
	<div class="flex items-center gap-3 sm:w-56 sm:shrink-0">
		<Switch {id} checked={on} onCheckedChange={set} />
		<Label for={id}>{label}</Label>
	</div>
{/snippet}

{#snippet slider(
	id: string,
	label: string,
	readout: string,
	hint: string,
	min: number,
	max: number,
	step: number,
	value: number,
	set: (next: number) => void,
)}
	<div class="flex flex-col gap-1.5">
		<div class="flex items-baseline justify-between gap-4">
			<Label for={id}>{label}</Label>
			<span class="font-mono text-xs text-muted-foreground tabular-nums">{readout}</span>
		</div>
		<Slider {id} type="single" {min} {max} {step} {value} onValueChange={set} />
		<p class="text-xs text-muted-foreground">{hint}</p>
	</div>
{/snippet}

<!--
	The caption is not a `<Label for>`: the dial's root is a `<div>`, and `for` binds only to a
	labelable element. The control is the THUMB, which carries `role="slider"`, so the caption and
	the hint are pointed AT it instead — the association runs the other way round from a form
	field's, which is also why both need ids of their own.
-->
{#snippet dial(label: string, hint: string, value: number, set: (next: number) => void, id: string)}
	<!-- `ms-auto` so the dial sits at the far edge whether or not the card has a middle cell:
	     Gradient has none, and without it the dial hugged the select and left half the row empty. -->
	<div class="flex shrink-0 flex-col items-center gap-1 self-center sm:ms-auto sm:self-start">
		<span id="{id}-label" class="text-sm font-medium">{label}</span>
		<AngleSlider.Root
			min={0}
			max={360}
			step={1}
			size={46}
			value={[value]}
			onValueChange={(next) => set(next[0] ?? 0)}
			onkeydown={(event) => wrapAtZero(event, value, set)}
		>
			<AngleSlider.Track>
				<AngleSlider.Range />
			</AngleSlider.Track>
			<AngleSlider.Thumb aria-labelledby="{id}-label" aria-describedby="{id}-hint" />
			<AngleSlider.Value />
		</AngleSlider.Root>
		<span id="{id}-hint" class="max-w-44 text-center text-xs text-balance text-muted-foreground">
			{hint}
		</span>
	</div>
{/snippet}
