<script lang="ts" module>
	import type { FilterOptionListRenderProps } from "$lib/components/ui/filters/index.js";

	/** Fixed row height, so a row's offset is arithmetic rather than a measurement. */
	const ROW_HEIGHT = 32;
	/** Rows kept mounted beyond each edge of the viewport, so a fast scroll does not flash blank. */
	const OVERSCAN = 10;
</script>

<script lang="ts" generics="T">
	/**
	 * A windowed option list for `<Filters>`, wired through a field's `renderOptionList`.
	 *
	 * The component ships no windowing dependency — that is the point of the slot, upstream and
	 * here. The classic example would bring a virtualizer library; this repository has no Svelte
	 * counterpart installed, and adding one to demonstrate a slot would be adding a dependency to
	 * demonstrate not needing one. Fixed-height rows make the whole thing arithmetic: forty lines,
	 * no measurement, no library.
	 *
	 * THE HIGHLIGHTED ROW IS ALWAYS MOUNTED, even when it is nowhere near the viewport. The list's
	 * search box points `aria-activedescendant` at it, and a reference to an element that is not in
	 * the document is the same as no reference at all — a screen reader would announce nothing while
	 * the arrow keys visibly moved. That single rule is what `renderOptionList` contracts for, and
	 * it is why `highlightedIndex` is handed to the slot at all.
	 *
	 * Scrolling it into view is left to the list itself: it already does that by id, and because
	 * the row is mounted, it finds it.
	 */

	let { options, highlightedIndex, renderOption }: FilterOptionListRenderProps<T> = $props();

	let scrollTop = $state(0);
	let viewport = $state(300);

	const rows = $derived.by(() => {
		const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
		const last = Math.min(
			options.length - 1,
			first + Math.ceil(viewport / ROW_HEIGHT) + OVERSCAN * 2,
		);

		const indices: number[] = [];
		for (let index = first; index <= last; index++) indices.push(index);

		if (highlightedIndex >= 0 && highlightedIndex < options.length) {
			if (highlightedIndex < first || highlightedIndex > last) indices.push(highlightedIndex);
		}

		return indices;
	});
</script>

<div
	class="max-h-[300px] overflow-y-auto overscroll-contain px-1"
	bind:clientHeight={viewport}
	onscroll={(event) => (scrollTop = event.currentTarget.scrollTop)}
>
	<div class="relative w-full" style="height: {options.length * ROW_HEIGHT}px">
		{#each rows as index (String(options[index].value))}
			<div
				class="absolute top-0 left-0 w-full"
				style="transform: translateY({index * ROW_HEIGHT}px)"
			>
				{@render renderOption(options[index], index)}
			</div>
		{/each}
	</div>
</div>
