<script lang="ts">
	import * as Avatar from "$lib/components/ui/avatar/index.js";

	/**
	 * The body of the gallery's "Toast with avatar". A component for the
	 * same reason as {@link sonner-icon-toast.svelte}: svelte-sonner renders a non-string title
	 * as a component, so that is the only shape free-form content can take.
	 *
	 * NO PHOTOGRAPH. A stock version would load a remote avatar. This
	 * repo ships no images and answers every avatar with initials — the standing rule in
	 * §16 of the theme notes, and what `EmptyPage` and `HoverCardPage` already do. The initials
	 * are upstream's own: its `alt` reads "Hallie Richards" while the copy greets "Henry
	 * Richer", and `HR` happens to serve both.
	 *
	 * The ground is the string `EmptyPage` derives for the classic theme's `.avatar-title`, and it needs
	 * both modes spelled out because the two land on different tokens: `avatar-title-bg` is
	 * `gray-500` and `avatar-title-bg-dark` is `gray-600-dark`, neither of which a token
	 * holds exactly. `EmptyPage.svelte` carries the full derivation.
	 */
</script>

<div class="flex items-center gap-2">
	<Avatar.Root class="shrink-0">
		<Avatar.Fallback class="bg-muted-foreground text-xs text-primary-foreground dark:bg-secondary"
			>HR</Avatar.Fallback
		>
	</Avatar.Root>
	Hey Henry Richer, your profile is now up to date!
</div>
