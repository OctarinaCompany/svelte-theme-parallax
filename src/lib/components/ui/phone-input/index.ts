import Root from "./phone-input.svelte";
import CountrySelect from "./phone-input-country-select.svelte";
import Field from "./phone-input-field.svelte";

export type {
	PhoneInputChildProps,
	PhoneInputProps,
	PhoneInputRootProps,
} from "./phone-input.svelte";
export type { PhoneInputCountrySelectProps } from "./phone-input-country-select.svelte";
export type { PhoneInputFieldEvent, PhoneInputFieldProps } from "./phone-input-field.svelte";

export {
	getPhoneInputContext,
	hasPhoneInputContext,
	PhoneInputRootState,
	type PhoneInputRootStateProps,
	setPhoneInputContext,
} from "./phone-input.svelte.js";

// The reuse surface: the country table and the detect/format/normalise maths, all pure and
// rune-free, so another component can import them without rendering a phone field.
export {
	COUNTRY_DATA,
	type Country,
	DEFAULT_PHONE_PLACEHOLDER,
	detectCountryFromNumber,
	formatPhoneNumber,
	getCountries,
	getCountryName,
	getFlagEmoji,
	normalizePhoneInput,
} from "./phone-engine.js";

export {
	Root,
	CountrySelect,
	Field,
	//
	Root as PhoneInput,
	CountrySelect as PhoneInputCountrySelect,
	Field as PhoneInputField,
};
