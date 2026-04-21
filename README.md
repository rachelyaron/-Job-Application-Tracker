# מעקב מועמדויות · Job Application Tracker

> A full-stack, bilingual (Hebrew/English) job search management app — track every application, interview stage, and offer in one clean dashboard.

**[→ Live Demo](https://job-application-tracker-rachelyaron.vercel.app)** &nbsp;·&nbsp; No sign-up needed — click the demo button

---

## Screenshots

| Landing | Dashboard — Table view |
|---------|----------------------|
| ![Landing](docs/screenshots/login.png) | ![Dashboard](docs/screenshots/dashboard.png) |

| Cards view | Kanban board |
|------------|--------------|
| ![Cards](docs/screenshots/cards.png) | ![Kanban](docs/screenshots/kanban.png) |

| Dark mode | Tweaks panel |
|-----------|--------------|
| ![Dark mode](docs/screenshots/dark.png) | ![Tweaks](docs/screenshots/tweaks.png) |

---

## Features

### Core
- **Visual stage pipeline** — clickable timeline per application (Applied → Screen → HR → Technical → Final → Offer); click to cycle states (pending / done / rejected)
- **Three views** — Table, Cards grid, and Kanban board; switch instantly from the Tweaks panel
- **Live stats bar** — total applications, interviews reached, offers received, and interview conversion rate
- **Stale alerts** — banner highlights applications not updated in 7+ days

### UX & Personalization
- **Dark mode** — full dark theme with adapted gradients, tints, and frosted-glass header
- **Density control** — comfortable and compact row spacing
- **Bilingual** — complete Hebrew (RTL) and English (LTR) UI, switchable at runtime, persisted to `localStorage`
- **Search & filter** — instant search by company or role; filter by status chip or industry field

### Data & AI
- **CV upload** — attach a resume PDF per application, stored in Supabase Storage
- **AI Tips** — on-demand analysis of your job search with actionable recommendations (powered by Claude)
- **Per-user data isolation** — Row Level Security ensures every user sees only their own applications

### Demo
- **Zero-friction demo** — fully interactive at `/?demo=true`; pre-loaded with 5 realistic sample applications across all stages; all changes are in-memory only, no account required

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | [Next.js 15](https://nextjs.org) (App Router, React 19) |
| Language | TypeScript |
| Styling | Global CSS with design tokens — no CSS-in-JS, no component libraries |
| Auth & DB | [Supabase](https://supabase.com) — PostgreSQL + RLS + Storage |
| AI | [Anthropic Claude API](https://anthropic.com) |
| Fonts | Heebo · Inter · JetBrains Mono via `next/font/google` (self-hosted) |
| Deployment | [Vercel](https://vercel.com) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- An [Anthropic](https://console.anthropic.com) API key

### 1. Clone & install

```bash
git clone https://github.com/rachelyaron/-Job-Application-Tracker.git
cd -Job-Application-Tracker
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ANTHROPIC_API_KEY=your_anthropic_api_key
```

### 3. Database setup

Run this in your Supabase SQL editor:

```sql
create table jobs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) not null,
  company_name text not null,
  role         text not null,
  date_applied date not null,
  field        text,
  stages       jsonb not null default '[]',
  job_link     text,
  cv_url       text,
  notes        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table jobs enable row level security;

create policy "users_select_own" on jobs for select using (auth.uid() = user_id);
create policy "users_insert_own" on jobs for insert with check (auth.uid() = user_id);
create policy "users_update_own" on jobs for update using (auth.uid() = user_id);
create policy "users_delete_own" on jobs for delete using (auth.uid() = user_id);
```

### 4. Run locally

```bash
npm run dev
# → http://localhost:3000
```

---

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── jobs/           # GET · POST (list & create)
│   │   ├── jobs/[id]/      # PUT · DELETE (update & remove)
│   │   ├── ai-tips/        # Claude-powered job search analysis
│   │   └── demo/seed/      # One-shot demo data seeder
│   ├── globals.css         # Design token system + all component styles
│   ├── layout.tsx          # Root layout — fonts, SettingsProvider
│   └── page.tsx            # App shell — auth, demo detection, view routing
│
├── components/
│   ├── JobTable.tsx        # Table view with inline timeline
│   ├── CardsView.tsx       # Responsive card grid
│   ├── KanbanView.tsx      # 5-column kanban board
│   ├── JobForm.tsx         # Add / edit modal with stage editor & CV upload
│   ├── Timeline.tsx        # Interactive stage pipeline component
│   ├── StatsBar.tsx        # KPI cards + stale application banner
│   ├── AiTips.tsx          # AI analysis drawer
│   ├── TweaksPanel.tsx     # Floating settings panel (theme · density · view · lang)
│   └── AuthForm.tsx        # Demo entry screen
│
├── contexts/
│   └── SettingsContext.tsx # Global settings state with localStorage persistence
│
└── lib/
    ├── supabase.ts         # Supabase client factory + domain types
    ├── strings.ts          # i18n strings — Hebrew & English
    ├── utils.ts            # Logo gradients · initials · kanban column mapping
    └── demo-data.ts        # Static demo jobs (no Supabase needed)
```

---

## Architecture Notes

- **RLS everywhere** — API routes create a per-request Supabase client with the user's JWT (`getSupabaseWithToken`), so Row Level Security enforces data isolation at the database level
- **No auth in demo** — demo mode is detected from `window.location.search` in a single `useEffect` that short-circuits before any Supabase call runs
- **Settings via context** — theme/density/language/view are stored in `SettingsContext`, applied as `data-*` attributes on `<html>`, and read by CSS selectors — no JS style injection
- **i18n without a library** — a single `STRINGS` object keyed by `"he" | "en"` covers all UI copy; the active set is passed via context as `t`

---

## License

MIT
