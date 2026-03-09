import React, { useState, useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../App.jsx';
import { postRelapse } from '../api.js';
import Modal from '../components/Modal.jsx';
import PhoenixImage from '../components/PhoenixImage.jsx';
import { isAndroidApp } from '../platform/runtime.js';
import { formatElapsedStreak } from '../mobile/time.js';

function HomePage() {
  const { state, currentRank, refetchData } = useContext(AppContext);
  const [modalState, setModalState] = useState({
    confirm: false,
    notification: null
  });
  const [streak, setStreak] = useState('0d 00h 00m 00s');
  const androidMode = isAndroidApp();

  useEffect(() => {
    if (!state || !state.lastRelapse) return;
    const timer = setInterval(() => {
      const ms = Date.now() - new Date(state.lastRelapse).getTime();
      setStreak(formatElapsedStreak(ms));
    }, 1000);
    return () => clearInterval(timer);
  }, [state]);

  const closeModal = (modalName) => {
    setModalState((prevState) => ({ ...prevState, [modalName]: false }));
  };

  const confirmRelapse = async () => {
    try {
      await postRelapse();
      await refetchData();
      setModalState({ confirm: false, notification: { title: 'A New Journey Begins', message: 'Your streak has been reset. Rise from the ashes and begin again.' } });
    } catch (error) {
      console.error('Relapse API error:', error);
      setModalState({ confirm: false, notification: { title: 'Error', message: 'Failed to process relapse. Please check your connection and try again.' } });
    }
  };

  if (!currentRank || !state) {
    return null;
  }

  return (
    <>
      <div className="text-center flex flex-col items-center justify-center min-h-[60vh] sm:min-h-[70vh] -mt-4 sm:-mt-8 md:-mt-16">
        <PhoenixImage rankLevel={currentRank.level} equippedUpgrades={state.equipped_upgrades} />
        <h1 className="text-3xl sm:text-4xl font-bold text-white font-serif-display mt-4">{currentRank.name}</h1>
        <p className="text-xl font-mono text-green-400 mt-2">{streak}</p>
        <p className="text-gray-400 mt-2 max-w-md">{currentRank.storyline}</p>

        <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4 mt-8">
          {!androidMode && (
            <Link to="/journey/urge" className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105">
              I Feel an Urge
            </Link>
          )}
          <button onClick={() => setModalState((prev) => ({ ...prev, confirm: true }))} className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded-lg transition-transform transform hover:scale-105">
            I Relapsed
          </button>
        </div>
      </div>

      <Modal isOpen={modalState.confirm} onClose={() => closeModal('confirm')} title="Confirm Relapse">
        <div className="text-center">
          <p className="mb-6">Are you sure? This will reset your current progress.</p>
          <div className="flex justify-center space-x-4">
            <button onClick={() => closeModal('confirm')} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg">
              No, I&apos;m Strong
            </button>
            <button onClick={confirmRelapse} className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-lg">
              Yes, I Relapsed
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={!!modalState.notification}
        onClose={() => setModalState((prev) => ({ ...prev, notification: null }))}
        title={modalState.notification?.title || ''}
      >
        <div className="text-center">
          <p>{modalState.notification?.message || ''}</p>
          <button onClick={() => setModalState((prev) => ({ ...prev, notification: null }))} className="mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg">
            Close
          </button>
        </div>
      </Modal>
    </>
  );
}

export default HomePage;
