/**
 * The anchor id a `DocSection` derives from its title.
 *
 * DERIVED, NEVER DECLARED. The 1300 sections in the gallery already carry the one string that
 * names them, and asking each call site for a second one would be a sweep now and a drift later —
 * a title reworded without its id. The id is therefore the title's kebab: NFKD-decomposed so a
 * diacritic falls off rather than swallowing its letter, lowercased, every run of anything outside
 * `[a-z0-9]` collapsed to one `-`, and the ends trimmed. `Physics & Simulation` becomes
 * `physics-simulation`; `4:5 social media portrait aspect ratio` becomes
 * `4-5-social-media-portrait-aspect-ratio`.
 *
 * THE COST OF DERIVING IT is that rewording a title moves the address, and a link somebody
 * shared stops resolving. That is the trade this kit takes — the alternative is 1300 hand-written
 * ids nobody would keep in step — and `DocSection`'s `id` prop is the escape hatch for the
 * sections where it is not acceptable, which today means the one title that interpolates data.
 *
 * A DIGIT MAY LEAD, and that is fine where it matters: HTML puts no restriction on an id, and
 * both the browser's own fragment lookup and `document.getElementById` resolve it. Only
 * `querySelector("#4-5-…")` throws, so nothing in the gallery reaches a section through a `#id`
 * SELECTOR — `DocPage` looks its target up by id, which is also exactly what the browser does
 * with the fragment, so the two can never disagree about which element a link names.
 *
 * A plain `.ts` beside `DocSection.svelte` rather than a `<script module>` inside it, so a script
 * that audits titles can call the real function instead of a copy. It stays out of
 * `src/lib/shared/` because nothing published needs it: `DocSection` is a gallery surface the
 * registry does not ship.
 */
export function sectionId(title: string): string {
	return title
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}
