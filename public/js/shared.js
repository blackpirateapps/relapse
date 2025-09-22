// --- DATA ---
export const ranks = [
    // Ashen Egg Arc (0-23 hours)
    { name: "Ashen Egg I", id: "egg-1", hours: 0, storyline: "A silent promise, dormant and resilient.", reward: 0 },
    { name: "Ashen Egg II", id: "egg-2", hours: 6, storyline: "A faint warmth begins to emanate from within.", reward: 50 },
    { name: "Ashen Egg III", id: "egg-3", hours: 12, storyline: "Small cracks appear, signs of the life stirring inside.", reward: 100 },

    // Fledgling Hatchling Arc (24-71 hours)
    { name: "Fledgling Hatchling", id: "hatchling-1", hours: 24, storyline: "The shell cracks. A new life, fragile yet determined, takes its first breath.", reward: 250 },
    { name: "Ember Glance", id: "hatchling-2", hours: 36, storyline: "Its eyes, like tiny embers, begin to focus with newfound clarity.", reward: 150 },
    { name: "First Steps", id: "hatchling-3", hours: 48, storyline: "Wobbly but resolute, it takes its first steps away from the broken shell.", reward: 200 },

    // Ember Chick Arc (72-167 hours)
    { name: "Ember Chick", id: "chick-1", hours: 72, storyline: "Small embers begin to glow within its downy feathers.", reward: 500 },
    { name: "Warmth of Will", id: "chick-2", hours: 120, storyline: "The chick learns to control its inner warmth, a sign of growing discipline.", reward: 300 },

    // Flame Youngling Arc (168-335 hours)
    { name: "Flame Youngling", id: "youngling-1", hours: 168, storyline: "The fire is now a steady flame, learning to hunt urges and growing stronger.", reward: 1000 },
    { name: "Spark of Defiance", id: "youngling-2", hours: 240, storyline: "It actively seeks out and extinguishes small temptations, its confidence growing.", reward: 750 },

    // Sunfire Phoenix Arc (336-719 hours)
    { name: "Sunfire Phoenix", id: "sunfire-1", hours: 336, storyline: "Radiating a brilliant heat, it becomes a beacon of its own willpower.", reward: 2000 },
    { name: "Blinding Light", id: "sunfire-2", hours: 500, storyline: "Its light is so bright it pushes back the shadows of doubt and memory.", reward: 1500 },

    // Blaze Guardian Arc (720-2159 hours)
    { name: "Blaze Guardian", id: "guardian-1", hours: 720, storyline: "No longer just a creature of fire, but a guardian of its own flame.", reward: 4000 },
    { name: "Vigilant Stance", id: "guardian-2", hours: 1440, storyline: "It stands vigilant, a fortress of resolve against the encroaching cold of old habits.", reward: 3000 },

    // Solar Drake Arc (2160-4319 hours)
    { name: "Solar Drake", id: "drake", hours: 2160, storyline: "Its power rivals that of a small star. Temptations are mere shadows in its light.", reward: 8000 },
    
    // Celestial Phoenix Arc (4320+ hours)
    { name: "Celestial Phoenix", id: "celestial-phoenix", hours: 4320, storyline: "Transcending the physical, it becomes a cosmic force of pure will.", reward: 15000 }
];

export const shopItems = [
    { id: 'aura', name: 'Aura of Resolve', cost: 500, description: 'Adds a soft, glowing aura to your phoenix.', type: 'cosmetic', image: '/img/aura.svg' },
    { id: 'celestialFlames', name: 'Celestial Flames', cost: 1200, description: 'Changes phoenix visuals to a cool blue.', type: 'cosmetic', image: '/img/celestial.svg' },
    { id: 'volcanicLair', name: 'Volcanic Lair', cost: 10000, description: 'A dark, fiery background theme.', type: 'theme', image: '/img/bg-volcanic-lair.svg' },
    { id: 'celestialSky', name: 'Celestial Sky', cost: 50000, description: 'A beautiful, star-filled background theme.', type: 'theme', image: '/img/bg-celestial-sky.svg' },
    { id: 'navStyle', name: 'Celestial Navigation', cost: 500, description: 'Applies a stylish cosmic theme to the main menu.', type: 'theme', image: '/img/nav-style.svg'}
];

