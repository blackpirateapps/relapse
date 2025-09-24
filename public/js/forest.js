import { initializeApp, showModal, closeModal, updateCoinCount } from './shared.js';

// INTEGRATED: API endpoints now point to the local project
const STATE_API_URL = '/api/state';
const BUY_API_URL = '/api/buy';

const treeTypes = {
  tree_of_tranquility: {
    id: 'tree_of_tranquility',
    name: 'Tree of Tranquility',
    cost: 200,
    description: 'A symbol of peace. Grows to maturity in 1 day, changing every 6 hours, if you do not relapse.',
    growthHours: 24,
    stages: [
      { status: 'Sapling', hours: 0, image: '/img/trees/tree_of_tranquility/stage_1.png' },
      { status: 'Sprout', hours: 6, image: '/img/trees/tree_of_tranquility/stage_2.png' },
      { status: 'Young Tree', hours: 12, image: '/img/trees/tree_of_tranquility/stage_3.png' },
      { status: 'Flourishing', hours: 18, image: '/img/trees/tree_of_tranquility/stage_4.png' },
      { status: 'Mature', hours: 24, image: '/img/trees/tree_of_tranquility/stage_5.png' },
    ],
    witheredImage: '/img/trees/tree_of_tranquility/withered.png'
  },
  ancient_oak: {
    id: 'ancient_oak',
    name: 'Ancient Oak',
    cost: 500,
    description: 'A majestic oak that stands the test of time. Takes 2 days to reach full maturity, evolving through 7 distinct stages.',
    growthHours: 48,
    stages: [
      { status: 'Acorn', hours: 0, image: '/img/trees/ancient_oak/stage_1.png' },
      { status: 'Seedling', hours: 8, image: '/img/trees/ancient_oak/stage_2.png' },
      { status: 'Sapling', hours: 16, image: '/img/trees/ancient_oak/stage_3.png' },
      { status: 'Young Oak', hours: 24, image: '/img/trees/ancient_oak/stage_4.png' },
      { status: 'Growing Oak', hours: 32, image: '/img/trees/ancient_oak/stage_5.png' },
      { status: 'Mighty Oak', hours: 40, image: '/img/trees/ancient_oak/stage_6.png' },
      { status: 'Ancient Oak', hours: 48, image: '/img/trees/ancient_oak/stage_7.png' },
    ],
    witheredImage: '/img/trees/ancient_oak/withered.png'
  }
};

let forestData = [];

initializeApp(async (initState) => {
  forestData = initState.forest || [];
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
  const treeConfig = treeTypes[tree.treeType] || treeTypes.tree_of_tranquility;

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
    const treeConfig = treeTypes[tree.treeType] || treeTypes.tree_of_tranquility;

    let timerHtml = '';
    if (tree.status === 'growing' && Date.now() < new Date(tree.matureDate).getTime()) {
      timerHtml = `<div class="tree-timer text-xs text-yellow-400 mt-1" data-mature-date="${tree.matureDate}">Loading...</div>`;
    }

    return `
      <div class="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
        <img src="${stage.imageSrc}" alt="${stage.statusText}" 
             class="w-24 h-24 mx-auto object-cover rounded mb-2"
             onerror="this.style.display='none'">
        <h3 class="font-semibold text-white text-sm">${treeConfig.name}</h3>
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
  
  shopContainer.innerHTML = treeTypesArray.map(tree => `
    <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <div class="flex items-center gap-4 mb-3">
        <img src="${tree.stages[0].image}" alt="${tree.name}" 
             class="w-16 h-16 object-cover rounded" 
             onerror="this.style.display='none'">
        <div>
          <h3 class="text-lg font-semibold text-white">${tree.name}</h3>
          <p class="text-sm text-gray-300">${tree.cost.toLocaleString()} Coins</p>
        </div>
      </div>
      <p class="text-sm text-gray-400 mb-4">${tree.description}</p>
      <button onclick="buyTree('${tree.id}')" 
              class="w-full bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded transition-colors">
        Buy for ${tree.cost.toLocaleString()} Coins
      </button>
    </div>
  `).join('');
}

window.buyTree = async function(treeId) {
  const tree = treeTypes[treeId];
  if (!tree) return;
  
  const button = event.target;
  button.disabled = true;
  button.textContent = 'Purchasing...';
  
  try {
    const response = await fetch(BUY_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId: treeId })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Purchase failed');
    }
    
    await fetchForestData();
    renderForest();
    renderShop();
    updateStats();
    updateTimers();
    updateCoinCount();
    
    showModal('Tree Planted!', `
      <div class="text-center">
        <img src="${tree.stages[0].image}" alt="${tree.name}" class="w-20 h-20 mx-auto mb-4 rounded">
        <h3 class="text-lg font-semibold mb-2">${tree.name}</h3>
        <p class="text-sm text-gray-300 mb-4">${tree.stages[0].status}</p>
        <p class="text-sm text-gray-400">${tree.description}</p>
      </div>
      <p class="text-green-400 mt-4 text-center">You have planted a new sapling in your forest. Nurture it well!</p>
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
    button.textContent = `Buy for ${tree.cost.toLocaleString()} Coins`;
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