import { getContext, hasContext, setContext, untrack } from "svelte";

import { IsMobile } from "$lib/hooks/is-mobile.svelte.js";

/** Which primitive the composition is currently rendering. */
export type ResponsiveDialogVariant = "dialog" | "drawer";

export type ResponsiveDialogStateProps = {
	/** Reads the root's resolved open state (controlled prop or uncontrolled seed). */
	readonly getOpen: () => boolean;
	/** Writes the root's open state and invokes `onOpenChange`. */
	readonly setOpen: (open: boolean) => void;
	/** Reads the root's `breakpoint` prop. */
	readonly getBreakpoint: () => number;
};

/**
 * One instance per `<ResponsiveDialog.Root>`, published on context; every part reads it.
 *
 * Replaces upstream's `useSyncExternalStore` pub/sub `Store` — `$state`/`$derived` are synchronous
 * and fine-grained, so the whole abstraction collapses to two reactive fields.
 */
export class ResponsiveDialogState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the fields as used before their constructor
	// assignment.
	#props!: ResponsiveDialogStateProps;
	#isMobile!: IsMobile;
	/** Non-reactive previous value, used to detect a mode transition inside `untrack`. */
	#lastVariant: ResponsiveDialogVariant | undefined;

	readonly open: boolean = $derived(this.#props.getOpen());
	readonly variant: ResponsiveDialogVariant = $derived(
		this.#isMobile.current ? "drawer" : "dialog",
	);

	/** Set when `variant` changes while `open` is `true`; consumed by the newly mounted `Content`. */
	pendingFocusRestore: boolean = $state(false);

	constructor(props: ResponsiveDialogStateProps) {
		this.#props = props;
		this.#isMobile = new IsMobile(props.getBreakpoint);

		// `$effect.pre` — the flag has to be raised *before* the `{#if}` swaps the branch, so the
		// `Content` mounting in the new branch can consume it in its own mount effect.
		$effect.pre(() => {
			const variant = this.variant;

			untrack(() => {
				if (this.#lastVariant !== undefined && this.#lastVariant !== variant && this.open) {
					this.pendingFocusRestore = true;
				}
				this.#lastVariant = variant;
			});
		});
	}

	/**
	 * Writes the open state through the root.
	 *
	 * No-op when `from` is not the active variant — the callback then comes from a branch being torn
	 * down by a mode swap and must not close a dialog the user never closed — or when `next` is
	 * already the current value, mirroring upstream's `Object.is` short-circuit.
	 */
	setOpen(next: boolean, from: ResponsiveDialogVariant): void {
		if (from !== this.variant) return;
		if (Object.is(this.open, next)) return;
		this.#props.setOpen(next);
	}

	/** Returns and clears {@link pendingFocusRestore}. */
	consumeFocusRestore(): boolean {
		if (!this.pendingFocusRestore) return false;
		this.pendingFocusRestore = false;
		return true;
	}
}

const RESPONSIVE_DIALOG_CONTEXT_KEY = Symbol("responsive-dialog");

export function setResponsiveDialogContext(state: ResponsiveDialogState): ResponsiveDialogState {
	return setContext(RESPONSIVE_DIALOG_CONTEXT_KEY, state);
}

export function hasResponsiveDialogContext(): boolean {
	return hasContext(RESPONSIVE_DIALOG_CONTEXT_KEY);
}

export function getResponsiveDialogContext(part?: string): ResponsiveDialogState {
	if (!hasResponsiveDialogContext()) {
		throw new Error(
			`\`<ResponsiveDialog.${part ?? "Part"}>\` must be used within \`<ResponsiveDialog.Root>\`.`,
		);
	}
	return getContext<ResponsiveDialogState>(RESPONSIVE_DIALOG_CONTEXT_KEY);
}
