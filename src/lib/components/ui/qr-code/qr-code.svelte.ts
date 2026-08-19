import { getContext, hasContext, setContext } from "svelte";

/** Every value {@link QRCodeLevel} accepts, in upstream declaration order. */
export const QR_CODE_LEVELS = ["L", "M", "Q", "H"] as const;

/**
 * The error correction level.
 *
 * - `L`: Low (~7% correction)
 * - `M`: Medium (~15% correction)
 * - `Q`: Quartile (~25% correction)
 * - `H`: High (~30% correction)
 */
export type QRCodeLevel = (typeof QR_CODE_LEVELS)[number];

/** Every value {@link QRCodeFormat} accepts — the `format` union of `<QRCode.Download>`. */
export const QR_CODE_FORMATS = ["png", "svg"] as const;

/** The file format for download. */
export type QRCodeFormat = (typeof QR_CODE_FORMATS)[number];

/** The option object handed to the `qrcode` package — upstream `QRCodeCanvasOpts` (`:17-30`). */
export type QRCodeGenerateOptions = {
	errorCorrectionLevel: QRCodeLevel;
	type?: "image/png" | "image/jpeg" | "image/webp";
	quality?: number;
	margin?: number;
	color?: {
		dark: string;
		light: string;
	};
	width?: number;
	rendererOpts?: {
		quality?: number;
	};
};

/** `size` fallback in pixels. */
export const DEFAULT_SIZE = 200;
/** `level` fallback — medium error correction. */
export const DEFAULT_LEVEL: QRCodeLevel = "M";
/** `margin` fallback — quiet-zone width in modules. */
export const DEFAULT_MARGIN = 1;
/** `quality` fallback for lossy output formats. */
export const DEFAULT_QUALITY = 0.92;
/** `backgroundColor` fallback — the light-module colour. */
export const DEFAULT_BACKGROUND_COLOR = "#ffffff";
/** `foregroundColor` fallback — the dark-module colour. */
export const DEFAULT_FOREGROUND_COLOR = "#000000";
/** `alt` fallback for `<QRCode.Image>`. */
export const DEFAULT_IMAGE_ALT = "QR Code";
/** `filename` fallback for `<QRCode.Download>`, without an extension. */
export const DEFAULT_FILENAME = "qrcode";
/** `format` fallback for `<QRCode.Download>`. */
export const DEFAULT_FORMAT: QRCodeFormat = "png";

/** The seven inputs a generated QR code depends on. */
export type QRCodeGenerationInput = {
	value: string;
	size: number;
	level: QRCodeLevel;
	margin: number;
	quality: number;
	foregroundColor: string;
	backgroundColor: string;
};

/** Builds the encoder options — the theme of upstream's `canvasOpts` memo (`:160-173`). */
export function buildQRCodeOptions(
	input: Omit<QRCodeGenerationInput, "value">,
): QRCodeGenerateOptions {
	return {
		errorCorrectionLevel: input.level,
		type: "image/png",
		quality: input.quality,
		margin: input.margin,
		color: {
			dark: input.foregroundColor,
			light: input.backgroundColor,
		},
		width: input.size,
	};
}

/**
 * The fingerprint of one generation — the theme of upstream's `generationKey` memo (`:175-187`),
 * including its `if (!value) return ''` early exit. An empty key disables generation entirely.
 */
export function buildGenerationKey(input: QRCodeGenerationInput): string {
	if (!input.value) return "";

	return JSON.stringify({
		value: input.value,
		size: input.size,
		level: input.level,
		margin: input.margin,
		quality: input.quality,
		foregroundColor: input.foregroundColor,
		backgroundColor: input.backgroundColor,
	});
}

/** The accessible name of the canvas and SVG renderers. */
export function getQRCodeLabel(value: string): string {
	return `QR code for ${value}`;
}

/** The output a {@link resolveDownload} call reads from. */
export type QRCodeDownloadSource = {
	dataUrl: string | null;
	svgString: string | null;
};

/** The anchor a download click needs, or `null` when there is nothing to download. */
export type QRCodeDownloadTarget = {
	href: string;
	download: string;
	/** `true` for the SVG blob URL, which must be revoked after the click. */
	revoke: boolean;
};

/**
 * The pure half of upstream's download `onClick` (`:406-419`): picks the href and filename for the
 * requested format, or returns `null` when that format has no output yet.
 */
