<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# naoki-bercerita

## Stack

- **Next.js 16.2.6** (App Router) + **React 19.2.4** + **TypeScript** (strict)
- **Tailwind CSS v4** — use `@import "tailwindcss"` (not `@tailwind` directives)
- **No test framework** — `npm run lint` (ESLint) is the only verification command

## Commands

| Command | Action |
|---|---|
| `npm run dev` | Dev server at `localhost:3000` |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | ESLint (only check) |

## Architecture

- **All pages are `'use client'`** — no server components or async RSC data fetching
- **Auth**: JWT stored in `localStorage` key `token`; cleaned with `getCleanToken()` helper. No Next.js middleware — route protection is manual per-page.
- **API base**: `NEXT_PUBLIC_API_URL` from `.env.local` → `https://naokibercerita.up.railway.app`
- **Path alias**: `@/*` → project root (e.g. `@/components/sidebar`)
- **Layout**: `app/layout.tsx` renders `<Sidebar>` unconditionally alongside `<main>` with `ml-64` margin. The sidebar is a toggleable overlay (hamburger button).
- **CRUD pattern**: Single form toggled by `isEditing`/`editId` state between POST (create) and PUT (update).
- **UI**: Indonesian labels, emoji icons, `lucide-react` available.

## Routes

| Path | Status |
|---|---|
| `/` | Default Next.js boilerplate (unmodified) |
| `/login` | Login form |
| `/register` | Registration form |
| `/admin/kategori` | Category CRUD |
| `/admin/menu` | Menu item CRUD |
| `/admin/kelola-meja` | Table management |
| `/kasir` | **Empty — not implemented** |
| `/dashboard` | **Not implemented** (linked in sidebar) |
| `/admin/transaksi` | **Not implemented** (linked in sidebar) |

## API endpoints consumed

All via native `fetch()`, no axios.

| Method | Path | Page |
|---|---|---|
| POST | `/auth/login` | login |
| POST | `/auth/register` | register |
| GET/POST | `/category` | admin/kategori |
| PUT/DELETE | `/category/{id}` | admin/kategori |
| GET/POST | `/menu` | admin/menu |
| PUT/DELETE | `/menu/{id}` | admin/menu |
| GET/POST | `/table` | admin/kelola-meja |

Admin CRUD calls attach `Authorization: Bearer <token>`.
