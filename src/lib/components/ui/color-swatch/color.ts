/**
 * Options controlling {@link getColorBackgroundStyle}'s checkerboard rendering.
 */
export type ColorBackgroundOptions = {
	/**
	 * The tile size of the checkerboard pattern shown behind an alpha-bearing colour.
	 * @default "10px"
	 */
	checkerboardSize?: string;
	/**
	 * Suppress the checkerboard pattern for alpha-bearing colours, rendering only the flat colour.
	 * @default false
	 */
	withoutTransparency?: boolean;
};

/**
 * Normalise a possibly-`undefined` colour value: trims surrounding whitespace and treats an
 * empty or whitespace-only string as `undefined`. Idempotent.
 * @example normalizeColorValue("  #3b82f6  ") // "#3b82f6"
 * @example normalizeColorValue("   ") // undefined
 */
export function normalizeColorValue(value?: string): string | undefined {
	const trimmed = value?.trim();
	return trimmed ? trimmed : undefined;
}

/**
 * Whether a CSS colour string is valid, delegating to `CSS.supports('color', value)`.
 * Returns `true` when `CSS`/`CSS.supports` is unavailable (SSR), matching upstream's
 * feature-detect-and-assume-valid fallback. Returns `false` if the call throws.
 */
export function isCssColor(value: string): boolean {
	try {
		return typeof CSS !== "undefined" && typeof CSS.supports === "function"
			? CSS.supports("color", value)
			: true;
	} catch {
		return false;
	}
}

/**
 * Whether a CSS colour string carries alpha/transparency information: `rgba()`/`hsla()` function
 * notation, an 8-digit hex, the `transparent` keyword, or slash-alpha syntax
 * (`rgb()`/`hsl()`/`lab()`/`lch()`/`oklab()`/`oklch()`/`color()` with `/ <alpha>`).
 * Case-insensitive and tolerant of surrounding whitespace.
 */
export function hasAlpha(value: string): boolean {
	const trimmed = value.trim().toLowerCase();

	if (trimmed === "transparent") return true;

	if (/^#(?:[0-9a-f]{4}|[0-9a-f]{8})$/i.test(trimmed)) return true;

	if (/\b(?:rgba|hsla)\s*\(/i.test(trimmed)) return true;

	if (/\b(?:rgb|hsl|lab|lch|oklab|oklch|color)\s*\([^)]*\/\s*[\d.]+%?\s*\)/i.test(trimmed)) {
		return true;
	}

	return false;
}

/**
 * Build the `style` `background`/`background-color` declaration for a colour swatch.
 *
 * - No value (`undefined`, `''`, whitespace-only) → the "no colour selected" diagonal-slash gradient.
 * - A value that is not a valid CSS colour → `background-color: transparent`.
 * - A valid, alpha-bearing value with the checkerboard enabled → a colour gradient over a
 *   repeating conic checkerboard.
 * - Otherwise → a flat `background-color`.
 *
 * @example getColorBackgroundStyle("#3b82f6") // "background-color: #3b82f6"
 * @example getColorBackgroundStyle("rgba(59, 130, 246, 0.5)") // gradient + checkerboard
 */
export function getColorBackgroundStyle(
	value: string | undefined,
	options?: ColorBackgroundOptions,
): string {
	const checkerboardSize = options?.checkerboardSize ?? "10px";
	const withoutTransparency = options?.withoutTransparency ?? false;

	const colorValue = normalizeColorValue(value);

	if (!colorValue) {
		return "background: linear-gradient(to bottom right, transparent calc(50% - 1px), var(--destructive) calc(50% - 1px) calc(50% + 1px), transparent calc(50% + 1px)) no-repeat";
	}

	if (!isCssColor(colorValue)) {
		return "background-color: transparent";
	}

	if (!withoutTransparency && hasAlpha(colorValue)) {
		return `background: linear-gradient(${colorValue}, ${colorValue}), repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0% 50% / ${checkerboardSize} ${checkerboardSize}`;
	}

	return `background-color: ${colorValue}`;
}
