<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	import type { NumberFieldScrubDirection } from "./number-field.svelte.js";

	export type NumberFieldScrubAreaProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/**
		 * The label text; also the field's visible `<label>`, wired to the input by `for` — a
		 * required prop, exactly as upstream declares it.
		 */
		label: string;
		/**
		 * The axis a drag is measured on. Vertical drags read upward-positive, like Base UI.
		 *
		 * @default "horizontal"
		 */
		direction?: NumberFieldScrubDirection;
		/**
		 * How many pixels of travel make one step.
		 *
		 * @default 2
		 */
		pixelSensitivity?: number;
	};
</script>

<script lang="ts">
	import { Label } from "$lib/components/ui/label/index.js";

	import { getNumberFieldContext } from "./number-field.svelte.js";

	let {
		ref = $bindable(null),
		label,
		direction = "horizontal",
		pixelSensitivity = 2,
		onpointerdown,
		onpointermove,
		onpointerup,
		onpointercancel,
		class: className,
		...restProps
	}: NumberFieldScrubAreaProps = $props();

	const root = getNumberFieldContext("<NumberField.ScrubArea>");

	// Base UI scrubs behind the Pointer Lock API, teleporting a virtual cursor across the screen.
	// This theme deliberately skips pointer lock: pointer capture plus a fixed-position cursor
	// glyph that follows the real (hidden) pointer gives the same affordance without the lock's
	// permission edge cases — the pointer simply stops at the screen edge instead of wrapping.
	let scrubbing = $state(false);
	let cursorX = $state(0);
	let cursorY = $state(0);

	// Handler-local bookkeeping, never rendered — plain fields, not `$state`.
	let lastX = 0;
	let lastY = 0;
	let accumulated = 0;

	function endScrub() {
		if (!scrubbing) return;
		scrubbing = false;
		document.body.style.removeProperty("cursor");
	}

	// The caller's handler runs first, and a `preventDefault()` vetoes ours — the composition
	// contract every enhanced handler in this repo follows.
	function handlePointerdown(event: PointerEvent & { currentTarget: HTMLDivElement }) {
		onpointerdown?.(event);
		if (event.defaultPrevented || event.button !== 0 || event.pointerType === "touch") return;
		if (root.disabled || root.readOnly) return;

		// Prevented so the drag never starts a text selection; capture keeps the move/up stream on
		// this element even once the pointer leaves it.
		event.preventDefault();
		event.currentTarget.setPointerCapture(event.pointerId);
		scrubbing = true;
		lastX = event.clientX;
		lastY = event.clientY;
		cursorX = event.clientX;
		cursorY = event.clientY;
		accumulated = 0;
		// The native cursor hides for the whole scrub so the glyph below reads as the cursor; the
		// body rule covers ground the capture drags across outside this element.
		document.body.style.setProperty("cursor", "none");
	}

	function handlePointermove(event: PointerEvent & { currentTarget: HTMLDivElement }) {
		onpointermove?.(event);
		if (!scrubbing) return;

		const deltaX = event.clientX - lastX;
		const deltaY = event.clientY - lastY;
		lastX = event.clientX;
		lastY = event.clientY;
		cursorX = event.clientX;
		cursorY = event.clientY;

		// Travel accumulates until it crosses whole `pixelSensitivity` ticks, so slow drags still
		// step and the remainder is never thrown away. Upward drag increments on the vertical axis.
		accumulated += direction === "horizontal" ? deltaX : -deltaY;
		const ticks = Math.trunc(accumulated / pixelSensitivity);
		if (ticks !== 0) {
			accumulated -= ticks * pixelSensitivity;
			root.applyStep(ticks > 0 ? 1 : -1, Math.abs(ticks) * root.step);
		}
	}

	function handlePointerup(event: PointerEvent & { currentTarget: HTMLDivElement }) {
		onpointerup?.(event);
		endScrub();
	}

	function handlePointercancel(event: PointerEvent & { currentTarget: HTMLDivElement }) {
		onpointercancel?.(event);
		endScrub();
	}

	// The body cursor is a global mutation; a scrub interrupted by unmount must restore it.
	$effect(() => {
		return () => endScrub();
	});

	const scrubAttrs = $derived({
		"data-slot": "number-field-scrub-area",
		"data-scrubbing": scrubbing ? "" : undefined,
		...restProps,
		onpointerdown: handlePointerdown,
		onpointermove: handlePointermove,
		onpointerup: handlePointerup,
		onpointercancel: handlePointercancel,
		class: cn(
			"flex select-none",
			direction === "horizontal" ? "cursor-ew-resize" : "cursor-ns-resize",
			className,
		),
	} as HTMLAttributes<HTMLDivElement> & { "data-slot": "number-field-scrub-area" });
</script>

<div bind:this={ref} {...scrubAttrs}>
	<Label
		for={root.inputId}
		class={direction === "horizontal" ? "cursor-ew-resize" : "cursor-ns-resize"}
	>
		{label}
	</Label>
	{#if scrubbing}
		<!--
			Upstream's `CursorGrowIcon`, kept verbatim down to the
			26-wide/24-viewBox quirk, but recoloured with tokens: upstream hardcodes black-on-white
			plus a `#0008` drop shadow, and `fill-foreground stroke-background drop-shadow-sm` is the
			same cursor contrast in both themes. `z-50` because a fixed glyph standing in for the
			OS cursor must clear any stacking context the page has open.
		-->
		<svg
			class="pointer-events-none fixed z-50 fill-foreground stroke-background drop-shadow-sm"
			style="left: {cursorX}px; top: {cursorY}px; transform: translate(-50%, -50%);"
			width="26"
			height="14"
			viewBox="0 0 24 14"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<path
				d="M19.5 5.5L6.49737 5.51844V2L1 6.9999L6.5 12L6.49737 8.5L19.5 8.5V12L25 6.9999L19.5 2V5.5Z"
			/>
		</svg>
	{/if}
</div>
