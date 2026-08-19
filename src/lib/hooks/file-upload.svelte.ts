/**
 * The state behind every File upload example.
 *
 * WHY A CLASS AND NOT A FUNCTION — the React-ecosystem shape for this kind of state is a hook
 * returning `[state, actions]`, because a hook cannot hand back a live object: every field has
 * to be re-read on each render. Runes have no such constraint, so the tuple collapses into one
 * instance whose `$state` fields are read directly (`upload.files`, `upload.isDragging`). This
 * is the same move `IsMobile` in `is-mobile.svelte.ts` makes over shadcn/ui's `useIsMobile`,
 * and the reason its rule applies here too: **construct it during component initialisation**,
 * because the constructor registers an `$effect` for cleanup.
 *
 * HOW THE INPUT IS WIRED — no props bag, no `ref`. {@link FileUpload.input} is a Svelte
 * action: it sets `type`, `accept` and `multiple` on the element, wires `change`, and keeps
 * the reference the class needs to open the dialog and reset the value. One directive:
 *
 *     <input use:upload.input class="sr-only" />
 *
 * Two behaviours are easy to get wrong and are therefore stated at their call site in
 * `addFiles` below: a duplicate file skips that file alone, never the rest of the drop, and
 * the max-files check reads the live list rather than a stale snapshot.
 */

import { formatBytes } from "$lib/shared/format-bytes.js";

/**
 * Human-readable bytes, re-exported so the upload examples can import it from this module.
 *
 * The implementation is the shared house formatter: a space between the number and the unit
 * (`2 MB`), and a unit ladder that starts at `B`, not `Bytes` — one repository, one format.
 */
export { formatBytes };

/** A file that exists on a server rather than on disk — how an example seeds its list. */
export type FileMetadata = {
	name: string;
	size: number;
	type: string;
	/**
	 * Where the bytes live. Used as the preview directly, no object URL involved.
	 *
	 * OPTIONAL, DELIBERATELY. This repository ships no images and fetches none, as
	 * `dashboard.ts` already records for the avatars. A seeded entry therefore usually has no
	 * URL, and the page draws its thumbnail from tokens instead — the same substitution the
	 * Page headers page makes for its cover photograph. A seeded entry that DOES have a URL
	 * still renders as an image.
	 */
	url?: string;
	id: string;
};

/** One entry in {@link FileUpload.files}: the file itself, a stable id, and a preview source. */
export type FileWithPreview = {
	file: File | FileMetadata;
	id: string;
	/** An object URL for a picked `File`, or {@link FileMetadata.url} for a seeded one. */
	preview?: string;
};

export type FileUploadOptions = {
	/** Only consulted when `multiple` is true. */
	maxFiles?: number;
	/** In bytes. */
	maxSize?: number;
	/** An `accept` attribute value — `image/*`, `.pdf,.docx`, or `*` for anything. */
	accept?: string;
	multiple?: boolean;
	initialFiles?: FileMetadata[];
	onFilesChange?: (files: FileWithPreview[]) => void;
	onFilesAdded?: (addedFiles: FileWithPreview[]) => void;
	onError?: (errors: string[]) => void;
};

/** Whether an entry should be rendered as an image — the test five examples repeat. */
export function isImage(file: File | FileMetadata): boolean {
	return file.type.startsWith("image/");
}

export class FileUpload {
	/** Everything currently held, in the order it was added. */
	files: FileWithPreview[] = $state([]);

	/** True while a drag is over the drop target this instance is wired to. */
	isDragging = $state(false);

	/** Validation messages from the last add. Cleared by the next one. */
	errors: string[] = $state([]);

