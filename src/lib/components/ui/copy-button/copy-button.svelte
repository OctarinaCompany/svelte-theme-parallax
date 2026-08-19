<script lang="ts" module>
	import { cn, type WithoutChildren } from "$lib/utils.js";
	import type { ButtonProps } from "$lib/components/ui/button/index.js";
	import type { CopyButtonValue } from "./copy-button.svelte.js";

	/**
	 * `href` is omitted because a copy button is never a link — dropping it is what lets the click
	 * handler below be typed for a `<button>` and nothing else. `value` is omitted because it
	 * collides: on `<button>` it is the value submitted with the form, which a `type="button"` control
	 * never sends, and here it is the far more useful thing.
	 */
	export type CopyButtonProps = Omit<WithoutChildren<ButtonProps>, "href" | "value"> & {
		/** The text to write, or a producer for it. */
		value: CopyButtonValue;
		/**
		 * Visible text beside the icon. Omitted, the button is icon-only and names itself `"Copy"`.
		 * Never changes while the receipt is up — see the note on the swap below.
		 */
		label?: string;
		/**
		 * What the live region announces once the write resolves. Announced, not displayed.
		 * @default "Copied"
		 */
		copiedLabel?: string;
		/**
		 * What the live region announces when the clipboard refuses.
		 * @default "Copy failed"
		 */
		errorLabel?: string;
		/**
		 * How long the receipt stays up, in ms.
		 * @default 2000
		 */
		timeout?: number;
		/** Fired with the text that was written, after `writeText` has RESOLVED. */
		onCopy?: (text: string) => void;
		/** Fired with whatever `writeText` or the producer threw. */
		onCopyError?: (error: unknown) => void;
	};

	/** The accessible name an icon-only copy button gives itself. */
	export const DEFAULT_COPY_BUTTON_LABEL = "Copy";
</script>

<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import CopyIcon from "@lucide/svelte/icons/copy";
	import type { MouseEventHandler } from "svelte/elements";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Spinner } from "$lib/components/ui/spinner/index.js";
	import { useReducedMotion } from "$lib/shared/reduced-motion.svelte.js";
	import {
		COPY_BUTTON_COPIED_CLASSES,
		COPY_BUTTON_SWAP_DURATION,
		CopyButtonState,
		DEFAULT_COPY_BUTTON_TIMEOUT,
		copyButtonIconSwap,
	} from "./copy-button.svelte.js";

	/**
	 * A button that writes text to the clipboard and shows a receipt.
	 *
	 * NOT A BUTTON VARIANT. It owns state — an in-flight write, a timer, a copied flag — and
	 * `CONVENTIONS.md` §1 keeps hand-maintained ports in the ported tier, which the registry's Button
	 * is not. It composes Button rather than restating it, so every variant, size and focus ring
	 * arrives for free.
	 *
	 * THERE IS NO `theme` PROP. A per-component `theme?: 'light' | 'dark'` prop is tempting;
	 * this kit themes through the `dark` class and the tokens in `src/app.css`, and a
	 * theme prop would be a second source of truth that could disagree with the document.
	 *
	 * NO `child` SNIPPET, unlike `ui/swap`. What a caller would want from this component is the icon
	 * swap, and the swap is the content of the button — an element the caller rendered would receive
	 * the click wiring and the receipt classes but none of the animation, which is the part they came
	 * for. `variant`, `size`, `class` and the forwarded attributes cover the rest.
	 */
	let {
		ref = $bindable(null),
		value,
		label,
		copiedLabel = "Copied",
		errorLabel = "Copy failed",
		timeout = DEFAULT_COPY_BUTTON_TIMEOUT,
		onCopy,
		onCopyError,
		// `outline` rather than Button's own `default`, matching `ui/json-viewer`'s copy control: this
		// sits beside the thing it copies, and a primary-filled button would outrank it. Upstream's
		// resting grey chip is closest to `secondary` for anyone who wants it.
		variant = "outline",
		size,
		class: className,
		onclick: onclickProp,
		"aria-label": ariaLabel,
		...restProps
	}: CopyButtonProps = $props();

	const reducedMotion = useReducedMotion();

	const state = new CopyButtonState({
		getValue: () => value,
		getTimeout: () => timeout,
		getCopiedLabel: () => copiedLabel,
		getErrorLabel: () => errorLabel,
		onCopy: (text) => onCopy?.(text),
		onCopyError: (error) => onCopyError?.(error),
	});

	// Cancels the receipt timer and invalidates any write still in flight. Without it a button
	// unmounted mid-copy — a row that scrolls out of a virtualised list, a closing dialog — would
	// still fire `onCopy`.
	$effect(() => () => state.destroy());

	/**
	 * `icon` when there is no text, `default` when there is — both the 40px `default` rung (`--control-h-default`) of the
	 * control ramp `CONVENTIONS.md` §3 sets.
	 *
	 * A default rather than a fixed size, so `size` still overrides it. It has to be derived because
	 * the two ramps are different shapes: `icon-*` is square and the rest carries horizontal padding,
	 * so a single default would give one of the two forms the other's proportions.
	 */
	const resolvedSize = $derived(size ?? (label === undefined ? "icon" : "default"));

	/**
	 * The name stays PUT while the receipt is up.
	 *
	 * Icon-only mode has no text to name the control, so the component supplies one. The labelled
	 * form is already named by its own text and gets no second, competing name.
	 *
	 * `ui/json-viewer`'s toolbar takes the other route — its `aria-label` flips to `"JSON copied"` —
	 * and that is the wrong trade here. A changing accessible name renames the control: a reader who
	 * tabs back a second later hears "Copied" as the name of a button that copies. The state change
	 * is announced by the live region below instead, which leaves the name alone.
	 */
	const accessibleName = $derived(
		ariaLabel ?? (label === undefined ? DEFAULT_COPY_BUTTON_LABEL : undefined),
	);

	/**
	 * `motion-safe:hover:scale-105` — upstream's `whileHover={{scale: 1.08}}`,
	 * rounded to the nearest rung of the Tailwind ramp; Button's base already carries
	 * `transition-all`, so nothing else is needed to animate it. `motion-safe:` rather than
	 * `motion-reduce:` for the same reason `CheckboxPage.svelte` gives: a 5% jump with the transition
	 * switched off is still movement, and the point is to have none.
	 *
	 * NO `active:scale-*`, and upstream's `whileTap={{scale: 0.92}}` is dropped with
	 * it. Button already presses — `active:not-aria-[haspopup]:translate-y-px` in its base — and a
	 * second press language layered on top would make this the one button in the kit that both sinks
	 * and shrinks.
	 */
	const buttonClass = $derived(
		cn("motion-safe:hover:scale-105", state.copied && COPY_BUTTON_COPIED_CLASSES, className),
	);

	// Reduced motion collapses the swap to nothing rather than removing it: the icons still exchange
	// and the receipt still appears, they just do it in one frame.
	const swapParams = $derived({ duration: reducedMotion.current ? 0 : COPY_BUTTON_SWAP_DURATION });

	/**
	 * A caller's own handler runs first, and `preventDefault()` on it cancels the copy — the same
	 * order `ui/swap` and `ui/shake` give a forwarded handler.
	 *
	 * The two types have to differ. `MouseEventHandler<HTMLElement>` is what Button accepts, because
	 * its `onclick` is declared for BOTH the elements it can render and only a handler that takes the
	 * common supertype satisfies the pair. The cast on the way back out is the other half of the same
	 * fact: `href` is omitted from {@link CopyButtonProps}, so the `<a>` branch is unreachable and the
	 * element under the pointer is always a `<button>`.
	 */
	const onclick: MouseEventHandler<HTMLElement> = (event) => {
		onclickProp?.(event as MouseEvent & { currentTarget: EventTarget & HTMLButtonElement });
		if (event.defaultPrevented) return;
		void state.copy();
	};
