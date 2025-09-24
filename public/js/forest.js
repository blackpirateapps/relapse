import { initializeApp, showModal, closeModal, updateCoinCount } from './shared.js';

// The API points to your new, separate Vercel deployment.
const FOREST_API_URL = 'https://api-relapse.vercel.app/api/forest';

// --- Tree Configuration ---
// This structure makes it easy to add more trees in the future.
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
// --- End Configuration ---


let state = {};
let forestData = [];

// This function is called when the page loads
initializeApp(async (initState) => {
    state = initState;
    await fetchForestData();
    renderForest();
    renderShop();
    updateStats();
});

// Fetches tree data from your public external API
async function fetchForestData() {
    try {
        const loadingIndicator = document.getElementById('forest-loading'); // Assuming you might add this ID
        if(loadingIndicator) loadingIndicator.classList.remove('hidden');

        // No special headers are needed for a public API
        const response = await fetch(FOREST_API_URL);

        if (!response.ok) {
            throw new Error(`Failed to fetch forest data: ${response.statusText}`);
        }
        forestData = await response.json();
        if(loadingIndicator) loadingIndicator.classList.add('hidden');
    } catch (error) {
        console.error(error);
        const forestGrid = document.getElementById('forest-grid');
        if(forestGrid) forestGrid.innerHTML = `<p class="text-center text-red-400 col-span-full">Could not load your forest. Please try again later.</p>`;
    }
}


// Determines the current visual stage of a growing tree
function getTreeGrowthStage(tree) {
    const treeConfig = treeTypes[tree.treeType] || treeTypes.tree_of_tranquility; // Default to tranquility tree
    
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

    // Find the current stage by checking hours in reverse
    for (let i = treeConfig.stages.length - 1; i >= 0; i--) {
        if (hoursSincePlanted >= treeConfig.stages[i].hours) {
            return { 
                statusText: treeConfig.stages[i].status, 
                imageSrc: treeConfig.stages[i].image, 
                statusColor: 'text-green-400' 
            };
        }
    }
    
    // Fallback to the first stage
    const firstStage = treeConfig.stages[0];
    return { statusText: firstStage.status, imageSrc: firstStage.image, statusColor: 'text-green-400' };
}


// Renders the trees onto the page
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
            </div>
        `;
    }).join('');
    updateTimers(); // Call this once after rendering the forest
}

// Renders the shop section
function renderShop() {
    const shopContainer = document.getElementById('shop-container');
    if (!shopContainer) return;

    const sapling = treeTypes.tree_of_tranquility;

    shopContainer.innerHTML = `
         <div class="card p-6 flex flex-col text-center">
            <h3 class="font-serif-display text-xl text-white">${sapling.name}</h3>
            <div class="w-24 h-24 my-4 mx-auto">
                <img src="${sapling.stages[0].image}" alt="Sapling">
            </div>
            <p class="text-gray-400 text-sm flex-grow">${sapling.description}</p>
            <div class="mt-4">
                 <button id="buy-sapling-btn" class="w-full font-bold py-3 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors">
                    Buy for ${sapling.cost.toLocaleString()} Coins
                </button>
            </div>
        </div>
    `;
    document.getElementById('buy-sapling-btn').addEventListener('click', () => handleBuySapling(sapling.id));
}

// Handles the purchase of a new sapling by calling the public external API
async function handleBuySapling(treeId) {
    const button = document.getElementById('buy-sapling-btn');
    button.disabled = true;
    button.textContent = 'Purchasing...';

    try {
        const response = await fetch(FOREST_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ treeId: treeId, growthHours: treeTypes[treeId].growthHours }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to purchase sapling.');
        }
        
        forestData = result; 
        renderForest();
        updateStats();

        // Manually update the coin count on the frontend for a responsive feel.
        const coinCountDisplay = document.getElementById('coin-count');
        if (coinCountDisplay) {
            const currentCoins = parseInt(coinCountDisplay.textContent.replace(/,/g, '')) || 0;
            const newCoins = currentCoins - treeTypes[treeId].cost;
            coinCountDisplay.textContent = newCoins.toLocaleString();
        }

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

// Updates the statistics panel
function updateStats() {
    const growingCount = document.getElementById('growing-count');
    const maturedCount = document.getElementById('matured-count');
    const witheredCount = document.getElementById('withered-count');

    const now = new Date();
    if (growingCount) growingCount.textContent = forestData.filter(t => t.status === 'growing' && now < new Date(t.matureDate)).length;
    if (maturedCount) maturedCount.textContent = forestData.filter(t => t.status === 'matured' || (t.status === 'growing' && now >= new Date(t.matureDate))).length;
    if (witheredCount) witheredCount.textContent = forestData.filter(t => t.status === 'withered').length;
}

// --- Timer Logic ---
let timerInterval;
function updateTimers() {
    if (timerInterval) clearInterval(timerInterval);

    // This interval now ONLY updates the timer text, it does not re-render the whole forest.
    timerInterval = setInterval(() => {
        let needsRender = false;
        document.querySelectorAll('.tree-timer').forEach(timerEl => {
            const matureDate = new Date(timerEl.dataset.matureDate);
            const remaining = matureDate.getTime() - Date.now();
            if (remaining > 0) {
                timerEl.textContent = formatRemainingTime(remaining);
            } else {
                // If a timer runs out, set a flag to re-render the forest once.
                needsRender = true;
            }
        });

        if(needsRender) {
            renderForest(); // Re-render the forest to show the newly matured tree
            updateStats();
        }
    }, 1000);
}

function formatRemainingTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    // Only show days if it's more than 0
    const dayPart = d > 0 ? `${d}d ` : '';
    return `${dayPart}${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

