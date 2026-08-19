<script lang="ts">
	import FileIcon from "@lucide/svelte/icons/file";
	import { Progress } from "$lib/components/ui/progress/index.js";

	/**
	 * The body of "Toast with upload progress simulation" (demo 10). This file
	 * only renders one frame; the page owns the interval and re-issues `toast.custom()` with the
	 * same `id` and a fresh `progress` in `componentProps` — svelte-sonner's `create()` updates
	 * a toast in place when the id already exists, so each tick re-renders this body instead of
	 * stacking a new toast.
	 *
	 * The box is upstream's, minus `shadow-lg` — elevation is deferred repo-wide, as the
	 * `[data-slot='card']` block in `app.css` records. The success-coloured fill needs no
	 * substitution: upstream already writes `bg-success` through the Progress indicator's
	 * `data-slot`, and the house Progress renders the same slot name.
	 */
	let { progress }: { progress: number } = $props();

	const done = $derived(progress >= 100);
</script>

<div
	class="flex w-[350px] flex-col gap-3 rounded-md border border-border bg-popover p-4 text-popover-foreground"
>
	<div class="flex items-center gap-3">
		<div class="flex size-8 shrink-0 items-center justify-center bg-muted">
			<FileIcon class="size-4" aria-hidden="true" />
		</div>
		<div class="flex flex-1 flex-col">
			<p class="text-sm font-medium">report-q4-2025.pdf</p>
			<p class="text-xs text-muted-foreground">
				2.4 MB &middot; {done ? "Complete" : `Uploading... ${progress}%`}
			</p>
		</div>
	</div>
	<Progress value={progress} class="h-1.5 **:data-[slot=progress-indicator]:bg-success" />
</div>
