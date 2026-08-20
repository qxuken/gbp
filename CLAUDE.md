# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Genshin Build Planner — a single Go binary (PocketBase framework) that serves a React/TS SPA embedded via `go:embed`. Users plan Genshin Impact character builds: character stats/talents, weapons, artifact sets and main stats, and team compositions.

## Commands

Backend (repo root):

```bash
nu build.nu ui       # build the frontend once (required before `air` — embed.go needs ui/dist to exist)
air                  # live-reload backend on :8090 (runs `serve --dev` from ./tmp/main.exe)
go build .           # plain build
nu build.nu          # frontend + binary into ./dist
nu scripts/clean_tmp.nu   # wipe tmp/pb_data and tmp/migrations (air's dev data + automigrations)
```

Frontend (`ui/`):

```bash
npm run dev        # vite on :3001, talks to :8090 via ui/.env.development.local
npm run build      # -> ui/dist (what embed.go embeds)
npm run typecheck  # tsc --noEmit
npm run check      # eslint
npm run fix        # eslint --fix
```

There is no test suite (no `*_test.go`, no frontend tests). Verification is typecheck + eslint + running the app.

Dev login is `test@test.com` / `testtest` — seeded by `1732466001_test_superuser.go` (superuser) and `1732467000_setup_users.go` (regular verified user "Qest Testovich"), both gated on `app.IsDev()`. The same pair works for the app, the PocketBase admin UI at `/_/`, and `/admin/dump`. Wiping `tmp/pb_data` re-creates them on next `air` run.

CLI subcommands on the binary: `seed <file>`, `dump <file> [notes]`, `hash <file> [dest]`, plus PocketBase's own (`serve`, `migrate`, …).

## Architecture

### Backend (`main.go`, `internals/`, `migrations/`)

PocketBase provides auth, CRUD, admin UI, and the REST API; `main.go` only adds:

- Static SPA serving from `ui.GetAssetsFileSystem` — in dev mode it reads `ui/dist` from disk, in prod from the embedded FS.
- `/api/plansCollections`, `/api/dictionaryVersion` — used by the frontend cache layer.
- `/api/dump/*` (generate, upload, restore, latest_seed.db) — superuser-gated seed management.
- On `OnServe`, `updateSeed` compares `seed.hash` against the `dictionaryVersion` app setting and the newest `_dbDumps` record; if it differs, the bundled `seed.db` is saved as a dump and applied.

`migrations/` are Go migrations with `Automigrate: true`. Collection names live **only** in `internals/models/collections.go` and that list is append-only — always reference the constants, never string literals.

The frontend reads plans through the **`plans` SQL view collection**, not the underlying tables. That view (`migrations/*_plans_view.go`, latest wins) left-joins `characterPlans` with `json_group_array` aggregates of `weaponPlans`, `artifactSetsPlans`, `artifactTypePlans`, and `teamPlans`, ordered by `"order"`. Adding a field to any plans sub-collection means adding a new `update_plans_view` migration that rewrites `collection.ViewQuery`, plus updating `ui/src/api/types.ts`. Writes still go to the individual collections.

### Seed / dictionary data (`internals/seed/`)

Game data (characters, weapons, artifact sets, elements, specials, patches, domains) is shipped as a standalone SQLite file, not fixtures. `seed.Seed` opens the file and copies each table into the matching PocketBase collection inside one transaction; `seed.Dump` does the reverse. Both are driven by reflection over the structs in `internals/seed/models.go` and their `pb:"name,file|fileext|json|opt"` tags (`internals/seed/utils.go`), so a new dictionary field is added by adding a struct field + tag. Icons are carried as `Icon []byte` blobs alongside a filename column. `backup/seed.db` + `seed.note` are gitignored but required by the Dockerfile.

### Frontend (`ui/src/`)

