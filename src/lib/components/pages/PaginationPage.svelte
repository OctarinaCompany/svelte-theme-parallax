<script lang="ts">
	import ArrowLeftIcon from "@lucide/svelte/icons/arrow-left";
	import ArrowRightIcon from "@lucide/svelte/icons/arrow-right";
	import ChevronFirstIcon from "@lucide/svelte/icons/chevron-first";
	import ChevronLastIcon from "@lucide/svelte/icons/chevron-last";
	import ChevronLeftIcon from "@lucide/svelte/icons/chevron-left";
	import ChevronRightIcon from "@lucide/svelte/icons/chevron-right";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as NativeSelect from "$lib/components/ui/native-select/index.js";
	import * as Pagination from "$lib/components/ui/pagination/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Pagination component page.
	 *
	 * The classic theme shows one card with three sizes and no sub-sections, so this page has no
	 * `DocSection`s.
	 *
	 * The classic theme's own examples are static anchors. These are wired to real state instead —
	 * `Pagination.Root` is a bits-ui component with `count` and `perPage` — because the
	 * component was added to this repo by this page, and a demo that does not paginate would
	 * not show whether it works.
	 */

	/**
	 * The classic framework joins pagination items into one bar: the seam between two links is collapsed
	 * with `margin-left: -1px` and only the outer corners keep a radius. shadcn spaces them
	 * with `gap-1` instead, so all three rules have to be restated.
	 *
	 * They are written as child selectors on the list rather than as classes on each link for
	 * the same reason the list group's borders are: `rounded-md` and `rounded-r-none` on one
	 * unmerged element is a coin toss between two utilities.
	 */
	const list =
		"gap-0 [&>li:not(:first-child)>*]:-ml-px [&>li>*]:rounded-none [&>li:first-child>*]:rounded-l-md [&>li:last-child>*]:rounded-r-md";

	/**
	 * A page link. Every colour below is an exact match except the border:
	 *
	 *   bg-card          `pagination-bg` is `white` in light and `gray-800-dark` in dark —
	 *                    `--card` in both
	 *   text-foreground  `pagination-color` is `black` / `white` — `--foreground` in both
	 *   hover:bg-accent  `pagination-hover-bg` is `gray-100` / `gray-900-dark` — `--accent`
	 *                    in both
	 *   active           `pagination-active-bg: component-active-bg` (= `primary`) with
	 *                    `component-active-color` (= `white`) on top
	 *
	 * The border wants `gray-300` in light and `gray-600-dark` in dark, and `--border` holds
	 * the neighbouring step in each. Same one-step compromise as `.btn-white`, and for the
	 * same reason: neither grey exists as a token, and writing the hex would break the
	 * "semantic tokens, never raw colours" house rule.
	 *
	 * `font-normal` undoes shadcn's `font-medium`; the classic page links are body weight.
	 */
	const link =
		"border border-border bg-card font-normal text-foreground hover:bg-accent hover:text-foreground data-[active=true]:border-primary data-[active=true]:bg-primary data-[active=true]:text-primary-foreground";

	/**
	 * Per size. Heights are `font-size x line-height + 2 x padding-y + 2 x border`, and the
	 * `line-height` is the part worth reading from the reference stylesheet rather than assuming:
	 * The classic theme overrides it to 1.25 at the base size, `line-height-base` (1.5) at `lg`, and
	 * `line-height-sm` (1.75) at `sm`. That is why `sm` is not proportionally smaller.
	 *
	 *   base  15px x 1.25 + 2 x .5rem   + 2px = 36.75px -> h-9
	 *   lg    15px x 1.5  + 2 x .75rem  + 2px = 48.5px  -> h-12
	 *   sm    13px x 1.75 + 2 x .125rem + 2px = 28.75px -> h-7
	 */
	const size = {
		lg: "h-12 px-5 text-sm",
		base: "h-9 px-3 text-sm",
		sm: "h-7 px-2 text-xs",
	} as const;

	/**
	 * The classic theme's "Previous" and "Next" are plain text; shadcn's ship a chevron beside a label
	 * that is hidden below `sm`. The icon is dropped and the label unhidden rather than
	 * rebuilding the two components, which would mean copying their bits-ui wiring.
	 */
	const edge = "[&>svg]:hidden [&>span]:block";

	let pageLg = $state(1);
	let pageBase = $state(1);
	let pageSm = $state(1);

	/**
	 * The sections below came later — the pagination demo set,
	 * appended after the classic card above. Three translations apply to all of them:
	 *
	 * - No static `href="#"` anchors. Every section here is wired to real state
	 *   through `Pagination.Root` instead, for the same reason the classic card above is: a
	 *   demo that does not paginate would not show whether it works.
	 * - The arrow / first / last controls are links too. The house link is a
	 *   bits-ui `Page` and needs a target page object, so those controls get a manual
	 *   `{ type: "page", value }` from {@link pageOf}, clamped at the range edges — bits-ui
	 *   would otherwise happily set page 0.
	 * - No hand-written `size-4` on the icons; the button recipe the links share already
	 *   sizes descendant svgs, so the icons here carry no classes.
	 */

	/** A bits-ui page item for the arrow/first/last link controls. */
	function pageOf(value: number): { type: "page"; value: number } {
		return { type: "page", value };
	}

	// c-pagination-1 … c-pagination-4 — one three-page pager each, started on page 2 so both
	// neighbours render the inactive look, as in the upstream screenshots.
	let basicPage = $state(2);
	let noLabelsPage = $state(2);
	let hoverPage = $state(2);
	let circlePage = $state(2);

	// c-pagination-5 / c-pagination-14 — the go-to-page inputs jump on change, clamped to the
	// page range like the arrows are.
	let gotoPage = $state(1);
	let gotoNumberedPage = $state(1);

	// c-pagination-6 — twelve pages, so the 1-3 and 10-12 groups on either side of the
	// ellipsis both exist.
	let cardPage = $state(1);

	let arrowsPage = $state(1); // c-pagination-7
	let infoCenterPage = $state(1); // c-pagination-8
	let infoLeftPage = $state(1); // c-pagination-9
	let ellipsisPage = $state(1); // demo 10
	let outlinePage = $state(3); // demo 11 — index 2, i.e. page 3, starts active.

	// c-pagination-12 — 100 rows; the per-page select drives both the range info and the page
	// count, and shrinking the page count clamps the current page back into range.
	const rowsTotal = 100;
	let rowsPerPageValue = $state("25");
	let rowsPage = $state(1);
	const rowsPerPageCount = $derived(Number(rowsPerPageValue));
	const rowsTotalPages = $derived(Math.ceil(rowsTotal / rowsPerPageCount));
	const rowsRangeStart = $derived((rowsPage - 1) * rowsPerPageCount + 1);
	const rowsRangeEnd = $derived(Math.min(rowsPage * rowsPerPageCount, rowsTotal));

	// c-pagination-13 — the select and the four arrows move the same page state, so the
	// select's value is derived from it rather than bound.
	let pageSelectPage = $state(1);

	// c-pagination-15 — same clamp-on-shrink rule as c-pagination-12.
	const fullBarTotal = 100;
	let fullBarPage = $state(1);
	let fullBarPerPageValue = $state("10");
	const fullBarPerPageCount = $derived(Number(fullBarPerPageValue));
	const fullBarTotalPages = $derived(Math.ceil(fullBarTotal / fullBarPerPageCount));
