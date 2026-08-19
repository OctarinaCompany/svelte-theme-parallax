<script lang="ts" module>
	import type { Snippet } from "svelte";

	import type { AutocompleteMatcher } from "./autocomplete.svelte.js";

	export type AutocompleteRootProps<T = unknown> = {
		/**
		 * The data the list is built from. Whatever shape it has, `itemToStringValue` turns one entry
		 * into the string the field takes when it is selected.
		 */
		items?: readonly T[];
		/**
		 * The field text — not the selected item. Free text the list never offered is a legitimate
		 * value, which is the whole difference between an autocomplete and a select.
		 *
		 * Bindable: `bind:value` lets the autocomplete move your state, while the function binding
		 * `bind:value={() => value, (next) => …}` keeps you authoritative — a setter that declines the
		 * write leaves the field exactly where it was.
		 */
		value?: string;
		/** The default field text when uncontrolled. */
		defaultValue?: string;
		/** Called with the next field text, on typing, selection and clearing alike. */
		onValueChange?: (value: string) => void;
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
		 * How an item's string form is matched against the field text.
		 *
		 * `null` turns filtering off entirely, for the case where `items` is already the answer — an
		 * async search, or a list grouped ahead of time. Anything else replaces the default matcher.
		 *
		 * @default a locale-aware `contains` (see `createFilter`)
		 */
		filter?: AutocompleteMatcher | null;
		/**
		 * Turns one entry of `items` into the string the field takes.
		 *
		 * @default a string is itself; an object answers with `value`, then `label`
		 */
		itemToStringValue?: (item: T) => string;
		/**
		 * Whether the field is disabled.
		 *
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Whether the field is read-only: it can be focused and read, but nothing is typed, selected
		 * or cleared.
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
		/** Unique identifier for the autocomplete; every part's id derives from it. */
		id?: string;
		/** The parts: a field, and the portalled content. */
		children?: Snippet;
	};

	/** Parity alias of {@link AutocompleteRootProps}. */
	export type AutocompleteProps<T = unknown> = AutocompleteRootProps<T>;
</script>

<script lang="ts" generics="T = unknown">
	import { Popover as PopoverPrimitive } from "bits-ui";
	import { untrack } from "svelte";

	import { AutocompleteRootState, setAutocompleteContext } from "./autocomplete.svelte.js";

	/**
	 * The container for every part, ported from the gallery's `Autocomplete` — Base UI's
	 * `Autocomplete.Root` under a shadcn skin.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. The field takes `app.css`'s `[data-slot='input']` treatment and the
	 * popup takes `--popover` and the radius scale, like every other menu in the theme.
	 *
	 * It renders no element of its own — upstream's Root is a context provider, and the demos put
	 * their own wrapper around the field. The popup is anchored to the input through `customAnchor`
	 * rather than to a wrapper, so there is nothing for a DOM node here to do.
	 */

	let {
		items = [],
		value = $bindable(),
		defaultValue,
		onValueChange,
		open = $bindable(),
		defaultOpen = false,
		onOpenChange,
		filter,
		itemToStringValue,
		disabled = false,
		readonly = false,
		autoHighlight = false,
		loop = false,
		name,
		required = false,
		id,
		children,
	}: AutocompleteRootProps<T> = $props();

	// Uncontrolled: seed once from the defaults. Controlled: the caller's binding wins, and a binding
	// that declines the write keeps the rendered state where it was. The seeds are one-shot
	// initialisations, so they are read through `untrack` — reading them bare would capture only their
	// initial value while looking like a reactive read.
	value ??= untrack(() => defaultValue ?? "");
	open ??= untrack(() => defaultOpen);

	const uid = $props.id();
	const rootId = untrack(() => id) ?? uid;

	const root = setAutocompleteContext(
		new AutocompleteRootState({
			getItems: () => items,
			getValue: () => value ?? "",
			setValue: (next) => {
				value = next;
				onValueChange?.(next);
			},
			getOpen: () => open ?? false,
			setOpen: (next) => {
				open = next;
				onOpenChange?.(next);
			},
			getFilter: () => filter,
			getItemToStringValue: () => itemToStringValue as ((item: never) => string) | undefined,
			getDisabled: () => disabled,
			getReadonly: () => readonly,
			getAutoHighlight: () => autoHighlight,
			getLoop: () => loop,
			id: rootId,
		}),
	);

	// Every deferred write in the state class checks this first, so an unmount mid-interaction cannot
	// leave a `tick()` continuation reading a derived whose effect is already gone.
	$effect(() => () => root.destroy());
</script>

<PopoverPrimitive.Root bind:open={() => root.open, (next) => root.setOpen(next)}>
	{@render children?.()}
</PopoverPrimitive.Root>

{#if name}
	<!--
		A clipped `type="text"` input rather than `type="hidden"`, matching `<Mention.Root>`:
		`type="hidden"` is barred from constraint validation, which would let a `required`
		autocomplete submit empty.
	-->
	<input
		type="text"
		data-slot="autocomplete-form-input"
		aria-hidden="true"
		tabindex={-1}
		{name}
		value={value ?? ""}
		{disabled}
		{required}
		{readonly}
		style="position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; white-space: nowrap; border: 0; clip-path: inset(50%);"
	/>
{/if}
