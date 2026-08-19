<script lang="ts" module>
	import { type VariantProps, tv } from "tailwind-variants";

	export const badgeVariants = tv({
		base: "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3!",
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
				secondary: "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
				destructive:
					"bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
				outline: "border-border text-foreground [a]:hover:bg-muted [a]:hover:text-muted-foreground",
				ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
				link: "text-primary underline-offset-4 hover:underline",
				// The classic theme's soft pill family — `.text-bg-{state}-subtle`, its most common element:
				// the opaque `*-subtle` ground under its dedicated `*-subtle-foreground` ink (both
				// tokens carry their own dark halves, so no `dark:` variant is needed). The ink
				// used to be the full-strength state colour, which measured 1.5-4.4:1 — legible
				// only for hues that are intrinsically light; see app.css §status tokens. The
				// `[a]:hover` deepens the ground 15% toward the state colour via color-mix rather
				// than an `/80`-style alpha, so a link badge's hover stays opaque instead of
				// letting the page bleed through the pill — one derivation, applied to all five.
				// `destructive` above keeps vega's `/10` wash verbatim: that is upstream registry
				// API, and the divergence is deliberate.
				"primary-subtle":
					"bg-primary-subtle text-primary-subtle-foreground [a]:hover:bg-[color-mix(in_srgb,var(--primary-subtle)_85%,var(--primary))]",
				"success-subtle":
					"bg-success-subtle text-success-subtle-foreground [a]:hover:bg-[color-mix(in_srgb,var(--success-subtle)_85%,var(--success))]",
				"info-subtle":
					"bg-info-subtle text-info-subtle-foreground [a]:hover:bg-[color-mix(in_srgb,var(--info-subtle)_85%,var(--info))]",
				"warning-subtle":
					"bg-warning-subtle text-warning-subtle-foreground [a]:hover:bg-[color-mix(in_srgb,var(--warning-subtle)_85%,var(--warning))]",
				"destructive-subtle":
					"bg-destructive-subtle text-destructive-subtle-foreground [a]:hover:bg-[color-mix(in_srgb,var(--destructive-subtle)_85%,var(--destructive))]",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
</script>

<script lang="ts">
	import { cn, type WithElementRef } from "$lib/utils.js";
	import type { HTMLAnchorAttributes } from "svelte/elements";

	let {
		ref = $bindable(null),
		href,
		class: className,
		variant = "default",
		children,
		...restProps
	}: WithElementRef<HTMLAnchorAttributes> & {
		variant?: BadgeVariant;
	} = $props();
</script>

<svelte:element
	this={href ? "a" : "span"}
	bind:this={ref}
	data-slot="badge"
	{href}
	class={cn(badgeVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</svelte:element>
