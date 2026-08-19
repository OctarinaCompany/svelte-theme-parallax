<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { toast } from "svelte-sonner";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import SonnerAvatarToast from "./sonner-avatar-toast.svelte";
	import SonnerIconToast from "./sonner-icon-toast.svelte";
	import SonnerAccentToast from "./sonner-accent-toast.svelte";
	import SonnerDeploymentToast from "./sonner-deployment-toast.svelte";
	import SonnerInvertErrorToast from "./sonner-invert-error-toast.svelte";
	import SonnerInvertInviteToast from "./sonner-invert-invite-toast.svelte";
	import SonnerInvertMergeToast from "./sonner-invert-merge-toast.svelte";
	import SonnerInvertSuccessToast from "./sonner-invert-success-toast.svelte";
	import SonnerInvertWarningToast from "./sonner-invert-warning-toast.svelte";
	import SonnerUploadToast from "./sonner-upload-toast.svelte";
	import SonnerUserMessageToast from "./sonner-user-message-toast.svelte";
	import SonnerIntegrationToast from "./sonner-integration-toast.svelte";
	import SonnerUpdatableToast from "./sonner-updatable-toast.svelte";
	import BookmarkIcon from "@lucide/svelte/icons/bookmark";
	import DownloadIcon from "@lucide/svelte/icons/download";
	import SendIcon from "@lucide/svelte/icons/send";

	/**
	 * The Sonner component page, ported from the shadcn-svelte documentation
	 * (https://shadcn-svelte.com/docs/components/sonner). That page carries three examples —
	 * the hero toast with a description and an `Undo` action, the one-line Usage form, and the
	 * six-button Examples row (default / success / info / warning / error / promise) — and all
	 * three are here, in that order.
	 *
	 * SIX MORE SECTIONS COME FROM the gallery.
	 * Its set is twenty files, `sonner-01.tsx` … `sonner-20.tsx`, and four of them are already
	 * above: the plain toast and the promise are two of the six Examples buttons, and the
	 * description and the `Undo` action are the hero's two halves. The remaining sixteen are the
	 * sections below — free-form content (icon, avatar), the close button, the six positions, and
	 * the twelve status skins.
	 *
	 * THE TWELVE SKINS ARE RE-KEYED, NOT COPIED. Nine of them upstream paints from Tailwind's own
	 * ramp — `--color-sky-600`, `--color-green-600`, `--color-amber-600`, each pair switched by
	 * `light-dark()` — and its three solid ones put `--color-white` on top. Neither the ramp nor
	 * the switch survives the theme. Raw palette colours are what the house rule forbids and what
	 * §12 of the theme notes declines to open the door to; and once a pair
	 * collapses onto one of this theme's status tokens there is nothing left for `light-dark()` to
	 * switch, because that token already holds a different value under `.dark`. It would work if it
	 * were wanted — mode-watcher writes `style.color-scheme` onto `<html>` beside the class — but
	 * it is not.
	 *
	 * The destructive trio is the exception that shows the shape of the rest: upstream already
	 * reaches for `var(--destructive)` there, the one token it and this theme spell the same, and
	 * only its solid case wraps anything in `light-dark()`. That case goes too, because
	 * `--destructive` is #E63757 in both modes here. The four status tokens carry both modes AND
	 * all twelve palettes, so `var(--info)` and its three siblings do upstream's job and the eleven
	 * generated themes come along for free. Per-skin reasoning sits on `skin()` below.
	 *
	 * NO SECOND TOASTER. `App.svelte` already mounts one `<Toaster />` for the whole app, which
	 * is the portal every toast on every route renders into. This page imports `toast` from
	 * `svelte-sonner` and renders triggers only.
	 *
	 * WHAT THE CLASSIC THEME HAS: the classic `.toast`, documented at `the reference docs#toasts`
	 * as a single static card — a `.toast-header` with `<strong>the classic framework</strong>`, a
	 * `<small>11 mins ago</small>` and a `.btn-close`, over a `.toast-body` reading "Hello,
	 * world!". The classic theme's own toast stylesheet is four lines long and does nothing
	 * but repaint the surface in dark mode; everything else comes from the `toast-*` block of
	 * the reference stylesheet. Resolved out of the reference bundle:
	 *
	 *   --bs-toast-bg             var(--bs-white) -> #FFFFFF, and #152E4D in dark
	 *                             (toast-background-color-dark: var(--bs-gray-800-dark))
	 *   --bs-toast-header-color   var(--bs-body-color) -> #12263F, and #FFFFFF in dark
	 *   --bs-toast-border-color   var(--bs-border-color) -> gray-300 (#E3EBF6), #1E3A5C dark
	 *   --bs-toast-border-radius  var(--bs-border-radius) -> 6px
	 *   --bs-toast-max-width      300px, applied as both `width` and `max-width: 100%`
	 *   --bs-toast-font-size      0.9375rem (font-size-base)
	 *   --bs-toast-padding-x/y    1rem / 0.75rem, of which `.toast-body` uses only the x
	 *                             (`padding: var(--bs-toast-padding-x)`, i.e. 16px all round)
	 *   --bs-toast-box-shadow     0 .75rem 1.5rem rgba(18,38,63,.1) — `fade-out(black, .9)`
	 *
	 * WHAT IS ALREADY RIGHT, and needs nothing from this page:
	 *
	 *   surface    the installed `sonner.svelte` pipes `--normal-bg: var(--color-popover)` into
	 *              sonner's own CSS, and `--popover` is #FFFFFF light / #152E4D dark — the two
	 *              values `toast-background-color` resolves to, exactly, in both modes
	 *   text       `--normal-text: var(--color-popover-foreground)` is #12263F / #FFFFFF, which
	 *              is `--bs-toast-header-color` = `--bs-body-color`, exactly, in both modes
	 *   padding    sonner's `[data-sonner-toast]` is `padding: 16px`; `.toast-body` is 16px
	 *
	 * WHAT COULD NOT BE REACHED. The light-mode border is one grey step off: the classic theme asks for
	 * `gray-300` (#E3EBF6) and `--border` holds `gray-200` (#EDF2F9). Dark matches exactly
	 * (#1E3A5C both sides). It is left alone rather than corrected because `--normal-border` is
	 * written as an inline `style` attribute on the `<Toaster>` element inside
	 * `components/ui/sonner/sonner.svelte`, which no stylesheet rule can override without
	 * `!important` — and both that file and `App.svelte` are outside this page.
	 *
	 * That still holds for a THEME-WIDE correction. The status skins below found the other lever:
	 * svelte-sonner writes a toast's own `style` option onto the `<li>` it renders
	 * (`style={`${restProps.style} ${toast.style}`}`, `Toast.svelte`), and a declaration on the
	 * element beats a value inherited from the `<ol>` above it — no specificity contest and no
	 * `!important`. It reaches one toast per call, which skins a demo rather than the theme.
	 *
	 * WHAT IS NOT PORTED ON PURPOSE. `toast-box-shadow` is elevation, and elevation is deferred
	 * repo-wide: the `[data-slot='card']` block in `app.css` says the same thing about
	 * `card-box-shadow`. Porting it here alone would make a toast the only elevated surface in
	 * the theme, which is the opposite of what the variable is for.
	 *
	 * WHAT THE CLASSIC THEME DOES NOT HAVE AT ALL — case (c), kept as shadcn ships it:
	 *
	 *   the type variants   `.toast` has no success / info / warning / error skin, and no
	 *                       leading icon of any kind. The five Lucide icons in `sonner.svelte`
	 *                       and the colours around them are shadcn's
	 *   the promise state   the classic toast is shown and hidden by an explicit JS call; there
	 *                       is no loading state and no auto-dismiss
	 *   the action button   the classic toast closes with a `.btn-close` and offers nothing
	 *                       else. Sonner's `[data-button]` is an inverted 24px chip
	 *                       (`background: var(--normal-text)`), which has no classic counterpart
	 *   the title/body pair the classic framework splits a toast into a bordered `.toast-header` row and a
	 *                       `.toast-body`; sonner stacks a title and a description in one padded
	 *                       box. The structures do not correspond, so neither does the rule
	 *                       between them
	 *
	 * The three values that DID need porting — width, radius and font size — are none of them
	 * reachable from a call site: the toast element is created by the shared `<Toaster />`
	 * portal, not by this page. They are returned as `app.css` rules instead, keyed off
	 * sonner's own `--width` / `--border-radius` custom properties where possible.
	 */

	/**
	 * The neutral trigger. The docs page uses `variant="outline"` for every button except the
	 * Usage one; the classic theme's answer to a neutral button on a card is `.btn-white`, and this is
	 * the string ButtonPage derives for it — the card surface with a visible outline:
	 *
	 *   --bs-btn-bg              var(--bs-white)      -> bg-card
	 *   --bs-btn-border-color    var(--bs-gray-300)   -> border-border (one step off, as
	 *                                                    ButtonPage records)
	 *   --bs-btn-hover-bg        var(--bs-gray-100)   -> hover:bg-accent
	 *   dark: --bs-btn-hover-bg  var(--bs-black)      -> dark:hover:bg-background
	 *
	 * The geometry is `input-btn-*` at the base size, resolved on ButtonPage: 15px x 1.5
	 * line-height + 2 x .5rem padding + 2 x 1px border = 40.5px -> `h-10`, `border-radius`
	 * -> `rounded-md`, and `btn-font-weight: font-weight-normal` -> `font-normal` against
	 * shadcn's `font-medium`.
	 */
	const white =
		"h-10 rounded-md border-border bg-card px-3 text-sm font-normal text-card-foreground hover:bg-accent dark:hover:bg-background";

	/**
	 * The Usage trigger. The docs leave it on the default variant, which is `.btn-primary`:
	 * the fill and the border are both `primary`, and hover is `shade-color(primary, 15%)`,
	 * which `color-mix(in srgb, X 85%, black)` reproduces exactly (#2569C3 from #2C7BE5).
	 *
	 * The border is stated, not decorative — shadcn's button base is `border-transparent
	 * bg-clip-padding`, so without it a 1px frame of page background shows through. Same
	 * reasoning, at length, in ButtonPage.
	 */
	const primary =
		"h-10 rounded-md border-primary px-3 text-sm font-normal hover:bg-[color-mix(in_srgb,var(--primary)_85%,black)] hover:border-[color-mix(in_srgb,var(--primary)_85%,black)]";

	/**
	 * The promise demo, lifted out of the markup because the generic argument
	 * (`toast.promise<{ name: string }>`) reads as a tag opener inside a Svelte template.
	 * Two seconds, then a resolved value the success message interpolates — the docs' own
	 * timings and copy.
	 */
	function showPromise() {
		toast.promise<{ name: string }>(
			() =>
				new Promise<{ name: string }>((resolve) =>
					setTimeout(() => resolve({ name: "Event" }), 2000),
				),
			{
				loading: "Loading...",
				success: (data) => `${data.name} has been created`,
				error: "Error",
			},
		);
	}

	/** The six Examples buttons, in the order the docs list them. */
	const examples = [
		{ label: "Default", show: () => toast("Event has been created") },
		{ label: "Success", show: () => toast.success("Event has been created") },
		{ label: "Info", show: () => toast.info("Be at the area 10 minutes before the event time") },
		{ label: "Warning", show: () => toast.warning("Event start time cannot be earlier than 8am") },
		{ label: "Error", show: () => toast.error("Event has not been created") },
		{ label: "Promise", show: showPromise },
	];

	/**
	 * The four statuses the gallery skins, in the order its files number them
	 * (`sonner-09.tsx` … `sonner-20.tsx`), carrying upstream's own copy.
	 *
	 * `token` is a custom-property stem rather than a class, because these are read back inside
	 * a `style` string where Tailwind utilities do not reach. The raw names (`--info`) are used
	 * over the `@theme inline` aliases (`--color-info`) they resolve to, matching how `app.css`
	 * writes its own unlayered rules.
	 *
	 * Each `show` closes over its type helper, so the toast keeps the matching icon from
	 * `sonner.svelte`: a skin recolours a toast, it does not turn it into a plain one.
	 */
	const statuses = [
		{
			token: "info",
			label: "Info",
			show: (style: string) => toast.info("This is for your information, please note.", { style }),
		},
		{
			token: "success",
			label: "Success",
			show: (style: string) => toast.success("Action completed successfully!", { style }),
		},
		{
			token: "warning",
			label: "Warning",
			show: (style: string) => toast.warning("Warning: Please check the entered data.", { style }),
		},
		{
			token: "destructive",
			label: "Destructive",
			show: (style: string) =>
				toast.error("Oops, there was an error processing your request.", { style }),
		},
	];

	/**
	 * The three skins, written as the `--normal-*` trio sonner reads for every styled toast —
	 * its `background`, `color` and `border-color`, declared once in `Toaster.svelte`. A string
	 * rather than the object React takes, because `ToastT['style']` is typed `string`.
	 *
	 * SOFT keeps upstream's shape — tinted ground, coloured type and border — but takes the
	 * tint from `--{status}-subtle` instead of `color-mix(… 10%, var(--background))`, and the
	 * type from `--{status}-subtle-foreground`, the contrast-walked ink every soft surface now
	 * shares (badge, alert, status, banner; app.css §status tokens). The border keeps the
	 * full-strength colour: it is the accent edge, not type, and 3:1 non-text suffices there.
	 *
	 * OUTLINE drops the fill. Upstream writes `var(--background)`, which in stock shadcn is the
	 * plain white page; here `--background` is `body-bg` (#F9FBFD light, #12263F dark), so
	 * filling with it would punch a page-coloured hole through a floating surface. `--popover` is
	 * what the toast already stands on — `toast-background-color` resolves to the same #FFFFFF /
	 * #152E4D — so the skin colours only the two things "outline" is claiming.
	 *
	 * SOLID takes `--{status}-foreground` where upstream hardcodes `--color-white`. It shows on
	 * one of the four: `color-contrast(warning)` picks `gray-900` (#283E59) against the classic theme's
	 * yellow, so a solid warning is dark type on yellow in both modes. Upstream also special-cases
	 * its solid destructive in dark (60% into the background, `transparent` border); `--destructive`
	 * is #E63757 in both modes here, so it needs no case of its own.
	 */
	function skin(variant: "soft" | "outline" | "solid", token: string) {
		switch (variant) {
			case "soft":
				return `--normal-bg: var(--${token}-subtle); --normal-text: var(--${token}-subtle-foreground); --normal-border: var(--${token});`;
			case "outline":
				return `--normal-bg: var(--popover); --normal-text: var(--${token}); --normal-border: var(--${token});`;
			case "solid":
				return `--normal-bg: var(--${token}); --normal-text: var(--${token}-foreground); --normal-border: var(--${token});`;
		}
	}

	/** The six corners `sonner-08.tsx` fires into, in its own order. */
	const positions = [
		{ label: "Top Left", position: "top-left" },
		{ label: "Top Center", position: "top-center" },
		{ label: "Top Right", position: "top-right" },
		{ label: "Bottom Left", position: "bottom-left" },
		{ label: "Bottom Center", position: "bottom-center" },
		{ label: "Bottom Right", position: "bottom-right" },
	] as const;

	/* -----------------------------------------------------------------------------------------
	 * The pattern appendix
	 * -----------------------------------------------------------------------------------------
	 *
	 * The sections below this point are the sonner demo set, in its documented
	 * order. Five of the set are not here because the
	 * page already shows them: the basic call (demo 1) is the Usage section and the
	 * Examples row's Default button; the description (demo 2) and the action
	 * (demo 6) are the two halves of the hero demo; the six corners (demo 3)
	 * are the Position section; and the promise (demo 7) is the Examples row's
	 * Promise button.
	 *
	 * Three batch-wide translations, so the sections need not repeat them:
	 *
	 *   - Free-form toasts are `toast.custom(Component)` — svelte-sonner
	 *     takes free-form content as a component or not at all, the constraint the Custom
	 *     content section above already records — so each rich body is a file beside this page,
	 *     the `sonner-avatar-toast.svelte` precedent. `toast.custom` also drops sonner's own
	 *     box (`Toast.svelte` sets `data-styled` false whenever a toast carries a `component`),
	 *     so each body draws its own ground, and each file documents its own colours.
	 *   - upstream's `grid grid-cols-3` button grids flatten to the `flex flex-wrap gap-2` row
	 *     of full-size `white` triggers — the Position section's reasoning, applied batch-wide:
	 *     these cards are the full reading column, not a narrow preview frame.
	 *   - raw palette colours become status tokens, and stock portraits become initials,
	 *     body by body; each colocated file records its own substitutions.
	 */

	/**
	 * demo 4. `classes.icon` lands on the `[data-icon]` wrapper `Toast.svelte`
	 * renders around the type icon, and the Lucide icons `ui/sonner/sonner.svelte` puts there
	 * inherit it as `currentColor` — one class per call recolours the icon and nothing else.
	 * Upstream paints three of the five from Tailwind's raw ramp (`green-500`, `yellow-500`,
	 * `violet-500`); those are the status tokens here, the collapse the Soft/Outline/Solid
	 * sections above make at toast scale, with violet's "system update" reading as `--info`.
	 * Loading is the one type the Examples row above does not fire.
	 */
	const iconVariants = [
		{ label: "Default", show: () => toast("Default notification") },
		{
			label: "Success",
			show: () => toast.success("Operation completed", { classes: { icon: "text-success" } }),
		},
		{
			label: "Error",
			show: () => toast.error("Operation failed", { classes: { icon: "text-destructive" } }),
		},
		{
			label: "Warning",
			show: () => toast.warning("Proceed with caution", { classes: { icon: "text-warning" } }),
		},
		{
			label: "Info",
			show: () => toast.info("System update available", { classes: { icon: "text-info" } }),
		},
		{ label: "Loading", show: () => toast.loading("Processing...") },
	];

	/**
	 * demo 5, verbatim: three timed notices and a persistent one, whose
	 * `duration: Infinity` never schedules a dismiss — which is why it is the one call that
	 * also carries `closeButton`.
	 */
	const durations = [
		{
			label: "2s Duration",
			show: () =>
				toast("Quick notice", { description: "Disappears in 2 seconds.", duration: 2000 }),
		},
		{
			label: "5s Duration",
			show: () =>
				toast("Standard notice", { description: "Disappears in 5 seconds.", duration: 5000 }),
		},
		{
			label: "10s Duration",
			show: () =>
				toast("Extended notice", { description: "Stays for 10 seconds.", duration: 10000 }),
		},
		{
			label: "Persistent",
			show: () =>
				toast("Persistent notice", {
					description: "This toast stays until dismissed.",
					duration: Infinity,
					closeButton: true,
				}),
		},
	];

	/**
	 * demo 10. One `toast.custom()` opens the toast, then the interval re-issues it
	 * every 500ms with the same `id` and a fresh `componentProps.progress` — svelte-sonner's
	 * `create()` updates a toast in place when the id already exists, so each tick re-renders
	 * the body instead of stacking a new one. The duration is `Infinity` while uploading and 3s
	 * once complete, upstream's own timings. The handle lives at page scope so a second click
	 * restarts the simulation instead of racing the previous timer — upstream parks it in a
	 * `useRef` for the same reason, though it never clears the one it overwrites.
	 */
	let uploadInterval: ReturnType<typeof setInterval> | null = null;

	function showUploadToast() {
		let progress = 0;
		const id = toast.custom(SonnerUploadToast, {
			componentProps: { progress },
			duration: Infinity,
		});

		if (uploadInterval) clearInterval(uploadInterval);
		uploadInterval = setInterval(() => {
			progress = Math.min(progress + Math.floor(Math.random() * 15) + 5, 100);

			toast.custom(SonnerUploadToast, {
				id,
				componentProps: { progress },
				duration: progress >= 100 ? 3000 : Infinity,
			});

			if (progress >= 100 && uploadInterval) {
				clearInterval(uploadInterval);
				uploadInterval = null;
			}
		}, 500);
	}

	/**
	 * demo 19. The `icon` option replaces the type icon for one call — the slot
	 * `sonner-icon-toast.svelte` deliberately declines, because there the icon was body content;
	 * here swapping the type icon is exactly what upstream demonstrates. svelte-sonner renders
	 * the option bare (`<toast.icon />`, `Toast.svelte`), so upstream's `className="size-4"` has
	 * nowhere to land; the `*:` child variant on `classes.icon` — the `[data-icon]` wrapper —
	 * sizes the svg back down to the 16px frame `Toaster.svelte` fixes that wrapper at, where
	 * Lucide's unprompted default is 24px.
	 */
	const customIcons = [
		{
			label: "Send Icon",
			show: () =>
				toast("Message sent", {
					description: "Your message has been delivered.",
					icon: SendIcon,
					classes: { icon: "*:size-4" },
				}),
		},
		{
			label: "Download Icon",
			show: () =>
				toast("Download complete", {
					description: "design-assets.zip is ready.",
					icon: DownloadIcon,
					classes: { icon: "*:size-4" },
				}),
		},
		{
			label: "Bookmark Icon",
			show: () =>
				toast("Bookmark added", {
					description: "Saved to your collection.",
					icon: BookmarkIcon,
					classes: { icon: "*:size-4" },
				}),
		},
	];

	/**
	 * demo 21. Four timed frames under one `id` — three loading messages, then the
	 * success frame, whose 4s duration is the first finite one and so the one that finally
	 * schedules a dismiss. Upstream parks the id in a `useRef` but never guards a second click;
	 * the pending timeouts are cleared here instead — the upload section's reasoning — so
	 * re-clicking restarts the sequence rather than leaving an abandoned run rewriting a toast
	 * that no longer completes.
	 */
	let updatableTimeouts: ReturnType<typeof setTimeout>[] = [];

	function showUpdatableToast() {
		for (const pending of updatableTimeouts) clearTimeout(pending);

		const id = toast.custom(SonnerUpdatableToast, {
			componentProps: { message: "Preparing upload..." },
			duration: Infinity,
		});

		updatableTimeouts = [
			setTimeout(() => {
				toast.custom(SonnerUpdatableToast, {
					id,
					componentProps: { message: "Uploading files... 30%" },
					duration: Infinity,
				});
			}, 1000),
			setTimeout(() => {
				toast.custom(SonnerUpdatableToast, {
					id,
					componentProps: { message: "Uploading files... 70%" },
					duration: Infinity,
				});
			}, 2000),
			setTimeout(() => {
				toast.custom(SonnerUpdatableToast, {
					id,
					componentProps: { done: true },
					duration: 4000,
				});
			}, 3000),
		];
	}
