import { getContext, hasContext, setContext } from "svelte";

/**
 * Token counts for one model call, or the running total of a conversation.
 *
 * A STRUCTURAL MIRROR OF THE AI SDK'S `LanguageModelUsage`: the same five optional fields under
 * the same names, so the `usage` object a chat transport hands back can be passed to
 * `<ContextUsage.Root>` as it is. The kit does not depend on the `ai` package — upstream imports
 * the type from it — so the shape is restated here rather than imported, and only the fields the
 * parts read are declared. Anything wider still assigns structurally.
 */
export type TokenUsage = {
	/** Prompt tokens, cached reads included. */
	inputTokens?: number;
	/** Completion tokens, reasoning included where the provider counts it there. */
	outputTokens?: number;
	/** `inputTokens + outputTokens` as the provider reports it. Not read by any part. */
	totalTokens?: number;
	/** The share of `outputTokens` spent thinking, when the provider separates it. */
	reasoningTokens?: number;
	/** The share of `inputTokens` served from the prompt cache. */
	cachedInputTokens?: number;
};

/**
 * What the call cost, in US dollars, one field per usage row plus the total.
 *
 * SUPPLIED, NOT LOOKED UP. Upstream prices every row itself through `tokenlens` from `modelId`,
 * and prints `$0.00` for a model the table does not know. A price list goes stale the week after
 * it ships and belongs to the caller's provider layer, not to a presentation component; the
 * caller computes the figures and hands them over, and a row whose figure is missing simply
 * shows no cost rather than a false zero.
 */
export type ContextCost = {
	inputUsd?: number;
	outputUsd?: number;
	reasoningUsd?: number;
	cacheUsd?: number;
	/** The footer's figure. When absent, the sum of whichever component figures are present. */
	totalUsd?: number;
};

/** Every usage row the content body can hold, in the order upstream lists them. */
export const CONTEXT_USAGE_KINDS = ["input", "output", "reasoning", "cache"] as const;

/** One of the four usage rows. */
export type ContextUsageKind = (typeof CONTEXT_USAGE_KINDS)[number];

/** The caption each row carries, upstream verbatim. */
export const CONTEXT_USAGE_KIND_LABELS: Record<ContextUsageKind, string> = {
	input: "Input",
	output: "Output",
	reasoning: "Reasoning",
	cache: "Cache",
};

/** A resolved usage row: what `<ContextUsage.InputUsage>` and its three siblings render. */
export type ContextUsageLine = {
	kind: ContextUsageKind;
	label: string;
	/** Always a finite number greater than zero — a line is `undefined` otherwise. */
	tokens: number;
	/** `undefined` when the matching {@link ContextCost} field is absent. */
	usd: number | undefined;
};

/**
 * The three formatters, built once. `Intl.NumberFormat` construction is the expensive half of
 * formatting, and upstream rebuilds one on every render of every row.
 */
const compactFormat = new Intl.NumberFormat("en-US", { notation: "compact" });
const percentFormat = new Intl.NumberFormat("en-US", {
	style: "percent",
	maximumFractionDigits: 1,
});
const usdFormat = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	maximumFractionDigits: 4,
});

/** The placeholder every formatter returns for a value it cannot format. */
export const CONTEXT_USAGE_EMPTY = "—";

/**
 * `142000 → "142K"`, `1000000 → "1M"`, `950 → "950"` — `Intl.NumberFormat("en-US", { notation:
 * "compact" })`, exactly as upstream. Anything that is not a finite number renders as
 * {@link CONTEXT_USAGE_EMPTY}, which is what upstream's rows print for an `undefined` count.
 */
export function formatTokens(tokens: number | null | undefined): string {
	return Number.isFinite(tokens) ? compactFormat.format(tokens as number) : CONTEXT_USAGE_EMPTY;
}

/**
 * A ratio in `[0, 1]` as a percentage with at most one decimal: `0.142 → "14.2%"`, `0.95 →
 * "95%"`, `1 → "100%"`. The ratio is formatted as given — clamping is the state's job, see
 * {@link usedRatio} — and a non-finite one renders as {@link CONTEXT_USAGE_EMPTY}.
 */
export function formatPercent(ratio: number | null | undefined): string {
	return Number.isFinite(ratio) ? percentFormat.format(ratio as number) : CONTEXT_USAGE_EMPTY;
}

/**
 * US dollars with up to FOUR fraction digits: `0.3 → "$0.30"`, `0.0448 → "$0.0448"`. Upstream
 * formats with the currency default of two, which prints a `$0.0048` input cost as `$0.00` — the
 * per-call figures this popover exists to show are mostly fractions of a cent. A non-finite
 * amount renders as {@link CONTEXT_USAGE_EMPTY}.
 */
export function formatUsd(amount: number | null | undefined): string {
	return Number.isFinite(amount) ? usdFormat.format(amount as number) : CONTEXT_USAGE_EMPTY;
}

/**
 * `usedTokens / maxTokens`, clamped into `[0, 1]`.
 *
 * Upstream divides the raw props, so a conversation that has overrun its window reads `120%` and
 * hands the ring a negative dash offset that draws past a full circle, and a `maxTokens` of `0`
 * yields `Infinity` or `NaN` in every label. Here a `maxTokens` that is not a finite number
 * greater than zero — or a `usedTokens` that is not finite — reads as `0`, and an overrun reads
 * as `1`.
 */
