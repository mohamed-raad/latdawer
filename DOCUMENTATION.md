# Central Parts Finder — Full Application Documentation

> **Project**: Central Parts Finder (سنترال بارتس فايندر)
> **Purpose**: Arabic-first car parts discovery platform for Iraq
> **Phase**: 1 (discovery only — no e-commerce)
> **Last updated**: 2026-06-24

---

## 1. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.9 |
| Language | TypeScript strict | ~5 |
| Styling | Tailwind CSS | v4 |
| RPC | tRPC + React Query | v11 / ~5.101 |
| ORM | Drizzle ORM | 0.45.2 |
| DB (dev) | better-sqlite3 (SQLite) | 12.11.1 |
| DB (prod) | Cloudflare D1 | (same schema) |
| Auth | bcryptjs + jose (JWT) | 3.0.3 / 6.2.3 |
| Validation | Zod | 4.4.3 |
| Serialization | superjson | 2.2.6 |
| Tables | TanStack React Table | 8.21.3 |

---

## 2. Project Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server (Turbopack) |
| `npm run build` | Production build (includes TypeScript check) |
| `npm run lint` | ESLint check (NOT `next lint`) |
| `npm run start` | Start production server |
| `npm run db:push` | Push schema to local SQLite |
| `npm run db:generate` | Drizzle schema → SQL migration files |
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Seed DB with Arabic test data |
| `npm run db:studio` | Launch Drizzle Studio GUI |
| `npx wrangler d1 execute central-parts-finder-db --file=./src/db/migrations/...` | Apply to production D1 |

---

## 3. Directory Structure

```
central-parts-finder/
├── .data/                          # Local SQLite DB (gitignored)
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── (auth)/                 # Auth route group (login, signup)
│   │   ├── admin/                  # Admin dashboard (7 pages)
│   │   ├── api/                    # REST API routes
│   │   │   ├── auth/               # Auth endpoints (signin, signup, signout, me)
│   │   │   └── trpc/               # tRPC handler
│   │   ├── dashboard/              # Store manager dashboard (7 pages)
│   │   ├── garage/                 # My Garage (2 pages)
│   │   ├── parts/                  # Part detail (1 page)
│   │   ├── requests/               # Request a Part (3 pages)
│   │   ├── scan/                   # Barcode scanner (1 page)
│   │   ├── search/                 # Search (1 page)
│   │   ├── stores/                 # Store profile (1 page)
│   │   └── vehicles/               # Vehicle browser (1 page)
│   ├── components/                 # Shared React components
│   │   └── cart-button.tsx         # WhatsApp Cart FAB
│   ├── db/                         # Database layer
│   │   ├── schema/                 # 7 schema files (9 → 12 tables)
│   │   ├── migrations/             # SQL migration files
│   │   ├── index.ts                # DB connection
│   │   └── seed.ts                 # Seed data (admin, brands, parts, stores)
│   ├── features/                   # Domain feature modules (12 total)
│   │   ├── admin/
│   │   ├── alternatives/
│   │   ├── auth/
│   │   ├── garage/
│   │   ├── inventory/
│   │   ├── parts/
│   │   ├── requests/
│   │   ├── reviews/
│   │   ├── search/
│   │   ├── stores/
│   │   ├── vehicles/
│   │   └── watchlist/
│   ├── hooks/                      # Custom React hooks
│   │   └── use-session.tsx         # Auth session hook + provider
│   ├── lib/                        # Core libraries
│   │   ├── auth/                   # Auth lib (config, password, session)
│   │   └── trpc/                   # tRPC config (client, server, router)
│   ├── providers/                  # React providers
│   │   ├── auth-provider.tsx
│   │   └── trpc-provider.tsx
│   └── middleware.ts               # Auth middleware (route protection)
├── AGENTS.md                       # Agent development guide
├── drizzle.config.ts               # Drizzle Kit config
├── next.config.ts                  # Next.js config
├── eslint.config.mjs               # ESLint flat config
├── postcss.config.mjs              # PostCSS config (Tailwind)
├── tsconfig.json                   # TypeScript config
├── wrangler.toml                   # Cloudflare Wrangler config
└── package.json
```

---

## 4. Database Schema

### 4.1 Tables (12 total)

For current schema details, see `src/db/schema/*.ts`.

