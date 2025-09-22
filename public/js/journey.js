import { initializeApp, getRank, renderPhoenix, showModal, closeModal, updateCoinCount } from './shared.js';

document.addEventListener('DOMContentLoaded', () => {
    let state = {};
    let timerInterval;

    const elements = {
        timer: document.getElementById('timer'),
        rankName: document.getElementById('rank-name'),
        rankStory: document.getElementById('rank-story'),
        phoenixDisplay: document.getElementById('phoenix-display'),
        longestStreak: document.getElementById('longest-streak'),
        urgeButton: document.getElementById('urge-button'),
        relapseButton: document.getElementById('relapse-button'),
        passwordInput: document.getElementById('password-input'),
        loginButton: document.getElementById('login-button'),
        loginError: document.getElementById('login-error'),
    };

    initializeApp(data => {
        state = data;
        updateUI();
        startTimer();
    });

    function updateUI() {
        const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
        const currentRank = getRank(totalHours);
        elements.rankName.textContent = currentRank.name;
        elements.rankStory.textContent = currentRank.storyline;
        elements.phoenixDisplay.innerHTML = renderPhoenix(currentRank.level, state.equipped_upgrades);
        elements.longestStreak.textContent = formatStreak(state.longestStreak / 1000);
    }

    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        if (!state.lastRelapse) return;

        timerInterval = setInterval(() => {
            const diff = Date.now() - new Date(state.lastRelapse).getTime();
            if (diff < 0) return;

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            elements.timer.textContent = `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            
            updateCoinCount();
        }, 1000);
    }

    function formatStreak(seconds) {
        if (!seconds || seconds < 0) return "0d 0h";
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        return `${days}d ${hours}h`;
    }

    async function attemptLogin() {
        elements.loginError.textContent = '';
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: elements.passwordInput.value }),
            });
            if (response.ok) {
                window.location.reload();
            } else {
                elements.loginError.textContent = 'Incorrect password.';
            }
        } catch (error) {
            elements.loginError.textContent = 'An error occurred.';
        }
    }

    // Event Listeners
    if(elements.loginButton) elements.loginButton.addEventListener('click', attemptLogin);
    if(elements.passwordInput) elements.passwordInput.addEventListener('keypress', (e) => e.key === 'Enter' && attemptLogin());

    elements.urgeButton.addEventListener('click', () => {
        const tasks = ["Do 10 push-ups.", "Step outside for 5 minutes.", "Drink a full glass of cold water."];
        const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
        showModal('A Moment of Strength', `<p>${randomTask}</p>`);
    });

    elements.relapseButton.addEventListener('click', () => {
        showModal('Confirm Relapse', `
            <p class="mb-6">Are you sure? This will reset your streak and archive your current phoenix.</p>
            <div class="flex justify-end gap-4">
                <button id="cancel-relapse" class="bg-gray-600 hover:bg-gray-700 font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button id="confirm-relapse" class="bg-red-700 hover:bg-red-800 font-bold py-2 px-4 rounded-lg">Confirm</button>
            </div>
        `, { showClose: false });
        document.getElementById('confirm-relapse').onclick = async () => {
            await fetch('/api/relapse', { method: 'POST' });
            window.location.reload();
        };
        document.getElementById('cancel-relapse').onclick = closeModal;
    });
});