export function usedRatio(usedTokens: number, maxTokens: number): number {
	if (!Number.isFinite(maxTokens) || maxTokens <= 0 || !Number.isFinite(usedTokens)) return 0;
	return Math.min(1, Math.max(0, usedTokens / maxTokens));
}

/**
 * Reactive inputs for {@link ContextUsageState}. Getters rather than values, so the class keeps
 * tracking the root's props instead of snapshotting them.
 */
export type ContextUsageStateProps = {
	getUsedTokens: () => number;
	getMaxTokens: () => number;
	getUsage: () => TokenUsage | undefined;
	getCost: () => ContextCost | undefined;
	getModelId: () => string | undefined;
};

function buildLine(
	kind: ContextUsageKind,
	tokens: number | undefined,
	usd: number | undefined,
): ContextUsageLine | undefined {
	// `!(tokens > 0)` rather than `!tokens`: it also rejects `NaN` and a negative count, neither
	// of which a row can render.
	if (tokens === undefined || !(tokens > 0) || !Number.isFinite(tokens)) return undefined;
	return {
		kind,
		label: CONTEXT_USAGE_KIND_LABELS[kind],
		tokens,
		usd: Number.isFinite(usd) ? usd : undefined,
	};
}

/**
 * One instance per `<ContextUsage.Root>`. Published on context; every part reads it.
 *
 * Upstream's context carries the four raw props and every part re-derives the ratio and rebuilds
 * its formatters. Here the derivations live once, on the state, so the trigger's `14.2%`, the
 * header's `14.2%` and the root's `data-percent="14"` can never disagree.
 */
export class ContextUsageState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: ContextUsageStateProps;

	readonly usedTokens: number = $derived(this.#props.getUsedTokens());
	readonly maxTokens: number = $derived(this.#props.getMaxTokens());
	readonly usage: TokenUsage | undefined = $derived(this.#props.getUsage());
	readonly cost: ContextCost | undefined = $derived(this.#props.getCost());
	readonly modelId: string | undefined = $derived(this.#props.getModelId());

	/** The share of the window in use, as a ratio in `[0, 1]`. See {@link usedRatio}. */
	readonly usedPercent: number = $derived(usedRatio(this.usedTokens, this.maxTokens));

	/** {@link usedPercent} as a rounded integer in `[0, 100]` — the `data-percent` stamp. */
	readonly percent: number = $derived(Math.round(this.usedPercent * 100));

	/** `"14.2%"` — what the trigger and the header print. */
	readonly percentLabel: string = $derived(formatPercent(this.usedPercent));
	/** `"142K"`. */
	readonly usedLabel: string = $derived(formatTokens(this.usedTokens));
	/** `"1M"`. */
	readonly maxLabel: string = $derived(formatTokens(this.maxTokens));

	/** The four rows, resolved; a row with no count, or a count of zero, is `undefined`. */
	readonly lines: Record<ContextUsageKind, ContextUsageLine | undefined> = $derived({
		input: buildLine("input", this.usage?.inputTokens, this.cost?.inputUsd),
		output: buildLine("output", this.usage?.outputTokens, this.cost?.outputUsd),
		reasoning: buildLine("reasoning", this.usage?.reasoningTokens, this.cost?.reasoningUsd),
		cache: buildLine("cache", this.usage?.cachedInputTokens, this.cost?.cacheUsd),
	});

	/**
	 * The footer's figure: `cost.totalUsd` when given, else the sum of the component figures
	 * that are, else `undefined` — in which case the footer renders nothing.
	 */
	readonly totalUsd: number | undefined = $derived.by(() => {
		const cost = this.cost;
		if (!cost) return undefined;
		if (Number.isFinite(cost.totalUsd)) return cost.totalUsd;
		const parts = [cost.inputUsd, cost.outputUsd, cost.reasoningUsd, cost.cacheUsd].filter(
			(usd): usd is number => Number.isFinite(usd),
		);
		return parts.length > 0 ? parts.reduce((sum, usd) => sum + usd, 0) : undefined;
	});

	/** `"$0.30"`, or {@link CONTEXT_USAGE_EMPTY} when there is no total. */
	readonly totalCostLabel: string = $derived(formatUsd(this.totalUsd));

	constructor(props: ContextUsageStateProps) {
		this.#props = props;
	}

	/** The resolved row for `kind`, or `undefined` when it has nothing to show. */
	line(kind: ContextUsageKind): ContextUsageLine | undefined {
		return this.lines[kind];
	}
}

const CONTEXT_USAGE_CONTEXT_KEY = Symbol("context-usage");

export function setContextUsageContext(state: ContextUsageState): ContextUsageState {
	return setContext(CONTEXT_USAGE_CONTEXT_KEY, state);
}

export function hasContextUsageContext(): boolean {
	return hasContext(CONTEXT_USAGE_CONTEXT_KEY);
}

export function getContextUsageContext(part?: string): ContextUsageState {
	if (!hasContextUsageContext()) {
		throw new Error(
			`${part ?? "`<ContextUsage>` part"} must be used within \`<ContextUsage.Root>\`.`,
		);
	}
	return getContext<ContextUsageState>(CONTEXT_USAGE_CONTEXT_KEY);
}

/** Parity name for the selector-hook shape the other ports expose. Delegates to the getter. */
export function useContextUsage(): ContextUsageState {
	return getContextUsageContext();
}
