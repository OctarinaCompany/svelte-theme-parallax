<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { Direction } from "$lib/components/ui/direction-provider/index.js";
	import { cn, type WithElementRef } from "$lib/utils.js";

	import {
		AngleSliderRootState,
		DEFAULT_END_ANGLE,
		DEFAULT_MAX,
		DEFAULT_MIN,
		DEFAULT_SIZE,
		DEFAULT_START_ANGLE,
		DEFAULT_STEP,
		DEFAULT_THICKNESS,
		setAngleSliderContext,
	} from "./angle-slider.svelte.js";

	/** The merged attribute payload handed to the root's `child` snippet. */
	export type AngleSliderChildProps = {
		"data-slot": "angle-slider";
		"data-disabled"?: "";
		"data-readonly"?: "";
		dir: Direction;
		class: string;
		style: string;
	} & Record<string, unknown>;

	export type AngleSliderRootProps = Omit<
		WithElementRef<HTMLAttributes<HTMLDivElement>>,
		"defaultValue"
	> & {
		/**
		 * The angles of the dial, one per thumb, in value units.
		 *
		 * - `defaultValue={[45]}` — the component owns the value.
		 * - `bind:value={angle}` — shared; the dial writes straight into the caller's state.
		 * - `bind:value={() => angle, (next) => …}` — the caller owns it; a setter that declines
		 *   the write leaves the dial exactly where it was, while `onValueChange` still fires.
		 */
		value?: number[];
		/**
		 * Seeds the dial when `value` is absent.
		 * @default [0]
		 */
		defaultValue?: number[];
		/** Called with the next value array on every accepted change, pointer or keyboard. */
		onValueChange?: (value: number[]) => void;
		/** Called once per completed drag, and once per handled key press. */
		onValueCommit?: (value: number[]) => void;
		/**
		 * The lowest value of the dial.
		 * @default 0
		 */
		min?: number;
		/**
		 * The highest value of the dial.
		 * @default 100
		 */
		max?: number;
		/**
		 * The granularity every value snaps to. Its decimal count drives the rounding precision.
		 * @default 1
		 */
		step?: number;
		/**
		 * The minimum distance between two thumbs, expressed in steps. The guard distance in value
		 * units is `minStepsBetweenThumbs * step`.
		 * @default 0
		 */
		minStepsBetweenThumbs?: number;
		/**
		 * The **radius** of the dial in pixels — not its width. The rendered box is
		 * `size * 2 + 40` on both axes.
		 * @default 60
		 */
		size?: number;
		/**
		 * The stroke width of the track and the range in pixels.
		 * @default 8
		 */
		thickness?: number;
		/**
		 * The angle `min` sits at, in degrees; `-90` is 12 o'clock.
		 * @default -90
		 */
		startAngle?: number;
		/**
		 * The angle `max` sits at, in degrees. The swept angle is
		 * `(endAngle - startAngle + 360) % 360 || 360`.
		 * @default 270
		 */
		endAngle?: number;
		/** Overrides the nearest `<DirectionProvider>` and the inherited DOM `dir`. */
		dir?: Direction;
		/** `id` of the form every hidden input is submitted with. */
		form?: string;
		/** `name` of the hidden inputs — `name` for one thumb, `name[]` for two or more. */
		name?: string;
		/**
		 * Suppresses every interaction and dims the dial.
		 * @default false
		 */
		disabled?: boolean;
		/**
		 * Suppresses every interaction while keeping the thumbs focusable and their hidden inputs
		 * submittable. Has no upstream equivalent.
		 * @default false
		 */
		readOnly?: boolean;
		/**
		 * Reverses the value → angle mapping, and with it the sign of every arrow key.
		 * @default false
		 */
		inverted?: boolean;
		/**
		 * Render the dial onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode `children` are rendered by the snippet and `ref` stays `null` — the merged props
		 * carry an attachment instead, so an inherited `dir` still resolves against your element.
		 */
		child?: Snippet<[{ props: AngleSliderChildProps }]>;
	};
</script>

