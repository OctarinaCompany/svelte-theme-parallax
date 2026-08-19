<script lang="ts" module>
	import { cn } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { UniqueIdentifier } from "./sortable-geometry.js";

	export type SortableOverlayProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
		/**
		 * Where the floating preview is portalled to — an element, a CSS selector, or a
		 * `DocumentFragment`. `null` means the default.
		 *
		 * @default document.body
		 */
		container?: Element | DocumentFragment | string | null;
		/**
		 * The preview's content. Covers both upstream forms: a plain snippet for a fixed preview, and
		 * `{#snippet children({ value })}` for content driven by the active item's identifier.
		 */
		children?: Snippet<[{ value: UniqueIdentifier }]>;
	};

	/** `DocumentFragment` is undefined on the server, so the guard has to check for it first. */
	function isDocumentFragment(value: unknown): value is DocumentFragment {
		return typeof DocumentFragment !== "undefined" && value instanceof DocumentFragment;
	}
</script>

<script lang="ts">
	import { Portal } from "bits-ui";
	import { untrack } from "svelte";

	import { translate3d } from "./sortable-geometry.js";
	import { getSortableContext, setSortableOverlayContext } from "./sortable.svelte.js";

	let { container, class: className, children, ...restProps }: SortableOverlayProps = $props();

	const root = getSortableContext("Sortable.Overlay");

	// Lets a `<Sortable.Item>` render inside the preview, as the primitive-values demo does.
	setSortableOverlayContext();

	// While an overlay is mounted the drag source stays put and the preview is what follows the
	// pointer. The write is untracked because it reads the same field it writes.
	$effect(() => {
		untrack(() => (root.overlayCount += 1));
		return () => untrack(() => (root.overlayCount -= 1));
	});

	const fragment = $derived(isDocumentFragment(container) ? container : null);
	const elementTarget = $derived(
		isDocumentFragment(container) ? undefined : (container ?? undefined),
	);

	/**
	 * `bits-ui`'s `PortalTarget` is `Element | string`, while upstream's `container` is
	 * `Element | DocumentFragment | null`. A `display: contents` host appended to the fragment bridges
	 * the gap while `bits-ui` still performs the mount — the same five lines as
	 * `action-bar-portal.svelte`.
	 */
	let fragmentHost = $state<HTMLElement | null>(null);

	$effect(() => {
		const target = fragment;
		if (!target) return;

		const host = document.createElement("div");
		host.style.display = "contents";
		host.setAttribute("data-slot", "sortable-overlay-host");
		target.appendChild(host);
		fragmentHost = host;

		return () => {
			host.remove();
			fragmentHost = null;
		};
	});

	const activeId = $derived(root.activeId);
	const rect = $derived(root.getOverlayRect());

	const overlayStyle = $derived(
		rect
			? `position: fixed; top: ${rect.top}px; left: ${rect.left}px; width: ${rect.width}px; height: ${rect.height}px; transform: ${translate3d(root.getOverlayTransform()) ?? "none"};`
			: undefined,
	);

	const overlayAttrs = $derived({
		"data-slot": "sortable-overlay",
		"data-dragging": "",
		"data-flat-cursor": root.flatCursor ? "" : undefined,
		"aria-hidden": "true" as const,
		...restProps,
		style: overlayStyle,
		class: cn("pointer-events-none z-50", !root.flatCursor && "cursor-grabbing", className),
	});
</script>

{#snippet preview(value: UniqueIdentifier)}
	<div {...overlayAttrs}>
		{@render children?.({ value })}
	</div>
{/snippet}

{#if activeId !== null}
	{#if fragment}
		{#if fragmentHost}
			<Portal to={fragmentHost}>
				{@render preview(activeId)}
			</Portal>
		{/if}
	{:else}
		<Portal to={elementTarget}>
			{@render preview(activeId)}
		</Portal>
	{/if}
{/if}
