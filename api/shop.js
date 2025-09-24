import db from './db.js';
import { checkAuth } from './auth.js';
import { ranks } from './ranks.js';

// INTEGRATED: Complete shop items list including trees
const shopItems = [
  { id: 'bluePhoenix', name: 'Blue Phoenix', cost: 1500, type: 'phoenix_skin' },
  { id: 'greenPhoenix', name: 'Verdant Phoenix', cost: 4000, type: 'phoenix_skin' },
  { id: 'volcanicLair', name: 'Volcanic Lair', cost: 10000, type: 'theme' },
  { id: 'celestialSky', name: 'Celestial Sky', cost: 50000, type: 'theme' },
  
  // Tree saplings for the forest shop
  { id: 'tree_of_tranquility', name: 'Tree of Tranquility', cost: 200, type: 'tree_sapling', growthHours: 24 },
  { id: 'ancient_oak', name: 'Ancient Oak', cost: 500, type: 'tree_sapling', growthHours: 48 }
];

// Tree configurations for forest shop
const treeTypes = {
  tree_of_tranquility: {
    id: 'tree_of_tranquility',
    name: 'Tree of Tranquility',
    cost: 200,
    description: 'A symbol of peace. Grows to maturity in 1 day, changing every 6 hours, if you do not relapse.',
    growthHours: 24,
    stages: [
      { status: 'Sapling', hours: 0, image: '/img/trees/tree_of_tranquility/stage_1.png' },
      { status: 'Sprout', hours: 6, image: '/img/trees/tree_of_tranquility/stage_2.png' },
      { status: 'Young Tree', hours: 12, image: '/img/trees/tree_of_tranquility/stage_3.png' },
      { status: 'Flourishing', hours: 18, image: '/img/trees/tree_of_tranquility/stage_4.png' },
      { status: 'Mature', hours: 24, image: '/img/trees/tree_of_tranquility/stage_5.png' },
    ],
    witheredImage: '/img/trees/tree_of_tranquility/withered.png'
  },
  ancient_oak: {
    id: 'ancient_oak',
    name: 'Ancient Oak',
    cost: 500,
    description: 'A majestic oak that stands the test of time. Takes 2 days to reach full maturity, evolving through 7 distinct stages.',
    growthHours: 48,
    stages: [
      { status: 'Acorn', hours: 0, image: '/img/trees/ancient_oak/stage_1.png' },
      { status: 'Seedling', hours: 8, image: '/img/trees/ancient_oak/stage_2.png' },
      { status: 'Sapling', hours: 16, image: '/img/trees/ancient_oak/stage_3.png' },
      { status: 'Young Oak', hours: 24, image: '/img/trees/ancient_oak/stage_4.png' },
      { status: 'Growing Oak', hours: 32, image: '/img/trees/ancient_oak/stage_5.png' },
      { status: 'Mighty Oak', hours: 40, image: '/img/trees/ancient_oak/stage_6.png' },
      { status: 'Ancient Oak', hours: 48, image: '/img/trees/ancient_oak/stage_7.png' },
    ],
    witheredImage: '/img/trees/ancient_oak/withered.png'
  }
};

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
    const item = shopItems.find(i => i.id === itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

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
      const matureDate = new Date(purchaseDate.getTime() + item.growthHours * 60 * 60 * 1000);

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
        shopItems.forEach(shopItem => {
          if (shopItem.type === 'phoenix_skin') {
            equippedUpgrades[shopItem.id] = false;
          }
        });
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

    const item = shopItems.find(i => i.id === itemId);
    
    if (equip) {
      // Equipping - handle phoenix skin mutual exclusion
      if (item && item.type === 'phoenix_skin') {
        shopItems.forEach(shopItem => {
          if (shopItem.type === 'phoenix_skin') {
            equippedUpgrades[shopItem.id] = false;
          }
        });
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

// Export shop items and tree types for frontend use
export { shopItems, treeTypes };