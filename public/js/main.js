import { ranks, visuals } from './visuals.js';

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
    
    const previewBanner = document.getElementById('preview-banner');
    const previewBannerText = document.getElementById('preview-banner-text');
    const exitPreviewButton = document.getElementById('exit-preview-button');


    let state = {};
    let timerInterval;
    let isPreviewing = false;
    
    const shopItems = [
        { id: 'aura', name: 'Aura of Resolve', cost: 500, description: 'Adds a soft, glowing aura to your phoenix.', type: 'cosmetic' },
        { id: 'celestialFlames', name: 'Celestial Flames', cost: 1200, description: 'Changes phoenix visuals to a cool blue.', type: 'cosmetic' },
        { id: 'volcanicLair', name: 'Volcanic Lair', cost: 10000, description: 'A dark, fiery background theme.', type: 'theme' },
        { id: 'celestialSky', name: 'Celestial Sky', cost: 50000, description: 'A beautiful, star-filled background theme.', type: 'theme' },
    ];

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
        if (typeof state.upgrades === 'string') {
            state.upgrades = JSON.parse(state.upgrades);
        }
        loadingSpinner.classList.add('hidden');
        loginScreen.classList.add('hidden');
        appScreen.classList.remove('hidden');
        applyBackground(state.upgrades);
        startTimer();
        updateUI();
    }

    // --- Core Logic & UI Updates ---
    function applyBackground(upgrades) {
        const body = document.body;
        // Reset to default first
        body.classList.remove('bg-volcanic-lair', 'bg-celestial-sky');
        body.classList.add('bg-default');

        // Apply the best owned theme
        if (upgrades && upgrades.celestialSky) {
            body.classList.replace('bg-default', 'bg-celestial-sky');
        } else if (upgrades && upgrades.volcanicLair) {
            body.classList.replace('bg-default', 'bg-volcanic-lair');
        }
    }

    function startTimer() {
        if (timerInterval) clearInterval(timerInterval);
        if (!state.lastRelapse) return;

        timerInterval = setInterval(() => {
            const now = Date.now();
            const start = new Date(state.lastRelapse).getTime();
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
            const streakCoins = calculateCoins(totalHours);
            state.coins = (state.coinsAtLastRelapse || 0) + streakCoins;
            coinCountDisplay.textContent = Math.floor(state.coins).toLocaleString();

            const currentRank = getRank(totalHours);
            if (currentRank.name !== rankNameDisplay.textContent) {
                updateUI();
            }
        }, 1000);
    }

    function updateUI() {
        if (isPreviewing) return; // Don't update UI if a preview is active

        const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
        const currentRank = getRank(totalHours);
        
        rankNameDisplay.textContent = currentRank.name;
        phoenixDisplay.innerHTML = renderPhoenix(currentRank.level, state.upgrades);
        
        const streakCoins = calculateCoins(totalHours);
        const totalCoins = (state.coinsAtLastRelapse || 0) + streakCoins;
        coinCountDisplay.textContent = Math.floor(totalCoins).toLocaleString();
        
        longestStreakDisplay.textContent = formatStreak(state.longestStreak / 1000); 

        relapseButton.textContent = 'I Relapsed';
        relapseButton.classList.remove('bg-green-600', 'hover:bg-green-700');
        relapseButton.classList.add('bg-red-700', 'hover:bg-red-800');
        
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
        return Math.floor(10 * Math.pow(totalHours, 1.2));
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
        const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
        const currentRank = getRank(totalHours);
        const nextRank = ranks[currentRank.level + 1];
        const currentHourlyRate = totalHours > 0 ? Math.floor(10 * 1.2 * Math.pow(totalHours, 0.2)) : 12;
        
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
                    <h4 class="text-sm text-gray-400">Approx. Coin Gain</h4>
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
        const cosmeticItems = shopItems.filter(item => item.type === 'cosmetic');
        const themeItems = shopItems.filter(item => item.type === 'theme');

        const createItemsHtml = (items) => {
            return items.map(item => {
                const isOwned = state.upgrades && state.upgrades[item.id];
                const actionButtons = isOwned ?
                    `<button class="text-sm font-bold py-2 px-4 rounded-lg bg-gray-500 cursor-not-allowed" disabled>Owned</button>` :
                    `<div class="flex gap-2">
                        <button class="preview-button text-sm font-bold py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700" data-item-id="${item.id}" data-item-name="${item.name}">Preview</button>
                        <button class="buy-button text-sm font-bold py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-700" data-item-id="${item.id}" data-item-cost="${item.cost}" data-item-name="${item.name}">${item.cost.toLocaleString()} Coins</button>
                     </div>`;
                
                return `
                    <div class="bg-gray-700 p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <h4 class="font-semibold ${isOwned ? 'text-green-400' : 'text-white'}">${item.name} ${isOwned ? '(Owned)' : ''}</h4>
                            <p class="text-sm text-gray-400">${item.description}</p>
                        </div>
                        ${actionButtons}
                    </div>`;
            }).join('');
        };

        shopContent.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h3 class="font-serif-display text-2xl text-amber-400">The Shop</h3>
                <div class="flex items-center">
                    <span class="text-sm text-gray-300 mr-3">Test Items</span>
                    <label for="preview-toggle" class="flex items-center cursor-pointer">
                        <div class="relative">
                            <input type="checkbox" id="preview-toggle" class="sr-only">
                            <div class="block bg-gray-600 w-14 h-8 rounded-full"></div>
                            <div class="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition"></div>
                        </div>
                    </label>
                </div>
            </div>
            
            <h4 class="text-lg font-semibold text-indigo-300 mb-3 mt-4">Phoenix Cosmetics</h4>
            <div class="space-y-4">${createItemsHtml(cosmeticItems)}</div>

            <h4 class="text-lg font-semibold text-indigo-300 mb-3 mt-8">App Themes</h4>
            <div class="space-y-4">${createItemsHtml(themeItems)}</div>
        `;

        document.querySelectorAll('.buy-button').forEach(button => button.addEventListener('click', handleBuyItem));
        document.querySelectorAll('.preview-button').forEach(button => button.addEventListener('click', handlePreviewItem));
        document.getElementById('preview-toggle').addEventListener('change', handlePreviewToggle);
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
        const title = 'A New Beginning';
        const confirmText = 'Confirm';
        const message = 'Are you sure you want to log a relapse? This will reset your current streak timer.';

         showModal(title, `
            <p class="text-gray-300 mb-6">${message}</p>
            <div class="flex justify-end gap-4">
                <button id="cancel-relapse" class="bg-gray-600 hover:bg-gray-700 font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button id="confirm-relapse" class="bg-red-700 hover:bg-red-800 font-bold py-2 px-4 rounded-lg">${confirmText}</button>
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
             if (typeof state.upgrades === 'string') {
                state.upgrades = JSON.parse(state.upgrades);
            }
            clearInterval(timerInterval);
            if (state.lastRelapse) startTimer();
            exitPreview();
            updateUI();
            closeModal();
        } catch (error) {
            console.error('Relapse error:', error);
        }
    }

    async function handleBuyItem(e) {
        const button = e.target;
        const itemId = button.dataset.itemId;
        const itemName = button.dataset.itemName;
        const itemCost = parseInt(button.dataset.itemCost, 10);
    
        if (state.coins < itemCost) {
            showModal('Transaction Failed', '<p>You do not have enough coins to purchase this item.</p>');
            return;
        }
    
        const previewUpgrades = { ...state.upgrades, [itemId]: true };
        const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
        const currentRank = getRank(totalHours);
        const previewPhoenixSVG = renderPhoenix(currentRank.level, previewUpgrades);
    
        const modalContent = `
            <p class="text-gray-300 mb-4">Are you sure you want to purchase "${itemName}" for ${itemCost.toLocaleString()} coins?</p>
            <div class="my-6 p-4 bg-gray-900 rounded-lg flex justify-center items-center">
                <div class="w-32 h-32">${previewPhoenixSVG}</div>
            </div>
            <div class="flex justify-end gap-4">
                <button id="cancel-purchase" class="bg-gray-600 hover:bg-gray-700 font-bold py-2 px-4 rounded-lg">Cancel</button>
                <button id="confirm-purchase" class="bg-purple-600 hover:bg-purple-700 font-bold py-2 px-4 rounded-lg">Confirm Purchase</button>
            </div>
        `;
        showModal(`Confirm Purchase`, modalContent, false);
    
        document.getElementById('cancel-purchase').onclick = closeModal;
        document.getElementById('confirm-purchase').onclick = async () => {
            try {
                const response = await fetch('/api/buy', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ itemId }),
                });
                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.message || 'Failed to buy item');
                }
                state = await response.json();
                 if (typeof state.upgrades === 'string') {
                    state.upgrades = JSON.parse(state.upgrades);
                }
                exitPreview();
                applyBackground(state.upgrades);
                updateUI();
                closeModal();
            } catch (error) {
                closeModal();
                showModal('Purchase Error', `<p>${error.message}</p>`);
            }
        };
    }
    
    // --- Preview Mode Functions ---
    let previewToggleState = false;
    let activePreviewUpgrades = {};

    function handlePreviewToggle(e) {
        previewToggleState = e.target.checked;
        if (!previewToggleState) {
            exitPreview();
            activePreviewUpgrades = {};
        }
        const shopButtons = shopContent.querySelectorAll('.preview-button, .buy-button');
        shopButtons.forEach(btn => {
            if (previewToggleState) {
                btn.classList.add('opacity-50', 'cursor-not-allowed');
                if (btn.classList.contains('preview-button')) {
                     btn.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            } else {
                 btn.classList.remove('opacity-50', 'cursor-not-allowed');
            }
        });
    }

    function handlePreviewItem(e) {
        if (!previewToggleState) return;

        const itemId = e.target.dataset.itemId;
        
        if (activePreviewUpgrades[itemId]) {
            delete activePreviewUpgrades[itemId];
        } else {
            activePreviewUpgrades[itemId] = true;
        }

        const tempUpgrades = { ...state.upgrades, ...activePreviewUpgrades };
        
        const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
        const currentRank = getRank(totalHours);
        phoenixDisplay.innerHTML = renderPhoenix(currentRank.level, tempUpgrades);
        
        const activePreviewNames = Object.keys(activePreviewUpgrades).map(id => shopItems.find(item => item.id === id).name).join(', ');

        if (activePreviewNames) {
            isPreviewing = true;
            previewBannerText.textContent = `Previewing: ${activePreviewNames}`;
            previewBanner.classList.remove('hidden');
        } else {
            exitPreview();
        }
    }

    function exitPreview() {
        isPreviewing = false;
        activePreviewUpgrades = {};
        previewBanner.classList.add('hidden');
        const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
        const currentRank = getRank(totalHours);
        phoenixDisplay.innerHTML = renderPhoenix(currentRank.level, state.upgrades);
    }
    
    exitPreviewButton.addEventListener('click', exitPreview);

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
