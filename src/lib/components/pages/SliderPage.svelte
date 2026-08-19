<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Slider } from "$lib/components/ui/slider/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { cn } from "$lib/utils.js";

	/**
	 * The Slider component page, ported from
	 * `https://shadcn-svelte.com/docs/components/slider` — one demo (`type="single"`, `max={100}`,
	 * `step={1}`) and a `Usage` snippet that is the same control at 33. The three sections after it
	 * exercise the props that snippet passes, the one thing bits-ui does that an
	 * `<input type="range">` cannot, and the disabled state — the only state the classic theme's compiled CSS
	 * actually restyles.
	 *
	 * WHAT THE CLASSIC THEME HAS: nothing of its own. There is no `_form-range` partial under
	 * the reference source, the reference stylesheet never declares a `form-range-*` variable,
	 * the reference docs never documents a range input, and no page under the reference demo pages contains
	 * one. What reaches the reference bundle is therefore STOCK the classic framework
	 * `.form-range`, compiled against the classic theme's variables — which is still a real counterpart,
	 * because four of those variables change the result:
	 *
	 *   component-active-bg        = primary, so `form-range-thumb-bg` compiles to #2C7BE5
	 *   input-btn-focus-width      .15rem where the classic framework ships .25rem, which is what puts
	 *                               `.form-range` at `height: 1.3rem` instead of 1.5rem
	 *   input-btn-focus-box-shadow none, so `form-range-thumb-focus-box-shadow` collapses to
	 *                               `0 0 0 1px body-bg` — a halo in the page colour, i.e. nothing
	 *   enable-shadows             left at the classic `false`, so the `@include box-shadow(...)`
	 *                               on the track and the thumb emits no declaration at all
	 *
	 * The rules that come out, quoted from the bundle:
	 *
	 *   .form-range                          { height: 1.3rem; width: 100%; padding: 0 }
	 *   .form-range::-webkit-slider-runnable-track
	 *                                        { height: .5rem; border-radius: 1rem;
	 *                                          background-color: var(--bs-secondary-bg);
	 *                                          border-color: transparent; cursor: pointer }
	 *   .form-range::-webkit-slider-thumb    { width: 1rem; height: 1rem; border: 0;
	 *                                          border-radius: 1rem; background-color: #2c7be5;
	 *                                          margin-top: -.25rem }
	 *   .form-range::-webkit-slider-thumb:active { background-color: #c0d7f7 }
	 *   .form-range:disabled                 { pointer-events: none }
	 *   .form-range:disabled::-webkit-slider-thumb
	 *                                        { background-color: var(--bs-secondary-color) }
	 *
	 * There is no dark-mode block for any of it; the two `var()`s do the whole theme swap.
	 *
	 * WHAT ALREADY MATCHES: the thumb is 1rem square and fully rounded in both — shadcn's `size-4
	 * rounded-full` is `form-range-thumb-width/height` and `form-range-thumb-border-radius`
	 * exactly. `margin-top: -.25rem` is the classic framework centring a 16px thumb on an 8px track by hand;
	 * the flex root does that on its own.
	 *
	 * WHAT THE CLASSIC THEME DOES NOT HAVE, and so is kept at shadcn's default:
	 *
	 *   the filled range   `<input type=range>` paints one uniform track. shadcn fills from the
	 *                      minimum to the thumb with `bg-primary`, and there is no classic value
	 *                      to port for it
	 *   a second thumb     one input carries one value
	 *   a vertical mode    `.form-range` is horizontal only
	 *   a hover state      the classic framework styles the thumb `:active` and `:disabled` and nothing else,
	 *                      where shadcn adds `hover:ring-4`
	 *   a focus ring       see `input-btn-focus-box-shadow` above. shadcn's `focus-visible:ring-4`
	 *                      is kept rather than reproduced, for the reason the Switch rules in
	 *                      `app.css` already give: the classic theme's own focus treatment is invisible here,
	 *                      and the ring is the only thing left showing the state
	 *
	 * There is no vendor slider either. `the reference source/vendor` holds choices, dropzone, feather,
	 * the picker, highlight, list and quill; "noUiSlider" does not appear anywhere in `src`.
	 *
	 * WHERE THE REST OF THE PORT LIVES: the track and the thumb are inner elements the component
	 * exposes no `class` prop for — the root's `class` is the only one that lands — so the track
	 * height, both surface colours and the two thumb states are `data-slot` rules in `app.css`,
	 * beside the Switch's, for the same reason. Only the control height is reachable from here.
	 */

	/**
	 * `.form-range` itself, which is three declarations.
	 *
	 *   h-[1.3rem]  `add(form-range-thumb-height, form-range-thumb-focus-box-shadow-width * 2)`
	 *               = 1rem + 2 × .15rem. The reserve exists so the focus shadow is not clipped, and
	 *               the .15rem is `input-btn-focus-width` — the classic override, not the classic
	 *               .25rem. shadcn gives the root no height at all, so it collapses onto the 16px
	 *               thumb and the row is 4.8px shorter than the classic theme's
	 *
	 * `width: 100%` and `padding: 0` need nothing: the root is already `w-full` and unpadded. The
	 * docs demo also carries `max-w-[70%]`, which is the docs site framing its own preview rather
	 * than a classic value, so it is dropped here.
	 */
	const control = "h-[1.3rem]";

	/** The docs' demo value. */
	let volume = $state(50);

	/** `min`/`max`/`step` below, at values that make a fractional step visible. */
	let temperature = $state(2.5);

	/** Two thumbs, which is `type="multiple"` — the value is an array rather than a number. */
	let priceRange = $state([25, 75]);

	/*
	 * Everything below this line is the slider demo set. Each section cites its `c-slider-N.tsx`.
	 * The horizontal ones keep `control` so the whole page sits on the same 1.3rem row height the
	 * header comment derives; the vertical pair cannot — `.form-range` has no vertical mode, so
	 * there is no classic height to carry over and the demo's `h-40` stands.
	 */

	/** demo 3 — three entries, three thumbs; `step={10}` keeps them on discrete stops. */
	let discreteValues = $state([10, 40, 80]);

	/** demo 4 — the same single/range pair as above, rotated. */
	let verticalValue = $state(50);
	let verticalRange = $state([25, 75]);

	/** demo 7 — one number, two controls: the slider and the input both write it. */
	let opacityValue = $state(50);

	/** demo 8 */
	let colorTemperature = $state(4500);

	/** demo 8 — the readout's word for the current Kelvin band. */
	function getColorTemperatureLabel(temp: number): string {
		if (temp <= 3000) return "Warm";
		if (temp <= 4500) return "Neutral";
		if (temp <= 5500) return "Daylight";
		return "Cool";
	}

	/** demo 9 */
	let storageValue = $state(15);

	/** demo 10 — one tick per step; every `durationSkipInterval`-th one gets a number. */
	let durationValue = $state(5);
	const durationMax = 12;
	const durationSkipInterval = 2;
	const durationTicks = Array.from({ length: durationMax + 1 }, (_, i) => i);

	/** demo 11 — the tooltip's `left` is the value as a fraction of the range. */
	let tooltipValue = $state(50);
	const tooltipMin = 0;
	const tooltipMax = 100;
	const tooltipPercentage = $derived(
		((tooltipValue - tooltipMin) / (tooltipMax - tooltipMin)) * 100,
	);

	/** demo 12 — the value is a 1-based index into both arrays. */
	let ratingValue = $state(3);
	const ratingEmojis = ["😡", "🙁", "😐", "🙂", "😍"];
	const ratingLabels = ["Awful", "Poor", "Okay", "Good", "Amazing"];
