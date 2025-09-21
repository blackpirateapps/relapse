import db from './db.js';
import { checkAuth } from './auth.js';

export default async function handler(req, res) {
    if (!checkAuth(req)) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const { rows } = await db.execute("SELECT * FROM phoenix_history ORDER BY end_date DESC;");
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch history.' });
    }
}
