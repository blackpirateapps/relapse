import db from './db.js';
import { checkAuth } from './auth.js';

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
    needsMigration: false
  };

  // Check tables
  const tables = ['user_state', 'phoenix_history', 'forest', 'migrations'];
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

  // Determine if migration is needed
  status.needsMigration = (
    !status.tables.user_state ||
    !status.tables.phoenix_history ||
    !status.tables.forest ||
    !status.tables.migrations ||
    !status.columns.lastClaimedLevel ||
    !status.columns.equipped_upgrades ||
    !status.userExists ||
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