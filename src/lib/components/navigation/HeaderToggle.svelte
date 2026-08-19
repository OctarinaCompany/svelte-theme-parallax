<script lang="ts">
	import type { Component } from "svelte";
	import ContrastIcon from "@lucide/svelte/icons/contrast";
	import PanelTopIcon from "@lucide/svelte/icons/panel-top";
	import SunMoonIcon from "@lucide/svelte/icons/sun-moon";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import { setHeaderMode, headerMode, type HeaderMode } from "$lib/hooks/header-mode.svelte.js";
	import {
		headerAutoHide,
		headerFloating,
		setHeaderAutoHide,
		setHeaderFloating,
	} from "$lib/hooks/header-behaviour.svelte.js";

	/**
	 * The header's own appearance, as a control: one colour axis and two behaviour flags.
	 *
	 * It sits FIRST in the cluster, to the left of {@link SidebarModeToggle}, and the order is the
	 * scope each control has, read outward from the one you are pointing at: this bar, then the rail
	 * beside it, then the palette both are drawn from, then the whole document.
	 *
	 * SHAPED AFTER `SidebarModeToggle` deliberately — same trigger composition, same radio group,
	 * same `align="end"`. The two controls are siblings and a visitor who has learned one should
	 * recognise the other. What it adds is a second section: the mode is a value, the two flags are
	 * switches, so they are `CheckboxItem`s under a separator rather than more radio rows.
	 *
	 * TWO ICONS ON THE TRIGGER, for the reason its sibling gives: the panel says WHICH surface is
	 * being changed and the sun/moon says what it is currently set to. `panel-top` against the
	 * rail's `panel-left` is the whole distinction between the two triggers, so it has to be the
	 * icon that reads first.
	 *
	 * @see $lib/hooks/header-mode.svelte.ts — the colour axis, and why `auto` writes no attribute
	 * @see $lib/hooks/header-behaviour.svelte.ts — the two flags, and why they write no attribute
	 */
	let { class: className }: { class?: string } = $props();

	/**
	 * The two rows, both relative to the PAGE and independent of the rail's axis: `Default`
	 * wears the page's mode even beside an inverted rail, `Inverted` wears the opposite half
	 * (owner decision; the retired vocabulary was Follow sidebar / Light / Dark, and a first
	 * cut of `Default` followed the rail — rejected because inverting the rail dragged the bar
	 * with it).
	 */
	const OPTIONS: { value: HeaderMode; label: string; icon: Component }[] = [
		{ value: "default", label: "Default", icon: SunMoonIcon },
		{ value: "inverted", label: "Inverted", icon: ContrastIcon },
	];

	const current = $derived(OPTIONS.find((o) => o.value === headerMode.current) ?? OPTIONS[0]);
	const CurrentIcon = $derived(current.icon);
</script>

<DropdownMenu.Root>
	<!--
		The label names the current value, for the reason `ThemeSelector` gives: `aria-label`
		replaces the trigger's contents outright, and the contents here are two icons and no text at
		all — so a bare "Change header appearance" would leave a screen reader unable to say which of
		the two is on.
	-->
	<DropdownMenu.Trigger
		class={cn(buttonVariants({ variant: "ghost" }), "gap-1.5 px-2", className)}
		aria-label="Header appearance: {current.label}"
	>
		<PanelTopIcon class="size-4 shrink-0" />
		<CurrentIcon class="size-3.5 shrink-0" />
	</DropdownMenu.Trigger>

	<!--
		`w-52` rather than the rail's `w-44`: "Hide on scroll" is longer than anything in that menu,
		and a row that wraps in a four-row menu reads as a mistake.
	-->
	<DropdownMenu.Content class="w-52" align="end">
		<DropdownMenu.Label>Header</DropdownMenu.Label>
		<DropdownMenu.Separator />
		<DropdownMenu.RadioGroup
			value={headerMode.current}
			onValueChange={(value) => setHeaderMode(value as HeaderMode)}
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
			Checkboxes, not radios: these two are independent of the mode and of each other. A
			floating bar that also hides on scroll is a coherent combination, and so is neither.
		-->
		<DropdownMenu.CheckboxItem checked={headerAutoHide.current} onCheckedChange={setHeaderAutoHide}>
			Hide on scroll
		</DropdownMenu.CheckboxItem>
		<DropdownMenu.CheckboxItem checked={headerFloating.current} onCheckedChange={setHeaderFloating}>
			Floating
		</DropdownMenu.CheckboxItem>
	</DropdownMenu.Content>
</DropdownMenu.Root>
