import db, { initDb } from './db.js';
import { checkAuth } from './auth.js';
import { ranks, getRank } from './ranks.js';

// Helper to parse JSON from the request body
async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => resolve(body ? JSON.parse(body) : {}));
    req.on('error', err => reject(err));
  });
}

// Loads all active shop items and their images from the database
// THIS FUNCTION IS NOW CORRECTED to build the detailed treeTypes object
async function loadShopDataFromDb() {
    const itemsResult = await db.execute("SELECT * FROM shop_items WHERE is_active = true ORDER BY sort_order, id;");
    const imagesResult = await db.execute("SELECT * FROM shop_item_images ORDER BY item_id, sort_order;");
    
    const imagesByItem = imagesResult.rows.reduce((acc, image) => {
        if (!acc[image.item_id]) acc[image.item_id] = [];
        acc[image.item_id].push(image);
        return acc;
    }, {});
    
    const shopItems = itemsResult.rows.map(item => ({ ...item, images: imagesByItem[item.id] || [] }));
    
    // Specifically format tree data, including the 'stages' array for the frontend
    const treeTypes = shopItems
        .filter(i => i.type === 'tree_sapling')
        .reduce((acc, tree) => {
            acc[tree.id] = { 
                ...tree, 
                witheredImage: tree.withered_image, // Pass the withered image URL
                stages: tree.images
                    .filter(img => img.image_type === 'growth_stage')
                    .map(img => ({
                        status: img.stage_name,
                        hours: img.stage_hours,
                        image: img.image_url
                    }))
            };
            return acc;
        }, {});

    return { shopItems, treeTypes };
}


