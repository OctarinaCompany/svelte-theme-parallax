<script lang="ts">
	import MinusIcon from "@lucide/svelte/icons/minus";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import RotateCcwIcon from "@lucide/svelte/icons/rotate-ccw";
	import { Button } from "$lib/components/ui/button/index.js";
	import * as Popover from "$lib/components/ui/popover/index.js";
	import { IsMobile } from "$lib/hooks/is-mobile.svelte.js";
	import {
		CONTENT_WIDTH_BREAKPOINT,
		enlargeText,
		narrowContent,
		reading,
		resetTextSize,
		shrinkText,
		widenContent,
	} from "$lib/hooks/reading.svelte.js";

	/**
	 * The reading panel: one permanent trigger in the bar, opening a small panel that groups the
	 * two settings governing how this page is read — its text size and the width of its column.
	 *
	 * ONE PRESS, ONE STEP, THE RESULT VISIBLE BEHIND THE PANEL. Neither setting is a menu of
	 * values to choose between: a reader adjusting text size is answering "is this comfortable
	 * yet", which is a question about the page rather than about the option list — so the panel
	 * shows the current step's name and two ways to move it, and the page under it re-lays out on
	 * every press. The trigger stays labelled and visible for the same reason: the guidance
	 * against font controls is about ones buried in a toolbar nobody opens, not about a panel a
	 * reader can see.
	 *
	 * `Aa` RATHER THAN AN ICON, alone among the bar's controls. Every glyph for this ends up
	 * being letters anyway, and two letters at two weights say "text size" in every language the
	 * gallery is read in — where a stylised `A` in a lucide box would need the tooltip to be read
	 * at all. `aria-hidden` on it, because the accessible name is on the button.
	 *
	 * IT CANNOT RESIZE ITSELF. The trigger lives in the header bar and `DocPage` sets
	 * `--text-factor` on the page content BELOW it, so the control the reader is pressing holds
	 * still while everything it governs moves — which is what makes the effect legible at all.
	 */

	/*
	 * The width group is offered only where the column is not already full-width — `lg`, the
	 * breakpoint the column's own first fraction sits on. Below it the steps are inert by
	 * construction (they are `lg:`/`xl:` overrides), so hiding the group is the honest version of
	 * a control with nothing to do rather than a second rule that has to agree with the first.
	 */
	const narrowViewport = new IsMobile(() => CONTENT_WIDTH_BREAKPOINT);

	/*
	 * What the live region says. Written on a change only, so opening the panel announces
	 * nothing — a reader who cannot see the text resize learns what it became, which is the one
	 * fact this control conveys entirely by sight.
	 */
	let announcement = $state("");

	function act(move: () => void, describe: () => string): void {
		move();
		announcement = describe();
	}
</script>

<Popover.Root>
	<Popover.Trigger>
		{#snippet child({ props })}
			<!-- ghost/icon, the shape every control in this bar wears. -->
			<Button {...props} variant="ghost" size="icon" aria-label="Reading settings">
				<span class="text-base leading-none font-semibold" aria-hidden="true">Aa</span>
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content align="end" class="w-64">
		<div class="flex flex-col gap-3">
			<div class="flex flex-col gap-1.5">
				<span class="text-xs font-medium tracking-label text-muted-foreground uppercase">
					Text size
				</span>
				<div class="flex items-center gap-1">
					<Button
						variant="outline"
						size="icon-sm"
						aria-label="Decrease text size"
						disabled={!reading.canShrinkText}
						onclick={() => act(shrinkText, () => `Text size ${reading.textLabel}`)}
					>
						<MinusIcon />
					</Button>
					<span class="flex-1 text-center text-sm">{reading.textLabel}</span>
					<Button
						variant="outline"
						size="icon-sm"
						aria-label="Increase text size"
						disabled={!reading.canEnlargeText}
						onclick={() => act(enlargeText, () => `Text size ${reading.textLabel}`)}
					>
						<PlusIcon />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Reset text size to default"
						onclick={() => act(resetTextSize, () => `Text size ${reading.textLabel}`)}
					>
						<RotateCcwIcon />
					</Button>
				</div>
			</div>

			{#if !narrowViewport.current}
				<div class="flex flex-col gap-1.5">
					<span class="text-xs font-medium tracking-label text-muted-foreground uppercase">
						Content width
					</span>
					<div class="flex items-center gap-1">
						<Button
							variant="outline"
							size="icon-sm"
							aria-label="Narrow the content"
							disabled={!reading.canNarrowContent}
							onclick={() => act(narrowContent, () => `Content width ${reading.widthLabel}`)}
						>
							<MinusIcon />
						</Button>
						<span class="flex-1 text-center text-sm">{reading.widthLabel}</span>
						<Button
							variant="outline"
							size="icon-sm"
							aria-label="Widen the content"
							disabled={!reading.canWidenContent}
							onclick={() => act(widenContent, () => `Content width ${reading.widthLabel}`)}
						>
							<PlusIcon />
						</Button>
						<!--
							Reserves the reset button's slot, so both rows' − and + line up rather than
							sitting one button's width apart. Sized from the control ramp rather than from a
							`size-8` that happens to equal it today.
						-->
						<span class="size-(--control-h-sm) shrink-0" aria-hidden="true"></span>
					</div>
				</div>
			{/if}
		</div>
	</Popover.Content>
</Popover.Root>

<!--
	Announces the new value, so a screen-reader user learns what changed rather than inferring it
	from text they cannot see resize. Outside the popover on purpose: the content unmounts when the
	panel closes, and a live region has to be in the document before it can announce anything.
-->
<span class="sr-only" aria-live="polite">{announcement}</span>
