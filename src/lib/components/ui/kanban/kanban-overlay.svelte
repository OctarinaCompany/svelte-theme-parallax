<script lang="ts" module>
	import { cn } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	import type { UniqueIdentifier } from "$lib/components/ui/sortable/index.js";

	import type { KanbanOverlayVariant } from "./kanban.svelte.js";

	export type KanbanOverlayProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
		/**
		 * Where the floating preview is portalled to — an element, a CSS selector, or a
		 * `DocumentFragment`. `null` means the default.
		 *
		 * @default document.body
		 */
		container?: Element | DocumentFragment | string | null;
		/**
		 * The preview's content. Covers both upstream forms: a plain snippet for a fixed preview, and
		 * `{#snippet children({ value, variant })}` for content driven by what is being dragged.
		 */
		children?: Snippet<[{ value: UniqueIdentifier; variant: KanbanOverlayVariant }]>;
	};

	/** `DocumentFragment` is undefined on the server, so the guard has to check for it first. */
	function isDocumentFragment(value: unknown): value is DocumentFragment {
		return typeof DocumentFragment !== "undefined" && value instanceof DocumentFragment;
	}
</script>

<script lang="ts">
	import { Portal } from "bits-ui";
	import { untrack } from "svelte";

	import { translate3d } from "$lib/components/ui/sortable/index.js";

	import { getKanbanContext, setKanbanOverlayContext } from "./kanban.svelte.js";

	let { container, class: className, children, ...restProps }: KanbanOverlayProps = $props();

	const root = getKanbanContext("Kanban.Overlay");

	// Lets a `<Kanban.Column>` or `<Kanban.Item>` render inside the preview as an inert copy, which
	// is what the dynamic-overlay demo composes.
	setKanbanOverlayContext();

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
	 * the gap while `bits-ui` still performs the mount.
	 */
	let fragmentHost = $state<HTMLElement | null>(null);

	$effect(() => {
		const target = fragment;
		if (!target) return;

		const host = document.createElement("div");
		host.style.display = "contents";
		host.setAttribute("data-slot", "kanban-overlay-host");
		target.appendChild(host);
		fragmentHost = host;

		return () => {
			host.remove();
			fragmentHost = null;
		};
	});

	// The session's subject while the drag runs, then the drop flight's until the preview lands —
	// which is what keeps the preview mounted for its drop animation instead of vanishing at the
	// pointer the instant the session closes.
	const overlayId = $derived(root.overlayId);
	const variant = $derived<KanbanOverlayVariant>(
		overlayId !== null && root.isColumn(overlayId) ? "column" : "item",
	);
	const rect = $derived(root.getOverlayRect());
	const transition = $derived(root.getOverlayTransition());

	const overlayStyle = $derived(
		rect
			? `position: fixed; top: ${rect.top}px; left: ${rect.left}px; width: ${rect.width}px; height: ${rect.height}px; transform: ${translate3d(root.getOverlayTransform()) ?? "none"};${transition ? ` transition: ${transition};` : ""}`
			: undefined,
	);

	const overlayAttrs = $derived({
		"data-slot": "kanban-overlay",
		"data-dragging": "",
		"data-variant": variant,
		"data-flat-cursor": root.flatCursor ? "" : undefined,
		"aria-hidden": "true" as const,
		...restProps,
		style: overlayStyle,
		class: cn("pointer-events-none z-50", !root.flatCursor && "cursor-grabbing", className),
	});
</script>

{#snippet preview(value: UniqueIdentifier)}
	<div {...overlayAttrs}>
		{@render children?.({ value, variant })}
	</div>
{/snippet}

{#if overlayId !== null}
	{#if fragment}
		{#if fragmentHost}
			<Portal to={fragmentHost}>
				{@render preview(overlayId)}
			</Portal>
		{/if}
	{:else}
		<Portal to={elementTarget}>
			{@render preview(overlayId)}
		</Portal>
	{/if}
{/if}
