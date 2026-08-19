<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const alertVariants = tv({
		base: "group/alert relative grid w-full gap-0.5 rounded-lg border px-4 py-3 text-left text-sm has-data-[slot=alert-action]:relative has-data-[slot=alert-action]:pr-18 has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-2.5 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg]:text-current *:[svg:not([class*='size-'])]:size-4",
		variants: {
			variant: {
				default: "bg-card text-card-foreground",
				destructive:
					"bg-card text-destructive *:data-[slot=alert-description]:text-destructive/90 *:[svg]:text-current",
				// The classic theme's two status families, promoted from the Alerts page's recipes.
				//
				// SOFT: the `-subtle` ground under its dedicated `*-subtle-foreground` ink. The
				// ink used to be the full-strength status colour — the classic theme's own pairing, which
				// measured 1.5-4.4:1 and turned the 80% description below into 1.4-3.4:1; the
				// dedicated ink is contrast-walked so even that composite clears 4.5:1 (see
				// app.css §status tokens). Both tokens carry their own dark halves, so no `dark:`
				// half is needed. `border-transparent`, not `border-none`: the box keeps its 1px
				// size, so a soft alert and a bordered one are the same height in one stack.
				//
				// The description drops to 80% of the ink rather than to the part's own
				// `text-muted-foreground`, so the block reads as one object — the same mechanism
				// the `destructive` variant uses for its /90 tint.
				"info-subtle":
					"border-transparent bg-info-subtle text-info-subtle-foreground *:data-[slot=alert-description]:text-info-subtle-foreground/80",
				"success-subtle":
					"border-transparent bg-success-subtle text-success-subtle-foreground *:data-[slot=alert-description]:text-success-subtle-foreground/80",
				"warning-subtle":
					"border-transparent bg-warning-subtle text-warning-subtle-foreground *:data-[slot=alert-description]:text-warning-subtle-foreground/80",
				"destructive-subtle":
					"border-transparent bg-destructive-subtle text-destructive-subtle-foreground *:data-[slot=alert-description]:text-destructive-subtle-foreground/80",
				// SOLID: the full-strength fill. Each `-foreground` companion is the type
				// `color-contrast()` picked against that ground, which is why warning's is navy and
				// the other four are white — and why none of these needs a `dark:` half either.
				"solid-primary":
					"border-transparent bg-primary text-primary-foreground *:data-[slot=alert-description]:text-primary-foreground/80",
				"solid-info":
					"border-transparent bg-info text-info-foreground *:data-[slot=alert-description]:text-info-foreground/80",
				"solid-success":
					"border-transparent bg-success text-success-foreground *:data-[slot=alert-description]:text-success-foreground/80",
				"solid-warning":
					"border-transparent bg-warning text-warning-foreground *:data-[slot=alert-description]:text-warning-foreground/80",
				"solid-destructive":
					"border-transparent bg-destructive text-destructive-foreground *:data-[slot=alert-description]:text-destructive-foreground/80",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type AlertVariant = VariantProps<typeof alertVariants>["variant"];
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		class: className,
		variant = "default",
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		variant?: AlertVariant;
	} = $props();
</script>

<div
	bind:this={ref}
	data-slot="alert"
	role="alert"
	class={cn(alertVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</div>
