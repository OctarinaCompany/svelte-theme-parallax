<script lang="ts">
	import { getTagsInputItemContext } from "./tags-input.svelte.js";

	// Only ever instantiated by `<TagsInput.ItemText>`, from inside an item, so it reports the same
	// consumer name that part would.
	const item = getTagsInputItemContext("<TagsInput.ItemText>");
	const root = item.root;

	// Seeded at creation, and this component is created and destroyed with the `{#if}` around it, so
	// every edit starts from the tag's current text rather than a stale one.
	let editValue = $state(item.displayValue);
	let ref = $state<HTMLInputElement | null>(null);

	/** Upstream's auto-width: collapse, then grow to the content. */
	function resize(element: HTMLInputElement) {
		element.style.width = "0";
		element.style.width = `${element.scrollWidth + 4}px`;
	}

	$effect(() => {
		const element = ref;
		if (!element) return;

		element.focus();
		element.select();
		resize(element);
	});

	function oninput(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
		resize(event.currentTarget);
	}

	function onkeydown(event: KeyboardEvent & { currentTarget: EventTarget & HTMLInputElement }) {
		if (event.key === "Enter") {
			root.updateItem(item.index, editValue);
			event.preventDefault();
		} else if (event.key === "Escape") {
			// Discard: nothing was committed, so leaving edit mode restores the original text.
			root.editingIndex = null;
			root.highlightedIndex = item.index;
			root.inputElement?.focus();
			event.preventDefault();
		}

		// Upstream stops the keystroke here so the root's own input state machine never sees it.
		event.stopPropagation();
	}

	function onblur() {
		// Same discard as Escape — the edit is dropped and the tag goes back to highlighted — but
		// without stealing focus back from wherever it just went.
		root.editingIndex = null;
		root.highlightedIndex = item.index;
	}
</script>

<!--
	Labelled by value rather than `aria-labelledby`/`aria-describedby={item.textId}`: the text span
	unmounts while this field is shown, so that idref would dangle for the field's whole lifetime.
-->
<input
	bind:this={ref}
	bind:value={editValue}
	type="text"
	autocapitalize="off"
	autocomplete="off"
	autocorrect="off"
	spellcheck="false"
	aria-label={item.displayValue}
	data-slot="tags-input-item-edit"
	style="font: inherit;"
	class="min-w-[1ch] border-none bg-inherit p-0 text-inherit outline-hidden"
	{oninput}
	{onkeydown}
	{onblur}
/>
