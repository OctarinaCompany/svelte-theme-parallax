<script lang="ts">
	import CheckIcon from "@lucide/svelte/icons/check";
	import * as Card from "$lib/components/ui/card/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Progress } from "$lib/components/ui/progress/index.js";
	import { Separator } from "$lib/components/ui/separator/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import ThemeSelector from "$lib/components/navigation/ThemeSelector.svelte";
	import ThemeSwatch from "$lib/components/navigation/ThemeSwatch.svelte";
	import { cn } from "$lib/utils.js";
	import { THEMES, TOKEN_GROUPS, activeTheme, setTheme, themeById } from "$lib/themes/index.js";

	/**
	 * The Themes page — the one page that documents the palette axis rather than a component.
	 *
	 * It exists because the theme kit carries a list of palettes, not just one. What it shows is
	 * therefore the same three things a designer asks of any theme collection — what the choices
	 * are, what each one actually contains, and what the components look like wearing it — plus
	 * the rules the palettes were generated under, which is the part that stops the set drifting
	 * when a thirteenth is added.
	 *
	 * EVERYTHING BELOW THE PICKER IS LIVE. The token grid reads generated data, so it can show
	 * a palette the document is not wearing; the "in context" section reads no data at all and
	 * simply renders components, so it changes with the tokens the moment a theme is applied.
	 * The two together are the check: if the grid and the components ever disagree, the CSS and
	 * `palettes.ts` have fallen out of sync and the generator was not re-run.
	 */

	const current = $derived(themeById(activeTheme.current));

	/** Sample values for the live controls. Fixed, so the section never appears to be loading. */
	let notifications = $state(true);
	let usage = $state(62);

	/**
	 * The status colours, in their two forms — the solid chip and the far more common subtle
	 * one. The subtle pair puts the full-strength colour on its own tinted ground; the page's
	 * closing section says what that costs and why it is kept.
	 */
	const statuses = [
		{
			label: "Primary",
			solid: "bg-primary text-primary-foreground",
			subtle: "bg-primary-subtle text-primary-subtle-foreground",
		},
		{
			label: "Success",
			solid: "bg-success text-success-foreground",
			subtle: "bg-success-subtle text-success-subtle-foreground",
		},
		{
			label: "Warning",
			solid: "bg-warning text-warning-foreground",
			subtle: "bg-warning-subtle text-warning-subtle-foreground",
		},
		{
			label: "Destructive",
			solid: "bg-destructive text-destructive-foreground",
			subtle: "bg-destructive-subtle text-destructive-subtle-foreground",
		},
		{
			label: "Info",
			solid: "bg-info text-info-foreground",
			subtle: "bg-info-subtle text-info-subtle-foreground",
		},
	] as const;
</script>

