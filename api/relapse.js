import db from './db.js';
import { checkAuth } from './auth.js';
import { ranks, getRank } from './ranks.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    if (!checkAuth(req)) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const { rows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
        if (rows.length === 0) return res.status(404).json({ message: 'State not found.' });
        
        const state = rows[0];
        const endDate = new Date();
        const currentStreakMs = endDate.getTime() - new Date(state.lastRelapse).getTime();
        
        if (currentStreakMs > 0) {
            const totalHours = currentStreakMs / (1000 * 60 * 60);
            const finalRank = getRank(totalHours);
            
            // --- START: FIX FOR DATABASE INSERT ---
            // The phoenix name and rank name were missing, causing the database query to fail.
            const phoenixName = `Phoenix of ${endDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;

            await db.execute({
                sql: `INSERT INTO phoenix_history (name, final_rank_name, final_rank_level, streak_duration_ms, start_date, end_date, upgrades_json) 
                      VALUES (?, ?, ?, ?, ?, ?, ?);`,
                args: [
                    phoenixName,
                    finalRank.name, // Added missing rank name
                    finalRank.level,
                    currentStreakMs,
                    state.lastRelapse,
                    endDate.toISOString(),
                    state.upgrades
                ]
            });
            // --- END: FIX FOR DATABASE INSERT ---
        }
        
        // Wither any growing trees
        await db.execute("UPDATE forest SET status = 'withered' WHERE status = 'growing';");

        // Update the user's state for the new streak
        const newLongestStreak = Math.max(state.longestStreak || 0, currentStreakMs);
        
        await db.execute({
            sql: `UPDATE user_state SET lastRelapse = ?, longestStreak = ?, relapseCount = relapseCount + 1, coinsAtLastRelapse = 0, lastClaimedLevel = 0 WHERE id = 1;`,
            args: [endDate.toISOString(), newLongestStreak]
        });

        // --- FIX: RETURN THE NEW STATE ---
        // Instead of returning an empty response, fetch and return the new, reset state
        // so the UI can update instantly without a full page reload.
        const { rows: updatedState } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
        res.status(200).json(updatedState[0]);
        // --- END: FIX ---

    } catch (error) {
        console.error("Relapse API Error:", error);
        res.status(500).json({ message: 'Failed to process relapse.' });
    }
}