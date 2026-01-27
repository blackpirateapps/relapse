import db from './db.js';
import { checkAuth } from './auth.js';

// Helper to parse JSON from the request body
async function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => resolve(body ? JSON.parse(body) : {}));
    req.on('error', err => reject(err));
  });
}

// Generate image paths following current naming convention
function generateImagePaths(itemType, itemId, itemName) {
  const paths = {
    instructions: '',
    images: []
  };

  if (itemType === 'phoenix_skin') {
    const folderPath = `/img/skins/${itemId}`;
    const stages = [
      'egg-1', 'egg-2', 'egg-3',
      'hatchling-1', 'hatchling-2', 'hatchling-3', 
      'chick-1', 'chick-2',
      'youngling-1', 'youngling-2',
      'sunfire-1', 'sunfire-2',
      'guardian-1', 'guardian-2',
      'drake', 'celestial-phoenix'
    ];

    paths.instructions = `Create folder: /public${folderPath}/\nUpload 16 phoenix progression images following this naming convention:`;
    paths.images = stages.map((stage, index) => ({
      filename: `${stage}.webp`,
      fullPath: `${folderPath}/${stage}.webp`,
      description: `Stage ${index + 1} - ${stage.replace('-', ' ').replace(/\bw/g, l => l.toUpperCase())}`,
      sort_order: index
    }));
    paths.previewImage = `${folderPath}/celestial-phoenix.webp`;

  } else if (itemType === 'tree_sapling') {
    const folderPath = `/img/trees/${itemId}`;
    paths.instructions = `Create folder: /public${folderPath}/\nUpload tree growth stage images plus withered image:`;
    paths.previewImage = `${folderPath}/stage_1.png`;
    paths.witheredImage = `${folderPath}/withered.png`;
    
    paths.images = [
      { filename: 'stage_1.png', fullPath: `${folderPath}/stage_1.png`, description: 'Initial stage', hours: 0, sort_order: 0 },
      { filename: 'stage_2.png', fullPath: `${folderPath}/stage_2.png`, description: 'Early growth', hours: 6, sort_order: 1 },
      { filename: 'stage_3.png', fullPath: `${folderPath}/stage_3.png`, description: 'Mid growth', hours: 12, sort_order: 2 },
      { filename: 'stage_4.png', fullPath: `${folderPath}/stage_4.png`, description: 'Late growth', hours: 18, sort_order: 3 },
      { filename: 'stage_5.png', fullPath: `${folderPath}/stage_5.png`, description: 'Fully mature', hours: 24, sort_order: 4 }
    ];
  }

  return paths;
}

function validateItemData(itemData) {
  const errors = [];
  if (!itemData.id || typeof itemData.id !== 'string') errors.push('Item ID is required and must be a string');
  if (!itemData.name) errors.push('Item name is required');
  if (!itemData.description) errors.push('Item description is required');
  if (!itemData.cost || typeof itemData.cost !== 'number' || itemData.cost <= 0) errors.push('Item cost must be a positive number');
  if (!['phoenix_skin', 'tree_sapling', 'background_theme'].includes(itemData.type)) errors.push('Invalid item type');
  return errors;
}

export default async function handler(req, res) {
  // Auth is checked in the main router
  if (req.method === 'GET') {
    try {
      const itemsResult = await db.execute("SELECT * FROM shop_items ORDER BY type, name;");
      const imagesResult = await db.execute("SELECT * FROM shop_item_images ORDER BY item_id, sort_order;");
      res.status(200).json({ items: itemsResult.rows, images: imagesResult.rows });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch shop items.' });
    }
  } else if (req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const { action } = body;

      if (action === 'preview') {
        const { itemType, itemId, itemName } = body;
        if (!itemType || !itemId) return res.status(400).json({ message: 'Item type and ID are required' });
        const paths = generateImagePaths(itemType, itemId, itemName);
        return res.status(200).json({ paths });
      }

      // ... Other POST actions like 'create', 'delete' would go here
      
      res.status(400).json({ message: 'Invalid action' });

    } catch (error) {
      res.status(500).json({ message: 'Failed to process request.' });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}
