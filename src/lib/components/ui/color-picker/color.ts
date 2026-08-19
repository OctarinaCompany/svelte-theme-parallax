/**
 * Pure colour maths for `<ColorPicker>` — no DOM, no runes, no globals.
 *
 * Ported from the numeric helpers the reference implementation inlines in `color-picker.tsx`
 * (lines 85-410). `color-swatch`'s own
 * `color.ts` owns only the background/checkerboard helpers, so the conversions live here (research
 * R-13); the swatch's checkerboard is composed rather than duplicated.
 */

/** Every display format, in upstream declaration order. */
export const COLOR_FORMATS = ["hex", "rgb", "hsl", "hsb"] as const;

/** The notation the colour is displayed and edited in. Never affects the stored colour. */
export type ColorFormat = (typeof COLOR_FORMATS)[number];

/** The authoritative colour: 8-bit RGB channels plus a `0..1` alpha. */
export type RgbaColor = { r: number; g: number; b: number; a: number };

/** The authoritative hue/saturation/brightness view: degrees, percent, percent, `0..1` alpha. */
export type HsvaColor = { h: number; s: number; v: number; a: number };

/** Derived on demand for the `hsl` fields and for {@link colorToString}; never stored. */
export type HslColor = { h: number; s: number; l: number };

/** One editable channel of the active format. `hex` edits the whole colour at once. */
export type ColorPickerInputChannel = "hex" | "r" | "g" | "b" | "h" | "s" | "l" | "v" | "a";

/** One rendered field of `<ColorPicker.Input>`, and the model `<ColorPicker.InputField>` reads. */
export type ColorPickerInputField = {
	/** Which channel this field commits to. */
	channel: ColorPickerInputChannel;
	/** The exact upstream `aria-label`. */
	label: string;
	/** The canonical display value the field falls back to whenever it is not being edited. */
	value: string;
	/** The placeholder shown when the field is empty. */
	placeholder: string;
	/** Whether the field takes a number, which adds `inputmode`/`pattern`/`min`/`max`. */
	numeric: boolean;
	/** The inclusive lower bound of a numeric field. */
	min?: number;
	/** The inclusive upper bound of a numeric field. */
	max?: number;
	/** Where the field sits in the joined row, driving its border-radius variant. */
	position: "first" | "middle" | "last" | "isolated";
};

/** The input {@link getInputFields} derives its field set from. */
export type ColorPickerInputFieldsInput = {
	format: ColorFormat;
	rgb: RgbaColor;
	hsv: HsvaColor;
	withoutAlpha: boolean;
};

const HEX_SHORTHAND_PATTERN = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
const HEX_PATTERN = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
const HEX_STRING_PATTERN = /^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/;
const RGB_PATTERN = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/;
const HSL_PATTERN = /^hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([\d.]+))?\s*\)$/;
const HSB_PATTERN = /^hsba?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*(?:,\s*([\d.]+))?\s*\)$/;

/**
 * Whether an untyped runtime value is one of {@link COLOR_FORMATS} — the `<Select>` hands its value
 * back as a bare `string`, and anything unrecognised falls back to `"hex"` at the call site.
 */
export function isColorFormat(value: unknown): value is ColorFormat {
	return typeof value === "string" && (COLOR_FORMATS as readonly string[]).includes(value);
}

/**
 * Clamp a computed channel into `[min, max]` and round it to a whole unit. Used for values the
 * component computes itself (pointer geometry, arrow steps); values arriving from an input field are
 * *rejected* rather than clamped, matching upstream.
 *
 * A non-finite input collapses to `min`.
 */
export function clampChannel(value: number, min: number, max: number): number {
	if (!Number.isFinite(value)) return min;
	return Math.round(Math.min(max, Math.max(min, value)));
}

/**
 * Parse a three- or six-digit hex string, with or without the leading `#`.
 *
 * Anything else yields black, keeping `alpha` — upstream's fallback. Unlike upstream, three-digit
 * shorthand expands rather than collapsing to black.
 */
export function hexToRgb(hex: string, alpha?: number): RgbaColor {
	const a = alpha ?? 1;

	const shorthand = HEX_SHORTHAND_PATTERN.exec(hex);
	if (shorthand) {
		const expand = (digit: string) => Number.parseInt(`${digit}${digit}`, 16);
		return {
			r: expand(shorthand[1] ?? "0"),
			g: expand(shorthand[2] ?? "0"),
			b: expand(shorthand[3] ?? "0"),
			a,
		};
	}

	const result = HEX_PATTERN.exec(hex);
	return result
		? {
				r: Number.parseInt(result[1] ?? "0", 16),
				g: Number.parseInt(result[2] ?? "0", 16),
				b: Number.parseInt(result[3] ?? "0", 16),
				a,
			}
		: { r: 0, g: 0, b: 0, a };
}

