import React, { useState, useContext, useEffect, useRef } from 'react';
import { AppContext } from '../App.jsx';
import { startGame, endGame } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import Modal from '../components/Modal.jsx';

function PhoenixFlightPage() {
    const { refetchData } = useContext(AppContext);
    const canvasRef = useRef(null);

    // Game states: 'ready', 'playing', 'over'
    const [gameState, setGameState] = useState('ready');
    const [isLoading, setIsLoading] = useState(false);
    const [currentPlayId, setCurrentPlayId] = useState(null);
    const [score, setScore] = useState(0);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });

    // Refs for game variables to be used inside the animation loop
    const gameLoopId = useRef();
    const phoenixY = useRef(300); // Initial Y position
    const velocity = useRef(0);
    const obstacles = useRef([]);
    const frameCount = useRef(0);

    // --- Game Logic ---
    const gameLoop = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        // Constants
        const PHOENIX_X = canvas.width / 4;
        const PHOENIX_SIZE = 30;
        const GRAVITY = 0.5;
        const LIFT = -9;
        const OBSTACLE_WIDTH = 70;
        const OBSTACLE_GAP = 200;
        const OBSTACLE_SPEED = 4;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        frameCount.current++;

        // --- Handle Obstacles ---
        if (frameCount.current % 90 === 0) { // Add new obstacle every 1.5 seconds (90 frames)
            const gapY = Math.random() * (canvas.height - OBSTACLE_GAP - 120) + 60;
            obstacles.current.push({ x: canvas.width, y: gapY });
        }

        obstacles.current.forEach(obs => {
            obs.x -= OBSTACLE_SPEED;
            ctx.fillStyle = '#60a5fa'; // Blueish obstacles
            ctx.fillRect(obs.x, 0, OBSTACLE_WIDTH, obs.y); // Top part
            ctx.fillRect(obs.x, obs.y + OBSTACLE_GAP, OBSTACLE_WIDTH, canvas.height); // Bottom part
        });

        // Update score and remove off-screen obstacles
        if (obstacles.current.length > 0 && obstacles.current[0].x < PHOENIX_X - OBSTACLE_WIDTH) {
            obstacles.current.shift();
            setScore(s => s + 10);
        }

        // --- Handle Phoenix ---
        velocity.current += GRAVITY;
        phoenixY.current += velocity.current;
        
        // Draw Phoenix
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(PHOENIX_X, phoenixY.current, PHOENIX_SIZE / 2, 0, Math.PI * 2);
        ctx.fill();

        // --- Handle Collision ---
        const phoenixTop = phoenixY.current - PHOENIX_SIZE / 2;
        const phoenixBottom = phoenixY.current + PHOENIX_SIZE / 2;

        let isGameOver = false;
        // Ground/ceiling collision
        if (phoenixBottom > canvas.height || phoenixTop < 0) {
            isGameOver = true;
        }
        // Obstacle collision
        for (const obs of obstacles.current) {
            if (PHOENIX_X + PHOENIX_SIZE / 2 > obs.x && PHOENIX_X - PHOENIX_SIZE / 2 < obs.x + OBSTACLE_WIDTH) {
                if (phoenixTop < obs.y || phoenixBottom > obs.y + OBSTACLE_GAP) {
                    isGameOver = true;
                    break;
                }
            }
        }
        
        if (isGameOver) {
            handleGameEnd(score); // Call the async function to end the game
        } else {
            gameLoopId.current = requestAnimationFrame(gameLoop);
        }
    };
    
    // --- API & State Handlers ---

    // Starts the game
    const handlePlayClick = async () => {
        setIsLoading(true);
        setModal({ isOpen: false, title: '', message: '' });
        try {
            const result = await startGame('phoenix_flight');
            if (result.success) {
                await refetchData(); // Update coin count from context
                setCurrentPlayId(result.playId);
                // Reset game state for a new round
                setScore(0);
                phoenixY.current = canvasRef.current ? canvasRef.current.height / 2 : 300;
                velocity.current = 0;
                obstacles.current = [];
                frameCount.current = 0;
                setGameState('playing'); // This will trigger the useEffect to start the loop
            } else {
                setModal({ isOpen: true, title: 'Could Not Start', message: result.message });
            }
        } catch (error) {
            setModal({ isOpen: true, title: 'Error Starting Game', message: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    // Ends the game and submits score
    const handleGameEnd = async (finalScore) => {
        if (gameState !== 'playing') return; // Prevent multiple end-game calls

        setGameState('over');
        cancelAnimationFrame(gameLoopId.current);
        
        if (!currentPlayId) return;

        try {
            // Send score to backend
            const result = await endGame(currentPlayId, finalScore);
            if (result.success) {
                setModal({ isOpen: true, title: 'Game Over!', message: `Your final score was ${finalScore}. You won ${result.coinsWon} coins!` });
                await refetchData(); // Update coin count with winnings
            } else {
                 setModal({ isOpen: true, title: 'Error', message: result.message });
            }
        } catch (error) {
             setModal({ isOpen: true, title: 'Submission Error', message: error.message });
        } finally {
            setCurrentPlayId(null);
        }
    };

    // Makes the phoenix jump
    const jump = () => {
        if (gameState === 'playing') {
            velocity.current = LIFT;
        }
    };
    
    // --- UseEffects ---

    // Effect to start/stop game loop based on gameState
    useEffect(() => {
        if (gameState === 'playing') {
            gameLoopId.current = requestAnimationFrame(gameLoop);
        }
        // Cleanup function to stop the loop if component unmounts
        return () => cancelAnimationFrame(gameLoopId.current);
    }, [gameState]); // Reruns when gameState changes

    // Effect to set canvas dimensions on mount and resize
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        window.addEventListener('resize', resize);
        resize(); // Set initial size
        return () => window.removeEventListener('resize', resize);
    }, []);

    return (
        <div className="text-center">
            {isLoading && <LoadingSpinner />}
            <h2 className="text-3xl font-bold font-serif-display mb-2">Phoenix Flight</h2>
            <p className="text-4xl font-mono text-yellow-400 mb-4">{score}</p>

            <div className="relative">
                {/* The Canvas element where the game is rendered */}
                <canvas 
                    ref={canvasRef} 
                    onMouseDown={jump} 
                    onTouchStart={(e) => { e.preventDefault(); jump(); }} // Prevent default touch behavior
                    className="w-full h-96 bg-gray-800/50 border-2 border-gray-600 rounded-lg cursor-pointer"
                ></canvas>
                
                {/* UI Overlay: Ready State */}
                {gameState === 'ready' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                        <p className="mb-4 text-lg">Tap to fly the phoenix and avoid the pillars!</p>
                        <p className="mb-6 text-yellow-400">Cost: 20 Coins to Play</p>
                        <button 
                            onClick={handlePlayClick} 
                            disabled={isLoading} 
                            className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg text-xl disabled:bg-gray-500"
                        >
                            Play
                        </button>
                    </div>
                )}

                {/* UI Overlay: Game Over State */}
                {gameState === 'over' && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg">
                        <h3 className="text-4xl font-bold text-white font-serif-display">Game Over</h3>
                        <p className="text-2xl text-yellow-300 mt-2">Final Score: {score}</p>
                        <button 
                            onClick={handlePlayClick} 
                            disabled={isLoading} 
                            className="mt-6 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-6 rounded-lg"
                        >
                            Play Again (20 Coins)
                        </button>
                     </div>
                )}
            </div>

            {/* Modal for API responses */}
            <Modal isOpen={modal.isOpen} onClose={() => setModal({ isOpen: false, title: '', message: '' })} title={modal.title}>
                <p>{modal.message}</p>
                 <button 
                    onClick={() => setModal({ isOpen: false, title: '', message: '' })} 
                    className="mt-6 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-lg"
                 >
                   Close
                 </button>
            </Modal>
        </div>
    );
}

export default PhoenixFlightPage;