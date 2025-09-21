import { initializeApp, ranks, renderPhoenix, calculateCoins } from './shared.js';

initializeApp(state => {
    const progressionContainer = document.getElementById('progression-container');
    const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
    
    progressionContainer.innerHTML = ranks.map((rank, index) => {
        const isUnlocked = totalHours >= rank.hours;
        const isCurrent = isUnlocked && (!ranks[index + 1] || totalHours < ranks[index + 1].hours);

        const hourlyRate = rank.hours > 0 ? Math.floor(10 * 1.2 * Math.pow(rank.hours, 0.2)) : 12;

        return `
            <div class="snap-center flex-shrink-0 w-full max-w-sm mx-auto flex flex-col items-center justify-center p-6">
                <div class="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full text-center">
                    <div class="w-64 h-64 mx-auto mb-6 ${isUnlocked ? '' : 'opacity-40 filter grayscale'}">
                        ${renderPhoenix(index, state.upgrades)}
                    </div>
                    <h2 class="font-serif-display text-3xl ${isCurrent ? 'text-amber-400' : 'text-white'}">${rank.name}</h2>
                    <p class="text-gray-400 mt-2 text-sm">Unlocked at ${rank.hours / 24} days</p>
                    <p class="mt-4 text-gray-300 h-24">${rank.storyline}</p>
                    <div class="mt-6 bg-gray-900/50 p-4 rounded-lg">
                        <h4 class="text-sm text-gray-400">Est. Coin Rate at this Level</h4>
                        <p class="text-xl font-bold text-yellow-400">${hourlyRate} coins/hr</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
});
