import { initializeApp, getState, getRank, renderPhoenix, calculateCoins, showModal, closeModal } from './shared.js';

document.addEventListener('DOMContentLoaded', () => {
    let state = {};
    let timerInterval;

    const timerDisplay = document.getElementById('timer');
    const rankNameDisplay = document.getElementById('rank-name');
    const phoenixDisplay = document.getElementById('phoenix-display');
    const longestStreakDisplay = document.getElementById('longest-streak');
    const urgeButton = document.getElementById('urge-button');
    const relapseButton = document.getElementById('relapse-button');
    const passwordInput = document.getElementById('password-input');
    const loginButton = document.getElementById('login-button');
    const loginError = document.getElementById('login-error');

    initializeApp(data => {
        state = data;
        updateUI();
        startTimer();
    });

    function updateUI() {
        const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
        const currentRank = getRank(totalHours);

        rankNameDisplay.textContent = currentRank.name;
        phoenixDisplay.innerHTML = renderPhoenix(currentRank.level, state.upgrades);
        longestStreakDisplay.textContent = formatStreak(state.longestStreak / 1000);
    }

    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        if (!state.lastRelapse) return;
        const coinCountDisplay = document.getElementById('coin-count');

        timerInterval = setInterval(() => {
            const diff = Date.now() - new Date(state.lastRelapse).getTime();
            if (diff < 0) return;

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            timerDisplay.textContent = `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            
            const totalHours = diff / (1000 * 60 * 60);
            const totalCoins = (state.coinsAtLastRelapse || 0) + calculateCoins(totalHours);
            coinCountDisplay.textContent = Math.floor(totalCoins).toLocaleString();
        }, 1000);
    }

    function formatStreak(seconds) {
        if (!seconds || seconds < 0) return "0d 0h";
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        return `${days}d ${hours}h`;
    }

    async function attemptLogin() {
        loginError.textContent = '';
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: passwordInput.value }),
            });
            if (response.ok) {
                window.location.reload();
            } else {
                loginError.textContent = 'Incorrect password.';
            }
        } catch (error) {
            loginError.textContent = 'An error occurred.';
        }
    }

    // Event Listeners
    if(loginButton) loginButton.addEventListener('click', attemptLogin);
    if(passwordInput) passwordInput.addEventListener('keypress', (e) => e.key === 'Enter' && attemptLogin());

    urgeButton.addEventListener('click', () => {
        const tasks = ["Do 10 push-ups.", "Step outside for 5 minutes.", "Drink a full glass of cold water."];
        const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
        showModal('A Moment of Strength', `<p class="text-gray-300">Redirect that energy.</p><p class="mt-4 p-4 bg-gray-700/50 rounded-lg text-amber-400 font-semibold">${randomTask}</p>`);
    });

    relapseButton.addEventListener('click', () => {
        showModal('A New Beginning', `
            <p class="text-gray-300 mb-6">Are you sure? This will reset your current streak.</p>
            <div class="flex justify-end gap-4">
                <button id="cancel-relapse" class="bg-gray-600 hover:bg-gray-700 font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button id="confirm-relapse" class="bg-red-700 hover:bg-red-800 font-bold py-2 px-4 rounded-lg">Confirm</button>
            </div>
        `, false);
        document.getElementById('confirm-relapse').onclick = async () => {
            await fetch('/api/relapse', { method: 'POST' });
            window.location.reload();
        };
        document.getElementById('cancel-relapse').onclick = closeModal;
    });
});
