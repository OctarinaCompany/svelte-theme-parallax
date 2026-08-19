<script lang="ts" module>
	/** One themed ring in the Colors example. */
	export type CircularProgressColorTheme = {
		name: string;
		trackClass: string;
		rangeClass: string;
		textClass: string;
	};

	/** The value every tile animates to, matching upstream. */
	const TARGET_VALUE = 75;
	/** Gap between one tile starting and the next, so the row fills in as a wave. */
	const STAGGER_MS = 150;
</script>

<script lang="ts">
	import { cubicOut } from "svelte/easing";
	import { Tween } from "svelte/motion";

	import * as CircularProgress from "$lib/components/ui/circular-progress/index.js";
	import { cn } from "$lib/utils.js";

	let { theme, index }: { theme: CircularProgressColorTheme; index: number } = $props();

	let root = $state<HTMLDivElement | null>(null);
	let inView = $state(false);

	/**
	 * Upstream springs the value with `stiffness: 60, damping: 15, mass: 1` — a damping ratio just
	 * under 1, so it settles without overshoot. A cubic-out tween lands the same way and needs no
	 * spring tuning to match.
	 */
	const progress = new Tween(0, { duration: 900, easing: cubicOut });

	const displayValue = $derived(Math.round(progress.current));

	$effect(() => {
		const element = root;
		if (!element) return;

		let timer: ReturnType<typeof setTimeout> | undefined;

		// Once, and only once properly on screen — upstream's `useInView(ref, { once: true,
		// margin: "-100px" })`. Without the negative margin the row would animate while it is still
		// a sliver at the bottom of the viewport, and the reader would miss it.
		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries.some((entry) => entry.isIntersecting)) return;
				observer.disconnect();
				inView = true;
				timer = setTimeout(() => {
					progress.target = TARGET_VALUE;
				}, index * STAGGER_MS);
			},
			{ rootMargin: "-100px" },
		);
		observer.observe(element);

		return () => {
			observer.disconnect();
			if (timer) clearTimeout(timer);
		};
	});
</script>

<div
	bind:this={root}
	class={cn(
		"flex flex-col items-center gap-3 transition-all duration-[600ms] ease-out",
		!inView && "translate-y-5 opacity-0",
	)}
	style={`transition-delay: ${index * 100}ms;`}
>
	<CircularProgress.Root value={displayValue} size={80} thickness={6}>
		<CircularProgress.Indicator>
			<CircularProgress.Track class={theme.trackClass} />
			<CircularProgress.Range class={theme.rangeClass} />
		</CircularProgress.Indicator>
		<CircularProgress.ValueText class={cn("text-sm font-semibold", theme.textClass)} />
	</CircularProgress.Root>
	<div class="flex flex-col items-center gap-1 text-center">
		<h4 class="text-sm font-medium">{theme.name}</h4>
		<p class="text-xs text-muted-foreground">{displayValue}% complete</p>
	</div>
</div>