/** Render a colour as a lowercase, zero-padded `#rrggbb`. The alpha is dropped. */
export function rgbToHex(color: RgbaColor): string {
	const toHex = (n: number) => {
		const hex = Math.round(n).toString(16);
		return hex.length === 1 ? `0${hex}` : hex;
	};
	return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

/**
 * RGBA → HSVA, with `s`/`v` rounded to whole percents. Lossy in that rounding, which is exactly why
 * both representations are stored side by side rather than derived from one another.
 */
export function rgbToHsv(color: RgbaColor): HsvaColor {
	const r = color.r / 255;
	const g = color.g / 255;
	const b = color.b / 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const diff = max - min;

	let h = 0;
	if (diff !== 0) {
		switch (max) {
			case r:
				h = ((g - b) / diff) % 6;
				break;
			case g:
				h = (b - r) / diff + 2;
				break;
			case b:
				h = (r - g) / diff + 4;
				break;
		}
	}
	h = Math.round(h * 60);
	if (h < 0) h += 360;

	const s = max === 0 ? 0 : diff / max;
	const v = max;

	return { h, s: Math.round(s * 100), v: Math.round(v * 100), a: color.a };
}

/** HSVA → RGBA, rounded to whole 8-bit channels. The alpha is carried straight through. */
export function hsvToRgb(hsv: HsvaColor): RgbaColor {
	const h = hsv.h / 360;
	const s = hsv.s / 100;
	const v = hsv.v / 100;

	const i = Math.floor(h * 6);
	const f = h * 6 - i;
	const p = v * (1 - s);
	const q = v * (1 - f * s);
	const t = v * (1 - (1 - f) * s);

	let r: number;
	let g: number;
	let b: number;

	switch (i % 6) {
		case 0:
			r = v;
			g = t;
			b = p;
			break;
		case 1:
			r = q;
			g = v;
			b = p;
			break;
		case 2:
			r = p;
			g = v;
			b = t;
			break;
		case 3:
			r = p;
			g = q;
			b = v;
			break;
		case 4:
			r = t;
			g = p;
			b = v;
			break;
		case 5:
			r = v;
			g = p;
			b = q;
			break;
		default:
			r = 0;
			g = 0;
			b = 0;
	}

	return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255), a: hsv.a };
}

