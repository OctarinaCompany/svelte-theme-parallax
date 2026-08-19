<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLInputAttributes } from "svelte/elements";

	/**
	 * The field, skinned on this theme's `<Input>` rather than on upstream's own shell — same border,
	 * ring, invalid and dark-mode treatment as every other control on the page.
	 *
	 * The two sibling selectors are upstream's, and they are the reason the size lives here and not on
	 * the trigger and clear buttons: those two are positioned against the field's inner edge, which
	 * only the field's own padding knows.
	 */
	export const autocompleteInputVariants = tv({
		base: "flex w-full min-w-0 rounded-md border border-input bg-transparent text-base shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [[readonly]]:cursor-not-allowed [[readonly]]:bg-muted/80",
		// Heights consume the house `--control-h-*` ramp (sm 32 / default 40 / lg 48, as `Input`,
		// the select-trigger and `Button` step), with `default` exactly this repo's `Input`. The
		// paddings and button insets are horizontal, so re-anchoring the heights leaves them alone.
		variants: {
			size: {
				sm: "h-(--control-h-sm) px-2 [&~[data-slot=autocomplete-clear]]:right-1.5 [&~[data-slot=autocomplete-trigger]]:right-1.5",
				default:
					"h-(--control-h-default) px-2.5 [&~[data-slot=autocomplete-clear]]:right-1.75 [&~[data-slot=autocomplete-trigger]]:right-1.75",
				lg: "h-(--control-h-lg) px-2.5 [&~[data-slot=autocomplete-clear]]:right-2 [&~[data-slot=autocomplete-trigger]]:right-2",
			},
		},
		defaultVariants: {
			size: "default",
		},
	});

	export type AutocompleteInputSize = VariantProps<typeof autocompleteInputVariants>["size"];

	export type AutocompleteInputProps = WithElementRef<
		Omit<HTMLInputAttributes, "size" | "value" | "type">,
		HTMLInputElement
	> & {
		/**
		 * The field height, and with it the inset of the trigger and clear buttons.
		 *
		 * @default "default"
		 */
		size?: AutocompleteInputSize;
		/**
		 * Whether a clear button is rendered once there is something to clear.
		 *
		 * @default false
		 */
		showClear?: boolean;
		/**
		 * Whether a search button is rendered inside the field. It hides itself when a clear button
		 * takes its place, so the two never stack.
		 *
		 * @default false
		 */
		showTrigger?: boolean;
	};
</script>

