import { initializeApp, getState, shopItems, renderPhoenix, showModal, closeModal, getRank, applyBackground } from './shared.js';

initializeApp(state => {
    const shopContainer = document.getElementById('shop-container');
    
    const cosmeticItems = shopItems.filter(item => item.type === 'cosmetic');
    const themeItems = shopItems.filter(item => item.type === 'theme');
    
    const createItemsHtml = (items) => {
        return items.map(item => {
            const isOwned = state.upgrades && state.upgrades[item.id];
            return `
                <div class="bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-lg p-6 flex flex-col text-center">
                    <div class="w-32 h-32 mx-auto mb-4 flex items-center justify-center">
                        <img src="${item.image}" alt="${item.name}" class="max-w-full max-h-full">
                    </div>
                    <h3 class="font-serif-display text-2xl text-amber-400">${item.name}</h3>
                    <p class="text-gray-400 text-sm flex-grow my-2">${item.description}</p>
                    <div class="flex gap-2 mt-4">
                        <button class="preview-button w-1/2 font-bold py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700" data-item-id="${item.id}" ${isOwned ? 'disabled' : ''}>Preview</button>
                        <button class="buy-button w-1/2 font-bold py-3 px-4 rounded-lg ${isOwned ? 'bg-gray-500 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}" data-item-id="${item.id}" ${isOwned ? 'disabled' : ''}>
                            ${isOwned ? 'Owned' : `${item.cost.toLocaleString()} Coins`}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    };

    shopContainer.innerHTML = `
        <h2 class="text-2xl font-semibold text-indigo-300 mb-4">Phoenix Cosmetics</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${createItemsHtml(cosmeticItems)}
        </div>
        <h2 class="text-2xl font-semibold text-indigo-300 mb-4 mt-10">App Themes</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${createItemsHtml(themeItems)}
        </div>
    `;

    document.querySelectorAll('.buy-button').forEach(button => button.addEventListener('click', handleBuyItem));
    document.querySelectorAll('.preview-button').forEach(button => button.addEventListener('click', handlePreviewItem));
});

function handleBuyItem(e) {
    const state = getState();
    const itemId = e.target.dataset.itemId;
    const item = shopItems.find(i => i.id === itemId);

    if (state.coins < item.cost) {
        showModal('Not Enough Coins', '<p>You do not have enough coins.</p>');
        return;
    }
    
    showModal(`Confirm Purchase`, `
        <p class="text-gray-300 mb-4">Purchase "${item.name}" for ${item.cost.toLocaleString()} coins?</p>
        <div class="flex justify-end gap-4 mt-6">
            <button id="cancel-purchase" class="bg-gray-600 hover:bg-gray-700 font-bold py-2 px-4 rounded-lg">Cancel</button>
            <button id="confirm-purchase" class="bg-purple-600 hover:bg-purple-700 font-bold py-2 px-4 rounded-lg">Confirm</button>
        </div>
    `, { showClose: false });

    document.getElementById('cancel-purchase').onclick = closeModal;
    document.getElementById('confirm-purchase').onclick = async () => {
        try {
            const response = await fetch('/api/buy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemId }),
            });
            if (!response.ok) throw new Error('Purchase failed');
            window.location.reload();
        } catch (error) {
            closeModal();
            showModal('Error', `<p>${error.message}</p>`);
        }
    };
}

function handlePreviewItem(e) {
    const state = getState();
    const itemId = e.target.dataset.itemId;
    const item = shopItems.find(i => i.id === itemId);
    const tempUpgrades = { ...state.upgrades, [item.id]: true };

    const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
    const currentRank = getRank(totalHours);
    
    let previewContent;

    if (item.type === 'cosmetic') {
        previewContent = `
            <div class="bg-gray-900/50 p-8 rounded-2xl flex flex-col items-center justify-center">
                <div class="w-48 h-48 mb-6 flex items-center justify-center">${renderPhoenix(currentRank.level, tempUpgrades)}</div>
                <h2 class="font-serif-display text-3xl text-center text-amber-400">${currentRank.name}</h2>
            </div>
        `;
    } else { // Theme
        previewContent = `
            <div class="relative w-full h-64 rounded-2xl overflow-hidden flex items-center justify-center">
                <div id="preview-bg" class="absolute inset-0"></div>
                <h2 class="font-serif-display text-3xl text-white relative z-10">This will be your new background.</h2>
            </div>
        `;
    }
    
    showModal(`Preview: ${item.name}`, `
        ${previewContent}
        <div class="flex justify-end mt-6">
            <button id="close-preview-btn" class="bg-indigo-600 hover:bg-indigo-700 font-bold py-2 px-4 rounded-lg">Close Preview</button>
        </div>
    `, { showClose: false, size: 'max-w-2xl' });

    if (item.type === 'theme') {
        const previewBg = document.getElementById('preview-bg');
        fetch(item.image)
            .then(res => res.text())
            .then(svg => previewBg.innerHTML = svg);
    }

    document.getElementById('close-preview-btn').onclick = closeModal;
}

