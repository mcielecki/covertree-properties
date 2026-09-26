# AI Workflow

This project was built AI-first with Claude Code. This document describes the harness,
the process, the decisions behind them, and an honest log of where the AI needed correction.
Raw session exports are in [ai-sessions/](ai-sessions/).

## Tooling

- **Claude Code** (CLI agent): all code, tests, config and most docs.
- **Claude (chat, claude.ai)** as a mentor/reviewer: I used a separate chat to review
  the spec and every milestone plan before approving it, and to challenge decisions.
  Its suggestions reached Claude Code as my prompts, so they are visible in the session exports.
- **Models:** Opus for the spec/design phase, Sonnet for implementation. <!-- verify -->
- **Plan:** Claude Pro, so the process is deliberately token-efficient
  (plan first, `/clear` between milestones, short CLAUDE.md).

## Harness

Everything below is committed, so cloning the repo gives the same setup.

### CLAUDE.md
Project memory loaded in every session. Deliberately short: only what the agent can't
infer from code (stack, layering rules) and known pitfalls (Weatherstack quirks),
plus the definition of done. Details live in docs/SPEC.md and are pulled in on demand.

### Plugins (project scope, `.claude/settings.json`)
| Plugin | Why |
|---|---|
| context7 | Up-to-date library docs. Caught several outdated APIs (see below). |
| typescript-lsp | Real type errors and navigation instead of guessing. |
| frontend-design | Anthropic's skill for a distinctive, non-generic UI. |
| playwright | The agent opens the running app and verifies UI flows itself. |
| pr-review-toolkit | Independent review agents before delivery. |

Considered and rejected: **superpowers**. Powerful but heavy and subagent-intensive;
a lighter custom workflow fits this project size and plan limits better.

### Permissions
- `allow`: only safe, repetitive commands (pnpm, docker compose, read-only git).
  Commits and pushes are always mine, after reviewing the diff.
- `deny`: `Read(./.env)` so the API key never enters the model context or the
  exported sessions; `pkill`/`killall` added after an incident (see below).

### Hooks
- **PostToolUse → format.sh**: Prettier on every edited file. Formatting is deterministic, not AI.
- **Stop → verify.sh**: the agent cannot finish a turn while typecheck or lint fail
  (exit code 2 feeds the errors back). Enforces the definition of done from CLAUDE.md.

### `/milestone` command
One reusable workflow for every implementation step: plan mapped to AC ids → wait for
explicit "approved" → TDD → typecheck/lint/test → summary with deviations, manual checks
and a commit message. No auto-commits.

### `spec-reviewer` subagent
Read-only reviewer (no Edit/Write tools) with its own context, so it doesn't grade code
it wrote. Checks every AC against tests, layering rules, secrets and code smells.

## Process

1. **Requirements** copied into docs/REQUIREMENTS.md.
2. **Spec first.** Opus in plan mode asked 26 clarifying questions in one batch; I answered
   them (changing 4 recommendations), then reviewed the resulting docs/SPEC.md and requested
   9 changes before any code existed.
3. **Milestones.** Nine ordered milestones from SPEC §9, each ending with passing checks,
   a session export and a commit. The spec is a living document: every justified deviation
   was written back into it in the same change.
4. **Verification beyond tests.** A live Weatherstack call after the API milestone,
   a clean-clone Docker run, and Playwright walkthroughs of the UI.

## Decision log

- **Apollo Server → GraphQL Yoga.** Initially chose Apollo Server. After review with a
  backend engineer switched to Yoga: lighter, Fetch API based, Apollo's frequent
  major-version churn (v4 EOL Jan 2026), and Yoga shares a maintainer (The Guild) with
  GraphQL Code Generator. Apollo Client stays on the frontend (independent library).
- **Schema-first SDL + Codegen** over code-first: the schema is a readable contract;
  codegen keeps resolvers and the web client typed against it.
- **Weather query by ZIP only, Fahrenheit fixed.** ZIP resolves most reliably; all
  properties are in the US, so no unit switch (YAGNI).
- **Base URL from env, default HTTPS.** My free key supports HTTPS, but reviewers'
  plans may not.
- **Weather failure = no property.** lat/long only come from the API, so a record
  without it would be incomplete.
- **Port/adapter for weather, repository interface for data.** Business logic is
  tested with fakes; a shared contract suite runs against both the in-memory and
  Prisma repositories to keep the fake honest.
- **Test DB prepared with `migrate deploy` + TRUNCATE** instead of `migrate reset`
  (see "Where tools caught problems"). A guard refuses any database not named `*_test`.
- **tsx at runtime in Docker.** Conscious trade-off: the image needs the Prisma CLI
  for migrations anyway. Next step: esbuild + separate migration step.
