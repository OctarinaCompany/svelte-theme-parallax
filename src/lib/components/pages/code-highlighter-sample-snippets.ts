import type { CodeBlockSnippet } from "$lib/components/ui/code-block/index.js";
import { HEALTH_CHECK_RUST } from "./code-block-sample-snippets.js";

/**
 * The snippets the Code highlighter page renders.
 *
 * They live in a module for the reason `code-block-sample-snippets.ts` states for its own: a code
 * sample written inside a `.svelte` file has to escape every brace and backtick it contains, which
 * makes it a poor sample of itself, and a page of nested template literals stops reading as markup.
 *
 * EVERY ONE OF THEM IS CHOSEN AGAINST THE HOUSE TOKENIZER, because that is what this page compares.
 * `code-block.svelte` states the limits being compared against: the house rules run one line at a
 * time, and there are fourteen of them. So {@link ADAPTER_REPORT_TS} carries a three-line block
 * comment and a five-line template literal — two constructs a line-at-a-time pass cannot follow —
 * {@link GRAMMAR_TOUR} is four languages that tokenizer never had, and {@link STREAMED_REPORT_PY}
 * opens with a docstring that only turns green once the grammar has landed.
 */

/**
 * The snippet the first two sections share: what a caller writes, painted by what it describes.
 *
 * The block comment runs five lines, and the returned template literal another five, three of them
 * holding live `${…}` interpolations. Both are constructs the house tokenizer ends at the first
 * line break, and that difference is the whole argument for installing an adapter.
 */
export const ADAPTER_REPORT_TS = `import { CodeHighlighterState } from "$lib/components/ui/code-highlighter/index.js";

/*
 * A block comment over five lines, which is half the point of this
 * snippet: the house tokenizer matches its rules one line at a time,
 * so every line of this comment but the first stays plain until a
 * real grammar lands and claims the whole of it at once.
 */
const engine = new CodeHighlighterState();

export async function report(languages: readonly string[]): Promise<string> {
	await Promise.all(languages.map((id) => engine.load(id)));

	const waiting = languages.filter((id) => !engine.isReady(id));
	// The other half: a template literal spanning five lines, holding
	// expressions that are live code rather than string.
	return \`
		ready:   \${[...engine.loaded].join(", ") || "none"}
		waiting: \${waiting.join(", ") || "none"}
		table:   \${engine.languages.length} grammars, one dynamic import each
	\`;
}`;

/** A small Go service, for {@link GRAMMAR_TOUR}. */
const HEALTH_CHECK_GO = `// Package health reports whether a dependency is still answering.
package health

import (
	"context"
	"fmt"
	"net/http"
	"time"
)

// Check returns nil when the endpoint answered 200 inside the deadline.
func Check(ctx context.Context, url string) error {
	client := &http.Client{Timeout: 5 * time.Second}

	request, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return err
	}

	response, err := client.Do(request)
	if err != nil {
		return err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status %d", response.StatusCode)
	}
	return nil
}`;

/**
 * An HTML document with a stylesheet and a module script in it, for {@link GRAMMAR_TOUR}.
 *
 * The row that earns its place twice: `html` is one of the eight grammars that carry guests, and
 * the CSS and the JavaScript below are painted by those guests, through the same scope table as
 * the markup around them.
 */
const EMBEDDED_PAGE_HTML = `<!doctype html>
<!-- The style and script below are painted by the css and javascript
     grammars, which the html grammar brings with it. -->
<html lang="en" data-theme="dark">
	<head>
		<style>
			:root {
				--ring: oklch(0.7 0.1 265);
			}
			pre.sample {
				color: var(--ring, #fff);
				font-size: 0.875rem;
			}
		</style>
	</head>
	<body>
		<pre class="sample">const ready = new Set(["ts", "css"]);</pre>
		<script type="module">
			const target = document.querySelector("#count");
			if (target) target.textContent = \`\${2} grammars &amp; counting\`;
		</script>
	</body>
</html>`;

/** A two-stage container build, for {@link GRAMMAR_TOUR}. */
const SITE_IMAGE_DOCKERFILE = `# Two stages: build the site, then serve only what the build produced.
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]`;

/**
 * Four languages the house tokenizer has no grammar for, in the order the selector offers them.
 *
 * No entry carries a `label`, deliberately: none of the four is one of the fourteen, so
 * `codeBlockLanguageLabel` hands back the id itself and the selector reads `rust`, `go`, `html`,
 * `dockerfile` — the words a fence would have carried.
 *
 * The Rust snippet is the one the Code block page renders under "Unknown language", imported
 * rather than copied so the two pages cannot drift: there it is every character plain, here it is
 * the same characters through a real grammar.
 */
export const GRAMMAR_TOUR: CodeBlockSnippet[] = [
	{ language: "rust", code: HEALTH_CHECK_RUST },
	{ language: "go", code: HEALTH_CHECK_GO },
	{ language: "html", code: EMBEDDED_PAGE_HTML },
	{ language: "dockerfile", code: SITE_IMAGE_DOCKERFILE },
];

/**
 * The snippet the streaming demo writes out, a chunk at a time.
 *
 * Python, opening with a docstring, because that is the construct whose repaint is visible: the
 * house tokenizer's quote rules end at a line break, so most of the paragraph stays plain while it
 * paints, and the whole of it turns over the moment the grammar lands.
 */
export const STREAMED_REPORT_PY = `class GrammarReport:
    """What is loaded, and what is still on its way.
    A docstring is one string spanning five lines. The house tokenizer
    matches quotes within a line, so most of this paragraph stays plain
    until the python grammar lands — and then all of it turns at once.
    """
    def __init__(self, languages: list[str]) -> None:
        self.languages = languages
        self.ready: set[str] = set()
    def progress(self) -> float:
        if not self.languages:
            return 1.0
        return len(self.ready) / len(self.languages)
    def summary(self) -> str:
        missing = [id for id in self.languages if id not in self.ready]
        return f"{len(self.ready)} ready, {len(missing)} to go"`;

/** How many lines of {@link STREAMED_REPORT_PY} each chunk of the stream carries. */
const STREAM_CHUNK_LINES = 3;

/**
 * {@link STREAMED_REPORT_PY} cut into the chunks the demo appends, three lines at a time.
 *
 * DERIVED RATHER THAN WRITTEN OUT, so the chunks cannot fall out of step with the snippet they are
 * cut from — and cut on LINE boundaries because that is what the demo is about: the adapter's memo
 * reuses the longest common line prefix of the previous call, so a chunk that appends three lines
 * re-tokenises three lines and reuses every row above them. Three also puts the first boundary
 * inside the docstring, which is the case a line-at-a-time tokenizer gets wrong in both directions.
 *
 * The lookbehind split keeps each newline on the line that ends with it, so joining the chunks
 * reproduces the snippet exactly — the same split `MessagePage.svelte` uses to stream words
 * without losing the spaces between them.
 */
export const STREAMED_REPORT_CHUNKS: string[] = STREAMED_REPORT_PY.split(/(?<=\n)/).reduce<
	string[]
>((chunks, line, index) => {
	if (index % STREAM_CHUNK_LINES === 0) chunks.push(line);
	else chunks[chunks.length - 1] += line;
	return chunks;
}, []);
