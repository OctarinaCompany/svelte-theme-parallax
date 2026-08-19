<script lang="ts" module>
	import { cn, type WithoutChildren, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type ColorPickerAreaChildProps = {
		role: "slider";
		tabindex: 0 | -1;
		"aria-label": string;
		"aria-valuemin": 0;
		"aria-valuemax": 100;
		"aria-valuenow": number;
		"aria-valuetext": string;
		"aria-orientation": "horizontal";
		"aria-disabled": "true" | undefined;
		"data-slot": "color-picker-area";
		"data-disabled": "" | undefined;
		"data-readonly": "" | undefined;
		"data-dragging": "" | undefined;
		class: string;
	} & Record<string, unknown>;

	export type ColorPickerAreaProps = WithoutChildren<
		WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement>
	> & {
		/**
		 * The arrow-key increment, in percentage points of saturation or brightness.
		 *
		 * @default 1
		 */
		step?: number;
		/**
		 * The increment used while `Shift` is held, and by `PageUp`/`PageDown`.
		 *
		 * @default 10
		 */
		shiftStep?: number;
		/**
		 * The area's accessible name.
		 *
		 * @default "Saturation and brightness"
		 */
		"aria-label"?: string;
		/**
		 * Render the area onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element; the gradient layers and the crosshair are the
		 * caller's to draw.
		 *
		 * Replaces upstream's `asChild`. In `child` mode `ref` stays `null`.
		 */
		child?: Snippet<[{ props: ColorPickerAreaChildProps }]>;
	};
</script>

<script lang="ts">
	import { ColorPickerAreaState, getColorPickerContext } from "./color-picker.svelte.js";

	let {
		ref = $bindable(null),
		step = 1,
		shiftStep = 10,
		"aria-label": ariaLabel = "Saturation and brightness",
		onpointerdown,
		onpointermove,
		onpointerup,
		onpointercancel,
		onkeydown,
		class: className,
		child,
		...restProps
	}: ColorPickerAreaProps = $props();

	const root = getColorPickerContext("<ColorPicker.Area>");

	const area = new ColorPickerAreaState({
		root,
		getStep: () => step,
		getShiftStep: () => shiftStep,
	});

	const isDisabled = $derived(root.disabled);

	/**
	 * Under `dir="rtl"` the whole area mirrors: `updateFromPointer` reads the physical-right edge as
	 * saturation `0`, so the white end of the gradient and the crosshair's offset origin have to move
	 * to that edge too. Leaving both anchored to the physical left would paint the crosshair on the
	 * opposite side of the finger and put the white end under the fully saturated values.
	 */
	const isRtl = $derived(root.dir === "rtl");

	const saturationLayerStyle = $derived(
		`background: linear-gradient(to ${isRtl ? "left" : "right"}, #fff, transparent)`,
	);

	// `thumbLeft` is the saturation offset from the *leading* edge, whichever edge that is.
	const thumbStyle = $derived(
		`${isRtl ? "right" : "left"}: ${area.thumbLeft}; top: ${area.thumbTop}`,
	);

	function rectOf(event: PointerEvent): DOMRect | null {
		const target = event.currentTarget;
		return target instanceof Element ? target.getBoundingClientRect() : null;
	}

	function handlePointerDown(event: PointerEvent & { currentTarget: HTMLDivElement }) {
		if (isDisabled) return;
		onpointerdown?.(event);
		if (event.defaultPrevented) return;

		const rect = rectOf(event);
		if (!rect) return;

		area.isDragging = true;
		event.currentTarget.setPointerCapture?.(event.pointerId);
		area.updateFromPointer(event.clientX, event.clientY, rect);
	}

	function handlePointerMove(event: PointerEvent & { currentTarget: HTMLDivElement }) {
		onpointermove?.(event);
		if (event.defaultPrevented) return;
		if (!area.isDragging) return;

		const rect = rectOf(event);
		if (!rect) return;
		area.updateFromPointer(event.clientX, event.clientY, rect);
	}

	function handlePointerUp(event: PointerEvent & { currentTarget: HTMLDivElement }) {
		onpointerup?.(event);
		if (event.defaultPrevented) return;

		area.isDragging = false;
		if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
	}

	// A cancelled pointer (system gesture, scroll interception) never fires `pointerup`, so the
	// drag has to end here too or the crosshair keeps following an unpressed pointer.
	function handlePointerCancel(event: PointerEvent & { currentTarget: HTMLDivElement }) {
		onpointercancel?.(event);
		if (event.defaultPrevented) return;

		area.isDragging = false;
		if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
			event.currentTarget.releasePointerCapture(event.pointerId);
		}
	}

	function handleKeydown(event: KeyboardEvent & { currentTarget: HTMLDivElement }) {
		onkeydown?.(event);
		if (event.defaultPrevented) return;
		if (area.onKeydown(event)) event.preventDefault();
	}

	// Upstream's area has no role, no `tabindex` and no `aria-*` at all: the saturation axis is
	// exposed through the standard slider properties and the whole state through `aria-valuetext`,
	// which is the APG's guidance for a two-dimensional widget.
	const areaAttrs = $derived({
		role: "slider",
		tabindex: isDisabled ? -1 : 0,
		"aria-label": ariaLabel,
		"aria-valuemin": 0,
		"aria-valuemax": 100,
		"aria-valuenow": root.saturation,
		"aria-valuetext": root.valueText,
		"aria-orientation": "horizontal",
		"aria-disabled": isDisabled ? "true" : undefined,
		"data-slot": "color-picker-area",
		"data-disabled": isDisabled ? "" : undefined,
		"data-readonly": root.readOnly ? "" : undefined,
		"data-dragging": area.isDragging ? "" : undefined,
		...restProps,
		onpointerdown: handlePointerDown,
		onpointermove: handlePointerMove,
		onpointerup: handlePointerUp,
		onpointercancel: handlePointerCancel,
		onkeydown: handleKeydown,
		class: cn(
			"relative h-40 w-full cursor-crosshair touch-none rounded-sm border outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 data-disabled:pointer-events-none data-disabled:opacity-50",
			className,
		),
	} as ColorPickerAreaChildProps);
</script>

{#if child}
	{@render child({ props: areaAttrs })}
{:else}
	<div bind:this={ref} {...areaAttrs}>
		<div class="absolute inset-0 overflow-hidden rounded-sm">
			<div
				class="absolute inset-0"
				style="background-color: rgb({area.backgroundColor.r}, {area.backgroundColor.g}, {area
					.backgroundColor.b})"
			></div>
			<div
				data-slot="color-picker-area-saturation"
				class="absolute inset-0"
				style={saturationLayerStyle}
			></div>
			<div
				data-slot="color-picker-area-brightness"
				class="absolute inset-0"
				style="background: linear-gradient(to bottom, transparent, #000)"
			></div>
		</div>
		<div
			data-slot="color-picker-area-thumb"
			class={cn(
				"absolute size-3 -translate-y-1/2 rounded-full border-2 border-white shadow-sm",
				isRtl ? "translate-x-1/2" : "-translate-x-1/2",
			)}
			style={thumbStyle}
		></div>
	</div>
{/if}
