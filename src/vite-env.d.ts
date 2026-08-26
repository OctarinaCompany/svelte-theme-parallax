/// <reference types="vite/client" />

/**
 * The environment values `vite.config.ts` substitutes through `define`.
 *
 * WITHOUT THIS FILE the reads are not typed at all. Vite declares `ImportMetaEnv` as
 * `Record<string, any>` unless a project opts out, so `import.meta.env.REPOSITORY_URL` is `any`,
 * a `: string` annotation on it is an assertion rather than a check, and a MISSPELLED key type-
 * checks exactly as well as the right one — `npm run check` never runs Vite, so nothing would
 * catch it before the site shipped a header link reading `href="undefined"` and put the literal
 * `undefined` into every copied example.
 *
 * Declaring the key makes the read genuinely typed at its source, and makes the typo an error.
 */
interface ImportMetaEnv {
	/** This gallery's own repository, derived from `package.json` at build time. */
	readonly REPOSITORY_URL: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
