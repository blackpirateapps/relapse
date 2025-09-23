import db from './db.js';
import { checkAuth } from './auth.js';
import { ranks } from './ranks.js';

// IMPORTANT: This shopItems array must be kept in sync with the one in shared.js.
// The server uses this list to validate item IDs and costs, preventing users from manipulating prices on the client-side.
const shopItems = [
    // --- PHOENIX SKINS ---
    {
        id: 'bluePhoenix',
        name: 'Blue Phoenix',
        cost: 2500,
        type: 'phoenix_skin'
    },
    {
        id: 'greenPhoenix',
        name: 'Verdant Phoenix',
        cost: 4000,
        type: 'phoenix_skin'
    },

    // --- THEMES ---
    { id: 'volcanicLair', name: 'Volcanic Lair', cost: 10000, type: 'theme' },
    { id: 'celestialSky', name: 'Celestial Sky', cost: 50000, type: 'theme' }
];

function getRank(totalHours) {
    // Find the highest rank achieved for the given hours
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
            return res.status(404).json({ message: 'Item not found in server shop list.' });
        }

        const { rows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User state not found.' });
        }
        
        let state = rows[0];
        let upgrades = JSON.parse(state.upgrades || '{}');
        let equippedUpgrades = JSON.parse(state.equipped_upgrades || '{}');

        // Server-side calculation of total available coins to prevent cheating
        const totalHours = (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60);
        const streakCoins = Math.floor(10 * Math.pow(totalHours, 1.2));
        const currentRank = getRank(totalHours);
        const lastClaimedLevel = state.lastClaimedLevel || 0;
        let unclaimedLevelReward = 0;
        
        // Calculate any rewards for ranks the user has passed but not yet claimed
        if (currentRank.level > lastClaimedLevel) {
             for (let i = lastClaimedLevel + 1; i <= currentRank.level; i++) {
                // Ensure ranks[i] exists to prevent errors
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
            // Calculate new coin balance. We need to "cash in" the streak coins and rewards.
            // The new `coinsAtLastRelapse` will be the remainder after purchase.
            const newCoinBalance = totalAvailableCoins - item.cost;
            upgrades[itemId] = true; // Mark item as owned

            // Auto-equip the new item
            // If it's a skin, unequip all other skins first to ensure only one is active
            if (item.type === 'phoenix_skin') {
                shopItems.forEach(shopItem => {
                    if (shopItem.type === 'phoenix_skin') {
                        equippedUpgrades[shopItem.id] = false;
                    }
                });
            }
            equippedUpgrades[itemId] = true;

            // When a purchase happens, the current streak's value is "cashed in".
            // The `lastRelapse` date is reset to now, and `coinsAtLastRelapse` is set to the new balance.
            // This prevents the same streak from being used to fund multiple purchases.
            await db.execute({
                sql: "UPDATE user_state SET coinsAtLastRelapse = ?, upgrades = ?, lastRelapse = ?, lastClaimedLevel = ?, equipped_upgrades = ? WHERE id = 1;",
                args: [ newCoinBalance, JSON.stringify(upgrades), new Date().toISOString(), currentRank.level, JSON.stringify(equippedUpgrades) ]
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
