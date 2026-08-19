<script lang="ts">
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import { Button } from "$lib/components/ui/button/index.js";

	/**
	 * The invert collaboration-invite toast body — an avatar and a Decline/Accept pair. The
	 * invert ground, the ghosted outline button, the dropped `shadow-lg` and the `closeToast`
	 * dismiss are all as `sonner-invert-success-toast.svelte` derives them.
	 *
	 * Specific to this file: the Accept button is the house Button's default variant — a solid
	 * primary action is precisely what the default variant is, so nothing needs restating. NO
	 * PHOTOGRAPH, as everywhere in this repo: the avatar renders initials on the ground
	 * `sonner-avatar-toast.svelte` derives, and its ring is `border-background/10` — on the
	 * invert ground the dividing token swaps sides along with everything else.
	 */
	let { closeToast }: { closeToast?: () => void } = $props();

	const invertOutline =
		"border-background/10 bg-background/10 text-background hover:bg-background/20 hover:text-background dark:border-background/10 dark:bg-background/10 dark:hover:bg-background/20";
</script>

<div
	class="flex w-[356px] items-start gap-3 rounded-md border border-transparent bg-foreground p-4 text-background"
>
	<Avatar.Root class="size-9 shrink-0 border border-background/10">
		<Avatar.Fallback class="bg-muted-foreground text-xs text-primary-foreground dark:bg-secondary"
			>SC</Avatar.Fallback
		>
	</Avatar.Root>
	<div class="flex flex-1 flex-col gap-1">
		<div class="flex items-center justify-between">
			<p class="text-sm font-semibold">Sarah Chen</p>
			<span class="text-xs text-background/40">Just now</span>
		</div>
		<p class="text-sm text-background/70">Invited you to collaborate on "Design System v2"</p>
		<div class="mt-2 flex gap-2">
			<Button size="xs" variant="outline" class={invertOutline} onclick={() => closeToast?.()}>
				Decline
			</Button>
			<Button size="xs" onclick={() => closeToast?.()}>Accept</Button>
		</div>
	</div>
</div>
