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

function getRank(totalHours) {
  return ranks.slice().reverse().find(r => totalHours >= r.hours) || ranks[0];
}

// Load shop items from database
async function loadShopItems() {
  try {
    const itemsResult = await db.execute("SELECT * FROM shop_items WHERE is_active = true ORDER BY sort_order, id;");
    const imagesResult = await db.execute("SELECT * FROM shop_item_images ORDER BY item_id, sort_order;");
    
    const shopItems = [];
    const treeTypes = {};
    
    // Group images by item_id
    const imagesByItem = {};
    for (const image of imagesResult.rows) {
      if (!imagesByItem[image.item_id]) {
        imagesByItem[image.item_id] = [];
      }
      imagesByItem[image.item_id].push(image);
    }
    
    // Build shop items and tree types
    for (const item of itemsResult.rows) {
      const itemImages = imagesByItem[item.id] || [];
      
      if (item.type === 'tree_sapling') {
        // Build tree type object
        const stages = itemImages
          .filter(img => img.image_type === 'growth_stage')
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(img => ({
            status: img.stage_name,
            hours: img.stage_hours,
            image: img.image_url
          }));
          
        treeTypes[item.id] = {
          id: item.id,
          name: item.name,
          cost: item.cost,
          description: item.description,
          growthHours: item.growth_hours,
          stages,
          witheredImage: item.withered_image
        };
      }
      
      // Build shop item object
      const shopItem = {
        id: item.id,
        name: item.name,
        description: item.description,
        cost: item.cost,
        type: item.type,
        previewImage: item.preview_image
      };
      
      // Add images array for phoenix skins
      if (item.type === 'phoenix_skin') {
        shopItem.images = itemImages
          .filter(img => img.image_type === 'progression')
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(img => img.image_url);
      }
      
      // Add growth hours for trees
      if (item.type === 'tree_sapling') {
        shopItem.growthHours = item.growth_hours;
      }
      
      shopItems.push(shopItem);
    }
    
    return { shopItems, treeTypes };
  } catch (error) {
    console.error('Failed to load shop items:', error);
    return { shopItems: [], treeTypes: {} };
  }
}

