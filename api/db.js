import { createClient } from "@libsql/client";

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

// Function to initialize the database schema if it doesn't exist
export async function initDb() {
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
    // Check if the single row exists
    const { rows } = await client.execute("SELECT id FROM user_state WHERE id = 1;");
    if (rows.length === 0) {
        // Insert the initial state
        await client.execute({
            sql: "INSERT INTO user_state (id, lastRelapse, longestStreak, relapseCount, coinsAtLastRelapse, upgrades) VALUES (?, ?, ?, ?, ?, ?);",
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
                })
            ],
        });
    }
}

export default client;

