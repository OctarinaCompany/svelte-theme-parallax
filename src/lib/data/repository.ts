/**
 * Where this gallery's own source lives.
 *
 * ONE TRUTH, AND IT IS `package.json`. The URL is derived there — `vite.config.ts` reads
 * `repository.url` and strips the `git+` prefix and the `.git` suffix npm requires — and
 * substituted at build time, so a fork that changes its remote changes this with it and nobody
 * has to remember a second place.
 *
 * `src/vite-env.d.ts` declares the key, so this is a real read rather than an assertion over an
 * `any` — and a misspelling is a compile error rather than a site that ships the word `undefined`.
 *
 * DEMO DATA, AND `data/` IS LOAD-BEARING. Two unrelated components read this, which §2 would
 * normally answer with `src/lib/shared/` — and that would be the wrong answer here. The registry's
 * import graph FOLLOWS `$lib/shared/…` into whatever item it is building, so this repository's own
 * URL would be one import away from shipping into a consumer's project; it REFUSES `$lib/data/…`
 * by name and fails the build. The guarantee is a build error, not a habit.
 */
export const REPOSITORY_URL: string = import.meta.env.REPOSITORY_URL;
