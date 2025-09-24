// --- DATA ---
export const ranks = [
    { name: "Ashen Egg I", id: "egg-1", hours: 0, storyline: "A silent promise, dormant and resilient.", reward: 0, color: '#94a3b8', image: '/img/egg-1.webp' },
    { name: "Ashen Egg II", id: "egg-2", hours: 6, storyline: "A faint warmth begins to emanate from within.", reward: 50, color: '#a1a1aa', image: '/img/egg-2.webp' },
    { name: "Ashen Egg III", id: "egg-3", hours: 12, storyline: "Small cracks appear, signs of life stirring inside.", reward: 100, color: '#d4d4d8', image: '/img/egg-3.webp' },
    { name: "Fledgling Hatchling", id: "hatchling-1", hours: 24, storyline: "The shell cracks. A new life, fragile yet determined.", reward: 250, color: '#f87171', image: '/img/hatchling-1.webp' },
    { name: "Ember Glance", id: "hatchling-2", hours: 36, storyline: "Its eyes, like tiny embers, begin to focus.", reward: 150, color: '#fb923c', image: '/img/hatchling-2.webp' },
    { name: "First Steps", id: "hatchling-3", hours: 48, storyline: "Wobbly but resolute, it takes its first steps.", reward: 200, color: '#fbbf24', image: '/img/hatchling-3.webp' },
    { name: "Ember Chick", id: "chick-1", hours: 72, storyline: "Small embers begin to glow in its downy feathers.", reward: 500, color: '#facc15', image: '/img/chick-1.webp' },
    { name: "Warmth of Will", id: "chick-2", hours: 120, storyline: "The chick learns to control its inner warmth.", reward: 300, color: '#a3e635', image: '/img/chick-2.webp' },
    { name: "Flame Youngling", id: "youngling-1", hours: 168, storyline: "The fire is now a steady, growing flame.", reward: 1000, color: '#4ade80', image: '/img/youngling-1.webp' },
    { name: "Spark of Defiance", id: "youngling-2", hours: 240, storyline: "It actively extinguishes small temptations.", reward: 750, color: '#34d399', image: '/img/youngling-2.webp' },
    { name: "Sunfire Phoenix", id: "sunfire-1", hours: 336, storyline: "Radiating a brilliant heat, a beacon of willpower.", reward: 2000, color: '#2dd4bf', image: '/img/sunfire-1.webp' },
    { name: "Blinding Light", id: "sunfire-2", hours: 500, storyline: "Its light pushes back the shadows of doubt.", reward: 1500, color: '#67e8f9', image: '/img/sunfire-2.webp' },
    { name: "Blaze Guardian", id: "guardian-1", hours: 720, storyline: "No longer just a creature, but a guardian of its flame.", reward: 4000, color: '#a78bfa', image: '/img/guardian-1.webp' },
    { name: "Vigilant Stance", id: "guardian-2", hours: 1440, storyline: "A fortress of resolve against old habits.", reward: 3000, color: '#c084fc', image: '/img/guardian-2.webp' },
    { name: "Solar Drake", id: "drake", hours: 2160, storyline: "Its power rivals that of a small star.", reward: 8000, color: '#f472b6', image: '/img/drake.webp' },
    { name: "Celestial Phoenix", id: "celestial-phoenix", hours: 4320, storyline: "A cosmic force of pure, transcendent will.", reward: 15000, color: '#f9a8d4', image: '/img/celestial-phoenix.webp' }
];

