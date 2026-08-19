<script lang="ts" module>
	import { cn } from "$lib/utils.js";
	import type { Snippet } from "svelte";

	import type { ButtonProps } from "$lib/components/ui/button/index.js";

	export type EventCalendarNavNextProps = Omit<ButtonProps, "children"> & {
		children?: Snippet;
		/** Tooltip text; defaults to the accessible label. Pass null to disable this one. */
		tooltip?: string | null;
	};
</script>

<script lang="ts">
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import { mergeProps } from "bits-ui";

	import { Button } from "$lib/components/ui/button/index.js";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";

	import { getEventCalendarContext, getEventCalendarViewConfig } from "./event-calendar.svelte.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		tooltip,
		onclick: onclickProp,
		...restProps
	}: EventCalendarNavNextProps = $props();

	const root = getEventCalendarContext("<EventCalendarNavNext>");
	const viewConfig = getEventCalendarViewConfig();

	const tooltipContent = $derived(
		viewConfig.navTooltips === false || tooltip === null
			? null
			: (tooltip ?? root.i18n.labels.next),
	);

	function handleClick(e: MouseEvent) {
		// `onclick` on `ButtonProps` is the intersection of the button and anchor DOM handler types
		// (Button renders either element depending on `href`); widening to their shared MouseEvent
		// supertype lets one implementation satisfy both call signatures.
		(onclickProp as unknown as ((event: MouseEvent) => void) | undefined)?.(e);
		if (e.defaultPrevented) return;
		root.api.next();
	}
</script>

{#snippet button({ props }: { props?: Record<string, unknown> } = {})}
	<!-- mergeProps, not a plain spread: the tooltip trigger's `props` carry their own onclick /
	     data-slot, and a later spread would replace `handleClick` (an inert button) instead of
	     chaining both handlers. -->
	<Button
		bind:ref
		variant={viewConfig.navButtonVariant}
		size={viewConfig.navButtonSize === "sm" ? "icon-sm" : "icon"}
		{...mergeProps(props, restProps, {
			"data-slot": "event-calendar-nav-next",
			"aria-label": root.i18n.labels.next,
			class: cn(viewConfig.classNames?.navButton, className),
			onclick: handleClick,
		})}
	>
		{#if children}
			{@render children()}
		{:else}
			<ChevronRightIcon aria-hidden="true" />
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
