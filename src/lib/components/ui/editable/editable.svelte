<script lang="ts" module>
	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { EditableTriggerMode } from "./editable.svelte.js";

	export type EditableRootProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, "dir">,
		HTMLDivElement
	> & {
		/**
		 * The controlled text value.
		 *
		 * Bindable: `bind:value={title}` lets the field move your state, while the function binding
		 * `bind:value={() => title, (next) => …}` keeps you authoritative — a setter that declines the
		 * write leaves the rendered value exactly where it was.
		 */
		value?: string;
		/**
		 * The initial text value when uncontrolled. Also the value the first cancel reverts to.
		 *
		 * @default ""
		 */
		defaultValue?: string;
		/** Called whenever the value changes — never for a write that did not move it. */
		onValueChange?: (value: string) => void;
		/**
		 * Whether the field is in edit mode.
		 *
		 * Bindable, with the same three usages as {@linkcode value}.
		 */
		editing?: boolean;
		/**
		 * Whether the field starts in edit mode when uncontrolled.
		 *
		 * @default false
		 */
		defaultEditing?: boolean;
		/** Called whenever edit mode changes — never for a write that did not move it. */
		onEditingChange?: (editing: boolean) => void;
		/** Called after edit mode is entered and the restore-on-cancel value is captured. */
		onEdit?: () => void;
		/**
		 * Called on `Enter` in the input, on the submit button, and on a committing blur. Fires even
		 * when the submitted value is unchanged.
		 */
		onSubmit?: (value: string) => void;
		/** Called after the value has been reverted and edit mode left. */
		onCancel?: () => void;
		/**
		 * Called before the preview's built-in `Enter` → edit mode. Calling `preventDefault()` on the
		 * event suppresses it.
		 */
		onEnterKeyDown?: (event: KeyboardEvent) => void;
		/**
		 * Called before the input's built-in `Escape` → cancel. Calling `preventDefault()` on the
		 * event suppresses it.
		 */
		onEscapeKeyDown?: (event: KeyboardEvent) => void;
		/**
		 * Which preview interaction enters edit mode.
		 *
		 * @default "click"
		 */
		triggerMode?: EditableTriggerMode;
		/**
		 * Whether the input grows to fit its content.
		 *
		 * @default false
		 */
		autosize?: boolean;
		/** Native character cap applied to the input; the input's own `maxLength` wins over it. */
		maxLength?: number;
		/** Shown by the preview while the value is empty, and as the input's native placeholder. */
		placeholder?: string;
		/** Name of the form field when used in a form. */
		name?: string;
		/**
		 * Whether every interaction on every part is suppressed.
		 *
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Whether the input is permanently rendered and inert. The preview and the trigger never
		 * render while it is set.
		 *
		 * @default false
		 */
		readOnly?: boolean;
		/**
		 * Whether the field is required in a form context.
		 *
		 * @default false
		 */
		required?: boolean;
		/**
		 * Whether the field is invalid.
		 *
		 * @default false
		 */
		invalid?: boolean;
		/**
		 * The reading direction of the field.
		 *
		 * @default the nearest `<DirectionProvider>`, else the DOM `[dir]`, else "ltr"
		 */
		dir?: Direction;
		/** Unique identifier for the field; the input, label and `aria-controls` ids derive from it. */
		id?: string;
		/**
		 * Render the root onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` is not rendered and `ref` stays `null` — the caller owns the element.
		 */
		child?: Snippet<
			[{ props: HTMLAttributes<HTMLDivElement> & { "data-slot": "editable"; id: string } }]
		>;
		/** The composed parts. */
		children?: Snippet;
	};

	/** Upstream-parity alias of {@link EditableRootProps}. */
	export type EditableProps = EditableRootProps;
</script>

