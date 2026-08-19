/**
 * The mask/format/caret engine behind `<MaskInput>`, kept free of runes and of the DOM so another
 * component (a future `phone-input`) can import the pattern table and the formatting helpers without
 * rendering anything, and so the module is safe to evaluate on the server.
 *
 * A 1:1 translation of the pure half of the reference implementation's `mask-input.tsx`.
 */

const PAST_YEARS_LIMIT = 120;
const FUTURE_YEARS_LIMIT = 10;

/** The currency used when none is supplied, and the fallback when `Intl` rejects the caller's. */
export const DEFAULT_CURRENCY = "USD";
/** The locale used when none is supplied, and the fallback when `Intl` rejects the caller's. */
export const DEFAULT_LOCALE = "en-US";

/** Mask keys whose slots only ever hold digits, and which therefore get `inputmode="numeric"`. */
export const NUMERIC_MASK_PATTERNS =
	/^(phone|zipCode|zipCodeExtended|ssn|ein|time|date|creditCard|creditCardExpiry|isbn)$/;

/** Patterns carrying one of these symbols are formatted by `Intl`, not slot-by-slot. */
export const CURRENCY_PERCENTAGE_SYMBOLS = /[€$%]/;

type CurrencySymbols = {
	currency: string;
	decimal: string;
	group: string;
};

const formattersCache = new Map<string, Intl.NumberFormat>();
const currencyAtEndCache = new Map<string, boolean>();
const currencySymbolsCache = new Map<string, CurrencySymbols>();
const daysInMonthCache = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

const REGEX_CACHE = {
	digitsOnly: /^\d+$/,
	nonDigits: /\D/g,
	nonAlphaNumeric: /[^A-Z0-9]/gi,
	nonNumericDot: /[^0-9.]/g,
	nonCurrencyChars: /[^\d.,]/g,
	hashPattern: /#/g,
	currencyAtEnd: /\d\s*[^\d\s]+$/,
	percentageChars: /[^\d.]/g,
	phone: /^\d{10}$/,
	ssn: /^\d{9}$/,
	zipCode: /^\d{5}$/,
	zipCodeExtended: /^\d{9}$/,
	isbn: /^\d{13}$/,
	ein: /^\d{9}$/,
	time: /^\d{4}$/,
	creditCard: /^\d{13,19}$/,
	creditCardExpiry: /^\d{4}$/,
	licensePlate: /^[A-Z0-9]{6}$/,
	macAddress: /^[A-F0-9]{12}$/,
	currencyValidation: /^\d+(\.\d{1,2})?$/,
	ipv4Segment: /^\d{1,3}$/,
} as const;

/** Options handed to a pattern's `transform` function. */
export type TransformOptions = {
	/** ISO 4217 currency code, used by the currency transform. */
	currency?: string;
	/** BCP 47 locale tag, used by the currency transform. */
	locale?: string;
};

/** Options handed to a pattern's `validate` function. */
export type ValidateOptions = {
	/** Lower bound for numeric patterns such as `percentage`. */
	min?: number;
	/** Upper bound for numeric patterns such as `percentage`. */
	max?: number;
};

/** A mask definition: the slot template plus how to unmask and how to judge a value. */
export type MaskPattern = {
	/** The slot template, where `#` is a value slot and every other character is a literal. */
	pattern: string;
	/** Turns what the user typed into the raw, unformatted value. Defaults to "digits only". */
	transform?: (value: string, opts?: TransformOptions) => string;
	/** Decides whether an unmasked value is complete and well-formed. */
	validate?: (value: string, opts?: ValidateOptions) => boolean;
};

/** The keys of the built-in {@link MASK_PATTERNS} table. */
export type MaskPatternKey =
	| "phone"
	| "ssn"
	| "date"
	| "time"
	| "creditCard"
	| "creditCardExpiry"
	| "zipCode"
	| "zipCodeExtended"
	| "currency"
	| "percentage"
	| "licensePlate"
	| "ipv4"
	| "macAddress"
	| "isbn"
	| "ein";

