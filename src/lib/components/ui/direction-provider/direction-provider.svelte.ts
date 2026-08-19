import { getContext, hasContext, setContext } from "svelte";

/** Every value {@link Direction} accepts, in upstream declaration order. */
export const DIRECTIONS = ["ltr", "rtl"] as const;

/** `'ltr' | 'rtl'` — mirrors the shared-utils reference's `Direction`. */
export type Direction = (typeof DIRECTIONS)[number];

/**
 * Narrow a possibly untyped runtime value (e.g. a DOM `dir` attribute) to a known {@link Direction}.
 * Anything outside {@link DIRECTIONS} — `"auto"`, `""`, a typo — is treated as absent.
 */
export function isDirection(value: unknown): value is Direction {
	return value === "ltr" || value === "rtl";
}

/**
 * Walk up from `anchor` to the nearest element carrying a recognised `dir` attribute.
 * `[dir="auto"]` and other unrecognised values are skipped, exactly as if the attribute were absent.
 */
export function resolveDomDirection(anchor: Element | null | undefined): Direction | undefined {
	const dir = anchor?.closest('[dir="ltr"], [dir="rtl"]')?.getAttribute("dir");
	return isDirection(dir) ? dir : undefined;
}

const DIRECTION_CONTEXT_KEY = Symbol("direction-provider");

type DirectionProviderStateProps = {
	getDir: () => Direction;
};

/** One instance per `<DirectionProvider>`. Published on context; descendants read it. */
export class DirectionProviderState {
	// $derived below is lazy at runtime (evaluated only when `.current` is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: DirectionProviderStateProps;
	readonly current: Direction = $derived(this.#props.getDir());

	constructor(props: DirectionProviderStateProps) {
		this.#props = props;
	}
}

export function setDirectionContext(state: DirectionProviderState): DirectionProviderState {
	return setContext(DIRECTION_CONTEXT_KEY, state);
}

export function hasDirectionContext(): boolean {
	return hasContext(DIRECTION_CONTEXT_KEY);
}

export function getDirectionContext(consumerName?: string): DirectionProviderState {
	if (!hasDirectionContext()) {
		const label = consumerName ? `\`<${consumerName}>\`` : "`<DirectionProvider>` consumer";
		throw new Error(`${label} must be used within \`<DirectionProvider>\`.`);
	}
	return getContext<DirectionProviderState>(DIRECTION_CONTEXT_KEY);
}

export type UseDirectionOptions = {
	/**
	 * Explicit direction override. When the getter returns a value it takes precedence over the
	 * nearest provider and over the DOM fallback.
	 */
	dir?: () => Direction | undefined;
	/**
	 * Element the DOM fallback walks up from when no provider is present.
	 * @default document.documentElement
	 */
	element?: () => HTMLElement | null | undefined;
};

/** One instance per `useDirection()` call. Resolves `override ?? provider ?? domDir ?? 'ltr'`. */
export class DirectionReader {
	// Same svelte-check limitation as DirectionProviderState#props above: $derived is lazy at
	// runtime, but the static analyser cannot see that across the constructor assignment.
	#options!: UseDirectionOptions | undefined;
	#context!: DirectionProviderState | undefined;
	#domDir = $state<Direction | undefined>(undefined);

	readonly current: Direction = $derived(
		this.#options?.dir?.() ?? this.#context?.current ?? this.#domDir ?? "ltr",
	);

	constructor(
		options: UseDirectionOptions | undefined,
		context: DirectionProviderState | undefined,
	) {
		this.#options = options;
		this.#context = context;

		$effect(() => {
			if (this.#options?.dir?.() !== undefined || this.#context !== undefined) {
				this.#domDir = undefined;
				return;
			}

			this.#domDir = resolveDomDirection(this.#options?.element?.() ?? document.documentElement);

			const observer = new MutationObserver(() => {
				this.#domDir = resolveDomDirection(this.#options?.element?.() ?? document.documentElement);
			});
			observer.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ["dir"],
				subtree: true,
			});

			return () => observer.disconnect();
		});
	}
}

/**
 * Read the resolved direction: `options.dir?.() ?? nearestProvider?.current ?? domDir ?? 'ltr'`.
 * Must be called during component initialisation. Never throws when no provider is present.
 */
export function useDirection(options?: UseDirectionOptions): DirectionReader {
	const context = hasDirectionContext() ? getDirectionContext() : undefined;
	return new DirectionReader(options, context);
}
