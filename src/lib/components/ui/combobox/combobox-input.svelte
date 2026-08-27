<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { HTMLInputAttributes } from "svelte/elements";

	import { cn, type WithElementRef } from "$lib/utils.js";

	export type ComboboxInputProps = WithElementRef<
		Omit<HTMLInputAttributes, "size" | "value" | "type" | "files">,
		HTMLInputElement
	> & {
		/**
		 * Whether the chevron trigger is rendered at the field's end. Upstream hides it when the
		 * input lives inside the popup, where the trigger is a standalone button.
		 *
		 * @default true
		 */
		showTrigger?: boolean;
		/**
		 * Whether a clear button is rendered once there is something to clear. While it shows, the
		 * trigger hides — the two share the field's corner.
		 *
		 * @default false
		 */
		showClear?: boolean;
		/** Extra `<InputGroup.Addon>`s, rendered inside the group like upstream's `children`. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";

	import {
		InputGroup,
		InputGroupAddon,
		InputGroupButton,
		InputGroupInput,
	} from "$lib/components/ui/input-group/index.js";

	import ComboboxClear from "./combobox-clear.svelte";
	import ComboboxTrigger from "./combobox-trigger.svelte";
	import { getComboboxContext, hasComboboxContentMarker } from "./combobox.svelte.js";

	/**
	 * The field: an `InputGroup` wrapping the primitive input, with the
	 * trigger and clear buttons in an inline-end addon — the exact upstream composition, on this
	 * repository's `input-group` (whose in-popup compensations already expect to sit inside a
	 * `[data-slot=combobox-content]`).
	 *
	 * The field text is controlled by the root — the user's query while typing, the committed
	 * selection otherwise — through the same element-level sync `<Autocomplete.Input>` uses: the
	 * browser has already painted the keystroke by the time the state decides, so the two only ever
	 * need reconciling in one direction.
	 */

	let {
		ref = $bindable(null),
		showTrigger = true,
		showClear = false,
		disabled = false,
		class: className,
		oninput: oninputProp,
		onkeydown: onkeydownProp,
		onblur: onblurProp,
		children,
		...restProps
	}: ComboboxInputProps = $props();

	const root = getComboboxContext("<Combobox.Input>");

	/**
	 * Whether this field sits inside the popup — the select-shaped compositions. Read once at
	 * setup: context does not move after mount.
	 */
	const insideContent = hasComboboxContentMarker();

	/** The group element — everything a click may land on and keep the popup open. */
	let wrapper = $state<HTMLDivElement | null>(null);

	const isDisabled = $derived(disabled || root.disabled);

	$effect(() => {
		root.inputElement = ref;
		root.inputInsideContent = insideContent && ref !== null;
		return () => {
			if (root.inputElement === ref) {
				root.inputElement = null;
				if (insideContent) root.inputInsideContent = false;
			}
		};
	});

	// Inside the popup the field mounts on open, after the trigger's click — Base UI moves focus
	// into it so typing starts immediately, and so does this theme.
	$effect(() => {
		if (insideContent && root.open) ref?.focus({ preventScroll: true });
	});

	/**
	 * Push the state's text back into the DOM. The field is controlled by
	 * `root.inputDisplayValue`; selection and clearing change it without any input event, and this
	 * is what repaints the field when they do.
	 */
	$effect(() => {
		const element = ref;
		const next = root.inputDisplayValue;
		if (element && element.value !== next) element.value = next;
	});

	// Each handler runs the caller's first and `preventDefault()` suppresses ours, the same
	// composition every other part in this repository uses.
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

		if (root.onFieldKeydown(event)) event.preventDefault();
	}

	/**
	 * Focus left the field. `bits-ui`'s dismissible layer closes on a pointer press *outside*,
	 * which is not the same question: tabbing away, or clicking straight into a second combobox,
	 * moves focus without ever pressing outside this popup. The exceptions are the widget's own
	 * surfaces — the group (trigger and clear included), the popup, the chips container and a
	 * standalone trigger.
	 */
	function onblur(event: FocusEvent & { currentTarget: EventTarget & HTMLInputElement }) {
		onblurProp?.(event);
		if (event.defaultPrevented) return;
		if (!root.open) return;

		const next = event.relatedTarget;
		if (
			next instanceof Node &&
			(wrapper?.contains(next) ||
				root.contentElement?.contains(next) ||
				root.chipsElement?.contains(next) ||
				root.triggerElement?.contains(next))
		) {
			return;
		}

		root.setOpen(false);
	}
</script>

<InputGroup bind:ref={wrapper} class={cn("w-auto", className)}>
	<!--
		`data-*`/`aria-*` first and the behaviour-critical props last, so a caller attribute arriving
		through `..restProps` can neither drop a marker nor clobber a handler.
	-->
	<InputGroupInput
		bind:ref
		type="text"
		data-state={root.dataState}
		data-disabled={isDisabled ? "" : undefined}
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
		disabled={isDisabled}
		readonly={root.readonly}
		{oninput}
		{onkeydown}
		{onblur}
	/>
	<InputGroupAddon align="inline-end">
		{#if showTrigger}
			<!--
				Upstream wraps the trigger in `InputGroupButton asChild`; here the
				trigger's `child` snippet is the same inversion. The `group-has-…` class is upstream's
				mechanism for ceding the corner to the clear button.

				The name is supplied here rather than defaulted inside the trigger: this is the one
				composition that knows the button holds a chevron and nothing else. A standalone trigger
				is named by the content its own `child` snippet renders.
			-->
			<ComboboxTrigger aria-label="Show options">
				{#snippet child({ props })}
					<InputGroupButton
						size="icon-xs"
						variant="ghost"
						tabindex={-1}
						{...props}
						disabled={(props.disabled as boolean) || isDisabled}
						class={cn(
							"group-has-data-[slot=combobox-clear]/input-group:hidden",
							props.class as string,
						)}
					>
						<ChevronDownIcon class="pointer-events-none text-muted-foreground" />
					</InputGroupButton>
				{/snippet}
			</ComboboxTrigger>
		{/if}
		{#if showClear}
			<ComboboxClear disabled={isDisabled} />
		{/if}
	</InputGroupAddon>
	{@render children?.()}
</InputGroup>