| # | Table | File | Purpose |
|---|-------|------|---------|
| 4.1.1 | `users` | `schema/users.ts` | Auth + profile (passwordHash, role, city) |
| 4.1.2 | `stores` | `schema/users.ts` | Store profiles (city, whatsapp, verified status) |
| 4.1.3 | `store_managers` | `schema/users.ts` | Many-to-many users ↔ stores |
| 4.1.4 | `categories` | `schema/catalog.ts` | Part categories (parentId for hierarchy) |
| 4.1.5 | `manufacturers` | `schema/catalog.ts` | Car manufacturers/brands |
| 4.1.6 | `parts` | `schema/catalog.ts` | Global part catalog (canonical) |
| 4.1.7 | `inventory` | `schema/inventory.ts` | Store inventory entries (price, quantity, status) |
| 4.1.8 | `images` | `schema/inventory.ts` | Images linked to inventory, parts, or stores |
| 4.1.9 | `vehicles` | `schema/vehicles.ts` | Vehicle models (make, model, year, engine, trim) |
| 4.1.10 | `compatibility` | `schema/vehicles.ts` | Many-to-many parts ↔ vehicles |
| 4.1.11 | `search_history` | `schema/meta.ts` | User search query history |
| 4.1.12 | `audit_logs` | `schema/meta.ts` | Admin action audit trail |
| 4.1.13 | `subscriptions` | `schema/meta.ts` | Store subscription plans |
| 4.1.14 | `analytics` | `schema/meta.ts` | Event analytics |
| 4.1.15 | `part_alternatives` | `schema/meta.ts` | Cross-reference: equivalent/oem/aftermarket |
| 4.1.16 | `watchlist` | `schema/meta.ts` | User price watch entries |
| 4.1.17 | `reviews` | `schema/meta.ts` | Store ratings & reviews |
| 4.1.18 | `part_requests` | `schema/meta.ts` | User part requests (طلب قطعة) |
| 4.1.19 | `request_offers` | `schema/meta.ts` | Store offers on part requests |
| 4.1.20 | `user_vehicles` | `schema/meta.ts` | User's saved vehicles (My Garage) |

### 4.2 Entity Relationships

```
users 1──M store_managers M──1 stores
stores 1──M inventory M──1 parts
parts M──M categories (M──1)
parts M──M manufacturers (M──1)
parts M──M vehicles (via compatibility)
parts 1──M part_alternatives M──1 parts (self-ref)
stores 1──M reviews M──1 users
users 1──M part_requests 1──M request_offers M──1 stores
users 1──M user_vehicles M──1 vehicles
users 1──M watchlist M──1 parts
```

---

## 5. Auth System

### 5.1 Overview
- Local auth: bcryptjs (password hashing) + jose (JWT sign/verify)
- Sessions: JWTs stored in httpOnly cookie named `session`
- No Clerk, no OAuth, no external auth provider

### 5.2 Key Files

| File | Purpose |
|------|---------|
| `src/lib/auth/config.ts` | JWT secret, cookie name, expiry from env |
| `src/lib/auth/password.ts` | `hashPassword()`, `verifyPassword()` via bcryptjs |
| `src/lib/auth/session.ts` | `createSession()` (jose SignJWT), `verifySession()` (jose jwtVerify), `getSessionTokenFromRequest()` |
| `src/hooks/use-session.tsx` | `SessionProvider` context + `useSession()` hook → `{ user, loading, refresh }` |
| `src/middleware.ts` | Route protection: guards `/dashboard/*` and `/admin/*` |
| `src/app/api/auth/signup/route.ts` | POST handler: register, create session |
| `src/app/api/auth/signin/route.ts` | POST handler: verify password, create session |
| `src/app/api/auth/signout/route.ts` | POST handler: clear session cookie |
| `src/app/api/auth/me/route.ts` | GET handler: return current user from session |

### 5.3 Roles
- `Customer` — Browse + search + requests + garage
- `StoreManager` — Inventory management, offer on requests
- `Admin` — Full admin panel
- `SuperAdmin` — Same as Admin

### 5.4 Protected Routes (middleware)
- `/dashboard/*` — any authenticated user
- `/admin/*` — role check inside AdminLayout component
- Public routes: `/`, `/login`, `/signup`, `/search`, `/vehicles`, `/parts/[id]`, `/stores/[id]`, `/scan`, `/requests`, `/requests/[id]`, `/garage`, `/garage/add`

### 5.5 Admin Account (seeded)
- Email: `mr991199@gmail.com`
- Password: `moha99raadA@`
- City: البصرة
- Role: `Admin`

---

## 6. Feature Modules (Block Reference)

Each feature follows the layer pattern: `UI (Page) → Hook → Service (services.ts) → Repository (repository.ts) → Database (schema)`. Validators (validators.ts) sit between Input and Service. tRPC Routers (router.ts) expose endpoints.

### F1. AUTH — `src/features/auth/`

