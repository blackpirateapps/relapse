import React, { useContext } from 'react';
import { AppContext } from '../App.jsx';

// This new component centralizes the logic for rendering the Phoenix image
const PhoenixImage = ({ rankLevel, equippedUpgrades, className = "w-48 h-48" }) => {
  const { ranks, shopItems } = useContext(AppContext);

  const getPhoenixImageUrl = () => {
    const rank = ranks[rankLevel];
    if (!rank) return '/img/placeholder.png'; // Fallback image

    let imageUrl = rank.image; // Default to the base rank image

    // Check for equipped phoenix skins
    if (equippedUpgrades && shopItems.length > 0) {
      for (const itemId in equippedUpgrades) {
        if (equippedUpgrades[itemId]) {
          const shopItem = shopItems.find(item => item.id.toString() === itemId.toString() && item.type === 'phoenix_skin');
          
          // The shop item must have an `images` array with the correct progression
          if (shopItem && shopItem.images && shopItem.images[rankLevel]) {
            imageUrl = shopItem.images[rankLevel].image_url;
            break; // Stop after finding the first equipped skin
          }
        }
      }
    }
    return imageUrl;
  };

  return (
    <div className={`${className} mx-auto transition-all duration-500`}>
      <img 
        src={getPhoenixImageUrl()} 
        alt={ranks[rankLevel]?.name || 'Phoenix'} 
        className="w-full h-full object-contain drop-shadow-[0_5px_15px_rgba(253,224,71,0.3)]"
        onError={(e) => { e.target.onerror = null; e.target.src='/img/placeholder.png'; }}
      />
    </div>
  );
};

export default PhoenixImage;

