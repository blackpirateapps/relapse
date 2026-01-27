import db, { initDb } from './db.js';
import { checkAuth } from './auth.js';

async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => resolve(body ? JSON.parse(body) : {}));
    req.on('error', err => reject(err));
  });
}

function isComplete(task) {
  if (!task.started_at) return false;
  const endTime = new Date(task.started_at).getTime() + task.duration_minutes * 60 * 1000;
  return Date.now() >= endTime;
}

export default async function handler(req, res) {
  if (!checkAuth(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    await initDb();

    if (req.method === 'GET') {
      const { rows } = await db.execute("SELECT * FROM urge_tasks WHERE id = 'read_newspaper';");
      if (rows.length === 0) return res.status(404).json({ message: 'Task not found.' });
      const task = rows[0];
      return res.status(200).json({
        ...task,
        is_complete: isComplete(task)
      });
    }

    if (req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { action } = body;

      if (action === 'start') {
        const { rows } = await db.execute("SELECT * FROM urge_tasks WHERE id = 'read_newspaper';");
        if (rows.length === 0) return res.status(404).json({ message: 'Task not found.' });
        const task = rows[0];

        if (!task.started_at || task.claimed_at) {
          const now = new Date().toISOString();
          await db.execute({
            sql: "UPDATE urge_tasks SET started_at = ?, completed_at = NULL, claimed_at = NULL WHERE id = 'read_newspaper';",
            args: [now]
          });
        }

        const { rows: updatedRows } = await db.execute("SELECT * FROM urge_tasks WHERE id = 'read_newspaper';");
        const updatedTask = updatedRows[0];
        return res.status(200).json({ ...updatedTask, is_complete: isComplete(updatedTask) });
      }

      if (action === 'claim') {
        const { rows: taskRows } = await db.execute("SELECT * FROM urge_tasks WHERE id = 'read_newspaper';");
        if (taskRows.length === 0) return res.status(404).json({ message: 'Task not found.' });
        const task = taskRows[0];

        if (!task.started_at) return res.status(400).json({ message: 'Task not started.' });
        if (!isComplete(task)) return res.status(400).json({ message: 'Task not complete yet.' });
        if (task.claimed_at) return res.status(400).json({ message: 'Reward already claimed.' });

        const claimTime = new Date().toISOString();
        await db.execute({
          sql: "UPDATE urge_tasks SET completed_at = ?, claimed_at = ? WHERE id = 'read_newspaper';",
          args: [claimTime, claimTime]
        });

        const { rows: stateRows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
        if (stateRows.length === 0) return res.status(404).json({ message: 'State not found.' });
        const state = stateRows[0];

        const newCoins = (state.coinsAtLastRelapse || 0) + task.reward_coins;
        const lastRelapseMs = new Date(state.lastRelapse).getTime();
        const boostedRelapse = new Date(lastRelapseMs - task.reward_hours * 60 * 60 * 1000).toISOString();

        await db.execute({
          sql: "UPDATE user_state SET coinsAtLastRelapse = ?, lastRelapse = ? WHERE id = 1;",
          args: [newCoins, boostedRelapse]
        });

        return res.status(200).json({
          success: true,
          rewardCoins: task.reward_coins,
          rewardHours: task.reward_hours
        });
      }

      return res.status(400).json({ message: 'Invalid action.' });
    }

    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('Urge Task API Error:', error);
    return res.status(500).json({ message: 'Failed to process urge task.', error: error.message });
  }
}