// --- CORE FUNCTIONS ---
let state = {};

export async function initializeApp(callback) {
    const loadingSpinner = document.getElementById('loading-spinner');
    const loginScreen = document.getElementById('login-screen');
    const appContainer = document.getElementById('app-container');

    if(loadingSpinner) loadingSpinner.classList.remove('hidden');
    if(loginScreen) loginScreen.classList.add('hidden');
    
    try {
        const response = await fetch('/api/state');
        if (response.ok) {
            state = await response.json();
            if (typeof state.upgrades === 'string') {
                state.upgrades = JSON.parse(state.upgrades || '{}');
            }
            if (typeof state.equipped_upgrades === 'string') {
                state.equipped_upgrades = JSON.parse(state.equipped_upgrades || '{}');
            }
            if(appContainer) appContainer.classList.remove('hidden');
            if(loadingSpinner) loadingSpinner.classList.add('hidden');
            
            updateCoinCount();
            await applyBackground(state.equipped_upgrades);
            applyNavStyle(state.equipped_upgrades);
            if (callback) callback(state);
        } else {
             if(loadingSpinner) loadingSpinner.classList.add('hidden');
             if (window.location.pathname !== '/') {
                 window.location.href = '/';
             } else {
                if(loginScreen) loginScreen.classList.remove('hidden');
             }
        }
    } catch (error) {
        console.error("Auth check failed:", error);
        if(loadingSpinner) loadingSpinner.classList.add('hidden');
        if(loginScreen && window.location.pathname === '/') loginScreen.classList.remove('hidden');
    }
    return state;
}

export function getState() {
    return state;
}

export async function applyBackground(upgrades, container = document.getElementById('background-container')) {
    if (!container) return;

    let theme = 'default';
    if (upgrades?.celestialSky) theme = 'celestial-sky';
    else if (upgrades?.volcanicLair) theme = 'volcanic-lair';

    try {
        const response = await fetch(`/img/bg-${theme}.svg`);
        if (!response.ok) throw new Error('Background not found');
        container.innerHTML = await response.text();
    } catch (error) {
        console.error("Failed to load background:", error);
        container.innerHTML = '<div class="w-full h-full bg-gray-900"></div>';
    }
}

export function applyNavStyle(upgrades, header = document.getElementById('app-header')) {
    if (header && upgrades?.navStyle) {
        header.classList.add('celestial-nav');
    } else if (header) {
        header.classList.remove('celestial-nav');
    }
}

export function updateCoinCount() {
    const coinCountDisplay = document.getElementById('coin-count');
    if (!coinCountDisplay) return;
    
    const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
    const streakCoins = calculateCoins(totalHours);
    const totalCoins = (state.coinsAtLastRelapse || 0) + streakCoins;
    state.coins = totalCoins; // Keep state updated
    coinCountDisplay.textContent = Math.floor(totalCoins).toLocaleString();
}

export function calculateCoins(totalHours) {
    if (totalHours <= 0) return 0;
    return Math.floor(10 * Math.pow(totalHours, 1.2));
}

export function getRank(totalHours) {
    for (let i = ranks.length - 1; i >= 0; i--) {
        if (totalHours >= ranks[i].hours) return { ...ranks[i], level: i };
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

export function showModal(title, content, options = {}) {
    const { showClose = true, size = 'max-w-lg' } = options;
    const modalContainer = document.getElementById('modal-container');
    if(!modalContainer) return;
    
    modalContainer.innerHTML = `
      <div class="flex items-center justify-center min-h-screen p-4 text-center">
          <div id="modal-bg" class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" style="backdrop-filter: blur(5px);"></div>
          <div class="inline-block bg-gray-800/80 backdrop-blur-sm rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 ${size} w-full p-8">
             <h3 class="font-serif-display text-2xl mb-4 text-amber-400">${title}</h3>
             ${showClose ? '<button id="close-modal-btn" class="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">&times;</button>' : ''}
             <div>${content}</div>
          </div>
      </div>`;
    modalContainer.classList.remove('hidden');
    
    if (showClose) {
        document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    }
    document.getElementById('modal-bg').addEventListener('click', closeModal);
}

export function closeModal() {
    const modalContainer = document.getElementById('modal-container');
    if(modalContainer) modalContainer.classList.add('hidden');
}