<script lang="ts">
	import { useDirection } from "$lib/components/ui/direction-provider/index.js";
	import { FormControlState } from "$lib/shared/form-control.svelte.js";
	import { untrack } from "svelte";

	import { EditableRootState, setEditableContext } from "./editable.svelte.js";

	let {
		ref = $bindable(null),
		value = $bindable(),
		defaultValue = "",
		onValueChange,
		editing = $bindable(),
		defaultEditing = false,
		onEditingChange,
		onEdit,
		onSubmit,
		onCancel,
		onEnterKeyDown,
		onEscapeKeyDown,
		triggerMode = "click",
		autosize = false,
		maxLength,
		placeholder,
		name,
		disabled = false,
		readOnly = false,
		required = false,
		invalid = false,
		dir,
		id,
		class: className,
		child,
		children,
		...restProps
	}: EditableRootProps = $props();

	// Uncontrolled: seed once from `defaultValue` / `defaultEditing`. Controlled: the caller's binding
	// wins, and a binding that declines the write keeps the rendered field where it was. Both seeds
	// are one-shot initialisations, so the defaults are read through `untrack` — reading them bare
	// here would capture only their initial value while looking like reactive reads.
	value ??= untrack(() => defaultValue);
	editing ??= untrack(() => defaultEditing);

	const direction = useDirection({ dir: () => dir, element: () => ref });

	const uid = $props.id();

	setEditableContext(
		new EditableRootState({
			getValue: () => value ?? "",
			setValue: (next) => {
				// Upstream's `Object.is` short-circuit: the callback is a change
				// notification, so submitting an unchanged value must not fire it.
				if (Object.is(value ?? "", next)) return;
				value = next;
				onValueChange?.(next);
			},
			getEditing: () => editing ?? false,
			setEditing: (next) => {
				if (Object.is(editing ?? false, next)) return;
				editing = next;
				onEditingChange?.(next);
			},
			getOnEdit: () => onEdit,
			getOnSubmit: () => onSubmit,
			getOnCancel: () => onCancel,
			getOnEnterKeyDown: () => onEnterKeyDown,
			getOnEscapeKeyDown: () => onEscapeKeyDown,
			getTriggerMode: () => triggerMode,
			getAutosize: () => autosize,
			getMaxLength: () => maxLength,
			getPlaceholder: () => placeholder,
			getDisabled: () => disabled,
			getReadOnly: () => readOnly,
			getRequired: () => required,
			getInvalid: () => invalid,
			getDir: () => direction.current,
			// One-shot, like every other id in the repo: `untrack` says so rather than looking like a
			// reactive read that only ever captures the initial value.
			id: untrack(() => id) ?? uid,
		}),
	);

	const formControl = new FormControlState({ getElement: () => ref });

	let formInput = $state<HTMLInputElement | null>(null);

	/**
	 * The last value handed to the form. Deliberately not reactive: Svelte has already written the
	 * `value` attribute by the time the effect runs, so the element itself cannot say whether the
	 * value moved, and a form library listening on the form needs the native event upstream's
	 * `VisuallyHiddenInput` dispatches through the native setter.
	 */
	let dispatchedValue = untrack(() => value ?? "");

	$effect(() => {
		const element = formInput;
		const next = value ?? "";
		if (!element || next === dispatchedValue) return;

		dispatchedValue = next;
		element.value = next;
		element.dispatchEvent(new Event("input", { bubbles: true }));
	});

	// `id` is rendered unconditionally, unlike upstream, so the `aria-controls` of the trigger,
	// toolbar, cancel and submit parts always resolve to a real element (divergence D-3).
	const rootAttrs = $derived({
		"data-slot": "editable",
		...restProps,
		id: id ?? uid,
		class: cn("flex min-w-0 flex-col gap-2", className),
	} as HTMLAttributes<HTMLDivElement> & { "data-slot": "editable"; id: string });
</script>

{#if child}
	{@render child({ props: rootAttrs })}
{:else}
	<div bind:this={ref} {...rootAttrs}>
		{@render children?.()}
	</div>
{/if}

{#if formControl.isFormControl}
	<!--
		A clipped `type="text"` input rather than upstream's `type="hidden"` (divergence D-5):
		`type="hidden"` is barred from constraint validation, which would make a `required` field with
		no value submit happily. Same pattern as `tags-input` and `checkbox-group-item`.
	-->
	<input
		bind:this={formInput}
		type="text"
		data-slot="editable-form-input"
		aria-hidden="true"
		tabindex={-1}
		{name}
		value={value ?? ""}
		{disabled}
		{required}
		readonly={readOnly}
		style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; white-space: nowrap; border: 0; clip-path: inset(50%);"
	/>
{/if}