</script>

<DocPage title="Sonner">
	{#snippet subtitle()}
		An opinionated toast component for Svelte. It is the transient member of Feedback: a toast is
		raised by a call rather than written into the page, stacks over the viewport with its
		neighbours, and clears itself after four seconds — where an Alert stays in the flow it was
		written into, and a Banner holds its strip at a page edge until it is dismissed. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/sonner"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<!--
				The docs' hero demo, verbatim: a title, a description under it, and an `Undo`
				action. All three are sonner's own model — the classic toast has a header row and
				a body, and no action at all — so nothing here maps onto a `toast-*` variable.
			-->
			<Button
				class={white}
				onclick={() =>
					toast("Event has been created", {
						description: "Sunday, December 03, 2023 at 9:00 AM",
						action: {
							label: "Undo",
							onClick: () => console.info("Undo"),
						},
					})}
			>
				Show Toast
			</Button>
		</Card.Content>
	</Card.Root>

	<DocSection title="Usage">
		{#snippet blurb()}
			The bare form the documentation page shows under Usage — one call, one string, and no options.
			This is the toast closest to the classic theme's own example, which is a single line of text
			in a <code class="text-[87.5%] text-primary">.toast-body</code>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Button class={primary} onclick={() => toast("Hello world")}>Show toast</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Examples">
		{#snippet blurb()}
			The five toast types plus the promise helper. None of them has a classic counterpart:
			<code class="text-[87.5%] text-primary">.toast</code> has one skin, no icon and no loading state,
			so the icons and the colours below are shadcn-svelte's own.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- `flex-wrap` is the docs' layout; `gap-2` is the repo's rhythm, never `space-x-*`. -->
				<div class="flex flex-wrap gap-2">
					{#each examples as example (example.label)}
						<Button class={white} onclick={example.show}>{example.label}</Button>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Custom content">
		{#snippet blurb()}
			the gallery's icon and avatar toasts. Both hand a component to
			<code class="text-[87.5%] text-primary">toast()</code> where a message string would go — svelte-sonner
			renders a non-string title as a component, which is the theme's only form for free-form content,
			so each body is a file of its own beside this page.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap gap-2">
					<Button class={white} onclick={() => toast(SonnerIconToast)}>Toast with icon</Button>
					<Button class={white} onclick={() => toast(SonnerAvatarToast)}>Toast with avatar</Button>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Close button">
		{#snippet blurb()}
			The one addition with a real classic counterpart:
			<code class="text-[87.5%] text-primary">.btn-close</code> is the only control the classic
			theme's toast has, sitting at the end of its header row. sonner's is a 20px chip hung off the
			top-left corner of the box instead. The package already gives it the toast's colours in dark
			mode and leaves light mode on two hardcoded greys, which shows on a skinned toast — a
			near-black glyph in a near-white ring on a solid ground — so
			<code class="text-[87.5%] text-primary">app.css</code> settles both modes on the toast's own colours
			and adds the classic opacity pair.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Button
					class={white}
					onclick={() => toast("Action completed successfully!", { closeButton: true })}
				>
					Closable Toast
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Position">
		{#snippet blurb()}
			A per-toast <code class="text-[87.5%] text-primary">position</code>. Five of the six make
			sonner mount a list of its own for that corner; the sixth is the app's own default, so a
			Bottom Right toast joins the list every other section on this page fires into. The classic
			framework has no equivalent option — a
			<code class="text-[87.5%] text-primary">.toast-container</code> is placed by position utilities
			in the markup, once, for every toast it holds.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					Upstream stacks these in `grid grid-cols-2`, which suits the narrow preview frame
					it renders them in. This card is the full reading column, and the Examples
					section above already sets the rhythm for a row of six.
				-->
				<div class="flex flex-wrap gap-2">
					{#each positions as item (item.position)}
						<Button
							class={white}
							onclick={() => toast("Action completed successfully!", { position: item.position })}
						>
							{item.label}
						</Button>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Soft">
		{#snippet blurb()}
			The tinted skin, keyed to
			<code class="text-[87.5%] text-primary">--{"{"}status{"}"}-subtle</code> — the ground The
			classic theme's own soft badges sit on — with the contrast-walked
			<code class="text-[87.5%] text-primary">-subtle-foreground</code> ink as type and the full-strength
			colour as border. Nothing here names a colour, so all twelve palettes follow.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap gap-2">
					{#each statuses as status (status.token)}
						<Button class={white} onclick={() => status.show(skin("soft", status.token))}>
							{status.label}
						</Button>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Outline">
		{#snippet blurb()}
			Type and border only, on the ground the toast already stands on. Upstream fills with
			<code class="text-[87.5%] text-primary">--background</code>; that token is the page here
			rather than the panel, so <code class="text-[87.5%] text-primary">--popover</code> is what keeps
			a toast reading as a surface floating above it.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap gap-2">
					{#each statuses as status (status.token)}
						<Button class={white} onclick={() => status.show(skin("outline", status.token))}>
							{status.label}
						</Button>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Solid">
		{#snippet blurb()}
			The filled skin. Its type is
			<code class="text-[87.5%] text-primary">--{"{"}status{"}"}-foreground</code> rather than the
			white upstream hardcodes, so the warning toast comes out dark on yellow — the answer the
			classic <code class="text-[87.5%] text-primary">color-contrast()</code> gives for that ground, in
			both modes.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap gap-2">
					{#each statuses as status (status.token)}
						<Button class={white} onclick={() => status.show(skin("solid", status.token))}>
							{status.label}
						</Button>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Toast variants with colored icons">
		{#snippet blurb()}
			The five type toasts again, each recoloured per call through sonner's
			<code class="text-[87.5%] text-primary">classes.icon</code> slot — plus Loading, the one type the
			Examples row above leaves out. The class recolours only the icon; the toast around it stays on the
			neutral skin.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap gap-2">
					{#each iconVariants as item (item.label)}
						<Button class={white} onclick={item.show}>{item.label}</Button>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Toast duration options">
		{#snippet blurb()}
			A per-toast <code class="text-[87.5%] text-primary">duration</code>, from two seconds to
			<code class="text-[87.5%] text-primary">Infinity</code> — the value that never schedules a
			dismiss, which is why the persistent call is the one that also asks for a close button. the
			classic counterpart is <code class="text-[87.5%] text-primary">data-bs-delay</code> on
			<code class="text-[87.5%] text-primary">.toast</code>, with
			<code class="text-[87.5%] text-primary">autohide</code> off for the persistent case.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap gap-2">
					{#each durations as item (item.label)}
						<Button class={white} onclick={item.show}>{item.label}</Button>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Toast with custom close and cancel buttons">
		{#snippet blurb()}
			The <code class="text-[87.5%] text-primary">action</code> /
			<code class="text-[87.5%] text-primary">cancel</code> pair — sonner renders both as chips in the
			toast's footer row, the action inverted and the cancel on the muted ground, so one toast can carry
			a confirm/dismiss choice without any custom body.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Button
					class={white}
					onclick={() =>
						toast("Confirm deletion", {
							description: "This item will be permanently deleted. This action cannot be undone.",
							action: {
								label: "Delete",
								onClick: () => toast.success("Item deleted"),
							},
							cancel: {
								label: "Cancel",
								onClick: () => {},
							},
						})}
				>
					Confirm Action
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Toast with custom rich content">
		{#snippet blurb()}
			The first of the <code class="text-[87.5%] text-primary">toast.custom()</code> bodies: a user
			message with an avatar, a timestamp and a Dismiss/Reply pair, drawn on the popover ground the
			standard toast stands on. The body is a colocated file, as every custom body on this page is —
			<code class="text-[87.5%] text-primary">sonner-user-message-toast.svelte</code> carries its reasoning.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Button class={white} onclick={() => toast.custom(SonnerUserMessageToast)}>
					User Message Toast
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Toast with upload progress simulation">
		{#snippet blurb()}
			A toast that updates in place: the page re-issues
			<code class="text-[87.5%] text-primary">toast.custom()</code> with the same
			<code class="text-[87.5%] text-primary">id</code> and a fresh
			<code class="text-[87.5%] text-primary">componentProps.progress</code> every half-second, and
			svelte-sonner re-renders the body instead of stacking a new toast. Once the upload completes,
			the duration drops from <code class="text-[87.5%] text-primary">Infinity</code> to three seconds
			and the toast dismisses itself.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Button class={white} onclick={showUploadToast}>Upload Toast</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Toast with status alert markup">
		{#snippet blurb()}
			A deployment summary as a toast: a status dot, three key/value rows and a View Logs / Open
			Site pair. The dot is <code class="text-[87.5%] text-primary">--success</code> where upstream
			writes a raw green —
			<code class="text-[87.5%] text-primary">sonner-deployment-toast.svelte</code>
			records the substitutions.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Button class={white} onclick={() => toast.custom(SonnerDeploymentToast)}>
					Deployment Toast
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Custom accent border toast">
		{#snippet blurb()}
			The popover box with its left edge thickened into a coloured accent —
			<code class="text-[87.5%] text-primary">--info</code> here, where upstream writes a raw blue, since
			an update notice is exactly what the info token names.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Button class={white} onclick={() => toast.custom(SonnerAccentToast)}>
					Accent Border Toast
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Custom invert success toast">
		{#snippet blurb()}
			The first of the five invert bodies: the page's own colours swapped, so the toast is dark on
			light pages and light on dark ones. A dedicated
			<code class="text-[87.5%] text-primary">bg-invert</code> token would do this; this theme has
			none, and <code class="text-[87.5%] text-primary">bg-foreground text-background</code> is the
			same swap said in tokens the theme does have —
			<code class="text-[87.5%] text-primary">sonner-invert-success-toast.svelte</code> carries the derivation
			the other four reuse.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Button class={white} onclick={() => toast.custom(SonnerInvertSuccessToast)}>
					Invert Success Toast
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Custom invert error toast with details">
		{#snippet blurb()}
			The invert ground carrying a build failure: two mono error lines behind a separator, a ghosted
			View Logs and a solid destructive Retry — the house negative status where upstream hand-tunes
			a red ladder.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Button class={white} onclick={() => toast.custom(SonnerInvertErrorToast)}>
					Invert Error Toast
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Custom invert info toast with avatar">
		{#snippet blurb()}
			A collaboration invite on the invert ground, with initials where upstream loads a photograph —
			the repo-wide answer — and the house Button's default variant where upstream hand-builds a
			solid blue Accept.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Button class={white} onclick={() => toast.custom(SonnerInvertInviteToast)}>
					Invert Invite Toast
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Custom invert warning toast with countdown">
		{#snippet blurb()}
			The countdown is the ten-second <code class="text-[87.5%] text-primary">duration</code>
			passed here at the call site — the body itself only warns. Extending dismisses this toast and fires
			a success toast in its place.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Button
					class={white}
					onclick={() => toast.custom(SonnerInvertWarningToast, { duration: 10000 })}
				>
					Invert Warning Toast
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Multi-action invert toast with avatar group">
		{#snippet blurb()}
			A pull-request summary with three overlapped reviewers and a View/Merge pair. Upstream
			hand-rolls the overlap; the house
			<code class="text-[87.5%] text-primary">Avatar.Group</code> hardcodes the same
			<code class="text-[87.5%] text-primary">-space-x-2</code>, and only its ring needs re-pointing
			at the invert ground.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Button class={white} onclick={() => toast.custom(SonnerInvertMergeToast)}>
					PR Merge Toast
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Toast with close button on top-right">
		{#snippet blurb()}
			The Close button section above shows sonner's default placement — a chip hung off the top-left
			corner. This call moves it to the top-right through
			<code class="text-[87.5%] text-primary">classes.closeButton</code>, with upstream's own
			important-flagged offsets, since the package positions the chip on the element itself (<code
				class="text-[87.5%] text-primary">--toast-close-button-start</code
			>
			and friends in
			<code class="text-[87.5%] text-primary">Toaster.svelte</code>) and only
			<code class="text-[87.5%] text-primary">!</code> outranks an inline-adjacent declaration from a
			utility class.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Button
					class={white}
					onclick={() =>
						toast("File uploaded successfully", {
							description: "report-2025.pdf has been saved to your documents.",
							closeButton: true,
							classes: {
								closeButton: "left-auto! -right-4! -top-1!",
							},
						})}
				>
					Toast with Close Button
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Toast with custom icon">
		{#snippet blurb()}
			The <code class="text-[87.5%] text-primary">icon</code> option, replacing the type icon for
			one call — the slot the Custom content section deliberately avoids, because there the icon was
			body content; here swapping it is the point. The option renders the component bare, so each
			call restores upstream's 16px through
			<code class="text-[87.5%] text-primary">classes.icon</code>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="flex flex-wrap gap-2">
					{#each customIcons as item (item.label)}
						<Button class={white} onclick={item.show}>{item.label}</Button>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Custom integration toast">
		{#snippet blurb()}
			An integration card as a toast: an icon tile, an Active status, a separator over a sync
			summary, and a Configure / Open Dashboard pair. The tile is
			<code class="text-[87.5%] text-primary">bg-primary</code> where upstream paints a raw
			violet-to-purple gradient —
			<code class="text-[87.5%] text-primary">sonner-integration-toast.svelte</code> records the substitutions.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Button class={white} onclick={() => toast.custom(SonnerIntegrationToast)}>
					Integration Toast
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Updatable toast with ID">
		{#snippet blurb()}
			The upload section's update-in-place mechanics without the progress bar: four timed re-issues
			of <code class="text-[87.5%] text-primary">toast.custom()</code> under one
			<code class="text-[87.5%] text-primary">id</code> — three loading frames, then the success frame,
			the first whose duration is finite and so the one that dismisses.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Button class={white} onclick={showUpdatableToast}>Updatable Toast</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
