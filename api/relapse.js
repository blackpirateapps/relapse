import db from './db.js';
import { checkAuth } from './auth.js';

export default async function handler(req, res) {
    if (req.method !== 'POST' || !checkAuth(req)) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        // Get current state
        const { rows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
        if (rows.length === 0) return res.status(404).json({ message: 'State not found.' });
        
        let state = rows[0];
        
        const lastRelapseDate = new Date(state.lastRelapse);
        const currentStreak = Date.now() - lastRelapseDate.getTime();
        
        if (currentStreak > state.longestStreak) {
            state.longestStreak = currentStreak;
        }

        const totalHours = currentStreak / (1000 * 60 * 60);
        const streakCoins = Math.floor(10 * Math.pow(totalHours, 1.2));
        
        let currentTotalCoins = state.coinsAtLastRelapse + streakCoins;
        const penalty = 150;
        currentTotalCoins = Math.max(0, currentTotalCoins - penalty);

        const newLastRelapse = new Date().toISOString();
        const newRelapseCount = state.relapseCount + 1;
        
        // Update DB
        await db.execute({
            sql: "UPDATE user_state SET lastRelapse = ?, longestStreak = ?, relapseCount = ?, coinsAtLastRelapse = ? WHERE id = 1;",
            args: [newLastRelapse, state.longestStreak, newRelapseCount, currentTotalCoins]
        });

        // Return new state
        const { rows: updatedRows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
        res.status(200).json(updatedRows[0]);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to process relapse.' });
    }
}
