import React, { useContext, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AppContext } from '../App.jsx';
import PhoenixImage from '../components/PhoenixImage.jsx';

const formatHours = (hours) => {
  const safeHours = Math.max(0, Math.round(hours));
  const days = Math.floor(safeHours / 24);
  const remHours = safeHours % 24;
  return `${days}d ${remHours}h`;
};

function LevelShowcasePage() {
  const { state, ranks, getRank } = useContext(AppContext);
  const [searchParams] = useSearchParams();
  const initialIndex = Math.max(0, Math.min(ranks.length - 1, Number(searchParams.get('level')) || 0));
  const [index, setIndex] = useState(initialIndex);

  const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
  const currentRank = getRank(totalHours);

  const currentLevel = useMemo(() => ranks[index], [ranks, index]);
  const remainingHours = Math.max(0, currentLevel.hours - totalHours);

  const goPrev = () => setIndex((prev) => (prev > 0 ? prev - 1 : prev));
  const goNext = () => setIndex((prev) => (prev < ranks.length - 1 ? prev + 1 : prev));

  return (
    <section className="min-h-[75vh] flex flex-col items-center justify-center text-center relative overflow-hidden">
      <motion.div
        key={`halo-${index}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 0.6, scale: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 0.6 }}
        className="pointer-events-none absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gradient-to-br from-yellow-500/40 via-pink-500/30 to-cyan-500/40 blur-3xl"
      />

      <div className="mb-6 w-full max-w-4xl">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Level {index + 1} of {ranks.length}</span>
          <Link to="/progression" className="text-yellow-400 hover:text-yellow-300">Back to progression</Link>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentLevel.id}
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="card w-full max-w-4xl p-6 sm:p-10 relative overflow-hidden"
        >
          <motion.div
            key={`rays-${index}`}
            initial={{ opacity: 0, rotate: 0 }}
            animate={{ opacity: 0.7, rotate: 15 }}
            exit={{ opacity: 0, rotate: -10 }}
            transition={{ duration: 0.6 }}
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gradient-to-br from-amber-400/30 via-orange-500/20 to-fuchsia-500/20 blur-3xl"
          />

          <div className="flex flex-col gap-10 items-center">
            <motion.div
              key={`hero-${index}`}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="w-full flex justify-center"
            >
              <PhoenixImage
                rankLevel={index}
                equippedUpgrades={state.equipped_upgrades}
                className="w-full max-w-xl h-72 sm:h-96 object-contain rounded-2xl bg-gradient-to-br from-black/30 via-gray-900/20 to-black/30 shadow-[0_0_40px_rgba(255,180,60,0.35)]"
              />
            </motion.div>

            <div className="text-left w-full max-w-2xl">
              <h2 className="text-3xl sm:text-4xl font-bold text-white">{currentLevel.name}</h2>
              <p className="mt-3 text-lg text-gray-300">{currentLevel.storyline}</p>
              <div className="mt-6 space-y-2 text-sm sm:text-base text-gray-300">
                <p><span className="text-gray-400">Coin bonus:</span> <span className="text-yellow-400 font-semibold">+${currentLevel.reward.toLocaleString()} Coins</span></p>
                <p><span className="text-gray-400">Unlocks at:</span> {formatHours(currentLevel.hours)}</p>
                <p>
                  <span className="text-gray-400">Time to reach:</span>{' '}
                  {currentRank.level >= index ? 'Unlocked' : formatHours(remainingHours)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-8 w-full max-w-4xl flex items-center justify-between">
        <button
          type="button"
          onClick={goPrev}
          disabled={index === 0}
          className="px-4 py-2 rounded-md bg-gray-800 text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={index === ranks.length - 1}
          className="px-4 py-2 rounded-md bg-yellow-500 text-gray-900 font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-yellow-400"
        >
          Next
        </button>
      </div>
    </section>
  );
}

export default LevelShowcasePage;
