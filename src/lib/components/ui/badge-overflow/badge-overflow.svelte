<script lang="ts" module>
	import { cn, type WithElementRef, type WithoutChildren } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	interface GetBadgeLabel<T> {
		/**
		 * Function to extract the label string from each badge item.
		 *
		 * Optional for primitive arrays (strings, numbers).
		 * Required for object arrays.
		 *
		 * ```svelte
		 * <!-- For primitive arrays, getBadgeLabel is optional -->
		 * <BadgeOverflow items={['React', 'TypeScript']} {badge} />
		 * ```
		 *
		 * ```svelte
		 * <!-- For object arrays, getBadgeLabel is required -->
		 * <BadgeOverflow items={[{ id: 1, name: 'React' }]} getBadgeLabel={(item) => item.name} {badge} />
		 * ```
		 */
		getBadgeLabel: (item: T) => string;
	}

	/** The merged attribute payload handed to the `child` snippet. */
	export type BadgeOverflowChildProps = {
		"data-slot": "badge-overflow";
		"data-measured"?: "";
		"data-line-count": string;
		"data-hidden-count": string;
		"data-empty"?: "";
		class: string;
		style: string;
	} & Record<string, unknown>;

	type BadgeOverflowOwnProps<T> = {
		/**
		 * Array of items to display as badges.
		 *
		 * ```svelte
		 * items={['Kickflip', 'Heelflip', 'Ollie', 'Pop Shove It']}
		 * ```
		 *
		 * Changing the array re-runs measurement, so a consumer can own add/remove state freely.
		 */
		items: T[];
		/**
		 * Maximum number of lines to display badges across.
		 *
		 * @default 1
		 */
		lineCount?: number;
		/**
		 * Render snippet for each badge item. Replaces upstream's `renderBadge` render prop.
		 *
		 * ```svelte
		 * {#snippet badge(item, label)}
		 * 	<Badge>{label}</Badge>
		 * {/snippet}
		 * ```
		 *
		 * Must render exactly one element: measurement indexes the row's children, which is
		 * upstream's own contract for `renderBadge`.
		 */
		badge: Snippet<[item: T, label: string]>;
		/**
		 * Render snippet for the overflow indicator badge. Replaces upstream's `renderOverflow`
		 * render prop. When omitted, the built-in `BadgeOverflow.Indicator` renders `+{count}`.
		 *
		 * ```svelte
		 * {#snippet overflow(count)}
		 * 	<Badge>+{count}</Badge>
		 * {/snippet}
		 * ```
		 */
		overflow?: Snippet<[count: number]>;
		/**
		 * Render the container onto your own element instead of the default `<div>`. The snippet
		 * receives the merged props to spread onto that element, plus the generated `content` to
		 * render inside it.
		 *
		 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. `content` is
		 * part of the payload because this component generates its own children — a `props`-only
		 * payload would render an empty container. In `child` mode `ref` stays `null`; the snippet
		 * must render exactly one element, which is what the measurement pass sizes against.
		 */
		child?: Snippet<[{ props: BadgeOverflowChildProps; content: Snippet }]>;
	};

	/**
	 * Props of `<BadgeOverflow>`.
	 *
	 * `getBadgeLabel` is optional for a primitive `T` and required once `T extends object`, matching
	 * upstream's conditional type. The always-present `Partial<GetBadgeLabel<T>>` member is what
	 * keeps the prop destructurable inside the component while `T` is still a bare type parameter.
	 *
	 * `children` is absent on purpose: the container's content is entirely component-derived.
	 *
	 * The immediate container must resolve to a definite width for the overflow calculation to have
	 * anything to measure against — upstream's own documented prerequisite, carried over as
	 * documentation rather than as a runtime guard.
	 */
	export type BadgeOverflowRootProps<T = string> = WithoutChildren<
		WithElementRef<HTMLAttributes<HTMLDivElement>>
	> &
		BadgeOverflowOwnProps<T> &
		Partial<GetBadgeLabel<T>> &
		(T extends object ? GetBadgeLabel<T> : object);

	/** Upstream-parity alias of {@link BadgeOverflowRootProps}. */
	export type BadgeOverflowProps<T = string> = BadgeOverflowRootProps<T>;

	/**
	 * In `child` mode the visible container belongs to the caller, so it is located as the
	 * measurement row's next element sibling.
	 */
	function resolveChildContainer(measureRow: HTMLElement): HTMLElement | null {
		const sibling = measureRow.nextElementSibling;
		return sibling instanceof HTMLElement ? sibling : null;
	}
