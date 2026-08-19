<script lang="ts" module>
	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLInputAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type EditableInputChildProps = {
		id: string;
		"aria-labelledby": string;
		"aria-required": boolean;
		"aria-invalid": boolean;
		dir: Direction;
		"data-slot": "editable-input";
		disabled: boolean;
		readonly: boolean;
		required: boolean;
		maxlength: number | undefined;
		placeholder: string | undefined;
		value: string;
		class: string;
	} & Record<string, unknown>;

	export type EditableInputProps = WithElementRef<
		Omit<HTMLInputAttributes, "value" | "dir">,
		HTMLInputElement
	> & {
		/** Native character cap. Falls back to the root's `maxLength` (divergence D-2). */
		maxLength?: number;
		/** OR-ed with the root's `disabled`, as upstream does. @default false */
		disabled?: boolean;
		/** OR-ed with the root's `readOnly`. @default false */
		readOnly?: boolean;
		/** OR-ed with the root's `required`. @default false */
		required?: boolean;
		/**
		 * Render the input onto your own element instead of the default `<input>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null` — the caller owns the element, and
		 * with it the focus-and-select-on-edit-start behaviour.
		 */
		child?: Snippet<[{ props: EditableInputChildProps }]>;
	};
</script>

<script lang="ts">
	import { getEditableContext } from "./editable.svelte.js";

	let {
		ref = $bindable(null),
		maxLength,
		disabled,
		readOnly,
		required,
		onblur: onblurProp,
		oninput: oninputProp,
		onkeydown: onkeydownProp,
		class: className,
		child,
		...restProps
	}: EditableInputProps = $props();

	const root = getEditableContext("<Editable.Input>");

	// OR, never a nullish fallback: the root's state is a floor the
	// part cannot opt out of. `readOnly={false}` under a read-only root would otherwise render a
	// writable input whose keystrokes `setText` silently drops, desyncing the DOM from the state.
	const isDisabled = $derived(disabled === true || root.disabled);
	const isReadOnly = $derived(readOnly === true || root.readOnly);
	const isRequired = $derived(required === true || root.required);

	$effect(() => {
		root.inputElement = ref;
		return () => {
			root.inputElement = null;
		};
	});

	/**
	 * Upstream's `useIsomorphicLayoutEffect` + `requestAnimationFrame` + cancel.
	 * The frame is upstream's own and stays: the input is mounted by the very state change that flips
	 * edit mode, and focusing it in the same tick races the browser's handling of the element that
	 * just unmounted.
	 */
	$effect.pre(() => {
		const element = root.inputElement;
		if (!element || !root.editing || isDisabled || isReadOnly) return;

		const frame = requestAnimationFrame(() => {
			element.focus();
			element.select();
			root.autosizeElement(element);
		});

		return () => cancelAnimationFrame(frame);
	});

	// Each handler runs the caller's first and `preventDefault()` suppresses ours, reproducing
	// upstream's `propsRef` + `defaultPrevented` pattern.
	function onblur(event: FocusEvent & { currentTarget: EventTarget & HTMLInputElement }) {
		onblurProp?.(event);
		if (event.defaultPrevented || isDisabled || isReadOnly) return;

		// Focus moving to the trigger, submit, or cancel button must not commit.
		if (!root.isBlurCommitting(event.relatedTarget)) return;

		root.submit(event.currentTarget.value);
	}

	function oninput(event: Event & { currentTarget: EventTarget & HTMLInputElement }) {
		oninputProp?.(event);
		if (event.defaultPrevented) return;

		const target = event.currentTarget;

		// Svelte will not re-render an attribute that did not change, so a keystroke the state rejects
		// has to be pushed back onto the element explicitly — React got this from its re-render.
		if (isDisabled || isReadOnly) {
			target.value = root.value;
			return;
		}

		root.setText(target.value);
		root.autosizeElement(target);
	}

	function onkeydown(event: KeyboardEvent & { currentTarget: EventTarget & HTMLInputElement }) {
		onkeydownProp?.(event);
		if (event.defaultPrevented || isDisabled || isReadOnly) return;

		if (event.key === "Escape") {
			root.onEscapeKeyDown?.(event);
			if (event.defaultPrevented) return;

			event.preventDefault();
			root.cancel();
		} else if (event.key === "Enter") {
			// `preventDefault` is an addition (divergence D-9): inside a `<form>` the un-prevented
			// `Enter` would also trigger implicit native submission, committing the value twice.
			event.preventDefault();
			root.submit(event.currentTarget.value);
		}
	}

	const inputAttrs = $derived({
		"aria-required": isRequired,
		"aria-invalid": root.invalid,
		"data-slot": "editable-input",
		dir: root.dir,
		disabled: isDisabled,
		readonly: isReadOnly,
		required: isRequired,
		...restProps,
		id: root.inputId,
		"aria-labelledby": root.labelId,
		maxlength: maxLength ?? root.maxLength,
		placeholder: root.placeholder,
		value: root.value,
		class: cn(
			"flex rounded-sm border border-input bg-transparent py-1 text-base shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
			root.autosize ? "w-auto" : "w-full",
			className,
		),
		onblur,
		oninput,
		onkeydown,
	} as EditableInputChildProps);
</script>

<!-- Rendered only while editing, or permanently while read-only. -->
{#if root.editing || root.readOnly}
	{#if child}
		{@render child({ props: inputAttrs })}
	{:else}
		<!-- No `children`: an `<input>` is a void element, so there is nothing to render inside it. -->
		<input bind:this={ref} {...inputAttrs} />
	{/if}
{/if}
