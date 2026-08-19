/**
 * Re-measure the media when the container changes size.
 *
 * Shared by `<Cropper.Image>` and `<Cropper.Video>`, which had the same twenty lines twice upstream
 * (`cropper.tsx:1508-1552` and `:1637-1681`).
 *
 * TWO DETAILS CARRIED OVER FROM UPSTREAM, both worth keeping:
 * - The FIRST `ResizeObserver` callback is skipped. An observer fires once on `observe()` with the
 *   current size, which is not a resize — and acting on it would re-measure during mount, before
 *   the media has necessarily reported anything.
 * - The work is deferred to `requestIdleCallback`. A container resize is usually a window resize,
 *   which arrives in a burst; measuring on each one would run the geometry dozens of times for one
 *   settled layout.
 *
 * Returns a teardown, so a caller can hand it straight back from an `$effect`.
 */
export function observeCropperResize(
	root: HTMLElement | null,
	isReady: () => boolean,
	measure: () => void,
): (() => void) | undefined {
	if (!root) return;

	const run = () => {
		if (isReady()) measure();
	};

	const defer = () => {
		if (typeof requestIdleCallback === "function") {
			requestIdleCallback(run);
			return;
		}
		// Safari has no `requestIdleCallback`; one frame is close enough for a resize.
		setTimeout(run, 16);
	};

	if (typeof ResizeObserver === "undefined") {
		window.addEventListener("resize", defer);
		return () => window.removeEventListener("resize", defer);
	}

	let first = true;
	const observer = new ResizeObserver(() => {
		if (first) {
			first = false;
			return;
		}
		defer();
	});

	observer.observe(root);
	return () => observer.disconnect();
}
