import type { CodeBlockSnippet } from "$lib/components/ui/code-block/index.js";

/**
 * The snippets the Code block page renders.
 *
 * The first three demos — "Syntax highlighted", "Language selector" and
 * "cURL request" — share one story: a small client fetching a component registry.
 *
 * They live in a module rather than in the page because a page of nested template literals stops
 * reading as markup, and because a code sample inside a `.svelte` file has to escape every brace
 * and backtick it contains — which would make the sample a poor sample of itself.
 *
 * {@link LANGUAGE_TOUR} is this page's own, and it is the one to look at across the twelve
 * palettes: fourteen snippets chosen so that every rule in the highlighter fires at least once —
 * comment, string, keyword, JSON literal, number, capitalised type, CSS custom property,
 * punctuation, and plain text that must stay plain.
 */

/** Upstream's TSX sample — its "Syntax highlighted" demo, and the first snippet of its selector. */
export const REGISTRY_REQUEST_TSX = `type RegistryComponent = {
  name: string
  type: "registry:component" | "registry:block"
  files: Array<{ path: string; type: string }>
}

export async function requestComponent(name: string) {
  const response = await fetch(\`https://registry.example.com/r/\${name}.json\`)

  if (!response.ok) {
    throw new Error(\`Unable to load \${name}\`)
  }

  return (await response.json()) as RegistryComponent
}

const component = await requestComponent("status-page")`;

/** Upstream's Python sample — the second snippet of its "Language selector" demo. */
export const REGISTRY_REQUEST_PYTHON = `import requests


def request_component(name: str) -> dict:
    response = requests.get(f"https://registry.example.com/r/{name}.json", timeout=10)
    response.raise_for_status()
    return response.json()


component = request_component("status-page")
print(component["name"])`;

/**
 * The cURL sample — the third demo, and the line that proves the comment fix: every
 * character after `//` used to render as a comment.
 */
export const REGISTRY_REQUEST_CURL = `curl -s https://registry.example.com/r/status-page.json \\
  -H "Accept: application/json"`;

/** The three snippets the "Language selector" demo offers, in its order. */
export const REGISTRY_REQUEST_SNIPPETS: CodeBlockSnippet[] = [
	{ language: "tsx", label: "JSX / TypeScript", code: REGISTRY_REQUEST_TSX },
	{ language: "python", label: "Python", code: REGISTRY_REQUEST_PYTHON },
	{ language: "curl", label: "cURL", code: REGISTRY_REQUEST_CURL },
];

/** One snippet per language the component knows, in the enum's own order. */
export const LANGUAGE_TOUR: CodeBlockSnippet[] = [
	{
		language: "tsx",
		code: `import { Badge } from "$lib/components/ui/badge/index.js"

// A tag is a badge that has been told what it is about.
export function StatusTag({ state }: { state: Status }) {
  const label = STATUS_LABELS[state] ?? "Unknown"
  return <Badge variant={state}>{label}</Badge>
}`,
	},
	{
		language: "ts",
		code: `export type Status = "healthy" | "degraded" | "down"

/* The labels are declared, not derived: "down" is not "Down" in every locale. */
export const STATUS_LABELS: Record<Status, string> = {
  healthy: "Healthy",
  degraded: "Degraded",
  down: "Down",
}`,
	},
	{
		language: "jsx",
		code: `export function Toolbar({ items }) {
  return (
    <div className="toolbar">
      {items.map((item) => (
        <button key={item.id}>{item.label}</button>
      ))}
    </div>
  )
}`,
	},
	{
		language: "js",
		code: `import { readFile } from "node:fs/promises"

export async function loadManifest(path) {
  const raw = await readFile(path, "utf8") // utf8, never a Buffer
  return JSON.parse(raw)
}`,
	},
	{
		language: "json",
		code: `{
  "name": "svelte-theme-parallax",
  "private": true,
  "version": "0.1.0",
  "engines": { "node": ">=20" },
  "sideEffects": false,
  "themes": ["graphite", "sepia", "parallax"],
  "publishedAt": null
}`,
	},
	{
		language: "css",
		code: `/* The soft family: an opaque tint under a contrast-walked ink. */
:root {
  --success-subtle: #d2eddf;
  --success-subtle-foreground: #005c30;
}

.badge-success {
  background: var(--success-subtle);
  color: var(--success-subtle-foreground);
  padding: 2px 8px;
}`,
	},
	{
		language: "bash",
		code: `# Install the kit, then start Vite on a port nothing else wants.
npm install
npm run dev -- --port 5174

# The two gates that matter before a push.
npm run check && npm run themes:audit`,
	},
	{
		language: "python",
		code: `import json
from urllib.request import urlopen


def load_palette(name: str) -> dict:
    # Twelve palettes, one shape.
    with urlopen(f"https://example.test/themes/{name}.json") as response:
        return json.load(response)


palette = load_palette("graphite")
print(palette["name"], len(palette) // 2)`,
	},
	{
		language: "curl",
		code: `curl -s https://example.test/api/themes \\
  -H "Accept: application/json" \\
  -H "Authorization: Bearer $TOKEN"`,
	},
	{
		language: "text",
		code: `Plain text is a language here, and its grammar is that it has none.
Don't colour an apostrophe, don't colour a 10:30, don't colour a "quote".
Every character below reads in the page's own ink.`,
	},
	{
		language: "csv",
		code: `id,name,plan,seats,note
1041,Ada Lovelace,team,12,"Renews in January, invoiced yearly"
1042,Grace Hopper,enterprise,240,
1043,Katherine Johnson,starter,3,"Trial extended twice"`,
	},
	{
		language: "md",
		code: `# Release notes

The kit's own answer to "what changed": prose, and prose stays prose.
Don't colour an apostrophe here either — a heading's \`#\` is a heading,
not a comment, and *emphasis* is not a string.

- One bullet, no ink of its own.
- [A link](https://example.test) reads as the line it sits in.`,
	},
	{
		language: "sql",
		code: `-- Seats in use per plan, busiest first.
select plan, count(*) as accounts, sum(seats) as seats
from subscriptions
where status = 'active' and canceled_at is null
group by plan
order by seats desc
limit 10;`,
	},
	{
		language: "yaml",
		code: `# The two gates that guard a push.
name: CI
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    continue-on-error: false
    steps:
      - run: npm run check
      - run: npm run themes:audit`,
	},
];

/**
 * The "Download" demo's payload: a small customer export. Its language is `csv`, which is what
 * makes the header read CSV and the download stamp `text/csv` with no `mediaType` from the
 * caller — the demo's point is that the filename is the affordance, and the type follows the
 * language unless the caller overrides it.
 */
export const CUSTOMER_EXPORT_CSV = `id,name,plan,seats,renews_on
1041,Ada Lovelace,team,12,2027-01-15
1042,Grace Hopper,enterprise,240,2026-11-30
1043,Katherine Johnson,starter,3,2026-09-08
1044,Margaret Hamilton,team,25,2027-03-21
`;