export function resolveDownload(
	source: QRCodeDownloadSource,
	filename: string,
	format: QRCodeFormat,
): QRCodeDownloadTarget | null {
	if (format === "png" && source.dataUrl) {
		return { href: source.dataUrl, download: `${filename}.png`, revoke: false };
	}

	if (format === "svg" && source.svgString) {
		const blob = new Blob([source.svgString], { type: "image/svg+xml" });
		return { href: URL.createObjectURL(blob), download: `${filename}.svg`, revoke: true };
	}

	return null;
}

/** The encoder surface {@link QRCodeState.generate} uses, kept minimal on purpose. */
type QRCodeEncoder = Pick<typeof import("qrcode"), "toCanvas" | "toDataURL" | "toString">;

let encoderPromise: Promise<QRCodeEncoder> | null = null;

/**
 * Loads the `qrcode` package lazily, exactly as upstream does — the dynamic
 * import is what keeps the component SSR-safe. The promise is memoised so that concurrent roots
 * share one load instead of racing.
 */
export function loadQRCodeEncoder(): Promise<QRCodeEncoder> {
	encoderPromise ??= import("qrcode").then((module) => module.default);
	return encoderPromise;
}

/** The generation lifecycle, published on the root as `data-state`. */
export const QR_CODE_STATES = ["idle", "generating", "ready", "error"] as const;

/** The value of the root's `data-state` attribute. */
export type QRCodeStatus = (typeof QR_CODE_STATES)[number];

/** Constructor input for {@link QRCodeState}; every reactive value arrives as a getter. */
export type QRCodeStateProps = {
	readonly getValue: () => string;
	readonly getSize: () => number;
	readonly getLevel: () => QRCodeLevel;
	readonly getMargin: () => number;
	readonly getQuality: () => number;
	readonly getForegroundColor: () => string;
	readonly getBackgroundColor: () => string;
	readonly getOnError: () => ((error: Error) => void) | undefined;
	readonly getOnGenerated: () => (() => void) | undefined;
};

/**
 * One instance per `<QRCode.Root>`. Published on context; every part reads it.
 *
 * Replaces upstream's `Store` + `useSyncExternalStore` + both React contexts,
 * which exist only to give React per-field render granularity — Svelte signals already have it.
 */
export class QRCodeState {
	// $derived below is lazy at runtime (evaluated only when a member is read), but svelte-check's
	// static analysis cannot see that and flags the field as used before its constructor assignment.
	#props!: QRCodeStateProps;

	/** PNG data URL of the last successful generation; feeds `Image` and the PNG download. */
	dataUrl = $state<string | null>(null);
	/** SVG markup of the last successful generation; feeds `Svg` and the SVG download. */
	svgString = $state<string | null>(null);
	/** A generation is in flight — the re-entrancy guard. */
	isGenerating = $state(false);
	/** The last failure; cleared at the start of each attempt. */
	error = $state<Error | null>(null);
	/** Fingerprint of the last completed generation. */
	generationKey = $state("");
	/** The `<canvas>` registered by `<QRCode.Canvas>`; upstream's shared `canvasRef` (`:55`). */
	canvasElement = $state<HTMLCanvasElement | null>(null);

	/** A target requested while a generation was already in flight; re-entered once it settles. */
	#pendingKey: string | null = null;

