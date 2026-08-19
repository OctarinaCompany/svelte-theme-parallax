<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import { Spinner } from "$lib/components/ui/spinner/index.js";

	/**
	 * The body of "Updatable toast with ID" (demo 21). A naive version writes two
	 * components, `LoadingToast` and `SuccessToast`, and swaps them by re-issuing `toast.custom()`
	 * under the same id. Here the two frames collapse into one file switched by a `done` prop, so
	 * every re-issue is a `componentProps` update on the same component — the exact mechanics
	 * `sonner-upload-toast.svelte` uses for its progress number, and the page owns the timers the
	 * same way it owns that section's interval.
	 *
	 * The box is upstream's, minus `shadow-lg` — elevation is deferred repo-wide, as the
	 * `[data-slot='card']` block in `app.css` records. The success tile is `bg-success
	 * text-success-foreground` for upstream's `bg-green-500 text-white`: the positive status
	 * token, with its own contrast foreground where upstream hardcodes white. The house Spinner
	 * already renders at `size-4`, so only upstream's `opacity-60` is added at the call.
	 */
	let { message = "", done = false }: { message?: string; done?: boolean } = $props();
</script>

{#if done}
	<div
		class="flex w-[356px] items-start gap-3 rounded-md border border-border bg-popover p-4 text-popover-foreground"
	>
		<div
			class="flex size-4 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground"
		>
			<CheckIcon class="size-3" aria-hidden="true" />
		</div>
		<div class="flex flex-1 flex-col gap-0.5">
			<p class="text-xs font-semibold">Upload complete!</p>
			<p class="text-xs text-muted-foreground">3 files uploaded successfully.</p>
		</div>
	</div>
{:else}
	<div
		class="flex w-[356px] items-center gap-3 rounded-md border border-border bg-popover p-4 text-popover-foreground"
	>
		<Spinner class="opacity-60" />
		<p class="text-xs font-medium">{message}</p>
	</div>
{/if}
