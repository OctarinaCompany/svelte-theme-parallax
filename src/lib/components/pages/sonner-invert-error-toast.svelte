<script lang="ts">
	import XIcon from "@lucide/svelte/icons/x";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";

	/**
	 * The body of "Custom invert error toast with details" (demo 14) — a build
	 * failure with two mono error lines behind a separator and a View Logs / Retry pair. The
	 * invert ground, the ghosted outline button, the dropped `shadow-lg` and the `closeToast`
	 * dismiss are all as `sonner-invert-success-toast.svelte` derives them.
	 *
	 * Specific to this file: the chip and the Retry button are `--destructive` where upstream
	 * writes `red-500` and a hand-tuned `red-800`/`red-600` hover ladder — the destructive
	 * token is the house negative status, and `/80` hover is how the house Button's own solid
	 * variant darkens. The Separator's `bg-border/10` becomes `bg-background/10`, the swapped
	 * token everything on the invert ground divides by. Upstream's `space-y-1` error stack is
	 * `flex flex-col gap-1`, the repo-wide substitution.
	 */
	let { closeToast }: { closeToast?: () => void } = $props();

	const invertOutline =
		"border-background/10 bg-background/10 text-background hover:bg-background/20 hover:text-background dark:border-background/10 dark:bg-background/10 dark:hover:bg-background/20";
</script>

<div
	class="flex w-[356px] flex-col gap-3 rounded-md border border-transparent bg-foreground p-4 text-background"
>
	<div class="flex items-start gap-3">
		<div
			class="flex size-6 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
		>
			<XIcon class="size-3.5" />
		</div>
		<div class="flex flex-1 flex-col gap-1">
			<p class="text-sm font-semibold">Build Failed</p>
			<p class="text-sm text-background/70">
				Compilation error in 2 files. Fix errors before deploying.
			</p>
		</div>
	</div>
	<Separator class="bg-background/10" />
	<div class="flex flex-col gap-1 font-mono text-xs text-background/60">
		<p>src/api/auth.ts:42 — TypeError: undefined is not a function</p>
		<p>src/utils/parse.ts:18 — SyntaxError: Unexpected token</p>
	</div>
	<div class="flex gap-2">
		<Button
			size="xs"
			variant="outline"
			class="flex-1 {invertOutline}"
			onclick={() => closeToast?.()}
		>
			View Logs
		</Button>
		<Button
			size="xs"
			class="flex-1 border-destructive bg-destructive text-destructive-foreground hover:border-destructive/80 hover:bg-destructive/80"
			onclick={() => closeToast?.()}
		>
			Retry Build
		</Button>
	</div>
</div>
