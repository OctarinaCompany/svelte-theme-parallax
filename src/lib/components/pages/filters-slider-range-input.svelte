<script lang="ts" module>
	export interface FiltersSliderRangeInputProps {
		/** The filter's values: a single `{ min, max }` object, or nothing yet. */
		values: unknown[];
		onChange: (values: unknown[]) => void;
		autofocus?: boolean;
	}

	function toRange(value: unknown): [number, number] {
		if (value && typeof value === "object" && "min" in value && "max" in value) {
			const { min, max } = value as { min: number; max: number };
			return [min, max];
		}
		return [0, 100];
	}
</script>

<script lang="ts">
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import { Slider } from "$lib/components/ui/slider/index.js";

	/**
	 * The Filters page's `Slider Range` control.
	 *
	 * The only control on the page whose value is ONE object rather than two entries — `[{ min, max }]`
	 * where the date ranges write `[from, to]`. Deliberate: a filter's `values` is the consumer's
	 * shape, and showing two shapes side by side is what this example is for.
	 *
	 * Its two buttons also swap variants — Cancel is `ghost`, Apply is `outline`, where the four
	 * date controls have Cancel `outline` and Apply solid. Also deliberate: the popover footer is
	 * the consumer's markup, and two pairings side by side keep that visible.
	 */

	let { values, onChange, autofocus = false }: FiltersSliderRangeInputProps = $props();

	/** Seeded once, then owned locally until Apply — read through a function so it is not tracked. */
	function initialRange(): number[] {
		return toRange(values[0]);
	}

	let open = $state(false);
	let range = $state<number[]>(initialRange());

	$effect(() => {
		if (!autofocus) return;
		const timer = setTimeout(() => (open = true), 400);
		return () => clearTimeout(timer);
	});
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<button {...props} type="button" class="whitespace-nowrap">
				<span>{range[0]} - {range[1]}</span>
			</button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content align="start" alignOffset={-8} class="w-auto p-4" sideOffset={8}>
		<div class="flex flex-col gap-2.5">
			<div class="flex flex-col gap-4 pt-2.5">
				<Slider type="multiple" bind:value={range} min={0} max={100} step={1} class="w-[200px]" />
				<div class="flex justify-between ps-1.5 text-xs text-muted-foreground">
					<span>0</span>
					<span>100</span>
				</div>
			</div>
			<div class="flex items-center justify-end gap-1.5">
				<Button variant="ghost" size="sm" onclick={() => (open = false)}>Cancel</Button>
				<Button
					variant="outline"
					size="sm"
					onclick={() => {
						onChange([{ min: range[0], max: range[1] }]);
						open = false;
					}}
				>
					Apply
				</Button>
			</div>
		</div>
	</Popover.Content>
</Popover.Root>
