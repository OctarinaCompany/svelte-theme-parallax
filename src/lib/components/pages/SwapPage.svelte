<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as Swap from "$lib/components/ui/swap/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import CheckIcon from "@lucide/svelte/icons/check";
	import MoonIcon from "@lucide/svelte/icons/moon";
	import PauseIcon from "@lucide/svelte/icons/pause";
	import PlayIcon from "@lucide/svelte/icons/play";
	import SunIcon from "@lucide/svelte/icons/sun";
	import Volume2Icon from "@lucide/svelte/icons/volume-2";
	import VolumeXIcon from "@lucide/svelte/icons/volume-x";
	import XIcon from "@lucide/svelte/icons/x";

	/**
	 * The Swap component page.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART, and there is almost nothing to theme: Swap crossfades or rotates
	 * between two faces the caller supplies, so what it shows is never its own.
	 *
	 * The only surface it owns is the focus ring, which is the theme's `--ring`. Note also that
	 * it honours `prefers-reduced-motion` by dropping the animation rather than shortening it.
	 */

	let controlledSwapped = $state(false);

	const rootProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "swapped",
			type: "boolean | undefined",
			default: "undefined",
			description: "Bindable controlled state. Seeded once from `defaultSwapped`.",
		},
		{
			prop: "defaultSwapped",
			type: "boolean",
			default: "false",
			description: "Uncontrolled seed. Ignored once `swapped` is supplied.",
		},
		{
			prop: "onSwappedChange",
			type: "(swapped: boolean) => void",
			default: "undefined",
			description:
				"Fired with the next value on component-driven change only, not on parent-driven writes.",
		},
		{
			prop: "activationMode",
			type: "'click' | 'hover'",
			default: "'click'",
			description: "`click` toggles on click/Enter/Space. `hover` swaps on pointer enter/leave.",
		},
		{
			prop: "animation",
			type: "'fade' | 'rotate' | 'flip' | 'scale'",
			default: "'fade'",
			description: "Surfaced as `data-animation`; the faces react to it.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description: "Suppresses click, hover and keyboard activation.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, so it overrides the built-in classes.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The two faces, `Swap.On` and `Swap.Off`.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render onto your own element instead of the default `<div>`.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description:
				"Every other attribute and DOM handler is forwarded. Icon-only faces must supply an `aria-label` here.",
		},
	];

	const faceProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, so it overrides the built-in classes.",
		},
		{
			prop: "children",
			type: "Snippet",
			default: "—",
			description: "The face content, typically one icon.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props }]>",
			default: "—",
			description: "Render onto your own element instead of the default `<div>`.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description: "Every other attribute is forwarded.",
		},
	];

	const dataAttributes = [
		{ attribute: "[data-slot]", part: "Swap", values: "swap" },
		{ attribute: "[data-slot]", part: "Swap.On", values: "swap-on" },
		{ attribute: "[data-slot]", part: "Swap.Off", values: "swap-off" },
		{ attribute: "[data-state]", part: "all", values: "on | off" },
		{ attribute: "[data-animation]", part: "Swap", values: "fade | rotate | flip | scale" },
		{ attribute: "[data-disabled]", part: "Swap", values: "present when disabled" },
		{
			attribute: "[data-motion]",
			part: "Swap",
			values: '"reduce" when prefers-reduced-motion is requested',
		},
	];
</script>

