<script lang="ts" module>
	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { KeyValueItemData } from "./key-value.svelte.js";

	export type KeyValueRootProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, "dir" | "onpaste">,
		HTMLDivElement
	> & {
		/**
		 * The controlled list of rows.
		 *
		 * Bindable: `bind:value={rows}` lets the list move your state, while the function binding
		 * `bind:value={() => rows, (next) => …}` keeps you authoritative — a setter that declines the
		 * write leaves the rendered rows exactly where they were.
		 */
		value?: KeyValueItemData[];
		/**
		 * The initial rows when uncontrolled. An explicit `[]` is honoured as zero rows.
		 *
		 * @default one empty row
		 */
		defaultValue?: KeyValueItemData[];
		/** Called whenever the list of rows changes. */
		onValueChange?: (value: KeyValueItemData[]) => void;
		/** Called once per intercepted multi-line paste, with the event and the parsed rows. */
		onPaste?: (event: ClipboardEvent, items: KeyValueItemData[]) => void;
		/** Called with the newly appended row whenever a row is added. */
		onAdd?: (value: KeyValueItemData) => void;
		/** Called with the removed row whenever a row is removed. */
		onRemove?: (value: KeyValueItemData) => void;
		/** Validates a row's key on every edit; the returned message marks that key invalid. */
		onKeyValidate?: (key: string, value: KeyValueItemData[]) => string | undefined;
		/** Validates a row's value on every edit; the returned message marks that value invalid. */
		onValueValidate?: (value: string, key: string, items: KeyValueItemData[]) => string | undefined;
		/** Maximum number of rows. Unset means no upper bound. */
		maxItems?: number;
		/**
		 * Minimum number of rows; removal is refused at this count.
		 *
		 * @default 0
		 */
		minItems?: number;
		/**
		 * Placeholder of every key field.
		 *
		 * @default "Key"
		 */
		keyPlaceholder?: string;
		/**
		 * Placeholder of every value field.
		 *
		 * @default "Value"
		 */
		valuePlaceholder?: string;
		/**
		 * Whether two rows may hold the same non-empty key. Empty keys never collide.
		 *
		 * @default false
		 */
		allowDuplicateKeys?: boolean;
		/**
		 * Whether multi-line clipboard text pasted into a key field expands into one row per line.
		 *
		 * @default true
		 */
		enablePaste?: boolean;
		/**
		 * Whether keys and values have their surrounding whitespace removed as they are written.
		 *
		 * @default true
		 */
		trim?: boolean;
		/**
		 * Whether a parsed value wrapped in matching `"` or `'` has those quotes removed.
		 *
		 * @default true
		 */
		stripQuotes?: boolean;
		/**
		 * Whether every interaction on every part is suppressed.
		 *
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Whether the rows are displayed but no add, remove, edit or paste is possible.
		 *
		 * @default false
		 */
		readOnly?: boolean;
		/**
		 * Whether the fields, and the submitted form control, are required.
		 *
		 * @default false
		 */
		required?: boolean;
		/** Name of the form field when used in a form; the value is submitted as JSON. */
		name?: string;
		/**
		 * The reading direction of the list.
		 *
		 * @default the nearest `<DirectionProvider>`, else the DOM `[dir]`, else "ltr"
		 */
		dir?: Direction;
		/** Unique identifier for the list; every error id derives from it. */
		id?: string;
		/** The list and the add control. */
		children?: Snippet;
	};

	/** Upstream-parity alias of {@link KeyValueRootProps}. */
	export type KeyValueProps = KeyValueRootProps;
</script>

