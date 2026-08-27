<script lang="ts">
	import { curveCardinal } from "d3-shape";
	import { quartOut } from "svelte/easing";
	import { Tween, prefersReducedMotion } from "svelte/motion";
	import { BarChart, LineChart, PieChart } from "layerchart";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Chart from "$lib/components/ui/chart/index.js";
	import { Switch } from "$lib/components/ui/switch/index.js";
	import { cn } from "$lib/utils.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";
	// Imports below serve the appendix sections; they are separate
	// lines rather than merged into the imports above so the base block stays untouched.
	import { curveNatural, curveStepAfter } from "d3-shape";
	import { AreaChart } from "layerchart";
	import TrendingDownIcon from "@lucide/svelte/icons/trending-down";
	import TrendingUpIcon from "@lucide/svelte/icons/trending-up";
	import { Badge } from "$lib/components/ui/badge/index.js";
	// The pie/radar/radial demos (demo 19 onwards) additionally need these.
	import { curveLinearClosed } from "d3-shape";
	import { Arc, ArcChart, Text } from "layerchart";

	/**
	 * The Chart component page.
	 *
	 * The classic theme tags this section "theme-specific" AND "Plugin": the styling is its own, the
	 * rendering is Chart.js. This theme keeps the styling and swaps the engine for LayerChart,
	 * which is what shadcn-svelte's `Chart` wraps — so the charts are composed the way that
	 * component expects rather than as `<canvas>` elements driven by a global script.
	 *
	 * THE DATA IS THE CLASSIC THEME'S, read out of the reference script bundle rather than invented,
	 * so the curves have the same shape as the originals. Where a dataset is `hidden: true`
	 * there it is hidden here too — that is what the section actually renders.
	 */

	/**
	 * `.chart` is `position: relative; height: var(--bs-chart-height)` with
	 * `chart-height: 300px`. Measured at exactly 300px on the classic theme's page.
	 */
	const chartBox = "h-[300px] w-full";

	/**
	 * `.chart.chart-appended` is `calc(var(--bs-chart-height) - #{chart-legend-height})`, and
	 * `chart-legend-height` is `chart-legend-margin-top + chart-legend-font-size *
	 * line-height-base` = 2.5rem + 0.8125rem × 1.5. The classic theme computes it to 3.71875rem, which is
	 * the value read back off `--bs-chart-legend-height` — so the arithmetic is reproduced
	 * rather than the rounded pixel.
	 */
	const chartAppended = "h-[calc(300px-3.71875rem)] w-full";

	/** `chart-sparkline-width` / `chart-sparkline-height`, measured at 75 x 35. */
	const sparklineBox = "h-[35px] w-[75px]";

	/**
	 * `.chart-legend`: `margin-top: chart-legend-margin-top` (2.5rem), `chart-legend-font-size`
	 * (13px), `chart-legend-color` (`body-secondary-color`), centred.
	 *
	 * The classic theme builds this list in JavaScript from the chart's own datasets; here it is markup,
	 * because the series are known at author time and a script that writes DOM would be the one
	 * part of the page nobody could read.
	 */
	const legend = "mt-10 flex justify-center text-center text-xs text-muted-foreground";
	const legendItem = "inline-flex items-center not-first:ml-4";
	const legendDot = "mr-1.5 inline-block size-2 rounded-full";

	const months = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];

	/** `overviewChart` — the second dataset ("Hours Worked") ships `hidden: true`. */
	const lineData = [0, 10, 5, 15, 10, 20, 15, 25, 20, 30, 25, 40].map((earned, i) => ({
		month: months[i],
		earned,
	}));

	const lineConfig = {
		earned: { label: "Earned", color: "var(--chart-1)" },
	} satisfies Chart.ChartConfig;

	/** `feedChart` — likewise, its "Affiliate" dataset is hidden. */
	const barData = [25, 20, 30, 22, 17, 10, 18, 26, 28, 26, 20, 32].map((sales, i) => ({
		month: months[i],
		sales,
	}));

	const barConfig = {
		sales: { label: "Sales", color: "var(--chart-1)" },
	} satisfies Chart.ChartConfig;

	/**
	 * `trafficChart`. Its `backgroundColor` array is `["#2C7BE5", "#A6C5F7", "#D2DDEC"]`, which
	 * is `chart-colors` keys `primary-700`, `primary-300` and `primary-100` — and those are
	 * exactly `--chart-1`, `--chart-2` and `--chart-3` in this theme. No approximation.
	 */
	const doughnutData = [
		{ channel: "Direct", share: 60, color: "var(--chart-1)" },
		{ channel: "Organic", share: 25, color: "var(--chart-2)" },
		{ channel: "Referral", share: 15, color: "var(--chart-3)" },
	];

	const doughnutConfig = {
		Direct: { label: "Direct", color: "var(--chart-1)" },
		Organic: { label: "Organic", color: "var(--chart-2)" },
		Referral: { label: "Referral", color: "var(--chart-3)" },
	} satisfies Chart.ChartConfig;

	/** `sparklineChartSocialOne`, drawn in `#D2DDEC` with axes and tooltips switched off. */
	const sparklineData = [0, 15, 10, 25, 30, 15, 40, 50, 80, 60, 55, 65].map((value, i) => ({
		i,
		value,
	}));

	const sparklineConfig = {
		value: { label: "Value", color: "var(--chart-3)" },
	} satisfies Chart.ChartConfig;

	const conversionLabels = Array.from({ length: 12 }, (_, i) => `Oct ${i + 1}`);
	const conversions2020 = [25, 20, 30, 22, 17, 10, 18, 26, 28, 26, 20, 32];
	const conversions2019 = [15, 10, 20, 12, 7, 0, 8, 16, 18, 16, 10, 22];

	/** `conversionsChart` — the switch ADDS the 2019 series beside 2020 rather than replacing it. */
	const conversionsData = conversionLabels.map((day, i) => ({
		day,
		"2020": conversions2020[i],
		"2019": conversions2019[i],
	}));

	const conversionsConfig = {
		"2020": { label: "2020", color: "var(--chart-1)" },
		"2019": { label: "2019", color: "var(--chart-3)" },
	} satisfies Chart.ChartConfig;

	let compare = $state(false);

	const salesLabels = [
		"Oct 1",
		"Oct 3",
		"Oct 6",
		"Oct 9",
		"Oct 12",
		"Oct 5",
		"Oct 18",
		"Oct 21",
		"Oct 24",
		"Oct 27",
		"Oct 30",
	];

	/** `salesChart` — the tabs REPLACE the visible series, one at a time. */
	const salesSeries = {
		All: [0, 10, 5, 15, 10, 20, 15, 25, 20, 30, 25],
		Direct: [7, 40, 12, 27, 34, 17, 19, 30, 28, 32, 24],
		Organic: [2, 12, 35, 25, 36, 25, 34, 16, 4, 14, 15],
	} as const;

	type SalesKey = keyof typeof salesSeries;

	let salesTab = $state<SalesKey>("All");

	/**
	 * The Sales morph is NOT the spline's own `motion` prop: LayerChart 2.1 hard-codes that
	 * path tween's options (`SplineState` passes only `interpolate` through, so it always runs
	 * 400ms linear whatever the prop says). Instead this reproduces what Chart.js actually
	 * does — tween the VALUES and redraw from them each frame. Seeding zeros makes the first
	 * `$effect` run the entrance rise Chart.js gives every new chart. Values are kept to one
	 * decimal so a tooltip opened mid-tween reads "$12.3k", not fifteen digits — a tenth of a
	 * unit is under a pixel here, so the rounding never shows in the path.
	 */
	const salesValues = new Tween(
		salesSeries.All.map(() => 0),
		{ duration: 1000, easing: quartOut },
	);

	$effect(() => {
		salesValues.set([...salesSeries[salesTab]], {
			duration: prefersReducedMotion.current ? 0 : 1000,
		});
	});

	const salesData = $derived(
		salesLabels.map((day, i) => ({ day, value: Math.round(salesValues.current[i] * 10) / 10 })),
	);

	/**
	 * Pinned to the ACTIVE TAB, not the tweening data — Chart.js recomputes the scale from the
	 * incoming datasets the moment `update()` is called, so the axis snaps while the line is
	 * still on its way. Deriving the domain from `salesData` instead would make the top of the
	 * scale glide (and the tick set churn) for the whole second.
	 */
	const salesMax = $derived(Math.max(...salesSeries[salesTab]));

	const salesConfig = {
		value: { label: "Sales", color: "var(--chart-1)" },
	} satisfies Chart.ChartConfig;

	/**
	 * `.nav-tabs.nav-tabs-sm.card-header-tabs`: `nav-tabs-font-size-sm` is 13px and
	 * `nav-tabs-link-margin-x-sm` is .5rem, against the 15px / .75rem of the full-size tabs on
	 * the Page headers page. The active link keeps the 1px primary underline.
	 *
	 * `.card-header-tabs` bleeds over the header's 12px vertical padding (`margin: -12px 0` —
	 * the ul's `-my-3 self-stretch`) so each link spans the full 60px header and its text shares
	 * the title's vertical centre. The `-mb-px` sits on the ITEM, where the stretch algorithm
	 * turns it into one extra pixel of height, dropping the link's underline ONTO the header's
	 * rule instead of leaving it one pixel above — same port note as on the Page headers page.
	 */
	const cardTab =
		"flex h-full items-center border-b border-transparent text-xs transition-colors text-muted-foreground hover:text-foreground";
	const cardTabActive = "border-primary text-foreground";

	/** Dollar and percent axis formats, from the Chart.js `ticks.callback` in each demo. */
	const dollars = (v: unknown) => `$${v}k`;
	const percent = (v: unknown) => `${v}%`;

	/**
	 * THE CLASSIC THEME'S CHART.JS DEFAULTS, set once in `theme.bundle.js` and therefore invisible in the
	 * per-chart config. They are the reason the originals look the way they do, and reading them
	 * is what this section needed:
	 *
	 *   elements.line.tension       0.4    curved, not straight
	 *   elements.line.borderWidth   3      (2 on the sparkline, set per chart)
	 *   elements.point.radius       0      no dots
	 *   elements.bar.borderRadius   10     with `borderSkipped: false`, so every corner
	 *   datasets.bar.maxBarThickness 10    thin bars, whatever the category width
	 *   datasets.doughnut.cutout    83%    a ring, not a pie — LayerChart reads an
	 *                                      `innerRadius` between 0 and 1 as a fraction of the
	 *                                      outer radius, so `0.83` IS the cutout, and it stays
	 *                                      right at any size
	 *   elements.arc.borderWidth    4      in `chart-arc-border-color` (`white`), which is the
	 *                                      card surface — the slices are separated by a gap the
	 *                                      colour of what is behind them
	 *   scales.category.grid.display false only horizontal gridlines
	 *
	 * `tension` and d3's curves are parameterised differently, but they meet on these demos.
	 * Chart.js (`splineCurve`) puts each control point at `tension × s01` of the prev→next
	 * span, where `s01` is the chord-length ratio — ≈ 0.5 on the evenly spaced categories used
	 * here, so ≈ 0.2 of the span at the classic theme's `tension: 0.4`. d3's cardinal family puts it at
	 * `(1 − T) / 6`, so `T = -0.2` lands on the same 0.2 (`curveCatmullRom`, the previous
	 * choice, sits at ~1/6 and read slightly tighter than the originals).
	 */
	const lineCurve = curveCardinal.tension(-0.2);

	/**
	 * `maxBarThickness` is a CAP in Chart.js — bars shrink below it when the category is narrow.
	 * LayerChart takes a fixed `width` instead, so this is the cap expressed as the value it
	 * resolves to at any width these demos are shown at.
	 */
	const barWidth = 10;

	/**
	 * One more invisible Chart.js default: every `chart.update()` ANIMATES — 1000ms of
	 * `easeOutQuart` (`animation.duration` / `animation.easing`, untouched by the classic theme). That is
	 * the whole "Toggle chart data" effect in the original: its plugin only mutates the datasets
	 * and calls `update()`, and Chart.js tweens each ELEMENT from its old values to the new ones
	 * while the scales snap to the new domain instantly — Chart.js never animates a scale.
	 *
	 * The theme carries this on the two toggle charts only (the original animates every chart's
	 * entrance too; adding a tween to marks a demo never updates would be motion for its own
	 * sake), with two owned differences. LayerChart retargets the same tween on container
	 * resize, which Chart.js explicitly zeroes (`transitions.resize`), so a window drag glides
	 * here where the original snaps. And per the app-wide rule in `app.css`,
	 * `prefers-reduced-motion` switches the whole thing off — the original ignores it.
	 */
	const chartMotion = $derived(
		prefersReducedMotion.current
			? { type: "none" as const }
			: { type: "tween" as const, duration: 1000, easing: quartOut },
	);

	/* ---------------------------------------------------------------------------------------
	 * THE CHART APPENDIX.
	 *
	 * Everything below this line is the chart demo set, appended after the
	 * sections above. Each demo is expressed in the LayerChart
	 * idiom this page already uses — `Chart.Container` + the simplified `BarChart` /
	 * `AreaChart` components — with the demo's own series data, coloured through
	 * `--chart-N`.
	 *
	 * THE TRANSLATION, once for all sections rather than per chart:
	 *
	 * - recharts' per-demo custom `<ChartTooltipContent>` (dot indicator, "<month> 2024"
	 *   label over a border, value right-aligned) is what the house `Chart.Tooltip` renders
	 *   by default; only the year suffix needs `labelFormatter`.
	 * - `<defs>` with `<pattern>`/`<linearGradient>`/`<filter>` go into the chart's
	 *   `belowMarks` snippet, which LayerChart renders inside the SVG before the marks —
	 *   the fills then reference them by id exactly as upstream does. Ids are normalised to
	 *   a `chartN-` prefix matching the source file number, because upstream's own ids
	 *   drifted (demo 9 still calls its pattern "chart6-").
	 * - recharts hides an axis by omitting it; here that is `axis="x"` (bar/area demos show
	 *   only the category axis) or `axis="y"` (the horizontal-bar demo). `cursor={false}`
	 *   becomes `highlight={false}`, and a missing `<CartesianGrid>` becomes `grid={false}`.
	 * - The trend badges take the
	 *   house `{state}-subtle` variants, per the status vocabulary in
	 *   `docs/CONVENTIONS.md` §3.
	 *
	 * demo 1 ("Basic bar chart") is deliberately NOT here: the classic "Bar" section
	 * above already documents a basic single-series bar chart, and demo 1 differs from it
	 * only by the card header every other section below carries anyway.
	 */

	/** Upstream's tooltips all label the hovered category "<value> 2024". */
	const year2024 = (v: unknown) => `${v} 2024`;

	/** recharts `tickFormatter={(value) => value.slice(0, 3)}`, for full-name month data. */
	const monthShort = (v: unknown) => String(v).slice(0, 3);

	const monthsFull = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];

	/** demo 2 — two datasets side by side. */
	const marketShareData = [
		{ month: "January", desktop: 120, mobile: 80 },
		{ month: "February", desktop: 250, mobile: 200 },
		{ month: "March", desktop: 230, mobile: 120 },
		{ month: "April", desktop: 70, mobile: 190 },
		{ month: "May", desktop: 209, mobile: 130 },
		{ month: "June", desktop: 210, mobile: 140 },
	];

	const marketShareConfig = {
		desktop: { label: "Desktop", color: "var(--chart-1)" },
		mobile: { label: "Mobile", color: "var(--chart-2)" },
	} satisfies Chart.ChartConfig;

	/**
	 * The half-year desktop/mobile series demo 3 and demo 9 share verbatim —
	 * upstream repeats the array, here it is one constant.
	 */
	const halfYearTraffic = [
		{ month: "Jan", desktop: 340, mobile: 180 },
		{ month: "Feb", desktop: 870, mobile: 420 },
		{ month: "Mar", desktop: 510, mobile: 280 },
		{ month: "Apr", desktop: 620, mobile: 350 },
		{ month: "May", desktop: 450, mobile: 240 },
		{ month: "Jun", desktop: 780, mobile: 390 },
	];

	const userAcqConfig = {
		desktop: { label: "Desktop", color: "var(--chart-1)" },
		mobile: { label: "Mobile", color: "var(--chart-2)" },
	} satisfies Chart.ChartConfig;

	/**
	 * The 12-month series demo 4 and demo 5 share verbatim. `months` is the
	 * classic-theme constant declared at the top of this file.
	 */
	const annualBarData = [300, 550, 400, 630, 460, 780, 390, 925, 645, 530, 700, 270].map(
		(desktop, i) => ({ month: months[i], desktop }),
	);

	/** demo 4 colours its single series `--chart-2`.. */
	const trafficPatternConfig = {
		desktop: { label: "Desktop", color: "var(--chart-2)" },
	} satisfies Chart.ChartConfig;

	/** ...and demo 5 colours the same data `--chart-1`. */
	const productSalesConfig = {
		desktop: { label: "Desktop", color: "var(--chart-1)" },
	} satisfies Chart.ChartConfig;

	/** demo 6. */
	const regional3dData = [340, 600, 510, 620, 450, 780, 390, 920, 640, 530, 800, 270].map(
		(desktop, i) => ({ month: months[i], desktop }),
	);

	const regional3dConfig = {
		desktop: { label: "Desktop", color: "var(--chart-1)" },
	} satisfies Chart.ChartConfig;

	/** demo 7. */
	const engagementData = [120, 250, 200, 170, 209, 210, 150, 230, 180, 190, 200, 120].map(
		(desktop, i) => ({ month: months[i], desktop }),
	);

	const engagementConfig = {
		desktop: { label: "Desktop", color: "var(--chart-3)" },
	} satisfies Chart.ChartConfig;

	/** demo 8. */
	const forecast3dData = [340, 870, 510, 620, 450, 780, 390, 920, 640, 530, 800, 270].map(
		(desktop, i) => ({ month: months[i], desktop }),
	);

	const forecast3dConfig = {
		desktop: { label: "Desktop", color: "var(--chart-5)" },
	} satisfies Chart.ChartConfig;

	/** demo 9 — both series deliberately the SAME hue; the pattern is the contrast. */
	const retentionConfig = {
		desktop: { label: "Desktop", color: "var(--chart-2)" },
		mobile: { label: "Mobile", color: "var(--chart-2)" },
	} satisfies Chart.ChartConfig;

	/** demo 10. */
	const efficiencyData = [300, 600, 500, 600, 400, 780, 390, 920, 640, 530, 800, 270].map(
		(desktop, i) => ({ month: months[i], desktop }),
	);

	const efficiencyConfig = {
		desktop: { label: "Desktop", color: "var(--chart-1)" },
	} satisfies Chart.ChartConfig;

	/** demo 11. */
	const monoBarData = [289, 345, 412, 478, 534, 456, 523, 589, 467, 398, 356, 423].map(
		(desktop, i) => ({ month: monthsFull[i], desktop }),
	);

	const monoBarConfig = {
		desktop: { label: "Desktop", color: "var(--chart-4)" },
	} satisfies Chart.ChartConfig;

	/** Index of the hovered bar in the animated monochrome chart; none on mouse-out. */
	let monoBarActive = $state<number | undefined>(undefined);

	/**
	 * How wide a bar rests when it is not hovered — `collapsedWidth` in demo 11's
	 * `CustomBar` shape.
	 */
	const monoBarCollapsed = 6;

	/** demo 12. */
	const inventoryData = [
		{ month: "Jan", desktop: 342, mobile: 245 },
		{ month: "Feb", desktop: 876, mobile: 654 },
		{ month: "Mar", desktop: 512, mobile: 389 },
		{ month: "Apr", desktop: 629, mobile: 521 },
		{ month: "May", desktop: 458, mobile: 367 },
		{ month: "Jun", desktop: 781, mobile: 598 },
	];

	const inventoryConfig = {
		desktop: { label: "Desktop", color: "var(--chart-1)" },
		mobile: { label: "Mobile", color: "var(--chart-2)" },
	} satisfies Chart.ChartConfig;

	/** demo 13. */
	const visitorsData = [2400, 2850, 2600, 3100, 2900, 3400].map((visitors, i) => ({
		month: monthsFull[i],
		visitors,
	}));

	const visitorsConfig = {
		visitors: { label: "Visitors", color: "var(--chart-1)" },
	} satisfies Chart.ChartConfig;

	/** demo 14. */
	const trafficSourcesData = [
		{ month: "January", organic: 1200, paid: 580, referral: 320 },
		{ month: "February", organic: 1450, paid: 620, referral: 380 },
		{ month: "March", organic: 1380, paid: 540, referral: 420 },
		{ month: "April", organic: 1650, paid: 710, referral: 460 },
		{ month: "May", organic: 1520, paid: 680, referral: 390 },
		{ month: "June", organic: 1800, paid: 750, referral: 510 },
	];

	const trafficSourcesConfig = {
		organic: { label: "Organic", color: "var(--chart-1)" },
		paid: { label: "Paid", color: "var(--chart-2)" },
		referral: { label: "Referral", color: "var(--chart-3)" },
	} satisfies Chart.ChartConfig;

	/** demo 15 — a step chart, so the values plateau on purpose. */
	const connectionsData = [48, 62, 62, 85, 85, 110, 110, 135].map((connections, i) => ({
		month: monthsFull[i],
		connections,
	}));

	const connectionsConfig = {
		connections: { label: "Connections", color: "var(--chart-2)" },
	} satisfies Chart.ChartConfig;

	/** demo 16. */
	const signupsData = [64, 78, 52, 92, 85, 110, 98, 125].map((signups, i) => ({
		week: `W${i + 1}`,
		signups,
	}));

	const signupsConfig = {
		signups: { label: "Signups", color: "var(--chart-3)" },
	} satisfies Chart.ChartConfig;

	/** demo 17. */
	const salesForecastData = [2600, 4200, 2400, 5000, 2800, 5800, 3200, 6200, 3800].map(
		(forecast, i) => ({ month: monthsFull[i], forecast }),
	);

	const salesForecastConfig = {
		forecast: { label: "Forecast", color: "var(--chart-4)" },
	} satisfies Chart.ChartConfig;

	/** demo 18. */
	const requestVolumeData = [
		{ month: "January", api: 1820, webhook: 1640 },
		{ month: "February", api: 2340, webhook: 2160 },
		{ month: "March", api: 1960, webhook: 1880 },
		{ month: "April", api: 2780, webhook: 2540 },
		{ month: "May", api: 2100, webhook: 1920 },
		{ month: "June", api: 3120, webhook: 2880 },
		{ month: "July", api: 2540, webhook: 2320 },
		{ month: "August", api: 3480, webhook: 3160 },
		{ month: "September", api: 2860, webhook: 2580 },
		{ month: "October", api: 2420, webhook: 2140 },
		{ month: "November", api: 3240, webhook: 2960 },
		{ month: "December", api: 2680, webhook: 2440 },
	];

	const requestVolumeConfig = {
		api: { label: "API Calls", color: "var(--chart-1)" },
		webhook: { label: "Webhooks", color: "var(--chart-3)" },
	} satisfies Chart.ChartConfig;

	/**
	 * The face geometry of the `True3DBar` shape both 3D demos share (demo 6 and
	 * demo 8, identical maths, different paint). Given the front face, it derives
	 * the back face, the right-side parallelogram and the top parallelogram, with the
	 * depth capped at 15px as upstream caps it.
	 */
	function bar3dFaces(x: number, y: number, width: number, height: number) {
		const depth = Math.min(width * 0.3, 15);
		return {
			back: { x: x + depth, y: y - depth, width, height },
			right: `${x + width + 3},${y - 3} ${x + width + depth - 3},${y - depth + 3} ${x + width + depth - 3},${y + height - depth - 3} ${x + width + 3},${y + height - 3}`,
			top: `${x + 3},${y - 3} ${x + width - 3},${y - 3} ${x + width + depth - 3},${y - depth + 3} ${x + depth + 3},${y - depth + 3}`,
		};
	}

	/* ---------------------------------------------------------------------------------------
	 * The remaining demos — donuts (demo 19..22), radars (demo 23/24) and the
	 * radial bars (demo 25) — continue the same standing block:
	 *
	 * - recharts' `<Pie>` becomes the house `PieChart`; a per-slice `<Cell fill="url(#…)">`
	 *   becomes a `props: { fill }` field ON THE DATUM, which `PieChart` merges into that
	 *   slice's `Arc` last — so the pattern/gradient wins the fill while `c="color"` keeps
	 *   feeding the solid token to the tooltip swatch and legend.
	 * - recharts' `<Label content={…}>` centre text becomes two LayerChart `Text`s in
	 *   `aboveMarks`: the pie layer is centred, so (0,0) is the middle of the ring.
	 * - the radar demos have no simplified counterpart; `LineChart` with `radial` is the
	 *   LayerChart idiom (band x over [0, 2π], y as the radius), with a closed spline for
	 *   the recharts `<Radar>` polygon. `PolarGrid`'s dashed polygons render as the radial
	 *   grid's dashed circles, and tooltip hit-testing switches to `voronoi`, the only mode
	 *   that finds the nearest point in polar coordinates.
	 * - `RadialBarChart` is `ArcChart`: one series per datum, ring i stepping inward via
	 *   the negative-radius offsets, and recharts' `background` is the built-in track.
	 */

	/**
	 * recharts' `paddingAngle` is degrees; the d3 `padAngle` LayerChart takes is radians.
	 * One converter instead of four magic numbers.
	 */
	const padDeg = (degrees: number) => (degrees * Math.PI) / 180;

	/** demo 19 — every slice fades vertically through a gradient of its own hue. */
	const visitSourcesData = [
		{ source: "direct", label: "Direct", visits: 4200, color: "var(--chart-1)" },
		{ source: "search", label: "Search", visits: 3600, color: "var(--chart-2)" },
		{ source: "social", label: "Social", visits: 2800, color: "var(--chart-3)" },
		{ source: "email", label: "Email", visits: 1900, color: "var(--chart-4)" },
		{ source: "referral", label: "Referral", visits: 1400, color: "var(--chart-5)" },
	].map((d) => ({ ...d, props: { fill: `url(#chart19-${d.source})` } }));

	const visitSourcesTotal = visitSourcesData.reduce((sum, d) => sum + d.visits, 0);

	const visitSourcesConfig = {
		direct: { label: "Direct", color: "var(--chart-1)" },
		search: { label: "Search", color: "var(--chart-2)" },
		social: { label: "Social", color: "var(--chart-3)" },
		email: { label: "Email", color: "var(--chart-4)" },
		referral: { label: "Referral", color: "var(--chart-5)" },
	} satisfies Chart.ChartConfig;

	/** demo 20. The `label` field feeds the legend, which has no config to read. */
	const taskStatusData = [
		{ status: "completed", label: "Completed", count: 186, color: "var(--chart-1)" },
		{ status: "inProgress", label: "In Progress", count: 94, color: "var(--chart-2)" },
		{ status: "pending", label: "Pending", count: 62, color: "var(--chart-3)" },
		{ status: "cancelled", label: "Cancelled", count: 28, color: "var(--chart-5)" },
	];

	const taskStatusTotal = taskStatusData.reduce((sum, d) => sum + d.count, 0);
	const taskStatusCompletionRate = Math.round((taskStatusData[0].count / taskStatusTotal) * 100);

	const taskStatusConfig = {
		completed: { label: "Completed", color: "var(--chart-1)" },
		inProgress: { label: "In Progress", color: "var(--chart-2)" },
		pending: { label: "Pending", color: "var(--chart-3)" },
		cancelled: { label: "Cancelled", color: "var(--chart-5)" },
	} satisfies Chart.ChartConfig;

	/**
	 * demo 21 — critical is striped, medium is dotted, the others solid. Upstream
	 * colours critical `--destructive` directly, which is exactly the house negative token.
	 */
	const bugPriorityData = [
		{
			priority: "critical",
			label: "Critical",
			bugs: 14,
			color: "var(--destructive)",
			props: { fill: "url(#chart21-critical)" },
		},
		{ priority: "high", label: "High", bugs: 28, color: "var(--chart-4)" },
		{
			priority: "medium",
			label: "Medium",
			bugs: 42,
			color: "var(--chart-3)",
			props: { fill: "url(#chart21-medium)" },
		},
		{ priority: "low", label: "Low", bugs: 36, color: "var(--chart-5)" },
	];

	const bugPriorityConfig = {
		critical: { label: "Critical", color: "var(--destructive)" },
		high: { label: "High", color: "var(--chart-4)" },
		medium: { label: "Medium", color: "var(--chart-3)" },
		low: { label: "Low", color: "var(--chart-5)" },
	} satisfies Chart.ChartConfig;

	/** demo 22. */
	const conversionFunnelData = [
		{ plan: "free", label: "Free", users: 12800, color: "var(--chart-5)" },
		{ plan: "starter", label: "Starter", users: 5400, color: "var(--chart-3)" },
		{ plan: "pro", label: "Pro", users: 3600, color: "var(--chart-2)" },
		{ plan: "enterprise", label: "Enterprise", users: 1200, color: "var(--chart-1)" },
	];

	const conversionFunnelTotal = conversionFunnelData.reduce((sum, d) => sum + d.users, 0);
	const conversionFunnelPaid = conversionFunnelTotal - conversionFunnelData[0].users;
	const conversionFunnelRate = ((conversionFunnelPaid / conversionFunnelTotal) * 100).toFixed(1);

	const conversionFunnelConfig = {
		free: { label: "Free", color: "var(--chart-5)" },
		starter: { label: "Starter", color: "var(--chart-3)" },
		pro: { label: "Pro", color: "var(--chart-2)" },
		enterprise: { label: "Enterprise", color: "var(--chart-1)" },
	} satisfies Chart.ChartConfig;

	/** demo 23. */
	const skillRadarData = [
		{ skill: "Frontend", score: 92 },
		{ skill: "Backend", score: 78 },
		{ skill: "DevOps", score: 68 },
		{ skill: "Design", score: 74 },
		{ skill: "Testing", score: 85 },
		{ skill: "Security", score: 62 },
	];

	const skillRadarConfig = {
		score: { label: "Proficiency", color: "var(--chart-1)" },
	} satisfies Chart.ChartConfig;

	/** demo 24. */
	const infraRadarData = [
		{ metric: "Speed", value: 88 },
		{ metric: "Reliability", value: 94 },
		{ metric: "Scalability", value: 72 },
		{ metric: "Cost", value: 68 },
		{ metric: "Security", value: 82 },
		{ metric: "DX", value: 78 },
	];

	const infraRadarConfig = {
		value: { label: "Score", color: "var(--chart-2)" },
	} satisfies Chart.ChartConfig;

	/**
	 * demo 25. recharts draws the FIRST datum innermost; `ArcChart` gives series 0
	 * the full radius and steps the rest inward, so the array is ordered api → mobile to
	 * keep the upstream picture (API outermost). The one visible consequence: the legend
	 * reads API, Desktop, Mobile where upstream reads it the other way around.
	 */
	const lighthouseData = [
		{ name: "api", label: "API", score: 92, color: "var(--chart-1)" },
		{ name: "desktop", label: "Desktop", score: 76, color: "var(--chart-2)" },
		{ name: "mobile", label: "Mobile", score: 58, color: "var(--chart-4)" },
	];

	/** One arc per datum; the per-series `props.fill` points at that ring's gradient. */
	const lighthouseSeries = lighthouseData.map((d) => ({
		key: d.name,
		label: d.label,
		color: d.color,
		data: [d],
		props: { fill: `url(#chart25-${d.name})` },
	}));

	const lighthouseConfig = {
		api: { label: "API", color: "var(--chart-1)" },
		desktop: { label: "Desktop", color: "var(--chart-2)" },
		mobile: { label: "Mobile", color: "var(--chart-4)" },
	} satisfies Chart.ChartConfig;
