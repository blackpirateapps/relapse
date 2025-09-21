import db, { initDb } from './db.js';
import { checkAuth } from './auth.js';

export default async function handler(req, res) {
    if (!checkAuth(req)) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    
    await initDb(); // Ensure DB is initialized

    try {
        const { rows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
        if (rows.length > 0) {
            res.status(200).json(rows[0]);
        } else {
            // This should ideally not happen after initDb, but as a fallback:
            res.status(404).json({ message: 'State not found.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch state from database.' });
    }
}
