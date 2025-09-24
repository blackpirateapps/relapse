import db from './db.js';
import { checkAuth } from './auth.js';

// Current hardcoded shop data - this will be migrated to database
const currentShopItems = [
  {
    id: 'bluePhoenix',
    name: 'Blue Phoenix',
    cost: 1500,
    description: 'A mystical phoenix born of celestial ice, its flames burn with a cool, determined light.',
    type: 'phoenix_skin',
    previewImage: '/img/skins/blue/celestial-phoenix.webp',
    images: [
      '/img/skins/blue/egg-1.webp',
      '/img/skins/blue/egg-2.webp',
      '/img/skins/blue/egg-3.webp',
      '/img/skins/blue/hatchling-1.webp',
      '/img/skins/blue/hatchling-2.webp',
      '/img/skins/blue/hatchling-3.webp',
      '/img/skins/blue/chick-1.webp',
      '/img/skins/blue/chick-2.webp',
      '/img/skins/blue/youngling-1.webp',
      '/img/skins/blue/youngling-2.webp',
      '/img/skins/blue/sunfire-1.webp',
      '/img/skins/blue/sunfire-2.webp',
      '/img/skins/blue/guardian-1.webp',
      '/img/skins/blue/guardian-2.webp',
      '/img/skins/blue/drake.webp',
      '/img/skins/blue/celestial-phoenix.webp'
    ]
  },
  {
    id: 'greenPhoenix',
    name: 'Verdant Phoenix',
    cost: 4000,
    description: 'A phoenix intertwined with the essence of a life-giving forest, symbolizing growth and renewal.',
    type: 'phoenix_skin',
    previewImage: '/img/skins/green/celestial-phoenix.webp',
    images: [
      '/img/skins/green/egg-1.webp',
      '/img/skins/green/egg-2.webp',
      '/img/skins/green/egg-3.webp',
      '/img/skins/green/hatchling-1.webp',
      '/img/skins/green/hatchling-2.webp',
      '/img/skins/green/hatchling-3.webp',
      '/img/skins/green/chick-1.webp',
      '/img/skins/green/chick-2.webp',
      '/img/skins/green/youngling-1.webp',
      '/img/skins/green/youngling-2.webp',
      '/img/skins/green/sunfire-1.webp',
      '/img/skins/green/sunfire-2.webp',
      '/img/skins/green/guardian-1.webp',
      '/img/skins/green/guardian-2.webp',
      '/img/skins/green/drake.webp',
      '/img/skins/green/celestial-phoenix.webp'
    ]
  },
  {
    id: 'aura',
    name: 'Aura of Resolve',
    cost: 500,
    description: 'A soft, glowing aura for your phoenix.',
    type: 'cosmetic',
    previewImage: '/img/cosmetics/aura.webp'
  },
  {
    id: 'volcanicLair',
    name: 'Volcanic Lair',
    cost: 10000,
    description: 'A dark, fiery background theme.',
    type: 'theme',
    previewImage: '/img/themes/volcanic.webp'
  },
  {
    id: 'celestialSky',
    name: 'Celestial Sky',
    cost: 50000,
    description: 'A beautiful, star-filled background theme.',
    type: 'theme',
    previewImage: '/img/themes/celestial.webp'
  }
];

