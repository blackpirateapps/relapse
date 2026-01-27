# AGENTS.md

## Project overview
- Vite + React app with serverless API routes in `api/` (Turso/SQLite via `@libsql/client`).
- Auth is cookie-based; most API routes call `checkAuth`.
- UI uses Tailwind classes and some inline `<style>` blocks for animated backgrounds.

## Key runtime flows
- App boot: `App.jsx` calls `refetchData()` which hits `GET /api/state` to hydrate user state, shop data, and equipped upgrades.
- Background selection:
  - Global themes map in `App.jsx` (non-forest pages).
  - Forest themes map in `App.jsx` (forest page only).
  - Preview mode uses `previewThemeId` in context and shows the top banner.
- Shop:
  - Items come from `shop_items` table (`/api/shop`).
  - Equipping background or forest themes unequips same-type items.
- Urge tasks:
  - `/journey/urge` lists tasks from `/api/urge`.
  - Newspaper task is timed; pushup task uses a session flow and rewards are computed from session duration.

## Datastore (Turso)
- Initialization: `api/db.js` exposes `initDb()` which creates tables and seeds defaults.
- Important tables:
  - `user_state` (coins, lastRelapse, upgrades, equipped_upgrades, etc.)
  - `shop_items`, `shop_item_images`
  - `urge_tasks` (started/claimed timestamps + `last_session_seconds`)

## Background themes
- Canvas/DOM backgrounds live in `src/components/` (e.g., `FireBackground`, `SolarSystemBackground`).
- Preview images live in `public/img/` and are referenced by `shop_items.preview_image`.
- New background themes require:
  1) Component in `src/components/`
  2) Entry in `App.jsx` theme maps
  3) Seed row in `api/db.js`
  4) Optional preview image in `public/img/`

## Phoenix skins
- Skin images live in `public/img/skins/<id>/`.
- Each skin needs 16 images (egg → celestial). See `api/admin.js` for naming conventions.
- `PhoenixImage` uses equipped upgrades to pick skin assets.

## Urge tasks
- API: `api/urge.js` supports `GET`, `POST start`, `POST end_session`, `POST claim`, `POST cancel`.
- Pushup session page: `src/pages/PushupSessionPage.jsx`.
- Rewards:
  - Newspaper: fixed +200 coins, +1 hour.
  - Pushups: +1 coin per 2s and +4x time added to streak.
  - Cancel/leave pushups: −200 coins.

## Relapse behavior
- `api/relapse.js` banks streak coins and resets `lastRelapse`.
- Scarlet Phoenix skin is removed on relapse and its price is discounted by 1% (cumulative).

## Development notes
- No local CSS/SCSS pipeline; inline styles and Tailwind are used.
- Use `initDb()` in new API routes when you need table creation/seeding.
- Avoid long-running browser installs in this environment; update `package.json` if needed.

