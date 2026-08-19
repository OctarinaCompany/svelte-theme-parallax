<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	import type { StatusMonitorPeriod, StatusMonitorUnit } from "./status-monitor.svelte.js";

	/**
	 * `title` is redeclared rather than inherited: `HTMLAttributes` already owns that name for the
	 * native tooltip attribute, and upstream spends it on the monitor's heading.
	 * Upstream's spelling wins here, so the native attribute is the one
	 * that is unreachable — a monitor whose every bar has its own tooltip has no use for it.
	 */
	export type StatusMonitorRootProps = Omit<
		WithElementRef<HTMLAttributes<HTMLDivElement>>,
		"title"
	> & {
		/**
		 * The measured periods, oldest first. Shorter histories are padded on the left, longer ones
		 * are trimmed to the newest 90. A `null`, an `undefined` or a hole renders as an empty bar
		 * in place rather than collapsing the strip.
		 */
		periods?: readonly (StatusMonitorPeriod | null | undefined)[];
		/**
		 * The period one bar stands for. Read by the legend and by the timestamp format.
		 * @default "days"
		 */
		unit?: StatusMonitorUnit;
		/**
		 * The heading shown at the strip's left end.
		 * @default "Application Status"
		 */
		title?: string;
		/**
		 * Whether the uptime percentage is shown at the strip's right end.
		 * @default true
		 */
		showUptime?: boolean;
	};

	/** Upstream-parity alias of {@link StatusMonitorRootProps}. */
	export type StatusMonitorProps = StatusMonitorRootProps;

	/**
	 * Shared so the default is one array rather than a fresh one per instantiation, which would
	 * invalidate every downstream `$derived` on identity alone.
	 */
	const NO_PERIODS: readonly StatusMonitorPeriod[] = [];
</script>

<script lang="ts">
	import {
		observeStatusMonitorWidth,
		resolveStatusMonitorUnit,
		setStatusMonitorContext,
		StatusMonitorState,
	} from "./status-monitor.svelte.js";

	/**
	 * The uptime strip from a public status page: one bar per period, coloured by state, with a
	 * tooltip per bar.
	 *
	 * NO PART TAKES A `child` SNIPPET. That pattern exists in this repository to replace React's
	 * `asChild`/Radix `Slot`, and upstream uses neither here — it is a block, not a primitive kit.
	 * The one place a caller's own element would be handed props anyway is the bar, and that slot is
	 * already spent on `<Tooltip.Trigger>`'s own `child`.
	 *
	 * The root is the measured box: it is full width, the parts inside it are laid out at the
	 * strip's exact pixel width, and the three custom properties that carry those numbers are
	 * published here. `min-w-52` is upstream's `min-w-[208px]`, which is one 30-bar strip exactly.
	 */
	let {
		ref = $bindable(null),
		periods = NO_PERIODS,
		unit = "days",
		title = "Application Status",
		showUptime = true,
		class: className,
		style,
		children,
		...restProps
	}: StatusMonitorRootProps = $props();

	const state = new StatusMonitorState({
		getPeriods: () => periods,
		getUnit: () => resolveStatusMonitorUnit(unit),
		getTitle: () => title,
		getShowUptime: () => showUptime,
	});

	setStatusMonitorContext(state);

	// Reads the element, writes the measured width — two disjoint sets, so the effect never wakes on
	// its own write and needs no `untrack` (see `ui/cropper/cropper-image.svelte` for the case where
	// they overlap). `observeStatusMonitorWidth` touches the DOM only.
	$effect(() => {
		const element = ref;
		if (!element) return;

		return observeStatusMonitorWidth(element, (width) => state.setContainerWidth(width));
	});

	const rootAttrs = $derived({
		"data-slot": "status-monitor",
		"data-unit": state.unit,
		...restProps,
		style: style ? `${state.customProperties} ${style}` : state.customProperties,
		class: cn("mx-auto flex w-full max-w-3xl min-w-52 flex-col gap-3", className),
	});
</script>

<div bind:this={ref} {...rootAttrs}>
	{@render children?.()}
</div>
