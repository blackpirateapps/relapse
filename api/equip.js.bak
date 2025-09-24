import db from './db.js';
import { checkAuth } from './auth.js';

// The shopItems list is now defined directly here.
const shopItems = [
    { id: 'bluePhoenix', name: 'Blue Phoenix', cost: 1500, type: 'phoenix_skin' },
    { id: 'greenPhoenix', name: 'Verdant Phoenix', cost: 4000, type: 'phoenix_skin' },
    { id: 'volcanicLair', name: 'Volcanic Lair', cost: 10000, type: 'theme' },
    { id: 'celestialSky', name: 'Celestial Sky', cost: 50000, type: 'theme' }
];

export default async function handler(req, res) {
    if (req.method !== 'POST' || !checkAuth(req)) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const { itemId, equip } = req.body; 

        const { rows } = await db.execute("SELECT upgrades, equipped_upgrades FROM user_state WHERE id = 1;");
        if (rows.length === 0) return res.status(404).json({ message: 'State not found.' });

        let state = rows[0];
        let ownedUpgrades = JSON.parse(state.upgrades || '{}');
        let equippedUpgrades = JSON.parse(state.equipped_upgrades || '{}');

        if (!ownedUpgrades[itemId]) {
            return res.status(403).json({ message: 'Cannot equip an unowned item.' });
        }

        const itemToEquip = shopItems.find(i => i.id === itemId);

        if (equip && itemToEquip && itemToEquip.type === 'phoenix_skin') {
            shopItems.forEach(item => {
                if (item.type === 'phoenix_skin') {
                    equippedUpgrades[item.id] = false;
                }
            });
        }
        
        equippedUpgrades[itemId] = equip;

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

