<script lang="ts">
	import LinkIcon from "@lucide/svelte/icons/link";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";

	/**
	 * The body of "Custom integration toast" (demo 20) — an integration card:
	 * an icon tile, the workspace identity, an Active pill, a separator, a sync summary and a
	 * Configure / Open Dashboard pair. Same mechanics as `sonner-deployment-toast.svelte`:
	 * `toast.custom()` drops sonner's box, so the popover ground and border are drawn here,
	 * upstream's `shadow-lg` is not, and `closeToast` (spread in by svelte-sonner) replaces
	 * upstream's stack-wide `toast.dismiss()`.
	 *
	 * Two substitutions. The tile is upstream's `bg-linear-to-br from-violet-500 to-purple-600
	 * text-white` — a raw-ramp gradient with no status meaning to collapse onto — so it lands on
	 * solid `bg-primary text-primary-foreground`, the brand ground with its own contrast
	 * foreground. The Active dot and label take `bg-success` / `text-success` for upstream's
	 * `green-500` / `green-600`: the positive status token is what the green means.
	 *
	 * The Configure icon carries no size class: Button's `xs` ramp already sizes unsized svgs to
	 * `size-3`, exactly upstream's `size-3`, the same note `sonner-deployment-toast.svelte`
	 * makes for its View Logs icon.
	 */
	let { closeToast }: { closeToast?: () => void } = $props();
</script>

<div
	class="flex w-[356px] flex-col gap-3 rounded-md border border-border bg-popover p-4 text-popover-foreground"
>
	<div class="flex items-center gap-3">
		<div
			class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground"
		>
			<LinkIcon class="size-5" aria-hidden="true" />
		</div>
		<div class="flex flex-1 flex-col gap-0.5">
			<p class="text-sm font-semibold">Integration Connected</p>
			<p class="text-xs text-muted-foreground">workspace.slack.com</p>
		</div>
		<span class="flex items-center gap-1 text-xs text-success">
			<span class="size-1.5 rounded-full bg-success"></span>
			Active
		</span>
	</div>
	<Separator />
	<div class="flex items-center justify-between text-xs text-muted-foreground">
		<span>Syncing 3 channels</span>
		<span>Last sync: just now</span>
	</div>
	<div class="flex gap-2">
		<Button size="xs" variant="outline" class="flex-1" onclick={() => closeToast?.()}>
			<SettingsIcon data-icon="inline-start" aria-hidden="true" />
			Configure
		</Button>
		<Button size="xs" class="flex-1" onclick={() => closeToast?.()}>Open Dashboard</Button>
	</div>
</div>
