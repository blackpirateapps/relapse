import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export async function initDb() {
  await client.batch([
    `CREATE TABLE IF NOT EXISTS user_state (
      id INTEGER PRIMARY KEY, lastRelapse TEXT, longestStreak INTEGER, relapseCount INTEGER,
      coinsAtLastRelapse REAL, upgrades TEXT, lastClaimedLevel INTEGER, equipped_upgrades TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS phoenix_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, final_rank_name TEXT, final_rank_level INTEGER,
      streak_duration_ms INTEGER, start_date TEXT, end_date TEXT, upgrades_json TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS forest (
      id INTEGER PRIMARY KEY AUTOINCREMENT, treeType TEXT, status TEXT, purchaseDate TEXT, matureDate TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS shop_items (
      id TEXT PRIMARY KEY, name TEXT, description TEXT, cost INTEGER, type TEXT, preview_image TEXT,
      growth_hours INTEGER, withered_image TEXT, is_active BOOLEAN DEFAULT true, sort_order INTEGER DEFAULT 0
    );`,
    `CREATE TABLE IF NOT EXISTS shop_item_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT, item_id TEXT, image_url TEXT, image_type TEXT,
      stage_name TEXT, stage_hours INTEGER, sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (item_id) REFERENCES shop_items (id) ON DELETE CASCADE
    );`,
    // --- Minigame Tables ---
    `CREATE TABLE IF NOT EXISTS minigames (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      entry_cost INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true
    );`,
    `CREATE TABLE IF NOT EXISTS minigame_plays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER DEFAULT 1,
      game_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      score INTEGER DEFAULT 0,
      coins_spent INTEGER DEFAULT 0,
      coins_won INTEGER DEFAULT 0,
      FOREIGN KEY (game_id) REFERENCES minigames (id)
    );`,
    `CREATE TABLE IF NOT EXISTS urge_tasks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      reward_coins INTEGER NOT NULL,
      reward_hours INTEGER NOT NULL,
      started_at TEXT,
      completed_at TEXT,
      claimed_at TEXT,
      last_session_seconds INTEGER
    );`
  ], 'write');

  const { rows: taskColumns } = await client.execute("PRAGMA table_info(urge_tasks);");
  const hasSessionSeconds = taskColumns.some((col) => col.name === 'last_session_seconds');
  if (!hasSessionSeconds) {
    await client.execute("ALTER TABLE urge_tasks ADD COLUMN last_session_seconds INTEGER;");
  }

  // Initialize user if not exists
  const { rows: userRows } = await client.execute("SELECT id FROM user_state WHERE id = 1;");
  if (userRows.length === 0) {
    await client.execute({
      sql: "INSERT INTO user_state (id, lastRelapse, longestStreak, relapseCount, coinsAtLastRelapse, upgrades, lastClaimedLevel, equipped_upgrades) VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
      args: [1, new Date().toISOString(), 0, 0, 0, '{}', 0, '{}'],
    });
  }

  // --- Initialize Minigame Data ---
  const { rows: phoenixRows } = await client.execute("SELECT id FROM minigames WHERE id = 'phoenix_flight';");
  if (phoenixRows.length === 0) {
    await client.execute({
      sql: "INSERT INTO minigames (id, name, entry_cost, is_active) VALUES (?, ?, ?, ?);",
      args: ['phoenix_flight', 'Phoenix Flight', 20, true],
    });
  }

  // ADDED: Initialize Asteroid Shooter game
  const { rows: asteroidRows } = await client.execute("SELECT id FROM minigames WHERE id = 'asteroid_shooter';");
  if (asteroidRows.length === 0) {
    await client.execute({
      sql: "INSERT INTO minigames (id, name, entry_cost, is_active) VALUES (?, ?, ?, ?);",
      args: ['asteroid_shooter', 'Asteroid Shooter', 20, true],
    });
  }

  // Initialize burning fire background theme if missing
  const { rows: fireThemeRows } = await client.execute("SELECT id FROM shop_items WHERE id = 'burning_fire_bg';");
  if (fireThemeRows.length === 0) {
    await client.execute({
      sql: "INSERT INTO shop_items (id, name, description, cost, type, preview_image, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
      args: [
        'burning_fire_bg',
        'Burning Fire',
        'Replace the starfield with a blazing, animated fire sky.',
        50000,
        'background_theme',
        '/img/bg-burning-fire.svg',
        true,
        90
      ],
    });
  }

  const { rows: constellationRows } = await client.execute("SELECT id FROM shop_items WHERE id = 'phoenix_constellation_bg';");
  if (constellationRows.length === 0) {
    await client.execute({
      sql: "INSERT INTO shop_items (id, name, description, cost, type, preview_image, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
      args: [
        'phoenix_constellation_bg',
        'Phoenix Constellation',
        'A celestial phoenix traced across the stars.',
        50000,
        'background_theme',
        '/img/bg-phoenix-constellation.svg',
        true,
        91
      ],
    });
  }

  const { rows: solarSystemRows } = await client.execute("SELECT id FROM shop_items WHERE id = 'solar_system_bg';");
  if (solarSystemRows.length === 0) {
    await client.execute({
      sql: "INSERT INTO shop_items (id, name, description, cost, type, preview_image, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
      args: [
        'solar_system_bg',
        'Solar System',
        'A living orrery with colorful, moving planets.',
        100000,
        'background_theme',
        '/img/bg-solar-system.svg',
        true,
        92
      ],
    });
  }

  const { rows: kawaiiRows } = await client.execute("SELECT id FROM shop_items WHERE id = 'kawaii_city_bg';");
  if (kawaiiRows.length === 0) {
    await client.execute({
      sql: "INSERT INTO shop_items (id, name, description, cost, type, preview_image, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
      args: [
        'kawaii_city_bg',
        'Kawaii City Lights',
        'A pastel anime skyline with floating hearts. Also re-skins the sidebar.',
        50000,
        'background_theme',
        '/img/bg-kawaii-city.svg',
        true,
        93
      ],
    });
  }

  const { rows: starfieldRows } = await client.execute("SELECT id FROM shop_items WHERE id = 'starfield_warp_bg';");
  if (starfieldRows.length === 0) {
    await client.execute({
      sql: "INSERT INTO shop_items (id, name, description, cost, type, preview_image, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
      args: [
        'starfield_warp_bg',
        'Starfield Drift',
        'A vivid starfield warp with drifting trails.',
        50000,
        'background_theme',
        '/img/bg-starfield-warp.svg',
        true,
        94
      ],
    });
  }

  const { rows: darkForestRows } = await client.execute("SELECT id FROM shop_items WHERE id = 'dark_forest_bg';");
  if (darkForestRows.length === 0) {
    await client.execute({
      sql: "INSERT INTO shop_items (id, name, description, cost, type, preview_image, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
      args: [
        'dark_forest_bg',
        'Nocturne Forest',
        'A darker, misty forest with drifting shadows.',
        20000,
        'forest_theme',
        '/img/bg-dark-forest.svg',
        true,
        95
      ],
    });
  }

  const { rows: taskRows } = await client.execute("SELECT id FROM urge_tasks WHERE id = 'read_newspaper';");
  if (taskRows.length === 0) {
    await client.execute({
      sql: "INSERT INTO urge_tasks (id, name, description, duration_minutes, reward_coins, reward_hours) VALUES (?, ?, ?, ?, ?, ?);",
      args: [
        'read_newspaper',
        "Read Today's Newspaper",
        'Read the newspaper for 30 minutes.',
        30,
        200,
        1
      ],
    });
  }

  const { rows: pushupRows } = await client.execute("SELECT id FROM urge_tasks WHERE id = 'pushup_45';");
  if (pushupRows.length === 0) {
    await client.execute({
      sql: "INSERT INTO urge_tasks (id, name, description, duration_minutes, reward_coins, reward_hours) VALUES (?, ?, ?, ?, ?, ?);",
      args: [
        'pushup_45',
        'Pushup 45 times',
        'Pushup 45 times in a batch of 15.',
        0,
        0,
        0
      ],
    });
  }

  const { rows: scarletRows } = await client.execute("SELECT id FROM shop_items WHERE id = 'scarlet_phoenix_skin';");
  if (scarletRows.length === 0) {
    await client.execute({
      sql: "INSERT INTO shop_items (id, name, description, cost, type, preview_image, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
      args: [
        'scarlet_phoenix_skin',
        'Scarlet Phoenix',
        'A blazing crimson phoenix that must be reclaimed after relapse.',
        2000,
        'phoenix_skin',
        '/img/skins/scarlet/celestial-phoenix.webp',
        true,
        70
      ],
    });
  }

  const { rows: scarletImages } = await client.execute("SELECT id FROM shop_item_images WHERE item_id = 'scarlet_phoenix_skin' LIMIT 1;");
  if (scarletImages.length === 0) {
    const stages = [
      'egg-1', 'egg-2', 'egg-3',
      'hatchling-1', 'hatchling-2', 'hatchling-3',
      'chick-1', 'chick-2',
      'youngling-1', 'youngling-2',
      'sunfire-1', 'sunfire-2',
      'guardian-1', 'guardian-2',
      'drake', 'celestial-phoenix'
    ];
    for (let i = 0; i < stages.length; i += 1) {
      await client.execute({
        sql: "INSERT INTO shop_item_images (item_id, image_url, image_type, stage_name, sort_order) VALUES (?, ?, 'progression', ?, ?);",
        args: [
          'scarlet_phoenix_skin',
          `/img/skins/scarlet/${stages[i]}.webp`,
          stages[i],
          i
        ]
      });
    }
  }
}

export default client;
