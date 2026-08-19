<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import { Button } from "$lib/components/ui/button/index.js";

	/**
	 * The body of "Custom invert success toast" (demo 13), and the file that
	 * carries the derivation the other four invert bodies reuse.
	 *
	 * THE INVERT GROUND IS `bg-foreground text-background`. Upstream's `bg-invert` /
	 * `text-invert-foreground` tokens do not exist in this theme, and the pair that means the
	 * same thing — the page's own colours swapped — is already here: `--foreground` is #12263F
	 * light / #FFFFFF dark, so the toast comes out dark-on-light pages and light-on-dark ones,
	 * which is exactly what "invert" flips. Upstream's opacity steps (`/70`, `/40`) ride along
	 * on `text-background` unchanged.
	 *
	 * The status chip is `bg-success text-success-foreground` where upstream writes
	 * `bg-green-500 text-white` — raw palette colours are what the house rule forbids, and the
	 * `-foreground` pairing is how every solid status surface in this theme picks its type
	 * colour (the Solid section on the page records the same trade). `shadow-lg` is dropped as
	 * on every custom body here: elevation is deferred repo-wide, per the `[data-slot='card']`
	 * block in `app.css`. `closeToast` is svelte-sonner's own per-toast dismiss, spread onto
	 * every custom component, standing in for upstream's stack-wide `toast.dismiss()`.
	 *
	 * The ghosted button repaints Button's `outline` variant for the inverted ground: a tenth
	 * of `--background` as fill and border, type at full strength — upstream's
	 * `bg-background/10 border-border/10` recipe with the border taken from the same swapped
	 * token as the fill, since `--border` belongs to the surface the toast is not on. The
	 * `dark:` restatements exist only to beat the variant's own `dark:` fills.
	 */
	let { closeToast }: { closeToast?: () => void } = $props();

	const invertOutline =
		"border-background/10 bg-background/10 text-background hover:bg-background/20 hover:text-background dark:border-background/10 dark:bg-background/10 dark:hover:bg-background/20";
</script>

<div
	class="flex w-[356px] items-start gap-3 rounded-md border border-transparent bg-foreground p-4 text-background"
>
	<div
		class="flex size-6 shrink-0 items-center justify-center rounded-full bg-success text-success-foreground"
	>
		<CheckIcon class="size-3.5" />
	</div>
	<div class="flex flex-1 flex-col gap-1">
		<p class="text-sm font-semibold">Payment Successful</p>
		<p class="text-sm text-background/70">
			Invoice #INV-2025-0042 has been paid. $2,400.00 received.
		</p>
		<div class="mt-2 flex gap-2">
			<Button size="xs" variant="outline" class={invertOutline} onclick={() => closeToast?.()}>
				View Receipt
			</Button>
		</div>
	</div>
</div>
