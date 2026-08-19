<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { Attachment } from "svelte/attachments";
	import type {
		ClipboardEventHandler,
		CompositionEventHandler,
		FocusEventHandler,
		FormEventHandler,
		HTMLInputAttributes,
		KeyboardEventHandler,
	} from "svelte/elements";

	import type { MaskPattern, MaskPatternKey } from "./mask-engine.js";
	import type { MaskInputValidationMode } from "./mask-input.svelte.js";

	/** A DOM event whose `currentTarget` is known to be the masked `<input>`. */
	type MaskInputEvent<E extends Event> = E & { currentTarget: EventTarget & HTMLInputElement };

	/** The merged attribute payload handed to the `child` snippet. */
	export type MaskInputChildProps = {
		"data-slot": "mask-input";
		"data-disabled": "" | undefined;
		"data-invalid": "" | undefined;
		"data-readonly": "" | undefined;
		"data-required": "" | undefined;
		"aria-invalid": boolean;
		class: string;
		disabled: boolean;
		readonly: boolean;
		required: boolean;
		// The symbol slot carries the attachment that applies the displayed value (divergence D-11),
		// so a `child`-rendered element keeps masking and caret restoration by spreading these props.
	} & Record<string, unknown> &
		Record<symbol, Attachment<HTMLInputElement>>;

	export type MaskInputRootProps = WithElementRef<
		Omit<HTMLInputAttributes, "value" | "defaultValue">,
		HTMLInputElement
	> & {
		/**
		 * The masked value of the input.
		 *
		 * Bindable: `bind:value` lets the field move your state, while the function binding
		 * `bind:value={() => value, (next) => …}` keeps you authoritative — a setter that declines the
		 * write leaves the rendered value exactly where it was.
		 */
		value?: string;
		/**
		 * The initial value when the field is uncontrolled. Seeded once; `value` wins afterwards.
		 *
		 * @default ""
		 */
		defaultValue?: string;
		/** Called with the masked value and the raw unmasked value whenever the value changes. */
		onValueChange?: (maskedValue: string, unmaskedValue: string) => void;
		/** Called with the verdict of the pattern's `validate`, per `validationMode`. */
		onValidate?: (isValid: boolean, unmaskedValue: string) => void;
		/**
		 * When `onValidate` runs.
		 *
		 * @default "onChange"
		 */
		validationMode?: MaskInputValidationMode;
		/** A built-in pattern key, or a custom `{ pattern, transform, validate }` object. */
		mask?: MaskPatternKey | MaskPattern;
		/** The placeholder shown while the field has focus, e.g. `"(___) ___-____"`. */
		maskPlaceholder?: string;
		/**
		 * ISO 4217 currency code used by the `currency` mask.
		 *
		 * @default "USD"
		 */
		currency?: string;
		/**
		 * BCP 47 locale tag used by the `currency` mask.
		 *
		 * @default "en-US"
		 */
		locale?: string;
		/**
		 * Whether the field is in an invalid state. Always emitted as `aria-invalid`.
		 *
		 * @default false
		 */
		invalid?: boolean;
		/**
		 * Whether to skip masking entirely and pass the typed text through.
		 *
		 * @default false
		 */
		withoutMask?: boolean;
		/**
		 * Whether the field is disabled.
		 *
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Whether the field is read-only. Spelled as the HTML attribute (divergence D-03).
		 *
		 * @default false
		 */
		readonly?: boolean;
		/**
		 * Whether the field is required.
		 *
		 * @default false
		 */
		required?: boolean;
		/**
		 * The virtual keyboard hint. Overrides the value derived from the mask; the HTML spelling
		 * `inputmode` is accepted too.
		 *
		 * @default derived from the mask
		 */
		inputMode?: HTMLInputAttributes["inputmode"];
		/**
		 * Render the field onto your own element instead of the default `<input>`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `ref` stays `null` (divergence D-04), but masking, caret restoration and the
		 * Backspace/Delete/paste paths keep working, because every emitted handler resolves the
		 * element from `event.currentTarget` (divergence D-05) and the displayed value rides along
		 * inside the props as an attachment (divergence D-11).
		 */
		child?: Snippet<[{ props: MaskInputChildProps }]>;
		/**
		 * Called before the field masks the typed text. Calling `preventDefault()` opts this change
		 * out of masking entirely.
		 */
		oninput?: FormEventHandler<HTMLInputElement> | null;
		/** Called before the field records focus. `preventDefault()` opts out. */
		onfocus?: FocusEventHandler<HTMLInputElement> | null;
		/** Called before the field records the blur and runs blur validation. `preventDefault()` opts out. */
		onblur?: FocusEventHandler<HTMLInputElement> | null;
		/** Called before the field handles `Backspace`/`Delete`. `preventDefault()` opts out. */
		onkeydown?: KeyboardEventHandler<HTMLInputElement> | null;
		/** Called before the field reformats pasted text. `preventDefault()` opts out. */
		onpaste?: ClipboardEventHandler<HTMLInputElement> | null;
		/** Called before the field suspends masking for an IME composition. `preventDefault()` opts out. */
		oncompositionstart?: CompositionEventHandler<HTMLInputElement> | null;
		/** Called before the field masks the composed text. `preventDefault()` opts out. */
		oncompositionend?: CompositionEventHandler<HTMLInputElement> | null;
	};

	/** Upstream-parity alias of {@link MaskInputRootProps}. */
	export type MaskInputProps = MaskInputRootProps;
