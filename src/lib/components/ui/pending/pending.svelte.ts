let pendingIdCounter = 0;

/** `() => "pending-<n>"` — a stable, incrementing fallback id for bare `usePending()` calls. */
export function createPendingId(): string {
	pendingIdCounter += 1;
	return `pending-${pendingIdCounter}`;
}

export type UsePendingOptions = {
	/**
	 * The ID of the element. If not provided, an ID will be automatically generated.
	 *
	 * ```ts
	 * const pending = usePending({ isPending: () => true, id: () => 'submit-button' });
	 * ```
	 */
	id?: () => string | undefined;
	/**
	 * Whether the element is in a pending state.
	 * This disables press and hover events while retaining focusability,
	 * and sets aria-busy and aria-disabled for screen readers.
	 * @default false
	 */
	isPending?: () => boolean | undefined;
	/**
	 * Whether the element is disabled.
	 * When pending, the element will be aria-disabled but remain focusable.
	 * @default false
	 */
	disabled?: () => boolean | undefined;
};

/**
 * Props to spread on the interactive element. Includes aria attributes, data attributes, and
 * event handler overrides.
 *
 * **Important**: Spread `pendingProps` last to ensure event prevention works:
 *
 * ```svelte
 * <!-- ❌ Wrong - onclick will override prevention -->
 * <Button {...pending.pendingProps} onclick={onSubmit}>Submit</Button>
 *
 * <!-- ✅ Correct - prevention takes precedence -->
 * <Button onclick={onSubmit} {...pending.pendingProps}>Submit</Button>
 * ```
 */
export type PendingAttributes = {
	id: string;
	"aria-busy"?: "true";
	"aria-disabled"?: "true";
	"data-pending"?: string;
	"data-disabled"?: string;
	onclick?: (event: Event) => void;
	onpointerdown?: (event: Event) => void;
	onpointerup?: (event: Event) => void;
	onmousedown?: (event: Event) => void;
	onmouseup?: (event: Event) => void;
	onkeydown?: (event: KeyboardEvent) => void;
	onkeyup?: (event: KeyboardEvent) => void;
};

function preventDefault(event: Event) {
	event.preventDefault();
}

function preventActivationKey(event: KeyboardEvent) {
	if (event.key === "Enter" || event.key === " ") {
		event.preventDefault();
	}
}

/** One instance per `usePending()` call. Replaces upstream's `UsePendingReturn`. */
export class PendingState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#options!: UsePendingOptions;
	#fallbackId = createPendingId();

	readonly id = $derived(this.#options.id?.() || this.#fallbackId);
	readonly isPending = $derived(this.#options.isPending?.() ?? false);
	readonly disabled = $derived(this.#options.disabled?.() ?? false);

	readonly pendingProps: PendingAttributes = $derived.by(() => {
		const props: PendingAttributes = { id: this.id };

		if (this.isPending) {
			props["aria-busy"] = "true";
			props["aria-disabled"] = "true";
			props["data-pending"] = "";
			props.onclick = preventDefault;
			props.onpointerdown = preventDefault;
			props.onpointerup = preventDefault;
			props.onmousedown = preventDefault;
			props.onmouseup = preventDefault;
			props.onkeydown = preventActivationKey;
			props.onkeyup = preventActivationKey;
		}

		if (this.disabled) {
			props["data-disabled"] = "";
		}

		return props;
	});

	constructor(options: UsePendingOptions = {}) {
		this.#options = options;
	}
}

/** Alias of {@link PendingState} — kept for name parity with upstream's `UsePendingReturn`. */
export type UsePendingReturn = PendingState;

/**
 * Derive a set of "pending props" — an id, ARIA attributes, data attributes, and event-prevention
 * handlers — from a boolean pending input, an optional boolean disabled input and an optional id.
 * Must be called during component initialisation.
 */
export function usePending(options?: UsePendingOptions): PendingState {
	return new PendingState(options);
}
