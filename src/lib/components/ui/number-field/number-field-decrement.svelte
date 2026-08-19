<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	import type { NumberFieldSize } from "./number-field.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type NumberFieldDecrementChildProps = {
		"data-slot": "number-field-decrement";
		type: "button";
		"aria-label": string;
		disabled: boolean;
		class: string;
	} & Record<string, unknown>;

	export type NumberFieldDecrementProps = WithElementRef<
		HTMLButtonAttributes,
		HTMLButtonElement
	> & {
		/**
		 * The size of this button's padding and icon step. Inherits from the `<NumberField.Root>`
		 * if not specified.
		 */
		size?: NumberFieldSize;
		/**
		 * Render the button onto your own element instead of the default `<button>`. The snippet
		 * receives the merged props to spread onto that element; the default icon is not rendered.
		 */
		child?: Snippet<[{ props: NumberFieldDecrementChildProps }]>;
		/** Replaces the default minus icon. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import MinusIcon from "@lucide/svelte/icons/minus";

	import { getNumberFieldContext, numberFieldButtonVariants } from "./number-field.svelte.js";

	let {
		ref = $bindable(null),
		size: sizeProp,
		disabled,
		onpointerdown,
		onclick,
		class: className,
		child,
		children,
		...restProps
	}: NumberFieldDecrementProps = $props();

	const root = getNumberFieldContext("<NumberField.Decrement>");

	const size = $derived(sizeProp ?? root.size);

	// The button's own `disabled` wins, including an explicit `false` — the same inheritance rule
	// as `segmented-input-item`. The automatic half disables at the min bound, like Base UI does.
	const isDisabled = $derived(disabled ?? !root.canDecrement);

	// The caller's handler runs first, and a `preventDefault()` vetoes ours — the composition
	// contract every enhanced handler in this repo follows.
	function handlePointerdown(event: PointerEvent & { currentTarget: HTMLButtonElement }) {
		onpointerdown?.(event);
		if (event.defaultPrevented || event.button !== 0) return;
		// Default prevented so the button never steals focus from the input mid-edit; the input is
		// focused explicitly instead, which is where Base UI parks focus while spinning.
		event.preventDefault();
		root.inputElement?.focus();
		root.startSpin(-1);
	}

	// Pointer presses are fully handled above (the release lands on `window`, see `startSpin`), so
	// only keyboard activation remains: a keyboard-triggered click reports `detail === 0`.
	function handleClick(event: MouseEvent & { currentTarget: HTMLButtonElement }) {
		onclick?.(event);
		if (event.defaultPrevented || event.detail !== 0) return;
		root.applyStep(-1, root.step);
	}

	// A hold that outlives the button (conditional rendering, navigation) must not keep ticking.
	$effect(() => {
		return () => root.stopSpin();
	});

	// `rounded-s-md` mirrors upstream's per-style start-rounding at
	// this repo's single field radius; upstream's `border-e-0` is dropped because these buttons
	// carry no border class for it to act on.
	const buttonAttrs = $derived({
		"data-slot": "number-field-decrement",
		type: "button",
		"aria-label": "Decrease value",
		...restProps,
		disabled: isDisabled,
		onpointerdown: handlePointerdown,
		onclick: handleClick,
		class: cn(numberFieldButtonVariants({ size }), "rounded-s-md", className),
	} as NumberFieldDecrementChildProps);
</script>

{#if child}
	{@render child({ props: buttonAttrs })}
{:else}
	<button bind:this={ref} {...buttonAttrs}>
		{#if children}
			{@render children()}
		{:else}
			<MinusIcon />
		{/if}
	</button>
{/if}
