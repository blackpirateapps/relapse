import { initializeApp, shopItems, showModal, closeModal, getState, renderPhoenix, getRank, applyBackground, applyNavStyle } from './shared.js';

let state = {};

initializeApp(initState => {
    state = initState;
    const shopContainer = document.getElementById('shop-container');
    if (shopContainer) {
        updateShopUI();
    }
});

function updateShopUI() {
    const shopContainer = document.getElementById('shop-container');
    if (!shopContainer) return;
    
    state = getState(); // Get the latest state
    const cosmeticItems = shopItems.filter(item => item.type === 'cosmetic');
    const themeItems = shopItems.filter(item => item.type === 'theme');

    const createItemsHtml = (items) => {
        return items.map(item => {
            const isOwned = state.upgrades && state.upgrades[item.id];
            const isEquipped = state.equipped_upgrades && state.equipped_upgrades[item.id];
            
            let actionButtons;
            if (isOwned) {
                if (isEquipped) {
                    actionButtons = `<button class="equip-button w-full font-bold py-3 px-4 rounded-lg bg-gray-600 hover:bg-gray-700" data-item-id="${item.id}" data-equip="false">Unequip</button>`;
                } else {
                    actionButtons = `<button class="equip-button w-full font-bold py-3 px-4 rounded-lg bg-green-600 hover:bg-green-700" data-item-id="${item.id}" data-equip="true">Equip</button>`;
                }
            } else {
                actionButtons = `<button class="buy-button w-full font-bold py-3 px-4 rounded-lg bg-purple-600 hover:bg-purple-700" data-item-id="${item.id}">${item.cost.toLocaleString()} Coins</button>`;
            }

            return `
                <div class="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-6 flex flex-col text-center">
                    <div class="w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                        <img src="${item.image}" alt="${item.name}" class="max-w-full max-h-full">
                    </div>
                    <h3 class="font-serif-display text-2xl text-amber-400">${item.name}</h3>
                    <p class="text-gray-400 text-sm flex-grow my-2">${item.description}</p>
                    <div class="flex gap-2 mt-4">
                        <button class="preview-button w-1/2 font-bold py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700" data-item-id="${item.id}">Preview</button>
                        <div class="w-1/2">
                           ${actionButtons}
                        </div>
                    </div>
                </div>`;
        }).join('');
    };

    shopContainer.innerHTML = `
        <h2 class="text-2xl font-semibold text-indigo-300 mb-4">Phoenix Cosmetics</h2>
        <div class="grid-container">${createItemsHtml(cosmeticItems)}</div>
        <h2 class="text-2xl font-semibold text-indigo-300 mb-4 mt-10">App Themes</h2>
        <div class="grid-container">${createItemsHtml(themeItems)}</div>
    `;

    document.querySelectorAll('.buy-button').forEach(b => b.addEventListener('click', handleBuyItem));
    document.querySelectorAll('.preview-button').forEach(b => b.addEventListener('click', handlePreviewItem));
    document.querySelectorAll('.equip-button').forEach(b => b.addEventListener('click', handleEquipItem));
}

function handleBuyItem(e) {
    const itemId = e.target.dataset.itemId;
    const item = shopItems.find(i => i.id === itemId);
    if (state.coins < item.cost) {
        return showModal('Not Enough Coins', '<p>You do not have enough coins for this item.</p>');
    }
    showModal('Confirm Purchase', `
        <p class="text-gray-300 mb-4">Purchase "${item.name}" for ${item.cost.toLocaleString()} coins? The item will be equipped automatically.</p>
        <div class="flex justify-end gap-4 mt-6">
            <button id="cancel-purchase" class="bg-gray-600 hover:bg-gray-700 py-2 px-4 rounded-lg">Cancel</button>
            <button id="confirm-purchase" class="bg-purple-600 hover:bg-purple-700 py-2 px-4 rounded-lg">Confirm</button>
        </div>`, { showClose: false });

    document.getElementById('cancel-purchase').onclick = closeModal;
    document.getElementById('confirm-purchase').onclick = async () => {
        try {
            const response = await fetch('/api/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId }),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message);
            }
            state = await response.json();
            if (typeof state.upgrades === 'string') state.upgrades = JSON.parse(state.upgrades);
            if (typeof state.equipped_upgrades === 'string') state.equipped_upgrades = JSON.parse(state.equipped_upgrades);
            
            updateShopUI();
            closeModal();
        } catch (error) {
            showModal('Purchase Failed', `<p>${error.message}</p>`);
        }
    };
}

async function handleEquipItem(e) {
    const button = e.target;
    const itemId = button.dataset.itemId;
    const equip = button.dataset.equip === 'true'; // Convert string to boolean

    button.disabled = true;
    button.textContent = equip ? 'Equipping...' : 'Unequipping...';

    try {
        const response = await fetch('/api/equip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId, equip }),
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message);
        }
        state = await response.json();
        if (typeof state.upgrades === 'string') state.upgrades = JSON.parse(state.upgrades);
        if (typeof state.equipped_upgrades === 'string') state.equipped_upgrades = JSON.parse(state.equipped_upgrades);
        
        updateShopUI(); // Redraw the shop to show the new button state

    } catch (error) {
        showModal('Error', `<p>Could not update item: ${error.message}</p>`);
        button.disabled = false; // Re-enable button on error
    }
}


function handlePreviewItem(e) {
    const itemId = e.target.dataset.itemId;
    const item = shopItems.find(i => i.id === itemId);
    if (!item) return;

    let tempUpgrades = { ...(state.equipped_upgrades || {}), [itemId]: true };
    
    // For themes, ensure only one is previewed at a time
    if (item.type === 'theme') {
        shopItems.filter(i => i.type === 'theme' && i.id !== itemId).forEach(otherTheme => {
            delete tempUpgrades[otherTheme.id];
        });
    }

    const previewContainer = document.getElementById('preview-popup');
    const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
    const currentRank = getRank(totalHours);
    
    const phoenixHTML = renderPhoenix(currentRank.level, tempUpgrades);
    
    // Create a temporary div to apply background styles for preview
    const backgroundPreviewDiv = document.createElement('div');
    backgroundPreviewDiv.id = 'background-container-preview';
    backgroundPreviewDiv.className = 'absolute inset-0 -z-10';
    
    previewContainer.innerHTML = `
        <div class="relative w-full h-full flex flex-col">
            ${backgroundPreviewDiv.outerHTML}
            <header id="app-header-preview" class="flex-shrink-0 flex justify-between items-center bg-gray-900/50 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
                 <h2 class="font-serif-display text-2xl text-amber-400">Preview Mode</h2>
                 <button id="close-preview-btn" class="font-bold py-2 px-4 rounded-lg bg-red-600 hover:bg-red-700">Close</button>
            </header>
            <main class="flex-grow flex flex-col items-center justify-center p-4">
                <div class="phoenix-container">${phoenixHTML}</div>
                <h2 class="font-serif-display text-3xl text-center text-amber-400 mt-4">${currentRank.name}</h2>
            </main>
        </div>
    `;

    previewContainer.classList.remove('hidden');
    
    // Apply styles to the preview elements
    const headerPreview = document.getElementById('app-header-preview');
    const bgPreview = document.getElementById('background-container-preview');
    
    applyNavStyle(tempUpgrades, headerPreview);
    applyBackground(tempUpgrades, bgPreview);

    document.getElementById('close-preview-btn').onclick = () => {
        previewContainer.classList.add('hidden');
    };
}

