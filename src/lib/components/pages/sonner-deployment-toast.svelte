<script lang="ts">
	import ExternalLinkIcon from "@lucide/svelte/icons/external-link";
	import { Button } from "$lib/components/ui/button/index.js";

	/**
	 * The body of the deployment-summary toast — a status dot, three key/value rows and a
	 * View Logs / Open Site pair. Same mechanics as `sonner-user-message-toast.svelte`:
	 * `toast.custom()` drops sonner's box, so the popover ground and border are drawn here, a
	 * shadow is not (elevation is deferred repo-wide), and `closeToast` (spread in by
	 * svelte-sonner) dismisses this toast alone rather than the whole stack.
	 *
	 * The dot is `bg-success`, never a raw palette green — the house rule forbids raw
	 * colours, and the positive status token is what the green means. The View Logs icon
	 * carries no size class: Button's `xs` ramp already sizes unsized svgs to `size-3`.
	 */
	let { closeToast }: { closeToast?: () => void } = $props();
</script>

<div
	class="flex w-[356px] flex-col gap-2 rounded-md border border-border bg-popover p-4 text-popover-foreground"
>
	<div class="flex items-center gap-2">
		<span class="flex size-2 rounded-full bg-success"></span>
		<p class="text-sm font-medium">Deployment Successful</p>
	</div>
	<div class="flex flex-col gap-1 text-xs text-muted-foreground">
		<div class="flex items-center justify-between">
			<span>Environment</span>
			<span class="font-medium text-foreground">Production</span>
		</div>
		<div class="flex items-center justify-between">
			<span>Duration</span>
			<span class="font-medium text-foreground">42s</span>
		</div>
		<div class="flex items-center justify-between">
			<span>Commit</span>
			<span class="font-mono font-medium text-foreground">a1b2c3d</span>
		</div>
	</div>
	<div class="mt-1 flex gap-2">
		<Button size="xs" variant="outline" class="flex-1" onclick={() => closeToast?.()}>
			<ExternalLinkIcon data-icon="inline-start" aria-hidden="true" />
			View Logs
		</Button>
		<Button size="xs" class="flex-1" onclick={() => closeToast?.()}>Open Site</Button>
	</div>
</div>
