import { initializeApp, renderPhoenix } from './shared.js';

function formatStreak(ms) {
    if (!ms || ms < 0) return "0m";
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
}

initializeApp(async () => {
    const aviaryContainer = document.getElementById('aviary-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    const emptyState = document.getElementById('empty-state');

    try {
        const response = await fetch('/api/history');
        if (!response.ok) throw new Error('Failed to fetch history');
        
        const history = await response.json();
        loadingSpinner.classList.add('hidden');

        if (history.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            aviaryContainer.innerHTML = history.map(phoenix => {
                const upgrades = JSON.parse(phoenix.upgrades_json);
                const startDate = new Date(phoenix.start_date).toLocaleDateString();
                const endDate = new Date(phoenix.end_date).toLocaleDateString();

                return `
                    <div class="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-6 flex flex-col items-center text-center transform hover:scale-105 transition-transform duration-300">
                        <div class="w-48 h-48 mb-4">
                            ${renderPhoenix(phoenix.final_rank_level, upgrades)}
                        </div>
                        <h3 class="font-serif-display text-2xl text-amber-400">${phoenix.name}</h3>
                        <p class="text-lg text-gray-300">${phoenix.final_rank_name}</p>
                        <div class="my-4 bg-gray-900/50 w-full p-3 rounded-lg">
                            <h4 class="text-sm text-gray-400">Streak Duration</h4>
                            <p class="text-xl font-bold">${formatStreak(phoenix.streak_duration_ms)}</p>
                        </div>
                        <p class="text-xs text-gray-500">${startDate} - ${endDate}</p>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error(error);
        loadingSpinner.classList.add('hidden');
        emptyState.textContent = 'Could not load phoenix history.';
        emptyState.classList.remove('hidden');
    }
});
