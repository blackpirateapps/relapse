import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext } from '../App.jsx';
import { fetchHistory } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import PhoenixImage from '../components/PhoenixImage.jsx';
import { VirtuosoGrid } from 'react-virtuoso';

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

  return (
    <section>
      <div className="h-[70vh]">
        <VirtuosoGrid
          data={items}
          totalCount={items.length}
          itemContent={(index, phoenix) => {
            if (phoenix.type === 'current') {
              return (
                <button
                  type="button"
                  onClick={() => setSelectedPhoenix(phoenix)}
                  className="card p-6 flex flex-col items-center text-center border-2 border-yellow-400/50 relative transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-400/60"
                >
                  <div className="absolute top-2 right-2 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">LIVE</div>
                  <PhoenixImage 
                    rankLevel={phoenix.final_rank_level} 
                    equippedUpgrades={state.equipped_upgrades}
                    className="w-24 h-24 mb-4"
                  />
                  <h3 className="font-serif-display text-xl text-white">{phoenix.final_rank_name}</h3>
                  <p className="text-lg font-bold font-mono text-green-400 mt-2">In Progress</p>
                </button>
              );
            }
            return (
              <button
                type="button"
                onClick={() => setSelectedPhoenix(phoenix)}
                className="card p-6 flex flex-col items-center text-center transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-yellow-400/60"
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
          }}
          listClassName="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        />
      </div>
      {isEmpty && (
        <div className="text-center text-gray-400 mt-10">
          <p className="text-lg">Your Aviary is empty.</p>
          <p className="text-sm mt-2">When a streak ends, your phoenix will be immortalized here.</p>
        </div>
      )}
      {selectedPhoenix && (
        <div
          className="fixed inset-0 z-50 bg-black/80"
          onClick={() => setSelectedPhoenix(null)}
        >
          <div className="min-h-screen w-full px-4 sm:px-8 py-10">
            <div
              className="mx-auto w-full max-w-5xl bg-gray-900/95 border border-gray-700 rounded-3xl p-8 shadow-2xl"
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

                    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
                      <div className="flex flex-col items-center text-center bg-gray-800/60 border border-gray-700 rounded-2xl p-6">
                        <PhoenixImage
                          rankLevel={selectedPhoenix.final_rank_level}
                          equippedUpgrades={details?.isCurrent ? state.equipped_upgrades : parseUpgrades(selectedPhoenix.upgrades_json)}
                          className="w-40 h-40 mb-4"
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
