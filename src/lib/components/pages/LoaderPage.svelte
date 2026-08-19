<script lang="ts">
	import type { Component } from "svelte";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Loader from "$lib/components/ui/loader/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	import { CopyButton } from "$lib/components/ui/copy-button/index.js";
	import { cn } from "$lib/utils.js";
	import type { LoaderProps } from "$lib/components/ui/loader/index.js";

	/**
	 * The Loader page: the whole of `ui/loader`.
	 *
	 * THE CLASSIC THEME HAS NO COUNTERPART. The classic framework draws exactly two loading marks — `.spinner-border` and
	 * `.spinner-grow` — and the classic theme adds nothing to either; every value on the Spinner page is
	 * the classic stock one. This folder is a catalog of standalone animations instead, so nothing
	 * here is skinned against a classic surface. What it IS measured against is the token map: each
	 * specimen below exists to be looked at in light and in dark, because a loader that nobody has
	 * painted is a loader whose colours nobody has checked.
	 *
	 * WHERE IT SITS NEXT TO THE THREE COMPONENTS THAT ALREADY SAY "SOMETHING IS HAPPENING", since
	 * four answers to one question is three too many unless the boundaries are written down:
	 *
	 *   ui/spinner    ONE Lucide glyph drawn in `currentColor` under `animate-spin`. It inherits its
	 *                 colour from whatever it is put inside, which is why it can go in a button, a
	 *                 badge or an input addon and always look right. Reach for it first — it is the
	 *                 house default, and 90% of waits want it.
	 *   ui/pending    Not a mark at all: a busy STATE applied to an interactive element. It sets
	 *                 `aria-busy`, suppresses press and hover, and keeps the control focusable. It
	 *                 answers "this button is working", not "draw me something spinning".
	 *   ui/skeleton   The SHAPE of content that has not arrived — a grey block the size of the thing
	 *                 it stands in for. It says what is coming; the others only say to wait.
	 *   ui/loader     A drawn animation with a fixed size and a fixed two-ink palette, one of 128.
	 *                 It is a picture, not a glyph: dozens of the specimens below need `foreground`
	 *                 and `muted-foreground` at once, which `currentColor` cannot express, so a Loader
	 *                 does not take its colour from its surroundings the way a Spinner does. Use one
	 *                 where the wait is the whole screen and has a personality — a splash, an empty
	 *                 panel, a full-page hand-off. Inside a control, use Spinner.
	 *
	 * THE GALLERY NEUTRALISES THE LIVE REGION, and this is the one place the page deliberately
	 * disagrees with the component. Every loader defaults to `role="status"`, which is not a label
	 * holder — it is an ARIA live region, with an implicit `aria-live="polite"` and
	 * `aria-atomic="true"`. That is right for what the component is for: one loader inside one
	 * button, telling a reader that this particular thing is under way. It is wrong 128 times on one
	 * document, where nothing is under way at all. Two concrete costs, not one: every specimen would
	 * assert a wait that is not happening, and because a live region announces its own DOM changes
	 * unprompted, anything that re-renders one — a filtered gallery, a changed `label` — would
	 * interrupt the reader to say "Loading" about a static catalog.
	 *
	 * So each specimen is passed `role="img"` with its display name as `aria-label`, which is what a
	 * picture of a loader actually is. `img` takes its name from the author and its children are
	 * presentational, so the whole animation collapses to one named graphic. Verified rather than
	 * assumed: Chrome computes the specimen's node as role `image`, named "Classic Spinner on the
	 * page ground", not ignored. Under `role="status"` an `aria-label` names the REGION, which is a
	 * different thing from naming the picture inside it.
	 *
	 * The component default is deliberately left alone — `role` is a prop precisely so a gallery can
	 * do this. And one live region per tile does survive, from the `CopyButton`: that one stays,
	 * because it announces something that genuinely happens when the reader presses it.
	 */

	/**
	 * Every loader's own source, read at build time so a tile can hand it to a `CopyButton`.
	 *
	 * `import.meta.glob` with `query: "?raw"` gives Vite the file's text rather than its component.
	 * The LAZY form is the load-bearing part: written eagerly, 128 Svelte sources — a few hundred
	 * kilobytes of text nobody has asked for — would land in this page's chunk. Lazily, each is its
	 * own tiny chunk fetched on the click that copies it, which is exactly what `CopyButton`'s
	 * producer form of `value` (`() => Promise<string>`) exists for: the pending face shows while the
	 * fetch is in flight, and nothing is downloaded for the 127 tiles nobody pressed.
	 *
	 * The pattern is an alias path, so it resolves the same way the `$lib` imports above do.
	 */
	const loaderSources = import.meta.glob<string>("$lib/components/ui/loader/loader-*.svelte", {
		query: "?raw",
		import: "default",
	});

	/**
	 * The sources keyed by the catalog kebab, which is the only name a specimen carries.
	 *
	 * Vite's glob keys are full posix paths and their exact shape depends on how the pattern was
	 * written, so the kebab is cut out of the file name rather than assumed — `…/loader-<kebab>.svelte`
	 * is the naming rule the whole folder follows.
	 */
	const sourceOf = new Map(
		Object.entries(loaderSources).map(([path, load]) => [
			path.slice(path.lastIndexOf("/loader-") + "/loader-".length, -".svelte".length),
			load,
		]),
	);

	/** The text a tile's copy button writes. Throws into `CopyButton`'s failure path if it is gone. */
	async function loaderSource(kebab: string): Promise<string> {
		const load = sourceOf.get(kebab);
		if (!load) throw new Error(`No source found for loader-${kebab}.svelte.`);
		return load();
	}

	/** One tile. */
	type Specimen = {
		/** The catalog's display name, shown under the animation and used as its accessible name. */
		name: string;
		/** The catalog's kebab: the file name, the `data-loader` value, and the source lookup key. */
		kebab: string;
		/** The component itself, from the barrel. */
		component: Component<LoaderProps>;
		/**
		 * Set when the loader is wider than one column of the grid below (roughly 15rem), so the tile
		 * spans the full row instead of overflowing it.
		 *
		 * EXACTLY ONE LOADER QUALIFIES, and that was measured rather than assumed. Every root's own
		 * geometry classes were read off the 128 files: apart from `wave-physics-loader`'s
		 * `w-[292px]`, the widest fixed width in the folder is `w-24` (96px), and the widest thing any
		 * `w-fit` root wraps is a `text-lg` word — around 90px. The shapes that look like candidates
		 * turn out not to be: `dynamic-island` breathes between 80px and 110px, `glassmorphic-card` is
		 * `h-16 w-20`, `mac-terminal` is a two-glyph prompt, and the three fluid ones
		 * (`terminal-loader` at `w-full`, `skeleton-loader` at `max-w-[120px]`, `fluid-skeleton` at
		 * `w-24`) have no intrinsic width to overflow with — a `w-full` panel is by definition never
		 * wider than the column it is given.
		 */
		wide?: boolean;
	};

	/**
	 * The six groups the gallery files its loaders into, in its own order, with the titles
	 * spelled exactly as the catalog spells them.
	 *
	 * VERBATIM ON PURPOSE. The 128 loaders arrived in twelve parallel batches, each of which wrote
	 * only its own `loader-<kebab>.svelte` files and never this page; the specimens below were then
	 * generated in one pass from the catalog, reconciled against what was actually on disk. A title
	 * this page re-worded would have made that lookup an editorial judgement instead of a match,
	 * which across twelve hands is how a catalog ends up with two sections meaning the same thing.
	 *
	 * Every specimen's `name` and `kebab` are the catalog's own fields, and the order within a
	 * section is the catalog's order — the gallery order, not alphabetical. `total` is
	 * the catalog's count for the group and the blurb prints it against `specimens.length`, so the
	 * page keeps reporting its own coverage now that the two are equal.
	 */
	const groups: { title: string; total: number; blurb: string; specimens: Specimen[] }[] = [
		{
			title: "Physics & Simulation",
			total: 1,
			blurb:
				"The one loader in the folder allowed to run JavaScript: every bar's height is a function of where the ball is, which per-element CSS keyframes cannot express.",
			specimens: [
				{
					name: "Wave Physics",
					kebab: "wave-physics-loader",
					component: Loader.WavePhysicsLoader,
					wide: true,
				},
			],
		},
		{
			title: "Dots & Pulses",
			total: 24,
			blurb: "Small round marks that travel, fade or breathe.",
			specimens: [
				{ name: "Pulse Dots", kebab: "pulse-dots", component: Loader.PulseDots },
				{ name: "Bounce Dots", kebab: "bounce-dots", component: Loader.BounceDots },
				{ name: "Liquid Dots", kebab: "liquid-dots", component: Loader.LiquidDots },
				{ name: "Fade Dots", kebab: "fade-dots", component: Loader.FadeDots },
				{ name: "Swapping Dots", kebab: "swapping-dots", component: Loader.SwappingDots },
				{ name: "Bouncing Dots", kebab: "bouncing-dots", component: Loader.BouncingDots },
				{ name: "Bobbing Dots", kebab: "bobbing-dots", component: Loader.BobbingDots },
				{ name: "Pulse Dot", kebab: "pulse-dot", component: Loader.PulseDot },
				{ name: "Wave Dots", kebab: "wave-dots", component: Loader.WaveDots },
				{ name: "Grid Dots", kebab: "grid-dots", component: Loader.GridDots },
				{ name: "Pulsating Dots", kebab: "pulsating-dots", component: Loader.PulsatingDots },
				{ name: "Triple Dot", kebab: "triple-dot-spinner", component: Loader.TripleDotSpinner },
				{ name: "Ripple Effect", kebab: "ripple-effect", component: Loader.RippleEffect },
				{ name: "Breathing Glow", kebab: "breathing-glow", component: Loader.BreathingGlow },
				{ name: "Apple Breathe", kebab: "apple-breathe", component: Loader.AppleBreathe },
				{ name: "Apple Pulse", kebab: "apple-pulse-dots", component: Loader.ApplePulseDots },
				{ name: "Smooth Shift", kebab: "smooth-dot-shift", component: Loader.SmoothDotShift },
				{ name: "Spring Matrix", kebab: "spring-dot-matrix", component: Loader.SpringDotMatrix },
				{ name: "Fluid Orbit", kebab: "fluid-dot-orbit", component: Loader.FluidDotOrbit },
				{ name: "Magnetic Dots", kebab: "magnetic-dots", component: Loader.MagneticDots },
				{ name: "Drop Dot", kebab: "drop-dot", component: Loader.DropDot },
				{ name: "Morph Ring", kebab: "morph-dot-ring", component: Loader.MorphDotRing },
				{ name: "Scale Pulse", kebab: "apple-scale-pulse", component: Loader.AppleScalePulse },
				{ name: "Trailing Dots", kebab: "trailing-dots", component: Loader.TrailingDots },
			],
		},
		{
			title: "Rings & Spinners",
			total: 30,
			blurb:
				"Anything that turns. The largest family, and the one the classic spinner is the archetype of.",
			specimens: [
				{ name: "Classic Spinner", kebab: "classic-spinner", component: Loader.ClassicSpinner },
				{ name: "Ring Sweep", kebab: "ring-sweep", component: Loader.RingSweep },
				{ name: "Concentric Ring", kebab: "concentric-ring", component: Loader.ConcentricRing },
				{ name: "Dots Ring", kebab: "dots-ring", component: Loader.DotsRing },
				{ name: "Twin Orbit", kebab: "twin-orbit", component: Loader.TwinOrbit },
				{ name: "Comet Spinner", kebab: "comet-spinner", component: Loader.CometSpinner },
				{ name: "Swirling Spinner", kebab: "swirling-spinner", component: Loader.SwirlingSpinner },
				{ name: "Radar Sweep", kebab: "radar-sweep", component: Loader.RadarSweep },
				{ name: "Orbiting Dot", kebab: "orbiting-dot", component: Loader.OrbitingDot },
				{ name: "Orbiting Circles", kebab: "orbiting-circles", component: Loader.OrbitingCircles },
				{
					name: "Intersecting Rings",
					kebab: "intersecting-rings",
					component: Loader.IntersectingRings,
				},
				{ name: "Clock Spinner", kebab: "clock-spinner", component: Loader.ClockSpinner },
				{ name: "Gears", kebab: "gears", component: Loader.Gears },
				{ name: "Cross Spinner", kebab: "cross-spinner", component: Loader.CrossSpinner },
				{ name: "Line Spinner", kebab: "line-spinner", component: Loader.LineSpinner },
				{ name: "Square Spinner", kebab: "square-spinner", component: Loader.SquareSpinner },
				{ name: "Dual Arc", kebab: "dual-arc", component: Loader.DualArc },
				{ name: "Fade Arc", kebab: "fade-arc", component: Loader.FadeArc },
				{ name: "Dash Ring", kebab: "dash-ring", component: Loader.DashRing },
				{ name: "Arc Tracer", kebab: "arc-tracer", component: Loader.ArcTracer },
				{ name: "iOS Spinner", kebab: "ios-spinner", component: Loader.IOSSpinner },
				{ name: "Smooth Ring", kebab: "smooth-ring", component: Loader.SmoothRing },
				{ name: "Morphing Ring", kebab: "morphing-ring", component: Loader.MorphingRing },
				{ name: "Spring Expand", kebab: "spring-ring-expand", component: Loader.SpringRingExpand },
				{ name: "Watch Spinner", kebab: "watch-spinner", component: Loader.WatchSpinner },
				{ name: "Gradient Arc", kebab: "gradient-arc", component: Loader.GradientArc },
				{ name: "Breathe Ring", kebab: "breathe-ring", component: Loader.BreatheRing },
				{ name: "Offset Rings", kebab: "offset-rings", component: Loader.OffsetRings },
				{ name: "Dashed Spiral", kebab: "dashed-spiral", component: Loader.DashedSpiral },
				{ name: "Haptic Ring", kebab: "haptic-ring", component: Loader.HapticRing },
			],
		},
		{
			title: "Bars & Waves",
			total: 19,
			blurb: "Rows of bars rising and falling — equalisers, waveforms, cascades.",
			specimens: [
				{ name: "Bar Cascade", kebab: "bar-cascade", component: Loader.BarCascade },
				{ name: "Bouncing Bars", kebab: "bouncing-bars", component: Loader.BouncingBars },
				{ name: "Symmetric Wave", kebab: "symmetric-wave", component: Loader.SymmetricWave },
				{ name: "Bar Sweep", kebab: "bar-sweep", component: Loader.BarSweep },
				{ name: "Circular Bars", kebab: "circular-bars", component: Loader.CircularBars },
				{ name: "Accordion Loader", kebab: "accordion-loader", component: Loader.AccordionLoader },
				{ name: "Square Accordion", kebab: "square-accordion", component: Loader.SquareAccordion },
				{ name: "Conveyor Loop", kebab: "conveyor-loop", component: Loader.ConveyorLoop },
				{ name: "Bouncing Lines", kebab: "bouncing-lines", component: Loader.BouncingLines },
				{ name: "Siri Wave", kebab: "siri-wave", component: Loader.SiriWave },
				{ name: "Apple EQ", kebab: "apple-equalizer", component: Loader.AppleEqualizer },
				{ name: "Spring Bars", kebab: "spring-bars", component: Loader.SpringBars },
				{ name: "Fluid Bars", kebab: "fluid-bars", component: Loader.FluidBars },
				{ name: "Morphing Bars", kebab: "morphing-bars", component: Loader.MorphingBars },
				{ name: "Stacked Pulse", kebab: "stacked-bar-pulse", component: Loader.StackedBarPulse },
				{ name: "Waveform", kebab: "waveform-loader", component: Loader.WaveformLoader },
				{ name: "Elastic Bars", kebab: "elastic-bars", component: Loader.ElasticBars },
				{ name: "Sliding Bars", kebab: "sliding-bars", component: Loader.SlidingBars },
				{ name: "Sound Wave", kebab: "apple-sound-wave", component: Loader.AppleSoundWave },
			],
		},
		{
			title: "Geometric Shapes",
			total: 35,
			blurb: "Squares, hexagons, diamonds and pendulums: shapes that flip, morph or swing.",
			specimens: [
				{ name: "Flip Square", kebab: "flip-square", component: Loader.FlipSquare },
				{ name: "Morphing Shape", kebab: "morphing-shape", component: Loader.MorphingShape },
				{ name: "Newton's Cradle", kebab: "newtons-cradle", component: Loader.NewtonsCradle },
				{ name: "Spinning Squares", kebab: "spinning-squares", component: Loader.SpinningSquares },
				{ name: "Expanding Cross", kebab: "expanding-cross", component: Loader.ExpandingCross },
				{ name: "Square Grid", kebab: "square-grid", component: Loader.SquareGrid },
				{
					name: "Floating Diamonds",
					kebab: "floating-diamonds",
					component: Loader.FloatingDiamonds,
				},
				{ name: "Pulse Square", kebab: "pulse-square", component: Loader.PulseSquare },
				{ name: "Pendulum", kebab: "pendulum", component: Loader.Pendulum },
				{ name: "Hexagon Spinner", kebab: "hexagon-spinner", component: Loader.HexagonSpinner },
				{ name: "Wandering Cube", kebab: "wandering-cube", component: Loader.WanderingCube },
				{ name: "Hourglass", kebab: "hourglass", component: Loader.Hourglass },
				{
					name: "Rotating Triangle",
					kebab: "rotating-triangle",
					component: Loader.RotatingTriangle,
				},
				{ name: "Bouncing Square", kebab: "bouncing-square", component: Loader.BouncingSquare },
				{ name: "Breathing Square", kebab: "breathing-square", component: Loader.BreathingSquare },
				{ name: "Diamond Grid", kebab: "diamond-grid", component: Loader.DiamondGrid },
				{ name: "Square Snake", kebab: "square-snake", component: Loader.SquareSnake },
				{ name: "Infinity Path", kebab: "infinity-path", component: Loader.InfinityPath },
				{
					name: "Morphing Infinity",
					kebab: "morphing-infinity",
					component: Loader.MorphingInfinity,
				},
				{ name: "Zig Zag Pulse", kebab: "zig-zag-pulse", component: Loader.ZigZagPulse },
				{ name: "Pumping Heart", kebab: "pumping-heart", component: Loader.PumpingHeart },
				{ name: "Heartbeat", kebab: "heartbeat", component: Loader.Heartbeat },
				{ name: "Spiral Spinner", kebab: "spiral-spinner", component: Loader.SpiralSpinner },
				{
					name: "Concentric Squares",
					kebab: "concentric-squares",
					component: Loader.ConcentricSquares,
				},
				{ name: "Rotating Cross", kebab: "rotating-cross", component: Loader.RotatingCross },
				{ name: "Icon Morph", kebab: "apple-icon-morph", component: Loader.AppleIconMorph },
				{
					name: "Smooth Square",
					kebab: "smooth-rounded-square",
					component: Loader.SmoothRoundedSquare,
				},
				{ name: "Cube Flip", kebab: "cube-flip-spring", component: Loader.CubeFlipSpring },
				{ name: "Origami", kebab: "origami-shape", component: Loader.OrigamiShape },
				{
					name: "Diamond Spin",
					kebab: "diamond-rotate-spring",
					component: Loader.DiamondRotateSpring,
				},
				{ name: "Shape Shift", kebab: "shape-shift-grid", component: Loader.ShapeShiftGrid },
				{ name: "Spring Hex", kebab: "spring-hexagon", component: Loader.SpringHexagon },
				{ name: "Elastic Square", kebab: "elastic-square", component: Loader.ElasticSquare },
				{ name: "Minimal Triangle", kebab: "minimal-triangle", component: Loader.MinimalTriangle },
				{ name: "Fluid Diamond", kebab: "fluid-diamond", component: Loader.FluidDiamond },
			],
		},
		{
			title: "Text & Interface",
			total: 19,
			blurb:
				"Loaders made of words, and the small interface surfaces — an island, a terminal, a card — that carry one.",
			specimens: [
				{ name: "Text Shimmer", kebab: "text-shimmer", component: Loader.TextShimmer },
				{ name: "Text Blink", kebab: "text-blink", component: Loader.TextBlink },
				{ name: "Text Dots", kebab: "text-dots", component: Loader.TextDots },
				{
					name: "Text Shimmer Wave",
					kebab: "text-shimmer-wave",
					component: Loader.TextShimmerWave,
				},
				{ name: "Typing Indicator", kebab: "typing-indicator", component: Loader.TypingIndicator },
				{ name: "Typing", kebab: "typing", component: Loader.Typing },
				{ name: "Shimmer Line", kebab: "shimmer-line", component: Loader.ShimmerLine },
				{ name: "Skeleton", kebab: "skeleton-loader", component: Loader.SkeletonLoader },
				{ name: "Terminal", kebab: "terminal-loader", component: Loader.TerminalLoader },
				{ name: "Text Reveal", kebab: "apple-text-reveal", component: Loader.AppleTextReveal },
				{ name: "Fluid Skeleton", kebab: "fluid-skeleton", component: Loader.FluidSkeleton },
				{ name: "Spring Pop", kebab: "spring-text-pop", component: Loader.SpringTextPop },
				{ name: "Apple Unlock", kebab: "apple-unlock", component: Loader.AppleUnlock },
				{ name: "Glass Card", kebab: "glassmorphic-card", component: Loader.GlassmorphicCard },
				{ name: "Mac Terminal", kebab: "mac-terminal", component: Loader.MacTerminal },
				{ name: "Dynamic Island", kebab: "dynamic-island", component: Loader.DynamicIsland },
				{ name: "App Icon", kebab: "app-icon-load", component: Loader.AppIconLoad },
				{ name: "Text Morph", kebab: "text-morph", component: Loader.TextMorph },
				{ name: "Face ID", kebab: "face-id-scan", component: Loader.FaceIDScan },
			],
		},
	];

	/**
	 * A glob that matches nothing is not an error — it is an empty object, and it would ship a
	 * gallery of buttons that copy nothing, silently. So the page refuses to render in development
	 * if a specimen has no source, which is the same dev-only assertion `route.svelte.ts` uses to
	 * keep a slug from being filed twice. Production is left alone: a missing source already fails
	 * loudly at the one place it matters, inside `loaderSource`.
	 */
	if (import.meta.env.DEV) {
		const missing = groups
			.flatMap((group) => group.specimens)
			.filter((specimen) => !sourceOf.has(specimen.kebab))
			.map((specimen) => specimen.kebab);

		if (missing.length > 0) {
			throw new Error(
				`LoaderPage.svelte: no source for ${missing.join(", ")}. ` +
					`The import.meta.glob over "$lib/components/ui/loader/loader-*.svelte" matched ` +
					`${sourceOf.size} file(s); a pattern that matches nothing returns {} without failing.`,
			);
		}
	}

	/** The three specimens the grounds section repeats, chosen for what each one tests. */
	const grounds: Specimen[] = [
		{ name: "Classic Spinner", kebab: "classic-spinner", component: Loader.ClassicSpinner },
		{ name: "Text Shimmer", kebab: "text-shimmer", component: Loader.TextShimmer },
		{ name: "Dynamic Island", kebab: "dynamic-island", component: Loader.DynamicIsland },
	];

	const rootProps = [
		{
			prop: "ref",
			type: "HTMLDivElement | null",
			default: "null",
			description: "Bindable reference to the root element. Every loader's root is a `<div>`.",
		},
		{
			prop: "class",
			type: "ClassValue",
			default: "—",
			description:
				"Merged onto the root, last, so a caller's layout classes win. There is no size prop: the geometry is a dozen hand-tuned literals per loader, so a caller that needs one smaller wraps it and applies scale-*.",
		},
		{
			prop: "role",
			type: "string",
			default: '"status"',
			description:
				'Correct for a real wait, which is one live region announcing one thing. A gallery of many passes role="img" instead — see the note at the top of this page.',
		},
		{
			prop: "aria-label",
			type: "string",
			default: '"Loading" (the loader\'s own word, on the text loaders)',
			description:
				"The loader's accessible name. The only name it has: everything drawn inside is decorative.",
		},
		{
			prop: "label",
			type: "string",
			default: "upstream's own string",
			description:
				"Text loaders only. The word the loader animates, and its accessible name — one knob, so the two cannot drift.",
		},
		{
			prop: "...restProps",
			type: "HTMLAttributes<HTMLDivElement>",
			default: "—",
			description:
				"Forwarded to the root. Spread first, so the attributes above cannot be clobbered by a caller.",
		},
	];

	const dataAttributes = [
		{
			attribute: "[data-slot]",
			values: "loader — what the reduced-motion rule in src/app.css selects on",
		},
		{ attribute: "[data-loader]", values: "the loader's kebab name, e.g. classic-spinner" },
	];
