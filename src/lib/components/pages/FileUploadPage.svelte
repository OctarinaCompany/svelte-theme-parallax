<script lang="ts">
	import * as Alert from "$lib/components/ui/alert/index.js";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Progress } from "$lib/components/ui/progress/index.js";
	import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
	import CircleUserRoundIcon from "@lucide/svelte/icons/circle-user-round";
	import CircleXIcon from "@lucide/svelte/icons/circle-x";
	import CloudUploadIcon from "@lucide/svelte/icons/cloud-upload";
	import DownloadIcon from "@lucide/svelte/icons/download";
	import FileArchiveIcon from "@lucide/svelte/icons/file-archive";
	import FileSpreadsheetIcon from "@lucide/svelte/icons/file-spreadsheet";
	import FileTextIcon from "@lucide/svelte/icons/file-text";
	import GripVerticalIcon from "@lucide/svelte/icons/grip-vertical";
	import HeadphonesIcon from "@lucide/svelte/icons/headphones";
	import ImageIcon from "@lucide/svelte/icons/image";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import RefreshCwIcon from "@lucide/svelte/icons/refresh-cw";
	import Trash2Icon from "@lucide/svelte/icons/trash-2";
	import UploadIcon from "@lucide/svelte/icons/upload";
	import UserIcon from "@lucide/svelte/icons/user";
	import VideoIcon from "@lucide/svelte/icons/video";
	import XIcon from "@lucide/svelte/icons/x";
	import ZoomInIcon from "@lucide/svelte/icons/zoom-in";
	import { DragDropProvider } from "@dnd-kit-svelte/svelte";
	import { useSortable } from "@dnd-kit-svelte/svelte/sortable";
	import { move } from "@dnd-kit/helpers";
	import { SvelteMap } from "svelte/reactivity";
	import { toast } from "svelte-sonner";
	import {
		FileUpload,
		formatBytes,
		isImage,
		type FileMetadata,
		type FileWithPreview,
	} from "$lib/hooks/file-upload.svelte.js";
	import { cn } from "$lib/utils.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The File upload component page — its ten examples in the order that page gives them.
	 *
	 * The examples here compose the same Card, Button, Progress, Alert, Badge, Dialog,
	 * Table and Tooltip primitives the rest of this repository uses, against the same token
	 * names. The theme work is confined
	 * to the four places where a demo reaches past the token set — all four recorded below.
	 *
	 * WHERE THE STATE LIVES. `useFileUpload` became {@link FileUpload} in
	 * `$lib/hooks/file-upload.svelte.ts`, one class per example. That file documents the
	 * translation, including the two upstream bugs it declines to reproduce.
	 *
	 * FOUR DELIBERATE DIVERGENCES, none of them cosmetic:
	 *
	 * 1. NO PHOTOGRAPHS. A stock gallery would seed itself from a photo service. This repository
	 *    ships no images and fetches none — `dashboard.ts` already records the same for avatars,
	 *    and the Page headers page already substitutes a gradient for the classic theme's cover
	 *    photograph. A seeded entry here therefore has no URL and renders as {@link thumb}'s
	 *    token gradient; a file you actually pick renders as a real `<img>`, which is the half
	 *    that matters. Two pieces of upstream scaffolding exist only to cover slow remote
	 *    images — the gallery's per-thumbnail load spinner and the cover's "Loading image…"
	 *    pulse — and both are dropped, because an object URL is decoded before the next frame
	 *    and neither would ever be seen.
	 *
	 * 2. THE ERROR ALERT IS SOLID. shadcn's stock `destructive` alert is a tinted card with
	 *    red type; this theme regenerates every alert to a full-strength ground with
	 *    contrast-picked type, which is the whole subject of the Alerts page — so the alert
	 *    on this page is skinned to match its neighbour. Same
	 *    reasoning for the two soft badges: the `*-subtle` family is this theme's spelling of
	 *    the light-badge idea.
	 *
	 * 3. NO RAW PALETTE COLOURS. Hand-pinned zinc steps — on the round overlay buttons and on
	 *    the progress bars — have no token equivalent here, and §12 of the
	 *    theme notes forbids writing the hex; the buttons use the `outline` variant they were
	 *    already asking for, and the bars keep the `bg-primary` indicator that
	 *    `progress-bar-bg: primary` wants anyway.
	 *
	 * 4. TWO EXAMPLES ARE ROUTED THROUGH THE HOOK. "Image upload" and "Image upload with
	 *    sorting" hand-roll their own state — their own validation strings, their own
	 *    `document.createElement('input')` dialog, and a list of default images kept separate
	 *    from the uploaded ones, which is why the first of the two renders two adjacent grids
	 *    that look like one. Both go through {@link FileUpload} here, like the other eight, and
	 *    the two grids collapse into the one grid they already looked like. Shipping a second
	 *    implementation of a component's own state on the page that documents it would be a
	 *    defect, not fidelity.
	 *
	 * ONE THING THIS PAGE DOES NOT DO: upload anything. Every progress bar on it is
	 * {@link UploadQueue}, a simulation — as it is upstream.
	 */

	/* ---------------------------------------------------------------------------------------
	 * Shared recipes
	 * ------------------------------------------------------------------------------------ */

	/**
	 * The dropzone outline, in three parts because they conflict.
	 *
	 * `cn()` rather than interpolation is mandatory here and is mistake #1 in §16 of the theme
	 * notes: `class="{dropzone} {active}"` would put `border-muted-foreground/25` and
	 * `border-primary` on the same element and let Tailwind's sort order pick the winner.
	 *
	 * `rounded-lg` is `--radius-lg`, the card radius — these boxes sit inside a card and read
	 * as a panel within it.
	 *
	 * EVERY DROPZONE CARRIES `role="group"` AND A LABEL. A `<div>` holding
	 * drag handlers has behaviour and no semantics, and Svelte's compiler says so
	 * (`a11y_no_static_element_interactions`); this repository builds at zero warnings, so the
	 * question had to be answered rather than suppressed. `group` is the honest answer: the box
	 * is a set of controls — a button and its instructions — and not itself a control, because
	 * dropping is never the only way in. The one dropzone that IS the only way in, the Avatar
	 * example's circle, is a `<button>` instead.
	 */
	const dropzone = "rounded-lg border border-dashed transition-colors";
	const dropzoneIdle = "border-muted-foreground/25 hover:border-muted-foreground/50";
	const dropzoneActive = "border-primary bg-primary/5";

	/** {@link dropzone}'s three parts resolved for a given drag state. */
	const zone = (dragging: boolean) => cn(dropzone, dragging ? dropzoneActive : dropzoneIdle);

	/**
	 * The alert shape, copied from the Alerts page: `alert-padding-x` / `alert-padding-y` and
	 * `alert-border-radius`. Geometry only — the colours come from `variant="solid-destructive"`,
	 * which also carries the `border-transparent` that keeps the 1px box from changing size.
	 */
	const alertShape = "rounded-md px-5 py-3";

	/**
	 * A round overlay button — remove, zoom, drag — sitting on top of a thumbnail.
	 *
	 * `size-6` is `icon-xs` here rather than a class override: the variant
	 * already resolves to `size-6` and carries the smaller icon size and corner radius with it.
	 * `opacity-0 group-hover/item:opacity-100` is the reveal-on-hover.
	 *
	 * `focus-visible:opacity-100` is not. A control revealed only by hover is a control a
	 * keyboard cannot reach: tabbing lands on it, the focus ring is drawn — and both are painted
	 * at zero opacity, so focus vanishes into the page. Every reveal-on-hover button upstream
	 * has this; it is the one accessibility fault worth fixing rather than reproducing.
	 */
	const overlayButton =
		"rounded-full opacity-0 shadow-sm transition-opacity group-hover/item:opacity-100 focus-visible:opacity-100";

	/**
	 * The circumference of {@link ring}'s circle, `2πr` with `r = 20`.
	 *
	 * Upstream draws this ring three times at three sizes — 32/48/64px, with radii 14/20/28 and
	 * stroke widths 2/3/4 — which is one viewBox scaled three ways: 3/48 of 32px is 2px, of
	 * 64px is 4px. So one snippet with one geometry reproduces all three, and the caller only
	 * chooses a `size-*`.
	 */
	const RING = 2 * Math.PI * 20;

	/**
	 * The wash over a thumbnail, and what is legible on top of it.
	 *
	 * A literal `bg-black/50` + `text-white` wash is fixed by construction. No single
	 * token is: every one of them inverts, which is mistake #2 of §16 waiting to happen. Two
	 * PAIRS do hold, and both hold across all twelve palettes —
	 *
	 *   dark in both modes    `--foreground` in light (the ink) and `--background` in dark
	 *                         (the same ink, now the page). The Alerts page pins its `dark`
	 *                         variant the same way.
	 *   light in both modes   `--background` in light (near-white) and `--foreground` in dark
	 *                         (`#FFFFFF`, in the classic theme and in all eleven generated palettes).
	 *
	 * `--primary-foreground` looks like the obvious answer for the type and is the wrong one:
	 * it is white for the classic theme, but ten of the eleven generated palettes have a brand light
	 * enough that their dark mode puts DARK type on it — `#3B3D40` for Graphite, `#463B2B` for
	 * Sepia. That type over a dark wash is unreadable, and only in dark mode, and only on ten
	 * of twelve themes, which is exactly the kind of thing that ships.
	 *
	 * Three strengths because upstream uses three: 40% under the cover's actions, 50% under an
	 * overlay of buttons, 70% under a caption that has to be read.
	 */
	const scrimSoft = "bg-foreground/40 dark:bg-background/40";
	const scrim = "bg-foreground/50 dark:bg-background/50";
	const scrimStrong = "bg-foreground/70 dark:bg-background/70";
	const onScrim = "text-background dark:text-foreground";
	const onScrimMuted = "text-background/30 dark:text-foreground/30";

	/**
	 * The progress track.
	 *
	 * `h-1` is the small progress height — 4px — so the
	 * two agree. `bg-secondary` is the theme half: `progress-bg` is `--bs-secondary-bg`, which
	 * `--secondary` holds, where the shadcn component defaults to `bg-muted`. The Progress page
	 * derives both values; this is the same `trackSm` it lands on.
	 */
	const progressTrack = "h-1 rounded-full bg-secondary";

	/**
	 * Thumbnails for seeded images, standing in for photographs — divergence 1 above.
	 *
	 * Every stop is a token, so the set follows the palette: switch to Ember or Moss from the
	 * page header and these change with everything else. `/30` keeps them quiet enough to read
	 * as a placeholder rather than as content, in both modes.
	 */
	const GRADIENTS = [
		"from-primary/30 to-info/30",
		"from-info/30 to-success/30",
		"from-success/30 to-warning/30",
		"from-warning/30 to-destructive/30",
		"from-destructive/30 to-primary/30",
	];

	/** Stable per-entry gradient: the same seeded file always gets the same one. */
	function gradientFor(id: string): string {
		let sum = 0;
		for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
		return GRADIENTS[sum % GRADIENTS.length];
	}

	/** The file-icon lookup, written once rather than as a seven-branch `if` repeated four times. */
	function iconFor(type: string) {
		if (type.startsWith("image/")) return ImageIcon;
		if (type.startsWith("video/")) return VideoIcon;
		if (type.startsWith("audio/")) return HeadphonesIcon;
		if (type.includes("excel") || type.includes("sheet")) return FileSpreadsheetIcon;
		if (type.includes("zip") || type.includes("rar")) return FileArchiveIcon;
		return FileTextIcon;
	}

	/** The file-type label, used by the Table example's Type column. */
	function labelFor(type: string): string {
		if (type.startsWith("image/")) return "Image";
		if (type.startsWith("video/")) return "Video";
		if (type.startsWith("audio/")) return "Audio";
		if (type.includes("pdf")) return "PDF";
		if (type.includes("word") || type.includes("doc")) return "Word";
		if (type.includes("excel") || type.includes("sheet")) return "Excel";
		if (type.includes("zip") || type.includes("rar")) return "Archive";
		if (type.includes("json")) return "JSON";
		if (type.includes("text")) return "Text";
		return "File";
	}

	/** Total bytes held, for the galleries that print one. */
	const totalBytes = (files: FileWithPreview[]) =>
		formatBytes(files.reduce((sum, entry) => sum + entry.file.size, 0));

	/* ---------------------------------------------------------------------------------------
	 * The upload simulation
	 * ------------------------------------------------------------------------------------ */

	type UploadStatus = "uploading" | "completed" | "error";

	type UploadState = { progress: number; status: UploadStatus; error?: string };

	/** What {@link UploadQueue.get} answers for a file it has never seen. */
	const SETTLED: UploadState = { progress: 100, status: "completed" };

	/**
	 * Per-file progress, keyed by file id.
	 *
	 * Five of the ten examples would each carry their own copy of this: an `interface FileUploadItem
	 * extends FileWithPreview`, a `useState` list kept in step with the hook's through
	 * `onFilesChange`, and a `setInterval` that walks it. Five copies of one idea, and the
	 * copies have already drifted — one fails a file mid-flight, another only at 100%, and they
	 * tick at 100ms, 200ms and 500ms. Written once, the drift becomes three arguments.
	 *
	 * `SvelteMap`, not `$state(new Map())`, for the same reason `App.svelte` uses one: `$state`
	 * does not track mutations of a built-in `Map`, so `set()` would update nothing.
	 */
	class UploadQueue {
		#state = new SvelteMap<string, UploadState>();
		#step: number;
		#failureRate: number;

		/**
		 * True while at least one file is still climbing.
		 *
		 * A PLAIN BOOLEAN, RECOMPUTED ON WRITE, rather than a getter that scans `#state`.
		 * `SvelteMap.values()` calls `#read_all()`, which subscribes to every per-key source
		 * before it yields anything — an early `return true` narrows nothing. An effect that
		 * read such a getter would therefore depend on every value in the map, and `#tick()`
		 * writes those values: the timer would invalidate the effect that owns it, tearing the
		 * interval down and building a new one on every tick. Assigning the same `false` twice
		 * is a no-op in runes, so this version settles.
		 */
		busy = $state(false);

		/**
		 * @param options.every Milliseconds between ticks.
		 * @param options.step Maximum progress added per tick, in percent.
		 * @param options.failureRate Chance a finishing upload fails instead. Upstream's 0.1.
		 */
		constructor(options: { every?: number; step?: number; failureRate?: number } = {}) {
			this.#step = options.step ?? 20;
			this.#failureRate = options.failureRate ?? 0.1;

			/*
			 * The timer exists only while something is actually uploading: finishing the last
			 * file tears the interval down and picking a new one creates it again, where
			 * upstream leaves an interval running for the life of the page — ten of them on a
			 * page like this one.
			 */
			const every = options.every ?? 500;
			$effect(() => {
				if (!this.busy) return;

				const timer = setInterval(() => this.#tick(), every);
				return () => clearInterval(timer);
			});
		}

		/** The state of one file, or a settled one for anything this queue never adopted. */
		get = (id: string): UploadState => this.#state.get(id) ?? SETTLED;

		count = (status: UploadStatus): number => {
			let total = 0;
			for (const entry of this.#state.values()) if (entry.status === status) total++;
			return total;
		};

		/**
		 * Mark files as already on the server.
		 *
		 * Called once, after construction, for whatever `initialFiles` seeded — which cannot be
		 * a constructor argument, because the queue has to exist before the {@link FileUpload}
		 * whose `onFilesChange` calls it. Without this the page would open with every seeded
		 * file climbing a progress bar it never asked for.
		 */
		seed = (files: FileWithPreview[]) => {
			for (const entry of files) this.#state.set(entry.id, { ...SETTLED });
			this.#settle();
		};

		/**
		 * Adopt whatever the hook now holds: anything new starts at zero, anything gone is
		 * forgotten. Wired to `onFilesChange`, which is the only thing that moves that list.
		 */
		sync = (files: FileWithPreview[]) => {
			const live = new Set(files.map((entry) => entry.id));

			for (const id of [...this.#state.keys()]) if (!live.has(id)) this.#state.delete(id);
			for (const entry of files) {
				if (!this.#state.has(entry.id)) {
					this.#state.set(entry.id, { progress: 0, status: "uploading" });
				}
			}
			this.#settle();
		};

		retry = (id: string) => {
			this.#state.set(id, { progress: 0, status: "uploading" });
			this.#settle();
		};

		/** Recompute {@link busy}. Every write goes through here; nothing else sets it. */
		#settle() {
			let busy = false;
			for (const entry of this.#state.values()) {
				if (entry.status === "uploading") {
					busy = true;
					break;
				}
			}
			this.busy = busy;
		}

		#tick() {
			for (const [id, entry] of this.#state) {
				if (entry.status !== "uploading") continue;

				const progress = Math.min(entry.progress + Math.random() * this.#step + 5, 100);
				if (progress < 100) {
					this.#state.set(id, { ...entry, progress });
					continue;
				}

				const failed = Math.random() < this.#failureRate;
				this.#state.set(id, {
					progress: 100,
					status: failed ? "error" : "completed",
					error: failed ? "Upload failed. Please try again." : undefined,
				});
			}

			this.#settle();
		}
	}

	/* ---------------------------------------------------------------------------------------
	 * Seeded files
	 *
	 * Sizes are fixed byte counts; `formatBytes()` prints them in the house format — a space
	 * before the unit, '2 MB'. Image entries carry no `url` — see divergence 1.
	 * ------------------------------------------------------------------------------------ */

	const image = (id: string, name: string, size: number): FileMetadata => ({
		id,
		name,
		size,
		type: "image/png",
	});

	const galleryFiles: FileMetadata[] = [
		image("gallery-1", "avatar-1.png", 44608),
		image("gallery-2", "avatar-2.png", 42144),
		image("gallery-3", "avatar-3.png", 42144),
	];

	const progressFiles: FileMetadata[] = [
		image("progress-1", "image-1.png", 42048),
		image("progress-2", "image-2.png", 62807),
	];

	const tableFiles: FileMetadata[] = [
		{ id: "table-1", name: "document.pdf", size: 529254, type: "application/pdf" },
		{ id: "table-2", name: "intro.zip", size: 252846, type: "application/zip" },
		{
			id: "table-3",
			name: "conclusion.xlsx",
			size: 353126,
			type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		},
		{ id: "table-4", name: "package.json", size: 697, type: "application/json" },
	];

	const productFiles: FileMetadata[] = [
		image("product-1", "product-view-1.png", 148_480),
		image("product-2", "product-view-2.png", 132_096),
		image("product-3", "product-view-3.png", 121_856),
		image("product-4", "product-view-4.png", 160_768),
	];

	const sortableFiles: FileMetadata[] = [
		...productFiles.map((file) => ({ ...file, id: `sortable-${file.id}` })),
		image("sortable-product-5", "product-view-5.png", 139_264),
	];

	const cardFiles: FileMetadata[] = [
		{ id: "card-1", name: "intro.zip", size: 252846, type: "application/zip" },
		{ id: "card-2", name: "image-01.jpg", size: 1536000, type: "image/jpeg" },
		{ id: "card-3", name: "audio.mp3", size: 1536000, type: "audio/mpeg" },
	];

	/* ---------------------------------------------------------------------------------------
	 * One instance per example
	 *
	 * All ten are constructed here, during component initialisation, because `FileUpload` and
	 * `UploadQueue` both register an `$effect` — the same rule `IsMobile` states.
	 * ------------------------------------------------------------------------------------ */

	/** 1 — Basic. A picker beside a 36px preview; single file, images only. */
	const basic = new FileUpload({ accept: "image/*" });

	/** 2 — Avatar. The dropzone IS the avatar; 2MB, one file. */
	const AVATAR_MAX = 2 * 1024 * 1024;
	const avatar = new FileUpload({ maxFiles: 1, maxSize: AVATAR_MAX, accept: "image/*" });

	/** 3 — Drag and drop. A single row: button, thumbnails, count. */
	const COMPACT_MAX_FILES = 3;
	const compact = new FileUpload({
		maxFiles: COMPACT_MAX_FILES,
		maxSize: 2 * 1024 * 1024,
		accept: "image/*",
		multiple: true,
	});

	/** 4 — Gallery. A grid with a zoom dialog over it. */
	const GALLERY_MAX_FILES = 10;
	const GALLERY_MAX = 5 * 1024 * 1024;
	const gallery = new FileUpload({
		maxFiles: GALLERY_MAX_FILES,
		maxSize: GALLERY_MAX,
		accept: "image/*",
		multiple: true,
		initialFiles: galleryFiles,
	});

	/** The entry the zoom dialog is showing, or null. `bind:open` reads it as a boolean. */
	let zoomed = $state<FileWithPreview | null>(null);

	/** 5 — Progress. A stacked list, each row with its own bar and its own retry. */
	const PROGRESS_MAX = 10 * 1024 * 1024;
	const progressQueue = new UploadQueue();
	const progressUpload = new FileUpload({
		maxFiles: 5,
		maxSize: PROGRESS_MAX,
		multiple: true,
		initialFiles: progressFiles,
		onFilesChange: (files) => progressQueue.sync(files),
	});
	progressQueue.seed(progressUpload.files);

	/** 6 — Table. The same list as rows, with a ring in place of a bar. */
	const TABLE_MAX_FILES = 10;
	const TABLE_MAX = 50 * 1024 * 1024;
	const tableQueue = new UploadQueue();
	const tableUpload = new FileUpload({
		maxFiles: TABLE_MAX_FILES,
		maxSize: TABLE_MAX,
		multiple: true,
		initialFiles: tableFiles,
		onFilesChange: (files) => tableQueue.sync(files),
	});
	tableQueue.seed(tableUpload.files);

	/** 7 — Image upload. A product gallery over a dashed card. */
	const IMAGE_MAX = 2 * 1024 * 1024;
	const imageQueue = new UploadQueue({ every: 100 });
	const imageUpload = new FileUpload({
		maxFiles: 10,
		maxSize: IMAGE_MAX,
		accept: "image/*",
		multiple: true,
		initialFiles: productFiles,
		onFilesChange: (files) => imageQueue.sync(files),
	});
	imageQueue.seed(imageUpload.files);

	/** 8 — Sorting. The same gallery, reorderable. */
	const SORTABLE_MAX_FILES = 5;
	const SORTABLE_MAX = 10 * 1024 * 1024;
	const sortableQueue = new UploadQueue({ every: 100 });
	const sortable = new FileUpload({
		maxFiles: SORTABLE_MAX_FILES,
		maxSize: SORTABLE_MAX,
		accept: "image/*",
		multiple: true,
		initialFiles: sortableFiles,
		onFilesChange: (files) => sortableQueue.sync(files),
	});
	sortableQueue.seed(sortable.files);

	/** 9 — Cards. One tile per file, the ring drawn over the tile. */
	const CARD_MAX_FILES = 10;
	const CARD_MAX = 50 * 1024 * 1024;
	const cardQueue = new UploadQueue();
	const cardUpload = new FileUpload({
		maxFiles: CARD_MAX_FILES,
		maxSize: CARD_MAX,
		multiple: true,
		initialFiles: cardFiles,
		onFilesChange: (files) => cardQueue.sync(files),
	});
	cardQueue.seed(cardUpload.files);

	/** 10 — Cover image. One 21:9 band, replaced in place. */
	const COVER_MAX = 5 * 1024 * 1024;
	const coverQueue = new UploadQueue({ every: 200, step: 10 });
	const cover = new FileUpload({
		maxFiles: 1,
		maxSize: COVER_MAX,
		accept: "image/*",
		multiple: false,
		initialFiles: [image("cover-1", "cover-image.jpg", 2048000)],
		onFilesChange: (files) => coverQueue.sync(files),
	});
	coverQueue.seed(cover.files);

	const coverFile = $derived(cover.files[0]);
	const coverState = $derived(coverFile ? coverQueue.get(coverFile.id) : SETTLED);
</script>

<!--
	SHARED SNIPPETS. Every page here inlines its examples in one file; ten examples that
	repeat four pieces between them need those four written once, and a snippet is what
	Svelte has for that. They are declared before use so the examples below read top to
	bottom.
-->

<!--
	The error alert, which every example ends with. Solid rather than tinted — divergence 2 — and
	now through `variant="solid-destructive"` rather than a hand-rolled ground: the variant is that
	recipe, so a call site restating it is a second copy waiting to drift. The description needed a
	`text-current` override while the ground was written here, because the part's own
	`text-muted-foreground` is unreadable on full-strength red; the variant tints it instead, at the
	same 80% step every other solid alert in the library uses.
-->
{#snippet uploadErrors(errors: string[])}
	{#if errors.length > 0}
		<Alert.Root variant="solid-destructive" class="{alertShape} mt-5">
			<CircleAlertIcon />
			<Alert.Title class="font-medium">File upload error(s)</Alert.Title>
			<Alert.Description>
				{#each errors as error}
					<p>{error}</p>
				{/each}
			</Alert.Description>
		</Alert.Root>
	{/if}
{/snippet}

<!-- One glyph chosen from the MIME type. -->
{#snippet glyph(type: string, className?: string)}
	{@const Icon = iconFor(type)}
	<Icon class={cn("size-4", className)} />
{/snippet}

<!--
	An entry's thumbnail, filling whatever box it is put in: a real image for a file you
	picked, a token gradient for a seeded one, a glyph for anything that is not an image.
	Divergence 1 is the middle branch.
-->
{#snippet thumb(entry: FileWithPreview, className?: string)}
	{#if entry.preview}
		<img
			src={entry.preview}
			alt={entry.file.name}
			class={cn("h-full w-full object-cover", className)}
		/>
	{:else if isImage(entry.file)}
		<div
			role="img"
			aria-label={entry.file.name}
			class={cn("h-full w-full bg-muted bg-gradient-to-br", gradientFor(entry.id), className)}
		></div>
	{:else}
		<div
			class={cn(
				"flex h-full w-full items-center justify-center bg-muted text-muted-foreground",
				className,
			)}
		>
			{@render glyph(entry.file.type, "size-5")}
		</div>
	{/if}
{/snippet}

<!--
	The circular progress indicator, drawn at three sizes on this page from one geometry —
	see {@link RING}. `-rotate-90` starts the arc at twelve o'clock rather than three.
-->
{#snippet ring(progress: number, className: string, trackClass: string, barClass: string)}
	<!--
		The percentage in text, for the readers the arc says nothing to. The bar-shaped examples
		get this from `Progress`, which is a bits-ui `progressbar` with `aria-valuenow` on it; a
		hand-drawn `<svg>` has no such thing, so the two examples that draw a ring instead of a
		bar would otherwise report nothing at all.
	-->
	<span class="sr-only" role="progressbar" aria-valuenow={Math.round(progress)}>
		Uploading {Math.round(progress)}%
	</span>
	<svg class={cn("-rotate-90", className)} viewBox="0 0 48 48" aria-hidden="true">
		<circle
			cx="24"
			cy="24"
			r="20"
			fill="none"
			stroke="currentColor"
			stroke-width="3"
			class={trackClass}
		/>
		<circle
			cx="24"
			cy="24"
			r="20"
			fill="none"
			stroke="currentColor"
			stroke-width="3"
			stroke-linecap="round"
			stroke-dasharray={RING}
			stroke-dashoffset={RING * (1 - progress / 100)}
			class={cn("transition-all duration-300", barClass)}
		/>
	</svg>
{/snippet}

<!--
	The row of upload cards that the Image upload and Sorting examples both put under their
	dropzone: one card per file still climbing, with its name, size, percentage and bar.

	Upstream writes it twice, once in each file, and the two copies are already a hair apart
	(`p-3` against `p-2.5`, `font-semibold` against `font-medium` on the heading beside them).
	Written once, the pair agrees.
-->
{#snippet uploadingCards(upload: FileUpload, queue: UploadQueue)}
	{#if queue.busy}
		<div class="mt-6 flex flex-col gap-3">
			{#each upload.files as entry (entry.id)}
				{@const state = queue.get(entry.id)}
				{#if state.status === "uploading"}
					<Card.Root class="rounded-md shadow-none">
						<Card.Content class="flex items-center gap-2 p-2.5">
							<div
								class="flex size-8 shrink-0 items-center justify-center rounded-md border border-border"
							>
								<ImageIcon class="size-4 text-muted-foreground" />
							</div>
							<div class="flex w-full flex-col gap-1.5">
								<div class="flex w-full items-center justify-between gap-2.5">
									<div class="flex items-center gap-2.5">
										<span class="text-xs leading-none font-medium">
											{entry.file.name}
										</span>
										<span class="text-xs leading-none text-muted-foreground">
											{formatBytes(entry.file.size)}
										</span>
										<span class="text-xs text-muted-foreground">
											Uploading... {Math.round(state.progress)}%
										</span>
									</div>
									<Button
										variant="ghost"
										size="icon-xs"
										aria-label="Remove {entry.file.name}"
										onclick={() => upload.removeFile(entry.id)}
									>
										<CircleXIcon />
									</Button>
								</div>
								<Progress value={state.progress} class={progressTrack} />
							</div>
						</Card.Content>
					</Card.Root>
				{/if}
			{/each}
		</div>
	{/if}
{/snippet}

<!--
	One tile of the sortable grid. It is a snippet rather than markup inlined in the `{#each}`
	because `useSortable` has to be called per item — `{@const}` is only legal as the first
	thing in a block, and the snippet gives it one. It must be rendered inside
	`DragDropProvider`, which reads context at render position, not at declaration.

	`index` is passed as a getter: a raw number snapshots the position the tile had when it
	mounted, and the second drag of a session then moves the wrong tile.
-->
{#snippet sortableTile(entry: FileWithPreview, index: number)}
	{@const { ref, handleRef, isDragging } = useSortable({ id: entry.id, index: () => index })}

	<div
		{@attach ref}
		data-dragging={isDragging.current}
		class="group/item relative overflow-hidden rounded-md border bg-accent/50 transition-all duration-200 hover:z-10 data-[dragging=true]:z-50 data-[dragging=true]:opacity-80"
	>
		<div class="pointer-events-none h-[120px] w-full">
			{@render thumb(entry)}
		</div>

		<Button
			{@attach handleRef}
			variant="outline"
			size="icon-xs"
			class="{overlayButton} absolute start-2 top-2 cursor-grab active:cursor-grabbing"
			aria-label="Reorder {entry.file.name}"
		>
			<GripVerticalIcon />
		</Button>

		<Button
			variant="outline"
			size="icon-xs"
			class="{overlayButton} absolute end-2 top-2"
			aria-label="Remove {entry.file.name}"
			onclick={() => sortable.removeFile(entry.id)}
		>
			<XIcon />
		</Button>
	</div>
{/snippet}

<DocPage title="File upload">
	{#snippet subtitle()}
		Ten ways to take a file: a picker, a dropzone, a gallery, a table, and the progress each of them
		reports.
	{/snippet}

	<!--
		1 — BASIC. The lead example is never wrapped in a `DocSection`; the page's own intro is
		its blurb.
	-->
	<Card.Root>
		<Card.Content>
			<div class="flex flex-col items-center gap-2">
				<div class="inline-flex items-center gap-2 align-top">
					<div
						class="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-input"
					>
						{#if basic.files[0]}
							{@render thumb(basic.files[0])}
						{:else}
							<CircleUserRoundIcon class="size-4 opacity-60" aria-hidden="true" />
						{/if}
					</div>
					<div class="relative inline-block">
						<Button onclick={basic.openFileDialog}>
							{basic.files[0] ? "Change image" : "Upload image"}
						</Button>
						<input use:basic.input class="sr-only" aria-label="Upload image file" />
					</div>
				</div>

				<!--
					THE LIVE REGION IS OUTSIDE THE `{#if}`, and upstream's is inside it.

					A live region only announces what changes WITHIN it; a region created by the
					same update that fills it has no "before", and screen readers stay silent.
					Upstream renders two different `<p aria-live="polite">`, one per branch, so
					attaching a file swaps one region for another and announces nothing — the one
					thing the attribute is there to do. One region, always mounted, with only its
					text changing.
				-->
				<div class="inline-flex gap-2 text-xs">
					<p class="truncate text-muted-foreground" aria-live="polite">
						{basic.files[0] ? basic.files[0].file.name : "No image attached"}
					</p>
					{#if basic.files[0]}
						{@const entry = basic.files[0]}
						<!--
							A bare `<button>`, as upstream: this is a text link inside a sentence,
							and the Button component's smallest variant is still a control with a
							box. The pointer cursor comes from the reboot rule in `app.css`.
						-->
						<button
							type="button"
							class="font-medium text-destructive hover:underline"
							onclick={() => basic.removeFile(entry.id)}
						>
							Remove
						</button>
					{/if}
				</div>

				<!--
					Upstream's Basic example has no error surface at all, so picking a PDF where
					it asks for `image/*` fails silently. Every other example on this page ends
					with this line; leaving one out would document the omission rather than the
					component.
				-->
				{@render uploadErrors(basic.errors)}
			</div>
		</Card.Content>
	</Card.Root>

	<DocSection title="Avatar">
		{#snippet blurb()}
			The dropzone is the avatar itself — a 96px circle that takes a drop, a click, or neither, and
			shows what it is holding.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col items-center gap-4">
					<div class="relative">
						<!--
							A `<button>`, where upstream uses a `<div>` with an `onclick`. It is a
							control: it opens a file dialog, so it has to be reachable by keyboard
							and announced as one. The input is a sibling rather than a child —
							interactive content inside a button is invalid HTML.
						-->
						<button
							type="button"
							aria-label={avatar.files[0] ? "Change avatar" : "Upload avatar"}
							class={cn(
								"relative size-24 overflow-hidden rounded-full border border-dashed transition-colors",
								avatar.isDragging
									? "border-primary bg-primary/5"
									: "border-muted-foreground/25 hover:border-muted-foreground/50",
								avatar.files[0] && "border-solid",
							)}
							ondragenter={avatar.handleDragEnter}
							ondragleave={avatar.handleDragLeave}
							ondragover={avatar.handleDragOver}
							ondrop={avatar.handleDrop}
							onclick={avatar.openFileDialog}
						>
							{#if avatar.files[0]}
								{@render thumb(avatar.files[0])}
							{:else}
								<span class="flex h-full w-full items-center justify-center">
									<UserIcon class="size-6 text-muted-foreground" />
								</span>
							{/if}
						</button>
						<input use:avatar.input class="sr-only" aria-label="Upload avatar file" />

						{#if avatar.files[0]}
							{@const entry = avatar.files[0]}
							<Button
								variant="outline"
								size="icon-xs"
								class="absolute end-0.5 top-0.5 z-10 rounded-full"
								aria-label="Remove avatar"
								onclick={() => avatar.removeFile(entry.id)}
							>
								<XIcon />
							</Button>
						{/if}
					</div>

					<div class="flex flex-col gap-0.5 text-center">
						<p class="text-sm font-medium">
							{avatar.files[0] ? "Avatar uploaded" : "Upload avatar"}
						</p>
						<p class="text-xs text-muted-foreground">
							PNG, JPG up to {formatBytes(AVATAR_MAX)}
						</p>
					</div>

					{@render uploadErrors(avatar.errors)}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Drag and drop">
		{#snippet blurb()}
			The compact form: one row holding the button, the thumbnails and the count, with the whole row
			as the drop target.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-lg">
					<!--
						The drop target is a `role="group"` rather than a control: dropping is never
						the only way in — the button inside it opens the same dialog — so the box
						groups controls instead of being one. See {@link dropzone}.
					-->
					<div
						class={cn(zone(compact.isDragging), "flex items-center gap-3 p-4")}
						role="group"
						aria-label="Drop files here to add them"
						ondragenter={compact.handleDragEnter}
						ondragleave={compact.handleDragLeave}
						ondragover={compact.handleDragOver}
						ondrop={compact.handleDrop}
					>
						<input use:compact.input class="sr-only" aria-label="Add files" />

						<Button
							size="sm"
							onclick={compact.openFileDialog}
							class={cn(compact.isDragging && "animate-bounce")}
						>
							<PlusIcon data-icon="inline-start" />
							Add files
						</Button>

						<div class="flex flex-1 items-center gap-2">
							{#if compact.files.length === 0}
								<p class="text-sm text-muted-foreground">
									Drop files here or click to browse (max {COMPACT_MAX_FILES} files)
								</p>
							{:else}
								{#each compact.files as entry (entry.id)}
									<div class="group/item relative shrink-0">
										<div
											class="size-12 overflow-hidden rounded-lg border"
											title="{entry.file.name} ({formatBytes(entry.file.size)})"
										>
											{@render thumb(entry)}
										</div>
										<Button
											variant="outline"
											size="icon-xs"
											class="{overlayButton} absolute -end-2 -top-2 size-5"
											aria-label="Remove {entry.file.name}"
											onclick={() => compact.removeFile(entry.id)}
										>
											<XIcon />
										</Button>
									</div>
								{/each}
							{/if}
						</div>

						{#if compact.files.length > 0}
							<div class="shrink-0 text-xs text-muted-foreground">
								{compact.files.length}/{COMPACT_MAX_FILES}
							</div>
						{/if}
					</div>

					{@render uploadErrors(compact.errors)}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Gallery">
		{#snippet blurb()}
			A dropzone above a grid, each tile revealing a zoom and a remove on hover. The zoom opens the
			image in a dialog with no chrome of its own.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- Upstream measures this example at `max-w-4xl`, as it does the two below. -->
				<div class="w-full max-w-4xl">
					<div
						class={cn(zone(gallery.isDragging), "relative p-8 text-center")}
						role="group"
						aria-label="Drop images here to add them to the gallery"
						ondragenter={gallery.handleDragEnter}
						ondragleave={gallery.handleDragLeave}
						ondragover={gallery.handleDragOver}
						ondrop={gallery.handleDrop}
					>
						<input use:gallery.input class="sr-only" aria-label="Select images" />

						<div class="flex flex-col items-center gap-4">
							<div
								class={cn(
									"flex size-16 items-center justify-center rounded-full",
									gallery.isDragging ? "bg-primary/10" : "bg-muted",
								)}
							>
								<ImageIcon
									class={cn(
										"size-5",
										gallery.isDragging ? "text-primary" : "text-muted-foreground",
									)}
								/>
							</div>

							<div class="flex flex-col gap-2">
								<h3 class="text-lg font-medium">Upload images to gallery</h3>
								<p class="text-sm text-muted-foreground">
									Drag and drop images here or click to browse
								</p>
								<p class="text-xs text-muted-foreground">
									PNG, JPG, GIF up to {formatBytes(GALLERY_MAX)} each (max {GALLERY_MAX_FILES}
									files)
								</p>
							</div>

							<Button onclick={gallery.openFileDialog}>
								<UploadIcon data-icon="inline-start" />
								Select images
							</Button>
						</div>
					</div>

					{#if gallery.files.length > 0}
						<div class="mt-6 flex items-center justify-between">
							<div class="flex items-center gap-4">
								<h3 class="text-sm font-medium">
									Gallery ({gallery.files.length}/{GALLERY_MAX_FILES})
								</h3>
								<div class="text-xs text-muted-foreground">
									Total: {totalBytes(gallery.files)}
								</div>
							</div>
							<Button variant="outline" size="sm" onclick={gallery.clearFiles}>Clear all</Button>
						</div>

						<div class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
							{#each gallery.files as entry (entry.id)}
								<div class="group/item relative aspect-square overflow-hidden rounded-lg border">
									{@render thumb(entry, "transition-transform group-hover/item:scale-105")}

									<div
										class="absolute inset-0 flex items-center justify-center gap-2 {scrim} opacity-0 transition-opacity group-hover/item:opacity-100"
									>
										<Button
											variant="secondary"
											size="icon-sm"
											aria-label="Zoom {entry.file.name}"
											onclick={() => (zoomed = entry)}
										>
											<ZoomInIcon />
										</Button>
										<Button
											variant="secondary"
											size="icon-sm"
											aria-label="Remove {entry.file.name}"
											onclick={() => gallery.removeFile(entry.id)}
										>
											<XIcon />
										</Button>
									</div>

									<!--
										The caption's ground and type are {@link scrimStrong} and
										{@link onScrim} — see their derivation. Upstream's
										`bg-black/70 text-white` is fixed; the tokens that are fixed the
										same way are not the ones with the matching names.
									-->
									<div
										class="absolute right-0 bottom-0 left-0 {scrimStrong} p-2 {onScrim} opacity-0 transition-opacity group-hover/item:opacity-100"
									>
										<p class="truncate text-xs font-medium">{entry.file.name}</p>
										<p class="text-xs opacity-80">{formatBytes(entry.file.size)}</p>
									</div>
								</div>
							{/each}
						</div>
					{/if}

					{@render uploadErrors(gallery.errors)}
				</div>
			</Card.Content>
		</Card.Root>

		<!--
			The zoom. `open` is derived from `zoomed` rather than tracked beside it, so the two
			can never disagree; closing clears the entry.
		-->
		<Dialog.Root
			open={zoomed !== null}
			onOpenChange={(open) => {
				if (!open) zoomed = null;
			}}
		>
			<!--
				The panel is transparent, so the close button has to leave it: without the seven
				overrides below it renders `top-4 right-4` INSIDE the frame, which here means on
				top of the image. Upstream lifts it clear of the corner and gives it a ground of
				its own; `bg-card` rather than upstream's `bg-background`, because a control
				floating over nothing should read as a surface, which is what a card is here.
			-->
			<Dialog.Content
				class="w-full border-none bg-transparent p-0 shadow-none sm:max-w-xl [&_[data-slot=dialog-close]]:-end-7 [&_[data-slot=dialog-close]]:-top-7 [&_[data-slot=dialog-close]]:size-8 [&_[data-slot=dialog-close]]:rounded-full [&_[data-slot=dialog-close]]:bg-card [&_[data-slot=dialog-close]]:text-muted-foreground [&_[data-slot=dialog-close]]:hover:text-foreground"
			>
				<Dialog.Header class="sr-only">
					<Dialog.Title>Image preview</Dialog.Title>
				</Dialog.Header>
				{#if zoomed}
					<div class="flex aspect-video items-center justify-center overflow-hidden rounded-lg">
						{@render thumb(zoomed, "object-contain")}
					</div>
				{/if}
			</Dialog.Content>
		</Dialog.Root>
	</DocSection>

	<DocSection title="Progress">
		{#snippet blurb()}
			A stacked list where every row carries its own bar, its own error and its own retry — the
			shape an upload takes once it can fail.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-2xl">
					<div
						class={cn(zone(progressUpload.isDragging), "relative p-8 text-center")}
						role="group"
						aria-label="Drop files here to upload them"
						ondragenter={progressUpload.handleDragEnter}
						ondragleave={progressUpload.handleDragLeave}
						ondragover={progressUpload.handleDragOver}
						ondrop={progressUpload.handleDrop}
					>
						<input use:progressUpload.input class="sr-only" aria-label="Select files" />

						<div class="flex flex-col items-center gap-4">
							<div
								class={cn(
									"flex size-16 items-center justify-center rounded-full",
									progressUpload.isDragging ? "bg-primary/10" : "bg-muted",
								)}
							>
								<UploadIcon
									class={cn(
										"size-6",
										progressUpload.isDragging ? "text-primary" : "text-muted-foreground",
									)}
								/>
							</div>

							<div class="flex flex-col gap-2">
								<h3 class="text-lg font-medium">Upload your files</h3>
								<p class="text-sm text-muted-foreground">
									Drag and drop files here or click to browse
								</p>
								<p class="text-xs text-muted-foreground">
									Support for multiple file types up to {formatBytes(PROGRESS_MAX)} each
								</p>
							</div>

							<Button onclick={progressUpload.openFileDialog}>
								<UploadIcon data-icon="inline-start" />
								Select files
							</Button>
						</div>
					</div>

					{#if progressUpload.files.length > 0}
						<div class="mt-6 flex items-center justify-between">
							<div class="flex items-center gap-2">
								<h3 class="text-sm font-medium">Upload Progress</h3>
								<!--
									The soft badges: the Badge's `*-subtle` variants — divergence 2.
								-->
								<div class="flex items-center gap-2">
									{#if progressQueue.count("completed") > 0}
										<Badge variant="success-subtle">
											Completed: {progressQueue.count("completed")}
										</Badge>
									{/if}
									{#if progressQueue.count("error") > 0}
										<Badge variant="destructive-subtle">
											Failed: {progressQueue.count("error")}
										</Badge>
									{/if}
									{#if progressQueue.count("uploading") > 0}
										<Badge variant="secondary">
											Uploading: {progressQueue.count("uploading")}
										</Badge>
									{/if}
								</div>
							</div>

							<Button variant="outline" size="sm" onclick={progressUpload.clearFiles}>
								Clear all
							</Button>
						</div>

						<div class="mt-4 flex flex-col gap-3">
							{#each progressUpload.files as entry (entry.id)}
								{@const state = progressQueue.get(entry.id)}
								<div class="rounded-lg border bg-card p-2.5">
									<div class="flex items-start gap-2.5">
										<div class="size-12 shrink-0 overflow-hidden rounded-lg border">
											{@render thumb(entry)}
										</div>

										<div class="min-w-0 flex-1">
											<div class="flex items-center justify-between">
												<p class="flex flex-col justify-center gap-1 truncate">
													<span class="text-sm font-medium">{entry.file.name}</span>
													<span class="text-xs text-muted-foreground">
														{formatBytes(entry.file.size)}
													</span>
												</p>
												<Button
													variant="ghost"
													size="icon-xs"
													class="text-muted-foreground hover:bg-transparent dark:hover:bg-transparent"
													aria-label="Remove {entry.file.name}"
													onclick={() => progressUpload.removeFile(entry.id)}
												>
													<XIcon class="size-4" />
												</Button>
											</div>

											{#if state.status === "uploading"}
												<Progress value={state.progress} class={cn("mt-2", progressTrack)} />
											{/if}

											{#if state.status === "error" && state.error}
												<Alert.Root variant="solid-destructive" class="mt-2 px-2 py-1">
													<CircleAlertIcon />
													<Alert.Title class="text-xs font-medium">
														{state.error}
													</Alert.Title>
													<Alert.Action>
														<Button
															variant="ghost"
															size="icon-xs"
															class="text-current hover:bg-transparent"
															aria-label="Retry {entry.file.name}"
															onclick={() => progressQueue.retry(entry.id)}
														>
															<RefreshCwIcon />
														</Button>
													</Alert.Action>
												</Alert.Root>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}

					{@render uploadErrors(progressUpload.errors)}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Table">
		{#snippet blurb()}
			The same list as rows, with the progress drawn as a ring around the file's own glyph rather
			than as a bar — a table has no room for a second column of bars.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-4">
				<div
					class={cn(zone(tableUpload.isDragging), "relative p-6 text-center")}
					role="group"
					aria-label="Drop files here to upload them"
					ondragenter={tableUpload.handleDragEnter}
					ondragleave={tableUpload.handleDragLeave}
					ondragover={tableUpload.handleDragOver}
					ondrop={tableUpload.handleDrop}
				>
					<input use:tableUpload.input class="sr-only" aria-label="Browse files" />

					<div class="flex flex-col items-center gap-4">
						<div
							class={cn(
								"flex size-12 items-center justify-center rounded-full transition-colors",
								tableUpload.isDragging ? "bg-primary/10" : "bg-muted",
							)}
						>
							<UploadIcon class="size-5 text-muted-foreground" />
						</div>

						<div class="flex flex-col gap-2">
							<p class="text-sm font-medium">
								Drop files here or
								<button
									type="button"
									class="text-primary underline-offset-4 hover:underline"
									onclick={tableUpload.openFileDialog}
								>
									browse files
								</button>
							</p>
							<p class="text-xs text-muted-foreground">
								Maximum file size: {formatBytes(TABLE_MAX)} • Maximum files: {TABLE_MAX_FILES}
							</p>
						</div>
					</div>
				</div>

				{#if tableUpload.files.length > 0}
					<div class="flex items-center justify-between">
						<h3 class="text-sm font-medium">Files ({tableUpload.files.length})</h3>
						<div class="flex gap-2">
							<Button variant="outline" size="sm" onclick={tableUpload.openFileDialog}>
								<CloudUploadIcon data-icon="inline-start" />
								Add files
							</Button>
							<Button variant="outline" size="sm" onclick={tableUpload.clearFiles}>
								<Trash2Icon data-icon="inline-start" />
								Remove all
							</Button>
						</div>
					</div>

					<!--
						NO PER-CELL GEOMETRY OVERRIDES, and none are possible from here. Tightening
						this table with `h-9` heads and `py-2 ps-1.5` cells is tempting; §10 of the
						theme notes gives `[data-slot='table-cell']` and `-head` a flat
						`padding: 1rem` — the classic theme's `table-cell-padding-y` and `-x` — OUTSIDE every
						`@layer`, which means it beats any utility a call site writes, whatever the
						sort order. Those classes would have been inert, and an inert class is worse
						than an absent one: it reads as an intention that was honoured. The classic theme's own
						table spacing stands instead, and this note is the record.
					-->
					<div class="overflow-hidden rounded-lg border">
						<Table.Root>
							<Table.Header>
								<Table.Row class="text-xs">
									<Table.Head>Name</Table.Head>
									<Table.Head>Type</Table.Head>
									<Table.Head>Size</Table.Head>
									<Table.Head class="w-[100px]">Actions</Table.Head>
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each tableUpload.files as entry (entry.id)}
									{@const state = tableQueue.get(entry.id)}
									<Table.Row>
										<Table.Cell>
											<div class="flex items-center gap-1">
												<div
													class="relative flex size-8 shrink-0 items-center justify-center text-muted-foreground/80"
												>
													{#if state.status === "uploading"}
														{@render ring(
															state.progress,
															"size-8",
															"text-muted-foreground/20",
															"text-primary",
														)}
													{/if}
													<span class="absolute inset-0 flex items-center justify-center">
														{@render glyph(entry.file.type)}
													</span>
												</div>
												<p class="flex items-center gap-1 truncate text-sm font-medium">
													{entry.file.name}
													{#if state.status === "error"}
														<Badge variant="destructive-subtle">Error</Badge>
													{/if}
												</p>
											</div>
										</Table.Cell>
										<Table.Cell>
											<Badge variant="secondary">{labelFor(entry.file.type)}</Badge>
										</Table.Cell>
										<Table.Cell class="text-sm text-muted-foreground">
											{formatBytes(entry.file.size)}
										</Table.Cell>
										<Table.Cell>
											<div class="flex items-center gap-1">
												<!--
													Download does nothing: there is no server behind
													this page, and a button that lies is worse than a
													button that is honestly inert. Upstream's is inert
													too.
												-->
												<Button
													variant="ghost"
													size="icon-sm"
													aria-label="Download {entry.file.name}"
												>
													<DownloadIcon class="size-3.5" />
												</Button>
												{#if state.status === "error"}
													<Button
														variant="ghost"
														size="icon-sm"
														class="text-destructive/80 hover:text-destructive"
														aria-label="Retry {entry.file.name}"
														onclick={() => tableQueue.retry(entry.id)}
													>
														<RefreshCwIcon class="size-3.5" />
													</Button>
												{:else}
													<Button
														variant="ghost"
														size="icon-sm"
														aria-label="Remove {entry.file.name}"
														onclick={() => tableUpload.removeFile(entry.id)}
													>
														<Trash2Icon class="size-3.5" />
													</Button>
												{/if}
											</div>
										</Table.Cell>
									</Table.Row>
								{/each}
							</Table.Body>
						</Table.Root>
					</div>
				{/if}

				{@render uploadErrors(tableUpload.errors)}
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Image upload">
		{#snippet blurb()}
			A product gallery with the dropzone underneath it rather than above — the shape a form wants
			when the images are the subject and the upload is an afterthought.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-4xl">
					{#if imageUpload.files.length > 0}
						<div class="mb-6 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
							{#each imageUpload.files as entry (entry.id)}
								<div class="group/item relative overflow-hidden rounded-md border bg-accent/50">
									<div class="h-[120px] w-full">
										{@render thumb(entry)}
									</div>
									<Button
										variant="outline"
										size="icon-xs"
										class="{overlayButton} absolute end-1 top-1"
										aria-label="Remove {entry.file.name}"
										onclick={() => imageUpload.removeFile(entry.id)}
									>
										<XIcon />
									</Button>
								</div>
							{/each}
						</div>
					{/if}

					<!--
						A `Card.Root` used as the dropzone, as upstream: the dashed outline sits on
						the card itself. `shadow-none` because it is nested inside the example's own
						card and a second elevation would read as a mistake.

						`border` AND `ring-0` are both load-bearing, and neither is in upstream's
						class list. §11 of the theme notes replaced the card's border with a
						`ring-1`, because the classic theme's card outline is drawn INSIDE its radius; so this
						card has no border-width at all, and `border-dashed` on its own sets a style
						for a border that is 0px wide — an outline that does not exist. `border`
						restores the width, and `ring-0` removes the solid ring that would otherwise
						sit beside the dashed one.
					-->
					<Card.Root
						class={cn(
							"rounded-lg border border-dashed shadow-none ring-0 transition-colors",
							imageUpload.isDragging
								? "border-primary bg-primary/5"
								: "border-muted-foreground/25 hover:border-muted-foreground/50",
						)}
						role="group"
						aria-label="Drop images here to upload them"
						ondragenter={imageUpload.handleDragEnter}
						ondragleave={imageUpload.handleDragLeave}
						ondragover={imageUpload.handleDragOver}
						ondrop={imageUpload.handleDrop}
					>
						<Card.Content class="text-center">
							<input use:imageUpload.input class="sr-only" aria-label="Browse files" />
							<div
								class="mx-auto mb-3 flex size-8 items-center justify-center rounded-full border border-border"
							>
								<CloudUploadIcon class="size-4" />
							</div>
							<h3 class="mb-0.5 text-sm font-medium text-foreground">
								Choose a file or drag &amp; drop here.
							</h3>
							<span class="mb-3 block text-xs text-muted-foreground">
								JPEG, PNG, up to {formatBytes(IMAGE_MAX)}.
							</span>
							<Button size="sm" onclick={imageUpload.openFileDialog}>Browse File</Button>
						</Card.Content>
					</Card.Root>

					{@render uploadingCards(imageUpload, imageQueue)}

					{@render uploadErrors(imageUpload.errors)}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Sorting">
		{#snippet blurb()}
			The same gallery, reordered by dragging a tile's handle. The order is the file list's own —
			dropping rewrites it, so nothing has to be kept in step with anything.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="w-full max-w-4xl">
					<div class="mb-4 text-center">
						<p class="text-sm text-muted-foreground">
							Upload up to {SORTABLE_MAX_FILES} images (JPG, PNG, GIF, WebP, max
							{formatBytes(SORTABLE_MAX)} each).
							<br />
							Drag and drop images to reorder.
						</p>
					</div>

					<!--
						`move()` returns a new array in the same shape, so reordering IS the
						assignment — the same one line `data-table.svelte` uses for its rows. No
						modifier: this is a two-dimensional grid, where the table restricts to the
						vertical axis.
					-->
					<DragDropProvider
						onDragEnd={(event) => {
							/*
							 * `move()` returns the SAME array when the drag was cancelled or
							 * landed where it started, and a new one only when the order really
							 * changed — so the identity check is the whole "did anything happen"
							 * test. Without it, pressing escape mid-drag or dropping a tile back
							 * on itself announces a reorder that did not occur.
							 */
							const reordered = move(sortable.files, event);
							if (reordered === sortable.files) return;

							sortable.files = reordered;
							toast.success("Images reordered");
						}}
					>
						<div class="mb-6 grid auto-rows-fr grid-cols-3 gap-2.5 sm:grid-cols-5">
							{#each sortable.files as entry, index (entry.id)}
								{@render sortableTile(entry, index)}
							{/each}
						</div>
					</DragDropProvider>

					<Card.Root
						class={cn(
							"rounded-lg border border-dashed shadow-none ring-0 transition-colors",
							sortable.isDragging
								? "border-primary bg-primary/5"
								: "border-muted-foreground/25 hover:border-muted-foreground/50",
						)}
						role="group"
						aria-label="Drop images here to upload them"
						ondragenter={sortable.handleDragEnter}
						ondragleave={sortable.handleDragLeave}
						ondragover={sortable.handleDragOver}
						ondrop={sortable.handleDrop}
					>
						<Card.Content class="text-center">
							<input use:sortable.input class="sr-only" aria-label="Browse files" />
							<div
								class="mx-auto mb-3 flex size-8 items-center justify-center rounded-full border border-border"
							>
								<CloudUploadIcon class="size-4" />
							</div>
							<h3 class="mb-0.5 text-sm font-medium text-foreground">
								Choose a file or drag &amp; drop here.
							</h3>
							<span class="mb-3 block text-xs text-muted-foreground">
								JPEG, PNG, up to {formatBytes(SORTABLE_MAX)}.
							</span>
							<Button size="sm" onclick={sortable.openFileDialog}>Browse File</Button>
						</Card.Content>
					</Card.Root>

					{@render uploadingCards(sortable, sortableQueue)}

					{@render uploadErrors(sortable.errors)}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Cards">
		{#snippet blurb()}
			One tile per file instead of one row: a square preview, the name and size beneath it, and the
			progress ring drawn over the preview while it climbs.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-4">
				<div
					class={cn(zone(cardUpload.isDragging), "relative p-6 text-center")}
					role="group"
					aria-label="Drop files here to upload them"
					ondragenter={cardUpload.handleDragEnter}
					ondragleave={cardUpload.handleDragLeave}
					ondragover={cardUpload.handleDragOver}
					ondrop={cardUpload.handleDrop}
				>
					<input use:cardUpload.input class="sr-only" aria-label="Browse files" />

					<div class="flex flex-col items-center gap-4">
						<div
							class={cn(
								"flex size-12 items-center justify-center rounded-full transition-colors",
								cardUpload.isDragging ? "bg-primary/10" : "bg-muted",
							)}
						>
							<UploadIcon class="size-5 text-muted-foreground" />
						</div>

						<div class="flex flex-col gap-2">
							<p class="text-sm font-medium">
								Drop files here or
								<button
									type="button"
									class="text-primary underline-offset-4 hover:underline"
									onclick={cardUpload.openFileDialog}
								>
									browse files
								</button>
							</p>
							<p class="text-xs text-muted-foreground">
								Maximum file size: {formatBytes(CARD_MAX)} • Maximum files: {CARD_MAX_FILES}
							</p>
						</div>
					</div>
				</div>

				{#if cardUpload.files.length > 0}
					<div class="flex items-center justify-between">
						<h3 class="text-sm font-medium">Files ({cardUpload.files.length})</h3>
						<div class="flex gap-2">
							<Button variant="outline" size="sm" onclick={cardUpload.openFileDialog}>
								<CloudUploadIcon data-icon="inline-start" />
								Add files
							</Button>
							<Button variant="outline" size="sm" onclick={cardUpload.clearFiles}>
								<Trash2Icon data-icon="inline-start" />
								Remove all
							</Button>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
						{#each cardUpload.files as entry (entry.id)}
							{@const state = cardQueue.get(entry.id)}
							<div class="group/item relative">
								<Button
									variant="outline"
									size="icon-xs"
									class="{overlayButton} absolute -end-2 -top-2 z-10"
									aria-label="Remove {entry.file.name}"
									onclick={() => cardUpload.removeFile(entry.id)}
								>
									<XIcon />
								</Button>

								<div class="relative overflow-hidden rounded-lg border bg-card">
									<div class="relative aspect-square border-b border-border">
										{@render thumb(entry)}

										<!--
											TWO TREATMENTS, as upstream: a wash and a light ring over
											a photograph, which needs separating from what is under
											it; and a bare ring in the brand colour over a glyph on
											a muted tile, which does not — washing that one only
											greys out the icon it is meant to annotate.
										-->
										{#if state.status === "uploading"}
											{#if entry.preview || isImage(entry.file)}
												<div class="absolute inset-0 flex items-center justify-center {scrim}">
													{@render ring(state.progress, "size-12", onScrimMuted, onScrim)}
												</div>
											{:else}
												<div class="absolute inset-0 flex items-center justify-center">
													{@render ring(
														state.progress,
														"size-12",
														"text-muted-foreground/20",
														"text-primary",
													)}
												</div>
											{/if}
										{/if}
									</div>

									<div class="flex flex-col gap-1 p-3">
										<p class="truncate text-sm font-medium">{entry.file.name}</p>
										<div class="flex items-center justify-between gap-2">
											<span class="text-xs text-muted-foreground">
												{formatBytes(entry.file.size)}
											</span>

											{#if state.status === "error" && state.error}
												<Tooltip.Provider>
													<Tooltip.Root>
														<Tooltip.Trigger
															class="text-destructive"
															aria-label="Upload failed. Retry"
															onclick={() => cardQueue.retry(entry.id)}
														>
															<RefreshCwIcon class="size-3.5" />
														</Tooltip.Trigger>
														<Tooltip.Content>Upload failed. Retry</Tooltip.Content>
													</Tooltip.Root>
												</Tooltip.Provider>
											{/if}
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}

				{@render uploadErrors(cardUpload.errors)}
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Cover image">
		{#snippet blurb()}
			A single 21:9 band replaced in place, with its actions revealed on hover and the progress
			drawn over the image rather than beside it.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-4">
				<div
					class={cn(
						"group relative overflow-hidden rounded-xl border transition-all duration-200",
						cover.isDragging
							? "border-dashed border-primary bg-primary/5"
							: coverFile
								? "border-border bg-background hover:border-primary/50"
								: "border-dashed border-muted-foreground/25 bg-muted/30 hover:border-primary hover:bg-primary/5",
					)}
					role="group"
					aria-label="Drop an image here to replace the cover"
					ondragenter={cover.handleDragEnter}
					ondragleave={cover.handleDragLeave}
					ondragover={cover.handleDragOver}
					ondrop={cover.handleDrop}
				>
					<input use:cover.input class="sr-only" aria-label="Upload cover image" />

					{#if coverFile}
						<div class="relative aspect-21/9 w-full">
							{@render thumb(coverFile)}

							<div
								class="absolute inset-0 {scrimSoft} opacity-0 transition-opacity duration-200 group-hover:opacity-100"
							></div>

							<div
								class="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
							>
								<Button variant="outline" size="sm" onclick={cover.openFileDialog}>
									<UploadIcon data-icon="inline-start" />
									Change cover
								</Button>
								<Button size="sm" onclick={cover.clearFiles}>
									<XIcon data-icon="inline-start" />
									Remove
								</Button>
							</div>

							{#if coverState.status === "uploading"}
								<div class="absolute inset-0 flex items-center justify-center {scrimSoft}">
									<div class="relative">
										{@render ring(coverState.progress, "size-16", onScrimMuted, onScrim)}
										<span
											class="absolute inset-0 flex items-center justify-center text-sm font-medium {onScrim}"
										>
											{Math.round(coverState.progress)}%
										</span>
									</div>
								</div>
							{/if}
						</div>
					{:else}
						<!--
							Upstream makes the whole empty band an `onClick` div AND puts a "Browse
							Files" button inside it — a control nested in a control, which is invalid
							as markup and ambiguous as behaviour. The button is the affordance that
							is actually visible and the one a keyboard can reach, so it is the one
							kept; the band around it stays a drop target, which it always was.
						-->
						<div
							class="flex aspect-21/9 w-full flex-col items-center justify-center gap-4 p-8 text-center"
						>
							<div class="rounded-full bg-primary/10 p-4">
								<CloudUploadIcon class="size-8 text-primary" />
							</div>

							<div class="flex flex-col gap-2">
								<h3 class="text-lg font-medium">Upload Cover Image</h3>
								<p class="text-sm text-muted-foreground">
									Drag and drop an image here, or click to browse
								</p>
								<p class="text-xs text-muted-foreground">
									Recommended size: 1200×514px • Max size: {formatBytes(COVER_MAX)}
								</p>
							</div>

							<Button variant="outline" size="sm" onclick={cover.openFileDialog}>
								<ImageIcon data-icon="inline-start" />
								Browse Files
							</Button>
						</div>
					{/if}
				</div>

				{@render uploadErrors(cover.errors)}

				{#if coverState.status === "error" && coverFile}
					<Alert.Root variant="solid-destructive" class={alertShape}>
						<CircleAlertIcon />
						<Alert.Title class="font-medium">Upload failed</Alert.Title>
						<Alert.Description>
							<p>{coverState.error}</p>
						</Alert.Description>
						<Alert.Action>
							<Button
								variant="ghost"
								size="sm"
								class="text-current hover:bg-transparent"
								onclick={() => coverQueue.retry(coverFile.id)}
							>
								Retry
							</Button>
						</Alert.Action>
					</Alert.Root>
				{/if}

				<div class="rounded-lg bg-muted/50 p-4">
					<!-- `h3`, not upstream's `h4`: `DocSection` renders the section title as an `h2`. -->
					<h3 class="mb-2 text-sm font-medium">Cover image guidelines</h3>
					<ul class="flex flex-col gap-1 text-xs text-muted-foreground">
						<li>• Use high-quality images with good lighting and composition</li>
						<li>• Recommended aspect ratio: 21:9 (ultrawide) for best results</li>
						<li>• Avoid images with important content near the edges</li>
						<li>• Supported formats: JPG, PNG, WebP</li>
					</ul>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
