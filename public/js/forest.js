import { initializeApp, showModal, closeModal, updateState, treeTypes, reloadShopData } from './shared.js';

// API endpoints
const STATE_API_URL = '/api/state';
const SHOP_API_URL = '/api/shop';

let forestData = [];

initializeApp(async (initState) => {
  forestData = initState.forest || [];
  
  // Wait for shop data to load, then render
  if (Object.keys(treeTypes).length === 0) {
    await reloadShopData();
  }
  
  renderForest();
  renderShop();
  updateStats();
});

async function fetchForestData() {
  try {
    const response = await fetch(STATE_API_URL);
    if (!response.ok) throw new Error('Failed to fetch state');
    
    const state = await response.json();
    forestData = state.forest || [];
  } catch (error) {
    console.error(error);
    const forestGrid = document.getElementById('forest-grid');
    if(forestGrid) forestGrid.innerHTML = `<div class="col-span-full text-center text-red-400">Could not load your forest.</div>`;
  }
}

function getTreeGrowthStage(tree) {
  const treeConfig = treeTypes[tree.treeType];
  if (!treeConfig) {
    console.warn(`Tree type ${tree.treeType} not found in treeTypes`);
    return { 
      statusText: 'Unknown Tree', 
      imageSrc: '/img/placeholder.png', 
      statusColor: 'text-gray-500' 
    };
  }

  if (tree.status === 'withered') {
    return {
      statusText: 'Withered',
      imageSrc: treeConfig.witheredImage,
      statusColor: 'text-red-500'
    };
  }

  const matureDate = new Date(tree.matureDate);
  if (tree.status === 'matured' || Date.now() >= matureDate) {
    const matureStage = treeConfig.stages[treeConfig.stages.length - 1];
    return {
      statusText: matureStage.status,
      imageSrc: matureStage.image,
      statusColor: 'text-cyan-400'
    };
  }

  const purchaseDate = new Date(tree.purchaseDate);
  const hoursSincePlanted = (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60);

  for (let i = treeConfig.stages.length - 1; i >= 0; i--) {
    if (hoursSincePlanted >= treeConfig.stages[i].hours) {
      return {
        statusText: treeConfig.stages[i].status,
        imageSrc: treeConfig.stages[i].image,
        statusColor: 'text-green-400'
      };
    }
  }

  const firstStage = treeConfig.stages[0];
  return {
    statusText: firstStage.status,
    imageSrc: firstStage.image,
    statusColor: 'text-green-400'
  };
}

