import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../App.jsx';
import { postRelapse } from '../api.js';
import Modal from '../components/Modal.jsx';
import PhoenixImage from '../components/PhoenixImage.jsx'; // Import the new component

function HomePage() {
  const { state, setState, currentRank } = useContext(AppContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', body: '' });
  const [streak, setStreak] = useState('0d 00h 00m 00s');

  useEffect(() => {
    const timer = setInterval(() => {
      const ms = Date.now() - new Date(state.lastRelapse).getTime();
      const days = Math.floor(ms / (1000 * 60 * 60 * 24));
      const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((ms % (1000 * 60)) / 1000);
      setStreak(`${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, [state.lastRelapse]);

  const handleUrge = () => {
    setModalContent({
      title: 'Hold Strong',
      body: `
        <div class="text-center">
          <p class="mb-4">This feeling is temporary. Remember why you started this journey.</p>
          <p class="font-semibold">Your current streak is a testament to your strength. You've come so far. Don't let a fleeting moment undo your progress.</p>
          <p class="mt-4 text-sm text-gray-400">Close this, take a few deep breaths, and focus on the Celestial Phoenix you are becoming.</p>
        </div>
      `,
    });
    setIsModalOpen(true);
  };

  const handleRelapse = async () => {
    if (window.confirm("Are you sure? This action cannot be undone and will reset your current progress.")) {
      try {
        const newState = await postRelapse();
        newState.upgrades = JSON.parse(newState.upgrades || '{}');
        newState.equipped_upgrades = JSON.parse(newState.equipped_upgrades || '{}');
        setState(newState);
        alert("Your streak has been reset, but a new journey begins now. Rise again.");
      } catch (error) {
        alert("Failed to process relapse. Please try again.");
      }
    }
  };

  return (
    <>
      <div className="text-center flex flex-col items-center justify-center h-full -mt-16">
        
        {/* Use the new PhoenixImage component */}
        <PhoenixImage 
          rankLevel={currentRank.level} 
          equippedUpgrades={state.equipped_upgrades} 
        />

        <h1 className="text-4xl font-bold text-white font-serif-display mt-4">{currentRank.name}</h1>
        <p className="text-xl font-mono text-green-400 mt-2">{streak}</p>
        <p className="text-gray-400 mt-2 max-w-md">{currentRank.storyline}</p>
        
        <div className="flex space-x-4 mt-8">
          <button onClick={handleUrge} className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105">
            I Feel an Urge
          </button>
          <button onClick={handleRelapse} className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105">
            I Relapsed
          </button>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalContent.title}>
        <div dangerouslySetInnerHTML={{ __html: modalContent.body }} />
      </Modal>
    </>
  );
}

export default HomePage;

