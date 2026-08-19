<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Spinner } from "$lib/components/ui/spinner/index.js";
	import { TextGradient } from "$lib/components/ui/text-gradient/index.js";

	/**
	 * The Text gradient page.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART, and neither does the classic framework: a shimmer sweeping through type is
	 * not a 2019 dashboard idiom. It is the label beside a spinner while a model is thinking, and
	 * the whole reason to carry it is that this kit is used to build those surfaces now.
	 *
	 * WHY UTILITIES. The ladder's ninth rung asks whether a component reports system state, and
	 * this one is the near miss that makes the rung worth having: the sentence beside the spinner
	 * reports the state, and this component would shimmer the words "Payment received" just as
	 * happily. It has no content of its own and changes how the content it is given renders, which
	 * is the Utilities test, and it lands beside `swap`, `shake` and `marquee` — the three that
	 * animate whatever they are handed.
	 *
	 * THE SECTIONS ARE ORGANISED BY SUBJECT. A specimen page would show the effect six times — default, fast,
	 * large text, wide spread, with a spinner, inside a sentence — and the six are specimens of
	 * the gradient rather than of the component: the "large text" one is the default 22px band
	 * sweeping `text-2xl`, which is the case that has outgrown it, shown without saying so. Two
	 * facts drive everything below and neither is visible from a prop list:
	 *
	 *   THE BAND HAS A SIZE, and px is the wrong unit for it. Upstream's 44px band is 2.9em wide
	 *   at this theme's body size and 1.2em at `text-4xl` — the same ink, less than half the
	 *   relative width. The default here is `1.375em`, which is 2.75em wide at every size
	 *   (divergence D-01 in `text-gradient.svelte`), so `Text size` below is a ramp with one prop
	 *   untouched and the card under it is the same ramp with upstream's number.
	 *
	 *   The ramp skips `text-base`. `src/app.css` maps it to `font-size-base`, the same
	 *   0.9375rem as `text-sm`, so a row for each would have been two identical specimens
	 *   labelled differently.
	 *
	 *   THE SWEEP HAS NO SPEED, only a period. One pass crosses the element, so two labels given
	 *   the same `duration` finish together however far apart their widths are, and the long one
	 *   moves faster to do it. `Speed` shows that pair rather than asserting it.
	 *
	 * Nothing on this page is themed, because there is nothing to theme: the component contributes
	 * one `display` and two colours, both of them tokens the caller can replace.
	 */

	/**
	 * The size ramp. `spread` is untouched in every row — that is the demonstration — so the only
	 * variable is the font size the band is measured against.
	 */
	const sizes = [
		{ label: "text-xs", class: "text-xs" },
		{ label: "text-sm", class: "text-sm" },
		{ label: "text-lg", class: "text-lg" },
		{ label: "text-2xl", class: "text-2xl" },
		{ label: "text-4xl", class: "text-4xl" },
	] as const;

	/**
	 * The same ramp with upstream's px default, at the two sizes where the contrast is worth
	 * printing: the body size, where 22px and 1.375em are 6% apart and indistinguishable, and
	 * `text-4xl`, where they are 22px against 49.5px.
	 */
	const pixelSizes = [
		{ label: "text-sm", class: "text-sm" },
		{ label: "text-4xl", class: "text-4xl" },
	] as const;

	/** Three bands: a hairline, the default, and one wider than most of the words it sweeps. */
	const spreads = [
		{ label: 'spread="0.35em"', value: "0.35em" },
		{ label: "spread — default 1.375em", value: "1.375em" },
		{ label: 'spread="4em"', value: "4em" },
	] as const;

	/** One pass in just over half a second, in the default two, and in five. */
	const durations = [
		{ label: "duration={0.6}", value: 0.6 },
		{ label: "duration={2} — default", value: 2 },
		{ label: "duration={5}", value: 5 },
	] as const;

	/**
	 * The same duration over two very different widths. Both bands leave the left edge together
	 * and reach the right edge together, so the second is travelling several times faster.
	 */
	const widths = [
		{ label: "ten characters", text: "Loading..." },
		{
			label: "sixty characters",
			text: "Reticulating splines across the entire dataset, patiently...",
		},
	] as const;

	/**
	 * Three bands over the same muted base.
	 *
	 * The third is upstream's default (`var(--background)`, restated here as `var(--card)` because
	 * that is the surface these demos actually sit on) and it is the argument for not shipping it
	 * as ours: the band is a hole punched through the type, so it only reads while the type sits
	 * on exactly the ground the colour names. Move this line onto a Popover and the hole turns
	 * into a smear.
	 */
	const bands = [
		{ label: "highlightColor — default var(--foreground)", value: "var(--foreground)" },
		{ label: 'highlightColor="var(--primary)"', value: "var(--primary)" },
		{ label: 'highlightColor="var(--card)" — the surface it sits on', value: "var(--card)" },
	] as const;

	const rootProps = [
		{
			prop: "ref",
			type: "HTMLSpanElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "spread",
			type: "number | string",
			default: '"1.375em"',
			description:
				"How far the band reaches either side of its centre — half its width. A number is pixels, upstream's unit; a string is any CSS length, and an em is the one that keeps the band proportional to the type.",
		},
		{
			prop: "highlightColor",
			type: "string",
			default: '"var(--foreground)"',
			description:
				"The colour of the travelling band. Upstream defaults to var(--background), which reads only on the page ground; the strongest ink on the surface reads everywhere.",
		},
		{
			prop: "baseColor",
			type: "string",
			default: '"var(--muted-foreground)"',
			description:
				"The colour of the text the band travels through, and the colour the whole label falls back to when the effect is dropped.",
		},
		{
			prop: "duration",
			type: "number",
			default: "2",
			description:
				"Seconds for one pass. A period, not a speed: a pass crosses the element, so a wider label sweeps faster.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Merged over inline-block bg-clip-text text-transparent. Those three are utilities rather than component CSS precisely so this can evict them; the gradient itself cannot be evicted this way.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The text the band sweeps through.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLSpanElement>",
			default: "—",
			description:
				"Every other attribute and DOM handler is forwarded. A supplied style is composed after the component's own custom properties, so it wins.",
		},
	];

	const customProperties = [
		{
			property: "--text-gradient-spread",
			description: "Set from spread. Read twice, as calc(50% ± spread) on the band's stops.",
		},
		{
			property: "--text-gradient-highlight",
			description: "Set from highlightColor. The band's centre stop.",
		},
		{
			property: "--text-gradient-base",
			description: "Set from baseColor. The flat layer under the band, and the fallback colour.",
		},
		{
			property: "--text-gradient-duration",
			description: "Set from duration, in seconds.",
		},
	];

	const dataAttributes = [{ attribute: "[data-slot]", values: "text-gradient" }];
