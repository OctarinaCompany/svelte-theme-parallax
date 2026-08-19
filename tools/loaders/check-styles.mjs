/**
 * The check `svelte-check` cannot do for `src/lib/components/ui/loader/`.
 *
 * THE BLIND SPOT, measured rather than assumed. Svelte switches `css_unused_selector` off for the
 * WHOLE component as soon as an element carries `{...restProps}` or a computed `class={cn(...)}` —
 * it cannot know what classes arrive at runtime. That is the mandated root shape for all 128
 * loaders, so none of them is covered. A deliberately dead selector planted in one produced 0
 * errors and 0 warnings from a full `svelte-check --tsconfig ./tsconfig.app.json --threshold
 * warning` run over 6499 files, while controls in the same file (a type error, a `<div onclick>`)
 * were both reported. So the tooling was live and the CSS check simply does not exist here.
 *
 * WHY IT MATTERS HERE MORE THAN ELSEWHERE. A loader is nothing but a `<style>` block: a class
 * spelled `.bar` in the markup and `.bra` in the block gives a file that is prettier-clean,
 * check-clean, builds, and renders a motionless shape with the wrong geometry. Nothing catches it
 * before someone looks at the page, and there are 128 chances to get it wrong.
 *
 * It reports three things:
 *   1. a class selector in `<style>` that no markup class token matches   (dead rule → static loader)
 *   2. a `@keyframes` name that nothing in the same block references      (dead animation)
 *   3. a `var(--x)` read in `<style>` that nothing sets                   (unresolved custom property)
 *
 * Check 3 resolves the theme tokens out of `src/app.css` rather than carrying a whitelist. An
 * earlier whitelist-based version reported four false failures — `var(--foreground)` and
 * `var(--primary)` are global by design and a scoped block is entitled to read them — and a gate
 * that cries wolf on correct code stops being run.
 *
 * Usage:  node tools/loaders/check-styles.mjs <file.svelte> [...]
 *         node tools/loaders/check-styles.mjs            (defaults to every loader)
 * Exits non-zero when any file fails, after checking them all, so it composes with a
 * pre-commit hook or CI.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const LOADER_DIR = join(ROOT, "src/lib/components/ui/loader");

/**
 * Every custom property `src/app.css` defines, so check 3 can tell a global token from a typo.
 *
 * Deliberately greedy — it takes any `--x:` declaration anywhere in the file, including inside
 * `@theme`, `:root`, `.dark` and the component blocks. A token declared anywhere in app.css is
 * reachable from a scoped block, which is exactly the question being asked.
 */
function globalTokens() {
	const css = readFileSync(join(ROOT, "src/app.css"), "utf8");
	return new Set([...css.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));
}

function checkFile(file, globals) {
	const source = readFileSync(file, "utf8");
	const styleMatch = source.match(/<style>([\s\S]*)<\/style>/);
	if (!styleMatch) return { file, problems: [], skipped: true };

	const style = styleMatch[1];
	const markup = source.slice(0, styleMatch.index);

	/**
	 * Class tokens the markup uses.
	 *
	 * Both passes are needed and the second is the load-bearing one: a loader's geometry lives in a
	 * `cn("…")` string literal, which the `class=` pattern never sees because the attribute value is
	 * an expression. Over-collecting is the safe direction — a class this misses is a false failure,
	 * a class it collects wrongly is only a missed detection.
	 */
	const markupClasses = new Set();
	for (const m of markup.matchAll(/class(?:Name)?=(?:"([^"]*)"|\{[^}]*\})/g)) {
		if (m[1]) for (const t of m[1].split(/\s+/)) if (t) markupClasses.add(t);
	}
	for (const m of markup.matchAll(/"([^"\n]*)"/g)) {
		for (const t of m[1].split(/\s+/)) if (t) markupClasses.add(t);
	}

	const problems = [];

	// 1. Class selectors the markup never applies. A dot starts a class when the character
	//    before it is a selector-position delimiter — start, whitespace, `,`, a combinator,
	//    `(`, nesting's `&`, or a brace — OR when it chains straight off a class this loop just
	//    accepted (`.bar.active`). Property text qualifies on neither count, so `url(a.png)`
	//    cannot smuggle in a false failure.
	const selectorClasses = new Set();
	let chainEnd = -1;
	for (const m of style.matchAll(/\.([A-Za-z_][\w-]*)/g)) {
		if (m.index === chainEnd || m.index === 0 || /[\s,>+~(&{}]/.test(style[m.index - 1])) {
			selectorClasses.add(m[1]);
			chainEnd = m.index + m[0].length;
		}
	}
	for (const c of selectorClasses) {
		if (!markupClasses.has(c)) problems.push(`dead style class ".${c}" — no markup element has it`);
	}

	// 2. Keyframes declared but never referenced. The declaration itself is cut out first, so the
	//    `@keyframes NAME` line cannot count as its own reference.
	for (const m of style.matchAll(/@keyframes\s+([\w-]+)/g)) {
		const name = m[1];
		const rest = style.split(`@keyframes ${name}`).join("");
		if (!new RegExp(`(^|[\\s:])${name}([\\s;,}]|$)`, "m").test(rest)) {
			problems.push(`@keyframes "${name}" is declared but never referenced`);
		}
	}

	// 3. Custom properties read but never set — locally, via `style:--x` in the markup, or globally
	//    in app.css.
	const set = new Set(globals);
	for (const m of style.matchAll(/(--[\w-]+)\s*:/g)) set.add(m[1]);
	for (const m of markup.matchAll(/style:(--[\w-]+)/g)) set.add(m[1]);
	for (const m of style.matchAll(/var\((--[\w-]+)/g)) {
		if (!set.has(m[1])) problems.push(`var(${m[1]}) is read but nothing sets it`);
	}

	return { file, problems, skipped: false };
}

const args = process.argv.slice(2);
const files = args.length
	? args
	: readdirSync(LOADER_DIR)
			.filter((f) => f.startsWith("loader-") && f.endsWith(".svelte"))
			.map((f) => join(LOADER_DIR, f));

const globals = globalTokens();
let failed = 0;
let ok = 0;

for (const file of files) {
	const result = checkFile(file, globals);
	if (result.skipped) continue;
	if (result.problems.length) {
		failed += 1;
		console.log(file);
		for (const p of result.problems) console.log(`  FAIL ${p}`);
	} else {
		ok += 1;
	}
}

console.log(`${ok} ok, ${failed} failed (${globals.size} global tokens resolved from src/app.css)`);
process.exit(failed ? 1 : 0);
