import React, { useContext, useMemo, useRef, useState } from 'react';
import { AppContext } from '../App.jsx';
import { buyItem } from '../api.js';
import Modal from '../components/Modal.jsx';

function ForestPage() {
    const { state, treeTypes, refetchData } = useContext(AppContext);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });
    const [selectedTreeType, setSelectedTreeType] = useState(null);
    const [selectedTree, setSelectedTree] = useState(null);
    const forestRef = useRef(null);

    const forest = state?.forest || [];
    const saplings = Object.values(treeTypes);
    
    const stats = {
        growing: forest.filter(t => t.status === 'growing' && new Date(t.matureDate) > new Date()).length,
        matured: forest.filter(t => t.status === 'matured' || new Date(t.matureDate) <= new Date()).length,
        withered: forest.filter(t => t.status === 'withered').length,
    };

    const treeVariants = ['aurora', 'ember', 'verdant'];
    const saplingVariantMap = useMemo(() => {
        const map = {};
        saplings.forEach((tree, index) => {
            map[tree.id] = treeVariants[index % treeVariants.length];
        });
        return map;
    }, [saplings]);

    const getStage = (tree) => {
        if (tree.status === 'withered') return 'withered';
        const now = Date.now();
        const purchaseTime = new Date(tree.purchaseDate).getTime();
        const growthHours = treeTypes[tree.treeType]?.growth_hours || 24;
        const hoursSincePlanted = Math.max(0, (now - purchaseTime) / (1000 * 60 * 60));
        if (hoursSincePlanted >= growthHours || tree.status === 'matured') return 'mature';
        if (hoursSincePlanted >= growthHours * 0.5) return 'young';
        return 'seedling';
    };

    const getTreeSprite = (tree) => {
        const variant = saplingVariantMap[tree.treeType] || treeVariants[0];
        const stage = getStage(tree);
        return `/img/trees/${variant}/${stage}.svg`;
    };

    const handleBuyTree = async (treeId, position) => {
        try {
            const result = await buyItem(treeId, position);
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

    const fallbackPosition = (tree) => {
        const base = String(tree.id || '');
        let hash = 0;
        for (let i = 0; i < base.length; i += 1) {
            hash = (hash * 31 + base.charCodeAt(i)) % 1000;
        }
        const normX = 0.15 + (hash % 70) / 100;
        const normY = 0.18 + ((hash * 7) % 60) / 100;
        return { x: normX, y: normY };
    };

    const getTreePosition = (tree) => {
        if (typeof tree.x === 'number' && typeof tree.y === 'number') {
            return { x: tree.x, y: tree.y };
        }
        return fallbackPosition(tree);
    };

    const handleForestClick = async (event) => {
        if (!forestRef.current) return;
        const rect = forestRef.current.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;
        const normX = clickX / rect.width;
        const normY = clickY / rect.height;

        const hitTree = forest.find((tree) => {
            const position = getTreePosition(tree);
            const treeX = position.x * rect.width;
            const treeY = position.y * rect.height;
            const dx = treeX - clickX;
            const dy = treeY - clickY;
            return Math.sqrt(dx * dx + dy * dy) < 36;
        });

        if (hitTree) {
            setSelectedTree(hitTree);
            return;
        }

        if (!selectedTreeType) {
            setModal({
                isOpen: true,
                title: 'Select a sapling',
                message: 'Pick a tree from the right to plant it in the forest.'
            });
            return;
        }

        await handleBuyTree(selectedTreeType, { x: normX, y: normY });
    };

    const formatAge = (purchaseDate) => {
        if (!purchaseDate) return 'Unknown';
        const diff = Math.max(0, Date.now() - new Date(purchaseDate).getTime());
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) return `${days}d ${hours}h`;
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
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
                                        Tap to plant
                                    </div>
                                    {forest.length === 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center text-center text-gray-400 pointer-events-none">
                                            <div>
                                                <p className="text-lg">Your Forest is empty.</p>
                                                <p className="text-sm mt-2">Pick a sapling on the right, then tap the forest to plant.</p>
                                            </div>
                                        </div>
                                    )}
                                    <div
                                        ref={forestRef}
                                        className="absolute inset-0"
                                        onClick={handleForestClick}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') {
                                                event.preventDefault();
                                            }
                                        }}
                                    >
                                        {forest.map((tree) => {
                                            const sprite = getTreeSprite(tree);
                                            const position = getTreePosition(tree);
                                            const x = position.x * 100;
                                            const y = position.y * 100;
                                            return (
                                                <button
                                                    key={tree.id}
                                                    type="button"
                                                    onClick={(event) => {
                                                        event.stopPropagation();
                                                        setSelectedTree(tree);
                                                    }}
                                                    className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                                                    style={{ left: `${x}%`, top: `${y}%` }}
                                                >
                                                    <img
                                                        src={sprite}
                                                        alt={tree.treeType}
                                                        className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.5)]"
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                    </div>
                </div>

                <aside>
                    <h2 className="text-2xl font-bold text-white mb-4">Sapling Shop</h2>
                    <div className="space-y-4">
                        {saplings.map(tree => (
                            <div
                                key={tree.id}
                                className={`bg-gray-800 p-6 rounded-lg border ${selectedTreeType === tree.id ? 'border-emerald-400/70' : 'border-gray-700'}`}
                            >
                                <div className="flex items-center gap-4 mb-4">
                                    <img src={`/img/trees/${saplingVariantMap[tree.id] || treeVariants[0]}/seedling.svg`} alt={tree.name} className="w-16 h-16 object-contain rounded" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">{tree.name}</h3>
                                        <p className="text-sm text-gray-300">{tree.cost.toLocaleString()} Coins</p>
                                        <p className="text-xs text-gray-400 mt-1">{tree.growth_hours}h to mature</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedTreeType(tree.id)}
                                    className="w-full bg-emerald-500/90 hover:bg-emerald-400 text-gray-900 px-4 py-3 rounded transition-colors font-semibold"
                                >
                                    {selectedTreeType === tree.id ? 'Selected to Plant' : 'Select to Plant'}
                                </button>
                            </div>
                        ))}
                    </div>
                </aside>
            </section>
            <Modal isOpen={modal.isOpen} onClose={() => setModal({ isOpen: false, title: '', message: '' })} title={modal.title}>
                <p>{modal.message}</p>
            </Modal>
            <Modal
                isOpen={!!selectedTree}
                onClose={() => setSelectedTree(null)}
                title="Tree Details"
            >
                {selectedTree && (
                    <div className="space-y-3">
                        <p className="text-gray-300">
                            Planted on{' '}
                            <span className="text-white font-semibold">
                                {new Date(selectedTree.purchaseDate).toLocaleString()}
                            </span>
                        </p>
                        <p className="text-gray-300">
                            Age: <span className="text-white font-semibold">{formatAge(selectedTree.purchaseDate)}</span>
                        </p>
                    </div>
                )}
            </Modal>
        </>
    );
}

export default ForestPage;
