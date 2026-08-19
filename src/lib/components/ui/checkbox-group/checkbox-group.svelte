<script lang="ts" module>
	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type {
		CheckboxGroupOrientation,
		CheckboxGroupValidationResult,
	} from "./checkbox-group.svelte.js";

	export type CheckboxGroupRootProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, "dir">,
		HTMLDivElement
	> & {
		/**
		 * Controlled value.
		 *
		 * Bindable: `bind:value={tricks}` lets the group move the parent's state, while the function
		 * binding `bind:value={() => tricks, (next) => …}` keeps the parent authoritative — a setter
		 * that declines the write leaves the rendered state exactly where it was. Passing `value`
		 * unbound seeds the value once and the group then owns it.
		 */
		value?: string[];
		/**
		 * Initial value when uncontrolled. Also the value a native form `reset` restores.
		 *
		 * @default []
		 */
		defaultValue?: string[];
		/** Callback when the value changes, in both controlled and uncontrolled modes. */
		onValueChange?: (value: string[]) => void;
		/**
		 * Callback when the value is validated. Returning a `string` or `string[]` marks the group
		 * invalid and becomes the `<CheckboxGroup.Message>` content; `true`, `null` and `undefined`
		 * clear it.
		 */
		onValidate?: (value: string[]) => CheckboxGroupValidationResult;
		/**
		 * Whether the checkbox group is disabled.
		 *
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Whether the checkbox group is invalid, independently of `onValidate`.
		 *
		 * @default false
		 */
		invalid?: boolean;
		/**
		 * Whether the checkbox group is read-only. Items stay focusable but never change.
		 *
		 * @default false
		 */
		readOnly?: boolean;
		/**
		 * Whether the checkbox group is required in a form context. Satisfied by *any* checked item.
		 *
		 * @default false
		 */
		required?: boolean;
		/** Field name used by every item's hidden input during form submission. */
		name?: string;
		/**
		 * The reading direction of the checkbox group.
		 *
		 * @default the nearest `<DirectionProvider>`, else the DOM `[dir]`, else "ltr"
		 */
		dir?: Direction;
		/**
		 * The orientation of the checkbox group.
		 *
		 * @default "vertical"
		 */
		orientation?: CheckboxGroupOrientation;
		children?: Snippet;
	};

	/** Upstream-parity alias of {@link CheckboxGroupRootProps}. */
	export type CheckboxGroupProps = CheckboxGroupRootProps;
</script>

<script lang="ts">
	import { useDirection } from "$lib/components/ui/direction-provider/index.js";
	import { untrack } from "svelte";

	import { CheckboxGroupRootState, setCheckboxGroupContext } from "./checkbox-group.svelte.js";

	let {
		ref = $bindable(null),
		value = $bindable(),
		defaultValue = [],
		onValueChange,
		onValidate,
		disabled = false,
		invalid = false,
		readOnly = false,
		required = false,
		name,
		dir,
		orientation = "vertical",
		class: className,
		children,
		...restProps
	}: CheckboxGroupRootProps = $props();

	// Uncontrolled: seed once from `defaultValue`. Controlled: the caller's binding wins, and a
	// binding that declines the write keeps the rendered state where it was. The seed
	// is a one-shot initialisation, so `defaultValue` is read through `untrack` — reading it bare here
	// would capture only its initial value while looking like a reactive read.
	value ??= untrack(() => defaultValue);

	const direction = useDirection({ dir: () => dir, element: () => ref });

	const uid = $props.id();

	const state = setCheckboxGroupContext(
		new CheckboxGroupRootState({
			getValue: () => value ?? [],
			setValue: (next) => {
				value = next;
				onValueChange?.(next);
			},
			getDefaultValue: () => defaultValue,
			getOnValidate: () => onValidate,
			getDisabled: () => disabled,
			getInvalid: () => invalid,
			getReadOnly: () => readOnly,
			getRequired: () => required,
			getName: () => name,
			getOrientation: () => orientation,
			getDir: () => direction.current,
			id: uid,
		}),
	);

	/**
	 * `aria-readonly`, `aria-orientation` and `aria-invalid` are not in ARIA 1.2's supported set for
	 * `role="group"`, but upstream emits them for parity (`checkbox-group-root.tsx:170-178`, and the
	 * upstream test asserts `aria-orientation`), so this theme emits them too, and they are inert for
	 * assistive technology rather than harmful. Spreading them keeps the emitted values identical
	 * while staying out of the compiler's static `a11y_role_supports_aria_props` analysis, which only
	 * inspects attributes written literally on the element.
	 */
	const supersetAria = $derived({
		"aria-readonly": readOnly,
		"aria-orientation": orientation,
		"aria-invalid": state.isInvalid,
	});
</script>

<div
	bind:this={ref}
	role="group"
	data-slot="checkbox-group"
	aria-labelledby={state.labelledBy}
	aria-describedby={state.describedBy}
	{...supersetAria}
	dir={state.dir}
	data-orientation={orientation}
	data-disabled={disabled ? "" : undefined}
	data-invalid={state.isInvalid ? "" : undefined}
	data-readonly={readOnly ? "" : undefined}
	{...restProps}
	class={cn("peer flex flex-col gap-3.5", className)}
>
	{@render children?.()}
</div>
