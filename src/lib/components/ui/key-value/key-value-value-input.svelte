<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLTextareaAttributes } from "svelte/elements";

	export type KeyValueValueInputProps = WithElementRef<
		Omit<HTMLTextareaAttributes, "value" | "rows" | "dir">,
		HTMLTextAreaElement
	> & {
		/** Visible lines after which the field stops growing and scrolls instead. */
		maxRows?: number;
		/** OR-ed with the root's `disabled`. @default false */
		disabled?: boolean;
		/** OR-ed with the root's `readOnly`. @default false */
		readOnly?: boolean;
		/** OR-ed with the root's `required`. @default false */
		required?: boolean;
		/** Overrides the root's `valuePlaceholder` for this field. */
		placeholder?: string;
	};
</script>

<script lang="ts">
	import * as Editable from "$lib/components/ui/editable/index.js";

	import { getKeyValueItemContext } from "./key-value.svelte.js";

	let {
		ref = $bindable(null),
		maxRows,
		disabled,
		readOnly,
		required,
		placeholder,
		onblur: onblurProp,
		oninput: oninputProp,
		onkeydown: onkeydownProp,
		class: className,
		style,
		...restProps
	}: KeyValueValueInputProps = $props();

	const item = getKeyValueItemContext("<KeyValue.ValueInput>");
	const root = item.root;

	// OR, never a nullish fallback.
	const isDisabled = $derived(disabled === true || root.disabled);
	const isReadOnly = $derived(readOnly === true || root.readOnly);
	const isRequired = $derived(required === true || root.required);
	const isInvalid = $derived(item.valueError !== undefined);

	/** Upstream's `maxHeight`. */
	const maxHeight = $derived(
		maxRows === undefined ? undefined : `max-height: calc(${maxRows} * 1.5em + 1rem)`,
	);
	const controlStyle = $derived([style, maxHeight].filter(Boolean).join("; ") || undefined);

	/** This field's edit mode; the value field is never a focus-request target. */
	let editing = $state(false);

	/**
	 * `child` mode hands `ref` — "and with it the focus-and-select-on-edit-start behaviour" — back to
	 * the caller (`editable-input.svelte:38-44`), and the textarea only ever mounts while editing, so
	 * a mount-time frame is the whole replacement. The frame is `editable`'s own: the
	 * element is mounted by the very state change that flips edit mode, and focusing it in the same
	 * tick races the browser's handling of the preview that just unmounted.
	 */
	$effect(() => {
		const element = ref;
		if (!element || isDisabled || isReadOnly) return;

		const frame = requestAnimationFrame(() => {
			element.focus();
			element.select();
		});

		return () => cancelAnimationFrame(frame);
	});

	/**
	 * `EditableInputChildProps` ends with `editable`'s own `onblur`/`oninput`/`onkeydown`
	 * (`editable-input.svelte:148-169`), which the `{...props}` spread below applies *after*
	 * `{...restProps}` — so a caller handler left in `restProps` would be overwritten and never run.
	 * They go to `<Editable.Input>` instead, which invokes the caller's first and honours
	 * `preventDefault()`, the same ordering upstream gets from `propsRef.current.onChange?.(event)`.
	 * The key field needs none of this: it hands `restProps` straight to
	 * `<Editable.Input>`, which destructures the three handlers out before merging.
	 *
	 * Each signature widens to the bare event, because `Editable.Input` types its handlers against the
	 * `<input>` it renders by default while in `child` mode the element is the `<textarea>` below —
	 * so the caller's textarea-typed handler is the accurate one (`key-value-remove.svelte` precedent).
	 */
	function onblur(event: FocusEvent) {
		(onblurProp as unknown as ((event: FocusEvent) => void) | undefined)?.(event);
	}

	function oninput(event: Event) {
		(oninputProp as unknown as ((event: Event) => void) | undefined)?.(event);
	}

	function onkeydown(event: KeyboardEvent) {
		(onkeydownProp as unknown as ((event: KeyboardEvent) => void) | undefined)?.(event);
	}

	function setValue(next: string) {
		root.setField(item.id, "value", next);

		// The state can refuse part of a write — with `trim` on, a keystroke that only adds trailing
		// whitespace stores the value it already held — and Svelte will not re-render an attribute
		// that did not change, so the stored value is pushed back onto the control explicitly.
		if (ref && ref.value !== item.value) ref.value = item.value;
	}
</script>

{#snippet control({ props }: { props: Editable.EditableInputChildProps })}
	<!--
		A `<textarea>` through `Editable.Input`'s `child` snippet, because `Editable.Input` renders an
		`<input>` and this part needs a growing, optionally scrollable multi-line field.
		`Enter` submits rather than inserting a newline — `editable`'s binding, and what the upstream
		MDX keyboard table documents (divergence D-2).
	-->
	<textarea
		bind:this={ref}
		{...{
			autocapitalize: "off",
			autocomplete: "off",
			autocorrect: "off",
			spellcheck: "false",
			...restProps,
			...props,
			"data-slot": "key-value-value-input-control",
			"aria-describedby": isInvalid ? root.errorId(item.id, "value") : undefined,
			class: cn(
				"field-sizing-content min-h-9 resize-none",
				maxRows !== undefined && "overflow-y-auto",
				props.class,
			),
			style: controlStyle,
		}}></textarea>
{/snippet}

<!-- `class="contents"` and `triggerMode="focus"` for the same reasons as the key field. -->
<Editable.Root
	bind:value={() => item.value, setValue}
	bind:editing
	triggerMode="focus"
	disabled={isDisabled}
	readOnly={isReadOnly}
	required={isRequired}
	invalid={isInvalid}
	placeholder={placeholder ?? root.valuePlaceholder}
	dir={root.dir}
	class="contents"
>
	<Editable.Area data-slot="key-value-value-input" class={cn("min-w-0 flex-1", className)}>
		<Editable.Preview
			data-slot="key-value-value-input-preview"
			aria-invalid={isInvalid}
			aria-describedby={isInvalid ? root.errorId(item.id, "value") : undefined}
			class="w-full"
		/>
		<Editable.Input {onblur} {oninput} {onkeydown} child={control} />
	</Editable.Area>
</Editable.Root>
