<script lang="ts">
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import { toast } from "svelte-sonner";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";

	/**
	 * The body of "Multi-action invert toast with avatar group" (demo 17) — a
	 * pull-request summary with three overlapped reviewers and a View/Merge pair. The invert
	 * ground, the ghosted outline button, the dropped `shadow-lg` and the `closeToast` dismiss
	 * are all as `sonner-invert-success-toast.svelte` derives them.
	 *
	 * Specific to this file: upstream hand-rolls the overlap with `-space-x-2` and a
	 * `border-invert` ring per avatar; the house `Avatar.Group` primitive hardcodes exactly
	 * that `-space-x-2`, and its `ring-background` only needs re-pointing at `--foreground`,
	 * the ground the avatars sit on here. NO PHOTOGRAPHS — the three stock portraits become
	 * upstream's own initials on the `.avatar-title` ground that `sonner-avatar-toast.svelte`
	 * derives. The Merge button is `--success` where upstream builds a solid green from
	 * `green-500`/`green-800`, with `/80` hover as the house Button's own solid variant
	 * darkens; the Separator and the `main` code chip divide by `--background`, the swapped
	 * token, instead of `--border`.
	 */
	let { closeToast }: { closeToast?: () => void } = $props();

	const invertOutline =
		"border-background/10 bg-background/10 text-background hover:bg-background/20 hover:text-background dark:border-background/10 dark:bg-background/10 dark:hover:bg-background/20";

	const reviewers = [
		{ name: "Alex Johnson", initials: "AJ" },
		{ name: "Sarah Chen", initials: "SC" },
		{ name: "David Kim", initials: "DK" },
	];
</script>

<div
	class="flex w-[356px] flex-col gap-3 rounded-md border border-transparent bg-foreground p-4 text-background"
>
	<div class="flex items-center justify-between">
		<p class="text-sm font-semibold">Pull Request #284</p>
		<span class="text-xs text-background/40">2m ago</span>
	</div>
	<p class="text-sm text-background/70">
		All reviewers approved. Ready to merge into
		<code class="rounded bg-background/10 px-1 py-0.5 font-mono text-xs">main</code>
	</p>
	<Separator class="bg-background/10" />
	<div class="flex items-center justify-between">
		<Avatar.Group class="*:data-[slot=avatar]:ring-foreground">
			{#each reviewers as reviewer (reviewer.name)}
				<Avatar.Root size="sm">
					<Avatar.Fallback
						class="bg-muted-foreground text-[10px] text-primary-foreground dark:bg-secondary"
					>
						{reviewer.initials}
					</Avatar.Fallback>
				</Avatar.Root>
			{/each}
		</Avatar.Group>
		<div class="flex gap-2">
			<Button size="xs" variant="outline" class={invertOutline} onclick={() => closeToast?.()}>
				View
			</Button>
			<Button
				size="xs"
				class="border-success bg-success text-success-foreground hover:border-success/80 hover:bg-success/80"
				onclick={() => {
					closeToast?.();
					toast.success("Merged successfully");
				}}
			>
				Merge
			</Button>
		</div>
	</div>
</div>