function getCachedFormatter(
	locale: string | undefined,
	opts: Intl.NumberFormatOptions,
): Intl.NumberFormat {
	const { currency, minimumFractionDigits = 0, maximumFractionDigits = 2 } = opts;

	const key = `${locale}|${currency}|${minimumFractionDigits}|${maximumFractionDigits}`;

	if (!formattersCache.has(key)) {
		try {
			formattersCache.set(
				key,
				new Intl.NumberFormat(locale, {
					style: "currency",
					currency,
					...opts,
				}),
			);
		} catch {
			formattersCache.set(
				key,
				new Intl.NumberFormat(DEFAULT_LOCALE, {
					style: "currency",
					currency: DEFAULT_CURRENCY,
					...opts,
				}),
			);
		}
	}

	const formatter = formattersCache.get(key);
	if (!formatter) {
		throw new Error(`Failed to create formatter for ${key}`);
	}
	return formatter;
}

function getCachedCurrencySymbols(opts: TransformOptions): CurrencySymbols {
	const { locale, currency } = opts;

	const key = `${locale}|${currency}`;
	const cached = currencySymbolsCache.get(key);
	if (cached) {
		return cached;
	}

	let currencySymbol = "$";
	let decimalSeparator = ".";
	let groupSeparator = ",";

	try {
		const formatter = getCachedFormatter(locale, {
			currency,
			minimumFractionDigits: 0,
			maximumFractionDigits: 2,
		});
		const parts = formatter.formatToParts(1234.5);
		const currencyPart = parts.find((part) => part.type === "currency");
		const decimalPart = parts.find((part) => part.type === "decimal");
		const groupPart = parts.find((part) => part.type === "group");

		if (currencyPart) currencySymbol = currencyPart.value;
		if (decimalPart) decimalSeparator = decimalPart.value;
		if (groupPart) groupSeparator = groupPart.value;
	} catch {
		// Keep defaults
	}

	const symbols: CurrencySymbols = {
		currency: currencySymbol,
		decimal: decimalSeparator,
		group: groupSeparator,
	};
	currencySymbolsCache.set(key, symbols);
	return symbols;
}

/** Whether this locale/currency pair renders the symbol after the number (`1.234 €`). */
export function isCurrencyAtEnd(opts: TransformOptions): boolean {
	const { locale, currency } = opts;

	const key = `${locale}|${currency}`;
	const cached = currencyAtEndCache.get(key);
	if (cached !== undefined) {
		return cached;
	}

	try {
		const formatter = getCachedFormatter(locale, {
			currency,
			minimumFractionDigits: 0,
			maximumFractionDigits: 0,
		});
		const sample = formatter.format(123);
		const result = REGEX_CACHE.currencyAtEnd.test(sample);
		currencyAtEndCache.set(key, result);
		return result;
	} catch {
		currencyAtEndCache.set(key, false);
		return false;
	}
}

/** Whether the active mask formats money, by key or by the symbol in its pattern. */
export function isCurrencyMask(opts: {
	mask: MaskPatternKey | MaskPattern | undefined;
	pattern?: string;
}): boolean {
	const { mask, pattern } = opts;

	return (
		mask === "currency" || Boolean(pattern && (pattern.includes("$") || pattern.includes("€")))
	);
}

