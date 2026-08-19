<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	export type CheckboxGroupItemProps = WithElementRef<
		Omit<HTMLButtonAttributes, "value" | "type" | "disabled" | "name">,
		HTMLButtonElement
	> & {
		/** Value of the checkbox. */
		value: string;
		/**
		 * Whether the checkbox is disabled. A disabled group disables every item.
		 *
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Whether this checkbox in particular must be checked for the form to be valid.
		 *
		 * @default false
		 */
		required?: boolean;
		/** Field name for this item's hidden input; overrides the group's `name`. */
		name?: string;
		/**
		 * Rendered inside the checkbox box.
		 *
		 * @default a `<CheckboxGroup.Indicator />`
		 */
		indicator?: Snippet;
		/** The item's visible label — rendered inside the button, so it is the accessible name. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import CheckboxGroupIndicator from "./checkbox-group-indicator.svelte";
	import {
		CheckboxGroupItemState,
		getCheckboxGroupContext,
		setCheckboxGroupItemContext,
	} from "./checkbox-group.svelte.js";
	import { FormControlState } from "$lib/shared/form-control.svelte.js";

	let {
		ref = $bindable(null),
		value,
		disabled = false,
		required = false,
		name,
		indicator,
		onclick: onclickProp,
		onkeydown: onkeydownProp,
		class: className,
		children,
		...restProps
	}: CheckboxGroupItemProps = $props();

	const root = getCheckboxGroupContext("<CheckboxGroup.Item>");

	const item = setCheckboxGroupItemContext(
		new CheckboxGroupItemState({
			root,
			getValue: () => value,
			getDisabled: () => disabled,
			getRequired: () => required,
			getName: () => name,
		}),
	);

	const formControl = new FormControlState({ getElement: () => item.element });

	const itemId = $props.id();

	let input = $state<HTMLInputElement | null>(null);

	$effect(() => {
		item.element = ref;
		return () => {
			item.element = null;
		};
	});

	// The reset baseline is kept equal to the current state so the native reset is a no-op on the
	// input and the group's own `reset()` — which runs from the `reset` listener below, before the
	// browser resets any control — is the single source of the restored value.
	$effect(() => {
		if (!input) return;
		input.defaultChecked = item.checked;
	});

	$effect(() => {
		const form = formControl.form;
		if (!form) return;

		const onReset = () => root.reset();
		form.addEventListener("reset", onReset);
		return () => form.removeEventListener("reset", onReset);
	});

	/**
	 * The caller's handler runs first and `preventDefault()` suppresses ours, reproducing upstream's
	 * `composeEventHandlers`. Upstream additionally drops any click within 50 ms of
	 * the last one to swallow a duplicate produced by React's synthetic delegation; in Svelte this is
	 * a single native listener on the `<button>`, so a click on the indicator bubbles here exactly
	 * once and the window would only ever swallow a genuine second toggle.
	 */
	function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onclickProp?.(event);
		if (event.defaultPrevented) return;

		item.toggle();
	}

	function onkeydown(event: KeyboardEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
		onkeydownProp?.(event);
		if (event.defaultPrevented) return;

		// Checkbox group items toggle on Space only — Enter must neither toggle nor submit a form.
		if (event.key === "Enter") event.preventDefault();
	}
</script>

<button
	bind:this={ref}
	type="button"
	role="checkbox"
	data-slot="checkbox-group-item"
	id={itemId}
	aria-checked={item.checked}
	aria-disabled={item.disabled}
	aria-invalid={root.isInvalid}
	aria-required={item.required}
	disabled={item.disabled}
	data-state={item.dataState}
	data-orientation={root.orientation}
	data-disabled={item.disabled ? "" : undefined}
	data-invalid={root.isInvalid ? "" : undefined}
	{...restProps}
	class={cn(
		"flex w-fit items-center gap-2 rounded-sm text-sm leading-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-hidden data-invalid:text-destructive data-disabled:cursor-not-allowed data-disabled:opacity-50",
		className,
	)}
	{onclick}
	{onkeydown}
>
	<span
		data-slot="checkbox-group-item-box"
		data-state={item.dataState}
		data-disabled={item.disabled ? "" : undefined}
		data-invalid={root.isInvalid ? "" : undefined}
		class="flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input data-invalid:border-destructive data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:data-invalid:bg-destructive data-[state=checked]:data-invalid:text-primary-foreground data-[state=unchecked]:data-invalid:bg-transparent dark:bg-input/30 dark:data-[state=checked]:bg-primary dark:data-[state=checked]:data-invalid:bg-destructive"
	>
		{#if indicator}
			{@render indicator()}
		{:else}
			<CheckboxGroupIndicator />
		{/if}
	</span>
	{@render children?.()}
</button>

<input
	bind:this={input}
	type="checkbox"
	data-slot="checkbox-group-item-input"
	aria-hidden="true"
	tabindex={-1}
	name={item.name}
	{value}
	checked={item.checked}
	disabled={item.disabled}
	required={item.required}
	readonly={root.readOnly}
	hidden={!formControl.isFormControl}
	style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; white-space: nowrap; border: 0; clip-path: inset(50%);"
/>
