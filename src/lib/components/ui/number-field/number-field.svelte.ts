import { getContext, hasContext, setContext } from "svelte";
import { tv } from "tailwind-variants";

/** Every value `size` accepts, in upstream declaration order. */
export const NUMBER_FIELD_SIZES = ["sm", "default", "lg"] as const;

/** `'sm' | 'default' | 'lg'` — upstream's size union. */
export type NumberFieldSize = (typeof NUMBER_FIELD_SIZES)[number];

/** Every axis the scrub area can track, matching Base UI's `ScrubArea.direction`. */
export const NUMBER_FIELD_SCRUB_DIRECTIONS = ["horizontal", "vertical"] as const;

export type NumberFieldScrubDirection = (typeof NUMBER_FIELD_SCRUB_DIRECTIONS)[number];

/**
 * Press-and-hold timings: the first repeat waits, then ticks fast — the classic spinner cadence
 * `@base-ui/react`'s number field ships (https://base-ui.com/react/components/number-field).
 */
export const NUMBER_FIELD_SPIN_DELAY = 500;
export const NUMBER_FIELD_SPIN_INTERVAL = 60;

/**
 * Upstream `numberFieldGroupVariants`, translated from `cva` to
 * `tv()`, with two deliberate corrections:
 *
 * - **The `style-*` radius matrix collapses to `rounded-md`.** A skin system compiles one class per style
 *   preset (`style-vega:rounded-md style-nova:rounded-lg …`); this repo has a single style whose
 *   field radius is `rounded-md`, the radius `ui/input` uses.
 * - **Heights re-anchored to the house control ramp.** Upstream sits one step low (`sm` h-7 /
 *   `default` h-8 / `lg` h-9); docs/CONVENTIONS.md pins every sized control to the
 *   `--control-h-*` ramp (sm 32 / default 40 / lg 48), whose tokens the sizes below consume
 *   the way Button's do, and `sm` drops to `text-xs`,
 *   matching the `segmented-input` size ladder.
 */
export const numberFieldGroupVariants = tv({
	base: "relative flex w-full justify-between rounded-md border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 focus-within:has-aria-invalid:border-destructive focus-within:has-aria-invalid:ring-destructive/20 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:focus-within:has-aria-invalid:ring-destructive/40 dark:aria-invalid:ring-destructive/40 data-disabled:pointer-events-none data-disabled:opacity-50",
	variants: {
		size: {
			sm: "h-(--control-h-sm) text-xs",
			default: "h-(--control-h-default) text-sm",
			lg: "h-(--control-h-lg) text-sm",
		},
	},
	defaultVariants: {
		size: "default",
	},
});

/**
 * Upstream `numberFieldButtonVariants`. The upstream size rows are
 * text-mangled (the icon selector is duplicated with its head clipped); this theme keeps the one
 * intact selector per row — `[&_svg:not([class*='size-'])]` at `size-3.5` for `sm` and `size-4`
 * above it — so composed icons need no sizing classes.
 * `disabled:*` styling is added because this theme disables a button at its own bound, which
 * upstream delegates to Base UI's data attributes.
 */
export const numberFieldButtonVariants = tv({
	base: "relative flex shrink-0 cursor-pointer items-center justify-center transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50 pointer-coarse:after:absolute pointer-coarse:after:size-full pointer-coarse:after:min-h-11 pointer-coarse:after:min-w-11 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	variants: {
		size: {
			sm: "px-1.5 [&_svg:not([class*='size-'])]:size-3.5",
			default: "px-2 [&_svg:not([class*='size-'])]:size-4",
			lg: "px-2.5 [&_svg:not([class*='size-'])]:size-4",
		},
	},
	defaultVariants: {
		size: "default",
	},
});

/** Upstream `numberFieldInputVariants`, verbatim modulo `tv()`. */
export const numberFieldInputVariants = tv({
	base: "w-full min-w-0 flex-1 bg-transparent text-center tabular-nums outline-none",
	variants: {
		size: {
			sm: "px-2 py-0.5",
			default: "px-2.5 py-1",
			lg: "px-2.5 py-1.5",
		},
	},
	defaultVariants: {
		size: "default",
	},
});

/** `""` for an empty value; otherwise `Intl.NumberFormat`, exactly what Base UI displays. */
export function formatNumber(
	value: number | null,
	locale?: Intl.LocalesArgument,
	format?: Intl.NumberFormatOptions,
): string {
	if (value == null || Number.isNaN(value)) return "";
	return new Intl.NumberFormat(locale, format).format(value);
}

/** Decimal places of a number's canonical string form, so float noise can be rounded away. */
function decimalPlaces(value: number): number {
	if (!Number.isFinite(value)) return 0;
	const text = String(value);
	const exponent = text.indexOf("e-");
	if (exponent !== -1) return Number(text.slice(exponent + 2));
	const dot = text.indexOf(".");
	return dot === -1 ? 0 : text.length - dot - 1;
}

