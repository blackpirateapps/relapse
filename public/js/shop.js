import { initializeApp, shopItems, showModal, closeModal, getState, updateState } from './shared.js';

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
  const cosmeticItems = shopItems.filter(item => item.type === 'cosmetic');

  const createItemsHtml = (items, showEquipButton = true) => {
    if (items.length === 0) return '<p class="text-gray-400">No items available at this time.</p>';

    return items.map(item => {
      const isOwned = state.upgrades && state.upgrades[item.id];
      const isEquipped = state.equipped_upgrades && state.equipped_upgrades[item.id];
      let actionButtons;

      if (isOwned && showEquipButton) {
        // If the user owns the item, show Equip/Unequip buttons
        if (isEquipped) {
          actionButtons = `<button onclick="handleEquipItem('${item.id}', false)" class="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded transition-colors">Unequip</button>`;
        } else {
          actionButtons = `<button onclick="handleEquipItem('${item.id}', true)" class="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition-colors">Equip</button>`;
        }
      } else if (isOwned) {
        // If owned but no equip functionality
        actionButtons = `<div class="w-full bg-green-700 text-white px-4 py-2 rounded text-center">Owned</div>`;
      } else {
        // If not owned, show the buy button
        const canAfford = state.coins >= item.cost;
        actionButtons = `<button onclick="handleBuyItem('${item.id}')" ${!canAfford ? 'disabled' : ''} class="w-full ${canAfford ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-600 cursor-not-allowed'} text-white px-4 py-2 rounded transition-colors">Buy for ${item.cost.toLocaleString()} Coins</button>`;
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

  shopContainer.innerHTML = `
    <!-- Phoenix Skins Section -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-white mb-4">Phoenix Skins</h2>
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        ${createItemsHtml(skinItems, true)}
      </div>
    </div>

    <!-- Themes Section -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-white mb-4">Themes</h2>
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        ${createItemsHtml(themeItems, true)}
      </div>
    </div>

    <!-- Cosmetics Section -->
    ${cosmeticItems.length > 0 ? `
    <div>
      <h2 class="text-2xl font-bold text-white mb-4">Cosmetics</h2>
      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        ${createItemsHtml(cosmeticItems, false)}
      </div>
    </div>
    ` : ''}
  `;
}

// Handles buying items
window.handleBuyItem = async function(itemId) {
  const item = shopItems.find(i => i.id === itemId);
  if (!item) return;

  const button = event.target;
  const originalText = button.textContent;
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
    updateState(result.userState);

    updateShopUI();

    showModal('Purchase Successful!', `
      <div class="text-center">
        <img src="${item.previewImage || '/img/placeholder.png'}" alt="${item.name}" class="w-20 h-20 mx-auto mb-4 rounded" onerror="this.style.display='none'">
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
    button.textContent = originalText;
  }
};

// Handles equipping and unequipping items
window.handleEquipItem = async function(itemId, equip) {
  const item = shopItems.find(i => i.id === itemId);
  const button = event.target;
  const originalText = button.textContent;

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
    updateState(result.userState);

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
    button.textContent = originalText;
  }
};