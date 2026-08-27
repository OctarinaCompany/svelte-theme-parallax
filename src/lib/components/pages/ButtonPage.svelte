<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";
	import {
		buttonContextualOutline,
		buttonContextualSolid,
		buttonVariants,
	} from "$lib/components/ui/button/index.js";
	import { cn } from "$lib/utils.js";
	import BookmarkIcon from "@lucide/svelte/icons/bookmark";
	import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
	import StarIcon from "@lucide/svelte/icons/star";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Button component page.
	 *
	 * ICONS. The classic theme's examples use Feather (`fe-bookmark`, `fe-star`, `fe-check-circle`),
	 * loaded as an icon font. This codebase uses Lucide, which is Feather's maintained
	 * successor and carries the same glyphs under renamed exports — so the icons here are
	 * the same drawings, not lookalikes: `fe-check-circle` is `circle-check`.
	 */

	/**
	 * Geometry, per size. Every number is `input-btn-*` from the reference stylesheet, and the
	 * heights are those values resolved rather than guessed:
	 *
	 *   base  15px x 1.5 line-height + 2 x .5rem padding + 2 x 1px border = 40.5px -> h-10
	 *   lg    15px x 1.5             + 2 x .75rem        + 2px           = 48.5px -> h-12
	 *   sm    13px x 1.75            + 2 x .125rem       + 2px           = 28.75px -> h-7
	 *
	 * The `line-height` differences are what make `sm` shorter than a naive reading suggests:
	 * the reference stylesheet sets `btn-line-height-sm: line-height-sm` (1.75), NOT the base 1.5.
	 *
	 * SINCE THE RAMP TOKENS these heights are no longer this page's private truth: the
	 * component's own size classes consume `--control-h-default`/`--control-h-lg` — the same
	 * 40.5/48.5 rounded the same way — so `base` and `lg` here restate what a plain `<Button>`
	 * and `<Button size="lg">` now render; the recipes keep the explicit `h-10`/`h-12`
	 * because `cn()` composes them over the default variant's token class. `sm` is the one
	 * real difference left: the classic theme's exact 28.75px against the ramp's 32px, the divergence
	 * the `--control-h-sm` comment in `app.css` records.
	 *
	 * `font-normal` is `btn-font-weight: font-weight-normal` against shadcn's `font-medium`,
	 * and applies at every size. The radii are `border-radius-{sm,,lg}` — the classic framework changes
	 * the corner with the size, which shadcn only does below `sm`.
	 */
	const size = {
		lg: "h-12 rounded-lg px-5 text-sm font-normal",
		base: "h-10 rounded-md px-3 text-sm font-normal",
		sm: "h-7 rounded-sm px-2 text-xs font-normal",
	} as const;

	/*
	 * The solid and outline contextual recipes this page defined first now live in
	 * `ui/button/button-contextual.ts` verbatim — the WHY of every value (hover shading,
	 * load-bearing borders, the `light`/`dark` mode splits) is documented there, once.
	 */

	/**
	 * `.btn-link` — `link-color` type on nothing, hovering to `link-hover-color`.
	 *
	 * That one is `darken(link-color, 15%)` = #1657AF, and `darken()` moves LIGHTNESS in HSL,
	 * which no CSS function reproduces: `color-mix()` interpolates in a colour space instead.
	 * The 70/30 mix below lands at #1F56A1, close enough to be indistinguishable and honest
	 * about being a token rather than a copied hex.
	 *
	 * NO UNDERLINE, at rest or on hover. The classic stock `.btn-link` is underlined, which is
	 * what an earlier version of this file restored — but the classic theme sets `link-decoration: none`
	 * and `link-hover-decoration: none`, and the compiled `.btn-link` ends with
	 * `text-decoration: none`. Measured on the classic theme's own page: `text-decoration-line: none`.
	 * shadcn's `link` variant underlines on hover, so that has to be cancelled too.
	 */
	const link =
		"bg-transparent text-primary no-underline hover:bg-transparent hover:no-underline hover:text-[color-mix(in_srgb,var(--primary)_70%,black)]";

	/**
	 * `.btn-white` — the classic theme's answer to the classic `light` variant not working over light
	 * grounds. It is the card surface with a visible outline, at every size.
	 *
	 * The border is one grey step off in both modes: the classic theme asks for `gray-300` (#E3EBF6)
	 * in light and `gray-600-dark` (#244166) in dark, and `--border` holds `gray-200` and
	 * `gray-700-dark`. Neither grey exists as a token here, and inventing two for a single
	 * button variant costs more than the difference is worth — the alternative, writing the
	 * hex, breaks the "semantic tokens, never raw colours" house rule.
	 */
	const white =
		"border-border bg-card text-card-foreground hover:bg-accent dark:hover:bg-background";

	/**
	 * `.btn-rounded-circle` — `--bs-btn-padding-x: 0`, a 50% radius, and a width computed to
	 * equal the height, so the button is a circle whatever its size. The heights are the ones
	 * derived in {@link size}, which is why these are the same three numbers.
	 */
	const circle = {
		lg: "size-12 rounded-full p-0 text-sm font-normal",
		base: "size-10 rounded-full p-0 text-sm font-normal",
		sm: "size-7 rounded-full p-0 text-xs font-normal",
	} as const;

	/**
	 * Compose a classic button on top of shadcn's base.
	 *
	 * `cn()` is load-bearing rather than cosmetic here: `buttonVariants()` emits its default
	 * variant, so `bg-primary`, `text-sm`, `font-medium`, `h-9` and `hover:bg-primary/80` are
	 * all already present. Interpolating the overrides into the string instead would leave BOTH
	 * classes on the element, and the winner would be decided by their order in the generated
	 * stylesheet rather than by what this page asked for. `cn()` runs tailwind-merge, which
	 * evicts the loser.
	 */
	const btn = (...classes: string[]) => cn(buttonVariants(), ...classes);

	const solidEntries = Object.entries(buttonContextualSolid);
	const outlineEntries = Object.entries(buttonContextualOutline);

	/** The `.btn-group-toggle` demo's selection. The classic theme ships the first radio `checked`. */
	let toggled = $state("option1");

	/*
	 * -----------------------------------------------------------------------------------------
	 * From here down: the button demo set, appended in
	 * its documented order. Unlike the material above, which re-skins
	 * `buttonVariants` into the classic geometry, these use the registry `Button` exactly as
	 * shipped — the stock variants and sizes are what the demos document.
	 *
	 * Two mappings apply throughout:
	 *
	 *   - every icon resolves to a `lucide` name,
	 *     this repository's icon set.
	 *   - an icon beside a label takes `data-icon="inline-start"` / `"inline-end"`, so the
	 *     size variant's `has-data-[icon=*]` rules can trim the padding on the icon's side.
	 *     Icon-only buttons have no side to trim and carry nothing.
	 */
	import { Button } from "$lib/components/ui/button/index.js";
	import { Spinner } from "$lib/components/ui/spinner/index.js";
	import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
	import ArrowUpRightIcon from "@lucide/svelte/icons/arrow-up-right";
	import BellIcon from "@lucide/svelte/icons/bell";
	import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
	import ChevronUpIcon from "@lucide/svelte/icons/chevron-up";
	import CircleAlertIcon from "@lucide/svelte/icons/circle-alert";
	import CircleQuestionMarkIcon from "@lucide/svelte/icons/circle-question-mark";
	import CloudDownloadIcon from "@lucide/svelte/icons/cloud-download";
	import ExternalLinkIcon from "@lucide/svelte/icons/external-link";
	import LogOutIcon from "@lucide/svelte/icons/log-out";
	import PlayIcon from "@lucide/svelte/icons/play";
	import PlusIcon from "@lucide/svelte/icons/plus";
	import SearchIcon from "@lucide/svelte/icons/search";
	import SendIcon from "@lucide/svelte/icons/send";
	import SettingsIcon from "@lucide/svelte/icons/settings";
	import Settings2Icon from "@lucide/svelte/icons/settings-2";
	import Trash2Icon from "@lucide/svelte/icons/trash-2";
	import XIcon from "@lucide/svelte/icons/x";
	import ZapIcon from "@lucide/svelte/icons/zap";

	/** demo 35 — whether the more/less ghost toggle is expanded. */
	let showMoreExpanded = $state(false);

	/**
	 * demo 36 — social sign-in marks, upstream `@remixicon/react` fill-style components.
	 * Lucide carries no brand icons (the GitHub note in the c-button-16 section explains why), so
	 * these are the standard 24x24 single-path brand marks inlined the same way, drawn in
	 * `currentColor` and sized by the button's own `[&_svg]` rules. The GitHub path is the one the
	 * c-button-16 section already inlines.
	 */
	const socialLoginIcons = [
		{
			label: "Sign in with Google",
			path: "M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z",
		},
		{
			label: "Sign in with Facebook",
			path: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
		},
		{
			label: "Sign in with X",
			path: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
		},
		{
			label: "Sign in with GitHub",
			path: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
		},
		{
			label: "Sign in with LinkedIn",
			path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
		},
		{
			label: "Sign in with Instagram",
			path: "M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z",
		},
	];

	/*
	 * Imports and state for the pattern demos (demo 37 onward): counts, badges,
	 * shortcut hints, clipboard feedback and hover reveals composed on the stock button.
	 */
	import * as Kbd from "$lib/components/ui/kbd/index.js";
	import * as Tooltip from "$lib/components/ui/tooltip/index.js";
	import { Badge } from "$lib/components/ui/badge/index.js";
	import CheckIcon from "@lucide/svelte/icons/check";
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import CopyIcon from "@lucide/svelte/icons/copy";
	import CreditCardIcon from "@lucide/svelte/icons/credit-card";
	import MailIcon from "@lucide/svelte/icons/mail";
	import MenuIcon from "@lucide/svelte/icons/menu";
	import ThumbsUpIcon from "@lucide/svelte/icons/thumbs-up";

	/**
	 * demo 41 / demo 42 — the copy-to-clipboard behaviour, inlined rather than hooked. It
	 * is one `writeText` plus a 1500ms reset, and the two demos need independent feedback, so
	 * each gets its own `$state` flag and timer instead of a shared module. `writeText` may
	 * reject outside a secure context; the demo's point is the label swap, so the promise is
	 * fire-and-forget.
	 */
	let copyLabelCopied = $state(false);
	let copyLabelTimer: ReturnType<typeof setTimeout> | undefined;
	function copyLabelLink() {
		navigator.clipboard?.writeText("https://example.com").catch(() => {});
		copyLabelCopied = true;
		clearTimeout(copyLabelTimer);
		copyLabelTimer = setTimeout(() => (copyLabelCopied = false), 1500);
	}

	let copyIconCopied = $state(false);
	let copyIconTimer: ReturnType<typeof setTimeout> | undefined;
	function copyIconLink() {
		navigator.clipboard?.writeText("https://example.com").catch(() => {});
		copyIconCopied = true;
		clearTimeout(copyIconTimer);
		copyIconTimer = setTimeout(() => (copyIconCopied = false), 1500);
	}

	/** demo 43 — whether the animated hamburger toggle shows the close mark. */
	let hamburgerOpen = $state(false);

	/**
	 * demo 44 — idle → loading → success → idle. Upstream resets to idle from a
	 * `useEffect` watching the status; here the success timeout schedules the reset directly,
	 * which is the same 900ms + 2000ms cycle without an effect.
	 */
	type AsyncSaveStatus = "idle" | "loading" | "success";
	let asyncSaveStatus: AsyncSaveStatus = $state("idle");
	function startAsyncSave() {
		if (asyncSaveStatus !== "idle") return;
		asyncSaveStatus = "loading";
		setTimeout(() => {
			asyncSaveStatus = "success";
			setTimeout(() => (asyncSaveStatus = "idle"), 2000);
		}, 900);
	}

	/*
	 * Imports for the avatar and theme-toggle demos (demo 55 onward).
	 */
	import * as Avatar from "$lib/components/ui/avatar/index.js";
	import MoonIcon from "@lucide/svelte/icons/moon";
	import SunIcon from "@lucide/svelte/icons/sun";
	import { href } from "$lib/hooks/route.svelte.js";

	/**
	 * demo 59 — the labelled "Login with" stack. Upstream paints each Remix brand mark
	 * in its brand hex (`#DB4437`, `#1877f2`, ...) with a `dark:` override; raw colours are
	 * banned here, so the marks reuse the `currentColor` paths already inlined for
	 * c-button-36 in {@link socialLoginIcons}, picked out by provider name — the same
	 * flattening the icon-only section applied.
	 */
	const loginWithProviders = ["Google", "X", "Facebook", "GitHub"].map((name) => ({
		name,
		path: socialLoginIcons.find((icon) => icon.label === `Sign in with ${name}`)!.path,
	}));

	/**
	 * demo 61 — which face the theme toggle shows. Upstream flips a local
	 * `light`/`dark` string without touching the real theme, and so does this theme: a
	 * boolean carries the same two states.
	 */
	let themeToggleDark = $state(false);
