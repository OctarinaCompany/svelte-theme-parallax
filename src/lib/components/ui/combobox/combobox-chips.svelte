<script lang="ts" module>
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import { cn, type WithElementRef } from "$lib/utils.js";

	export type ComboboxChipsProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/** Normally a `<Combobox.Value>` whose snippet renders the chips and the chips input. */
		children?: Snippet;
	};
</script>

<script lang="ts">
	import { getComboboxContext } from "./combobox.svelte.js";

	/**
	 * The chips container: the multi-select's field — a wrapping row
	 * of committed selections with the search input flowing after them — and the popup's anchor,
	 * which is why `ref` is bindable and the demos hand it to `<Combobox.Content anchor>` (here
	 * through `createComboboxAnchor()`; the default anchor resolution also finds it on its own).
	 *
	 * The field chrome — border, ring, invalid, disabled — mirrors this repository's `Input`
	 * rather than upstream's own shell, so a chips combobox sits in a form row without announcing
	 * a second design language. `min-h-(--control-h-default)` instead of a fixed height: the row
	 * starts on the ramp's 40px default and grows as chips wrap,
	 * starting on the house control ramp.
	 */

	let {
		ref = $bindable(null),
		class: className,
		onpointerdown: onpointerdownProp,
		children,
		...restProps
	}: ComboboxChipsProps = $props();

	const root = getComboboxContext("<Combobox.Chips>");

	$effect(() => {
		root.chipsElement = ref;
		return () => {
			if (root.chipsElement === ref) root.chipsElement = null;
		};
	});

	/**
	 * A press on the container's padding is an intent to type: hand the caret to the input, and
	 * suppress the default so the input does not immediately blur back out. Presses on a chip's
	 * remove button keep their own meaning.
	 */
	function onpointerdown(event: PointerEvent & { currentTarget: EventTarget & HTMLDivElement }) {
		onpointerdownProp?.(event);
		if (event.defaultPrevented) return;
		if (root.disabled) return;

		const target = event.target;
		if (target instanceof HTMLElement && target.closest("button, input")) return;

		event.preventDefault();
		root.inputElement?.focus({ preventScroll: true });
	}
</script>

<div
	bind:this={ref}
	role="group"
	data-slot="combobox-chips"
	data-disabled={root.disabled ? "" : undefined}
	{...restProps}
	class={cn(
		"flex min-h-(--control-h-default) w-full min-w-0 cursor-text flex-wrap items-center gap-1 rounded-md border border-input bg-transparent px-2.5 py-1 text-sm shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 dark:bg-input/30 dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40 data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50",
		className,
	)}
	{onpointerdown}
>
	{@render children?.()}
</div>