/** The built-in mask table, in upstream declaration order. */
export const MASK_PATTERNS: Record<MaskPatternKey, MaskPattern> = {
	phone: {
		pattern: "(###) ###-####",
		transform: (value) => value.replace(REGEX_CACHE.nonDigits, ""),
		validate: (value) => REGEX_CACHE.phone.test(value.replace(REGEX_CACHE.nonDigits, "")),
	},
	ssn: {
		pattern: "###-##-####",
		transform: (value) => value.replace(REGEX_CACHE.nonDigits, ""),
		validate: (value) => REGEX_CACHE.ssn.test(value.replace(REGEX_CACHE.nonDigits, "")),
	},
	date: {
		pattern: "##/##/####",
		transform: (value) => value.replace(REGEX_CACHE.nonDigits, ""),
		validate: (value) => {
			const cleaned = value.replace(REGEX_CACHE.nonDigits, "");
			if (cleaned.length !== 8) return false;
			const month = parseInt(cleaned.substring(0, 2), 10);
			const day = parseInt(cleaned.substring(2, 4), 10);
			const year = parseInt(cleaned.substring(4, 8), 10);

			const currentYear = new Date().getFullYear();
			const minYear = currentYear - PAST_YEARS_LIMIT;
			const maxYear = currentYear + FUTURE_YEARS_LIMIT;
			if (month < 1 || month > 12 || day < 1 || year < minYear || year > maxYear) return false;

			const maxDays =
				month === 2 && ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0)
					? 29
					: (daysInMonthCache[month - 1] ?? 31);

			return day <= maxDays;
		},
	},
	time: {
		pattern: "##:##",
		transform: (value) => value.replace(REGEX_CACHE.nonDigits, ""),
		validate: (value) => {
			const cleaned = value.replace(REGEX_CACHE.nonDigits, "");
			if (!REGEX_CACHE.time.test(cleaned)) return false;
			const hours = parseInt(cleaned.substring(0, 2), 10);
			const minutes = parseInt(cleaned.substring(2, 4), 10);
			return hours <= 23 && minutes <= 59;
		},
	},
	creditCard: {
		pattern: "#### #### #### ####",
		transform: (value) => value.replace(REGEX_CACHE.nonDigits, ""),
		validate: (value) => {
			const cleaned = value.replace(REGEX_CACHE.nonDigits, "");
			if (!REGEX_CACHE.creditCard.test(cleaned)) return false;

			let sum = 0;
			let isEven = false;
			for (let i = cleaned.length - 1; i >= 0; i--) {
				const digitChar = cleaned[i];
				if (!digitChar) continue;
				let digit = parseInt(digitChar, 10);
				if (isEven) {
					digit *= 2;
					if (digit > 9) {
						digit -= 9;
					}
				}
				sum += digit;
				isEven = !isEven;
			}
			return sum % 10 === 0;
		},
	},
	creditCardExpiry: {
		pattern: "##/##",
		transform: (value) => value.replace(REGEX_CACHE.nonDigits, ""),
		validate: (value) => {
			const cleaned = value.replace(REGEX_CACHE.nonDigits, "");
			if (!REGEX_CACHE.creditCardExpiry.test(cleaned)) return false;

			const month = parseInt(cleaned.substring(0, 2), 10);
			const year = parseInt(cleaned.substring(2, 4), 10);

			if (month < 1 || month > 12) return false;

			const now = new Date();
			const currentYear = now.getFullYear();
			const currentMonth = now.getMonth() + 1;

			const fullYear = year <= 75 ? 2000 + year : 1900 + year;

			if (fullYear < currentYear || (fullYear === currentYear && month < currentMonth)) {
				return false;
			}

			const maxYear = currentYear + 50;
			if (fullYear > maxYear) {
				return false;
			}

			return true;
		},
	},
	zipCode: {
		pattern: "#####",
		transform: (value) => value.replace(REGEX_CACHE.nonDigits, ""),
		validate: (value) => REGEX_CACHE.zipCode.test(value.replace(REGEX_CACHE.nonDigits, "")),
	},
	zipCodeExtended: {
		pattern: "#####-####",
		transform: (value) => value.replace(REGEX_CACHE.nonDigits, ""),
		validate: (value) => REGEX_CACHE.zipCodeExtended.test(value.replace(REGEX_CACHE.nonDigits, "")),
	},
	currency: {
		pattern: "$###,###.##",
		transform: (value, { currency = DEFAULT_CURRENCY, locale = DEFAULT_LOCALE } = {}) => {
			let localeDecimalSeparator = ".";

			try {
				const formatter = getCachedFormatter(locale, {
					currency,
					minimumFractionDigits: 0,
					maximumFractionDigits: 2,
				});
				const parts = formatter.formatToParts(1234.5);
				const decimalPart = parts.find((part) => part.type === "decimal");

				if (decimalPart) localeDecimalSeparator = decimalPart.value;
			} catch {
				// Keep defaults
			}

			const cleaned = value.replace(REGEX_CACHE.nonCurrencyChars, "");

			const dotIndex = cleaned.indexOf(".");
			const commaIndex = cleaned.indexOf(",");

			let hasDecimalSeparator = false;
			let decimalIndex = -1;

			if (localeDecimalSeparator === ",") {
				const lastCommaIndex = cleaned.lastIndexOf(",");
				if (lastCommaIndex !== -1) {
					const afterComma = cleaned.substring(lastCommaIndex + 1);
					if (afterComma.length <= 2 && /^\d*$/.test(afterComma)) {
						hasDecimalSeparator = true;
						decimalIndex = lastCommaIndex;
					}
				}

				if (!hasDecimalSeparator && dotIndex !== -1) {
					const afterDot = cleaned.substring(dotIndex + 1);
					if (afterDot.length <= 2 && /^\d*$/.test(afterDot)) {
						hasDecimalSeparator = true;
						decimalIndex = dotIndex;
					}
				}

				if (!hasDecimalSeparator && cleaned.length >= 4) {
					const match = cleaned.match(/^(\d+)\.(\d{3})(\d{1,2})$/);
					if (match) {
						const [, beforeDot, thousandsPart, decimalPart] = match;
						const integerPart = (beforeDot ?? "") + (thousandsPart ?? "");
						const result = `${integerPart}.${decimalPart}`;
						return result;
					}
				}
			} else {
				const lastDotIndex = cleaned.lastIndexOf(".");
				if (lastDotIndex !== -1) {
					const afterDot = cleaned.substring(lastDotIndex + 1);
					if (afterDot.length <= 2 && /^\d*$/.test(afterDot)) {
						hasDecimalSeparator = true;
						decimalIndex = lastDotIndex;
					}
				}

				if (!hasDecimalSeparator && commaIndex !== -1) {
					const afterComma = cleaned.substring(commaIndex + 1);
					const looksLikeThousands = commaIndex <= 3 && afterComma.length >= 3;
					if (!looksLikeThousands && afterComma.length <= 2 && /^\d*$/.test(afterComma)) {
						hasDecimalSeparator = true;
						decimalIndex = commaIndex;
					}
				}
			}

			if (hasDecimalSeparator && decimalIndex !== -1) {
				const beforeDecimal = cleaned.substring(0, decimalIndex).replace(/[.,]/g, "");
				const afterDecimal = cleaned.substring(decimalIndex + 1).replace(/[.,]/g, "");

				if (afterDecimal === "") {
					const result = `${beforeDecimal}.`;
					return result;
				}

				const result = `${beforeDecimal}.${afterDecimal.substring(0, 2)}`;
				return result;
			}

			const digitsOnly = cleaned.replace(/[.,]/g, "");
			return digitsOnly;
		},
		validate: (value) => {
			if (!REGEX_CACHE.currencyValidation.test(value)) return false;
			const num = parseFloat(value);
			return !Number.isNaN(num) && num >= 0;
		},
	},
	percentage: {
		pattern: "##.##%",
		transform: (value) => {
			const cleaned = value.replace(REGEX_CACHE.percentageChars, "");
			const parts = cleaned.split(".");
			if (parts.length > 2) {
				return `${parts[0]}.${parts.slice(1).join("")}`;
			}
			if (parts[1] && parts[1].length > 2) {
				return `${parts[0]}.${parts[1].substring(0, 2)}`;
			}
			return cleaned;
		},
		validate: (value, opts = {}) => {
			const num = parseFloat(value);
			const min = opts.min ?? 0;
			const max = opts.max ?? 100;
			return !Number.isNaN(num) && num >= min && num <= max;
		},
	},
	licensePlate: {
		pattern: "###-###",
		transform: (value) => value.replace(REGEX_CACHE.nonAlphaNumeric, "").toUpperCase(),
		validate: (value) => REGEX_CACHE.licensePlate.test(value),
	},
	ipv4: {
		pattern: "###.###.###.###",
		transform: (value) => value.replace(REGEX_CACHE.nonNumericDot, ""),
		validate: (value) => {
			if (value.includes(".")) {
				const segments = value.split(".");
				if (segments.length > 4) return false;

				return segments.every((segment) => {
					if (segment === "") return true;
					if (!REGEX_CACHE.ipv4Segment.test(segment)) return false;
					const num = parseInt(segment, 10);
					return num <= 255;
				});
			} else {
				if (!REGEX_CACHE.digitsOnly.test(value)) return false;
				if (value.length > 12) return false;

				const chunks = [];
				for (let i = 0; i < value.length; i += 3) {
					chunks.push(value.substring(i, i + 3));
				}

				if (chunks.length > 4) return false;

				return chunks.every((chunk) => {
					const num = parseInt(chunk, 10);
					return num >= 0 && num <= 255;
				});
			}
		},
	},
	macAddress: {
		pattern: "##:##:##:##:##:##",
		transform: (value) => value.replace(REGEX_CACHE.nonAlphaNumeric, "").toUpperCase(),
		validate: (value) => REGEX_CACHE.macAddress.test(value),
	},
	isbn: {
		pattern: "###-#-###-#####-#",
		transform: (value) => value.replace(REGEX_CACHE.nonDigits, ""),
		validate: (value) => REGEX_CACHE.isbn.test(value.replace(REGEX_CACHE.nonDigits, "")),
	},
	ein: {
		pattern: "##-#######",
		transform: (value) => value.replace(REGEX_CACHE.nonDigits, ""),
		validate: (value) => REGEX_CACHE.ein.test(value.replace(REGEX_CACHE.nonDigits, "")),
	},
};

