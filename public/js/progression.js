import { initializeApp, getRank, ranks, renderPhoenix } from './shared.js';

initializeApp(state => {
    const progressionTimeline = document.getElementById('progression-timeline');
    const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
    const currentRank = getRank(totalHours);

    function formatStreakDetailed(seconds) {
        if (!seconds || seconds < 0) return "0m";
        const d = Math.floor(seconds / 86400);
        const h = Math.floor((seconds % 86400) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${d}d ${h}h ${m}m`;
    }

    progressionTimeline.innerHTML = ranks.map((rank, index) => {
        const isUnlocked = totalHours >= rank.hours;
        const isCurrent = currentRank.level === index;
        const hoursToGo = rank.hours - totalHours;
        
        let statusClass = 'bg-gray-700';
        if (isUnlocked) statusClass = 'bg-green-500';
        if (isCurrent) statusClass = 'bg-yellow-400 animate-pulse';

        return `
           <div class="mb-8 flex items-center">
               <div class="z-10 flex items-center justify-center w-12 h-12 ${statusClass} rounded-full ring-4 ring-gray-800 shrink-0">
                   <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
               </div>
               <div class="card ml-4 p-4 w-full">
                   <h3 class="text-lg font-semibold text-white">${rank.name}</h3>
                   <time class="block mb-2 text-sm font-normal leading-none text-gray-400">Unlocks at ${Math.floor(rank.hours / 24)}d ${rank.hours % 24}h</time>
                   <p class="text-base font-normal text-gray-300">${rank.storyline}</p>
                   <p class="text-yellow-400 font-bold mt-2">+${rank.reward.toLocaleString()} Coins</p>
                   ${!isUnlocked ? `<p class="text-xs text-cyan-400 mt-1">${formatStreakDetailed(hoursToGo * 3600)} remaining</p>` : ''}
               </div>
           </div>
        `;
    }).join('');
});
