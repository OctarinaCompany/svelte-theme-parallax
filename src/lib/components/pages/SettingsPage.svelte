<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import Grid3x3Icon from "@lucide/svelte/icons/grid-3x3";
	import GripIcon from "@lucide/svelte/icons/grip";
	import StampIcon from "@lucide/svelte/icons/stamp";
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
	import {
		activeTheme,
		DEFAULT_THEME,
		setTheme,
		THEME_STORAGE_KEY,
		THEMES,
	} from "$lib/themes/index.js";
	import {
		HEADER_AUTO_HIDE_STORAGE_KEY,
		HEADER_FLOATING_STORAGE_KEY,
		headerAutoHide,
		headerFloating,
		setHeaderAutoHide,
		setHeaderFloating,
	} from "$lib/hooks/header-behaviour.svelte.js";
	import {
		SIDEBAR_FLOATING_STORAGE_KEY,
		setSidebarFloating,
		sidebarFloating,
	} from "$lib/hooks/sidebar-behaviour.svelte.js";
	import {
		PAGE_SCROLLBAR_STORAGE_KEY,
		pageScrollbar,
		setPageScrollbar,
	} from "$lib/hooks/page-scrollbar.svelte.js";
	import BackdropSelector from "$lib/components/navigation/BackdropSelector.svelte";
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
		GRADIENT_OPACITY_MAX,
		PATTERN_OPACITY_MAX,
		LAYER_OPACITY_MIN,
		BACKDROP_DENSITY_MAX,
		BACKDROP_DENSITY_MIN,
		BACKDROP_FADE_MAX,
		BACKDROP_FADE_MIN,
		MARK_OFFSET_MAX,
		MARK_OFFSET_MIN,
		MARK_ZOOM_MAX,
		MARK_ZOOM_MIN,
		resetBackdrop,
		backdropStorageSnapshot,
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
		type BackdropChoice,
		type GradientId,
		type MarkAnchor,
		type PatternId,
	} from "$lib/hooks/backdrop.svelte.js";
	import { Slider } from "$lib/components/ui/slider/index.js";
	import * as Select from "$lib/components/ui/select/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import * as Accordion from "$lib/components/ui/accordion/index.js";
	import * as AngleSlider from "$lib/components/ui/angle-slider/index.js";
	import {
		HEADER_MODE_STORAGE_KEY,
		headerMode,
		setHeaderMode,
		type HeaderMode,
	} from "$lib/hooks/header-mode.svelte.js";
	import {
		SIDEBAR_MODE_STORAGE_KEY,
		setSidebarMode,
		sidebarMode,
		type SidebarMode,
	} from "$lib/hooks/sidebar-mode.svelte.js";
	import { SIDEBAR_COOKIE_NAME } from "$lib/components/ui/sidebar/constants.js";
	import * as CodeBlock from "$lib/components/ui/code-block/index.js";
	import { href } from "$lib/hooks/route.svelte.js";

	/**
	 * The Settings page: every look-and-feel control the theme has, on one page, driving the
	 * persisted state directly (the stored appearance keys, plus the sidebar cookie) — so a switch here
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
	 * consumed, which is the seam to use: at 0, a decrementing key is answered here and the component
	 * never sees it. Two details keep this faithful to the component's own keyboard model: Shift and
	 * PageDown are its ×10 step, so they land on 350 rather than 359; and under RTL it swaps the two
	 * horizontal arrows, so the decrementing one is read from the resolved direction rather than
	 * assumed. Dragging needs no such help — a pointer crosses the top by moving, not by counting.
	 */
	function wrapAtZero(event: KeyboardEvent, value: number, set: (next: number) => void): void {
		if (value !== 0) return;
		const rtl = getComputedStyle(event.currentTarget as Element).direction === "rtl";
		const towardZero = rtl ? "ArrowRight" : "ArrowLeft";
		if (event.key !== "ArrowDown" && event.key !== "PageDown" && event.key !== towardZero) return;
		event.preventDefault();
		set(event.key === "PageDown" || event.shiftKey ? 350 : 359);
	}

	const anchor = $derived(
		MARK_ANCHORS.find((entry) => entry.id === markCorner.current) ?? MARK_ANCHORS[0],
	);

	/*
	 * THE PANEL IS THE YARDSTICK, NOT THE VIEWPORT. Each backdrop panel lays its controls out as
	 * picker | settings | dial, and whether those fit side by side depends on the width the PANEL
	 * gets, which the viewport does not say: the rail spends 250px and the card and the accordion's
	 * indent spend more, so the row measures 645px at a 1440px viewport, 539 at 1280, 485 at 1024
	 * and 346 at 768. A viewport breakpoint switched to three columns at 640px and squeezed the
	 * slider to nothing on a tablet. `@container` asks the panel how wide IT is — the same reasoning
	 * as the card in TablesInCardsPage — and the container is NAMED so the query can never resolve
	 * against the card header's own `@container`.
	 *
	 * Three shapes: one column below 28rem; picker beside the dial with the settings spanning a
	 * second row from 28rem; the full three-column row from 36rem. Placement is EXPLICIT rather than
	 * `grid-template-areas`, because a named area keeps its row (and the row's gap) even when the
	 * cell is absent — and the settings and the dial only render while the layer is on. Explicit
	 * starts create a row only when something sits in it. The same grid serves all four panels, so
	 * the settings column lines up whether or not a panel has a dial.
	 */
	const panelBody = cn("@container/panel flex flex-col gap-4 ps-11");
	const panelGrid = cn(
		"grid grid-cols-1 items-start gap-6 @md/panel:grid-cols-[minmax(0,1fr)_10rem] @md/panel:gap-x-8 @xl/panel:grid-cols-[13rem_minmax(0,1fr)_10rem]",
	);
	const settingsCell = cn(
		"flex min-w-0 flex-col gap-5 @md/panel:col-start-1 @md/panel:col-end-3 @md/panel:row-start-2 @xl/panel:col-start-2 @xl/panel:col-end-3 @xl/panel:row-start-1",
	);
	/* Label's own type, restated for the captions that cannot be a `<label for>` — see the snippets. */
	const caption = "text-sm leading-none font-medium select-none";
	const NOTHING_DRAWN = "Nothing is drawn.";

	type SliderSpec = {
		id: string;
		label: string;
		unit: string;
		hint: string;
		min: number;
		max: number;
		step: number;
		value: number;
		set: (next: number) => void;
	};

	type DialSpec = {
		id: string;
		label: string;
		hint: string;
		value: number;
		set: (next: number) => void;
	};

	/*
	 * ONE ROOT, `type="multiple"`, because these four are not alternatives — a single-select
	 * accordion would shut one layer's controls every time another opened, and comparing a gradient
	 * against the grain sitting over it is exactly what someone is doing here.
	 *
	 * A SECTION STARTS OPEN IF ITS LAYER IS ON. Arriving with a gradient and a mark already chosen,
	 * those two are expanded and the other two out of the way; arriving with nothing on gives four
	 * closed rows and a glance at what is available. The state is SEEDED once rather than derived,
	 * so switching a layer afterwards does not yank a panel open or shut under the reader's hands.
	 */
	let openPanels = $state(
		[
			activeGradient.current !== "none" ? "gradient" : null,
			activePattern.current !== "none" ? "pattern" : null,
			markOn.current ? "mark" : null,
			grainOn.current ? "grain" : null,
		].filter((value) => value !== null),
	);

	type PageMode = "light" | "dark" | "system";

	/**
	 * THE WHOLE LOOK AS ONE DOCUMENT, so it can be carried to another Parallax application — or
	 * handed to an assistant working on one — and reproduced without interpretation.
	 *
	 * Two views of the same state, built in one place so they cannot drift: `appearance` is for
	 * reading, and `storage` is for applying. The appearance state of this kit IS its localStorage
	 * (plus the rail's one cookie) — the first-paint script and every hook read exactly these keys —
	 * so writing the `storage` entries on the target origin and reloading is the entire procedure,
	 * and the document says so in `apply`, in words an assistant can follow without reading this
	 * file. Every key is present, including layers that are off and adjustments at their defaults:
	 * the export is a complete state, not a diff, so applying it over a differently configured app
	 * yields this look and not a merge of the two.
	 *
	 * The mark is the one thing a document cannot carry — it is a file — so the export names it.
	 */
	const exportJson = $derived.by(() => {
		const mode = userPrefersMode.current;
		const payload = {
			kit: "parallax",
			version: 1,
			appearance: {
				mode,
				palette: activeTheme.current,
				sidebar: {
					chrome: sidebarMode.current,
					floating: sidebarFloating.current,
					expanded: sidebar.open,
				},
				header: {
					chrome: headerMode.current,
					floating: headerFloating.current,
					hideOnScroll: headerAutoHide.current,
				},
				page: { scrollbar: pageScrollbar.current },
				backdrop: {
					gradient: {
						look: activeGradient.current,
						intensity: gradientStrength.current,
						angle: backdropAngle.current,
					},
					pattern: {
						look: activePattern.current,
						intensity: patternStrength.current,
						fadeLength: backdropFade.current,
						fadeAngle: backdropFadeAngle.current,
					},
					mark: {
						on: markOn.current,
						anchor: markCorner.current,
						x: markOffsetX.current,
						y: markOffsetY.current,
						size: markScale.current,
						rotation: markTurn.current,
						opacity: markInkStrength.current,
						file: "public/backdrop-mark.svg",
					},
					grain: { on: grainOn.current, density: backdropDensity.current },
				},
			},
			storage: {
				// mode-watcher's own key, as index.html spells it; the library does not export it.
				"mode-watcher-mode": mode,
				[THEME_STORAGE_KEY]: activeTheme.current,
				[SIDEBAR_MODE_STORAGE_KEY]: sidebarMode.current,
				[SIDEBAR_FLOATING_STORAGE_KEY]: String(sidebarFloating.current),
				[HEADER_MODE_STORAGE_KEY]: headerMode.current,
				[HEADER_FLOATING_STORAGE_KEY]: String(headerFloating.current),
				[HEADER_AUTO_HIDE_STORAGE_KEY]: String(headerAutoHide.current),
				[PAGE_SCROLLBAR_STORAGE_KEY]: String(pageScrollbar.current),
				...backdropStorageSnapshot(),
			},
			cookie: { [SIDEBAR_COOKIE_NAME]: String(sidebar.open) },
			apply:
				"On the target Parallax application's origin: write every entry of `storage` into localStorage as-is (all values are strings), set the `cookie` entry as a cookie, then reload — or call the appearance hooks' setters with the `appearance` values. The first-paint script and the hooks read exactly these keys. A key the target does not know is read by nothing and harmless, but the look it describes will be missing: a `vibrant` chrome needs `parallax-appearance`'s `src/vibrant.css`, and `backdrop-*` needs `parallax-backdrop` — each with the one `@import` only that project can add. If `appearance.backdrop.mark.on` is true, the SVG at `appearance.backdrop.mark.file` must exist in that project too — `parallax-backdrop` ships the kit's own drawing under that name, so a replaced mark still has to travel on its own.",
		};
		return JSON.stringify(payload, null, 2);
	});

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
				What is painted behind the page: a light, a lattice, a mark and a texture, each switched on
				and tuned on its own. Every layer takes its colours from the active palette, so all of them
				suit all {THEMES.length} palettes in both modes. The wand below — under
				<em>The same axes, as bar controls</em> — carries the same four switches in one menu.
			{/snippet}

			<!--
				FOUR SECTIONS THAT FOLD, because four layers' worth of controls open at once is a page
				rather than a section — the mark alone carries six. Each row still says what it is doing
				while shut: the badge names the chosen look, or reads "On", so the state of all four is
				one glance rather than four expansions.

				THE ORDER IS THE PAINTING ORDER, top to bottom: the light goes down first, the lattice
				over it, then the mark, and the grain last because it is a texture over everything else.
				The hook and the header menu list them the same way.
			-->
			<Card.Root>
				<Card.Content>
					<Accordion.Root type="multiple" bind:value={openPanels}>
						<Accordion.Item value="gradient">
							{@const chosen = GRADIENTS.find((look) => look.id === activeGradient.current)}
							{@render panelTrigger(SunIcon, "Gradient", chosen?.name)}
							<Accordion.Content>
								<div class={panelBody}>
									<div class="text-sm text-muted-foreground">A light thrown across the page.</div>
									<div class={panelGrid}>
										{@render lookPicker("Gradient", GRADIENTS, activeGradient.current, (id) =>
											setGradient(id as GradientId),
										)}
										{#if activeGradient.current !== "none"}
											<div class={settingsCell}>
												{@render slider({
													id: "settings-backdrop-gradient-intensity",
													label: "Intensity",
													unit: "%",
													hint: "100% is the designed weight.",
													min: LAYER_OPACITY_MIN,
													max: GRADIENT_OPACITY_MAX,
													step: 5,
													value: gradientStrength.current,
													set: setGradientStrength,
												})}
											</div>
											{@render dial({
												id: "settings-backdrop-angle",
												label: "Angle",
												hint: "Where the light comes from.",
												value: backdropAngle.current,
												set: setBackdropAngle,
											})}
										{/if}
									</div>
								</div>
							</Accordion.Content>
						</Accordion.Item>

						<Accordion.Item value="pattern">
							{@const chosen = PATTERNS.find((look) => look.id === activePattern.current)}
							{@render panelTrigger(Grid3x3Icon, "Pattern", chosen?.name)}
							<Accordion.Content>
								<div class={panelBody}>
									<div class="text-sm text-muted-foreground">
										A drawn lattice that fades out toward one side.
									</div>
									<div class={panelGrid}>
										{@render lookPicker("Pattern", PATTERNS, activePattern.current, (id) =>
											setPattern(id as PatternId),
										)}
										{#if activePattern.current !== "none"}
											<div class={settingsCell}>
												{@render slider({
													id: "settings-backdrop-pattern-intensity",
													label: "Intensity",
													unit: "%",
													hint: "100% is the designed weight.",
													min: LAYER_OPACITY_MIN,
													max: PATTERN_OPACITY_MAX,
													step: 5,
													value: patternStrength.current,
													set: setPatternStrength,
												})}
												{@render slider({
													id: "settings-backdrop-fade",
													label: "Fade length",
													unit: "px",
													hint: "Distance before the lattice reaches full strength. 0 covers the page.",
													min: BACKDROP_FADE_MIN,
													max: BACKDROP_FADE_MAX,
													step: 20,
													value: backdropFade.current,
													set: setBackdropFade,
												})}
											</div>
											{@render dial({
												id: "settings-backdrop-fade-angle",
												label: "Fade angle",
												hint: "Which side the lattice fades toward.",
												value: backdropFadeAngle.current,
												set: setBackdropFadeAngle,
											})}
										{/if}
									</div>
								</div>
							</Accordion.Content>
						</Accordion.Item>

						<Accordion.Item value="mark">
							{@render panelTrigger(StampIcon, "Mark", markOn.current ? "On" : undefined)}
							<Accordion.Content>
								<div class={panelBody}>
									<div class="text-sm text-muted-foreground">
										One SVG drawn behind the interface, read from
										<code class="text-[87.5%] text-primary">public/backdrop-mark.svg</code>. Replace
										that file, keeping its name, to brand a project.
									</div>
									<div class={panelGrid}>
										<div class="col-start-1 row-start-1 flex flex-col gap-3">
											{@render toggle("settings-backdrop-mark", markOn.current, setMark)}
											{#if markOn.current}
												<div class="flex flex-col gap-1.5">
													<Label for="settings-backdrop-mark-anchor">Measured from</Label>
													<Select.Root
														type="single"
														value={markCorner.current}
														onValueChange={(value) => setMarkAnchor(value as MarkAnchor)}
													>
														<Select.Trigger id="settings-backdrop-mark-anchor" class="w-full">
															{anchor.name}
														</Select.Trigger>
														<Select.Content>
															{#each MARK_ANCHORS as option (option.id)}
																<Select.Item value={option.id} label={option.name} />
															{/each}
														</Select.Content>
													</Select.Root>
												</div>
											{/if}
										</div>
										{#if markOn.current}
											{@const fromEdge = (edge: string) =>
												anchor.id === "center"
													? "From the centre of the viewport."
													: `From the ${edge.toLowerCase()} edge of the viewport. Below 0 it runs off the page.`}
											<div class={settingsCell}>
												{@render slider({
													id: "settings-backdrop-mark-opacity",
													label: "Opacity",
													unit: "%",
													hint: "How strongly the mark is drawn.",
													min: MARK_OPACITY_MIN,
													max: MARK_OPACITY_MAX,
													step: 1,
													value: markInkStrength.current,
													set: setMarkInkStrength,
												})}
												{@render slider({
													id: "settings-backdrop-mark-x",
													label: anchor.x,
													unit: "px",
													hint: fromEdge(anchor.x),
													min: MARK_OFFSET_MIN,
													max: MARK_OFFSET_MAX,
													step: 5,
													value: markOffsetX.current,
													set: setMarkOffsetX,
												})}
												{@render slider({
													id: "settings-backdrop-mark-y",
													label: anchor.y,
													unit: "px",
													hint: fromEdge(anchor.y),
													min: MARK_OFFSET_MIN,
													max: MARK_OFFSET_MAX,
													step: 5,
													value: markOffsetY.current,
													set: setMarkOffsetY,
												})}
												{@render slider({
													id: "settings-backdrop-mark-size",
													label: "Size",
													unit: "px",
													hint: "Rendered size of the mark.",
													min: MARK_ZOOM_MIN,
													max: MARK_ZOOM_MAX,
													step: 10,
													value: markScale.current,
													set: setMarkScale,
												})}
											</div>
											{@render dial({
												id: "settings-backdrop-mark-angle",
												label: "Rotation",
												hint: "Clockwise, in degrees.",
												value: markTurn.current,
												set: setMarkTurn,
											})}
										{/if}
									</div>
								</div>
							</Accordion.Content>
						</Accordion.Item>

						<Accordion.Item value="grain">
							{@render panelTrigger(GripIcon, "Grain", grainOn.current ? "On" : undefined)}
							<Accordion.Content>
								<div class={panelBody}>
									<div class="text-sm text-muted-foreground">
										Paper texture over everything else.
									</div>
									<div class={panelGrid}>
										{@render toggle("settings-backdrop-grain", grainOn.current, setGrain)}
										{#if grainOn.current}
											<div class={settingsCell}>
												{@render slider({
													id: "settings-backdrop-density",
													label: "Density",
													unit: "%",
													hint: "How much grain is laid over the page.",
													min: BACKDROP_DENSITY_MIN,
													max: BACKDROP_DENSITY_MAX,
													step: 2,
													value: backdropDensity.current,
													set: setBackdropDensity,
												})}
											</div>
										{/if}
									</div>
								</div>
							</Accordion.Content>
						</Accordion.Item>
					</Accordion.Root>
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

		<DocSection title="Scrollbar">
			{#snippet blurb()}
				The page's own scrollbar, and the only axis here that is one switch: dressed in the palette
				— the same <code class="text-[87.5%] text-primary">--border</code> the
				<code class="text-[87.5%] text-primary">ScrollArea</code> component paints its thumb with — or
				left as the operating system draws it, which is what the kit ships. The width it reserves is not
				part of the switch: the canvas keeps a stable gutter either way, so the page never resizes between
				a document that overflows and one that does not.
			{/snippet}
			<Card.Root>
				<Card.Content>
					<!--
						No choice grid: two states, so the switch IS the control. It reads and writes the same
						hook the first-paint script echoes, which is why the bar never flickers on a reload.
					-->
					<div class="flex flex-col divide-y">
						{@render switchRow(
							"settings-page-scrollbar",
							"Themed scrollbar",
							"The page's bar wears the palette, thin, on a transparent track. Off — the kit's default — leaves it as the platform draws it, arrow buttons and all.",
							pageScrollbar.current,
							setPageScrollbar,
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
				same two chrome groups — the dropdowns this bar used to carry, published as
				<code class="text-[87.5%] text-primary">parallax-appearance-controls</code> for an
				application that wants them back in the header through
				<code class="text-[87.5%] text-primary">PageHeader</code>'s
				<code class="text-[87.5%] text-primary">controls</code> snippet. They are live: change one
				and the grids above follow, because both read the same state.
				<code class="text-[87.5%] text-primary">BackdropSelector</code> stands with them now — it used
				to ride in the header bar, and the bar has gone back to carrying nothing that belongs to the look:
				what sits there instead is the reading panel, which governs how a page is read rather than how
				it looks.
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
						<BackdropSelector />
					</div>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="Export">
			{#snippet blurb()}
				Everything above, as one JSON document that follows every control on this page live. Paste
				it into another Parallax application — or hand it to an assistant working on one — and the
				look is reproduced: the <code class="text-[87.5%] text-primary">storage</code> entries are exactly
				the keys the first-paint script and the hooks read, so writing them and reloading is the whole
				procedure, and the document says so itself.
			{/snippet}
			<!--
				The code block carries the copy button, as every code block in this kit does; the download
				name makes the header offer the same document as a file, for the project that would rather
				commit it than paste it.
			-->
			<CodeBlock.Root
				label="Appearance"
				filename="parallax-appearance.json"
				language="json"
				code={exportJson}
				showLineNumbers={false}
			/>
		</DocSection>

		<DocSection title="Reset">
			{#snippet blurb()}
				Back to the defaults: system mode, the {THEMES.find((t) => t.id === DEFAULT_THEME)?.name}
				palette, both chrome axes on Default, the sidebar floating and expanded, the header bar floating
				with auto-hide off, and every backdrop layer off.
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
	FIVE SNIPPETS RATHER THAN FOUR COPIES OF EACH. Every backdrop panel is built from the same
	parts — a trigger, a picker or a toggle, a captioned slider, a dial — and written out per panel
	they were the same twenty lines over and over, which is how two sliders drift apart. The slider
	and the dial take ONE OBJECT rather than a positional list: nine positional parameters with four
	consecutive numbers type-check in any order, and the readout is derived from the value here
	instead of being passed beside it, so the two cannot disagree.
-->

<!--
	Spans, not divs, inside the trigger: it renders a <button>, whose content model is phrasing
	content. The tile is 8 units and the gap 3, which is where the panel body's `ps-11` comes from.
-->
{#snippet panelTrigger(Icon: typeof SunIcon, title: string, badge: string | undefined)}
	<Accordion.Trigger class="items-center font-semibold hover:no-underline">
		<span class="flex min-w-0 items-center gap-3">
			<span class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
				<Icon class="size-4 text-muted-foreground" />
			</span>
			<span>{title}</span>
			{#if badge}
				<!-- `primary-subtle` is the kit's "current" affordance — the selected cards above use the
				     same ground — where green would read as an outcome. -->
				<Badge variant="primary-subtle" class="ms-1">{badge}</Badge>
			{/if}
		</span>
	</Accordion.Trigger>
{/snippet}

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
	looks: BackdropChoice[],
	active: string,
	choose: (id: string) => void,
)}
	{@const chosen = looks.find((look) => look.id === active)}
	<div class="col-start-1 row-start-1 flex min-w-0 flex-col gap-2">
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
						<span class="text-xs text-wrap text-muted-foreground">{NOTHING_DRAWN}</span>
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
		<p class="text-xs text-muted-foreground">{chosen ? chosen.blurb : NOTHING_DRAWN}</p>
	</div>
{/snippet}

<!-- The on/off layers have no list, so their first cell is the switch itself. -->
{#snippet toggle(id: string, on: boolean, set: (next: boolean) => void)}
	<div class="col-start-1 row-start-1 flex items-center gap-3">
		<Switch {id} checked={on} onCheckedChange={set} />
		<Label for={id}>Enabled</Label>
	</div>
{/snippet}

<!--
	A `<Label for>` NAMES NOTHING HERE, exactly as it names nothing on the dial, and for the same
	reason twice over: `for` binds only to a labelable element, and the Slider's root is a
	`<span>` — so the id would land on it and the association would be dead. Worse, `role="slider"`
	lives on the THUMB, a different element again, so even a working root label would leave the
	control a screen reader stops on with an empty name (WCAG 4.1.2).

	The wrapper forwards `aria-labelledby`, `aria-describedby` and the value text to the thumb, so
	the visible caption and hint carry ids and the thumb points at them, and the unit is announced
	with the number. A check that every `for` RESOLVES to an existing id would have passed here and
	proved nothing — resolving is not binding.
-->
{#snippet slider(spec: SliderSpec)}
	<div class="flex flex-col gap-1.5">
		<div class="flex items-baseline justify-between gap-4">
			<span id="{spec.id}-label" class={caption}>{spec.label}</span>
			<span class="font-mono text-xs text-muted-foreground tabular-nums">
				{spec.value}{spec.unit}
			</span>
		</div>
		<Slider
			type="single"
			aria-labelledby="{spec.id}-label"
			aria-describedby="{spec.id}-hint"
			thumbValueText="{spec.value}{spec.unit}"
			min={spec.min}
			max={spec.max}
			step={spec.step}
			value={spec.value}
			onValueChange={spec.set}
		/>
		<p id="{spec.id}-hint" class="text-xs text-muted-foreground">{spec.hint}</p>
	</div>
{/snippet}

<!--
	The caption is not a `<Label for>` for the same reason as the slider's: the dial's control is
	the THUMB. It is named twice on purpose — `aria-labelledby` pointing at the caption, and an
	`aria-label` with the same text — because the thumb ships a default "Angle" label of its own,
	and one name that agrees with the caption beats two that disagree.

	The cell sits in the grid's last column from 28rem up, and centres its content, which is also
	what centres it below that when it has the row to itself.
-->
{#snippet dial(spec: DialSpec)}
	<div
		class="flex flex-col items-center gap-1 @md/panel:col-start-2 @md/panel:row-start-1 @xl/panel:col-start-3"
	>
		<span id="{spec.id}-label" class={caption}>{spec.label}</span>
		<AngleSlider.Root
			min={0}
			max={360}
			step={1}
			size={46}
			value={[spec.value]}
			onValueChange={(next) => spec.set(next[0] ?? 0)}
			onkeydown={(event) => wrapAtZero(event, spec.value, spec.set)}
		>
			<AngleSlider.Track>
				<AngleSlider.Range />
			</AngleSlider.Track>
			<AngleSlider.Thumb
				aria-label={spec.label}
				aria-valuetext="{spec.value}°"
				aria-labelledby="{spec.id}-label"
				aria-describedby="{spec.id}-hint"
			/>
			<AngleSlider.Value />
		</AngleSlider.Root>
		<span
			id="{spec.id}-hint"
			class="max-w-40 text-center text-xs text-balance text-muted-foreground"
		>
			{spec.hint}
		</span>
	</div>
{/snippet}
