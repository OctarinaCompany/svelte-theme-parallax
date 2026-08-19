<script lang="ts" module>
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from "svelte/elements";

	/**
	 * Port of the original implementation.
	 *
	 * Carries a component's value into an ancestor `<form>` without ever being reachable by the
	 * pointer, the tab order or the accessibility tree. It mirrors the `control`'s border box so
	 * native constraint-validation bubbles point at the visible control instead of the page corner.
	 */
	export type AngleSliderHiddenInputProps = Omit<
		HTMLInputAttributes,
		"value" | "checked" | "type"
	> & {
		/** The rendered `<input>`. */
		ref?: HTMLInputElement | null;
		/** Element whose border box the input mirrors. `null` until its owner has mounted. */
		control: HTMLElement | null;
		/** Arrays are `JSON.stringify`d before they reach the DOM node, upstream verbatim. */
		value?: string | string[];
		/** Only read for check-like `type`s (`checkbox`, `radio`, `switch`). */
		checked?: boolean;
		/**
		 * Whether the synthesised `input` / `click` event bubbles.
		 * @default true
		 */
		bubbles?: boolean;
		/** @default 'hidden' */
		type?: HTMLInputTypeAttribute;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		control,
		value,
		checked,
		bubbles = true,
		type = "hidden",
		style,
		...restProps
	}: AngleSliderHiddenInputProps = $props();

	const isCheckInput = $derived(type === "checkbox" || type === "radio" || type === "switch");

	let controlWidth = $state<number | undefined>(undefined);
	let controlHeight = $state<number | undefined>(undefined);

	/** The last value pushed onto the DOM node; deliberately non-reactive. */
	let lastWrittenValue: string | string[] | boolean | undefined = undefined;
	let hasWritten = false;

	$effect(() => {
		if (!control) {
			controlWidth = undefined;
			controlHeight = undefined;
			return;
		}

		controlWidth = control.offsetWidth;
		controlHeight = control.offsetHeight;

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) return;

			const borderSizeEntry = entry.borderBoxSize;
			const borderSize = Array.isArray(borderSizeEntry) ? borderSizeEntry[0] : borderSizeEntry;

			if (borderSize) {
				controlWidth = borderSize.inlineSize;
				controlHeight = borderSize.blockSize;
			} else {
				controlWidth = control.offsetWidth;
				controlHeight = control.offsetHeight;
			}
		});

		observer.observe(control, { box: "border-box" });

		return () => observer.disconnect();
	});

	// Upstream writes through the prototype setter so React's controlled-input bookkeeping is
	// bypassed and form libraries listening for a native `input`/`click` still see the change.
	// Svelte has no such bookkeeping, but the synthesised event is part of the contract.
	$effect(() => {
		const input = ref;
		const currentValue = isCheckInput ? checked : value;

		if (!input) return;

		if (hasWritten && lastWrittenValue === currentValue) return;

		const propertyKey = isCheckInput ? "checked" : "value";
		const eventType = isCheckInput ? "click" : "input";
		const serializedValue =
			isCheckInput || typeof currentValue !== "object" || currentValue === null
				? currentValue
				: JSON.stringify(currentValue);

		const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, propertyKey)?.set;

		lastWrittenValue = currentValue;
		hasWritten = true;

		if (!setter) return;

		setter.call(input, serializedValue);
		input.dispatchEvent(new Event(eventType, { bubbles }));
	});

	// Rendered as an attribute too, so the input already carries the value on the very first paint
	// (and through SSR) rather than only once the effect above has run.
	const serialisedValue = $derived(
		typeof value === "object" && value !== null ? JSON.stringify(value) : value,
	);

	const sizeStyle = $derived(
		controlWidth !== undefined && controlHeight !== undefined
			? `width:${controlWidth}px;height:${controlHeight}px;`
			: "",
	);
</script>

<input
	bind:this={ref}
	{type}
	value={serialisedValue}
	aria-hidden="true"
	tabindex="-1"
	data-slot="angle-slider-hidden-input"
	{...restProps}
	style="{style ??
		''}border:0;clip:rect(0 0 0 0);clip-path:inset(50%);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;white-space:nowrap;width:1px;{sizeStyle}"
/>