	/** The options with every default filled in, so nothing below has to fall back again. */
	readonly #options: {
		maxFiles: number;
		maxSize: number;
		accept: string;
		multiple: boolean;
		onFilesChange?: (files: FileWithPreview[]) => void;
		onFilesAdded?: (addedFiles: FileWithPreview[]) => void;
		onError?: (errors: string[]) => void;
	};

	/** The element {@link input} is attached to, or null before it mounts. */
	#element: HTMLInputElement | null = null;

	constructor(options: FileUploadOptions = {}) {
		this.#options = {
			maxFiles: options.maxFiles ?? Number.POSITIVE_INFINITY,
			maxSize: options.maxSize ?? Number.POSITIVE_INFINITY,
			accept: options.accept ?? "*",
			multiple: options.multiple ?? false,
			onFilesChange: options.onFilesChange,
			onFilesAdded: options.onFilesAdded,
			onError: options.onError,
		};

		this.files = (options.initialFiles ?? []).map((file) => ({
			file,
			id: file.id,
			preview: file.url,
		}));

		/*
		 * Every object URL this instance minted, released when the component goes away.
		 *
		 * Revoking on remove and on clear is not enough: without an unmount teardown,
		 * navigating away from a page with previews on it leaks one URL per preview — and a
		 * documentation app that mounts and unmounts ten of these as you click around is
		 * exactly where that shows.
		 */
		$effect(() => () => {
			for (const entry of this.files) this.#revoke(entry);
		});
	}

	/** The accepted-types string, so an example can echo what it is configured to take. */
	get accept(): string {
		return this.#options.accept;
	}

	/** The size ceiling in bytes, so an example can render `formatBytes(upload.maxSize)`. */
	get maxSize(): number {
		return this.#options.maxSize;
	}

	/** The count ceiling, `Infinity` when unset. */
	get maxFiles(): number {
		return this.#options.maxFiles;
	}

	/**
	 * The hidden `<input type="file">`, as a Svelte action — described at the top of this
	 * file.
	 *
	 * An arrow property rather than a method: `use:upload.input` passes the function along
	 * without its receiver, so `this` has to be captured at construction. The same is true of
	 * every handler below, which is why they are all written this way.
	 */
	input = (element: HTMLInputElement) => {
		this.#element = element;
		element.type = "file";
		element.accept = this.#options.accept;
		element.multiple = this.#options.multiple;

		const onchange = () => {
			if (element.files && element.files.length > 0) this.addFiles(element.files);
		};

		element.addEventListener("change", onchange);

		return {
			destroy: () => {
				element.removeEventListener("change", onchange);
				if (this.#element === element) this.#element = null;
			},
		};
	};

	/** Open the browser's file picker. */
	openFileDialog = () => {
		this.#element?.click();
	};

	addFiles = (incoming: FileList | File[]) => {
		const candidates = Array.from(incoming);
		if (candidates.length === 0) return;

		const { multiple, maxFiles, maxSize } = this.#options;

		/*
		 * One message per REASON, not one per file.
		 *
		 * The multiple-file wording carries no file name, so pushing straight from the loop
		 * would print the same sentence once per oversized file. The wording ("Some files
		 * exceed…") is already a summary; `add` makes it behave like one.
		 */
		const errors: string[] = [];
		const add = (message: string) => {
			if (!errors.includes(message)) errors.push(message);
		};

		this.errors = [];

		const valid: FileWithPreview[] = [];

		for (const file of candidates) {
			/*
			 * `continue`, never `return`: a duplicate skips that one file silently. A `return`
			 * here would leave `addFiles` altogether, so dropping a folder whose second file is
			 * already in the list would silently discard the rest of the drop.
			 */
			if (multiple) {
				const duplicate = this.files.some(
					(existing) => existing.file.name === file.name && existing.file.size === file.size,
				);
				if (duplicate) continue;
			}

			if (file.size > maxSize) {
				add(
					multiple
						? `Some files exceed the maximum size of ${formatBytes(maxSize)}.`
						: `File exceeds the maximum size of ${formatBytes(maxSize)}.`,
				);
				continue;
			}

			const error = this.#validate(file);
			if (error) {
				add(error);
				continue;
			}

			valid.push({ file, id: this.#uniqueId(file), preview: URL.createObjectURL(file) });
		}

		/*
		 * The limit is checked AFTER the loop, against what would actually be added: counting
		 * raw candidates would let duplicates and already-rejected files make a pick fail a
		 * limit it does not actually break (re-dropping two held files plus one new one is a
		 * net addition of one). `this.files` is read live: the count this check sees is the
		 * count at the moment of the add. Rejection discards the whole drop — the previews
		 * just created are released, since nothing below will own them.
		 */
		if (multiple && maxFiles !== Number.POSITIVE_INFINITY) {
			if (this.files.length + valid.length > maxFiles) {
				for (const entry of valid) this.#revoke(entry);
				valid.length = 0;
				add(`You can only upload a maximum of ${maxFiles} files.`);
			}
		}

		if (valid.length > 0) {
			/*
			 * THE REPLACEMENT HAPPENS HERE, NOT BEFORE THE LOOP. Clearing on entry in
			 * single-file mode would mean a pick that is then REJECTED — wrong type, too big —
			 * has already destroyed the file the user had: the avatar disappears and the error
			 * explains why the new one was not accepted, which is the wrong story. So nothing
			 * is released until there is something to put in its place.
			 *
			 * Revoked inline rather than through `clearFiles()`, which would fire a spurious
			 * `onFilesChange([])` between the old value and the new one.
			 */
			if (!multiple) for (const entry of this.files) this.#revoke(entry);

			this.#options.onFilesAdded?.(valid);
			this.files = multiple ? [...this.files, ...valid] : valid;
			this.#options.onFilesChange?.(this.files);
		}

		this.errors = errors;
		// Diverges from the upstream hook, which only reported errors when nothing was
		// accepted: here `onError` fires for partial failures too, so a consumer surfacing
		// them (a toast, say) misses none.
		if (errors.length > 0) this.#options.onError?.(errors);

		this.#reset();
	};

	removeFile = (id: string) => {
		const entry = this.files.find((file) => file.id === id);
		if (!entry) return;

		this.#revoke(entry);
		this.files = this.files.filter((file) => file.id !== id);
		this.errors = [];
		this.#options.onFilesChange?.(this.files);
	};

	clearFiles = () => {
		for (const entry of this.files) this.#revoke(entry);

		this.files = [];
		this.errors = [];
		this.#reset();
		this.#options.onFilesChange?.(this.files);
	};

	clearErrors = () => {
		this.errors = [];
	};

	handleDragEnter = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		this.isDragging = true;
	};

	/**
	 * Leaving a child is not leaving the target.
	 *
	 * `dragleave` fires every time the pointer crosses into a descendant, so a dropzone with an
	 * icon and two lines of text in it would flicker without this guard. `relatedTarget` is the
	 * element being entered; if the target still contains it, the drag never left.
	 */
	handleDragLeave = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();

		const target = event.currentTarget;
		if (target instanceof Node && target.contains(event.relatedTarget as Node | null)) return;

		this.isDragging = false;
	};

	handleDragOver = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
	};

	handleDrop = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
		this.isDragging = false;

		if (this.#element?.disabled) return;

		const dropped = event.dataTransfer?.files;
		if (!dropped || dropped.length === 0) return;

		this.addFiles(this.#options.multiple ? dropped : [dropped[0]]);
	};

	/**
	 * Empty the input's value list.
	 *
	 * Without it the element keeps the last selection, and choosing the same file again fires
	 * no `change` event at all — the classic file-input trap. It runs on EVERY exit from
	 * `addFiles`, including the max-files rejection: leaving the value in place there would
	 * mean a user who overshoots the limit, removes a file and picks the same one again gets
	 * silence.
	 */
	#reset() {
		if (this.#element) this.#element.value = "";
	}

	/** Size is checked by the caller; this is the `accept` half, plus the message it produces. */
	#validate(file: File): string | null {
		const { accept } = this.#options;
		if (accept === "*") return null;

		const accepted = accept.split(",").map((type) => type.trim());
		const extension = `.${file.name.split(".").pop()}`;

		const matches = accepted.some((type) => {
			if (type.startsWith(".")) return extension.toLowerCase() === type.toLowerCase();
			if (type.endsWith("/*")) return file.type.startsWith(`${type.split("/")[0]}/`);
			return file.type === type;
		});

		return matches ? null : `File "${file.name}" is not an accepted file type.`;
	}

	/**
	 * Name and size alone are not unique — two folders can hold the same photo — so the id
	 * carries a timestamp and a random suffix.
	 */
	#uniqueId(file: File): string {
		return `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
	}

	/**
	 * Release a preview, if this instance is the one that created it.
	 *
	 * A seeded {@link FileMetadata} carries a URL somebody else owns; revoking it would break
	 * the next component that renders the same list. Only a picked `File` has an object URL of
	 * ours to release.
	 */
	#revoke(entry: FileWithPreview) {
		if (entry.preview && entry.file instanceof File) URL.revokeObjectURL(entry.preview);
	}
}
