<script lang="ts" module>
	import { cn } from "$lib/utils.js";
	import type { Snippet } from "svelte";

	import type { ButtonProps } from "$lib/components/ui/button/index.js";

	export type EventCalendarNavTodayProps = Omit<ButtonProps, "children"> & {
		children?: Snippet;
		/**
		 * Tooltip text. Defaults to the actual current date (info the label doesn't carry);
		 * pass null to disable this one, or set the root `navTooltips={false}` to disable all.
		 */
		tooltip?: string | null;
	};
</script>

<script lang="ts">
	import { mergeProps } from "bits-ui";
	import { format } from "date-fns";

	import { Button } from "$lib/components/ui/button/index.js";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";

	import { toZoned } from "./event-calendar-lib.js";
	import { getEventCalendarContext, getEventCalendarViewConfig } from "./event-calendar.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		tooltip,
		onclick: onclickProp,
		...restProps
	}: EventCalendarNavTodayProps = $props();

	const root = getEventCalendarContext("<EventCalendarNavToday>");
	const viewConfig = getEventCalendarViewConfig();

	const now = $derived((void root.todayTick, new Date()));
	const isToday = $derived(now >= root.activeRange.start && now < root.activeRange.end);
	// display-zone "today", like every other today derivation in the calendar (a system-zone
	// new Date() can name a different day than Today opens)
	const defaultTooltip = $derived(
		format(toZoned(new Date(), root.timeZone), root.i18n.formats.dayTitle, {
			locale: root.locale,
		}),
	);
	const tooltipContent = $derived(
		viewConfig.navTooltips === false || tooltip === null ? null : (tooltip ?? defaultTooltip),
	);

	function handleClick(e: MouseEvent) {
		// `onclick` on `ButtonProps` is the intersection of the button and anchor DOM handler types
		// (Button renders either element depending on `href`); widening to their shared MouseEvent
		// supertype lets one implementation satisfy both call signatures.
		(onclickProp as unknown as ((event: MouseEvent) => void) | undefined)?.(e);
		if (e.defaultPrevented) return;
		root.api.today();
	}
</script>

{#snippet button({ props }: { props?: Record<string, unknown> } = {})}
	<!-- mergeProps, not a plain spread: the tooltip trigger's `props` carry their own onclick /
	     data-slot, and a later spread would replace `handleClick` (an inert button) instead of
	     chaining both handlers. -->
	<Button
		bind:ref
		variant={viewConfig.navButtonVariant}
		size={viewConfig.navButtonSize}
		{...mergeProps(props, restProps, {
			"data-slot": "event-calendar-nav-today",
			"data-active": isToday || undefined,
			class: cn(viewConfig.classNames?.navButton, className),
			onclick: handleClick,
		})}
	>
		{#if children}
			{@render children()}
		{:else}
			{root.i18n.labels.today}
		{/if}
	</Button>
{/snippet}

{#if tooltipContent}
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				{@render button({ props })}
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content
			side={viewConfig.navTooltips === false ? "top" : (viewConfig.navTooltips?.side ?? "top")}
			class={viewConfig.classNames?.navTooltip}
		>
			{tooltipContent}
		</Tooltip.Content>
	</Tooltip.Root>
{:else}
	{@render button()}
{/if}
