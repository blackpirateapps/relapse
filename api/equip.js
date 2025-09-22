import db from './db.js';
import { checkAuth } from './auth.js';

export default async function handler(req, res) {
    if (req.method !== 'POST' || !checkAuth(req)) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const { itemId, equip } = req.body; // `equip` is a boolean: true to equip, false to unequip

        const { rows } = await db.execute("SELECT upgrades, equipped_upgrades FROM user_state WHERE id = 1;");
        if (rows.length === 0) return res.status(404).json({ message: 'State not found.' });

        let state = rows[0];
        let ownedUpgrades = JSON.parse(state.upgrades || '{}');
        let equippedUpgrades = JSON.parse(state.equipped_upgrades || '{}');

        // Security check: User must own the item to equip/unequip it
        if (!ownedUpgrades[itemId]) {
            return res.status(403).json({ message: 'Cannot equip an unowned item.' });
        }
        
        // Update the equipped status
        equippedUpgrades[itemId] = equip;

        // Save the updated equipped list back to the database
        await db.execute({
            sql: "UPDATE user_state SET equipped_upgrades = ? WHERE id = 1;",
            args: [JSON.stringify(equippedUpgrades)]
        });

        const { rows: updatedRows } = await db.execute("SELECT * FROM user_state WHERE id = 1;");
        res.status(200).json(updatedRows[0]);

    } catch (error) {
        console.error('Equip Error:', error);
        res.status(500).json({ message: 'Failed to update equipment.' });
    }
}
