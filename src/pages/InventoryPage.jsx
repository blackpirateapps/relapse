import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from '../App.jsx';
import { usePotion } from '../api.js';
import Modal from '../components/Modal.jsx';

function InventoryPage() {
  const { state, refetchData } = useContext(AppContext);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const potionInventory = Number(state?.potion_inventory || 0);
  const activeUntil = state?.potion_active_until ? new Date(state.potion_active_until) : null;
  const isActive = activeUntil && activeUntil.getTime() > now;

  const timeRemaining = useMemo(() => {
    if (!isActive) return null;
    const diff = Math.max(0, activeUntil.getTime() - now);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }, [activeUntil, isActive, now]);

  const handleUsePotion = async () => {
    try {
      const result = await usePotion();
      setModal({ isOpen: true, title: result.success ? 'Potion Activated' : 'Error', message: result.message });
      if (result.success) {
        await refetchData();
      }
    } catch (error) {
      setModal({ isOpen: true, title: 'Error', message: error.message || 'Failed to use potion.' });
    }
  };

  return (
    <>
      <section className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-yellow-300/70 mb-3">Inventory</p>
          <h1 className="text-3xl sm:text-4xl font-serif-display text-white">Your Supplies</h1>
          <p className="text-gray-400 mt-3 max-w-2xl">
            Potions are consumed here. When active, one relapse can be shielded for 12 hours.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="card p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <img
                src="/img/potion-phoenix-guard.svg"
                alt="Phoenix Guard Potion"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                loading="lazy"
                decoding="async"
              />
              <div>
                <h2 className="text-2xl font-semibold text-white">Phoenix Guard Potion</h2>
                <p className="text-gray-400">Shield one relapse and keep the streak intact.</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-widest text-yellow-300">Available</p>
                <p className="text-2xl font-semibold text-white">{potionInventory}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-widest text-green-300">Status</p>
                <p className="text-lg font-semibold text-white">{isActive ? 'Active' : 'Idle'}</p>
                {isActive && <p className="text-xs text-gray-400 mt-1">Time remaining: {timeRemaining}</p>}
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                onClick={handleUsePotion}
                disabled={potionInventory <= 0 || isActive}
                className={`w-full sm:w-auto px-6 py-3 rounded-lg font-semibold transition-colors ${
                  potionInventory > 0 && !isActive
                    ? 'bg-amber-400 text-gray-900 hover:bg-amber-300'
                    : 'bg-gray-700 text-gray-300 cursor-not-allowed'
                }`}
              >
                {isActive ? 'Potion Active' : 'Use Potion'}
              </button>
              <p className="text-xs text-gray-400 mt-2">
                Only one relapse is shielded per active potion. Protection lasts 12 hours.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
            <h3 className="text-xl font-semibold text-white">Potion Rules</h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-300">
              <li>Up to two purchases per streak.</li>
              <li>Only one purchase every 2 days.</li>
              <li>One relapse can be shielded during the 12-hour effect.</li>
              <li>After two shielded relapses in a streak, future relapses reset normally.</li>
            </ul>
          </div>
        </div>
      </section>

      <Modal isOpen={modal.isOpen} onClose={() => setModal({ isOpen: false, title: '', message: '' })} title={modal.title}>
        <p>{modal.message}</p>
      </Modal>
    </>
  );
}

export default InventoryPage;
