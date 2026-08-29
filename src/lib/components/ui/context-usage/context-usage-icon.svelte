<script lang="ts" module>
	import type { CircularProgressRootProps } from "$lib/components/ui/circular-progress/index.js";
	import type { WithoutChildrenOrChild } from "$lib/utils.js";

	/**
	 * `CircularProgress.Root`'s props minus its snippets: the ring is fixed, but `size`,
	 * `thickness`, `class`, `aria-label` and the rest are the caller's to override.
	 */
	export type ContextUsageIconProps = WithoutChildrenOrChild<CircularProgressRootProps>;
</script>

<script lang="ts">
	import * as CircularProgress from "$lib/components/ui/circular-progress/index.js";
	import { cn } from "$lib/utils.js";
	import { getContextUsageContext } from "./context-usage.svelte.js";

	/**
	 * The ring: a house `CircularProgress` drawn at 20px with a 2px stroke, fed by the state's
	 * ratio. Upstream hand-rolls an `<svg role="img">` at the same geometry with two opacities of
	 * `currentColor`; this is painted in the kit's track and range tokens and, standing alone, is
	 * a real `role="progressbar"` whose `aria-valuenow` tracks the window. Inside the trigger the
	 * role is not exposed — ARIA makes the children of `role="button"` presentational, so the
	 * progressbar is dropped from the tree there and the trigger's text carries the percentage.
	 *
	 * INSIDE THE TRIGGER IT RENDERS AT 16PX, exactly as upstream's does: the `Button` sizes every
	 * `<svg>` without a `size-*` class to `size-4` (see `buttonVariants` in `button.svelte`, which
	 * is shadcn's rule), so the 20-unit drawing scales to 16px with a 1.6px stroke. Standalone —
	 * in a status bar, a table cell — it is 20px. The drawing keeps upstream's numbers rather than
	 * chasing the button's so that a caller's `size` means what it says everywhere.
	 */
	let {
		ref = $bindable(null),
		class: className,
		size = 20,
		thickness = 2,
		...restProps
	}: ContextUsageIconProps = $props();

	const state = getContextUsageContext("`<ContextUsage.Icon>`");
</script>

<CircularProgress.Root
	bind:ref
	value={state.usedPercent * 100}
	min={0}
	max={100}
	{size}
	{thickness}
	aria-label="Model context usage"
	data-slot="context-usage-icon"
	data-percent={state.percent}
	class={cn("shrink-0", className)}
	{...restProps}
>
	<CircularProgress.Indicator>
		<CircularProgress.Track />
		<CircularProgress.Range />
	</CircularProgress.Indicator>
</CircularProgress.Root>
