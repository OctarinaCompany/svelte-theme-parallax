<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { LinkPreview as HoverCardPrimitive } from "bits-ui";
	import type { Snippet } from "svelte";
	import type { HTMLButtonAttributes } from "svelte/elements";

	import {
		relativeTimeCardTriggerVariants,
		resolveRelativeTimeCardVariant,
		type RelativeTimeCardVariant,
	} from "./relative-time-card.svelte.js";
	import type { DateInput } from "./relative-time-format.js";

	/**
	 * The seven placement props forwarded untouched to the card. Picked off the composed part's own
	 * props — the same seven names upstream picks off `HoverCardContentProps` (lines 126-136) — so
	 * the two type surfaces cannot drift.
	 */
	export type RelativeTimeCardPositioningProps = Pick<
		HoverCardPrimitive.ContentProps,
		| "side"
		| "sideOffset"
		| "align"
		| "alignOffset"
		| "avoidCollisions"
		| "collisionBoundary"
		| "collisionPadding"
	>;

	/** The merged attribute payload handed to the `child` snippet. */
	export type RelativeTimeCardChildProps = {
		/** Always `"relative-time-card-trigger"`. */
		"data-slot": "relative-time-card-trigger";
		/** The resolved variant. */
		"data-variant": RelativeTimeCardVariant;
		/** Trigger variant classes with the caller's `class` merged last. */
		class: string;
	} & Record<string, unknown>;

	export type RelativeTimeCardProps = WithElementRef<HTMLButtonAttributes, HTMLButtonElement> &
		RelativeTimeCardPositioningProps & {
			/** The instant to display. Upstream `date`. */
			date: DateInput;
			/**
			 * IANA identifiers listed in the card, in order. The viewer's own zone is always appended
			 * as one further row, and duplicates are not removed.
			 *
			 * @default ["UTC"]
			 */
			timezones?: readonly string[];
			/**
			 * How often, in ms, the relative time label is recomputed while mounted.
			 *
			 * @default 1000
			 */
			updateInterval?: number;
			/**
			 * The visual style of the trigger.
			 *
			 * @default "default"
			 */
			variant?: RelativeTimeCardVariant;
			/** Controlled open state. Bindable. */
			open?: boolean;
			/**
			 * Open state the component seeds itself with when uncontrolled.
			 *
			 * @default false
			 */
			defaultOpen?: boolean;
			/** Called whenever the card opens or closes, in both controlled and uncontrolled modes. */
			onOpenChange?: (open: boolean) => void;
			/**
			 * Delay in ms before hovering or focusing the trigger opens the card.
			 *
			 * @default 500
			 */
			openDelay?: number;
			/**
			 * Delay in ms before leaving the trigger closes the card.
			 *
			 * @default 300
			 */
			closeDelay?: number;
			/**
			 * Render the trigger onto your own element instead of the default `<button>`. The snippet
			 * receives the merged props (the hover-card's handlers and ARIA wiring, `class`,
			 * `data-slot`, `data-variant` and every forwarded attribute) to spread onto that element.
			 *
			 * Replaces upstream's `asChild` (Radix `Slot`), which has no Svelte equivalent. In `child`
			 * mode `children` is not rendered and `ref` is not populated — the caller owns the element.
			 */
			child?: Snippet<[{ props: RelativeTimeCardChildProps }]>;
		};
</script>

