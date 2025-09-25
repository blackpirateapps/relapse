import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App.jsx';
import { buyItem } from '../api.js';
import Modal from '../components/Modal.jsx';

// Helper function to format the countdown timer
function formatRemainingTime(ms) {
    if (ms <= 0) return "Matured!";
    const totalSeconds = Math.floor(ms / 1000);
    const d = Math.floor(totalSeconds / 86400);
    const h = Math.floor((totalSeconds % 86400) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    const dayPart = d > 0 ? `${d}d ` : '';
    return `${dayPart}${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

// Reusable Tree component for the forest grid
function Tree({ tree, treeConfig }) {
    const [timer, setTimer] = useState('');

    useEffect(() => {
        let interval;
        if (tree.status === 'growing') {
            interval = setInterval(() => {
                const remaining = new Date(tree.matureDate).getTime() - Date.now();
                setTimer(formatRemainingTime(remaining));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [tree]);

    if (!treeConfig) return null;

    let stage = { statusText: 'Unknown', imageSrc: '', statusColor: 'text-gray-500' };

    if (tree.status === 'withered') {
        stage = {
            statusText: 'Withered',
            imageSrc: treeConfig.witheredImage,
            statusColor: 'text-red-500'
        };
    } else if (tree.status === 'matured' || new Date(tree.matureDate) <= new Date()) {
        const matureStage = treeConfig.stages[treeConfig.stages.length - 1];
        stage = {
            statusText: 'Matured',
            imageSrc: matureStage?.image,
            statusColor: 'text-cyan-400'
        };
    } else { // It's growing
        const hoursSincePlanted = (Date.now() - new Date(tree.purchaseDate).getTime()) / (1000 * 60 * 60);
        const currentStage = treeConfig.stages.slice().reverse().find(s => hoursSincePlanted >= s.hours) || treeConfig.stages[0];
        stage = {
            statusText: currentStage.status,
            imageSrc: currentStage.image,
            statusColor: 'text-green-400'
        };
    }
    
    // --- FIX: REMOVED "bg-gray-800" CLASS FROM THIS DIV ---
    return (
        <div className="p-4 rounded-lg border border-gray-700/50 text-center flex flex-col items-center transition-all hover:bg-white/5">
            <img 
                src={stage.imageSrc || '/img/placeholder.png'} 
                alt={stage.statusText} 
                className="w-24 h-24 mx-auto object-contain mb-2" 
                onError={(e) => { e.target.style.display = 'none'; }}
            />
            <h3 className="font-semibold text-white text-sm">{treeConfig.name}</h3>
            <p className={`${stage.statusColor} text-xs`}>{stage.statusText}</p>
            {tree.status === 'growing' && timer && <div className="text-xs text-yellow-400 mt-1 font-mono">{timer}</div>}
        </div>
    );
}


function ForestPage() {
    const { state, treeTypes, refetchData } = useContext(AppContext);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });

    const forest = state?.forest || [];
    const saplings = Object.values(treeTypes);
    
    const stats = {
        growing: forest.filter(t => t.status === 'growing' && new Date(t.matureDate) > new Date()).length,
        matured: forest.filter(t => t.status === 'matured' || new Date(t.matureDate) <= new Date()).length,
        withered: forest.filter(t => t.status === 'withered').length,
    };

    const handleBuyTree = async (treeId) => {
        try {
            const result = await buyItem(treeId);
            if (result.success) {
                await refetchData();
                setModal({ isOpen: true, title: 'Success!', message: result.message });
            } else {
                setModal({ isOpen: true, title: 'Error', message: result.message });
            }
        } catch (error) {
            setModal({ isOpen: true, title: 'Error', message: error.message || 'Purchase failed.' });
        }
    };
    
    return (
        <>
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow">
                <div className="lg:col-span-2 flex flex-col">
                    <div className="card p-4 grid grid-cols-3 divide-x divide-gray-700 text-center mb-6 flex-shrink-0">
                        <div>
                            <p className="text-2xl font-bold text-green-400">{stats.growing}</p>
                            <p className="text-sm text-gray-400">Growing</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-cyan-400">{stats.matured}</p>
                            <p className="text-sm text-gray-400">Matured</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-500">{stats.withered}</p>
                            <p className="text-sm text-gray-400">Withered</p>
                        </div>
                    </div>
                    <div className="card p-6 md:p-8 flex-grow">
                        {forest.length === 0 ? (
                            <div className="text-center text-gray-400 mt-10">
                                <p className="text-lg">Your Forest is empty.</p>
                                <p className="text-sm mt-2">Buy a sapling from the shop to begin.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 justify-items-center">
                                {forest.map((tree) => (
                                    <Tree key={tree.id} tree={tree} treeConfig={treeTypes[tree.treeType]} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <aside>
                    <h2 className="text-2xl font-bold text-white mb-4">Sapling Shop</h2>
                    <div className="space-y-4">
                        {saplings.map(tree => (
                            <div key={tree.id} className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                                <div className="flex items-center gap-4 mb-4">
                                    <img src={tree.stages[0]?.image} alt={tree.name} className="w-16 h-16 object-contain rounded" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">{tree.name}</h3>
                                        <p className="text-sm text-gray-300">{tree.cost.toLocaleString()} Coins</p>
                                        <p className="text-xs text-gray-400 mt-1">{tree.growth_hours}h to mature</p>
                                    </div>
                                </div>
                                <button onClick={() => handleBuyTree(tree.id)} className="w-full bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded transition-colors font-semibold">
                                    Buy for {tree.cost.toLocaleString()} Coins
                                </button>
                            </div>
                        ))}
                    </div>
                </aside>
            </section>
            <Modal isOpen={modal.isOpen} onClose={() => setModal({ isOpen: false, title: '', message: '' })} title={modal.title}>
                <p>{modal.message}</p>
            </Modal>
        </>
    );
}

export default ForestPage;