import React, { useContext, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
    <section className="min-h-[70vh] flex flex-col items-center justify-center text-center">
      <div className="mb-6 w-full max-w-2xl">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Level {index + 1} of {ranks.length}</span>
          <Link to="/progression" className="text-yellow-400 hover:text-yellow-300">Back to progression</Link>
        </div>
      </div>

      <div className="card w-full max-w-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6 items-center">
          <PhoenixImage
            rankLevel={index}
            equippedUpgrades={state.equipped_upgrades}
            className="w-40 h-40 object-contain rounded-xl bg-black/20 shrink-0"
          />
          <div className="text-left w-full">
            <h2 className="text-2xl font-bold text-white">{currentLevel.name}</h2>
            <p className="mt-2 text-gray-300">{currentLevel.storyline}</p>
            <div className="mt-4 space-y-1 text-sm text-gray-300">
              <p><span className="text-gray-400">Coin bonus:</span> <span className="text-yellow-400 font-semibold">+${currentLevel.reward.toLocaleString()} Coins</span></p>
              <p><span className="text-gray-400">Unlocks at:</span> {formatHours(currentLevel.hours)}</p>
              <p>
                <span className="text-gray-400">Time to reach:</span>{' '}
                {currentRank.level >= index ? 'Unlocked' : formatHours(remainingHours)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
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
      </div>
    </section>
  );
}

export default LevelShowcasePage;
