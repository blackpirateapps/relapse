// --- DATA ---
export const ranks = [
    { name: "Ashen Egg", id: "egg", hours: 0, storyline: "A silent promise, dormant and resilient, waiting for the first spark of resolve." },
    { name: "Fledgling Hatchling", id: "hatchling", hours: 24, storyline: "The shell cracks. A new life, fragile yet determined, takes its first breath in a world free from shadow." },
    { name: "Ember Chick", id: "chick", hours: 72, storyline: "Small embers begin to glow within. Each passing hour is a lesson in controlling the inner fire." },
    { name: "Flame Youngling", id: "youngling", hours: 168, storyline: "The fire is now a steady flame. It learns to hunt urges, growing stronger with each small victory." },
    { name: "Sunfire Phoenix", id: "sunfire", hours: 336, storyline: "Radiating a brilliant heat, it becomes a beacon of its own willpower, its light pushing back the darkness." },
    { name: "Blaze Guardian", id: "guardian", hours: 720, storyline: "No longer just a creature of fire, but a guardian of its own flame. It stands vigilant against the encroaching cold." },
    { name: "Solar Drake", id: "drake", hours: 2160, storyline: "Its power rivals that of a small star. The old temptations are now mere shadows in its blinding light." },
    { name: "Celestial Phoenix", id: "celestial-phoenix", hours: 4320, storyline: "Transcending the physical, it becomes a cosmic force of pure will, a symbol of ultimate self-mastery." }
];

export const shopItems = [
    { id: 'aura', name: 'Aura of Resolve', cost: 500, description: 'Adds a soft, glowing aura to your phoenix.', type: 'cosmetic', image: '/img/aura.svg' },
    { id: 'celestialFlames', name: 'Celestial Flames', cost: 1200, description: 'Changes phoenix visuals to a cool blue.', type: 'cosmetic', image: '/img/celestial.svg' },
    { id: 'volcanicLair', name: 'Volcanic Lair', cost: 10000, description: 'A dark, fiery background theme.', type: 'theme', image: '/img/background-volcanic.svg' },
    { id: 'celestialSky', name: 'Celestial Sky', cost: 50000, description: 'A beautiful, star-filled background theme.', type: 'theme', image: '/img/background-celestial.svg' },
];

// --- CORE FUNCTIONS ---
let state = {};

export async function initializeApp(callback) {
    const loadingSpinner = document.getElementById('loading-spinner');
    const loginScreen = document.getElementById('login-screen');
    const appContainer = document.getElementById('app-container');

    if (loadingSpinner) loadingSpinner.classList.remove('hidden');
    if (loginScreen) loginScreen.classList.add('hidden');
    
    try {
        const response = await fetch('/api/state');
        if (response.ok) {
            state = await response.json();
            if (typeof state.upgrades === 'string') {
                state.upgrades = JSON.parse(state.upgrades);
            }
            if(appContainer) appContainer.classList.remove('hidden');
            if(loadingSpinner) loadingSpinner.classList.add('hidden');
            
            updateCoinCount();
            applyBackground();
            if (callback) callback(state);
        } else {
             if(loadingSpinner) loadingSpinner.classList.add('hidden');
             // Redirect to login if on a protected page
             if (window.location.pathname !== '/') {
                 window.location.href = '/';
             } else {
                if(loginScreen) loginScreen.classList.remove('hidden');
             }
        }
    } catch (error) {
        console.error("Auth check failed:", error);
        if(loadingSpinner) loadingSpinner.classList.add('hidden');
        if(loginScreen) loginScreen.classList.remove('hidden');
    }
    return state;
}

export function getState() {
    return state;
}

export function applyBackground() {
    const body = document.body;
    body.className = document.body.className.replace(/bg-(volcanic-lair|celestial-sky|default)/g, '');
    if (state.upgrades?.celestialSky) {
        body.classList.add('bg-celestial-sky');
    } else if (state.upgrades?.volcanicLair) {
        body.classList.add('bg-volcanic-lair');
    } else {
        body.classList.add('bg-default');
    }
}

export function updateCoinCount() {
    const coinCountDisplay = document.getElementById('coin-count');
    if (!coinCountDisplay) return;
    const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
    const streakCoins = calculateCoins(totalHours);
    const totalCoins = (state.coinsAtLastRelapse || 0) + streakCoins;
    coinCountDisplay.textContent = Math.floor(totalCoins).toLocaleString();
}

export function calculateCoins(totalHours) {
    if (totalHours <= 0) return 0;
    return Math.floor(10 * Math.pow(totalHours, 1.2));
}

export function getRank(totalHours) {
    for (let i = ranks.length - 1; i >= 0; i--) {
        if (totalHours >= ranks[i].hours) {
            return { ...ranks[i], level: i };
        }
    }
    return { ...ranks[0], level: 0 };
}

export function renderPhoenix(level, upgrades = {}) {
    const rank = ranks[level];
    if (!rank) return '';
    let suffix = [];
    if (upgrades.aura) suffix.push('aura');
    if (upgrades.celestialFlames) suffix.push('celestial');
    const finalName = suffix.length > 0 ? `${rank.id}-${suffix.join('-')}` : rank.id;
    const path = `/img/${finalName}.svg`;
    const fallbackPath = `/img/${rank.id}.svg`;
    return `<img src="${path}" alt="${rank.name}" class="w-full h-full object-contain" onerror="this.onerror=null;this.src='${fallbackPath}';">`;
}

export function showModal(title, content, showClose = true) {
    const modalContainer = document.getElementById('modal-container');
    const modalContentContainer = document.getElementById('modal-content');
    if(!modalContainer || !modalContentContainer) return;
    
    let closeButtonHtml = showClose ? `<button id="close-modal-btn" class="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">&times;</button>` : '';
    modalContentContainer.innerHTML = `
        <h3 class="font-serif-display text-2xl mb-4 text-amber-400">${title}</h3>
        ${closeButtonHtml}
        <div>${content}</div>`;
    modalContainer.classList.remove('hidden');
    if (showClose) {
        document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    }
}

export function closeModal() {
    const modalContainer = document.getElementById('modal-container');
    if(modalContainer) modalContainer.classList.add('hidden');
}
