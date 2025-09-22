import db from './db.js';
import { checkAuth } from './auth.js';
import { ranks } from './ranks.js';

const shopItems = [
    { id: 'aura', cost: 500 }, { id: 'celestialFlames', cost: 1200 },
    { id: 'volcanicLair', cost: 10000 }, { id: 'celestialSky', cost: 50000 },
    { id: 'navStyle', cost: 500 }
];

function getRank(totalHours) {
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
        let upgrades = JSON.parse(state.upgrades || '{}');
        let equippedUpgrades = JSON.parse(state.equipped_upgrades || '{}');

        const totalHours = (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60);
        const streakCoins = Math.floor(10 * Math.pow(totalHours, 1.2));
        const currentRank = getRank(totalHours);
        const lastClaimedLevel = state.lastClaimedLevel || 0;
        let unclaimedLevelReward = 0;
        if (currentRank.level > lastClaimedLevel) {
             for (let i = lastClaimedLevel + 1; i <= currentRank.level; i++) {
                unclaimedLevelReward += ranks[i].reward;
            }
        }
        
        const totalAvailableCoins = state.coinsAtLastRelapse + streakCoins + unclaimedLevelReward;

        if (totalAvailableCoins >= item.cost && !upgrades[itemId]) {
            const newCoinBalance = totalAvailableCoins - item.cost;
            upgrades[itemId] = true;
            equippedUpgrades[itemId] = true; // Auto-equip the new item

            await db.execute({
                sql: "UPDATE user_state SET coinsAtLastRelapse = ?, upgrades = ?, lastRelapse = ?, lastClaimedLevel = ?, equipped_upgrades = ? WHERE id = 1;",
                args: [ newCoinBalance, JSON.stringify(upgrades), new Date().toISOString(), currentRank.level, JSON.stringify(equippedUpgrades) ]
            });
            
            const { rows: updatedRows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
            res.status(200).json(updatedRows[0]);
        } else {
            res.status(400).json({ message: upgrades[itemId] ? 'Item already owned.' : 'Cannot afford item.' });
        }

    } catch (error) {
        console.error('Purchase Error:', error);
        res.status(500).json({ message: 'Failed to process purchase.' });
    }
}

