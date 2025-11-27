import React, { useState, useContext, useEffect, useRef } from 'react';
import { AppContext } from '../App.jsx';
import { startGame, endGame } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import Modal from '../components/Modal.jsx';

function AsteroidShooterPage() {
  const { refetchData } = useContext(AppContext);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Game states: 'initial', 'fullscreen-ready', 'playing', 'over'
  const [gameState, setGameState] = useState('initial');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlayId, setCurrentPlayId] = useState(null);
  const [score, setScore] = useState(0);
  const [lastGameResult, setLastGameResult] = useState(null); // Store results for end screen
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '' });

  // Refs for game variables
  const gameLoopId = useRef();
  const shipX = useRef(0);
  const bullets = useRef([]);
  const asteroids = useRef([]);
  const particles = useRef([]);
  const frameCount = useRef(0);
  const lastShootTime = useRef(0);
  const lastFrameTime = useRef(0);
  const baseSpeed = useRef(2);
  const currentScore = useRef(0);
  const isGameActive = useRef(false);
  const dprRef = useRef(1);

  // Game constants
  const SHIP_WIDTH = 50;
  const SHIP_HEIGHT = 60;
  const BULLET_SPEED = 8;
  const BULLET_WIDTH = 4;
  const BULLET_HEIGHT = 15;
  const SHOOT_INTERVAL = 200;
  const ASTEROID_MIN_SIZE = 30;
  const ASTEROID_MAX_SIZE = 70;
  const SPAWN_RATE = 60;
  const SPEED_INCREASE_RATE = 0.0005;

  // Helpers to draw static background
  const drawStars = (ctx, width, height) => {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
      const x = (i * 137.5) % width;
      const y = (i * 197.3) % height;
      const size = Math.random() * 2;
      ctx.fillRect(x, y, size, size);
    }
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    dprRef.current = dpr;

    const cssWidth = window.innerWidth;
    const cssHeight = window.innerHeight;

    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);

    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Draw background if game is not running
    if (!isGameActive.current) {
        ctx.fillStyle = '#000510';
        ctx.fillRect(0, 0, cssWidth, cssHeight);
        drawStars(ctx, cssWidth, cssHeight);
    }
  };

  const gameLoop = (timestamp) => {
    if (!isGameActive.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = dprRef.current || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    if (!lastFrameTime.current) lastFrameTime.current = timestamp;
    lastFrameTime.current = timestamp;
    frameCount.current++;

    // Clear and draw background
    ctx.fillStyle = '#000510';
    ctx.fillRect(0, 0, width, height);
    drawStars(ctx, width, height);

    baseSpeed.current += SPEED_INCREASE_RATE;

    // Auto shoot
    if (timestamp - lastShootTime.current > SHOOT_INTERVAL) {
      bullets.current.push({
        x: shipX.current + SHIP_WIDTH / 2 - BULLET_WIDTH / 2,
        y: height - SHIP_HEIGHT - 20,
        width: BULLET_WIDTH,
        height: BULLET_HEIGHT
      });
      lastShootTime.current = timestamp;
    }

    // Bullets
    bullets.current = bullets.current.filter(bullet => {
      bullet.y -= BULLET_SPEED;
      ctx.fillStyle = '#00ff00';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00ff00';
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      ctx.shadowBlur = 0;
      return bullet.y > -bullet.height;
    });

    // Asteroids
    if (frameCount.current % SPAWN_RATE === 0) {
      const size = Math.random() * (ASTEROID_MAX_SIZE - ASTEROID_MIN_SIZE) + ASTEROID_MIN_SIZE;
      asteroids.current.push({
        x: Math.random() * (width - size),
        y: -size,
        size: size,
        speed: baseSpeed.current + Math.random() * 2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1
      });
    }

    let gameOver = false;
    asteroids.current = asteroids.current.filter(asteroid => {
      asteroid.y += asteroid.speed;
      asteroid.rotation += asteroid.rotationSpeed;

      let hit = false;
      bullets.current = bullets.current.filter(bullet => {
        if (checkCollision(bullet, asteroid)) {
          hit = true;
          createExplosion(asteroid.x + asteroid.size / 2, asteroid.y + asteroid.size / 2);
          currentScore.current += 10;
          setScore(currentScore.current);
          return false;
        }
        return true;
      });

      if (hit) return false;

      if (asteroid.y + asteroid.size > height - SHIP_HEIGHT - 10) {
        gameOver = true;
        return false;
      }

      drawAsteroid(ctx, asteroid);
      return asteroid.y < height;
    });

    // Particles
    particles.current = particles.current.filter(particle => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life--;
      particle.alpha -= 0.02;
      if (particle.life > 0 && particle.alpha > 0) {
        ctx.fillStyle = `rgba(${particle.color}, ${particle.alpha})`;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        return true;
      }
      return false;
    });

    drawSpaceship(ctx, shipX.current, height - SHIP_HEIGHT - 10, SHIP_WIDTH, SHIP_HEIGHT);

    // HUD
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial';
    ctx.fillText(`Score: ${currentScore.current}`, 20, 40);
    ctx.fillText(`Speed: ${baseSpeed.current.toFixed(1)}x`, 20, 70);

    if (gameOver) {
      handleGameOver();
      return;
    }

    gameLoopId.current = requestAnimationFrame(gameLoop);
  };

  const drawSpaceship = (ctx, x, y, width, height) => {
    ctx.fillStyle = '#00aaff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#00aaff';
    ctx.beginPath();
    ctx.moveTo(x + width / 2, y);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height / 3, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#0088ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const flameHeight = 15;
    ctx.fillStyle = '#ff6600';
    ctx.beginPath();
    ctx.moveTo(x + width / 4, y + height);
    ctx.lineTo(x + width / 4 - 5, y + height + flameHeight);
    ctx.lineTo(x + width / 4 + 5, y + height);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(x + 3 * width / 4, y + height);
    ctx.lineTo(x + 3 * width / 4 - 5, y + height + flameHeight);
    ctx.lineTo(x + 3 * width / 4 + 5, y + height);
    ctx.fill();
  };

  const drawAsteroid = (ctx, asteroid) => {
    ctx.save();
    ctx.translate(asteroid.x + asteroid.size / 2, asteroid.y + asteroid.size / 2);
    ctx.rotate(asteroid.rotation);
    ctx.fillStyle = '#8b7355';
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.beginPath();
    const sides = 8;
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2;
      const radius = asteroid.size / 2 + (Math.sin(i) * 5);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#5a4a3a';
    ctx.beginPath();
    ctx.arc(-asteroid.size / 6, -asteroid.size / 6, asteroid.size / 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(asteroid.size / 5, asteroid.size / 8, asteroid.size / 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const createExplosion = (x, y) => {
    for (let i = 0; i < 20; i++) {
      particles.current.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: Math.random() * 4 + 2,
        life: 50,
        alpha: 1,
        color: `${Math.floor(Math.random() * 100) + 155}, ${Math.floor(Math.random() * 100) + 50}, 0`
      });
    }
  };

  const checkCollision = (bullet, asteroid) => {
    return (
      bullet.x < asteroid.x + asteroid.size &&
      bullet.x + bullet.width > asteroid.x &&
      bullet.y < asteroid.y + asteroid.size &&
      bullet.y + bullet.height > asteroid.y
    );
  };

  const handlePointerMove = (e) => {
    if (gameState !== 'playing') return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    let clientX;
    if (e.type.startsWith('touch')) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    shipX.current = Math.max(0, Math.min(clientX - rect.left - SHIP_WIDTH / 2, rect.width - SHIP_WIDTH));
  };

  const enterFullscreen = async () => {
    const elem = containerRef.current;
    try {
      if (elem.requestFullscreen) await elem.requestFullscreen();
      else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
      else if (elem.mozRequestFullScreen) await elem.mozRequestFullScreen();
      else if (elem.msRequestFullscreen) await elem.msRequestFullscreen();
      setIsFullscreen(true);
      setGameState('fullscreen-ready');
      setTimeout(resizeCanvas, 100);
    } catch (err) {
      console.error('Error entering fullscreen:', err);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
      else if (document.mozCancelFullScreen) await document.mozCancelFullScreen();
      else if (document.msExitFullscreen) await document.msExitFullscreen();
      setIsFullscreen(false);
    } catch (err) {
      console.error('Error exiting fullscreen:', err);
    }
  };

  const handleEnterFullscreen = async () => {
    await enterFullscreen();
  };

  const handleStartGame = async () => {
    setIsLoading(true);
    try {
      const result = await startGame('asteroid_shooter');
      if (result.success) {
        setCurrentPlayId(result.playId);
        await refetchData();
        startGameLoop();
      } else {
        setModal({ isOpen: true, title: 'Error', message: result.message || 'Failed to start game' });
      }
    } catch (error) {
      setModal({ isOpen: true, title: 'Error', message: error.message || 'Something went wrong' });
    } finally {
      setIsLoading(false);
    }
  };

  const startGameLoop = () => {
    resizeCanvas();
    const canvas = canvasRef.current;
    shipX.current = (canvas.width / (dprRef.current || 1)) / 2 - SHIP_WIDTH / 2;
    bullets.current = [];
    asteroids.current = [];
    particles.current = [];
    frameCount.current = 0;
    lastShootTime.current = 0;
    lastFrameTime.current = 0;
    baseSpeed.current = 2;
    currentScore.current = 0;
    isGameActive.current = true;
    setScore(0);
    setGameState('playing');
    if (gameLoopId.current) cancelAnimationFrame(gameLoopId.current);
    gameLoopId.current = requestAnimationFrame(gameLoop);
  };

  const handleGameOver = async () => {
    isGameActive.current = false;
    if (gameLoopId.current) {
      cancelAnimationFrame(gameLoopId.current);
    }

    if (!currentPlayId) {
       setGameState('over');
       return;
    }

    setIsLoading(true);
    try {
      const result = await endGame(currentPlayId, currentScore.current);
      await refetchData();
      await exitFullscreen();
      setLastGameResult({ score: currentScore.current, coins: result.coinsWon || 0 });
      setGameState('over');
    } catch (error) {
      setModal({ isOpen: true, title: 'Error', message: error.message || 'Failed to save score' });
      setGameState('over');
    } finally {
      setIsLoading(false);
      setCurrentPlayId(null);
    }
  };

  const handlePlayAgain = () => {
    setModal({ isOpen: false, title: '', message: '' });
    setLastGameResult(null);
    setGameState('initial');
    setScore(0);
    currentScore.current = 0;
    resizeCanvas();
  };

  // Event Listeners Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onResize = () => resizeCanvas();
    window.addEventListener('resize', onResize);

    const preventTouch = (e) => {
      if (e.target === canvas) e.preventDefault();
    };
    canvas.addEventListener('touchstart', preventTouch, { passive: false });
    canvas.addEventListener('touchmove', preventTouch, { passive: false });
    canvas.addEventListener('touchend', preventTouch, { passive: false });

    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
      resizeCanvas();

      if (!isCurrentlyFullscreen) {
        if (isGameActive.current) {
             handleGameOver();
        } else if (gameState === 'fullscreen-ready') {
             setGameState('initial');
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    resizeCanvas();

    return () => {
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('touchstart', preventTouch);
      canvas.removeEventListener('touchmove', preventTouch);
      canvas.removeEventListener('touchend', preventTouch);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, [gameState]);

  // Unmount Cleanup Effect
  useEffect(() => {
    return () => {
      isGameActive.current = false;
      if (gameLoopId.current) cancelAnimationFrame(gameLoopId.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: isFullscreen ? '100vw' : '100%',
        height: isFullscreen ? '100vh' : '80vh',
        overflow: 'hidden',
        position: 'relative',
        background: '#000',
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseMove={handlePointerMove}
        onTouchMove={handlePointerMove}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: gameState === 'playing' ? 'none' : 'default',
          touchAction: 'none'
        }}
      />

      {/* Initial state */}
      {gameState === 'initial' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: 'white',
          fontFamily: 'Arial, sans-serif',
          padding: '20px',
          maxWidth: '90%'
        }}>
          <h1 style={{
            fontSize: 'clamp(32px, 8vw, 48px)',
            marginBottom: '20px',
            textShadow: '0 0 20px #00aaff'
          }}>
            🚀 Asteroid Shooter
          </h1>
          <p style={{
            fontSize: 'clamp(14px, 4vw, 18px)',
            marginBottom: '30px',
            lineHeight: '1.6'
          }}>
            Move your spaceship to destroy falling asteroids!<br />
            Don't let them reach the bottom!
          </p>
          <button
            onClick={handleEnterFullscreen}
            style={{
              padding: '15px 40px',
              fontSize: 'clamp(18px, 5vw, 24px)',
              background: 'linear-gradient(45deg, #00aaff, #0088cc)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(0, 170, 255, 0.5)',
              transition: 'transform 0.2s',
              touchAction: 'manipulation'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            Play Game
          </button>
        </div>
      )}

      {/* Fullscreen ready state */}
      {gameState === 'fullscreen-ready' && !isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: 'white',
          fontFamily: 'Arial, sans-serif',
          padding: '40px',
          zIndex: 10
        }}>
          <h1 style={{
            fontSize: '64px',
            marginBottom: '40px',
            textShadow: '0 0 30px #00aaff',
            animation: 'pulse 2s infinite'
          }}>
            🚀 Ready to Play!
          </h1>
          <button
            onClick={handleStartGame}
            disabled={isLoading}
            style={{
              padding: '30px 80px',
              fontSize: '36px',
              background: 'linear-gradient(45deg, #00ff00, #00cc00)',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              boxShadow: '0 0 40px rgba(0, 255, 0, 0.6)',
              transition: 'transform 0.2s',
              touchAction: 'manipulation',
              fontWeight: 'bold'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            START GAME (100 Coins)
          </button>
          <p style={{ marginTop: '30px', fontSize: '18px', opacity: 0.7 }}>
            Press ESC to exit fullscreen
          </p>
        </div>
      )}

      {/* Game Over state */}
      {gameState === 'over' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          color: 'white',
          fontFamily: 'Arial, sans-serif',
          padding: '40px',
          background: 'rgba(0, 5, 16, 0.9)',
          borderRadius: '20px',
          border: '2px solid #00aaff',
          boxShadow: '0 0 50px rgba(0, 170, 255, 0.3)',
          zIndex: 15,
          minWidth: '300px'
        }}>
          <h1 style={{ fontSize: '48px', marginBottom: '20px', color: '#ff3333', textShadow: '0 0 20px rgba(255, 51, 51, 0.5)' }}>
            GAME OVER
          </h1>
          <div style={{ marginBottom: '30px' }}>
            <p style={{ fontSize: '24px', marginBottom: '10px' }}>
              Final Score: <span style={{ color: '#00aaff', fontWeight: 'bold' }}>{lastGameResult?.score || currentScore.current}</span>
            </p>
            {lastGameResult?.coins !== undefined && (
              <p style={{ fontSize: '20px', color: '#ffd700', textShadow: '0 0 10px rgba(255, 215, 0, 0.5)' }}>
                Coins Earned: +{lastGameResult.coins}
              </p>
            )}
          </div>
          <button
            onClick={handlePlayAgain}
            style={{
              padding: '15px 40px',
              fontSize: '24px',
              background: 'linear-gradient(45deg, #00aaff, #0088cc)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              boxShadow: '0 0 20px rgba(0, 170, 255, 0.5)',
              transition: 'transform 0.2s',
              fontWeight: 'bold'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >
            Play Again
          </button>
        </div>
      )}

      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 20
        }}>
          <LoadingSpinner />
        </div>
      )}

      {modal.isOpen && (
        <Modal
          title={modal.title}
          message={modal.message}
          onClose={() => setModal({ ...modal, isOpen: false })}
        />
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

export default AsteroidShooterPage;