<script lang="ts">
	import { useDirection } from "$lib/components/ui/direction-provider/index.js";
	import { FormControlState } from "$lib/shared/form-control.svelte.js";
	import { untrack } from "svelte";

	import {
		createKeyValueItemId,
		KeyValueRootState,
		setKeyValueContext,
	} from "./key-value.svelte.js";

	let {
		ref = $bindable(null),
		value = $bindable(),
		defaultValue,
		onValueChange,
		onPaste,
		onAdd,
		onRemove,
		onKeyValidate,
		onValueValidate,
		maxItems,
		minItems = 0,
		keyPlaceholder = "Key",
		valuePlaceholder = "Value",
		allowDuplicateKeys = false,
		enablePaste = true,
		trim = true,
		stripQuotes = true,
		disabled = false,
		readOnly = false,
		required = false,
		name,
		dir,
		id,
		class: className,
		children,
		...restProps
	}: KeyValueRootProps = $props();

	// Uncontrolled: seed once from `defaultValue`, falling back to the single empty row upstream
	// seeds — an explicit `defaultValue={[]}` is honoured as zero rows and
	// is never re-seeded. Controlled: the caller's binding wins, and a binding that declines the
	// write keeps the rendered rows where they were. The seed is a one-shot initialisation, so it is
	// read through `untrack` — reading it bare here would capture only its initial value while
	// looking like a reactive read.
	//
	// Written as an `if` rather than `value ??= …`: Svelte compiles a compound assignment on a
	// `$bindable` prop into an unconditional write through the binding, which would hand a
	// controlled parent its own value back — and fire `onValueChange` — on every mount.
	if (value === undefined) {
		value = untrack(() => defaultValue ?? [{ id: createKeyValueItemId(), key: "", value: "" }]);
	}

	const direction = useDirection({ dir: () => dir, element: () => ref });

	const uid = $props.id();

	const rootState = setKeyValueContext(
		new KeyValueRootState({
			getValue: () => value ?? [],
			setValue: (next) => {
				value = next;
				onValueChange?.(next);
			},
			getOnPaste: () => onPaste,
			getOnAdd: () => onAdd,
			getOnRemove: () => onRemove,
			getOnKeyValidate: () => onKeyValidate,
			getOnValueValidate: () => onValueValidate,
			getMaxItems: () => maxItems,
			getMinItems: () => minItems,
			getKeyPlaceholder: () => keyPlaceholder,
			getValuePlaceholder: () => valuePlaceholder,
			getAllowDuplicateKeys: () => allowDuplicateKeys,
			getEnablePaste: () => enablePaste,
			getTrim: () => trim,
			getStripQuotes: () => stripQuotes,
			getDisabled: () => disabled,
			getReadOnly: () => readOnly,
			getRequired: () => required,
			getDir: () => direction.current,
			// One-shot, like every other id in the repo: `untrack` says so rather than looking like a
			// reactive read that only ever captures the initial value.
			rootId: untrack(() => id) ?? uid,
		}),
	);

	const formControl = new FormControlState({ getElement: () => ref });

	let formInput = $state<HTMLInputElement | null>(null);

	/**
	 * JSON rather than upstream's raw array (divergence D-7): React serialises an `ItemData[]` to
	 * `"[object Object],[object Object]"`, which cannot round-trip. An empty list serialises to the
	 * empty string rather than `"[]"`, so the input's `required` can actually block a zero-row
	 * submit — a visible empty row already blocks by itself through the fields' own `required`.
	 */
	const formValue = $derived((value ?? []).length === 0 ? "" : JSON.stringify(value));

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
</script>

<div
	bind:this={ref}
	id={id ?? uid}
	data-slot="key-value"
	data-disabled={disabled ? "" : undefined}
	data-invalid={rootState.isInvalid ? "" : undefined}
	data-readonly={readOnly ? "" : undefined}
	dir={rootState.dir}
	{...restProps}
	class={cn("flex flex-col gap-2", className)}
>
	{@render children?.()}
</div>

{#if formControl.isFormControl}
	<!--
		A clipped `type="text"` input rather than upstream's `type="hidden"`:
		`type="hidden"` is barred from constraint validation, which would make a `required` list with
		no rows submit happily. Same pattern as `tags-input` and `editable`.
	-->
	<input
		bind:this={formInput}
		type="text"
		data-slot="key-value-form-input"
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
