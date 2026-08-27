import type { Direction } from "$lib/components/ui/direction-provider/index.js";
import { getContext, hasContext, setContext } from "svelte";

import {
	clampChannel,
	colorToString,
	describeColor,
	getInputFields,
	hexToRgb,
	hslToRgb,
	hsvToRgb,
	parseColorString,
	rgbToHex,
	rgbToHsl,
	rgbToHsv,
	type ColorFormat,
	type ColorPickerInputChannel,
	type ColorPickerInputField,
	type HsvaColor,
	type RgbaColor,
} from "./color.js";

/**
 * The browser-native screen colour sampler, Chromium-only.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/EyeDropper
 */
export type EyeDropperApi = {
	open: (options?: { signal?: AbortSignal }) => Promise<{ sRGBHex: string }>;
};

declare global {
	interface Window {
		EyeDropper?: {
			new (): EyeDropperApi;
		};
	}
}

/**
 * The reactive values `<ColorPicker.Root>` hands its state class. Everything reactive arrives as a
 * getter rather than a snapshot, so the class keeps tracking the props after construction.
 */
export type ColorPickerRootStateProps = {
	readonly getValue: () => string;
	readonly setValue: (value: string) => void;
	readonly getOpen: () => boolean;
	readonly setOpen: (open: boolean) => void;
	readonly getFormat: () => ColorFormat;
	readonly setFormat: (format: ColorFormat) => void;
	readonly getModal: () => boolean;
	readonly getDir: () => Direction;
	readonly getInline: () => boolean;
	readonly getDisabled: () => boolean;
	readonly getReadOnly: () => boolean;
	readonly getRequired: () => boolean;
	readonly getName: () => string | undefined;
};

/** Whether two colours are identical channel for channel, used to make the value sync idempotent. */
function sameRgb(a: RgbaColor, b: RgbaColor): boolean {
	return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
}

/**
 * Whether a colour string states its own alpha. Only the functional notations can — upstream's hex
 * parser takes six digits and no alpha — so anything else keeps the alpha already on screen, exactly
 * like upstream's `hexToRgb(valueProp, currentState.color.a)`.
 */
function carriesAlpha(value: string): boolean {
	return /^(?:rgba?|hsla?|hsba?)\(\s*[\d.]+\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+\s*\)$/i.test(
		value.trim(),
	);
}

/** Read a colour string, preserving `alpha` when the notation does not carry one of its own. */
function readColor(value: string, alpha: number): RgbaColor {
	const parsed = parseColorString(value);
	if (!parsed) return hexToRgb(value, alpha);
	return carriesAlpha(value) ? parsed : { ...parsed, a: alpha };
}

/**
 * One instance per `<ColorPicker.Root>`, published on a `Symbol` context key and read by all ten
 * parts.
 *
 * Replaces upstream's hand-rolled `useSyncExternalStore` pub/sub — `listenersRef` + `stateRef` +
 * `subscribe`/`getState`/`notify` — which exists only so that a deep
 * part can subscribe to one slice without re-rendering the tree. Runes give that for free: a part
 * reading `root.hue` re-runs only when the hue moves.
 *
 * Both RGBA *and* HSVA are stored, never derived from one another: `rgbToHsv` rounds to whole
 * percents, so deriving RGBA would drift the hex on every keystroke, and deriving HSVA would collapse
 * the hue to `0` the moment the area reaches the greyscale axis.
 */
export class ColorPickerRootState {
	// $derived is lazy at runtime, but svelte-check's static analysis cannot see that and would flag
	// the field as read before its constructor assignment.
	#props!: ColorPickerRootStateProps;

	#rgb: RgbaColor = $state({ r: 0, g: 0, b: 0, a: 1 });
	#hsv: HsvaColor = $state({ h: 0, s: 0, v: 0, a: 1 });

	/**
	 * The last string this picker emitted. An incoming controlled `value` equal to it is the echo of
	 * our own write coming back through the binding, and re-parsing it would round an `hsl()`/`hsb()`
	 * string back into a slightly different colour on every interaction.
	 */
	#lastEmitted: string;

