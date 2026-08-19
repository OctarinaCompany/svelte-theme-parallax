<script lang="ts" module>
	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { TagsInputBlurBehavior } from "./tags-input.svelte.js";

	export type TagsInputRootProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, "dir">,
		HTMLDivElement
	> & {
		/**
		 * Controlled array of tag values.
		 *
		 * Bindable: `bind:value={tricks}` lets the tags input move your state, while the function
		 * binding `bind:value={() => tricks, (next) => …}` keeps you authoritative — a setter that
		 * declines the write leaves the rendered tags exactly where they were.
		 */
		value?: string[];
		/**
		 * Initial array of tag values when uncontrolled.
		 *
		 * @default []
		 */
		defaultValue?: string[];
		/** Callback function to handle changes in the tag values. */
		onValueChange?: (value: string[]) => void;
		/** Callback function to validate tags before they're added. */
		onValidate?: (value: string) => boolean;
		/** Callback function to handle invalid input. */
		onInvalid?: (value: string) => void;
		/**
		 * Function to convert a tag value to its display string representation. Render-only — the value
		 * itself is never transformed by it.
		 *
		 * @default (value) => value.toString()
		 */
		displayValue?: (value: string) => string;
		/**
		 * Enable adding tags by pasting text, which will be split by the delimiter.
		 *
		 * @default false
		 */
		addOnPaste?: boolean;
		/**
		 * Enable adding tags when Tab key is pressed.
		 *
		 * @default false
		 */
		addOnTab?: boolean;
		/**
		 * Disables the entire tags input.
		 *
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Allow editing of existing tags.
		 *
		 * @default false
		 */
		editable?: boolean;
		/**
		 * Enable wrapping focus from last to first tag and vice versa.
		 *
		 * @default false
		 */
		loop?: boolean;
		/**
		 * Behavior when the input loses focus.
		 * - `"add"`: Add the current input value as a new tag.
		 * - `"clear"`: Reset the input field, removing its value.
		 *
		 * By default, the input value will stay in the input field.
		 */
		blurBehavior?: TagsInputBlurBehavior;
		/**
		 * Character used to split pasted text into multiple tags. Typing it also commits the tag.
		 *
		 * @default ","
		 */
		delimiter?: string;
		/**
		 * Maximum number of tags allowed.
		 *
		 * @default Number.POSITIVE_INFINITY
		 */
		max?: number;
		/**
		 * Whether the field is required in a form context.
		 *
		 * @default false
		 */
		required?: boolean;
		/**
		 * Whether the tags input is read-only.
		 *
		 * @default false
		 */
		readOnly?: boolean;
		/** Name of the form field when used in a form. */
		name?: string;
		/**
		 * The reading direction of the tags input.
		 *
		 * @default the nearest `<DirectionProvider>`, else the DOM `[dir]`, else "ltr"
		 */
		dir?: Direction;
		/** Unique identifier for the tags input; every part's id derives from it. */
		id?: string;
		/** The content of the tags input. */
		children?: Snippet;
	};

	/** Upstream-parity alias of {@link TagsInputRootProps}. */
	export type TagsInputProps = TagsInputRootProps;
</script>

