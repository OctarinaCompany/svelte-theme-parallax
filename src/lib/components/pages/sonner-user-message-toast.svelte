<script lang="ts">
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import { Button } from "$lib/components/ui/button/index.js";

	/**
	 * The body of the user-message toast — an avatar, a timestamp and a Dismiss/Reply pair. A
	 * file of its own for the same reason as `sonner-icon-toast.svelte`: svelte-sonner
	 * renders free-form content as a component or not at all.
	 *
	 * Unlike that file, this one arrives through `toast.custom()`, which drops sonner's own box
	 * — `Toast.svelte` sets `data-styled` false whenever a toast carries a `component` — so the
	 * popover ground, border and padding are drawn here too. A shadow is not: elevation is
	 * deferred repo-wide, as the `[data-slot='card']` block in `app.css` records, and a custom
	 * toast is not the surface to break that on.
	 *
	 * NO PHOTOGRAPH. This repo ships no images and answers every avatar with initials; the
	 * ground is the same initials-tile recipe `sonner-avatar-toast.svelte` next door derives.
	 *
	 * `closeToast` comes from svelte-sonner itself — `Toast.svelte` spreads it onto every custom
	 * component — and dismisses this toast alone rather than clearing the whole stack. The
	 * narrower call is what the buttons mean.
	 */
	let { closeToast }: { closeToast?: () => void } = $props();
</script>

<div
	class="flex w-[356px] items-start gap-3 rounded-md border border-border bg-popover p-4 text-popover-foreground"
>
	<Avatar.Root class="size-9 shrink-0">
		<Avatar.Fallback class="bg-muted-foreground text-xs text-primary-foreground dark:bg-secondary"
			>AJ</Avatar.Fallback
		>
	</Avatar.Root>
	<div class="flex flex-1 flex-col gap-1">
		<div class="flex items-center justify-between">
			<p class="text-sm font-semibold">Alex Johnson</p>
			<span class="text-xs text-muted-foreground">2m ago</span>
		</div>
		<p class="text-sm text-muted-foreground">
			Hey! I've finished the design review. Let me know when you're free to discuss.
		</p>
		<div class="mt-2 flex gap-2">
			<Button size="xs" variant="outline" onclick={() => closeToast?.()}>Dismiss</Button>
			<Button size="xs" onclick={() => closeToast?.()}>Reply</Button>
		</div>
	</div>
</div>