	readonly format: ColorFormat = $derived(this.#props.getFormat());
	readonly open: boolean = $derived(this.#props.getOpen());

	/**
	 * Whether the open popover traps focus and locks scrolling. bits-ui has no `modal` prop on
	 * `Popover.Root` — its equivalents live on the content — so `<ColorPicker.Content>` reads this and
	 * forwards it as `trapFocus`/`preventScroll`, which is exactly how Radix's own `modal` is wired.
	 */
	readonly modal: boolean = $derived(this.#props.getModal());

	readonly dir: Direction = $derived(this.#props.getDir());
	readonly inline: boolean = $derived(this.#props.getInline());
	readonly disabled: boolean = $derived(this.#props.getDisabled());
	readonly readOnly: boolean = $derived(this.#props.getReadOnly());
	readonly required: boolean = $derived(this.#props.getRequired());
	readonly name: string | undefined = $derived(this.#props.getName());

	/**
	 * Whether the picker has no colour at all — the caller handed it an empty `value`. This is the
	 * reachable form of upstream's `!color` branch, which decides between the swatch's
	 * `"Current color: …"` and `"No color selected"` accessible names.
	 */
	readonly isEmpty: boolean = $derived(this.#props.getValue().trim() === "");

	/** The authoritative colour. */
	get rgb(): RgbaColor {
		return this.#rgb;
	}

	/** The authoritative hue/saturation/brightness view of the same colour. */
	get hsv(): HsvaColor {
		return this.#hsv;
	}

	readonly hue: number = $derived(this.#hsv.h);
	readonly saturation: number = $derived(this.#hsv.s);
	readonly brightness: number = $derived(this.#hsv.v);
	readonly alpha: number = $derived(this.#rgb.a);
	readonly alphaPercent: number = $derived(Math.round(this.#rgb.a * 100));

	/** `#rrggbb` — what the hidden form input submits, whatever the display format. */
	readonly hex: string = $derived(rgbToHex(this.#rgb));

	/** The colour in the active notation — what `onValueChange` emits. */
	readonly formatted: string = $derived(colorToString(this.#rgb, this.format));

	/** The area's `aria-valuetext`. */
	readonly valueText: string = $derived(describeColor(this.#rgb, this.#hsv, this.format));

	/** The field set of the active format, alpha included. See {@link getFields}. */
	readonly inputFields: ColorPickerInputField[] = $derived(this.getFields(false));

	constructor(props: ColorPickerRootStateProps) {
		this.#props = props;

		const seed = props.getValue();
		const rgb = parseColorString(seed) ?? hexToRgb(seed);
		this.#rgb = rgb;
		this.#hsv = { ...rgbToHsv(rgb), a: rgb.a };
		this.#lastEmitted = seed;
	}

	/**
	 * The field set of the active format, optionally without its alpha field. Reactive: it reads
	 * `format`, `rgb` and `hsv`, so a caller wrapping it in `$derived` re-runs on every colour change.
	 */
	getFields(withoutAlpha: boolean): ColorPickerInputField[] {
		return getInputFields({
			format: this.format,
			rgb: this.#rgb,
			hsv: this.#hsv,
			withoutAlpha,
		});
	}

	/** Whether a colour mutation is allowed at all right now. */
	get #mutable(): boolean {
		return !this.disabled && !this.readOnly;
	}

	#emit(): void {
		const next = colorToString(this.#rgb, this.format);
		this.#lastEmitted = next;
		this.#props.setValue(next);
	}

	/** Write the colour from RGBA, recomputing the HSVA view and emitting `onValueChange`. */
	setFromRgb(rgb: RgbaColor): void {
		if (!this.#mutable || sameRgb(rgb, this.#rgb)) return;
		this.#rgb = rgb;
		this.#hsv = { ...rgbToHsv(rgb), a: rgb.a };
		this.#emit();
	}

	/** Write the colour from HSVA, recomputing the RGBA view and emitting `onValueChange`. */
	setFromHsv(hsv: HsvaColor): void {
		if (!this.#mutable) return;
		const rgb = hsvToRgb(hsv);
		if (
			hsv.h === this.#hsv.h &&
			hsv.s === this.#hsv.s &&
			hsv.v === this.#hsv.v &&
			hsv.a === this.#hsv.a
		) {
			return;
		}
		this.#hsv = hsv;
		this.#rgb = rgb;
		this.#emit();
	}

	/** The hue slider's only mutator. */
	setHue(hue: number): void {
		this.setFromHsv({ ...this.#hsv, h: clampChannel(hue, 0, 360) });
	}

	/** The 2D area's only mutator. */
	setSaturationBrightness(saturation: number, brightness: number): void {
		this.setFromHsv({
			...this.#hsv,
			s: clampChannel(saturation, 0, 100),
			v: clampChannel(brightness, 0, 100),
		});
	}

	/** The alpha slider's only mutator. Alpha lives on both representations at once. */
	setAlpha(alpha: number): void {
		if (!this.#mutable) return;
		const next = Math.min(1, Math.max(0, alpha));
		if (next === this.#rgb.a) return;
		this.#rgb = { ...this.#rgb, a: next };
		this.#hsv = { ...this.#hsv, a: next };
		this.#emit();
	}

	/** Change the display format. Touches no colour state whatsoever. */
	setFormat(format: ColorFormat): void {
		if (format === this.format) return;
		this.#props.setFormat(format);
	}

	/** Open or close the popover. Ignored entirely when `inline`. */
	setOpen(open: boolean): void {
		if (open === this.open) return;
		this.#props.setOpen(open);
	}

	/**
	 * Commit one input field. Returns whether the raw text was accepted; an out-of-range or
	 * unparseable value is *rejected* rather than clamped, exactly like upstream's
	 * `if (!Number.isNaN(value) && value >= 0 && value <= max)` guards.
	 */
	commitField(channel: ColorPickerInputChannel, raw: string): boolean {
		if (!this.#mutable) return false;

		if (channel === "hex") {
			const parsed = parseColorString(raw);
			if (!parsed) return false;
			this.setFromRgb({ ...parsed, a: this.#rgb.a });
			return true;
		}

		const value = Number.parseInt(raw, 10);
		if (Number.isNaN(value) || value < 0) return false;

		switch (channel) {
			case "r":
			case "g":
			case "b": {
				if (value > 255) return false;
				this.setFromRgb({ ...this.#rgb, [channel]: value });
				return true;
			}
			case "a": {
				if (value > 100) return false;
				this.setAlpha(value / 100);
				return true;
			}
			case "h": {
				if (value > 360) return false;
				if (this.format === "hsl") {
					this.setFromRgb(hslToRgb({ ...rgbToHsl(this.#rgb), h: value }, this.#rgb.a));
				} else {
					this.setFromHsv({ ...this.#hsv, h: value });
				}
				return true;
			}
			case "s": {
				if (value > 100) return false;
				if (this.format === "hsl") {
					this.setFromRgb(hslToRgb({ ...rgbToHsl(this.#rgb), s: value }, this.#rgb.a));
				} else {
					this.setFromHsv({ ...this.#hsv, s: value });
				}
				return true;
			}
			case "l": {
				if (value > 100) return false;
				this.setFromRgb(hslToRgb({ ...rgbToHsl(this.#rgb), l: value }, this.#rgb.a));
				return true;
			}
			case "v": {
				if (value > 100) return false;
				this.setFromHsv({ ...this.#hsv, v: value });
				return true;
			}
		}
	}

	/**
	 * Adopt a colour handed in from outside — a controlled `value`, or a `bind:value` the parent
	 * rewrote. Deliberately *not* guarded on `disabled`/`readOnly`: those suppress user interaction,
	 * not a parent that owns the value.
	 */
	syncFromValue(value: string): void {
		if (value === this.#lastEmitted) return;
		this.#lastEmitted = value;

		const next = readColor(value, this.#rgb.a);
		if (sameRgb(next, this.#rgb)) return;

		this.#rgb = next;
		this.#hsv = { ...rgbToHsv(next), a: next.a };
	}
}

/** The reactive values `<ColorPicker.Area>` hands its own state. */
export type ColorPickerAreaStateProps = {
	readonly root: ColorPickerRootState;
	readonly getStep: () => number;
	readonly getShiftStep: () => number;
};

/**
 * The 2D saturation/brightness area's pointer geometry and keyboard model.
 *
 * The keyboard half has no upstream counterpart at all — upstream's `ColorPickerArea`
 * is a bare `<div>` with no role, no `tabindex` and no `keydown`
 * handler. The APG has no 2D-picker pattern, so the primary axis (saturation) is exposed through the
 * standard slider properties and the whole state through `aria-valuetext`.
 */
export class ColorPickerAreaState {
	#props!: ColorPickerAreaStateProps;

	/** Whether a pointer drag is in flight, surfaced as `data-dragging`. */
	isDragging = $state(false);

	/** The fully saturated, fully bright form of the current hue — the area's base layer. */
	readonly backgroundColor: RgbaColor = $derived(
		hsvToRgb({ h: this.#props.root.hue, s: 100, v: 100, a: 1 }),
	);

	readonly thumbLeft: string = $derived(`${this.#props.root.saturation}%`);
	readonly thumbTop: string = $derived(`${100 - this.#props.root.brightness}%`);

	constructor(props: ColorPickerAreaStateProps) {
		this.#props = props;
	}

	/** The picker this area reads its colour from and writes its saturation/brightness back to. */
	get root(): ColorPickerRootState {
		return this.#props.root;
	}

	/**
	 * Map a pointer position inside `rect` onto saturation/brightness. Out-of-rect positions clamp
	 * rather than erroring, and the x axis mirrors under `dir="rtl"` so the crosshair stays under the
	 * finger in a mirrored layout. A zero-sized rect (jsdom, or a hidden panel) maps
	 * to the origin instead of dividing by zero.
	 */
	updateFromPointer(clientX: number, clientY: number, rect: DOMRect): void {
		const ratioX = rect.width > 0 ? (clientX - rect.left) / rect.width : 0;
		const ratioY = rect.height > 0 ? (clientY - rect.top) / rect.height : 0;

		const x = Math.max(0, Math.min(1, this.root.dir === "rtl" ? 1 - ratioX : ratioX));
		const y = Math.max(0, Math.min(1, 1 - ratioY));

		this.root.setSaturationBrightness(Math.round(x * 100), Math.round(y * 100));
	}

	/**
	 * The key table. Returns whether the key was handled, which is what the part turns into a
	 * `preventDefault()`.
	 */
	onKeydown(event: KeyboardEvent): boolean {
		if (this.root.disabled || this.root.readOnly) return false;

		const step = event.shiftKey ? this.#props.getShiftStep() : this.#props.getStep();
		const shiftStep = this.#props.getShiftStep();
		const rtl = this.root.dir === "rtl";

		let saturation = this.root.saturation;
		let brightness = this.root.brightness;

		switch (event.key) {
			case "ArrowRight":
				saturation += rtl ? -step : step;
				break;
			case "ArrowLeft":
				saturation += rtl ? step : -step;
				break;
			case "ArrowUp":
				brightness += step;
				break;
			case "ArrowDown":
				brightness -= step;
				break;
			case "Home":
				saturation = 0;
				break;
			case "End":
				saturation = 100;
				break;
			case "PageUp":
				brightness += shiftStep;
				break;
			case "PageDown":
				brightness -= shiftStep;
				break;
			default:
				return false;
		}

		this.root.setSaturationBrightness(saturation, brightness);
		return true;
	}
}

const COLOR_PICKER_CONTEXT_KEY = Symbol("color-picker");

/** Publish the root state. Called by `<ColorPicker.Root>` during its own initialisation. */
export function setColorPickerContext(state: ColorPickerRootState): ColorPickerRootState {
	return setContext(COLOR_PICKER_CONTEXT_KEY, state);
}

/**
 * Read the picker's reactive state, throwing when there is no `<ColorPicker.Root>` ancestor.
 *
 * This is also the replacement for upstream's exported `useStore as useColorPicker` selector hook:
 * runes subscribe automatically, so a consumer reads the slice it needs straight off the returned
 * state.
 */
export function getColorPickerContext(consumerName: string): ColorPickerRootState {
	if (!hasContext(COLOR_PICKER_CONTEXT_KEY)) {
		throw new Error(`\`${consumerName}\` must be used within \`<ColorPicker.Root>\`.`);
	}
	return getContext<ColorPickerRootState>(COLOR_PICKER_CONTEXT_KEY);
}
