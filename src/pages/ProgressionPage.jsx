import React, { useContext } from 'react';
import { AppContext } from '../App.jsx';

function ProgressionPage() {
    const { state, ranks, getRank } = useContext(AppContext);
    
    // Calculate the user's current progress
    const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
    const currentRank = getRank(totalHours);

    // Pre-calculate the cumulative rewards at each level for the C/hr estimate
    const cumulativeRewards = ranks.map((rank, index) => {
        return ranks.slice(0, index + 1).reduce((sum, r) => sum + r.reward, 0);
    });

    return (
        <section id="progression">
            <div className="relative border-l-2 border-gray-700 ml-6">
                {ranks.map((rank, index) => {
                    const isUnlocked = totalHours >= rank.hours;
                    const isCurrent = currentRank.level === index;
                    
                    let statusClass = 'bg-gray-700';
                    if (isUnlocked) statusClass = 'bg-green-500';
                    if (isCurrent) statusClass = 'bg-yellow-400 animate-pulse';
                    
                    // --- START: COINS PER HOUR CALCULATION ---
                    const totalRewardAtLevel = cumulativeRewards[index];
                    const coinsPerHour = rank.hours > 0 ? totalRewardAtLevel / rank.hours : 0;
                    const formattedCph = Math.round(coinsPerHour);
                    // --- END: COINS PER HOUR CALCULATION ---

                    return (
                       <div key={rank.id} className="mb-8 flex items-center">
                           <div className={`z-10 flex items-center justify-center w-12 h-12 ${statusClass} rounded-full ring-4 ring-gray-800 shrink-0`}>
                               <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                           </div>
                           <div className="card ml-4 p-4 w-full flex items-start space-x-4">
                               {/* --- START: ADDED IMAGE --- */}
                               <img 
                                   src={rank.image} 
                                   alt={rank.name} 
                                   className="w-20 h-20 object-contain rounded-lg bg-black/20 shrink-0"
                                   onError={(e) => { e.target.style.display='none'; }}
                               />
                               {/* --- END: ADDED IMAGE --- */}
                               
                               <div className="flex-grow">
                                   <h3 className="text-lg font-semibold text-white">{rank.name}</h3>
                                   <time className="block mb-2 text-sm font-normal leading-none text-gray-400">Unlocks at {Math.floor(rank.hours / 24)}d {rank.hours % 24}h</time>
                                   <p className="text-base font-normal text-gray-300">{rank.storyline}</p>
                                   <div className="flex justify-between items-center mt-2">
                                       <p className="text-yellow-400 font-bold">+${rank.reward.toLocaleString()} Coins</p>
                                       {/* --- START: ADDED COINS/HR DISPLAY --- */}
                                       {formattedCph > 0 && (
                                           <p className="text-sm text-cyan-400 font-mono" title="Estimated average coins per hour to reach this level">
                                               ~{formattedCph.toLocaleString()} C/hr
                                           </p>
                                       )}
                                       {/* --- END: ADDED COINS/HR DISPLAY --- */}
                                   </div>
                               </div>
                           </div>
                       </div>
                    );
                })}
            </div>
        </section>
    );
}

export default ProgressionPage;