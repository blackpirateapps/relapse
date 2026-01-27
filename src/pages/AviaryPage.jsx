import React, { useState, useEffect, useContext, useMemo, useRef } from 'react';
import { AppContext } from '../App.jsx';
import { fetchHistory } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import PhoenixImage from '../components/PhoenixImage.jsx';

function AviaryPage() {
  const { state, currentRank } = useContext(AppContext);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scrollState, setScrollState] = useState({ top: 0, height: 0, width: 0 });
  const gridRef = useRef(null);

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

  if (loading) {
    return <LoadingSpinner />;
  }

  const items = useMemo(() => {
    const current = {
      type: 'current',
      id: 'current',
      final_rank_level: currentRank.level,
      final_rank_name: currentRank.name,
      upgrades_json: state.equipped_upgrades,
      name: 'In Progress',
      streak_duration_ms: null
    };
    return [current, ...history.map((phoenix) => ({ type: 'history', ...phoenix }))];
  }, [currentRank, history, state.equipped_upgrades]);

  useEffect(() => {
    const scrollEl = document.querySelector('main');
    if (!scrollEl) return;

    const update = () => {
      const width = gridRef.current?.clientWidth || 0;
      setScrollState({ top: scrollEl.scrollTop, height: scrollEl.clientHeight, width });
    };
    const onScroll = () => {
      setScrollState((prev) => ({ ...prev, top: scrollEl.scrollTop }));
    };

    update();
    scrollEl.addEventListener('scroll', onScroll);
    window.addEventListener('resize', update);

    const observer = new ResizeObserver(update);
    if (gridRef.current) observer.observe(gridRef.current);

    return () => {
      scrollEl.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
      observer.disconnect();
    };
  }, []);

  const columns = useMemo(() => {
    const width = scrollState.width;
    if (width >= 1280) return 4;
    if (width >= 1024) return 3;
    if (width >= 768) return 2;
    return 1;
  }, [scrollState.width]);

  const rowHeight = 250;
  const totalRows = Math.ceil(items.length / columns);
  const overscan = 2;
  const startRow = Math.max(0, Math.floor(scrollState.top / rowHeight) - overscan);
  const visibleRows = Math.ceil(scrollState.height / rowHeight) + overscan * 2;
  const endRow = Math.min(totalRows, startRow + visibleRows);
  const startIndex = startRow * columns;
  const endIndex = Math.min(items.length, endRow * columns);
  const visibleItems = items.slice(startIndex, endIndex);
  const paddingTop = startRow * rowHeight;
  const paddingBottom = (totalRows - endRow) * rowHeight;

  return (
    <section>
      <div
        ref={gridRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        style={{ paddingTop, paddingBottom }}
      >
        {visibleItems.map((phoenix) => {
          if (phoenix.type === 'current') {
            return (
              <div key={phoenix.id} className="card p-6 flex flex-col items-center text-center border-2 border-yellow-400/50 relative">
                <div className="absolute top-2 right-2 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">LIVE</div>
                <PhoenixImage 
                  rankLevel={phoenix.final_rank_level} 
                  equippedUpgrades={state.equipped_upgrades}
                  className="w-24 h-24 mb-4"
                />
                <h3 className="font-serif-display text-xl text-white">{phoenix.final_rank_name}</h3>
                <p className="text-lg font-bold font-mono text-green-400 mt-2">In Progress</p>
              </div>
            );
          }
          return (
            <div key={phoenix.id} className="card p-6 flex flex-col items-center text-center">
              <PhoenixImage 
                rankLevel={phoenix.final_rank_level} 
                equippedUpgrades={parseUpgrades(phoenix.upgrades_json)}
                className="w-24 h-24 mb-4"
              />
              <h3 className="font-serif-display text-xl text-white">{phoenix.final_rank_name}</h3>
              <p className="text-sm text-gray-400 mb-2">{phoenix.name || 'Past Life'}</p>
              <p className="text-lg font-bold text-green-400">{formatHistoricStreak(phoenix.streak_duration_ms)}</p>
            </div>
          );
        })}
      </div>
      {history.length === 0 && (
        <div className="text-center text-gray-400 mt-10">
          <p className="text-lg">Your Aviary is empty.</p>
          <p className="text-sm mt-2">When a streak ends, your phoenix will be immortalized here.</p>
        </div>
      )}
    </section>
  );
}

export default AviaryPage;
