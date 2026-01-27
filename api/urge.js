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

function isTimedTaskComplete(task) {
  if (!task.started_at) return false;
  const endTime = new Date(task.started_at).getTime() + task.duration_minutes * 60 * 1000;
  return Date.now() >= endTime;
}

function isComplete(task) {
  if (task.id === 'read_newspaper') {
    return isTimedTaskComplete(task);
  }
  return !!task.completed_at;
}

export default async function handler(req, res) {
  if (!checkAuth(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    await initDb();

    if (req.method === 'GET') {
      const { rows } = await db.execute("SELECT * FROM urge_tasks ORDER BY id;");
      return res.status(200).json(rows.map((task) => ({
        ...task,
        is_complete: isComplete(task)
      })));
    }

    if (req.method === 'POST') {
      const body = await parseJsonBody(req);
      const { action, taskId } = body;
      const taskKey = taskId || 'read_newspaper';

      if (action === 'start') {
        const { rows } = await db.execute({ sql: "SELECT * FROM urge_tasks WHERE id = ?;", args: [taskKey] });
        if (rows.length === 0) return res.status(404).json({ message: 'Task not found.' });
        const task = rows[0];

        if (!task.started_at || task.claimed_at) {
          const now = new Date().toISOString();
          await db.execute({
            sql: "UPDATE urge_tasks SET started_at = ?, completed_at = NULL, claimed_at = NULL, last_session_seconds = NULL WHERE id = ?;",
            args: [now, taskKey]
          });
        }

        const { rows: updatedRows } = await db.execute({ sql: "SELECT * FROM urge_tasks WHERE id = ?;", args: [taskKey] });
        const updatedTask = updatedRows[0];
        return res.status(200).json({ ...updatedTask, is_complete: isComplete(updatedTask) });
      }

      if (action === 'end_session') {
        const { rows } = await db.execute({ sql: "SELECT * FROM urge_tasks WHERE id = ?;", args: [taskKey] });
        if (rows.length === 0) return res.status(404).json({ message: 'Task not found.' });
        const task = rows[0];

        if (!task.started_at) return res.status(400).json({ message: 'Task not started.' });
        const now = new Date();
        const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - new Date(task.started_at).getTime()) / 1000));
        const nowIso = now.toISOString();

        await db.execute({
          sql: "UPDATE urge_tasks SET completed_at = ?, last_session_seconds = ? WHERE id = ?;",
          args: [nowIso, elapsedSeconds, taskKey]
        });

        return res.status(200).json({ success: true, totalSeconds: elapsedSeconds });
      }

      if (action === 'cancel') {
        const { rows } = await db.execute({ sql: "SELECT * FROM urge_tasks WHERE id = ?;", args: [taskKey] });
        if (rows.length === 0) return res.status(404).json({ message: 'Task not found.' });
        const task = rows[0];
        if (!task.started_at || task.claimed_at) {
          return res.status(200).json({ success: true, penalty: 0 });
        }

        const penalty = task.id === 'pushup_45' ? 200 : 0;
        if (penalty > 0) {
          const { rows: stateRows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
          if (stateRows.length === 0) return res.status(404).json({ message: 'State not found.' });
          const state = stateRows[0];
          const newCoins = Math.max(0, (state.coinsAtLastRelapse || 0) - penalty);
          await db.execute({
            sql: "UPDATE user_state SET coinsAtLastRelapse = ? WHERE id = 1;",
            args: [newCoins]
          });
        }

        await db.execute({
          sql: "UPDATE urge_tasks SET started_at = NULL, completed_at = NULL, claimed_at = NULL, last_session_seconds = NULL WHERE id = ?;",
          args: [taskKey]
        });

        return res.status(200).json({ success: true, penalty });
      }

      if (action === 'claim') {
        const { rows: taskRows } = await db.execute({ sql: "SELECT * FROM urge_tasks WHERE id = ?;", args: [taskKey] });
        if (taskRows.length === 0) return res.status(404).json({ message: 'Task not found.' });
        const task = taskRows[0];

        if (!task.started_at) return res.status(400).json({ message: 'Task not started.' });
        if (!isComplete(task)) return res.status(400).json({ message: 'Task not complete yet.' });
        if (task.claimed_at) return res.status(400).json({ message: 'Reward already claimed.' });

        const claimTime = new Date().toISOString();
        await db.execute({
          sql: "UPDATE urge_tasks SET completed_at = ?, claimed_at = ? WHERE id = ?;",
          args: [claimTime, claimTime, taskKey]
        });

        const { rows: stateRows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
        if (stateRows.length === 0) return res.status(404).json({ message: 'State not found.' });
        const state = stateRows[0];

        let rewardCoins = task.reward_coins;
        let rewardHours = task.reward_hours;

        if (task.id === 'pushup_45') {
          const sessionSeconds = task.last_session_seconds || 0;
          rewardCoins = Math.floor(sessionSeconds / 2);
          rewardHours = (sessionSeconds * 4) / 3600;
        }

        const newCoins = (state.coinsAtLastRelapse || 0) + rewardCoins;
        const lastRelapseMs = new Date(state.lastRelapse).getTime();
        const boostedRelapse = new Date(lastRelapseMs - rewardHours * 60 * 60 * 1000).toISOString();

        await db.execute({
          sql: "UPDATE user_state SET coinsAtLastRelapse = ?, lastRelapse = ? WHERE id = 1;",
          args: [newCoins, boostedRelapse]
        });

        return res.status(200).json({
          success: true,
          rewardCoins,
          rewardHours
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
