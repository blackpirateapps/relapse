import db from './db.js';
import { checkAuth } from './auth.js';
import { ranks, getRank } from './ranks.js'; // Use centralized ranks and getRank

// Helper to parse JSON from the request body
async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => resolve(body ? JSON.parse(body) : {}));
    req.on('error', err => reject(err));
  });
}

// Main handler function - handles both GET and POST requests
export default async function handler(req, res) {
  if (!checkAuth(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    return handleShopAction(req, res);
  } else {
    // For simplicity, the GET logic is now implicitly handled by the frontend's initial state fetch.
    // If a dedicated GET /api/shop is needed, that logic can be re-added here.
    return res.status(405).json({ message: 'Method Not Allowed for GET' });
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

// Handle item purchases - LOGIC DIRECTLY ADAPTED FROM YOUR FILE
async function handlePurchase(itemId, res) {
  try {
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

    // --- START: CORRECT COIN CALCULATION (FROM YOUR FILE) ---
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
    
    // This is the crucial logic: The new permanent balance is the final balance minus the volatile streak coins.
    const finalCoinBalance = totalAvailableCoins - item.cost;
    const newCoinsAtLastRelapse = finalCoinBalance - streakCoins;
    const newLastClaimedLevel = currentRank.level;
    // --- END: CORRECT COIN CALCULATION ---

    // Handle different item types
    if (item.type === 'tree_sapling') {
      const purchaseDate = new Date();
      const matureDate = new Date(purchaseDate.getTime() + item.growth_hours * 60 * 60 * 1000);
      await db.execute({
        sql: "INSERT INTO forest (treeType, status, purchaseDate, matureDate) VALUES (?, 'growing', ?, ?);",
        args: [item.id, purchaseDate.toISOString(), matureDate.toISOString()]
      });
    } else {
      let upgrades = JSON.parse(state.upgrades || '{}');
      if (upgrades[itemId]) {
        return res.status(400).json({ message: 'Item already owned.' });
      }
      upgrades[itemId] = true;
      await db.execute({
          sql: "UPDATE user_state SET upgrades = ? WHERE id = 1",
          args: [JSON.stringify(upgrades)]
      });
    }
    
    // Update the state with the new permanent coin balance and the new claimed level
    await db.execute({
      sql: "UPDATE user_state SET coinsAtLastRelapse = ?, lastClaimedLevel = ? WHERE id = 1;",
      args: [newCoinsAtLastRelapse, newLastClaimedLevel]
    });

    // Fetch and return the fully updated state to the client for a seamless UI update
    const { rows: updatedStateRows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
    const { rows: forestRows } = await db.execute("SELECT * FROM forest ORDER BY purchaseDate DESC;");
    
    res.status(200).json({
      success: true,
      message: `${item.name} purchased successfully!`,
      userState: updatedStateRows[0],
      forest: forestRows
    });

  } catch (error) {
    console.error('Purchase Error:', error);
    res.status(500).json({ message: 'Failed to process purchase.' });
  }
}

// Handle equipment changes - LOGIC DIRECTLY ADAPTED FROM YOUR FILE
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

    const itemResult = await db.execute({ sql: "SELECT * FROM shop_items WHERE id = ?;", args: [itemId] });
    const item = itemResult.rows[0];
    
    if (equip && item && item.type === 'phoenix_skin') {
      // If equipping a skin, unequip all other skins first
      const skinResult = await db.execute("SELECT id FROM shop_items WHERE type = 'phoenix_skin';");
      for (const skin of skinResult.rows) {
        equippedUpgrades[skin.id] = false;
      }
    }
    
    equippedUpgrades[itemId] = equip;

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