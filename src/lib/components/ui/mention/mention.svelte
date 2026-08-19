<script lang="ts" module>
	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	export type MentionRootProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, "dir">,
		HTMLDivElement
	> & {
		/**
		 * The currently selected values.
		 *
		 * Bindable: `bind:value` lets the mention move your state, while the function binding
		 * `bind:value={() => value, (next) => …}` keeps you authoritative — a setter that declines the
		 * write leaves the rendered text and the value list exactly where they were.
		 */
		value?: string[];
		/** The default selected value when uncontrolled. */
		defaultValue?: string[];
		/** Event handler called when a mention item is selected or removed. */
		onValueChange?: (value: string[]) => void;
		/** Whether the mention menu is open. Bindable, on the same terms as `value`. */
		open?: boolean;
		/**
		 * The default open state.
		 *
		 * @default false
		 */
		defaultOpen?: boolean;
		/** Event handler called when the open state changes. */
		onOpenChange?: (open: boolean) => void;
		/** The current input value. Bindable, on the same terms as `value`. */
		inputValue?: string;
		/** Event handler called when the input value changes. */
		onInputValueChange?: (value: string) => void;
		/**
		 * The character that activates the mention menu when typed at a word boundary.
		 *
		 * @default "@"
		 */
		trigger?: string;
		/**
		 * The direction the mention should open.
		 *
		 * @default the nearest `<DirectionProvider>`, else the DOM `[dir]`, else "ltr"
		 */
		dir?: Direction;
		/**
		 * Whether the mention is disabled.
		 *
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Event handler called when the filter is applied.
		 * Can be used to prevent the default filtering behavior.
		 */
		onFilter?: (options: string[], term: string) => string[];
		/**
		 * Whether the mention uses exact string matching or fuzzy matching.
		 * When `onFilter` is provided, this prop is ignored.
		 *
		 * @default false
		 */
		exactMatch?: boolean;
		/**
		 * Whether the mention loops through items.
		 *
		 * @default false
		 */
		loop?: boolean;
		/**
		 * Whether the mention is modal — locks page scroll while open, blocks outside pointer
		 * interaction, and makes `Tab` select the highlighted item instead of closing.
		 *
		 * @default false
		 */
		modal?: boolean;
		/**
		 * Whether the mention is read-only: an open popup can still be viewed, but nothing is
		 * inserted or removed. Spelled as upstream spells it.
		 *
		 * @default false
		 */
		readonly?: boolean;
		/**
		 * Whether the mention is required in a form context.
		 *
		 * @default false
		 */
		required?: boolean;
		/** The name of the mention for form submission. */
		name?: string;
		/** Unique identifier for the mention; every part's id derives from it. */
		id?: string;
		/** The parts: a label, the input, and the portalled content. */
		children?: Snippet;
	};

	/** Upstream-parity alias of {@link MentionRootProps}. */
	export type MentionProps = MentionRootProps;
</script>

<script lang="ts">
	import { useDirection } from "$lib/components/ui/direction-provider/index.js";
	import { FormControlState } from "$lib/shared/form-control.svelte.js";
	import { Popover as PopoverPrimitive } from "bits-ui";
	import { untrack } from "svelte";

	import { MentionRootState, setMentionContext } from "./mention.svelte.js";

	let {
		ref = $bindable(null),
		value = $bindable(),
		defaultValue,
		onValueChange,
		open = $bindable(),
		defaultOpen = false,
		onOpenChange,
		inputValue = $bindable(),
		onInputValueChange,
		trigger = "@",
		dir,
		disabled = false,
		onFilter,
		exactMatch = false,
		loop = false,
		modal = false,
		readonly = false,
		required = false,
		name,
		id,
		class: className,
		children,
		...restProps
	}: MentionRootProps = $props();

	// Uncontrolled: seed once from the defaults. Controlled: the caller's binding wins, and a binding
	// that declines the write keeps the rendered state where it was. The seeds are one-shot
	// initialisations, so they are read through `untrack` — reading them bare would capture only their
	// initial value while looking like a reactive read.
	value ??= untrack(() => defaultValue ?? []);
	open ??= untrack(() => defaultOpen);
	inputValue ??= untrack(() => "");

	const direction = useDirection({ dir: () => dir, element: () => ref });

	const uid = $props.id();
	const rootId = untrack(() => id) ?? uid;

	const root = setMentionContext(
		new MentionRootState({
			getValues: () => value ?? [],
			setValues: (next) => {
				value = next;
				onValueChange?.(next);
			},
			getOpen: () => open ?? false,
			setOpen: (next) => {
				open = next;
				onOpenChange?.(next);
			},
			getInputValue: () => inputValue ?? "",
			setInputValue: (next) => {
				inputValue = next;
				onInputValueChange?.(next);
			},
			getTrigger: () => trigger,
			getOnFilter: () => onFilter,
			getDisabled: () => disabled,
			getReadonly: () => readonly,
			getExactMatch: () => exactMatch,
			getLoop: () => loop,
			getModal: () => modal,
			getDir: () => direction.current,
			id: rootId,
		}),
	);

	// Every deferred write in the state class checks this first, so an unmount mid-interaction cannot
	// leave a `tick()` continuation reading a derived whose effect is already gone.
	$effect(() => () => root.destroy());

	const formControl = new FormControlState({ getElement: () => ref });

	let formInput = $state<HTMLInputElement | null>(null);

	/** The comma-joined list React produces when upstream hands the value to `VisuallyHiddenInput`. */
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
</script>

<PopoverPrimitive.Root bind:open={() => root.open, (next) => root.setOpen(next)}>
	<div
		bind:this={ref}
		id={rootId}
		data-slot="mention"
		data-state={root.dataState}
		data-disabled={disabled ? "" : undefined}
		{...restProps}
		class={cn("flex w-full flex-col gap-2", className)}
	>
		{@render children?.()}
	</div>
</PopoverPrimitive.Root>

{#if formControl.isFormControl && name}
	<!--
		A clipped `type="text"` input rather than upstream's `type="hidden"` (divergence D-6):
		`type="hidden"` is barred from constraint validation, which would make a `required` mention with
		no selection submit happily. Same pattern as `combobox` and `tags-input`.
	-->
	<input
		bind:this={formInput}
		type="text"
		data-slot="mention-form-input"
		aria-hidden="true"
		tabindex={-1}
		{name}
		value={formValue}
		{disabled}
		{required}
		{readonly}
		style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; white-space: nowrap; border: 0; clip-path: inset(50%);"
	/>
{/if}
