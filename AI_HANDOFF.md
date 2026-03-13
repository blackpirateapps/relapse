# AI Handoff Document

## Purpose
This document is the operational handoff for AI agents working on this codebase. It captures architecture, feature behavior, API/data contracts, and required delivery workflow.

## Mandatory Agent Workflow
For every non-trivial code/task update, the AI agent must:

1. Implement the requested change.
2. Update this `AI_HANDOFF.md` if behavior, API, schema, flows, tooling, or project conventions changed.
3. Run relevant verification (`npm run build` at minimum when feasible; targeted checks for touched areas).
4. Commit with a clear message.
5. Push to remote.

Required git routine:

```bash
git add -A
git commit -m "<clear, scoped message>"
git push
```

If push is blocked (no remote/permissions), the agent must document the exact blocker in its final response.

## Project Snapshot
- Stack: Vite + React frontend, Vercel-style serverless APIs in `api/`.
- Datastore: Turso/SQLite via `@libsql/client`.
- Auth: cookie gate (`phoenix_auth=true`) for web and `X-App-Password`/`Authorization: Bearer` support for native mobile.
- Routing: SPA via `react-router-dom`; Vercel rewrite sends non-API routes to `index.html`.
- **Vercel Hobby plan limit: max 12 serverless functions.** Utility modules live in `api/_lib/` (ignored by Vercel) to stay within this limit.
- App model: streak progression game with rank evolution, coin economy, shop/inventory, forest simulation, minigames, urge tasks, and relapse lifecycle.
- Native mobile app: Flutter app in `flutter_app/` focused on Journey + Progression (other tabs are placeholders).

## Core Runtime Flow
1. `src/App.jsx` boots and calls `refetchData()`.
2. `refetchData()` loads:
   - `GET /api/state` -> user state + forest
   - `GET /api/shop` -> shop items + tree type metadata
3. State hydration parses `upgrades` and `equipped_upgrades` JSON.
4. App computes:
   - `totalHours` since `lastRelapse`
   - `streakCoins = floor(10 * hours^1.2)`
   - `totalCoins = coinsAtLastRelapse + streakCoins`
   - `coinRatePerHour = 12 * hours^0.2`
5. Routes render with context (`AppContext`) and global/forest backgrounds.

## Frontend Features

### Global App/Navigation (Web)
- `src/App.jsx`: route table, lazy loading, preview mode banner.
- `src/components/Sidebar.jsx`: nav + mobile drawer; special skinning when `kawaii_city_bg` equipped/previewed.
- `src/components/Header.jsx`: page title + live coin panel.
- Legacy Android mode (`Capacitor`, deprecated / not used by current Android build workflow):
  - Limits accessible routes to `"/"` (Journey) and `"/progression"`.
  - Sidebar only shows Journey + Progression.
  - Journey page hides the urge-task CTA, keeps relapse CTA active.
  - Unsupported paths redirect to Journey.

### Journey (Home)
- `src/pages/HomePage.jsx`
- Shows current phoenix image/rank and live streak timer.
- CTA: `I Feel an Urge` and `I Relapsed`.
- Relapse triggers `POST /api/relapse` and refetches state.
- In Android mode, only `I Relapsed` is shown to preserve the focused app surface.

### Android Streak Notification (Legacy Capacitor)
- JS bridge:
  - `src/mobile/useStreakNotification.js`
  - `src/mobile/streakNotification.js`
  - Starts/updates a native Android foreground service when `state.lastRelapse` changes.
- Native Android sources (copied into generated Capacitor Android project by script):
  - `mobile/android/com/relapse/phoenix/StreakNotificationPlugin.java`
  - `mobile/android/com/relapse/phoenix/StreakNotificationService.java`
  - `mobile/android/com/relapse/phoenix/MainActivity.java`
- Service behavior:
  - Ongoing notification (`IMPORTANCE_LOW`) with live streak timer (`d h m s`) updated every second.
  - Notification remains persistent while the service is running.

