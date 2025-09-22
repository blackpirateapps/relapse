import { initializeApp, shopItems, showModal, closeModal, getState } from './shared.js';

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
    
    state = getState(); 
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
                <div class="card p-6 flex flex-col text-center">
                    <h3 class="font-serif-display text-xl text-white">${item.name}</h3>
                    <p class="text-gray-400 text-sm flex-grow my-2">${item.description}</p>
                    <div class="mt-4">${actionButtons}</div>
                </div>`;
        }).join('');
    };

    shopContainer.innerHTML = `
        <h2 class="text-2xl font-bold text-white mb-4">Phoenix Cosmetics</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">${createItemsHtml(cosmeticItems)}</div>
        <h2 class="text-2xl font-bold text-white mb-4 mt-10">App Themes</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">${createItemsHtml(themeItems)}</div>
    `;

    document.querySelectorAll('.buy-button').forEach(b => b.addEventListener('click', handleBuyItem));
    document.querySelectorAll('.equip-button').forEach(b => b.addEventListener('click', handleEquipItem));
}

function handleBuyItem(e) {
    const itemId = e.target.dataset.itemId;
    const item = shopItems.find(i => i.id === itemId);
    if (state.coins < item.cost) {
        return showModal('Not Enough Coins', '<p>You do not have enough coins for this item.</p>');
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
    const equip = button.dataset.equip === 'true';

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
        
        updateShopUI();

    } catch (error) {
        showModal('Error', `<p>Could not update item: ${error.message}</p>`);
        button.disabled = false;
    }
}