// Current tree types data
const currentTreeTypes = {
  tree_of_tranquility: {
    id: 'tree_of_tranquility',
    name: 'Tree of Tranquility',
    cost: 200,
    description: 'A symbol of peace. Grows to maturity in 1 day, changing every 6 hours, if you do not relapse.',
    type: 'tree_sapling',
    growthHours: 24,
    stages: [
      { status: 'Sapling', hours: 0, image: '/img/trees/tree_of_tranquility/stage_1.png' },
      { status: 'Sprout', hours: 6, image: '/img/trees/tree_of_tranquility/stage_2.png' },
      { status: 'Young Tree', hours: 12, image: '/img/trees/tree_of_tranquility/stage_3.png' },
      { status: 'Flourishing', hours: 18, image: '/img/trees/tree_of_tranquility/stage_4.png' },
      { status: 'Mature', hours: 24, image: '/img/trees/tree_of_tranquility/stage_5.png' }
    ],
    witheredImage: '/img/trees/tree_of_tranquility/withered.png'
  },
  ancient_oak: {
    id: 'ancient_oak',
    name: 'Ancient Oak',
    cost: 500,
    description: 'A majestic oak that stands the test of time. Takes 2 days to reach full maturity, evolving through 7 distinct stages.',
    type: 'tree_sapling',
    growthHours: 48,
    stages: [
      { status: 'Acorn', hours: 0, image: '/img/trees/ancient_oak/stage_1.png' },
      { status: 'Seedling', hours: 8, image: '/img/trees/ancient_oak/stage_2.png' },
      { status: 'Sapling', hours: 16, image: '/img/trees/ancient_oak/stage_3.png' },
      { status: 'Young Oak', hours: 24, image: '/img/trees/ancient_oak/stage_4.png' },
      { status: 'Growing Oak', hours: 32, image: '/img/trees/ancient_oak/stage_5.png' },
      { status: 'Mighty Oak', hours: 40, image: '/img/trees/ancient_oak/stage_6.png' },
      { status: 'Ancient Oak', hours: 48, image: '/img/trees/ancient_oak/stage_7.png' }
    ],
    witheredImage: '/img/trees/ancient_oak/withered.png'
  }
};

// Define all migrations with version tracking
const migrations = [
  {
    id: 1,
    name: 'Create base tables',
    description: 'Creates user_state, phoenix_history, and forest tables',
    sql: [
      `CREATE TABLE IF NOT EXISTS user_state (
        id INTEGER PRIMARY KEY,
        lastRelapse TEXT NOT NULL,
        longestStreak INTEGER NOT NULL,
        relapseCount INTEGER NOT NULL,
        coinsAtLastRelapse REAL NOT NULL,
        upgrades TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS phoenix_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        final_rank_name TEXT NOT NULL,
        final_rank_level INTEGER NOT NULL,
        streak_duration_ms INTEGER NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        upgrades_json TEXT NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS forest (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        treeType TEXT NOT NULL,
        status TEXT NOT NULL,
        purchaseDate TEXT NOT NULL,
        matureDate TEXT NOT NULL
      );`
    ]
  },
  {
    id: 2,
    name: 'Add user_state columns',
    description: 'Adds lastClaimedLevel and equipped_upgrades columns',
    sql: [
      `ALTER TABLE user_state ADD COLUMN lastClaimedLevel INTEGER NOT NULL DEFAULT 0;`,
      `ALTER TABLE user_state ADD COLUMN equipped_upgrades TEXT;`
    ]
  },
  {
    id: 3,
    name: 'Create migrations table',
    description: 'Creates table to track migration versions',
    sql: [
      `CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        executed_at TEXT NOT NULL,
        success BOOLEAN NOT NULL
      );`
    ]
  },
  {
    id: 4,
    name: 'Initialize default user',
    description: 'Creates default user record if none exists',
    sql: [] // Special handling in code
  },
  {
    id: 5,
    name: 'Create shop tables',
    description: 'Creates shop_items and shop_item_images tables for dynamic shop management',
    sql: [
      `CREATE TABLE IF NOT EXISTS shop_items (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        cost INTEGER NOT NULL,
        type TEXT NOT NULL,
        preview_image TEXT,
        is_active BOOLEAN DEFAULT true,
        sort_order INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        growth_hours INTEGER,
        withered_image TEXT
      );`,
      `CREATE TABLE IF NOT EXISTS shop_item_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id TEXT NOT NULL,
        stage_name TEXT,
        stage_hours INTEGER,
        image_url TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        image_type TEXT DEFAULT 'stage',
        FOREIGN KEY (item_id) REFERENCES shop_items(id)
      );`
    ]
  },
  {
    id: 6,
    name: 'Migrate shop data',
    description: 'Migrates all hardcoded shop items and tree data to database',
    sql: [] // Special handling in code
  }
];

// Helper to parse JSON from request body
async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => resolve(body ? JSON.parse(body) : {}));
    req.on('error', err => reject(err));
  });
}

// Check if a table exists
async function tableExists(tableName) {
  try {
    const result = await db.execute({
      sql: "SELECT name FROM sqlite_master WHERE type='table' AND name=?;",
      args: [tableName]
    });
    return result.rows.length > 0;
  } catch (error) {
    return false;
  }
}

