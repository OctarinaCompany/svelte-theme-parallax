<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import LinkIcon from "@lucide/svelte/icons/link";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		COPY_BUTTON_COPIED_CLASSES,
		COPY_BUTTON_SWAP_DURATION,
		CopyButtonState,
		DEFAULT_COPY_BUTTON_TIMEOUT,
		copyButtonIconSwap,
	} from "$lib/components/ui/copy-button/index.js";
	import { useReducedMotion } from "$lib/shared/reduced-motion.svelte.js";
	import { cn } from "$lib/utils.js";

	/**
	 * The control beside a section heading: a link to the section that also copies its address.
	 *
	 * ONE CONTROL THAT IS BOTH, not a copy button and not a bare link. A `<button>` alone would
	 * leave the address bar untouched and give the reader no way to confirm that what they copied
	 * works; a plain `<a>` alone puts nothing on the clipboard, which on a phone is the whole
	 * difficulty. So it is an `<a href>` — Button renders one when `href` is set, so the variant,
	 * the size and the focus ring arrive for free — and an unmodified primary click ALSO writes the
	 * absolute URL, with the kit's own receipt. Navigation is never prevented: the `href` is a
	 * same-document fragment, so the address bar, the history entry, the scroll and `:target` are
	 * all the browser's own work.
	 *
	 * NOT `ui/copy-button`. Its props type omits `href` on purpose ("a copy button is never a
	 * link"), and widening a published component for a gallery affordance is the wrong blast
	 * radius. The state machine, the icon swap and the receipt classes are exported from its module
	 * for exactly this kind of reuse, so they are composed here instead of forked.
	 *
	 * `variant="ghost"` with `size="icon-xs"`: 24px is the smallest rung of the ramp
	 * (`CONVENTIONS.md` §3) and the only one that can sit in a heading row without growing it —
	 * `text-xl` leads at 1.1 in `src/app.css`, so the line box is 22px and the caller takes the
	 * remaining 2px back with `-my-px`. It also meets the 24px minimum WCAG 2.2 SC 2.5.8 asks of a
	 * target. No cursor class: an `<a href>` already computes `pointer` (§8).
	 *
	 * A link glyph rather than `#`: the element genuinely is a link, and the octothorpe stopped
	 * being this site's vernacular the day the router left the fragment.
	 */
	let {
		href,
		label,
		class: className,
	}: {
		/** The section's fragment, `#` included — a same-document link, never a full URL. */
		href: string;
		/** The accessible name. The only content is an `aria-hidden` icon, so this IS the name. */
		label: string;
		class?: string;
	} = $props();

	const reducedMotion = useReducedMotion();

	const state = new CopyButtonState({
		// Absolute, and resolved at click time: the pasted link has to work from anywhere, and the
		// document's own path differs between the dev server and the deployed site.
		getValue: () => () => new URL(href, window.location.href).href,
		getTimeout: () => DEFAULT_COPY_BUTTON_TIMEOUT,
		// "Link copied", not the default "Copied": the thing copied is a link, and the live region
		// is the only place that says what happened.
		getCopiedLabel: () => "Link copied",
		getErrorLabel: () => "Copy failed",
	});

	// Cancels the receipt timer and invalidates a write still in flight when the section unmounts.
	$effect(() => () => state.destroy());

	// Reduced motion collapses the swap to one frame rather than removing it: the receipt is
	// information, not decoration, so it still appears.
	const swapParams = $derived({ duration: reducedMotion.current ? 0 : COPY_BUTTON_SWAP_DURATION });

	/**
	 * Unmodified primary click only. Ctrl-, meta-, shift- and alt-click are the browser's own
	 * affordances on a link — new tab, new window, download — and keep their meaning; a middle
	 * click arrives as `auxclick` and never reaches this handler. Nothing is prevented.
	 */
	function onclick(event: MouseEvent) {
		if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
			return;
		}
		void state.copy();
	}
</script>

<!--
	`data-copied` is what the caller's reveal classes key on. The control is revealed by hovering
	its heading, and a reader who clicks it and then moves the pointer away would otherwise see the
	receipt disappear mid-animation — the confirmation they clicked for, cut off by the gesture
	that follows every click.
-->
<Button
	{href}
	variant="ghost"
	size="icon-xs"
	aria-label={label}
	data-slot="section-anchor"
	data-copied={state.copied ? "" : undefined}
	data-motion={reducedMotion.current ? "reduce" : undefined}
	class={cn(
		"shrink-0 text-muted-foreground transition-opacity",
		state.copied && COPY_BUTTON_COPIED_CLASSES,
		className,
	)}
	{onclick}
>
	<!-- The same stacked grid as `ui/copy-button`, for the same reason: both glyphs share one cell. -->
	<span aria-hidden="true" class="grid place-items-center">
		{#key state.phase}
			<span
				class="col-start-1 row-start-1 flex items-center justify-center"
				in:copyButtonIconSwap={swapParams}
				out:copyButtonIconSwap={swapParams}
			>
				{#if state.phase === "copied"}
					<CheckIcon />
				{:else}
					<LinkIcon />
				{/if}
			</span>
		{/key}
	</span>
</Button>

<!-- Outside the link: a link's descendants are presentational, so a live region inside it is not reliably announced. -->
<span class="sr-only" role="status" aria-live="polite">{state.announcement}</span>
