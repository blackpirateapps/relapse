import React, { useContext, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../App.jsx';
import { buyItem, equipItem } from '../api.js';
import Modal from '../components/Modal.jsx';

const buildDescription = (item) => {
  if (!item) return '';
  const base = item.description || '';
  const templates = {
    background_theme: `A full-scene backdrop tuned for focus sessions and late-night streaks. Expect rich motion, soft parallax, and a mood shift that makes every visit feel fresh.`,
    forest_theme: `A forest skin that deepens the sanctuary vibe with layered atmospherics and a calmer palette. It keeps the journey page grounded while still feeling cinematic.`,
    phoenix_skin: `A forged skin with a mythic silhouette and brighter ember highlights. It evolves through every rank so your phoenix looks like it’s actually growing with you.`,
    tree_sapling: `A living marker of your recovery timeline. Each stage matures over time, giving you a visual reminder that small habits compound into real growth.`
  };
  const addon = templates[item.type] || `A crafted upgrade designed to make your journey feel more personal and rewarding.`;
  return `${base}\n\n${addon}`;
};

const formatDate = (isoDate) => {
  if (!isoDate) return null;
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

function ShopItemPage() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { state, shopItems, totalCoins, refetchData, setPreviewThemeId } = useContext(AppContext);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });

  const item = useMemo(() => shopItems.find((entry) => entry.id === itemId), [shopItems, itemId]);

  const handleBuy = async (id) => {
    try {
      const result = await buyItem(id);
      setModal({ isOpen: true, title: result.success ? 'Success!' : 'Error', message: result.message });
      if (result.success) {
        await refetchData();
      }
    } catch (error) {
      setModal({ isOpen: true, title: 'Error', message: error.message || 'Purchase failed.' });
    }
  };

  const handleEquip = async (id, equip) => {
    try {
      const result = await equipItem(id, equip);
      setModal({ isOpen: true, title: result.success ? 'Success!' : 'Error', message: result.message });
      if (result.success) {
        await refetchData();
      }
    } catch (error) {
      setModal({ isOpen: true, title: 'Error', message: error.message || 'Failed to equip item.' });
    }
  };

  const getPurchaseDate = () => {
    if (!state || !item) return null;
    if (item.type === 'tree_sapling') {
      const matches = (state.forest || []).filter((tree) => tree.treeType === item.id);
      if (!matches.length) return null;
      const latest = matches.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate))[0];
      return latest?.purchaseDate || null;
    }
    const upgradeEntry = state.upgrades?.[item.id];
    if (upgradeEntry && typeof upgradeEntry === 'object') {
      return upgradeEntry.purchasedAt || null;
    }
    return null;
  };

  const purchaseDate = getPurchaseDate();
  const isOwned = !!state?.upgrades?.[item?.id] || (item?.type === 'tree_sapling' && !!purchaseDate);
  const isEquipped = !!state?.equipped_upgrades?.[item?.id];
  const isBackgroundTheme = item?.type === 'background_theme';
  const isForestTheme = item?.type === 'forest_theme';
  const canAfford = item ? totalCoins >= item.cost : false;

  if (!item) {
    return (
      <div className="card p-6">
        <h2 className="text-2xl font-bold text-white">Item not found</h2>
        <p className="text-gray-400 mt-2">We couldn’t locate that shop item.</p>
        <button
          type="button"
          onClick={() => navigate('/shop')}
          className="mt-6 px-4 py-2 rounded-lg bg-yellow-500 text-gray-900 font-semibold hover:bg-yellow-400"
        >
          Back to Shop
        </button>
      </div>
    );
  }

  const previewButton = (isBackgroundTheme || isForestTheme) ? (
    <button
      type="button"
      onClick={() => setPreviewThemeId(item.id)}
      className="w-full bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded transition-colors"
    >
      Preview
    </button>
  ) : null;

  const actionButtons = () => {
    if (isOwned && item.type !== 'tree_sapling') {
      const equipButton = isEquipped
        ? <button type="button" onClick={() => handleEquip(item.id, false)} className="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded transition-colors">Unequip</button>
        : <button type="button" onClick={() => handleEquip(item.id, true)} className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition-colors">Equip</button>;
      if (previewButton) {
        return <div className="space-y-3">{previewButton}{equipButton}</div>;
      }
      return equipButton;
    }

    if (isOwned && item.type === 'tree_sapling') {
      return <div className="w-full bg-green-700 text-white px-4 py-2 rounded text-center">Owned</div>;
    }

    const buyButton = (
      <button
        type="button"
        onClick={() => handleBuy(item.id)}
        disabled={!canAfford}
        className={`w-full ${canAfford ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-600 cursor-not-allowed'} text-white px-4 py-2 rounded transition-colors`}
      >
        Buy for {item.cost.toLocaleString()} Coins
      </button>
    );
    if (previewButton) {
      return <div className="space-y-3">{previewButton}{buyButton}</div>;
    }
    return buyButton;
  };

  return (
    <>
      <div className="mb-6">
        <Link to="/shop" className="text-sm text-yellow-300 hover:text-yellow-200">
          ← Back to Shop
        </Link>
      </div>
      <div className="card p-6 md:p-8">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <div>
            <img
              src={item.preview_image || '/img/placeholder.png'}
              alt={item.name}
              className="w-full h-56 sm:h-72 object-contain rounded-lg bg-black/20"
              loading="lazy"
              decoding="async"
            />
            <div className="mt-6 space-y-3">
              {actionButtons()}
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-white font-serif-display">{item.name}</h1>
              <p className="text-sm text-gray-400 mt-1 capitalize">{item.type.replace('_', ' ')}</p>
            </div>
            <div className="text-gray-300 whitespace-pre-line leading-relaxed">
              {buildDescription(item)}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-wider text-yellow-300">Cost</p>
                <p className="text-xl font-semibold text-white">{item.cost.toLocaleString()} coins</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-wider text-green-300">Status</p>
                <p className="text-lg font-semibold text-white">{isOwned ? 'Owned' : 'Available'}</p>
                {isOwned && (
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDate(purchaseDate) ? `Purchased on ${formatDate(purchaseDate)}` : 'Purchased date unavailable'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Modal isOpen={modal.isOpen} onClose={() => setModal({ isOpen: false, title: '', message: '' })} title={modal.title}>
        <p>{modal.message}</p>
      </Modal>
    </>
  );
}

export default ShopItemPage;