</script>

<DocPage title="Pagination">
	{#snippet subtitle()}
		Numbered navigation for content split across several pages. Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/pagination"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<!--
			`gap-4` is the classic reboot margin on a `<ul>` (1rem), which Tailwind's preflight
			removes — without it the three bars would touch and read as one control.
		-->
		<Card.Content class="flex flex-col gap-4">
			<!-- `.pagination-lg`, and the one example the classic theme gives no "Previous" link. -->
			<Pagination.Root count={30} perPage={10} bind:page={pageLg} class="mx-0 w-fit justify-start">
				{#snippet children({ pages, currentPage })}
					<Pagination.Content class={list}>
						{#each pages as page (page.key)}
							<Pagination.Item>
								{#if page.type === "ellipsis"}
									<Pagination.Ellipsis class="{link} {size.lg}" />
								{:else}
									<Pagination.Link
										{page}
										size="default"
										isActive={currentPage === page.value}
										class="{link} {size.lg}"
									/>
								{/if}
							</Pagination.Item>
						{/each}
						<Pagination.Item>
							<Pagination.Next class="{link} {size.lg} {edge}" />
						</Pagination.Item>
					</Pagination.Content>
				{/snippet}
			</Pagination.Root>

			<Pagination.Root
				count={30}
				perPage={10}
				bind:page={pageBase}
				class="mx-0 w-fit justify-start"
			>
				{#snippet children({ pages, currentPage })}
					<Pagination.Content class={list}>
						<Pagination.Item>
							<Pagination.Previous class="{link} {size.base} {edge}" />
						</Pagination.Item>
						{#each pages as page (page.key)}
							<Pagination.Item>
								{#if page.type === "ellipsis"}
									<Pagination.Ellipsis class="{link} {size.base}" />
								{:else}
									<Pagination.Link
										{page}
										size="default"
										isActive={currentPage === page.value}
										class="{link} {size.base}"
									/>
								{/if}
							</Pagination.Item>
						{/each}
						<Pagination.Item>
							<Pagination.Next class="{link} {size.base} {edge}" />
						</Pagination.Item>
					</Pagination.Content>
				{/snippet}
			</Pagination.Root>

			<!-- `.pagination-sm`. -->
			<Pagination.Root count={30} perPage={10} bind:page={pageSm} class="mx-0 w-fit justify-start">
				{#snippet children({ pages, currentPage })}
					<Pagination.Content class={list}>
						<Pagination.Item>
							<Pagination.Previous class="{link} {size.sm} {edge}" />
						</Pagination.Item>
						{#each pages as page (page.key)}
							<Pagination.Item>
								{#if page.type === "ellipsis"}
									<Pagination.Ellipsis class="{link} {size.sm}" />
								{:else}
									<Pagination.Link
										{page}
										size="default"
										isActive={currentPage === page.value}
										class="{link} {size.sm}"
									/>
								{/if}
							</Pagination.Item>
						{/each}
						<Pagination.Item>
							<Pagination.Next class="{link} {size.sm} {edge}" />
						</Pagination.Item>
					</Pagination.Content>
				{/snippet}
			</Pagination.Root>
		</Card.Content>
	</Card.Root>

	<!-- demo 1 — the stock composition, otherwise unstyled. -->
	<DocSection title="Basic pagination">
		<Card.Root>
			<Card.Content>
				<Pagination.Root count={30} perPage={10} bind:page={basicPage}>
					{#snippet children({ pages, currentPage })}
						<Pagination.Content>
							<Pagination.Item>
								<Pagination.Previous />
							</Pagination.Item>
							{#each pages as item (item.key)}
								{#if item.type === "page"}
									<Pagination.Item>
										<Pagination.Link page={item} isActive={currentPage === item.value} />
									</Pagination.Item>
								{/if}
							{/each}
							<Pagination.Item>
								<Pagination.Next />
							</Pagination.Item>
						</Pagination.Content>
					{/snippet}
				</Pagination.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 2 — previous/next collapse to icon-only links. -->
	<DocSection title="Pagination without labels">
		<Card.Root>
			<Card.Content>
				<Pagination.Root count={30} perPage={10} bind:page={noLabelsPage}>
					{#snippet children({ pages, currentPage })}
						<Pagination.Content>
							<Pagination.Item>
								<Pagination.Link
									page={pageOf(Math.max(1, currentPage - 1))}
									isActive={false}
									aria-label="Go to previous page"
								>
									<ChevronLeftIcon />
								</Pagination.Link>
							</Pagination.Item>
							{#each pages as item (item.key)}
								{#if item.type === "page"}
									<Pagination.Item>
										<Pagination.Link page={item} isActive={currentPage === item.value} />
									</Pagination.Item>
								{/if}
							{/each}
							<Pagination.Item>
								<Pagination.Link
									page={pageOf(Math.min(3, currentPage + 1))}
									isActive={false}
									aria-label="Go to next page"
								>
									<ChevronRightIcon />
								</Pagination.Link>
							</Pagination.Item>
						</Pagination.Content>
					{/snippet}
				</Pagination.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 3 — inactive links gain a border on hover; the active one already has
	     one from its outline variant, so the class stays off it, as upstream. -->
	<DocSection title="Pagination with hover effect">
		<Card.Root>
			<Card.Content>
				<Pagination.Root count={30} perPage={10} bind:page={hoverPage}>
					{#snippet children({ pages, currentPage })}
						<Pagination.Content>
							<Pagination.Item>
								<Pagination.Previous />
							</Pagination.Item>
							{#each pages as item (item.key)}
								{#if item.type === "page"}
									<Pagination.Item>
										<Pagination.Link
											page={item}
											isActive={currentPage === item.value}
											class={currentPage === item.value
												? undefined
												: "hover:border! hover:border-border"}
										/>
									</Pagination.Item>
								{/if}
							{/each}
							<Pagination.Item>
								<Pagination.Next />
							</Pagination.Item>
						</Pagination.Content>
					{/snippet}
				</Pagination.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 4 -->
	<DocSection title="Pagination with circle buttons">
		<Card.Root>
			<Card.Content>
				<Pagination.Root count={30} perPage={10} bind:page={circlePage}>
					{#snippet children({ pages, currentPage })}
						<Pagination.Content>
							<Pagination.Item>
								<Pagination.Previous class="rounded-full" />
							</Pagination.Item>
							{#each pages as item (item.key)}
								{#if item.type === "page"}
									<Pagination.Item>
										<Pagination.Link
											page={item}
											isActive={currentPage === item.value}
											class="rounded-full"
										/>
									</Pagination.Item>
								{/if}
							{/each}
							<Pagination.Item>
								<Pagination.Next class="rounded-full" />
							</Pagination.Item>
						</Pagination.Content>
					{/snippet}
				</Pagination.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 5 — upstream hardcodes "1 2 3 …"; the numbers here are the live
	     bits-ui page list so the input's jumps stay visible in the bar. -->
	<DocSection title="Pagination with go-to-page input">
		<Card.Root>
			<Card.Content>
				<Pagination.Root count={100} perPage={10} bind:page={gotoPage} class="w-full max-w-xs">
					{#snippet children({ pages, currentPage })}
						<Pagination.Content class="justify-between gap-4">
							<Pagination.Item class="flex items-center gap-1">
								<Pagination.Link
									page={pageOf(Math.max(1, currentPage - 1))}
									isActive={false}
									aria-label="Go to previous page"
								>
									<ChevronLeftIcon />
								</Pagination.Link>
								{#each pages as item (item.key)}
									{#if item.type === "ellipsis"}
										<Pagination.Ellipsis />
									{:else}
										<Pagination.Link page={item} isActive={currentPage === item.value} />
									{/if}
								{/each}
								<Pagination.Link
									page={pageOf(Math.min(10, currentPage + 1))}
									isActive={false}
									aria-label="Go to next page"
								>
									<ChevronRightIcon />
								</Pagination.Link>
							</Pagination.Item>
							<Pagination.Item class="flex items-center gap-2">
								<span class="text-sm whitespace-nowrap text-muted-foreground">Go to page</span>
								<Input
									type="number"
									min={1}
									max={10}
									value={gotoPage}
									class="w-14 text-center"
									onchange={(e) => {
										const value = Math.round(Number(e.currentTarget.value));
										if (Number.isFinite(value)) gotoPage = Math.min(10, Math.max(1, value));
									}}
								/>
							</Pagination.Item>
						</Pagination.Content>
					{/snippet}
				</Pagination.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 6 — the card is the demo, so no wrapper card around it. Upstream
	     hardcodes its active recipe onto the first group only (its static page is 1); here the
	     same recipe follows `currentPage` across both groups so clicking 10-12 looks the same
	     as clicking 1-3. -->
	<DocSection title="Numbered pagination in card">
		<Card.Root class="p-2">
			<Card.Content class="p-0">
				<Pagination.Root count={120} perPage={10} bind:page={cardPage}>
					{#snippet children({ currentPage })}
						<Pagination.Content>
							<Pagination.Item>
								<Pagination.Link
									page={pageOf(Math.max(1, currentPage - 1))}
									isActive={false}
									aria-label="Go to previous page"
									class="size-8 rounded-full hover:bg-muted"
								>
									<ChevronLeftIcon />
								</Pagination.Link>
							</Pagination.Item>
							{#each [1, 2, 3] as value (value)}
								<Pagination.Item>
									<Pagination.Link
										page={pageOf(value)}
										isActive={currentPage === value}
										class={currentPage === value
											? "bg-primary text-primary-foreground hover:bg-primary/90"
											: "hover:bg-muted"}
									/>
								</Pagination.Item>
							{/each}
							<Pagination.Item>
								<Pagination.Ellipsis />
							</Pagination.Item>
							{#each [10, 11, 12] as value (value)}
								<Pagination.Item>
									<Pagination.Link
										page={pageOf(value)}
										isActive={currentPage === value}
										class={currentPage === value
											? "bg-primary text-primary-foreground hover:bg-primary/90"
											: "hover:bg-muted"}
									/>
								</Pagination.Item>
							{/each}
							<Pagination.Item>
								<Pagination.Link
									page={pageOf(Math.min(12, currentPage + 1))}
									isActive={false}
									aria-label="Go to next page"
									class="size-8 rounded-full hover:bg-muted"
								>
									<ChevronRightIcon />
								</Pagination.Link>
							</Pagination.Item>
						</Pagination.Content>
					{/snippet}
				</Pagination.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 7 — labelled arrow links, not the house Previous/Next: upstream uses
	     full arrows rather than chevrons and reverses the icon/label order. -->
	<DocSection title="Pagination with arrow buttons">
		<Card.Root>
			<Card.Content>
				<Pagination.Root count={30} perPage={10} bind:page={arrowsPage} class="w-full max-w-xs">
					{#snippet children({ currentPage })}
						<Pagination.Content class="w-full justify-between">
							<Pagination.Item>
								<Pagination.Link
									page={pageOf(Math.max(1, currentPage - 1))}
									isActive={false}
									size="default"
									class="gap-2"
								>
									<ArrowLeftIcon data-icon="inline-start" />
									Previous
								</Pagination.Link>
							</Pagination.Item>
							<Pagination.Item>
								<Pagination.Link
									page={pageOf(Math.min(3, currentPage + 1))}
									isActive={false}
									size="default"
									class="gap-2"
								>
									Next
									<ArrowRightIcon data-icon="inline-end" />
								</Pagination.Link>
							</Pagination.Item>
						</Pagination.Content>
					{/snippet}
				</Pagination.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 8 -->
	<DocSection title="Pagination with page info on center">
		<Card.Root>
			<Card.Content>
				<Pagination.Root
					count={100}
					perPage={10}
					bind:page={infoCenterPage}
					class="w-full max-w-xs"
				>
					{#snippet children({ currentPage })}
						<Pagination.Content class="w-full justify-between">
							<Pagination.Item>
								<Pagination.Link
									page={pageOf(Math.max(1, currentPage - 1))}
									isActive={false}
									aria-label="Go to previous page"
								>
									<ChevronLeftIcon />
								</Pagination.Link>
							</Pagination.Item>
							<Pagination.Item>
								<span class="text-xs text-muted-foreground">
									Page <span class="font-medium text-foreground">{currentPage}</span>
									of
									<span class="font-medium text-foreground">10</span>
								</span>
							</Pagination.Item>
							<Pagination.Item>
								<Pagination.Link
									page={pageOf(Math.min(10, currentPage + 1))}
									isActive={false}
									aria-label="Go to next page"
								>
									<ChevronRightIcon />
								</Pagination.Link>
							</Pagination.Item>
						</Pagination.Content>
					{/snippet}
				</Pagination.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 9 -->
	<DocSection title="Pagination with page info on left">
		<Card.Root>
			<Card.Content>
				<Pagination.Root count={100} perPage={10} bind:page={infoLeftPage} class="w-full max-w-xs">
					{#snippet children({ currentPage })}
						<Pagination.Content class="w-full justify-between">
							<Pagination.Item>
								<span class="text-xs text-muted-foreground">
									Page <span class="font-medium text-foreground">{currentPage}</span>
									of
									<span class="font-medium text-foreground">10</span>
								</span>
							</Pagination.Item>
							<Pagination.Item class="flex gap-1">
								<Pagination.Previous />
								<Pagination.Next />
							</Pagination.Item>
						</Pagination.Content>
					{/snippet}
				</Pagination.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 10 — the fixed 1-4 list is the demo's point (four numbers, then the
	     ellipsis), so the numbers stay hardcoded and only the active state is live. -->
	<DocSection title="Pagination with ellipsis indicator">
		<Card.Root>
			<Card.Content>
				<Pagination.Root count={100} perPage={10} bind:page={ellipsisPage}>
					{#snippet children({ currentPage })}
						<Pagination.Content>
							<Pagination.Item>
								<Pagination.Previous />
							</Pagination.Item>
							{#each [1, 2, 3, 4] as value (value)}
								<Pagination.Item>
									<Pagination.Link page={pageOf(value)} isActive={currentPage === value} />
								</Pagination.Item>
							{/each}
							<Pagination.Item>
								<Pagination.Ellipsis />
							</Pagination.Item>
							<Pagination.Item>
								<Pagination.Next />
							</Pagination.Item>
						</Pagination.Content>
					{/snippet}
				</Pagination.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 11 — one bordered bar: the list owns the outer border and radius,
	     every link goes flat and keeps only an end border as the seam. -->
	<DocSection title="Pagination with outline style buttons">
		<Card.Root>
			<Card.Content>
				<Pagination.Root count={100} perPage={10} bind:page={outlinePage}>
					{#snippet children({ currentPage })}
						<Pagination.Content class="gap-0 overflow-hidden rounded-md border">
							<Pagination.Item>
								<Pagination.Link
									page={pageOf(Math.max(1, currentPage - 1))}
									isActive={false}
									aria-label="Go to previous page"
									class="rounded-none border-0 border-e border-border"
								>
									<ChevronLeftIcon />
								</Pagination.Link>
							</Pagination.Item>
							{#each [1, 2, 3, 4] as value (value)}
								<Pagination.Item>
									<Pagination.Link
										page={pageOf(value)}
										isActive={currentPage === value}
										class="rounded-none border-0 border-e border-border data-[active=true]:bg-muted"
									/>
								</Pagination.Item>
							{/each}
							<Pagination.Item class="border-0 border-e border-border">
								<Pagination.Ellipsis />
							</Pagination.Item>
							<Pagination.Item>
								<Pagination.Link
									page={pageOf(Math.min(10, currentPage + 1))}
									isActive={false}
									aria-label="Go to next page"
									class="rounded-none border-0"
								>
									<ChevronRightIcon />
								</Pagination.Link>
							</Pagination.Item>
						</Pagination.Content>
					{/snippet}
				</Pagination.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 12 -->
	<DocSection title="Rows per page select with range info and first/prev/next/last icons">
		<Card.Root>
			<Card.Content>
				<Pagination.Root count={rowsTotal} perPage={rowsPerPageCount} bind:page={rowsPage}>
					{#snippet children({ currentPage })}
						<Pagination.Content class="w-full justify-between">
							<Pagination.Item class="flex items-center gap-2">
								<span class="text-sm whitespace-nowrap text-muted-foreground">Rows per page</span>
								<NativeSelect.Root
									class="w-18"
									bind:value={rowsPerPageValue}
									onchange={() => {
										if (rowsPage > rowsTotalPages) rowsPage = rowsTotalPages;
									}}
								>
									<NativeSelect.Option value="10">10</NativeSelect.Option>
									<NativeSelect.Option value="25">25</NativeSelect.Option>
									<NativeSelect.Option value="50">50</NativeSelect.Option>
									<NativeSelect.Option value="100">100</NativeSelect.Option>
								</NativeSelect.Root>
							</Pagination.Item>
							<Pagination.Item class="flex items-center gap-3">
								<span class="text-sm whitespace-nowrap text-muted-foreground">
									{rowsRangeStart}-{rowsRangeEnd} of {rowsTotal}
								</span>
								<div class="flex gap-1">
									<Pagination.Link page={pageOf(1)} isActive={false} aria-label="Go to first page">
										<ChevronFirstIcon />
									</Pagination.Link>
									<Pagination.Link
										page={pageOf(Math.max(1, currentPage - 1))}
										isActive={false}
										aria-label="Go to previous page"
									>
										<ChevronLeftIcon />
									</Pagination.Link>
									<Pagination.Link
										page={pageOf(Math.min(rowsTotalPages, currentPage + 1))}
										isActive={false}
										aria-label="Go to next page"
									>
										<ChevronRightIcon />
									</Pagination.Link>
									<Pagination.Link
										page={pageOf(rowsTotalPages)}
										isActive={false}
										aria-label="Go to last page"
									>
										<ChevronLastIcon />
									</Pagination.Link>
								</div>
							</Pagination.Item>
						</Pagination.Content>
					{/snippet}
				</Pagination.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 13 -->
	<DocSection title="Pagination with page select dropdown and first/last navigation">
		<Card.Root>
			<Card.Content>
				<Pagination.Root count={100} perPage={10} bind:page={pageSelectPage}>
					{#snippet children({ currentPage })}
						<Pagination.Content>
							<Pagination.Item>
								<Pagination.Link page={pageOf(1)} isActive={false} aria-label="Go to first page">
									<ChevronFirstIcon />
								</Pagination.Link>
							</Pagination.Item>
							<Pagination.Item>
								<Pagination.Link
									page={pageOf(Math.max(1, currentPage - 1))}
									isActive={false}
									aria-label="Go to previous page"
								>
									<ChevronLeftIcon />
								</Pagination.Link>
							</Pagination.Item>
							<Pagination.Item>
								<NativeSelect.Root
									class="w-26"
									value={String(currentPage)}
									onchange={(e) => (pageSelectPage = Number(e.currentTarget.value))}
								>
									{#each { length: 10 } as _, index (index)}
										<NativeSelect.Option value={String(index + 1)}>
											Page {index + 1}
										</NativeSelect.Option>
									{/each}
								</NativeSelect.Root>
							</Pagination.Item>
							<Pagination.Item>
								<Pagination.Link
									page={pageOf(Math.min(10, currentPage + 1))}
									isActive={false}
									aria-label="Go to next page"
								>
									<ChevronRightIcon />
								</Pagination.Link>
							</Pagination.Item>
							<Pagination.Item>
								<Pagination.Link page={pageOf(10)} isActive={false} aria-label="Go to last page">
									<ChevronLastIcon />
								</Pagination.Link>
							</Pagination.Item>
						</Pagination.Content>
					{/snippet}
				</Pagination.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 14 — same hardcoded 1-4 window as c-pagination-10, with the
	     go-to-page input from c-pagination-5. -->
	<DocSection title="Numbered pagination with go-to-page input">
		<Card.Root>
			<Card.Content>
				<Pagination.Root count={100} perPage={10} bind:page={gotoNumberedPage}>
					{#snippet children({ currentPage })}
						<Pagination.Content class="w-full justify-between">
							<Pagination.Item class="flex items-center gap-1">
								<Pagination.Link
									page={pageOf(Math.max(1, currentPage - 1))}
									isActive={false}
									aria-label="Go to previous page"
								>
									<ChevronLeftIcon />
								</Pagination.Link>
								{#each [1, 2, 3, 4] as value (value)}
									<Pagination.Link page={pageOf(value)} isActive={currentPage === value} />
								{/each}
								<Pagination.Ellipsis />
								<Pagination.Link
									page={pageOf(Math.min(10, currentPage + 1))}
									isActive={false}
									aria-label="Go to next page"
								>
									<ChevronRightIcon />
								</Pagination.Link>
							</Pagination.Item>
							<Pagination.Item class="flex items-center gap-2">
								<span class="text-sm whitespace-nowrap text-muted-foreground">Go to page</span>
								<Input
									type="number"
									min={1}
									max={10}
									value={gotoNumberedPage}
									class="w-16 text-center"
									onchange={(e) => {
										const value = Math.round(Number(e.currentTarget.value));
										if (Number.isFinite(value)) gotoNumberedPage = Math.min(10, Math.max(1, value));
									}}
								/>
							</Pagination.Item>
						</Pagination.Content>
					{/snippet}
				</Pagination.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 15 — upstream hardcodes "1 2 3 4 …"; the numbers here are the live
	     bits-ui page list so they stay in range when the per-page select shrinks the page
	     count. -->
	<DocSection title="Pagination with page info, numbered pages, ellipsis, and per-page select">
		<Card.Root>
			<Card.Content>
				<Pagination.Root count={fullBarTotal} perPage={fullBarPerPageCount} bind:page={fullBarPage}>
					{#snippet children({ pages, currentPage })}
						<Pagination.Content class="w-full justify-between">
							<Pagination.Item>
								<span class="text-sm text-muted-foreground">
									Page <span class="font-medium text-foreground">{currentPage}</span>
									of
									<span class="font-medium text-foreground">{fullBarTotalPages}</span>
								</span>
							</Pagination.Item>
							<Pagination.Item class="flex items-center gap-1">
								<Pagination.Previous />
								{#each pages as item (item.key)}
									{#if item.type === "ellipsis"}
										<Pagination.Ellipsis />
									{:else}
										<Pagination.Link page={item} isActive={currentPage === item.value} />
									{/if}
								{/each}
								<Pagination.Next />
							</Pagination.Item>
							<Pagination.Item>
								<NativeSelect.Root
									class="w-28"
									bind:value={fullBarPerPageValue}
									onchange={() => {
										if (fullBarPage > fullBarTotalPages) fullBarPage = fullBarTotalPages;
									}}
								>
									<NativeSelect.Option value="10">10 / page</NativeSelect.Option>
									<NativeSelect.Option value="20">20 / page</NativeSelect.Option>
									<NativeSelect.Option value="50">50 / page</NativeSelect.Option>
									<NativeSelect.Option value="100">100 / page</NativeSelect.Option>
								</NativeSelect.Root>
							</Pagination.Item>
						</Pagination.Content>
					{/snippet}
				</Pagination.Root>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