// Check if a column exists in a table
async function columnExists(tableName, columnName) {
  try {
    const result = await db.execute(`PRAGMA table_info(${tableName});`);
    return result.rows.some(row => row.name === columnName);
  } catch (error) {
    return false;
  }
}

// Get migration status
async function getMigrationStatus() {
  const status = {
    tables: {},
    columns: {},
    migrations: {},
    shopData: {},
    needsMigration: false
  };

  // Check tables
  const tables = ['user_state', 'phoenix_history', 'forest', 'migrations', 'shop_items', 'shop_item_images'];
  for (const table of tables) {
    status.tables[table] = await tableExists(table);
  }

  // Check columns (only if user_state table exists)
  if (status.tables.user_state) {
    const columns = ['lastClaimedLevel', 'equipped_upgrades'];
    for (const column of columns) {
      status.columns[column] = await columnExists('user_state', column);
    }
  }

  // Check migration records (only if migrations table exists)
  if (status.tables.migrations) {
    try {
      const result = await db.execute("SELECT * FROM migrations ORDER BY id;");
      for (const row of result.rows) {
        status.migrations[row.id] = {
          name: row.name,
          description: row.description,
          executed_at: row.executed_at,
          success: row.success
        };
      }
    } catch (error) {
      // Migrations table might exist but be empty
    }
  }

  // Check if user record exists
  if (status.tables.user_state) {
    try {
      const result = await db.execute("SELECT COUNT(*) as count FROM user_state WHERE id = 1;");
      status.userExists = result.rows[0]?.count > 0;
    } catch (error) {
      status.userExists = false;
    }
  }

  // Check shop data
  if (status.tables.shop_items) {
    try {
      const result = await db.execute("SELECT COUNT(*) as count FROM shop_items;");
      status.shopData.itemCount = result.rows[0]?.count || 0;
      
      const imageResult = await db.execute("SELECT COUNT(*) as count FROM shop_item_images;");
      status.shopData.imageCount = imageResult.rows[0]?.count || 0;
      
      status.shopData.migrated = status.shopData.itemCount > 0;
    } catch (error) {
      status.shopData.migrated = false;
      status.shopData.itemCount = 0;
      status.shopData.imageCount = 0;
    }
  } else {
    status.shopData.migrated = false;
    status.shopData.itemCount = 0;
    status.shopData.imageCount = 0;
  }

  // Determine if migration is needed
  status.needsMigration = (
    !status.tables.user_state ||
    !status.tables.phoenix_history ||
    !status.tables.forest ||
    !status.tables.migrations ||
    !status.tables.shop_items ||
    !status.tables.shop_item_images ||
    !status.columns.lastClaimedLevel ||
    !status.columns.equipped_upgrades ||
    !status.userExists ||
    !status.shopData.migrated ||
    Object.keys(status.migrations).length < migrations.length
  );

  return status;
}

