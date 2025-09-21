import db from './db.js';
import { checkAuth } from './auth.js';

const shopItems = [
    { id: 'aura', cost: 500 },
    { id: 'celestialFlames', cost: 1200 },
    { id: 'volcanicLair', cost: 10000 },
    { id: 'celestialSky', cost: 50000 },
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
        const streakCoins = Math.floor(10 * Math.pow(totalHours, 1.2));
        const totalCoins = state.coinsAtLastRelapse + streakCoins;

        if (totalCoins >= item.cost && !upgrades[itemId]) {
            // Recalculate coins at the exact moment of purchase
            const currentStreakMs = Date.now() - new Date(state.lastRelapse).getTime();
            const currentTotalHours = currentStreakMs / (1000 * 60 * 60);
            const currentStreakCoins = Math.floor(10 * Math.pow(currentTotalHours, 1.2));
            const currentTotalCoins = state.coinsAtLastRelapse + currentStreakCoins;

            const newCoinBalance = currentTotalCoins - item.cost;
            upgrades[itemId] = true;

            // Update state with a new "lastRelapse" timestamp (which is just now)
            // and the new coin balance, effectively "banking" the coins.
            await db.execute({
                sql: "UPDATE user_state SET lastRelapse = ?, coinsAtLastRelapse = ?, upgrades = ? WHERE id = 1;",
                args: [new Date().toISOString(), newCoinBalance, JSON.stringify(upgrades)]
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
