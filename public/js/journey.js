// --- DATA ---
const ranks = [
    { name: "Ashen Egg", id: "egg", hours: 0, storyline: "A silent promise, dormant and resilient, waiting for the first spark of resolve." },
    { name: "Fledgling Hatchling", id: "hatchling", hours: 24, storyline: "The shell cracks. A new life, fragile yet determined, takes its first breath in a world free from shadow." },
    { name: "Ember Chick", id: "chick", hours: 72, storyline: "Small embers begin to glow within. Each passing hour is a lesson in controlling the inner fire." },
    { name: "Flame Youngling", id: "youngling", hours: 168, storyline: "The fire is now a steady flame. It learns to hunt urges, growing stronger with each small victory." },
    { name: "Sunfire Phoenix", id: "sunfire", hours: 336, storyline: "Radiating a brilliant heat, it becomes a beacon of its own willpower, its light pushing back the darkness." },
    { name: "Blaze Guardian", id: "guardian", hours: 720, storyline: "No longer just a creature of fire, but a guardian of its own flame. It stands vigilant against the encroaching cold." },
    { name: "Solar Drake", id: "drake", hours: 2160, storyline: "Its power rivals that of a small star. The old temptations are now mere shadows in its blinding light." },
    { name: "Celestial Phoenix", id: "celestial-phoenix", hours: 4320, storyline: "Transcending the physical, it becomes a cosmic force of pure will, a symbol of ultimate self-mastery." }
];

const shopItems = [
    { id: 'aura', name: 'Aura of Resolve', cost: 500, description: 'Adds a soft, glowing aura to your phoenix.', type: 'cosmetic', image: '/img/aura.svg' },
    { id: 'celestialFlames', name: 'Celestial Flames', cost: 1200, description: 'Changes phoenix visuals to a cool blue.', type: 'cosmetic', image: '/img/celestial.svg' },
    { id: 'volcanicLair', name: 'Volcanic Lair', cost: 10000, description: 'A dark, fiery background theme.', type: 'theme', image: '/img/bg-volcanic-lair.svg' },
    { id: 'celestialSky', name: 'Celestial Sky', cost: 50000, description: 'A beautiful, star-filled background theme.', type: 'theme', image: '/img/bg-celestial-sky.svg' },
];

// --- APP STATE ---
let state = {};
let timerInterval;
let isPreviewing = false;
let activePreviewUpgrades = {};

// --- DOM ELEMENTS ---
const elements = {
    loginScreen: document.getElementById('login-screen'),
    loadingSpinner: document.getElementById('loading-spinner'),
    appContainer: document.getElementById('app-container'),
    backgroundContainer: document.getElementById('background-container'),
    coinCount: document.getElementById('coin-count'),
    // Page Sections
    journeySection: document.getElementById('journey-section'),
    progressionSection: document.getElementById('progression-section'),
    shopSection: document.getElementById('shop-section'),
    // Journey Elements
    timer: document.getElementById('timer'),
    rankName: document.getElementById('rank-name'),
    phoenixDisplay: document.getElementById('phoenix-display'),
    longestStreak: document.getElementById('longest-streak'),
    // Buttons
    urgeButton: document.getElementById('urge-button'),
    relapseButton: document.getElementById('relapse-button'),
    loginButton: document.getElementById('login-button'),
    // Preview
    previewBanner: document.getElementById('preview-banner'),
    previewBannerText: document.getElementById('preview-banner-text'),
    exitPreviewButton: document.getElementById('exit-preview-button'),
    // Login
    passwordInput: document.getElementById('password-input'),
    loginError: document.getElementById('login-error'),
};

// --- CORE FUNCTIONS ---
async function initializeApp() {
    elements.loadingSpinner.classList.remove('hidden');
    elements.loginScreen.classList.add('hidden');
    
    try {
        const response = await fetch('/api/state');
        if (response.ok) {
            state = await response.json();
            if (typeof state.upgrades === 'string') {
                state.upgrades = JSON.parse(state.upgrades);
            }
            elements.appContainer.classList.remove('hidden');
            elements.loadingSpinner.classList.add('hidden');
            
            await applyBackground(state.upgrades);
            updateUI();
            startTimer();
            setupNavigation();
        } else {
            elements.loadingSpinner.classList.add('hidden');
            elements.loginScreen.classList.remove('hidden');
        }
    } catch (error) {
        console.error("Auth check failed:", error);
        elements.loadingSpinner.classList.add('hidden');
        elements.loginScreen.classList.remove('hidden');
    }
}

async function applyBackground(upgrades) {
    let theme = 'default';
    if (upgrades?.celestialSky) theme = 'celestial-sky';
    else if (upgrades?.volcanicLair) theme = 'volcanic-lair';

    try {
        const response = await fetch(`/img/bg-${theme}.svg`);
        if (!response.ok) throw new Error('Background not found');
        elements.backgroundContainer.innerHTML = await response.text();
    } catch (error) {
        console.error("Failed to load background:", error);
        elements.backgroundContainer.innerHTML = '';
    }
}