</script>

<script lang="ts" generics="T">
	import BadgeOverflowIndicator from "./badge-overflow-indicator.svelte";
	import {
		BadgeOverflowState,
		DEFAULT_LINE_COUNT,
		observeResize,
		OVERFLOW_SAMPLE_COUNT,
	} from "./badge-overflow.svelte.js";

	let {
		ref = $bindable(null),
		items,
		getBadgeLabel,
		lineCount = DEFAULT_LINE_COUNT,
		badge,
		overflow,
		child,
		class: className,
		style,
		...restProps
	}: BadgeOverflowRootProps<T> = $props();

	let measureEl = $state<HTMLDivElement | null>(null);

	const overflowState = new BadgeOverflowState<T>({
		getItems: () => items,
		getGetBadgeLabel: () => getBadgeLabel,
		getLineCount: () => lineCount,
	});

	$effect(() => {
		const measureRow = measureEl;
		if (!measureRow) return;

		const root = child ? resolveChildContainer(measureRow) : ref;
		if (!root) return;

		// `measure()` reads `items` and `getBadgeLabel` through the state's getters, so this effect
		// re-runs whenever either changes. It writes only the six measured metrics, which
		// nothing in its own read set touches — hence no loop and no `untrack()`. The pass runs in
		// `$effect`, not `$effect.pre`, because it reads the layout of the already-rendered
		// measurement row. `observeResize` is SSR-guarded and its teardown disconnects the observer.
		overflowState.measure(root, measureRow);

		return observeResize(root, () => overflowState.measure(root, measureRow));
	});

	const containerStyle = $derived(
		`gap: ${overflowState.badgeGap}px;` +
			(overflowState.isMeasured ? "" : `min-height: ${overflowState.placeholderHeight}px;`) +
			(style ?? ""),
	);

	// Built once and shared by both branches, so a `child` element is styled and wired exactly like
	// the default `<div>`. `class` and `style` can never arrive through `restProps` — they are
	// destructured out — so the computed values always win, matching upstream's
	// `{...rootProps} className={cn(...)} style={{ gap, ...style }}`.
	const rootAttrs = $derived({
		"data-slot": "badge-overflow",
		"data-measured": overflowState.isMeasured ? "" : undefined,
		"data-line-count": String(overflowState.lineCount),
		"data-hidden-count": String(overflowState.hiddenCount),
		"data-empty": overflowState.isEmpty ? "" : undefined,
		...restProps,
		class: cn("flex flex-wrap", className),
		style: containerStyle,
	} as BadgeOverflowChildProps);
</script>

{#snippet content()}
	{#if overflowState.isMeasured}
		{#each overflowState.visibleEntries as entry, index (index)}
			{@render badge(entry.item, entry.label)}
		{/each}
		{#if overflowState.hiddenCount > 0}
			{#if overflow}
				{@render overflow(overflowState.hiddenCount)}
			{:else}
				<BadgeOverflowIndicator count={overflowState.hiddenCount} />
			{/if}
		{/if}
	{:else}
		{#each overflowState.placeholderEntries as entry, index (index)}
			{@render badge(entry.item, entry.label)}
		{/each}
	{/if}
{/snippet}

<div
	bind:this={measureEl}
	data-slot="badge-overflow-measure"
	aria-hidden="true"
	class="pointer-events-none invisible absolute flex flex-wrap"
	style="gap: {overflowState.badgeGap}px;"
>
	{#each overflowState.entries as entry, index (index)}
		{@render badge(entry.item, entry.label)}
	{/each}
	{#if overflow}
		{@render overflow(OVERFLOW_SAMPLE_COUNT)}
	{:else}
		<BadgeOverflowIndicator count={OVERFLOW_SAMPLE_COUNT} />
	{/if}
</div>
{#if child}
	{@render child({ props: rootAttrs, content })}
{:else}
	<div bind:this={ref} {...rootAttrs}>
		{@render content()}
	</div>
{/if}