</script>

<DocPage title="Slider">
	{#snippet subtitle()}
		An input where the user selects a value from within a given range. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/slider"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<Slider type="single" bind:value={volume} max={100} step={1} class={control} />
		</Card.Content>
	</Card.Root>

	<DocSection title="Min, max and step">
		{#snippet blurb()}
			The three props the docs' usage snippet passes, at other values. They are the same three
			attributes an <code class="text-[87.5%] text-primary">&lt;input type="range"&gt;</code> takes, and
			the classic theme changes none of their behaviour — only how the track and thumb are painted.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- `gap-2` rather than a margin, so the readout tracks the control if either grows. -->
				<div class="flex flex-col gap-2">
					<Slider
						type="single"
						bind:value={temperature}
						min={0}
						max={5}
						step={0.5}
						class={control}
					/>
					<!--
						A readout has no classic counterpart — `.form-range` is the bare input, and the classic framework
						pairs it with no `<output>`. It is here only so the half-step is visible on the page.
						`text-xs` is `font-size-sm` (0.8125rem) and `text-muted-foreground` is
						`body-secondary-color`, the classic theme's colour for text that labels rather than informs.
					-->
					<p class="text-xs text-muted-foreground">min 0, max 5, step 0.5 — value {temperature}</p>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Multiple thumbs">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">type="multiple"</code> binds an array instead of a number
			and renders one thumb per entry. This has no classic counterpart at all: a range input carries a
			single value, so both the second thumb and the filled span between the two are shadcn's, kept as
			they ship.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-2">
					<Slider type="multiple" bind:value={priceRange} max={100} step={1} class={control} />
					<p class="text-xs text-muted-foreground">{priceRange[0]} – {priceRange[1]}</p>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Disabled">
		{#snippet blurb()}
			The only state the classic theme's compiled CSS restyles beyond the resting one.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`.form-range:disabled` does two things: `pointer-events: none`, which the component
					already applies, and repaints the thumb `var(--bs-secondary-color)` — #95AAC9 light,
					#6E84A3 dark, which is `--muted-foreground` exactly in both modes. That repaint is in
					`app.css` with the rest of the thumb.

					shadcn additionally fades the whole control with `data-disabled:opacity-50`, which
					the classic theme does not do — its track keeps its full colour. That one is kept rather than
					overridden: the classic theme has no filled range, so it never had to answer what a disabled
					primary fill should look like, and at full strength it reads as an enabled control.
				-->
				<Slider type="single" value={50} max={100} step={1} disabled class={control} />
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Slider with multiple discrete values">
		{#snippet blurb()}
			An array of three entries renders three thumbs, and
			<code class="text-[87.5%] text-primary">step=&lbrace;10&rbrace;</code> keeps every one of them on
			a discrete stop.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 3, verbatim apart from the page's shared row height. -->
				<div class="flex w-full max-w-xs items-center justify-center">
					<Slider type="multiple" bind:value={discreteValues} max={100} step={10} class={control} />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Vertical slider with range selection">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">orientation="vertical"</code> on a single value and on
			a range. The classic <code class="text-[87.5%] text-primary">.form-range</code> is horizontal only,
			so both columns are shadcn's, kept as they ship.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 4. The `h-40` matches the component's own `data-vertical:min-h-40`
					floor, so the pair sits at the minimum height the theme already declares.
				-->
				<div class="flex items-center justify-center gap-12">
					<Slider
						type="single"
						bind:value={verticalValue}
						max={100}
						step={1}
						orientation="vertical"
						class="h-40"
					/>
					<Slider
						type="multiple"
						bind:value={verticalRange}
						max={100}
						step={5}
						orientation="vertical"
						class="h-40"
					/>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Slider synced with number input">
		{#snippet blurb()}
			The slider and a number input share one state variable, so either control moves the other.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="mx-auto grid w-full max-w-sm gap-4">
					<div class="flex items-center justify-between">
						<Label for="slider-input" class="text-sm font-medium">Opacity</Label>
						<div class="flex items-center gap-1.5">
							<!--
								demo 7 guards the input side: the value only lands when it parses
								inside the range, so half-typed or out-of-range text never yanks the thumb.
								That guard is why this is an `oninput` handler rather than a second
								`bind:value` — a bind would write the rejected values too.
							-->
							<Input
								id="slider-input"
								type="number"
								value={opacityValue}
								min={0}
								max={100}
								class="h-8 w-16 text-center text-sm tabular-nums"
								oninput={(e) => {
									const v = Number(e.currentTarget.value);
									if (v >= 0 && v <= 100) opacityValue = v;
								}}
							/>
							<span class="text-xs text-muted-foreground">%</span>
						</div>
					</div>
					<Slider type="single" bind:value={opacityValue} max={100} step={1} class={control} />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Color temperature slider">
		{#snippet blurb()}
			A gradient strip above the control previews what the value means, and the readout names the
			Kelvin band.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="mx-auto grid w-full max-w-sm gap-4">
					<div class="flex items-center justify-between">
						<Label class="text-sm font-medium">Color Temperature</Label>
						<span class="text-xs font-medium text-muted-foreground tabular-nums">
							{colorTemperature}K &middot; {getColorTemperatureLabel(colorTemperature)}
						</span>
					</div>
					<!--
						demo 8. The gradient's five hex stops are kept raw on purpose: they are the
						demo's DATA — the physical warm-to-cool ramp of light temperature — not a theme
						decision, so no semantic token could stand in for them. Same exemption a colour
						picker gets.
					-->
					<div
						class="h-2 rounded-full"
						style="background: linear-gradient(to right, #ff8a2b, #ffd4a3, #fff5e6, #e8f0ff, #a3c9ff)"
					></div>
					<Slider
						type="single"
						bind:value={colorTemperature}
						min={2700}
						max={6500}
						step={100}
						class={control}
					/>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Slider with reference labels">
		{#snippet blurb()}
			Three static labels under the track mark the minimum, midpoint and maximum. They are
			<code class="text-[87.5%] text-primary">aria-hidden</code> — the thumb already announces its value.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 9 -->
				<div class="mx-auto grid w-full max-w-sm gap-4">
					<Label class="text-sm font-medium">Storage</Label>
					<Slider type="single" bind:value={storageValue} min={5} max={35} class={control} />
					<span
						aria-hidden="true"
						class="flex w-full items-center justify-between text-xs font-medium text-muted-foreground"
					>
						<span>5 GB</span>
						<span>20 GB</span>
						<span>35 GB</span>
					</span>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Slider with tick marks">
		{#snippet blurb()}
			One tick per step; every second tick is taller and numbered, the ones between shrink and hide
			their number so the scale stays readable at any width.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="mx-auto grid w-full max-w-sm gap-4">
					<Label class="text-sm font-medium">Duration (months)</Label>
					<Slider type="single" bind:value={durationValue} max={durationMax} class={control} />
					<!--
						demo 10. Each tick column is `w-0` so the row's `justify-between` spaces
						thirteen zero-width points evenly across the track, and `px-2.5` insets the first
						and last point by half a thumb so the ticks line up with where the thumb's centre
						actually stops. Skipped numbers keep `opacity-0` rather than disappearing — they
						still hold their column's width for the spacing to stay uniform.
					-->
					<span
						aria-hidden="true"
						class="flex w-full items-center justify-between gap-1 px-2.5 text-xs font-medium text-muted-foreground"
					>
						{#each durationTicks as tick (tick)}
							<span class="flex w-0 flex-col items-center justify-center gap-2">
								<span
									class={cn(
										"h-1 w-px bg-muted-foreground/70",
										tick % durationSkipInterval !== 0 && "h-0.5",
									)}
								></span>
								<span class={cn(tick % durationSkipInterval !== 0 && "opacity-0")}>
									{tick}
								</span>
							</span>
						{/each}
					</span>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Slider with dynamic tooltip indicator">
		{#snippet blurb()}
			A tooltip bubble rides the thumb: its <code class="text-[87.5%] text-primary">left</code> is
			the value's position in the range, and
			<code class="text-[87.5%] text-primary">translateX(-50%)</code>
			keeps it centred over the thumb.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="mx-auto grid w-full max-w-sm gap-4">
					<Label class="text-sm font-medium">Volume</Label>
					<!--
						demo 11. `pt-7` reserves the bubble's lane above the track, and the rotated
						`size-2` square under it is the tooltip's arrow. `bg-foreground`/`text-background`
						is the inverted pair the house tooltip itself uses.
					-->
					<div class="relative pt-7">
						<div
							class="absolute top-0 rounded bg-foreground px-2 py-0.5 text-xs font-semibold text-background tabular-nums"
							style="left: {tooltipPercentage}%; transform: translateX(-50%)"
						>
							{tooltipValue}%
							<div
								class="absolute -bottom-1 left-1/2 size-2 -translate-x-1/2 rotate-45 bg-foreground"
							></div>
						</div>
						<Slider
							type="single"
							bind:value={tooltipValue}
							min={tooltipMin}
							max={tooltipMax}
							step={1}
							class={control}
						/>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Rating slider with emoji feedback">
		{#snippet blurb()}
			Five stops, each mapped to an emoji and a word — the slider as a discrete rating input rather
			than a continuous one.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 12. The value is 1-based, so both lookups subtract one. -->
				<div class="mx-auto grid w-full max-w-sm gap-3">
					<Label class="text-sm font-medium">Rate your experience</Label>
					<div class="flex items-center gap-3">
						<Slider
							type="single"
							bind:value={ratingValue}
							min={1}
							max={5}
							step={1}
							class={control}
						/>
						<span class="text-2xl" aria-hidden="true">{ratingEmojis[ratingValue - 1]}</span>
					</div>
					<span class="text-center text-xs font-medium text-muted-foreground">
						{ratingLabels[ratingValue - 1]}
					</span>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
