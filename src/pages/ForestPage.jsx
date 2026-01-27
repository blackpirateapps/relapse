import React, { useContext, useEffect, useRef, useState } from 'react';
import { AppContext } from '../App.jsx';
import { buyItem } from '../api.js';
import Modal from '../components/Modal.jsx';
import * as THREE from 'three';

function ForestPage() {
    const { state, treeTypes, refetchData } = useContext(AppContext);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const cameraRef = useRef(null);
    const forestGroupRef = useRef(null);
    const animationRef = useRef(null);

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

    useEffect(() => {
        if (!sceneRef.current || rendererRef.current) return;

        const container = sceneRef.current;
        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x0b0f12, 8, 40);

        const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 200);
        camera.position.set(0, 6, 12);
        camera.lookAt(0, 2, 0);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        container.appendChild(renderer.domElement);

        const ambient = new THREE.AmbientLight(0x9bb3b8, 0.7);
        scene.add(ambient);
        const sun = new THREE.DirectionalLight(0xf6d7a7, 0.9);
        sun.position.set(-8, 10, 6);
        scene.add(sun);

        const ground = new THREE.Mesh(
            new THREE.CircleGeometry(18, 64),
            new THREE.MeshPhongMaterial({ color: 0x0f2a1f, shininess: 10 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        scene.add(ground);

        const forestGroup = new THREE.Group();
        scene.add(forestGroup);

        sceneRef.current.__threeScene = scene;
        rendererRef.current = renderer;
        cameraRef.current = camera;
        forestGroupRef.current = forestGroup;

        const handleResize = () => {
            if (!sceneRef.current || !rendererRef.current || !cameraRef.current) return;
            const { clientWidth, clientHeight } = sceneRef.current;
            cameraRef.current.aspect = clientWidth / clientHeight;
            cameraRef.current.updateProjectionMatrix();
            rendererRef.current.setSize(clientWidth, clientHeight);
        };

        const animate = () => {
            animationRef.current = requestAnimationFrame(animate);
            forestGroup.rotation.y += 0.0008;
            renderer.render(scene, camera);
        };
        animate();
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', handleResize);
            renderer.dispose();
            container.removeChild(renderer.domElement);
            rendererRef.current = null;
            cameraRef.current = null;
            forestGroupRef.current = null;
        };
    }, []);

    useEffect(() => {
        const scene = sceneRef.current?.__threeScene;
        const forestGroup = forestGroupRef.current;
        if (!scene || !forestGroup) return;

        while (forestGroup.children.length) {
            const child = forestGroup.children.pop();
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach((mat) => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        }

        const hash = (value) => {
            let h = 2166136261;
            const str = String(value);
            for (let i = 0; i < str.length; i++) {
                h ^= str.charCodeAt(i);
                h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
            }
            return Math.abs(h);
        };

        forest.forEach((tree, index) => {
            const seed = hash(tree.id || `${tree.treeType}-${index}`);
            const radius = 4 + (seed % 900) / 100;
            const angle = (seed % 360) * (Math.PI / 180);
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            const status = tree.status;
            const trunkColor = status === 'withered' ? 0x6b4b3e : 0x7a4a21;
            const leafColor = status === 'matured' ? 0x3bbd84 : status === 'withered' ? 0x6f5f4b : 0x4aa96c;

            const trunkHeight = 0.8 + (seed % 40) / 50;
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.12, 0.18, trunkHeight, 6),
                new THREE.MeshStandardMaterial({ color: trunkColor, roughness: 0.9 })
            );
            trunk.position.y = trunkHeight / 2;

            const canopyHeight = 1.2 + (seed % 60) / 60;
            const canopy = new THREE.Mesh(
                new THREE.ConeGeometry(0.7 + (seed % 30) / 60, canopyHeight, 8),
                new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.8 })
            );
            canopy.position.y = trunkHeight + canopyHeight / 2 - 0.1;

            const treeGroup = new THREE.Group();
            treeGroup.add(trunk);
            treeGroup.add(canopy);
            treeGroup.position.set(x, 0, z);

            const growthScale = status === 'growing' ? 0.75 : status === 'withered' ? 0.6 : 1;
            treeGroup.scale.setScalar(growthScale);

            forestGroup.add(treeGroup);
        });
    }, [forest, treeTypes]);
    
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
                            <div className="h-[60vh] rounded-2xl border border-gray-700/60 bg-gradient-to-b from-emerald-900/20 via-gray-900/60 to-black/70 overflow-hidden relative">
                                <div ref={sceneRef} className="absolute inset-0" />
                                <div className="relative z-10 p-4 text-xs text-gray-300">
                                    <span className="bg-black/50 px-3 py-1 rounded-full">3D Forest View</span>
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
