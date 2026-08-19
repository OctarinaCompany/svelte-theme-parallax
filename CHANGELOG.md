# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-08-17

The first curated state of the project.

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
- House conventions written down in `docs/CONVENTIONS.md`; the theme system in `docs/THEME.md`.
- CI: formatting, type-checking, production build, the theme audit and the loader-style check
  on every push and pull request.

[Unreleased]: https://github.com/OctarinaCompany/svelte-theme-parallax/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/OctarinaCompany/svelte-theme-parallax/releases/tag/v0.1.0
