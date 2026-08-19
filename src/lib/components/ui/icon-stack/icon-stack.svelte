<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";
	import { tv } from "tailwind-variants";

	/** The merged attribute payload handed to the `child` snippet. */
	export type IconStackChildProps = {
		"data-slot": "icon-stack";
		class: string;
	} & Record<string, unknown>;

	// Upstream injects `--icon-stack-content-x/y` through the inline
	// `style` prop so callers can reposition the floating content. Here they live in the class list
	// as arbitrary-property utilities instead: tailwind-merge then lets a caller override them with
	// the same utilities via `class`, and no inline-style string merging is needed.
	export const iconStackVariants = tv({
		base: "relative h-20 w-18 text-foreground [--icon-stack-content-x:71%] [--icon-stack-content-y:58%] **:data-[slot=icon-stack-layer]:fill-background",
	});

	export type IconStackProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * Render the root onto your own element instead of the default `<div>`. The snippet receives
		 * the merged props to spread onto that element.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
		 * mode neither the layered SVG nor `children` is rendered and `ref` stays `null`.
		 */
		child?: Snippet<[{ props: IconStackChildProps }]>;
	};
</script>

<script lang="ts">
	let {
		ref = $bindable(null),
		class: className,
		children,
		child,
		...restProps
	}: IconStackProps = $props();

	const rootAttrs = $derived({
		"data-slot": "icon-stack",
		...restProps,
		class: cn(iconStackVariants(), className),
	} as IconStackChildProps);
</script>

<!--
	One isometric "sheet" of the stack: two stroked paths forming the top face and the extruded
	edge, offset and faded per layer. Ported verbatim from the original source including the
	slightly stronger stroke on the front (active) layer.
-->
{#snippet layer(opacity: string, x: number, y: number, active: boolean)}
	<g {opacity} transform="translate({x} {y})">
		<path
			data-slot="icon-stack-layer"
			d="M42.2538 2.046C41.4408 1.6325 40.3965 1.6677 39.2612 2.2424L7.9616 18.1934C5.3895 19.5039 3.301 23.1064 3.301 26.2322V64.3226C3.301 66.0677 3.9458 67.2943 4.962 67.8199L1.8363 66.229C0.8201 65.7104 0.1753 64.4771 0.1753 62.732V24.6412C0.1753 21.5085 2.2638 17.913 4.8359 16.6024L36.1355 0.6515C37.2778 0.0698 38.322 0.0416 39.128 0.4551L42.2538 2.046Z"
			stroke="currentColor"
			stroke-opacity={active ? "0.3" : "0.2"}
			stroke-width="0.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
		<path
			data-slot="icon-stack-layer"
			d="M42.2545 2.0456C43.2707 2.5643 43.9155 3.7979 43.9155 5.543V43.6337C43.9155 46.7665 41.827 50.3616 39.2549 51.6722L7.9554 67.6235C6.813 68.2052 5.7687 68.2331 4.9628 67.8196C3.9465 67.301 3.3018 66.0673 3.3018 64.3222V26.2318C3.3018 23.0991 5.3903 19.5036 7.9624 18.193L39.2619 2.2421C40.4043 1.6604 41.4486 1.6321 42.2545 2.0456Z"
			stroke="currentColor"
			stroke-opacity={active ? "0.35" : "0.25"}
			stroke-width="0.5"
			stroke-linecap="round"
			stroke-linejoin="round"
		/>
	</g>
{/snippet}

{#if child}
	{@render child({ props: rootAttrs })}
{:else}
	<div bind:this={ref} {...rootAttrs}>
		<svg aria-hidden="true" viewBox="0 0 72 81" fill="none" class="size-full overflow-visible">
			<!-- Soft ground shadow under the stack. -->
			<ellipse
				cx="36"
				cy="76"
				rx="30"
				ry="7"
				fill="currentColor"
				fill-opacity="0.055"
				class="blur-[4px]"
			/>
			{@render layer("0.4", 0, 0, false)}
			{@render layer("0.6", 13.65, 6.04, false)}
			{@render layer("0.8", 27.32, 12.08, true)}
		</svg>

		{#if children}
			<!--
				The caller's icon floats on the front sheet: positioned by the two custom properties,
				then skewed/scaled to sit in the isometric plane.
			-->
			<div
				data-slot="icon-stack-content"
				class="pointer-events-none absolute top-[var(--icon-stack-content-y)] left-[var(--icon-stack-content-x)] flex -translate-x-1/2 -translate-y-1/2 scale-x-90 -skew-y-26 items-center justify-center text-muted-foreground"
			>
				{@render children()}
			</div>
		{/if}
	</div>
{/if}
