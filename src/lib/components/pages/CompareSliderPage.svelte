<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as CompareSlider from "$lib/components/ui/compare-slider/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { Slider } from "$lib/components/ui/slider/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import { SCENE_AFTER_SRC, SCENE_BEFORE_SRC } from "./compare-slider-sample-scene.js";

	/**
	 * The Compare slider component page.
	 *
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART — the classic framework has no before/after control, and neither does the
	 * theme. What little surface it owns is the focus ring (`--ring`), the handle's bar and grip
	 * (`--background`, so they read against any picture) and the labels' `--background/80` chip.
	 *
	 * NO REMOTE IMAGES: upstream loads the same stock photographs twice, once with
	 * `&sat=-100`. The pair here is drawn instead — see `compare-slider-sample-scene.ts`.
	 */

	let controlled = $state(30);

	const rootProps = [
		{
			prop: "value",
			type: "number",
			default: "50",
			description: "Divider position as a percentage. Bindable.",
		},
		{
			prop: "defaultValue",
			type: "number",
			default: "50",
			description: "Starting position when `value` is not bound.",
		},
		{
			prop: "onValueChange",
			type: "(value: number) => void",
			default: "—",
			description: "Fired on every real change, never on a set that resolves to the current value.",
		},
		{
			prop: "step",
			type: "number",
			default: "1",
			description:
				"Percentage points per arrow key; ten times that for Page keys and shifted arrows.",
		},
		{
			prop: "interaction",
			type: '"drag" | "hover"',
			default: '"drag"',
			description:
				"`drag` moves the divider only while the pointer is held; `hover` follows it unpressed and renders no grip.",
		},
		{
			prop: "orientation",
			type: '"horizontal" | "vertical"',
			default: '"horizontal"',
			description: "Which axis the divider travels along.",
		},
	];

	const frame = "h-[400px] overflow-hidden rounded-lg border border-border";
</script>

<DocPage title="Compare slider">
	{#snippet subtitle()}
		Two versions of one picture, and a divider that wipes between them.
	{/snippet}

	<DocSection title="Usage">
		{#snippet blurb()}
			The whole surface is one tab stop: focus it and the arrow keys move the divider, Home and End
			send it to either edge, and Page keys or a held shift move ten steps at a time. The grip is
			deliberately not focusable — it is the picture of the value, not a second control.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<CompareSlider.Root defaultValue={50} class={frame}>
					<CompareSlider.Before>
						<img src={SCENE_BEFORE_SRC} alt="" class="size-full object-cover" />
					</CompareSlider.Before>
					<CompareSlider.After>
						<img src={SCENE_AFTER_SRC} alt="" class="size-full object-cover" />
					</CompareSlider.After>
					<CompareSlider.Handle />
				</CompareSlider.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Labels">
		{#snippet blurb()}
			A `label` on either half names it, and is what makes the two panels announce as anything at
			all — without one they are `aria-hidden`, since two unnamed images of the same subject tell a
			screen reader nothing the sighted view does not already carry.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<CompareSlider.Root defaultValue={45} class={frame}>
					<CompareSlider.Before label="Original">
						<img src={SCENE_BEFORE_SRC} alt="" class="size-full object-cover" />
					</CompareSlider.Before>
					<CompareSlider.After label="Graded">
						<img src={SCENE_AFTER_SRC} alt="" class="size-full object-cover" />
					</CompareSlider.After>
					<CompareSlider.Handle />
				</CompareSlider.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Vertical">
		{#snippet blurb()}
			The divider travels top to bottom, the labels stack down the left edge, and the grip's
			chevrons turn with it. Arrow up decreases, matching the axis rather than the reading order.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<CompareSlider.Root defaultValue={50} orientation="vertical" class="{frame} w-full">
					<CompareSlider.Before label="Original">
						<img src={SCENE_BEFORE_SRC} alt="" class="size-full object-cover" />
					</CompareSlider.Before>
					<CompareSlider.After label="Graded">
						<img src={SCENE_AFTER_SRC} alt="" class="size-full object-cover" />
					</CompareSlider.After>
					<CompareSlider.Handle />
				</CompareSlider.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Hover">
		{#snippet blurb()}
			`interaction="hover"` follows the pointer without a press, and drops the grip — there is
			nothing to grab, so advertising a handle would promise an affordance that does not exist. The
			bar stays, because the divider still has to be visible.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<CompareSlider.Root defaultValue={50} interaction="hover" class={frame}>
					<CompareSlider.Before>
						<img src={SCENE_BEFORE_SRC} alt="" class="size-full object-cover" />
					</CompareSlider.Before>
					<CompareSlider.After>
						<img src={SCENE_AFTER_SRC} alt="" class="size-full object-cover" />
					</CompareSlider.After>
					<CompareSlider.Handle />
				</CompareSlider.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Controlled">
		{#snippet blurb()}
			`value` is bindable, so a second control can drive the same divider. Both write to one number:
			move the slider below, or drag the divider, and the other follows.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-col gap-4">
				<CompareSlider.Root bind:value={controlled} class={frame}>
					<CompareSlider.Before label="Original">
						<img src={SCENE_BEFORE_SRC} alt="" class="size-full object-cover" />
					</CompareSlider.Before>
					<CompareSlider.After label="Graded">
						<img src={SCENE_AFTER_SRC} alt="" class="size-full object-cover" />
					</CompareSlider.After>
					<CompareSlider.Handle />
				</CompareSlider.Root>

				<div class="flex items-center gap-4">
					<Slider
						type="single"
						bind:value={controlled}
						min={0}
						max={100}
						step={1}
						class="flex-1"
						aria-label="Divider position"
					/>
					<span class="w-12 text-end font-mono text-sm tabular-nums">
						{Math.round(controlled)}%
					</span>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Custom handle">
		{#snippet blurb()}
			Children on the handle replace the bar and grip entirely, and the halves take arbitrary
			content — they are not restricted to images.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<CompareSlider.Root
					defaultValue={50}
					class="h-[300px] overflow-hidden rounded-lg border border-border"
				>
					<CompareSlider.Before
						class="flex size-full items-center justify-center bg-muted text-center"
					>
						<span class="text-2xl font-bold">Kickflip</span>
					</CompareSlider.Before>
					<CompareSlider.After
						class="flex size-full items-center justify-center bg-primary text-center text-primary-foreground"
					>
						<span class="text-2xl font-bold">Heelflip</span>
					</CompareSlider.After>
					<CompareSlider.Handle>
						<div
							class="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
						>
							<span class="text-xs font-bold">VS</span>
						</div>
					</CompareSlider.Handle>
				</CompareSlider.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Root props">
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
								<Table.Cell class="font-mono text-xs">{row.prop}</Table.Cell>
								<Table.Cell class="font-mono text-xs text-muted-foreground">{row.type}</Table.Cell>
								<Table.Cell class="font-mono text-xs text-muted-foreground"
									>{row.default}</Table.Cell
								>
								<Table.Cell class="text-sm">{row.description}</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
