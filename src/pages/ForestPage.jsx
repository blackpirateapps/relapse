import React, { useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from '../App.jsx';
import { buyItem } from '../api.js';
import Modal from '../components/Modal.jsx';

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

    const visibleTrees = useMemo(() => {
        if (!forest.length) return [];
        return forest.map((tree) => ({
            ...tree,
            spriteSize: tree.status === 'matured' ? 3 : tree.status === 'growing' ? 2.6 : 2.4
        }));
    }, [forest]);

    const pixelShadows = {
        growing: 'bg-emerald-400/60',
        matured: 'bg-emerald-300/80',
        withered: 'bg-amber-400/40'
    };

    const getTreeSprite = (tree) => {
        const config = treeTypes[tree.treeType];
        if (!config) return null;
        if (tree.status === 'withered') return config.witheredImage;
        if (tree.status === 'matured' || new Date(tree.matureDate) <= new Date()) {
            const matureStage = config.stages[config.stages.length - 1];
            return matureStage?.image;
        }
        const hoursSincePlanted = (Date.now() - new Date(tree.purchaseDate).getTime()) / (1000 * 60 * 60);
        const currentStage = config.stages.slice().reverse().find(stage => hoursSincePlanted >= stage.hours) || config.stages[0];
        return currentStage?.image;
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
                            <div className="h-[60vh] rounded-2xl border border-gray-700/70 bg-[#0f1612] overflow-hidden relative">
                                <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(9,40,24,0.9),rgba(8,16,14,0.95),rgba(4,6,8,1))]" />
                                <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(to_top,rgba(0,0,0,0.8),rgba(0,0,0,0))]" />
                                <div className="absolute inset-0 opacity-40 mix-blend-screen" style={{
                                    backgroundImage:
                                        'radial-gradient(circle at 20% 30%, rgba(52,255,165,0.12), transparent 45%),' +
                                        'radial-gradient(circle at 80% 40%, rgba(41,173,255,0.12), transparent 40%),' +
                                        'radial-gradient(circle at 40% 70%, rgba(108,255,140,0.08), transparent 40%)'
                                }} />
                                <div className="absolute inset-0 opacity-20" style={{
                                    backgroundImage: 'linear-gradient(transparent 80%, rgba(0,0,0,0.4) 80%), linear-gradient(90deg, transparent 80%, rgba(0,0,0,0.35) 80%)',
                                    backgroundSize: '6px 6px'
                                }} />
                                <div className="absolute inset-0" style={{
                                    backgroundImage:
                                        'linear-gradient(to right, rgba(0,0,0,0.2) 1px, transparent 1px), ' +
                                        'linear-gradient(to bottom, rgba(0,0,0,0.2) 1px, transparent 1px)',
                                    backgroundSize: '24px 24px',
                                    opacity: 0.2
                                }} />
                                <div className="relative z-10 h-full w-full">
                                    <div className="absolute top-4 left-4 px-3 py-1 text-[11px] uppercase tracking-[0.35em] bg-black/60 text-emerald-200 border border-emerald-500/30">
                                        Pixel Forest
                                    </div>
                                    <div
                                        className="absolute inset-0 grid place-items-center"
                                        style={{
                                            gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
                                            gridAutoRows: '72px',
                                            padding: '56px 40px 32px'
                                        }}
                                    >
                                        {visibleTrees.map((tree) => {
                                            const sprite = getTreeSprite(tree);
                                            if (!sprite) return null;
                                            return (
                                                <div
                                                    key={tree.id}
                                                    className="relative flex items-center justify-center"
                                                    style={{
                                                        width: `${tree.spriteSize}rem`,
                                                        height: `${tree.spriteSize}rem`,
                                                        imageRendering: 'pixelated'
                                                    }}
                                                >
                                                    <div
                                                        className={`absolute left-1/2 -bottom-1 h-2 w-6 rounded-full ${pixelShadows[tree.status] || 'bg-emerald-400/40'}`}
                                                        style={{ transform: 'translateX(-50%) scale(1.2, 0.6)' }}
                                                    />
                                                    <img
                                                        src={sprite}
                                                        alt={tree.treeType}
                                                        className="w-full h-full object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.5)]"
                                                        style={{ imageRendering: 'pixelated' }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
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
