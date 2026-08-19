<script lang="ts">
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import PaletteIcon from "@lucide/svelte/icons/palette";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import ThemeSwatch from "$lib/components/navigation/ThemeSwatch.svelte";
	import { cn } from "$lib/utils.js";
	import { THEMES, activeTheme, setTheme, themeById, type ThemeId } from "$lib/themes/index.js";
	import { mode } from "mode-watcher";
	import { headerWear } from "$lib/hooks/header-mode.svelte.js";

	/**
	 * The palette picker: a trigger showing the current theme, and a menu of all of them.
	 *
	 * It sits beside {@link ModeToggle} in every page header, and the pairing is the point —
	 * palette and mode are two independent axes over the same token set, so the two controls
	 * belong together and neither subsumes the other.
	 *
	 * A DROPDOWN, NOT A `Select`. Both would be correct for "one of a short list", and `Select` is
	 * the shorter component. The menu wins on two counts: its items take arbitrary markup, so
	 * each row can carry a swatch and a line of description, and its trigger is a plain button
	 * rather than a form control — this changes an appearance, it does not submit a value.
	 *
	 * `RadioGroup`, so the menu says what it is. The items are mutually exclusive and one is
	 * always chosen, which is `role="menuitemradio"`; that is also what puts the check on the
	 * right of the active row, from the component's own indicator. A list of plain items would
	 * have needed a hand-rolled tick and would have told a screen reader nothing.
	 *
	 * @see $lib/themes — why the state lives in mode-watcher rather than here
	 */
	let { class: className, compact = false }: { class?: string; compact?: boolean } = $props();

	/**
	 * Which half of the palette the TRIGGER's strip should draw.
	 *
	 * The trigger sits on the header bar, which has its own light/dark pin. With the bar pinned
	 * opposite the page, a strip following the page shows the reader the half they are not looking
	 * at — the strip is there to say what the surface around it becomes.
	 *
	 * `compact` is the header form and the only one on the bar, so the override is scoped to it;
	 * the full form lives on the Themes page, where the page mode is the right answer. The ROWS
	 * inside the menu keep the page mode either way: the menu is portaled and painted `bg-popover`,
	 * so it never follows the pin.
	 */
	const triggerMode = $derived(
		compact ? headerWear.current : mode.current === "dark" ? "dark" : "light",
	);

	/**
	 * TWO ROW SHAPES, ONE COMPONENT. `compact` drops each row's blurb, leaving swatch and name
	 * on a single line — and that is the form the page header wears, because a header is chrome:
	 * it is opened to switch, by someone who has already chosen once, not to read every
	 * descriptions. The full form belongs where the choice is being MADE for the first time,
	 * which is the Themes page, and there the blurb is the whole reason to open the menu.
	 *
	 * A prop rather than a second component: the trigger, the radio group, the state wiring and
	 * the accessibility story are identical in both, and only the row's second line differs.
	 * Forking the file would have duplicated all of that to vary one `{#if}`.
	 *
	 * The panel narrows with the rows. `w-72` exists to fit a two-line blurb without it wrapping
	 * to four; a single-line row needs the swatch, a name and the indicator's `pr-8`, which
	 * `w-56` covers with room to spare — and a menu wider than its content reads as a mistake.
	 */
	const contentWidth = $derived(compact ? "w-56" : "w-72");

	const current = $derived(themeById(activeTheme.current));
</script>

<DropdownMenu.Root>
	<!--
		The label names the CURRENT value, not just the action. `aria-label` replaces the trigger's
		whole contents for a screen reader, so a bare "Change theme" would have thrown away the one
		word sighted users can read off it — and below `sm` that word is hidden anyway, leaving the
		swatch, which carries no text at all, to say which theme is on.
	-->
	<DropdownMenu.Trigger
		class={cn(buttonVariants({ variant: "ghost" }), "gap-2 px-2", className)}
		aria-label="Theme: {current.name}"
	>
		<!--
			The icon is the affordance on a narrow screen, where the name is hidden: a bare strip
			of colour beside the sun/moon reads as decoration rather than as a control.
		-->
		<PaletteIcon class="size-4 shrink-0" />
		<ThemeSwatch theme={current} mode={triggerMode} class="w-12" />
		<!--
			The name is the label, so it is what disappears first — the swatch still identifies the
			theme, and `aria-label` on the trigger keeps the control named either way.
		-->
		<span class="hidden text-sm font-normal sm:inline">{current.name}</span>
		<ChevronDownIcon class="size-4 shrink-0 opacity-50" />
	</DropdownMenu.Trigger>

	<!--
		`w-72` overrides the content's default `w-(--bits-dropdown-menu-anchor-width)`, which would
		size the menu to the trigger — around 150px, which is narrower than one row of it needs.
		`align="end"` keeps the panel inside the viewport: the trigger sits at the right edge of
		the header.

		THE MAX-HEIGHT MUST BE ASKED FOR. A dozen two-line rows run ~700px, taller than many
		viewports, and the generated content carries `overflow-y-auto` with no height cap — so
		without one it simply overflows the screen and nothing scrolls. bits-ui measures the room
		between the anchor and the viewport edge into `--bits-floating-available-height` on the
		wrapper it positions; capping the panel with it is what turns the overflow into a scroll,
		and keeps the cap correct as the window resizes.

		The cap stays on the compact form too. Single-line rows are around half the height,
		which still overflows a short window or a laptop with the browser chrome open — and the
		variable costs nothing when there is room to spare.
	-->
	<DropdownMenu.Content
		class={cn("max-h-(--bits-floating-available-height)", contentWidth)}
		align="end"
	>
		<DropdownMenu.Label>Theme</DropdownMenu.Label>
		<DropdownMenu.Separator />
		<DropdownMenu.RadioGroup
			value={activeTheme.current}
			onValueChange={(value) => setTheme(value as ThemeId)}
		>
			{#each THEMES as theme (theme.id)}
				<!--
					`py-2` and `items-start` rather than the item's own `py-1.5` centring: the full
					rows are two lines tall, and a swatch centred against a two-line block floats away
					from the name it belongs to. The compact rows are one line, so they keep the
					item's own centring and padding — the override would only make them taller than
					every other menu in the app.
				-->
				<DropdownMenu.RadioItem
					value={theme.id}
					class={compact ? "gap-3" : "items-start gap-3 py-2"}
				>
					<ThemeSwatch {theme} class={compact ? undefined : "mt-0.5"} />
					{#if compact}
						<span class="font-medium">{theme.name}</span>
					{:else}
						<span class="flex min-w-0 flex-col">
							<span class="font-medium">{theme.name}</span>
							<!--
								`text-wrap` because the item sets `whitespace-nowrap` for single-line rows;
								without it the blurb is one long line clipped by the panel.
							-->
							<span class="text-xs text-wrap text-muted-foreground">{theme.blurb}</span>
						</span>
					{/if}
				</DropdownMenu.RadioItem>
			{/each}
		</DropdownMenu.RadioGroup>
	</DropdownMenu.Content>
</DropdownMenu.Root>
