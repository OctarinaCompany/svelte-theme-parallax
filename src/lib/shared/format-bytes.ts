/**
 * The one human-readable byte formatter, in the house format: value, one space, unit — `'1.5 KB'`,
 * `'2 MB'`, `'0 B'`. The space is the classic theme's own convention (its docs print "Max size: 2 MB"), so
 * every feature that renders a size prints the same shape.
 *
 * Lives in `src/lib/shared/` (registry:lib pattern): consumed by `hooks/file-upload.svelte.ts`
 * (which re-exports it as `formatBytes`) and `data-grid` (whose `formatFileSize` delegates to it) —
 * kept out of any one component's folder so a registry install of one consumer does not drag in the
 * other.
 */
export function formatBytes(bytes: number, decimals = 2): string {
	if (bytes <= 0 || !Number.isFinite(bytes)) return "0 B";

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
	// Clamped at both ends: a fractional byte count (0 < bytes < 1) has a negative exponent,
	// which would index `sizes[-1]` and print "512 undefined" instead of "0.5 B".
	const index = Math.min(sizes.length - 1, Math.max(0, Math.floor(Math.log(bytes) / Math.log(k))));

	return `${Number.parseFloat((bytes / k ** index).toFixed(dm))} ${sizes[index]}`;
}
