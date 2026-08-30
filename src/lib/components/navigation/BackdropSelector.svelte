<script lang="ts">
	import WandSparklesIcon from "@lucide/svelte/icons/wand-sparkles";
	import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
	import { buttonVariants } from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import {
		BACKDROPS,
		activeBackdrop,
		backdropById,
		setBackdrop,
		type BackdropId,
	} from "$lib/hooks/backdrop.svelte.js";

	/**
	 * The backdrop picker: one trigger, and a menu of the backdrops.
	 *
	 * IT LIVES IN `navigation/` AND IS NOT PUBLISHED, the same arrangement `RepositoryLink` and
	 * `CommandPalette` use. The page header ships in `parallax-shell`, and a picker baked into it
	 * would hand every consumer an axis their application does not define; this rides in through
	 * the bar's `controls` snippet instead, and the published component stays ignorant of it.
	 * It must NOT be moved under `ui/` — that tree is swept and published wholesale.
	 *
	 * A DROPDOWN WITH A RADIO GROUP, exactly as {@link ThemeSelector}: the values are mutually
	 * exclusive and one is always chosen, which is `role="menuitemradio"`, and that is also what
	 * puts the check on the active row without a hand-rolled tick.
	 *
	 * AN ICON AND NOTHING ELSE, where the palette picker shows its name and a swatch. The bar's
	 * appearance cluster is the one group in the header that cannot compress — an icon button has
	 * no compressible axis — and every pixel it takes comes out of the centred search field
	 * between roughly 768px and 893px. At 40px this is the cheapest shape there is, and the name
	 * it would have shown is in `aria-label`, which is where the palette picker's own name goes
	 * below `sm` anyway.
	 *
	 * WHY A WAND. `palette` belongs to the theme picker, the sun/moon pair and `contrast` to the
	 * three mode axes, and plain `sparkles` is already the account menu's "Upgrade to Pro". A wand
	 * says "a look applied over what is there", which is precisely what a backdrop is.
	 *
	 * NO `chromeWear`. The palette picker needs it because its trigger PAINTS colours and the bar
	 * carries its own light/dark pin; this trigger is one glyph in `currentColor`, so it wears
	 * whatever ink the bar is wearing, like the repository link beside it.
	 *
	 * TWO-LINE ROWS, and a rule between families. The whole point of the picker is to be explored
	 * by someone who has not seen these before, so each row carries the sentence that says what it
	 * does. The rule matters less at three rows than it did at twelve, but it still separates the
	 * one row that turns the axis OFF from the ones that turn it on, which is the distinction a
	 * glance most needs.
	 *
	 * @see $lib/hooks/backdrop.svelte.ts — the axis, and why `stock` writes no attribute
	 */
	let { class: className }: { class?: string } = $props();

	const current = $derived(backdropById(activeBackdrop.current));
</script>

<DropdownMenu.Root>
	<!--
		The label names the CURRENT value, not just the action: `aria-label` replaces the trigger's
		whole contents for a screen reader, and the contents here are one glyph, so a bare "Change
		backdrop" would leave no way to know which one is on.
	-->
	<DropdownMenu.Trigger
		class={cn(buttonVariants({ variant: "ghost", size: "icon" }), className)}
		aria-label="Backdrop: {current.name}"
	>
		<WandSparklesIcon class="size-4" />
	</DropdownMenu.Trigger>

	<!--
		`align="end"` because this sits at the right edge of the bar, and the height cap because
		two-line rows can run past a laptop viewport once the list grows — the generated content scrolls but carries
		no height of its own, so without the cap it simply overflows the screen.
	-->
	<DropdownMenu.Content class="max-h-(--bits-floating-available-height) w-72" align="end">
		<DropdownMenu.Label>Backdrop</DropdownMenu.Label>
		<DropdownMenu.Separator />
		<DropdownMenu.RadioGroup
			value={activeBackdrop.current}
			onValueChange={(value) => setBackdrop(value as BackdropId)}
		>
			{#each BACKDROPS as backdrop, index (backdrop.id)}
				{#if BACKDROPS[index - 1]?.id === "none"}
					<DropdownMenu.Separator />
				{/if}
				<!--
					`items-start` and `py-2`: the rows are two lines tall, and the check indicator the
					item draws would otherwise sit centred against the block rather than beside the name
					it belongs to.
				-->
				<DropdownMenu.RadioItem value={backdrop.id} class="items-start gap-3 py-2">
					<span class="flex min-w-0 flex-col">
						<span class="font-medium">{backdrop.name}</span>
						<!--
							`text-wrap`, because the item sets `whitespace-nowrap` for single-line rows and
							without it the blurb is one long line clipped by the panel.
						-->
						<span class="text-xs text-wrap text-muted-foreground">{backdrop.blurb}</span>
					</span>
				</DropdownMenu.RadioItem>
			{/each}
		</DropdownMenu.RadioGroup>
	</DropdownMenu.Content>
</DropdownMenu.Root>
