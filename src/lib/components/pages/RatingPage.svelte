<script lang="ts">
	import { toast } from "svelte-sonner";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Progress } from "$lib/components/ui/progress/index.js";
	import { Rating } from "$lib/components/ui/rating/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import { Textarea } from "$lib/components/ui/textarea/index.js";
	import { cn } from "$lib/utils.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as Table from "$lib/components/ui/table/index.js";

	/**
	 * The Rating component page — its nine examples in the order that page
	 * gives them.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. The classic framework has no rating control and the classic theme adds none, so the
	 * component is the house Rating throughout: `$lib/components/ui/rating/` records how it was built
	 * (most notably that editable mode rides on the bits-ui `RatingGroup` primitive, which gives
	 * it the keyboard and screen-reader story upstream's mouse-only handlers lack).
	 *
	 * TWO THEME SUBSTITUTIONS, both the repository's standing rules rather than opinions about
	 * taste:
	 *
	 * 1. NO RAW PALETTE COLOURS. Upstream paints the stars `fill-yellow-400` and the review
	 *    histogram's bars to match. The component already maps the stars onto `--warning`, which
	 *    IS the classic theme's yellow, and the histogram below does the same for its indicator.
	 *
	 * 2. NO PHOTOGRAPHS. Nothing here needs one, so nothing here fetches one — same as the other
	 *    demo-sourced pages.
	 */

	/* Demo 4 — the rating the toast reports on. */
	let editableRating = $state(0);

	/**
	 * Upstream passes the literal string `"Rated {rating} out of 5"` as the toast title and only
	 * interpolates in the description, which reads as a template that never got substituted. Both
	 * lines are interpolated here.
	 */
	function handleEditableRatingChange(rating: number) {
		toast.success(`Rated ${rating} out of 5`, {
			description: "Thanks — your rating has been recorded.",
		});
	}

	/* Demo 6 — the review histogram. */
	const reviewDistribution = [
		{ stars: 5, count: 124, percentage: 62 },
		{ stars: 4, count: 45, percentage: 22 },
		{ stars: 3, count: 18, percentage: 9 },
		{ stars: 2, count: 8, percentage: 4 },
		{ stars: 1, count: 5, percentage: 3 },
	];

	/* Demo 7 — the half-star rating and its read-out. */
	let halfStarRating = $state(3.5);

	/* Demo 8 — the emoji reaction scale. */
	const reactionEmojis = [
		{ value: 1, emoji: "😞", label: "Terrible" },
		{ value: 2, emoji: "😕", label: "Bad" },
		{ value: 3, emoji: "😐", label: "Okay" },
		{ value: 4, emoji: "😊", label: "Good" },
		{ value: 5, emoji: "🤩", label: "Amazing" },
	];
	let selectedReaction = $state<number | null>(null);
	const selectedReactionLabel = $derived(
		reactionEmojis.find((item) => item.value === selectedReaction)?.label,
	);

	/* Demo 9 — the review form. */
	let reviewRating = $state(0);
	let reviewText = $state("");
	const reviewFeedback = $derived(
		reviewRating <= 2
			? "We're sorry to hear that"
			: reviewRating <= 3
				? "Thanks for your feedback"
				: "Glad you enjoyed it!",
	);

	/**
	 * The component's own surface, for the API reference at the foot of the page.
	 *
	 * A house component has no upstream page to defer to, so the props are written down here —
	 * read off `$lib/components/ui/rating/rating.svelte`, the only other place they exist.
	 */
	const ratingProps = [
		{
			prop: "rating",
			type: "number",
			default: "—",
			description:
				"The current value, and the only required prop. Bindable. Decimals fill a star partly — 4.6 fills 60% of the fifth.",
		},
		{
			prop: "onRatingChange",
			type: "(rating: number) => void",
			default: "—",
			description:
				"Fired with the next value after a real change, from a click or from the keyboard.",
		},
		{
			prop: "maxRating",
			type: "number",
			default: "5",
			description: "How many stars there are.",
		},
		{
			prop: "size",
			type: "'sm' | 'default' | 'lg'",
			default: "'default'",
			description: "Scales the gap, the stars and the read-out together.",
		},
		{
			prop: "showValue",
			type: "boolean",
			default: "false",
			description: "Render the numeric read-out beside the stars.",
		},
		{
			prop: "editable",
			type: "boolean",
			default: "false",
			description:
				"Turn the display into a control: a single-tab-stop slider with arrow, Home, End and digit input, hover preview, and click-to-clear on the first star. Left off, it is purely presentational and takes no focus.",
		},
		{
			prop: "allowHalf",
			type: "boolean",
			default: "false",
			description:
				"Snap clicks and hover to half stars. The halves it starts at are then the halves you can pick.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "Editable mode only: suppress every interaction and dim the control.",
		},
		{
			prop: "name",
			type: "string",
			default: "—",
			description:
				"Editable mode only: the name of the hidden input the value is submitted with. Omitted, no hidden input is rendered.",
		},
		{
			prop: "required",
			type: "boolean",
			default: "false",
			description: "Editable mode only: mark that hidden input required. Pair it with `name`.",
		},
		{
			prop: "aria-valuetext",
			type: "string",
			default: "'{value} out of {max}'",
			description: "The spoken value for the editable slider.",
		},
		{
			prop: "starClassName",
			type: "string",
			default: "—",
			description:
				"Class for the value span. The name is the primitive's and is kept as it is, so the surface matches what a reader will find upstream.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, so it overrides the size classes on the root.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the rendered root.",
		},
		{
			prop: "...restProps",
			type: "RatingGroup.RootProps",
			default: "—",
			description:
				"The rest of the bits-ui RatingGroup root surface, minus the props above which this component owns.",
		},
	];