function updateUI() {
    if (isPreviewing) return;
    updateCoinCount();
    
    const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
    const currentRank = getRank(totalHours);

    elements.rankName.textContent = currentRank.name;
    elements.phoenixDisplay.innerHTML = renderPhoenix(currentRank.level, state.upgrades);
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

// --- UTILITY FUNCTIONS ---
function updateCoinCount() {
    const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
    const streakCoins = calculateCoins(totalHours);
    state.coins = (state.coinsAtLastRelapse || 0) + streakCoins;
    elements.coinCount.textContent = Math.floor(state.coins).toLocaleString();
}

function getRank(totalHours) {
    for (let i = ranks.length - 1; i >= 0; i--) {
        if (totalHours >= ranks[i].hours) return { ...ranks[i], level: i };
    }
    return { ...ranks[0], level: 0 };
}

function renderPhoenix(level, upgrades = {}) {
    const rank = ranks[level];
    let suffix = [];
    if (upgrades.aura) suffix.push('aura');
    if (upgrades.celestialFlames) suffix.push('celestial');
    const finalName = suffix.length > 0 ? `${rank.id}-${suffix.join('-')}` : rank.id;
    const path = `/img/${finalName}.svg`;
    const fallbackPath = `/img/${rank.id}.svg`;
    return `<img src="${path}" alt="${rank.name}" class="w-full h-full object-contain" onerror="this.onerror=null;this.src='${fallbackPath}';">`;
}

function calculateCoins(totalHours) {
    if (totalHours <= 0) return 0;
    return Math.floor(10 * Math.pow(totalHours, 1.2));
}

function formatStreak(seconds) {
    if (!seconds || seconds < 0) return "0d 0h";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
}

// --- NAVIGATION ---
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-button');
    navButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = button.dataset.section;

            document.querySelectorAll('.app-section').forEach(s => s.classList.add('hidden'));
            document.getElementById(`${targetSection}-section`).classList.remove('hidden');

            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            if (targetSection === 'progression') updateProgressionSection();
            if (targetSection === 'shop') updateShopSection();
        });
    });
}

// --- SECTION UPDATERS ---
function updateProgressionSection() {
    const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
    elements.progressionSection.innerHTML = `
        <div class="snap-x snap-mandatory overflow-x-auto flex pb-8 w-full">
            ${ranks.map((rank, index) => {
                const isUnlocked = totalHours >= rank.hours;
                const isCurrent = isUnlocked && (!ranks[index + 1] || totalHours < ranks[index + 1].hours);
                const hourlyRate = rank.hours > 0 ? Math.floor(10 * 1.2 * Math.pow(rank.hours, 0.2)) : 12;
                return `
                    <div class="snap-center flex-shrink-0 w-full max-w-sm mx-auto flex flex-col items-center justify-center p-6">
                        <div class="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full text-center">
                            <div class="w-64 h-64 mx-auto mb-6 ${isUnlocked ? '' : 'opacity-40 filter grayscale'}">${renderPhoenix(index, state.upgrades)}</div>
                            <h2 class="font-serif-display text-3xl ${isCurrent ? 'text-amber-400' : 'text-white'}">${rank.name}</h2>
                            <p class="text-gray-400 mt-2 text-sm">Unlocked at ${rank.hours / 24} days</p>
                            <p class="mt-4 text-gray-300 h-24">${rank.storyline}</p>
                            <div class="mt-6 bg-gray-900/50 p-4 rounded-lg">
                                <h4 class="text-sm text-gray-400">Est. Coin Rate at this Level</h4>
                                <p class="text-xl font-bold text-yellow-400">${hourlyRate} coins/hr</p>
                            </div>
                        </div>
                    </div>`;
            }).join('')}
        </div>`;
}

