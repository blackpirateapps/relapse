import { createClient } from "@libsql/client";

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export async function initDb() {
  // --- Schema Creation ---
  await client.execute(`
    CREATE TABLE IF NOT EXISTS user_state (
      id INTEGER PRIMARY KEY,
      lastRelapse TEXT NOT NULL,
      longestStreak INTEGER NOT NULL,
      relapseCount INTEGER NOT NULL,
      coinsAtLastRelapse REAL NOT NULL,
      upgrades TEXT NOT NULL
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS phoenix_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      final_rank_name TEXT NOT NULL,
      final_rank_level INTEGER NOT NULL,
      streak_duration_ms INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      upgrades_json TEXT NOT NULL
    );
  `);

  // NEW: Create the forest table if it doesn't exist
  await client.execute(`
    CREATE TABLE IF NOT EXISTS forest (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      treeType TEXT NOT NULL,
      status TEXT NOT NULL,
      purchaseDate TEXT NOT NULL,
      matureDate TEXT NOT NULL
    );
  `);

  // ADD THESE MISSING SHOP TABLES
  await client.execute(`
    CREATE TABLE IF NOT EXISTS shop_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      cost INTEGER NOT NULL,
      type TEXT NOT NULL,
      preview_image TEXT,
      growth_hours INTEGER,
      withered_image TEXT,
      is_active BOOLEAN DEFAULT true,
      sort_order INTEGER DEFAULT 0
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS shop_item_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      image_type TEXT NOT NULL,
      stage_name TEXT,
      stage_hours INTEGER,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (item_id) REFERENCES shop_items (id)
    );
  `);

  // --- Schema Migration ---
  try {
    await client.execute(`ALTER TABLE user_state ADD COLUMN lastClaimedLevel INTEGER NOT NULL DEFAULT 0;`);
  } catch (e) { /* Ignore errors if column already exists */ }

  try {
    await client.execute(`ALTER TABLE user_state ADD COLUMN equipped_upgrades TEXT;`);
  } catch (e) { /* Ignore errors if column already exists */ }

  // --- Initial Data ---
  const { rows } = await client.execute("SELECT id FROM user_state WHERE id = 1;");
  if (rows.length === 0) {
    await client.execute({
      sql: "INSERT INTO user_state (id, lastRelapse, longestStreak, relapseCount, coinsAtLastRelapse, upgrades, lastClaimedLevel, equipped_upgrades) VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
      args: [
        1, 
        new Date().toISOString(), 
        0, 
        0, 
        0,
        JSON.stringify({}),
        0,
        JSON.stringify({})
      ],
    });
  }

  // ADD SAMPLE SHOP DATA (optional - for testing)
  const shopItemsCount = await client.execute("SELECT COUNT(*) as count FROM shop_items;");
  if (shopItemsCount.rows[0].count === 0) {
    // Insert sample tree types
    await client.execute({
      sql: "INSERT INTO shop_items (name, description, cost, type, growth_hours, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?);",
      args: ["Oak Tree", "A sturdy oak tree that grows slowly but surely", 100, "tree", 24, true, 1]
    });

    await client.execute({
      sql: "INSERT INTO shop_items (name, description, cost, type, growth_hours, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?);",
      args: ["Pine Tree", "A fast-growing pine tree", 150, "tree", 12, true, 2]
    });

    await client.execute({
      sql: "INSERT INTO shop_items (name, description, cost, type, growth_hours, is_active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?);",
      args: ["Cherry Blossom", "Beautiful flowering tree", 200, "tree", 18, true, 3]
    });
  }
}

export default client;