</script>

<!--
	One tile: the animation, its name, and a button that copies its source.

	The stage carries `data-loader-stage`, which is what `src/app.css` hangs `content-visibility: auto`
	on. That rule is the page's performance gate and the comment there argues for it at length; the
	short version is that a catalog of 128 infinite animations must stop paying for the ~120 nobody is
	looking at, and that the gate belongs to the page rendering all of them rather than to a component
	that is normally rendered once. The stage's `min-h-40` is the same 10rem the rule uses as its
	placeholder size, so a skipped tile reserves exactly the space it will take.

	`role="img"` + the display name replaces the component's `role="status"`, per the note in the
	script block. The tile is a `bg-card` box on the page ground rather than a grid inside one big
	card: 128 specimens in a single slab reads as one object, and the gap between tiles is what makes
	each one a specimen.
-->
{#snippet tile(specimen: Specimen)}
	{@const Preview = specimen.component}
	<li
		class={cn(
			"flex flex-col overflow-hidden rounded-lg border bg-card",
			specimen.wide && "sm:col-span-2 xl:col-span-3",
		)}
	>
		<div
			data-loader-stage
			class="flex min-h-40 flex-1 items-center justify-center overflow-x-auto p-4"
		>
			<Preview role="img" aria-label={specimen.name} />
		</div>
		<div class="flex items-center justify-between gap-2 border-t px-3 py-2">
			<span class="truncate text-sm font-medium">{specimen.name}</span>
			<CopyButton
				value={() => loaderSource(specimen.kebab)}
				size="icon-sm"
				aria-label="Copy the {specimen.name} source"
				copiedLabel="{specimen.name} source copied"
			/>
		</div>
	</li>
{/snippet}

<DocPage title="Loader">
	{#snippet subtitle()}
		A catalog of standalone loading animations. Each one is a fixed drawing at a fixed size — for a
		loading mark that takes its colour and its size from whatever it sits inside, use Spinner.
	{/snippet}

	<DocSection title="Both grounds">
		{#snippet blurb()}
			Every loader is drawn in foreground and muted-foreground, so the ground under it is what
			decides whether it reads. These three are repeated on the page ground and on a card because
			that is the pair every token choice in the folder has to survive.
		{/snippet}
		<div class="grid gap-4 sm:grid-cols-2">
			<!--
				No background of its own, so the page ground shows through — a dashed edge rather than a
				solid one, to say the box is a boundary and not a surface. This is the harder of the two
				grounds for a quiet mark: `--background` is a light grey in light mode, so
				`bg-muted-foreground` has less to push against here than it does on a card.
			-->
			<div
				class="flex flex-col items-center justify-center gap-6 rounded-lg border border-dashed p-6"
			>
				{#each grounds as specimen (specimen.kebab)}
					{@const Preview = specimen.component}
					<Preview role="img" aria-label="{specimen.name} on the page ground" />
				{/each}
				<span class="text-xs text-muted-foreground">Page ground</span>
			</div>
			<Card.Root>
				<Card.Content class="flex flex-col items-center justify-center gap-6">
					{#each grounds as specimen (specimen.kebab)}
						{@const Preview = specimen.component}
						<Preview role="img" aria-label="{specimen.name} on a card" />
					{/each}
					<span class="text-xs text-muted-foreground">Card ground</span>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>

	<!--
		The six sections the catalog defines, all of them now full. The count in each blurb is derived
		from `specimens.length` rather than written down, so it was the honest report while the groups
		were filling and it is the honest report now that they read "N of N" — and the empty-section
		branch below stays, because a section that lost its loaders should say so rather than
		disappear.
	-->
	{#each groups as group (group.title)}
		<DocSection title={group.title}>
			{#snippet blurb()}
				{group.blurb} {group.specimens.length} of {group.total} ported.
			{/snippet}
			{#if group.specimens.length === 0}
				<p class="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
					None of this group is ported yet.
				</p>
			{:else}
				<!--
					`role="list"` because Tailwind's preflight sets `list-style: none`, which is enough for
					Safari and VoiceOver to stop treating a `<ul>` as a list. On a page whose whole point is
					"here are N of them", the count is worth keeping.
				-->
				<ul role="list" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{#each group.specimens as specimen (specimen.kebab)}
						{@render tile(specimen)}
					{/each}
				</ul>
			{/if}
		</DocSection>
	{/each}

	<DocSection title="API reference">
		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Every loader</h3>
			<p class="text-sm text-muted-foreground">
				One prop surface for all of them, declared once in
				<code>loader.svelte.ts</code>. They are peers rather than parts, so the barrel exports no
				<code>Root</code> and the call shape is a namespace import:
				<code>{'import * as Loader from "$lib/components/ui/loader/index.js"'}</code>, then
				<code>{"<Loader.ClassicSpinner />"}</code>.
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
			<h3 class="text-base font-medium">Data attributes</h3>
			<Card.Root>
				<Card.Content class="px-0 [&_[data-slot=table-cell]]:whitespace-normal">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Attribute</Table.Head>
								<Table.Head>Values</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each dataAttributes as row (row.attribute)}
								<Table.Row>
									<Table.Cell class="font-medium">{row.attribute}</Table.Cell>
									<Table.Cell>{row.values}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</Card.Content>
			</Card.Root>
		</div>

		<div class="flex flex-col gap-3">
			<h3 class="text-base font-medium">Reduced motion</h3>
			<p class="text-sm text-muted-foreground">
				Handled once, in <code>src/app.css</code>, for all of them: under
				<code>prefers-reduced-motion: reduce</code> every moving part stops and the loader as a whole
				breathes on a slow opacity pulse. No loader writes that media query itself. What each one does
				write is a resting value for every property it animates, so the frame left on screen is a chosen
				one — the spinner keeps its phase ramp, the shimmer parks its highlight mid-word, the ball freezes
				at the top of a bounce.
			</p>
		</div>
	</DocSection>
</DocPage>
