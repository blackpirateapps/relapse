import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App.jsx';
import { fetchHistory, getRank } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

function formatHistoricStreak(ms) {
    if (!ms || ms < 0) return "0m";
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

function AviaryPage() {
    const { state, ranks } = useContext(AppContext);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
    const currentRank = getRank(totalHours, ranks);

    const renderPhoenixImage = (rankLevel) => {
        const rank = ranks[rankLevel];
        if (!rank) return null;
        return <img src={`/img/${rank.id}.webp`} alt={rank.name} className="w-full h-full object-cover" />;
    };

    if (loading) return <LoadingSpinner />;

    return (
        <section id="aviary">
             <div id="aviary-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <div className="card p-6 flex flex-col items-center text-center border-2 border-yellow-400/50">
                    <div className="absolute top-2 right-2 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">LIVE</div>
                    <div className="w-32 h-32 mb-4">
                        {renderPhoenixImage(currentRank.level)}
                    </div>
                    <h3 className="font-serif-display text-xl text-white">{currentRank.name}</h3>
                </div>

                {history.map(phoenix => (
                    <div key={phoenix.id} className="card p-6 flex flex-col items-center text-center">
                        <div className="w-24 h-24 mb-4">
                            {renderPhoenixImage(phoenix.final_rank_level)}
                        </div>
                        <h3 className="font-serif-display text-xl text-white">{phoenix.final_rank_name}</h3>
                        <p className="text-sm text-gray-400 mb-2">{phoenix.name || 'Past Life'}</p>
                        <p className="text-lg font-bold text-green-400">{formatHistoricStreak(phoenix.streak_duration_ms)}</p>
                    </div>
                ))}
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

