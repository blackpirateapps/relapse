import db from './db.js';
import { checkAuth } from './auth.js';
import { ranks } from './ranks.js';

// The shopItems list is now defined directly here.
const shopItems = [
    { id: 'bluePhoenix', name: 'Blue Phoenix', cost: 1500, type: 'phoenix_skin' },
    { id: 'greenPhoenix', name: 'Verdant Phoenix', cost: 4000, type: 'phoenix_skin' },
    { id: 'volcanicLair', name: 'Volcanic Lair', cost: 10000, type: 'theme' },
    { id: 'celestialSky', name: 'Celestial Sky', cost: 50000, type: 'theme' }
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
        if (!item) {
            return res.status(404).json({ message: 'Item not found.' });
        }

        const { rows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User state not found.' });
        }
        
        const state = rows[0];
        let upgrades = JSON.parse(state.upgrades || '{}');
        let equippedUpgrades = JSON.parse(state.equipped_upgrades || '{}');

        const totalHours = (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60);
        const streakCoins = Math.floor(10 * Math.pow(totalHours > 0 ? totalHours : 0, 1.2));
        const currentRank = getRank(totalHours);
        const lastClaimedLevel = state.lastClaimedLevel || 0;
        let unclaimedLevelReward = 0;
        
        if (currentRank.level > lastClaimedLevel) {
             for (let i = lastClaimedLevel + 1; i <= currentRank.level; i++) {
                if(ranks[i] && typeof ranks[i].reward === 'number') {
                    unclaimedLevelReward += ranks[i].reward;
                }
            }
        }
        
        const totalAvailableCoins = state.coinsAtLastRelapse + streakCoins + unclaimedLevelReward;

        if (upgrades[itemId]) {
            return res.status(400).json({ message: 'Item already owned.' });
        }

        if (totalAvailableCoins >= item.cost) {
            const finalCoinBalance = totalAvailableCoins - item.cost;
            const newCoinsAtLastRelapse = finalCoinBalance - streakCoins;

            upgrades[itemId] = true;
            
            const purchasedItem = shopItems.find(i => i.id === itemId);
            if (purchasedItem.type === 'phoenix_skin') {
                shopItems.forEach(shopItem => {
                    if (shopItem.type === 'phoenix_skin') {
                        equippedUpgrades[shopItem.id] = false;
                    }
                });
            }
            equippedUpgrades[itemId] = true;
            
            await db.execute({
                sql: "UPDATE user_state SET coinsAtLastRelapse = ?, upgrades = ?, lastClaimedLevel = ?, equipped_upgrades = ? WHERE id = 1;",
                args: [ newCoinsAtLastRelapse, JSON.stringify(upgrades), currentRank.level, JSON.stringify(equippedUpgrades) ]
            });
            
            const { rows: updatedRows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
            res.status(200).json(updatedRows[0]);
        } else {
            res.status(400).json({ message: 'Cannot afford item.' });
        }

    } catch (error) {
        console.error('Purchase Error:', error);
        res.status(500).json({ message: 'Failed to process purchase.' });
    }
}