</script>

<DocPage title="Button">
	{#snippet subtitle()}
		Buttons for actions in forms, dialogs and more, with support for multiple variants, sizes and
		states. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/button"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<!--
		The classic theme opens with three unlabelled cards — sizes, variants, toggle group — separated
		only by `.card`'s own `margin-bottom` (spacer). `gap-6` is that 1.5rem.
	-->
	<div class="flex flex-col gap-6">
		<Card.Root>
			<Card.Content class="flex flex-wrap items-center gap-2">
				<button type="button" class={btn(size.lg, buttonContextualSolid.Primary)}>
					Large button
				</button>
				<button type="button" class={btn(size.base, buttonContextualSolid.Primary)}>
					Base button
				</button>
				<button type="button" class={btn(size.sm, buttonContextualSolid.Primary)}>
					Small button
				</button>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Content class="flex flex-wrap gap-2">
				{#each solidEntries as [label, variant] (label)}
					<button type="button" class={btn(size.base, variant)}>{label}</button>
				{/each}
				<button type="button" class={btn(size.base, link)}>Link</button>
				{#each outlineEntries as [label, variant] (label)}
					<button type="button" class={btn(size.base, variant)}>{label}</button>
				{/each}
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Content>
				<!--
					The classic theme's `.btn-group-toggle` is NOT a joined button group: it is three separate
					`.btn-white` labels driven by hidden radios, so `spacing` keeps them apart rather
					than merging their corners. Checked state is `background-color: input-bg;
					border-color: input-focus-border-color; color: primary` — the fill does not
					change, only the outline and the type.
				-->
				<ToggleGroup.Root type="single" spacing={2} bind:value={toggled}>
					{#each [{ value: "option1", label: "Active" }, { value: "option2", label: "Radio" }, { value: "option3", label: "Radio" }] as option (option.value)}
						<ToggleGroup.Item
							value={option.value}
							class="{size.base} {white} rounded-md border data-[state=on]:border-ring data-[state=on]:bg-card data-[state=on]:text-primary"
						>
							<CircleCheckIcon />
							{option.label}
						</ToggleGroup.Item>
					{/each}
				</ToggleGroup.Root>
			</Card.Content>
		</Card.Root>
	</div>

	<DocSection title="White">
		{#snippet blurb()}
			A button on the card ground rather than on a tint — the variant to reach for when a muted fill
			would disappear against the surface behind it.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<button type="button" class={btn(size.base, white)}>Button white</button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Rounded circle">
		{#snippet blurb()}
			Useful for single character or emoji buttons, you can turn any button into a circle.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-wrap items-center gap-2">
				<button type="button" class={btn(circle.sm, white)}>+</button>
				<button type="button" class={btn(circle.base, white)}>+</button>
				<button type="button" class={btn(circle.lg, white)}>+</button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Icon">
		{#snippet blurb()}
			A combination of the standard button component and a Lucide icon.
		{/snippet}
		<Card.Root>
			<Card.Content class="flex flex-wrap items-center gap-2">
				<button type="button" aria-label="Bookmark" class={btn(size.base, white)}>
					<BookmarkIcon />
				</button>
				<button
					type="button"
					aria-label="Bookmark"
					class={btn(size.base, buttonContextualSolid.Primary)}
				>
					<BookmarkIcon />
				</button>
				<button type="button" aria-label="Star" class={btn(circle.base, white)}>
					<StarIcon />
				</button>
				<button
					type="button"
					aria-label="Star"
					class={btn(circle.base, buttonContextualSolid.Primary)}
				>
					<StarIcon />
				</button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- The six stock variants, one per section (demo 1 to
		demo 6). -->
	<DocSection title="Default button">
		<Card.Root>
			<Card.Content>
				<Button>Default</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Secondary button">
		<Card.Root>
			<Card.Content>
				<Button variant="secondary">Secondary</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Outline button">
		<Card.Root>
			<Card.Content>
				<Button variant="outline">Outline</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Ghost button">
		<Card.Root>
			<Card.Content>
				<Button variant="ghost">Ghost</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Destructive button">
		<Card.Root>
			<Card.Content>
				<Button variant="destructive">Destructive</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Link button variant">
		<Card.Root>
			<Card.Content>
				<Button variant="link">Link</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- The size ramp (demo 7 to demo 9). `xs` sits below the sm/default/lg
		control ramp — 24px, for toolbar-density spots — and the registry button ships it. -->
	<DocSection title="Extra small button">
		<Card.Root>
			<Card.Content>
				<Button size="xs">Button</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Small button">
		<Card.Root>
			<Card.Content>
				<Button size="sm">Button</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Large button">
		<Card.Root>
			<Card.Content>
				<Button size="lg">Button</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Disabled button">
		<Card.Root>
			<Card.Content>
				<!--
					demo 10 renders a plain `<Button>Button</Button>` — the `disabled` its own
					title and description promise never made it into the file. The attribute is
					restored here; a second stock default button would document nothing.
				-->
				<Button disabled>Button</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Icon button">
		{#snippet blurb()}
			An icon-only button keeps its accessible name in <code>aria-label</code>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 11 -->
				<Button size="icon" aria-label="Search">
					<SearchIcon />
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button with an icon on the right">
		<Card.Root>
			<Card.Content>
				<!-- demo 12 -->
				<Button>
					Get Started
					<ArrowRightIcon data-icon="inline-end" />
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button in a loading state">
		<Card.Root>
			<Card.Content>
				<!--
					demo 13 — the `Spinner` is the Lucide arc under `animate-spin`,
					this repository's own. The Spinner page's loading
					card documents why nothing here needs a size or a gap of its own.
				-->
				<Button disabled>
					<Spinner data-icon="inline-start" />
					Please wait
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button with an icon on the left">
		<Card.Root>
			<Card.Content>
				<!-- demo 14 -->
				<Button>
					<CloudDownloadIcon data-icon="inline-start" />
					Download
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button with an invalid state highlight">
		{#snippet blurb()}
			<code>aria-invalid</code> swaps the border and focus ring to the destructive tokens — the base class
			handles it, no variant needed.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 15 -->
				<Button aria-invalid="true">Invalid State</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Secondary button with an icon on the left">
		<Card.Root>
			<Card.Content>
				<!--
					demo 16 asks for a GitHub glyph. Lucide dropped its brand icons, so the
					mark is inlined (the standard 24x24 GitHub path, `currentColor`); the button's
					`[&_svg]` rules size it exactly as they would a Lucide import.
				-->
				<Button variant="secondary">
					<svg data-icon="inline-start" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path
							d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
						/>
					</svg>
					Github
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Secondary button with an icon on the right">
		<Card.Root>
			<Card.Content>
				<!-- demo 17 -->
				<Button variant="secondary">
					Open Project
					<ExternalLinkIcon data-icon="inline-end" />
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Outline button with an icon on the left">
		<Card.Root>
			<Card.Content>
				<!-- demo 18 -->
				<Button variant="outline">
					<PlusIcon data-icon="inline-start" />
					Add Item
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Outline button with an icon on the right">
		<Card.Root>
			<Card.Content>
				<!-- demo 19 -->
				<Button variant="outline">
					Options
					<Settings2Icon data-icon="inline-end" />
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Ghost button with an icon on the left">
		<Card.Root>
			<Card.Content>
				<!-- demo 20 -->
				<Button variant="ghost">
					<SettingsIcon data-icon="inline-start" />
					Settings
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Ghost button with an icon on the right">
		<Card.Root>
			<Card.Content>
				<!-- demo 21 -->
				<Button variant="ghost">
					Logout
					<LogOutIcon data-icon="inline-end" />
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Destructive button with an icon on the left">
		<Card.Root>
			<Card.Content>
				<!-- demo 22 -->
				<Button variant="destructive">
					<Trash2Icon data-icon="inline-start" />
					Delete Account
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Destructive button with an icon on the right">
		<Card.Root>
			<Card.Content>
				<!-- demo 23 -->
				<Button variant="destructive">
					Confirm Removal
					<CircleAlertIcon data-icon="inline-end" />
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- The icon-only size ramp (demo 24 to demo 26) — the square `icon-*`
		counterparts of the labelled xs/sm/lg sizes above. -->
	<DocSection title="Extra small icon button">
		<Card.Root>
			<Card.Content>
				<Button size="icon-xs" variant="outline" aria-label="Close">
					<XIcon />
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Small icon button">
		<Card.Root>
			<Card.Content>
				<Button size="icon-sm" variant="ghost" aria-label="Notifications">
					<BellIcon />
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Large (lg) icon-only button">
		<Card.Root>
			<Card.Content>
				<Button size="icon-lg" aria-label="Play">
					<PlayIcon />
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button rendered as a Next.js Link">
		{#snippet blurb()}
			An <code>href</code> renders the button as an anchor — same look, native link semantics.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 27 wraps a Next.js `<Link>` via Radix's `asChild`. This registry
					button has no `asChild`; passing `href` makes it render an `<a>` instead, which
					is the same demo. The link points at this page's own route rather than at
					upstream's `href="#"` — `BreadcrumbPage.svelte` states the gallery's rule.
				-->
				<Button href={href("/components/button")}>Back to Home</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Link button with an icon on the left">
		<Card.Root>
			<Card.Content>
				<!-- demo 28 — the help glyph is `circle-question-mark` in current
					Lucide, the post-rename name of the classic HelpCircle. -->
				<Button variant="link">
					<CircleQuestionMarkIcon data-icon="inline-start" />
					Help Center
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Link button with an icon on the right">
		<Card.Root>
			<Card.Content>
				<!--
					demo 29 adds its own `group/link-button` scope just to rotate the arrow
					on hover. The registry button already names itself `group/button` in its base
					class, so the icon hooks into that instead of adding a second group.
				-->
				<Button variant="link">
					View Documentation
					<ArrowUpRightIcon
						data-icon="inline-end"
						class="transition-transform group-hover/button:rotate-45"
					/>
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Large button with an icon on the left">
		<Card.Root>
			<Card.Content>
				<!-- demo 30 -->
				<Button size="lg">
					<ZapIcon data-icon="inline-start" />
					Upgrade Now
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Large button with an icon on the right">
		<Card.Root>
			<Card.Content>
				<!-- demo 31 -->
				<Button size="lg">
					Send Message
					<SendIcon data-icon="inline-end" />
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- `aria-invalid` on the transparent variants (demo 32, demo 33): the base
		class paints the destructive border and ring whatever the variant, so outline and ghost
		need nothing extra. -->
	<DocSection title="Outline button with an invalid state">
		<Card.Root>
			<Card.Content>
				<Button variant="outline" aria-invalid="true">Invalid Outline</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Ghost button with an invalid state">
		<Card.Root>
			<Card.Content>
				<Button variant="ghost" aria-invalid="true">Invalid Ghost</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Ghost button with more/less toggle">
		<Card.Root>
			<Card.Content>
				<!-- demo 35 — label and chevron both follow the expanded state; the
					ternary render becomes `{#if}`. -->
				<Button variant="ghost" onclick={() => (showMoreExpanded = !showMoreExpanded)}>
					{showMoreExpanded ? "Show less" : "Show more"}
					{#if showMoreExpanded}
						<ChevronUpIcon data-icon="inline-end" />
					{:else}
						<ChevronDownIcon data-icon="inline-end" />
					{/if}
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Social login buttons with Remix icons">
		{#snippet blurb()}
			Icon-only outline buttons carrying inlined brand marks — each one's accessible name lives in <code
				>aria-label</code
			>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 36 — the marks are inlined paths; `socialLoginIcons` in the script
					block says why. -->
				<div class="flex flex-wrap items-center gap-2">
					{#each socialLoginIcons as icon (icon.label)}
						<Button variant="outline" size="icon" aria-label={icon.label}>
							<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
								<path d={icon.path} />
							</svg>
						</Button>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Outline like button with count">
		<Card.Root>
			<Card.Content>
				<!--
					demo 37 — despite the upstream title, the demo renders the DEFAULT
					variant. The count sits behind a hairline drawn by a `before:` pseudo in
					`currentColor/60` — a token-free colour that follows whatever variant the
					button wears — and `pe-0` hands the right edge to the count's own padding.
				-->
				<Button class="pe-0">
					<ThumbsUpIcon data-icon="inline-start" />
					Like
					<span
						class="relative ms-1 px-3 text-xs font-medium opacity-80 before:absolute before:inset-0 before:left-0 before:w-px before:bg-[currentColor]/60"
					>
						456
					</span>
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Star button with count">
		<Card.Root>
			<Card.Content>
				<!-- demo 38 — the outline twin of the count pattern above: over the
					outline variant the hairline is `border` and the count `muted-foreground`. -->
				<Button variant="outline" class="pe-0">
					<StarIcon data-icon="inline-start" />
					Star
					<span
						class="relative ms-1 px-2 text-xs font-medium text-muted-foreground before:absolute before:inset-0 before:left-0 before:w-px before:bg-border"
					>
						589
					</span>
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button with an unread badge">
		{#snippet blurb()}
			The count floats over the corner; the accessible total lives in the button's
			<code>aria-label</code>.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 39 — the ask is a solid `destructive` Badge at
					`size="sm"`. The house badge is single-height and its `destructive` variant is
					the /10 wash (badge.svelte says why that stays); nearest variant by name and
					by status, so both mappings land there.
				-->
				<Button variant="outline" class="relative gap-2" aria-label="Inbox (8 unread)">
					<MailIcon data-icon="inline-start" />
					Inbox
					<Badge
						variant="destructive"
						class="absolute -top-1.5 -right-2 rounded-full px-1"
						aria-hidden="true"
					>
						8
					</Badge>
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button with icon, label, and shortcut keys">
		<Card.Root>
			<Card.Content>
				<!-- demo 40 — the Kbd pair is decorative (`aria-hidden`); the shortcut is
					spelled out in the `aria-label` instead. -->
				<Button variant="outline" aria-label="Search (Command K)">
					<SearchIcon data-icon="inline-start" />
					<span>Search</span>
					<Kbd.Group aria-hidden="true">
						<Kbd.Root>⌘</Kbd.Root>
						<Kbd.Root>K</Kbd.Root>
					</Kbd.Group>
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Copy button with feedback">
		{#snippet blurb()}
			Click to copy a link — icon and label confirm for 1.5 seconds, then reset.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 41 — `copyLabelLink` in the script block is the inlined hook. -->
				<Button
					variant="outline"
					aria-label={copyLabelCopied ? "Copied" : "Copy"}
					onclick={copyLabelLink}
				>
					{#if copyLabelCopied}
						<CheckIcon data-icon="inline-start" />
					{:else}
						<CopyIcon data-icon="inline-start" />
					{/if}
					<span>{copyLabelCopied ? "Copied" : "Copy"}</span>
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Icon-only copy button with feedback">
		<Card.Root>
			<Card.Content>
				<!--
					demo 42 — the icon-only variant keeps its label in a tooltip. Radix's
					`asChild` on the trigger becomes the `child` snippet, spreading the trigger
					props onto the registry button; the page's own `onclick` comes after the
					spread so it is the one that survives.
				-->
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button
									size="icon"
									variant="outline"
									{...props}
									aria-label={copyIconCopied ? "Copied" : "Copy"}
									onclick={copyIconLink}
								>
									{#if copyIconCopied}
										<CheckIcon />
									{:else}
										<CopyIcon />
									{/if}
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content>{copyIconCopied ? "Copied" : "Copy link"}</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Animated hamburger / close toggle button">
		<Card.Root>
			<Card.Content>
				<!--
					demo 43 — both marks stay mounted, stacked in one `size-4` box, and
					the state only crossfades/rotates them. Upstream repeats `size-4` on each
					icon; the button's own `[&_svg]` rule already renders them at exactly that
					size, so the icons carry no sizing here.
				-->
				<Button
					size="icon"
					variant="outline"
					aria-label={hamburgerOpen ? "Close menu" : "Open menu"}
					aria-expanded={hamburgerOpen}
					onclick={() => (hamburgerOpen = !hamburgerOpen)}
				>
					<span class="relative flex size-4 items-center justify-center">
						<MenuIcon
							class={cn(
								"absolute transition-all duration-200",
								hamburgerOpen ? "scale-75 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
							)}
						/>
						<XIcon
							class={cn(
								"absolute transition-all duration-200",
								hamburgerOpen ? "scale-100 rotate-0 opacity-100" : "scale-75 -rotate-90 opacity-0",
							)}
						/>
					</span>
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Async action button with loading and success states">
		{#snippet blurb()}
			Click to simulate a save: 900ms of spinner, a 2-second confirmation, then back to idle.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 44 — `min-w-32` keeps the three labels from resizing the button;
					`aria-busy`/`aria-live` narrate the cycle. `startAsyncSave` drives it. -->
				<Button
					class="min-w-32"
					disabled={asyncSaveStatus === "loading"}
					aria-busy={asyncSaveStatus === "loading"}
					aria-live="polite"
					onclick={startAsyncSave}
				>
					{#if asyncSaveStatus === "loading"}
						<Spinner data-icon="inline-start" />
						Saving…
					{:else if asyncSaveStatus === "success"}
						<CheckIcon data-icon="inline-start" />
						Saved
					{:else}
						Save changes
					{/if}
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Outline button with inline count badge">
		<Card.Root>
			<Card.Content>
				<!--
					demo 45 — the ask is a `destructive-outline` Badge at `size="sm"`,
					a neutral outline with destructive type. The house badge has no outlined
					status family; `destructive` keeps the status signal, which is the half the
					count actually carries, at the house single height.
				-->
				<Button variant="outline" class="gap-2" aria-label="Messages (12)">
					Messages
					<Badge variant="destructive" aria-hidden="true">12</Badge>
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Button with status dot badge">
		<Card.Root>
			<Card.Content>
				<!--
					demo 46 — a double-ping live dot. Upstream paints it `emerald-500`
					with `emerald-400` pings; raw palette colours are banned here, so all three
					layers take `--success` and keep upstream's opacity split (75/40) as the only
					difference between them.
				-->
				<Button variant="outline" class="relative pr-8" aria-label="Deploy (ready)">
					Live
					<span aria-hidden="true" class="absolute top-1/2 right-3 -translate-y-1/2">
						<span
							class="relative flex size-2 rounded-full bg-success before:absolute before:inset-0 before:animate-ping before:rounded-full before:bg-success before:opacity-75 before:duration-1500 after:absolute after:inset-0 after:animate-ping after:rounded-full after:bg-success after:opacity-40 after:delay-500 after:duration-1500"
						></span>
					</span>
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Ghost button with a status badge">
		<Card.Root>
			<Card.Content>
				<!--
					demo 47 — the ask is a solid `success` Badge at `size="xs"`. The
					house badge carries success only as `success-subtle` (the soft family the
					conventions map status accents onto), at the single house height.
				-->
				<Button aria-label="Updates (new)">
					Updates
					<Badge variant="success-subtle" aria-hidden="true">New</Badge>
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Icon button with notification badge">
		<Card.Root>
			<Card.Content>
				<!-- demo 48 — the floating-count pattern on an icon-only button; same
					Badge mapping as the unread-badge section above. -->
				<Button size="icon" variant="outline" class="relative" aria-label="Notifications (8)">
					<BellIcon />
					<Badge
						variant="destructive"
						class="absolute -top-1 -right-1 rounded-full px-1"
						aria-hidden="true"
					>
						8
					</Badge>
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Go back link button">
		<Card.Root>
			<Card.Content>
				<!-- demo 49 — upstream wraps an `<a>` via `asChild`; here `href` renders
					the anchor, as the Next.js Link section already established. -->
				<Button variant="link" href={href("/components/button")}>
					<ChevronLeftIcon data-icon="inline-start" />
					Go back
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Go back link button with animation">
		<Card.Root>
			<Card.Content>
				<!-- demo 50 — upstream adds a `group/back-button` scope for the hover
					slide; the registry button's own `group/button` already provides one. -->
				<Button variant="link" href={href("/components/button")}>
					<ChevronLeftIcon
						data-icon="inline-start"
						class="transition-transform duration-200 group-hover/button:-translate-x-1"
					/>
					Go back
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Expanding button from icon to label">
		{#snippet blurb()}
			A floating-action button that grows from a circle into a labelled pill on hover.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					demo 51 — upstream's `group/fab` scope becomes the registry button's
					own `group/button`. Width is the animated axis (`hover:w-32`), so the `h-10
					w-10` pair stays split on purpose — `size-10` would couple the two dimensions
					this demo needs apart.
				-->
				<Button
					class="relative flex h-10 w-10 items-center overflow-hidden rounded-full px-3 transition-[width] duration-300 ease-in-out hover:w-32"
				>
					<PlusIcon
						class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 group-hover/button:left-3 group-hover/button:translate-x-0"
					/>
					<span
						class="ml-8 pr-2 whitespace-nowrap opacity-0 transition-opacity duration-300 group-hover/button:opacity-100"
					>
						Create New
					</span>
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Multi-line button with icon, title &amp; description">
		<Card.Root>
			<Card.Content>
				<!--
					demo 52 — `h-auto` releases the control height so the two-line body
					sets it. Upstream already scopes its hover to `group/button`, the name the
					registry button declares, so the icon tile's hover swap ports verbatim; the
					`size-5` icon is the demo's own tile scale, which the button's `[&_svg]` rule
					exempts by that very class.
				-->
				<Button variant="outline" class="h-auto justify-start gap-3 px-4 py-3 text-left">
					<div
						class="flex size-10 items-center justify-center rounded-md bg-muted text-accent-foreground group-hover/button:bg-background"
					>
						<CreditCardIcon class="size-5" />
					</div>
					<div class="flex flex-col gap-0.5">
						<span>Credit Card</span>
						<span class="text-xs font-normal text-muted-foreground">
							Pay securely with your Visa or Mastercard
						</span>
					</div>
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Sliding icon button (hover reveal)">
		{#snippet blurb()}
			Hovering slides the label aside and reveals an arrow inside the pill.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 53 — `group/sliding` becomes the registry button's `group/button`;
					`overflow-hidden` keeps the parked arrow (`translate-x-8`) clipped until hover. -->
				<Button class="relative overflow-hidden rounded-full px-6">
					<span
						class="inline-flex items-center transition-transform duration-300 group-hover/button:-translate-x-2"
					>
						Get Started
					</span>
					<ArrowRightIcon
						class="absolute right-2.5 translate-x-8 opacity-0 transition-all duration-300 group-hover/button:translate-x-0 group-hover/button:opacity-100"
					/>
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Shortcut tooltip button (Kbd hints)">
		<Card.Root>
			<Card.Content>
				<!--
					demo 54 — the shortcut lives in the tooltip rather than the button.
					Same `child`-snippet trigger as the copy button above. Upstream nudges its Kbd
					with `-mr-1`; the house tooltip content already trims itself to `pr-1.5` when
					it detects a kbd slot, so only upstream's wider `gap-3` remains.
				-->
				<Tooltip.Provider>
					<Tooltip.Root>
						<Tooltip.Trigger>
							{#snippet child({ props })}
								<Button variant="outline" size="icon" {...props} aria-label="Search">
									<SearchIcon />
								</Button>
							{/snippet}
						</Tooltip.Trigger>
						<Tooltip.Content class="flex items-center gap-3">
							Search
							<Kbd.Root>⌘K</Kbd.Root>
						</Tooltip.Content>
					</Tooltip.Root>
				</Tooltip.Provider>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- The avatar family (demo 55 to demo 58): the same avatar-plus-handle body
		across the default/outline variants and the default/sm sizes. `size-5` is the demos' own
		avatar scale and `text-xs` their handle type, at every combination. The demos load
		github.com/shadcn.png upstream; the initials fallback stands in, per the
		no-remote-assets rule. -->
	<DocSection title="Button with avatar">
		<Card.Root>
			<Card.Content>
				<!-- demo 55 -->
				<Button>
					<Avatar.Root class="size-5">
						<Avatar.Fallback>CH</Avatar.Fallback>
					</Avatar.Root>
					<span class="text-xs">@shadcn</span>
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Outline button with avatar">
		<Card.Root>
			<Card.Content>
				<!-- demo 56 -->
				<Button variant="outline">
					<Avatar.Root class="size-5">
						<Avatar.Fallback>CH</Avatar.Fallback>
					</Avatar.Root>
					<span class="text-xs">@shadcn</span>
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Small button with avatar">
		<Card.Root>
			<Card.Content>
				<!-- demo 57 -->
				<Button size="sm">
					<Avatar.Root class="size-5">
						<Avatar.Fallback>CH</Avatar.Fallback>
					</Avatar.Root>
					<span class="text-xs">@shadcn</span>
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Small outline button with avatar">
		<Card.Root>
			<Card.Content>
				<!-- demo 58 -->
				<Button variant="outline" size="sm">
					<Avatar.Root class="size-5">
						<Avatar.Fallback>CH</Avatar.Fallback>
					</Avatar.Root>
					<span class="text-xs">@shadcn</span>
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Labelled social login buttons with Remix icons">
		{#snippet blurb()}
			The labelled counterpart of the icon-only stack above — a muted "Login with" lead-in before
			each provider's name.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!-- demo 59 — `loginWithProviders` in the script block explains the
					brand-hex → `currentColor` flattening. -->
				<div class="flex flex-col gap-2">
					{#each loginWithProviders as provider (provider.name)}
						<Button variant="outline">
							<svg
								data-icon="inline-start"
								viewBox="0 0 24 24"
								fill="currentColor"
								aria-hidden="true"
							>
								<path d={provider.path} />
							</svg>
							<span class="text-muted-foreground">Login with</span>
							{provider.name}
						</Button>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Theme toggle button with animated moon and sun icons">
		<Card.Root>
			<Card.Content>
				<!--
					demo 61 — the sun/moon crossfade reuses the hamburger section's stacking
					wrapper: both icons stay mounted in one `size-4` box and the state only rotates
					and fades them. Upstream anchors the moon `absolute` against the button itself;
					the registry button is not positioned, so the wrapper provides the box. The
					toggle flips a local flag, not the real theme — so does upstream.
				-->
				<Button
					size="icon"
					variant="outline"
					aria-label={themeToggleDark ? "Switch to light mode" : "Switch to dark mode"}
					onclick={() => (themeToggleDark = !themeToggleDark)}
				>
					<span class="relative flex size-4 items-center justify-center">
						<SunIcon
							class={cn(
								"absolute transition-all duration-300",
								themeToggleDark ? "scale-0 -rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100",
							)}
						/>
						<MoonIcon
							class={cn(
								"absolute transition-all duration-300",
								themeToggleDark ? "scale-100 rotate-0 opacity-100" : "scale-0 rotate-90 opacity-0",
							)}
						/>
					</span>
				</Button>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
