<script lang="ts" module>
	import type { Snippet } from "svelte";

	import type { ComboboxMatcher } from "./combobox.svelte.js";

	export type ComboboxRootProps<T = unknown> = {
		/**
		 * The data the list is built from — flat rows, or group-shaped entries (`{ value, items }`)
		 * that `<Combobox.Group items>` unpacks.
		 */
		items?: readonly T[];
		/**
		 * The selection: one item (or `null`) in single mode, an array in `multiple` mode. The items
		 * themselves, not their string forms — `itemToStringValue` only decides how they display and
		 * filter.
		 *
		 * Bindable: `bind:value` lets the combobox move your state, while the function binding
		 * `bind:value={() => value, (next) => …}` keeps you authoritative — a setter that declines
		 * the write leaves the selection exactly where it was.
		 */
		value?: T | readonly T[] | null;
		/** The default selection when uncontrolled. */
		defaultValue?: T | readonly T[] | null;
		/** Called with the next selection: `T | null` in single mode, `readonly T[]` in multiple. */
		onValueChange?: (value: T | readonly T[] | null) => void;
		/** Whether the popup is open. Bindable, on the same terms as `value`. */
		open?: boolean;
		/**
		 * The default open state.
		 *
		 * @default false
		 */
		defaultOpen?: boolean;
		/** Called on every open/close transition. */
		onOpenChange?: (open: boolean) => void;
		/**
		 * Whether the combobox holds a set of items rather than one.
		 *
		 * @default false
		 */
		multiple?: boolean;
		/**
		 * How an item's string form is matched against the search text.
		 *
		 * `null` turns filtering off entirely, for the case where `items` is already the answer.
		 * Anything else replaces the default matcher.
		 *
		 * @default a locale-aware `contains` (see `createFilter`)
		 */
		filter?: ComboboxMatcher | null;
		/**
		 * Turns one entry of `items` into the string it filters and displays as.
		 *
		 * @default a string is itself; an object answers with `value`, then `label`
		 */
		itemToStringValue?: (item: T) => string;
		/**
		 * Whether an item and a selected value are the same entry — Base UI's `isItemEqualToValue`,
		 * which the member and label demos supply when two different records can share a label.
		 *
		 * @default comparison of the two string forms (`itemToStringValue`)
		 */
		isItemEqualToValue?: (item: T, value: T) => boolean;
		/**
		 * Whether the whole combobox is disabled.
		 *
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Whether the combobox is read-only: it can be focused and read, but nothing is typed,
		 * selected or cleared.
		 *
		 * @default false
		 */
		readonly?: boolean;
		/**
		 * Whether the first match is highlighted as you type.
		 *
		 * Off by default, and deliberately so: with nothing highlighted, `Enter` submits the form
		 * rather than silently accepting whichever suggestion sorted first.
		 *
		 * @default false
		 */
		autoHighlight?: boolean;
		/**
		 * Whether arrow navigation wraps around the ends of the list.
		 *
		 * @default false
		 */
		loop?: boolean;
		/** The name of the field for form submission; without it no form value is rendered. */
		name?: string;
		/**
		 * Whether the field is required in a form context.
		 *
		 * @default false
		 */
		required?: boolean;
		/** Unique identifier for the combobox; every part's id derives from it. */
		id?: string;
		/** The parts: a field or trigger, and the portalled content. */
		children?: Snippet;
	};

	/** Parity alias of {@link ComboboxRootProps}. */
	export type ComboboxProps<T = unknown> = ComboboxRootProps<T>;
</script>

