import db from './db.js';
import { checkAuth } from './auth.js';
import { ranks, getRank } from './ranks.js'; // Import getRank

// Helper to parse JSON from the request body (no changes)
async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => resolve(body ? JSON.parse(body) : {}));
    req.on('error', err => reject(err));
  });
}

// Load shop items from database (no changes)
async function loadShopDataFromDb() {
    const itemsResult = await db.execute("SELECT * FROM shop_items WHERE is_active = true ORDER BY sort_order, id;");
    const imagesResult = await db.execute("SELECT * FROM shop_item_images ORDER BY item_id, sort_order;");
    
    const imagesByItem = imagesResult.rows.reduce((acc, image) => {
        if (!acc[image.item_id]) acc[image.item_id] = [];
        acc[image.item_id].push(image);
        return acc;
    }, {});
    
    const shopItems = itemsResult.rows.map(item => ({ ...item, images: imagesByItem[item.id] || [] }));
    
    const treeTypes = shopItems.filter(i => i.type === 'tree_sapling').reduce((acc, tree) => {
        acc[tree.id] = { ...tree, stages: tree.images };
        return acc;
    }, {});

    return { shopItems, treeTypes };
}

export default async function handler(req, res) {
    if (!checkAuth(req)) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (req.method === 'GET') {
        // GET logic remains the same
        try {
            const { shopItems, treeTypes } = await loadShopDataFromDb();
            res.status(200).json({ shopItems, treeTypes });
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch shop data.' });
        }
    } else if (req.method === 'POST') {
        try {
            const { action, itemId, equip } = await parseJsonBody(req);
            const { rows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
            let state = rows[0];

            if (action === 'buy') {
                const { shopItems } = await loadShopDataFromDb();
                const item = shopItems.find(i => i.id === itemId);
                if (!item) return res.status(404).json({ message: 'Item not found.' });

                // --- START: CORRECT COIN DEDUCTION LOGIC ---

                // 1. Calculate all components of the user's total coins, just like the original logic.
                const totalHours = (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60);
                const currentRank = getRank(totalHours);
                const lastClaimedLevel = state.lastClaimedLevel || 0;

                // 2. Find any rewards that have been earned but not yet claimed.
                let unclaimedRewards = 0;
                if (currentRank.level > lastClaimedLevel) {
                    for (let i = lastClaimedLevel + 1; i <= currentRank.level; i++) {
                        if (ranks[i] && ranks[i].reward) {
                            unclaimedRewards += ranks[i].reward;
                        }
                    }
                }
                
                // 3. Calculate dynamic streak coins.
                const streakCoins = totalHours > 0 ? Math.floor(10 * Math.pow(totalHours, 1.2)) : 0;
                
                // 4. Calculate the true total purchasing power.
                const totalAvailableCoins = (state.coinsAtLastRelapse || 0) + streakCoins + unclaimedRewards;

                // 5. Check if the user can afford the item.
                if (totalAvailableCoins < item.cost) {
                    return res.status(400).json({ message: 'Not enough coins.' });
                }

                // 6. This is the crucial fix: Calculate the new base coin value.
                // We add any unclaimed rewards to the permanent balance, then subtract the item's cost.
                // This "claims" the rewards and spends them in a single, correct transaction.
                const newCoinsAtLastRelapse = (state.coinsAtLastRelapse + unclaimedRewards) - item.cost;
                const newLastClaimedLevel = currentRank.level;

                // --- END: CORRECT COIN DEDUCTION LOGIC ---

                // Add the purchased item to the appropriate table (forest or upgrades)
                if (item.type === 'tree_sapling') {
                    await db.execute({
                        sql: "INSERT INTO forest (treeType, status, purchaseDate, matureDate) VALUES (?, 'growing', ?, ?)",
                        args: [item.id, new Date().toISOString(), new Date(Date.now() + item.growth_hours * 3600 * 1000).toISOString()]
                    });
                } else {
                    let ownedUpgrades = JSON.parse(state.upgrades || '{}');
                    ownedUpgrades[itemId] = true;
                    await db.execute({
                        sql: "UPDATE user_state SET upgrades = ? WHERE id = 1",
                        args: [JSON.stringify(ownedUpgrades)]
                    });
                }
                
                // Update the database with the new, correctly calculated base coin balance and the new claimed level.
                await db.execute({
                    sql: "UPDATE user_state SET coinsAtLastRelapse = ?, lastClaimedLevel = ? WHERE id = 1",
                    args: [newCoinsAtLastRelapse, newLastClaimedLevel]
                });

                // Fetch the fully updated state to send back to the client
                const { rows: updatedStateRows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
                const { rows: forestRows } = await db.execute("SELECT * FROM forest ORDER BY purchaseDate DESC;");
                const updatedState = { ...updatedStateRows[0], forest: forestRows };

                return res.status(200).json({ success: true, message: `${item.name} purchased!`, userState: updatedState });

            } else if (action === 'equip') {
                // Equip logic remains the same
                 let equippedUpgrades = JSON.parse(state.equipped_upgrades || '{}');
                 if (equip) {
                    const { shopItems } = await loadShopDataFromDb();
                    const skins = shopItems.filter(i => i.type === 'phoenix_skin');
                    skins.forEach(skin => equippedUpgrades[skin.id] = false);
                 }
                 equippedUpgrades[itemId] = equip;

                 await db.execute({
                     sql: "UPDATE user_state SET equipped_upgrades = ? WHERE id = 1",
                     args: [JSON.stringify(equippedUpgrades)]
                 });
                const { rows: updatedStateRows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
                return res.status(200).json({ success: true, userState: updatedStateRows[0] });
            }
            res.status(400).json({ message: 'Invalid action.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to process request.' });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}

