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

    paths.instructions = `Create folder: /public${folderPath}/
Upload 16 phoenix progression images following this naming convention:`;
    paths.images = stages.map((stage, index) => ({
      filename: `${stage}.webp`,
      fullPath: `${folderPath}/${stage}.webp`,
      description: `Stage ${index + 1} - ${stage.replace('-', ' ').replace(/\bw/g, l => l.toUpperCase())}`,
      sort_order: index
    }));
    paths.previewImage = `${folderPath}/celestial-phoenix.webp`;

  } else if (itemType === 'tree_sapling') {
    const folderPath = `/img/trees/${itemId}`;
    paths.instructions = `Create folder: /public${folderPath}/
Upload tree growth stage images plus withered image:`;
    paths.previewImage = `${folderPath}/stage_1.png`;
    paths.witheredImage = `${folderPath}/withered.png`;
    
    // Default 5 stages, user can modify
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

// Validate item data
function validateItemData(itemData) {
  const errors = [];

  if (!itemData.id || typeof itemData.id !== 'string') {
    errors.push('Item ID is required and must be a string');
  }

  if (!itemData.name || typeof itemData.name !== 'string') {
    errors.push('Item name is required');
  }

  if (!itemData.description || typeof itemData.description !== 'string') {
    errors.push('Item description is required');
  }

  if (!itemData.cost || typeof itemData.cost !== 'number' || itemData.cost <= 0) {
    errors.push('Item cost must be a positive number');
  }

  if (!['phoenix_skin', 'tree_sapling'].includes(itemData.type)) {
    errors.push('Item type must be either phoenix_skin or tree_sapling');
  }

  if (itemData.type === 'tree_sapling') {
    if (!itemData.growthHours || typeof itemData.growthHours !== 'number' || itemData.growthHours <= 0) {
      errors.push('Growth hours is required for tree saplings and must be positive');
    }

    if (!itemData.stages || !Array.isArray(itemData.stages) || itemData.stages.length === 0) {
      errors.push('Tree stages are required');
    } else {
      itemData.stages.forEach((stage, index) => {
        if (!stage.status || typeof stage.status !== 'string') {
          errors.push(`Stage ${index + 1}: Status name is required`);
        }
        if (typeof stage.hours !== 'number' || stage.hours < 0) {
          errors.push(`Stage ${index + 1}: Hours must be a non-negative number`);
        }
      });
    }
  }

  return errors;
}

export default async function handler(req, res) {
  if (!checkAuth(req)) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // Return existing shop items for reference
    try {
      const itemsResult = await db.execute("SELECT * FROM shop_items ORDER BY type, name;");
      const imagesResult = await db.execute("SELECT * FROM shop_item_images ORDER BY item_id, sort_order;");
      
      res.status(200).json({
        items: itemsResult.rows,
        images: imagesResult.rows
      });
    } catch (error) {
      console.error('Admin GET Error:', error);
      res.status(500).json({ message: 'Failed to fetch shop items.' });
    }

  } else if (req.method === 'POST') {
    // Create new shop item
    try {
      const body = await parseJsonBody(req);
      const { action } = body;

      if (action === 'preview') {
        // Generate preview of image paths and instructions
        const { itemType, itemId, itemName } = body;
        
        if (!itemType || !itemId) {
          return res.status(400).json({ message: 'Item type and ID are required for preview' });
        }

        const paths = generateImagePaths(itemType, itemId, itemName);
        res.status(200).json({ paths });

      } else if (action === 'create') {
        // Validate and create new item
        const itemData = body.itemData;
        const errors = validateItemData(itemData);
        
        if (errors.length > 0) {
          return res.status(400).json({ message: 'Validation failed', errors });
        }

        // Check if item ID already exists
        const existingResult = await db.execute({
          sql: "SELECT id FROM shop_items WHERE id = ?;",
          args: [itemData.id]
        });

        if (existingResult.rows.length > 0) {
          return res.status(400).json({ message: 'Item with this ID already exists' });
        }

        // Generate image paths
        const paths = generateImagePaths(itemData.type, itemData.id, itemData.name);

        // Insert shop item
        await db.execute({
          sql: `INSERT INTO shop_items (id, name, description, cost, type, preview_image, is_active, sort_order, growth_hours, withered_image) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
          args: [
            itemData.id,
            itemData.name,
            itemData.description,
            itemData.cost,
            itemData.type,
            paths.previewImage,
            true,
            itemData.sortOrder || 0,
            itemData.growthHours || null,
            paths.witheredImage || null
          ]
        });

        // Insert images
        if (itemData.type === 'phoenix_skin') {
          // Insert 16 progression images for phoenix skins
          for (let i = 0; i < paths.images.length; i++) {
            const image = paths.images[i];
            await db.execute({
              sql: `INSERT INTO shop_item_images (item_id, stage_name, stage_hours, image_url, sort_order, image_type) 
                    VALUES (?, ?, ?, ?, ?, ?);`,
              args: [itemData.id, image.description, i, image.fullPath, i, 'progression']
            });
          }
        } else if (itemData.type === 'tree_sapling') {
          // Insert tree growth stages
          for (let i = 0; i < itemData.stages.length; i++) {
            const stage = itemData.stages[i];
            await db.execute({
              sql: `INSERT INTO shop_item_images (item_id, stage_name, stage_hours, image_url, sort_order, image_type) 
                    VALUES (?, ?, ?, ?, ?, ?);`,
              args: [
                itemData.id, 
                stage.status, 
                stage.hours, 
                `/img/trees/${itemData.id}/stage_${i + 1}.png`, 
                i, 
                'growth_stage'
              ]
            });
          }
        }

        res.status(201).json({
          success: true,
          message: 'Shop item created successfully',
          item: itemData,
          imagePaths: paths
        });

      } else if (action === 'delete') {
        // Delete shop item
        const { itemId } = body;
        
        if (!itemId) {
          return res.status(400).json({ message: 'Item ID is required' });
        }

        // Delete images first (foreign key constraint)
        await db.execute({
          sql: "DELETE FROM shop_item_images WHERE item_id = ?;",
          args: [itemId]
        });

        // Delete item
        const result = await db.execute({
          sql: "DELETE FROM shop_items WHERE id = ?;",
          args: [itemId]
        });

        if (result.rowsAffected === 0) {
          return res.status(404).json({ message: 'Item not found' });
        }

        res.status(200).json({
          success: true,
          message: 'Shop item deleted successfully'
        });

      } else {
        res.status(400).json({ message: 'Invalid action' });
      }

    } catch (error) {
      console.error('Admin POST Error:', error);
      res.status(500).json({ message: 'Failed to process request.' });
    }

  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}