// Main handler function - handles both GET and POST requests
export default async function handler(req, res) {
  if (!checkAuth(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // GET request - return shop data
    return handleGetShop(req, res);
  } else if (req.method === 'POST') {
    // POST request - handle purchases and equipment
    return handleShopAction(req, res);
  } else {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
}

// Handle GET requests - return shop data
async function handleGetShop(req, res) {
  try {
    const { rows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User state not found.' });
    }

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

    const totalCoins = state.coinsAtLastRelapse + streakCoins + unclaimedLevelReward;

    // Load shop data from database
    const { shopItems, treeTypes } = await loadShopItems();

    // Return shop data with user state
    res.status(200).json({
      shopItems,
      treeTypes,
      userState: {
        ...state,
        totalCoins,
        streakCoins,
        unclaimedLevelReward,
        currentRank,
        upgrades: JSON.parse(state.upgrades || '{}'),
        equipped_upgrades: JSON.parse(state.equipped_upgrades || '{}')
      }
    });
  } catch (error) {
    console.error('Shop GET Error:', error);
    res.status(500).json({ message: 'Failed to fetch shop data.' });
  }
}

// Handle POST requests - purchases and equipment changes
async function handleShopAction(req, res) {
  try {
    const body = await parseJsonBody(req);
    const { action, itemId, equip } = body;

    if (action === 'buy') {
      return handlePurchase(itemId, res);
    } else if (action === 'equip') {
      return handleEquipment(itemId, equip, res);
    } else {
      return res.status(400).json({ message: 'Invalid action.' });
    }
  } catch (error) {
    console.error('Shop POST Error:', error);
    res.status(500).json({ message: 'Failed to process request.' });
  }
}

// Handle item purchases
async function handlePurchase(itemId, res) {
  try {
    // Get item from database
    const itemResult = await db.execute({
      sql: "SELECT * FROM shop_items WHERE id = ? AND is_active = true;",
      args: [itemId]
    });
    
    if (itemResult.rows.length === 0) {
      return res.status(404).json({ message: 'Item not found.' });
    }
    
    const item = itemResult.rows[0];

    const { rows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User state not found.' });
    }

    const state = rows[0];

    // Calculate user's total coins
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

    // Handle different item types
    if (item.type === 'tree_sapling') {
      // Tree purchase logic
      await db.execute({
        sql: "UPDATE user_state SET coinsAtLastRelapse = ?, lastClaimedLevel = ? WHERE id = 1;",
        args: [newCoinsAtLastRelapse, currentRank.level]
      });

      const purchaseDate = new Date();
      const matureDate = new Date(purchaseDate.getTime() + item.growth_hours * 60 * 60 * 1000);

      await db.execute({
        sql: "INSERT INTO forest (treeType, status, purchaseDate, matureDate) VALUES (?, 'growing', ?, ?);",
        args: [item.id, purchaseDate.toISOString(), matureDate.toISOString()]
      });

      // Return updated state for trees
      const { rows: updatedRows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
      const { rows: forestRows } = await db.execute("SELECT * FROM forest ORDER BY purchaseDate DESC;");
      
      res.status(200).json({
        success: true,
        message: `${item.name} planted successfully!`,
        userState: updatedRows[0],
        forest: forestRows
      });

    } else {
      // Cosmetic item purchase logic
      let upgrades = JSON.parse(state.upgrades || '{}');
      if (upgrades[itemId]) {
        return res.status(400).json({ message: 'Item already owned.' });
      }

      upgrades[itemId] = true;
      let equippedUpgrades = JSON.parse(state.equipped_upgrades || '{}');

      // Auto-equip phoenix skins (unequip others)
      if (item.type === 'phoenix_skin') {
        // Get all phoenix skins to unequip them
        const skinResult = await db.execute("SELECT id FROM shop_items WHERE type = 'phoenix_skin';");
        for (const skin of skinResult.rows) {
          equippedUpgrades[skin.id] = false;
        }
      }

      equippedUpgrades[itemId] = true;

      await db.execute({
        sql: "UPDATE user_state SET coinsAtLastRelapse = ?, upgrades = ?, lastClaimedLevel = ?, equipped_upgrades = ? WHERE id = 1;",
        args: [newCoinsAtLastRelapse, JSON.stringify(upgrades), currentRank.level, JSON.stringify(equippedUpgrades)]
      });

      const { rows: updatedRows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
      
      res.status(200).json({
        success: true,
        message: `${item.name} purchased and equipped!`,
        userState: updatedRows[0]
      });
    }

  } catch (error) {
    console.error('Purchase Error:', error);
    res.status(500).json({ message: 'Failed to process purchase.' });
  }
}

// Handle equipment changes
async function handleEquipment(itemId, equip, res) {
  try {
    const { rows } = await db.execute("SELECT upgrades, equipped_upgrades FROM user_state WHERE id = 1;");
    if (rows.length === 0) {
      return res.status(404).json({ message: 'State not found.' });
    }

    let state = rows[0];
    let ownedUpgrades = JSON.parse(state.upgrades || '{}');
    let equippedUpgrades = JSON.parse(state.equipped_upgrades || '{}');

    if (!ownedUpgrades[itemId]) {
      return res.status(400).json({ message: 'Item not owned.' });
    }

    // Get item details from database
    const itemResult = await db.execute({
      sql: "SELECT * FROM shop_items WHERE id = ?;",
      args: [itemId]
    });
    const item = itemResult.rows[0];
    
    if (equip) {
      // Equipping - handle phoenix skin mutual exclusion
      if (item && item.type === 'phoenix_skin') {
        const skinResult = await db.execute("SELECT id FROM shop_items WHERE type = 'phoenix_skin';");
        for (const skin of skinResult.rows) {
          equippedUpgrades[skin.id] = false;
        }
      }
      equippedUpgrades[itemId] = true;
    } else {
      // Unequipping
      equippedUpgrades[itemId] = false;
    }

    await db.execute({
      sql: "UPDATE user_state SET equipped_upgrades = ? WHERE id = 1;",
      args: [JSON.stringify(equippedUpgrades)]
    });

    const { rows: updatedRows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
    
    res.status(200).json({
      success: true,
      message: `${item?.name || 'Item'} ${equip ? 'equipped' : 'unequipped'}!`,
      userState: updatedRows[0]
    });

  } catch (error) {
    console.error('Equipment Error:', error);
    res.status(500).json({ message: 'Failed to update equipment.' });
  }
}