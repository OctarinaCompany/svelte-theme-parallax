<script lang="ts">
	import CircleIcon from "@lucide/svelte/icons/circle";
	import CircleCheckIcon from "@lucide/svelte/icons/circle-check";
	import FileIcon from "@lucide/svelte/icons/file";
	import * as Card from "$lib/components/ui/card/index.js";
	import * as Item from "$lib/components/ui/item/index.js";
	import { Progress } from "$lib/components/ui/progress/index.js";
	import { Slider } from "$lib/components/ui/slider/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Progress component page.
	 */

	/**
	 * The track.
	 *
	 *   h-4            `progress-height: 1rem` — the classic default, which the classic theme keeps and
	 *                  shadcn does not: its `h-1.5` is under half as tall
	 *   rounded-full   `progress-border-radius: 200px`, with the comment "Always rounds even
	 *                  if height is manually set higher"; `rounded-full` is the same intent
	 *                  expressed as a ratio instead of an unreachable pixel value
	 *   bg-secondary   `progress-bg` is `--bs-secondary-bg` = `gray-200` in light, which
	 *                  `--secondary` holds exactly. The classic theme's dark override asks for
	 *                  `gray-600-dark` (#244166) where `--secondary` is #1E3A5C — one step
	 *                  darker, and the only inexact value on this page
	 *
	 * The filled bar needs nothing: shadcn's indicator is already `bg-primary`, and
	 * `progress-bar-bg` is `primary`.
	 */
	const track = "h-4 rounded-full bg-secondary";

	/** `.progress-sm`: `progress-height-sm: .25rem`, the track and nothing else. */
	const trackSm = "h-1 rounded-full bg-secondary";

	/**
	 * The sections below are the progress demo set. Those
	 * demos exercise shadcn's own track, so they keep the house component's default `h-1.5
	 * bg-muted` look rather than the classic track above — the point of each one is the
	 * composition around the bar, not the bar's skin.
	 */

	/**
	 * demo 4: a looping download simulation. The upstream `useEffect` interval
	 * becomes an `$effect` whose teardown clears the timer; increments stay random (1–4 every
	 * 150 ms) and the bar resets at 100 so the demo runs forever.
	 */
	let statusProgress = $state(0);

	$effect(() => {
		const downloadTimer = setInterval(() => {
			statusProgress = statusProgress >= 100 ? 0 : statusProgress + Math.random() * 3 + 1;
		}, 150);
		return () => clearInterval(downloadTimer);
	});

	/** demo 4: one message per progress band, verbatim from the upstream ladder. */
	function statusMessage(progress: number): string {
		if (progress < 5) return "Initializing download...";
		if (progress < 15) return "Setting up environment...";
		if (progress < 25) return "Connecting to server...";
		if (progress < 35) return "Verifying permissions...";
		if (progress < 50) return "Downloading core files...";
		if (progress < 65) return "Downloading assets...";
		if (progress < 80) return "Downloading dependencies...";
		if (progress < 90) return "Extracting files...";
		if (progress < 95) return "Validating integrity...";
		if (progress < 100) return "Finalizing installation...";
		return "Download complete!";
	}

	/** demo 5: static upload snapshot — one completed file, three in flight. */
	const uploadFiles = [
		{ id: "1", name: "document.pdf", progress: 45, status: "2m 30s" },
		{ id: "2", name: "presentation.pptx", progress: 78, status: "45s" },
		{ id: "3", name: "spreadsheet.xlsx", progress: 12, status: "5m 12s" },
		{ id: "4", name: "image.jpg", progress: 100, status: "Complete" },
	];

	/** demo 6: the slider drives the bar — one value, two renderings. */
	let sliderProgressValue = $state(50);

	/** demo 7: the bar summarises the checklist below it. */
	const setupSteps = [
		{ label: "Account", completed: true },
		{ label: "Profile", completed: true },
		{ label: "Preferences", completed: false },
		{ label: "Review", completed: false },
	];
	const setupCompleted = setupSteps.filter((s) => s.completed).length;
	const setupProgressValue = (setupCompleted / setupSteps.length) * 100;

	/**
	 * demo 8: starts at 45 and animates to 75 half a second after mount, so the
	 * `transition-all` on the indicator is visible once per page load.
	 */
	let colorsProgress = $state(45);

	$effect(() => {
		const timer = setTimeout(() => (colorsProgress = 75), 500);
		return () => clearTimeout(timer);
	});
</script>

