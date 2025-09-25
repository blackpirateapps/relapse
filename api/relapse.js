import db from './db.js';
import { checkAuth } from './auth.js';
import { ranks as serverRanks } from './ranks.js'; // Use server-side ranks

function getRank(totalHours) {
    for (let i = serverRanks.length - 1; i >= 0; i--) {
        if (totalHours >= serverRanks[i].hours) return serverRanks[i];
    }
    return serverRanks[0];
}

export default async function handler(req, res) {
    if (!checkAuth(req)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
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
             await db.execute({
                sql: `INSERT INTO phoenix_history (final_rank_level, streak_duration_ms, start_date, end_date, upgrades_json) 
                      VALUES (?, ?, ?, ?, ?);`,
                args: [finalRank.level, currentStreakMs, state.lastRelapse, endDate.toISOString(), state.upgrades]
            });
        }
        
        await db.execute("UPDATE forest SET status = 'withered' WHERE status = 'growing';");

        const newLongestStreak = Math.max(state.longestStreak, currentStreakMs);
        
        await db.execute({
            sql: `UPDATE user_state SET lastRelapse = ?, longestStreak = ?, relapseCount = relapseCount + 1, coinsAtLastRelapse = 0, lastClaimedLevel = 0 WHERE id = 1;`,
            args: [endDate.toISOString(), newLongestStreak]
        });

        res.status(204).end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to process relapse.' });
    }
}

