<script lang="ts" module>
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { Snippet } from "svelte";
	import type { HTMLAttributes } from "svelte/elements";

	/** The merged attribute payload handed to the `child` snippet. */
	export type MediaPlayerErrorChildProps = {
		"data-slot": "media-player-error";
		"data-state": "fullscreen" | "windowed";
		role: "alert";
		"aria-live": "assertive";
		class: string;
	} & Record<string, unknown>;

	export type MediaPlayerErrorProps = WithElementRef<
		HTMLAttributes<HTMLDivElement>,
		HTMLDivElement
	> & {
		/**
		 * The error to report.
		 *
		 * @default the media element's own `error`
		 */
		error?: MediaError | null;
		/**
		 * Headline.
		 *
		 * @default derived from `error.code`
		 */
		label?: string;
		/**
		 * Supporting sentence.
		 *
		 * @default derived from `error.code`
		 */
		description?: string;
		/**
		 * What "Try again" does.
		 *
		 * @default reloads the current source with `mediaElement.load()`
		 */
		onRetry?: () => void;
		/**
		 * What "Reload page" does.
		 *
		 * @default `location.reload()`
		 */
		onReload?: () => void;
		/** Render the error surface onto your own element. Replaces upstream's `asChild`. */
		child?: Snippet<[{ props: MediaPlayerErrorChildProps }]>;
		/** Replaces the default headline, description and action buttons. */
		children?: Snippet;
	};

	/** Verbatim from upstream's `labelMap`. */
	const ERROR_LABELS: Record<number, string> = {
		1: "Playback Interrupted",
		2: "Connection Problem",
		3: "Media Error",
		4: "Unsupported Format",
	};

	/** Verbatim from upstream's `descriptionMap`. */
	const ERROR_DESCRIPTIONS: Record<number, string> = {
		1: "Media playback was aborted",
		2: "A network error occurred while loading the media",
		3: "An error occurred while decoding the media",
		4: "The media format is not supported",
	};
</script>

<script lang="ts">
	import AlertTriangleIcon from "@lucide/svelte/icons/alert-triangle";
	import RefreshCcwIcon from "@lucide/svelte/icons/refresh-ccw";
	import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";

	import { Button } from "$lib/components/ui/button/index.js";
	import { Spinner } from "$lib/components/ui/spinner/index.js";

	import { getMediaPlayerContext } from "./media-player.svelte.js";

	let {
		ref = $bindable(null),
		error,
		label,
		description,
		onRetry,
		onReload,
		class: className,
		child,
		children,
		...restProps
	}: MediaPlayerErrorProps = $props();

	const root = getMediaPlayerContext("<MediaPlayer.Error>");

	const uid = $props.id();
	const labelId = `${uid}-label`;
	const descriptionId = `${uid}-description`;

	const activeError = $derived(error ?? root.error);

	const errorLabel = $derived(
		label ??
			(activeError ? (ERROR_LABELS[activeError.code] ?? "Playback Error") : "Playback Error"),
	);
	const errorDescription = $derived(
		description ??
			(activeError
				? (ERROR_DESCRIPTIONS[activeError.code] ?? "An unknown error occurred")
				: "An unknown error occurred"),
	);

	let retryPending = $state(false);
	let reloadPending = $state(false);

	function handleRetry() {
		retryPending = true;
		requestAnimationFrame(() => {
			if (onRetry) onRetry();
			else root.retry();
			retryPending = false;
		});
	}

	function handleReload() {
		reloadPending = true;
		requestAnimationFrame(() => {
			if (onReload) onReload();
			else location.reload();
		});
	}

	const errorAttrs = $derived({
		role: "alert",
		"aria-live": "assertive",
		"aria-labelledby": labelId,
		"aria-describedby": descriptionId,
		"data-slot": "media-player-error",
		"data-state": root.fullscreen ? "fullscreen" : "windowed",
		...restProps,
		class: cn(
			"pointer-events-auto absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/80 text-foreground backdrop-blur-sm",
			className,
		),
	} as MediaPlayerErrorChildProps);
</script>

{#if activeError}
	{#if child}
		{@render child({ props: errorAttrs })}
	{:else}
		<div bind:this={ref} {...errorAttrs}>
			{#if children}
				{@render children()}
			{:else}
				<div class="flex max-w-md flex-col items-center gap-4 px-6 py-8 text-center">
					<AlertTriangleIcon class="size-12 text-destructive" />
					<div class="flex flex-col gap-px text-center">
						<h3 id={labelId} class="text-xl font-semibold tracking-tight">{errorLabel}</h3>
						<p
							id={descriptionId}
							class="text-sm leading-relaxed text-balance text-muted-foreground"
						>
							{errorDescription}
						</p>
					</div>
					<div class="flex items-center gap-2">
						<Button variant="secondary" size="sm" disabled={retryPending} onclick={handleRetry}>
							{#if retryPending}
								<Spinner data-icon="inline-start" />
							{:else}
								<RefreshCcwIcon data-icon="inline-start" />
							{/if}
							Try again
						</Button>
						<Button variant="outline" size="sm" disabled={reloadPending} onclick={handleReload}>
							{#if reloadPending}
								<Spinner data-icon="inline-start" />
							{:else}
								<RotateCcwIcon data-icon="inline-start" />
							{/if}
							Reload page
						</Button>
					</div>
				</div>
			{/if}
		</div>
	{/if}
{/if}
