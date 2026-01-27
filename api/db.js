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
    );`
  ], 'write');

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
}

export default client;
