import { tv } from "tailwind-variants";

/**
 * Component-agnostic mechanics of a floating surface docked to a viewport edge: the inline style
 * that pins it, the enter/exit transition recipe, and the `Escape` dismisser.
 *
 * Nothing here imports an `action-bar-*` part — the dependency arrow points parts → this module,
 * never back — so the next port (`selection-toolbar`) composes these instead of duplicating them.
 * The names are deliberately `Floating*`, not `ActionBar*`.
 */

/** Every value `side` accepts. Upstream `ActionBarProps["side"]`. */
export const FLOATING_SIDES = ["top", "bottom"] as const;
export type FloatingSide = (typeof FLOATING_SIDES)[number];

/** Every value `align` accepts. Upstream `ActionBarProps["align"]` (116). */
export const FLOATING_ALIGNMENTS = ["start", "center", "end"] as const;
export type FloatingAlign = (typeof FLOATING_ALIGNMENTS)[number];

/** Every value `orientation` accepts. Upstream `Orientation` (25). */
export const FLOATING_ORIENTATIONS = ["horizontal", "vertical"] as const;
export type FloatingOrientation = (typeof FLOATING_ORIENTATIONS)[number];

/** Distance from the docked viewport edge, in px. Upstream default (134). */
export const DEFAULT_SIDE_OFFSET = 16;

/** Distance from the aligned viewport edge, in px. Upstream default (132). */
export const DEFAULT_ALIGN_OFFSET = 0;

export type ViewportEdgeStyleOptions = {
	readonly side: FloatingSide;
	readonly sideOffset: number;
	readonly align: FloatingAlign;
	readonly alignOffset: number;
};

/**
 * The declarations that pin a `position: fixed` surface to a viewport edge, as a `style` string.
 *
 * A verbatim translation of upstream's inline style object. The anchor is
 * the viewport rather than a trigger element, which is why no `bits-ui` positioner fits: every one
 * of them measures a placement against an anchor element.
 *
 * `left`/`right` are physical on purpose — upstream does not use logical `inset-inline-*`, so
 * `align="start"` stays visually left-anchored under `dir="rtl"`; only keyboard navigation inverts.
 */
export function getViewportEdgeStyle({
	side,
	sideOffset,
	align,
	alignOffset,
}: ViewportEdgeStyleOptions): string {
	const edge = `${side}: ${sideOffset}px;`;
	switch (align) {
		case "center":
			return `${edge} left: 50%; translate: -50% 0;`;
		case "start":
			return `${edge} left: ${alignOffset}px;`;
		case "end":
			return `${edge} right: ${alignOffset}px;`;
	}
}

/**
 * Chrome and transition of a floating surface. Upstream's class list,
 * with the mirrored `data-[state=closed]` half added so a consumer that keeps the surface mounted
 * while closing gets a real exit animation, and with `text-card-foreground text-sm` pairing the
 * `bg-card` fill — the surface portals to `document.body`, so like the kit's other floating
 * surfaces (`popover-content.svelte`) it must set its own text colour and size rather than
 * inherit the page's.
 *
 * `ActionBar` itself never renders in the closed state — it unmounts synchronously by design — so
 * on this component the exit half is inert; it exists for the reuse contract.
 *
 * `z-50` is deliberate. The house rules forbid manual `z-index` on overlays whose primitive owns
 * stacking (Dialog/Sheet/Popover/Tooltip); this is a bespoke self-portalled surface with no such
 * owner, exactly like `banner-queue.svelte` and upstream itself.
 */
export const floatingSurfaceVariants = tv({
	base: [
		"fixed z-50 rounded-lg border bg-card text-sm text-card-foreground shadow-lg outline-none",
		"animate-in duration-250 fade-in-0 zoom-in-95 [animation-timing-function:cubic-bezier(0.16,1,0.3,1)]",
		"data-[side=bottom]:slide-in-from-bottom-4 data-[side=top]:slide-in-from-top-4",
		"data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
		"data-[state=closed]:data-[side=bottom]:slide-out-to-bottom-4 data-[state=closed]:data-[side=top]:slide-out-to-top-4",
		"motion-reduce:animate-none motion-reduce:transition-none",
	],
	variants: {
		orientation: {
			horizontal: "flex flex-row items-center gap-2 px-2 py-1.5",
			vertical: "flex flex-col items-start gap-2 px-1.5 py-2",
		},
	},
	defaultVariants: {
		orientation: "horizontal",
	},
});

export type EscapeDismissStateProps = {
	/** The listener is attached only while this returns `true` — i.e. while the surface is open. */
	readonly getEnabled: () => boolean;
	/** `ref?.ownerDocument ?? document`, so the listener is correct inside an iframe. */
	readonly getOwnerDocument: () => Document;
	/** Called first on every `Escape`. `preventDefault()` cancels the dismissal. */
	readonly onEscapeKeyDown?: (event: KeyboardEvent) => void;
	/** Called unless the event was default-prevented. */
	readonly onDismiss: () => void;
};

/**
 * Dismisses a non-modal floating surface on `Escape`. Upstream's effect.
 *
 * `bits-ui` exports no standalone escape layer, and the widgets that own the behaviour bundle it
 * with modality, focus trapping, scroll locking and outside-click dismissal — none of which a
 * non-modal action bar has. Must be constructed during component
 * initialisation, because it owns an `$effect`.
 */
export class EscapeDismissState {
	// `$effect` below is created in the constructor, but svelte-check's static analysis cannot see
	// the assignment happening first — the same annotation `DirectionProviderState` needs.
	#props!: EscapeDismissStateProps;

	constructor(props: EscapeDismissStateProps) {
		this.#props = props;

		$effect(() => {
			if (!this.#props.getEnabled()) return;

			const ownerDocument = this.#props.getOwnerDocument();

			/*
			 * The dismissal is DEFERRED A MACROTASK, where upstream dismisses synchronously.
			 * Upstream can: Radix overlays listen for Escape in the capture phase and
			 * `preventDefault()` before any bubble listener runs, so an open menu always wins over
			 * the bar. bits-ui's escape layer is a bubble-phase `document` listener like this one,
			 * and this one is registered first (the bar opens before the overlay), so a synchronous
			 * dismiss would fire before the overlay could claim the key — closing a dropdown with
			 * Escape would also close the bar (and, on the Tables in cards page, wipe the row
			 * selection its close handler clears). The overlay's later-registered listener still
			 * runs in the SAME dispatch; a `setTimeout` re-check afterwards sees its
			 * `preventDefault()`. A microtask is not late enough: trusted events checkpoint
			 * microtasks between listeners.
			 */
			let timer: ReturnType<typeof setTimeout> | undefined;

			const onKeyDown = (event: KeyboardEvent) => {
				if (event.key !== "Escape") return;
				this.#props.onEscapeKeyDown?.(event);
				if (event.defaultPrevented) return;
				timer = setTimeout(() => {
					if (!event.defaultPrevented) this.#props.onDismiss();
				});
			};

			ownerDocument.addEventListener("keydown", onKeyDown);
			return () => {
				ownerDocument.removeEventListener("keydown", onKeyDown);
				clearTimeout(timer);
			};
		});
	}
}
