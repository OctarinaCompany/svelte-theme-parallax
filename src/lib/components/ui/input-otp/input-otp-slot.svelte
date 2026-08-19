<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	/**
	 * No `children`: upstream renders the cell's character and fake caret itself and never
	 * renders caller children.
	 */
	export type InputOTPSlotProps = WithElementRef<HTMLAttributes<HTMLDivElement>, HTMLDivElement> & {
		/** Which of the root's slots this element displays, zero-based. */
		index: number;
	};
</script>

<script lang="ts">
	import { getInputOTPContext } from "./input-otp.svelte.js";

	let {
		ref = $bindable(null),
		index,
		class: className,
		...restProps
	}: InputOTPSlotProps = $props();

	const state = getInputOTPContext("<InputOTP.Slot>");

	// Upstream: `inputOTPContext?.slots[index] ?? {}`.
	const cell = $derived(state.cellAt(index));
</script>

<!--
	`data-active` renders "true"/"false" exactly as React stringifies upstream's
	`data-active={isActive}`, so the `data-[active=true]:` selectors — and
	any caller overrides written against them — match verbatim.

	Classes: upstream's structural line plus the stylesheet skin
	re-anchored to this repo's `Input`: the skin's
	size-8 / rounded-lg step up to size-9 / rounded-md — the house default control height and
	the radius Input uses — and the active ring becomes Input's focus ring (ring-3 ring-ring/50
	border-ring), with nova's ring-ring/50 agreeing already. The invalid guards keep nova's
	shape: the destructive border on every slot, the destructive ring only on the active one.
-->
<div
	bind:this={ref}
	data-slot="input-otp-slot"
	data-active={cell.isActive}
	class={cn(
		"relative flex size-9 items-center justify-center border-y border-r border-input text-sm transition-all outline-none first:rounded-l-md first:border-l last:rounded-r-md dark:bg-input/30",
		"data-[active=true]:z-10 data-[active=true]:border-ring data-[active=true]:ring-3 data-[active=true]:ring-ring/50",
		"aria-invalid:border-destructive data-[active=true]:aria-invalid:border-destructive data-[active=true]:aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:data-[active=true]:aria-invalid:ring-destructive/40",
		className,
	)}
	{...restProps}
>
	{cell.char}
	{#if cell.hasFakeCaret}
		<!--
			The fake caret upstream paints while the hidden input owns focus on an empty slot. `animate-caret-blink` ships with tw-animate-css; duration-1000
			matches the skin's caret-line treatment.
		-->
		<div class="pointer-events-none absolute inset-0 flex items-center justify-center">
			<div class="h-4 w-px animate-caret-blink bg-foreground duration-1000"></div>
		</div>
	{/if}
</div>
