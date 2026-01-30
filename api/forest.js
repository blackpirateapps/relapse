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
    let body = '';
    req.on('data', (chunk) => { body += chunk.toString(); });
    req.on('end', async () => {
      const data = body ? JSON.parse(body) : {};
      const { action, treeId, x, y } = data;

      if (action !== 'move') {
        return res.status(400).json({ message: 'Invalid action.' });
      }

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
    });
  } catch (error) {
    console.error('Forest API Error:', error);
    return res.status(500).json({ message: 'Failed to update tree.' });
  }
}