</script>

<Button
	bind:ref
	{variant}
	size={resolvedSize}
	{...restProps}
	data-slot="copy-button"
	data-copied={state.copied ? "" : undefined}
	data-pending={state.pending ? "" : undefined}
	data-motion={reducedMotion.current ? "reduce" : undefined}
	aria-label={accessibleName}
	aria-busy={state.pending ? "true" : undefined}
	class={buttonClass}
	{onclick}
>
	<!--
		THE STACK IS A GRID, not two absolutely positioned spans. Both icons sit in the same
		`col-start-1 row-start-1` cell, so they overlap and cross in place exactly as upstream's
		`AnimatePresence mode="popLayout"` intends — but the cell is still sized by
		its contents, where absolute positioning would collapse the wrapper and force a hard-coded size
		onto it. Button sizes the icons through `[&_svg:not([class*='size-'])]`, so the cell tracks the
		button's own size ramp without being told about it.

		`aria-hidden` because the swap is decoration — a reader learns nothing from a glyph exchanging
		places, and it also silences `Spinner`, which carries its own `role="status"` and "Loading"
		label for the times it stands alone. There is exactly one announcement here and the live region
		below makes it.

		`data-icon` only in the labelled form. It is what triggers Button's
		`has-data-[icon=inline-start]:pl-2`, which tightens the padding on the side the icon is on —
		and in icon-only mode the icon leads nothing, which is why `ui/carousel`'s arrows and
		`ui/json-viewer`'s copy control do not set it either.

		The transitions are LOCAL, which is Svelte's default and the same decision as upstream's
		`initial={false}`: a local transition does not play when an ancestor block
		is created, so the button does not animate its copy icon in on first render.
	-->
	<span
		aria-hidden="true"
		data-icon={label === undefined ? undefined : "inline-start"}
		class="grid place-items-center"
	>
		{#key state.phase}
			<span
				class="col-start-1 row-start-1 flex items-center justify-center"
				in:copyButtonIconSwap={swapParams}
				out:copyButtonIconSwap={swapParams}
			>
				{#if state.phase === "copied"}
					<CheckIcon />
				{:else if state.phase === "pending"}
					<Spinner />
				{:else}
					<CopyIcon />
				{/if}
			</span>
		{/key}
	</span>
	{#if label !== undefined}
		<!--
			The visible text does NOT become "Copied". Swapping it would change the button's width
			mid-animation, which is the reflow the stacked icons exist to avoid; the check mark and the
			success ground already carry the receipt. `copiedLabel` is spent on the announcement below,
			where it costs no layout.
		-->
		<span>{label}</span>
	{/if}
</Button>

<!--
	The receipt, said out loud. Outside the button on purpose: ARIA treats a button's descendants as
	presentational, so a live region nested inside one is not reliably announced.

	No `data-slot` here, and that is deliberate rather than an omission — `ButtonGroup` rounds its
	last child with `[&>[data-slot]:not(:has(~[data-slot]))]`, so a slotted sibling would steal the
	rounding from the button it belongs to. `sr-only` is absolutely positioned, so it is out of flow
	and never becomes a flex or grid item either.
-->
<span class="sr-only" role="status" aria-live="polite">{state.announcement}</span>
