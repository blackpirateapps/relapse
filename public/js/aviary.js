import { initializeApp, renderPhoenix, getRank, ranks } from './shared.js';

let currentStreakTimerInterval;

// More detailed streak formatting for the live timer
function formatLiveStreak(ms) {
    if (!ms || ms < 0) return "0d 00h 00m 00s";
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

// Simpler format for historical streaks
function formatHistoricStreak(ms) {
    if (!ms || ms < 0) return "0m";
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}


initializeApp(async (state) => {
    const aviaryContainer = document.getElementById('aviary-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    const emptyState = document.getElementById('empty-state');

    // --- 1. Create and Display the Current Phoenix Card ---
    const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
    const currentRank = getRank(totalHours);
    const startDate = new Date(state.lastRelapse).toLocaleDateString();

    const currentPhoenixHTML = `
        <div class="bg-indigo-900/50 border-2 border-indigo-500 rounded-2xl shadow-lg p-6 flex flex-col items-center text-center transform scale-105 ring-2 ring-amber-500/50">
            <div class="absolute top-2 right-2 bg-amber-500 text-gray-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">LIVE</div>
            <div class="w-48 h-48 mb-4">
                ${renderPhoenix(currentRank.level, state.upgrades)}
            </div>
            <h3 class="font-serif-display text-2xl text-amber-400">Current Phoenix</h3>
            <p class="text-lg text-gray-300">${currentRank.name}</p>
            <div class="my-4 bg-gray-900/50 w-full p-3 rounded-lg">
                <h4 class="text-sm text-gray-400">Current Streak</h4>
                <p id="current-phoenix-timer" class="text-xl font-bold font-mono text-green-400"></p>
            </div>
            <p class="text-xs text-gray-500">Started: ${startDate}</p>
        </div>
    `;

    // --- 2. Start the Live Timer for the Current Phoenix ---
    if (currentStreakTimerInterval) clearInterval(currentStreakTimerInterval);
    
    const startTime = new Date(state.lastRelapse).getTime();
    currentStreakTimerInterval = setInterval(() => {
        const timerEl = document.getElementById('current-phoenix-timer');
        if (!timerEl) {
            clearInterval(currentStreakTimerInterval);
            return;
        }
        timerEl.textContent = formatLiveStreak(Date.now() - startTime);
    }, 1000);


    // --- 3. Fetch and Display Historical Phoenixes ---
    try {
        const response = await fetch('/api/history');
        if (!response.ok) throw new Error('Failed to fetch history');
        
        const history = await response.json();
        loadingSpinner.classList.add('hidden');

        if (history.length === 0) {
            emptyState.classList.add('hidden');
        }

        const historyHTML = history.map(phoenix => {
            const upgrades = JSON.parse(phoenix.upgrades_json);
            const pStartDate = new Date(phoenix.start_date).toLocaleDateString();
            const pEndDate = new Date(phoenix.end_date).toLocaleDateString();

            return `
                <div class="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-6 flex flex-col items-center text-center transform hover:scale-105 transition-transform duration-300">
                    <div class="w-48 h-48 mb-4">
                        ${renderPhoenix(phoenix.final_rank_level, upgrades)}
                    </div>
                    <h3 class="font-serif-display text-2xl text-amber-400">${phoenix.name}</h3>
                    <p class="text-lg text-gray-300">${phoenix.final_rank_name}</p>
                    <div class="my-4 bg-gray-900/50 w-full p-3 rounded-lg">
                        <h4 class="text-sm text-gray-400">Streak Duration</h4>
                        <p class="text-xl font-bold">${formatHistoricStreak(phoenix.streak_duration_ms)}</p>
                    </div>
                    <p class="text-xs text-gray-500">${pStartDate} - ${pEndDate}</p>
                </div>
            `;
        }).join('');

        // Combine and render everything
        aviaryContainer.innerHTML = currentPhoenixHTML + historyHTML;

    } catch (error) {
        console.error(error);
        loadingSpinner.classList.add('hidden');
        emptyState.textContent = 'Could not load phoenix history.';
        emptyState.classList.remove('hidden');
    }
});

