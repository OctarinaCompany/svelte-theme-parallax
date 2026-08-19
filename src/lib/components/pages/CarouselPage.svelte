<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Carousel from "$lib/components/ui/carousel/index.js";
	import type { CarouselAPI } from "$lib/components/ui/carousel/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Carousel component page, ported from shadcn-svelte's documentation
	 * (`https://shadcn-svelte.com/docs/components/carousel.md`): the opening carousel, then
	 * Sizes, Spacing, Orientation, Options and API.
	 *
	 * THE CLASSIC FRAMEWORK HAS A `.carousel`; THE CLASSIC THEME NEVER TOUCHES IT. The reference stylesheet line 48 pulls in
	 * the classic framework source and that is the whole story — there is no reference-stylesheet
	 * partial, the reference stylesheet declares no `carousel-*` override,
	 * and the string "carousel" appears in no HTML file under the reference demo pages at all — not in the 44
	 * demo pages, and not in the reference docs, whose 29 sections run from accordion
	 * to utilities without ever reaching this one. Everything
	 * `.carousel*` in the reference bundle is therefore stock the classic framework, compiled
	 * and shipped but never used or restyled. So the component's own look is the (c) case, and
	 * the two things this page actually ports are the surfaces it is built out of: the slide and
	 * the control button, both of which have real classic values.
	 *
	 * THE MECHANISMS DO NOT LINE UP EITHER. The classic `.carousel-item` is a floated 100%-wide
	 * slide moved by `transform: translateX(±100%)` over `carousel-transition-duration: .6s`,
	 * one slide visible at a time and no pointer dragging. shadcn's is Embla: a scroll container
	 * with drag, inertia and any number of slides in view, which is what makes the Sizes and
	 * Spacing examples below possible at all. Embla's `duration` option is a physics constant
	 * (default 25), not a time — so the classic `.6s` has nothing to be written into and is left
	 * alone rather than guessed at.
	 *
	 * TWO THE CLASSIC FRAMEWORK PARTS HAVE NO SHADCN COUNTERPART, so they are absent here rather than
	 * skipped: `.carousel-indicators` (the strip of 30x3px bars) and `.carousel-caption`. The
	 * installed primitive exports Root, Content, Item, Previous and Next and nothing else, and
	 * the shadcn docs page has no example for either.
	 *
	 * ONE DOCS EXAMPLE IS DELIBERATELY NOT PORTED: the Plugins section, which demonstrates
	 * autoplay through `embla-carousel-autoplay`. That package is not a dependency of this repo
	 * and this theme adds none. The classic equivalent, `data-bs-ride="carousel"` driven by
	 * `carousel-*` timing, is likewise unconfigured in the classic theme — so nothing is lost on
	 * the classic-theme side by leaving it out. The Events section is not a separate demo: it attaches
	 * listeners to the same `setApi` instance the API section already uses.
	 *
	 * The slides are numbered placeholders, exactly as the docs have them — no image, remote or
	 * otherwise, is involved.
	 */

	/** Five slides, as every example on the docs page uses. */
	const slides = [1, 2, 3, 4, 5];

	/**
	 * One slide's surface.
	 *
	 * The docs put a nested `Card.Root` here. That cannot work in this theme: `app.css` sets
	 * `.dark [data-slot='card'] { --tw-ring-color: var(--card) }` because
	 * `card-outline-color-dark` IS the card's own background, so a card drawn on a card is
	 * literally invisible in dark mode — the slides would vanish.
	 *
	 * `bg-background` is the device `app.css` already uses for `table-head-bg`: the token
	 * resolves to `gray-100` in light and `black` in dark, i.e. the page showing through the
	 * card, which contrasts against `card-bg` in BOTH modes.
	 *
	 *   rounded-lg  `--radius-lg` is `border-radius-lg: 0.5rem`, which is also
	 *               `card-border-radius` — the radius the nested card would have had
	 *   p-6         24px, `card-spacer-y` / `card-spacer-x` (`spacer: 1.5rem`). The docs
	 *               chose the same number for `Card.Content`; here it is the classic value
	 */
	const slide = "flex items-center justify-center rounded-lg bg-background p-6";

	/**
	 * The slide number. `font-semibold` is `font-weight-bold`, which the classic theme sets to 600 rather
	 * than the classic 700 — the same reading as `b, strong` on the Accordion page.
	 *
	 * The `text-2xl`/`3xl`/`4xl` steps the docs pick per example keep Tailwind's sizes; `app.css`
	 * only attaches the classic theme's heading treatment to them (`headings-letter-spacing: -.02em`,
	 * `headings-line-height: 1.1`), so no call-site work is needed.
	 */
	const number = "font-semibold";

	/**
	 * The previous/next controls.
	 *
	 * the classic `.carousel-control-prev/-next` is not a button in any visual sense: a 15%-wide
	 * transparent strip laid over the slide at `opacity: .5`, rising to `.9` on hover, carrying a
	 * white chevron as a 2rem `background-image`. shadcn puts a real icon button OUTSIDE the
	 * frame instead, so the strip has nothing to map onto. The one thing the two agree on is the
	 * glyph: the classic inline SVG is a chevron, and so is `@lucide/svelte`'s.
	 *
	 * What IS portable is the button. The classic theme's floating round icon button is
	 * `.btn-white.btn-rounded-circle`, so the controls take that surface rather than shadcn's
	 * `outline` variant — whose `bg-background` is the classic theme's page grey and reads as a hole
	 * punched in the card. The colours are `.btn-white` as derived on the Buttons page, and
	 * `.btn-sm` resolves to 28.75px in the reference; the square takes the ramp's
	 * `--control-h-sm` (32px) instead, the divergence `app.css` records. The
	 * component supplies `rounded-full` itself.
	 *
	 * The three `dark:` classes are not new colours — each is the same token as its light
	 * counterpart. They exist only to cancel shadcn's `outline` variant, which ships
	 * `dark:border-input dark:bg-input/30 dark:hover:bg-input/50`; tailwind-merge cannot evict a
	 * `dark:`-prefixed class with an unprefixed one, so the override has to be stated at the
	 * same specificity or the button turns translucent navy in dark mode.
	 */
	const control =
		"size-(--control-h-sm) border-border bg-card text-card-foreground hover:bg-accent dark:border-border dark:bg-card dark:hover:bg-background";

	/**
	 * Horizontal demos: the controls sit at `-start-12` / `-end-12`, i.e. 3rem outside the
	 * carousel, and `Card.Root` is `overflow-hidden` — so anything past the card's padding box is
	 * clipped rather than merely overlapping. `px-12` replaces `Card.Content`'s own
	 * `card-spacer-x` (24px) with exactly that 3rem, which keeps the controls inside the card at
	 * any width.
	 */
	const horizontalFrame = "px-12";

	/** The same reservation for `-top-12` / `-bottom-12`, on top of the card's own 24px. */
	const verticalFrame = "py-12";

	/**
	 * The API demo's state, straight from the docs. `setApi` hands back Embla's instance;
	 * `scrollSnapList()` is the slide count and `selectedScrollSnap()` the zero-based index.
	 */
	let api = $state<CarouselAPI>();
	const count = $derived(api ? api.scrollSnapList().length : 0);
	let current = $state(0);

	$effect(() => {
		if (api) {
			current = api.selectedScrollSnap() + 1;
			// The Events section of the docs is this line: every interaction, whatever caused
			// it — arrow, drag, keyboard — arrives as `select` on the same instance.
			api.on("select", () => {
				current = api!.selectedScrollSnap() + 1;
			});
		}
	});

	/*
	 * Everything below is the carousel pattern appendix,
	 * appended after the shadcn-svelte sections above. Two standing substitutions:
	 *
	 * 1. NO REMOTE ASSETS. A stock slide would be a remote photograph; this repo makes no
	 *    network requests at runtime (the Card and Aspect ratio pages are the precedent). Plain
	 *    slides keep this page's numbered `slide` surface; the two overlay demos, whose subject
	 *    IS the text-over-image treatment, keep the overlay but draw it as a `foreground` scrim
	 *    with `background` text — the Card page's rule for white-on-photo content, the same
	 *    relationship inverted per theme.
	 * 2. Appendix copies of the basic, vertical,
	 *    multi-item, responsive-basis and spacing
	 * demos are not repeated — the sections above already show each
	 *    mechanism. The autoplay demo stays out for the reason the header
	 *    gives: `embla-carousel-autoplay` is not a dependency and this theme adds none.
	 */

	/**
	 * Ten slides for the two thumbnail demos — enough that the
	 * thumbnail strip itself has to scroll, which is what `dragFree` is there to show.
	 */
	const thumbnailSlides = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

	/**
	 * The overlay demos' scrim + caption, shared by demo 8 and demo 11.
	 * A literal `from-black/80` gradient and white text become `foreground` over `background` so
	 * the pairing holds in both modes; `font-semibold`, not `font-bold`, per this page's
	 * `number` note (the house bold weighs 600).
	 */
	const overlayScrim =
		"absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-foreground/80 to-transparent";
	const overlayTitle = "text-xl font-semibold text-background";
	const overlayText = "text-sm text-background/90";

	/**
	 * Thumbnail navigation: two Embla instances, synced one way — clicking a
	 * thumb scrolls the main carousel, and the main carousel's `select` both highlights the
	 * matching thumb and scrolls the strip so it stays in view.
	 */
	let thumbsMainApi = $state<CarouselAPI>();
	let thumbsThumbApi = $state<CarouselAPI>();
	let thumbsSelectedIndex = $state(0);

	/** Overlay variant: same wiring, second pair of instances. */
	let overlayMainApi = $state<CarouselAPI>();
	let overlayThumbApi = $state<CarouselAPI>();
	let overlaySelectedIndex = $state(0);

	/**
	 * One effect per pair — no `useCallback` + `useEffect` + manual `off` dance:
	 * the rune's cleanup return is the `off` calls, and re-running on either api arriving is
	 * the dependency tracking. `reInit` matters here because Embla re-snaps on resize and the
	 * highlight would otherwise drift.
	 */
	function syncThumbs(
		main: CarouselAPI | undefined,
		thumb: CarouselAPI | undefined,
		setIndex: (index: number) => void,
	) {
		if (!main || !thumb) return;
		const onSelect = () => {
			const index = main.selectedScrollSnap();
			setIndex(index);
			thumb.scrollTo(index);
		};
		onSelect();
		main.on("select", onSelect);
		main.on("reInit", onSelect);
		return () => {
			main.off("select", onSelect);
			main.off("reInit", onSelect);
		};
	}

	$effect(() => syncThumbs(thumbsMainApi, thumbsThumbApi, (i) => (thumbsSelectedIndex = i)));
	$effect(() => syncThumbs(overlayMainApi, overlayThumbApi, (i) => (overlaySelectedIndex = i)));

	/**
	 * Dots navigation: the same instance-holding idiom as the API section
	 * above — `scrollSnapList()` for the dot count, `select` for the active one — plus
	 * `scrollTo` on click, the one direction the API section does not use.
	 */
	let dotsApi = $state<CarouselAPI>();
	const dotsCount = $derived(dotsApi ? dotsApi.scrollSnapList().length : 0);
	let dotsCurrent = $state(0);

	$effect(() => {
		if (dotsApi) {
			dotsCurrent = dotsApi.selectedScrollSnap();
			dotsApi.on("select", () => {
				dotsCurrent = dotsApi!.selectedScrollSnap();
			});
		}
	});