export const shopItems = [
    // FIXED: Added Phoenix Skins back to the main shop list
    {
        id: 'bluePhoenix',
        name: 'Blue Phoenix',
        cost: 1500,
        description: 'A mystical phoenix born of celestial ice, its flames burn with a cool, determined light.',
        type: 'phoenix_skin',
        previewImage: '/img/skins/blue/celestial-phoenix.webp',
        images: [
            '/img/skins/blue/egg-1.webp', '/img/skins/blue/egg-2.webp', '/img/skins/blue/egg-3.webp',
            '/img/skins/blue/hatchling-1.webp', '/img/skins/blue/hatchling-2.webp', '/img/skins/blue/hatchling-3.webp',
            '/img/skins/blue/chick-1.webp', '/img/skins/blue/chick-2.webp',
            '/img/skins/blue/youngling-1.webp', '/img/skins/blue/youngling-2.webp',
            '/img/skins/blue/sunfire-1.webp', '/img/skins/blue/sunfire-2.webp',
            '/img/skins/blue/guardian-1.webp', '/img/skins/blue/guardian-2.webp',
            '/img/skins/blue/drake.webp', '/img/skins/blue/celestial-phoenix.webp'
        ]
    },
    {
        id: 'greenPhoenix',
        name: 'Verdant Phoenix',
        cost: 4000,
        description: 'A phoenix intertwined with the essence of a life-giving forest, symbolizing growth and renewal.',
        type: 'phoenix_skin',
        previewImage: '/img/skins/green/celestial-phoenix.webp',
        images: [
            '/img/skins/green/egg-1.webp', '/img/skins/green/egg-2.webp', '/img/skins/green/egg-3.webp',
            '/img/skins/green/hatchling-1.webp', '/img/skins/green/hatchling-2.webp', '/img/skins/green/hatchling-3.webp',
            '/img/skins/green/chick-1.webp', '/img/skins/green/chick-2.webp',
            '/img/skins/green/youngling-1.webp', '/img/skins/green/youngling-2.webp',
            '/img/skins/green/sunfire-1.webp', '/img/skins/green/sunfire-2.webp',
            '/img/skins/green/guardian-1.webp', '/img/skins/green/guardian-2.webp',
            '/img/skins/green/drake.webp', '/img/skins/green/celestial-phoenix.webp'
        ]
    },
    // Existing Items
    { id: 'aura', name: 'Aura of Resolve', cost: 500, description: 'A soft, glowing aura for your phoenix.', type: 'cosmetic' },
    { id: 'volcanicLair', name: 'Volcanic Lair', cost: 10000, description: 'A dark, fiery background theme.', type: 'theme' },
    { id: 'celestialSky', name: 'Celestial Sky', cost: 50000, description: 'A beautiful, star-filled background theme.', type: 'theme' }
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
            if (typeof state.upgrades === 'string') state.upgrades = JSON.parse(state.upgrades || '{}');
            if (typeof state.equipped_upgrades === 'string') state.equipped_upgrades = JSON.parse(state.equipped_upgrades || '{}');

            createSidebar();
            if (appContainer) appContainer.classList.remove('hidden');
            if (loadingSpinner) loadingSpinner.classList.add('hidden');
            
            updateCoinCount();
            initStarfield();
            if (callback) callback(state);
        } else {
            if (loadingSpinner) loadingSpinner.classList.add('hidden');
            if (window.location.pathname !== '/') {
                window.location.href = '/';
            } else {
                if (loginScreen) loginScreen.classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error("Auth check failed:", error);
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
        if (loginScreen && window.location.pathname === '/') loginScreen.classList.remove('hidden');
    }
    return state;
}

function createSidebar() {
    const navItems = [
        { id: 'journey', name: 'Journey', href: '/', icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>` },
        { id: 'progression', name: 'Progression', href: '/progression.html', icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>` },
        { id: 'forest', name: 'Forest', href: '/forest.html', icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>` },
        { id: 'aviary', name: 'The Aviary', href: '/aviary.html', icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>` },
        { id: 'shop', name: 'The Shop', href: '/shop.html', icon: `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>` },
    ];

    const currentPath = window.location.pathname;

    const sidebarHTML = `
        <a href="/" class="text-white flex items-center space-x-2 px-4">
            <svg class="w-8 h-8" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M50 0C50 0 50 25 25 25C25 25 0 25 0 50C0 50 0 75 25 75C25 75 50 75 50 100C50 100 50 75 75 75C75 75 100 75 100 50C100 50 100 25 75 25C75 25 50 25 50 0Z" fill="url(#paint0_linear_90_2)"/><defs><linearGradient id="paint0_linear_90_2" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse"><stop stop-color="#FBBF24"/><stop offset="1" stop-color="#F87171"/></linearGradient></defs></svg>
            <span class="text-2xl font-serif-display">Phoenix</span>
        </a>
        <nav>
            ${navItems.map(item => {
                const isActive = item.href === '/' ? currentPath === '/' || currentPath === '/index.html' : currentPath.startsWith(item.href);
                return `
                <a href="${item.href}" class="sidebar-nav-item flex items-center py-2.5 px-4 rounded transition duration-200 ${isActive ? 'active' : ''}">
                    ${item.icon}
                    <span class="ml-4">${item.name}</span>
                </a>
            `}).join('')}
        </nav>
    `;

    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar bg-black bg-opacity-20 text-gray-300 w-64 space-y-6 py-7 px-2 absolute inset-y-0 left-0 transform -translate-x-full md:relative md:translate-x-0';
    sidebar.innerHTML = sidebarHTML;

    const appContainer = document.getElementById('app-container');
    if (appContainer) {
        appContainer.prepend(sidebar);
    }
}


