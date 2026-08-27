<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLButtonAttributes } from "svelte/elements";

	import type { EventCalendarSegment } from "./event-calendar-types.js";

	/**
	 * Effective Tailwind palette presets for event colors; every entry works on light and dark
	 * surfaces through the chip's alpha background + accent border. These are palette *values*
	 * consumers pick from, not component styling — the chip itself only ever reads the
	 * `--ec-event-color` variable and falls back to `--primary`.
	 */
	export const EVENT_CALENDAR_COLORS: Array<{ name: string; value: string }> = [
		{ name: "Blue", value: "var(--color-blue-500)" },
		{ name: "Emerald", value: "var(--color-emerald-500)" },
		{ name: "Violet", value: "var(--color-violet-500)" },
		{ name: "Rose", value: "var(--color-rose-500)" },
		{ name: "Amber", value: "var(--color-amber-500)" },
		{ name: "Cyan", value: "var(--color-cyan-500)" },
		{ name: "Orange", value: "var(--color-orange-500)" },
		{ name: "Pink", value: "var(--color-pink-500)" },
		{ name: "Teal", value: "var(--color-teal-500)" },
		{ name: "Indigo", value: "var(--color-indigo-500)" },
	];

	/**
	 * Fade-out truncation for stacked timed blocks: squeezed cascade columns hard-clip titles
	 * into a mash of adjacent glyphs; a right-edge mask fade reads cleaner than an ellipsis at
	 * those tiny widths. Applied ONLY below a 10rem container width — mask-image forces text off
	 * subpixel antialiasing, so masking every wide chip makes the grid read blurry.
	 */
	export const EVENT_CALENDAR_FADE_TRUNCATE =
		"w-full truncate @max-[10rem]:text-clip @max-[10rem]:[mask-image:linear-gradient(to_right,#000_calc(100%-0.75rem),transparent)] @max-[10rem]:rtl:[mask-image:linear-gradient(to_left,#000_calc(100%-0.75rem),transparent)]";

	export type EventCalendarEventProps = WithElementRef<
		Omit<HTMLButtonAttributes, "children">,
		HTMLButtonElement
	> & {
		segment: EventCalendarSegment;
		/** Replaces the default chip CONTENT; the wrapper stays calendar-owned. */
		children?: import("svelte").Snippet;
	};
</script>

