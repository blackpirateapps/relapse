import { initializeApp, showModal, closeModal, updateCoinCount } from './shared.js';

// The API now points to your new, separate Vercel deployment.
const FOREST_API_URL = 'https://api-relapse.vercel.app/api/forest';

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

// Fetches tree data from your new external API
async function fetchForestData() {
    try {
        const loadingIndicator = document.getElementById('forest-loading');
        if(loadingIndicator) loadingIndicator.classList.remove('hidden');

        // We must include credentials to send the auth cookie to the external API
        const response = await fetch(FOREST_API_URL, { credentials: 'include' });

        if (!response.ok) {
            throw new Error(`Failed to fetch forest data: ${response.statusText}`);
        }
        forestData = await response.json();
        if(loadingIndicator) loadingIndicator.classList.add('hidden');
    } catch (error) {
        console.error(error);
        const forestContainer = document.getElementById('forest-container');
        if(forestContainer) forestContainer.innerHTML = `<p class="text-center text-red-400">Could not load your forest. Please try again later.</p>`;
    }
}

// Renders the trees onto the page
function renderForest() {
    const forestContainer = document.getElementById('forest-container');
    if (!forestContainer) return;

    if (forestData.length === 0) {
        forestContainer.innerHTML = `<p class="text-center text-gray-400 col-span-full">Your forest is empty. Plant a sapling to begin.</p>`;
        return;
    }

    forestContainer.innerHTML = forestData.map(tree => {
        const now = new Date();
        const matureDate = new Date(tree.matureDate);
        let imageSrc = '/img/trees/withered.png'; // Changed to .png
        let statusText = 'Withered';
        let statusColor = 'text-red-400';
        let timerHtml = '';

        if (tree.status === 'growing') {
            if (now < matureDate) {
                imageSrc = '/img/trees/growing.png'; // Changed to .png
                statusText = 'Growing';
                statusColor = 'text-yellow-400';
                timerHtml = `<div class="tree-timer text-xs text-cyan-300" data-mature-date="${tree.matureDate}"></div>`;
            } else {
                 // If the server hasn't updated it yet, we can assume it's mature
                imageSrc = '/img/trees/matured.png'; // Changed to .png
                statusText = 'Matured';
                statusColor = 'text-green-400';
            }
        } else if (tree.status === 'matured') {
            imageSrc = '/img/trees/matured.png'; // Changed to .png
            statusText = 'Matured';
            statusColor = 'text-green-400';
        }

        return `
            <div class="card p-4 flex flex-col items-center text-center">
                <div class="w-24 h-24 mb-2">
                    <img src="${imageSrc}" alt="${statusText} tree">
                </div>
                <p class="font-bold ${statusColor}">${statusText}</p>
                ${timerHtml}
            </div>
        `;
    }).join('');
    updateTimers();
}

// Renders the shop section
function renderShop() {
    const shopContainer = document.getElementById('shop-container');
    if (!shopContainer) return;

    const sapling = { id: 'sapling_of_patience', name: 'Sapling of Patience', cost: 200, description: 'Grows into a mature tree in 3 days if you do not relapse.' };

    shopContainer.innerHTML = `
         <div class="card p-6 flex flex-col text-center">
            <h3 class="font-serif-display text-xl text-white">${sapling.name}</h3>
            <div class="w-24 h-24 my-4 mx-auto">
                <img src="/img/trees/growing.png" alt="Sapling">
            </div>
            <p class="text-gray-400 text-sm flex-grow">${sapling.description}</p>
            <div class="mt-4">
                 <button id="buy-sapling-btn" class="w-full font-bold py-3 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors">
                    Buy for ${sapling.cost.toLocaleString()} Coins
                </button>
            </div>
        </div>
    `;
    document.getElementById('buy-sapling-btn').addEventListener('click', handleBuySapling);
}

// Handles the purchase of a new sapling by calling the external API
async function handleBuySapling() {
    const button = document.getElementById('buy-sapling-btn');
    button.disabled = true;
    button.textContent = 'Purchasing...';

    try {
        const response = await fetch(FOREST_API_URL, {
            method: 'POST',
            credentials: 'include' // Important for sending the cookie
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Failed to purchase sapling.');
        }
        
        forestData = result; // Update local data with response from API
        renderForest();
        updateStats();
        updateCoinCount(); // This function from shared.js should re-fetch state to get the new coin balance
        showModal('Success!', '<p>You have planted a new sapling in your forest. Nurture it well!</p>');

    } catch (error) {
        console.error(error);
        showModal('Purchase Failed', `<p>${error.message}</p>`);
    } finally {
        button.disabled = false;
        button.textContent = 'Buy for 200 Coins';
    }
}

// Updates the statistics panel
function updateStats() {
    const growingCount = document.getElementById('growing-trees');
    const maturedCount = document.getElementById('matured-trees');
    const witheredCount = document.getElementById('withered-trees');

    if (growingCount) growingCount.textContent = forestData.filter(t => t.status === 'growing' && new Date() < new Date(t.matureDate)).length;
    if (maturedCount) maturedCount.textContent = forestData.filter(t => t.status === 'matured' || (t.status === 'growing' && new Date() >= new Date(t.matureDate))).length;
    if (witheredCount) witheredCount.textContent = forestData.filter(t => t.status === 'withered').length;
}

// --- Timer Logic ---
let timerInterval;
function updateTimers() {
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        document.querySelectorAll('.tree-timer').forEach(timerEl => {
            const matureDate = new Date(timerEl.dataset.matureDate);
            const remaining = matureDate.getTime() - Date.now();
            if (remaining > 0) {
                timerEl.textContent = formatRemainingTime(remaining);
            } else {
                timerEl.textContent = 'Matured!';
                timerEl.closest('.card').querySelector('img').src = '/img/trees/matured.png'; // Changed to .png
                timerEl.closest('.card').querySelector('.font-bold').textContent = 'Matured';
                timerEl.closest('.card').querySelector('.font-bold').className = 'font-bold text-green-400';
            }
        });
    }, 1000);
}

function formatRemainingTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

