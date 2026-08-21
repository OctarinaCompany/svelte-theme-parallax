# The Parallax skill

A [Claude Code / Agent Skill](https://agentskills.io) that teaches an AI assistant the
right way to use Parallax in a consumer project: installing from the registry, composing
the shell through props and snippets, the semantic token families, the 12 palettes, and
the appearance axes — plus the pitfalls that are invisible until they bite (the
first-paint script, the `overflow-x` sticky killer, the subtle-foreground pairing).

It follows the format shared by the official shadcn/ui, shadcn-svelte and Svelte skills:
a compact `SKILL.md` the model loads when triggered, with the deep contracts one level
down in `references/`, loaded on demand.

## Install

**Via the Parallax registry** (recommended — one command, and the skill updates like any
other item):

```sh
npx shadcn-svelte@latest add https://octarinacompany.github.io/svelte-theme-parallax/r/parallax-skill.json
```

This writes the skill into the project's `.claude/skills/parallax/` — commit it so the
whole team's assistants share it.

**For starting projects from scratch** — the registry route needs a project to install
into, so it cannot be how you *begin* one. Install the skill at personal scope instead and
it is loaded in every session, empty directories included:

```sh
npx degit OctarinaCompany/svelte-theme-parallax/skills/parallax ~/.claude/skills/parallax
```

On Windows PowerShell, `~` is not expanded by degit — use
`"$env:USERPROFILE\.claude\skills\parallax"`. From there,
[`references/bootstrap.md`](./references/bootstrap.md) carries the whole path from an empty
directory to a running dashboard.

**Manually**: copy this `skills/parallax/` directory to

- `<your-project>/.claude/skills/parallax/` — project scope (recommended, commit it), or
- `~/.claude/skills/parallax/` — personal scope, every project on the machine.

The directory name must stay `parallax` (the spec requires it to match the skill name).

## Use

Nothing to configure. Claude Code loads the skill's name and description at startup and
invokes it automatically when the work matches — installing Parallax, wiring the shell,
styling with the token families, driving the appearance axes. You can also invoke it
explicitly with `/parallax`.

What it changes in practice: the assistant reads `components.json` before acting, installs
through the registry CLI instead of hand-copying, performs and announces the two manual
post-install steps, writes Svelte 5 runes only, pairs soft status fills with their own
foregrounds, and drives floating/inverted/auto-hide through the installed hooks instead of
reinventing them.

## Update

Re-run the install command (add `--overwrite` for the skill files) after a Parallax
update, or copy the directory again. Skill edits are live — Claude Code re-reads the files
on next use, no restart needed.

## Layout

```
skills/parallax/
├── SKILL.md                  # what the model loads when triggered
├── references/
│   ├── shell.md              # component contracts, incorrect/correct pairs
│   ├── theming.md            # tokens → utility classes, palettes, axes, first-paint script
│   ├── install.md            # the five items, manual steps, troubleshooting
│   ├── bootstrap.md          # empty directory → running dashboard, and its version traps
│   ├── patterns.md           # distilled recipes of the flagship gallery patterns
│   └── components.md         # generated map of every gallery page and ui/ folder
├── evals.json                # behavioural checks — re-run when skill or registry changes
└── README.md                 # this notice (not loaded by the model)
```
