import db from './db.js';
import { checkAuth } from './auth.js';
import { ranks } from './ranks.js'; // Import ranks for coin calculation

// --- Helper Functions (copied from api/shop.js for coin calculation) ---
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

async function getUserStateAndCoins() {
    const { rows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
    if (rows.length === 0) throw new Error('User state not found.');
    const state = rows[0];

    // Calculate current available coins (including unclaimed rank rewards)
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

    return { state, totalAvailableCoins, streakCoins, currentRank };
}

// --- Main Handler ---
export default async function handler(req, res) {
  if (req.method !== 'POST' || !checkAuth(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const body = await parseJsonBody(req);
    const { action, gameId, playId, score } = body;

    if (action === 'start_game') {
      return handleStartGame(gameId, res);
    } else if (action === 'end_game') {
      // Validate inputs for end_game
      if (!playId || typeof score !== 'number' || score < 0) {
         return res.status(400).json({ success: false, message: 'Invalid input for end_game.' });
      }
      return handleEndGame(playId, score, res);
    } else {
      return res.status(400).json({ message: 'Invalid action.' });
    }
  } catch (error) {
    console.error('Minigame API Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to process minigame request.' });
  }
}

// --- Action Handlers ---

// Handles starting a game session
async function handleStartGame(gameId, res) {
  if (!gameId) {
    return res.status(400).json({ success: false, message: 'Game ID is required.' });
  }

  // 1. Get Game Info (Cost)
  const gameResult = await db.execute({
    sql: "SELECT entry_cost FROM minigames WHERE id = ? AND is_active = true;",
    args: [gameId]
  });
  if (gameResult.rows.length === 0) {
    return res.status(404).json({ success: false, message: 'Minigame not found or is inactive.' });
  }
  const gameCost = gameResult.rows[0].entry_cost;

  // 2. Get User State and Coins
  const { state, totalAvailableCoins, streakCoins, currentRank } = await getUserStateAndCoins();

  // 3. Check Affordability
  if (totalAvailableCoins < gameCost) {
    return res.status(400).json({ success: false, message: 'Not enough coins to play.' });
  }

  // 4. Deduct Cost (Bank unclaimed rewards first)
  const finalCoinBalance = totalAvailableCoins - gameCost;
  const newCoinsAtLastRelapse = finalCoinBalance - streakCoins; // Calculate new base coins
  const newLastClaimedLevel = currentRank.level; // Bank rewards up to current level

  await db.execute({
      sql: "UPDATE user_state SET coinsAtLastRelapse = ?, lastClaimedLevel = ? WHERE id = 1;",
      args: [newCoinsAtLastRelapse, newLastClaimedLevel]
  });

  // 5. Record Game Play Start
  const startTime = new Date().toISOString();
  const playResult = await db.execute({
      sql: "INSERT INTO minigame_plays (user_id, game_id, started_at, coins_spent) VALUES (?, ?, ?, ?);",
      args: [1, gameId, startTime, gameCost] // Assuming user_id 1
  });
  const playId = playResult.lastInsertRowid; // Get the ID of the new play record

  // 6. Return Success with new state and playId
  const { rows: updatedStateRows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
  res.status(200).json({
    success: true,
    message: `Started ${gameId}. ${gameCost} coins spent.`,
    playId: playId, // Send the playId back to the client
    userState: updatedStateRows[0]
  });
}

// Handles ending a game session and awarding coins
async function handleEndGame(playId, score, res) {
  // 1. Validate the playId exists and hasn't ended
  const playResult = await db.execute({
      sql: "SELECT id, game_id, coins_spent FROM minigame_plays WHERE id = ? AND ended_at IS NULL;",
      args: [playId]
  });
  if (playResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid or already completed game session.' });
  }
  const playRecord = playResult.rows[0];

  // 2. Calculate Coins Won (Simple example: 1 coin per 10 score points)
  // IMPORTANT: Add server-side validation/anti-cheat logic here if possible/needed.
  // For a simple runner, validating score server-side is hard. Trusting the client for now.
  const coinsWon = Math.floor(score / 10); // Adjust this formula as needed

  // 3. Update Game Play Record
  const endTime = new Date().toISOString();
  await db.execute({
      sql: "UPDATE minigame_plays SET ended_at = ?, score = ?, coins_won = ? WHERE id = ?;",
      args: [endTime, score, coinsWon, playId]
  });

  // 4. Add Coins Won to User State
  // Fetch current coinsAtLastRelapse, add coinsWon, update
  const { rows: currentStateRows } = await db.execute("SELECT coinsAtLastRelapse FROM user_state WHERE id = 1;");
  if (currentStateRows.length > 0) {
      const currentBaseCoins = currentStateRows[0].coinsAtLastRelapse;
      const newBaseCoins = currentBaseCoins + coinsWon;
      await db.execute({
          sql: "UPDATE user_state SET coinsAtLastRelapse = ? WHERE id = 1;",
          args: [newBaseCoins]
      });
  }

  // 5. Return Success with updated state
  const { rows: updatedStateRows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
  res.status(200).json({
    success: true,
    message: `Game ended! Score: ${score}, Coins Won: ${coinsWon}.`,
    coinsWon: coinsWon,
    userState: updatedStateRows[0]
  });
}