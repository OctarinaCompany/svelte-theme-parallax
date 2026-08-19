import { getUnmaskedValue } from "$lib/components/ui/mask-input/index.js";

/**
 * One selectable entry of the country dropdown. Identical to upstream's `Country` interface
 * (`docs/types/radix/phone-input.ts`).
 */
export type Country = {
	/** ISO 3166-1 alpha-2 country code. */
	code: string;
	/** Country name. */
	name: string;
	/** Country calling code (e.g., `"+1"` for US). */
	dialCode: string;
	/** Optional flag emoji. */
	flag?: string;
};

/**
 * The built-in `[iso2, dialCode]` table, transcribed verbatim from upstream in upstream order.
 *
 * @see https://github.com/mukeshsoni/country-telephone-data/blob/master/country_telephone_data.js
 */
export const COUNTRY_DATA: readonly (readonly [string, string])[] = [
	["af", "93"],
	["ax", "358"],
	["al", "355"],
	["dz", "213"],
	["as", "1684"],
	["ad", "376"],
	["ao", "244"],
	["ai", "1264"],
	["ag", "1268"],
	["ar", "54"],
	["am", "374"],
	["aw", "297"],
	["au", "61"],
	["at", "43"],
	["az", "994"],
	["bs", "1242"],
	["bh", "973"],
	["bd", "880"],
	["bb", "1246"],
	["by", "375"],
	["be", "32"],
	["bz", "501"],
	["bj", "229"],
	["bm", "1441"],
	["bt", "975"],
	["bo", "591"],
	["ba", "387"],
	["bw", "267"],
	["br", "55"],
	["io", "246"],
	["vg", "1284"],
	["bn", "673"],
	["bg", "359"],
	["bf", "226"],
	["bi", "257"],
	["kh", "855"],
	["cm", "237"],
	["ca", "1"],
	["cv", "238"],
	["bq", "599"],
	["ky", "1345"],
	["cf", "236"],
	["td", "235"],
	["cl", "56"],
	["cn", "86"],
	["co", "57"],
	["km", "269"],
	["cd", "243"],
	["cg", "242"],
	["ck", "682"],
	["cr", "506"],
	["ci", "225"],
	["hr", "385"],
	["cu", "53"],
	["cw", "599"],
	["cy", "357"],
	["cz", "420"],
	["dk", "45"],
	["dj", "253"],
	["dm", "1767"],
	["do", "1"],
	["ec", "593"],
	["eg", "20"],
	["sv", "503"],
	["gq", "240"],
	["er", "291"],
	["ee", "372"],
	["et", "251"],
	["fk", "500"],
	["fo", "298"],
	["fj", "679"],
	["fi", "358"],
	["fr", "33"],
	["gf", "594"],
	["pf", "689"],
	["ga", "241"],
	["gm", "220"],
	["ge", "995"],
	["de", "49"],
	["gh", "233"],
	["gi", "350"],
	["gr", "30"],
	["gl", "299"],
	["gd", "1473"],
	["gp", "590"],
	["gu", "1671"],
	["gt", "502"],
	["gg", "44"],
	["gn", "224"],
	["gw", "245"],
	["gy", "592"],
	["ht", "509"],
	["hn", "504"],
	["hk", "852"],
	["hu", "36"],
	["is", "354"],
	["in", "91"],
	["id", "62"],
	["ir", "98"],
	["iq", "964"],
	["ie", "353"],
	["im", "44"],
	["il", "972"],
	["it", "39"],
	["jm", "1876"],
	["jp", "81"],
	["je", "44"],
	["jo", "962"],
	["kz", "7"],
	["ke", "254"],
	["ki", "686"],
	["xk", "383"],
	["kw", "965"],
	["kg", "996"],
	["la", "856"],
	["lv", "371"],
	["lb", "961"],
	["ls", "266"],
	["lr", "231"],
	["ly", "218"],
	["li", "423"],
	["lt", "370"],
	["lu", "352"],
	["mo", "853"],
	["mk", "389"],
	["mg", "261"],
	["mw", "265"],
	["my", "60"],
	["mv", "960"],
	["ml", "223"],
	["mt", "356"],
	["mh", "692"],
	["mq", "596"],
	["mr", "222"],
	["mu", "230"],
	["mx", "52"],
	["fm", "691"],
	["md", "373"],
	["mc", "377"],
	["mn", "976"],
	["me", "382"],
	["ms", "1664"],
	["ma", "212"],
	["mz", "258"],
	["mm", "95"],
	["na", "264"],
	["nr", "674"],
	["np", "977"],
	["nl", "31"],
	["nc", "687"],
	["nz", "64"],
	["ni", "505"],
	["ne", "227"],
	["ng", "234"],
	["nu", "683"],
	["nf", "672"],
	["kp", "850"],
	["mp", "1670"],
	["no", "47"],
	["om", "968"],
	["pk", "92"],
	["pw", "680"],
	["ps", "970"],
	["pa", "507"],
	["pg", "675"],
	["py", "595"],
	["pe", "51"],
	["ph", "63"],
	["pl", "48"],
	["pt", "351"],
	["pr", "1"],
	["qa", "974"],
	["re", "262"],
	["ro", "40"],
	["ru", "7"],
	["rw", "250"],
	["bl", "590"],
	["sh", "290"],
	["kn", "1869"],
	["lc", "1758"],
	["mf", "590"],
	["pm", "508"],
	["vc", "1784"],
	["ws", "685"],
	["sm", "378"],
	["st", "239"],
	["sa", "966"],
	["sn", "221"],
	["rs", "381"],
	["sc", "248"],
	["sl", "232"],
	["sg", "65"],
	["sx", "1721"],
	["sk", "421"],
	["si", "386"],
	["sb", "677"],
	["so", "252"],
	["za", "27"],
	["kr", "82"],
	["ss", "211"],
	["es", "34"],
	["lk", "94"],
	["sd", "249"],
	["sr", "597"],
	["sz", "268"],
	["se", "46"],
	["ch", "41"],
	["sy", "963"],
	["tw", "886"],
	["tj", "992"],
	["tz", "255"],
	["th", "66"],
	["tl", "670"],
	["tg", "228"],
	["tk", "690"],
	["to", "676"],
	["tt", "1868"],
	["tn", "216"],
	["tr", "90"],
	["tm", "993"],
	["tc", "1649"],
	["tv", "688"],
	["vi", "1340"],
	["ug", "256"],
	["ua", "380"],
	["ae", "971"],
	["gb", "44"],
	["us", "1"],
	["uy", "598"],
	["uz", "998"],
	["vu", "678"],
	["va", "39"],
	["ve", "58"],
	["vn", "84"],
	["wf", "681"],
	["eh", "212"],
	["ye", "967"],
	["zm", "260"],
	["zw", "263"],
];

