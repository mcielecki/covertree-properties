# Covertree Properties

A full-stack app for managing US property records through a GraphQL API. When a property is
created, the API looks up the current weather and coordinates for its ZIP code on
[Weatherstack](https://weatherstack.com) and stores them with the record.

![Property list](docs/screenshots/list.png)

- **API:** Node + TypeScript, GraphQL Yoga (schema-first), Prisma 7, PostgreSQL
- **Web:** React + Vite, Apollo Client, Tailwind
- **Tests:** Vitest, React Testing Library, Playwright

Requirements: [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md). Full specification and every design
decision: [docs/SPEC.md](docs/SPEC.md).

## Contents

- [Quick start (Docker)](#quick-start-docker)
- [Development mode](#development-mode)
- [Tests](#tests)
- [Environment variables](#environment-variables)
- [Example GraphQL operations](#example-graphql-operations)
- [Architecture](#architecture)
- [Screenshots](#screenshots)
- [Known limitations](#known-limitations)
- [Next steps](#next-steps)
- [Built with AI](#built-with-ai)

## Prerequisites

- **Docker** with Compose v2. This is all you need for the quick start.
- For development mode and tests: **Node 22** (see `.nvmrc`) and **pnpm 12**. Install pnpm with
  `corepack enable` or `npm install -g pnpm`. Corepack is being removed from newer Node versions,
  so use npm there.

## Quick start (Docker)

```sh
cp .env.example .env
# Put your key in WEATHERSTACK_API_KEY inside .env
docker compose up --build
```

This starts Postgres, the API (it runs the migrations first) and the web app:

- Web app: <http://localhost:5173>
- GraphQL API: <http://localhost:4000/graphql> (GraphiQL opens in the browser)

**No Weatherstack key?** Use the built-in fake provider:

```sh
cp .env.example .env
WEATHER_PROVIDER=fake docker compose up --build
```

It returns the same fixed weather and coordinates (Fountain Hills, AZ) for every ZIP code, and
the API logs a warning at startup. Without a key and without `WEATHER_PROVIDER=fake`, the API
exits at startup with `WEATHERSTACK_API_KEY: required unless WEATHER_PROVIDER=fake`, and Compose
reports that the `web` dependency failed.

To stop the stack, run `docker compose down`. Add `-v` to also delete the database volume.

### Weatherstack and HTTPS

The API calls `https://api.weatherstack.com` by default. Some Weatherstack plans don't allow
HTTPS and answer with error `105 https_access_restricted`. In the UI this appears as
"Weather service is unavailable", and the API log shows the error code. If this happens, set
the following in `.env` and restart:

```sh
WEATHERSTACK_BASE_URL=http://api.weatherstack.com
```

### Checking the live API

No test calls the real Weatherstack API. Before delivery, run the app with a real key
(`WEATHER_PROVIDER=weatherstack`), create a property from the web app and check that the
details page shows the current weather for that ZIP code.

## Development mode

In development mode, Compose runs only the database. The apps run on your machine with hot
reload.

```sh
cp .env.example .env                              # then set WEATHERSTACK_API_KEY or WEATHER_PROVIDER=fake
docker compose up -d db
pnpm install                                      # also generates the Prisma client
pnpm --filter api exec prisma migrate dev         # applies the migrations to the dev database
pnpm dev                                          # api: tsx watch on :4000, web: Vite on :5173
```

The API reads the repo-root `.env`. Variables that are already set in your environment take
precedence. `pnpm dev` sets `NODE_ENV=development`, which adds error details to masked GraphQL
errors.

Other scripts (run from the repo root):

| Script                              | What it does                                                                                                                                        |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck`                    | `tsc --noEmit` in every package                                                                                                                     |
| `pnpm lint`                         | ESLint in every package                                                                                                                             |
| `pnpm format` / `pnpm format:check` | Prettier                                                                                                                                            |
| `pnpm build`                        | Production build of the web app                                                                                                                     |
| `pnpm codegen`                      | Regenerates the Prisma client, the GraphQL resolver types and the web's typed documents. Run it after editing any `schema.graphql` or web operation |

## Tests

The `db` container must be running (`docker compose up -d db`). Tests use their own databases,
`covertree_test` and `covertree_e2e`, which the compose init script creates. They never touch
the dev database, and no test calls the real Weatherstack API.

```sh
pnpm test                                     # all unit + API integration + web component tests
pnpm --filter api test:unit                   # API unit tests only (no database)
pnpm --filter api test:integration            # API integration tests (GraphQL + real Postgres)
```

End-to-end smoke test (Playwright, Chromium). It is not part of `pnpm test`:

```sh
pnpm --filter @covertree/web exec playwright install chromium   # one time only
pnpm test:e2e
```

Playwright starts its own API on `:4100` (fake weather provider, `covertree_e2e` database) and
Vite on `:5174`. It never reuses running servers, so it is safe to run while `pnpm dev` is up.
The flow creates a property, finds it in the list, filters by city and state, and deletes it
through the confirmation dialog. Add `--headed` to watch it:
`pnpm --filter @covertree/web exec playwright test --headed`.

| Level          | Weatherstack                                                  | Postgres                | Where                                         |
| -------------- | ------------------------------------------------------------- | ----------------------- | --------------------------------------------- |
| Unit           | fake provider, or stubbed `fetch` with real-response fixtures | in-memory repository    | `apps/api`, `packages/validation`, `apps/web` |
| Integration    | fake provider                                                 | real (`covertree_test`) | `apps/api/test/integration`                   |
| Web components | — (Apollo `MockLink`)                                         | —                       | `apps/web/src/**/*.test.tsx`                  |
| E2E            | fake provider                                                 | real (`covertree_e2e`)  | `apps/web/e2e`                                |

## Environment variables

All variables are listed in [.env.example](.env.example). Never commit `.env`.

| Var                                                   | Used by      | Default                                                          | Notes                                                                                      |
| ----------------------------------------------------- | ------------ | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                                        | api          | — (required)                                                     | Dev database. Docker Compose sets its own value that points at the `db` service            |
| `TEST_DATABASE_URL`                                   | api tests    | `postgresql://covertree:covertree@localhost:5432/covertree_test` | Integration tests only. The name must end with `_test`. Never falls back to `DATABASE_URL` |
| `E2E_DATABASE_URL`                                    | web E2E      | `postgresql://covertree:covertree@localhost:5432/covertree_e2e`  | Playwright only. The name must end with `_e2e`. Never falls back to `DATABASE_URL`         |
| `WEATHERSTACK_API_KEY`                                | api          | — (required unless `WEATHER_PROVIDER=fake`)                      | Never committed, never logged                                                              |
| `WEATHERSTACK_BASE_URL`                               | api          | `https://api.weatherstack.com`                                   | Use `http://api.weatherstack.com` if your plan rejects HTTPS                               |
| `WEATHERSTACK_TIMEOUT_MS`                             | api          | `5000`                                                           | No retries                                                                                 |
| `WEATHER_PROVIDER`                                    | api          | `weatherstack`                                                   | `fake` for demos without a key and for E2E. Logs a startup warning                         |
| `PORT`                                                | api          | `4000`                                                           |                                                                                            |
| `CORS_ORIGIN`                                         | api          | `http://localhost:5173`                                          |                                                                                            |
| `NODE_ENV`                                            | api          | `production`                                                     | Only `development` adds `originalError` to masked errors. `pnpm dev` sets it               |
| `VITE_GRAPHQL_URL`                                    | web          | `http://localhost:4000/graphql`                                  | Build time: Vite inlines it                                                                |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | compose (db) | `covertree` / `covertree` / `covertree`                          | The init script also creates `covertree_test` and `covertree_e2e`                          |

## Example GraphQL operations

Run these in GraphiQL at <http://localhost:4000/graphql>, or with `curl`:

```sh
curl -s http://localhost:4000/graphql \
  -H 'content-type: application/json' \
  -d '{"query":"{ properties { totalCount items { id street city } } }"}'
```

The responses below come from a real run with `WEATHER_PROVIDER=fake`.

**Create a property.** This is the only operation that calls Weatherstack.

```graphql
mutation {
  createProperty(
    input: {
      street: "15528 E Golden Eagle Blvd"
      city: "Fountain Hills"
      state: AZ
      zipCode: "85268"
    }
  ) {
    id
    street
    city
    state
    zipCode
    lat
    long
    createdAt
    weatherData {
      temperature
      weatherDescriptions
    }
  }
}
```

```json
{
  "data": {
    "createProperty": {
      "id": "cd92be32-75cf-4db2-ac91-bdf52f2bd01d",
      "street": "15528 E Golden Eagle Blvd",
      "city": "Fountain Hills",
      "state": "AZ",
      "zipCode": "85268",
      "lat": 33.609,
      "long": -111.724,
      "createdAt": "2026-09-26T11:45:49.806Z",
      "weatherData": { "temperature": 88, "weatherDescriptions": ["Sunny"] }
    }
  }
}
```

**List with filter, sort and pagination.** The city match is exact but case-insensitive. Filters
are combined with AND. `sortOrder` defaults to `DESC` (newest first), `limit` to 20 (max 100),
and `offset` to 0.

```graphql
query {
  properties(filter: { city: "fountain hills", state: AZ }, sortOrder: DESC, limit: 10, offset: 0) {
    totalCount
    items {
      id
      street
      city
      state
      zipCode
      createdAt
      weatherData {
        temperature
      }
    }
  }
}
```

**Details.** Returns `null` for an unknown id. Weather fields other than `observationTime`,
`temperature`, `weatherDescriptions` and `weatherIcons` are nullable.

```graphql
query {
  property(id: "cd92be32-75cf-4db2-ac91-bdf52f2bd01d") {
    street
    weatherData {
      observationTime
      temperature
      feelsLike
      windSpeed
      windDir
      humidity
      isDay
    }
  }
}
```

**Delete.** This is a hard delete and returns the deleted id.

```graphql
mutation {
  deleteProperty(id: "cd92be32-75cf-4db2-ac91-bdf52f2bd01d")
}
```

**Errors** are returned in `errors[]` with a machine-readable `extensions.code`
(`BAD_USER_INPUT`, `NOT_FOUND`, `ALREADY_EXISTS`, `LOCATION_NOT_FOUND`,
`WEATHER_SERVICE_UNAVAILABLE`). For example, a 4-digit ZIP:

```json
{
  "errors": [
    {
      "message": "Invalid input",
      "path": ["createProperty"],
      "extensions": {
        "code": "BAD_USER_INPUT",
        "fieldErrors": { "zipCode": ["Zip code must be exactly 5 digits"] }
      }
    }
  ],
  "data": null
}
```

Creating the same address again (case- and whitespace-insensitive) fails with `ALREADY_EXISTS`
and the existing `id` in `extensions`. In that case Weatherstack is not called.

## Architecture

```
apps/api             GraphQL API (Yoga, Prisma, Weatherstack adapter)
apps/web             React SPA (Apollo Client, React Router, Tailwind)
packages/validation  Shared zod schemas + US_STATES, used by the api and the web
```

**API layers:** `resolver → service → repository`.

- **Resolvers** are thin. They pass arguments to `PropertyService` and return the result, with
  no Prisma, no zod and no `try/catch`.
- **`PropertyService`** validates and normalizes input with the shared zod schemas, checks for
  duplicates, calls the weather provider and the repository, and throws plain domain errors.
- **`PropertyRepository`** is an interface with two implementations: Prisma, and an in-memory
  fake for unit tests. A shared contract test suite runs against both so the fake can't drift.
- **`WeatherProvider`** is a port with a Weatherstack adapter and a deterministic fake. It is
  injected into the service, and only `createProperty` calls it.
- **`maskError`** converts domain errors into `GraphQLError`s with an `extensions.code`.
  Anything unexpected is masked as `"Unexpected error."`.

**Key decisions** (reasons in [SPEC.md](docs/SPEC.md) §0 and §2.2):

- **Schema-first SDL + GraphQL Code Generator** on both sides. Resolvers and web operations are
  typed against the same schema, and the generated files are committed, so a clean clone
  typechecks without running codegen.
- **Validation rules live in one place**, `packages/validation`. The web form and the API use
  the same schemas, and `state` is additionally a GraphQL enum (50 states + DC).
- **Offset pagination** returning `{ items, totalCount }`, because the UI needs "page X of Y".
  Sorting is by `createdAt` with `id` as a tiebreaker, so the order is stable.
- **Case-insensitive filters and uniqueness via computed columns.** `cityKey` and `addressKey`
  are normalized and lowercased, filtered with plain equality on an index, and `addressKey` has
  a unique constraint.
- **Weatherstack is called once, and only on create.** The duplicate check runs first so no
  quota is spent on it. If the weather lookup fails, nothing is saved. The adapter checks
  `success: false` on HTTP 200, parses `lat`/`lon` from strings, rejects non-US locations, and
  uses a 5-second timeout with no retries.
- **`weatherData` is stored as raw JSON** (the Weatherstack `current` object) and exposed as a
  typed `WeatherData` object. Only four fields are required, so if Weatherstack drops a cosmetic
  field, property creation still works.
- **Web:** filters, sort and page live in the URL. After create or delete the active list query
  is refetched. Deleting from the details page evicts the entity from the Apollo cache.
  Deletion is confirmed in a native `<dialog>`.

## Screenshots

| List                               | Details                                  | Create                                 |
| ---------------------------------- | ---------------------------------------- | -------------------------------------- |
| ![List](docs/screenshots/list.png) | ![Details](docs/screenshots/details.png) | ![Create](docs/screenshots/create.png) |

## Known limitations

- **Coordinates resolve to the ZIP area, not the street.** Weatherstack is queried by ZIP code,
  so `lat`/`long` are those of the location it resolves for the ZIP (roughly the town), not of
  the exact address. Street, city, state and ZIP are not checked against each other; only the
  resolved country must be the US.
- **The API Docker image runs TypeScript with `tsx`** and ships dev dependencies (the Prisma CLI
  is needed for `migrate deploy`). The result is a larger image and a short transpile at startup.
  This is fine for a local one-command run, but not a production image. See Next steps.
- **Weather is a snapshot** from the moment the property was created and is never refreshed.
  Units are fixed to Fahrenheit, mph, inches and miles.
- **Out of scope:** authentication, updating properties, addresses outside the 50 states + DC,
  and ZIP+4. The full list is in [SPEC.md §8](docs/SPEC.md#8-out-of-scope).

## Next steps

- Compile the API with esbuild and run migrations in a separate step, for a smaller production
  image without dev dependencies (see the `tsx` trade-off in
  [SPEC.md §6](docs/SPEC.md#6-monorepo-structure)).

## Built with AI

This project was built AI-first with Claude Code: a spec written and reviewed before any code,
nine milestones each planned, approved and test-driven, and deterministic guardrails (format and
verify hooks, deny rules, test-database guards). Where the AI was wrong and how it was caught is
documented in [docs/AI_WORKFLOW.md](docs/AI_WORKFLOW.md). Raw session exports are in
[docs/ai-sessions/](docs/ai-sessions/).
