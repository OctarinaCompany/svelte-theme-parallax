<!-- One intent per PR. The subject line follows `<type>: <imperative summary>`. -->

## What

<!-- What changes, in one or two sentences. -->

## Why

<!-- The reasoning — what was wrong, or what this enables. Link the issue if there is one. -->

## Tier touched

<!-- Delete the lines that do not apply. Registry components must stay close to upstream —
     see docs/CONVENTIONS.md §1. -->

- [ ] Registry component (divergence from upstream justified in a comment)
- [ ] House component
- [ ] Gallery pages
- [ ] Tools (`tools/`) — generated files re-generated, not hand-edited
- [ ] Docs / infrastructure

## Checklist

- [ ] `npm run format:check` passes
- [ ] `npm run check` passes (0 errors)
- [ ] `npm run build` passes
- [ ] `npm run themes:audit` passes (CI runs it on every PR; it can only move if `src/app.css`,
      `tools/themes/` or a token changed)
- [ ] `npm run loaders:check` passes (CI runs it on every PR)
- [ ] Visual changes: screenshots attached in **both light and dark mode**