</script>

<DocPage title="Rating">
	{#snippet subtitle()}
		A star rating that displays whole, half and fractional scores, and — when
		<code>editable</code>
		— collects one by mouse or keyboard.
	{/snippet}

	<DocSection title="Basic rating">
		<Card.Root>
			<Card.Content>
				<Rating rating={4} />
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Rating with decimal value">
		{#snippet blurb()}
			A fractional <code>rating</code> clips the last filled star to the matching percentage, so
			<code>3.5</code> is an exact half.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Rating rating={3.5} />
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Rating with show value">
		<Card.Root>
			<Card.Content>
				<Rating rating={4.5} showValue={true} />
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Rating with editable">
		{#snippet blurb()}
			<code>editable</code> turns the stars into a single-tab-stop slider: click a star, or focus the
			row and use the arrow, Home/End and digit keys.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Rating
					bind:rating={editableRating}
					editable={true}
					onRatingChange={handleEditableRatingChange}
					showValue={true}
				/>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Rating with size">
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col items-center gap-4">
					<Rating rating={4} size="sm" />
					<Rating rating={4} />
					<Rating rating={4} size="lg" />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Rating with review summary">
		{#snippet blurb()}
			The histogram's bars take <code>--warning</code>, the same token the stars fill with, in place
			of upstream's raw <code>bg-yellow-400</code>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="mx-auto flex w-full max-w-xs flex-col gap-4">
					<div class="flex flex-col items-center gap-2">
						<span class="text-3xl font-semibold">4.6</span>
						<Rating rating={4.6} size="sm" />
						<span class="text-xs text-muted-foreground">Based on 200 reviews</span>
					</div>
					<Separator />
					<div class="flex flex-col gap-2">
						{#each reviewDistribution as row (row.stars)}
							<div class="flex items-center gap-3 text-sm">
								<span class="w-3 text-right text-xs text-muted-foreground">{row.stars}</span>
								<Progress
									value={row.percentage}
									class="h-1.5 flex-1 **:data-[slot=progress-indicator]:bg-warning"
								/>
								<span class="w-7 text-right text-xs text-muted-foreground">{row.count}</span>
							</div>
						{/each}
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Interactive half-star rating">
		{#snippet blurb()}
			Upstream calls this example "half-star" but only ever commits whole stars; the house component
			exposes the primitive's own <code>allowHalf</code>, so the halves it starts at are also the
			halves you can pick.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="mx-auto flex w-full max-w-xs flex-col items-center gap-4">
					<Rating bind:rating={halfStarRating} editable allowHalf />
					<p class="text-sm text-muted-foreground">
						Your rating:
						<span class="font-semibold text-foreground">{halfStarRating.toFixed(1)}</span> / 5
					</p>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Emoji reaction rating">
		{#snippet blurb()}
			The same five-step scale without the stars — nothing here uses the Rating component, it is a
			row of buttons.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="mx-auto flex w-full max-w-xs flex-col items-center gap-3">
					<p class="text-sm font-medium">How was your experience?</p>
					<div class="flex gap-2">
						{#each reactionEmojis as item (item.value)}
							<button
								type="button"
								aria-label={item.label}
								aria-pressed={selectedReaction === item.value}
								onclick={() => (selectedReaction = item.value)}
								class={cn(
									"flex size-10 items-center justify-center rounded-lg border-2 text-2xl transition-all",
									selectedReaction === item.value
										? "scale-110 border-border bg-muted"
										: "border-transparent hover:bg-muted",
								)}
							>
								{item.emoji}
							</button>
						{/each}
					</div>
					{#if selectedReaction !== null}
						<p class="text-sm text-muted-foreground">{selectedReactionLabel}</p>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Rating with review text input">
		<Card.Root class="mx-auto w-full max-w-xs">
			<Card.Content class="flex flex-col gap-5">
				<div class="flex flex-col items-center gap-3">
					<h3 class="text-sm font-semibold">Write a Review</h3>
					<Rating bind:rating={reviewRating} editable />
					{#if reviewRating > 0}
						<p class="text-xs text-muted-foreground">{reviewFeedback}</p>
					{/if}
				</div>

				<div class="flex flex-col gap-2">
					<Label for="rating-review-text" class="text-sm">Your review</Label>
					<Textarea
						id="rating-review-text"
						bind:value={reviewText}
						placeholder="Tell us what you think..."
						rows={3}
					/>
				</div>

				<Button disabled={reviewRating === 0} size="sm" class="w-full">Submit Review</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Rating</h3>
			<p class="text-sm text-muted-foreground">
				One component in two modes. At rest it is a presentational row of stars; with
				<code>editable</code> it becomes a bits-ui RatingGroup, which is where the keyboard behaviour
				and the hidden input come from.
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
							{#each ratingProps as row (row.prop)}
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
	</DocSection>
</DocPage>
