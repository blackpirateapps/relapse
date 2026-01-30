import db, { initDb } from './db.js';
import { checkAuth } from './auth.js';
import { ranks, getRank } from './ranks.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
    if (!checkAuth(req)) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        await initDb();
        const { rows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
        if (rows.length === 0) return res.status(404).json({ message: 'State not found.' });
        
        const state = rows[0];
        const endDate = new Date();
        const currentStreakMs = endDate.getTime() - new Date(state.lastRelapse).getTime();

        const potionActiveUntil = state.potion_active_until ? new Date(state.potion_active_until) : null;
        const potionRelapseUsedAt = state.potion_relapse_used_at ? new Date(state.potion_relapse_used_at) : null;
        const potionProtectedUses = Number(state.potion_protected_uses_this_streak || 0);
        const isPotionActive = potionActiveUntil && potionActiveUntil.getTime() > endDate.getTime();
        const canProtectRelapse = isPotionActive && !potionRelapseUsedAt && potionProtectedUses < 2;

        if (canProtectRelapse) {
            if (currentStreakMs > 0) {
                const totalHours = currentStreakMs / (1000 * 60 * 60);
                const finalRank = getRank(totalHours);
                const phoenixName = `Shielded Relapse • ${endDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;

                await db.execute({
                    sql: `INSERT INTO phoenix_history (name, final_rank_name, final_rank_level, streak_duration_ms, start_date, end_date, upgrades_json) 
                          VALUES (?, ?, ?, ?, ?, ?, ?);`,
                    args: [
                        phoenixName,
                        finalRank.name,
                        finalRank.level,
                        currentStreakMs,
                        state.lastRelapse,
                        endDate.toISOString(),
                        state.equipped_upgrades
                    ]
                });
            }

            await db.execute({
                sql: `UPDATE user_state
                      SET potion_relapse_used_at = ?,
                          potion_protected_uses_this_streak = ?
                      WHERE id = 1;`,
                args: [endDate.toISOString(), potionProtectedUses + 1]
            });

            const { rows: updatedState } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
            return res.status(200).json(updatedState[0]);
        }
        
        // Archive the completed streak's history (no change here)
        if (currentStreakMs > 0) {
            const totalHours = currentStreakMs / (1000 * 60 * 60);
            const finalRank = getRank(totalHours);
            const phoenixName = `Phoenix of ${endDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`;

            await db.execute({
                sql: `INSERT INTO phoenix_history (name, final_rank_name, final_rank_level, streak_duration_ms, start_date, end_date, upgrades_json) 
                      VALUES (?, ?, ?, ?, ?, ?, ?);`,
                args: [
                    phoenixName,
                    finalRank.name,
                    finalRank.level,
                    currentStreakMs,
                    state.lastRelapse,
                    endDate.toISOString(),
                    state.equipped_upgrades
                ]
            });
        }
        
        // --- START: NEW COIN BANKING LOGIC ---

        // 1. Calculate all coin components at the moment of relapse.
        const totalHours = currentStreakMs > 0 ? currentStreakMs / (1000 * 60 * 60) : 0;
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

        const streakCoins = Math.floor(10 * Math.pow(totalHours, 1.2));
        
        // 2. The new base coin balance is the sum of the old base, plus all streak and unclaimed rewards.
        const newBaseCoins = state.coinsAtLastRelapse + streakCoins + unclaimedLevelReward;
        const newLastClaimedLevel = currentRank.level;

        // --- END: NEW COIN BANKING LOGIC ---

        // Wither any growing trees
        await db.execute("UPDATE forest SET status = 'withered' WHERE status = 'growing';");

        // Remove relapse-only skins and apply a cumulative 1% discount for re-purchase
        const upgrades = JSON.parse(state.upgrades || '{}');
        if (upgrades.scarlet_phoenix_skin) {
            delete upgrades.scarlet_phoenix_skin;
            await db.execute({
                sql: "UPDATE user_state SET upgrades = ? WHERE id = 1;",
                args: [JSON.stringify(upgrades)]
            });

            const { rows: skinRows } = await db.execute("SELECT cost FROM shop_items WHERE id = 'scarlet_phoenix_skin';");
            if (skinRows.length > 0) {
                const currentCost = Number(skinRows[0].cost) || 2000;
                const discounted = Math.round(currentCost * 0.99);
                await db.execute({
                    sql: "UPDATE shop_items SET cost = ? WHERE id = 'scarlet_phoenix_skin';",
                    args: [discounted]
                });
            }
        }

        // Update the user's state for the new streak
        const newLongestStreak = Math.max(state.longestStreak || 0, currentStreakMs);
        
        await db.execute({
            sql: `UPDATE user_state 
                  SET 
                    lastRelapse = ?, 
                    longestStreak = ?, 
                    relapseCount = relapseCount + 1, 
                    coinsAtLastRelapse = ?,  -- Use the new "banked" coin total
                    lastClaimedLevel = ?,
                    potion_purchases_this_streak = 0,
                    potion_protected_uses_this_streak = 0,
                    potion_active_until = NULL,
                    potion_relapse_used_at = NULL
                  WHERE id = 1;`,
            args: [
                endDate.toISOString(), 
                newLongestStreak,
                newBaseCoins, // Set the new base coin value
                0             // Reset claimed level for the new journey
            ]
        });

        // Fetch and return the new, reset state so the UI can update instantly
        const { rows: updatedState } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
        res.status(200).json(updatedState[0]);

    } catch (error) {
        console.error("Relapse API Error:", error);
        res.status(500).json({ message: 'Failed to process relapse.' });
    }
}
