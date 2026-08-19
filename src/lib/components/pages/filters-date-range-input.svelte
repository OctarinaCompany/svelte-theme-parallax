<script lang="ts" module>
	import {
		endOfMonth,
		endOfYear,
		getLocalTimeZone,
		isSameDay,
		parseDate,
		startOfMonth,
		startOfYear,
		today,
		type DateValue,
	} from "@internationalized/date";

	type Range = { start: DateValue | undefined; end: DateValue | undefined };

	export interface FiltersDateRangeInputProps {
		/** The filter's values: two `YYYY-MM-DD` strings, or nothing yet. */
		values: unknown[];
		onChange: (values: unknown[]) => void;
		/** True on the chip the Add filter menu has just created — opens the popover for it. */
		autofocus?: boolean;
		/** What the trigger says while nothing is picked. */
		placeholder: string;
		/** Whether the eight-period rail is shown beside the calendar. */
		presets?: boolean;
	}

	/** The `LLL dd, y` date shape, as `Intl` states it. */
	const fmtDay = new Intl.DateTimeFormat(undefined, {
		month: "short",
		day: "2-digit",
		year: "numeric",
	});

	function label(value: DateValue): string {
		return fmtDay.format(value.toDate(getLocalTimeZone()));
	}

	/** `YYYY-MM-DD` in, `CalendarDate` out. Anything else — a half-filled filter — is nothing. */
	function toDateValue(value: unknown): DateValue | undefined {
		if (typeof value !== "string" || !value) return undefined;
		try {
			return parseDate(value.slice(0, 10));
		} catch {
			return undefined;
		}
	}
</script>

<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import {
		RangeCalendar,
		Day as RangeDay,
		rangeCalendarFlush,
		rangeDay,
	} from "$lib/components/ui/range-calendar/index.js";
	import { cn } from "$lib/utils.js";

	/**
	 * The `Date Range` and `Date Range Presets` controls of "Filters with custom controls",
	 * as ONE component: the two upstream files differ by a preset rail, a popover alignment and a
	 * placeholder, and everything else — the draft/apply/cancel model, the value shape, the
	 * 400ms auto-open — is the same text twice.
	 *
	 * THE CALENDAR SKIN IS NOT INVENTED HERE. `rangeCalendarFlush` and `rangeDay` are the recipes
	 * the Calendar and Range calendar pages already derived from the classic theme's picker partial, and
	 * this control sits in a popover exactly as those demos do.
	 *
	 * THE DRAFT IS THE POINT. Picking a day edits a local range; only Apply writes it back to the
	 * filter. Upstream's Cancel closes without reverting the draft, so re-opening shows the
	 * abandoned selection — reproduced, because a Cancel that reverts and a Cancel that closes are
	 * both defensible and this is the one upstream chose.
	 */

	let {
		values,
		onChange,
		autofocus = false,
		placeholder,
		presets = false,
	}: FiltersDateRangeInputProps = $props();

	const now = today(getLocalTimeZone());

	const rangePresets: { label: string; range: Range }[] = [
		{ label: "Today", range: { start: now, end: now } },
		{
			label: "Yesterday",
			range: { start: now.subtract({ days: 1 }), end: now.subtract({ days: 1 }) },
		},
		{ label: "Last 7 days", range: { start: now.subtract({ days: 6 }), end: now } },
		{ label: "Last 30 days", range: { start: now.subtract({ days: 29 }), end: now } },
		{ label: "Month to date", range: { start: startOfMonth(now), end: now } },
		{
			label: "Last month",
			range: {
				start: startOfMonth(now.subtract({ months: 1 })),
				end: endOfMonth(now.subtract({ months: 1 })),
			},
		},
		{ label: "Year to date", range: { start: startOfYear(now), end: now } },
		{
			label: "Last year",
			range: {
				start: startOfYear(now.subtract({ years: 1 })),
				end: endOfYear(now.subtract({ years: 1 })),
			},
		},
	];

	/**
	 * The draft is SEEDED from the filter and then owned locally — read once, through a function so
	 * the read is not a subscription. A `$derived` would be wrong here: the point of Apply is that
	 * the two disagree until it is pressed.
	 */
	function initialRange(): Range {
		return { start: toDateValue(values[0]), end: toDateValue(values[1]) };
	}

	let open = $state(false);
	let draft = $state<Range>(initialRange());
	let month = $state<DateValue>(initialRange().start ?? now);

	/**
	 * Which preset the draft happens to be, if any — a `$derived`, not the effect upstream keeps in
	 * step by hand. A preset clicked and then edited in the grid stops matching on its own.
	 */
	const activePreset = $derived(
		rangePresets.find(
			(preset) =>
				draft.start &&
				draft.end &&
				preset.range.start &&
				preset.range.end &&
				isSameDay(preset.range.start, draft.start) &&
				isSameDay(preset.range.end, draft.end),
		)?.label ?? null,
	);

	const triggerLabel = $derived.by(() => {
		if (!draft.start) return placeholder;
		return draft.end ? `${label(draft.start)} - ${label(draft.end)}` : label(draft.start);
	});

	$effect(() => {
		if (!autofocus) return;
		const timer = setTimeout(() => (open = true), 400);
		return () => clearTimeout(timer);
	});

	function apply() {
		if (draft.start) {
			const from = draft.start.toString();
			const to = (draft.end ?? draft.start).toString();
			onChange([from, to]);
		}
		open = false;
	}

	function pickPreset(preset: { label: string; range: Range }) {
		draft = preset.range;
		if (preset.range.start) month = preset.range.start;
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<button {...props} type="button" class="whitespace-nowrap">
				<span class={cn(!draft.start && "text-muted-foreground")}>{triggerLabel}</span>
			</button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content align={presets ? "center" : "start"} class="w-auto p-0" sideOffset={8}>
		<div class="flex max-sm:flex-col">
			{#if presets}
				<div class="relative py-4 max-sm:order-1 max-sm:border-t sm:w-32">
					<div class="h-full sm:border-e">
						<div class="flex flex-col px-2">
							{#each rangePresets as preset (preset.label)}
								<Button
									class={cn("w-full justify-start", activePreset === preset.label && "bg-accent")}
									size="sm"
									variant="ghost"
									onclick={() => pickPreset(preset)}
								>
									{preset.label}
								</Button>
							{/each}
						</div>
					</div>
				</div>
			{/if}
			<RangeCalendar
				bind:value={draft}
				bind:placeholder={month}
				numberOfMonths={2}
				class={rangeCalendarFlush}
				day={classicRangeDay}
			/>
		</div>
		<div class="flex items-center justify-end gap-1.5 border-t border-border p-3">
			<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button onclick={apply}>Apply</Button>
		</div>
	</Popover.Content>
</Popover.Root>

{#snippet classicRangeDay()}
	<RangeDay class={rangeDay} />
{/snippet}
