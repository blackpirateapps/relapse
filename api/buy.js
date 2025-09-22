import db from './db.js';
import { checkAuth } from './auth.js';
import { ranks } from './ranks.js'; // Ensure you have api/ranks.js from previous steps

const shopItems = [
    { id: 'aura', cost: 500 },
    { id: 'celestialFlames', cost: 1200 },
    { id: 'volcanicLair', cost: 10000 },
    { id: 'celestialSky', cost: 50000 },
    { id: 'navStyle', cost: 500 }
];

// Helper function to find the current rank based on hours
function getRank(totalHours) {
    // Find the highest rank achieved
    return ranks.slice().reverse().find(r => totalHours >= r.hours) || ranks[0];
}

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

        // --- 1. Calculate Total Available Coins ---
        const totalHours = (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60);
        
        // Coins from the current streak
        const streakCoins = Math.floor(10 * Math.pow(totalHours, 1.2));
        
        // Coins from any unclaimed level-up rewards
        const currentRank = getRank(totalHours);
        const lastClaimedLevel = state.lastClaimedLevel || 0;
        let unclaimedLevelReward = 0;
        if (currentRank.level > lastClaimedLevel) {
             for (let i = lastClaimedLevel + 1; i <= currentRank.level; i++) {
                unclaimedLevelReward += ranks[i].reward;
            }
        }
        
        const totalAvailableCoins = state.coinsAtLastRelapse + streakCoins + unclaimedLevelReward;

        // --- 2. Check Affordability and Ownership ---
        if (totalAvailableCoins >= item.cost && !upgrades[itemId]) {
            const newCoinBalance = totalAvailableCoins - item.cost;
            upgrades[itemId] = true;

            // --- 3. Update Database ---
            // This "banks" the current progress by setting the new balance and resetting the relapse/banking date to now.
            await db.execute({
                sql: "UPDATE user_state SET coinsAtLastRelapse = ?, upgrades = ?, lastRelapse = ?, lastClaimedLevel = ? WHERE id = 1;",
                args: [
                    newCoinBalance, 
                    JSON.stringify(upgrades), 
                    new Date().toISOString(), // Reset the coin-earning timer
                    currentRank.level // Mark all levels as claimed
                ]
            });
            
            const { rows: updatedRows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
            res.status(200).json(updatedRows[0]);
        } else {
            // Determine the correct error message
            let errorMessage = 'Cannot afford item.';
            if (upgrades[itemId]) {
                errorMessage = 'Item already owned.';
            }
            res.status(400).json({ message: errorMessage });
        }

    } catch (error) {
        console.error('Purchase Error:', error);
        res.status(500).json({ message: 'Failed to process purchase.' });
    }
}

