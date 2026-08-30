<script lang="ts">
	import * as Sidebar from "$lib/components/ui/sidebar/index.js";

	/**
	 * The rail's brand mark: the Parallax glyph and its wordmark, in the slot the workspace
	 * switcher usually holds.
	 *
	 * IT IS THE ONE PIECE OF `crest` THAT CSS COULD NOT DO. Every other flavor repaints surfaces
	 * the shell already renders; this one puts an OBJECT in the rail, which is a component. It
	 * arrives through `AppSidebar`'s `header` snippet — the escape hatch that file documents for
	 * exactly this — so the published sidebar is untouched and the demo supplies what only the
	 * demo knows.
	 *
	 * AN `<img>`, NOT AN INLINED SVG. `public/favicon.svg` is sixteen blurred ellipses under a
	 * mask, with sixteen filter definitions; inlined it would be several kilobytes of markup whose
	 * ids collide the moment the mark is rendered twice, and its filters cannot take
	 * `currentColor` anyway — there is nothing to recolour. `alt=""` because the wordmark beside it
	 * already names the application, so the image is decoration.
	 *
	 * THE PATH GOES THROUGH `BASE_URL`. The site is served from a sub-path in production, and a
	 * bare `/favicon.svg` resolves against the domain root and 404s there.
	 *
	 * `size-8`, NOT the 40px a brand tile would like. The collapsed rail forces the button to
	 * `size-8` and drops its padding, so a larger mark would simply be clipped there; at 32px it
	 * collapses to the icon rail exactly as the workspace tile does, and the rail header's
	 * hairline in `app.css` treats it identically.
	 *
	 * A `<div>`, NOT A BUTTON. The row is an identity, not a control — there is nothing to open —
	 * and the `child` snippet is what lets it keep the button's shape, its data attributes and the
	 * header rule that draws its border.
	 */
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<Sidebar.MenuButton size="lg">
			{#snippet child({ props })}
				<div {...props}>
					<img
						src="{import.meta.env.BASE_URL}favicon.svg"
						alt=""
						width="32"
						height="32"
						class="size-8 shrink-0"
					/>
					<div class="grid flex-1 text-start text-sm leading-tight">
						<span data-slot="brand-wordmark" class="truncate font-semibold">Parallax</span>
						<span class="truncate text-xs text-sidebar-foreground">Theme kit</span>
					</div>
				</div>
			{/snippet}
		</Sidebar.MenuButton>
	</Sidebar.MenuItem>
</Sidebar.Menu>