function updateShopSection() {
    const cosmeticItems = shopItems.filter(item => item.type === 'cosmetic');
    const themeItems = shopItems.filter(item => item.type === 'theme');
    const createItemsHtml = (items) => items.map(item => `
        <div class="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-6 flex flex-col text-center">
            <div class="w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                <img src="${item.image}" alt="${item.name}" class="max-w-full max-h-full">
            </div>
            <h3 class="font-serif-display text-2xl text-amber-400">${item.name}</h3>
            <p class="text-gray-400 text-sm flex-grow my-2">${item.description}</p>
            <div class="flex gap-2 mt-4">
                <button class="preview-button w-1/2 font-bold py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700" data-item-id="${item.id}">Preview</button>
                <button class="buy-button w-1/2 font-bold py-3 px-4 rounded-lg ${state.upgrades[item.id] ? 'bg-gray-500 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}" data-item-id="${item.id}" ${state.upgrades[item.id] ? 'disabled' : ''}>
                    ${state.upgrades[item.id] ? 'Owned' : `${item.cost.toLocaleString()} Coins`}
                </button>
            </div>
        </div>`).join('');

    elements.shopSection.innerHTML = `
        <h2 class="text-2xl font-semibold text-indigo-300 mb-4">Phoenix Cosmetics</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${createItemsHtml(cosmeticItems)}</div>
        <h2 class="text-2xl font-semibold text-indigo-300 mb-4 mt-10">App Themes</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">${createItemsHtml(themeItems)}</div>`;

    document.querySelectorAll('.buy-button').forEach(b => b.addEventListener('click', handleBuyItem));
    document.querySelectorAll('.preview-button').forEach(b => b.addEventListener('click', handlePreviewItem));
}

// --- EVENT HANDLERS & MODALS ---
document.addEventListener('DOMContentLoaded', initializeApp);

elements.loginButton.addEventListener('click', async () => {
    elements.loginError.textContent = '';
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: elements.passwordInput.value }),
        });
        if (response.ok) window.location.reload();
        else elements.loginError.textContent = 'Incorrect password.';
    } catch {
        elements.loginError.textContent = 'An error occurred.';
    }
});

elements.urgeButton.addEventListener('click', () => {
    const tasks = ["Do 10 push-ups.", "Step outside for 5 minutes.", "Drink a full glass of cold water."];
    showModal('A Moment of Strength', `<p class="text-gray-300">${tasks[Math.floor(Math.random() * tasks.length)]}</p>`);
});

elements.relapseButton.addEventListener('click', () => {
    showModal('A New Beginning', `
        <p class="text-gray-300 mb-6">Are you sure? This will reset your streak.</p>
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

function handleBuyItem(e) {
    const itemId = e.target.dataset.itemId;
    const item = shopItems.find(i => i.id === itemId);
    if (state.coins < item.cost) {
        return showModal('Not Enough Coins', '<p>You do not have enough coins.</p>');
    }
    showModal(`Confirm Purchase`, `
        <p class="text-gray-300 mb-4">Purchase "${item.name}" for ${item.cost.toLocaleString()} coins?</p>
        <div class="flex justify-end gap-4 mt-6">
            <button id="cancel-purchase" class="bg-gray-600 hover:bg-gray-700 py-2 px-4 rounded-lg">Cancel</button>
            <button id="confirm-purchase" class="bg-purple-600 hover:bg-purple-700 py-2 px-4 rounded-lg">Confirm</button>
        </div>`, false);
    document.getElementById('cancel-purchase').onclick = closeModal;
    document.getElementById('confirm-purchase').onclick = async () => {
        await fetch('/api/buy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId }) });
        window.location.reload();
    };
}

function handlePreviewItem(e) {
    const itemId = e.target.dataset.itemId;
    const item = shopItems.find(i => i.id === itemId);
    activePreviewUpgrades[itemId] = !activePreviewUpgrades[itemId];
    if (!activePreviewUpgrades[itemId]) delete activePreviewUpgrades[itemId];
    
    const tempUpgrades = { ...state.upgrades, ...activePreviewUpgrades };
    
    if (item.type === 'cosmetic') {
        const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
        elements.phoenixDisplay.innerHTML = renderPhoenix(getRank(totalHours).level, tempUpgrades);
    } else if (item.type === 'theme') {
        applyBackground(tempUpgrades);
    }
    
    const activePreviewNames = Object.keys(activePreviewUpgrades).map(id => shopItems.find(i => i.id === id).name).join(', ');
    if (activePreviewNames) {
        isPreviewing = true;
        elements.previewBannerText.textContent = `Previewing: ${activePreviewNames}`;
        elements.previewBanner.classList.remove('hidden');
    } else {
        exitPreview();
    }
}

function exitPreview() {
    isPreviewing = false;
    activePreviewUpgrades = {};
    elements.previewBanner.classList.add('hidden');
    applyBackground(state.upgrades);
    updateUI();
}

elements.exitPreviewButton.addEventListener('click', exitPreview);

// --- MODAL ---
function showModal(title, content, showClose = true) {
    const modalContainer = document.getElementById('modal-container');
    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = `
        <h3 class="font-serif-display text-2xl mb-4 text-amber-400">${title}</h3>
        ${showClose ? '<button id="close-modal-btn" class="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">&times;</button>' : ''}
        <div>${content}</div>`;
    modalContainer.classList.remove('hidden');
    if (showClose) document.getElementById('close-modal-btn').addEventListener('click', closeModal);
}

function closeModal() {
    document.getElementById('modal-container').classList.add('hidden');
}

document.getElementById('modal-bg').addEventListener('click', closeModal);

