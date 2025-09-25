import React, { useContext } from 'react';
import { AppContext } from '../App.jsx';
import { getRank } from '../api.js';

function formatStreakDetailed(seconds) {
    if (!seconds || seconds < 0) return "0m";
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
}


function ProgressionPage() {
    const { state, ranks } = useContext(AppContext);
    
    const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
    const currentRank = getRank(totalHours, ranks);

    return (
        <section id="progression">
            <div className="relative border-l-2 border-gray-700 ml-6">
                {ranks.map((rank, index) => {
                    const isUnlocked = totalHours >= rank.hours;
                    const isCurrent = currentRank.level === index;
                    const hoursToGo = rank.hours - totalHours;
                    
                    let statusClass = 'bg-gray-700';
                    if (isUnlocked) statusClass = 'bg-green-500';
                    if (isCurrent) statusClass = 'bg-yellow-400 animate-pulse';

                    return (
                       <div key={rank.id} className="mb-8 flex items-center">
                           <div className={`z-10 flex items-center justify-center w-12 h-12 ${statusClass} rounded-full ring-4 ring-gray-800 shrink-0`}>
                               <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                           </div>
                           <div className="card ml-4 p-4 w-full">
                               <h3 className="text-lg font-semibold text-white">{rank.name}</h3>
                               <time className="block mb-2 text-sm font-normal leading-none text-gray-400">Unlocks at {Math.floor(rank.hours / 24)}d {rank.hours % 24}h</time>
                               <p className="text-base font-normal text-gray-300">{rank.storyline}</p>
                               <p className="text-yellow-400 font-bold mt-2">+{rank.reward.toLocaleString()} Coins</p>
                               {!isUnlocked && <p className="text-xs text-cyan-400 mt-1">{formatStreakDetailed(hoursToGo * 3600)} remaining</p>}
                           </div>
                       </div>
                    );
                })}
            </div>
        </section>
    );
}

export default ProgressionPage;

