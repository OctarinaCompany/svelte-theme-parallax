# Security Policy

## Reporting a vulnerability

Please do **not** report security issues through public GitHub issues.

Report privately, either:

- through GitHub's private vulnerability reporting on this repository
  (*Security → Report a vulnerability*), or
- by email to <sylvain@octarina.com> with `[SECURITY]` in the subject.

Include what you can: a description of the issue, the affected file(s) or component(s), steps to
reproduce, and the impact you believe it has. You will receive an acknowledgement within a few
days, and a status update once the report has been assessed.

## Scope

Parallax is a client-side component library and demo gallery: a static Vite build with no
backend, no authentication, and no user data storage beyond UI preferences (theme, mode,
sidebar state) in cookies and `localStorage`.

In scope:

- Cross-site scripting or HTML/URL injection through any component API or demo page
- Vulnerable behaviour introduced by the build tooling in `tools/`
- Supply-chain issues in the dependency tree (`package-lock.json` is committed and
  `npm audit` is expected to stay clean)

Out of scope:

- Issues that require a hypothetical backend or server-side rendering the project does not have
- Vulnerabilities in third-party dependencies with no exploitable path through this codebase
  (report those upstream — we still welcome a heads-up so the dependency can be bumped)

## Supported versions

Only the latest state of the `main` branch is supported. There are no maintained release
branches.
