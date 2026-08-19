<script lang="ts" module>
	import type { Snippet } from "svelte";

	export type SelectionToolbarPortalProps = {
		/**
		 * Where the surface is portalled to — an element, a CSS selector, or a `DocumentFragment`.
		 *
		 * @default document.body
		 */
		to?: Element | DocumentFragment | string | null;
		/** Normally a `<SelectionToolbar>` surface. */
		children?: Snippet;
	};

	/** `DocumentFragment` is undefined on the server, so the guard has to check for it first. */
	function isDocumentFragment(value: unknown): value is DocumentFragment {
		return typeof DocumentFragment !== "undefined" && value instanceof DocumentFragment;
	}
</script>

<script lang="ts">
	import { Portal } from "bits-ui";

	let { to, children }: SelectionToolbarPortalProps = $props();

	const fragment = $derived(isDocumentFragment(to) ? to : null);
	const elementTarget = $derived(isDocumentFragment(to) ? undefined : (to ?? undefined));

	/**
	 * `bits-ui`'s `PortalTarget` is `Element | string`, and its `portal.svelte` throws a DEV
	 * `TypeError` for anything else — but upstream's `portalContainer` is typed
	 * `Element | DocumentFragment | null`. A `display: contents` host
	 * appended to the fragment bridges the gap while `bits-ui` still performs the mount, keeps
	 * `getAllContexts()` propagation and stays a no-op outside the browser.
	 */
	let fragmentHost = $state<HTMLElement | null>(null);

	$effect(() => {
		const target = fragment;
		if (!target) return;

		const host = document.createElement("div");
		host.style.display = "contents";
		host.setAttribute("data-slot", "selection-toolbar-portal-host");
		target.appendChild(host);
		fragmentHost = host;

		return () => {
			host.remove();
			fragmentHost = null;
		};
	});
</script>

{#if fragment}
	{#if fragmentHost}
		<Portal to={fragmentHost}>
			{@render children?.()}
		</Portal>
	{/if}
{:else}
	<Portal to={elementTarget}>
		{@render children?.()}
	</Portal>
{/if}