// Main handler function - handles both GET and POST requests
export default async function handler(req, res) {
  if (!checkAuth(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  await initDb();

  if (req.method === 'GET') {
    return handleGetShop(req, res);
  } else if (req.method === 'POST') {
    return handleShopAction(req, res);
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}

// Handles GET requests
async function handleGetShop(req, res) {
  try {
    const { shopItems, treeTypes } = await loadShopDataFromDb();
    res.status(200).json({ shopItems, treeTypes });
  } catch (error) {
    console.error('Shop GET Error:', error);
    res.status(500).json({ message: 'Failed to fetch shop data.' });
  }
}

// Handles POST requests (buy/equip)
async function handleShopAction(req, res) {
  try {
    const body = await parseJsonBody(req);
    const { action, itemId, equip, x, y, treeId } = body;

    if (action === 'buy') {
      return handlePurchase(itemId, res, { x, y });
    } else if (action === 'equip') {
      return handleEquipment(itemId, equip, res);
    } else if (action === 'move_tree') {
      return handleTreeMove(treeId, x, y, res);
    } else {
      return res.status(400).json({ message: 'Invalid action.' });
    }
  } catch (error) {
    console.error('Shop POST Error:', error);
    res.status(500).json({ message: 'Failed to process request.' });
  }
}

async function handleTreeMove(treeId, x, y, res) {
  try {
    if (!treeId || typeof x !== 'number' || typeof y !== 'number') {
      return res.status(400).json({ message: 'Invalid tree position.' });
    }
    const posX = Math.max(0.05, Math.min(0.95, x));
    const posY = Math.max(0.08, Math.min(0.92, y));
    await db.execute({
      sql: "UPDATE forest SET x = ?, y = ? WHERE id = ?;",
      args: [posX, posY, treeId]
    });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Tree Move Error:', error);
    return res.status(500).json({ message: 'Failed to move tree.' });
  }
}

// Handles the logic for purchasing an item
async function handlePurchase(itemId, res, position = {}) {
  try {
    const itemResult = await db.execute({
      sql: "SELECT * FROM shop_items WHERE id = ? AND is_active = true;",
      args: [itemId]
    });
    
    if (itemResult.rows.length === 0) return res.status(404).json({ message: 'Item not found.' });
    const item = itemResult.rows[0];

    const { rows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
    if (rows.length === 0) return res.status(404).json({ message: 'User state not found.' });
    const state = rows[0];

    const totalHours = (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60);
    const streakCoins = Math.floor(10 * Math.pow(totalHours > 0 ? totalHours : 0, 1.2));
    const currentRank = getRank(totalHours);
    const lastClaimedLevel = state.lastClaimedLevel || 0;

    let unclaimedLevelReward = 0;
    if (currentRank.level > lastClaimedLevel) {
      for (let i = lastClaimedLevel + 1; i <= currentRank.level; i++) {
        if (ranks[i] && typeof ranks[i].reward === 'number') {
          unclaimedLevelReward += ranks[i].reward;
        }
      }
    }

    const totalAvailableCoins = state.coinsAtLastRelapse + streakCoins + unclaimedLevelReward;
    if (totalAvailableCoins < item.cost) {
      return res.status(400).json({ message: 'Cannot afford item.' });
    }

    const finalCoinBalance = totalAvailableCoins - item.cost;
    const newCoinsAtLastRelapse = finalCoinBalance - streakCoins;
    const newLastClaimedLevel = currentRank.level;

    if (item.type === 'potion') {
      const now = new Date();
      const lastPurchaseAt = state.potion_last_purchase_at ? new Date(state.potion_last_purchase_at) : null;
      const purchasesThisStreak = Number(state.potion_purchases_this_streak || 0);
      const minDelayMs = 2 * 24 * 60 * 60 * 1000;

      if (purchasesThisStreak >= 2) {
        return res.status(400).json({ message: 'Potion purchase limit reached for this streak.' });
      }
      if (lastPurchaseAt && now.getTime() - lastPurchaseAt.getTime() < minDelayMs) {
        return res.status(400).json({ message: 'Potion can only be purchased once every 2 days.' });
      }

      const inventory = Number(state.potion_inventory || 0) + 1;
      await db.execute({
        sql: "UPDATE user_state SET potion_inventory = ?, potion_last_purchase_at = ?, potion_purchases_this_streak = ? WHERE id = 1;",
        args: [inventory, now.toISOString(), purchasesThisStreak + 1]
      });
    } else if (item.type === 'tree_sapling') {
      const purchaseDate = new Date();
      const matureDate = new Date(purchaseDate.getTime() + item.growth_hours * 60 * 60 * 1000);
      const posX = typeof position.x === 'number' ? Math.max(0.05, Math.min(0.95, position.x)) : 0.5;
      const posY = typeof position.y === 'number' ? Math.max(0.08, Math.min(0.92, position.y)) : 0.6;
      await db.execute({
        sql: "INSERT INTO forest (treeType, status, purchaseDate, matureDate, x, y) VALUES (?, 'growing', ?, ?, ?, ?);",
        args: [item.id, purchaseDate.toISOString(), matureDate.toISOString(), posX, posY]
      });
    } else {
      let upgrades = JSON.parse(state.upgrades || '{}');
      if (upgrades[itemId]) return res.status(400).json({ message: 'Item already owned.' });
      upgrades[itemId] = { purchasedAt: new Date().toISOString() };
      await db.execute({ sql: "UPDATE user_state SET upgrades = ? WHERE id = 1", args: [JSON.stringify(upgrades)] });
    }

    // Leave dynamic price as-is for relapse-rebuy skin
    
    await db.execute({
      sql: "UPDATE user_state SET coinsAtLastRelapse = ?, lastClaimedLevel = ? WHERE id = 1;",
      args: [newCoinsAtLastRelapse, newLastClaimedLevel]
    });

    const { rows: updatedStateRows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
    const { rows: forestRows } = await db.execute("SELECT * FROM forest ORDER BY purchaseDate DESC;");
    
    return res.status(200).json({
      success: true,
      message: `${item.name} purchased successfully!`,
      userState: updatedStateRows[0],
      forest: forestRows
    });

  } catch (error) {
    console.error('Purchase Error:', error);
    return res.status(500).json({ message: 'Failed to process purchase.' });
  }
}

// Handles equipping/unequipping items
async function handleEquipment(itemId, equip, res) {
  try {
    const { rows } = await db.execute("SELECT upgrades, equipped_upgrades FROM user_state WHERE id = 1;");
    if (rows.length === 0) return res.status(404).json({ message: 'State not found.' });

    const state = rows[0];
    const ownedUpgrades = JSON.parse(state.upgrades || '{}');
    let equippedUpgrades = JSON.parse(state.equipped_upgrades || '{}');

    if (!ownedUpgrades[itemId]) return res.status(400).json({ message: 'Item not owned.' });

    const itemResult = await db.execute({ sql: "SELECT * FROM shop_items WHERE id = ?;", args: [itemId] });
    const item = itemResult.rows[0];
    
    if (equip && item && item.type === 'phoenix_skin') {
      const skinResult = await db.execute("SELECT id FROM shop_items WHERE type = 'phoenix_skin';");
      for (const skin of skinResult.rows) {
        equippedUpgrades[skin.id] = false;
      }
    }

    if (equip && item && item.type === 'background_theme') {
      const themeResult = await db.execute("SELECT id FROM shop_items WHERE type = 'background_theme';");
      for (const theme of themeResult.rows) {
        equippedUpgrades[theme.id] = false;
      }
    }

    if (equip && item && item.type === 'forest_theme') {
      const forestResult = await db.execute("SELECT id FROM shop_items WHERE type = 'forest_theme';");
      for (const theme of forestResult.rows) {
        equippedUpgrades[theme.id] = false;
      }
    }

    if (equip && item && item.type === 'phoenix_aura') {
      const auraResult = await db.execute("SELECT id FROM shop_items WHERE type = 'phoenix_aura';");
      for (const aura of auraResult.rows) {
        equippedUpgrades[aura.id] = false;
      }
    }
    
    equippedUpgrades[itemId] = equip;

    await db.execute({
      sql: "UPDATE user_state SET equipped_upgrades = ? WHERE id = 1;",
      args: [JSON.stringify(equippedUpgrades)]
    });

    const { rows: updatedRows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
    
    return res.status(200).json({
      success: true,
      message: `${item?.name || 'Item'} ${equip ? 'equipped' : 'unequipped'}!`,
      userState: updatedRows[0]
    });

  } catch (error) {
    console.error('Equipment Error:', error);
    return res.status(500).json({ message: 'Failed to update equipment.' });
  }
}
