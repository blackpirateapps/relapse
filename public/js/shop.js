import { initializeApp, shopItems, showModal, closeModal, getState, updateCoinCount } from './shared.js';

let state = {};

// This function is called once when the page loads
initializeApp(initState => {
    state = initState;
    const shopContainer = document.getElementById('shop-container');
    if (shopContainer) {
        updateShopUI();
    }
});

// This function re-renders the shop items. It's called after any state change (buy/equip).
function updateShopUI() {
    const shopContainer = document.getElementById('shop-container');
    if (!shopContainer) return;
    
    // Always get the latest state before rendering
    state = getState(); 
    
    // Separate items by type for different sections in the shop
    const skinItems = shopItems.filter(item => item.type === 'phoenix_skin');
    const themeItems = shopItems.filter(item => item.type === 'theme');

    const createSkinItemsHtml = (items) => {
        if (items.length === 0) return '<p class="text-gray-400">No skins available at this time.</p>';
        return items.map(item => {
            const isOwned = state.upgrades && state.upgrades[item.id];
            const isEquipped = state.equipped_upgrades && state.equipped_upgrades[item.id];
            
            let actionButtons;
            if (isOwned) {
                 // If the user owns the item, show Equip/Unequip buttons
                if (isEquipped) {
                    actionButtons = `<button class="equip-button w-full font-bold py-3 px-4 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors" data-item-id="${item.id}" data-equip="false">Unequip</button>`;
                } else {
                    actionButtons = `<button class="equip-button w-full font-bold py-3 px-4 rounded-lg bg-green-600 hover:bg-green-700 transition-colors" data-item-id="${item.id}" data-equip="true">Equip</button>`;
                }
            } else {
                // If not owned, show the buy button
                const canAfford = state.coins >= item.cost;
                actionButtons = `<button class="buy-button w-full font-bold py-3 px-4 rounded-lg ${canAfford ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-800 cursor-not-allowed'} transition-colors" data-item-id="${item.id}" ${!canAfford ? 'disabled' : ''}>${item.cost.toLocaleString()} Coins</button>`;
            }

            return `
                <div class="card p-6 flex flex-col text-center">
                    <div class="h-40 mb-4 flex items-center justify-center">
                        <img src="${item.previewImage || '/img/default/celestial-phoenix.webp'}" alt="${item.name}" class="max-h-full max-w-full object-contain">
                    </div>
                    <h3 class="font-serif-display text-xl text-white">${item.name}</h3>
                    <p class="text-gray-400 text-sm flex-grow my-2">${item.description}</p>
                    <div class="mt-4">${actionButtons}</div>
                </div>`;
        }).join('');
    };
    
    const createThemeItemsHtml = (items) => {
        // This is the same logic as before for non-skin items
         return items.map(item => {
            const isOwned = state.upgrades && state.upgrades[item.id];
            // Themes don't have an equip state in this design, but you could add one.
            return `
                <div class="card p-6 flex flex-col text-center">
                    <h3 class="font-serif-display text-xl text-white">${item.name}</h3>
                    <p class="text-gray-400 text-sm flex-grow my-2">${item.description}</p>
                    <div class="mt-4">
                        ${isOwned ? `<div class="w-full font-bold py-3 px-4 rounded-lg bg-green-800 text-green-300">Owned</div>` : `<button class="buy-button w-full font-bold py-3 px-4 rounded-lg bg-purple-600 hover:bg-purple-700" data-item-id="${item.id}">${item.cost.toLocaleString()} Coins</button>`}
                    </div>
                </div>`;
        }).join('');
    }

    // Set the final HTML for the shop
    shopContainer.innerHTML = `
        <h2 class="text-2xl font-bold text-white mb-4">Phoenix Skins</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">${createSkinItemsHtml(skinItems)}</div>
        <h2 class="text-2xl font-bold text-white mb-4 mt-10">App Themes</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">${createThemeItemsHtml(themeItems)}</div>
    `;

    // Re-attach event listeners after re-rendering the HTML
    document.querySelectorAll('.buy-button').forEach(b => b.addEventListener('click', handleBuyItem));
    document.querySelectorAll('.equip-button').forEach(b => b.addEventListener('click', handleEquipItem));
}

// Handles the logic for the purchase confirmation modal
function handleBuyItem(e) {
    const itemId = e.target.dataset.itemId;
    const item = shopItems.find(i => i.id === itemId);
    
    if (state.coins < item.cost) {
        return showModal('Not Enough Coins', '<p>You do not have enough coins for this item. Keep your streak going!</p>');
    }

    showModal('Confirm Purchase', `
        <p>Purchase "${item.name}" for ${item.cost.toLocaleString()} coins? The item will be equipped automatically.</p>
        <div class="flex justify-end gap-4 mt-6">
            <button id="cancel-purchase" class="bg-gray-600 hover:bg-gray-700 font-bold py-2 px-4 rounded-lg">Cancel</button>
            <button id="confirm-purchase" class="bg-purple-600 hover:bg-purple-700 font-bold py-2 px-4 rounded-lg">Confirm</button>
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
                throw new Error(err.message || 'Purchase failed on the server.');
            }
            // The server responds with the new state
            const newState = await response.json();
            
            // The API response for upgrades/equipped_upgrades is a JSON string, so parse it.
            if (typeof newState.upgrades === 'string') newState.upgrades = JSON.parse(newState.upgrades);
            if (typeof newState.equipped_upgrades === 'string') newState.equipped_upgrades = JSON.parse(newState.equipped_upgrades);
            
            // Update local state and UI
            state = { ...state, ...newState };
            updateCoinCount();
            updateShopUI();
            closeModal();
        } catch (error) {
            showModal('Purchase Failed', `<p>${error.message}</p>`);
        }
    };
}

// Handles equipping and unequipping items
async function handleEquipItem(e) {
    const button = e.target;
    const itemId = button.dataset.itemId;
    const equip = button.dataset.equip === 'true'; // Convert string 'true'/'false' to boolean

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
            throw new Error(err.message || 'Failed to update equipment.');
        }

        const newState = await response.json();
        if (typeof newState.equipped_upgrades === 'string') newState.equipped_upgrades = JSON.parse(newState.equipped_upgrades);
        
        // Update the global state's equipped items
        state.equipped_upgrades = newState.equipped_upgrades;
        updateShopUI(); // Re-render the shop to reflect the change

    } catch (error) {
        showModal('Error', `<p>Could not update item: ${error.message}</p>`);
        // Re-enable the button if there was an error
        button.disabled = false;
        button.textContent = equip ? 'Equip' : 'Unequip';
    }
}
