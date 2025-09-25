import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '/src/App.jsx';
import { postRelapse } from '/src/api.js';
import Modal from '/src/components/Modal.jsx';
import PhoenixImage from '/src/components/PhoenixImage.jsx';

function HomePage() {
  const { state, setState, currentRank } = useContext(AppContext);
  const [isUrgeModalOpen, setIsUrgeModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false); // New state for confirmation
  const [streak, setStreak] = useState('0d 00h 00m 00s');

  useEffect(() => {
    if (!state || !state.lastRelapse) return;
    const timer = setInterval(() => {
      const ms = Date.now() - new Date(state.lastRelapse).getTime();
      const days = Math.floor(ms / (1000 * 60 * 60 * 24));
      const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((ms % (1000 * 60)) / 1000);
      setStreak(`${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, [state]);

  const handleUrge = () => {
    setIsUrgeModalOpen(true);
  };

  // This function now just opens the confirmation modal
  const handleRelapseClick = () => {
    setIsConfirmModalOpen(true);
  };

  // This function contains the actual relapse logic
  const confirmRelapse = async () => {
    setIsConfirmModalOpen(false); // Close the modal first
    try {
      const newState = await postRelapse();
      newState.upgrades = JSON.parse(newState.upgrades || '{}');
      newState.equipped_upgrades = JSON.parse(newState.equipped_upgrades || '{}');
      setState(newState);
      alert("Your streak has been reset, but a new journey begins now. Rise again.");
    } catch (error) {
      alert("Failed to process relapse. Please try again.");
    }
  };

  if (!currentRank) {
    return null; // Or a loading indicator
  }

  return (
    <>
      <div className="text-center flex flex-col items-center justify-center h-full -mt-16">
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
          <button onClick={handleRelapseClick} className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105">
            I Relapsed
          </button>
        </div>
      </div>

      {/* Modal for "I Feel an Urge" */}
      <Modal isOpen={isUrgeModalOpen} onClose={() => setIsUrgeModalOpen(false)} title="Hold Strong">
        <div className="text-center">
          <p className="mb-4">This feeling is temporary. Remember why you started this journey.</p>
          <p className="font-semibold">Your current streak is a testament to your strength. You've come so far. Don't let a fleeting moment undo your progress.</p>
          <p className="mt-4 text-sm text-gray-400">Close this, take a few deep breaths, and focus on the Celestial Phoenix you are becoming.</p>
        </div>
      </Modal>

      {/* New Modal for Relapse Confirmation */}
      <Modal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} title="Confirm Relapse">
        <div className="text-center">
          <p className="mb-6">Are you sure? This action cannot be undone and will reset your current progress.</p>
          <div className="flex justify-center space-x-4">
            <button onClick={() => setIsConfirmModalOpen(false)} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg">
              No, I'm Strong
            </button>
            <button onClick={confirmRelapse} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-lg">
              Yes, I Relapsed
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default HomePage;