<script lang="ts">
	import { untrack } from "svelte";
	import { createAttachmentKey } from "svelte/attachments";

	import { useDirection } from "$lib/components/ui/direction-provider/index.js";

	let {
		ref = $bindable(null),
		value = $bindable(),
		defaultValue = [0],
		onValueChange,
		onValueCommit,
		min = DEFAULT_MIN,
		max = DEFAULT_MAX,
		step = DEFAULT_STEP,
		minStepsBetweenThumbs = 0,
		size = DEFAULT_SIZE,
		thickness = DEFAULT_THICKNESS,
		startAngle = DEFAULT_START_ANGLE,
		endAngle = DEFAULT_END_ANGLE,
		dir: dirProp,
		form,
		name,
		disabled = false,
		readOnly = false,
		inverted = false,
		class: className,
		style,
		children,
		child,
		onkeydown,
		onpointerdown,
		onpointermove,
		onpointerup,
		...restProps
	}: AngleSliderRootProps = $props();

	// Resolved once, at initialisation: a dial is either caller-owned or component-owned for its
	// whole life. Keeping the uncontrolled value in its own `$state` rather than writing back into
	// the unbound `value` prop is what makes it survive a props invalidation.
	const isControlled = value !== undefined;
	let internalValues = $state<number[]>(untrack(() => value ?? defaultValue));

	const values = $derived(isControlled ? (value ?? internalValues) : internalValues);

	function setValues(next: number[]) {
		if (isControlled) value = next;
		else internalValues = next;
		onValueChange?.(next);
	}

	/**
	 * The element the dial actually rendered onto. `ref` only ever points at the internal `<div>`,
	 * so in `child` mode this attachment is the only thing that can tell {@link useDirection} which
	 * element to walk up from — without it a `child` dial resolves its direction against
	 * `document.documentElement` and misses an enclosing `dir="rtl"`.
	 */
	let mountedElement = $state<HTMLElement | null>(null);
	const attachRoot = createAttachmentKey();

	function captureElement(element: HTMLElement) {
		mountedElement = element;
		return () => {
			if (mountedElement === element) mountedElement = null;
		};
	}

	// Anchored on the *parent*: the root writes its own resolved `dir` onto itself, so walking up
	// from the root would always find that attribute and never see the inherited one.
	const direction = useDirection({
		dir: () => dirProp,
		element: () => (ref ?? mountedElement)?.parentElement ?? null,
	});

	const slider = new AngleSliderRootState({
		getValues: () => values,
		setValues,
		getMin: () => min,
		getMax: () => max,
		getStep: () => step,
		getMinStepsBetweenThumbs: () => minStepsBetweenThumbs,
		getSize: () => size,
		getThickness: () => thickness,
		getStartAngle: () => startAngle,
		getEndAngle: () => endAngle,
		getDir: () => direction.current,
		getName: () => name,
		getForm: () => form,
		getDisabled: () => disabled,
		getReadOnly: () => readOnly,
		getInverted: () => inverted,
		getOnValueCommit: () => onValueCommit,
	});

	setAngleSliderContext(slider);

	/** The `currentTarget`-narrowed event shapes Svelte hands to a `<div>`'s own handlers. */
	type RootKeyboardEvent = KeyboardEvent & { currentTarget: EventTarget & HTMLDivElement };
	type RootPointerEvent = PointerEvent & { currentTarget: EventTarget & HTMLDivElement };

	function handleKeydown(event: RootKeyboardEvent) {
		onkeydown?.(event);
		if (event.defaultPrevented) return;

		slider.handleKeydown(event);
	}

	function handlePointerdown(event: RootPointerEvent) {
		onpointerdown?.(event);
		if (event.defaultPrevented || !slider.interactive) return;

		const target = event.target as HTMLElement | null;
		target?.setPointerCapture?.(event.pointerId);
		event.preventDefault();

		slider.snapshotValues();

		const clickedThumb = slider.thumbFromTarget(target);

		if (clickedThumb) {
			// Focusing the thumb is what moves `valueIndexToChange`; no value changes on a
			// pointerdown that lands on an existing thumb.
			const focusable =
				clickedThumb.element.querySelector<HTMLElement>('[data-slot="angle-slider-thumb"]') ??
				clickedThumb.element;
			focusable.focus();
			slider.valueIndexToChange = clickedThumb.index;
			return;
		}

		const pointerValue = slider.valueFromPointer(
			event.clientX,
			event.clientY,
			event.currentTarget.getBoundingClientRect(),
		);
		if (pointerValue === null) return;

		slider.startSlide(pointerValue);
	}

	function handlePointermove(event: RootPointerEvent) {
		onpointermove?.(event);
		if (event.defaultPrevented || !slider.interactive) return;

		const target = event.target as HTMLElement | null;
		if (!target?.hasPointerCapture?.(event.pointerId)) return;

		const pointerValue = slider.valueFromPointer(
			event.clientX,
			event.clientY,
			event.currentTarget.getBoundingClientRect(),
		);
		if (pointerValue === null) return;

		slider.moveSlide(pointerValue);
	}

	function handlePointerup(event: RootPointerEvent) {
		onpointerup?.(event);
		if (event.defaultPrevented) return;

		const target = event.target as HTMLElement | null;
		if (!target?.hasPointerCapture?.(event.pointerId)) return;

		target.releasePointerCapture(event.pointerId);
		slider.endSlide();
	}

	// Built once and shared by both branches, so a `child` element is wired exactly like the default
	// `<div>`. `class` and `style` are applied after `restProps`, matching upstream's ordering.
	const rootAttrs = $derived({
		[attachRoot]: captureElement,
		"data-slot": "angle-slider",
		"data-disabled": disabled ? "" : undefined,
		"data-readonly": readOnly ? "" : undefined,
		dir: direction.current,
		...restProps,
		onkeydown: handleKeydown,
		onpointerdown: handlePointerdown,
		onpointermove: handlePointermove,
		onpointerup: handlePointerup,
		class: cn("relative touch-none select-none", disabled && "opacity-50", className),
		style: `width:${slider.boxSize}px;height:${slider.boxSize}px;${style ?? ""}`,
	} as AngleSliderChildProps);
</script>

{#if child}
	{@render child({ props: rootAttrs })}
{:else}
	<div bind:this={ref} {...rootAttrs}>
		{@render children?.()}
	</div>
{/if}