<script lang="ts">
	import * as HoverCard from "$lib/components/ui/hover-card/index.js";

	import RelativeTimeCardTimezone from "./relative-time-card-timezone.svelte";
	import {
		DEFAULT_CLOSE_DELAY,
		DEFAULT_OPEN_DELAY,
		DEFAULT_TIMEZONES,
		DEFAULT_UPDATE_INTERVAL,
		RelativeTimeCardState,
		useSupportsHover,
	} from "./relative-time-card.svelte.js";
	import { resolveLocale, toDate } from "./relative-time-format.js";

	let {
		ref = $bindable(null),
		date,
		timezones = DEFAULT_TIMEZONES,
		updateInterval = DEFAULT_UPDATE_INTERVAL,
		variant = "default",
		open = $bindable(),
		defaultOpen = false,
		onOpenChange,
		openDelay = DEFAULT_OPEN_DELAY,
		closeDelay = DEFAULT_CLOSE_DELAY,
		side,
		sideOffset,
		align,
		alignOffset,
		avoidCollisions,
		collisionBoundary,
		collisionPadding,
		class: className,
		children,
		child,
		...restProps
	}: RelativeTimeCardProps = $props();

	// Uncontrolled: seed once from `defaultOpen`. Controlled: the parent's binding wins.
	// svelte-ignore state_referenced_locally
	open ??= defaultOpen;

	const locale = resolveLocale();

	const resolvedVariant = $derived(resolveRelativeTimeCardVariant(variant));
	const parsedDate = $derived(toDate(date));

	const state = new RelativeTimeCardState({
		getDate: () => parsedDate,
		getLocale: () => locale,
		getUpdateInterval: () => updateInterval,
	});

	const hover = useSupportsHover();

	// The interval is created here and cleared by this teardown — nowhere else. Changing
	// `updateInterval` re-runs the effect, so the old timer is always cleared first.
	$effect(() => state.startTicker());

	/**
	 * The hover-card trigger opens on `:focus-visible`, so once `Escape` has closed the card with
	 * focus still on the trigger nothing would reopen it. `Enter` does — that is the interaction the
	 * upstream MDX documents. `preventDefault()` is deliberately not called, so native button
	 * activation and the caller's own `onkeydown` both still happen.
	 */
	function handleKeydown(
		event: KeyboardEvent & { currentTarget: EventTarget & HTMLButtonElement },
	) {
		restProps.onkeydown?.(event);

		if (event.key !== "Enter" || open) return;

		open = true;
		onOpenChange?.(true);
	}

	/**
	 * Deliberate divergence from upstream (see {@link useSupportsHover}): where the primary
	 * pointer cannot hover at all, a tap toggles the card instead of doing nothing. Wherever hover
	 * already works this is a no-op, so a real pointer tap on the trigger never fights the
	 * hover-open state by immediately re-closing what hover just opened.
	 *
	 * Bound to `pointerup` rather than `click`: activating a focused button with Enter dispatches
	 * a `click` with no preceding pointer event (`handleKeydown`'s own Enter case already opens
	 * it), and a `click` handler here would then immediately re-toggle that back closed.
	 * `pointerup` only ever fires for a genuine pointer interaction, so keyboard activation can
	 * never reach it.
	 */
	function handlePointerUp(
		event: PointerEvent & { currentTarget: EventTarget & HTMLButtonElement },
	) {
		restProps.onpointerup?.(event);
		if (event.defaultPrevented || hover.current) return;

		open = !open;
		onOpenChange?.(open);
	}

	const triggerAttrs: RelativeTimeCardChildProps = $derived({
		type: "button",
		"data-slot": "relative-time-card-trigger",
		"data-variant": resolvedVariant,
		"data-invalid": state.isValid ? undefined : "",
		...restProps,
		class: cn(relativeTimeCardTriggerVariants({ variant: resolvedVariant }), className),
		onkeydown: handleKeydown,
		onpointerup: handlePointerUp,
	});
</script>

{#snippet hoverCardTrigger({ props }: { props: Record<string, unknown> })}
	{@const merged = { ...props, ...triggerAttrs }}
	{#if child}
		{@render child({ props: merged })}
	{:else}
		<button bind:this={ref} {...merged}>
			{#if children}
				{@render children()}
			{:else}
				<time datetime={state.isoString}>{state.absoluteLabel}</time>
			{/if}
		</button>
	{/if}
{/snippet}

<HoverCard.Root bind:open {onOpenChange} {openDelay} {closeDelay}>
	<!--
		Rendered through the hover card's own `child` snippet so the trigger stays this component's
		`<button>` (bits would otherwise render an `<a>`). The snippet's props carry bits' handlers,
		`data-state` and the whole ARIA wiring, and are spread first so this component's own
		attributes — and then the caller's — win.
	-->
	<HoverCard.Trigger child={hoverCardTrigger} />
	<HoverCard.Content
		data-slot="relative-time-card-content"
		{side}
		{sideOffset}
		{align}
		{alignOffset}
		{avoidCollisions}
		{collisionBoundary}
		{collisionPadding}
		class="flex w-full max-w-[420px] flex-col gap-2 p-3"
	>
		<time
			data-slot="relative-time-card-value"
			datetime={state.isoString}
			class="text-sm text-muted-foreground"
		>
			{state.relativeLabel}
		</time>
		<div data-slot="relative-time-card-timezones" role="list" class="flex flex-col gap-1">
			<!-- Index-keyed on purpose: duplicates in `timezones` must render as separate rows rather
			     than crash with `each_key_duplicate`. -->
			{#each timezones as timezone, index (index)}
				<RelativeTimeCardTimezone role="listitem" date={parsedDate} {timezone} />
			{/each}
			<RelativeTimeCardTimezone role="listitem" date={parsedDate} />
		</div>
	</HoverCard.Content>
</HoverCard.Root>
