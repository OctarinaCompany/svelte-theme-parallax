<script lang="ts">
	import TriangleAlertIcon from "@lucide/svelte/icons/triangle-alert";
	import { toast } from "svelte-sonner";
	import { Button } from "$lib/components/ui/button/index.js";

	/**
	 * The body of "Custom invert warning toast with countdown" (demo 16) — a
	 * session-expiry notice whose "countdown" is the 10-second duration the page passes to
	 * `toast.custom()`. The invert ground, the dropped `shadow-lg` and the `closeToast` dismiss
	 * are all as `sonner-invert-success-toast.svelte` derives them.
	 *
	 * Specific to this file: the chip and the Extend button are `--warning` where upstream
	 * writes `amber-500` and an `amber-700`/`amber-600` hover ladder — same collapse as the
	 * error body next door, and the `-foreground` pairing means the button comes out dark type
	 * on yellow, the answer the classic `color-contrast()` gives for this ground (the page's
	 * Solid section records the same trade). Extending fires `toast.success` — a follow-up
	 * toast, not this one — so the `toast` import stays alongside `closeToast`.
	 */
	let { closeToast }: { closeToast?: () => void } = $props();
</script>

<div
	class="flex w-[356px] items-start gap-3 rounded-md border border-transparent bg-foreground p-4 text-background"
>
	<div
		class="flex size-6 shrink-0 items-center justify-center rounded-full bg-warning text-warning-foreground"
	>
		<TriangleAlertIcon class="size-3.5" />
	</div>
	<div class="flex flex-1 flex-col gap-1">
		<p class="text-sm font-semibold">Session Expiring</p>
		<p class="text-sm text-background/70">
			Your session will expire in 5 minutes due to inactivity.
		</p>
		<div class="mt-2">
			<Button
				size="xs"
				class="border-warning bg-warning text-warning-foreground hover:border-warning/80 hover:bg-warning/80"
				onclick={() => {
					closeToast?.();
					toast.success("Session extended");
				}}
			>
				Extend Session
			</Button>
		</div>
	</div>
</div>
