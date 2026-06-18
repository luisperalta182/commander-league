# ⚔️ Masatepe The Gathering — Liga de Commander

A Magic: The Gathering Commander league web app built with **Vue 3 + Vite**,
organized by **Masatepe The Gathering**. The interface is in Spanish.

- 🔐 Sign up / log in (Entrar / Unirse)
- 🧙 Player profiles (display name, favorite commander, color, bio)
- 📅 Sunday match-day calendar — the organizer generates **random pods of ~4**, 2 games each Sunday
- 🏆 Leaderboard (points, wins, games played, win rate)
- 🎁 Prizes tab (Premios) — top-3 podium with a "premios próximamente" notice

The **first person to register becomes the league organizer (admin)** and can
create match days and record results. Everyone else can view the calendar,
players, standings and prizes.

## Run it locally

```bash
npm install
npm run dev      # open the printed http://localhost:5173 URL
npm run build    # production build into dist/
```

## Two ways to store data

The app works with **zero setup** out of the box. It picks a backend automatically:

| Mode | When | Data lives | Use for |
|------|------|-----------|---------|
| **Local** | no Supabase keys set | the visitor's browser (localStorage) | quick demo, single device |
| **Shared (Supabase)** | Supabase keys set | a free cloud database everyone shares | the real league |

A small pill in the bottom-right shows which mode is active.

### Enabling shared data (free, works on GitHub Pages)

GitHub Pages only hosts static files, but Supabase runs the database + auth in
the cloud, so the static site just talks to it from the browser.

1. Create a free project at <https://supabase.com>.
2. In the Supabase **SQL Editor**, paste and run [`supabase/schema.sql`](supabase/schema.sql).
3. Copy your **Project URL** and **anon public key** from *Project Settings → API*.
4. For local dev: copy `.env.example` to `.env` and fill in the two values.
5. For deployment: add them as the GitHub repo secrets `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` (see below).

> Supabase sends a confirmation email on sign-up by default. For a small private
> league you can turn that off under *Authentication → Providers → Email →
> "Confirm email"* so players can log in immediately.

## Deploy to GitHub Pages

A workflow is included at [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

1. Push this project to a GitHub repo.
2. In the repo: **Settings → Pages → Build and deployment → Source → GitHub Actions**.
3. (Optional, for shared data) **Settings → Secrets and variables → Actions** →
   add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Push to `main`. The site builds and deploys automatically.

The app uses hash-based routing (`/#/leaderboard`), so page refreshes and deep
links work on GitHub Pages with no extra server config.

## Tweaking the rules

- **Scoring** — edit `POINTS_WIN` / `POINTS_PLAYED` in [`src/services/scoring.js`](src/services/scoring.js).
- **Pods / games per Sunday** — defaults to 2 games, pods of 4; the admin can
  change both when generating a match day. Logic lives in
  [`src/services/scheduler.js`](src/services/scheduler.js).