| Block | File | What it does |
|-------|------|-------------|
| F1.1 | `validators.ts` | `signUpSchema` (email, password with Arabic regex, name, role, city), `signInSchema` |
| F1.2 | `services.ts` | `signUp()` — hash password, insert user, create JWT; `signIn()` — verify password, create JWT; `getCurrentUser()` |
| F1.3 | `router.ts` | 3 procedures: `signUp` (public mutation), `signIn` (public mutation), `me` (protected query) |
| F1.4 | `types.ts` | `Role`, `SessionUser` interfaces |

### F2. SEARCH — `src/features/search/`

| Block | File | What it does |
|-------|------|-------------|
| F2.1 | `validators.ts` | `searchQuerySchema` — q, type, categoryId, manufacturerId, vehicleId, origin, condition, city, page, limit, sort |
| F2.2 | `repository.ts` | `searchParts()` — LIKE/ILIKE across partNumber, oemNumber, nameAr, nameEn, brand, tags; joins inventory + stores for city filter |
| F2.3 | `services.ts` | `searchAll()` — validates, saves search history, calls repo; `searchPartsService()`; `getCategoriesService()`; `getManufacturersService()` |
| F2.4 | `router.ts` | 4 procedures: `all`, `parts`, `categories`, `manufacturers` (all public) |

### F3. VEHICLES — `src/features/vehicles/`

| Block | File | What it does |
|-------|------|-------------|
| F3.1 | `validators.ts` | `vehicleQuerySchema` — make, model, year, search, page, limit |
| F3.2 | `repository.ts` | `getVehicleMakes()` — grouped; `getVehicleModels(make)`; `getVehicleYears(make, model)` — all from vehicles table; `getPartsByVehicle()` via compatibility join |
| F3.3 | `services.ts` | `listMakes()`, `listModels()`, `listYears()`, `findPartsByVehicle()` |
| F3.4 | `router.ts` | 6 procedures: `makes`, `models`, `years`, `parts`, `vehicles`, `search` (all public) |

### F4. STORES — `src/features/stores/`

| Block | File | What it does |
|-------|------|-------------|
| F4.1 | `validators.ts` | `createStoreSchema` — name, nameAr, description, address, gps, phone, whatsapp, city, etc.; `updateStoreSchema` |
| F4.2 | `repository.ts` | CRUD: `getStores`, `getStoreById`, `createStore`, `updateStore`, `addStoreManager`, `getStoreByManager` |
| F4.3 | `services.ts` | `listStores()`, `getStore()`, `createNewStore()` (auto-adds manager + audit), `editStore()`, `getMyStore()` |
| F4.4 | `router.ts` | 5 procedures: `list` (public), `byId` (public), `create` (protected), `update` (protected), `myStore` (protected) |

### F5. INVENTORY — `src/features/inventory/`

| Block | File | What it does |
|-------|------|-------------|
| F5.1 | `validators.ts` | `createInventorySchema` — partId, storeId, price, currency (IQD default), quantity, condition, notes; `updateInventorySchema`; `inventoryQuerySchema` |
| F5.2 | `repository.ts` | `getInventoryByStore()`, `createInventory()`, `updateInventory()`, `deleteInventory()`, `getInventoryById()`, `getInventoryByPartId()` |
| F5.3 | `services.ts` | `listInventory()`, `addInventory()`, `editInventory()`, `removeInventory()`, `getInventoryDetails()`, `getInventoryForPart()` — validates + logs audit |
| F5.4 | `router.ts` | 6 procedures: `byStore` (public), `byPart` (public), `create` (protected), `update` (protected), `remove` (protected), `details` (public) |

### F6. PARTS — `src/features/parts/`

| Block | File | What it does |
|-------|------|-------------|
| F6.1 | — | No validators (simple ID query) |
| F6.2 | `repository.ts` | `getPartById()` — joins category + manufacturer; `getPartsByIds()`, `getPartsByCategory()`, `getPartsByManufacturer()` |
| F6.3 | `services.ts` | `getPartDetails()` — thin wrapper |
| F6.4 | `router.ts` | 1 procedure: `byId` (public) |

### F7. ALTERNATIVES (Cross-Reference) — `src/features/alternatives/`

| Block | File | What it does |
|-------|------|-------------|
| F7.1 | `validators.ts` | `addAlternativeSchema` — partId, altPartId, type (equivalent/oem/aftermarket/replaces/replaced_by), notes |
| F7.2 | `repository.ts` | `getAlternatives()` — bidirectional join; `addAlternative()` — inserts both directions; `getRelatedByBrand()` |
| F7.3 | `services.ts` | `listAlternatives()`, `createAlternative()` |
| F7.4 | `router.ts` | 3 procedures: `byPart` (public), `add` (protected), `byBrand` (public) |

### F8. REVIEWS — `src/features/reviews/`

