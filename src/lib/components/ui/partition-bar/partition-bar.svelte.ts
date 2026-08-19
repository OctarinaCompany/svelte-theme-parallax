import { getContext, hasContext, setContext } from "svelte";
import { tv } from "tailwind-variants";

/**
 * Every value `size` accepts. Upstream is `sm | md | lg`; the middle
 * step is called `default` here because that is what every sized component in this repository
 * calls it (CONVENTIONS §3).
 */
export const PARTITION_BAR_SIZES = ["sm", "default", "lg"] as const;
export type PartitionBarSize = (typeof PARTITION_BAR_SIZES)[number];

/**
 * Where a segment's label sits under its bar. Upstream is `left | center | right`;
 * these are the writing-mode-relative names, so a bar keeps the
 * alignment its author meant inside `<DirectionProvider dir="rtl">`.
 */
export const PARTITION_BAR_ALIGNMENTS = ["start", "center", "end"] as const;
export type PartitionBarAlignment = (typeof PARTITION_BAR_ALIGNMENTS)[number];

/**
 * Every value `variant` accepts. The first five are upstream's;
 * `success`, `warning` and `info` complete the house status vocabulary (CONVENTIONS §3), without
 * which the component's own use case — used / reserved / free storage — cannot be painted from
 * tokens at all.
 */
export const PARTITION_BAR_VARIANTS = [
	"default",
	"secondary",
	"muted",
	"outline",
	"destructive",
	"success",
	"warning",
	"info",
] as const;
export type PartitionBarVariant = (typeof PARTITION_BAR_VARIANTS)[number];

/** Segment spacing in spacing steps. Upstream `gap = 1`, applied as `gap * 4px`. */
export const DEFAULT_PARTITION_BAR_GAP = 1;

/**
 * The root list.
 *
 * `size` sets the type scale plus the two measurements every segment needs: the bar's height and
 * the space under it, which upstream applied with inline ternaries on each segment.
 * As custom properties they cascade instead, so one class on the
 * root retunes a bar without a new variant — the `icon-tile` precedent.
 *
 * Upstream's `lg` asks for `text-md`, which is not a Tailwind class and therefore rendered at the
 * inherited size; `text-base` is what it meant.
 */
export const partitionBarVariants = tv({
	base: "flex w-full flex-row",
	variants: {
		size: {
			sm: "text-xs [--partition-bar-label-gap:--spacing(2)] [--partition-bar-line-size:--spacing(2)]",
			default:
				"text-sm [--partition-bar-label-gap:--spacing(3)] [--partition-bar-line-size:--spacing(3)]",
			lg: "text-base [--partition-bar-label-gap:--spacing(4)] [--partition-bar-line-size:--spacing(4)]",
		},
	},
	defaultVariants: {
		size: "default",
	},
});

/**
 * One segment.
 *
 * `variant` sets two custom properties rather than painting the bar and the label directly: the
 * bar reads `--partition-bar-color`, the label reads `--partition-bar-ink`, and the `color` /
 * `labelColor` escape hatch is an inline write to those same two properties, which wins over the
 * class without a second code path. Upstream needed one `cva` block per painted element.
 *
 * THE INK IS NEVER THE FILL. `--warning` is #f5c042 (src/app.css) — a fill, illegible as type — so
 * every status label takes the contrast-walked `*-subtle-foreground` of its own status
 * (CONVENTIONS §3). The three neutral bars take plain `--foreground`: upstream fades their labels
 * to 60% and 40% opacity, which at `--muted-foreground` and below is not a weight a name can be
 * read at. The quiet half of the label stack is the value line under it, which is muted for all
 * eight.
 */
export const partitionBarSegmentVariants = tv({
	base: "flex min-w-0 basis-0 flex-col gap-(--partition-bar-label-gap)",
	variants: {
		variant: {
			default:
				"[--partition-bar-color:var(--primary)] [--partition-bar-ink:var(--primary-subtle-foreground)]",
			secondary:
				"[--partition-bar-color:color-mix(in_srgb,var(--primary)_60%,transparent)] [--partition-bar-ink:var(--foreground)]",
			muted:
				"[--partition-bar-color:color-mix(in_srgb,var(--primary)_40%,transparent)] [--partition-bar-ink:var(--foreground)]",
			outline: "[--partition-bar-color:var(--background)] [--partition-bar-ink:var(--foreground)]",
			destructive:
				"[--partition-bar-color:var(--destructive)] [--partition-bar-ink:var(--destructive-subtle-foreground)]",
			success:
				"[--partition-bar-color:var(--success)] [--partition-bar-ink:var(--success-subtle-foreground)]",
			warning:
				"[--partition-bar-color:var(--warning)] [--partition-bar-ink:var(--warning-subtle-foreground)]",
			info: "[--partition-bar-color:var(--info)] [--partition-bar-ink:var(--info-subtle-foreground)]",
		},
	},
	defaultVariants: {
		variant: "default",
	},
});

