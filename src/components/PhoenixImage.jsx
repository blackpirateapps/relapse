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

  // Render different aura elements based on type
  const renderAura = (auraId) => {
    switch (auraId) {
      case 'aura_ember':
        // Fiery flickering ring with multiple layers
        return (
          <>
            <div className="aura-ember-inner" />
            <div className="aura-ember-outer" />
            <div className="aura-ember-sparks" />
          </>
        );
      case 'aura_celestial':
        // Simple subtle rotating ring
        return (
          <div className="aura-celestial-simple" />
        );
      case 'aura_verdant':
        // Nature-inspired breathing glow
        return (
          <>
            <div className="aura-verdant-core" />
            <div className="aura-verdant-leaves" />
            <div className="aura-verdant-particles" />
          </>
        );
      case 'aura_inferno':
        // Animated rising fire effect
        return (
          <>
            <div className="aura-inferno-base" />
            <div className="aura-inferno-flames">
              <div className="flame flame-1" />
              <div className="flame flame-2" />
              <div className="flame flame-3" />
              <div className="flame flame-4" />
              <div className="flame flame-5" />
              <div className="flame flame-6" />
              <div className="flame flame-7" />
              <div className="flame flame-8" />
            </div>
            <div className="aura-inferno-glow" />
            <div className="aura-inferno-embers" />
          </>
        );
      case 'aura_solar':
        // Solar system with orbiting planets
        return (
          <>
            {/* Center glow (sun) */}
            <div className="aura-solar-sun" />
            {/* Orbital rings */}
            <div className="aura-solar-orbit orbit-1">
              <div className="planet planet-mercury" />
            </div>
            <div className="aura-solar-orbit orbit-2">
              <div className="planet planet-venus" />
            </div>
            <div className="aura-solar-orbit orbit-3">
              <div className="planet planet-earth">
                <div className="moon" />
              </div>
            </div>
            <div className="aura-solar-orbit orbit-4">
              <div className="planet planet-mars" />
            </div>
            <div className="aura-solar-orbit orbit-5">
              <div className="planet planet-saturn">
                <div className="saturn-ring" />
              </div>
            </div>
            {/* Star particles */}
            <div className="aura-solar-stars" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <style>{`
        /* === SVG OVERLAY (for using SVG files directly) === */
        .aura-svg-overlay {
          position: absolute;
          inset: -25%;
          width: 150%;
          height: 150%;
          object-fit: contain;
          pointer-events: none;
          border-radius: 48px;
        }

        /* === EMBER HALO === */
        .aura-ember-inner {
          position: absolute;
          inset: -10%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(251, 191, 36, 0.6) 0%, rgba(249, 115, 22, 0.4) 40%, transparent 70%);
          filter: blur(12px);
          animation: emberPulse 2s ease-in-out infinite;
        }
        .aura-ember-outer {
          position: absolute;
          inset: -20%;
          border-radius: 50%;
          background: conic-gradient(from 0deg, transparent, rgba(251, 146, 60, 0.5), transparent, rgba(239, 68, 68, 0.4), transparent);
          filter: blur(8px);
          animation: emberFlicker 3s ease-in-out infinite;
        }
        .aura-ember-sparks {
          position: absolute;
          inset: -15%;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 20%, rgba(253, 224, 71, 0.8) 0%, transparent 8%),
                      radial-gradient(circle at 70% 30%, rgba(251, 191, 36, 0.7) 0%, transparent 6%),
                      radial-gradient(circle at 20% 70%, rgba(249, 115, 22, 0.6) 0%, transparent 7%),
                      radial-gradient(circle at 80% 80%, rgba(253, 224, 71, 0.7) 0%, transparent 5%);
          animation: sparkFloat 4s ease-in-out infinite;
        }
        @keyframes emberPulse {
          0%, 100% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        @keyframes emberFlicker {
          0%, 100% { transform: rotate(0deg) scale(1); opacity: 0.7; }
          25% { transform: rotate(5deg) scale(1.02); opacity: 0.9; }
          50% { transform: rotate(0deg) scale(0.98); opacity: 0.8; }
          75% { transform: rotate(-5deg) scale(1.01); opacity: 1; }
        }
        @keyframes sparkFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.6; }
          50% { transform: translateY(-5px) rotate(180deg); opacity: 1; }
        }

        /* === CELESTIAL RING === */
        .aura-celestial-simple {
          position: absolute;
          inset: -8%;
          border-radius: 50%;
          border: 2px solid rgba(99, 102, 241, 0.3);
          box-shadow: 0 0 20px rgba(56, 189, 248, 0.15),
                      0 0 40px rgba(99, 102, 241, 0.1),
                      inset 0 0 20px rgba(168, 85, 247, 0.05);
          animation: celestialSubtle 6s ease-in-out infinite;
        }
        @keyframes celestialSubtle {
          0%, 100% { 
            opacity: 0.5; 
            transform: rotate(0deg) scale(0.98);
            box-shadow: 0 0 15px rgba(56, 189, 248, 0.1),
                        0 0 30px rgba(99, 102, 241, 0.08);
          }
          50% { 
            opacity: 0.8; 
            transform: rotate(180deg) scale(1.02);
            box-shadow: 0 0 25px rgba(56, 189, 248, 0.2),
                        0 0 50px rgba(99, 102, 241, 0.15);
          }
        }

        /* === VERDANT PULSE === */
        .aura-verdant-core {
          position: absolute;
          inset: -8%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(74, 222, 128, 0.5) 0%, rgba(16, 185, 129, 0.3) 50%, transparent 70%);
          filter: blur(10px);
          animation: verdantBreathe 5s ease-in-out infinite;
        }
        .aura-verdant-leaves {
          position: absolute;
          inset: -12%;
          border-radius: 50%;
          background: conic-gradient(from 0deg, 
            transparent 0deg, rgba(74, 222, 128, 0.4) 30deg, transparent 60deg,
            transparent 90deg, rgba(34, 197, 94, 0.3) 120deg, transparent 150deg,
            transparent 180deg, rgba(74, 222, 128, 0.4) 210deg, transparent 240deg,
            transparent 270deg, rgba(34, 197, 94, 0.3) 300deg, transparent 330deg
          );
          filter: blur(6px);
          animation: verdantSway 6s ease-in-out infinite;
        }
        .aura-verdant-particles {
          position: absolute;
          inset: -18%;
          border-radius: 50%;
          background: radial-gradient(circle at 20% 30%, rgba(74, 222, 128, 0.7) 0%, transparent 5%),
                      radial-gradient(circle at 80% 25%, rgba(34, 197, 94, 0.6) 0%, transparent 4%),
                      radial-gradient(circle at 15% 75%, rgba(16, 185, 129, 0.5) 0%, transparent 4%),
                      radial-gradient(circle at 75% 80%, rgba(74, 222, 128, 0.6) 0%, transparent 5%),
                      radial-gradient(circle at 50% 15%, rgba(34, 197, 94, 0.5) 0%, transparent 3%);
          animation: verdantFloat 7s ease-in-out infinite;
        }
        @keyframes verdantBreathe {
          0%, 100% { transform: scale(0.92); opacity: 0.7; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes verdantSway {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(8deg) scale(1.02); }
          75% { transform: rotate(-8deg) scale(0.98); }
        }
        @keyframes verdantFloat {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.5; }
          50% { transform: translateY(-8px) scale(1.05); opacity: 0.9; }
        }

        /* === INFERNO BLAZE === */
        .aura-inferno-base {
          position: absolute;
          bottom: 0;
          left: -20%;
          right: -20%;
          height: 60%;
          background: radial-gradient(ellipse at 50% 100%, rgba(239, 68, 68, 0.6) 0%, rgba(249, 115, 22, 0.4) 40%, transparent 70%);
          filter: blur(15px);
          animation: infernoBase 2s ease-in-out infinite;
        }
        .aura-inferno-flames {
          position: absolute;
          inset: -30%;
          overflow: visible;
        }
        .flame {
          position: absolute;
          bottom: 20%;
          width: 25%;
          height: 50%;
          border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
          filter: blur(4px);
          transform-origin: bottom center;
        }
        .flame-1 {
          left: 10%;
          background: linear-gradient(to top, rgba(239, 68, 68, 0.8), rgba(251, 191, 36, 0.6), transparent);
          animation: flameRise 1.2s ease-in-out infinite;
        }
        .flame-2 {
          left: 25%;
          background: linear-gradient(to top, rgba(249, 115, 22, 0.9), rgba(253, 224, 71, 0.5), transparent);
          animation: flameRise 0.9s ease-in-out infinite 0.1s;
        }
        .flame-3 {
          left: 40%;
          background: linear-gradient(to top, rgba(239, 68, 68, 0.85), rgba(251, 191, 36, 0.7), transparent);
          animation: flameRise 1.4s ease-in-out infinite 0.3s;
        }
        .flame-4 {
          left: 55%;
          background: linear-gradient(to top, rgba(251, 146, 60, 0.9), rgba(253, 224, 71, 0.6), transparent);
          animation: flameRise 1.1s ease-in-out infinite 0.2s;
        }
        .flame-5 {
          left: 70%;
          background: linear-gradient(to top, rgba(239, 68, 68, 0.8), rgba(251, 191, 36, 0.5), transparent);
          animation: flameRise 1.3s ease-in-out infinite 0.4s;
        }
        .flame-6 {
          left: 20%;
          width: 20%;
          height: 40%;
          background: linear-gradient(to top, rgba(253, 224, 71, 0.9), rgba(251, 191, 36, 0.4), transparent);
          animation: flameRise 0.8s ease-in-out infinite 0.15s;
        }
        .flame-7 {
          left: 50%;
          width: 18%;
          height: 45%;
          background: linear-gradient(to top, rgba(251, 146, 60, 0.95), rgba(253, 224, 71, 0.5), transparent);
          animation: flameRise 1.0s ease-in-out infinite 0.25s;
        }
        .flame-8 {
          left: 65%;
          width: 22%;
          height: 35%;
          background: linear-gradient(to top, rgba(253, 224, 71, 0.85), rgba(251, 191, 36, 0.3), transparent);
          animation: flameRise 0.85s ease-in-out infinite 0.35s;
        }
        .aura-inferno-glow {
          position: absolute;
          inset: -25%;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 70%, rgba(249, 115, 22, 0.4) 0%, rgba(239, 68, 68, 0.2) 40%, transparent 70%);
          filter: blur(20px);
          animation: infernoGlow 3s ease-in-out infinite;
        }
        .aura-inferno-embers {
          position: absolute;
          inset: -40%;
          background: radial-gradient(circle at 20% 40%, rgba(253, 224, 71, 1) 0%, transparent 3%),
                      radial-gradient(circle at 80% 35%, rgba(251, 191, 36, 0.9) 0%, transparent 2%),
                      radial-gradient(circle at 30% 20%, rgba(249, 115, 22, 0.8) 0%, transparent 2%),
                      radial-gradient(circle at 70% 25%, rgba(253, 224, 71, 0.9) 0%, transparent 2.5%),
                      radial-gradient(circle at 15% 55%, rgba(251, 146, 60, 0.85) 0%, transparent 2%),
                      radial-gradient(circle at 85% 50%, rgba(253, 224, 71, 0.8) 0%, transparent 2%),
                      radial-gradient(circle at 40% 15%, rgba(251, 191, 36, 0.9) 0%, transparent 1.5%),
                      radial-gradient(circle at 60% 10%, rgba(249, 115, 22, 0.7) 0%, transparent 2%);
          animation: embersFloat 4s ease-in-out infinite;
        }
        @keyframes flameRise {
          0%, 100% {
            transform: scaleY(0.8) scaleX(0.9) translateY(0);
            opacity: 0.7;
          }
          50% {
            transform: scaleY(1.2) scaleX(1.1) translateY(-15%);
            opacity: 1;
          }
        }
        @keyframes infernoBase {
          0%, 100% { transform: scaleX(0.95); opacity: 0.7; }
          50% { transform: scaleX(1.05); opacity: 1; }
        }
        @keyframes infernoGlow {
          0%, 100% { transform: scale(0.95); opacity: 0.6; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        @keyframes embersFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.4; }
          25% { transform: translateY(-10px) rotate(5deg); opacity: 0.8; }
          50% { transform: translateY(-20px) rotate(0deg); opacity: 0.6; }
          75% { transform: translateY(-10px) rotate(-5deg); opacity: 0.9; }
        }

        /* === COSMIC ORBIT (Solar System) === */
        .aura-solar-sun {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 20%;
          height: 20%;
          margin: -10% 0 0 -10%;
          background: radial-gradient(circle, rgba(255, 208, 0, 0.8) 0%, rgba(249, 183, 0, 0.5) 40%, transparent 70%);
          border-radius: 50%;
          filter: blur(4px);
          animation: sunPulse 4s ease-in-out infinite;
        }
        .aura-solar-orbit {
          position: absolute;
          top: 50%;
          left: 50%;
          border: 1px solid rgba(102, 166, 229, 0.15);
          border-radius: 50%;
        }
        .planet {
          position: absolute;
          top: 0;
          left: 50%;
          border-radius: 50%;
          transform: translateX(-50%) translateY(-50%);
        }
        /* Mercury - closest, fastest */
        .orbit-1 {
          width: 55%;
          height: 55%;
          margin: -27.5% 0 0 -27.5%;
          animation: planetOrbit 4s linear infinite;
        }
        .planet-mercury {
          width: 6px;
          height: 6px;
          background: radial-gradient(circle at 30% 30%, #c7c7c7, #8a8a8a);
          box-shadow: 0 0 4px rgba(199, 199, 199, 0.6);
        }
        /* Venus */
        .orbit-2 {
          width: 70%;
          height: 70%;
          margin: -35% 0 0 -35%;
          animation: planetOrbit 7s linear infinite;
        }
        .planet-venus {
          width: 8px;
          height: 8px;
          background: radial-gradient(circle at 30% 30%, #e8cda0, #c4a66a);
          box-shadow: 0 0 5px rgba(232, 205, 160, 0.6);
        }
        /* Earth with moon */
        .orbit-3 {
          width: 90%;
          height: 90%;
          margin: -45% 0 0 -45%;
          animation: planetOrbit 12s linear infinite;
        }
        .planet-earth {
          width: 10px;
          height: 10px;
          background: radial-gradient(circle at 30% 30%, #6eb5ff, #2d8bce);
          box-shadow: 0 0 6px rgba(110, 181, 255, 0.7);
        }
        .moon {
          position: absolute;
          width: 4px;
          height: 4px;
          background: radial-gradient(circle at 30% 30%, #e0e0e0, #a0a0a0);
          border-radius: 50%;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          animation: moonOrbit 2s linear infinite;
        }
        /* Mars */
        .orbit-4 {
          width: 115%;
          height: 115%;
          margin: -57.5% 0 0 -57.5%;
          animation: planetOrbit 18s linear infinite;
        }
        .planet-mars {
          width: 7px;
          height: 7px;
          background: radial-gradient(circle at 30% 30%, #e27b58, #a44a2a);
          box-shadow: 0 0 5px rgba(226, 123, 88, 0.6);
        }
        /* Saturn with ring */
        .orbit-5 {
          width: 140%;
          height: 140%;
          margin: -70% 0 0 -70%;
          animation: planetOrbit 28s linear infinite;
        }
        .planet-saturn {
          width: 12px;
          height: 12px;
          background: radial-gradient(circle at 30% 30%, #e8d5a3, #c4a55a);
          box-shadow: 0 0 6px rgba(232, 213, 163, 0.6);
        }
        .saturn-ring {
          position: absolute;
          width: 20px;
          height: 6px;
          border: 1px solid rgba(200, 180, 140, 0.7);
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotateX(70deg);
        }
        /* Star particles background */
        .aura-solar-stars {
          position: absolute;
          inset: -20%;
          background: radial-gradient(circle at 15% 20%, white 0%, transparent 1.5%),
                      radial-gradient(circle at 85% 15%, rgba(255,255,255,0.8) 0%, transparent 1%),
                      radial-gradient(circle at 10% 80%, rgba(255,255,255,0.7) 0%, transparent 1%),
                      radial-gradient(circle at 92% 75%, white 0%, transparent 1.2%),
                      radial-gradient(circle at 50% 5%, rgba(255,255,255,0.9) 0%, transparent 1%),
                      radial-gradient(circle at 25% 50%, rgba(200,200,255,0.6) 0%, transparent 0.8%),
                      radial-gradient(circle at 75% 55%, rgba(255,220,180,0.5) 0%, transparent 0.8%),
                      radial-gradient(circle at 40% 90%, rgba(255,255,255,0.8) 0%, transparent 1%);
          animation: starsTwinkle 3s ease-in-out infinite;
        }
        @keyframes planetOrbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes moonOrbit {
          from { transform: translateX(-50%) rotate(0deg) translateY(-8px); }
          to { transform: translateX(-50%) rotate(360deg) translateY(-8px); }
        }
        @keyframes sunPulse {
          0%, 100% { transform: scale(0.95); opacity: 0.7; filter: blur(4px); }
          50% { transform: scale(1.05); opacity: 1; filter: blur(6px); }
        }
        @keyframes starsTwinkle {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
      <div className={`${className} mx-auto transition-all duration-500 relative`}>
        {activeAuraId && (
          <div className="absolute inset-0 pointer-events-none">
            {renderAura(activeAuraId)}
          </div>
        )}
        <img
          src={getPhoenixImageUrl()}
          alt={ranks[rankLevel]?.name || 'Phoenix'}
          className="relative z-10 w-full h-full object-contain drop-shadow-[0_5px_15px_rgba(253,224,71,0.3)]"
          onError={(e) => { e.target.onerror = null; e.target.src = '/img/placeholder.png'; }}
        />
      </div>
    </>
  );
};

export default PhoenixImage;
