<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	export type ModelSelectorLogoGroupProps = WithElementRef<HTMLAttributes<HTMLDivElement>>;
</script>

<script lang="ts">
	/**
	 * Several logos overlapped into one stack — a model served by more than one provider, a
	 * trigger summarising what the list holds.
	 *
	 * `-space-x-1` is the one place this kit writes a `space-*` utility. The rule
	 * (`docs/CONVENTIONS.md` §8) bans it as a substitute for `gap`, and a NEGATIVE margin is not
	 * one: `gap` cannot overlap. Each logo is rounded, padded by a pixel and ringed so the one on
	 * top cuts a clean edge out of the one beneath, which is what the padding and ring are for.
	 *
	 * The ring is `background` in light and `foreground` in dark, not `background` in both: the
	 * logo carries `dark:invert`, and a filter inverts the box-shadow with the image, so the
	 * dark-mode ring has to be stated as the colour that INVERTS to the page ground. The same
	 * reasoning gives the logo's own `dark:bg-foreground`, which upstream already writes.
	 */
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ModelSelectorLogoGroupProps = $props();
</script>

<div
	bind:this={ref}
	data-slot="model-selector-logo-group"
	class={cn(
		"flex shrink-0 items-center -space-x-1 [&>img]:rounded-full [&>img]:bg-background [&>img]:p-px [&>img]:ring-1 [&>img]:ring-background dark:[&>img]:bg-foreground dark:[&>img]:ring-foreground",
		className,
	)}
	{...restProps}
>
	{@render children?.()}
</div>
