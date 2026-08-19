# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

The first published state of the project. Nothing is tagged yet, so everything the repository
ships today is listed here.

### Added

- The component library under `src/lib/components/ui/` — the shadcn-svelte registry set plus
  the house components (kanban, data grid, sortable, editable, gauge, phone input, media
  player, and many more), all under one token set.
- The gallery: every component documented by at least one live page, served inside a working
  dashboard shell (collapsible sidebar with flyouts, breadcrumb header, theme picker, mobile
  drawer).
- The theme system: twelve palettes generated from a handful of numbers per theme by
  `tools/themes/generate.mjs`, audited by `tools/themes/audit.mjs` for contrast, brand/status
  separation and CVD collisions — the audit is a CI gate.
- The sizing charter: one control ramp (`--control-h-*`: 24/32/40/48 px) consumed by every
  sized control, and per-surface density tiers on tables and cards.
- The hash router derived from a single `CATEGORIES` ladder in `src/lib/hooks/route.svelte.ts`;
  routes, route types and the sidebar menu are all generated from it.
- The published registry: `registry.json` is generated from the source by `tools/registry/`,
  compiled into `public/r/`, and deployed to GitHub Pages with the gallery on every push to
  `main` — so the theme, the shell, the Agent Skill and every house component install into
  another project through the shadcn-svelte CLI.
- House conventions written down in `docs/CONVENTIONS.md`; the theme system in `docs/THEME.md`;
  the published items in `docs/REGISTRY.md`.
- CI: formatting, type-checking, production build, the theme audit and the loader-style check
  on every push and pull request.
