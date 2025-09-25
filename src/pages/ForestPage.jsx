import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../App.jsx';
import { buyItem } from '../api.js';
import Modal from '../components/Modal.jsx';

function formatRemainingTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);

  const dayPart = d > 0 ? `${d}d ` : '';
  return `${dayPart}${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s`;
}

const TreeTimer = ({ matureDate }) => {
    const [remaining, setRemaining] = useState(new Date(matureDate) - Date.now());

    useEffect(() => {
        const interval = setInterval(() => {
            const newRemaining = new Date(matureDate) - Date.now();
            if (newRemaining <= 0) {
                clearInterval(interval);
                // Optionally trigger a refetch here
            }
            setRemaining(newRemaining);
        }, 1000);
        return () => clearInterval(interval);
    }, [matureDate]);

    return remaining > 0 ? (
        <div className="tree-timer text-xs text-yellow-400 mt-1">{formatRemainingTime(remaining)}</div>
    ) : null;
};

function ForestPage() {
    const { state, treeTypes, refetchData } = useContext(AppContext);
    const [modalContent, setModalContent] = useState(null);

    const forest = state.forest || [];
    const treeTypesArray = Object.values(treeTypes);
    const now = new Date();

    const stats = {
        growing: forest.filter(t => t.status === 'growing' && now < new Date(t.matureDate)).length,
        matured: forest.filter(t => t.status === 'matured' || (t.status === 'growing' && now >= new Date(t.matureDate))).length,
        withered: forest.filter(t => t.status === 'withered').length
    };

    const handleBuyTree = async (treeId) => {
        const tree = treeTypes[treeId];
        try {
            const result = await buyItem(treeId);
            refetchData();
            setModalContent({
                title: 'Tree Planted!',
                message: result.message,
                item: tree
            });
        } catch (error) {
            setModalContent({
                title: 'Purchase Failed',
                message: error.message,
                isError: true
            });
        }
    };

    const getTreeGrowthStage = (tree) => {
      const treeConfig = treeTypes[tree.treeType];
      if (!treeConfig) {
        return { statusText: 'Unknown', imageSrc: '/img/placeholder.png', statusColor: 'text-gray-500' };
      }

      if (tree.status === 'withered') {
        return { statusText: 'Withered', imageSrc: treeConfig.withered_image, statusColor: 'text-red-500' };
      }
      
      const matureDate = new Date(tree.matureDate);
      if (tree.status === 'matured' || Date.now() >= matureDate) {
        const matureStage = treeConfig.stages[treeConfig.stages.length - 1];
        return { statusText: matureStage.stage_name, imageSrc: matureStage.image_url, statusColor: 'text-cyan-400' };
      }

      const purchaseDate = new Date(tree.purchaseDate);
      const hoursSincePlanted = (Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60);

      for (let i = treeConfig.stages.length - 1; i >= 0; i--) {
        if (hoursSincePlanted >= treeConfig.stages[i].stage_hours) {
          return { statusText: treeConfig.stages[i].stage_name, imageSrc: treeConfig.stages[i].image_url, statusColor: 'text-green-400' };
        }
      }

      const firstStage = treeConfig.stages[0];
      return { statusText: firstStage.stage_name, imageSrc: firstStage.image_url, statusColor: 'text-green-400' };
    };

    return (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 flex flex-col">
                <div className="card p-4 grid grid-cols-3 divide-x divide-gray-700 text-center mb-6">
                    <div><p className="text-2xl font-bold text-green-400">{stats.growing}</p><p className="text-sm text-gray-400">Growing</p></div>
                    <div><p className="text-2xl font-bold text-cyan-400">{stats.matured}</p><p className="text-sm text-gray-400">Matured</p></div>
                    <div><p className="text-2xl font-bold text-red-500">{stats.withered}</p><p className="text-sm text-gray-400">Withered</p></div>
                </div>
                <div className="card p-6 md:p-8 flex-grow">
                    {forest.length === 0 ? (
                        <div className="text-center text-gray-400 mt-10"><p className="text-lg">Your Forest is empty.</p><p className="text-sm mt-2">Buy a sapling from the shop to begin.</p></div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 justify-items-center">
                            {forest.map(tree => {
                                const stage = getTreeGrowthStage(tree);
                                const treeConfig = treeTypes[tree.treeType];
                                return (
                                    <div key={tree.id} className="text-center">
                                        <img src={stage.imageSrc} alt={stage.statusText} className="w-24 h-24 mx-auto object-cover rounded mb-2" />
                                        <h3 className="font-semibold text-white text-sm">{treeConfig?.name || 'Unknown'}</h3>
                                        <p className={`${stage.statusColor} text-xs`}>{stage.statusText}</p>
                                        {tree.status === 'growing' && <TreeTimer matureDate={tree.matureDate} />}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <aside>
                <h2 className="text-2xl font-bold text-white mb-4">Sapling Shop</h2>
                <div className="space-y-4">
                    {treeTypesArray.map(tree => (
                        <div key={tree.id} className="card p-4">
                            <h3 className="text-lg font-semibold text-white">{tree.name}</h3>
                            <p className="text-sm text-gray-300 mb-2">{tree.cost.toLocaleString()} Coins</p>
                            <p className="text-xs text-gray-400 mb-4">{tree.description}</p>
                            <button onClick={() => handleBuyTree(tree.id)} className="w-full bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-semibold transition-colors">
                                Buy
                            </button>
                        </div>
                    ))}
                </div>
            </aside>
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

export default ForestPage;

