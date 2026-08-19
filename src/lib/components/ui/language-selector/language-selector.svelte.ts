import { getContext, hasContext, setContext } from "svelte";

import type { Direction } from "$lib/components/ui/direction-provider/index.js";

/**
 * The catalog type, the default catalog, and the state the four parts coordinate through.
 *
 * Built to a rendered reference — no source was consulted — so what is reproduced is the block
 * as it
 * RENDERS: an outline trigger naming the current language, a dialog headed "Select Language", and a
 * two-column grid of tiles carrying a native name over an English one, the chosen tile outlined in
 * the primary colour with a check mark on its right. The eight locales below are that grid's, in its
 * order.
 *
 * The i18n vocabulary is shadcn-admin-kit's (https://marmelab.com/shadcn-admin-kit/docs/translation/):
 * an `i18nProvider` with `getLocale`, `changeLocale` and an optional `getLocales`, where a LOCALE is
 * a language plus, where it matters, a country. That is why the catalog is a prop and a plain array
 * rather than something this component owns — `getLocales()` is the caller's to answer, and a kit
 * component that shipped a fixed list of languages would be answering it for them.
 *
 * WHAT THIS COMPONENT DOES NOT DO: translate. It moves a locale code, and that is the whole of it.
 * Nothing here reads or writes `document.documentElement.lang`, `localStorage`, or any app-wide
 * store, so the scope of a change is exactly the scope of the state the caller bound to it — a
 * `$state` in one page changes that page, a store shared by the app changes the app. The Language
 * selector page demonstrates the first, deliberately.
 */

/**
 * One entry in the catalog.
 *
 * BOTH NAMES ARE REQUIRED, which is upstream's grid and also the accessible answer: the native name
 * is the one a speaker of that language recognises, and the English one is what a reader who does
 * NOT speak it can still act on — the case that matters most, because a reader stranded in a
 * language they cannot read is exactly who opens this dialog.
 *
 * NO FLAG FIELD, and its absence is a decision rather than an omission. The block's own description
 * advertises "flag icons" and the block does not render any, which is the right call twice over: a
 * flag is a country and a locale is a language (Portuguese is not Brazil, Arabic is not any one of
 * the twenty-odd states that speak it), and flag emoji do not render at all on Windows, where the
 * font ships the letter pair instead of the flag. {@link Locale.code} carries the same information
 * as text that renders everywhere.
 */
export type Locale = {
	/**
	 * The locale's own identifier, and the value this component moves. A BCP 47 tag (`fr`,
	 * `pt-BR`) if the caller has one, but nothing here parses it — an application whose provider
	 * keys on something else is free to use that instead.
	 */
	code: string;
	/** The language's name IN that language: `Français`, `日本語`. */
	nativeName: string;
	/** The language's name in English: `French`, `Japanese`. */
	englishName: string;
	/**
	 * The reading direction of that language, when it is not the caller's own. Rendered as `dir` on
	 * the tile, so a right-to-left name reads correctly inside a left-to-right dialog, and readable
	 * by the caller for the surface the choice applies to.
	 * @default "ltr"
	 */
	dir?: Direction;
	/**
	 * How complete the translation is, 0-100. Optional, and the tile renders a bar only for the
	 * locales that declare one — a catalog with nothing to report should not grow a row of full
	 * bars saying so.
	 */
	completion?: number;
};

/**
 * The block's own eight locales, in the block's own order.
 *
 * A DEFAULT, NOT A FIXTURE: it is what makes `<LanguageSelector.Root>` render something on its own,
 * and any application with real translations passes its own list. The order is upstream's and is
 * roughly by speaker count rather than alphabetical, which is worth keeping — a picker sorted by
 * how likely a reader is to want each entry beats one sorted by how their names happen to spell.
 *
 * `en` first for the same reason it is this kit's own language: it is the fallback every other
 * entry falls back TO, and a list whose first row is the fallback needs no separate note saying so.
 */
export const LOCALES: readonly Locale[] = [
	{ code: "en", nativeName: "English", englishName: "English" },
	{ code: "es", nativeName: "Español", englishName: "Spanish" },
	{ code: "fr", nativeName: "Français", englishName: "French" },
	{ code: "de", nativeName: "Deutsch", englishName: "German" },
	{ code: "pt", nativeName: "Português", englishName: "Portuguese" },
	{ code: "ja", nativeName: "日本語", englishName: "Japanese" },
	{ code: "zh", nativeName: "中文", englishName: "Chinese" },
	{ code: "ko", nativeName: "한국어", englishName: "Korean" },
];

/** The entry `code` names, or `undefined` when the catalog does not contain it. */
export function localeByCode(
	locales: readonly Locale[],
	code: string | undefined,
): Locale | undefined {
	if (code === undefined) return undefined;
	return locales.find((locale) => locale.code === code);
}

const LANGUAGE_SELECTOR_CONTEXT_KEY = Symbol("language-selector");

export type LanguageSelectorStateProps = {
	readonly getValue: () => string;
	readonly setValue: (value: string) => void;
	readonly getLocales: () => readonly Locale[];
	readonly setOpen: (open: boolean) => void;
	readonly getCloseOnSelect: () => boolean;
};

/** One instance per `<LanguageSelector.Root>`. Published on context; the three parts read it. */
export class LanguageSelectorState {
	// `$derived` is lazy at runtime but svelte-check cannot see that across the constructor
	// assignment — the same annotation `DirectionProviderState` carries, for the same reason.
	#props!: LanguageSelectorStateProps;

	/** The catalog, as the Root was given it. */
	readonly locales: readonly Locale[] = $derived(this.#props.getLocales());

	/** The selected code, which is the caller's state and not a copy of it. */
	readonly value: string = $derived(this.#props.getValue());

	/**
	 * The selected ENTRY, or `undefined` when the value names nothing in the catalog.
	 *
	 * Undefined is a state the trigger renders rather than throws on: a value can outlive the entry
	 * it named — a stored preference for a locale a later release dropped, a catalog fetched after
	 * the first paint — and a picker that crashes on it is a picker that cannot be used to fix it.
	 */
	readonly current: Locale | undefined = $derived(localeByCode(this.locales, this.value));

	constructor(props: LanguageSelectorStateProps) {
		this.#props = props;
	}

	/**
	 * Apply a choice: write the value, then close if the Root asks for it.
	 *
	 * The write is guarded on a real change, per `CONVENTIONS.md` §6 — `onValueChange` fires when
	 * the value MOVES, and re-picking the current language is not a change. The close is not
	 * guarded, and the asymmetry is deliberate: a reader who opens the dialog, reads the list and
	 * clicks the language they were already using has finished with the dialog either way, and
	 * leaving it up would read as the click having missed.
	 */
	select(code: string): void {
		if (code !== this.#props.getValue()) this.#props.setValue(code);
		if (this.#props.getCloseOnSelect()) this.#props.setOpen(false);
	}
}

export function setLanguageSelectorContext(state: LanguageSelectorState): LanguageSelectorState {
	return setContext(LANGUAGE_SELECTOR_CONTEXT_KEY, state);
}

export function hasLanguageSelectorContext(): boolean {
	return hasContext(LANGUAGE_SELECTOR_CONTEXT_KEY);
}

/** @param part The part's tag, so the message names the component that was misplaced. */
export function getLanguageSelectorContext(part: string): LanguageSelectorState {
	if (!hasLanguageSelectorContext()) {
		throw new Error(`\`${part}\` must be used within \`<LanguageSelector.Root>\`.`);
	}
	return getContext<LanguageSelectorState>(LANGUAGE_SELECTOR_CONTEXT_KEY);
}
