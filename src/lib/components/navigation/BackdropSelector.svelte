<script lang="ts">
	import WandSparklesIcon from "@lucide/svelte/icons/wand-sparkles";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import {
		GRADIENTS,
		PATTERNS,
		activeGradient,
		activePattern,
		grainOn,
		markOn,
		setGradient,
		setGrain,
		setMark,
		setPattern,
		type GradientId,
		type PatternId,
	} from "$lib/hooks/backdrop.svelte.js";

	/**
	 * The backdrop picker: one trigger, and a menu of four independent axes.
	 *
	 * IT LIVES IN `navigation/` AND IS NOT PUBLISHED, the same arrangement `RepositoryLink` and
	 * `CommandPalette` use. The page header ships in `parallax-shell`, and a picker baked into it
	 * would hand every consumer an axis their application does not define; this rides in through
	 * the bar's `controls` snippet instead, and the published component stays ignorant of it.
	 * It must NOT be moved under `ui/` — that tree is swept and published wholesale.
	 *
	 * TWO RADIO GROUPS AND TWO CHECKBOXES, which is the menu telling the truth about the model: a
	 * gradient and a pattern are separate exclusive choices — each with its own "None" — and the
	 * mark and the grain are simply on or off. A single radio group over all four would tell the
	 * reader the layers are alternatives, and they compose. The order is the painting order the
	 * Settings page and the hook use: gradient, pattern, mark, grain.
	 *
	 * AN ICON AND NOTHING ELSE, where the palette picker shows its name and a swatch. The bar's
	 * appearance cluster is the one group in the header that cannot compress — an icon button has
	 * no compressible axis — and every pixel it takes comes out of the centred search field
	 * between roughly 768px and 893px. At 40px this is the cheapest shape there is.
	 *
	 * WHY A WAND. `palette` belongs to the theme picker, the sun/moon pair and `contrast` to the
	 * three mode axes, and plain `sparkles` is already the account menu's "Upgrade to Pro". A wand
	 * says "a look applied over what is there", which is precisely what a backdrop is.
	 *
	 * SINGLE-LINE ROWS. Four layers' worth of looks cannot fit in a menu at two lines a row without
	 * turning into a page; each look's sentence lives on the Settings page, which is where someone
	 * meeting these for the first time is anyway. The menu is for the person who already knows
	 * what they want.
	 *
	 * @see $lib/hooks/backdrop.svelte.ts — the axes, and why "none" writes no attribute
	 */
	let { class: className }: { class?: string } = $props();

	/*
	 * The label names what is ON, not just the action: `aria-label` replaces the trigger's whole
	 * contents for a screen reader, and the contents here are one glyph. With four axes that is a
	 * list rather than a name, and "off" is worth saying out loud — an empty label would read as a
	 * broken control rather than as a page wearing nothing.
	 */
	const summary = $derived.by(() => {
		const parts: string[] = [];
		const gradient = GRADIENTS.find((g) => g.id === activeGradient.current);
		const pattern = PATTERNS.find((p) => p.id === activePattern.current);
		if (gradient) parts.push(gradient.name);
		if (pattern) parts.push(pattern.name);
		if (markOn.current) parts.push("Mark");
		if (grainOn.current) parts.push("Grain");
		// "none", the same word the page's pickers use for the same state.
		return parts.length ? parts.join(", ") : "none";
	});
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class={cn(buttonVariants({ variant: "ghost", size: "icon" }), className)}
		aria-label="Backdrop: {summary}"
	>
		<WandSparklesIcon class="size-4" />
	</DropdownMenu.Trigger>

	<!--
		`align="end"` because this sits at the right edge of the bar, and the height cap because the
		four groups run past a laptop viewport — the generated content scrolls but carries no height
		of its own, so without the cap it simply overflows the screen.
	-->
	<DropdownMenu.Content class="max-h-(--bits-floating-available-height) w-60" align="end">
		<DropdownMenu.Label>Gradient</DropdownMenu.Label>
		<DropdownMenu.RadioGroup
			value={activeGradient.current}
			onValueChange={(value) => setGradient(value as GradientId)}
		>
			<DropdownMenu.RadioItem value="none">None</DropdownMenu.RadioItem>
			{#each GRADIENTS as gradient (gradient.id)}
				<DropdownMenu.RadioItem value={gradient.id}>{gradient.name}</DropdownMenu.RadioItem>
			{/each}
		</DropdownMenu.RadioGroup>

		<DropdownMenu.Separator />
		<DropdownMenu.Label>Pattern</DropdownMenu.Label>
		<DropdownMenu.RadioGroup
			value={activePattern.current}
			onValueChange={(value) => setPattern(value as PatternId)}
		>
			<DropdownMenu.RadioItem value="none">None</DropdownMenu.RadioItem>
			{#each PATTERNS as pattern (pattern.id)}
				<DropdownMenu.RadioItem value={pattern.id}>{pattern.name}</DropdownMenu.RadioItem>
			{/each}
		</DropdownMenu.RadioGroup>

		<DropdownMenu.Separator />
		<DropdownMenu.CheckboxItem checked={markOn.current} onCheckedChange={setMark}>
			Mark
		</DropdownMenu.CheckboxItem>
		<DropdownMenu.CheckboxItem checked={grainOn.current} onCheckedChange={setGrain}>
			Grain
		</DropdownMenu.CheckboxItem>
	</DropdownMenu.Content>
</DropdownMenu.Root>
