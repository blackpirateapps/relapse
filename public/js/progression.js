import { initializeApp, getRank, ranks, renderPhoenix } from './shared.js';

let countdownInterval;

initializeApp(state => {
    const progressionContainer = document.getElementById('progression-container');
    const summaryContainer = document.getElementById('progress-summary');
    const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
    
    // Populate the horizontal scroller with rewards on each card
    progressionContainer.innerHTML = ranks.map((rank, index) => {
        const isUnlocked = totalHours >= rank.hours;
        const isCurrent = isUnlocked && (!ranks[index + 1] || totalHours < ranks[index + 1].hours);

        return `
            <div class="snap-center flex-shrink-0 w-full max-w-sm mx-auto flex flex-col items-center justify-center p-6">
                <div class="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full text-center">
                    <div class="w-64 h-64 mx-auto mb-6">
                        ${renderPhoenix(index, state.upgrades)}
                    </div>
                    <h2 class="font-serif-display text-3xl ${isCurrent ? 'text-amber-400' : 'text-white'}">${rank.name}</h2>
                    <p class="text-gray-400 mt-2 text-sm">Unlocked at ${rank.hours / 24} days</p>
                    <p class="mt-4 text-gray-300 h-20">${rank.storyline}</p>
                    <div class="mt-4 bg-gray-900/50 p-3 rounded-lg">
                        <h4 class="text-sm text-gray-400">Level-Up Reward</h4>
                        <p class="text-lg font-bold text-yellow-400">${rank.reward.toLocaleString()} Coins</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // Populate and manage the summary section
    updateSummary(totalHours);
});

function updateSummary(totalHours) {
    const summaryContainer = document.getElementById('progress-summary');
    if (!summaryContainer) return;

    if (countdownInterval) clearInterval(countdownInterval);

    const currentRank = getRank(totalHours);
    const nextRank = ranks[currentRank.level + 1];
    const currentHourlyRate = totalHours > 0 ? Math.floor(10 * 1.2 * Math.pow(totalHours, 0.2)) : 12;

    let timeToNextContent;
    let rewardContent;

    if (nextRank) {
        rewardContent = `
            <div>
                <h4 class="text-sm text-gray-400">Next Reward</h4>
                <p class="text-2xl font-bold text-yellow-400">${nextRank.reward.toLocaleString()} Coins</p>
            </div>`;
            
        timeToNextContent = `
            <div>
                <h4 class="text-sm text-gray-400">Time to ${nextRank.name}</h4>
                <p id="countdown-timer" class="text-2xl font-mono text-green-400 tracking-wide">--:--:--:--</p>
            </div>`;
        
        let timeRemainingMs = (nextRank.hours - totalHours) * 3600 * 1000;

        countdownInterval = setInterval(() => {
            const timerEl = document.getElementById('countdown-timer');
            if (!timerEl) {
                clearInterval(countdownInterval);
                return;
            }
            
            timeRemainingMs -= 1000;
            if (timeRemainingMs < 0) timeRemainingMs = 0;

            const days = Math.floor(timeRemainingMs / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeRemainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeRemainingMs % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeRemainingMs % (1000 * 60)) / 1000);

            timerEl.textContent = `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        }, 1000);

    } else {
        rewardContent = `
             <div>
                <h4 class="text-sm text-gray-400">Next Reward</h4>
                <p class="text-2xl font-bold text-yellow-400">-</p>
            </div>`;
        timeToNextContent = `
            <div>
                <h4 class="text-sm text-gray-400">Time to Next Level</h4>
                <p class="text-2xl font-bold text-green-400">Highest Rank Achieved!</p>
            </div>`;
    }

    summaryContainer.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div>
                <h4 class="text-sm text-gray-400">Current Rank</h4>
                <p class="text-2xl font-bold text-amber-400">${currentRank.name}</p>
            </div>
            ${rewardContent}
            <div>
                <h4 class="text-sm text-gray-400">Current Coin Rate</h4>
                <p class="text-2xl font-bold text-yellow-400">${currentHourlyRate} coins/hr</p>
            </div>
            ${timeToNextContent}
        </div>
    `;
}