</script>

<DocPage title="Chart">
	{#snippet subtitle()}
		Charts drawn with LayerChart and dressed in the theme's own tokens, which is what
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/chart"
			target="_blank"
			rel="noreferrer">shadcn-svelte's Chart</a
		>
		wraps. Every series below is sample data — no chart on this page fetches anything.
	{/snippet}

	<DocSection title="Line">
		{#snippet blurb()}
			Points joined into a line — the default shape for a value tracked over time, or for two series
			compared against each other.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Chart.Container config={lineConfig} class={chartBox}>
					<LineChart
						data={lineData}
						x="month"
						series={[{ key: "earned", label: "Earned", color: lineConfig.earned.color }]}
						props={{
							spline: { curve: lineCurve, class: "stroke-3" },
							xAxis: { format: (v: unknown) => String(v) },
							yAxis: { format: dollars },
							grid: { x: false },
						}}
					/>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Bar">
		{#snippet blurb()}
			Vertical bars for discrete values — the natural shape when several series need to sit side by
			side.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Chart.Container config={barConfig} class={chartBox}>
					<BarChart
						data={barData}
						x="month"
						series={[{ key: "sales", label: "Sales", color: barConfig.sales.color }]}
						props={{
							yAxis: { format: dollars },
							bars: { width: barWidth, radius: barWidth / 2, rounded: "all", strokeWidth: 0 },
							grid: { x: false },
						}}
					/>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Doughnut">
		{#snippet blurb()}
			One ring, one whole: each segment reads as a share of the total.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					`.chart-appended` shortens the chart by exactly the height the legend below will
					take, so the card ends up the same height as one holding a plain `.chart`.
				-->
				<Chart.Container config={doughnutConfig} class="{chartAppended} mx-auto aspect-square">
					<!--
						`padding={2}`: Chart.js resolves the ring's outer radius to height/2 minus HALF
						the 4px arc border (118px of a 240px canvas) — the stroke is centred on the path,
						so this parks its outer edge exactly on the container edge. Anything larger
						shrinks the whole ring below the original's.
					-->
					<PieChart
						data={doughnutData}
						key="channel"
						value="share"
						c="color"
						innerRadius={0.83}
						padding={2}
						props={{ arc: { stroke: "var(--card)", strokeWidth: 4 } }}
					>
						{#snippet tooltip()}
							<Chart.Tooltip hideLabel />
						{/snippet}
					</PieChart>
				</Chart.Container>

				<div class={legend}>
					{#each doughnutData as slice (slice.channel)}
						<span class={legendItem}>
							<span class={legendDot} style="background-color: {slice.color}"></span>
							{slice.channel}
						</span>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Sparkline">
		{#snippet blurb()}
			The line chart shrunk to a glance: no axes, no tooltip, no interaction.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<!--
					The classic theme switches off both scales, the point hover radius and the tooltip. `axis` and
					`grid` off plus no `tooltip` snippet is the LayerChart equivalent.
				-->
				<Chart.Container config={sparklineConfig} class={sparklineBox}>
					<LineChart
						data={sparklineData}
						x="i"
						series={[{ key: "value", label: "Value", color: sparklineConfig.value.color }]}
						axis={false}
						grid={false}
						rule={false}
						padding={{ top: 2, bottom: 2, left: 0, right: 0 }}
						props={{
							spline: { curve: lineCurve, class: "stroke-2" },
							highlight: { points: false },
						}}
					/>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<DocSection title="Toggle chart data">
		{#snippet blurb()}
			Series a reader can switch on and off. Nothing declarative drives it: the visible set is
			ordinary reactive state, and the chart redraws from whatever is left in it.
		{/snippet}

		<div class="flex flex-col gap-6">
			<Card.Root>
				<Card.Header class="flex items-center justify-between gap-4">
					<Card.Title>Conversions</Card.Title>
					<div class="flex items-center gap-3">
						<span class="text-sm text-muted-foreground">Last year comparison:</span>
						<!--
							`data-action="add"`: the switch ADDS a series rather than replacing one. The
							bars' `motion` tweens the relayout the way `update()` does, with one owned
							difference: the 2019 bars enter by growing up from the baseline (LayerChart's
							enter choreography), where the original slides the pair apart from their
							shared centre at full height. That split would need a custom `marks` snippet.
						-->
						<Switch bind:checked={compare} aria-label="Compare with last year" />
					</div>
				</Card.Header>
				<Card.Content>
					<Chart.Container config={conversionsConfig} class={chartBox}>
						<!--
							`bandPadding={0.2}` is Chart.js's `categoryPercentage: 0.8` (its default, not a
							classic-theme override): the pair of series slots spans 80% of the category step, so
							with the default `groupPadding` of 0 each 10px pill centres in a 0.4 × step
							slot — the same group gap as the original once the switch is on.
						-->
						<BarChart
							data={conversionsData}
							x="day"
							series={compare
								? [
										{ key: "2020", label: "2020", color: conversionsConfig["2020"].color },
										{ key: "2019", label: "2019", color: conversionsConfig["2019"].color },
									]
								: [{ key: "2020", label: "2020", color: conversionsConfig["2020"].color }]}
							seriesLayout="group"
							bandPadding={0.2}
							props={{
								yAxis: { format: percent },
								bars: {
									width: barWidth,
									radius: barWidth / 2,
									rounded: "all",
									strokeWidth: 0,
									motion: chartMotion,
								},
								grid: { x: false },
							}}
						/>
					</Chart.Container>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Header class="flex items-center justify-between gap-4">
					<Card.Title>Sales</Card.Title>
					<!-- `data-action="toggle"`: the tabs REPLACE the visible series, one at a time. -->
					<ul class="-my-3 flex self-stretch">
						{#each Object.keys(salesSeries) as SalesKey[] as label (label)}
							<li class="mx-2 -mb-px first:ml-0 last:mr-0">
								<button
									type="button"
									class={cn(cardTab, salesTab === label && cardTabActive)}
									onclick={() => (salesTab = label)}
								>
									{label}
								</button>
							</li>
						{/each}
					</ul>
				</Card.Header>
				<Card.Content>
					<Chart.Container config={salesConfig} class={chartBox}>
						<LineChart
							data={salesData}
							x="day"
							yDomain={[0, salesMax]}
							series={[{ key: "value", label: "Sales", color: salesConfig.value.color }]}
							props={{
								spline: { curve: lineCurve, class: "stroke-3" },
								yAxis: { format: dollars },
								grid: { x: false },
							}}
						/>
					</Chart.Container>
				</Card.Content>
			</Card.Root>
		</div>
	</DocSection>

	<!--
		The sections from here down are the chart demo set,
		rendered per the "CHART APPENDIX" note in the script block above.
	-->

	<!-- demo 2: two series side by side, `seriesLayout="group"`. -->
	<DocSection title="Multi-dataset bar chart">
		<Card.Root class="w-full max-w-md">
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					Market Share
					<Badge variant="warning-subtle"><TrendingUpIcon aria-hidden="true" />+12%</Badge>
				</Card.Title>
				<Card.Description>Departmental performance comparison</Card.Description>
			</Card.Header>
			<Card.Content>
				<Chart.Container config={marketShareConfig} class="w-full">
					<BarChart
						data={marketShareData}
						x="month"
						series={[
							{ key: "desktop", label: "Desktop", color: marketShareConfig.desktop.color },
							{ key: "mobile", label: "Mobile", color: marketShareConfig.mobile.color },
						]}
						seriesLayout="group"
						axis="x"
						highlight={false}
						props={{
							xAxis: { format: monthShort },
							bars: { rounded: "all", strokeWidth: 0 },
						}}
					>
						{#snippet tooltip()}
							<Chart.Tooltip class="min-w-40" labelFormatter={year2024} />
						{/snippet}
					</BarChart>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 3: the striped series next to a solid one. The stripe `<pattern>` goes in
		`belowMarks` — LayerChart renders that snippet inside the SVG before the marks, which
		is where recharts puts its `<defs>` — and the desktop series references it by id.
	-->
	<DocSection title="Diagonal stripe bar chart">
		<Card.Root class="w-full max-w-md">
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					User Acquisition
					<Badge variant="destructive-subtle"><TrendingDownIcon aria-hidden="true" />-15%</Badge>
				</Card.Title>
				<Card.Description>Quarterly user growth tracking</Card.Description>
			</Card.Header>
			<Card.Content>
				<Chart.Container config={userAcqConfig} class="w-full">
					<BarChart
						data={halfYearTraffic}
						x="month"
						series={[
							{
								key: "desktop",
								label: "Desktop",
								color: userAcqConfig.desktop.color,
								props: {
									fill: "url(#chart3-stripe)",
									stroke: userAcqConfig.desktop.color,
									strokeWidth: 1,
								},
							},
							{
								key: "mobile",
								label: "Mobile",
								color: userAcqConfig.mobile.color,
								props: { stroke: userAcqConfig.mobile.color, strokeWidth: 1 },
							},
						]}
						seriesLayout="group"
						axis="x"
						grid={false}
						highlight={false}
						props={{
							bars: { rounded: "all" },
						}}
					>
						{#snippet belowMarks()}
							<defs>
								<pattern id="chart3-stripe" patternUnits="userSpaceOnUse" width="8" height="8">
									<rect width="8" height="8" fill={userAcqConfig.desktop.color} opacity="0.1" />
									<path
										d="M0,8 L8,0 M4,12 L12,4 M-4,4 L4,-4"
										stroke={userAcqConfig.desktop.color}
										stroke-width="1.5"
										opacity="0.6"
									/>
									<path
										d="M2,10 L10,2 M6,14 L14,6 M-2,6 L6,-2"
										stroke={userAcqConfig.desktop.color}
										stroke-width="1"
										opacity="0.3"
									/>
								</pattern>
							</defs>
						{/snippet}
						{#snippet tooltip()}
							<Chart.Tooltip class="min-w-40" labelFormatter={year2024} />
						{/snippet}
					</BarChart>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 4: dots at the pattern-tile corners over a light wash of the same hue. -->
	<DocSection title="Dotted pattern bar chart">
		<Card.Root class="w-full max-w-md">
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					Website Traffic
					<Badge variant="success-subtle"><TrendingUpIcon aria-hidden="true" />+8%</Badge>
				</Card.Title>
				<Card.Description>Monthly visitor behavior patterns</Card.Description>
			</Card.Header>
			<Card.Content>
				<Chart.Container config={trafficPatternConfig} class="w-full">
					<BarChart
						data={annualBarData}
						x="month"
						series={[
							{ key: "desktop", label: "Desktop", color: trafficPatternConfig.desktop.color },
						]}
						axis="x"
						grid={false}
						highlight={false}
						props={{
							bars: {
								rounded: "all",
								fill: "url(#chart4-dots)",
								stroke: trafficPatternConfig.desktop.color,
								strokeWidth: 1,
							},
						}}
					>
						{#snippet belowMarks()}
							<defs>
								<pattern id="chart4-dots" patternUnits="userSpaceOnUse" width="5" height="5">
									<rect
										width="5"
										height="5"
										fill={trafficPatternConfig.desktop.color}
										opacity="0.1"
									/>
									<circle
										cx="5"
										cy="5"
										r="1.4"
										fill={trafficPatternConfig.desktop.color}
										opacity="0.6"
									/>
								</pattern>
							</defs>
						{/snippet}
						{#snippet tooltip()}
							<Chart.Tooltip class="min-w-40" labelFormatter={year2024} />
						{/snippet}
					</BarChart>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 5. The meta title promises "striped and solid", but the source renders a
		single striped series — the striped-beside-solid pairing is the "Diagonal stripe bar
		chart" above. Ported as the source renders, titled as the docs title it.
	-->
	<DocSection title="Striped and solid bar chart">
		<Card.Root class="w-full max-w-md">
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					Product Sales
					<Badge variant="success-subtle"><TrendingUpIcon aria-hidden="true" />+4.3%</Badge>
				</Card.Title>
				<Card.Description>Annual sales trend visualization</Card.Description>
			</Card.Header>
			<Card.Content>
				<Chart.Container config={productSalesConfig} class="w-full">
					<BarChart
						data={annualBarData}
						x="month"
						series={[{ key: "desktop", label: "Desktop", color: productSalesConfig.desktop.color }]}
						axis="x"
						grid={false}
						highlight={false}
						props={{
							bars: {
								rounded: "all",
								fill: "url(#chart5-stripe)",
								stroke: productSalesConfig.desktop.color,
								strokeWidth: 1,
							},
						}}
					>
						{#snippet belowMarks()}
							<defs>
								<pattern id="chart5-stripe" patternUnits="userSpaceOnUse" width="8" height="8">
									<rect
										width="8"
										height="8"
										fill={productSalesConfig.desktop.color}
										opacity="0.1"
									/>
									<path
										d="M0,8 L8,0 M4,12 L12,4 M-4,4 L4,-4"
										stroke={productSalesConfig.desktop.color}
										stroke-width="1.5"
										opacity="0.6"
									/>
									<path
										d="M2,10 L10,2 M6,14 L14,6 M-2,6 L6,-2"
										stroke={productSalesConfig.desktop.color}
										stroke-width="1"
										opacity="0.3"
									/>
								</pattern>
							</defs>
						{/snippet}
						{#snippet tooltip()}
							<Chart.Tooltip class="min-w-40" labelFormatter={year2024} />
						{/snippet}
					</BarChart>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 6: recharts takes a custom `shape` component; the LayerChart equivalent
		is a custom `marks` snippet, which replaces the default `Bars` — so the four faces of
		each bar are drawn from the band/linear scales directly, with `bar3dFaces` doing the
		same arithmetic as upstream's `True3DBar`. The tooltip still works: LayerChart's
		hover detection reads the data, not the marks.
	-->
	<DocSection title="3D gradient bar chart">
		<Card.Root class="w-full max-w-md">
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					Regional Performance
					<Badge variant="success-subtle"><TrendingUpIcon aria-hidden="true" />+15.7%</Badge>
				</Card.Title>
				<Card.Description>Global sales distribution by region</Card.Description>
			</Card.Header>
			<Card.Content>
				<Chart.Container config={regional3dConfig} class="w-full">
					<BarChart
						data={regional3dData}
						x="month"
						series={[{ key: "desktop", label: "Desktop", color: regional3dConfig.desktop.color }]}
						axis="x"
						grid={false}
						highlight={false}
						bandPadding={0.2}
						padding={{ top: 24, right: 20 }}
					>
						{#snippet belowMarks()}
							<defs>
								<linearGradient id="chart6-front" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="0%"
										stop-color={regional3dConfig.desktop.color}
										stop-opacity="0.9"
									/>
									<stop
										offset="100%"
										stop-color={regional3dConfig.desktop.color}
										stop-opacity="0.7"
									/>
								</linearGradient>
								<linearGradient id="chart6-back" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="0%"
										stop-color={regional3dConfig.desktop.color}
										stop-opacity="0.5"
									/>
									<stop
										offset="100%"
										stop-color={regional3dConfig.desktop.color}
										stop-opacity="0.3"
									/>
								</linearGradient>
								<linearGradient id="chart6-side" x1="0" y1="0" x2="1" y2="0">
									<stop
										offset="0%"
										stop-color={regional3dConfig.desktop.color}
										stop-opacity="0.6"
									/>
									<stop
										offset="100%"
										stop-color={regional3dConfig.desktop.color}
										stop-opacity="0.4"
									/>
								</linearGradient>
								<linearGradient id="chart6-top" x1="0" y1="0" x2="1" y2="1">
									<stop
										offset="0%"
										stop-color={regional3dConfig.desktop.color}
										stop-opacity="0.7"
									/>
									<stop
										offset="100%"
										stop-color={regional3dConfig.desktop.color}
										stop-opacity="0.5"
									/>
								</linearGradient>
							</defs>
						{/snippet}
						{#snippet marks({ context })}
							{@const bandwidth = context.xScale.bandwidth?.() ?? 0}
							{@const baseline = context.yScale(0)}
							{#each regional3dData as d (d.month)}
								{@const x = context.xScale(d.month)}
								{@const y = context.yScale(d.desktop)}
								{@const faces = bar3dFaces(x, y, bandwidth, baseline - y)}
								<rect
									x={faces.back.x}
									y={faces.back.y}
									width={faces.back.width}
									height={faces.back.height}
									rx="3"
									fill="url(#chart6-back)"
								/>
								<polygon points={faces.right} fill="url(#chart6-side)" />
								<polygon points={faces.top} fill="url(#chart6-top)" />
								<rect
									{x}
									{y}
									width={bandwidth}
									height={baseline - y}
									rx="3"
									fill="url(#chart6-front)"
								/>
							{/each}
						{/snippet}
						{#snippet tooltip()}
							<Chart.Tooltip class="min-w-40" labelFormatter={year2024} />
						{/snippet}
					</BarChart>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 7: upstream's `CustomGradientBar` shape only swaps the fill for a
		vertical fade and widens the corner radius — no custom geometry — so here it is the
		default bars with a gradient fill and `radius: 6`.
	-->
	<DocSection title="Gradient bar chart">
		<Card.Root class="w-full max-w-md">
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					Engagement Metrics
					<Badge variant="success-subtle"><TrendingUpIcon aria-hidden="true" />+2.4%</Badge>
				</Card.Title>
				<Card.Description>User interaction and click-through rates</Card.Description>
			</Card.Header>
			<Card.Content>
				<Chart.Container config={engagementConfig} class="w-full">
					<BarChart
						data={engagementData}
						x="month"
						series={[{ key: "desktop", label: "Desktop", color: engagementConfig.desktop.color }]}
						axis="x"
						grid={false}
						highlight={false}
						bandPadding={0.15}
						props={{
							bars: { rounded: "all", radius: 6, fill: "url(#chart7-gradient)", stroke: "none" },
						}}
					>
						{#snippet belowMarks()}
							<defs>
								<linearGradient id="chart7-gradient" x1="0" y1="0" x2="0" y2="1">
									<stop
										offset="0%"
										stop-color={engagementConfig.desktop.color}
										stop-opacity="0.7"
									/>
									<stop
										offset="50%"
										stop-color={engagementConfig.desktop.color}
										stop-opacity="0.4"
									/>
									<stop
										offset="100%"
										stop-color={engagementConfig.desktop.color}
										stop-opacity="0.2"
									/>
								</linearGradient>
							</defs>
						{/snippet}
						{#snippet tooltip()}
							<Chart.Tooltip class="min-w-40" labelFormatter={year2024} />
						{/snippet}
					</BarChart>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 8: the same `True3DBar` faces as the 3D gradient chart above, but painted
		flat — one hue at four opacities (back 0.6, side 0.7, top 0.8, front 1) instead of
		four gradients.
	-->
	<DocSection title="3D isometric bar chart">
		<Card.Root class="w-full max-w-md">
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					Financial Forecast
					<Badge variant="destructive-subtle"><TrendingDownIcon aria-hidden="true" />-8.2%</Badge>
				</Card.Title>
				<Card.Description>Projected vs actual revenue growth</Card.Description>
			</Card.Header>
			<Card.Content>
				<Chart.Container config={forecast3dConfig} class="w-full">
					<BarChart
						data={forecast3dData}
						x="month"
						series={[{ key: "desktop", label: "Desktop", color: forecast3dConfig.desktop.color }]}
						axis="x"
						grid={false}
						highlight={false}
						bandPadding={0.2}
						padding={{ top: 24, right: 20 }}
					>
						{#snippet marks({ context })}
							{@const bandwidth = context.xScale.bandwidth?.() ?? 0}
							{@const baseline = context.yScale(0)}
							{@const fill = forecast3dConfig.desktop.color}
							{#each forecast3dData as d (d.month)}
								{@const x = context.xScale(d.month)}
								{@const y = context.yScale(d.desktop)}
								{@const faces = bar3dFaces(x, y, bandwidth, baseline - y)}
								<rect
									x={faces.back.x}
									y={faces.back.y}
									width={faces.back.width}
									height={faces.back.height}
									rx="3"
									{fill}
									opacity="0.6"
								/>
								<polygon points={faces.right} {fill} opacity="0.7" />
								<polygon points={faces.top} {fill} opacity="0.8" />
								<rect {x} {y} width={bandwidth} height={baseline - y} rx="3" {fill} />
							{/each}
						{/snippet}
						{#snippet tooltip()}
							<Chart.Tooltip class="min-w-40" labelFormatter={year2024} />
						{/snippet}
					</BarChart>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 9: dotted beside solid, both series the SAME `--chart-2` — the texture,
		not the hue, tells them apart. Upstream's dot radius here is 1.4 at full opacity,
		against the 0.6 of the dotted chart above.
	-->
	<DocSection title="Dotted and solid bar chart">
		<Card.Root class="w-full max-w-md">
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					Customer Retention
					<Badge variant="success-subtle"><TrendingUpIcon aria-hidden="true" />+18.4%</Badge>
				</Card.Title>
				<Card.Description>Customer loyalty across segments</Card.Description>
			</Card.Header>
			<Card.Content>
				<Chart.Container config={retentionConfig} class="w-full">
					<BarChart
						data={halfYearTraffic}
						x="month"
						series={[
							{
								key: "desktop",
								label: "Desktop",
								color: retentionConfig.desktop.color,
								props: {
									fill: "url(#chart9-dots)",
									stroke: retentionConfig.desktop.color,
									strokeWidth: 1,
								},
							},
							{
								key: "mobile",
								label: "Mobile",
								color: retentionConfig.mobile.color,
								props: { stroke: retentionConfig.mobile.color, strokeWidth: 1 },
							},
						]}
						seriesLayout="group"
						axis="x"
						grid={false}
						highlight={false}
						props={{
							bars: { rounded: "all" },
						}}
					>
						{#snippet belowMarks()}
							<defs>
								<pattern id="chart9-dots" patternUnits="userSpaceOnUse" width="5" height="5">
									<rect width="5" height="5" fill={retentionConfig.desktop.color} opacity="0.1" />
									<circle cx="5" cy="5" r="1.4" fill={retentionConfig.desktop.color} opacity="1" />
								</pattern>
							</defs>
						{/snippet}
						{#snippet tooltip()}
							<Chart.Tooltip class="min-w-40" labelFormatter={year2024} />
						{/snippet}
					</BarChart>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 10: a hard 50%/50% horizontal gradient — the left half of every bar at
		0.4 opacity, the right half solid. `objectBoundingBox` units (the SVG default) make
		the split per bar, exactly as upstream's per-shape gradient does.
	-->
	<DocSection title="Duotone gradient bar chart">
		<Card.Root class="w-full max-w-md">
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					Operational Efficiency
					<Badge variant="success-subtle"><TrendingUpIcon aria-hidden="true" />+12.5%</Badge>
				</Card.Title>
				<Card.Description>Supply chain performance metrics</Card.Description>
			</Card.Header>
			<Card.Content>
				<Chart.Container config={efficiencyConfig} class="w-full">
					<BarChart
						data={efficiencyData}
						x="month"
						series={[{ key: "desktop", label: "Desktop", color: efficiencyConfig.desktop.color }]}
						axis="x"
						grid={false}
						highlight={false}
						props={{
							bars: { rounded: "all", fill: "url(#chart10-duotone)", stroke: "none" },
						}}
					>
						{#snippet belowMarks()}
							<defs>
								<linearGradient id="chart10-duotone" x1="0" y1="0" x2="1" y2="0">
									<stop
										offset="50%"
										stop-color={efficiencyConfig.desktop.color}
										stop-opacity="0.4"
									/>
									<stop offset="50%" stop-color={efficiencyConfig.desktop.color} />
								</linearGradient>
							</defs>
						{/snippet}
						{#snippet tooltip()}
							<Chart.Tooltip class="min-w-40" labelFormatter={year2024} />
						{/snippet}
					</BarChart>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 11: every bar rests collapsed at 6px; hovering one springs it open to the
		full band and prints its value above, while the header echoes that value. Upstream
		animates with `motion/react`; here the geometry moves with a CSS transition on the
		rect's `x`/`width` (geometry properties are animatable CSS in current browsers — the
		attributes carry the same values as a static fallback). One divergence: upstream's
		hover target is the 6px sliver itself, so the interaction is nearly impossible to
		hit; here an invisible band-wide rect catches the hover instead.
	-->
	<DocSection title="Animated monochrome bar chart">
		{#snippet blurb()}
			Hover a bar to expand it in place and read its value.
		{/snippet}
		<Card.Root class="w-full max-w-md">
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					Conversion Rates
					<span class="ml-auto font-mono text-xl tracking-tighter">
						${monoBarActive === undefined ? "123" : monoBarData[monoBarActive].desktop}
					</span>
					<Badge variant="success-subtle"><TrendingUpIcon aria-hidden="true" />5.2%</Badge>
				</Card.Title>
				<Card.Description>Real-time funnel conversion tracking</Card.Description>
			</Card.Header>
			<Card.Content>
				<Chart.Container
					config={monoBarConfig}
					class="w-full"
					onmouseleave={() => (monoBarActive = undefined)}
				>
					<BarChart
						data={monoBarData}
						x="month"
						series={[{ key: "desktop", label: "Desktop", color: monoBarConfig.desktop.color }]}
						axis="x"
						grid={false}
						highlight={false}
						padding={{ top: 24 }}
						props={{
							xAxis: { format: monthShort },
						}}
					>
						{#snippet marks({ context })}
							{@const bandwidth = context.xScale.bandwidth?.() ?? 0}
							{@const baseline = context.yScale(0)}
							{#each monoBarData as d, i (d.month)}
								{@const x = context.xScale(d.month)}
								{@const y = context.yScale(d.desktop)}
								{@const active = monoBarActive === i}
								{@const barX = active ? x : x + (bandwidth - monoBarCollapsed) / 2}
								{@const barWidthPx = active ? bandwidth : monoBarCollapsed}
								<!-- Hover-only decoration; the tooltip carries the accessible reading. -->
								<g role="presentation" onmouseenter={() => (monoBarActive = i)}>
									<!-- Band-wide hover catcher; see the section comment. -->
									<rect {x} {y} width={bandwidth} height={baseline - y} fill="transparent" />
									<rect
										x={barX}
										{y}
										width={barWidthPx}
										height={baseline - y}
										rx="3"
										fill={monoBarConfig.desktop.color}
										style="x: {barX}px; width: {barWidthPx}px; transition: x 0.3s ease, width 0.3s ease;"
									/>
									{#if active}
										<text
											x={x + bandwidth / 2}
											y={y - 5}
											text-anchor="middle"
											fill={monoBarConfig.desktop.color}
											class="font-mono text-xs"
										>
											{d.desktop}
										</text>
									{/if}
								</g>
							{/each}
						{/snippet}
						{#snippet tooltip()}
							<Chart.Tooltip class="min-w-40" labelFormatter={year2024} />
						{/snippet}
					</BarChart>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 12: recharts `layout="vertical"` — categories on the y axis, values
		running horizontally — is LayerChart's `orientation="horizontal"`, and the hidden
		numeric axis becomes `axis="y"`.
	-->
	<DocSection title="Vertical bar chart">
		<Card.Root class="w-full max-w-md">
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					Inventory Levels
					<Badge variant="destructive-subtle"><TrendingDownIcon aria-hidden="true" />-3.2%</Badge>
				</Card.Title>
				<Card.Description>Stock availability across warehouses</Card.Description>
			</Card.Header>
			<Card.Content>
				<Chart.Container config={inventoryConfig} class="w-full">
					<BarChart
						data={inventoryData}
						y="month"
						orientation="horizontal"
						series={[
							{ key: "desktop", label: "Desktop", color: inventoryConfig.desktop.color },
							{ key: "mobile", label: "Mobile", color: inventoryConfig.mobile.color },
						]}
						seriesLayout="group"
						axis="y"
						grid={false}
						highlight={false}
						bandPadding={0.3}
						props={{
							bars: { rounded: "all", radius: 2 },
						}}
					>
						{#snippet tooltip()}
							<Chart.Tooltip class="min-w-40" labelFormatter={year2024} />
						{/snippet}
					</BarChart>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 13: a smooth area over a vertical fade. The source also defines a stripe
		pattern — the "overlay" its docs title promises — but never references it, so what
		renders, there and here, is the gradient alone; the dead def is not reproduced.
		recharts `type="natural"` is d3's `curveNatural`, an exact match.
	-->
	<DocSection title="Gradient area chart with stripe overlay">
		<Card.Root class="w-full max-w-md">
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					Website Traffic
					<Badge variant="success-subtle"><TrendingUpIcon aria-hidden="true" />+24.5%</Badge>
				</Card.Title>
				<Card.Description>Monthly unique visitor trends</Card.Description>
			</Card.Header>
			<Card.Content>
				<Chart.Container config={visitorsConfig} class="w-full">
					<AreaChart
						data={visitorsData}
						x="month"
						series={[{ key: "visitors", label: "Visitors", color: visitorsConfig.visitors.color }]}
						axis="x"
						grid={{ y: { dashArray: "3 3" } }}
						padding={{ top: 20 }}
						props={{
							xAxis: { format: monthShort },
							area: {
								curve: curveNatural,
								fill: "url(#chart13-gradient)",
								fillOpacity: 1,
								line: { stroke: visitorsConfig.visitors.color, class: "stroke-2" },
							},
						}}
					>
						{#snippet belowMarks()}
							<defs>
								<linearGradient id="chart13-gradient" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stop-color={visitorsConfig.visitors.color} stop-opacity="0.5" />
									<stop
										offset="95%"
										stop-color={visitorsConfig.visitors.color}
										stop-opacity="0.05"
									/>
								</linearGradient>
							</defs>
						{/snippet}
						{#snippet tooltip()}
							<Chart.Tooltip class="min-w-40" labelFormatter={year2024} />
						{/snippet}
					</AreaChart>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 14: three stacked channels, each faded by its own gradient. The two lower
		strokes are thin and dashed; the top one is solid and heavier. recharts stacks in
		declaration order (first at the bottom) and so does LayerChart's
		`seriesLayout="stack"`, so the order is referral, paid, organic — as upstream.
	-->
	<DocSection title="Stacked area chart with dashed strokes">
		<Card.Root class="w-full max-w-md">
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					Traffic Sources
					<Badge variant="success-subtle"><TrendingUpIcon aria-hidden="true" />+18.3%</Badge>
				</Card.Title>
				<Card.Description>Visitor acquisition by channel</Card.Description>
			</Card.Header>
			<Card.Content>
				<Chart.Container config={trafficSourcesConfig} class="w-full">
					<AreaChart
						data={trafficSourcesData}
						x="month"
						series={[
							{
								key: "referral",
								label: "Referral",
								color: trafficSourcesConfig.referral.color,
								props: {
									fill: "url(#chart14-referral)",
									fillOpacity: 0.4,
									line: {
										stroke: trafficSourcesConfig.referral.color,
										strokeWidth: 0.8,
										"stroke-dasharray": "3 3",
									},
								},
							},
							{
								key: "paid",
								label: "Paid",
								color: trafficSourcesConfig.paid.color,
								props: {
									fill: "url(#chart14-paid)",
									fillOpacity: 0.4,
									line: {
										stroke: trafficSourcesConfig.paid.color,
										strokeWidth: 0.8,
										"stroke-dasharray": "3 3",
									},
								},
							},
							{
								key: "organic",
								label: "Organic",
								color: trafficSourcesConfig.organic.color,
								props: {
									fill: "url(#chart14-organic)",
									fillOpacity: 0.4,
									line: { stroke: trafficSourcesConfig.organic.color, strokeWidth: 2 },
								},
							},
						]}
						seriesLayout="stack"
						axis="x"
						grid={{ y: { dashArray: "3 3" } }}
						padding={{ top: 20 }}
						props={{
							xAxis: { format: monthShort },
							area: { curve: curveNatural },
						}}
					>
						{#snippet belowMarks()}
							<defs>
								{#each Object.entries(trafficSourcesConfig) as [key, entry] (key)}
									<linearGradient id="chart14-{key}" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stop-color={entry.color} stop-opacity="0.5" />
										<stop offset="95%" stop-color={entry.color} stop-opacity="0.1" />
									</linearGradient>
								{/each}
							</defs>
						{/snippet}
						{#snippet tooltip()}
							<Chart.Tooltip class="min-w-40" labelFormatter={year2024} />
						{/snippet}
					</AreaChart>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 15: `type="stepAfter"` is d3's `curveStepAfter`, and the plateau fills
		with a dot grid. The source also defines a stroke gradient it never applies — the
		line is drawn solid, there and here — so that dead def is not reproduced either.
	-->
	<DocSection title="Step area chart with dotted pattern fill">
		<Card.Root class="w-full max-w-md">
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					Active Connections
					<Badge variant="success-subtle"><TrendingUpIcon aria-hidden="true" />+257%</Badge>
				</Card.Title>
				<Card.Description>Server connection pool over time</Card.Description>
			</Card.Header>
			<Card.Content>
				<Chart.Container config={connectionsConfig} class="w-full">
					<AreaChart
						data={connectionsData}
						x="month"
						series={[
							{
								key: "connections",
								label: "Connections",
								color: connectionsConfig.connections.color,
							},
						]}
						axis="x"
						grid={{ y: { dashArray: "3 3" } }}
						padding={{ top: 20 }}
						props={{
							xAxis: { format: monthShort },
							area: {
								curve: curveStepAfter,
								fill: "url(#chart15-dots)",
								fillOpacity: 1,
								line: { stroke: connectionsConfig.connections.color, class: "stroke-2" },
							},
						}}
					>
						{#snippet belowMarks()}
							<defs>
								<pattern id="chart15-dots" patternUnits="userSpaceOnUse" width="5" height="5">
									<rect
										width="5"
										height="5"
										fill={connectionsConfig.connections.color}
										opacity="0.08"
									/>
									<circle
										cx="2.5"
										cy="2.5"
										r="1"
										fill={connectionsConfig.connections.color}
										opacity="0.5"
									/>
								</pattern>
							</defs>
						{/snippet}
						{#snippet tooltip()}
							<Chart.Tooltip class="min-w-40" labelFormatter={year2024} />
						{/snippet}
					</AreaChart>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 16: the glow is two `feGaussianBlur` filters — a wide one on the line, a
		tight one on every dot — composited under the sharp original. The dots are the
		`points` layer (recharts `dot`), and the hovered point grows from r 4 to r 6 through
		the highlight, as upstream's `activeDot` does.
	-->
	<DocSection title="Area chart with glowing dot markers">
		<Card.Root class="w-full max-w-md">
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					New Signups
					<Badge variant="success-subtle"><TrendingUpIcon aria-hidden="true" />+144%</Badge>
				</Card.Title>
				<Card.Description>Weekly user registration trends</Card.Description>
			</Card.Header>
			<Card.Content>
				<Chart.Container config={signupsConfig} class="w-full">
					<AreaChart
						data={signupsData}
						x="week"
						series={[{ key: "signups", label: "Signups", color: signupsConfig.signups.color }]}
						axis="x"
						grid={{ y: { dashArray: "3 3" } }}
						padding={{ top: 20 }}
						points={{
							r: 4,
							fill: signupsConfig.signups.color,
							stroke: "var(--background)",
							strokeWidth: 2,
							filter: "url(#chart16-dot-glow)",
						}}
						props={{
							area: {
								curve: curveNatural,
								fill: "url(#chart16-fill)",
								fillOpacity: 1,
								line: {
									stroke: signupsConfig.signups.color,
									strokeWidth: 2,
									filter: "url(#chart16-line-glow)",
								},
							},
							highlight: { points: { r: 6 } },
						}}
					>
						{#snippet belowMarks()}
							<defs>
								<linearGradient id="chart16-fill" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stop-color={signupsConfig.signups.color} stop-opacity="0.35" />
									<stop offset="95%" stop-color={signupsConfig.signups.color} stop-opacity="0" />
								</linearGradient>
								<filter id="chart16-dot-glow" x="-50%" y="-50%" width="200%" height="200%">
									<feGaussianBlur stdDeviation="3" result="blur" />
									<feComposite in="SourceGraphic" in2="blur" operator="over" />
								</filter>
								<filter id="chart16-line-glow" x="-10%" y="-20%" width="120%" height="140%">
									<feGaussianBlur stdDeviation="8" result="blur" />
									<feComposite in="SourceGraphic" in2="blur" operator="over" />
								</filter>
							</defs>
						{/snippet}
						{#snippet tooltip()}
							<Chart.Tooltip class="min-w-36" />
						{/snippet}
					</AreaChart>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 17: a line over a stripe-hatched zone down to the baseline. Upstream
		duplicates the series (`forecast` for the `<Line>`, `forecastArea` for the
		`<Area>`, tooltip and legend suppressed on the copy) because recharts needs two
		components; a LayerChart Area with its `line` enabled is both at once, so the copy
		disappears and the tooltip/legend show one entry with nothing to suppress.
	-->
	<DocSection title="Forecast line chart with stripe pattern zone">
		<Card.Root class="w-full max-w-md">
			<Card.Header>
				<Card.Title>Sales Forecast</Card.Title>
				<Card.Description>Projected sales performance with trends</Card.Description>
			</Card.Header>
			<Card.Content>
				<!--
					The `div` exists so `salesForecastRow` is a lexically scoped snippet: declared
					directly under `Card.Content` it would be read as one of that component's props.
				-->
				<div>
					{#snippet salesForecastRow(row: {
						value: unknown;
						name: string;
						item: { color?: string };
					})}
						<!-- The house tooltip row, with the dollar prefix of upstream's `formatter`. -->
						<div class="flex w-full items-center justify-between gap-2">
							<div class="flex items-center gap-1.5">
								<div
									class="size-2.5 shrink-0 rounded-[2px]"
									style="background-color: {row.item.color}"
								></div>
								<span class="text-muted-foreground">{row.name}</span>
							</div>
							<span class="font-mono font-medium text-foreground tabular-nums">
								${Number(row.value).toLocaleString()}
							</span>
						</div>
					{/snippet}
					<Chart.Container config={salesForecastConfig} class="w-full">
						<AreaChart
							data={salesForecastData}
							x="month"
							series={[
								{ key: "forecast", label: "Forecast", color: salesForecastConfig.forecast.color },
							]}
							axis="x"
							grid={{ y: { dashArray: "3 3" } }}
							legend={{ placement: "bottom" }}
							padding={{ top: 20 }}
							props={{
								xAxis: { format: monthShort },
								area: {
									curve: curveNatural,
									fill: "url(#chart17-stripe)",
									fillOpacity: 1,
									line: { stroke: salesForecastConfig.forecast.color, strokeWidth: 2.5 },
								},
							}}
						>
							{#snippet belowMarks()}
								<defs>
									<pattern id="chart17-stripe" patternUnits="userSpaceOnUse" width="6" height="6">
										<rect
											width="6"
											height="6"
											fill={salesForecastConfig.forecast.color}
											opacity="0.04"
										/>
										<path
											d="M0,6 L6,0"
											stroke={salesForecastConfig.forecast.color}
											stroke-width="0.8"
											opacity="0.15"
										/>
									</pattern>
								</defs>
							{/snippet}
							{#snippet tooltip()}
								<Chart.Tooltip
									class="min-w-40"
									labelFormatter={year2024}
									formatter={salesForecastRow}
								/>
							{/snippet}
						</AreaChart>
					</Chart.Container>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 18: two stacked series, each filled with a crosshatch of its own colour —
		one diagonal at 0.4 opacity, the counter-diagonal at 0.2. Webhooks stack under API
		calls, as upstream declares them.
	-->
	<DocSection title="Stacked area chart with crosshatch pattern fill">
		<Card.Root class="w-full max-w-md">
			<Card.Header>
				<Card.Title class="flex items-center gap-2">
					Request Volume
					<Badge variant="success-subtle"><TrendingUpIcon aria-hidden="true" />+12.8%</Badge>
				</Card.Title>
				<Card.Description>API and webhook traffic over 12 months</Card.Description>
			</Card.Header>
			<Card.Content>
				<Chart.Container config={requestVolumeConfig} class="w-full">
					<AreaChart
						data={requestVolumeData}
						x="month"
						series={[
							{
								key: "webhook",
								label: "Webhooks",
								color: requestVolumeConfig.webhook.color,
								props: {
									fill: "url(#chart18-crosshatch-webhook)",
									fillOpacity: 0.5,
									line: { stroke: requestVolumeConfig.webhook.color, strokeWidth: 1 },
								},
							},
							{
								key: "api",
								label: "API Calls",
								color: requestVolumeConfig.api.color,
								props: {
									fill: "url(#chart18-crosshatch-api)",
									fillOpacity: 0.5,
									line: { stroke: requestVolumeConfig.api.color, strokeWidth: 1 },
								},
							},
						]}
						seriesLayout="stack"
						axis="x"
						grid={{ y: { dashArray: "3 3" } }}
						padding={{ top: 20 }}
						props={{
							xAxis: { format: monthShort },
							area: { curve: curveNatural },
						}}
					>
						{#snippet belowMarks()}
							<defs>
								{#each Object.entries(requestVolumeConfig) as [key, entry] (key)}
									<pattern
										id="chart18-crosshatch-{key}"
										patternUnits="userSpaceOnUse"
										width="8"
										height="8"
									>
										<path d="M0,8 L8,0" stroke={entry.color} stroke-width="0.8" opacity="0.4" />
										<path d="M0,0 L8,8" stroke={entry.color} stroke-width="0.8" opacity="0.2" />
									</pattern>
								{/each}
							</defs>
						{/snippet}
						{#snippet tooltip()}
							<Chart.Tooltip class="min-w-40" labelFormatter={year2024} />
						{/snippet}
					</AreaChart>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 19: a donut with per-slice vertical fades, a soft drop shadow and the
		grand total in the hole. recharts hangs one `feDropShadow` on the whole `<Pie>`;
		`Arc` props land on the slice path, so the same filter rides on every slice — with
		the pad gaps between slices the composite reads the same. The gradient per slice is
		the per-datum `props.fill` mechanism described in the script block.
	-->
	<DocSection title="Donut chart with center total">
		<Card.Root class="w-full max-w-xs">
			<Card.Header class="items-center pb-0">
				<Card.Title>Traffic Sources</Card.Title>
				<Card.Description>Where your visitors come from</Card.Description>
			</Card.Header>
			<Card.Content class="flex-1 pb-0">
				<Chart.Container
					config={visitSourcesConfig}
					class="mx-auto aspect-square max-h-[280px] w-full"
				>
					<PieChart
						data={visitSourcesData}
						key="source"
						value="visits"
						c="color"
						innerRadius={65}
						outerRadius={95}
						cornerRadius={8}
						padAngle={padDeg(4)}
						props={{
							arc: {
								stroke: "var(--background)",
								"stroke-width": 4,
								filter: "url(#chart19-shadow)",
							},
						}}
					>
						{#snippet belowMarks()}
							<defs>
								<filter id="chart19-shadow" x="-20%" y="-20%" width="140%" height="140%">
									<feDropShadow dx="0" dy="8" stdDeviation="5" flood-opacity="0.2" />
								</filter>
								{#each visitSourcesData as d (d.source)}
									<linearGradient id="chart19-{d.source}" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stop-color={d.color} stop-opacity="1" />
										<stop offset="100%" stop-color={d.color} stop-opacity="0.8" />
									</linearGradient>
								{/each}
							</defs>
						{/snippet}
						{#snippet aboveMarks()}
							<Text
								value="{(visitSourcesTotal / 1000).toFixed(1)}k"
								textAnchor="middle"
								verticalAnchor="middle"
								class="fill-foreground text-3xl! font-bold tabular-nums"
							/>
							<Text
								value="Total Visits"
								textAnchor="middle"
								verticalAnchor="middle"
								dy={22}
								class="fill-muted-foreground! text-xs"
							/>
						{/snippet}
						{#snippet tooltip()}
							<Chart.Tooltip hideLabel class="min-w-40" />
						{/snippet}
					</PieChart>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 20: plain slices, a bottom legend, and the completion rate in the hole. -->
	<DocSection title="Donut chart with center stats">
		<Card.Root class="w-full max-w-xs">
			<Card.Header class="items-center pb-0">
				<Card.Title>Task Status</Card.Title>
				<Card.Description>Current sprint task breakdown</Card.Description>
			</Card.Header>
			<Card.Content class="flex-1 pb-0">
				<Chart.Container
					config={taskStatusConfig}
					class="mx-auto aspect-square max-h-[280px] w-full"
				>
					<PieChart
						data={taskStatusData}
						key="status"
						value="count"
						c="color"
						innerRadius={60}
						cornerRadius={5}
						padAngle={padDeg(3)}
						legend
						props={{
							arc: { stroke: "var(--background)", "stroke-width": 3 },
						}}
					>
						{#snippet aboveMarks()}
							<Text
								value="{taskStatusCompletionRate}%"
								textAnchor="middle"
								verticalAnchor="middle"
								class="fill-foreground text-3xl! font-bold tabular-nums"
							/>
							<Text
								value="Completed"
								textAnchor="middle"
								verticalAnchor="middle"
								dy={22}
								class="fill-muted-foreground! text-xs"
							/>
						{/snippet}
						{#snippet tooltip()}
							<Chart.Tooltip hideLabel class="min-w-40" />
						{/snippet}
					</PieChart>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 21: severity told through texture — critical is striped, medium dotted,
		high and low solid. The two patterned slices keep their solid token on `color`, so
		the tooltip swatch and legend stay readable while the slice itself takes the fill.
	-->
	<DocSection title="Bug priority pie with stripe patterns">
		<Card.Root class="w-full max-w-xs">
			<Card.Header class="items-center pb-0">
				<Card.Title>Bug Priority</Card.Title>
				<Card.Description>Open issues by severity level</Card.Description>
			</Card.Header>
			<Card.Content class="flex-1 pb-0">
				<Chart.Container
					config={bugPriorityConfig}
					class="mx-auto aspect-square max-h-[300px] w-full"
				>
					<PieChart
						data={bugPriorityData}
						key="priority"
						value="bugs"
						c="color"
						innerRadius={40}
						cornerRadius={4}
						padAngle={padDeg(3)}
						legend
						props={{
							arc: { stroke: "var(--background)", "stroke-width": 3 },
						}}
					>
						{#snippet belowMarks()}
							<defs>
								<pattern id="chart21-critical" patternUnits="userSpaceOnUse" width="6" height="6">
									<rect width="6" height="6" fill="var(--destructive)" opacity="0.3" />
									<path
										d="M0,6 L6,0 M-2,2 L2,-2 M4,8 L8,4"
										stroke="var(--destructive)"
										stroke-width="1.5"
										opacity="0.9"
									/>
								</pattern>
								<pattern id="chart21-medium" patternUnits="userSpaceOnUse" width="5" height="5">
									<rect width="5" height="5" fill="var(--chart-3)" opacity="0.2" />
									<circle cx="2.5" cy="2.5" r="1.2" fill="var(--chart-3)" opacity="0.7" />
								</pattern>
							</defs>
						{/snippet}
						{#snippet tooltip()}
							<Chart.Tooltip hideLabel class="min-w-40" />
						{/snippet}
					</PieChart>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 22: recharts' `activeShape` grows the hovered slice by 10px. LayerChart
		has no active-shape hook, so the custom `arc` snippet compares each slice's datum
		with the tooltip's — the hovered slice takes the full radius and the resting ones
		sit 10px inside it, which is the same 10px swell seen from the other end.
	-->
	<DocSection title="Active segment donut with center label">
		{#snippet blurb()}
			Hover a segment to expand it in place.
		{/snippet}
		<Card.Root class="w-full max-w-xs">
			<Card.Header class="items-center pb-0">
				<Card.Title>Conversion Funnel</Card.Title>
				<Card.Description>{conversionFunnelRate}% of users are on paid plans</Card.Description>
			</Card.Header>
			<Card.Content class="flex-1 pb-0">
				<Chart.Container
					config={conversionFunnelConfig}
					class="mx-auto aspect-square max-h-[300px] w-full"
				>
					<PieChart
						data={conversionFunnelData}
						key="plan"
						value="users"
						c="color"
						innerRadius={55}
						cornerRadius={5}
						padAngle={padDeg(3)}
						legend
						props={{
							arc: { stroke: "var(--background)", "stroke-width": 3 },
						}}
					>
						{#snippet arc({ props, context })}
							<Arc {...props} outerRadius={context.tooltip.data === props.data ? undefined : -10} />
						{/snippet}
						{#snippet aboveMarks()}
							<Text
								value={conversionFunnelPaid.toLocaleString()}
								textAnchor="middle"
								verticalAnchor="middle"
								class="fill-foreground text-2xl! font-bold tabular-nums"
							/>
							<Text
								value="Paid Users"
								textAnchor="middle"
								verticalAnchor="middle"
								dy={20}
								class="fill-muted-foreground! text-xs"
							/>
						{/snippet}
						{#snippet tooltip()}
							<Chart.Tooltip hideLabel class="min-w-40" />
						{/snippet}
					</PieChart>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 23: the radar polygon is a closed spline over a radial band scale, per
		the script-block note. The glow is the same blur-under-source composite as the
		"glowing dot markers" area chart above, here on the whole polygon.
	-->
	<DocSection title="Radar chart with gradient fill">
		<Card.Root class="w-full max-w-xs">
			<Card.Header class="items-center pb-0">
				<Card.Title>Skill Assessment</Card.Title>
				<Card.Description>Team proficiency across key areas</Card.Description>
			</Card.Header>
			<Card.Content class="flex-1 pb-0">
				<Chart.Container
					config={skillRadarConfig}
					class="mx-auto aspect-square max-h-[280px] w-full"
				>
					<LineChart
						data={skillRadarData}
						x="skill"
						radial
						series={[{ key: "score", label: "Proficiency", color: skillRadarConfig.score.color }]}
						axis="x"
						grid={{ x: { dashArray: "3 3" }, y: { dashArray: "3 3" } }}
						rule={false}
						padding={{ top: 24, bottom: 24 }}
						tooltipContext={{ mode: "voronoi" }}
						points={{ r: 4, fill: skillRadarConfig.score.color, strokeWidth: 0 }}
						props={{
							spline: {
								curve: curveLinearClosed,
								fill: "url(#chart23-fill)",
								stroke: skillRadarConfig.score.color,
								strokeWidth: 2,
								filter: "url(#chart23-glow)",
							},
						}}
					>
						{#snippet belowMarks()}
							<defs>
								<linearGradient id="chart23-fill" x1="0" y1="0" x2="0" y2="1">
									<stop offset="0%" stop-color={skillRadarConfig.score.color} stop-opacity="0.5" />
									<stop
										offset="100%"
										stop-color={skillRadarConfig.score.color}
										stop-opacity="0.08"
									/>
								</linearGradient>
								<filter id="chart23-glow" x="-20%" y="-20%" width="140%" height="140%">
									<feGaussianBlur stdDeviation="6" result="blur" />
									<feComposite in="SourceGraphic" in2="blur" operator="over" />
								</filter>
							</defs>
						{/snippet}
						{#snippet tooltip()}
							<Chart.Tooltip />
						{/snippet}
					</LineChart>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 24: same construction as the radar above — diagonal fade, heavier glowing
		stroke, and hollow dots (background fill, coloured ring). Upstream pins the radius
		domain to [0, 100] through its hidden `PolarRadiusAxis`; `yDomain` is that pin.
	-->
	<DocSection title="Filled radar with glowing stroke">
		<Card.Root class="w-full max-w-xs">
			<Card.Header class="items-center pb-0">
				<Card.Title>Infrastructure Score</Card.Title>
				<Card.Description>Platform performance metrics</Card.Description>
			</Card.Header>
			<Card.Content class="flex-1 pb-0">
				<Chart.Container
					config={infraRadarConfig}
					class="mx-auto aspect-square max-h-[280px] w-full"
				>
					<LineChart
						data={infraRadarData}
						x="metric"
						radial
						yDomain={[0, 100]}
						series={[{ key: "value", label: "Score", color: infraRadarConfig.value.color }]}
						axis="x"
						grid={{ x: { dashArray: "3 3" }, y: { dashArray: "3 3" } }}
						rule={false}
						padding={{ top: 24, bottom: 24 }}
						tooltipContext={{ mode: "voronoi" }}
						points={{
							r: 4,
							fill: "var(--background)",
							stroke: infraRadarConfig.value.color,
							strokeWidth: 2.5,
						}}
						props={{
							spline: {
								curve: curveLinearClosed,
								fill: "url(#chart24-fill)",
								stroke: infraRadarConfig.value.color,
								strokeWidth: 2.5,
								filter: "url(#chart24-glow)",
							},
						}}
					>
						{#snippet belowMarks()}
							<defs>
								<linearGradient id="chart24-fill" x1="0" y1="0" x2="1" y2="1">
									<stop offset="0%" stop-color={infraRadarConfig.value.color} stop-opacity="0.45" />
									<stop
										offset="100%"
										stop-color={infraRadarConfig.value.color}
										stop-opacity="0.1"
									/>
								</linearGradient>
								<filter id="chart24-glow" x="-15%" y="-15%" width="130%" height="130%">
									<feGaussianBlur stdDeviation="5" result="blur" />
									<feComposite in="SourceGraphic" in2="blur" operator="over" />
								</filter>
							</defs>
						{/snippet}
						{#snippet tooltip()}
							<Chart.Tooltip />
						{/snippet}
					</LineChart>
				</Chart.Container>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 25: three concentric score rings, each a gradient arc over its own track.
		recharts' `background` is ArcChart's built-in track — drawn in the ring's colour at
		0.1 opacity rather than upstream's flat grey, which is the house component's default
		and reads better on both themes. The `insideStart` value labels become `inner`-placed
		arc labels; upstream paints them raw `#fff`, here they take `fill-background`
		(semantic tokens only), which is the same white over the bars in the light theme.
	-->
	<DocSection title="Lighthouse scores radial with labels">
		<Card.Root class="w-full max-w-xs">
			<Card.Header class="items-center pb-0">
				<Card.Title>Lighthouse Scores</Card.Title>
				<Card.Description>Performance audit by platform</Card.Description>
			</Card.Header>
			<Card.Content class="flex-1 pb-0">
				<!--
					The `div` scopes the `lighthouseRow` snippet lexically, exactly like the
					forecast chart's tooltip row above.
				-->
				<div>
					{#snippet lighthouseRow(row: { value: unknown; name: string; item: { color?: string } })}
						<!-- The house tooltip row, with upstream's "/100" scale suffix. -->
						<div class="flex w-full items-center justify-between gap-2">
							<div class="flex items-center gap-1.5">
								<div
									class="size-2.5 shrink-0 rounded-[2px]"
									style="background-color: {row.item.color}"
								></div>
								<span class="text-muted-foreground">{row.name}</span>
							</div>
							<span class="font-mono font-medium text-foreground tabular-nums">
								{Number(row.value)}/100
							</span>
						</div>
					{/snippet}
					<Chart.Container
						config={lighthouseConfig}
						class="mx-auto aspect-square max-h-[300px] w-full"
					>
						<ArcChart
							series={lighthouseSeries}
							key="name"
							value="score"
							maxValue={100}
							innerRadius={-22}
							outerRadius={-26}
							cornerRadius={10}
							legend
							labels={{
								placement: "inner",
								value: "score",
								class: "fill-background text-[11px] font-semibold",
							}}
							props={{
								arc: { filter: "url(#chart25-glow)" },
							}}
						>
							{#snippet belowMarks()}
								<defs>
									{#each lighthouseData as d (d.name)}
										<linearGradient id="chart25-{d.name}" x1="0" y1="0" x2="1" y2="0">
											<stop offset="0%" stop-color={d.color} stop-opacity="0.5" />
											<stop offset="100%" stop-color={d.color} stop-opacity="1" />
										</linearGradient>
									{/each}
									<filter id="chart25-glow" x="-15%" y="-15%" width="130%" height="130%">
										<feGaussianBlur stdDeviation="3" result="blur" />
										<feComposite in="SourceGraphic" in2="blur" operator="over" />
									</filter>
								</defs>
							{/snippet}
							{#snippet tooltip()}
								<Chart.Tooltip hideLabel class="min-w-40" formatter={lighthouseRow} />
							{/snippet}
						</ArcChart>
					</Chart.Container>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