/**
 * Rounds `value` to the coarser precision its two operands actually carry, so `0.1 + 0.2` steps
 * land on `0.3` rather than `0.30000000000000004` — the same float clean-up every spinner needs.
 */
function roundToOperandPrecision(value: number, a: number, b: number): number {
	const places = Math.min(Math.max(decimalPlaces(a), decimalPlaces(b)), 20);
	return Number(value.toFixed(places));
}

/**
 * Locale-aware inverse of {@link formatNumber}: the group/decimal/minus glyphs are read off a
 * probe `formatToParts` call, everything else (currency symbols, percent signs, spaces) is
 * stripped, and a `style: "percent"` format divides by 100 so `"45%"` round-trips to `0.45`.
 * Pragmatic scope: latin digits only, like the keyboard input the field accepts.
 */
export function parseNumber(
	text: string,
	locale?: Intl.LocalesArgument,
	format?: Intl.NumberFormatOptions,
): number | null {
	const trimmed = text.trim();
	if (trimmed === "") return null;

	// `group` starts empty, not `","`: a format with grouping disabled emits no group part, and a
	// guessed separator would eat the decimal comma of locales like fr-FR.
	let group = "";
	let decimal = ".";
	let minus = "-";
	for (const part of new Intl.NumberFormat(locale, format).formatToParts(-11000.11)) {
		if (part.type === "group") group = part.value;
		else if (part.type === "decimal") decimal = part.value;
		else if (part.type === "minusSign") minus = part.value;
	}

	const normalized = (group === "" ? trimmed : trimmed.replaceAll(group, ""))
		.replaceAll(decimal, ".")
		.replaceAll(minus, "-")
		.replaceAll("−", "-")
		.replace(/[^0-9eE+.-]/g, "");
	if (normalized === "") return null;

	const parsed = Number(normalized);
	if (Number.isNaN(parsed)) return null;
	return format?.style === "percent" ? parsed / 100 : parsed;
}

export type NumberFieldRootStateProps = {
	readonly getValue: () => number | null;
	readonly setValue: (next: number | null) => void;
	readonly getMin: () => number | undefined;
	readonly getMax: () => number | undefined;
	readonly getStep: () => number;
	readonly getSmallStep: () => number;
	readonly getLargeStep: () => number;
	readonly getSnapOnStep: () => boolean;
	readonly getDisabled: () => boolean;
	readonly getReadOnly: () => boolean;
	readonly getRequired: () => boolean;
	readonly getInvalid: () => boolean;
	readonly getSize: () => NumberFieldSize;
	readonly getLocale: () => Intl.LocalesArgument | undefined;
	readonly getFormat: () => Intl.NumberFormatOptions | undefined;
	readonly getAllowWheelScrub: () => boolean;
	/** One-shot, like every other id in the repo; the label parts point their `for` at it. */
	readonly inputId: string;
};

/**
 * One instance per `<NumberField.Root>`, published on context.
 *
 * One context replaces two layers: the outer `NumberFieldContext`,
 * which only carries `fieldId` + `size`, and the `@base-ui/react` number-field machine behind it
 * (https://base-ui.com/react/components/number-field) — bits-ui 2.18 has no number field, so the
 * value semantics (clamp, step, hold-to-spin, parse/format round-trip) are hand-ported here.
 * Reactive inputs arrive as getter functions rather than snapshots.
 */
export class NumberFieldRootState {
	// $derived below is lazy at runtime (evaluated only when the field is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: NumberFieldRootStateProps;

