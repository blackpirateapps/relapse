import db, { initDb } from './db.js';
import { checkAuth } from './auth.js';

// Ranks data is needed on the server to calculate rewards
const ranks = [
    { name: "Ashen Egg I", id: "egg", hours: 0, reward: 0 }, { name: "Ashen Egg II", id: "egg", hours: 6, reward: 50 }, { name: "Ashen Egg III", id: "egg", hours: 12, reward: 100 },
    { name: "Fledgling Hatchling", id: "hatchling", hours: 24, reward: 250 }, { name: "Ember Glance", id: "hatchling", hours: 36, reward: 150 }, { name: "First Steps", id: "hatchling", hours: 48, reward: 200 },
    { name: "Ember Chick", id: "chick", hours: 72, reward: 500 }, { name: "Warmth of Will", id: "chick", hours: 120, reward: 300 },
    { name: "Flame Youngling", id: "youngling", hours: 168, reward: 1000 }, { name: "Spark of Defiance", id: "youngling", hours: 240, reward: 750 },
    { name: "Sunfire Phoenix", id: "sunfire", hours: 336, reward: 2000 }, { name: "Blinding Light", id: "sunfire", hours: 500, reward: 1500 },
    { name: "Blaze Guardian", id: "guardian", hours: 720, reward: 4000 }, { name: "Vigilant Stance", id: "guardian", hours: 1440, reward: 3000 },
    { name: "Solar Drake", id: "drake", hours: 2160, reward: 8000 },
    { name: "Celestial Phoenix", id: "celestial-phoenix", hours: 4320, reward: 15000 }
];

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
