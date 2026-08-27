<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import * as ColorSwatch from "$lib/components/ui/color-swatch/index.js";
	import * as Table from "$lib/components/ui/table/index.js";

	/**
	 * The Color swatch component page.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. Like the picker it belongs to, a swatch shows the colour it is
	 * given; the theme owns only its outline and radius. The checkerboard behind a transparent
	 * swatch is drawn from `--border` so it survives dark mode, where a hard-coded grey would
	 * either vanish or glare.
	 */

	const sizeColors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];

	const rootProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the rendered element. Stays `null` in `child` mode.",
		},
		{
			prop: "color",
			type: "string | undefined",
			default: "undefined",
			description:
				'Any valid CSS color, e.g. "#ff0000" | "rgb(255, 0, 0)" | "hsl(0, 100%, 50%)" | "rgba(255, 0, 0, 0.5)". Trimmed; empty/whitespace-only is treated as absent.',
		},
		{
			prop: "size",
			type: "'default' | 'sm' | 'lg'",
			default: "'default'",
			description:
				"sm → size-6, default → size-8, lg → size-12. An unknown runtime value falls back to default.",
		},
		{
			prop: "withoutTransparency",
			type: "boolean",
			default: "false",
			description:
				"Suppresses the checkerboard pattern for alpha colors, rendering only the flat color.",
		},
		{
			prop: "disabled",
			type: "boolean",
			default: "false",
			description:
				"Adds aria-disabled and data-disabled, and applies the disabled variant classes.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description: "Merged last, so it overrides the variant’s own classes.",
		},
		{
			prop: "style",
			type: "string | undefined | null",
			default: "—",
			description: "Appended after the computed background and forced-color-adjust declarations.",
		},
		{
			prop: "child",
			type: "Snippet<[{ props: ColorSwatchChildProps }]>",
			default: "—",
			description: "Render the swatch onto your own element instead of the default div.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement> minus 'children'",
			default: "—",
			description: "Every other attribute and DOM handler is spread onto the rendered element.",
		},
	];
</script>

<DocPage title="Color swatch">
	{#snippet subtitle()}
		A color swatch component for displaying color values with support for transparency and various
		sizes.
	{/snippet}

	<DocSection title="Default">
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-6">
					<div class="flex items-center gap-3">
						<ColorSwatch.Root color="#3b82f6" />
						<span class="text-sm font-medium">Primary Blue</span>
					</div>
					<div class="flex items-center gap-3">
						<ColorSwatch.Root color="#ef4444" size="sm" />
						<ColorSwatch.Root color="#ef4444" size="default" />
						<ColorSwatch.Root color="#ef4444" size="lg" />
						<span class="text-sm font-medium">Different Sizes</span>
					</div>
					<div class="flex items-center gap-3">
						<ColorSwatch.Root color="rgba(59, 130, 246, 0.5)" />
						<span class="text-sm font-medium">Semi-transparent Blue</span>
					</div>
					<div class="flex items-center gap-3">
						<span class="text-sm font-medium">Color Palette</span>
						<div class="flex gap-2">
							<ColorSwatch.Root color="#ef4444" />
							<ColorSwatch.Root color="#f97316" />
							<ColorSwatch.Root color="#eab308" />
							<ColorSwatch.Root color="#22c55e" />
							<ColorSwatch.Root color="#3b82f6" />
							<ColorSwatch.Root color="#8b5cf6" />
							<ColorSwatch.Root color="#ec4899" />
						</div>
					</div>
					<div class="flex items-center gap-3">
						<ColorSwatch.Root color="#ef4444" disabled />
						<span class="text-sm font-medium">Disabled</span>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Sizes">
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-6">
					<div class="flex flex-col gap-2">
						<span class="text-sm font-medium">Small (sm)</span>
						<div class="flex gap-2">
							{#each sizeColors as color (color)}
								<ColorSwatch.Root {color} size="sm" />
							{/each}
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-sm font-medium">Default</span>
						<div class="flex gap-2">
							{#each sizeColors as color (color)}
								<ColorSwatch.Root {color} size="default" />
							{/each}
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-sm font-medium">Large (lg)</span>
						<div class="flex gap-2">
							{#each sizeColors as color (color)}
								<ColorSwatch.Root {color} size="lg" />
							{/each}
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Transparency">
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-6">
					<div class="flex flex-col gap-2">
						<span class="text-sm font-medium">Alpha Transparency</span>
						<div class="flex gap-2">
							<ColorSwatch.Root color="rgba(59, 130, 246, 1)" />
							<ColorSwatch.Root color="rgba(59, 130, 246, 0.8)" />
							<ColorSwatch.Root color="rgba(59, 130, 246, 0.6)" />
							<ColorSwatch.Root color="rgba(59, 130, 246, 0.4)" />
							<ColorSwatch.Root color="rgba(59, 130, 246, 0.2)" />
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-sm font-medium">HSLA Colors</span>
						<div class="flex gap-2">
							<ColorSwatch.Root color="hsla(220, 91%, 60%, 1)" />
							<ColorSwatch.Root color="hsla(220, 91%, 60%, 0.75)" />
							<ColorSwatch.Root color="hsla(220, 91%, 60%, 0.5)" />
							<ColorSwatch.Root color="hsla(220, 91%, 60%, 0.25)" />
							<ColorSwatch.Root color="hsla(220, 91%, 60%, 0.1)" />
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-sm font-medium">Without Transparency Pattern</span>
						<div class="flex gap-2">
							<ColorSwatch.Root color="rgba(239, 68, 68, 0.8)" withoutTransparency />
							<ColorSwatch.Root color="rgba(34, 197, 94, 0.6)" withoutTransparency />
							<ColorSwatch.Root color="rgba(139, 92, 246, 0.4)" withoutTransparency />
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<span class="text-sm font-medium">With Transparency Pattern (Default)</span>
						<div class="flex gap-2">
							<ColorSwatch.Root color="rgba(239, 68, 68, 0.8)" />
							<ColorSwatch.Root color="rgba(34, 197, 94, 0.6)" />
							<ColorSwatch.Root color="rgba(139, 92, 246, 0.4)" />
						</div>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Usage">
		{#snippet blurb()}
			The MDX Usage snippet, plus the empty/invalid edge cases.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-col gap-6">
					<div class="flex items-center gap-3">
						<ColorSwatch.Root color="#3b82f6" />
						<span class="text-sm font-medium">color="#3b82f6"</span>
					</div>
					<div class="flex items-center gap-3">
						<ColorSwatch.Root />
						<span class="text-sm font-medium">No color selected</span>
					</div>
					<div class="flex items-center gap-3">
						<ColorSwatch.Root color="not-a-color" />
						<span class="text-sm font-medium">Invalid value — renders transparent</span>
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">ColorSwatch</h3>
			<p class="text-sm text-muted-foreground">
				A single-element, non-interactive <code>role="img"</code> swatch that renders one CSS color value.
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
	</DocSection>
</DocPage>
