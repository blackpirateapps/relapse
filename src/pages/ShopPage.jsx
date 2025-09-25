import React, { useContext, useState } from 'react';
import { AppContext } from '../App.jsx';
import { buyItem, equipItem } from '../api.js';
import Modal from '../components/Modal.jsx';

function ShopPage() {
    const { state, shopItems, refetchData } = useContext(AppContext);
    const [modalContent, setModalContent] = useState(null);
    const [loadingItemId, setLoadingItemId] = useState(null);

    const handleBuy = async (item) => {
        setLoadingItemId(item.id);
        try {
            const result = await buyItem(item.id);
            refetchData();
            setModalContent({ title: 'Purchase Successful!', message: result.message, item });
        } catch (error) {
            setModalContent({ title: 'Purchase Failed', message: error.message, isError: true });
        } finally {
            setLoadingItemId(null);
        }
    };

    const handleEquip = async (itemId, equip) => {
        setLoadingItemId(itemId);
        try {
            await equipItem(itemId, equip);
            refetchData();
        } catch (error) {
            setModalContent({ title: 'Error', message: error.message, isError: true });
        } finally {
            setLoadingItemId(null);
        }
    };

    const totalHours = state.lastRelapse ? (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60) : 0;
    const streakCoins = Math.floor(10 * Math.pow(totalHours, 1.2));
    const totalCoins = (state.coinsAtLastRelapse || 0) + streakCoins;

    const renderActionButtons = (item) => {
        const isOwned = state.upgrades && state.upgrades[item.id];
        const isEquipped = state.equipped_upgrades && state.equipped_upgrades[item.id];
        const isLoading = loadingItemId === item.id;
        
        if (isOwned) {
            if (item.type !== 'phoenix_skin') {
                return <div className="w-full bg-green-700 text-white px-4 py-2 rounded text-center">Owned</div>;
            }
            if (isEquipped) {
                return <button onClick={() => handleEquip(item.id, false)} disabled={isLoading} className="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded transition-colors">{isLoading ? '...' : 'Unequip'}</button>;
            }
            return <button onClick={() => handleEquip(item.id, true)} disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition-colors">{isLoading ? '...' : 'Equip'}</button>;
        }

        const canAfford = totalCoins >= item.cost;
        return <button onClick={() => handleBuy(item)} disabled={!canAfford || isLoading} className={`w-full ${canAfford ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-600 cursor-not-allowed'} text-white px-4 py-2 rounded transition-colors`}>{isLoading ? '...' : `Buy for ${item.cost.toLocaleString()}`}</button>;
    };

    const skinItems = shopItems.filter(item => item.type === 'phoenix_skin');

    return (
        <section id="shop">
            <h2 className="text-2xl font-bold text-white mb-4">Phoenix Skins</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {skinItems.map(item => (
                    <div key={item.id} className="card p-4">
                        <img src={item.preview_image || '/img/placeholder.png'} alt={item.name} className="w-full h-32 object-cover rounded mb-3" />
                        <h3 className="text-lg font-semibold text-white mb-2">{item.name}</h3>
                        <p className="text-sm text-gray-400 mb-4 h-16 overflow-auto">{item.description}</p>
                        {renderActionButtons(item)}
                    </div>
                ))}
            </div>
             {modalContent && (
                <Modal title={modalContent.title} onClose={() => setModalContent(null)}>
                    <div className="text-center">
                        {modalContent.item && <img src={modalContent.item.preview_image} alt={modalContent.item.name} className="w-20 h-20 mx-auto mb-4 rounded"/>}
                        <p className={modalContent.isError ? 'text-red-400' : 'text-green-400'}>{modalContent.message}</p>
                    </div>
                </Modal>
            )}
        </section>
    );
}

export default ShopPage;

