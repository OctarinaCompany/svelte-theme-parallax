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

	type PropRow = { prop: string; type: string; default: string; description: string };

	const rootProps: PropRow[] = [
		{
			prop: "value",
			type: "number",
			default: "—",
			description:
				"Bindable; the divider position as a percentage of the track. Seeded from `defaultValue` on the first render when unbound or bound to `undefined`, then written each time a pointer or keyboard move lands on a new value — a move that resolves to the current value writes nothing. A value written from outside is adopted without firing `onValueChange`; the slider clamps its own copy to 0–100 but never writes that back, so a binding set to 150 stays 150 while `aria-valuenow` reads 100.",
		},
		{
			prop: "defaultValue",
			type: "number",
			default: "50",
			description:
				"Position the slider seeds itself with, clamped to 0–100. The seed fires whenever `value` is `undefined`, bound or not — a `bind:value` whose variable starts undefined starts here too. Read once, under `untrack`; changing it later has no effect.",
		},
		{
			prop: "onValueChange",
			type: "(value: number) => void",
			default: "—",
			description:
				"Called with the clamped value on every real change from the pointer or the keyboard. Never called when a move resolves to the current value (a drag held past the edge does not repeat `100`), and never echoed back for a value the owner wrote through `value`.",
		},
		{
			prop: "step",
			type: "number",
			default: "1",
			description:
				"Percentage points an arrow key moves the divider; Page keys and shifted arrows move ten times that. Keyboard only — pointer moves are continuous.",
		},
		{
			prop: "interaction",
			type: "'hover' | 'drag'",
			default: "'drag'",
			description:
				"`drag` captures the pointer on press, jumps the divider to the press point and follows until release or cancel. `hover` follows the unpressed pointer, ignores presses, and tells the handle to render no grip and no grab cursor.",
		},
		{
			prop: "orientation",
			type: "'horizontal' | 'vertical'",
			default: "'horizontal'",
			description:
				"Axis the divider travels along. Sets `aria-orientation` and `data-orientation`, picks which side each half clips, and flips the keyboard: `ArrowLeft` decreases when horizontal, `ArrowUp` when vertical; `PageUp` and `Home` decrease on both.",
		},
		{
			prop: "class",
			type: "ClassValue | null",
			default: "—",
			description:
				"Merged after the base classes. The root is `w-full` when horizontal and `h-full` when vertical and sets no other size, so the caller’s class supplies the height the halves fill.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the rendered element. Not populated in `child` mode.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"The halves, the handle and any labels, rendered inside the root element. Not rendered in `child` mode — the snippet passed to `child` decides what goes inside.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: CompareSliderChildProps }]>",
			default: "—",
			description:
				"Render the slider onto your own element. `props` carries the role, `aria-*` and `data-*` attributes, `tabindex`, the merged class and the five pointer and keyboard handlers; spread all of it or the slider stops working.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description:
				"Spread onto the element after the role, `aria-*` and `data-*` attributes and `tabindex`, so a caller’s own values win over them, and before `class` and the handlers, which they cannot replace. A caller’s `onpointerdown`, `onpointermove`, `onpointerup`, `onpointercancel` and `onkeydown` are called first; `event.preventDefault()` inside one skips the slider’s own handling of that event.",
		},
	];

	const beforeProps: PropRow[] = [
		{
			prop: "label",
			type: "string",
			default: "—",
			description:
				'Accessible name for this half, rendered as a `CompareSlider.Label` with `side="before"` and wired through `aria-labelledby`. Without it the panel is `aria-hidden`, since an unnamed picture announces nothing useful.',
		},
		{
			prop: "class",
			type: "ClassValue | null",
			default: "—",
			description:
				"Merged after the base classes, which pin the half to the full box (`absolute inset-0 h-full w-full`).",
		},
		{
			prop: "style",
			type: "string | null",
			default: "—",
			description:
				"Appended after the `clip-path` declaration the part writes, so a caller can add declarations without losing the clip.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"What this half shows, typically an `<img>` sized to the box; any content works. Rendered before the caption.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description:
				'Spread onto the element after `role="img"`, the `aria-*` and `data-*` attributes, so a caller’s own values win over them, and before `class` and `style`, which they cannot replace.',
		},
	];

	const afterProps: PropRow[] = [
		{
			prop: "label",
			type: "string",
			default: "—",
			description:
				'Accessible name for this half, rendered as a `CompareSlider.Label` with `side="after"` and wired through `aria-labelledby`. Without it the panel is `aria-hidden`, for the same reason as its sibling.',
		},
		{
			prop: "class",
			type: "ClassValue | null",
			default: "—",
			description:
				"Merged after the base classes, which pin the half to the full box (`absolute inset-0 h-full w-full`).",
		},
		{
			prop: "style",
			type: "string | null",
			default: "—",
			description:
				"Appended after the `clip-path` declaration the part writes, so a caller can add declarations without losing the clip.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				"What this half shows, typically an `<img>` sized to the box; any content works. Rendered before the caption.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description:
				'Spread onto the element after `role="img"`, the `aria-*` and `data-*` attributes, so a caller’s own values win over them, and before `class` and `style`, which they cannot replace.',
		},
	];

	const handleProps: PropRow[] = [
		{
			prop: "class",
			type: "ClassValue | null",
			default: "—",
			description:
				"Merged after the base classes, which centre the handle on the divider and, in `drag` mode only, add the grab cursor.",
		},
		{
			prop: "style",
			type: "string | null",
			default: "—",
			description:
				"Appended after the `left` (or `top`, when vertical) percentage the part writes to sit on the divider.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description:
				'Replaces the default bar and grip entirely. Left out, the part renders a 4px `bg-background` bar and, under `interaction="drag"` only, a 44px round grip with chevrons pointing along the axis.',
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description:
				'Spread onto the element after `role="presentation"`, `aria-hidden` and the `data-*` attributes, so a caller’s own values win over them, and before `class` and `style`, which they cannot replace.',
		},
	];

	const labelProps: PropRow[] = [
		{
			prop: "side",
			type: "'before' | 'after'",
			default: "'before'",
			description:
				"Which half this names; also written as `data-side`. Picks the corner: `before` parks top-left on either axis, `after` parks top-right when horizontal and bottom-left when vertical, so the two labels of one comparison never collide.",
		},
		{
			prop: "class",
			type: "ClassValue | null",
			default: "—",
			description: "Merged after the chip’s base classes and the corner placement.",
		},
		{
			prop: "ref",
			type: "HTMLElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The caption. `Before` and `After` pass their `label` string here.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description:
				"Spread onto the element. `Before` and `After` pass the `id` that their `aria-labelledby` points at.",
		},
	];

	const keyboard = [
		{
			keys: "Tab",
			description:
				'Focuses the root — the whole surface is the one tab stop. The handle is `role="presentation"` and never takes focus.',
		},
		{
			keys: "ArrowLeft / ArrowRight",
			description:
				"Moves the divider by `step` percentage points: left decreases, right increases, on a horizontal slider. On a vertical one both increase.",
		},
		{
			keys: "ArrowUp / ArrowDown",
			description:
				"Moves by `step`: up decreases, down increases, on a vertical slider. On a horizontal one both increase.",
		},
		{
			keys: "Shift + Arrow",
			description: "The same arrow, ten steps at a time.",
		},
		{
			keys: "PageUp / PageDown",
			description:
				"Decreases / increases by ten steps on either axis, with or without Shift. `PageUp` goes toward `0` even when vertical, the way a page key reads against a scrollbar.",
		},
		{ keys: "Home / End", description: "Jumps to `0` / `100`." },
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

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">CompareSlider.Root</h3>
			<p class="text-sm text-muted-foreground">
				The slider itself: a <code>role="slider"</code> <code>&lt;div&gt;</code> that owns the value,
				the single tab stop and the keyboard, and publishes the position, orientation and interaction
				to the parts through context.
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

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">CompareSlider.Before</h3>
			<p class="text-sm text-muted-foreground">
				The half revealed on the near side of the divider — left, or top when vertical. A
				<code>role="img"</code> <code>&lt;div&gt;</code> at the full size of the root, clipped with
				<code>inset()</code> rather than resized so the two pictures stay registered. Throws when
				used outside <code>CompareSlider.Root</code>.
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
							{#each beforeProps as row (row.prop)}
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

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">CompareSlider.After</h3>
			<p class="text-sm text-muted-foreground">
				The half revealed on the far side of the divider — right, or bottom when vertical. The
				mirror of <code>Before</code>: the same full-size <code>role="img"</code>
				<code>&lt;div&gt;</code> with the complementary clip. Throws when used outside
				<code>CompareSlider.Root</code>.
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
							{#each afterProps as row (row.prop)}
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

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">CompareSlider.Handle</h3>
			<p class="text-sm text-muted-foreground">
				The divider and its grip: a <code>role="presentation"</code>, <code>aria-hidden</code>
				<code>&lt;div&gt;</code> positioned at the current value. It is the picture of the root’s
				state, not a second control, so it is never focusable. Throws when used outside
				<code>CompareSlider.Root</code>.
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
							{#each handleProps as row (row.prop)}
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

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">CompareSlider.Label</h3>
			<p class="text-sm text-muted-foreground">
				A caption chip naming one half. <code>Before</code> and <code>After</code> render it for you
				when given a <code>label</code> string; use it directly for anything richer than a word. It
				reads the orientation from context to pick its corner, so it throws when used outside
				<code>CompareSlider.Root</code>.
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
							{#each labelProps as row (row.prop)}
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

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Keyboard interactions</h3>
			<p class="text-sm text-muted-foreground">
				The keyboard map of the root, the one tab stop. Every move clamps to 0–100 and a handled key
				is <code>preventDefault</code>ed; a move that lands on the current value writes nothing and
				does not fire <code>onValueChange</code>. A caller’s <code>onkeydown</code> runs first, and
				calling <code>preventDefault()</code> there skips the map for that key.
			</p>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Key</Table.Head>
								<Table.Head>Description</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each keyboard as row (row.keys)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.keys}</Table.Cell>
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
