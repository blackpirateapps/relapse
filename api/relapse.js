import db from './db.js';
import { checkAuth } from './auth.js';

// Ranks data is duplicated here to be accessible on the server
const ranks = [
    { name: "Ashen Egg I", id: "egg-1", hours: 0 }, { name: "Ashen Egg II", id: "egg-2", hours: 6 }, { name: "Ashen Egg III", id: "egg-3", hours: 12 },
    { name: "Fledgling Hatchling", id: "hatchling-1", hours: 24 }, { name: "Ember Glance", id: "hatchling-2", hours: 36 }, { name: "First Steps", id: "hatchling-3", hours: 48 },
    { name: "Ember Chick", id: "chick-1", hours: 72 }, { name: "Warmth of Will", id: "chick-2", hours: 120 },
    { name: "Flame Youngling", id: "youngling-1", hours: 168 }, { name: "Spark of Defiance", id: "youngling-2", hours: 240 },
    { name: "Sunfire Phoenix", id: "sunfire-1", hours: 336 }, { name: "Blinding Light", id: "sunfire-2", hours: 500 },
    { name: "Blaze Guardian", id: "guardian-1", hours: 720 }, { name: "Vigilant Stance", id: "guardian-2", hours: 1440 },
    { name: "Solar Drake", id: "drake", hours: 2160 },
    { name: "Celestial Phoenix", id: "celestial-phoenix", hours: 4320 }
];

function getRank(totalHours) {
    for (let i = ranks.length - 1; i >= 0; i--) {
        if (totalHours >= ranks[i].hours) return { ...ranks[i], level: i };
    }
    return { ...ranks[0], level: 0 };
}

export default async function handler(req, res) {
    if (req.method !== 'POST' || !checkAuth(req)) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const { rows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
        if (rows.length === 0) return res.status(404).json({ message: 'State not found.' });
        
        const state = rows[0];
        
        const lastRelapseDate = new Date(state.lastRelapse);
        const endDate = new Date();
        const currentStreakMs = endDate.getTime() - lastRelapseDate.getTime();
        
        // --- Archive the Phoenix ---
        if (currentStreakMs > 0) {
            const totalHours = currentStreakMs / (1000 * 60 * 60);
            const finalRank = getRank(totalHours);
            const phoenixName = `Phoenix of ${endDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;

            await db.execute({
                sql: `INSERT INTO phoenix_history (name, final_rank_name, final_rank_level, streak_duration_ms, start_date, end_date, upgrades_json) 
                      VALUES (?, ?, ?, ?, ?, ?, ?);`,
                args: [
                    phoenixName,
                    finalRank.name,
                    finalRank.level,
                    currentStreakMs,
                    state.lastRelapse,
                    endDate.toISOString(),
                    state.upgrades
                ]
            });
        }
        // --- End Archiving ---

        const newLongestStreak = Math.max(state.longestStreak, currentStreakMs);
        const newRelapseCount = state.relapseCount + 1;
        
        // Reset state for the new streak
        await db.execute({
            sql: `UPDATE user_state 
                  SET lastRelapse = ?, longestStreak = ?, relapseCount = ?, coinsAtLastRelapse = 0, lastClaimedLevel = 0 
                  WHERE id = 1;`,
            args: [endDate.toISOString(), newLongestStreak, newRelapseCount]
        });

        const { rows: updatedRows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
        res.status(200).json(updatedRows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to process relapse.' });
    }
}
