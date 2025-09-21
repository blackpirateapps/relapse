import { createClient } from "@libsql/client";

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// Function to initialize and migrate the database schema
export async function initDb() {
    // --- Schema Creation ---
    // Create the main user state table if it doesn't exist
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

    // Create the history table for the Aviary if it doesn't exist
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

    // --- Schema Migration ---
    // This section safely adds new columns to existing tables without errors.
    try {
        // Add the 'lastClaimedLevel' column to user_state if it's missing.
        await client.execute(`
            ALTER TABLE user_state ADD COLUMN lastClaimedLevel INTEGER NOT NULL DEFAULT 0;
        `);
        console.log("Successfully migrated user_state table: added lastClaimedLevel column.");
    } catch (e) {
        // This will likely throw an error if the column already exists, which is safe to ignore.
        if (e.message.includes("duplicate column name")) {
             // Column already exists, which is fine.
        } else {
            console.error("Error migrating user_state table:", e);
        }
    }
    
    // --- Initial Data ---
    // Check if the single user row exists
    const { rows } = await client.execute("SELECT id FROM user_state WHERE id = 1;");
    if (rows.length === 0) {
        // Insert the initial state with the new column included
        await client.execute({
            sql: "INSERT INTO user_state (id, lastRelapse, longestStreak, relapseCount, coinsAtLastRelapse, upgrades, lastClaimedLevel) VALUES (?, ?, ?, ?, ?, ?, ?);",
            args: [
                1,
                new Date().toISOString(),
                0,
                0,
                0,
                JSON.stringify({ 
                    aura: false, 
                    celestialFlames: false,
                    volcanicLair: false,
                    celestialSky: false 
                }),
                0 // Start at level 0
            ],
        });
    }
}

export default client;