<script lang="ts" generics="T = unknown">
	import { Popover as PopoverPrimitive } from "bits-ui";
	import { untrack } from "svelte";

	import { ComboboxRootState, setComboboxContext } from "./combobox.svelte.js";

	/**
	 * The container for every part — Base
	 * UI's `Combobox.Root` re-exported untouched, so the props here are Base UI's.
	 *
	 * It renders no element of its own — upstream's Root is a context provider, and the demos put
	 * their own wrapper around the field. The popup finds its anchor through the root state (field,
	 * chips container or trigger), so there is nothing for a DOM node here to do.
	 */

	let {
		items = [],
		value = $bindable(),
		defaultValue,
		onValueChange,
		open = $bindable(),
		defaultOpen = false,
		onOpenChange,
		multiple = false,
		filter,
		itemToStringValue,
		isItemEqualToValue,
		disabled = false,
		readonly = false,
		autoHighlight = false,
		loop = false,
		name,
		required = false,
		id,
		children,
	}: ComboboxRootProps<T> = $props();

	// Uncontrolled: seed once from the defaults. Controlled: the caller's binding wins, and a
	// binding that declines the write keeps the rendered state where it was. The seeds are one-shot
	// initialisations, so they are read through `untrack` — reading them bare would capture only
	// their initial value while looking like a reactive read.
	value ??= untrack(() => defaultValue ?? (multiple ? [] : null));
	open ??= untrack(() => defaultOpen);

	const uid = $props.id();
	const rootId = untrack(() => id) ?? uid;

	const root = setComboboxContext(
		new ComboboxRootState({
			getItems: () => items,
			getMultiple: () => multiple,
			getValue: () => value,
			setValue: (next) => {
				value = next as T | readonly T[] | null;
				onValueChange?.(value);
			},
			getOpen: () => open ?? false,
			setOpen: (next) => {
				open = next;
				onOpenChange?.(next);
			},
			getFilter: () => filter,
			getItemToStringValue: () => itemToStringValue as ((item: never) => string) | undefined,
			getIsItemEqualToValue: () =>
				isItemEqualToValue as ((item: never, value: never) => boolean) | undefined,
			getDisabled: () => disabled,
			getReadonly: () => readonly,
			getAutoHighlight: () => autoHighlight,
			getLoop: () => loop,
			id: rootId,
		}),
	);

	// Every deferred write in the state class checks this first, so an unmount mid-interaction
	// cannot leave a `tick()` continuation reading a derived whose effect is already gone.
	$effect(() => () => root.destroy());
</script>

<PopoverPrimitive.Root bind:open={() => root.open, (next) => root.setOpen(next)}>
	{@render children?.()}
</PopoverPrimitive.Root>

{#if name}
	<!--
		A clipped `type="text"` input rather than `type="hidden"`, matching `<Autocomplete.Root>`:
		`type="hidden"` is barred from constraint validation, which would let a `required` combobox
		submit empty. One input per selected entry in multiple mode, the way a multi-`<select>`
		serialises — except when the selection is empty *and* `required`, where a single empty input
		stands in so the constraint still fires; a non-required empty combobox keeps submitting no
		entry, again like a multi-`<select>`.
	-->
	{#if multiple}
		{#if root.selectedStringValues.length === 0}
			{#if required}
				<input
					type="text"
					data-slot="combobox-form-input"
					aria-hidden="true"
					tabindex={-1}
					{name}
					value=""
					{disabled}
					required
					{readonly}
					style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; white-space: nowrap; border: 0; clip-path: inset(50%);"
				/>
			{/if}
		{:else}
			{#each root.selectedStringValues as stringValue, index (index)}
				<input
					type="text"
					data-slot="combobox-form-input"
					aria-hidden="true"
					tabindex={-1}
					{name}
					value={stringValue}
					{disabled}
					required={required && index === 0}
					{readonly}
					style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; white-space: nowrap; border: 0; clip-path: inset(50%);"
				/>
			{/each}
		{/if}
	{:else}
		<input
			type="text"
			data-slot="combobox-form-input"
			aria-hidden="true"
			tabindex={-1}
			{name}
			value={root.selectedText}
			{disabled}
			{required}
			{readonly}
			style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; white-space: nowrap; border: 0; clip-path: inset(50%);"
		/>
	{/if}
{/if}
