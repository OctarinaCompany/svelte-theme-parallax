<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
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
		FLAVORS,
		activeFlavor,
		DEFAULT_FLAVOR,
		setFlavor,
		type FlavorId,
	} from "$lib/hooks/flavor.svelte.js";
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
	 * flavor, the sidebar, the header — which is the same widening order the icons used to sit in.
	 * The flavor sits beside the palette because the two are read together: one chooses the ink,
	 * the other what is drawn with it.
	 */

	const sidebar = useSidebar();

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
		setFlavor(DEFAULT_FLAVOR);
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

		<DocSection title="Flavor">
			{#snippet blurb()}
				A fifth axis, layered over the palette and the mode rather than beside them: the palette
				decides what the surfaces are painted with, and a flavor decides what is painted — a
				gradient down the rail, a band on the bar, a light behind the page, a serif, a radius. Every
				one derives its colours from the live tokens, so all twelve compose with all
				{THEMES.length} palettes in both halves. The header's wand carries the same switch.
			{/snippet}
			<Card.Root>
				<Card.Content>
					<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
						{#each FLAVORS as flavor (flavor.id)}
							{@const active = flavor.id === activeFlavor.current}
							<button
								type="button"
								aria-pressed={active}
								onclick={() => setFlavor(flavor.id as FlavorId)}
								class={cn(
									"flex flex-col gap-1.5 rounded-lg border p-4 text-start transition-colors hover:bg-accent",
									active && "border-primary bg-primary-subtle hover:bg-primary-subtle",
								)}
							>
								<span class="flex items-center gap-2">
									<span class="text-sm font-medium">{flavor.name}</span>
									{#if active}
										<CheckIcon class="ms-auto size-4 text-primary" />
									{/if}
								</span>
								<span class="text-xs text-muted-foreground">{flavor.blurb}</span>
							</button>
						{/each}
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
