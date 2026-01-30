import React, { useContext, useMemo } from 'react';
import { AppContext } from '../App.jsx';

// This new component centralizes the logic for rendering the Phoenix image
const PhoenixImage = ({ rankLevel, equippedUpgrades, className = "w-48 h-48", allowPreview = true }) => {
  const { ranks, shopItems, previewAuraId } = useContext(AppContext);

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

  const equippedAuraId = useMemo(() => {
    const auraItems = shopItems.filter((item) => item.type === 'phoenix_aura');
    const equippedAura = auraItems.find((item) => equippedUpgrades?.[item.id]);
    return equippedAura?.id || null;
  }, [equippedUpgrades, shopItems]);

  const activeAuraId = allowPreview && previewAuraId ? previewAuraId : equippedAuraId;

  const auraStyles = {
    aura_ember: 'aura-ember',
    aura_celestial: 'aura-celestial',
    aura_verdant: 'aura-verdant'
  };

  return (
    <div className={`${className} mx-auto transition-all duration-500 relative`}>
      {activeAuraId && (
        <>
          <div className={`absolute inset-0 -z-10 ${auraStyles[activeAuraId] || ''}`} />
          <style jsx>{`
            .aura-ember {
              background: radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.35), rgba(249, 115, 22, 0.2), transparent 70%);
              filter: blur(6px);
              animation: auraPulse 3.8s ease-in-out infinite;
            }
            .aura-celestial {
              background: radial-gradient(circle at 50% 50%, rgba(56, 189, 248, 0.35), rgba(99, 102, 241, 0.25), transparent 70%);
              filter: blur(7px);
              animation: auraOrbit 6s linear infinite;
            }
            .aura-verdant {
              background: radial-gradient(circle at 50% 50%, rgba(74, 222, 128, 0.35), rgba(16, 185, 129, 0.25), transparent 70%);
              filter: blur(6px);
              animation: auraPulse 4.6s ease-in-out infinite;
            }
            @keyframes auraPulse {
              0%, 100% { transform: scale(0.95); opacity: 0.7; }
              50% { transform: scale(1.05); opacity: 1; }
            }
            @keyframes auraOrbit {
              0% { transform: rotate(0deg) scale(0.98); opacity: 0.75; }
              50% { transform: rotate(180deg) scale(1.05); opacity: 1; }
              100% { transform: rotate(360deg) scale(0.98); opacity: 0.75; }
            }
          `}</style>
        </>
      )}
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
