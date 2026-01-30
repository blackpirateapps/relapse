import React, { useEffect, useRef } from 'react';

const FireBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let flames = [];
    let animationFrameId;
    let lastTime = 0;
    let viewport = { width: 0, height: 0, dpr: 1 };

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = navigator.connection?.saveData;
    const isSmallScreen = window.innerWidth < 640;
    const isLowPower = prefersReducedMotion || saveData;
    const targetFps = isLowPower ? 0 : (isSmallScreen ? 24 : 36);
    const flameCount = isLowPower ? (isSmallScreen ? 30 : 45) : (isSmallScreen ? 70 : 120);

    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, isLowPower ? 1 : 1.5);
      viewport = { width: window.innerWidth, height: window.innerHeight, dpr };
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const createFlame = () => ({
      x: Math.random() * viewport.width,
      y: viewport.height + Math.random() * viewport.height * 0.2,
      radius: 18 + Math.random() * 40,
      speed: 0.6 + Math.random() * 1.6,
      drift: (Math.random() - 0.5) * 0.6,
      life: 0,
      maxLife: 120 + Math.random() * 180,
      hue: 15 + Math.random() * 20
    });

    const seedFlames = () => {
      flames = [];
      for (let i = 0; i < flameCount; i++) {
        flames.push(createFlame());
      }
    };

    const drawFlame = (flame) => {
      const lifeRatio = 1 - flame.life / flame.maxLife;
      const radius = flame.radius * (0.6 + lifeRatio * 0.6);
      const gradient = ctx.createRadialGradient(flame.x, flame.y, 0, flame.x, flame.y, radius);
      gradient.addColorStop(0, `rgba(255, 235, 180, ${0.7 * lifeRatio})`);
      gradient.addColorStop(0.4, `rgba(255, 140, 40, ${0.55 * lifeRatio})`);
      gradient.addColorStop(1, `hsla(${flame.hue}, 100%, 35%, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(flame.x, flame.y, radius, 0, Math.PI * 2);
      ctx.fill();
    };

    const drawFrame = () => {
      ctx.fillStyle = 'rgba(8, 2, 2, 0.25)';
      ctx.fillRect(0, 0, viewport.width, viewport.height);

      flames.forEach((flame, i) => {
        drawFlame(flame);
        if (targetFps > 0) {
          flame.y -= flame.speed;
          flame.x += flame.drift;
          flame.life += 1;
          if (flame.life >= flame.maxLife || flame.y + flame.radius < 0) {
            flames[i] = createFlame();
          }
        }
      });
    };

    const animate = (time) => {
      if (targetFps === 0) return;
      if (!lastTime || time - lastTime >= 1000 / targetFps) {
        lastTime = time;
        drawFrame();
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    seedFlames();
    drawFrame();
    animationFrameId = requestAnimationFrame(animate);

    const handleResize = () => {
      resizeCanvas();
      seedFlames();
      drawFrame();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        background: 'radial-gradient(circle at top, rgba(60, 10, 0, 0.9), rgba(8, 2, 2, 1))'
      }}
    />
  );
};

export default FireBackground;
