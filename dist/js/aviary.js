import { initializeApp, renderPhoenix, getRank } from './shared.js';

let currentStreakTimerInterval;

function formatLiveStreak(ms) {
    if (!ms || ms < 0) return "0d 00h 00m 00s";
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

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
    const aviaryGrid = document.getElementById('aviary-grid');
    const emptyState = document.getElementById('empty-state');

    const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
    const currentRank = getRank(totalHours);

    const currentPhoenixHTML = `
        <div class="card p-6 flex flex-col items-center text-center border-2 border-yellow-400/50">
            <div class="absolute top-2 right-2 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">LIVE</div>
            <div class="w-32 h-32 mb-4">
                ${renderPhoenix(currentRank.level, state.equipped_upgrades)}
            </div>
            <h3 class="font-serif-display text-xl text-white">${currentRank.name}</h3>
            <p id="current-phoenix-timer" class="text-lg font-bold font-mono text-green-400 mt-2"></p>
        </div>
    `;

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

    try {
        const response = await fetch('/api/history');
        if (!response.ok) throw new Error('Failed to fetch history');
        
        const history = await response.json();

        if (history.length === 0) {
            emptyState.classList.remove('hidden');
        }

        const historyHTML = history.map(phoenix => {
            const upgrades = JSON.parse(phoenix.upgrades_json);
            return `
                <div class="card p-6 flex flex-col items-center text-center">
                    <div class="w-24 h-24 mb-4">
                        ${renderPhoenix(phoenix.final_rank_level, upgrades)}
                    </div>
                    <h3 class="font-serif-display text-xl text-white">${phoenix.final_rank_name}</h3>
                    <p class="text-sm text-gray-400 mb-2">${phoenix.name || 'Past Life'}</p>
                    <p class="text-lg font-bold text-green-400">${formatHistoricStreak(phoenix.streak_duration_ms)}</p>
                </div>
            `;
        }).join('');

        aviaryGrid.innerHTML = currentPhoenixHTML + historyHTML;

    } catch (error) {
        console.error(error);
        emptyState.textContent = 'Could not load phoenix history.';
        emptyState.classList.remove('hidden');
    }
});