TanStack Router (file-based, `routeTree.gen.ts` is generated — don't hand-edit) + TanStack Query + PocketBase JS SDK. Route groups: `_auth` (redirects to `/builds` when authenticated), `_protected` (redirects to `/login` when not), `admin/dump` (uses its own PocketBase client with the `__pb_superusers__/_` auth store).

Three distinct state layers, and picking the wrong one is the main way to get this wrong:

1. **Dictionaries** (`api/dictionaries/`) — immutable game data. A web worker (`loader.worker.ts`) fetches every dictionary collection and stores it in IndexedDB via Dexie (`db.ts`), keyed by the `dictionaryVersion` hash so it re-syncs only when the seed changes. `hooks.tsx` exposes it through a context as `{ items, map }` pairs. Bumping the Dexie schema requires a new `db.version(n).stores({...})`.
2. **Plans** (`api/plans/`) — user data. One query, `PLANS_QUERY` (`['plans']`), full-list of the `plans` view, cached with `staleTime: Infinity`. Every mutation writes back into that one cache entry.
3. **UI state** — Zustand (`store/logger.ts`, `store/theme.ts`, `store/auth.ts`) and React context (`store/plans/filters.tsx`, `store/plans/rendering-items.tsx`). Filters are mirrored into URL search params with short keys (`cN`, `cE`, `cWT`, `cAS`, `cAT`, `cs`, `cC`) validated by a zod schema in `routes/_protected/builds.tsx`.

#### The mutation engine

`api/plans/utils/use-collection-mutation.ts` is the heart of the app and every `api/plans/*.ts` module is a thin wrapper over it. It implements debounced, batched, optimistic writes:

- Edits are recorded as **immer patches** into a reducer (`toCreate` / `toUpdate` / `toDelete`), debounced (450ms default, 750ms for character plans), then promoted into a `currentBatch` and sent as a single PocketBase batch request.
- `records` returned from the hook are *shadow records*: the server data with pending patches applied and flagged `isOptimistic` / `isOptimisticBlocked` / `isOptimisticError`. Components render these, so a card stays editable while its write is in flight.
- On success the batch responses are merged into `PLANS_QUERY`'s cache via `queryClient.setQueryData` + `produce`. On error the batch flips to `error` state and a sonner toast offers retry; a `useBlocker` guards navigation while a batch is outstanding.
- `serverPatches` strip client-only fields before sending (e.g. `PLAN_TO_CHARACTER_PLAN_PATCHES` removes the view's nested arrays so `characterPlans` gets a clean payload).
- Per-plan pending/error state from nested collections is aggregated in the `useSharedPendingPlansStatus` zustand store so `PlanInfo` can show one spinner for the whole card.

New plan sub-collection ⇒ new `api/plans/<name>.ts` calling `useCollectionMutation` with `usePlanCollectionAccessor`, and it must be listed in `PLANS_COLLECTIONS` in `main.go`.

#### Components

`components/ui/` is shadcn (new-york style, neutral base, lucide icons — see `ui/components.json`); treat those as vendored. App components live in `components/plan-card/` (card sections and their `*-skeleton.tsx` twins — keep skeletons in sync when a section's layout changes). Cards are drag-reorderable via dnd-kit; reordering rewrites the `order` field through the same mutation hook (`lib/handle-reorder.ts`). Rendering is paginated client-side (`store/plans/rendering-items.tsx`, `MAX_ITEMS = 80`).

React Compiler runs over `ui/src` via a babel plugin, and `react-compiler/react-compiler` is an eslint **error** — don't write code that opts out of its rules.

## Conventions

- Prettier: single quotes, semicolons, trailing commas; imports auto-sorted (`@/…` group, then relative) by `@trivago/prettier-plugin-sort-imports`.
- Go uses tabs, everything else 2-space (`.editorconfig`).
- Path alias `@/` → `ui/src/`.
- Frontend logging goes through `store/logger.ts` (`logger.trace/debug/...`), not bare `console.*`; level persists in localStorage and is exposed on `window` in dev.
- Commit messages are short imperative subjects ("Add v2 card", "Fix superusers key"); some older ones use conventional-commit prefixes.
- `TODO.md` tracks open work.

## Deployment

Multi-stage `Dockerfile` (node → go → alpine) bakes `backup/seed.db`, its generated `seed.hash`, and `seed.note` into the image; serves on 8080 with `/app/pb_data` as a volume. `publish.nu` builds and pushes `qxuken/gbp` for linux/amd64 + arm64.
