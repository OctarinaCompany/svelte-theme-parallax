<script lang="ts" module>
	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { Attachment } from "svelte/attachments";
	import type { HTMLAttributes } from "svelte/elements";

	import type { ColorFormat } from "./color.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type ColorPickerChildProps = {
		"data-slot": "color-picker";
		"data-disabled": "" | undefined;
		"data-readonly": "" | undefined;
		"data-inline": "" | undefined;
		class: string;
		// The symbol slot carries the attachment that hands the rendered element back to the root,
		// which is how the `<form>` detection behind the hidden input keeps working in `child` mode.
	} & Record<string, unknown> &
		Record<symbol, Attachment<HTMLElement>>;

	export type ColorPickerRootProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, "dir">,
		HTMLDivElement
	> & {
		/**
		 * The current colour, as a CSS string in the active `format`.
		 *
		 * Bindable: `bind:value` lets the picker move your state, while the function binding
		 * `bind:value={() => value, (next) => …}` keeps you authoritative — a setter that declines the
		 * write leaves the displayed colour exactly where it was.
		 */
		value?: string;
		/**
		 * The colour to start from when uncontrolled. Seeded once; `value` wins afterwards.
		 *
		 * @default "#000000"
		 */
		defaultValue?: string;
		/**
		 * Callback fired on every colour change, in both controlled and uncontrolled modes, with the
		 * colour rendered in the active format. Never fires for a `format` or `open` change.
		 */
		onValueChange?: (value: string) => void;
		/**
		 * Whether the popover is open. Ignored entirely when `inline`.
		 *
		 * Bindable, on the same terms as `value`.
		 */
		open?: boolean;
		/**
		 * The open state to start from when uncontrolled.
		 *
		 * @default false
		 */
		defaultOpen?: boolean;
		/** Callback fired whenever the popover opens or closes. */
		onOpenChange?: (open: boolean) => void;
		/**
		 * Whether the open popover traps focus and locks scrolling behind it.
		 *
		 * @default false
		 */
		modal?: boolean;
		/**
		 * The notation the colour is displayed and edited in. Changing it never changes the colour.
		 *
		 * Bindable, on the same terms as `value`.
		 */
		format?: ColorFormat;
		/**
		 * The format to start from when uncontrolled.
		 *
		 * @default "hex"
		 */
		defaultFormat?: ColorFormat;
		/** Callback fired whenever the display format changes. */
		onFormatChange?: (format: ColorFormat) => void;
		/**
		 * The reading direction. Horizontal arrow keys and the area's pointer mapping invert under
		 * `"rtl"`.
		 *
		 * @default the nearest `<DirectionProvider>`, else the DOM `[dir]`, else "ltr"
		 */
		dir?: Direction;
		/**
		 * Render the parts directly in the page with no popover, portal or overlay behaviour at all.
		 *
		 * @default false
		 */
		inline?: boolean;
		/** The name of the hidden input rendered inside a `<form>`. It always submits `#rrggbb`. */
		name?: string;
		/**
		 * Whether the picker is disabled. Inherited by every part.
		 *
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Whether the picker is read-only. Every part stays focusable, but no colour mutation lands.
		 *
		 * @default false
		 */
		readOnly?: boolean;
		/**
		 * Whether the picker is required. Mirrored onto the hidden input.
		 *
		 * @default false
		 */
		required?: boolean;
		/** The parts — trigger, content, area, sliders, swatch, eyedropper, format select and input. */
		children?: Snippet;
		/**
		 * Render the picker onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `ref` stays `null`; the props carry an attachment that hands the element back instead,
		 * so spreading them keeps the `<form>` detection behind the hidden input working.
		 */
		child?: Snippet<[{ props: ColorPickerChildProps }]>;
	};

	/** Upstream-parity alias of {@link ColorPickerRootProps}. */
	export type ColorPickerProps = ColorPickerRootProps;
</script>

