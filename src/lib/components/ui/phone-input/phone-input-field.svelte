<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { FormEventHandler, HTMLInputAttributes } from "svelte/elements";

	/** A DOM event whose `currentTarget` is known to be the phone `<input>`. */
	export type PhoneInputFieldEvent = Event & { currentTarget: EventTarget & HTMLInputElement };

	export type PhoneInputFieldProps = WithElementRef<
		Omit<HTMLInputAttributes, "value" | "type" | "readonly" | "files">,
		HTMLInputElement
	> & {
		/**
		 * Whether the field is disabled. OR-ed with the root's own `disabled`.
		 *
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Whether the field is read-only. OR-ed with the root's own `readOnly`.
		 *
		 * @default false
		 */
		readOnly?: boolean;
		/**
		 * Whether the field is required. OR-ed with the root's own `required`.
		 *
		 * @default false
		 */
		required?: boolean;
		/**
		 * Called before the field normalises the typed text — upstream's `onChange`. Calling
		 * `preventDefault()` discards the edit and snaps the displayed value back.
		 */
		oninput?: FormEventHandler<HTMLInputElement> | null;
	};
</script>

<script lang="ts">
	import { Input } from "$lib/components/ui/input/index.js";

	import { getPhoneInputContext } from "./phone-input.svelte.js";

	let {
		ref = $bindable(null),
		disabled = false,
		readOnly = false,
		required = false,
		oninput: oninputProp,
		class: className,
		...restProps
	}: PhoneInputFieldProps = $props();

	const root = getPhoneInputContext("<PhoneInput.Field>");

	const isDisabled = $derived(disabled || root.disabled);
	const isReadOnly = $derived(readOnly || root.readOnly);
	const isRequired = $derived(required || root.required);

	/**
	 * Bumped by every edit. React re-renders a controlled input and snaps the DOM back after every
	 * keystroke, including one that produces an identical formatted string (typing `a` into
	 * `+1 408`); Svelte only patches the attribute when the derived value actually *changes*, so
	 * without a generation counter a rejected character would linger in the DOM.
	 */
	let syncGeneration = $state(0);

	const pendingSync = $derived([syncGeneration, root.displayValue] as const);

	// DOM-only: this effect writes `element.value` and never any reactive state, which is why it is
	// an effect and not a `$derived`. No caret arithmetic — upstream performs none either.
	$effect(() => {
		const [, next] = pendingSync;
		const element = ref;
		if (element && element.value !== next) element.value = next;
	});

	$effect(() => {
		root.fieldElement = ref;
		return () => {
			root.fieldElement = null;
		};
	});

	function handleInput(event: PhoneInputFieldEvent) {
		syncGeneration++;

		if (isDisabled || isReadOnly) return;

		oninputProp?.(event);
		if (event.defaultPrevented) return;

		root.setValueFromInput(event.currentTarget.value);
	}
</script>

<!--
	The owned attributes are emitted *before* `restProps` (so a caller can override them) and the
	class, placeholder, value and handler *after* it (so a caller cannot), reproducing upstream's JSX
	order exactly. `value` is one-way — never `bind:value`, which would make a second
	writer fight the snap-back above.
-->
<Input
	bind:ref
	type="tel"
	inputmode="tel"
	aria-required={isRequired}
	aria-invalid={root.invalid}
	data-slot="phone-input-field"
	disabled={isDisabled}
	readonly={isReadOnly}
	required={isRequired}
	{...restProps}
	class={cn(
		"h-full flex-1 rounded-s-none rounded-e-lg border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 disabled:bg-transparent aria-invalid:ring-0 dark:bg-transparent dark:disabled:bg-transparent",
		className,
	)}
	placeholder={root.placeholder}
	value={root.displayValue}
	oninput={handleInput}
/>
