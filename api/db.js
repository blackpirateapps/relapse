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
    );`
  ]);

  try {
    // Migrations can be added here in the future
  } catch (e) { /* Ignore errors if columns already exist */ }

  const { rows } = await client.execute("SELECT id FROM user_state WHERE id = 1;");
  if (rows.length === 0) {
    await client.execute({
      sql: "INSERT INTO user_state (id, lastRelapse, longestStreak, relapseCount, coinsAtLastRelapse, upgrades, lastClaimedLevel, equipped_upgrades) VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
      args: [1, new Date().toISOString(), 0, 0, 0, '{}', 0, '{}'],
    });
  }
}

export default client;
