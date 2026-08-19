import Canvas from "./qr-code-canvas.svelte";
import Download from "./qr-code-download.svelte";
import Image from "./qr-code-image.svelte";
import Overlay from "./qr-code-overlay.svelte";
import Root from "./qr-code.svelte";
import Skeleton from "./qr-code-skeleton.svelte";
import Svg from "./qr-code-svg.svelte";

export { type QRCodeChildProps, type QRCodeRootProps } from "./qr-code.svelte";
export { type QRCodeCanvasChildProps, type QRCodeCanvasProps } from "./qr-code-canvas.svelte";
export { type QRCodeSvgChildProps, type QRCodeSvgProps } from "./qr-code-svg.svelte";
export { type QRCodeImageChildProps, type QRCodeImageProps } from "./qr-code-image.svelte";
export { type QRCodeOverlayChildProps, type QRCodeOverlayProps } from "./qr-code-overlay.svelte";
export { type QRCodeSkeletonChildProps, type QRCodeSkeletonProps } from "./qr-code-skeleton.svelte";
export { type QRCodeDownloadChildProps, type QRCodeDownloadProps } from "./qr-code-download.svelte";

export {
	buildGenerationKey,
	buildQRCodeOptions,
	DEFAULT_BACKGROUND_COLOR,
	DEFAULT_FILENAME,
	DEFAULT_FOREGROUND_COLOR,
	DEFAULT_FORMAT,
	DEFAULT_IMAGE_ALT,
	DEFAULT_LEVEL,
	DEFAULT_MARGIN,
	DEFAULT_QUALITY,
	DEFAULT_SIZE,
	getQRCodeContext,
	getQRCodeLabel,
	hasQRCodeContext,
	loadQRCodeEncoder,
	QR_CODE_FORMATS,
	QR_CODE_LEVELS,
	QR_CODE_STATES,
	type QRCodeDownloadSource,
	type QRCodeDownloadTarget,
	type QRCodeFormat,
	type QRCodeGenerateOptions,
	type QRCodeGenerationInput,
	type QRCodeLevel,
	QRCodeState,
	type QRCodeStateProps,
	type QRCodeStatus,
	resolveDownload,
	setQRCodeContext,
} from "./qr-code.svelte.js";

export {
	Root,
	Canvas,
	Svg,
	Image,
	Overlay,
	Skeleton,
	Download,
	//
	Root as QRCode,
	Canvas as QRCodeCanvas,
	Svg as QRCodeSvg,
	Image as QRCodeImage,
	Overlay as QRCodeOverlay,
	Skeleton as QRCodeSkeleton,
	Download as QRCodeDownload,
};
