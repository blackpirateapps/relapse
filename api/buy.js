import db from './db.js';
import { checkAuth } from './auth.js';
import { ranks } from './ranks.js'; // Assuming ranks are in a shared file

const shopItems = [
    { id: 'aura', cost: 500 },
    { id: 'celestialFlames', cost: 1200 },
    { id: 'volcanicLair', cost: 10000 },
    { id: 'celestialSky', cost: 50000 },
    { id: 'navStyle', cost: 500 } // Add this line
];

export default async function handler(req, res) {
    if (req.method !== 'POST' || !checkAuth(req)) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const { itemId } = req.body;
        const item = shopItems.find(i => i.id === itemId);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        const { rows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
        if (rows.length === 0) return res.status(404).json({ message: 'State not found.' });
        
        let state = rows[0];
        let upgrades = JSON.parse(state.upgrades);

        const streakMs = Date.now() - new Date(state.lastRelapse).getTime();
        const totalHours = streakMs / (1000 * 60 * 60);
        
        // Calculate total coins (streak coins + level rewards)
        const currentRank = ranks.slice().reverse().find(r => totalHours >= r.hours);
        const lastClaimedRankLevel = state.lastClaimedLevel || 0;
        let levelUpReward = 0;
        if (currentRank && currentRank.level > lastClaimedRankLevel) {
             for (let i = lastClaimedRankLevel + 1; i <= currentRank.level; i++) {
                levelUpReward += ranks[i].reward;
            }
        }
        
        const streakCoins = Math.floor(10 * Math.pow(totalHours, 1.2));
        const totalCoins = state.coinsAtLastRelapse + streakCoins + levelUpReward;

        if (totalCoins >= item.cost && !upgrades[itemId]) {
            const newCoinBalance = totalCoins - item.cost;
            upgrades[itemId] = true;

            const newLastRelapse = new Date().toISOString();
            
            // On purchase, we "bank" the current streak coins and reset the timer from now
            // This prevents issues with coin calculation after purchase
            await db.execute({
                sql: "UPDATE user_state SET lastRelapse = ?, coinsAtLastRelapse = ?, upgrades = ? WHERE id = 1;",
                args: [newLastRelapse, newCoinBalance, JSON.stringify(upgrades)]
            });
            
            const { rows: updatedRows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
            res.status(200).json(updatedRows[0]);
        } else {
            res.status(400).json({ message: 'Cannot afford item or already owned.' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to process purchase.' });
    }
}

