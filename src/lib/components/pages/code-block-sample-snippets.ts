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
 * palettes: ten snippets chosen so that every rule in the highlighter fires at least once —
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
];