</script>

<DocPage title="Text gradient">
	{#snippet subtitle()}
		A highlight that sweeps through text — the label that says a machine is still working.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<!--
				The canonical use, and the one piece of wiring the component cannot do for itself: the
				shimmer carries no semantics at all — it is not announced, it does not survive
				`prefers-reduced-motion`, and it leaves nothing behind — so the busy state has to be
				said somewhere too. `role="status"` on the line is that, and the spinner beside it is
				`aria-hidden` so the region has one voice rather than two.
			-->
			<p role="status" class="flex items-center gap-2 text-sm">
				<Spinner aria-hidden="true" />
				<TextGradient>Thinking...</TextGradient>
			</p>
		</Card.Content>
	</Card.Root>

	<DocSection title="Text size">
		{#snippet blurb()}
			The band is a length, and the default is expressed in em, so it holds its proportion as the
			type grows. Nothing below sets spread.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-4">
					{#each sizes as size (size.label)}
						<div class="flex items-baseline gap-4">
							<code class="w-20 shrink-0 text-xs text-muted-foreground">{size.label}</code>
							<TextGradient class={size.class}>Analyzing data</TextGradient>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="A band measured in pixels">
		{#snippet blurb()}
			Upstream's default is 22px, and a px band is the same 44px wide whatever it sweeps. At the
			body size the two are within 6% of each other and nothing separates them; at text-4xl the
			fixed band is 44px against 99px, and the sweep reads as a flicker rather than a wave.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-6">
					{#each pixelSizes as size (size.label)}
						<div class="flex flex-col gap-2">
							<code class="text-xs text-muted-foreground">{size.label}</code>
							<div class="flex items-baseline gap-4">
								<span class="w-28 shrink-0 text-xs text-muted-foreground">spread={"{22}"}</span>
								<TextGradient class={size.class} spread={22}>Analyzing data</TextGradient>
							</div>
							<div class="flex items-baseline gap-4">
								<span class="w-28 shrink-0 text-xs text-muted-foreground">default</span>
								<TextGradient class={size.class}>Analyzing data</TextGradient>
							</div>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Spread">
		{#snippet blurb()}
			Half the band's width, either side of its centre. A number is pixels; a string is any CSS
			length.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-4">
					{#each spreads as item (item.label)}
						<div class="flex items-baseline gap-4">
							<code class="w-52 shrink-0 text-xs text-muted-foreground">{item.label}</code>
							<TextGradient class="text-xl" spread={item.value}>Generating response...</TextGradient
							>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Speed">
		{#snippet blurb()}
			duration is the time for one pass, and a pass is the element's own width. In the second card,
			one duration over two lengths: they start together, they finish together, and the long one is
			moving several times faster to manage it.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-4">
					{#each durations as item (item.label)}
						<div class="flex items-baseline gap-4">
							<code class="w-52 shrink-0 text-xs text-muted-foreground">{item.label}</code>
							<TextGradient class="text-xl" duration={item.value}
								>Generating response...</TextGradient
							>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
		<Card.Root class="mt-4">
			<Card.Content>
				<div class="flex flex-col gap-4">
					{#each widths as item (item.label)}
						<!--
							`items-start` is load-bearing, not alignment. A flex item is blockified — the
							component's own `inline-block` stops applying — and a column's default
							`align-items: stretch` then widens both of these to the card, which would make
							the two sweeps take the same path and this demo a lie. `items-start` gives each
							its content width back.
						-->
						<div class="flex flex-col items-start gap-1">
							<code class="text-xs text-muted-foreground">{item.label}</code>
							<TextGradient>{item.text}</TextGradient>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Colour">
		{#snippet blurb()}
			Two tokens: the band, and the text it travels through. The third row is upstream's own default
			— a hole punched through the type, which reads only while the colour names the exact ground
			the text is sitting on.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-4">
					{#each bands as band (band.label)}
						<!-- `items-start` for the reason the Speed card gives: a stretched item sweeps
						     the whole column rather than the words. -->
						<div class="flex flex-col items-start gap-1">
							<code class="text-xs text-muted-foreground">{band.label}</code>
							<TextGradient class="text-xl" highlightColor={band.value}>Thinking...</TextGradient>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Inside a sentence">
		{#snippet blurb()}
			The element is inline-block, so it sits on the text baseline but does not break across lines —
			shimmer a word or a short phrase, not a paragraph.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<p class="max-w-prose text-lg">
					I am <TextGradient class="text-lg" highlightColor="var(--primary)">thinking</TextGradient>
					about your question, and I will have an answer for you shortly.
				</p>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">TextGradient</h3>
			<p class="text-sm text-muted-foreground">
				The only part. There is no <code>child</code> snippet: the keyframes are scoped to the component,
				so the effect cannot be lent to an element the component does not itself render.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Prop</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Default</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each rootProps as row (row.prop)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.prop}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.type}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.default}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="mt-8 flex flex-col gap-3">
			<h3 class="text-base font-medium">Custom properties</h3>
			<p class="text-sm text-muted-foreground">
				The four props reach the stylesheet as custom properties on the element, which is what a
				scoped rule can be handed from an inline style. They are read, never declared, by the
				component's own CSS.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Property</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each customProperties as row (row.property)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.property}</Table.Cell>
									<Table.Cell>{row.description}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="mt-8 flex flex-col gap-3">
			<h3 class="text-base font-medium">Data attributes</h3>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Attribute</Table.Head>
								<Table.Head>Values</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each dataAttributes as row (row.attribute)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.attribute}</Table.Cell>
									<Table.Cell>{row.values}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="mt-8 flex flex-col gap-3">
			<h3 class="text-base font-medium">What the sweep is measured against</h3>
			<p class="text-sm text-muted-foreground">
				The band's path is the element's own box, not the text inside it, and the two part company
				the moment layout gets involved: a flex or grid child is blockified, so the component's
				<code>inline-block</code>
				stops applying, and a column's default
				<code>align-items: stretch</code>
				then widens it to the whole container. The words still paint where they are, but the band now
				crosses everything to their right as well — one long pass with a short bright moment in it. Both
				demo cards above that stack a label over a specimen carry
				<code>items-start</code> for exactly this reason.
			</p>
		</div>

		<div class="mt-8 flex flex-col gap-3">
			<h3 class="text-base font-medium">When the effect is dropped</h3>
			<p class="text-sm text-muted-foreground">
				The text is transparent and the colour you see is a background clipped to its shape, so
				anywhere the background does not paint, the label would be blank. Three conditions get the
				same answer instead — the gradient is removed and the text is painted in
				<code>baseColor</code>: a reader who asked for reduced motion, a forced-colours display, and
				the printed page. Upstream handles none of the three.
			</p>
		</div>
	</DocSection>
</DocPage>
