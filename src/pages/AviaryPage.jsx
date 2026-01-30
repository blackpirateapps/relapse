import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext } from '../App.jsx';
import { fetchHistory } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import PhoenixImage from '../components/PhoenixImage.jsx';

function AviaryPage() {
  const { state, currentRank } = useContext(AppContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoenix, setSelectedPhoenix] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const historyData = await fetchHistory();
        setHistory(historyData);
      } catch (error) {
        console.error("Failed to fetch history", error);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);
  
  const formatHistoricStreak = (ms) => {
    if (!ms || ms < 0) return "0m";
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const parseUpgrades = (jsonString) => {
    try {
      return JSON.parse(jsonString || '{}');
    } catch (e) {
      console.error("Failed to parse upgrades JSON:", jsonString);
      return {};
    }
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getPhoenixDetails = (phoenix) => {
    if (!phoenix) return null;
    const isCurrent = phoenix.type === 'current';
    const startDate = isCurrent ? state?.lastRelapse : phoenix.start_date;
    const endDate = isCurrent ? null : phoenix.end_date;
    const streakMs = isCurrent && state?.lastRelapse
      ? Math.max(0, Date.now() - new Date(state.lastRelapse).getTime())
      : (phoenix.streak_duration_ms || 0);
    const upgrades = isCurrent ? (state?.equipped_upgrades || {}) : parseUpgrades(phoenix.upgrades_json);
    const equippedList = Object.keys(upgrades).filter((key) => upgrades[key]);
    return {
      isCurrent,
      startDate,
      endDate,
      streakMs,
      equippedList
    };
  };

  const items = useMemo(() => {
    const current = {
      type: 'current',
      id: 'current',
      final_rank_level: currentRank.level,
      final_rank_name: currentRank.name,
      upgrades_json: state.equipped_upgrades,
      name: 'In Progress',
      streak_duration_ms: null,
      start_date: state.lastRelapse,
      end_date: null
    };
    return [current, ...history.map((phoenix) => ({ type: 'history', ...phoenix }))];
  }, [currentRank, history, state.equipped_upgrades]);

  if (loading) {
    return <LoadingSpinner />;
  }

  const isEmpty = history.length === 0;
  const totalLives = history.length + 1;
  const longestStreakMs = typeof state?.longestStreak === 'number' ? state.longestStreak : null;

  return (
    <section>
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-yellow-300/70 mb-3">Aviary</p>
          <h1 className="text-3xl sm:text-4xl font-serif-display text-white">Your Phoenix Lineage</h1>
          <p className="text-gray-400 mt-3 max-w-2xl">
            Every streak becomes a living record. Tap any phoenix to revisit its journey, loadout, and timeline.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 lg:w-[420px]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-widest text-yellow-300">Lives</p>
            <p className="text-2xl font-semibold text-white">{totalLives}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-widest text-green-300">Longest</p>
            <p className="text-2xl font-semibold text-white">{formatHistoricStreak(longestStreakMs)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-widest text-blue-300">Current Rank</p>
            <p className="text-lg font-semibold text-white">{currentRank?.name || '—'}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {items.map((phoenix) => {
          if (phoenix.type === 'current') {
            return (
              <button
                key={phoenix.id}
                type="button"
                onClick={() => setSelectedPhoenix(phoenix)}
                className="relative overflow-hidden rounded-2xl border border-yellow-400/50 bg-gradient-to-br from-yellow-500/15 via-gray-900/70 to-gray-900/40 p-6 text-center transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-400/60"
              >
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,rgba(253,224,71,0.25),transparent_55%)]" />
                <div className="absolute top-3 right-3 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">LIVE</div>
                <div className="relative flex flex-col items-center">
                  <PhoenixImage
                    rankLevel={phoenix.final_rank_level}
                    equippedUpgrades={state.equipped_upgrades}
                    className="w-24 h-24 mb-4"
                  />
                  <h3 className="font-serif-display text-xl text-white">{phoenix.final_rank_name}</h3>
                  <p className="text-lg font-bold font-mono text-green-400 mt-2">In Progress</p>
                </div>
              </button>
            );
          }
          return (
            <button
              key={phoenix.id}
              type="button"
              onClick={() => setSelectedPhoenix(phoenix)}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-400/60"
            >
              <PhoenixImage
                rankLevel={phoenix.final_rank_level}
                equippedUpgrades={parseUpgrades(phoenix.upgrades_json)}
                className="w-24 h-24 mb-4"
              />
              <h3 className="font-serif-display text-xl text-white">{phoenix.final_rank_name}</h3>
              <p className="text-sm text-gray-400 mb-2">{phoenix.name || 'Past Life'}</p>
              <p className="text-lg font-bold text-green-400">{formatHistoricStreak(phoenix.streak_duration_ms)}</p>
            </button>
          );
        })}
      </div>
      {isEmpty && (
        <div className="text-center text-gray-400 mt-10">
          <p className="text-lg">Your Aviary is just getting started.</p>
          <p className="text-sm mt-2">When a streak ends, your phoenix will be immortalized here.</p>
        </div>
      )}
      {selectedPhoenix && (
        <div
          className="fixed inset-0 z-50 bg-black/80 overflow-y-auto"
          onClick={() => setSelectedPhoenix(null)}
        >
          <div className="min-h-screen w-full px-4 sm:px-8 py-10">
            <div
              className="mx-auto w-full max-w-5xl bg-gray-900/95 border border-gray-700 rounded-3xl p-5 sm:p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const details = getPhoenixDetails(selectedPhoenix);
                const title = selectedPhoenix.name || (details?.isCurrent ? 'In Progress' : 'Past Life');
                return (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-yellow-300/70 mb-2">
                          {details?.isCurrent ? 'Current Journey' : 'Aviary Record'}
                        </p>
                        <h2 className="text-3xl sm:text-4xl font-serif-display text-white">{title}</h2>
                        <p className="text-gray-400 mt-2">{selectedPhoenix.final_rank_name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPhoenix(null)}
                        className="self-start sm:self-center bg-gray-800 text-gray-200 hover:bg-gray-700 px-4 py-2 rounded-lg"
                      >
                        Close
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 sm:gap-8">
                      <div className="flex flex-col items-center text-center bg-gray-800/60 border border-gray-700 rounded-2xl p-6">
                        <PhoenixImage
                          rankLevel={selectedPhoenix.final_rank_level}
                          equippedUpgrades={details?.isCurrent ? state.equipped_upgrades : parseUpgrades(selectedPhoenix.upgrades_json)}
                          className="w-32 h-32 sm:w-40 sm:h-40 mb-4"
                        />
                        <p className="text-sm text-gray-400">Rank Level</p>
                        <p className="text-xl font-semibold text-white">{selectedPhoenix.final_rank_level}</p>
                        <p className="text-sm text-gray-400 mt-4">Streak Length</p>
                        <p className="text-xl font-mono text-green-300">{formatHistoricStreak(details?.streakMs)}</p>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
                          <h3 className="text-lg font-semibold text-white mb-4">Timeline</h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-300">
                            <div>
                              <p className="text-gray-500">Start</p>
                              <p>{formatDateTime(details?.startDate)}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">End</p>
                              <p>{details?.isCurrent ? 'In progress' : formatDateTime(details?.endDate)}</p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
                          <h3 className="text-lg font-semibold text-white mb-4">Equipped Upgrades</h3>
                          {details?.equippedList?.length ? (
                            <div className="flex flex-wrap gap-2">
                              {details.equippedList.map((upgradeId) => (
                                <span
                                  key={upgradeId}
                                  className="px-3 py-1 rounded-full bg-gray-700 text-gray-200 text-xs tracking-wide"
                                >
                                  {upgradeId.replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-400 text-sm">No upgrades equipped.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default AviaryPage;