| Block | File | What it does |
|-------|------|-------------|
| F8.1 | `validators.ts` | `createReviewSchema` — storeId, rating (1-5), comment (optional); `reviewsQuerySchema` |
| F8.2 | `repository.ts` | `getReviewsByStore()` — with user join, paginated; `getStoreRatingStats()` — avg + count; `insertReview()`; `getUserReview()` — prevents duplicate |
| F8.3 | `services.ts` | `createReview()` — validates, prevents duplicate; `getStoreRating()`, `getStoreReviews()`, `hasUserReviewed()` |
| F8.4 | `router.ts` | 4 procedures: `rating` (public), `list` (public), `create` (protected), `hasReviewed` (protected) |

### F9. WATCHLIST (Price Watch) — `src/features/watchlist/`

| Block | File | What it does |
|-------|------|-------------|
| F9.1 | `validators.ts` | `addWatchSchema` — partId, maxPrice (optional); `removeWatchSchema` |
| F9.2 | `repository.ts` | `getWatchlistEntry()`, `addWatchlistEntry()`, `removeWatchlistEntry()`, `getUserWatchlist()` |
| F9.3 | `services.ts` | `checkWatchlist()`, `addToWatchlist()`, `removeFromWatchlist()` |
| F9.4 | `router.ts` | 3 procedures: `check` (protected), `add` (protected), `remove` (protected) |

### F10. ADMIN — `src/features/admin/`

| Block | File | What it does |
|-------|------|-------------|
| F10.1 | `validators.ts` | `createCategorySchema`, `createManufacturerSchema`, `updateUserRoleSchema` |
| F10.2 | `repository.ts` | `getDashboardStats()` — counts users, stores, parts, inventory; user CRUD, store verification, category/manufacturer CRUD, audit logs, analytics |
| F10.3 | `services.ts` | Wraps all admin operations with validation |
| F10.4 | `router.ts` | 9 procedures: `stats`, `users`, `updateUserRole`, `verifyStore`, `categories`, `manufacturers`, `auditLogs`, `analytics` (all protected) |

### F11. REQUESTS (Request a Part) — `src/features/requests/`

| Block | File | What it does |
|-------|------|-------------|
| F11.1 | `validators.ts` | `createRequestSchema` (title, description, partNumber, vehicle info, city); `requestsQuerySchema`; `createOfferSchema` (requestId, price, notes); `updateOfferStatusSchema` |
| F11.2 | `repository.ts` | `insertRequest()`, `getRequestById()` (joins user), `getRequests()` (with offer count, filterable by status/city/userId), `getOffersByRequest()` (joins store), `insertOffer()`, `updateOfferStatus()`, `getOfferById()` |
| F11.3 | `services.ts` | `createRequest()`, `getRequest()`, `listRequests()`, `getOffers()`, `createOffer()`, `respondToOffer()` — validates + access control |
| F11.4 | `router.ts` | 6 procedures: `create` (protected), `list` (protected), `byId` (public), `offers` (public), `makeOffer` (protected), `respondToOffer` (protected), `pendingInCity` (protected) |

### F12. GARAGE (My Garage) — `src/features/garage/`

| Block | File | What it does |
|-------|------|-------------|
| F12.1 | `validators.ts` | `addVehicleSchema` — vehicleId (required), nickname (optional), licensePlate (optional) |
| F12.2 | `repository.ts` | `addUserVehicle()`, `getUserVehicles()` (joins vehicles table), `removeUserVehicle()`, `getMakes()`, `getModels()`, `getYears()`, `getCompatibleParts()` (via compatibility table) |
| F12.3 | `services.ts` | `addVehicle()`, `listUserVehicles()`, `removeVehicle()`, `getPartsForVehicle()`, `listMakes()`, `listModels()`, `listYears()` |
| F12.4 | `router.ts` | 7 procedures: `add` (protected), `list` (protected), `remove` (protected), `parts` (public), `makes` (public), `models` (public), `years` (public) |

---

## 7. Pages (Block Reference)

### 7.1 Public Pages