- **Generated GraphQL types committed**, Prisma client not: small, readable types
  make a clean clone compile immediately; the Prisma client is large and generated on install.
- **Native `<dialog>` instead of a custom focus trap.** Less custom code; the browser
  handles inertness, Escape and focus return. Trade-off: in Chrome, Tab can reach the
  browser UI (never the page behind).

## Session log

| # | Session | Goal | Notes |
|---|---|---|---|
| 01 | [spec](ai-sessions/01-spec.md) | SPEC.md | 26 questions, 4 answers changed, 9 review fixes |
| 02 | [validation](ai-sessions/02-validation.md) | shared zod package | boundary tests (0/1/200/201 chars) |
| 03 | [weather adapter](ai-sessions/03-weather-adapter.md) | port + adapter + fake | fixture from a real response |
| 04 | [service & repository](ai-sessions/04-service-repository.md) | business logic, Prisma | contract tests on both repos |
| 05 | [GraphQL API](ai-sessions/05-graphql-api.md) | Yoga, codegen, maskError | 88 integration tests; live API check |
| 06 | [Docker](ai-sessions/06-docker.md) | one-command start | verified on a clean clone |
| 07a | [web functionality](ai-sessions/07a-web-functionality.md) | pages, data, tests | Apollo cache issues found in browser |
| 07b | [web design](ai-sessions/07b-web-design.md) | design, a11y, responsive | Playwright walkthrough at 1280/375px |
| 08 | <!-- e2e --> | | |
| 09 | <!-- readme/docs --> | | |

## Where the AI was wrong (and how it was caught)

1. **Fragile designs in the first spec draft.** Correct but brittle: the city filter
   relied on a validation regex to make Prisma's ILIKE safe; the weather schema required
   all 16 fields, so a missing cosmetic field would block creation; custom cache
   typePolicies for offset pagination; integration and E2E tests sharing one database;
   `depends_on` without a healthcheck. Caught in spec review, fixed before any code.
2. **Invalid Prisma syntax in the spec** despite the spec claiming context7 verification.
   Caught when the schema was compiled. Lesson: verification on paper doesn't replace a compiler.
3. **Pasted data treated as plan approval** (M3). The agent started implementing when I
   sent context. I tightened `/milestone`: it now waits for an explicit "approved".
4. **Dependency direction** (M3). The weather port imported a type from the Weatherstack
   adapter. Fixed: the port owns plain domain types, and the adapter's zod schema is checked
   against them at compile time with `satisfies z.ZodType<WeatherCurrent>`.
5. **Invented fixture values** (M3). The agent converted units by hand for the test fixture.
   Replaced with a real `units=f` response.
6. **An incomplete review suggestion** (M7a). The mentor chat suggested `refetchQueries`
   after create/delete; Claude Code noticed it only refetches *active* queries, so the list
   would be stale after navigating back. Fixed with `cache-and-network` on the list.
   Review goes both ways.
7. **Over-broad `pkill`** (M7b). While stopping its own dev servers the agent killed one
   of my processes. It asked for permission and I approved too quickly. Fixed in the harness:
   `pkill`/`killall` are now denied, and I read out-of-list approvals carefully.
<!-- add M8/M9 and final review findings -->

## Where AI and tools caught problems

- **CLAUDE.MD vs CLAUDE.md.** I created the file with an uppercase extension; it worked on
  macOS but would be ignored on Linux. The agent flagged it during the spec phase.
- **context7 prevented outdated code:** zod 4 (`z.uuid()`, `z.looseObject()` instead of
  deprecated APIs), Prisma 7 configuration, Apollo Client 4 imports.
- **Prisma blocked a destructive command run by an agent** (`migrate reset`). I chose
  `migrate deploy` + TRUNCATE, which is also faster and needs no consent on every run.
- **Tests found a dual package hazard:** graphql v17 loaded twice under Vitest, breaking
  `instanceof GraphQLError` in error masking. Pinned to v16.
- **Browser runs found Apollo cache bugs tests missed:** WeatherData (no id) was overwritten
  by the list's smaller selection (`merge: true`), and the details page refetched a deleted
  entity (`broadcast: false`).
- **Deliberate breakage to prove tests work:** in several milestones the agent removed a
  check (e.g. the US country check, refetchQueries) and confirmed the matching test failed.
- **Real API quirks, confirmed on live data:** `lat`/`lon` are strings, errors come as
  HTTP 200 with `success: false`, descriptions have trailing spaces (`"Clear "`),
  `observation_time` is UTC, and country is `"USA"`.

## Lessons

- The cheapest place to fix something is the plan. Every milestone started with one.
- Deterministic guardrails (hooks, deny rules, DB guard) beat instructions the model may forget.
- A spec written by AI still needs a critical human review; so do review suggestions.
- Verify against reality: a live API call and a browser run each found what unit tests couldn't.