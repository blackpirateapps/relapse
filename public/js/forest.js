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
        if(forestGrid) forestGrid.innerHTML = `<p class="text-center text-red-400 col-span-full">Could not load your forest.</p>`;
    }
}

function getTreeGrowthStage(tree) {
    const treeConfig = treeTypes[tree.treeType] || treeTypes.tree_of_tranquility;
    if (tree.status === 'withered') {
        return { statusText: 'Withered', imageSrc: treeConfig.witheredImage, statusColor: 'text-red-500' };
    }
    const matureDate = new Date(tree.matureDate);
    if (tree.status === 'matured' || Date.now() >= matureDate) {
        const matureStage = treeConfig.stages[treeConfig.stages.length - 1];
        return { statusText: matureStage.status, imageSrc: matureStage.image, statusColor: 'text-cyan-400' };
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
    return { statusText: firstStage.status, imageSrc: firstStage.image, statusColor: 'text-green-400' };
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
        let timerHtml = '';
        if (tree.status === 'growing' && Date.now() < new Date(tree.matureDate).getTime()) {
            timerHtml = `<div class="tree-timer text-xs text-cyan-300 mt-1" data-mature-date="${tree.matureDate}"></div>`;
        }
        return `
            <div class="tree-container">
                <img src="${stage.imageSrc}" alt="${stage.statusText} tree" class="tree-img">
                <p class="font-bold ${stage.statusColor} mt-2">${stage.statusText}</p>
                ${timerHtml}
            </div>`;
    }).join('');
    updateTimers();
}

function renderShop() {
    const shopContainer = document.getElementById('shop-container');
    if (!shopContainer) return;
    const sapling = treeTypes.tree_of_tranquility;

    // NEW: HTML structure for the gallery
    shopContainer.innerHTML = `
         <div class="card p-6 flex flex-col text-center">
            <h3 class="font-serif-display text-xl text-white">${sapling.name}</h3>
            
            <div class="relative w-full h-32 my-4 mx-auto">
                <img id="gallery-image" src="${sapling.stages[0].image}" alt="Sapling" class="w-full h-full object-contain">
                <button id="prev-btn" class="gallery-btn prev">&lt;</button>
                <button id="next-btn" class="gallery-btn next">&gt;</button>
            </div>
            <p id="gallery-status" class="text-gray-300 font-bold text-sm mb-2 h-5">${sapling.stages[0].status}</p>

            <p class="text-gray-400 text-sm flex-grow">${sapling.description}</p>
            <div class="mt-4">
                 <button id="buy-sapling-btn" class="w-full font-bold py-3 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors">
                    Buy for ${sapling.cost.toLocaleString()} Coins
                </button>
            </div>
        </div>`;
    document.getElementById('buy-sapling-btn').addEventListener('click', () => handleBuySapling(sapling.id));
    // NEW: Set up the gallery functionality
    setupShopGallery(sapling);
}

// NEW: Function to manage the interactive gallery
function setupShopGallery(saplingConfig) {
    let currentStageIndex = 0;
    const galleryImage = document.getElementById('gallery-image');
    const galleryStatus = document.getElementById('gallery-status');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    function updateGallery() {
        const stage = saplingConfig.stages[currentStageIndex];
        galleryImage.src = stage.image;
        galleryStatus.textContent = `${stage.status} (at ${stage.hours} hours)`;
    }

    prevBtn.addEventListener('click', () => {
        currentStageIndex = (currentStageIndex - 1 + saplingConfig.stages.length) % saplingConfig.stages.length;
        updateGallery();
    });

    nextBtn.addEventListener('click', () => {
        currentStageIndex = (currentStageIndex + 1) % saplingConfig.stages.length;
        updateGallery();
    });
}


async function handleBuySapling(treeId) {
    const button = document.getElementById('buy-sapling-btn');
    button.disabled = true;
    button.textContent = 'Purchasing...';

    try {
        const response = await fetch(BUY_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId: treeId }),
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.message || 'Failed to purchase sapling.');
        }
        
        await fetchForestData(); 
        renderForest();
        updateStats();
        updateCoinCount();

        showModal('Success!', '<p>You have planted a new sapling in your forest. Nurture it well!</p>');

    } catch (error) {
        console.error(error);
        showModal('Purchase Failed', `<p>${error.message}</p>`);
    } finally {
        const sapling = treeTypes.tree_of_tranquility;
        button.disabled = false;
        button.textContent = `Buy for ${sapling.cost.toLocaleString()} Coins`;
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