/** The built-in mask keys, in {@link MASK_PATTERNS} declaration order. */
export const MASK_PATTERN_KEYS = Object.keys(MASK_PATTERNS) as readonly MaskPatternKey[];

/** Resolves the `mask` prop to a {@link MaskPattern}: a key looks the table up, an object is itself. */
export function resolveMaskPattern(
	mask: MaskPatternKey | MaskPattern | undefined,
): MaskPattern | undefined {
	if (typeof mask === "string") {
		return MASK_PATTERNS[mask];
	}
	return mask;
}

/** Formats an already-unmasked value against a pattern, currency or percentage rules included. */
export function applyMask(opts: {
	value: string;
	pattern: string;
	currency?: string;
	locale?: string;
	mask?: MaskPatternKey | MaskPattern;
}): string {
	const { value, pattern, currency, locale, mask } = opts;

	const cleanValue = value;

	if (pattern.includes("$") || pattern.includes("€") || mask === "currency") {
		return applyCurrencyMask({
			value: cleanValue,
			currency: currency ?? DEFAULT_CURRENCY,
			locale: locale ?? DEFAULT_LOCALE,
		});
	}

	if (pattern.includes("%")) {
		return applyPercentageMask(cleanValue);
	}

	if (mask === "ipv4") {
		return cleanValue;
	}

	const maskedChars: string[] = [];
	let valueIndex = 0;

	for (let i = 0; i < pattern.length && valueIndex < cleanValue.length; i++) {
		const patternChar = pattern[i];
		const valueChar = cleanValue[valueIndex];

		if (patternChar === "#" && valueChar) {
			maskedChars.push(valueChar);
			valueIndex++;
		} else if (patternChar) {
			maskedChars.push(patternChar);
		}
	}

	return maskedChars.join("");
}

