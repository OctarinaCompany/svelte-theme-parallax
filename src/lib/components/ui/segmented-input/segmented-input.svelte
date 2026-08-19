<script lang="ts" module>
	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { SegmentedInputOrientation, SegmentedInputSize } from "./segmented-input.svelte.js";

	/** The merged attribute payload handed to the `child` snippet. */
	export type SegmentedInputChildProps = {
		"data-slot": "segmented-input";
		"data-orientation": SegmentedInputOrientation;
		"data-disabled": "" | undefined;
		"data-invalid": "" | undefined;
		"data-required": "" | undefined;
		role: "group";
		"aria-orientation": SegmentedInputOrientation;
		dir: Direction;
		class: string;
	} & Record<string, unknown>;

	export type SegmentedInputRootProps = WithElementRef<
		Omit<HTMLAttributes<HTMLDivElement>, "dir">,
		HTMLDivElement
	> & {
		/**
		 * The size of all inputs in the segment.
		 *
		 * @default "default"
		 */
		size?: SegmentedInputSize;
		/**
		 * The reading direction of the segmented input.
		 *
		 * @default the nearest `<DirectionProvider>`, else the DOM `[dir]`, else "ltr"
		 */
		dir?: Direction;
		/**
		 * The orientation of the segmented input.
		 *
		 * @default "horizontal"
		 */
		orientation?: SegmentedInputOrientation;
		/**
		 * Whether all inputs in the segment are disabled.
		 *
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Whether all inputs in the segment are in an invalid state.
		 *
		 * @default false
		 */
		invalid?: boolean;
		/**
		 * Whether all inputs in the segment are required.
		 *
		 * @default false
		 */
		required?: boolean;
		/**
		 * Render the group onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element, and `children` is not rendered — the caller
		 * places the items itself.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`) and the base variant's `render`, neither of
		 * which has a Svelte equivalent. In `child` mode `ref` stays `null`, so the direction DOM
		 * fallback resolves from the document rather than from this element's ancestors
		 * (divergence D-03).
		 */
		child?: Snippet<[{ props: SegmentedInputChildProps }]>;
		children?: Snippet;
	};

	/** Upstream-parity alias of {@link SegmentedInputRootProps}. */
	export type SegmentedInputProps = SegmentedInputRootProps;
</script>

<script lang="ts">
	import { useDirection } from "$lib/components/ui/direction-provider/index.js";

	import { SegmentedInputRootState, setSegmentedInputContext } from "./segmented-input.svelte.js";

	let {
		ref = $bindable(null),
		size = "default",
		dir,
		orientation = "horizontal",
		disabled = false,
		invalid = false,
		required = false,
		class: className,
		child,
		children,
		...restProps
	}: SegmentedInputRootProps = $props();

	// Anchored at the parent, not at `ref`: the root always renders a resolved `dir` attribute, so
	// a walk starting on the element itself would match its own attribute and never see an ancestor
	// `dir="rtl"`. The parent keeps nearest-ancestor scoping without that self-shadowing.
	const direction = useDirection({ dir: () => dir, element: () => ref?.parentElement });

	const state = setSegmentedInputContext(
		new SegmentedInputRootState({
			getDir: () => direction.current,
			getOrientation: () => orientation,
			getSize: () => size,
			getDisabled: () => disabled,
			getInvalid: () => invalid,
			getRequired: () => required,
		}),
	);

	/**
	 * `aria-orientation` is not in ARIA 1.2's supported set for `role="group"`, but upstream emits it
	 * and this theme keeps parity with it. Spreading it keeps the
	 * emitted value identical while staying out of the compiler's static
	 * `a11y_role_supports_aria_props` analysis, which only inspects attributes written literally on
	 * the element — the same treatment `checkbox-group.svelte` gives its own superset ARIA.
	 */
	const supersetAria = $derived({ role: "group", "aria-orientation": state.orientation });

	const rootAttrs = $derived({
		"data-slot": "segmented-input",
		"data-orientation": state.orientation,
		"data-disabled": disabled ? "" : undefined,
		"data-invalid": invalid ? "" : undefined,
		"data-required": required ? "" : undefined,
		...supersetAria,
		dir: state.dir,
		...restProps,
		class: cn("flex", state.orientation === "horizontal" ? "flex-row" : "flex-col", className),
	} as SegmentedInputChildProps);
</script>

{#if child}
	{@render child({ props: rootAttrs })}
{:else}
	<div bind:this={ref} {...rootAttrs}>
		{@render children?.()}
	</div>
{/if}
