<script lang="ts">
	import * as Card from "$lib/components/ui/card/index.js";
	import * as CodeBlock from "$lib/components/ui/code-block/index.js";
	import * as Table from "$lib/components/ui/table/index.js";
	import DocPage from "$lib/components/layout/DocPage.svelte";
	import DocSection from "$lib/components/layout/DocSection.svelte";

	/**
	 * The Quickstart page: how to install the Agent Skill, and nothing else.
	 *
	 * IT SITS FIRST IN THE SIDEBAR, above Settings, because it is the only page whose content is
	 * a prerequisite for the rest. Every other page documents something the visitor can already
	 * see; this one is what makes an assistant able to build with it. The README opens the same
	 * way, and for the same reason — the two are deliberately parallel, and both were wrong in
	 * the same way once: they offered the registry route alone, which cannot install into a
	 * project that does not exist yet.
	 *
	 * The four scopes are a MATRIX rather than a list because the two axes are independent: the
	 * scope decides what the skill reaches, the assistant decides where the directory goes. All
	 * four were verified against the real tools; Codex's project scope was the one that had to be
	 * probed rather than read, since only `$CODEX_HOME/skills` is documented.
	 */

	const REGISTRY_URL =
		"https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-skill.json";

	const PERSONAL_UNIX = `# Claude Code, then Codex — every session on this machine
npx degit OctarinaCompany/svelte-theme-parallax/skills/parallax ~/.claude/skills/parallax
npx degit OctarinaCompany/svelte-theme-parallax/skills/parallax ~/.codex/skills/parallax`;

	const PERSONAL_WINDOWS = `# PowerShell. Keep the quotes AND $env:USERPROFILE — see the note below.
npx degit OctarinaCompany/svelte-theme-parallax/skills/parallax "$env:USERPROFILE\\.claude\\skills\\parallax"
npx degit OctarinaCompany/svelte-theme-parallax/skills/parallax "$env:USERPROFILE\\.codex\\skills\\parallax"`;

	const PROJECT = `# Run from the project root, and commit the result
npx degit OctarinaCompany/svelte-theme-parallax/skills/parallax .claude/skills/parallax
npx degit OctarinaCompany/svelte-theme-parallax/skills/parallax .codex/skills/parallax`;

	const REGISTRY = `npx shadcn-svelte@latest add ${REGISTRY_URL}`;

	const BOOTSTRAP = `npx sv@latest create . --template minimal --types ts \\
  --add "tailwindcss=plugins:none" --install npm --no-dir-check --no-download-check`;

	/*
	 * One row per scope, both assistants side by side. THREE COLUMNS, not four: a prose column
	 * describing what each scope reaches squeezed the paths past the container's edge, and the
	 * paths are the only thing here worth copying. That description lives in the paragraph
	 * below, where prose belongs.
	 */
	const SCOPES = [
		{
			scope: "Personal",
			claude: "~/.claude/skills/parallax/",
			codex: "~/.codex/skills/parallax/",
		},
		{
			scope: "Project",
			claude: ".claude/skills/parallax/",
			codex: ".codex/skills/parallax/",
		},
	];
</script>

<DocPage title="Quickstart">
	{#snippet subtitle()}
		Parallax ships an Agent Skill: it teaches an AI assistant this registry, the shell's props, the
		token families and the twelve palettes, so the rest of this gallery becomes a conversation
		instead of a manual read. It is one command, and it decides how well every other command goes.
		Install it before anything else.
	{/snippet}

	<DocSection title="Pick a scope">
		{#snippet blurb()}
			The two axes are independent — the scope decides what the skill reaches, the assistant decides
			where the directory goes — so there are four destinations, not two. Both tools read the same <code
				>SKILL.md</code
			> format, so one source serves both.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Scope</Table.Head>
							<Table.Head>Claude Code</Table.Head>
							<Table.Head>Codex</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each SCOPES as row (row.scope)}
							<Table.Row>
								<Table.Cell class="font-medium">{row.scope}</Table.Cell>
								<Table.Cell><code>{row.claude}</code></Table.Cell>
								<Table.Cell><code>{row.codex}</code></Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</Card.Content>
		</Card.Root>
		<p class="mt-4 text-sm text-muted-foreground">
			<strong>Personal</strong> reaches every session on this machine, empty directories included —
			it is the only scope that can <em>start</em> a project, because project scope needs a project
			to install into. <strong>Project</strong> reaches this repository only, committed so the whole team
			shares one version. They do not compete: most people end up with both.
		</p>
	</DocSection>

	<DocSection title="Install it">
		{#snippet blurb()}
			A one-time install per machine (personal) or per repository (project) — never a per-session
			step.
		{/snippet}
		<div class="grid gap-4">
			<CodeBlock.Root
				label="Personal — macOS and Linux"
				language="bash"
				code={PERSONAL_UNIX}
				showLineNumbers={false}
			/>
			<CodeBlock.Root
				label="Personal — Windows"
				language="bash"
				code={PERSONAL_WINDOWS}
				showLineNumbers={false}
			/>
			<CodeBlock.Root label="Project" language="bash" code={PROJECT} showLineNumbers={false} />
		</div>
		<p class="mt-4 text-sm text-muted-foreground">
			Three things bite. Re-running to update fails unless you add <code>--force</code> — degit
			refuses a destination that is not empty. The directory name must stay
			<code>parallax</code>, which the spec requires to match the skill's own name. And on Windows
			keep the <code>$env:USERPROFILE</code> form: PowerShell expands a bare
			<code>~</code>, but passes a quoted one through untouched, so
			<code>"~/.claude/skills/parallax"</code> would create a directory literally named
			<code>~</code> in the current folder.
		</p>
		<p class="mt-4 text-sm text-muted-foreground">
			Then <strong>restart your assistant</strong>: skills are discovered when a session opens, not
			while one runs.
		</p>
	</DocSection>

	<DocSection title="Inside a shadcn-svelte project, prefer the registry">
		{#snippet blurb()}
			Same destination as the project-scope command above, but the skill then updates like every
			other item in the registry rather than drifting on its own.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<CodeBlock.Root
					label="Registry install"
					language="bash"
					code={REGISTRY}
					showLineNumbers={false}
				/>
			</Card.Content>
		</Card.Root>
		<p class="mt-4 text-sm text-muted-foreground">
			Eight files land in the project's <code>.claude/skills/parallax/</code>, and nothing else
			changes — the item carries no dependencies and touches no CSS. It needs a working
			shadcn-svelte project (a <code>components.json</code>, a <code>tsconfig.json</code>, Tailwind
			v4 and Svelte 5) and stops before writing anything without one, so a failed run leaves nothing
			behind.
		</p>
	</DocSection>

	<DocSection title="Starting from an empty directory">
		{#snippet blurb()}
			Then the registry command cannot be your first move — it installs <em>into</em> a project, and there
			is none yet. Install the skill at personal scope, and it takes over from there.
		{/snippet}
		<Card.Root>
			<Card.Content>
				<CodeBlock.Root
					label="What the skill runs first"
					language="bash"
					code={BOOTSTRAP}
					showLineNumbers={false}
				/>
			</Card.Content>
		</Card.Root>
		<p class="mt-4 text-sm text-muted-foreground">
			That is the opening step of the skill's <code>references/bootstrap.md</code>, which carries
			the whole path from nothing to a running dashboard: scaffold, write
			<code>components.json</code> by hand (<code>init</code> cannot run unattended), install the shell,
			apply the two manual steps, wire the shell, validate. You do not have to run any of it yourself
			— ask for a Parallax dashboard and the assistant follows it.
		</p>
	</DocSection>
</DocPage>