| # | Route | File | Feature | What it renders |
|---|-------|------|---------|-----------------|
| P1 | `/` | `src/app/page.tsx` | Home | Inline header with login/register/dashboard link. Centered hero: search input, quick examples. No nav bar. |
| P2 | `/login` | `src/app/(auth)/login/page.tsx` | Auth | Email + password form. Links to signup. Redirects to `/dashboard` on success. |
| P3 | `/signup` | `src/app/(auth)/signup/page.tsx` | Auth | Registration form: name, email, password (with Arabic validation rules), role (Customer/StoreManager), city dropdown (20 Iraqi cities). |
| P4 | `/search` | `src/app/search/page.tsx` | Search (F2) | Full search with: auto-complete suggestions (debounced), filters (category, manufacturer, condition, price range, city dropdown), results grid with store count and min price, "هل تقصد؟" on zero results, pagination. Suspense-wrapped. |
| P5 | `/vehicles` | `src/app/vehicles/page.tsx` | Vehicles (F3) | 3 chained dropdowns (make → model → year/engine). Popular-make quick buttons (تويوتا, نيسان, هيونداي, كيا). Parts grid with condition badges. Loading spinners per dropdown. |
| P6 | `/parts/[id]` | `src/app/parts/[id]/page.tsx` | Parts (F6) + Alternatives (F7) + Watchlist (F9) | Full part detail: category/manufacturer breadcrumbs, name (Ar/En), part number, OEM number, barcode, origin, condition, tags. Store inventory table (store name, price, quantity, condition, WhatsApp button). Cross-reference equivalents section. Price watch button (requires login). "أضف إلى السلة" button per store. Floating CartButton component. |
| P7 | `/stores/[id]` | `src/app/stores/[id]/page.tsx` | Stores (F4) + Reviews (F8) | Store profile: logo, name, address, city, verified badge, working hours, phone, WhatsApp. Star rating display (average + count). Reviews list with user name, rating, comment, date. "أضف تقييمك" form (logged-in users). Inventory list. Payment methods section (static: زين كاش / آسيا حوالة / تحويل بنكي). |
| P8 | `/scan` | `src/app/scan/page.tsx` | — | Barcode scanner page. Camera input + search field. Static instructions page for now. |
| P9 | `/requests` | `src/app/requests/page.tsx` | Requests (F11) | My submitted requests list. Each shows: title, vehicle info, part number, city, status badge (open/offered/closed), offer count, date. "طلب قطعة جديدة" button. |
| P10 | `/requests/new` | `src/app/requests/new/page.tsx` | Requests (F11) | Submit form: title (required), description, part number, city dropdown (required), vehicle info section (optional: make, model, year). |
| P11 | `/requests/[id]` | `src/app/requests/[id]/page.tsx` | Requests (F11) | Request detail: title, status badge, requester name, part number, vehicle info, city, date, description. Offers list with store name, price, notes, status. Accept/reject buttons for request owner. WhatsApp link to store. |
| P12 | `/garage` | `src/app/garage/page.tsx` | Garage (F12) | Saved vehicles list. Each shows: make + model (Arabic), year, engine, nickname, license plate. "القطع المناسبة" link. Delete button. "إضافة مركبة" button. |
| P13 | `/garage/add` | `src/app/garage/add/page.tsx` | Garage (F12) | 3-step chained dropdown: make → model → year+engine grid (selectable cards). Optional: nickname, license plate. Save button. |
| P14 | `/verify` | `src/app/verify/page.tsx` | Authenticity (F17) | Barcode/part number lookup. Shows origin badge, brand, manufacturer, OEM number. Green "موثوق" or red "غير موجود" result. |
| P15 | `/vin-decode` | `src/app/vin-decode/page.tsx` | VIN (F16) | 17-char VIN input → NHTSA API decode → make/model/year/engine/fuel/trim. Save to garage. Search compatible parts. |
| P16 | `/compare` | `src/app/compare/page.tsx` | Price Compare (F13) | Input partId or part number. Table of all stores selling that part sorted cheapest first. "الأرخص" badge. WhatsApp/call per store. Installation price. |
| P17 | `/part/[partNumber]` | `src/app/part/[partNumber]/page.tsx` | SEO (F18) | Server component. `generateMetadata` with part data. Redirects to `/parts/[id]`. |
| P18 | `/manifest.webmanifest` | `src/app/manifest.ts` | PWA | Web app manifest (Arabic, standalone, icons). |

### 7.2 Auth-Redirected Pages

| # | Route | File | Feature | What it renders |
|---|-------|------|---------|-----------------|
| P15 | `/login` | (same as P2) | Auth | Redirect to `/` if already logged in (via middleware). |

### 7.3 Dashboard Pages (Store Manager / Customer)