<DocPage title="Themes">
	{#snippet subtitle()}
		{THEMES.length} palettes over one token set. Every theme defines both a light and a dark mode, so
		the palette and the light/dark switch are independent — the picker below is the same control that
		sits in every page header, in the two forms it comes in.
	{/snippet}

	<div>
		<DocSection title="The picker">
			{#snippet blurb()}
				A dropdown showing the current palette and a sample of it. The strip is brand, success,
				warning, destructive and info — the five colours that actually differ between two themes —
				and it follows the current mode, because a theme's two halves are not tints of each other.
				Each row carries the palette's one-line description, which is what makes this the form to
				choose from.
			{/snippet}

			<Card.Root>
				<Card.Content class="flex flex-wrap items-center gap-4">
					<ThemeSelector class="border border-input" />
					<p class="text-sm text-muted-foreground">
						The choice is stored under <code class="text-foreground">mode-watcher-theme</code> and
						applied as <code class="text-foreground">data-theme</code> on
						<code class="text-foreground">&lt;html&gt;</code>, beside the
						<code class="text-foreground">dark</code> class.
					</p>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="The compact picker">
			{#snippet blurb()}
				The same control with <code class="text-foreground">compact</code>: the descriptions come
				off and each row is a swatch and a name on one line. This is the form the page header wears
				— including the one at the top of this page — because header chrome is opened to switch, not
				to read.
			{/snippet}

			<Card.Root>
				<Card.Content class="flex flex-wrap items-center gap-4">
					<ThemeSelector compact class="border border-input" />
					<p class="text-sm text-muted-foreground">
						Both forms drive the same state, so either one moves the other and the header follows
						whichever you use.
					</p>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="The {THEMES.length} palettes">
			{#snippet blurb()}
				Both modes of each, side by side. Click a card to wear it.
			{/snippet}

			<div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
				{#each THEMES as theme (theme.id)}
					{@const active = theme.id === activeTheme.current}
					<!--
						A real `<button>`, not a card with a click handler: this activates something, so
						it has to be reachable by keyboard and announced as pressable. `aria-pressed`
						carries the selected state — the tick beside the name is the same fact drawn.

						The active treatment is the idiom the Checkbox page's selectable cards already
						use: a primary border over the subtle ground, rather than a heavier fill.
					-->
					<button
						type="button"
						aria-pressed={active}
						onclick={() => setTheme(theme.id)}
						class={cn(
							"flex flex-col gap-3 rounded-lg border p-4 text-start transition-colors hover:bg-accent",
							active && "border-primary bg-primary-subtle hover:bg-primary-subtle",
						)}
					>
						<span class="flex items-center gap-2">
							<span class="text-sm font-medium">{theme.name}</span>
							{#if active}
								<CheckIcon class="size-4 text-primary" />
							{/if}
						</span>
						<span class="min-h-8 text-xs text-muted-foreground">{theme.blurb}</span>
						<!--
							Both strips, labelled, rather than the mode-following one the picker shows: on
							this page the question is what the theme IS, not what clicking it does now.
							They are drawn inline from the generated data for the reason the swatch
							component gives — the document is only wearing one of them.
						-->
						<span class="flex flex-col gap-1.5">
							{#each [["Light", theme.swatch.light], ["Dark", theme.swatch.dark]] as [label, colours] (label)}
								<span class="flex items-center gap-2">
									<span class="w-9 text-[0.6875rem] text-muted-foreground uppercase">{label}</span>
									<span
										class="flex h-4 flex-1 overflow-hidden rounded-sm ring-1 ring-foreground/10"
										aria-hidden="true"
									>
										{#each colours as colour, index (index)}
											<span class="flex-1" style="background-color: {colour}"></span>
										{/each}
									</span>
								</span>
							{/each}
						</span>
					</button>
				{/each}
			</div>
		</DocSection>

		<DocSection title="Tokens">
			{#snippet blurb()}
				Every colour <span class="font-medium text-foreground">{current.name}</span> defines, grouped
				as the stylesheet groups them. The two swatches on each row are the light and the dark value of
				the same token.
			{/snippet}

			<div class="grid gap-4 md:grid-cols-2">
				{#each TOKEN_GROUPS as group (group.title)}
					<Card.Root>
						<Card.Header>
							<Card.Title>{group.title}</Card.Title>
						</Card.Header>
						<Card.Content class="grid gap-2">
							{#each group.tokens as token (token)}
								{@const light = current.tokens.light[token]}
								<!--
									`--scrim` is the one token declared only in the light block, because it is
									the same value in both modes; falling back to the light value keeps the row
									honest rather than blank.
								-->
								{@const dark = current.tokens.dark[token] ?? light}
								<div class="flex items-center gap-3">
									<span class="flex shrink-0 overflow-hidden rounded-sm ring-1 ring-foreground/10">
										<span class="size-6" style="background-color: {light}"></span>
										<span class="size-6" style="background-color: {dark}"></span>
									</span>
									<span class="min-w-0 flex-1 truncate text-xs">--{token}</span>
									<span class="shrink-0 font-mono text-[0.6875rem] text-muted-foreground uppercase">
										{light} · {dark}
									</span>
								</div>
							{/each}
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		</DocSection>

		<DocSection title="In context">
			{#snippet blurb()}
				The same components every other page shows, under whichever theme is active. Nothing here
				reads the palette data — these are ordinary components, repainted by the tokens. The second
				row of badges is the classic theme's soft variant, and in light mode it reads faint on
				purpose: the ground is a tint of the type's own colour, so the contrast is capped by how
				dark that colour is. See the Badges page for what the classic theme does and why it is kept.
			{/snippet}

			<Card.Root>
				<Card.Header>
					<Card.Title>{current.name}</Card.Title>
					<Card.Description>{current.blurb}</Card.Description>
				</Card.Header>
				<Card.Content class="grid gap-6">
					<div class="flex flex-wrap gap-2">
						<Button>Primary</Button>
						<Button variant="secondary">Secondary</Button>
						<Button variant="outline">Outline</Button>
						<Button variant="ghost">Ghost</Button>
						<Button variant="destructive">Delete</Button>
					</div>

					<Separator />

					<div class="grid gap-3">
						<div class="flex flex-wrap items-center gap-2">
							{#each statuses as status (status.label)}
								<Badge class={status.solid}>{status.label}</Badge>
							{/each}
						</div>
						<div class="flex flex-wrap items-center gap-2">
							{#each statuses as status (status.label)}
								<Badge class={status.subtle} variant="secondary">{status.label}</Badge>
							{/each}
						</div>
					</div>

					<Separator />

					<div class="grid gap-4 sm:grid-cols-2">
						<div class="grid gap-2">
							<Label for="theme-preview-email">Email</Label>
							<Input id="theme-preview-email" type="email" placeholder="name@example.com" />
						</div>
						<div class="grid gap-2">
							<Label for="theme-preview-storage">Storage used</Label>
							<Progress id="theme-preview-storage" value={usage} />
							<p class="text-xs text-muted-foreground">{usage}% of 100 GB</p>
						</div>
					</div>

					<div class="flex items-center gap-2">
						<Switch id="theme-preview-notifications" bind:checked={notifications} />
						<Label for="theme-preview-notifications" class="font-normal">
							Email me about account activity
						</Label>
					</div>
				</Card.Content>
			</Card.Root>
		</DocSection>

		<DocSection title="How they are built">
			{#snippet blurb()}
				Generated, not hand-picked — <code class="text-foreground">tools/themes/themes.mjs</code>
				holds the numbers and
				<code class="text-foreground">node tools/themes/generate.mjs</code> emits both the stylesheet
				and the data this page reads.
			{/snippet}

			<div class="grid gap-4 sm:grid-cols-2">
				<Card.Root>
					<Card.Header>
						<Card.Title>One structure, {THEMES.length} casts</Card.Title>
					</Card.Header>
					<Card.Content class="grid gap-3 text-sm text-muted-foreground">
						<p>
							Every theme reuses the classic theme's own lightness ladder, measured out of
							<code class="text-foreground">app.css</code> in OKLCH — the page, the card, the two border
							weights and the dark surfaces all sit at the same lightness in every one. Only hue and chroma
							move, which is why a different palette never reads as a different product.
						</p>
						<p>
							What is solved rather than inherited is what the classic theme's own port doc already
							flags: secondary text, which measured 2.37:1 there, and the five labels on solid
							fills, which the classic framework picks with <code class="text-foreground"
								>color-contrast()</code
							> and lands at 1.87:1 on success.
						</p>
					</Card.Content>
				</Card.Root>

				<Card.Root>
					<Card.Header>
						<Card.Title>Keeping the meanings apart</Card.Title>
					</Card.Header>
					<Card.Content class="grid gap-3 text-sm text-muted-foreground">
						<p>
							The four status hues are the same in every theme and only move when a brand lands on
							one — and then only inside a band where the colour still reads as the status it names.
							Ember's brand sits between destructive and warning, so both step outward; Crimson's is
							a red beside a red, so it goes deep and quiet instead, and the destructive hue rotates
							to vermillion.
						</p>
						<p>
							Where a hue has nowhere to go — a green brand beside a green success — the separation
							is carried by lightness. Every pair is measured, including under simulated
							deuteranopia and protanopia, by
							<code class="text-foreground">node tools/themes/audit.mjs</code>.
						</p>
					</Card.Content>
				</Card.Root>
			</div>
		</DocSection>
	</div>
</DocPage>
