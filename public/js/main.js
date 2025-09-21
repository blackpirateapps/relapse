document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const loginScreen = document.getElementById('login-screen');
    const appScreen = document.getElementById('app');
    const passwordInput = document.getElementById('password-input');
    const loginButton = document.getElementById('login-button');
    const loginError = document.getElementById('login-error');
    const loadingSpinner = document.getElementById('loading-spinner');

    const timerDisplay = document.getElementById('timer');
    const rankNameDisplay = document.getElementById('rank-name');
    const phoenixDisplay = document.getElementById('phoenix-display');
    const coinCountDisplay = document.getElementById('coin-count');
    const longestStreakDisplay = document.getElementById('longest-streak');

    const urgeButton = document.getElementById('urge-button');
    const relapseButton = document.getElementById('relapse-button');
    
    const modalContainer = document.getElementById('modal-container');
    const modalBg = document.getElementById('modal-bg');
    const modalContentContainer = document.getElementById('modal-content');

    const navButtons = document.querySelectorAll('.nav-button');
    const appSections = document.querySelectorAll('.app-section');
    const progressionContent = document.getElementById('progression-content');
    const shopContent = document.getElementById('shop-content');

    let state = {};
    let timerInterval;
    
    // --- Ranks and Visuals ---
    const ranks = [
        { name: "Ashen Egg", hours: 0 }, { name: "Fledgling Hatchling", hours: 24 },
        { name: "Ember Chick", hours: 72 }, { name: "Flame Youngling", hours: 168 },
        { name: "Sunfire Phoenix", hours: 336 }, { name: "Blaze Guardian", hours: 720 },
        { name: "Solar Drake", hours: 2160 }, { name: "Celestial Phoenix", hours: 4320 }
    ];

    const visuals = {
        0: { name: 'Ashen Egg', svg: `<img src="/img/egg.png" alt="Ashen Egg" class="w-48 h-48">` },
        1: { name: 'Fledgling Hatchling', svg: (upgrades) => `<svg viewBox="0 0 200 200" class="w-48 h-48"><g class="${upgrades.aura ? 'phoenix-pulse' : ''}"><path fill="${upgrades.flameColor || '#F59E0B'}" d="M100 20c-20 0-40 10-50 30-10 20-10 50 0 70 10 20 30 30 50 30s40-10 50-30c10-20 10-50 0-70-10-20-30-30-50-30zm0 10c15 0 30 8 40 25 8 17 8 43 0 60-10 15-25 25-40 25s-30-10-40-25c-8-17-8-43 0-60 10-17 25-25 40-25z M100 60 a 5 5 0 0 1 0 10 a 5 5 0 0 1 0 -10 M70 80 a 5 5 0 0 1 0 10 a 5 5 0 0 1 0 -10 M130 80 a 5 5 0 0 1 0 10 a 5 5 0 0 1 0 -10 M100 100 q -20 20 0 40 q 20 -20 0 -40"></path></g></svg>` },
        2: { name: 'Ember Chick', svg: (upgrades) => `<svg viewBox="0 0 200 200" class="w-48 h-48"><g class="${upgrades.aura ? 'phoenix-pulse' : ''}"><path fill="${upgrades.flameColor || '#F59E0B'}" d="M100 20 C60 20 40 60 40 100 C40 140 60 180 100 180 C140 180 160 140 160 100 C160 60 140 20 100 20 Z M100 50 C110 50 110 60 100 60 C90 60 90 50 100 50 Z M80 80 C85 80 85 85 80 85 C75 85 75 80 80 80 Z M120 80 C125 80 125 85 120 85 C115 85 115 80 120 80 Z M100 100 C120 100 130 130 100 150 C70 130 80 100 100 100 Z"></path></g></svg>` },
        3: { name: 'Flame Youngling', svg: (upgrades) => `<svg viewBox="0 0 200 200" class="w-48 h-48"><g class="${upgrades.aura ? 'phoenix-pulse' : ''}"><path fill="${upgrades.flameColor || '#DC2626'}" d="M100 10 C 50 10, 50 80, 100 130 C 150 80, 150 10, 100 10 M100 120 C 80 150, 120 150, 100 190 C 80 150, 120 150, 100 120"></path><path fill="${upgrades.flameColor || '#F59E0B'}" d="M100 30 C 70 30, 70 80, 100 110 C 130 80, 130 30, 100 30"></path></g></svg>` },
        4: { name: 'Sunfire Phoenix', svg: (upgrades) => `<svg viewBox="0 0 200 200" class="w-48 h-48"><g class="${upgrades.aura ? 'phoenix-pulse' : ''}"><path class="phoenix-fire" fill="${upgrades.flameColor || '#F59E0B'}" d="M28.6,115.3c-2.4,5.4-3.5,11.3-3.5,17.5c0,29.3,23.7,53,53,53s53-23.7,53-53c0-6.2-1.1-12.1-3.5-17.5c-3.1,10-10.9,17.5-20.7,17.5c-12,0-21.7-9.7-21.7-21.7c0-6.4,2.8-12.2,7.2-16.1c-4.8-1.5-10-2.3-15.3-2.3C70.7,75,46.1,98.7,46.1,128c0-9.8,7.9-17.7,17.7-17.7C54,110.3,41.2,107.2,28.6,115.3z"/><path class="phoenix-fire" fill="${upgrades.flameColor || '#DC2626'}" d="M100,5C72.4,5,50,27.4,50,55s22.4,50,50,50s50-22.4,50-50S127.6,5,100,5z M100,85c-16.6,0-30-13.4-30-30s13.4-30,30-30s30,13.4,30,30S116.6,85,100,85z"/></g></svg>` },
        5: { name: 'Blaze Guardian', svg: (upgrades) => `<svg viewBox="0 0 200 200" class="w-48 h-48"><g class="phoenix-fire ${upgrades.aura ? 'phoenix-pulse' : ''}"><path fill="${upgrades.flameColor || '#DC2626'}" d="M100,10c-30,0-55,25-55,55s25,55,55,55s55-25,55-55S130,10,100,10z M100,100c-19.3,0-35-15.7-35-35s15.7-35,35-35s35,15.7,35,35S119.3,100,100,100z"/><path fill="${upgrades.flameColor || '#F59E0B'}" d="M100,120c-40,0-70,40-20,70c50,30,50-30,20-70z"/></g></svg>` },
        6: { name: 'Solar Drake', svg: (upgrades) => `<svg viewBox="0 0 200 200" class="w-48 h-48"><g class="phoenix-fire ${upgrades.aura ? 'phoenix-pulse' : ''}"><path fill="${upgrades.flameColor || '#F59E0B'}" d="M 98.5,10.2 C 54.4,21.5 35.2,69.5 54.7,109.1 C 65.5,131.2 92.2,143.4 116.8,138.3 C 141.4,133.2 161.4,113.1 166.5,88.5 C 172.5,59.8 153.3,-1.1 98.5,10.2 z"/><path fill="${upgrades.flameColor || '#DC2626'}" d="M 100,140 C 50,140 40,190 100,190 C 160,190 150,140 100,140 z"/></g></svg>` },
        7: { name: 'Celestial Phoenix', svg: (upgrades) => `<svg viewBox="0 0 200 200" class="w-48 h-48"><g class="phoenix-fire ${upgrades.aura ? 'phoenix-pulse' : ''}"><path fill="${upgrades.flameColor || '#9333EA'}" d="M100 5C50 5 10 50 10 100c0 50 40 95 90 95s90-45 90-95C190 50 150 5 100 5zm0 170c-41.4 0-75-33.6-75-75S58.6 25 100 25s75 33.6 75 75-33.6 75-75 75z"/><path fill="${upgrades.flameColor || '#F59E0B'}" d="M100 60c-22.1 0-40 17.9-40 40s17.9 40 40 40 40-17.9 40-40-17.9-40-40-40z"/></g></svg>` }
    };

    // --- Authentication & Initialization ---
    async function checkAuthAndInitialize() {
        try {
            const response = await fetch('/api/state');
            if (response.ok) {
                const data = await response.json();
                initializeApp(data);
            } else {
                loadingSpinner.classList.add('hidden');
                loginScreen.classList.remove('hidden');
            }
        } catch (error) {
            console.error("Auth check failed:", error);
            loadingSpinner.classList.add('hidden');
            loginScreen.classList.remove('hidden');
        }
    }

    async function attemptLogin() {
        const password = passwordInput.value;
        loginError.textContent = '';
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });
            if (response.ok) {
                const data = await fetch('/api/state').then(res => res.json());
                initializeApp(data);
            } else {
                loginError.textContent = 'Incorrect password.';
            }
        } catch (error) {
            console.error('Login error:', error);
            loginError.textContent = 'An error occurred. Please try again.';
        }
    }

    function initializeApp(data) {
        state = data;
        loadingSpinner.classList.add('hidden');
        loginScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');
        startTimer();
        updateUI();
    }

    // --- Core Logic & UI Updates ---
    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        if (!state.startTime) return;

        timerInterval = setInterval(() => {
            const now = Date.now();
            const start = new Date(state.startTime).getTime();
            const diff = now - start;

            if (diff < 0) {
                timerDisplay.textContent = "00:00:00:00";
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            timerDisplay.textContent = `${String(days).padStart(2, '0')}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
            
            const totalHours = diff / (1000 * 60 * 60);
            state.coins = calculateCoins(totalHours) + (state.bankedCoins || 0);
            coinCountDisplay.textContent = Math.floor(state.coins).toLocaleString();

            const currentRank = getRank(totalHours);
            if (currentRank.name !== rankNameDisplay.textContent) {
                updateUI();
            }
        }, 1000);
    }

    function updateUI() {
        if (!state.startTime) {
            timerDisplay.textContent = "00:00:00:00";
            rankNameDisplay.textContent = "Start your journey";
            phoenixDisplay.innerHTML = renderPhoenix(0, state.upgrades);
            coinCountDisplay.textContent = (state.bankedCoins || 0).toLocaleString();
            longestStreakDisplay.textContent = formatStreak(state.longestStreak || 0);
        } else {
            const totalHours = (Date.now() - new Date(state.startTime).getTime()) / (1000 * 60 * 60);
            const currentRank = getRank(totalHours);
            rankNameDisplay.textContent = currentRank.name;
            phoenixDisplay.innerHTML = renderPhoenix(currentRank.level, state.upgrades);
            coinCountDisplay.textContent = Math.floor(state.coins).toLocaleString();
            longestStreakDisplay.textContent = formatStreak(state.longestStreak);
        }
        updateProgressionSection();
        updateShopSection();
    }

    function getRank(totalHours) {
        for (let i = ranks.length - 1; i >= 0; i--) {
            if (totalHours >= ranks[i].hours) {
                return { ...ranks[i], level: i };
            }
        }
        return { ...ranks[0], level: 0 };
    }
            
    function calculateCoins(totalHours) {
        if (totalHours <= 0) return 0;
        const accelerationFactor = Math.floor(totalHours / 12);
        const averageRate = 10 + (accelerationFactor / 2);
        return totalHours * averageRate;
    }

    function renderPhoenix(level, upgrades = {}) {
        const visual = visuals[level] || visuals[0];
        if (typeof visual.svg === 'function') {
            return visual.svg(upgrades);
        }
        return visual.svg;
    }

    function formatStreak(seconds) {
        if (!seconds || seconds < 0) return "0d 0h";
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        return `${days}d ${hours}h`;
    }

    // --- Section Content Updaters ---
    function updateProgressionSection() {
        const totalHours = state.startTime ? (Date.now() - new Date(state.startTime).getTime()) / (1000 * 60 * 60) : 0;
        const currentRank = getRank(totalHours);
        const nextRank = ranks[currentRank.level + 1];
        const currentHourlyRate = 10 + Math.floor(totalHours / 12);
        
        let rankListHtml = ranks.map((rank, index) => {
            const isCurrent = currentRank.level === index;
            const isAchieved = totalHours >= rank.hours;
            let textClass = 'text-gray-500';
            if (isCurrent) textClass = 'text-amber-400 font-bold';
            else if (isAchieved) textClass = 'text-green-400';

            return `<li class="flex items-center justify-between p-2 rounded-md ${isCurrent ? 'bg-gray-700' : ''}">
                        <div class="flex items-center gap-4">
                          <div class="w-10 h-10 flex-shrink-0">${renderPhoenix(index, state.upgrades)}</div>
                          <span class="${textClass}">${rank.name}</span>
                        </div>
                        <span class="text-sm text-gray-400">(${rank.hours / 24} days)</span>
                   </li>`;
        }).join('');

        progressionContent.innerHTML = `
            <h3 class="font-serif-display text-2xl mb-6 text-amber-400 text-center">Your Progression</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-center">
                <div>
                    <h4 class="text-sm text-gray-400">Current Rank</h4>
                    <p class="text-lg text-amber-400 font-semibold">${currentRank.name}</p>
                </div>
                 <div>
                    <h4 class="text-sm text-gray-400">Hourly Coin Gain</h4>
                    <p class="text-lg text-yellow-400 font-semibold">${currentHourlyRate} coins/hr</p>
                </div>
            </div>
            <div class="mb-6 text-center">
                <h4 class="text-sm text-gray-400">Next Rank</h4>
                <p class="text-lg font-semibold">${nextRank ? nextRank.name : 'Highest Rank Achieved!'}</p>
                <p class="text-xs text-gray-500">${nextRank ? `(at ${nextRank.hours / 24} days)` : ''}</p>
            </div>
            <h4 class="text-lg font-semibold mb-2 text-center">All Ranks</h4>
            <ul class="space-y-1">${rankListHtml}</ul>
        `;
    }

    function updateShopSection() {
        const shopItems = [
            { id: 'aura', name: 'Aura of Resolve', cost: 500, description: 'Adds a soft, glowing aura to your phoenix.' },
            { id: 'flameColor', name: 'Celestial Flames', cost: 1000, description: 'Changes phoenix flames to a cool blue.' },
        ];

        let itemsHtml = shopItems.map(item => {
            const isOwned = state.upgrades && state.upgrades[item.id];
            return `
                <div class="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                    <div>
                        <h4 class="font-semibold ${isOwned ? 'text-green-400' : 'text-white'}">${item.name} ${isOwned ? '(Owned)' : ''}</h4>
                        <p class="text-sm text-gray-400">${item.description}</p>
                    </div>
                    <button 
                        class="buy-button text-sm font-bold py-2 px-4 rounded-lg ${isOwned ? 'bg-gray-500 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}"
                        data-item-id="${item.id}"
                        data-item-cost="${item.cost}"
                        ${isOwned ? 'disabled' : ''}>
                        ${isOwned ? 'Owned' : `${item.cost.toLocaleString()} Coins`}
                    </button>
                </div>
            `;
        }).join('');
        
        shopContent.innerHTML = `
            <h3 class="font-serif-display text-2xl mb-6 text-amber-400 text-center">Customize Your Phoenix</h3>
            <p class="text-gray-300 mb-4 text-center">Use your coins to purchase permanent cosmetic upgrades.</p>
            <div class="space-y-4">${itemsHtml}</div>
        `;

        document.querySelectorAll('.buy-button').forEach(button => {
            button.addEventListener('click', handleBuyItem);
        });
    }

    // --- Event Handlers ---
    loginButton.addEventListener('click', attemptLogin);
    passwordInput.addEventListener('keypress', (e) => e.key === 'Enter' && attemptLogin());

    urgeButton.addEventListener('click', () => {
        const tasks = [ "Do 10 push-ups.", "Step outside for 5 minutes.", "Drink a full glass of cold water."];
        const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
        showModal('A Moment of Strength', `<p class="text-gray-300">Redirect that energy.</p><p class="mt-4 p-4 bg-gray-700 rounded-lg text-amber-400 font-semibold">${randomTask}</p>`);
    });

    relapseButton.addEventListener('click', () => {
         showModal('A New Beginning', `
            <p class="text-gray-300 mb-6">Are you sure you want to log a relapse?</p>
            <div class="flex justify-end gap-4">
                <button id="cancel-relapse" class="bg-gray-600 hover:bg-gray-700 font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button id="confirm-relapse" class="bg-red-700 hover:bg-red-800 font-bold py-2 px-4 rounded-lg">Confirm</button>
            </div>
        `, false);

        document.getElementById('confirm-relapse').onclick = handleRelapse;
        document.getElementById('cancel-relapse').onclick = closeModal;
    });

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetSection = button.dataset.section;
            
            navButtons.forEach(btn => btn.setAttribute('data-active', 'false'));
            button.setAttribute('data-active', 'true');

            appSections.forEach(section => {
                if (section.id === `${targetSection}-section`) {
                    section.classList.remove('hidden');
                } else {
                    section.classList.add('hidden');
                }
            });
        });
    });

    async function handleRelapse() {
        try {
            const response = await fetch('/api/relapse', { method: 'POST' });
            if (!response.ok) throw new Error('Failed to post relapse');
            state = await response.json();
            clearInterval(timerInterval);
            updateUI();
            closeModal();
        } catch (error) {
            console.error('Relapse error:', error);
        }
    }

    async function handleBuyItem(e) {
        const button = e.target;
        const itemId = button.dataset.itemId;
        const itemCost = parseInt(button.dataset.itemCost);

        if (state.coins < itemCost) {
            alert("Not enough coins!"); // Replace with better UI
            return;
        }

        try {
            const response = await fetch('/api/buy', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Failed to buy item');
            }
            state = await response.json();
            updateUI();
        } catch (error) {
            console.error('Purchase error:', error);
            alert(`Purchase failed: ${error.message}`);
        }
    }
    
    // --- Modal ---
    function showModal(title, content, showClose = true) {
        let closeButtonHtml = showClose ? '<button id="close-modal-btn" class="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">&times;</button>' : '';
        modalContentContainer.innerHTML = `
            <h3 class="font-serif-display text-2xl mb-4 text-amber-400">${title}</h3>
            ${closeButtonHtml}
            <div>${content}</div>`;
        modalContainer.classList.remove('hidden');
        if(showClose) {
            document.getElementById('close-modal-btn').addEventListener('click', closeModal);
        }
    }

    function closeModal() {
        modalContainer.classList.add('hidden');
    }

    modalBg.addEventListener('click', closeModal);

    // --- Initial Load ---
    checkAuthAndInitialize();
});