	readonly value: string = $derived(this.#props.getValue());
	readonly size: number = $derived(this.#props.getSize());
	readonly level: QRCodeLevel = $derived(this.#props.getLevel());
	readonly margin: number = $derived(this.#props.getMargin());
	readonly quality: number = $derived(this.#props.getQuality());
	readonly foregroundColor: string = $derived(this.#props.getForegroundColor());
	readonly backgroundColor: string = $derived(this.#props.getBackgroundColor());

	readonly options: QRCodeGenerateOptions = $derived(
		buildQRCodeOptions({
			size: this.size,
			level: this.level,
			margin: this.margin,
			quality: this.quality,
			foregroundColor: this.foregroundColor,
			backgroundColor: this.backgroundColor,
		}),
	);

	/** The key the next generation should produce; `''` disables generation. */
	readonly generationTarget: string = $derived(
		buildGenerationKey({
			value: this.value,
			size: this.size,
			level: this.level,
			margin: this.margin,
			quality: this.quality,
			foregroundColor: this.foregroundColor,
			backgroundColor: this.backgroundColor,
		}),
	);

	/** Upstream `:479` — gates `<QRCode.Skeleton>`. */
	readonly isLoaded: boolean = $derived(
		Boolean(this.dataUrl || this.svgString || this.generationKey),
	);

	/** The accessible name shared by the canvas and SVG renderers. */
	readonly label: string = $derived(getQRCodeLabel(this.value));

	/** The generation lifecycle, exposed on the root as `data-state`. */
	readonly status: QRCodeStatus = $derived(
		this.isGenerating ? "generating" : this.error ? "error" : this.generationKey ? "ready" : "idle",
	);

	constructor(props: QRCodeStateProps) {
		this.#props = props;
	}

	/**
	 * The theme of upstream's `onQRCodeGenerate` (`:189-249`). Returns immediately when there is
	 * nothing to encode or when `targetKey` has already been produced. A target requested
	 * while another generation is in flight is queued and re-entered once that one settles, so an
	 * input change made mid-encode is never dropped.
	 */
	async generate(targetKey: string): Promise<void> {
		if (!this.value || !targetKey) return;
		if (this.generationKey === targetKey) return;

		if (this.isGenerating) {
			this.#pendingKey = targetKey;
			return;
		}

		const value = this.value;
		const options = this.options;

		this.isGenerating = true;
		this.error = null;

		let succeeded = false;

		try {
			const QRCode = await loadQRCodeEncoder();

			let dataUrl: string | null = null;

			try {
				dataUrl = await QRCode.toDataURL(value, options);
			} catch {
				dataUrl = null;
			}

			if (this.canvasElement) {
				await QRCode.toCanvas(this.canvasElement, value, options);
			}

			const svgString = await QRCode.toString(value, {
				errorCorrectionLevel: options.errorCorrectionLevel,
				margin: options.margin,
				color: options.color,
				width: options.width,
				type: "svg",
			});

			this.dataUrl = dataUrl;
			this.svgString = svgString;
			this.generationKey = targetKey;
			this.isGenerating = false;
			succeeded = true;
		} catch (error) {
			const parsedError = error instanceof Error ? error : new Error("Failed to generate QR code");

			// Divergence from upstream: a failed regeneration must not leave
			// the previous code on screen, because it would encode the wrong destination.
			this.dataUrl = null;
			this.svgString = null;
			this.#clearCanvas();
			this.error = parsedError;
			this.isGenerating = false;

			this.#props.getOnError()?.(parsedError);
		}

		// Fired outside the `try` so a throwing consumer callback cannot be mistaken for an encoder
		// failure and trip the wipe-on-failure path above. Its exception is re-thrown out of band:
		// the callsite `void`s this promise, and a queued regeneration must still be re-entered.
		if (succeeded) {
			try {
				this.#props.getOnGenerated()?.();
			} catch (callbackError) {
				queueMicrotask(() => {
					throw callbackError;
				});
			}
		}

		const pendingKey = this.#pendingKey;
		if (pendingKey !== null) {
			this.#pendingKey = null;
			await this.generate(pendingKey);
		}
	}

	/** Erases the registered canvas so no renderer keeps showing a stale code after a failure. */
	#clearCanvas(): void {
		const canvas = this.canvasElement;
		if (!canvas) return;
		canvas.getContext("2d")?.clearRect(0, 0, this.size, this.size);
	}

	/**
	 * Downloads the current output for `format`. A format with no output yet is a no-op.
	 * The theme of upstream's download `onClick` body (`:407-426`).
	 */
	download(filename: string, format: QRCodeFormat): void {
		const target = resolveDownload(
			{ dataUrl: this.dataUrl, svgString: this.svgString },
			filename,
			format,
		);
		if (!target) return;

		const link = document.createElement("a");
		link.href = target.href;
		link.download = target.download;

		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		if (target.revoke) {
			URL.revokeObjectURL(target.href);
		}
	}
}

const QR_CODE_CONTEXT_KEY = Symbol("qr-code");

export function setQRCodeContext(state: QRCodeState): QRCodeState {
	return setContext(QR_CODE_CONTEXT_KEY, state);
}

export function hasQRCodeContext(): boolean {
	return hasContext(QR_CODE_CONTEXT_KEY);
}

/**
 * The parity replacement for upstream's exported `useQRCode` hook (`:511`) and its
 * `useQRCodeContext` guard (`:76-82`). Throws when the part is used outside `<QRCode.Root>`.
 */
export function getQRCodeContext(consumerName?: string): QRCodeState {
	if (!hasQRCodeContext()) {
		const label = consumerName ? `\`<${consumerName}>\`` : "`<QRCode>` part";
		throw new Error(`${label} must be used within \`<QRCode.Root>\`.`);
	}
	return getContext<QRCodeState>(QR_CODE_CONTEXT_KEY);
}
