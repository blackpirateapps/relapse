import React, { useState, useContext, useEffect } from 'react';
import { AppContext } from '../App.jsx';
import { startGame, endGame } from '../api.js'; // Import API functions
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import Modal from '../components/Modal.jsx';

function PhoenixFlightPage() {
    const { refetchData } = useContext(AppContext);
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPlayId, setCurrentPlayId] = useState(null);
    const [score, setScore] = useState(0);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });

    // --- Game Logic Placeholder ---
    // Replace this with your actual game implementation (e.g., using Canvas)
    useEffect(() => {
        let gameInterval;
        if (isPlaying) {
            console.log("Game Started! Play ID:", currentPlayId);
            setScore(0); // Reset score
            // Simulate game playing and increasing score
            gameInterval = setInterval(() => {
                setScore(prevScore => prevScore + Math.floor(Math.random() * 5 + 1));
            }, 500);

            // Simulate game ending after 10 seconds
            const gameTimeout = setTimeout(() => {
                clearInterval(gameInterval); // Stop score increase
                handleGameEnd(score + Math.floor(Math.random() * 20)); // Pass final score
            }, 10000); // End game after 10s

            return () => {
                clearInterval(gameInterval);
                clearTimeout(gameTimeout);
            };
        }
    }, [isPlaying, currentPlayId]);
    // --- End Placeholder ---

    const handlePlayClick = async () => {
        setIsLoading(true);
        setModal({ isOpen: false, title: '', message: '' }); // Clear previous modal
        try {
            const result = await startGame('phoenix_flight'); // Use the game ID from db
            if (result.success) {
                setCurrentPlayId(result.playId);
                setIsPlaying(true);
                await refetchData(); // Update coin count immediately
            } else {
                setModal({ isOpen: true, title: 'Error', message: result.message });
            }
        } catch (error) {
            setModal({ isOpen: true, title: 'Error Starting Game', message: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGameEnd = async (finalScore) => {
        if (!currentPlayId) return;

        setIsPlaying(false);
        setIsLoading(true); // Show loading while submitting score
        console.log("Game Ended! Submitting Score:", finalScore, "Play ID:", currentPlayId);

        try {
            const result = await endGame(currentPlayId, finalScore);
            if (result.success) {
                setModal({
                    isOpen: true,
                    title: 'Game Over!',
                    message: `Your score: ${finalScore}. You won ${result.coinsWon} coins!`
                });
                await refetchData(); // Update coin count with winnings
            } else {
                 setModal({ isOpen: true, title: 'Error Submitting Score', message: result.message });
            }
        } catch (error) {
             setModal({ isOpen: true, title: 'Error Submitting Score', message: error.message });
        } finally {
            setCurrentPlayId(null);
            setIsLoading(false);
            setScore(0); // Reset score display
        }
    };

    return (
        <div className="text-center">
            {isLoading && <LoadingSpinner />}
            <h2 className="text-2xl font-bold mb-4">Phoenix Flight</h2>

            {isPlaying ? (
                <div>
                    <p className="text-xl mb-4">Flying! Current Score: {score}</p>
                    {/* Placeholder for Canvas or Game Area */}
                    <div className="w-full h-64 bg-gray-700 rounded mb-4 flex items-center justify-center">
                        <p>(Game Area)</p>
                    </div>
                     <button
                        onClick={() => handleGameEnd(score)} // Allow manual end for testing
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
                     >
                        End Game (Test)
                    </button>
                </div>
            ) : (
                <div>
                    <p className="mb-4">Fly your phoenix, avoid obstacles, and collect coins!</p>
                    <p className="mb-6 text-yellow-400">Cost: 20 Coins to Play</p>
                    <button
                        onClick={handlePlayClick}
                        disabled={isLoading}
                        className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded disabled:bg-gray-500"
                    >
                        Play Phoenix Flight
                    </button>
                </div>
            )}

            <Modal isOpen={modal.isOpen} onClose={() => setModal({ isOpen: false, title: '', message: '' })} title={modal.title}>
                <p>{modal.message}</p>
                 <button onClick={() => setModal({ isOpen: false, title: '', message: '' })} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                   Close
                 </button>
            </Modal>
        </div>
    );
}

export default PhoenixFlightPage;