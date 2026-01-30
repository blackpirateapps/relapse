import db, { initDb } from './db.js';
import { checkAuth } from './auth.js';

export default async function handler(req, res) {
  if (!checkAuth(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await initDb();
    const { rows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
    if (rows.length === 0) return res.status(404).json({ message: 'State not found.' });

    const state = rows[0];
    const inventory = Number(state.potion_inventory || 0);
    if (inventory <= 0) {
      return res.status(400).json({ message: 'No potions available.' });
    }

    const now = new Date();
    const activeUntil = state.potion_active_until ? new Date(state.potion_active_until) : null;
    if (activeUntil && activeUntil.getTime() > now.getTime()) {
      return res.status(400).json({ message: 'Potion effect is already active.' });
    }

    const newActiveUntil = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    await db.execute({
      sql: `UPDATE user_state
            SET potion_inventory = ?,
                potion_active_until = ?,
                potion_relapse_used_at = NULL
            WHERE id = 1;`,
      args: [inventory - 1, newActiveUntil.toISOString()]
    });

    const { rows: updatedRows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
    return res.status(200).json({
      success: true,
      message: 'Potion activated for 12 hours.',
      userState: updatedRows[0]
    });
  } catch (error) {
    console.error('Potion API Error:', error);
    return res.status(500).json({ message: 'Failed to use potion.' });
  }
}