<DocPage title="Swap">
	{#snippet subtitle()}
		A component that swaps between two states with click or hover activation modes.
	{/snippet}

	<DocSection title="Click to swap">
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col items-center gap-2">
					<span class="text-sm text-muted-foreground">Click to swap</span>
					<Swap.Root
						aria-label="Toggle theme"
						class="size-12 rounded-lg border bg-muted/50 hover:bg-muted"
					>
						<Swap.On><SunIcon class="size-6" /></Swap.On>
						<Swap.Off><MoonIcon class="size-6" /></Swap.Off>
					</Swap.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Hover to swap">
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col items-center gap-2">
					<span class="text-sm text-muted-foreground">Hover to swap</span>
					<Swap.Root
						activationMode="hover"
						aria-label="Toggle mute"
						class="size-12 rounded-lg border bg-muted/50"
					>
						<Swap.On><Volume2Icon class="size-6" /></Swap.On>
						<Swap.Off><VolumeXIcon class="size-6" /></Swap.Off>
					</Swap.Root>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Animations">
		<Card.Root>
			<Card.Content>
				<div class="grid grid-cols-2 gap-6 md:grid-cols-4">
					<div class="flex flex-col items-center gap-3">
						<Swap.Root
							animation="fade"
							aria-label="Toggle fade demo"
							class="size-12 rounded-lg border bg-muted/50"
						>
							<Swap.On><CheckIcon class="size-5" /></Swap.On>
							<Swap.Off><XIcon class="size-5" /></Swap.Off>
						</Swap.Root>
						<span class="text-center text-sm text-muted-foreground">Fade</span>
					</div>

					<div class="flex flex-col items-center gap-3">
						<Swap.Root
							animation="rotate"
							aria-label="Toggle rotate demo"
							class="size-12 rounded-lg border bg-muted/50"
						>
							<Swap.On><SunIcon class="size-5" /></Swap.On>
							<Swap.Off><MoonIcon class="size-5" /></Swap.Off>
						</Swap.Root>
						<span class="text-center text-sm text-muted-foreground">Rotate</span>
					</div>

					<div class="flex flex-col items-center gap-3">
						<Swap.Root
							animation="flip"
							aria-label="Toggle flip demo"
							class="size-12 rounded-lg border bg-muted/50"
						>
							<Swap.On><PlayIcon class="size-5" /></Swap.On>
							<Swap.Off><PauseIcon class="size-5" /></Swap.Off>
						</Swap.Root>
						<span class="text-center text-sm text-muted-foreground">Flip</span>
					</div>

					<div class="flex flex-col items-center gap-3">
						<Swap.Root
							animation="scale"
							aria-label="Toggle scale demo"
							class="size-12 rounded-lg border bg-muted/50"
						>
							<Swap.On><Volume2Icon class="size-5" /></Swap.On>
							<Swap.Off><VolumeXIcon class="size-5" /></Swap.Off>
						</Swap.Root>
						<span class="text-center text-sm text-muted-foreground">Scale</span>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Controlled">
		{#snippet blurb()}
			bind:swapped plus onSwappedChange.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col items-center gap-3">
					<Swap.Root
						aria-label="Toggle theme"
						bind:swapped={controlledSwapped}
						onSwappedChange={(next) => (controlledSwapped = next)}
						class="size-12 rounded-lg border bg-muted/50 hover:bg-muted"
					>
						<Swap.On><SunIcon class="size-6" /></Swap.On>
						<Swap.Off><MoonIcon class="size-6" /></Swap.Off>
					</Swap.Root>
					<span class="text-sm text-muted-foreground">swapped: {controlledSwapped}</span>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Swap</h3>
			<p class="text-sm text-muted-foreground">
				The root container. Because both faces render as icons, consumers must supply an
				<code>aria-label</code> (or <code>aria-labelledby</code>) describing the action.
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
			<h3 class="text-base font-medium">Swap.On / Swap.Off</h3>
			<p class="text-sm text-muted-foreground">
				The two faces. Both stay in the accessibility tree; only their styling reacts to
				<code>data-state</code>.
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
							{#each faceProps as row (row.prop)}
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
			<h3 class="text-base font-medium">Data attributes</h3>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Attribute</Table.Head>
								<Table.Head>Part</Table.Head>
								<Table.Head>Values</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each dataAttributes as row (`${row.attribute}-${row.part}`)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.attribute}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{row.part}</Table.Cell>
									<Table.Cell>{row.values}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>
</DocPage>