	readonly value: number | null = $derived(this.#props.getValue());
	readonly min: number | undefined = $derived(this.#props.getMin());
	readonly max: number | undefined = $derived(this.#props.getMax());
	readonly step: number = $derived(this.#props.getStep());
	readonly smallStep: number = $derived(this.#props.getSmallStep());
	readonly largeStep: number = $derived(this.#props.getLargeStep());
	readonly snapOnStep: boolean = $derived(this.#props.getSnapOnStep());
	readonly disabled: boolean = $derived(this.#props.getDisabled());
	readonly readOnly: boolean = $derived(this.#props.getReadOnly());
	readonly required: boolean = $derived(this.#props.getRequired());
	readonly invalid: boolean = $derived(this.#props.getInvalid());
	readonly size: NumberFieldSize = $derived(this.#props.getSize());
	readonly locale: Intl.LocalesArgument | undefined = $derived(this.#props.getLocale());
	readonly format: Intl.NumberFormatOptions | undefined = $derived(this.#props.getFormat());
	readonly allowWheelScrub: boolean = $derived(this.#props.getAllowWheelScrub());

	/** What the input should show for the committed value; the input syncs its text from it. */
	readonly formattedValue: string = $derived(formatNumber(this.value, this.locale, this.format));

	/**
	 * A bound button reports itself `disabled` exactly like Base UI's does, so holding a spinner
	 * stops dead at min/max instead of silently no-oping.
	 */
	readonly canIncrement: boolean = $derived(
		!this.disabled &&
			!this.readOnly &&
			(this.value == null || this.max === undefined || this.value < this.max),
	);
	readonly canDecrement: boolean = $derived(
		!this.disabled &&
			!this.readOnly &&
			(this.value == null || this.min === undefined || this.value > this.min),
	);

	/** The rendered `<input>`, published by the input part so buttons can re-focus it. */
	inputElement: HTMLInputElement | null = $state(null);

	/**
	 * The text currently in the input. Owned here rather than in the input part so every mutation
	 * path — typing, stepping, committing — reads and writes one source of truth.
	 */
	#text = $state("");

	#spinTimeout: ReturnType<typeof setTimeout> | null = null;
	#spinInterval: ReturnType<typeof setInterval> | null = null;
	#detachSpinEnd: (() => void) | null = null;

	constructor(props: NumberFieldRootStateProps) {
		this.#props = props;
	}

	get inputId(): string {
		return this.#props.inputId;
	}

	get text(): string {
		return this.#text;
	}

	setText(next: string): void {
		this.#text = next;
	}

	#clamp(next: number): number {
		if (this.min !== undefined) next = Math.max(this.min, next);
		if (this.max !== undefined) next = Math.min(this.max, next);
		return next;
	}

	/**
	 * One step of `direction * amount`, from whatever the user can currently see: uncommitted
	 * typed text wins over the committed value, so ArrowUp after typing `50` yields 51 — Base UI's
	 * behaviour. An empty field is seeded with 0 (clamped into range); the delta is deliberately
	 * not applied to the seed, matching the ported machine's behaviour.
	 */
	applyStep(direction: 1 | -1, amount: number): void {
		if (this.disabled || this.readOnly) return;
		const typed = parseNumber(this.#text, this.locale, this.format);
		const base = typed ?? this.value;

		let next: number;
		if (base == null) {
			next = 0;
		} else {
			next = roundToOperandPrecision(base + direction * amount, base, amount);
			if (this.snapOnStep) {
				const origin = this.min ?? 0;
				next = roundToOperandPrecision(
					origin + Math.round((next - origin) / amount) * amount,
					origin,
					amount,
				);
			}
		}
		this.jumpTo(next);
	}

	/** Clamp-and-commit, shared by stepping, `Home`/`End` and the scrub area. */
	jumpTo(next: number): void {
		if (this.disabled || this.readOnly) return;
		const clamped = this.#clamp(next);
		this.#props.setValue(clamped);
		// Rewritten even when the value did not move (e.g. typed "150", ArrowUp, max 100): the
		// setValue guard fires no change, but the visible text must still return to the format.
		this.#text = formatNumber(clamped, this.locale, this.format);
	}

	/** Parse → clamp → reformat, the blur/Enter path. Unparseable text empties the field. */
	commit(): void {
		const parsed = parseNumber(this.#text, this.locale, this.format);
		if (parsed == null) {
			this.#props.setValue(null);
			this.#text = "";
			return;
		}
		this.jumpTo(parsed);
	}

	/**
	 * Press-and-hold: one immediate step, then after {@link NUMBER_FIELD_SPIN_DELAY} a steady
	 * {@link NUMBER_FIELD_SPIN_INTERVAL} tick. The `pointerup` listener lives on `window` because
	 * a button that hits its bound mid-hold goes `disabled` (`pointer-events-none`) and would
	 * never deliver the release event itself.
	 */
	startSpin(direction: 1 | -1): void {
		this.stopSpin();
		this.applyStep(direction, this.step);

		this.#spinTimeout = setTimeout(() => {
			this.#spinInterval = setInterval(
				() => this.applyStep(direction, this.step),
				NUMBER_FIELD_SPIN_INTERVAL,
			);
		}, NUMBER_FIELD_SPIN_DELAY);

		const end = () => this.stopSpin();
		window.addEventListener("pointerup", end);
		window.addEventListener("pointercancel", end);
		this.#detachSpinEnd = () => {
			window.removeEventListener("pointerup", end);
			window.removeEventListener("pointercancel", end);
		};
	}

	stopSpin(): void {
		if (this.#spinTimeout !== null) clearTimeout(this.#spinTimeout);
		if (this.#spinInterval !== null) clearInterval(this.#spinInterval);
		this.#spinTimeout = null;
		this.#spinInterval = null;
		this.#detachSpinEnd?.();
		this.#detachSpinEnd = null;
	}
}

const NUMBER_FIELD_CONTEXT_KEY = Symbol("number-field");

export function setNumberFieldContext(state: NumberFieldRootState): NumberFieldRootState {
	return setContext(NUMBER_FIELD_CONTEXT_KEY, state);
}

export function hasNumberFieldContext(): boolean {
	return hasContext(NUMBER_FIELD_CONTEXT_KEY);
}

/** Read the field's state, throwing when there is no `<NumberField.Root>` ancestor. */
export function getNumberFieldContext(consumerName: string): NumberFieldRootState {
	if (!hasNumberFieldContext()) {
		throw new Error(`\`${consumerName}\` must be used within \`<NumberField.Root>\`.`);
	}
	return getContext<NumberFieldRootState>(NUMBER_FIELD_CONTEXT_KEY);
}