| # | Route | File | Feature | What it renders |
|---|-------|------|---------|-----------------|
| P16 | `/dashboard` | `src/app/dashboard/page.tsx` | Admin (F10) + Session | Welcome greeting + 4 stat cards (users, stores, parts, inventory) — uses admin.stats endpoint. |
| P17 | `/dashboard/inventory` | `src/app/dashboard/inventory/page.tsx` | Inventory (F5) | Store-manager-only. Table with: part name, part number, quantity (with badge: نافد/منخفض/متوفر), price (IQD), edit/delete actions. "إضافة قطعة" button. |
| P18 | `/dashboard/stores` | `src/app/dashboard/stores/page.tsx` | Stores (F4) | Store profile editor. If no store: create form (name, nameAr, description, address, city dropdown, phone, WhatsApp, working hours). If store exists: edit form. |
| P19 | `/dashboard/reports` | `src/app/dashboard/reports/page.tsx` | — | Placeholder page: "قريباً" |
| P20 | `/dashboard/settings` | `src/app/dashboard/settings/page.tsx` | — | Read-only account info: name, email, role, city, phone. |
| P21 | `/dashboard/requests` | `src/app/dashboard/requests/page.tsx` | Requests (F11) | Store manager: looks up store city, shows open requests in that city. Each: title, customer name, part number, vehicle info, date. Click → make offer. "ليس لديك متجر" prompt if no store. |
| P22 | `/dashboard/requests/[id]` | `src/app/dashboard/requests/[id]/page.tsx` | Requests (F11) | Store manager: view request details + submit offer form (price + notes). |

### 7.4 Admin Pages

| # | Route | File | Feature | What it renders |
|---|-------|------|---------|-----------------|
| P23 | `/admin` | `src/app/admin/page.tsx` | Admin (F10) | Stats cards from admin.stats (same as dashboard but admin layout). |
| P24 | `/admin/users` | `src/app/admin/users/page.tsx` | Admin (F10) | Users table: name, email, role, city, phone, date. Role change dropdown. |
| P25 | `/admin/stores` | `src/app/admin/stores/page.tsx` | Admin (F10) | Stores table: name, owner, city, verified status, inventory count. Verify/reject buttons. |
| P26 | `/admin/categories` | `src/app/admin/categories/page.tsx` | Admin (F10) | Categories table: name (Ar/En), slug. Create/delete. |
| P27 | `/admin/manufacturers` | `src/app/admin/manufacturers/page.tsx` | Admin (F10) | Manufacturers table: name (Ar/En), slug, country. Create/delete. |
| P28 | `/admin/audit-logs` | `src/app/admin/audit-logs/page.tsx` | Admin (F10) | Placeholder: "قريباً" or empty audit log table. |

### 7.5 Layout Files

| # | Route | File | Purpose |
|---|-------|------|---------|
| L1 | (root) | `src/app/layout.tsx` | Root: RTL `<html>`, Geist fonts, `AuthProvider`, `TRPCProvider`. No nav bar. |
| L2 | `(auth)` | `src/app/(auth)/layout.tsx` | Auth: centered card wrapper (max-w-md). |
| L3 | `/dashboard` | `src/app/dashboard/layout.tsx` | Dashboard: right-aligned sidebar (RTL). Nav items: المخزون, المتجر, طلبات القطع, مرآبي, التقارير, الإعدادات. Collapsible mobile. Logout button. Auth guard. |
| L4 | `/admin` | `src/app/admin/layout.tsx` | Admin: left sidebar (in RTL: right side). Nav items: لوحة التحكم, المستخدمين, المتاجر, الفئات, المصنعين, السجلات. Hamburger menu on mobile. Role guard (Admin/SuperAdmin). |

### 7.6 API Routes

| # | Route | File | Method | Purpose |
|---|-------|------|--------|---------|
| A1 | `/api/auth/signup` | `src/app/api/auth/signup/route.ts` | POST | Register, set httpOnly session cookie. |
| A2 | `/api/auth/signin` | `src/app/api/auth/signin/route.ts` | POST | Login, set httpOnly session cookie. |
| A3 | `/api/auth/signout` | `src/app/api/auth/signout/route.ts` | POST | Clear session cookie. |
| A4 | `/api/auth/me` | `src/app/api/auth/me/route.ts` | GET | Return current user from session. |
| A5 | `/api/trpc/[trpc]` | `src/app/api/trpc/[trpc]/route.ts` | GET/POST | tRPC HTTP handler. |

---

## 8. Shared Components

| # | File | Export | Purpose |
|---|------|--------|---------|
| C1 | `src/components/cart-button.tsx` | `CartButton` (default) | Floating green cart FAB (bottom-left). Badge with item count. Opens modal drawer with per-store grouping. Quantity adjust (+/-). "أرسل الطلب عبر واتساب" per store → generates wa.me link with formatted message. "تفريغ السلة" clear button. |
| C2 | `src/components/cart-button.tsx` | `addToCart()` | Add item to localStorage cart. Dispatches `cart-updated` event. |
| C3 | `src/components/cart-button.tsx` | `removeFromCart()` | Remove item from cart. |
| C4 | `src/components/cart-button.tsx` | `updateCartQuantity()` | Update item quantity (removes if ≤0). |
| C5 | `src/components/cart-button.tsx` | `clearCart()` | Clear all items. |
| C6 | `src/components/cart-button.tsx` | `getCartCount()` | Return total item count. |

---

## 9. Providers & Hooks

