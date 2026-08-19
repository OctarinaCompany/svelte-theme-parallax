<script lang="ts" module>
	import type { HTMLInputAttributes } from "svelte/elements";

	import { cn, type WithElementRef } from "$lib/utils.js";

	export type ComboboxChipsInputProps = WithElementRef<
		Omit<HTMLInputAttributes, "size" | "value" | "type">,
		HTMLInputElement
	>;
</script>

<script lang="ts">
	import { getComboboxContext } from "./combobox.svelte.js";

	/**
	 * The bare search input that flows after the chips: no border, no
	 * ring — the `<Combobox.Chips>` container is the field chrome, exactly as upstream's
	 * `min-w-16 flex-1 outline-none` says.
	 *
	 * Same contract as `<Combobox.Input>` — controlled text, shared keyboard handling, blur-close —
	 * plus the one key the chips flow owns: `Backspace` on an empty field removes the last chip,
	 * which is how Base UI lets a keyboard user unpick without ever leaving the input.
	 */

	let {
		ref = $bindable(null),
		class: className,
		oninput: oninputProp,
		onkeydown: onkeydownProp,
		onblur: onblurProp,
		...restProps
	}: ComboboxChipsInputProps = $props();

	const root = getComboboxContext("<Combobox.ChipsInput>");

	$effect(() => {
		root.inputElement = ref;
		return () => {
			if (root.inputElement === ref) root.inputElement = null;
		};
	});

	// Push the state's text back into the DOM — selection clears the query without an input event,
	// and this is what repaints the field when it does.
	$effect(() => {
		const element = ref;
		const next = root.inputDisplayValue;
		if (element && element.value !== next) element.value = next;
	});

	// Each handler runs the caller's first and `preventDefault()` suppresses ours.
	function oninput(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
		oninputProp?.(event);
		if (event.defaultPrevented) return;

		const element = event.currentTarget;
		root.onInput(element.value);

		// An authoritative parent that declines the write has left the state where it was; the
		// browser has not. Read the state back and make the field agree with it.
		if (element.value !== root.inputDisplayValue) element.value = root.inputDisplayValue;
	}

	function onkeydown(event: KeyboardEvent & { currentTarget: EventTarget & HTMLInputElement }) {
		onkeydownProp?.(event);
		if (event.defaultPrevented) return;

		if (
			event.key === "Backspace" &&
			event.currentTarget.value === "" &&
			root.selectedItems.length > 0
		) {
			event.preventDefault();
			root.removeAt(root.selectedItems.length - 1);
			return;
		}

		if (root.onFieldKeydown(event)) event.preventDefault();
	}

	function onblur(event: FocusEvent & { currentTarget: EventTarget & HTMLInputElement }) {
		onblurProp?.(event);
		if (event.defaultPrevented) return;
		if (!root.open) return;

		const next = event.relatedTarget;
		if (
			next instanceof Node &&
			(root.chipsElement?.contains(next) ||
				root.contentElement?.contains(next) ||
				root.triggerElement?.contains(next))
		) {
			return;
		}

		root.setOpen(false);
	}
</script>

<!--
	`data-*`/`aria-*` first and the behaviour-critical props last, so a caller attribute arriving
	through `..restProps` can neither drop the slot marker nor clobber a handler.
-->
<input
	bind:this={ref}
	type="text"
	data-slot="combobox-chip-input"
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
	class={cn(
		"h-6 min-w-16 flex-1 bg-transparent outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed",
		className,
	)}
	disabled={root.disabled}
	readonly={root.readonly}
	{oninput}
	{onkeydown}
	{onblur}
/>