/** Formats a raw numeric string as money through `Intl.NumberFormat`. */
export function applyCurrencyMask(opts: {
	value: string;
	currency?: string;
	locale?: string;
}): string {
	const { value, currency = DEFAULT_CURRENCY, locale = DEFAULT_LOCALE } = opts;

	if (!value) return "";

	const {
		currency: currencySymbol,
		decimal: decimalSeparator,
		group: groupSeparator,
	} = getCachedCurrencySymbols({ locale, currency });

	const normalizedValue = value
		.replace(new RegExp(`\\${groupSeparator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "g"), "")
		.replace(decimalSeparator, ".");

	const parts = normalizedValue.split(".");
	const integerPart = parts[0] ?? "";
	const fractionalPart = parts[1] ?? "";

	if (!integerPart && !fractionalPart) return "";

	const intValue = integerPart ?? "0";
	const fracValue = fractionalPart.slice(0, 2);

	const num = Number(`${intValue}.${fracValue ?? ""}`);

	if (Number.isNaN(num)) {
		const cleanedDigits = value.replace(/[^\d]/g, "");
		if (!cleanedDigits) return "";
		return `${currencySymbol}${cleanedDigits}`;
	}

	const hasExplicitDecimal = value.includes(".") || value.includes(decimalSeparator);

	try {
		const formatter = getCachedFormatter(locale, {
			currency,
			minimumFractionDigits: fracValue ? fracValue.length : 0,
			maximumFractionDigits: 2,
		});
		const result = formatter.format(num);

		if (hasExplicitDecimal && !fracValue) {
			if (result.match(/^[^\d\s]+/)) {
				const finalResult = result.replace(/(\d)$/, `$1${decimalSeparator}`);
				return finalResult;
			} else {
				const finalResult = result.replace(/(\d)(\s*)([^\d\s]+)$/, `$1${decimalSeparator}$2$3`);
				return finalResult;
			}
		}

		return result;
	} catch {
		const formattedInt = intValue.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
		let result = `${currencySymbol}${formattedInt}`;
		if (hasExplicitDecimal) {
			result += `${decimalSeparator}${fracValue}`;
		}

		return result;
	}
}

/** Appends the percent sign and clamps the fraction to two digits. */
export function applyPercentageMask(value: string): string {
	if (!value) return "";

	const parts = value.split(".");
	let result = parts[0] ?? "0";

	if (value.includes(".")) {
		result += `.${(parts[1] ?? "").substring(0, 2)}`;
	}

	return `${result}%`;
}

/** Strips the mask from a displayed value, through the pattern's `transform` or digits-only. */
export function getUnmaskedValue(opts: {
	value: string;
	currency?: string;
	locale?: string;
	transform?: (value: string, opts?: TransformOptions) => string;
}): string {
	const { value, transform, currency, locale } = opts;

	return transform
		? transform(value, { currency, locale })
		: value.replace(REGEX_CACHE.nonDigits, "");
}

/** How many value slots sit before `caret` in a masked string. */
export function toUnmaskedIndex(opts: { masked: string; pattern: string; caret: number }): number {
	const { masked, pattern, caret } = opts;

	let idx = 0;
	for (let i = 0; i < caret && i < masked.length && i < pattern.length; i++) {
		if (pattern[i] === "#") {
			idx++;
		}
	}

	return idx;
}

/** Where the caret sits in a masked string once `unmaskedIndex` value slots have been passed. */
export function fromUnmaskedIndex(opts: {
	masked: string;
	pattern: string;
	unmaskedIndex: number;
}): number {
	const { masked, pattern, unmaskedIndex } = opts;

	// Zero slots passed: the caret belongs at the first value slot, not at the end fallback.
	if (unmaskedIndex <= 0) {
		const first = pattern.indexOf("#");
		return first === -1 ? 0 : Math.min(first, masked.length);
	}

	let seen = 0;
	for (let i = 0; i < masked.length && i < pattern.length; i++) {
		if (pattern[i] === "#") {
			seen++;
			if (seen === unmaskedIndex) {
				return i + 1;
			}
		}
	}

	return masked.length;
}

/** Where the caret belongs after an `Intl`-formatted currency or percentage value was rewritten. */
export function getCurrencyCaretPosition(opts: {
	newValue: string;
	mask: MaskPatternKey | MaskPattern | undefined;
	transformOpts: TransformOptions;
	oldCursorPosition?: number;
	oldValue?: string;
	previousUnmasked?: string;
}): number {
	const { newValue, mask, transformOpts, oldCursorPosition, oldValue, previousUnmasked } = opts;

	if (oldCursorPosition !== undefined && oldValue && previousUnmasked !== undefined) {
		if (oldCursorPosition < oldValue.length) {
			const digitsBeforeCursor = oldValue.substring(0, oldCursorPosition).replace(/\D/g, "").length;

			let digitCount = 0;
			for (let i = 0; i < newValue.length; i++) {
				if (/\d/.test(newValue[i] ?? "")) {
					digitCount++;
					if (digitCount === digitsBeforeCursor) {
						return i + 1;
					}
				}
			}
		}
	}

	if (mask === "currency") {
		const currencyAtEnd = isCurrencyAtEnd(transformOpts);
		if (currencyAtEnd) {
			const match = newValue.match(/(\d)\s*([^\d\s]+)$/);
			if (match?.[1]) {
				return newValue.lastIndexOf(match[1]) + 1;
			} else {
				return newValue.length;
			}
		} else {
			return newValue.length;
		}
	} else {
		return newValue.length;
	}
}

/** Where the caret belongs after a slot pattern was rewritten. */
export function getPatternCaretPosition(opts: {
	newValue: string;
	maskPattern: MaskPattern;
	currentUnmasked: string;
	oldCursorPosition?: number;
	oldValue?: string;
	previousUnmasked?: string;
}): number {
	const { newValue, maskPattern, currentUnmasked, oldCursorPosition, oldValue, previousUnmasked } =
		opts;
	let position = 0;
	let unmaskedCount = 0;

	if (oldCursorPosition !== undefined && oldValue && previousUnmasked !== undefined) {
		const oldUnmaskedIndex = toUnmaskedIndex({
			masked: oldValue,
			pattern: maskPattern.pattern,
			caret: oldCursorPosition,
		});

		if (oldCursorPosition < oldValue.length) {
			const targetUnmaskedIndex = Math.min(oldUnmaskedIndex, currentUnmasked.length);

			for (let i = 0; i < maskPattern.pattern.length && i < newValue.length; i++) {
				if (maskPattern.pattern[i] === "#") {
					unmaskedCount++;
					if (unmaskedCount <= targetUnmaskedIndex) {
						position = i + 1;
					}
				}
			}

			return position;
		}
	}

	for (let i = 0; i < maskPattern.pattern.length && i < newValue.length; i++) {
		if (maskPattern.pattern[i] === "#") {
			unmaskedCount++;
			if (unmaskedCount <= currentUnmasked.length) {
				position = i + 1;
			}
		}
	}

	return position;
}
