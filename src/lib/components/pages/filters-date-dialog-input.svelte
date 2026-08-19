<script lang="ts" module>
	import { getLocalTimeZone, parseDate, type DateValue } from "@internationalized/date";

	export interface FiltersDateDialogInputProps {
		/** The filter's values: one `YYYY-MM-DD` string, or nothing yet. */
		values: unknown[];
		onChange: (values: unknown[]) => void;
		autofocus?: boolean;
	}

	const fmtMedium = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });
</script>

<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import { Calendar, Day as CalendarDay } from "$lib/components/ui/calendar/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import { cn } from "$lib/utils.js";

	/**
	 * The modal date selector of the Filters page's custom-control set: a chip that opens a
	 * dialog rather than a popover.
	 *
	 * The example's subject is the chip whose editor is modal — the dialog, its chrome, its
	 * copy and its apply/cancel model. What fills it is the `Calendar` this repository already
	 * ships, restyled to the theme's bordered day treatment; a dedicated date-selector widget
	 * would be a component of its own, not a detail of this control.
	 */

	let { values, onChange, autofocus = false }: FiltersDateDialogInputProps = $props();

	function toDateValue(value: unknown): DateValue | undefined {
		if (typeof value !== "string" || !value) return undefined;
		try {
			return parseDate(value.slice(0, 10));
		} catch {
			return undefined;
		}
	}

	const current = $derived(toDateValue(values[0]));

	let open = $state(false);
	let draft = $state<DateValue | undefined>(undefined);

	const triggerLabel = $derived(
		current ? fmtMedium.format(current.toDate(getLocalTimeZone())) : "Select a date",
	);

	$effect(() => {
		if (!autofocus) return;
		const timer = setTimeout(() => (open = true), 400);
		return () => clearTimeout(timer);
	});

	// Re-synced on every open, not once: the filter may have been edited from elsewhere between
	// two visits, and a stale draft would silently undo that on Apply.
	$effect(() => {
		if (open) draft = current;
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<button {...props} type="button" class="whitespace-nowrap">
				<span class={cn(!current && "text-muted-foreground")}>{triggerLabel}</span>
			</button>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content class="sm:max-w-lg" showCloseButton={false}>
		<Dialog.Header>
			<Dialog.Title>Select Date</Dialog.Title>
		</Dialog.Header>
		<Calendar
			type="single"
			bind:value={draft}
			class="mx-auto [--cell-size:39px] [&_[data-calendar-head-cell]]:font-bold [&_[data-calendar-head-cell]]:text-foreground"
			day={themedDay}
		/>
		<Dialog.Footer>
			<Dialog.Close>
				{#snippet child({ props })}
					<Button {...props} variant="outline">Cancel</Button>
				{/snippet}
			</Dialog.Close>
			<Button
				onclick={() => {
					onChange(draft ? [draft.toString()] : []);
					open = false;
				}}
			>
				Apply
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>

{#snippet themedDay()}
	<CalendarDay
		class="border border-transparent not-data-selected:hover:border-input not-data-selected:hover:bg-muted data-[selected]:border-primary data-[selected]:hover:text-primary-foreground [&[data-today]:not([data-selected])]:border-border [&[data-today]:not([data-selected])]:bg-transparent"
	/>
{/snippet}