<script lang="ts">
	import RepeatIcon from "@lucide/svelte/icons/repeat";
	import { mergeProps } from "bits-ui";
	import { format } from "date-fns";

	import * as Tooltip from "$lib/components/ui/tooltip/index.js";

	import { spansMultipleDays, toZoned, zonedStartOfDay } from "./event-calendar-lib.js";
	import {
		getEventCalendarContext,
		getEventCalendarViewConfig,
		getEventCalendarViewContext,
		markChipPress,
		wasRecentDrag,
	} from "./event-calendar.svelte.js";
	import { addDays } from "date-fns";

	let {
		ref = $bindable(null),
		segment,
		class: className,
		style,
		children,
		onpointerdown,
		onclick,
		ondblclick,
		...restProps
	}: EventCalendarEventProps = $props();

	const root = getEventCalendarContext("<EventCalendarEvent>");
	const viewConfig = getEventCalendarViewConfig();
	const viewCtx = getEventCalendarViewContext();

	const occurrence = $derived(segment.occurrence);
	const event = $derived(occurrence.event);
	const view = $derived(viewCtx.view);

	const isSelected = $derived(root.selection.eventKeys.includes(occurrence.key));
	// The drag key comparison survives from upstream even though `drag` stays null in this theme
	// (divergence D-01) — a future engine flips the field and the chip dims without edits here.
	const isDragging = $derived(root.drag?.occurrence.key === occurrence.key);

	const isBar = $derived(occurrence.allDay || spansMultipleDays(occurrence, root.timeZone));
	const inTimeGrid = $derived(
		view === "week" || view === "day" || view === "days" || view === "resource",
	);
	const interactive = $derived(view !== "agenda");
	const timedBlock = $derived(inTimeGrid && !isBar);
	// >= compactEventMinutes renders the stacked (title over time) layout; squeezed cascade
	// columns there fade-truncate instead of hard-clipping into neighbors
	const stackedBlock = $derived(
		timedBlock && (segment.endMin ?? 0) - (segment.startMin ?? 0) >= viewConfig.compactEventMinutes,
	);

	// Agenda time text is per-day for multi-day events: the first day reads "From 9:00 AM",
	// middle days "All day", the last day "Until 5:00 PM". Boundaries derive from the occurrence
	// vs segment.day (never the packing flags - lane merging rewrites those on shared segment
	// objects, the original source).
	const agendaTimeText = $derived.by(() => {
		if (view !== "agenda") return "";
		if (occurrence.allDay) return root.i18n.labels.allDay;
		const dayStart = zonedStartOfDay(segment.day, root.timeZone);
		const dayEnd = addDays(toZoned(dayStart, root.timeZone), 1);
		const startsBefore = occurrence.start < dayStart;
		const endsAfter = occurrence.end > dayEnd;
		if (startsBefore && endsAfter) return root.i18n.labels.allDay;
		if (endsAfter) {
			return root.i18n.labels.timeFrom(
				format(toZoned(occurrence.start, root.timeZone), root.i18n.formats.eventTime, {
					locale: root.locale,
				}),
			);
		}
		if (startsBefore) {
			return root.i18n.labels.timeUntil(
				format(toZoned(occurrence.end, root.timeZone), root.i18n.formats.eventTime, {
					locale: root.locale,
				}),
			);
		}
		return root.i18n.functions.formatEventTime(
			toZoned(occurrence.start, root.timeZone),
			toZoned(occurrence.end, root.timeZone),
			false,
			{ locale: root.locale },
		);
	});

	const timeLabel = $derived(
		root.i18n.functions.formatEventTime(
			toZoned(occurrence.start, root.timeZone),
			toZoned(occurrence.end, root.timeZone),
			occurrence.allDay,
			{ locale: root.locale },
		),
	);
	// native hover tooltip text; a consumer formatter returning undefined drops the title
	// attribute entirely (e.g. when it renders its own tooltip)
	const label = $derived(
		root.i18n.functions.formatEventLabel
			? root.i18n.functions.formatEventLabel(event.title, timeLabel)
			: `${event.title}, ${timeLabel}`,
	);

	// Optional styled tooltip on hover / keyboard focus (viewConfig.eventTooltip, default off).
	// When on, the native title is dropped so the two never stack.
	const tooltipOpts = $derived(
		typeof viewConfig.eventTooltip === "object" ? viewConfig.eventTooltip : null,
	);
	const tooltipOn = $derived(Boolean(viewConfig.eventTooltip) && Boolean(label));

	function handlePointerDown(e: PointerEvent) {
		onpointerdown?.(e as PointerEvent & { currentTarget: EventTarget & HTMLButtonElement });
		e.stopPropagation();
		// suppress the trailing slot-create click when the press stays on the chip
		markChipPress();
	}

	function handleClick(e: MouseEvent) {
		onclick?.(e as MouseEvent & { currentTarget: EventTarget & HTMLButtonElement });
		e.stopPropagation();
		if (wasRecentDrag()) return;
		// consumer first: e.preventDefault() opts out of built-in selection (e.g. click = open
		// dialog only, no selected tint)
		root.opts.onEventClick?.(occurrence, e);
		// the agenda is a read-only list: a click never selects/focuses a row
		if (e.defaultPrevented || view === "agenda") return;
		root.api.selectEvent(occurrence.key);
	}

	function handleDoubleClick(e: MouseEvent) {
		ondblclick?.(e as MouseEvent & { currentTarget: EventTarget & HTMLButtonElement });
		e.stopPropagation();
		root.opts.onEventDoubleClick?.(occurrence, e);
	}

	const chipAttrs = $derived({
		type: "button" as const,
		"data-slot": "event-calendar-event",
		"data-view": view,
		"data-all-day": occurrence.allDay || undefined,
		"data-recurring": occurrence.isRecurring || undefined,
		"data-selected": isSelected || undefined,
		"data-dragging": isDragging || undefined,
		// todayTick keeps the wall-clock read fresh (midnight-granular, like isTodayDay): without
		// it a chip that ends while the calendar sits open never gains data-past
		"data-past": (void root.todayTick, occurrence.end.getTime() < Date.now()) || undefined,
		// native hover reveal for squeezed/faded chips: full title + time (dropped when the
		// styled eventTooltip is on so the two never stack)
		title: tooltipOn ? undefined : label,
		"aria-label":
			root.i18n.functions.formatEventAriaLabel?.(
				event.title,
				timeLabel,
				segment.continuesBefore || segment.continuesAfter,
			) ??
			`${event.title}, ${timeLabel}${
				segment.continuesBefore || segment.continuesAfter ? `, ${root.i18n.labels.continues}` : ""
			}`,
		// Selection is otherwise conveyed by a background tint alone; the chip is a real toggle in
		// every interactive view, so a screen reader hears the state (agenda rows never select).
		"aria-pressed": interactive ? isSelected : undefined,
		// merged, not spread: every tint, ring and dot on the chip reads --ec-event-color, so a
		// consumer style prop must not replace it
		style: `--ec-event-color: ${event.color ?? "var(--color-primary)"};${style ?? ""}`,
		onpointerdown: handlePointerDown,
		onclick: handleClick,
		ondblclick: handleDoubleClick,
		...restProps,
		class: cn(
			"group/ec-event relative flex w-full min-w-0 touch-none items-center overflow-hidden text-start text-foreground select-none",
			"outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
			view === "agenda"
				? // plain list row: color lives in the dot badge, not a tinted pill; hover AND
					// selection surfaces are owned by the agenda row wrapper
					"gap-3 rounded-md text-sm"
				: cn(
						// @container removes intrinsic sizing; only grid chips are containers.
						// py-1: room above/below inline badges (attendee pill etc.)
						"@container gap-1.5 rounded-sm px-1.5 py-1 leading-normal",
						// soft tint + hairline inset ring: color reads from the surface itself (no
						// accent border), stays legible in light and dark
						"bg-(--ec-event-color)/15 hover:bg-(--ec-event-color)/25",
						// a flat tint reads darker over a dark surface, so lift it a little in dark
						// mode to keep a lighter, softer chip tone
						"dark:bg-(--ec-event-color)/20 dark:hover:bg-(--ec-event-color)/30",
						"inset-ring inset-ring-(--ec-event-color)/15",
						"transition-[background-color,box-shadow] duration-150",
						"data-dragging:opacity-40",
						"data-selected:bg-(--ec-event-color)/30 data-selected:inset-ring-(--ec-event-color)/40",
						segment.continuesBefore && "rounded-s-none",
						segment.continuesAfter && "rounded-e-none",
					),
			viewConfig.classNames?.event,
			className,
		),
	});

	const renderProps = $derived({ occurrence, segment, view, isDragging, isSelected });
	const customContent = $derived(
		view === "agenda" ? viewConfig.renderAgendaEvent : viewConfig.renderEvent,
	);