<script lang="ts">
	import { useDirection } from "$lib/components/ui/direction-provider/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import { FormControlState } from "$lib/shared/form-control.svelte.js";
	import { untrack } from "svelte";
	import { createAttachmentKey } from "svelte/attachments";

	import { ColorPickerRootState, setColorPickerContext } from "./color-picker.svelte.js";

	let {
		ref = $bindable(null),
		value = $bindable(),
		defaultValue = "#000000",
		onValueChange,
		open = $bindable(),
		defaultOpen = false,
		onOpenChange,
		modal = false,
		format = $bindable(),
		defaultFormat = "hex",
		onFormatChange,
		dir,
		inline = false,
		name,
		disabled = false,
		readOnly = false,
		required = false,
		class: className,
		children,
		child,
		...restProps
	}: ColorPickerRootProps = $props();

	// Uncontrolled: seed once from the defaults. Controlled: the caller's binding wins. The seed is a
	// one-shot initialisation, so the defaults are read through `untrack` — reading them bare here
	// would capture only their initial value while looking like a reactive read.
	value ??= untrack(() => defaultValue);
	open ??= untrack(() => defaultOpen);
	format ??= untrack(() => defaultFormat);

	/**
	 * The element the picker actually rendered onto. `ref` only ever points at the internal `<div>`,
	 * so in `child` mode the attachment below is the only thing that can tell {@link FormControlState}
	 * which element to walk up from.
	 */
	let mountedElement = $state<HTMLElement | null>(null);
	const attach = createAttachmentKey();

	function captureElement(element: HTMLElement) {
		mountedElement = element;
		return () => {
			if (mountedElement === element) mountedElement = null;
		};
	}

	const direction = useDirection({ dir: () => dir, element: () => ref ?? mountedElement });

	const root = setColorPickerContext(
		new ColorPickerRootState({
			getValue: () => value ?? defaultValue,
			setValue: (next) => {
				value = next;
				onValueChange?.(next);
				// A parent that declines the write keeps its own colour, so adopt it straight back
				// instead of drifting away from the value it is still rendering.
				if (value !== next) root.syncFromValue(value ?? defaultValue);
			},
			getOpen: () => open ?? false,
			setOpen: (next) => {
				open = next;
				onOpenChange?.(next);
			},
			getFormat: () => format ?? defaultFormat,
			setFormat: (next) => {
				format = next;
				onFormatChange?.(next);
			},
			getModal: () => modal,
			getDir: () => direction.current,
			getInline: () => inline,
			getDisabled: () => disabled,
			getReadOnly: () => readOnly,
			getRequired: () => required,
			getName: () => name,
		}),
	);

	// A `value` written from outside — a controlled prop, or a parent that rewrote what it was
	// handed. Reading it is the only tracked dependency; the adoption itself is untracked so the
	// colour state it writes cannot re-trigger this effect.
	$effect(() => {
		const next = value;
		if (next === undefined) return;
		untrack(() => root.syncFromValue(next));
	});

	const formControl = new FormControlState({ getElement: () => ref ?? mountedElement });

	const rootAttrs = $derived({
		"data-slot": "color-picker",
		"data-disabled": disabled ? "" : undefined,
		"data-readonly": readOnly ? "" : undefined,
		"data-inline": inline ? "" : undefined,
		...restProps,
		[attach]: captureElement,
		class: cn(className),
	} as ColorPickerChildProps);
</script>

{#snippet body()}
	{#if child}
		{@render child({ props: rootAttrs })}
	{:else}
		<div bind:this={ref} {...rootAttrs}>
			{@render children?.()}
		</div>
	{/if}
{/snippet}

{#if inline}
	{@render body()}
{:else}
	<Popover.Root bind:open={() => root.open, (next) => root.setOpen(next)}>
		{@render body()}
	</Popover.Root>
{/if}

{#if formControl.isFormControl}
	<input
		type="hidden"
		data-slot="color-picker-form-input"
		tabindex={-1}
		{name}
		value={root.hex}
		{disabled}
		{required}
		readonly={readOnly}
	/>
{/if}