</script>

<script lang="ts">
	import { untrack } from "svelte";
	import { createAttachmentKey } from "svelte/attachments";

	import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from "./mask-engine.js";
	import { MaskInputState } from "./mask-input.svelte.js";

	let {
		ref = $bindable(null),
		value = $bindable(),
		defaultValue = "",
		onValueChange,
		onValidate,
		validationMode = "onChange",
		mask,
		maskPlaceholder,
		currency = DEFAULT_CURRENCY,
		locale = DEFAULT_LOCALE,
		invalid = false,
		withoutMask = false,
		disabled = false,
		readonly = false,
		required = false,
		placeholder,
		inputMode,
		inputmode,
		maxlength,
		min,
		max,
		class: className,
		child,
		oninput,
		onfocus,
		onblur,
		onkeydown,
		onpaste,
		oncompositionstart,
		oncompositionend,
		...restProps
	}: MaskInputRootProps = $props();

	// Uncontrolled: seed once from `defaultValue`. Controlled: the parent's binding wins.
	value ??= untrack(() => defaultValue);

	const maskState = new MaskInputState({
		getValue: () => value ?? "",
		setValue: (next) => {
			value = next;
			syncGeneration++;
		},
		getMask: () => mask,
		getCurrency: () => currency,
		getLocale: () => locale,
		getValidationMode: () => validationMode,
		getPlaceholder: () => placeholder,
		getMaskPlaceholder: () => maskPlaceholder,
		getWithoutMask: () => withoutMask,
		getDisabled: () => disabled,
		getReadonly: () => readonly === true,
		getInputMode: () => inputMode ?? inputmode,
		getMaxLength: () => maxlength,
		getMin: () => min,
		getMax: () => max,
		getOnValueChange: () => onValueChange,
		getOnValidate: () => onValidate,
		getOninput: () => oninput,
		getOnfocus: () => onfocus,
		getOnblur: () => onblur,
		getOnkeydown: () => onkeydown,
		getOnpaste: () => onpaste,
		getOncompositionstart: () => oncompositionstart,
		getOncompositionend: () => oncompositionend,
	});

	// The displayed value is applied through an attachment rather than as a reactive `value`
	// attribute (divergence D-11). Both of Svelte's attribute writers assign `element.value`
	// whenever *their own* record of it changed — they never compare against the element — so after
	// a handler has written the masked string and placed the caret, the following flush would write
	// the identical string again and knock the caret to the end. The guard below is the missing
	// comparison, and it travels inside the props so a `child`-rendered element gets it too.
	const attach = createAttachmentKey();

	/**
	 * Bumped by every commit. A controlled parent that *declines* a write leaves `displayValue`
	 * exactly as it was, so without this the attachment would never re-run and the element would keep
	 * showing the rejected text; the generation makes the component put it back, which is what React
	 * does for a controlled input whose parent refuses the change.
	 */
	let syncGeneration = $state(0);

	const pendingSync = $derived([syncGeneration, maskState.displayValue] as const);

	function syncValue(element: Element) {
		if (!(element instanceof HTMLInputElement)) return;

		const [, next] = pendingSync;
		if (element.value !== next) element.value = next;
	}

	// `data-*` first and the masking-critical props last, so a caller attribute arriving through
	// `..restProps` can neither drop the slot marker nor clobber the value or the handlers —
	// the same ordering upstream's own JSX uses.
	const inputAttrs = $derived({
		"aria-invalid": invalid,
		"data-slot": "mask-input",
		"data-disabled": disabled ? "" : undefined,
		"data-invalid": invalid ? "" : undefined,
		"data-readonly": readonly ? "" : undefined,
		"data-required": required ? "" : undefined,
		...restProps,
		// Mirrors src/lib/components/ui/input/input.svelte — the field has to own its `<input>` so it
		// stays the only writer of `element.value`, so the class string is duplicated rather than
		// composed. Keep the two in sync.
		class: cn(
			"h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
			className,
		),
		// One-way, never `bind:value`: the handlers below write `element.value` and place the caret
		// themselves, and a second writer would snap the caret back to the end.
		[attach]: syncValue,
		placeholder: maskState.placeholderValue,
		disabled,
		readonly,
		required,
		maxlength: maskState.calculatedMaxLength,
		inputmode: maskState.calculatedInputMode,
		min,
		max,
		oninput: (event: MaskInputEvent<Event>) => maskState.oninput(event),
		onfocus: (event: MaskInputEvent<FocusEvent>) => maskState.onfocus(event),
		onblur: (event: MaskInputEvent<FocusEvent>) => maskState.onblur(event),
		onkeydown: (event: MaskInputEvent<KeyboardEvent>) => maskState.onkeydown(event),
		onpaste: (event: MaskInputEvent<ClipboardEvent>) => maskState.onpaste(event),
		oncompositionstart: (event: MaskInputEvent<CompositionEvent>) =>
			maskState.oncompositionstart(event),
		oncompositionend: (event: MaskInputEvent<CompositionEvent>) =>
			maskState.oncompositionend(event),
	} as MaskInputChildProps);
</script>

{#if child}
	{@render child({ props: inputAttrs })}
{:else}
	<input bind:this={ref} {...inputAttrs} />
{/if}