<script lang="ts">
	import { useDirection } from "$lib/components/ui/direction-provider/index.js";
	import { FormControlState } from "$lib/shared/form-control.svelte.js";
	import { untrack } from "svelte";

	import { setTagsInputContext, TagsInputRootState } from "./tags-input.svelte.js";

	let {
		ref = $bindable(null),
		value = $bindable(),
		defaultValue = [],
		onValueChange,
		onValidate,
		onInvalid,
		displayValue = (value: string) => value.toString(),
		addOnPaste = false,
		addOnTab = false,
		disabled = false,
		editable = false,
		loop = false,
		blurBehavior,
		delimiter = ",",
		max = Number.POSITIVE_INFINITY,
		required = false,
		readOnly = false,
		name,
		dir,
		id,
		onclick: onclickProp,
		onmousedown: onmousedownProp,
		onfocusout: onfocusoutProp,
		class: className,
		children,
		...restProps
	}: TagsInputRootProps = $props();

	// Uncontrolled: seed once from `defaultValue`. Controlled: the caller's binding wins, and a
	// binding that declines the write keeps the rendered tags where they were. The
	// seed is a one-shot initialisation, so `defaultValue` is read through `untrack` — reading it bare
	// here would capture only its initial value while looking like a reactive read.
	value ??= untrack(() => defaultValue);

	const direction = useDirection({ dir: () => dir, element: () => ref });

	const uid = $props.id();

	const rootState = setTagsInputContext(
		new TagsInputRootState({
			getValue: () => value ?? [],
			setValue: (next) => {
				value = next;
				onValueChange?.(next);
			},
			getOnValidate: () => onValidate,
			getOnInvalid: () => onInvalid,
			getDisplayValue: () => displayValue,
			getAddOnPaste: () => addOnPaste,
			getAddOnTab: () => addOnTab,
			getDisabled: () => disabled,
			getEditable: () => editable,
			getLoop: () => loop,
			getReadOnly: () => readOnly,
			getBlurBehavior: () => blurBehavior,
			getDelimiter: () => delimiter,
			getMax: () => max,
			getDir: () => direction.current,
			// One-shot, like every other id in the repo: `untrack` says so rather than looking like a
			// reactive read that only ever captures the initial value.
			id: untrack(() => id) ?? uid,
		}),
	);

	const formControl = new FormControlState({ getElement: () => ref });

	let formInput = $state<HTMLInputElement | null>(null);

	/** The comma-joined list React produces when upstream hands the array to `VisuallyHiddenInput`. */
	const formValue = $derived((value ?? []).join(","));

	/**
	 * The last value handed to the form. Deliberately not reactive: Svelte has already written the
	 * `value` attribute by the time the effect runs, so the element itself cannot say whether the
	 * value moved, and a form library listening on the form needs the native event upstream's
	 * `VisuallyHiddenInput` dispatches through the native setter.
	 */
	let dispatchedValue = untrack(() => formValue);

	$effect(() => {
		const element = formInput;
		const next = formValue;
		if (!element || next === dispatchedValue) return;

		dispatchedValue = next;
		element.value = next;
		element.dispatchEvent(new Event("input", { bubbles: true }));
	});

	/**
	 * Upstream `getIsClickedInEmptyRoot`. `DATA_ITEM_ATTR` has no
	 * counterpart here, so the per-part `data-slot` marker stands in; `closest` rather than
	 * `hasAttribute` additionally covers a press landing on the item's text span.
	 */
	function isClickedInEmptyRoot(target: HTMLElement): boolean {
		return !target.closest('[data-slot="tags-input-item"]') && target.tagName !== "INPUT";
	}

	// Each handler runs the caller's first and `preventDefault()` suppresses ours, reproducing
	// upstream's `composeEventHandlers`.
	function onclick(event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onclickProp?.(event);
		if (event.defaultPrevented) return;

		const target = event.target;
		if (!(target instanceof HTMLElement)) return;

		if (isClickedInEmptyRoot(target) && document.activeElement !== rootState.inputElement) {
			rootState.inputElement?.focus();
		}
	}

	function onmousedown(event: MouseEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onmousedownProp?.(event);
		if (event.defaultPrevented) return;

		const target = event.target;
		if (!(target instanceof HTMLElement)) return;

		// Prevent the root from stealing focus from the input.
		if (isClickedInEmptyRoot(target)) event.preventDefault();
	}

	/**
	 * Upstream's `onBlur`. React's `onBlur` *is* the bubbling `focusout`, which is what carries a
	 * blur from the text input up to the root — the native, non-bubbling `blur` never reaches here.
	 * The `requestAnimationFrame` is upstream's and stays: it lets focus settle on its new target
	 * rather than waiting for a render.
	 */
	function onfocusout(event: FocusEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onfocusoutProp?.(event);
		if (event.defaultPrevented) return;

		const related = event.relatedTarget;
		if (related === rootState.inputElement) return;
		if (related instanceof Node && ref?.contains(related)) return;

		requestAnimationFrame(() => {
			rootState.highlightedIndex = null;
		});
	}
</script>

<div
	bind:this={ref}
	id={id ?? uid}
	data-slot="tags-input"
	data-disabled={disabled ? "" : undefined}
	data-invalid={rootState.isInvalidInput ? "" : undefined}
	data-readonly={readOnly ? "" : undefined}
	dir={rootState.dir}
	{...restProps}
	class={cn("flex w-full flex-col gap-2", className)}
	{onclick}
	{onmousedown}
	{onfocusout}
>
	{@render children?.()}

	<!--
		Removals are announced here: `aria-activedescendant` can only name a tag that still exists
		(divergence D-9). Clipped the same way as the form input below.
	-->
	<span
		aria-live="polite"
		data-slot="tags-input-announcement"
		style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; white-space: nowrap; border: 0; clip-path: inset(50%);"
	>
		{rootState.announcement}
	</span>
</div>

{#if formControl.isFormControl}
	<!--
		A clipped `type="text"` input rather than upstream's `type="hidden"` (divergence D-7):
		`type="hidden"` is barred from constraint validation, which would make a `required` tags input
		with no tags submit happily. Same pattern as `checkbox-group-item.svelte`.

		A `<form>` ancestor is the only condition — gating on `name` too would put a `required` tags
		input that submits by other means outside constraint validation entirely. `name` is simply
		omitted when unset, which is what the shorthand below already does with `undefined`.
	-->
	<input
		bind:this={formInput}
		type="text"
		data-slot="tags-input-form-input"
		aria-hidden="true"
		tabindex={-1}
		{name}
		value={formValue}
		{disabled}
		{required}
		readonly={readOnly}
		style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; white-space: nowrap; border: 0; clip-path: inset(50%);"
	/>
{/if}