/** The label stack under one bar. Upstream's three `alignment` branches. */
export const partitionBarLabelVariants = tv({
	base: "flex w-full flex-col",
	variants: {
		alignment: {
			start: "items-start",
			center: "items-center",
			end: "items-end",
		},
	},
	defaultVariants: {
		alignment: "center",
	},
});

/**
 * The painted bar itself.
 *
 * A constant rather than a fourth `tv` block: the fill arrives through `--partition-bar-color`, so
 * `outline` — the one variant that is a border and not a fill — is the only
 * thing left to select on, and it does that from its own `data-variant`.
 */
export const PARTITION_BAR_LINE_CLASSES =
	"h-(--partition-bar-line-size) w-full shrink-0 rounded-full bg-(color:--partition-bar-color) data-[variant=outline]:border data-[variant=outline]:border-input";

/** The segment's name. `w-fit` so it hugs its text and the label stack's alignment applies. */
export const PARTITION_BAR_SEGMENT_TITLE_CLASSES =
	"w-fit font-semibold text-(color:--partition-bar-ink)";

/**
 * The segment's measurement, one step quieter than its title.
 *
 * `text-[80%]` is relative, so it tracks whichever `size` the root set. Upstream's `text-slate-500`
 * is the raw palette; `muted-foreground` is the token that means it.
 */
export const PARTITION_BAR_SEGMENT_VALUE_CLASSES = "w-fit text-[80%] text-muted-foreground";

export type PartitionBarStateProps = {
	readonly getSize: () => PartitionBarSize;
	readonly getAlignment: () => PartitionBarAlignment;
	readonly getTotal: () => number | undefined;
};

/**
 * One instance per `<PartitionBar>` root, published on context. Replaces upstream's
 * `PartitionBarContextType`.
 *
 * WHAT IT DOES NOT CARRY IS THE TOTAL OF ITS SEGMENTS. Upstream sums `Children.toArray(children)`
 * and hands each segment `flex-basis: (num / total)%`. Svelte
 * has no equivalent of reading a child's props, and the two ways to recover the sum — a `total`
 * prop the caller must keep in step, or a registry every segment writes to on mount — both cost
 * more than the layout engine does: `flex-basis: 0` plus `flex-grow: num` divides the track in the
 * same proportions, from the same numbers, with no total anywhere. It also fixes a bug: upstream's
 * percentages sum to 100% of the container and the `gap` is then added on top, so any bar with a
 * gap overflows its own root, while free space is what `flex-grow` divides.
 *
 * `total` survives as an optional prop for the case the weights cannot express — a bar that is
 * deliberately not full, `17 GB of 64 GB` — where it becomes the denominator.
 */
export class PartitionBarState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: PartitionBarStateProps;

	readonly size: PartitionBarSize = $derived(this.#props.getSize());
	readonly alignment: PartitionBarAlignment = $derived(this.#props.getAlignment());
	readonly total: number | undefined = $derived(this.#props.getTotal());

	constructor(props: PartitionBarStateProps) {
		this.#props = props;
	}

	/**
	 * The `flex-grow` factor for one segment.
	 *
	 * Without a `total` the factors are relative to each other and the bar always fills. With one
	 * they are fractions of it, so they sum to at most 1 and any remainder stays empty — which is
	 * also why a caller whose weights sum to less than 1 (`0.3` and `0.2`) has to pass `total`:
	 * flex divides free space by the sum of the factors only up to 1.
	 */
	growOf(num: number): number {
		const weight = Number.isFinite(num) && num > 0 ? num : 0;
		const total = this.total;
		return total !== undefined && total > 0 ? weight / total : weight;
	}
}

const PARTITION_BAR_CONTEXT_KEY = Symbol("partition-bar");

export function setPartitionBarContext(state: PartitionBarState): PartitionBarState {
	return setContext(PARTITION_BAR_CONTEXT_KEY, state);
}

export function hasPartitionBarContext(): boolean {
	return hasContext(PARTITION_BAR_CONTEXT_KEY);
}

/** Read the root's state, throwing when there is no `<PartitionBar>` ancestor. */
export function getPartitionBarContext(consumerName: string): PartitionBarState {
	if (!hasPartitionBarContext()) {
		throw new Error(`\`${consumerName}\` must be used within \`<PartitionBar>\`.`);
	}
	return getContext<PartitionBarState>(PARTITION_BAR_CONTEXT_KEY);
}
