<script lang="ts">
	import InfoIcon from "@lucide/svelte/icons/info";
	import { Button } from "$lib/components/ui/button/index.js";

	/**
	 * The body of "Custom accent border toast" (demo 12) — an update notice
	 * whose left edge thickens into a coloured accent. Same mechanics as
	 * `sonner-user-message-toast.svelte`: `toast.custom()` drops sonner's box, so the popover
	 * ground and border are drawn here, upstream's `shadow-lg` is not, and `closeToast` (spread
	 * in by svelte-sonner) replaces upstream's stack-wide `toast.dismiss()`.
	 *
	 * The accent and the icon are `--info` where upstream writes `blue-500` twice — raw palette
	 * colours are what the house rule forbids, and an informational update notice is exactly
	 * what the info token names. The icon keeps upstream's explicit `size-5`: it sits in the
	 * body, not in a Button, so no component ramp sizes it.
	 */
	let { closeToast }: { closeToast?: () => void } = $props();
</script>

<div
	class="flex w-[356px] items-start gap-3 rounded-md border border-l-4 border-border border-l-info bg-popover p-4 text-popover-foreground"
>
	<div class="text-info">
		<InfoIcon class="size-5 shrink-0" aria-hidden="true" />
	</div>
	<div class="flex flex-1 flex-col gap-1">
		<p class="text-sm font-semibold">New Version Available</p>
		<p class="text-sm text-muted-foreground">
			v2.4.0 includes performance improvements and bug fixes.
		</p>
		<div class="mt-2 flex gap-2">
			<Button size="xs" variant="outline" onclick={() => closeToast?.()}>Later</Button>
			<Button size="xs" onclick={() => closeToast?.()}>Update Now</Button>
		</div>
	</div>
</div>
