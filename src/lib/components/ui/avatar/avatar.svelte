<script lang="ts">
	import { Avatar as AvatarPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		loadingStatus = $bindable("loading"),
		size = "default",
		class: className,
		...restProps
	}: AvatarPrimitive.RootProps & {
		size?: "default" | "sm" | "lg";
	} = $props();
</script>

<AvatarPrimitive.Root
	bind:ref
	bind:loadingStatus
	data-slot="avatar"
	data-size={size}
	class={cn(
		// The hairline ring is the `::after` box, so its radius has to FOLLOW the root's rather than be
		// a circle for ever: call sites square the avatar off (`rounded-lg` in the sidebar footer,
		// `rounded-md` on a thumbnail) and a hardcoded `after:rounded-full` then drew a circle over a
		// rounded square, leaving the four corners of the fill sticking out around it. `inherit` on
		// the ring, the image and the fallback makes the root the only place a radius is written.
		"group/avatar relative flex size-8 shrink-0 rounded-full select-none after:absolute after:inset-0 after:rounded-[inherit] after:border after:border-border after:mix-blend-darken data-[size=lg]:size-10 data-[size=sm]:size-6 dark:after:mix-blend-lighten",
		className,
	)}
	{...restProps}
/>