/** RGBA → HSL, every component rounded to a whole unit. The alpha is not part of the result. */
export function rgbToHsl(color: RgbaColor): HslColor {
	const r = color.r / 255;
	const g = color.g / 255;
	const b = color.b / 255;

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const diff = max - min;
	const sum = max + min;

	const l = sum / 2;

	let h = 0;
	let s = 0;

	if (diff !== 0) {
		s = l > 0.5 ? diff / (2 - sum) : diff / sum;

		if (max === r) {
			h = (g - b) / diff + (g < b ? 6 : 0);
		} else if (max === g) {
			h = (b - r) / diff + 2;
		} else if (max === b) {
			h = (r - g) / diff + 4;
		}
		h /= 6;
	}

	return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** HSL → RGBA, rounded to whole 8-bit channels, with the supplied alpha attached. */
export function hslToRgb(hsl: HslColor, alpha = 1): RgbaColor {
	// Wrap the hue so 360 lands in the first branch below instead of falling past the last one.
	const h = (((hsl.h % 360) + 360) % 360) / 360;
	const s = hsl.s / 100;
	const l = hsl.l / 100;

	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
	const m = l - c / 2;

	let r = 0;
	let g = 0;
	let b = 0;

	if (h >= 0 && h < 1 / 6) {
		r = c;
		g = x;
	} else if (h >= 1 / 6 && h < 2 / 6) {
		r = x;
		g = c;
	} else if (h >= 2 / 6 && h < 3 / 6) {
		g = c;
		b = x;
	} else if (h >= 3 / 6 && h < 4 / 6) {
		g = x;
		b = c;
	} else if (h >= 4 / 6 && h < 5 / 6) {
		r = x;
		b = c;
	} else if (h >= 5 / 6 && h < 1) {
		r = c;
		b = x;
	}

	return {
		r: Math.round((r + m) * 255),
		g: Math.round((g + m) * 255),
		b: Math.round((b + m) * 255),
		a: alpha,
	};
}

/**
 * Render a colour in the given notation. The `a` suffix (`rgba`/`hsla`/`hsba`) appears only below
 * full opacity; `hex` never carries alpha, which is what the hidden form input submits.
 */
export function colorToString(color: RgbaColor, format: ColorFormat = "hex"): string {
	switch (format) {
		case "rgb":
			return color.a < 1
				? `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
				: `rgb(${color.r}, ${color.g}, ${color.b})`;
		case "hsl": {
			const hsl = rgbToHsl(color);
			return color.a < 1
				? `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${color.a})`
				: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
		}
		case "hsb": {
			const hsv = rgbToHsv(color);
			return color.a < 1
				? `hsba(${hsv.h}, ${hsv.s}%, ${hsv.v}%, ${color.a})`
				: `hsb(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`;
		}
		default:
			return rgbToHex(color);
	}
}

/**
 * Read any of the four notations back into a colour, or `null` when the string is not one of them.
 *
 * This is what an incoming controlled `value` is parsed with, so a consumer wiring `value` and
 * `onValueChange` together keeps working in every format.
 */
export function parseColorString(value: string): RgbaColor | null {
	const trimmed = value.trim();

	if (trimmed.startsWith("#")) {
		return HEX_STRING_PATTERN.test(trimmed) ? hexToRgb(trimmed) : null;
	}

	const rgbMatch = RGB_PATTERN.exec(trimmed);
	if (rgbMatch) {
		return {
			r: Number.parseInt(rgbMatch[1] ?? "0", 10),
			g: Number.parseInt(rgbMatch[2] ?? "0", 10),
			b: Number.parseInt(rgbMatch[3] ?? "0", 10),
			a: rgbMatch[4] ? Number.parseFloat(rgbMatch[4]) : 1,
		};
	}

	const hslMatch = HSL_PATTERN.exec(trimmed);
	if (hslMatch) {
		return hslToRgb(
			{
				h: Number.parseInt(hslMatch[1] ?? "0", 10),
				s: Number.parseInt(hslMatch[2] ?? "0", 10),
				l: Number.parseInt(hslMatch[3] ?? "0", 10),
			},
			hslMatch[4] ? Number.parseFloat(hslMatch[4]) : 1,
		);
	}

	const hsbMatch = HSB_PATTERN.exec(trimmed);
	if (hsbMatch) {
		return hsvToRgb({
			h: Number.parseInt(hsbMatch[1] ?? "0", 10),
			s: Number.parseInt(hsbMatch[2] ?? "0", 10),
			v: Number.parseInt(hsbMatch[3] ?? "0", 10),
			a: hsbMatch[4] ? Number.parseFloat(hsbMatch[4]) : 1,
		});
	}

	return null;
}

/** `first` for the head, `last` for the tail, `isolated` for a lone field, `middle` between. */
function positionAt(index: number, length: number): ColorPickerInputField["position"] {
	if (length === 1) return "isolated";
	if (index === 0) return "first";
	if (index === length - 1) return "last";
	return "middle";
}

/**
 * The channel model behind `<ColorPicker.Input>`. Replaces upstream's four near-identical input
 * components (`HexInput`/`RgbInput`/`HslInput`/`HsbInput`) with data, producing the same DOM, the
 * same `aria-label`s and the same validation bounds.
 */
export function getInputFields(input: ColorPickerInputFieldsInput): ColorPickerInputField[] {
	const { format, rgb, hsv, withoutAlpha } = input;

	const alphaPercent = `${Math.round(rgb.a * 100)}`;

	const fields: Omit<ColorPickerInputField, "position">[] = [];

	switch (format) {
		case "rgb":
			fields.push(
				numeric("r", "Red color component (0-255)", `${Math.round(rgb.r)}`, 0, 255),
				numeric("g", "Green color component (0-255)", `${Math.round(rgb.g)}`, 0, 255),
				numeric("b", "Blue color component (0-255)", `${Math.round(rgb.b)}`, 0, 255),
			);
			break;
		case "hsl": {
			const hsl = rgbToHsl(rgb);
			fields.push(
				numeric("h", "Hue degree (0-360)", `${hsl.h}`, 0, 360),
				numeric("s", "Saturation percentage (0-100)", `${hsl.s}`, 0, 100),
				numeric("l", "Lightness percentage (0-100)", `${hsl.l}`, 0, 100),
			);
			break;
		}
		case "hsb":
			fields.push(
				numeric("h", "Hue degree (0-360)", `${hsv.h}`, 0, 360),
				numeric("s", "Saturation percentage (0-100)", `${hsv.s}`, 0, 100),
				numeric("v", "Brightness percentage (0-100)", `${hsv.v}`, 0, 100),
			);
			break;
		default:
			fields.push({
				channel: "hex",
				label: "Hex color value",
				value: rgbToHex(rgb),
				placeholder: "#000000",
				numeric: false,
			});
	}

	if (!withoutAlpha) {
		fields.push(numeric("a", "Alpha transparency percentage", alphaPercent, 0, 100, "100"));
	}

	return fields.map((field, index) => ({
		...field,
		position: positionAt(index, fields.length),
	}));
}

function numeric(
	channel: ColorPickerInputChannel,
	label: string,
	value: string,
	min: number,
	max: number,
	placeholder = "0",
): Omit<ColorPickerInputField, "position"> {
	return { channel, label, value, placeholder, numeric: true, min, max };
}

/**
 * The area's `aria-valuetext` and the string behind the swatch's accessible name: the saturation and
 * brightness the 2D area actually controls, plus the resulting colour in the active notation.
 */
export function describeColor(rgb: RgbaColor, hsv: HsvaColor, format: ColorFormat): string {
	return `Saturation ${hsv.s}%, brightness ${hsv.v}%, ${colorToString(rgb, format)}`;
}