| # | File | Export | Purpose |
|---|------|--------|---------|
| H1 | `src/providers/auth-provider.tsx` | `AuthProvider` | Wraps children with `SessionProvider` context. |
| H2 | `src/providers/trpc-provider.tsx` | `TRPCProvider` | Wraps children with `QueryClientProvider` + `trpc.Provider`. Creates QueryClient, tRPC httpLink to `/api/trpc`. |
| H3 | `src/hooks/use-session.tsx` | `useSession()` | Returns `{ user, loading, refresh }`. Fetches `/api/auth/me` on mount, caches in context. `refresh()` re-fetches user. |

---

## 10. tRPC Router Registry

All routers are merged into a single `appRouter` in `src/lib/trpc/router.ts`.

| Namespace | Source Router | Procedures |
|-----------|--------------|-----------|
| `trpc.search.*` | `searchRouter` | all, parts, categories, manufacturers |
| `trpc.inventory.*` | `inventoryRouter` | byStore, byPart, create, update, remove, details |
| `trpc.stores.*` | `storesRouter` | list, byId, create, update, myStore |
| `trpc.vehicles.*` | `vehiclesRouter` | makes, models, years, parts, search |
| `trpc.admin.*` | `adminRouter` | stats, users, updateUserRole, verifyStore, categories, manufacturers, auditLogs |
| `trpc.auth.*` | `authRouter` | signUp, signIn, me |
| `trpc.parts.*` | `partsRouter` | byId |
| `trpc.alternatives.*` | `alternativesRouter` | byPart, add, byBrand |
| `trpc.reviews.*` | `reviewsRouter` | rating, list, create, hasReviewed |
| `trpc.watchlist.*` | `watchlistRouter` | check, add, remove |
| `trpc.requests.*` | `requestsRouter` | create, list, byId, offers, makeOffer, respondToOffer, pendingInCity |
| `trpc.garage.*` | `garageRouter` | add, list, remove, parts, makes, models, years |

---

## 11. Configuration Files

| File | Key Settings |
|------|-------------|
| `next.config.ts` | Turbopack, experimental config |
| `tsconfig.json` | strict: true, paths: `@/*` → `./src/*` |
| `drizzle.config.ts` | schema: `./src/db/schema/*`, dialect: sqlite, out: `./src/db/migrations`, url: `./.data/central-parts-finder.db` |
| `eslint.config.mjs` | ESLint flat config with Next.js preset |
| `postcss.config.mjs` | Tailwind CSS v4 PostCSS plugin |
| `wrangler.toml` | Cloudflare Workers/D1 config |
| `AGENTS.md` | Agent development guide (see section 12) |

---

## 12. Agent Development Guide (from AGENTS.md)

### Next.js 16 Quirks
- `middleware.ts` → `proxy.ts` (deprecated, still works). Keep `middleware.ts`.
- `params`, `searchParams`, `cookies()`, `headers()` are all async — must be awaited.
- Turbopack default for both `dev` and `build`.
- `next lint` command removed — use `eslint` directly.
- All parallel route slots require explicit `default.js`.

### Architecture Rules
- **Global Part Catalog → Store Inventory Entries**: Parts are canonical; stores create inventory rows referencing global part. Never duplicate parts.
- **Layers enforced**: `UI → Hook → Service → Repository → Database`. No direct DB from UI.
- **Feature modules**: Under `src/features/` — each owns validators, repository, services, router.
- **File size**: Soft limit 250 lines, hard limit 400 lines.
- **No `any`**: TypeScript strict everywhere.

### Non-negotiable Rules
1. File size ≤ 400 lines (soft 250).
2. TypeScript strict, no `any`.
3. All inputs validated with Zod (client, API, DB layers).
4. Arabic is primary language — RTL, Arabic normalization, Arabic sorting.
5. Search is #1 priority: speed, typo tolerance, part/OEM matching, bilingual.

---

## 13. Priorities (in order)

1. Search speed
2. Simplicity
3. Arabic UX
4. Inventory accuracy
5. Mobile experience
6. Scalability

---

## 14. Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Local JWT auth (no Clerk) | User rejected Clerk cost; full control over auth |
| WhatsApp via `wa.me` links | Zero server cost, instant, no Chrome dependency |
| Cart in localStorage | Simpler, no DB, works offline |
| Bidirectional cross-reference | Junction table (A→B + B→A) for simpler queries |
| Manual SQL migration for new tables | `drizzle-kit push` requires TTY; applied via better-sqlite3 directly |
| Condition enum: new/used/refurbished/salvage | Common Iraqi market terminology |
| IQD currency | Iraqi Dinar — primary currency |
| RTL layout everywhere | Arabic-first UX |
| tRPC v11 with superjson | Full type safety, Date serialization |
| Cloudflare D1 (SQLite) production | Free tier, same schema as local dev |
| VIN decoding via NHTSA VPIC API | Free, no API key needed, CORS-friendly |
| Part authenticity via barcode/part number lookup | Uses existing DB data, no external integration needed |
| SEO part URLs as server components | Direct DB access for metadata generation (bypasses tRPC) |

