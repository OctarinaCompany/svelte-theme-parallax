<script lang="ts">
	import * as Banner from "$lib/components/ui/banner/index.js";
	import { getBannersContext, type BannerRenderProps } from "$lib/components/ui/banner/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import AlertCircleIcon from "@lucide/svelte/icons/circle-alert";
	import CheckCircleIcon from "@lucide/svelte/icons/circle-check";
	import InfoIcon from "@lucide/svelte/icons/info";
	import ServerCrashIcon from "@lucide/svelte/icons/server-crash";
	import SparklesIcon from "@lucide/svelte/icons/sparkles";
	import AlertTriangleIcon from "@lucide/svelte/icons/triangle-alert";

	const queue = getBannersContext("<BannerControls>");
</script>

{#snippet infoContent()}
	<Banner.Icon><InfoIcon /></Banner.Icon>
	<Banner.Content>
		<Banner.Title>Information</Banner.Title>
		<Banner.Description>This is an informational message.</Banner.Description>
	</Banner.Content>
	<Banner.Close />
{/snippet}

{#snippet successContent()}
	<Banner.Icon><CheckCircleIcon /></Banner.Icon>
	<Banner.Content>
		<Banner.Title>Success!</Banner.Title>
		<Banner.Description>Your changes have been saved successfully.</Banner.Description>
	</Banner.Content>
	<Banner.Actions>
		<Banner.Close />
	</Banner.Actions>
{/snippet}

{#snippet warningContent({ onClose }: BannerRenderProps)}
	<Banner.Icon><AlertTriangleIcon /></Banner.Icon>
	<Banner.Content>
		<Banner.Title>Warning</Banner.Title>
		<Banner.Description>Please review your changes before continuing.</Banner.Description>
	</Banner.Content>
	<Banner.Actions>
		<Button size="sm">Review</Button>
		<Button size="sm" variant="ghost" onclick={onClose}>Skip</Button>
	</Banner.Actions>
{/snippet}

{#snippet destructiveContent()}
	<Banner.Icon><AlertCircleIcon /></Banner.Icon>
	<Banner.Content>
		<Banner.Title>Action required</Banner.Title>
		<Banner.Description>Your session is about to expire. Please save your work.</Banner.Description>
	</Banner.Content>
	<Banner.Actions>
		<Button size="sm" variant="destructive">Save now</Button>
		<Banner.Close />
	</Banner.Actions>
{/snippet}

{#snippet appVersionContent()}
	<Banner.Icon><SparklesIcon /></Banner.Icon>
	<Banner.Content>
		<Banner.Title>New version available</Banner.Title>
		<Banner.Description>Version 2.0 is now available with exciting new features.</Banner.Description
		>
	</Banner.Content>
	<Banner.Actions>
		<Button size="sm">Update</Button>
		<Banner.Close />
	</Banner.Actions>
{/snippet}

{#snippet systemHealthContent()}
	<Banner.Icon><ServerCrashIcon /></Banner.Icon>
	<Banner.Content>
		<Banner.Title>System outage</Banner.Title>
		<Banner.Description>
			Some services are currently unavailable. We're working on it.
		</Banner.Description>
	</Banner.Content>
	<Banner.Actions>
		<Banner.Close />
	</Banner.Actions>
{/snippet}

<div class="flex flex-col gap-6">
	<div class="flex flex-col gap-2.5">
		<h3 class="text-base font-semibold">Stacked Banners ({queue.banners.length} in queue)</h3>
		<div class="flex flex-wrap gap-2">
			<Button
				variant="outline"
				size="sm"
				onclick={() => queue.addBanner({ variant: "info", content: infoContent })}
			>
				Add Info
			</Button>
			<Button
				variant="outline"
				size="sm"
				onclick={() => queue.addBanner({ variant: "success", content: successContent })}
			>
				Add Success
			</Button>
			<Button
				variant="outline"
				size="sm"
				onclick={() => queue.addBanner({ variant: "warning", content: warningContent })}
			>
				Add Warning
			</Button>
			<Button
				variant="outline"
				size="sm"
				onclick={() => queue.addBanner({ variant: "destructive", content: destructiveContent })}
			>
				Add Destructive
			</Button>
		</div>
	</div>
	<div class="flex flex-col gap-2.5">
		<h3 class="text-base font-semibold">Priority</h3>
		<div class="flex flex-wrap gap-2">
			<Button
				variant="outline"
				size="sm"
				onclick={() =>
					queue.addBanner({ variant: "info", priority: 0, content: appVersionContent })}
			>
				App Version (priority: 0)
			</Button>
			<Button
				variant="outline"
				size="sm"
				onclick={() =>
					queue.addBanner({ variant: "destructive", priority: 10, content: systemHealthContent })}
			>
				System Health (priority: 10)
			</Button>
		</div>
		<div class="text-sm text-muted-foreground">
			Higher priority banners jump ahead in the queue.
			<br />
			Try adding the app version banner first, then the system health banner.
		</div>
	</div>
</div>
