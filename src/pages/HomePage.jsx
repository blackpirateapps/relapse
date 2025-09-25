import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../App.jsx';
import { postRelapse, getRank } from '../api.js';
import Modal from '../components/Modal.jsx';

function formatLiveStreak(ms) {
    if (!ms || ms < 0) return "0d 00h 00m 00s";
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;
}

function HomePage() {
    const { state, ranks, refetchData } = useContext(AppContext);
    const [timer, setTimer] = useState('');
    const [showRelapseModal, setShowRelapseModal] = useState(false);
    const [showUrgeModal, setShowUrgeModal] = useState(false);

    useEffect(() => {
        const startTime = new Date(state.lastRelapse).getTime();
        const interval = setInterval(() => {
            setTimer(formatLiveStreak(Date.now() - startTime));
        }, 1000);
        return () => clearInterval(interval);
    }, [state.lastRelapse]);

    const handleRelapse = async () => {
        await postRelapse();
        setShowRelapseModal(false);
        refetchData(); 
    };

    const totalHours = (Date.now() - new Date(state.lastRelapse).getTime()) / (1000 * 60 * 60);
    const currentRank = getRank(totalHours, ranks);

    const urgeTips = [
        "Take 10 deep breaths, focusing only on your breathing.",
        "Go for a short walk, even just for 5 minutes.",
        "Drink a large glass of cold water.",
        "Splash cold water on your face.",
        "Call or text a friend or family member.",
        "Watch a funny video online.",
        "Listen to your favorite upbeat song.",
        "Write down why you started this journey.",
        "Do 10 push-ups or jumping jacks.",
        "Remind yourself that this feeling will pass."
    ];
    const randomTip = urgeTips[Math.floor(Math.random() * urgeTips.length)];

    return (
        <section className="text-center">
            <div className="card max-w-2xl mx-auto p-8">
                <h2 className="text-3xl font-bold text-white mb-2 font-serif-display">{currentRank.name}</h2>
                <p className="text-gray-400 mb-6">{currentRank.storyline}</p>
                
                <div className="w-48 h-48 mx-auto mb-6">
                   <img src={`/img/${currentRank.id}.webp`} alt={currentRank.name} className="w-full h-full object-cover" />
                </div>
                
                <div className="text-4xl font-mono text-green-400 font-bold mb-8">
                    {timer}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button onClick={() => setShowUrgeModal(true)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105">
                        I Feel an Urge
                    </button>
                    <button onClick={() => setShowRelapseModal(true)} className="bg-red-700 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105">
                        I Relapsed
                    </button>
                </div>
            </div>

            {showUrgeModal && (
                <Modal title="Hold Strong" onClose={() => setShowUrgeModal(false)}>
                    <p className="mb-4">The urge is temporary. Your strength is permanent. Here's a quick action you can take right now:</p>
                    <p className="text-yellow-400 font-bold text-lg text-center p-4 bg-gray-700 rounded-md">{randomTip}</p>
                    <div className="text-center mt-6">
                        <button onClick={() => setShowUrgeModal(false)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">Close</button>
                    </div>
                </Modal>
            )}

            {showRelapseModal && (
                <Modal title="Confirm Relapse" onClose={() => setShowRelapseModal(false)}>
                    <p>Are you sure you want to record a relapse? This will end your current streak and immortalize your phoenix in the Aviary.</p>
                    <div className="flex justify-end gap-4 mt-6">
                        <button onClick={() => setShowRelapseModal(false)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">Cancel</button>
                        <button onClick={handleRelapse} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded">Confirm</button>
                    </div>
                </Modal>
            )}
        </section>
    );
}

export default HomePage;

