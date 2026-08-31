<script lang="ts">
	import type { Component } from "svelte";
	import ContrastIcon from "@lucide/svelte/icons/contrast";
	import DropletIcon from "@lucide/svelte/icons/droplet";
	import PanelLeftIcon from "@lucide/svelte/icons/panel-left";
	import SunMoonIcon from "@lucide/svelte/icons/sun-moon";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import { setSidebarMode, sidebarMode, type SidebarMode } from "$lib/hooks/sidebar-mode.svelte.js";
	import { setSidebarFloating, sidebarFloating } from "$lib/hooks/sidebar-behaviour.svelte.js";

	/**
	 * The sidebar's appearance, as a control: one chrome axis and one behaviour flag.
	 *
	 * It sits to the LEFT of {@link ThemeSelector} and {@link ModeToggle}, and the order is the
	 * scope each one has: this changes one panel, the picker changes the palette, the toggle
	 * changes the whole document. Narrowest first, reading outwards.
	 *
	 * A DROPDOWN, NOT A TOGGLE, because the axis rows are radio values and the flag is a
	 * checkbox — the same two-section shape as {@link HeaderToggle}, its sibling, so a visitor
	 * who has learned one recognises the other.
	 *
	 * TWO ICONS ON THE TRIGGER. The panel says WHICH element is being changed, the second icon
	 * says what the axis is currently set to. Neither alone is enough here: a bare contrast
	 * glyph would say nothing about the surface, and a bare panel would be the only control in
	 * the header that does not show its own value.
	 *
	 * @see $lib/hooks/sidebar-mode.svelte.ts — the axis, and why `default` writes no attribute
	 * @see $lib/hooks/sidebar-behaviour.svelte.ts — the flag, and why floating is ON by default
	 */
	let { class: className }: { class?: string } = $props();

	/**
	 * The three rows. `Default` follows the page; `Inverted` wears the opposite half and KEEPS
	 * wearing it when the page mode flips — a relative choice, not a pin (owner decision; the
	 * retired vocabulary was Follow page / Light / Dark). `Vibrant` is the odd one out and
	 * deliberately last: it is not a light/dark answer at all but the palette's brand painted onto
	 * the panel, so it belongs at the end of a list the first two form a pair in.
	 */
	const OPTIONS: { value: SidebarMode; label: string; icon: Component }[] = [
		{ value: "default", label: "Default", icon: SunMoonIcon },
		{ value: "inverted", label: "Inverted", icon: ContrastIcon },
		{ value: "vibrant", label: "Vibrant", icon: DropletIcon },
	];

	const current = $derived(OPTIONS.find((o) => o.value === sidebarMode.current) ?? OPTIONS[0]);
	const CurrentIcon = $derived(current.icon);
</script>

<DropdownMenu.Root>
	<!--
		The label names the current value, for the reason `ThemeSelector` gives: `aria-label`
		replaces the trigger's contents outright, and the contents here are two icons and no text
		at all — so a bare "Change sidebar appearance" would leave a screen reader unable to say
		which of the two is on.
	-->
	<DropdownMenu.Trigger
		class={cn(buttonVariants({ variant: "ghost" }), "gap-1.5 px-2", className)}
		aria-label="Sidebar appearance: {current.label}"
	>
		<PanelLeftIcon class="size-4 shrink-0" />
		<CurrentIcon class="size-3.5 shrink-0" />
	</DropdownMenu.Trigger>

	<!--
		`align="end"` for the same reason as the palette picker's: these controls sit against the
		right edge of the header, and a menu anchored at its start would hang off the viewport.

		A width override, because the rows are an icon and one short word: the content's default —
		which sizes to the trigger — is too narrow to be usable. `w-44` is the width of the
		longest row plus the indicator's `pr-8`.
	-->
	<DropdownMenu.Content class="w-44" align="end">
		<DropdownMenu.Label>Sidebar</DropdownMenu.Label>
		<DropdownMenu.Separator />
		<DropdownMenu.RadioGroup
			value={sidebarMode.current}
			onValueChange={(value) => setSidebarMode(value as SidebarMode)}
		>
			{#each OPTIONS as option (option.value)}
				{@const Icon = option.icon}
				<DropdownMenu.RadioItem value={option.value} class="gap-3">
					<Icon class="size-4 shrink-0 text-muted-foreground" />
					<span class="font-medium">{option.label}</span>
				</DropdownMenu.RadioItem>
			{/each}
		</DropdownMenu.RadioGroup>
		<DropdownMenu.Separator />
		<!--
			A checkbox, not a radio: independent of the axis, exactly as the header's two flags
			are of its. On by default — floating is the look the kit ships with.
		-->
		<DropdownMenu.CheckboxItem
			checked={sidebarFloating.current}
			onCheckedChange={setSidebarFloating}
		>
			Floating
		</DropdownMenu.CheckboxItem>
	</DropdownMenu.Content>
</DropdownMenu.Root>