/** The root's placeholder when the caller supplies none. */
export const DEFAULT_PHONE_PLACEHOLDER = "Enter phone number";

/**
 * The display name of a region, falling back to the code itself when the platform cannot resolve
 * it. `locale` is not exposed as a prop — upstream hard-codes the default too.
 */
export function getCountryName(countryCode: string, locale = "en"): string {
	try {
		const regionNames = new Intl.DisplayNames([locale], { type: "region" });
		return regionNames.of(countryCode) ?? countryCode;
	} catch {
		return countryCode;
	}
}

/** The regional-indicator pair for a country code, e.g. `"US"` becomes the US flag emoji. */
export function getFlagEmoji(countryCode: string): string {
	const codePoints = countryCode
		.toUpperCase()
		.split("")
		.map((char) => 127397 + char.charCodeAt(0));
	return String.fromCodePoint(...codePoints);
}

/**
 * The 239 built-in countries, sorted by display name.
 *
 * Memoised: upstream re-derives the list on every render (a React default-argument evaluation),
 * which produces byte-identical output but repeats 239 `Intl.DisplayNames` lookups. The cached
 * array is the value every root defaults to, so it must never be mutated — every consumer that
 * sorts (see {@link detectCountryFromNumber}) works on a copy.
 */
let countriesCache: Country[] | undefined;

export function getCountries(): Country[] {
	countriesCache ??= COUNTRY_DATA.map(([iso2, dialCode]): Country => {
		const code = iso2.toUpperCase();
		return {
			code,
			name: getCountryName(code),
			dialCode: `+${dialCode}`,
			flag: getFlagEmoji(code),
		};
	}).sort((a, b) => a.name.localeCompare(b.name));

	return countriesCache;
}

/** Every digit of a string, the one step this engine shares with `mask-input`. */
function digitsOf(value: string): string {
	return getUnmaskedValue({ value });
}

/**
 * The country a canonical value belongs to, or `undefined` when nothing matches.
 *
 * Longest dial code first, so `+1242` beats `+1`; when the best match is `+1` — shared by more than
 * twenty countries — the US entry wins. A shared non-`+1` dial code has no tie-break, so the first
 * entry in the caller's list order wins (the sort is stable).
 */
export function detectCountryFromNumber(value: string, countries: Country[]): Country | undefined {
	if (!value?.startsWith("+")) return undefined;

	const digits = digitsOf(value.slice(1));
	if (!digits) return undefined;

	const sorted = [...countries].sort((a, b) => b.dialCode.length - a.dialCode.length);

	const matches: Country[] = [];
	for (const country of sorted) {
		if (digits.startsWith(country.dialCode.slice(1))) {
			matches.push(country);
		}
	}

	if (matches.length === 0) return undefined;

	if (matches.length > 1 && matches[0]?.dialCode === "+1") {
		const usCountry = matches.find((country) => country.code === "US");
		if (usCountry) return usCountry;
	}

	return matches[0];
}

/**
 * The display string for a canonical value: the detected dial code, then the remaining digits in
 * groups of three. Deliberately not a national format — upstream ships no per-country grouping.
 */
export function formatPhoneNumber(value: string, countries: Country[]): string {
	if (!value) return "";

	const normalized = value.startsWith("+") ? value : `+${value}`;

	const digits = digitsOf(normalized.slice(1));
	if (!digits) return "+";

	const detected = detectCountryFromNumber(`+${digits}`, countries);
	const dialCodeLength = detected ? detected.dialCode.slice(1).length : Math.min(digits.length, 3);

	const countryCode = digits.slice(0, dialCodeLength);
	const rest = digits.slice(dialCodeLength);

	let formatted = `+${countryCode}`;

	if (rest) {
		formatted += " ";
		for (let i = 0; i < rest.length; i++) {
			if (i > 0 && i % 3 === 0) {
				formatted += " ";
			}
			formatted += rest[i];
		}
	}

	return formatted;
}

/**
 * Turn what the user typed into the canonical value, plus whether they led with a `+` — the flag
 * that decides when auto-detection may run.
 */
export function normalizePhoneInput(raw: string): { value: string; startsWithPlus: boolean } {
	const startsWithPlus = raw.startsWith("+");
	const digits = digitsOf(raw);

	return {
		value: digits ? `+${digits}` : startsWithPlus ? "+" : "",
		startsWithPlus,
	};
}