### Flutter Android App (Native)
- Location: `flutter_app/`
- Key modules:
  - `lib/core/`: config, models (UserState, ShopItem, PhoenixHistory, Rank), services (ApiClient, LocalCache, SessionStore, NotificationService), app state
  - `lib/features/journey/`: Journey screen — big phoenix graphic, big streak timer, urge (placeholder) + relapse, notification toggle, equipped visuals
  - `lib/features/progression/`: Progression timeline with rank graphics from URL
  - `lib/features/shop/`: Shop page with category filters, buy/equip flows
  - `lib/features/aviary/`: Aviary page showing archived phoenix history with images (parses `upgrades_json` to accurately show the skin and aura equipped at the time of relapse)
  - `lib/features/placeholder/`: placeholder pages for non-migrated modules (Forest)
  - `lib/widgets/`: StreakTicker (self-contained 1s timer), LoginGate
  - `lib/core/utils/image_urls.dart`: URL builders for phoenix graphics from web server
- API base URL: `https://phoenix.blackpiratex.com`
- **All graphics loaded from web URL** via `CachedNetworkImage` (disk-cached). Phoenix rank images at `/img/{rankId}.svg`.
- **Offline-first**: `LocalCache` caches state + shop + history JSON. Cache-first bootstrap, 5-min background sync.
- **Persistent login**: Password + cached state means no login screen when offline.
- **Persistent notification**: `NotificationService` uses platform channel (`com.relapse.phoenix/notification`) → native `MainActivity.kt` creates an ongoing Android notification (IMPORTANCE_LOW). Toggleable from Journey page.
  - Native handler: `flutter_app/android_src/MainActivity.kt` (copied into generated project by CI script)
  - Android 13+ requires runtime notification permission; CI script injects `POST_NOTIFICATIONS` and the native handler requests permission when enabling.
- **Performance**: No global ticker. `StreakTicker` widget has its own 1s timer.
- **Equipped item visuals**: Skins (network images per rank stage), aura overlays, background gradients.
- **Image URL safety**: `lib/core/utils/image_urls.dart` normalizes paths from API/shop (`/img/...` vs `img/...`) when building absolute URLs.
- Dependencies: `http`, `flutter_svg`, `shared_preferences`, `cached_network_image`.

### Progression + Level Showcase
- `src/pages/ProgressionPage.jsx`: timeline of ranks, unlocks, rewards, and avg coins/hour per level.
- `src/pages/LevelShowcasePage.jsx`: animated rank detail page with next/previous browsing.

### Forest
- `src/pages/ForestPage.jsx`
- Canvas-based interactive forest:
  - Buy saplings by clicking placement point.
  - Drag existing trees to move (`POST /api/shop` with `action=move_tree`).
  - Growth/mature/wither visuals.
  - Particle effects and responsive game loop.

### Aviary
- `src/pages/AviaryPage.jsx`
- Displays current phoenix + archived phoenix history (`GET /api/history`).
- Detail modal includes timeline and equipped upgrades at archive time.

### Shop + Item Details
- `src/pages/ShopPage.jsx` and `src/pages/ShopItemPage.jsx`
- Supports item categories:
  - `phoenix_skin`
  - `background_theme`
  - `forest_theme`
  - `phoenix_aura`
  - `potion`
  - `tree_sapling`
- Buy/equip/unequip flows, preview support for themes/auras.

### Inventory
- `src/pages/InventoryPage.jsx`
- Potion management (`POST /api/potion`) and active timer display.

### Urge Tasks
- `src/pages/UrgeTasksPage.jsx`
- Task list from `GET /api/urge`.
- Supports start and claim actions.

### Pushup Session
- `src/pages/PushupSessionPage.jsx`
- Session phases: countdown, exercise batches, timed break, extra rest, post-completion continue/end.
- End session saves rewards; cancel applies penalty.

