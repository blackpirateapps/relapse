import db from './db.js';
import { checkAuth } from './auth.js';
import { ranks } from './ranks.js';

// Helper to parse JSON from the request body
async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => resolve(body ? JSON.parse(body) : {}));
    req.on('error', err => reject(err));
  });
}

// Load shop items from database
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

                const totalHours = (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60);
                const streakCoins = Math.floor(10 * Math.pow(totalHours, 1.2));
                const totalCoins = (state.coinsAtLastRelapse || 0) + streakCoins;
                
                if (totalCoins < item.cost) return res.status(400).json({ message: 'Not enough coins.' });
                
                let newCoins = state.coinsAtLastRelapse - item.cost;
                if (newCoins < 0) {
                   newCoins = 0;
                }

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
                
                await db.execute({
                    sql: "UPDATE user_state SET coinsAtLastRelapse = ? WHERE id = 1",
                    args: [newCoins]
                });

                const { rows: updatedStateRows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
                const { rows: forestRows } = await db.execute("SELECT * FROM forest ORDER BY purchaseDate DESC;");
                const updatedState = { ...updatedStateRows[0], forest: forestRows };


                return res.status(200).json({ success: true, message: `${item.name} purchased!`, userState: updatedState });

            } else if (action === 'equip') {
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