</script>

<DocPage title="Carousel">
	{#snippet subtitle()}
		A carousel with motion and swipe built using Embla. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/carousel"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content class={horizontalFrame}>
			<!--
				`max-w-xs` is the docs' own width; `mx-auto` centres it, since `Card.Content` is
				full width here where the docs' preview pane is not.
			-->
			<Carousel.Root class="mx-auto w-full max-w-xs">
				<Carousel.Content>
					{#each slides as n (n)}
						<!--
							`Carousel.Item` already carries `basis-full ps-4`, so one slide fills the
							frame and the 16px gap only shows once several are in view (the Sizes
							section below). The docs wrap each slide in a `p-1` so the nested card's
							ring is not clipped by the viewport's `overflow-hidden`; the placeholder
							used here has no ring, so that padding is dropped.
						-->
						<Carousel.Item>
							<div class="{slide} aspect-square">
								<span class="{number} text-4xl">{n}</span>
							</div>
						</Carousel.Item>
					{/each}
				</Carousel.Content>
				<Carousel.Previous class={control} />
				<Carousel.Next class={control} />
			</Carousel.Root>
		</Card.Content>
	</Card.Root>

	<DocSection title="Sizes">
		{#snippet blurb()}
			Adjust item dimensions via the <code class="text-[87.5%] text-primary">basis</code> utility
			class applied to <code class="text-[87.5%] text-primary">Carousel.Item</code>.
		{/snippet}
		<Card.Root>
			<Card.Content class={horizontalFrame}>
				<!--
					`align: "start"` snaps the first visible slide to the leading edge instead of
					centring the group, which is what makes a partial third slide read as "there is
					more" rather than as a cropping accident.
				-->
				<Carousel.Root opts={{ align: "start" }} class="mx-auto w-full max-w-sm">
					<Carousel.Content>
						{#each slides as n (n)}
							<!--
								The classic carousel cannot express this at all: `.carousel-item` is
								`width: 100%; float: left; margin-right: -100%`, one slide per view by
								construction. The breakpoints are Tailwind's 768px/1024px against
								the classic 768px/992px — identical at `md`, 32px later at `lg`.
							-->
							<Carousel.Item class="md:basis-1/2 lg:basis-1/3">
								<div class="{slide} aspect-square">
									<span class="{number} text-3xl">{n}</span>
								</div>
							</Carousel.Item>
						{/each}
					</Carousel.Content>
					<Carousel.Previous class={control} />
					<Carousel.Next class={control} />
				</Carousel.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Spacing">
		{#snippet blurb()}
			To set the spacing between the items, use a
			<code class="text-[87.5%] text-primary">ps-[VALUE]</code> utility on
			<code class="text-[87.5%] text-primary">Carousel.Item</code> and a negative
			<code class="text-[87.5%] text-primary">-ms-[VALUE]</code> on
			<code class="text-[87.5%] text-primary">Carousel.Content</code>.
		{/snippet}
		<Card.Root>
			<Card.Content class={horizontalFrame}>
				<!--
					THE ONE PLACE THIS PAGE PICKS A CLASSIC-THEME NUMBER OVER THE DOCS'. The docs demonstrate
					the mechanism with `-ms-1` / `ps-1` (4px), an arbitrary value chosen to look
					different from the 16px default. The classic theme does have a number for the gap between
					adjacent tiles — `grid-gutter-width: 1.5rem` (24px), the same value as `spacer`
					and as `card-spacer-x` — so the demo uses that instead: `-ms-6` / `ps-6`.

					The pair has to stay matched. `ps-6` pads every slide, including the first, and the
					negative margin on the container pulls that first slide's padding back off the
					leading edge so the row still starts flush.
				-->
				<Carousel.Root class="mx-auto w-full max-w-sm">
					<Carousel.Content class="-ms-6">
						{#each slides as n (n)}
							<Carousel.Item class="ps-6 md:basis-1/2 lg:basis-1/3">
								<div class="{slide} aspect-square">
									<span class="{number} text-2xl">{n}</span>
								</div>
							</Carousel.Item>
						{/each}
					</Carousel.Content>
					<Carousel.Previous class={control} />
					<Carousel.Next class={control} />
				</Carousel.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Orientation">
		{#snippet blurb()}
			Use the <code class="text-[87.5%] text-primary">orientation</code> prop to set the orientation of
			the carousel.
		{/snippet}
		<Card.Root>
			<Card.Content class={verticalFrame}>
				<!--
					`orientation="vertical"` switches Embla's axis to `y` and flips every piece the
					component owns: the container becomes `-mt-4 flex-col`, the items `pt-4`, and the
					two controls move to `-top-12` / `-bottom-12` with a 90° rotation. The classic framework has no
					vertical carousel — `.carousel-item` translates on X only.

					`h-[200px]` is the docs' own height, and it is required: the viewport is a scroll
					container with no intrinsic size on the scroll axis. The docs also tighten the gap
					to `pt-1` here; that is left at the component's `pt-4`, since the Spacing section
					above is where the gap is the subject.
				-->
				<Carousel.Root
					opts={{ align: "start" }}
					orientation="vertical"
					class="mx-auto w-full max-w-xs"
				>
					<Carousel.Content class="h-[200px]">
						{#each slides as n (n)}
							<Carousel.Item class="md:basis-1/2">
								<div class={slide}>
									<span class="{number} text-3xl">{n}</span>
								</div>
							</Carousel.Item>
						{/each}
					</Carousel.Content>
					<Carousel.Previous class={control} />
					<Carousel.Next class={control} />
				</Carousel.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Options">
		{#snippet blurb()}
			Pass configuration to Embla through the
			<code class="text-[87.5%] text-primary">opts</code> prop.
		{/snippet}
		<Card.Root>
			<Card.Content class={horizontalFrame}>
				<!--
					`loop: true` wraps the last slide back to the first, which is the classic
					`data-bs-wrap` — the one carousel option the two libraries genuinely share, and the
					only one classic defaults to `true`. Its visible effect here is that neither
					control ever disables: `Carousel.Previous` and `Carousel.Next` read
					`canScrollPrev` / `canScrollNext` off the Embla instance, and with the loop closed
					both stay true forever.
				-->
				<Carousel.Root opts={{ align: "start", loop: true }} class="mx-auto w-full max-w-sm">
					<Carousel.Content>
						{#each slides as n (n)}
							<Carousel.Item class="md:basis-1/2 lg:basis-1/3">
								<div class="{slide} aspect-square">
									<span class="{number} text-3xl">{n}</span>
								</div>
							</Carousel.Item>
						{/each}
					</Carousel.Content>
					<Carousel.Previous class={control} />
					<Carousel.Next class={control} />
				</Carousel.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API">
		{#snippet blurb()}
			Use the <code class="text-[87.5%] text-primary">setApi</code> callback to hold onto the Embla instance
			and read its state.
		{/snippet}
		<Card.Root>
			<Card.Content class={horizontalFrame}>
				<Carousel.Root setApi={(emblaApi) => (api = emblaApi)} class="mx-auto w-full max-w-xs">
					<Carousel.Content>
						{#each slides as n (n)}
							<Carousel.Item>
								<div class="{slide} aspect-square">
									<span class="{number} text-4xl">{n}</span>
								</div>
							</Carousel.Item>
						{/each}
					</Carousel.Content>
					<Carousel.Previous class={control} />
					<Carousel.Next class={control} />
				</Carousel.Root>
				<!--
					`text-xs`, not the docs' `text-sm`. In stock shadcn `text-sm` is 14px and reads as
					a caption under 16px body text; `app.css` remaps `--text-sm` to
					`font-size-base` (15px), so the caption would come out the same size as the body.
					`--text-xs` is `font-size-sm` (13px), which is what `.small` resolves to in
					the classic theme and what the docs' intent actually asks for.

					`pt-6` is `card-spacer-y`, replacing the docs' `py-2`; the bottom half is already
					supplied by the card's own padding.
				-->
				<div class="pt-6 text-center text-xs text-muted-foreground">
					Slide {current} of {count}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Carousel with centered slide alignment">
		{#snippet blurb()}
			<code class="text-[87.5%] text-primary">align: "center"</code> keeps the active slide in the middle
			of the viewport, with its neighbours peeking in from both edges.
		{/snippet}
		<Card.Root>
			<Card.Content class={horizontalFrame}>
				<!--
					demo 6. `basis-[70%]` is the whole trick: a slide narrower than the
					viewport leaves 15% on each side for the previous and next slides to show
					through, and `align: "center"` is what parks the gap symmetrically. `loop: true`
					closes the ring so the first and last slides get neighbours too — without it
					they would sit off-centre against an empty edge.
				-->
				<Carousel.Root opts={{ align: "center", loop: true }} class="mx-auto w-full max-w-xs">
					<Carousel.Content>
						{#each slides as n (n)}
							<Carousel.Item class="basis-[70%]">
								<div class="{slide} aspect-video">
									<span class="{number} text-3xl">{n}</span>
								</div>
							</Carousel.Item>
						{/each}
					</Carousel.Content>
					<Carousel.Previous class={control} />
					<Carousel.Next class={control} />
				</Carousel.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Carousel with images and overlays">
		{#snippet blurb()}
			Media slides carrying their own caption — a gradient scrim keeps the text legible over
			whatever the slide shows.
		{/snippet}
		<Card.Root>
			<Card.Content class={horizontalFrame}>
				<!--
					demo 8. The classic form layers white text over a photo behind a `from-black/80`
					gradient; here the photo is the numbered placeholder surface and the overlay
					takes the scrim/text pair from the script block. A hover zoom
					(`group-hover/card:scale-105` on the image) would have no image to act on, so
					there is none.
				-->
				<Carousel.Root class="mx-auto w-full max-w-md">
					<Carousel.Content>
						{#each slides as n (n)}
							<Carousel.Item>
								<div class="relative overflow-hidden rounded-lg">
									<div class="{slide} aspect-video">
										<span class="{number} text-4xl">{n}</span>
									</div>
									<div class={overlayScrim}></div>
									<div class="absolute inset-0 flex flex-col justify-end p-6">
										<h3 class={overlayTitle}>Slide {n}</h3>
										<p class={overlayText}>
											Beautiful landscape description for slide {n}.
										</p>
									</div>
								</div>
							</Carousel.Item>
						{/each}
					</Carousel.Content>
					<Carousel.Previous class={control} />
					<Carousel.Next class={control} />
				</Carousel.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Carousel with thumbnail navigation">
		{#snippet blurb()}
			Two synced carousels: the strip below both reflects and drives the main view.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 9. No Previous/Next here — the strip IS the navigation, so the
					card keeps its own padding instead of `horizontalFrame`. The strip's options
					are the interesting part: `containScroll: "keepSnaps"` stops Embla trimming
					snap points that would overscroll (every thumb stays individually reachable by
					`scrollTo`), and `dragFree` lets the strip glide instead of snapping, which is
					how a filmstrip is expected to feel.
				-->
				<div class="mx-auto flex w-full max-w-md flex-col gap-3">
					<Carousel.Root setApi={(emblaApi) => (thumbsMainApi = emblaApi)} class="w-full">
						<Carousel.Content>
							{#each thumbnailSlides as n (n)}
								<Carousel.Item>
									<div class="{slide} aspect-video">
										<span class="{number} text-3xl">{n}</span>
									</div>
								</Carousel.Item>
							{/each}
						</Carousel.Content>
					</Carousel.Root>

					<Carousel.Root
						setApi={(emblaApi) => (thumbsThumbApi = emblaApi)}
						opts={{ containScroll: "keepSnaps", dragFree: true }}
						class="w-full"
					>
						<Carousel.Content class="-ms-2">
							{#each thumbnailSlides as n, index (n)}
								<Carousel.Item class="basis-1/5 ps-2 sm:basis-1/6">
									<!--
										A real button — never a click handler on the item div — keeps the
										thumbs keyboard-reachable. The selected state is a
										`border-primary` frame plus full opacity; the rest sit dimmed
										at 40%, rising on hover as an affordance.
									-->
									<button
										type="button"
										class="block w-full cursor-pointer overflow-hidden rounded-lg border-2 transition-all {index ===
										thumbsSelectedIndex
											? 'border-primary opacity-100'
											: 'border-transparent opacity-40 hover:opacity-70'}"
										aria-label="Go to slide {n}"
										onclick={() => thumbsMainApi?.scrollTo(index)}
									>
										<div class="flex aspect-square items-center justify-center bg-background">
											<span class="{number} text-xs">{n}</span>
										</div>
									</button>
								</Carousel.Item>
							{/each}
						</Carousel.Content>
					</Carousel.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Carousel with overlay thumbnail navigation">
		{#snippet blurb()}
			The same synced strip, laid over the bottom of the main view instead of below it.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 10. The strip floats inside the main frame on a bottom-up scrim,
					so everything in it must read against that scrim rather than against the card:
					The white thumb borders become `background` (the scrim itself moves from
					`black/60` to `foreground/60`, same substitution as the overlay captions).
					The outer `overflow-hidden rounded-lg` clips both layers to one media shape.
				-->
				<div class="relative mx-auto w-full max-w-2xl overflow-hidden rounded-lg">
					<Carousel.Root setApi={(emblaApi) => (overlayMainApi = emblaApi)} class="w-full">
						<Carousel.Content>
							{#each thumbnailSlides as n (n)}
								<Carousel.Item>
									<!--
										The `slide` surface minus its `rounded-lg`: the outer frame
										owns the media shape here, and a rounded slide inside a
										rounded clip would double the corners at the edges.
									-->
									<div class="flex aspect-video items-center justify-center bg-background p-6">
										<span class="{number} text-4xl">{n}</span>
									</div>
								</Carousel.Item>
							{/each}
						</Carousel.Content>
					</Carousel.Root>

					<div
						class="absolute inset-x-0 bottom-0 bg-linear-to-t from-foreground/60 to-transparent p-4"
					>
						<div class="relative mx-auto w-full max-w-md">
							<Carousel.Root
								setApi={(emblaApi) => (overlayThumbApi = emblaApi)}
								opts={{ containScroll: "keepSnaps", dragFree: true }}
								class="w-full"
							>
								<Carousel.Content class="-ms-2">
									{#each thumbnailSlides as n, index (n)}
										<Carousel.Item class="basis-1/4 ps-2 sm:basis-1/8">
											<button
												type="button"
												class="block w-full cursor-pointer overflow-hidden rounded-md border-2 transition-all duration-300 {index ===
												overlaySelectedIndex
													? 'border-background opacity-100 ring-2 ring-foreground/20'
													: 'border-background/40 opacity-50 hover:opacity-80'}"
												aria-label="Go to slide {n}"
												onclick={() => overlayMainApi?.scrollTo(index)}
											>
												<div class="flex aspect-square items-center justify-center bg-background">
													<span class="{number} text-xs">{n}</span>
												</div>
											</button>
										</Carousel.Item>
									{/each}
								</Carousel.Content>
							</Carousel.Root>
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Carousel with dots navigation and content overlays">
		{#snippet blurb()}
			One dot per snap point, read from the same Embla instance the API section holds — the active
			one stretches, the rest stay clickable.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 11. The dots row lives inside `Carousel.Root` so it belongs to
					the region landmark, and each dot is a real button with an `aria-label` —
					that part is deliberate and stays. The width change
					(`w-4` active / `w-2` idle) plus `transition-all` is what animates the active
					dot stretching as the selection moves.
				-->
				<Carousel.Root setApi={(emblaApi) => (dotsApi = emblaApi)} class="mx-auto w-full max-w-xs">
					<Carousel.Content>
						{#each slides as n (n)}
							<Carousel.Item>
								<div class="relative overflow-hidden rounded-lg">
									<div class="{slide} aspect-square">
										<span class="{number} text-4xl">{n}</span>
									</div>
									<div class={overlayScrim}></div>
									<div class="absolute inset-0 top-auto flex flex-col justify-end p-4">
										<h3 class={overlayTitle}>Slide {n}</h3>
										<p class={overlayText}>Feature description for slide {n}.</p>
									</div>
								</div>
							</Carousel.Item>
						{/each}
					</Carousel.Content>

					<div class="flex justify-center gap-2 py-3">
						{#each slides as n, index (n)}
							{#if index < dotsCount}
								<button
									type="button"
									class="h-2 cursor-pointer rounded-full transition-all duration-500 ease-in-out {index ===
									dotsCurrent
										? 'w-4 bg-primary opacity-100'
										: 'w-2 bg-muted-foreground opacity-30 hover:opacity-50'}"
									aria-label="Go to slide {n}"
									onclick={() => dotsApi?.scrollTo(index)}
								></button>
							{/if}
						{/each}
					</div>
				</Carousel.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
