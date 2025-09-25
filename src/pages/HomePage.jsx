import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from './App.jsx';
import { postRelapse } from './api.js';
import Modal from './components/Modal.jsx';
import PhoenixImage from './components/PhoenixImage.jsx';

function HomePage() {
  const { state, setState, currentRank, refetchData } = useContext(AppContext);

  // State is now managed by a single object for clarity
  const [modalState, setModalState] = useState({
    urge: false,
    confirm: false,
    notification: null, // Will hold { title, message }
  });

  const [streak, setStreak] = useState('0d 00h 00m 00s');

  useEffect(() => {
    if (!state || !state.lastRelapse) return;
    const timer = setInterval(() => {
      const ms = Date.now() - new Date(state.lastRelapse).getTime();
      if (ms < 0) return;
      const days = Math.floor(ms / (1000 * 60 * 60 * 24));
      const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((ms % (1000 * 60)) / 1000);
      setStreak(`${days}d ${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, [state]);

  const openModal = (modalName) => {
    setModalState(prevState => ({ ...prevState, [modalName]: true }));
  };

  const closeModal = (modalName) => {
    setModalState(prevState => ({ ...prevState, [modalName]: false }));
  };

  const confirmRelapse = async () => {
    try {
      await postRelapse();
      await refetchData(); // Refetch all state from the server
      setModalState({ urge: false, confirm: false, notification: { title: "A New Journey Begins", message: "Your streak has been reset. Rise from the ashes and begin again." } });
    } catch (error) {
      console.error("Relapse API error:", error);
      setModalState({ urge: false, confirm: false, notification: { title: "Error", message: "Failed to process relapse. Please check your connection and try again." } });
    }
  };

  if (!currentRank || !state) {
    return null; // Or a loading component
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
          <button onClick={() => openModal('urge')} className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105">
            I Feel an Urge
          </button>
          <button onClick={() => openModal('confirm')} className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105">
            I Relapsed
          </button>
        </div>
      </div>

      {/* Urge Modal */}
      <Modal isOpen={modalState.urge} onClose={() => closeModal('urge')} title="Hold Strong">
        <div className="text-center">
          <p className="mb-4">This feeling is temporary. Your strength is permanent.</p>
          <p className="font-semibold">Remember the Celestial Phoenix you are becoming.</p>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal isOpen={modalState.confirm} onClose={() => closeModal('confirm')} title="Confirm Relapse">
        <div className="text-center">
          <p className="mb-6">Are you sure? This will reset your current progress.</p>
          <div className="flex justify-center space-x-4">
            <button onClick={() => closeModal('confirm')} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg">
              No, I'm Strong
            </button>
            <button onClick={confirmRelapse} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-lg">
              Yes, I Relapsed
            </button>
          </div>
        </div>
      </Modal>

      {/* Notification Modal */}
      <Modal 
        isOpen={!!modalState.notification} 
        onClose={() => setModalState(prev => ({ ...prev, notification: null }))}
        title={modalState.notification?.title || ''}
      >
        <div className="text-center">
          <p>{modalState.notification?.message || ''}</p>
          <button onClick={() => setModalState(prev => ({ ...prev, notification: null }))} className="mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg">
            Close
          </button>
        </div>
      </Modal>
    </>
  );
}

export default HomePage;