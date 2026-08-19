<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type FramePanelChildProps = {
		"data-slot": "frame-panel";
		class: string;
	} & Record<string, unknown>;

	export type FramePanelProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Size the panel to its content; otherwise it grows to fill the frame.
		 * @default false
		 */
		fit?: boolean;
		/**
		 * Render the panel onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element. In `child` mode `children` is
		 * not rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: FramePanelChildProps }]>;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		fit = false,
		class: className,
		children,
		child,
		...restProps
	}: FramePanelProps = $props();

	const panelAttrs = $derived({
		"data-slot": "frame-panel",
		...restProps,
		class: cn(
			// bg-(--frame-panel-bg) and border-(--frame-panel-border-color) consume the CSS vars
			// set by the Frame parent. Any explicit bg-* or border-* class passed via `class`
			// overrides these by Tailwind source order - no ! needed.
			"relative overflow-hidden rounded-(--frame-panel-radius) border border-(--frame-panel-border-color) bg-(--frame-panel-bg) bg-clip-padding shadow-xs",
			!fit && "grow",
			// The ::before overlay carries a hairline inner highlight one pixel inside the panel
			// border; black/white here is the physical sheen upstream draws, not a theme colour,
			// so it deliberately stays literal (the original - same precedent as
			// chart-container.svelte).
			"before:pointer-events-none before:absolute before:inset-0 before:rounded-[calc(var(--frame-panel-radius)_-_1px)] before:inset-shadow-2xs before:inset-shadow-black/5",
			"dark:bg-clip-border dark:before:inset-shadow-white/5",
			"px-(--frame-panel-px) py-(--frame-panel-py)",
			className,
		),
	} as FramePanelChildProps);
</script>

{#if child}
	{@render child({ props: panelAttrs })}
{:else}
	<div bind:this={ref} {...panelAttrs}>
		{@render children?.()}
	</div>
{/if}