</script>

{#snippet defaultContent()}
	<!-- leading color dot for single-row chips (month cells, all-day bars); time-grid blocks
	     read their color from the tinted surface instead - in the stacked layout a dot would sit
	     alone on the first line -->
	{#if !timedBlock}
		<span
			aria-hidden="true"
			data-slot="event-calendar-event-dot"
			class="-me-0.5 size-1.5 shrink-0 rounded-full bg-(--ec-event-color)"
		></span>
	{/if}
	{#if occurrence.isRecurring}
		<RepeatIcon class="size-2.5 shrink-0 opacity-70" aria-hidden="true" />
	{/if}
	<span class={cn("font-medium", stackedBlock ? EVENT_CALENDAR_FADE_TRUNCATE : "truncate")}>
		{event.title}
	</span>
	<!-- month cells are narrow: a compact never-shrinking start time keeps the title readable;
	     grid views show the full range -->
	{#if !occurrence.allDay && segment.isStart}
		{#if view === "month"}
			<span class="shrink-0 text-muted-foreground">
				{format(toZoned(occurrence.start, root.timeZone), root.i18n.formats.eventTime, {
					locale: root.locale,
				})}
			</span>
		{:else}
			<span
				class={cn(
					"hidden text-muted-foreground @[8rem]:inline",
					stackedBlock ? EVENT_CALENDAR_FADE_TRUNCATE : "truncate",
				)}
			>
				{root.i18n.functions.formatEventTime(
					toZoned(occurrence.start, root.timeZone),
					toZoned(occurrence.end, root.timeZone),
					occurrence.allDay,
					{ locale: root.locale },
				)}
			</span>
		{/if}
	{/if}
{/snippet}

{#snippet agendaDefaultContent()}
	<!-- Agenda default row: time column, color-dot badge, plain title -->
	<span class="w-40 shrink-0 truncate text-muted-foreground tabular-nums">
		{agendaTimeText}
	</span>
	<span
		aria-hidden="true"
		data-slot="event-calendar-agenda-dot"
		class="size-2 shrink-0 rounded-full bg-(--ec-event-color)"
	></span>
	<span class="truncate text-sm">{event.title}</span>
	{#if occurrence.isRecurring}
		<RepeatIcon class="size-2.5 shrink-0 text-muted-foreground" aria-hidden="true" />
	{/if}
{/snippet}

{#snippet chipContent()}
	{#if children}
		{@render children()}
	{:else if customContent}
		{@render customContent(renderProps)}
	{:else if view === "agenda"}
		{@render agendaDefaultContent()}
	{:else}
		{@render defaultContent()}
	{/if}
{/snippet}

{#if tooltipOn}
	<Tooltip.Provider delayDuration={tooltipOpts?.delay ?? 600}>
		<Tooltip.Root>
			<Tooltip.Trigger>
				{#snippet child({ props })}
					<!-- mergeProps, not a plain spread: the trigger's `props` carry their own
					     onclick/onpointerdown/data-slot, and a later spread would replace the chip's
					     handlers (no selection, no chip-press guard) instead of chaining both. -->
					<button bind:this={ref} {...mergeProps(props, chipAttrs)}>
						{@render chipContent()}
					</button>
				{/snippet}
			</Tooltip.Trigger>
			<Tooltip.Content
				side={tooltipOpts?.side ?? "top"}
				class={viewConfig.classNames?.eventTooltip}
			>
				{#if viewConfig.renderEventTooltip}
					{@render viewConfig.renderEventTooltip({ occurrence, segment, view, label })}
				{:else}
					{label}
				{/if}
			</Tooltip.Content>
		</Tooltip.Root>
	</Tooltip.Provider>
{:else}
	<button bind:this={ref} {...chipAttrs}>
		{@render chipContent()}
	</button>
{/if}
