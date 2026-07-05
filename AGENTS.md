<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Central Parts Finder — Agent Guide

## Core Working Principles

1. **Ask, don't assume.** If something is unclear, ask before writing a single line. Never make silent assumptions about intent, architecture, or requirements. When running unattended, pick the most reasonable interpretation, proceed, and record the assumption rather than blocking.

2. **Don't touch unrelated code.** But do surface bad code or design smells you discover so we can address them as a separate issue.

3. **Flag uncertainty explicitly.** If you're unsure about something, see point 1. If it makes sense to do so, conduct a small, localised and low-risk experiment and bring the hypothesis and results to discuss. Confidence without certainty causes more damage than admitting a gap.

4. **Suggest better ways.** I'm always open to ideas on better ways to do things. If you see a clearly better approach, say so before implementing. Explain the tradeoff in 2-4 bullets. If the current request is still reasonable, proceed unless the alternative avoids serious risk or wasted work. If the current request is safe but suboptimal, flag the better path briefly and still proceed. If the current request risks wasting work, breaking tests, touching wrong files, or locking in bad architecture, stop and ask. Style preferences or tiny refactors should not pause the whole run.

## Tech stack
Next.js 16 (App Router) + TypeScript strict + Tailwind CSS v4 + Shadcn UI  
tRPC v11 + React Query + TanStack Table  
Drizzle ORM + **Cloudflare D1** (SQLite)  
bcryptjs + jose (local JWT auth) + Cloudflare R2 storage  
Search: SQLite LIKE/ILIKE (→ Meilisearch/Elasticsearch later)

## Next.js 16 quirks
- `middleware.ts` → `proxy.ts` (deprecated, still works). Keep `middleware.ts` for now.
- `params`, `searchParams`, `cookies()`, `headers()` are all async — must be awaited.
- Turbopack is default for both `dev` and `build`. No `--turbopack` flag needed.
- `next lint` command removed — use `eslint` directly.
- `dev` outputs to `.next/dev`, `build` to `.next/`.
- All parallel route slots require explicit `default.js`.

## Key architecture
- **Global Part Catalog → Store Inventory Entries**. Parts are canonical; stores create inventory rows referencing global part. Never duplicate parts.
- Layers enforced: `UI → Hook → Service → Repository → Database`. No direct DB from UI.
- Feature modules under `src/features/` — each owns `components/`, `hooks/`, `services/`, `types/`, `validators/`.
- Pages compose components/call hooks; business logic lives in services.

## Project commands
| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint check |
| `npm run db:push` | Push schema to local SQLite (dev) |
| `npm run db:generate` | Drizzle schema → SQL migration |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed DB with Arabic test data |
| `npx wrangler d1 execute central-parts-finder-db --file=./src/db/migrations/...` | Apply to production D1 |

## Non-negotiable rules
- File size: soft limit **250 lines**, hard limit **400 lines**. Refactor immediately if exceeded.
- TypeScript strict. **No `any`**.
- All inputs validated with **Zod** (client, API, DB layers).
- Arabic is primary language — RTL, Arabic normalization, Arabic sorting everywhere.
- Search is #1 priority: speed, typo tolerance, part/OEM matching, bilingual.

## Developer workflow (from spec)
1. Analyze architecture → folder structure → types → validators → services → repositories → APIs → UI. Never skip layers.
2. Phase 1: discovery only — no e-commerce.

## Testing
Critical paths: auth, inventory CRUD, search, permissions, store management.

## Roles
`Customer` | `StoreManager` | `Admin` | `SuperAdmin` — permissions checked server-side only.

## Authentication
Local auth with bcryptjs + jose (JWT in httpOnly cookie). Sessions stored as JWTs. Auth middleware protects `/dashboard/*`, `/admin/*`. Public routes: `/`, `/login`, `/signup`, `/search`, `/vehicles`, `/parts/[id]`, `/stores/[id]`.

### Admin account (seeded)
- Email: `mr991199@gmail.com`
- Password: `moha99raadA@`
- City: البصرة
- Role: `Admin`

### Signup flow
- Supports `Customer` (مستخدم عادي) and `StoreManager` (صاحب متجر)
- City selection from 20 Iraqi cities
- Password: 8+ chars, 1 uppercase, 1 lowercase, 1 digit
- Admin role assignable only via direct DB update

### Auth API routes (bypass tRPC for cookie setting)
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/auth/signup` | POST | Register new user |
| `/api/auth/signin` | POST | Sign in, sets httpOnly cookie |
| `/api/auth/signout` | POST | Clear session cookie |
| `/api/auth/me` | GET | Get current session user |

### tRPC context
- Reads JWT from `session` cookie in request headers via `getSessionTokenFromRequest()`
- Verifies JWT with jose, looks up role from DB
- Context exposes `userId` and `role` directly (no nested `auth` object)

## Project commands (continued)
| Command | Purpose |
|---------|---------|
| `npm run db:seed:dump` | Dump local DB → SQL for D1 seeding |
| `npx wrangler d1 execute central-parts-finder-db --remote --file=./file.sql` | Execute SQL on remote D1 |

## Environment
- `CLOUDFLARE_API_TOKEN` — required for D1 operations
- **D1 DB ID**: `a745ed24-591a-4369-9907-38ce1fd6770b` (set in `wrangler.toml`)
- **D1 DB name**: `central-parts-finder-db`

## Theme & i18n
- **Dark mode**: class-based (`ThemeProvider` in `src/providers/theme-provider.tsx`), persisted to `localStorage`
- **English toggle**: `LanguageProvider` (in `src/lib/i18n/`), `useLanguage()` returns `{ t, locale, toggleLang, dir }`
- **Toggle buttons**: `ToggleButtons` component in `src/components/toggle-buttons.tsx` (reused in home, admin, dashboard)
- Missing i18n keys fall back to Arabic; translations cover ~200 keys across `ar.ts` and `en.ts`
- Pages currently using `t()`: home, search, dashboard. Other pages still use hardcoded Arabic.

## Database
- **Local dev**: `better-sqlite3` with `.data/central-parts-finder.db` (WAL mode, FK enforced)
- **Production**: Cloudflare D1 (same SQLite schema, deploy via `wrangler d1 execute`)
- All schemas use `sqliteTable()` — no PostgreSQL features
- Arrays stored as JSON strings, timestamps as integers

## Priorities (order)
Search speed → Simplicity → Arabic UX → Inventory accuracy → Mobile experience → Scalability
