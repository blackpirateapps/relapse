import React, { useContext, useState } from 'react';
import { AppContext } from '../App';
import { buyItem, equipItem } from '../api';
import Modal from '../components/Modal';

function ShopPage() {
    const { state, shopItems, totalCoins, refetchData } = useContext(AppContext);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });

    const handleBuy = async (itemId) => {
        try {
            const result = await buyItem(itemId);
            setModal({ isOpen: true, title: result.success ? 'Success!' : 'Error', message: result.message });
            if (result.success) {
                await refetchData();
            }
        } catch (error) {
            setModal({ isOpen: true, title: 'Error', message: error.message || 'Purchase failed.' });
        }
    };

    const handleEquip = async (itemId, equip) => {
        try {
            const result = await equipItem(itemId, equip);
            setModal({ isOpen: true, title: result.success ? 'Success!' : 'Error', message: result.message });
            if (result.success) {
                await refetchData();
            }
        } catch (error) {
            setModal({ isOpen: true, title: 'Error', message: error.message || 'Failed to equip item.' });
        }
    };

    const renderActionButtons = (item) => {
        const isOwned = state.upgrades && state.upgrades[item.id];
        const isEquipped = state.equipped_upgrades && state.equipped_upgrades[item.id];

        if (isOwned && item.type !== 'tree_sapling') {
            if (isEquipped) {
                return <button onClick={() => handleEquip(item.id, false)} className="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded transition-colors">Unequip</button>;
            }
            return <button onClick={() => handleEquip(item.id, true)} className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded transition-colors">Equip</button>;
        }
        
        if (isOwned && item.type === 'tree_sapling') {
             return <div className="w-full bg-green-700 text-white px-4 py-2 rounded text-center">Owned</div>;
        }

        const canAfford = totalCoins >= item.cost;
        return <button onClick={() => handleBuy(item.id)} disabled={!canAfford} className={`w-full ${canAfford ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-600 cursor-not-allowed'} text-white px-4 py-2 rounded transition-colors`}>Buy for {item.cost.toLocaleString()} Coins</button>;
    };
    
    // --- START: CORRECT TREE GALLERY LOGIC ---
    const renderTreeGallery = (item) => {
        if (item.type !== 'tree_sapling' || !item.stages) return null;

        return (
            <div className="mt-4">
                <h4 className="text-sm font-semibold text-white mb-2">Growth Stages:</h4>
                <div className="grid grid-cols-5 gap-2">
                    {item.stages.map((stage, index) => (
                        <div key={index} className="text-center">
                            <img src={stage.image} alt={stage.status} className="w-12 h-12 object-contain rounded bg-black/20 mx-auto" />
                            <p className="text-xs text-gray-400 mt-1">{stage.hours}h</p>
                        </div>
                    ))}
                </div>
            </div>
        );
    };
    // --- END: CORRECT TREE GALLERY LOGIC ---

    const renderShopSection = (title, type) => {
        const items = shopItems.filter(item => item.type === type);
        if (items.length === 0) return null;

        return (
            <div className="mb-12">
                <h2 className="text-3xl font-bold text-white mb-6 font-serif-display">{title}</h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {items.map(item => (
                        <div key={item.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col">
                            <img src={item.preview_image || '/img/placeholder.png'} alt={item.name} className="w-full h-40 object-contain rounded mb-3" />
                            <div className="flex-grow">
                                <h3 className="text-lg font-semibold text-white mb-2">{item.name}</h3>
                                <p className="text-sm text-gray-400 mb-4 flex-grow">{item.description}</p>
                                {renderTreeGallery(item)}
                            </div>
                            <div className="mt-4">
                                {renderActionButtons(item)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <>
            <section id="shop">
                {renderShopSection('Phoenix Skins', 'phoenix_skin')}
                {renderShopSection('Tree Saplings', 'tree_sapling')}
                {/* Add other sections as needed */}
            </section>
            <Modal isOpen={modal.isOpen} onClose={() => setModal({ isOpen: false, title: '', message: '' })} title={modal.title}>
                <p>{modal.message}</p>
            </Modal>
        </>
    );
}

export default ShopPage;

