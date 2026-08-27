<script lang="ts" module>
	import { getLocalTimeZone, parseDate, today, type DateValue } from "@internationalized/date";

	export interface FiltersDateTimeInputProps {
		/** The filter's values: one ISO date-time string, or nothing yet. */
		values: unknown[];
		onChange: (values: unknown[]) => void;
		autofocus?: boolean;
	}

	/**
	 * The half-hour slots of the example, five of them taken.
	 *
	 * The same list the Calendar page's appointment demos use, for the same reason: a picker whose
	 * every slot is free demonstrates nothing about a picker.
	 */
	const TIME_SLOTS = [
		{ time: "09:00", available: false },
		{ time: "09:30", available: false },
		{ time: "10:00", available: true },
		{ time: "10:30", available: true },
		{ time: "11:00", available: true },
		{ time: "11:30", available: true },
		{ time: "12:00", available: false },
		{ time: "12:30", available: true },
		{ time: "13:00", available: true },
		{ time: "13:30", available: true },
		{ time: "14:00", available: true },
		{ time: "14:30", available: false },
		{ time: "15:00", available: false },
		{ time: "15:30", available: true },
		{ time: "16:00", available: true },
		{ time: "16:30", available: true },
		{ time: "17:00", available: true },
		{ time: "17:30", available: true },
		{ time: "18:00", available: true },
		{ time: "18:30", available: true },
		{ time: "19:00", available: true },
		{ time: "19:30", available: true },
		{ time: "20:00", available: true },
		{ time: "20:30", available: true },
		{ time: "21:00", available: true },
		{ time: "21:30", available: true },
		{ time: "22:00", available: true },
		{ time: "22:30", available: true },
		{ time: "23:00", available: true },
		{ time: "23:30", available: true },
	];

	/**
	 * The long `PPP` date shape.
	 *
	 * `PPP` is `March 4th, 2026`; the closest `Intl` produces is `March 4, 2026`. The ordinal suffix
	 * is lost, and there is no locale-safe way to add it back for every language, so it goes.
	 */
	const fmtLong = new Intl.DateTimeFormat(undefined, { dateStyle: "long" });
	/** `format(date, "EEEE, d")` — the slot column's heading. */
	const fmtWeekdayDay = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric" });
</script>

<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { Calendar, Day as CalendarDay } from "$lib/components/ui/calendar/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import { cn } from "$lib/utils.js";

	/**
	 * The `Date & Time` control of "Filters with custom controls": a day, then a slot.
	 *
	 * PICKING A DAY CLEARS THE TIME. Upstream's rule, and the right one — the slot list is the
	 * availability of that day, so carrying yesterday's 14:30 over to a new day would be asserting
	 * something the page does not know.
	 *
	 * `minValue` replaces upstream's `disabled={[{ before: today }]}`: bits-ui expresses the same
	 * rule as a bound rather than as a matcher, and this is the only rule the example has.
	 */

	let { values, onChange, autofocus = false }: FiltersDateTimeInputProps = $props();

	const now = today(getLocalTimeZone());

	function initialDate(): DateValue | undefined {
		const value = values[0];
		if (typeof value !== "string" || !value) return undefined;
		try {
			return parseDate(value.slice(0, 10));
		} catch {
			return undefined;
		}
	}

	function initialTime(): string | undefined {
		const value = values[0];
		if (typeof value !== "string" || !value) return "10:00";
		const parsed = new Date(value);
		if (Number.isNaN(parsed.getTime())) return "10:00";
		return parsed.toTimeString().slice(0, 5);
	}

	let open = $state(false);
	let date = $state<DateValue | undefined>(initialDate());
	let time = $state<string | undefined>(initialTime());

	const triggerLabel = $derived.by(() => {
		if (!date) return "Pick a date and time";
		const day = fmtLong.format(date.toDate(getLocalTimeZone()));
		return time ? `${day} - ${time}` : day;
	});

	$effect(() => {
		if (!autofocus) return;
		const timer = setTimeout(() => (open = true), 400);
		return () => clearTimeout(timer);
	});

	function apply() {
		if (date && time) {
			const [hours, minutes] = time.split(":").map(Number);
			const stamp = date.toDate(getLocalTimeZone());
			stamp.setHours(hours, minutes, 0, 0);
			onChange([stamp.toISOString()]);
		}
		open = false;
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<button {...props} type="button" class="whitespace-nowrap">
				<span class={cn(!date && "text-muted-foreground")}>{triggerLabel}</span>
			</button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content align="start" class="w-auto gap-0 p-0 pt-1">
		<div class="flex max-sm:flex-col">
			<Calendar
				type="single"
				bind:value={
					() => date,
					(value) => {
						date = value;
						// A new day is a new availability list.
						time = undefined;
					}
				}
				minValue={now}
				class="p-2 [--cell-size:39px] sm:pe-5 [&_[data-calendar-head-cell]]:font-bold [&_[data-calendar-head-cell]]:text-foreground"
				day={dayChip}
			/>
			<div class="relative w-full max-sm:h-46 sm:w-40">
				<div class="absolute inset-0 py-4 max-sm:border-t">
					<div class="h-full overflow-y-auto sm:border-s">
						<div class="flex flex-col gap-3">
							<div class="flex h-5 shrink-0 items-center px-5">
								<p class="text-sm font-medium">
									{date ? fmtWeekdayDay.format(date.toDate(getLocalTimeZone())) : "Pick a date"}
								</p>
							</div>
							<div class="grid gap-1.5 px-5 max-sm:grid-cols-2">
								{#each TIME_SLOTS as slot (slot.time)}
									<Button
										class="w-full"
										disabled={!slot.available}
										size="sm"
										variant={time === slot.time ? "default" : "outline"}
										onclick={() => (time = slot.time)}
									>
										{slot.time}
									</Button>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="flex items-center justify-end gap-1.5 border-t border-border p-3">
			<Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
			<Button onclick={apply}>Apply</Button>
		</div>
	</Popover.Content>
</Popover.Root>

<!--
	The day chip, the same one the Calendar page draws. One line rather than an import: that page
	keeps it local too, and a shared module for a single string would be a bigger change than the
	duplication costs.
-->
{#snippet dayChip()}
	<CalendarDay
		class="border border-transparent not-data-selected:hover:border-input not-data-selected:hover:bg-muted data-[selected]:border-primary data-[selected]:hover:text-primary-foreground [&[data-today]:not([data-selected])]:border-border [&[data-today]:not([data-selected])]:bg-transparent"
	/>
{/snippet}
