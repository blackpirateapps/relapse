import db, { initDb } from './db.js';
import { checkAuth } from './auth.js';
import { ranks } from './ranks.js'; // Import from the new shared file

function getRank(totalHours) {
    for (let i = ranks.length - 1; i >= 0; i--) {
        if (totalHours >= ranks[i].hours) return { ...ranks[i], level: i };
    }
    return { ...ranks[0], level: 0 };
}

export default async function handler(req, res) {
    if (!checkAuth(req)) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    await initDb();

    try {
        const { rows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
        if (rows.length > 0) {
            let state = rows[0];

            // --- Server-side Reward Calculation ---
            const totalHours = (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60);
            const currentRank = getRank(totalHours);
            const lastClaimedLevel = state.lastClaimedLevel || 0;
            let totalReward = 0;

            if (currentRank.level > lastClaimedLevel) {
                // User has leveled up. Calculate rewards for all missed levels.
                for (let i = lastClaimedLevel + 1; i <= currentRank.level; i++) {
                    totalReward += ranks[i].reward;
                }

                if (totalReward > 0) {
                    const newCoinBalance = state.coinsAtLastRelapse + totalReward;
                    await db.execute({
                        sql: "UPDATE user_state SET coinsAtLastRelapse = ?, lastClaimedLevel = ? WHERE id = 1;",
                        args: [newCoinBalance, currentRank.level]
                    });
                    
                    // Update the state object we're about to send to the user
                    state.coinsAtLastRelapse = newCoinBalance;
                    state.lastClaimedLevel = currentRank.level;
                }
            }
            // --- End Reward Logic ---

            res.status(200).json(state);
        } else {
            res.status(404).json({ message: 'State not found.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch state from database.' });
    }
}