function renderForest() {
  const forestGrid = document.getElementById('forest-grid');
  const emptyState = document.getElementById('empty-state');
  if (!forestGrid || !emptyState) return;

  if (forestData.length === 0) {
    forestGrid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  forestGrid.innerHTML = forestData.map(tree => {
    const stage = getTreeGrowthStage(tree);
    const treeConfig = treeTypes[tree.treeType];

    let timerHtml = '';
    if (tree.status === 'growing' && Date.now() < new Date(tree.matureDate).getTime()) {
      timerHtml = `<div class="tree-timer text-xs text-yellow-400 mt-1" data-mature-date="${tree.matureDate}">Loading...</div>`;
    }

    return `
      <div class="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
        <img src="${stage.imageSrc}" alt="${stage.statusText}" 
             class="w-24 h-24 mx-auto object-cover rounded mb-2"
             onerror="this.style.display='none'">
        <h3 class="font-semibold text-white text-sm">${treeConfig?.name || 'Unknown Tree'}</h3>
        <p class="${stage.statusColor} text-xs">${stage.statusText}</p>
        ${timerHtml}
      </div>
    `;
  }).join('');

  updateTimers();
}

function renderShop() {
  const shopContainer = document.getElementById('shop-container');
  if (!shopContainer) return;
  
  const treeTypesArray = Object.values(treeTypes);
  
  if (treeTypesArray.length === 0) {
    shopContainer.innerHTML = '<div class="text-center text-gray-400">Loading tree shop...</div>';
    return;
  }
  
  shopContainer.innerHTML = treeTypesArray.map(tree => {
    // Create gallery of all stages
    const stageGallery = tree.stages.map((stage, index) => `
      <div class="text-center">
        <img src="${stage.image}" alt="${stage.status}" 
             class="w-12 h-12 object-cover rounded mb-1 border border-gray-600"
             onerror="this.style.display='none'">
        <p class="text-xs text-gray-400">${stage.status}</p>
        <p class="text-xs text-gray-500">${stage.hours}h</p>
      </div>
    `).join('');

    return `
      <div class="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <!-- Tree Header -->
        <div class="flex items-center gap-4 mb-4">
          <img src="${tree.stages[0]?.image}" alt="${tree.name}" 
               class="w-16 h-16 object-cover rounded" 
               onerror="this.style.display='none'">
          <div>
            <h3 class="text-lg font-semibold text-white">${tree.name}</h3>
            <p class="text-sm text-gray-300">${tree.cost.toLocaleString()} Coins</p>
            <p class="text-xs text-gray-400 mt-1">${tree.growthHours}h to mature</p>
          </div>
        </div>

        <!-- Description -->
        <p class="text-sm text-gray-400 mb-4">${tree.description}</p>

        <!-- Growth Stages Gallery -->
        <div class="mb-4">
          <h4 class="text-sm font-semibold text-white mb-3">Growth Stages:</h4>
          <div class="grid grid-cols-${Math.min(tree.stages.length, 4)} gap-2">
            ${stageGallery}
          </div>
        </div>

        <!-- Buy Button -->
        <button onclick="buyTree('${tree.id}')" 
                class="w-full bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded transition-colors font-semibold">
          Buy for ${tree.cost.toLocaleString()} Coins
        </button>
      </div>
    `;
  }).join('');
}

window.buyTree = async function(treeId) {
  const tree = treeTypes[treeId];
  if (!tree) return;
  
  const button = event.target;
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = 'Purchasing...';
  
  try {
    const response = await fetch(SHOP_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'buy', itemId: treeId })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Purchase failed');
    }

    const result = await response.json();
    
    // Update state and forest data from response
    updateState(result.userState);
    
    if (result.forest) {
      forestData = result.forest;
    } else {
      await fetchForestData();
    }
    
    renderForest();
    renderShop();
    updateStats();
    updateTimers();
    
    showModal('Tree Planted!', `
      <div class="text-center">
        <img src="${tree.stages[0]?.image}" alt="${tree.name}" class="w-20 h-20 mx-auto mb-4 rounded">
        <h3 class="text-lg font-semibold mb-2">${tree.name}</h3>
        <p class="text-sm text-gray-300 mb-4">${tree.stages[0]?.status}</p>
        <p class="text-sm text-gray-400">${tree.description}</p>
      </div>
      <p class="text-green-400 mt-4 text-center">${result.message}</p>
    `);
  } catch (error) {
    console.error(error);
    showModal('Purchase Failed', `
      <div class="text-center text-red-400">
        <p>${error.message}</p>
      </div>
    `);
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

function updateStats() {
  const growingCount = document.getElementById('growing-count');
  const maturedCount = document.getElementById('matured-count');
  const witheredCount = document.getElementById('withered-count');

  const now = new Date();
  if (growingCount) growingCount.textContent = forestData.filter(t => t.status === 'growing' && now < new Date(t.matureDate)).length;
  if (maturedCount) maturedCount.textContent = forestData.filter(t => t.status === 'matured' || (t.status === 'growing' && now >= new Date(t.matureDate))).length;
  if (witheredCount) witheredCount.textContent = forestData.filter(t => t.status === 'withered').length;
}

let timerInterval;

function updateTimers() {
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    let needsRender = false;

    document.querySelectorAll('.tree-timer').forEach(timerEl => {
      const matureDate = new Date(timerEl.dataset.matureDate);
      const remaining = matureDate.getTime() - Date.now();
      
      if (remaining > 0) {
        timerEl.textContent = formatRemainingTime(remaining);
      } else {
        needsRender = true;
      }
    });

    if(needsRender) {
      fetchForestData().then(() => {
        renderForest();
        updateStats();
      });
    }
  }, 1000);
}

function formatRemainingTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);

  const dayPart = d > 0 ? `${d}d ` : '';
  return `${dayPart}${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}