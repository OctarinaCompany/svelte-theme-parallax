/**
 * Initials for an avatar fallback: first letter of the first two words, uppercased. A single-word
 * name yields one initial.
 *
 * Lives in `src/lib/shared/` (registry:lib pattern): consumed by `NavUser`, `AutocompletePage` and
 * `ComboboxPage` — kept out of the demo-data module so the helper survives the data it happens to
 * be applied to, and out of any one component's folder so registry installs stay minimal.
 */
export function getInitials(name: string): string {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]!.toUpperCase())
		.join("");
}
