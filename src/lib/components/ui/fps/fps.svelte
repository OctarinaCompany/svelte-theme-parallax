<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";
	import type { FpsPosition, FpsStrategy } from "./fps.svelte.js";

	export type FpsProps = WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		/**
		 * `fixed` pins the chip to the viewport and portals it out; `absolute` leaves it in place,
		 * positioned against the nearest positioned ancestor.
		 *
		 * @default "fixed"
		 */
		strategy?: FpsStrategy;
		/** Which corner of the positioning context. @default "top-right" */
		position?: FpsPosition;
		/** Optional caption before the number, rendered muted. */
		label?: string;
		/** How often the reading is republished, in milliseconds. @default 500 */
		updateInterval?: number;
		/** Below this the chip turns to the warning ink. @default 30 */
		warningThreshold?: number;
		/** Below this it turns to the destructive ink. @default 20 */
		destructiveThreshold?: number;
		/**
		 * Where a `fixed` chip is portalled to. Ignored when `strategy` is `absolute`.
		 *
		 * @default document.body
		 */
		portalContainer?: Element | DocumentFragment | string | null;
		/**
		 * Render and measure at all.
		 *
		 * @default true
		 */
		enabled?: boolean;
	};

	/** `DocumentFragment` is undefined on the server, so the guard has to check for it first. */
	function isDocumentFragment(value: unknown): value is DocumentFragment {
		return typeof DocumentFragment !== "undefined" && value instanceof DocumentFragment;
	}
</script>

<script lang="ts">
	import { Portal } from "bits-ui";
	import {
		DEFAULT_FPS_DESTRUCTIVE_THRESHOLD,
		DEFAULT_FPS_UPDATE_INTERVAL,
		DEFAULT_FPS_WARNING_THRESHOLD,
		FpsState,
		fpsVariants,
		resolveFpsStatus,
	} from "./fps.svelte.js";

	/**
	 * A frames-per-second readout.
	 *
	 * WHAT IT IS FOR — watching whether an interaction on the page still runs at frame rate while
	 * you drag, scroll or open something. It is a development instrument, which is why it is
	 * `aria-hidden`: a number changing twice a second is noise to a screen reader, and it describes
	 * the page's machinery rather than its content.
	 *
	 * THE MEASUREMENT IS THE CATCH. A `requestAnimationFrame` loop does not observe the frame rate
	 * so much as participate in it — the counter is itself work the browser has to fit into each
	 * frame. It is accurate enough to see a jank cliff and never precise enough to quote.
	 *
	 * TWO DELIBERATE EDITS from upstream:
	 * - The `mounted` state that gates the portal (`fps.tsx:61`, `:70`) is dropped. It exists to
	 *   keep React's server render from reaching for `document.body`; `bits-ui`'s `Portal` is
	 *   already a no-op outside the browser, so the flag would only add a wasted first paint.
	 * - `portalContainer` also accepts a CSS selector, because that is what `Portal` takes and the
	 *   `ActionBar` portal here already accepts. The `DocumentFragment` bridge below is lifted from
	 *   `action-bar-portal.svelte`, where the same mismatch was solved first.
	 */
	let {
		ref = $bindable(null),
		strategy = "fixed",
		position = "top-right",
		label,
		updateInterval = DEFAULT_FPS_UPDATE_INTERVAL,
		warningThreshold = DEFAULT_FPS_WARNING_THRESHOLD,
		destructiveThreshold = DEFAULT_FPS_DESTRUCTIVE_THRESHOLD,
		portalContainer,
		enabled = true,
		class: className,
		...restProps
	}: FpsProps = $props();

	const meter = new FpsState();

	$effect(() => {
		if (!enabled) return;
		return meter.start(updateInterval);
	});

	const status = $derived(resolveFpsStatus(meter.current, warningThreshold, destructiveThreshold));

	/**
	 * An `absolute` chip is never portalled — the whole point of that strategy is to stay inside
	 * the container it was written in, and portalling would move it out of the very positioning
	 * context it is measured against.
	 */
	const portalled = $derived(strategy !== "absolute");
	const fragment = $derived(isDocumentFragment(portalContainer) ? portalContainer : null);
	const elementTarget = $derived(
		isDocumentFragment(portalContainer) ? undefined : (portalContainer ?? undefined),
	);

	let fragmentHost = $state<HTMLElement | null>(null);

	$effect(() => {
		const target = fragment;
		if (!target || !portalled) return;

		const host = document.createElement("div");
		host.style.display = "contents";
		host.setAttribute("data-slot", "fps-portal-host");
		target.appendChild(host);
		fragmentHost = host;

		return () => {
			host.remove();
			fragmentHost = null;
		};
	});
</script>

{#snippet chip()}
	<div
		bind:this={ref}
		aria-hidden="true"
		data-slot="fps"
		data-status={status}
		{...restProps}
		class={cn(fpsVariants({ strategy, position, status }), className)}
	>
		{#if label}
			<span data-slot="fps-label" class="text-muted-foreground">{label}:</span>
		{/if}
		<span data-slot="fps-value">{meter.current}</span>
	</div>
{/snippet}

{#if enabled}
	{#if !portalled}
		{@render chip()}
	{:else if fragment}
		{#if fragmentHost}
			<Portal to={fragmentHost}>{@render chip()}</Portal>
		{/if}
	{:else}
		<Portal to={elementTarget}>{@render chip()}</Portal>
	{/if}
{/if}