// Execute a single migration
async function executeMigration(migration) {
  const startTime = new Date().toISOString();
  const results = [];

  try {
    // Special handling for user initialization
    if (migration.id === 4) {
      const userCheck = await db.execute("SELECT id FROM user_state WHERE id = 1;");
      if (userCheck.rows.length === 0) {
        await db.execute({
          sql: `INSERT INTO user_state (id, lastRelapse, longestStreak, relapseCount, coinsAtLastRelapse, upgrades, lastClaimedLevel, equipped_upgrades) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          args: [
            1,
            new Date().toISOString(),
            0,
            0,
            0,
            JSON.stringify({}),
            0,
            JSON.stringify({})
          ]
        });
      }
      results.push({ sql: 'User initialization', success: true });
    
    // Special handling for shop data migration
    } else if (migration.id === 6) {
      // Clear existing shop data first
      await db.execute("DELETE FROM shop_item_images;");
      await db.execute("DELETE FROM shop_items;");
      
      // Migrate regular shop items
      for (const item of currentShopItems) {
        await db.execute({
          sql: `INSERT INTO shop_items (id, name, description, cost, type, preview_image, is_active, sort_order) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
          args: [item.id, item.name, item.description, item.cost, item.type, item.previewImage || null, true, 0]
        });
        
        // Add images for phoenix skins
        if (item.images && Array.isArray(item.images)) {
          for (let i = 0; i < item.images.length; i++) {
            await db.execute({
              sql: `INSERT INTO shop_item_images (item_id, stage_name, stage_hours, image_url, sort_order, image_type) 
                    VALUES (?, ?, ?, ?, ?, ?);`,
              args: [item.id, `Stage ${i + 1}`, i, item.images[i], i, 'progression']
            });
          }
        }
      }
      
      // Migrate tree items
      for (const [treeId, tree] of Object.entries(currentTreeTypes)) {
        await db.execute({
          sql: `INSERT INTO shop_items (id, name, description, cost, type, preview_image, is_active, sort_order, growth_hours, withered_image) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          args: [tree.id, tree.name, tree.description, tree.cost, tree.type, tree.stages[0]?.image || null, true, 10, tree.growthHours, tree.witheredImage]
        });
        
        // Add tree stages
        for (let i = 0; i < tree.stages.length; i++) {
          const stage = tree.stages[i];
          await db.execute({
            sql: `INSERT INTO shop_item_images (item_id, stage_name, stage_hours, image_url, sort_order, image_type) 
                  VALUES (?, ?, ?, ?, ?, ?);`,
            args: [tree.id, stage.status, stage.hours, stage.image, i, 'growth_stage']
          });
        }
      }
      
      results.push({ sql: `Migrated ${currentShopItems.length} shop items and ${Object.keys(currentTreeTypes).length} tree types`, success: true });
      
    } else {
      // Execute regular SQL migrations
      for (const sql of migration.sql) {
        try {
          await db.execute(sql);
          results.push({ sql, success: true });
        } catch (error) {
          // Some errors are expected (like column already exists)
          const isExpectedError = error.message.includes('already exists') || 
                                 error.message.includes('duplicate column name');
          results.push({ 
            sql, 
            success: isExpectedError, 
            error: error.message,
            expected: isExpectedError 
          });
        }
      }
    }

    // Record migration in migrations table
    try {
      await db.execute({
        sql: "INSERT OR REPLACE INTO migrations (id, name, description, executed_at, success) VALUES (?, ?, ?, ?, ?);",
        args: [migration.id, migration.name, migration.description, startTime, true]
      });
    } catch (error) {
      // Migrations table might not exist yet, that's ok for migration #3
    }

    return {
      success: true,
      results,
      executedAt: startTime
    };

  } catch (error) {
    // Record failed migration
    try {
      await db.execute({
        sql: "INSERT OR REPLACE INTO migrations (id, name, description, executed_at, success) VALUES (?, ?, ?, ?, ?);",
        args: [migration.id, migration.name, migration.description, startTime, false]
      });
    } catch (e) {
      // Ignore if migrations table doesn't exist
    }

    return {
      success: false,
      error: error.message,
      results,
      executedAt: startTime
    };
  }
}

export default async function handler(req, res) {
  if (!checkAuth(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // Get migration status
    try {
      const status = await getMigrationStatus();
      res.status(200).json(status);
    } catch (error) {
      console.error('Migration status error:', error);
      res.status(500).json({ 
        message: 'Failed to get migration status',
        error: error.message 
      });
    }

  } else if (req.method === 'POST') {
    // Execute migrations
    try {
      const body = await parseJsonBody(req);
      const { action, migrationId } = body;

      if (action === 'migrate') {
        const results = [];

        if (migrationId) {
          // Run specific migration
          const migration = migrations.find(m => m.id === parseInt(migrationId));
          if (!migration) {
            return res.status(404).json({ message: 'Migration not found' });
          }

          const result = await executeMigration(migration);
          results.push({ migration: migration.id, ...result });

        } else {
          // Run all migrations
          for (const migration of migrations) {
            const result = await executeMigration(migration);
            results.push({ migration: migration.id, ...result });
          }
        }

        // Get updated status
        const status = await getMigrationStatus();

        res.status(200).json({
          success: true,
          message: 'Migration completed',
          results,
          status
        });

      } else {
        res.status(400).json({ message: 'Invalid action' });
      }

    } catch (error) {
      console.error('Migration execution error:', error);
      res.status(500).json({ 
        message: 'Migration failed',
        error: error.message 
      });
    }

  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}