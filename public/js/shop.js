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
          actionButtons = `<button onclick="handleEquipItem(event)" data-item-id="${item.id}" data-equip="false" class="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded transition-colors">Unequip</button>`;
        } else {
          actionButtons = `<button onclick="handleEquipItem(event)" data-item-id="${item.id}" data-equip="true" class="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition-colors">Equip</button>`;
        }
      } else {
        // If not owned, show the buy button
        const canAfford = state.coins >= item.cost;
        actionButtons = `<button onclick="handleBuyItem(event)" data-item-id="${item.id}" ${!canAfford ? 'disabled' : ''} class="w-full ${canAfford ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-600 cursor-not-allowed'} text-white px-4 py-2 rounded transition-colors">Buy for ${item.cost.toLocaleString()} Coins</button>`;
      }

      return `
        <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <img src="${item.previewImage || '/img/placeholder.png'}" alt="${item.name}" class="w-full h-32 object-cover rounded mb-3" onerror="this.style.display='none'">
          <h3 class="text-lg font-semibold text-white mb-2">${item.name}</h3>
          <p class="text-sm text-gray-400 mb-4">${item.description}</p>
          ${actionButtons}
        </div>
      `;
    }).join('');
  };

  const createThemeItemsHtml = (items) => {
    if (items.length === 0) return '<p class="text-gray-400">No themes available at this time.</p>';

    return items.map(item => {
      const isOwned = state.upgrades && state.upgrades[item.id];
      const isEquipped = state.equipped_upgrades && state.equipped_upgrades[item.id];
      let actionButtons;

      if (isOwned) {
        if (isEquipped) {
          actionButtons = `<button onclick="handleEquipItem(event)" data-item-id="${item.id}" data-equip="false" class="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded transition-colors">Unequip</button>`;
        } else {
          actionButtons = `<button onclick="handleEquipItem(event)" data-item-id="${item.id}" data-equip="true" class="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition-colors">Equip</button>`;
        }
      } else {
        const canAfford = state.coins >= item.cost;
        actionButtons = `<button onclick="handleBuyItem(event)" data-item-id="${item.id}" ${!canAfford ? 'disabled' : ''} class="w-full ${canAfford ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-600 cursor-not-allowed'} text-white px-4 py-2 rounded transition-colors">Buy for ${item.cost.toLocaleString()} Coins</button>`;
      }

      return `
        <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 class="text-lg font-semibold text-white mb-2">${item.name}</h3>
          <p class="text-sm text-gray-400 mb-4">${item.description}</p>
          ${actionButtons}
        </div>
      `;
    }).join('');
  };

  shopContainer.innerHTML = `
    <!-- Phoenix Skins Section -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-white mb-4">Phoenix Skins</h2>
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        ${createSkinItemsHtml(skinItems)}
      </div>
    </div>

    <!-- Themes Section -->
    <div>
      <h2 class="text-2xl font-bold text-white mb-4">Themes</h2>
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        ${createThemeItemsHtml(themeItems)}
      </div>
    </div>
  `;
}

// Handles buying items
window.handleBuyItem = async function(e) {
  const button = e.target;
  const itemId = button.dataset.itemId;
  const item = shopItems.find(i => i.id === itemId);

  if (!item) return;

  button.disabled = true;
  button.textContent = 'Purchasing...';

  try {
    const response = await fetch('/api/shop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'buy', itemId })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Purchase failed');
    }

    const result = await response.json();
    
    // Update state with new data
    Object.assign(state, result.userState);
    if (typeof state.upgrades === 'string') state.upgrades = JSON.parse(state.upgrades || '{}');
    if (typeof state.equipped_upgrades === 'string') state.equipped_upgrades = JSON.parse(state.equipped_upgrades || '{}');

    updateShopUI();
    updateCoinCount();

    showModal('Purchase Successful!', `
      <div class="text-center">
        <h3 class="text-lg font-semibold mb-2">${item.name}</h3>
        <p class="text-sm text-gray-300 mb-4">${item.description}</p>
        <p class="text-green-400">${result.message}</p>
      </div>
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
    button.textContent = `Buy for ${item.cost.toLocaleString()} Coins`;
  }
};

// Handles equipping and unequipping items
window.handleEquipItem = async function(e) {
  const button = e.target;
  const itemId = button.dataset.itemId;
  const equip = button.dataset.equip === 'true';

  button.disabled = true;
  button.textContent = equip ? 'Equipping...' : 'Unequipping...';

  try {
    const response = await fetch('/api/shop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'equip', itemId, equip })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update equipment');
    }

    const result = await response.json();
    
    // Update state with new data
    Object.assign(state, result.userState);
    if (typeof state.equipped_upgrades === 'string') state.equipped_upgrades = JSON.parse(state.equipped_upgrades || '{}');

    updateShopUI();

  } catch (error) {
    console.error(error);
    showModal('Error', `
      <div class="text-center text-red-400">
        <p>Could not update item: ${error.message}</p>
      </div>
    `);
  } finally {
    button.disabled = false;
    button.textContent = equip ? 'Equip' : 'Unequip';
  }
};