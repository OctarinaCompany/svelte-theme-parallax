import { tv } from "tailwind-variants";

/** Every value `size` accepts, in upstream declaration order. */
export const RATING_SIZES = ["sm", "default", "lg"] as const;

/** `'sm' | 'default' | 'lg'` — upstream's `size` variant axis. */
export type RatingSize = (typeof RATING_SIZES)[number];

/**
 * Upstream `ratingVariants`, translated from `cva` to `tv()`. The root
 * carries only the layout and the gap between the star row and the value span; the stars
 * themselves sit in their own zero-gap row.
 */
export const ratingVariants = tv({
	base: "flex items-center",
	variants: {
		size: {
			sm: "gap-2",
			default: "gap-2.5",
			lg: "gap-3",
		},
	},
	defaultVariants: {
		size: "default",
	},
});

/**
 * Upstream `starVariants`. The `w-* h-*` pairs collapse to `size-*`
 * per the house styling rules (docs/CONVENTIONS.md §8).
 */
export const ratingStarVariants = tv({
	base: "",
	variants: {
		size: {
			sm: "size-4",
			default: "size-5",
			lg: "size-6",
		},
	},
	defaultVariants: {
		size: "default",
	},
});

/**
 * Upstream `valueVariants`: the numeric read-out next to the stars.
 * The fixed `w-5` keeps the row from shifting as the hover preview swaps `3.0` for `4.5`.
 */
export const ratingValueVariants = tv({
	base: "w-5 text-muted-foreground",
	variants: {
		size: {
			sm: "text-xs",
			default: "text-sm",
			lg: "text-base",
		},
	},
	defaultVariants: {
		size: "default",
	},
});

/**
 * How much of the star at `index` (0-based) is filled, as a 0-100 percentage. Upstream computes
 * this inline per star: a star is full once the rating reaches its
 * ordinal, empty below its predecessor, and linearly partial in between — which is what lets a
 * `4.6` render a 60%-filled fifth star instead of snapping to a half.
 */
export function getStarFillPercentage(rating: number, index: number): number {
	return Math.min(Math.max((rating - index) * 100, 0), 100);
}