<DocPage title="Progress">
	{#snippet subtitle()}
		Please see the
		<a
			class="text-primary underline underline-offset-3"
			href="https://shadcn-svelte.com/docs/components/progress"
			target="_blank"
			rel="noreferrer">official shadcn-svelte documentation</a
		>
		for a full list of options.
	{/snippet}

	<Card.Root>
		<Card.Content>
			<Progress value={32} class={track} />
		</Card.Content>
	</Card.Root>

	<DocSection title="Small">
		{#snippet blurb()}
			The same bar on a reduced track height.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Progress value={10} class={trackSm} />
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 1: the bar with the label-and-percentage header row above it. -->
	<DocSection title="Basic progress">
		<Card.Root>
			<Card.Content>
				<div class="mx-auto flex w-full max-w-xs flex-col gap-2">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium">Upload progress</span>
						<span class="text-sm text-muted-foreground">56%</span>
					</div>
					<Progress value={56} />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 3: the same header row over a thickened h-3 track. -->
	<DocSection title="Large progress">
		<Card.Root>
			<Card.Content>
				<div class="mx-auto flex w-full max-w-xs flex-col gap-2">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium">Large progress</span>
						<span class="text-sm text-muted-foreground">70%</span>
					</div>
					<Progress value={70} class="h-3" />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 4: the interval and message ladder live in the script block above. -->
	<DocSection title="Progress bar with status messages">
		{#snippet blurb()}
			A looping download simulation whose caption follows the percentage.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="mx-auto flex w-full max-w-xs flex-col gap-2">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium">Workspace Setup</span>
						<span class="text-sm text-muted-foreground">
							{Math.min(Math.round(statusProgress), 100)}%
						</span>
					</div>
					<Progress value={statusProgress} />
					<div class="text-xs text-muted-foreground">{statusMessage(statusProgress)}</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 5: an Item list where each row carries its own bar. Upstream's
		IconPlaceholder resolves to lucide's FileIcon here; ItemMedia's icon variant already
		sizes it, so the icon only takes the muted colour.
	-->
	<DocSection title="File upload list with progress & status">
		<Card.Root>
			<Card.Content>
				<div class="mx-auto flex w-full max-w-xs flex-col">
					<Item.Group>
						{#each uploadFiles as file (file.id)}
							<Item.Root size="xs" class="px-0">
								<Item.Media variant="icon">
									<FileIcon class="text-muted-foreground" />
								</Item.Media>
								<Item.Content class="flex-1 truncate">
									<Item.Title class="cursor-pointer truncate hover:underline">
										{file.name}
									</Item.Title>
								</Item.Content>
								<Item.Content class="w-32">
									<Progress value={file.progress} class="h-1" />
								</Item.Content>
								<Item.Actions class="w-20 justify-end">
									<span class="text-foreground">{file.status}</span>
								</Item.Actions>
							</Item.Root>
						{/each}
					</Item.Group>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!-- demo 6: one state variable rendered as both a read-only bar and its control. -->
	<DocSection title="Progress bar with slider">
		<Card.Root>
			<Card.Content>
				<div class="mx-auto flex w-full max-w-xs flex-col gap-6">
					<Progress value={sliderProgressValue} />
					<Slider type="single" bind:value={sliderProgressValue} min={0} max={100} step={1} />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 7: the bar's value is derived from the checklist. Completed steps take
		`text-success` exactly as upstream does — the token exists here.
	-->
	<DocSection title="Multi-step progress indicator">
		<Card.Root>
			<Card.Content>
				<div class="mx-auto flex w-full max-w-xs flex-col gap-4">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium">Setup Progress</span>
						<span class="text-xs text-muted-foreground">
							{setupCompleted} of {setupSteps.length} steps
						</span>
					</div>
					<Progress value={setupProgressValue} />
					<div class="flex flex-col gap-2">
						{#each setupSteps as step (step.label)}
							<div class="flex items-center gap-2 text-sm">
								{#if step.completed}
									<CircleCheckIcon class="size-4 text-success" aria-hidden="true" />
								{:else}
									<CircleIcon class="size-4 text-muted-foreground" aria-hidden="true" />
								{/if}
								<span class={step.completed ? "text-foreground" : "text-muted-foreground"}>
									{step.label}
								</span>
							</div>
						{/each}
					</div>
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>

	<!--
		demo 8 recolours the indicator through its `data-slot`, and that mechanism
		survives; the five raw palette colours (green, yellow, fuchsia, indigo, violet) do not —
		semantic tokens only — so the ramp becomes the five statuses the theme actually names.
	-->
	<DocSection title="Progress bar with custom colors">
		{#snippet blurb()}
			The indicator is targeted via <code>data-slot=progress-indicator</code>, so any status token
			can recolour it without touching the component.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<div class="mx-auto flex w-full max-w-xs flex-col gap-6">
					<Progress value={colorsProgress} class="**:data-[slot=progress-indicator]:bg-success" />
					<Progress value={colorsProgress} class="**:data-[slot=progress-indicator]:bg-warning" />
					<Progress
						value={colorsProgress}
						class="**:data-[slot=progress-indicator]:bg-destructive"
					/>
					<Progress value={colorsProgress} class="**:data-[slot=progress-indicator]:bg-info" />
					<Progress value={colorsProgress} class="**:data-[slot=progress-indicator]:bg-primary" />
				</div>
			</Card.Content>
		</Card.Root>
	</DocSection>
</DocPage>
