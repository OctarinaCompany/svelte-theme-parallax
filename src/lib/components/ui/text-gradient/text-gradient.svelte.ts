/**
 * The pure helpers behind `<TextGradient>`.
 *
 * NO STATE CLASS AND NO CONTEXT — the shape `rating.svelte.ts` and `frame.svelte.ts` already take.
 * The component is one element with no parts and no behaviour: four props become four custom
 * properties and a scoped stylesheet does the rest, so there is nothing for a state class to hold
 * and no child to publish to. What is left is the prop-to-CSS translation, and `CONVENTIONS.md` §4
 * puts a folder's pure helpers here rather than inline in the component.
 */

/**
 * A spread's CSS value: a number is pixels — upstream's only unit — and a
 * string is used as written, which is what lets the default be an `em` (divergence D-01 in
 * `text-gradient.svelte`). Same shape as `marquee.svelte.ts`'s `resolveGap`.
 */
export function resolveTextGradientSpread(spread: number | string): string {
	return typeof spread === "number" ? `${spread}px` : spread;
}

/** The four values the root publishes, before they are turned into declarations. */
export type TextGradientVariables = {
	spread: number | string;
	highlightColor: string;
	baseColor: string;
	duration: number;
};

/**
 * The four custom properties the root publishes, as a CSS declaration string.
 *
 * Custom properties rather than the three inline longhands upstream writes
 *: the paint has to live in the component's scoped stylesheet for the
 * keyframes to be scoped with it, and a custom property is the only thing an inline style can hand
 * a stylesheet.
 */
export function textGradientCustomProperties(variables: TextGradientVariables): string {
	return [
		`--text-gradient-spread: ${resolveTextGradientSpread(variables.spread)};`,
		`--text-gradient-highlight: ${variables.highlightColor};`,
		`--text-gradient-base: ${variables.baseColor};`,
		`--text-gradient-duration: ${variables.duration}s;`,
	].join(" ");
}
