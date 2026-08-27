<script lang="ts">
	import Loader2Icon from "@lucide/svelte/icons/loader-2";
	import { cn } from "$lib/utils.js";
	import type { SVGAttributes } from "svelte/elements";

	let {
		class: className,
		role = "status",
		// we add name, color, and stroke for compatibility with different icon libraries props
		name,
		color,
		stroke,
		"aria-label": ariaLabel = "Loading",
		...restProps
	}: SVGAttributes<SVGSVGElement> = $props();
</script>

<!--
	`motion-reduce:animate-pulse` rather than a slower spin: rotation is exactly the class of
	motion the media query exists to remove, and `src/app.css` answers it the same way for the
	loader catalog — the moving part stops and the element breathes, so a reader who asked for
	less motion is still told that something is in progress. Tailwind's own `pulse` keyframes, so
	the answer travels with the component into a project that installs nothing else.
-->
<Loader2Icon
	{role}
	data-slot="spinner"
	name={name === null ? undefined : name}
	color={color === null ? undefined : color}
	stroke={stroke === null ? undefined : stroke}
	aria-label={ariaLabel}
	class={cn("size-4 animate-spin motion-reduce:animate-pulse", className)}
	{...restProps}
/>