---

## 15. New Features (2026-06-24 Build)

### F13. PRICE COMPARE — `/compare?partId=X`

| Block | File | What it does |
|-------|------|-------------|
| F13.1 | `src/features/inventory/repository.ts` | `getByPartSortedByPrice()` — returns inventory entries for a part, joined with stores, sorted by price ascending. Includes `installationPrice`. |
| F13.2 | `src/features/inventory/router.ts` | `compare` procedure (public) — wires `comparePrices()` service |
| F13.3 | `src/app/compare/page.tsx` | Client page with: partId input, part detail header, price-sorted store list with "الأرخص" badge on cheapest, WhatsApp/call buttons, installation price display, verified badge |
| F13.4 | `src/app/parts/[id]/page.tsx` | "قارن الأسعار" link added next to store table heading |

### F14. متوفر الآن STOCK FILTER

| Block | File | What it does |
|-------|------|-------------|
| F14.1 | `src/features/search/validators.ts` | Added `inStockOnly: z.boolean().optional()` |
| F14.2 | `src/features/search/repository.ts` | Added `inStockOnly` to `SearchPartsParams`; adds `gt(inventory.quantity, 0)` to WHERE clause when true |
| F14.3 | `src/features/search/services.ts` | Passes `inStockOnly` through `searchParts()` and `searchPartsService()` |
| F14.4 | `src/app/search/page.tsx` | Checkbox "متوفر الآن فقط" in filters sidebar |

### F15. INSTALLATION PRICING

| Block | File | What it does |
|-------|------|-------------|
| F15.1 | `src/db/schema/inventory.ts` | Added `installationPrice: real('installation_price')` column |
| F15.2 | `src/features/inventory/validators.ts` | Added `installationPrice: z.number().positive().optional()` to `createInventorySchema` and `updateInventorySchema` |
| F15.3 | `src/features/inventory/services.ts` | Passes `installationPrice` in `addInventory()` and `editInventory()` |
| F15.4 | `src/app/parts/[id]/page.tsx` | Displays "التركيب: +X د.ع" below price in store table |
| F15.5 | `src/app/compare/page.tsx` | Displays installation price per store entry |

### F16. VIN DECODER — `/vin-decode`

| Block | File | What it does |
|-------|------|-------------|
| F16.1 | `src/app/vin-decode/page.tsx` | Client page: 17-char VIN input, calls NHTSA VPIC free API (`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVIN/...`), displays decoded make/model/year/engine/fuel/trim. "حفظ في مرآبي" button (matches vehicle in DB via tRPC endpoint fetch, saves to user_vehicles). "بحث عن قطع مناسبة" link. Educational section about VIN. |

### F17. PART AUTHENTICITY — `/verify`

| Block | File | What it does |
|-------|------|-------------|
| F17.1 | `src/app/verify/page.tsx` | Client page: search type toggle (باركود / رقم القطعة), input field, calls `parts.byNumber` to look up part. Shows: name, part number, OEM number, barcode, brand, manufacturer, category. Displays origin badge with color coding (GCC/عراقي/ياباني/صيني/etc.) and verification status message. If not found: "لم يتم العثور على القطعة" with link to request it. Origin legend at bottom. |

### F18. SEO PART URLs — `/part/[partNumber]`

| Block | File | What it does |
|-------|------|-------------|
| F18.1 | `src/features/parts/repository.ts` | `getPartByPartNumber()` — queries by `partNumber` or `oemNumber` |
| F18.2 | `src/features/parts/services.ts` | `getPartByNumber()` — thin wrapper |
| F18.3 | `src/features/parts/router.ts` | `byNumber` procedure (public) |
| F18.4 | `src/app/part/[partNumber]/page.tsx` | **Server component**. `generateMetadata()` — creates SEO-rich metadata (title, description, Open Graph) from part data. Page handler: looks up part by number, `notFound()` if missing, `redirect()` to canonical `/parts/[id]`. Direct DB access (no tRPC) for metadata generation. |

---

## 16. Schema Additions (total: now 13 tables → 20 tables)

### New columns
| Table | Column | Type | Purpose |
|-------|--------|------|---------|
| `inventory` | `installation_price` | `real` (nullable) | Optional installation/service fee per part |

### Previously added meta tables
See section 4.1 for full list (tables 4.1.1–4.1.20).

