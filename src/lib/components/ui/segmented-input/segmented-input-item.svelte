<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLInputAttributes, HTMLInputTypeAttribute } from "svelte/elements";

	import type { SegmentPosition } from "./segment-navigation.svelte.js";
	import type { SegmentedInputOrientation } from "./segmented-input.svelte.js";

	/**
	 * `'file'` is excluded (divergence D-04): a file input has no caret, no `maxlength`, and cannot
	 * take a distributed paste part — and excluding it resolves the composed `Input`'s discriminated
	 * union without a cast.
	 */
	export type SegmentedInputItemType = Exclude<HTMLInputTypeAttribute, "file">;

	/** The merged attribute payload handed to the `child` snippet. */
	export type SegmentedInputItemChildProps = {
		"data-slot": "segmented-input-item";
		"data-orientation": SegmentedInputOrientation;
		"data-position": SegmentPosition;
		"data-disabled": "" | undefined;
		"data-invalid": "" | undefined;
		"data-required": "" | undefined;
		"aria-invalid": true | undefined;
		"aria-required": true | undefined;
		disabled: boolean;
		required: boolean;
		class: string;
	} & Record<string, unknown>;

	export type SegmentedInputItemProps = WithElementRef<
		Omit<HTMLInputAttributes, "type" | "value" | "files" | "disabled" | "required">,
		HTMLInputElement
	> & {
		/**
		 * The value of this segment.
		 *
		 * Bindable: `bind:value` lets the segment move your state — including when a paste is
		 * distributed into it — while the function binding `bind:value={() => value, (next) => …}`
		 * keeps you authoritative, and a setter that declines the write leaves the rendered value
		 * exactly where it was.
		 */
		value?: string | number | null;
		/** Any native input type except `file` (divergence D-04). */
		type?: SegmentedInputItemType;
		/**
		 * The position of the input within the segment. Controls the visual styling and borders.
		 *
		 * If not provided, it is derived from this input's document-order index among the group's
		 * registered items:
		 * - "isolated": Single standalone input in the segment
		 * - "first": First input in the segment
		 * - "middle": Middle input in the segment
		 * - "last": Last input in the segment
		 *
		 * @default Auto-detected based on position in the group
		 */
		position?: SegmentPosition;
		/**
		 * Whether the input is disabled. Inherits from the `<SegmentedInput.Root>` if not specified;
		 * an explicit `false` opts this segment out of a disabled group.
		 */
		disabled?: boolean;
		/**
		 * Whether the input is required. Inherits from the `<SegmentedInput.Root>` if not specified.
		 */
		required?: boolean;
		/**
		 * Render the segment onto your own element instead of the default `Input`. The snippet
		 * receives the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`) and the base variant's `render`. In `child`
		 * mode `ref` stays `null` (divergence D-03), but registration rides along inside the merged
		 * props as an attachment — so a `child`-rendered segment still keeps its computed
		 * `data-position`, holds its index for its siblings, and takes part in arrow navigation and
		 * paste distribution, as long as you spread `props` onto a real `<input>`.
		 */
		child?: Snippet<[{ props: SegmentedInputItemChildProps }]>;
	};
</script>

<script lang="ts">
	import { Input } from "$lib/components/ui/input/index.js";
	import { createAttachmentKey } from "svelte/attachments";

	import {
		getSegmentedInputContext,
		segmentedInputItemVariants,
	} from "./segmented-input.svelte.js";

	let {
		ref = $bindable(null),
		value = $bindable(),
		type,
		position: positionProp,
		disabled,
		required,
		readonly,
		maxlength,
		onkeydown,
		onpaste,
		class: className,
		child,
		...restProps
	}: SegmentedInputItemProps = $props();

	const root = getSegmentedInputContext("<SegmentedInput.Item>");

	const id = $props.id();

	// Self-registration replaces upstream's `React.Children.map` + `cloneElement`, which has no
	// Svelte equivalent: the collection sorts by document position, so positions survive `{#each}`
	// reordering and conditional items, and one registry also feeds arrow navigation and paste
	// distribution.
	const position = $derived(positionProp ?? root.nav.positionOf(id));
	const isDisabled = $derived(root.resolveDisabled(disabled));
	const isRequired = $derived(root.resolveRequired(required));

	// An attachment rather than a `ref`-gated `$effect`, so the registration travels with the spread
	// props: a segment the caller renders itself through `child` never binds `ref`, yet still joins
	// the group and keeps its position, navigation and paste share (the precedent `masonry-item` and
	// `scroller` already set for the same problem). `registerSegment` is declared once outside the
	// `$derived` payload so its identity is stable and the attachment runs a single time per element.
	const attach = createAttachmentKey();

	function registerSegment(element: Element) {
		if (!(element instanceof HTMLInputElement)) return;

		root.nav.register(id, element, {
			getDisabled: () => isDisabled,
			getReadOnly: () => readonly === true,
			getMaxLength: () => maxlength ?? undefined,
			setValue: (next) => {
				// The DOM is written first so Svelte's own `bind:value` listener on the composed
				// `<input>` reads the value this paste intends rather than the stale one; the prop
				// assignment then moves a `bind:value` parent, and the synthetic event reaches callers
				// using the upstream `oninput` idiom. A function binding that declines the write still
				// wins — Svelte restores the input from the getter.
				element.value = next;
				value = next;
				element.dispatchEvent(new Event("input", { bubbles: true }));
			},
		});

		return () => root.nav.unregister(id);
	}

	// `..restProps` spread after an attribute overwrites it, so the caller's handlers are composed
	// explicitly instead: theirs runs first, and a `preventDefault()` vetoes ours. That veto is the
	// documented opt-out for both enhancements.
	function handleKeydown(event: KeyboardEvent & { currentTarget: HTMLInputElement }) {
		onkeydown?.(event);
		root.nav.onKeydown(event, id);
	}

	function handlePaste(event: ClipboardEvent & { currentTarget: HTMLInputElement }) {
		onpaste?.(event);
		root.nav.onPaste(event, id);
	}

	const itemAttrs = $derived({
		"data-slot": "segmented-input-item",
		"data-orientation": root.orientation,
		"data-position": position,
		"data-disabled": isDisabled ? "" : undefined,
		"data-invalid": root.invalid ? "" : undefined,
		"data-required": isRequired ? "" : undefined,
		"aria-invalid": root.invalid ? true : undefined,
		"aria-required": isRequired ? true : undefined,
		disabled: isDisabled,
		required: isRequired,
		readonly,
		maxlength,
		...restProps,
		onkeydown: handleKeydown,
		onpaste: handlePaste,
		[attach]: registerSegment,
		class: cn(
			segmentedInputItemVariants({ position, orientation: root.orientation, size: root.size }),
			className,
		),
	} as SegmentedInputItemChildProps);
</script>

{#if child}
	{@render child({ props: { ...itemAttrs, type, value } })}
{:else}
	<Input bind:ref bind:value {type} {...itemAttrs} />
{/if}