<script lang="ts">
	import { getAutocompleteContext } from "./autocomplete.svelte.js";
	import AutocompleteClear from "./autocomplete-clear.svelte";
	import AutocompleteTrigger from "./autocomplete-trigger.svelte";

	let {
		ref = $bindable(null),
		size = "default",
		showClear = false,
		showTrigger = false,
		class: className,
		oninput: oninputProp,
		onkeydown: onkeydownProp,
		onblur: onblurProp,
		...restProps
	}: AutocompleteInputProps = $props();

	const root = getAutocompleteContext("<Autocomplete.Input>");

	/** The field plus its trigger and clear buttons — everything a click may land on and keep it open. */
	let wrapper = $state<HTMLDivElement | null>(null);

	// The popup is anchored here rather than to a wrapper, so the root needs the element itself —
	// it is also what regains focus after a selection or a clear.
	$effect(() => {
		root.inputElement = ref;
		return () => {
			if (root.inputElement === ref) root.inputElement = null;
		};
	});

	/**
	 * Push the state's text back into the DOM.
	 *
	 * The field is controlled by `root.value`, and the two only diverge in one direction: the user
	 * types, the browser has already painted the keystroke, and the state may or may not accept it.
	 * Selecting an item is the other direction, and the plain `value` attribute below covers that.
	 */
	$effect(() => {
		const element = ref;
		const next = root.value;
		if (element && element.value !== next) element.value = next;
	});

	// Each handler runs the caller's first and `preventDefault()` suppresses ours, the same
	// composition every other part in this repository uses.
	function oninput(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
		oninputProp?.(event);
		if (event.defaultPrevented) return;

		const element = event.currentTarget;
		root.onInput(element.value);

		// An authoritative parent that declines the write has left `root.value` where it was; the
		// browser has not. Read the state back and make the field agree with it.
		if (element.value !== root.value) element.value = root.value;
	}

	/**
	 * Focus left the field, so the suggestions have nothing left to suggest to.
	 *
	 * `bits-ui`'s dismissible layer closes on a pointer press *outside*, which is not the same
	 * question: tabbing away, or clicking straight into a second autocomplete, moves focus without
	 * ever pressing outside this popup, and two open suggestion lists on one page is not a state
	 * anyone asked for. The two exceptions are the popup itself — a click on an item, which
	 * `<Autocomplete.Item>` already keeps focus through — and the buttons inside the field.
	 */
	function onblur(event: FocusEvent & { currentTarget: EventTarget & HTMLInputElement }) {
		onblurProp?.(event);
		if (event.defaultPrevented) return;
		if (!root.open) return;

		const next = event.relatedTarget;
		if (next instanceof Node && (wrapper?.contains(next) || root.contentElement?.contains(next))) {
			return;
		}

		root.setOpen(false);
	}

	function onkeydown(event: KeyboardEvent & { currentTarget: EventTarget & HTMLInputElement }) {
		onkeydownProp?.(event);
		if (event.defaultPrevented) return;
		if (root.disabled) return;
		// During IME composition the arrows navigate the candidate window and Enter commits the
		// composition — none of that is ours to intercept. `keyCode === 229` covers the browsers that
		// report the composed keydown without `isComposing`.
		if (event.isComposing || event.keyCode === 229) return;

		switch (event.key) {
			case "ArrowDown":
				event.preventDefault();
				if (root.open) root.highlightMove("next");
				else void root.openWithHighlight("first");
				return;
			case "ArrowUp":
				event.preventDefault();
				if (root.open) root.highlightMove("prev");
				else void root.openWithHighlight("last");
				return;
			case "Home":
				if (!root.open) return;
				event.preventDefault();
				root.highlightMove("first");
				return;
			case "End":
				if (!root.open) return;
				event.preventDefault();
				root.highlightMove("last");
				return;
			case "Enter": {
				const highlighted = root.highlightedItem;
				if (!root.open || !highlighted) return;

				// Only swallow the key when there is something to commit, so a form with nothing
				// highlighted still submits on Enter — which is the point of `autoHighlight` being off.
				event.preventDefault();
				root.selectItem(highlighted.stringValue);
				return;
			}
			case "Escape":
				if (!root.open) return;
				event.preventDefault();
				root.setOpen(false);
				return;
			case "Tab":
				root.setOpen(false);
				return;
		}
	}
</script>

<div bind:this={wrapper} class="relative w-full">
	<!--
		`data-*`/`aria-*` first and the behaviour-critical props last, so a caller attribute arriving
		through `..restProps` can neither drop the slot marker nor clobber a handler.
	-->
	<input
		bind:this={ref}
		type="text"
		data-slot="autocomplete-input"
		data-size={size}
		data-state={root.dataState}
		data-disabled={root.disabled ? "" : undefined}
		id={root.inputId}
		role="combobox"
		autocomplete="off"
		autocapitalize="none"
		autocorrect="off"
		spellcheck="false"
		aria-haspopup="listbox"
		aria-expanded={root.open}
		aria-controls={root.open ? root.listId : undefined}
		aria-autocomplete="list"
		aria-activedescendant={root.highlightedId}
		{...restProps}
		class={cn(autocompleteInputVariants({ size }), className)}
		value={root.value}
		disabled={root.disabled}
		readonly={root.readonly}
		{oninput}
		{onkeydown}
		{onblur}
	/>
	{#if showTrigger}
		<AutocompleteTrigger />
	{/if}
	{#if showClear}
		<AutocompleteClear />
	{/if}
</div>
