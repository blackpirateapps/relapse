import { createClient } from "@libsql/client";

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// Function to initialize and migrate the database schema
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

    // --- Schema Migration ---
    try {
        await client.execute(`
            ALTER TABLE user_state ADD COLUMN lastClaimedLevel INTEGER NOT NULL DEFAULT 0;
        `);
    } catch (e) {
        if (!e.message.includes("duplicate column name")) {
             console.error("Error migrating user_state table:", e);
        }
    }
    
    // --- Initial Data ---
    const { rows } = await client.execute("SELECT id FROM user_state WHERE id = 1;");
    if (rows.length === 0) {
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
                    celestialSky: false,
                    navStyle: false // Add this line
                }),
                0
            ],
        });
    }
}

export default client;

