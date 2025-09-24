import db from './db.js';
import { checkAuth } from './auth.js';
import { ranks } from './ranks.js';

// INTEGRATED: The shop now also knows about the tree saplings
const shopItems = [
  { id: 'bluePhoenix', name: 'Blue Phoenix', cost: 1500, type: 'phoenix_skin' },
  { id: 'greenPhoenix', name: 'Verdant Phoenix', cost: 4000, type: 'phoenix_skin' },
  { id: 'volcanicLair', name: 'Volcanic Lair', cost: 10000, type: 'theme' },
  { id: 'celestialSky', name: 'Celestial Sky', cost: 50000, type: 'theme' },

  // Tree saplings for the forest shop
  { id: 'tree_of_tranquility', name: 'Tree of Tranquility', cost: 200, type: 'tree_sapling', growthHours: 24 },
  { id: 'ancient_oak', name: 'Ancient Oak', cost: 500, type: 'tree_sapling', growthHours: 48 }
];

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

export default async function handler(req, res) {
  if (req.method !== 'POST' || !checkAuth(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const body = await parseJsonBody(req);
    const { itemId } = body;

    const item = shopItems.find(i => i.id === itemId);
    if (!item) {
      return res.status(404).json({ message: 'Item not found.' });
    }

    const { rows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User state not found.' });
    }

    const state = rows[0];

    // --- Calculate User's Total Coins ---
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
    if (totalAvailableCoins < item.cost) {
      return res.status(400).json({ message: 'Cannot afford item.' });
    }

    const finalCoinBalance = totalAvailableCoins - item.cost;
    const newCoinsAtLastRelapse = finalCoinBalance - streakCoins;

    // --- Conditional Purchase Logic ---
    if (item.type === 'tree_sapling') {
      // Logic for buying a tree
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

    } else {
      // Logic for buying a cosmetic or theme item
      let upgrades = JSON.parse(state.upgrades || '{}');
      if (upgrades[itemId]) {
        return res.status(400).json({ message: 'Item already owned.' });
      }

      upgrades[itemId] = true;
      let equippedUpgrades = JSON.parse(state.equipped_upgrades || '{}');

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
        args: [ newCoinsAtLastRelapse, JSON.stringify(upgrades), currentRank.level, JSON.stringify(equippedUpgrades) ]
      });
    }

    const { rows: updatedRows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
    res.status(200).json(updatedRows[0]);

  } catch (error) {
    console.error('Purchase Error:', error);
    res.status(500).json({ message: 'Failed to process purchase.' });
  }
}