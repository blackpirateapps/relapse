import React, { useState, useContext, useEffect, useRef } from 'react';
import { AppContext } from '../App.jsx';
import { startGame, endGame } from '../api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import Modal from '../components/Modal.jsx';

function AsteroidShooterPage() {
  const { refetchData } = useContext(AppContext);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  // Game states: 'ready', 'playing', 'over'
  const [gameState, setGameState] = useState('ready');
  const [isLoading, setIsLoading] = useState(false);
  const [currentPlayId, setCurrentPlayId] = useState(null);
  const [score, setScore] = useState(0);
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

  // --- Game Logic ---
  const gameLoop = (timestamp) => {
    if (!isGameActive.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // FPS limiting for performance
    if (!lastFrameTime.current) lastFrameTime.current = timestamp;
    const deltaTime = timestamp - lastFrameTime.current;
    
    // Aim for 60 FPS (16.67ms per frame)
    if (deltaTime < 16) {
      gameLoopId.current = requestAnimationFrame(gameLoop);
      return;
    }
    
    lastFrameTime.current = timestamp;
    frameCount.current++;

    // Clear canvas with space background
    ctx.fillStyle = '#000510';
    ctx.fillRect(0, 0, width, height);

    // Draw stars
    drawStars(ctx, width, height);

    // Increase difficulty over time
    baseSpeed.current += SPEED_INCREASE_RATE;

    // Auto shoot bullets
    const now = Date.now();
    if (now - lastShootTime.current > SHOOT_INTERVAL) {
      bullets.current.push({
        x: shipX.current + SHIP_WIDTH / 2 - BULLET_WIDTH / 2,
        y: height - SHIP_HEIGHT - 20,
        width: BULLET_WIDTH,
        height: BULLET_HEIGHT
      });
      lastShootTime.current = now;
    }

    // Update and draw bullets
    bullets.current = bullets.current.filter(bullet => {
      bullet.y -= BULLET_SPEED;
      
      // Draw bullet
      ctx.fillStyle = '#00ff00';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00ff00';
      ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
      ctx.shadowBlur = 0;
      
      return bullet.y > -bullet.height;
    });

    // Spawn asteroids
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

    // Update and draw asteroids
    let gameOver = false;
    asteroids.current = asteroids.current.filter(asteroid => {
      asteroid.y += asteroid.speed;
      asteroid.rotation += asteroid.rotationSpeed;

      // Check collision with bullets
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

      // Check if asteroid hit the bottom (game over)
      if (asteroid.y + asteroid.size > height - SHIP_HEIGHT - 10) {
        gameOver = true;
        return false;
      }

      // Draw asteroid
      drawAsteroid(ctx, asteroid);

      return asteroid.y < height;
    });

    // Update and draw particles
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

    // Draw spaceship
    drawSpaceship(ctx, shipX.current, height - SHIP_HEIGHT - 10, SHIP_WIDTH, SHIP_HEIGHT);

    // Draw score
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

  const drawStars = (ctx, width, height) => {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 100; i++) {
      const x = (i * 137.5) % width;
      const y = (i * 197.3) % height;
      const size = Math.random() * 2;
      ctx.fillRect(x, y, size, size);
    }
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
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
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
    
    shipX.current = Math.max(0, Math.min(clientX - rect.left - SHIP_WIDTH / 2, canvas.width - SHIP_WIDTH));
  };

  // Fullscreen handling
  const enterFullscreen = async () => {
    const elem = containerRef.current;
    try {
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (err) {
      console.error('Error entering fullscreen:', err);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
      setIsFullscreen(false);
    } catch (err) {
      console.error('Error exiting fullscreen:', err);
    }
  };

  const handleStartClick = async () => {
    setIsLoading(true);
    try {
      const result = await startGame('asteroid_shooter');
      if (result.success) {
        setCurrentPlayId(result.playId);
        await refetchData();
        await enterFullscreen();
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
    const canvas = canvasRef.current;
    shipX.current = canvas.width / 2 - SHIP_WIDTH / 2;
    bullets.current = [];
    asteroids.current = [];
    particles.current = [];
    frameCount.current = 0;
    lastShootTime.current = Date.now();
    lastFrameTime.current = 0;
    baseSpeed.current = 2;
    currentScore.current = 0;
    isGameActive.current = true;
    setScore(0);
    setGameState('playing');
    gameLoopId.current = requestAnimationFrame(gameLoop);
  };

  const handleGameOver = async () => {
    isGameActive.current = false;
    if (gameLoopId.current) {
      cancelAnimationFrame(gameLoopId.current);
    }
    setGameState('over');

    if (!currentPlayId) return;

    setIsLoading(true);
    try {
      const result = await endGame(currentPlayId, currentScore.current);
      await refetchData();
      await exitFullscreen();
      setModal({
        isOpen: true,
        title: 'Game Over!',
        message: `Final Score: ${currentScore.current}
Coins Earned: ${result.coinsWon || 0}`
      });
    } catch (error) {
      setModal({ isOpen: true, title: 'Error', message: error.message || 'Failed to save score' });
    } finally {
      setIsLoading(false);
      setCurrentPlayId(null);
    }
  };

  const handlePlayAgain = () => {
    setModal({ isOpen: false, title: '', message: '' });
    setGameState('ready');
    setScore(0);
    currentScore.current = 0;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Prevent touch scrolling on canvas
    const preventTouch = (e) => {
      if (e.target === canvas) {
        e.preventDefault();
      }
    };

    canvas.addEventListener('touchstart', preventTouch, { passive: false });
    canvas.addEventListener('touchmove', preventTouch, { passive: false });
    canvas.addEventListener('touchend', preventTouch, { passive: false });

    // Handle fullscreen changes
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
      
      if (!isCurrentlyFullscreen && gameState === 'playing') {
        // User exited fullscreen during game
        handleGameOver();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('touchstart', preventTouch);
      canvas.removeEventListener('touchmove', preventTouch);
      canvas.removeEventListener('touchend', preventTouch);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      
      isGameActive.current = false;
      if (gameLoopId.current) {
        cancelAnimationFrame(gameLoopId.current);
      }
    };
  }, [gameState]);

  return (
    <div 
      ref={containerRef}
      style={{ 
        width: '100vw', 
        height: '100vh', 
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
          cursor: gameState === 'playing' ? 'none' : 'default',
          touchAction: 'none'
        }}
      />

      {gameState === 'ready' && (
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
            Move your spaceship to destroy falling asteroids!<br/>
            Don't let them reach the bottom!
          </p>
          <button
            onClick={handleStartClick}
            disabled={isLoading}
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
            {isLoading ? 'Starting...' : 'Play (20 Coins)'}
          </button>
        </div>
      )}

      {isLoading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}>
          <LoadingSpinner />
        </div>
      )}

      {modal.isOpen && (
        <Modal
          title={modal.title}
          message={modal.message}
          onClose={handlePlayAgain}
        />
      )}
    </div>
  );
}

export default AsteroidShooterPage;