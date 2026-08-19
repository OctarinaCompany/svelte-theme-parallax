<script lang="ts">
	import { cn } from "$lib/utils.js";

	import { DEFAULT_LOADER_LABEL, type LoaderProps } from "./loader.svelte.js";

	/**
	 * An outlined square that relaxes into a circle and tightens back.
	 *
	 * THE BORDER IS THE LOADER: opaque ink at 3px — the entire visible object — so it takes
	 * `border-foreground`, not `border-border`. `border-border` is the hairline token, for a
	 * border written with an alpha suffix on the page ground; spending it here would give a ring you
	 * have to look for.
	 *
	 * NOTHING BUT `border-radius` MOVES. `[a, b, a]` starts and ends on the same value, so this is the
	 * `0%, 100% { … } 50% { … }` shape rather than a `from`/`to` with a snap, and the loop point is
	 * seamless. There is no transform equivalent for rounding a corner, which is why the property
	 * itself is animated — and a radius is a paint-time value, not a layout one, so it costs nothing
	 * that matters.
	 *
	 * `border-[3px]` STAYS AN ARBITRARY VALUE. Tailwind's border scale steps 2 → 4 with nothing at 3,
	 * and this is geometry rather than colour, so an arbitrary value is the right answer.
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
	data-loader="smooth-rounded-square"
	{role}
	aria-label={ariaLabel}
	class={cn("size-10", className)}
>
	<!-- The hook class is `frame`, not `ring`: `ring` is a real Tailwind utility (a box-shadow ring),
	     and a scoped class sharing its name would quietly paint one. -->
	<span class="frame block size-full border-[3px] border-foreground"></span>
</div>

<style>
	@keyframes loader-smooth-rounded-square-round {
		0%,
		100% {
			border-radius: 10%;
		}
		50% {
			border-radius: 50%;
		}
	}

	.frame {
		/* The rest state: a superellipse midway between the two poses, i.e. the frame this
		   loader would be caught on part-way through a morph. Freezing on either endpoint would show
		   a finished square or a finished circle — a settled shape rather than one in transit. */
		border-radius: 30%;

		/* `ease-in-out` is the CSS keyword: the CSS keyword, not Tailwind's `--ease-in-out`. */
		animation: loader-smooth-rounded-square-round 2s ease-in-out infinite;
	}
</style>
