<script lang="ts" module>
	import { cn } from "$lib/utils.js";
	import type { Snippet } from "svelte";

	import type { ButtonProps } from "$lib/components/ui/button/index.js";

	export type EventCalendarViewSwitcherProps = Omit<ButtonProps, "children"> & {
		children?: Snippet;
	};
</script>

<script lang="ts">
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";

	import { Button } from "$lib/components/ui/button/index.js";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";

	import type { CalendarView } from "./event-calendar-types.js";
	import { getEventCalendarContext, getEventCalendarViewConfig } from "./event-calendar.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: EventCalendarViewSwitcherProps = $props();

	const root = getEventCalendarContext("<EventCalendarViewSwitcher>");
	const viewConfig = getEventCalendarViewConfig();

	// Controlled open: selecting a view swaps the whole content subtree in the same click, so
	// closing must not depend on the menu's internal handler.
	let open = $state(false);

	function selectView(view: CalendarView, opts?: { dayCount?: number }) {
		open = false;
		root.api.setView(view, opts);
	}

	function viewLabel(view: CalendarView): string {
		return view === "days" ? root.i18n.viewNames.days(root.dayCount) : root.i18n.viewNames[view];
	}
</script>

<DropdownMenu.Root bind:open>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				bind:ref
				variant={viewConfig.navButtonVariant}
				size={viewConfig.navButtonSize}
				data-slot="event-calendar-view-switcher"
				aria-label={root.i18n.labels.selectView}
				class={cn("gap-1", viewConfig.classNames?.navButton, className)}
				{...restProps}
				{...props}
			>
				{#if children}
					{@render children()}
				{:else}
					{viewLabel(root.view)}
					<ChevronDownIcon class="opacity-60" aria-hidden="true" />
				{/if}
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content
		align="start"
		class={cn("min-w-44", viewConfig.classNames?.viewSwitcherContent)}
	>
		<!-- Keep the label inside the group so it stays associated with its items -->
		<DropdownMenu.Group>
			<DropdownMenu.Label
				class={cn("font-normal text-muted-foreground", viewConfig.classNames?.viewSwitcherLabel)}
			>
				{root.i18n.labels.selectView}
			</DropdownMenu.Label>
			{#each root.views as view (view)}
				{#if view === "days"}
					{#each viewConfig.dayCountPresets as count (count)}
						<DropdownMenu.Item
							data-active={(root.view === "days" && root.dayCount === count) || undefined}
							onclick={() => selectView("days", { dayCount: count })}
						>
							{root.i18n.viewNames.days(count)}
							<!-- hint derived from the preset itself, not i18n's default -->
							{#if viewConfig.enableShortcuts}
								<kbd
									data-slot="event-calendar-view-shortcut"
									class={cn(
										"ms-auto inline-flex size-5 shrink-0 items-center justify-center rounded-sm border font-sans text-xs text-muted-foreground",
										viewConfig.classNames?.viewShortcut,
									)}
								>
									{count}
								</kbd>
							{/if}
						</DropdownMenu.Item>
					{/each}
				{:else}
					<DropdownMenu.Item
						data-active={root.view === view || undefined}
						onclick={() => selectView(view)}
					>
						{viewLabel(view)}
						{#if viewConfig.enableShortcuts}
							<kbd
								data-slot="event-calendar-view-shortcut"
								class={cn(
									"ms-auto inline-flex size-5 shrink-0 items-center justify-center rounded-sm border font-sans text-xs text-muted-foreground",
									viewConfig.classNames?.viewShortcut,
								)}
							>
								{root.i18n.labels.viewShortcuts[view]}
							</kbd>
						{/if}
					</DropdownMenu.Item>
				{/if}
			{/each}
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
