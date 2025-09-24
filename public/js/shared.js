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

// Shop data will be fetched from API
export let shopItems = [];
export let treeTypes = {};

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

      // Load shop data from new API endpoint
      await loadShopData();

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

// Load shop data from new API endpoint
async function loadShopData() {
  try {
    const response = await fetch('/api/shop');
    if (response.ok) {
      const shopData = await response.json();
      
      // Clear existing arrays and objects
      shopItems.length = 0;
      Object.keys(treeTypes).forEach(key => delete treeTypes[key]);
      
      // Populate with new data from database
      shopItems.push(...shopData.shopItems);
      Object.assign(treeTypes, shopData.treeTypes);
      
      console.log('Loaded shop data:', { 
        itemCount: shopItems.length, 
        treeCount: Object.keys(treeTypes).length 
      });
    } else {
      console.warn('Failed to load shop data from API');
    }
  } catch (error) {
    console.error('Failed to load shop data:', error);
  }
}

// Export function to reload shop data
export async function reloadShopData() {
  await loadShopData();
}

function createSidebar() {
  const navItems = [
    { id: 'journey', name: 'Journey', href: '/', icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>` },
    { id: 'progression', name: 'Progression', href: '/progression.html', icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>` },
    { id: 'forest', name: 'Forest', href: '/forest.html', icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>` },
    { id: 'aviary', name: 'The Aviary', href: '/aviary.html', icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>` },
    { id: 'shop', name: 'The Shop', href: '/shop.html', icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg>` },
  ];

  const currentPath = window.location.pathname;
  const sidebarHTML = `
    <div class="px-6 py-6">
      <h1 class="text-xl font-bold text-white">Phoenix</h1>
      <div class="mt-4 text-sm">
        <div class="text-gray-400">Coins</div>
        <div id="coin-count" class="text-lg font-semibold text-yellow-400">0</div>
        <div id="coin-rate" class="text-xs text-gray-500"></div>
      </div>
    </div>
    <nav class="px-6">
      <ul class="space-y-2">
        ${navItems.map(item => `
          <li>
            <a href="${item.href}" class="group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${currentPath === item.href || (item.href === '/' && currentPath === '/index.html') ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}">
              ${item.icon}
              <span class="ml-3">${item.name}</span>
            </a>
          </li>
        `).join('')}
      </ul>
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

export function updateState(newState) {
  Object.assign(state, newState);
  if (typeof state.upgrades === 'string') state.upgrades = JSON.parse(state.upgrades || '{}');
  if (typeof state.equipped_upgrades === 'string') state.equipped_upgrades = JSON.parse(state.equipped_upgrades || '{}');
  updateCoinCount();
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

  // Check for equipped phoenix skins
  for (const itemId in equipped_upgrades) {
    if (equipped_upgrades[itemId]) {
      const shopItem = shopItems.find(item => item.id === itemId && item.type === 'phoenix_skin');
      if (shopItem && shopItem.images && shopItem.images[level]) {
        imageSrc = shopItem.images[level];
        break;
      }
    }
  }

  return `<img src="${imageSrc}" alt="${rank.name}" class="w-32 h-32 object-cover rounded-full mx-auto" onerror="this.style.display='none'">`;
}

export function showModal(title, content, options = {}) {
  const { showClose = true, size = 'max-w-lg' } = options;
  const modalContainer = document.getElementById('modal-container');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-gray-800 rounded-lg ${size} w-full max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-white">${title}</h3>
            ${showClose ? '<button onclick="closeModal()" class="text-gray-400 hover:text-white">×</button>' : ''}
          </div>
          <div class="text-gray-300">
            ${content}
          </div>
        </div>
      </div>
    </div>
  `;
  modalContainer.classList.remove('hidden');
}

export function closeModal() {
  const modalContainer = document.getElementById('modal-container');
  if (modalContainer) {
    modalContainer.classList.add('hidden');
    modalContainer.innerHTML = '';
  }
}

function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let stars = [];
  const numStars = 200;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function createStars() {
    stars = [];
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2,
        speed: Math.random() * 0.5 + 0.1
      });
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    stars.forEach(star => {
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.8 + 0.2})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
      
      star.y += star.speed;
      if (star.y > canvas.height) {
        star.y = 0;
        star.x = Math.random() * canvas.width;
      }
    });
    
    requestAnimationFrame(animate);
  }

  resizeCanvas();
  createStars();
  animate();

  window.addEventListener('resize', () => {
    resizeCanvas();
    createStars();
  });
}