<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * A solid dot with a single halo swelling out of it and fading away.
	 *
	 * `[0, 1]` AND `[0.8, 0]` ARE TWO-VALUE ARRAYS, so this is a `from`/`to` ramp rather than the
	 * out-and-back triangle most of this family uses, and `repeat: Infinity` snaps it back to the
	 * start each cycle. The snap is invisible here and that is the whole trick: the halo ends at
	 * opacity 0, so there is nothing on screen to see jumping back to scale 0. Writing `alternate`
	 * instead would give a halo that shrinks back into the dot — a different, wrong picture.
	 *
	 * BOTH THE HALO AND THE CORE ARE `bg-foreground`: the halo's own opacity ramp
	 * makes the difference, so there is no second weight to reach for here.
	 *
	 * `ease-out` here is CSS's bare keyword, not Tailwind's variable.
	 */
	let {
		ref = $bindable(null),
		class: className,
		role = "status",
		"aria-label": ariaLabel = DEFAULT_LOADER_LABEL,
		...restProps
	}: LoaderProps = $props();
</script>

<div
	bind:this={ref}
	{...restProps}
	data-slot="loader"
	data-loader="pulse-dot"
	{role}
	aria-label={ariaLabel}
	class={cn("relative flex size-10 items-center justify-center", className)}
>
	<!-- `absolute` inside a centring flex container resolves to the centred static position, so the
	     halo grows from the middle of the box without any offset arithmetic. -->
	<span class="halo absolute size-10 rounded-full bg-foreground"></span>
	<!-- `z-10` keeps the core above the halo as it sweeps past; the core is opaque, so the halo
	     passing under it is what gives the pulse its hard centre. -->
	<span class="relative z-10 size-3 rounded-full bg-foreground"></span>
</div>

<style>
	/* The swell (`scale` 0 → 1) and the fade (`opacity` 0.8 → 0`), merged into one pair of
	   stops — CSS has a single `transform`, and running scale and opacity as two animations would let
	   them desynchronise. */
	@keyframes loader-pulse-dot-swell {
		from {
			opacity: 0.8;
			transform: scale(0);
		}
		to {
			opacity: 0;
			transform: scale(1);
		}
	}

	.halo {
		/* The rest state: the halo caught halfway out and halfway faded — the midpoint of the ramp
		   above, and a real frame of this animation. Frame 0 (scale 0) would leave nothing but the
		   core, which reads as a bullet rather than as a loader; frame 100% is invisible. The 0.8 and
		   the 1 are the keyframe's own endpoints, halved here; the two sites have to agree. */
		opacity: 0.4;
		transform: scale(0.5);

		/* `ease-out` — cubic-bezier(0, 0, 0.58, 1) — so the
		   halo leaps away from the core and then coasts, which is what makes it read as a ripple. */
		animation: loader-pulse-dot-swell 1.5s ease-out infinite;
	}
</style>
