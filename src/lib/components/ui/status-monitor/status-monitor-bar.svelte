<script lang="ts" module>
	import type { WithElementRef, WithoutChildren } from "$lib/utils.js";
	import type { HTMLButtonAttributes } from "svelte/elements";

	import type { StatusMonitorPeriod } from "./status-monitor.svelte.js";

	export type StatusMonitorBarProps = WithoutChildren<
		WithElementRef<HTMLButtonAttributes, HTMLButtonElement>
	> & {
		/** The period this bar stands for. */
		period: StatusMonitorPeriod;
	};
</script>

<script lang="ts">
	import * as Status from "$lib/components/ui/status/index.js";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import { cn } from "$lib/utils.js";

	import {
		getStatusMonitorContext,
		statusMonitorBarVariants,
		STATUS_MONITOR_STATUS_VARIANTS,
	} from "./status-monitor.svelte.js";

	/**
	 * One period of the strip, and the trigger for that period's tooltip.
	 *
	 * IT IS A `<button>`, where upstream renders a `<div tabIndex={0}>`.
	 * The element is focusable either way, but only the button is announced as a control and reached
	 * by the browser's own semantics rather than by a tabindex the a11y linter has to be talked out
	 * of. It stays one tab stop per bar, as upstream, so every period is reachable without a pointer;
	 * on a full 90-slot history that is ninety stops, which is the cost of the design upstream chose.
	 *
	 * The tooltip is the house `ui/tooltip`, not a `title` attribute: `title` cannot be reached by
	 * keyboard, cannot be styled, and cannot hold the status pill that says what the colour means.
	 *
	 * THE PILL IS `ui/status`. Upstream tints the headline text with the raw status colour on the
	 * tooltip's own dark ground — in this theme that is ink on a themed ground, where the raw token
	 * is a fill and measures far below contrast. The Status pill solves it by carrying its own
	 * `*-subtle` ground under the contrast-walked `*-subtle-foreground` ink, so it reads on whatever
	 * the tooltip is painted with; and it is the same object the rest of the theme shows for the same
	 * state, which is the whole point of speaking one status vocabulary. Upstream's four lucide icons
	 * are dropped with it: the pill's text already carries the state without relying on colour, which
	 * is what the icon was there for.
	 */
	let {
		ref = $bindable(null),
		period,
		class: className,
		...restProps
	}: StatusMonitorBarProps = $props();

	const root = getStatusMonitorContext("<StatusMonitor.Bar>");

	const timestamp = $derived(root.timestampOf(period));

	// `props` is spread FIRST. It carries the wiring bits-ui owns — the `id` it resolves the element
	// by, the pointer and focus handlers, `type`, `tabindex`, `data-state` — none of which is named
	// below, so all of it survives. It also carries `data-slot="tooltip-trigger"` from
	// `ui/tooltip/tooltip-trigger.svelte`, and that one MUST lose: the bar's own slot name is what
	// this component's styling hooks and its documented data attributes are written against.
	const barAttrs = $derived({
		"data-slot": "status-monitor-bar",
		"data-status": period.status,
		"aria-label": root.accessibleNameOf(period),
		...restProps,
		class: cn(statusMonitorBarVariants({ status: period.status }), className),
	});
</script>

<Tooltip.Root>
	<Tooltip.Trigger>
		{#snippet child({ props })}
			<button bind:this={ref} {...props} {...barAttrs}></button>
		{/snippet}
	</Tooltip.Trigger>
	<!--
		The open/close animation is off, as upstream turns it off: the
		triggers are five pixels apart, so sweeping the strip re-runs the enter animation on every
		bar crossed and the tooltip strobes instead of tracking the pointer.

		It is spelled as one `animate-none!` rather than as the three state-scoped overrides upstream
		writes, because those would not win here. `tailwind-merge` does not recognise `animate-in` /
		`animate-out` as members of its `animate` group (they come from `tw-animate-css`, not core),
		so it leaves both classes in place instead of resolving the conflict and the outcome falls to
		stylesheet order. The important suffix makes it deterministic. Unmounting is unaffected —
		`bits-ui` waits on `node.getAnimations()`, which is empty when there is no animation.
	-->
	<Tooltip.Content side="bottom" sideOffset={8} class="animate-none! flex-col items-start gap-1.5">
		<Status.Root variant={STATUS_MONITOR_STATUS_VARIANTS[period.status]}>
			<Status.Label>{root.labelOf(period)}</Status.Label>
		</Status.Root>
		{#if timestamp}
			<span class="text-background/70">{timestamp}</span>
		{/if}
		<p class="leading-snug text-background/80">{root.infoOf(period)}</p>
	</Tooltip.Content>
</Tooltip.Root>
