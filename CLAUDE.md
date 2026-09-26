# Covertree Properties

Full-stack app for managing US property records via a GraphQL API.
Requirements: docs/REQUIREMENTS.md. Source of truth for implementation: docs/SPEC.md.

## Stack
- pnpm monorepo: apps/api (Node + TypeScript), apps/web (React + Vite + TypeScript),
  packages/validation (shared zod schemas + US_STATES, used by api and web)
- API: GraphQL Yoga, schema-first SDL, resolver types via GraphQL Code Generator (server preset)
- DB: PostgreSQL (docker compose) + Prisma
- Web: Apollo Client, Codegen client preset (typed documents passed to Apollo's useQuery/useMutation), Tailwind
- Tests: Vitest (+ React Testing Library on web)

## Architecture rules
- Layers: resolver -> service -> repository. Resolvers stay thin; no Prisma calls in resolvers.
- External APIs sit behind an interface (e.g. WeatherProvider) injected into services, so tests use fakes.
- Validate all mutation input: state is a GraphQL enum (USState); zipCode = exactly 5 digits (zod).
  Validation rules live only in packages/validation; never duplicate them in api or web.

## Weatherstack (critical)
- Call {WEATHERSTACK_BASE_URL}/current (default https://api.weatherstack.com) ONLY inside the createProperty mutation. Queries never call it.
- Store the `current` object as JSON (weatherData); parse location.lat / location.lon (strings!) to numbers.
- Errors come back as HTTP 200 with `success: false` + `error` object. Always check it.
- Use a request timeout. API key only from env WEATHERSTACK_API_KEY; never commit secrets.

## Workflow
- Plan before implementing anything non-trivial. Work in small, reviewable steps.
- TDD for business logic: write a failing test first.
- Before saying a task is done: typecheck, lint and tests must pass.
- Use context7 to check current library APIs instead of relying on memory.
- Conventional commits (feat:, fix:, test:, docs:, chore:).