### Minigames
- `src/pages/PhoenixFlightPage.jsx`: flappy-style obstacle game.
- `src/pages/AsteroidShooterPage.jsx`: fullscreen shooter with score->coin conversion.
- Both use `POST /api/minigame` actions:
  - `start_game`
  - `end_game`

### Phoenix Rendering
- `src/components/PhoenixImage.jsx` (Web) / `_PhoenixDisplay` (Flutter)
- Chooses base rank image or equipped skin stage image.
- If a skin is equipped but lacks an image for the current stage, a placeholder (`?` icon) is shown instead of falling back to the base image.
- Applies equipped or previewed aura visual effects.

## Background/Theme System
- Theme components in `src/components/`:
  - `Starfield` (default), `FireBackground`, `PhoenixConstellationBackground`, `SolarSystemBackground`, `KawaiiCityBackground`, `StarfieldWarpBackground`
  - Forest: `ForestBackground` default + `DarkForestBackground`
- Mapped in `App.jsx`:
  - Global `background_theme` map for non-forest routes.
  - Forest-specific `forest_theme` map for `/forest`.
- Preview mode via context: `previewThemeId`, `previewAuraId`.

## Backend API Map

### Shared Utilities (`api/_lib/`)
These files are **not** serverless functions (Vercel ignores `_`-prefixed dirs). They are imported by endpoint files.
- `api/_lib/auth.js`: `checkAuth(req)` — cookie, `X-App-Password`, or `Bearer` auth.
- `api/_lib/db.js`: Turso client, `initDb()`, schema seeding.
- `api/_lib/http.js`: `applyMobileCors()`, `handleOptions()`.
- `api/_lib/ranks.js`: rank data array and `getRank(totalHours)`.

### Auth
- `POST /api/login` (`api/login.js`)
  - Validates `APP_PASSWORD`.
  - Sets `phoenix_auth` cookie.

### State
- `GET /api/state` (`api/state.js`)
  - Applies mobile-friendly CORS headers and handles `OPTIONS`.
  - Calls `initDb()`
  - Matures trees by `matureDate`
  - Auto-claims pending rank rewards into `coinsAtLastRelapse`
  - Returns user state + `forest` rows

### Shop
- `GET /api/shop` (`api/shop.js`)
  - Returns active `shopItems` and normalized `treeTypes` (with stages)
- `POST /api/shop`
  - `action=buy`: purchase item (coin checks, ownership checks, potion rules, tree planting)
  - `action=equip`: toggle equipment with same-type exclusivity
  - `action=move_tree`: persist tree x/y

### Relapse
- `POST /api/relapse` (`api/relapse.js`)
  - Applies mobile-friendly CORS headers and handles `OPTIONS`.
  - Potion protection path (shielded relapse archive)
  - Normal relapse path:
    - archive phoenix history
    - bank streak+unclaimed coins into base
    - wither growing trees
    - remove scarlet skin + apply cumulative 1% discount to scarlet cost
    - reset streak timestamp and potion streak counters

### Urge Tasks
- `GET /api/urge` (`api/urge.js`): returns tasks with computed `is_complete`
- `POST /api/urge`
  - `action=start`
  - `action=end_session`
  - `action=claim`
  - `action=cancel` (pushup task penalty: -200 coins)

### Potion
- `POST /api/potion` (`api/potion.js`)
  - Consumes one inventory potion.
  - Activates 12-hour protection window.

### Minigames
- `POST /api/minigame` (`api/minigame.js`)
  - `start_game`: charges entry cost, creates play row
  - `end_game`: finalizes score, awards `floor(score / 5)` coins

### History
- `GET /api/history` (`api/history.js`): archived phoenix entries.

### Admin
- `GET/POST /api/admin` (`api/admin.js`): currently preview-oriented helper for asset path conventions.

## Data Model (Turso/SQLite)
Defined/initialized in `api/_lib/db.js`:

