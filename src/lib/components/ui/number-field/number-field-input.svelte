<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLInputAttributes } from "svelte/elements";

	import type { NumberFieldSize } from "./number-field.svelte.js";

	/**
	 * The merged attribute payload handed to the `child` snippet. The `Record<string, unknown>`
	 * tail carries `restProps` and the `createAttachmentKey()` entry that publishes the element to
	 * the root — spread it onto a real `<input>` and the wheel handler and button re-focus keep
	 * working (the precedent `scroller` set for attachment-in-spread).
	 */
	export type NumberFieldInputChildProps = {
		"data-slot": "number-field-input";
		id: string;
		type: "text";
		value: string;
		inputmode: "decimal";
		autocomplete: "off";
		spellcheck: false;
		"aria-roledescription": "Number field";
		"aria-invalid": true | undefined;
		disabled: true | undefined;
		readonly: true | undefined;
		required: true | undefined;
		class: string;
	} & Record<string, unknown>;

	export type NumberFieldInputProps = WithElementRef<
		Omit<HTMLInputAttributes, "type" | "value" | "size" | "id">,
		HTMLInputElement
	> & {
		/**
		 * The size of this input's padding step. Inherits from the `<NumberField.Root>` if not
		 * specified.
		 */
		size?: NumberFieldSize;
		/**
		 * Render the input onto your own element instead of the default `<input>`. The snippet
		 * receives the merged props to spread onto that element.
		 */
		child?: Snippet<[{ props: NumberFieldInputChildProps }]>;
	};
</script>

<script lang="ts">
	import { createAttachmentKey } from "svelte/attachments";

	import { getNumberFieldContext, numberFieldInputVariants } from "./number-field.svelte.js";

	let {
		ref = $bindable(null),
		size: sizeProp,
		oninput,
		onkeydown,
		onblur,
		class: className,
		child,
		...restProps
	}: NumberFieldInputProps = $props();

	const root = getNumberFieldContext("<NumberField.Input>");

	const size = $derived(sizeProp ?? root.size);

	// The committed value's formatted text is pushed into the visible input whenever the value,
	// locale or format moves — a button press, a wheel notch, an external `bind:value` write. It
	// never fires while the user merely types, because typing changes `root.text` without moving
	// the committed value; the round-trip back to formatted text happens on commit (blur/Enter).
	$effect(() => {
		root.setText(root.formattedValue);
	});

	// An attachment rather than a `ref`-gated `$effect`, so the element registration travels with
	// the spread props into `child` mode (the `segmented-input-item` precedent). The root needs
	// the element for two things: the spinner buttons re-focus it, and the wheel listener below
	// hangs off it.
	const attach = createAttachmentKey();

	function registerInput(element: Element) {
		if (!(element instanceof HTMLInputElement)) return;
		root.inputElement = element;
		return () => {
			if (root.inputElement === element) root.inputElement = null;
		};
	}

	// Svelte 5 registers `onwheel` as passive, which forbids the `preventDefault()` a wheel-scrub
	// needs to stop the page from scrolling — so the listener is attached manually, non-passive.
	// Base UI scopes wheel changes to the focused input; same guard here.
	$effect(() => {
		const element = root.inputElement;
		if (!element || !root.allowWheelScrub) return;

		function handleWheel(event: WheelEvent) {
			if (document.activeElement !== element || event.deltaY === 0) return;
			event.preventDefault();
			root.applyStep(event.deltaY < 0 ? 1 : -1, root.step);
		}

		element.addEventListener("wheel", handleWheel, { passive: false });
		return () => element.removeEventListener("wheel", handleWheel);
	});

	// `..restProps` spread after an attribute overwrites it, so the caller's handlers are
	// composed explicitly instead: theirs runs first, and a `preventDefault()` vetoes ours.
	function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
		oninput?.(event);
		root.setText(event.currentTarget.value);
	}

	// The keyboard map Base UI's number field implements
	// (https://base-ui.com/react/components/number-field): arrows step, `Shift` upgrades to the
	// large step and `Alt` downgrades to the small one, `PageUp`/`PageDown` always take the large
	// step, `Home`/`End` jump to the bounds, `Enter` commits the typed text.
	function handleKeydown(event: KeyboardEvent & { currentTarget: HTMLInputElement }) {
		onkeydown?.(event);
		if (event.defaultPrevented) return;

		const arrowStep = event.shiftKey ? root.largeStep : event.altKey ? root.smallStep : root.step;

		switch (event.key) {
			case "ArrowUp":
				event.preventDefault();
				root.applyStep(1, arrowStep);
				break;
			case "ArrowDown":
				event.preventDefault();
				root.applyStep(-1, arrowStep);
				break;
			case "PageUp":
				event.preventDefault();
				root.applyStep(1, root.largeStep);
				break;
			case "PageDown":
				event.preventDefault();
				root.applyStep(-1, root.largeStep);
				break;
			case "Home":
				if (root.min !== undefined) {
					event.preventDefault();
					root.jumpTo(root.min);
				}
				break;
			case "End":
				if (root.max !== undefined) {
					event.preventDefault();
					root.jumpTo(root.max);
				}
				break;
			case "Enter":
				root.commit();
				break;
		}
	}

	function handleBlur(event: FocusEvent & { currentTarget: HTMLInputElement }) {
		onblur?.(event);
		root.commit();
	}

	// No `role="spinbutton"`: like Base UI, the control stays a plain text input (free-form typing
	// of formatted text) and announces itself through `aria-roledescription` instead.
	const inputAttrs = $derived({
		"data-slot": "number-field-input",
		id: root.inputId,
		type: "text",
		inputmode: "decimal",
		autocomplete: "off",
		spellcheck: false,
		"aria-roledescription": "Number field",
		"aria-invalid": root.invalid ? true : undefined,
		disabled: root.disabled ? true : undefined,
		readonly: root.readOnly ? true : undefined,
		required: root.required ? true : undefined,
		...restProps,
		value: root.text,
		oninput: handleInput,
		onkeydown: handleKeydown,
		onblur: handleBlur,
		[attach]: registerInput,
		class: cn(numberFieldInputVariants({ size }), className),
	} as NumberFieldInputChildProps);
</script>

{#if child}
	{@render child({ props: inputAttrs })}
{:else}
	<input bind:this={ref} {...inputAttrs} />
{/if}
