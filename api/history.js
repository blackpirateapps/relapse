import db from './_lib/db.js';

export default async function handler(req, res) {
    try {
        const { rows } = await db.execute("SELECT * FROM phoenix_history ORDER BY end_date DESC;");
        res.status(200).json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to fetch history.' });
    }
}
