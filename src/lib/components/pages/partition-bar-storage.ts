import type { PartitionBarVariant } from "$lib/components/ui/partition-bar/index.js";

/**
 * The disk-usage breakdown `PartitionBarPage.svelte` opens with.
 *
 * Page-local data, not component data: the bar's own use case is a total split into named parts,
 * and a first example made of `Apples 30% / Oranges 70%` shows
 * the mechanism without showing what it is for. The numbers are fixed rather than generated so the
 * page renders the same bar on every visit and a screenshot stays comparable.
 */
export type StorageSlice = {
	readonly label: string;
	readonly bytes: number;
	readonly variant: PartitionBarVariant;
};

const GB = 1024 ** 3;

/** One 512 GB volume. `Free` is last and quiet, so the used part reads as one block. */
export const STORAGE_SLICES: readonly StorageSlice[] = [
	{ label: "Documents", bytes: 96 * GB, variant: "default" },
	{ label: "Media", bytes: 152 * GB, variant: "info" },
	{ label: "Backups", bytes: 64 * GB, variant: "warning" },
	{ label: "Free", bytes: 200 * GB, variant: "muted" },
];

/** The volume, i.e. the sum of the slices — nothing is unaccounted for. */
export const STORAGE_CAPACITY = STORAGE_SLICES.reduce((total, slice) => total + slice.bytes, 0);

/** A slice as a whole percentage of {@link STORAGE_CAPACITY}. */
export function storageShare(bytes: number): string {
	return `${Math.round((bytes / STORAGE_CAPACITY) * 100)}%`;
}