export function getState() {
    return state;
}

export function updateCoinCount() {
    const coinCountDisplay = document.getElementById('coin-count');
    const coinRateDisplay = document.getElementById('coin-rate');

    if (!coinCountDisplay) return;

    const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
    
    const streakCoins = calculateCoins(totalHours);
    const totalCoins = (state.coinsAtLastRelapse || 0) + streakCoins;
    state.coins = totalCoins;
    coinCountDisplay.textContent = Math.floor(totalCoins).toLocaleString();

    if (coinRateDisplay) {
        const coinRatePerHour = totalHours > 0 ? 12 * Math.pow(totalHours, 0.2) : 0;
        coinRateDisplay.textContent = `+${Math.floor(coinRatePerHour).toLocaleString()}/hr`;
    }
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

export function renderPhoenix(level, equipped_upgrades = {}) {
    const rank = ranks[level];
    if (!rank) return '';
    
    let imageSrc = rank.image;

    // Check for equipped phoenix skins from the updated shopItems list
    for (const itemId in equipped_upgrades) {
        if (equipped_upgrades[itemId]) {
            const shopItem = shopItems.find(item => item.id === itemId && item.type === 'phoenix_skin');
            if (shopItem && shopItem.images && shopItem.images[level]) {
                imageSrc = shopItem.images[level];
                break; 
            }
        }
    }
    
    return `<img src="${imageSrc}" alt="${rank.name}" class="w-full h-full object-contain">`;
}

export function showModal(title, content, options = {}) {
    const { showClose = true, size = 'max-w-lg' } = options;
    const modalContainer = document.getElementById('modal-container');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div class="flex items-center justify-center min-h-screen p-4 text-center">
          <div id="modal-bg" class="fixed inset-0 bg-black bg-opacity-75 transition-opacity" style="backdrop-filter: blur(5px);"></div>
          <div class="inline-block card text-left overflow-hidden transform transition-all sm:my-8 ${size} w-full p-8">
             <h3 class="font-serif-display text-2xl mb-4 text-white">${title}</h3>
             ${showClose ? `<button id="close-modal-btn" class="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl">&times;</button>` : ''}
             <div class="text-gray-300">${content}</div>
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
    if (modalContainer) modalContainer.classList.add('hidden');
}

export function initStarfield() {
    const canvas = document.getElementById('starfield');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    window.onresize = () => { 
        if(canvas) {
            w = canvas.width = window.innerWidth; 
            h = canvas.height = window.innerHeight; 
        }
    };
    const stars = Array.from({ length: 100 }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        radius: Math.random() * 1 + 1,
        vx: Math.floor(Math.random() * 50) - 25, vy: Math.floor(Math.random() * 50) - 25
    }));
    function tick() {
        if(!ctx) return;
        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = "lighter";
        stars.forEach(s => {
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, 2 * Math.PI);
            ctx.fill();
            s.x += s.vx / 60;
            s.y += s.vy / 60;
            if (s.x < 0 || s.x > w) s.vx = -s.vx;
            if (s.y < 0 || s.y > h) s.vy = -s.vy;
        });
        requestAnimationFrame(tick);
    }
    tick();
}