- `user_state`
  - Core streak/coin/rank progression
  - JSON fields: `upgrades`, `equipped_upgrades`
  - Potion columns:
    - `potion_inventory`
    - `potion_last_purchase_at`
    - `potion_purchases_this_streak`
    - `potion_active_until`
    - `potion_relapse_used_at`
    - `potion_protected_uses_this_streak`
- `phoenix_history`
- `forest`
- `shop_items`
- `shop_item_images`
- `minigames`
- `minigame_plays`
- `urge_tasks`

`initDb()` also seeds:
- Default user row (`id=1`)
- Minigames: `phoenix_flight`, `asteroid_shooter`
- Themes, auras, potion, scarlet skin + scarlet progression images
- Urge tasks (`read_newspaper`, `pushup_45`)
- Tree saplings + growth-stage images

## Economy and Rule Logic
- Streak coins formula: `floor(10 * hours^1.2)`
- Coin rate display: `12 * hours^0.2`
- Rank rewards can be auto-claimed in `/api/state`.
- Potions:
  - Max 2 purchases per streak.
  - 1 purchase per 2 days.
  - 12-hour active effect.
  - Relapse shield usable under active constraints.
- Urge rewards:
  - Newspaper: +200 coins, +1 hour.
  - Pushup: +1 coin per 2 seconds, +4x session duration as streak hours.
  - Cancel pushup session: -200 coins.
- Relapse:
  - Banks unclaimed level rewards + streak coins into base.
  - Resets progress clock (`lastRelapse`) and claimed level.
  - Withers growing trees.

## Assets and Content Conventions
- Phoenix skins: `public/img/skins/<skin-id>/` with 16 stage files.
- Tree art: `public/img/trees/<variant>/`.
- Auras: `public/img/auras/`.
- Theme previews in `shop_items.preview_image`.
- Adding new background/forest theme requires:
  1. component under `src/components/`
  2. theme map entry in `src/App.jsx`
  3. seed row in `api/db.js`
  4. optional preview asset in `public/img/`

## Local Dev and Deployment
- Frontend: `npm run dev` (Vite)
- API local proxy target: `http://localhost:3001` (see `vite.config.js`)
- API dev server: `node dev-server.js`
- Deploy model: Vercel rewrites in `vercel.json`
- Flutter/Android (native):
  - App code: `flutter_app/`
  - CI build script: `scripts/flutter-ci-build.sh`
  - Uses `flutter create .` in CI to generate Android wrapper files.
  - `scripts/flutter-ci-build.sh` enforces `android.permission.INTERNET` in the generated `android/app/src/main/AndroidManifest.xml` before Gradle build.
  - Uses an auto-generated keystore in CI for signed release builds.

## CI Workflow (APK)
- Workflow file: `.github/workflows/android-apk.yml`
- Trigger:
  - `workflow_dispatch`
  - Push to `main`
- Build flow:
  1. Set up Java + Flutter
  2. Prepare Flutter Android project (`flutter create . --platforms=android`, `flutter pub get`)
  3. Run `flutter analyze`
  4. Run `bash scripts/flutter-ci-build.sh`
     - enforce `android.permission.INTERNET` in generated Android manifest
     - generate keystore
     - Gradle `assembleRelease` with injected signing properties
  5. Upload release APK artifact(s)

## Known Gaps / Risks
- `api/history.js` does not check auth currently.
- `api/admin.js` imports `checkAuth` but does not enforce it.
- `api/minigame.js` does not call `initDb()` directly (depends on prior initialization via other routes).
- Asteroid shooter UI says `START GAME (100 Coins)`, seeded backend entry cost is `20`.
- Repo contains legacy `.bak` and `.txt` API files; avoid editing backups by mistake.

## AI Agent Editing Guidance
- Preserve existing patterns (Tailwind + inline style blocks + serverless handlers).
- Keep coin economy formulas consistent unless explicitly requested.
- When touching shop types or progression IDs, ensure parity across:
  - DB seed data
  - frontend rendering logic
  - equip/preview logic
  - asset folder naming
- After any behavior change:
  - update this handoff doc,
  - commit,
  - push.
