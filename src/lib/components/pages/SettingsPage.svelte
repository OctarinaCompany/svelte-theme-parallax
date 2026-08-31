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
		BACKDROPS,
		activeBackdrop,
		backdropAngle,
		backdropDensity,
		BACKDROP_DENSITY_MAX,
		BACKDROP_DENSITY_MIN,
		DEFAULT_BACKDROP,
		DEFAULT_BACKDROP_ANGLE,
		DEFAULT_BACKDROP_DENSITY,
		setBackdrop,
		setBackdropAngle,
		setBackdropDensity,
		backdropById,
		type BackdropCategory,
		type BackdropId,
	} from "$lib/hooks/backdrop.svelte.js";
	import { Slider } from "$lib/components/ui/slider/index.js";
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

	/*
	 * The category is DERIVED from the active backdrop rather than stored beside it. Two sources of
	 * truth for "which group am I in" is how a picker ends up showing a category whose backdrop is
	 * no longer selected. Choosing a category therefore means choosing its first backdrop, which is
	 * also what makes the control feel like a switch rather than a filter.
	 */

	const activeCategory = $derived(backdropById(activeBackdrop.current).category);
	const backdropsInCategory = $derived(BACKDROPS.filter((b) => b.category === activeCategory));

	/**
	 * A BEARING HAS NO ENDS, AND THE DIAL DOES. `AngleSlider` clamps to `[min, max]` on every key,
	 * which is right for what it is — a general arc control, where a 0–100 dial over a 270° sweep
	 * must stop at both ends. On a full circle the two ends are the same place, so clamping shows up
	 * as an asymmetry you can feel: turning clockwise past 360 wraps (the setter's own modulo takes
	 * 360 to 0 and the walk continues), while turning anticlockwise from 0 goes nowhere, because the
	 * component clamps −1 away before `onValueChange` is ever called.
	 *
	 * The root runs the caller's `onkeydown` BEFORE its own and stands down if the event was
	 * consumed, which is the seam to use: at 0, a decrementing key is answered here with 359 and the
	 * component never sees it. Dragging needs no such help — a pointer crosses the top by moving,
	 * not by counting.
	 */
	function wrapAngleAtZero(event: KeyboardEvent): void {
		if (backdropAngle.current !== 0) return;
		if (event.key !== "ArrowDown" && event.key !== "ArrowLeft" && event.key !== "PageDown") return;
		event.preventDefault();
		setBackdropAngle(event.key === "PageDown" ? 350 : 359);
	}

	function chooseCategory(value: string): void {
		const first = BACKDROPS.find((b) => b.category === (value as BackdropCategory));
		if (first) setBackdrop(first.id);
	}

	type PageMode = "light" | "dark" | "system";

	type Choice<T extends string> = {
		value: T;
		label: string;
		hint: string;
		icon: typeof SunIcon;
	};

	const backdropCategories: Choice<BackdropCategory>[] = [
		{ value: "none", label: "None", hint: "The kit as it ships.", icon: CircleOffIcon },
		{
			value: "gradient",
			label: "Gradient",
			hint: "Light, from a bearing you choose.",
			icon: SunIcon,
		},
		{ value: "grain", label: "Grain", hint: "Texture, at a density you choose.", icon: GripIcon },
		{
			value: "pattern",
			label: "Pattern",
			hint: "A drawn lattice, turned to taste.",
			icon: Grid3x3Icon,
		},
	];

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
		setBackdrop(DEFAULT_BACKDROP);
		setBackdropAngle(DEFAULT_BACKDROP_ANGLE);
		setBackdropDensity(DEFAULT_BACKDROP_DENSITY);
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
				Every one derives its colours from the live tokens, so all {BACKDROPS.length - 1} compose with
				all {THEMES.length} palettes in both halves. The header's wand carries the same switch.
			{/snippet}
			<Card.Root>
				<Card.Content class="flex flex-col gap-6">
					{@render choiceGrid(backdropCategories, activeCategory, chooseCategory)}

					{#if activeCategory !== "none"}
						<div class="flex flex-col gap-3 border-t pt-6">
							<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
								{#each backdropsInCategory as backdrop (backdrop.id)}
									{@const active = backdrop.id === activeBackdrop.current}
									<button
										type="button"
										aria-pressed={active}
										onclick={() => setBackdrop(backdrop.id as BackdropId)}
										class={cn(
											"flex flex-col gap-1.5 rounded-lg border p-4 text-start transition-colors hover:bg-accent",
											active && "border-primary bg-primary-subtle hover:bg-primary-subtle",
										)}
									>
										<span class="flex items-center gap-2">
											<span class="text-sm font-medium">{backdrop.name}</span>
											{#if active}
												<CheckIcon class="ms-auto size-4 text-primary" />
											{/if}
										</span>
										<span class="text-xs text-muted-foreground">{backdrop.blurb}</span>
									</button>
								{/each}
							</div>
						</div>

						<!--
							One control per category, because each category has exactly one thing worth
							adjusting. The angle is a bearing — 0 at the top, running clockwise — which is how
							a person points at a light rather than how CSS measures an angle.
						-->
						<div class="flex flex-col gap-2 border-t pt-6">
							{#if activeCategory === "grain"}
								<div class="flex items-baseline justify-between gap-4">
									<Label for="backdrop-density">Density</Label>
									<span class="font-mono text-xs text-muted-foreground tabular-nums">
										{backdropDensity.current}%
									</span>
								</div>
								<p class="text-sm text-muted-foreground">
									The scale of the grain. Lower is finer — the same noise, sampled smaller.
								</p>
								<Slider
									id="backdrop-density"
									type="single"
									class="mt-2"
									min={BACKDROP_DENSITY_MIN}
									max={BACKDROP_DENSITY_MAX}
									step={5}
									value={backdropDensity.current}
									onValueChange={setBackdropDensity}
								/>
							{:else}
								<!--
									THE DIAL, NOT A LINE. The kit ships an angle slider, and a bearing is exactly
									what it is for: its default `startAngle` of -90 puts 0 at twelve o'clock and
									sweeps clockwise, which is the mapping this axis already uses, so no angles are
									passed. It also has no ends — the value that a linear track splits between 359
									and 0 is one position on a circle — and the thumb SHOWS the direction instead of
									naming it, which is the whole reason a bearing is easier to point at than to type.
								-->
								<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
									<!--
										A `<Label for>` would name nothing here: the root is a `<div>`, and `for`
										only binds to a labelable element. The control is the THUMB, which already
										carries `role="slider"` and a default name, so the visible text and the
										description are pointed AT it instead — the association runs the other way
										round from a form field's.
									-->
									<div class="flex flex-col gap-1">
										<span id="backdrop-angle-label" class="text-sm font-medium">Angle</span>
										<p id="backdrop-angle-hint" class="text-sm text-muted-foreground">
											{#if activeCategory === "pattern"}
												Turns the lattice. The ring-based motifs — Dots, Kanoko, Shippō, Seigaiha,
												Asanoha — are radially symmetric, so there is nothing in them to turn.
											{:else}
												Where the light comes from, as a bearing: 0° at the top, running clockwise.
											{/if}
										</p>
									</div>
									<AngleSlider.Root
										class="shrink-0 self-center sm:ms-auto"
										min={0}
										max={360}
										step={1}
										size={52}
										value={[backdropAngle.current]}
										onValueChange={(next) => setBackdropAngle(next[0] ?? 0)}
										onkeydown={wrapAngleAtZero}
									>
										<AngleSlider.Track>
											<AngleSlider.Range />
										</AngleSlider.Track>
										<AngleSlider.Thumb
											aria-labelledby="backdrop-angle-label"
											aria-describedby="backdrop-angle-hint"
										/>
										<AngleSlider.Value />
									</AngleSlider.Root>
								</div>
							{/if}
						</div>
					{/if}
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
